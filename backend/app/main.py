from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database.config import get_db, engine, Base
from app.models import models
from app.services.inference_engine import InferenceEngine, WorkingMemory, Rule, AnswerType, RuleStatus
from app.services.visa_rules import VISA_RULES, VISA_GOALS
from app.routers import admin
from pydantic import BaseModel

# データベーステーブル作成
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Visa Expert System API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 管理用ルーター登録
app.include_router(admin.router)

# ===== Pydanticモデル =====
class ConsultationStartRequest(BaseModel):
    visa_types: Optional[List[str]] = ["E", "B", "L"]  # システムイメージ.txt 行21準拠

class ConsultationStartResponse(BaseModel):
    session_id: str
    next_question: Optional[str]
    message: str

class AnswerRequest(BaseModel):
    session_id: str
    fact: str
    answer: str  # "yes", "no", "unknown"

class AnswerResponse(BaseModel):
    session_id: str
    next_question: Optional[str]
    fired_rules: List[int]
    derived_facts: List[str]
    is_completed: bool
    result: Optional[dict]
    detail_questions_needed: bool = False
    detail_questions: List[str] = []

class UndoRequest(BaseModel):
    session_id: str

class UndoResponse(BaseModel):
    session_id: str
    next_question: Optional[str]
    message: str
    can_undo: bool

class RuleResponse(BaseModel):
    id: int
    name: str
    visa_type: str
    conditions: List[dict]
    actions: List[dict]
    status: str  # not_evaluated, evaluating, fired, failed, skipped

# ===== グローバル変数 =====
# セッションごとの推論エンジンとWorkingMemoryを保持
sessions = {}

# ルールを推論エンジン用のRuleオブジェクトに変換
inference_rules = [
    Rule(
        id=r["id"],
        name=r["name"],
        visa_type=r["visa_type"],
        rule_type=r["rule_type"],
        conditions=r["conditions"],
        actions=r["actions"],
        flag=r["flag"]
    )
    for r in VISA_RULES
]

# ===== APIエンドポイント =====
@app.get("/")
def read_root():
    return {"message": "Visa Expert System API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/consultation/start", response_model=ConsultationStartResponse)
def start_consultation(request: ConsultationStartRequest, db: Session = Depends(get_db)):
    """診断セッションを開始"""
    session_id = str(uuid.uuid4())

    # 推論エンジンとWorkingMemoryを初期化
    engine = InferenceEngine(inference_rules)
    wm = WorkingMemory()

    # セッション保存（システムイメージ.txt 行25-31: 回答履歴管理）
    sessions[session_id] = {
        "engine": engine,
        "wm": wm,
        "visa_types": request.visa_types,
        "goals": VISA_GOALS,
        "answer_history": []  # 回答履歴スタック（戻る機能用）
    }

    # データベースにセッション保存
    db_session = models.ConsultationSession(
        session_id=session_id,
        visa_types=request.visa_types,
        status="in_progress"
    )
    db.add(db_session)
    db.commit()

    # 最初の質問を取得
    next_question = engine.get_next_question(VISA_GOALS, wm)

    return ConsultationStartResponse(
        session_id=session_id,
        next_question=next_question,
        message="診断を開始しました"
    )

@app.post("/api/consultation/answer", response_model=AnswerResponse)
def answer_question(request: AnswerRequest, db: Session = Depends(get_db)):
    """質問に回答"""
    session_id = request.session_id

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    session = sessions[session_id]
    engine = session["engine"]
    wm = session["wm"]
    goals = session["goals"]
    answer_history = session["answer_history"]

    # 回答処理の前の状態をスナップショット（戻る機能用）
    wm_snapshot_before = {
        "findings": dict(wm.findings),
        "hypotheses": dict(wm.hypotheses),
        "conflict_set": set(wm.conflict_set),
        "evaluated_rules": dict(wm.evaluated_rules),
        "skipped_facts": set(wm.skipped_facts),
        "asked_derivable_facts": set(wm.asked_derivable_facts)
    }

    # 回答を処理
    answer_type = AnswerType(request.answer.lower())
    result = engine.process_answer(request.fact, answer_type, wm)

    # 回答履歴に追加（処理前の状態を保存）
    answer_history.append({
        "fact": request.fact,
        "answer": request.answer,
        "wm_snapshot_before": wm_snapshot_before
    })

    # 「わからない」回答で詳細質問が必要な場合
    if result.get("detail_questions_needed", False):
        # 詳細質問を返す（診断は継続）
        return AnswerResponse(
            session_id=session_id,
            next_question=result["detail_questions"][0] if result["detail_questions"] else None,
            fired_rules=[],
            derived_facts=[],
            is_completed=False,
            result=None,
            detail_questions_needed=True,
            detail_questions=result["detail_questions"]
        )

    # データベースに回答を保存
    db_session = db.query(models.ConsultationSession).filter(
        models.ConsultationSession.session_id == session_id
    ).first()

    if db_session:
        # 回答履歴を追加
        answer_record = models.ConsultationAnswer(
            session_id=db_session.id,
            fact_name=request.fact,
            answer=request.answer,
            question_order=len(db_session.answers) + 1
        )
        db.add(answer_record)

        # セッション情報を更新
        db_session.findings = wm.findings
        db_session.hypotheses = wm.hypotheses
        db_session.evaluated_rules = [rule_id for rule_id, status in wm.evaluated_rules.items()]
        db_session.fired_rules = list(wm.conflict_set)

        db.commit()

    # 次の質問を取得
    next_question = engine.get_next_question(goals, wm)

    # 診断完了かチェック
    is_completed = next_question is None
    diagnosis_result = None

    if is_completed:
        # ゴール達成状況をチェック
        goal_results = engine.check_goals(goals, wm)
        achieved_goals = [goal for goal, achieved in goal_results.items() if achieved]

        diagnosis_result = {
            "applicable_visas": achieved_goals,
            "all_goals": goal_results,
            "findings": wm.findings,
            "hypotheses": wm.hypotheses
        }

        # データベース更新
        if db_session:
            db_session.status = "completed"
            db_session.result = diagnosis_result
            from datetime import datetime
            db_session.completed_at = datetime.utcnow()
            db.commit()

    return AnswerResponse(
        session_id=session_id,
        next_question=next_question,
        fired_rules=result["fired_rules"],
        derived_facts=result["derived_facts"],
        is_completed=is_completed,
        result=diagnosis_result,
        detail_questions_needed=False,
        detail_questions=[]
    )

@app.post("/api/consultation/undo", response_model=UndoResponse)
def undo_answer(request: UndoRequest, db: Session = Depends(get_db)):
    """
    前の質問に戻る（システムイメージ.txt 行25-31準拠）
    - 直前の質問に戻り、回答を変更可能
    - 該当する回答をクリア
    - その回答に依存する導出事実も自動的にクリア
    - 推論過程の表示もリセット
    """
    session_id = request.session_id

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    session = sessions[session_id]
    answer_history = session["answer_history"]
    engine = session["engine"]
    wm = session["wm"]
    goals = session["goals"]

    # 回答履歴が空の場合
    if not answer_history:
        return UndoResponse(
            session_id=session_id,
            next_question=engine.get_next_question(goals, wm),
            message="戻る履歴がありません",
            can_undo=False
        )

    # 最後の回答を取り出す
    last_answer = answer_history.pop()

    # 作業記憶を前の状態に復元
    wm_snapshot = last_answer["wm_snapshot_before"]
    wm.findings = dict(wm_snapshot["findings"])
    wm.hypotheses = dict(wm_snapshot["hypotheses"])
    wm.conflict_set = set(wm_snapshot["conflict_set"])
    wm.evaluated_rules = dict(wm_snapshot["evaluated_rules"])
    wm.skipped_facts = set(wm_snapshot["skipped_facts"])
    wm.asked_derivable_facts = set(wm_snapshot["asked_derivable_facts"])

    # 次の質問を再計算
    next_question = engine.get_next_question(goals, wm)

    # データベースから最後の回答を削除
    db_session = db.query(models.ConsultationSession).filter(
        models.ConsultationSession.session_id == session_id
    ).first()

    if db_session and db_session.answers:
        # 最後の回答を削除
        last_db_answer = db_session.answers[-1]
        db.delete(last_db_answer)

        # セッション情報を更新
        db_session.findings = wm.findings
        db_session.hypotheses = wm.hypotheses
        db_session.evaluated_rules = [rule_id for rule_id, status in wm.evaluated_rules.items()]
        db_session.fired_rules = list(wm.conflict_set)
        db_session.status = "in_progress"  # 完了状態から戻る場合もあるので

        db.commit()

    return UndoResponse(
        session_id=session_id,
        next_question=next_question,
        message="前の質問に戻りました",
        can_undo=len(answer_history) > 0
    )

@app.get("/api/consultation/{session_id}/rules", response_model=List[RuleResponse])
def get_session_rules(session_id: str):
    """セッションのルール状態を取得（推論過程の可視化用）"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    session = sessions[session_id]
    wm = session["wm"]

    rules_status = []
    for rule in inference_rules:
        status = wm.evaluated_rules.get(rule.id, RuleStatus.NOT_EVALUATED)
        rules_status.append(
            RuleResponse(
                id=rule.id,
                name=rule.name,
                visa_type=rule.visa_type,
                conditions=rule.conditions,
                actions=rule.actions,
                status=status.value
            )
        )

    return rules_status

@app.get("/api/rules")
def get_all_rules():
    """全ルールを取得"""
    return VISA_RULES

@app.get("/api/rules/{rule_id}")
def get_rule(rule_id: int):
    """特定のルールを取得"""
    rule = next((r for r in VISA_RULES if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")
    return rule

@app.put("/api/rules/{rule_id}")
def update_rule(rule_id: int, updated_rule: dict, db: Session = Depends(get_db)):
    """ルールを更新（管理機能）"""
    # 実装簡略化のため、ここでは基本実装のみ
    rule = next((r for r in VISA_RULES if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")

    # ルールを更新
    rule.update(updated_rule)

    # 監査ログに記録
    audit_log = models.AuditLog(
        action="update",
        table_name="rules",
        record_id=rule_id,
        old_value=rule,
        new_value=updated_rule
    )
    db.add(audit_log)
    db.commit()

    return {"message": "ルールを更新しました", "rule": rule}

@app.get("/api/consultation/{session_id}/working-memory")
def get_working_memory(session_id: str):
    """作業記憶の状態を取得（デバッグ・可視化用）"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    session = sessions[session_id]
    wm = session["wm"]

    return {
        "findings": wm.findings,
        "hypotheses": wm.hypotheses,
        "conflict_set": list(wm.conflict_set),
        "evaluated_rules": {rule_id: status.value for rule_id, status in wm.evaluated_rules.items()}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
