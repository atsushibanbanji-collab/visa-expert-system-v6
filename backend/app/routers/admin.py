"""
管理用APIエンドポイント
システムイメージ.txt 行108-143準拠
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Optional
from pydantic import BaseModel
import json
from datetime import datetime

from app.database.config import get_db
from app.models import models
from app.services.visa_rules import VISA_RULES, VISA_GOALS
from app.services.inference_engine import Rule
from app.services.rule_validator import RuleValidator

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ===== Pydanticモデル =====
class RuleCreateRequest(BaseModel):
    name: str
    visa_type: str
    rule_type: str
    conditions: List[Dict]
    actions: List[Dict]
    flag: bool = True
    priority: int = 1  # システムイメージ.txt 行116: 質問の優先順位

class RuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    visa_type: Optional[str] = None
    rule_type: Optional[str] = None
    conditions: Optional[List[Dict]] = None
    actions: Optional[List[Dict]] = None
    flag: Optional[bool] = None
    version: Optional[int] = None  # システムイメージ.txt 行143: 楽観的ロック用
    priority: Optional[int] = None  # システムイメージ.txt 行116: 質問の優先順位

class SQLQueryRequest(BaseModel):
    query: str
    read_only: bool = True

class ExportFormat(BaseModel):
    format: str = "json"  # json, csv
    tables: Optional[List[str]] = None

# ===== ルール管理エンドポイント =====

@router.get("/rules")
def get_all_rules_admin():
    """全ルールを取得（管理用）"""
    return {
        "rules": VISA_RULES,
        "count": len(VISA_RULES)
    }

@router.get("/rules/{rule_id}")
def get_rule_admin(rule_id: int):
    """特定のルールを取得"""
    rule = next((r for r in VISA_RULES if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")
    return rule

@router.post("/rules")
def create_rule(request: RuleCreateRequest, db: Session = Depends(get_db)):
    """新しいルールを作成"""
    # 新しいIDを生成
    max_id = max(r["id"] for r in VISA_RULES) if VISA_RULES else 0
    new_id = max_id + 1

    new_rule = {
        "id": new_id,
        "name": request.name,
        "visa_type": request.visa_type,
        "rule_type": request.rule_type,
        "conditions": request.conditions,
        "actions": request.actions,
        "flag": request.flag,
        "version": 1,  # システムイメージ.txt 行143: 楽観的ロック用の初期バージョン
        "priority": request.priority  # システムイメージ.txt 行116: 質問の優先順位
    }

    # 整合性チェック
    test_rules = VISA_RULES + [new_rule]
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
        for r in test_rules
    ]

    validator = RuleValidator(inference_rules)
    validation_result = validator.validate_all()

    # 監査ログに記録
    audit_log = models.AuditLog(
        action="create",
        table_name="rules",
        record_id=new_id,
        old_value=None,
        new_value=new_rule
    )
    db.add(audit_log)
    db.commit()

    # 実際にはVISA_RULESに追加（本番環境ではDBから読み込む想定）
    VISA_RULES.append(new_rule)

    return {
        "message": "ルールを作成しました",
        "rule": new_rule,
        "validation": validation_result
    }

@router.put("/rules/{rule_id}")
def update_rule_admin(rule_id: int, request: RuleUpdateRequest, db: Session = Depends(get_db)):
    """ルールを更新（システムイメージ.txt 行143: 楽観的ロックサポート）"""
    rule_index = next((i for i, r in enumerate(VISA_RULES) if r["id"] == rule_id), None)
    if rule_index is None:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")

    old_rule = VISA_RULES[rule_index].copy()

    # 楽観的ロックチェック（システムイメージ.txt 行143準拠）
    current_version = old_rule.get("version", 1)
    if request.version is not None and request.version != current_version:
        raise HTTPException(
            status_code=409,
            detail=f"編集競合が発生しました。他のユーザーがこのルールを更新しています。現在のバージョン: {current_version}"
        )

    updated_rule = old_rule.copy()

    # 更新内容を適用
    if request.name is not None:
        updated_rule["name"] = request.name
    if request.visa_type is not None:
        updated_rule["visa_type"] = request.visa_type
    if request.rule_type is not None:
        updated_rule["rule_type"] = request.rule_type
    if request.conditions is not None:
        updated_rule["conditions"] = request.conditions
    if request.actions is not None:
        updated_rule["actions"] = request.actions
    if request.flag is not None:
        updated_rule["flag"] = request.flag
    if request.priority is not None:
        updated_rule["priority"] = request.priority

    # バージョンを1増やす（システムイメージ.txt 行143準拠）
    updated_rule["version"] = current_version + 1

    # 整合性チェック
    test_rules = [updated_rule if r["id"] == rule_id else r for r in VISA_RULES]
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
        for r in test_rules
    ]

    validator = RuleValidator(inference_rules)
    validation_result = validator.validate_all()

    # 監査ログに記録
    audit_log = models.AuditLog(
        action="update",
        table_name="rules",
        record_id=rule_id,
        old_value=old_rule,
        new_value=updated_rule
    )
    db.add(audit_log)
    db.commit()

    # 更新を適用
    VISA_RULES[rule_index] = updated_rule

    return {
        "message": "ルールを更新しました",
        "rule": updated_rule,
        "validation": validation_result
    }

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    """ルールを削除"""
    rule_index = next((i for i, r in enumerate(VISA_RULES) if r["id"] == rule_id), None)
    if rule_index is None:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")

    deleted_rule = VISA_RULES[rule_index]

    # 監査ログに記録
    audit_log = models.AuditLog(
        action="delete",
        table_name="rules",
        record_id=rule_id,
        old_value=deleted_rule,
        new_value=None
    )
    db.add(audit_log)
    db.commit()

    # 削除
    VISA_RULES.pop(rule_index)

    return {
        "message": "ルールを削除しました",
        "deleted_rule": deleted_rule
    }

# ===== 整合性チェックエンドポイント =====

@router.get("/rules/validation/check")
def validate_rules():
    """全ルールの整合性をチェック（システムイメージ.txt 行117-120）"""
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

    validator = RuleValidator(inference_rules)
    validation_results = validator.validate_all()

    # 問題の総数をカウント
    total_issues = sum(len(issues) for issues in validation_results.values())

    return {
        "is_valid": total_issues == 0,
        "total_issues": total_issues,
        "results": validation_results
    }

@router.post("/rules/{rule_id}/test")
def test_rule_modification(rule_id: int, request: RuleUpdateRequest):
    """ルール変更をテスト実行（本番反映前の検証）"""
    rule = next((r for r in VISA_RULES if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="ルールが見つかりません")

    # テスト用のルールを作成
    test_rule_dict = rule.copy()
    if request.name is not None:
        test_rule_dict["name"] = request.name
    if request.conditions is not None:
        test_rule_dict["conditions"] = request.conditions
    if request.actions is not None:
        test_rule_dict["actions"] = request.actions
    if request.flag is not None:
        test_rule_dict["flag"] = request.flag

    test_rule = Rule(
        id=test_rule_dict["id"],
        name=test_rule_dict["name"],
        visa_type=test_rule_dict["visa_type"],
        rule_type=test_rule_dict["rule_type"],
        conditions=test_rule_dict["conditions"],
        actions=test_rule_dict["actions"],
        flag=test_rule_dict["flag"]
    )

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

    validator = RuleValidator(inference_rules)
    test_result = validator.test_rule_modification(test_rule)

    return {
        "test_passed": test_result["is_valid"],
        "validation_results": test_result["validation_results"],
        "modified_rule": test_rule_dict
    }

# ===== データベース管理エンドポイント =====

@router.get("/database/tables")
def get_database_tables(db: Session = Depends(get_db)):
    """データベースのテーブル一覧を取得"""
    # PostgreSQLのテーブル一覧を取得
    result = db.execute(text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """))

    tables = [row[0] for row in result]

    return {
        "tables": tables,
        "count": len(tables)
    }

@router.get("/database/tables/{table_name}")
def get_table_data(table_name: str, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)):
    """テーブルのデータを取得"""
    try:
        # セキュリティ：テーブル名の検証
        result = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = :table_name
        """), {"table_name": table_name})

        if not result.fetchone():
            raise HTTPException(status_code=404, detail="テーブルが見つかりません")

        # データを取得
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        total_count = count_result.scalar()

        data_result = db.execute(text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset"),
                                 {"limit": limit, "offset": offset})

        columns = data_result.keys()
        rows = [dict(zip(columns, row)) for row in data_result]

        return {
            "table_name": table_name,
            "total_count": total_count,
            "limit": limit,
            "offset": offset,
            "columns": list(columns),
            "rows": rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"データ取得エラー: {str(e)}")

@router.post("/database/query")
def execute_sql_query(request: SQLQueryRequest, db: Session = Depends(get_db)):
    """SQLクエリを実行（システムイメージ.txt 行134）"""
    try:
        # read_onlyモードの場合、SELECT以外を拒否
        if request.read_only:
            query_upper = request.query.strip().upper()
            if not query_upper.startswith("SELECT"):
                raise HTTPException(
                    status_code=403,
                    detail="読み取り専用モードではSELECT文のみ実行可能です"
                )

        result = db.execute(text(request.query))

        # SELECTクエリの場合
        if request.query.strip().upper().startswith("SELECT"):
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result]
            return {
                "success": True,
                "columns": list(columns),
                "rows": rows,
                "row_count": len(rows)
            }
        else:
            # INSERT/UPDATE/DELETE等
            db.commit()
            return {
                "success": True,
                "message": "クエリを実行しました",
                "rows_affected": result.rowcount
            }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"SQLエラー: {str(e)}")

# ===== データエクスポート・インポート =====

@router.get("/database/export")
def export_database(format: str = "json", db: Session = Depends(get_db)):
    """データベースをエクスポート（システムイメージ.txt 行135）"""
    try:
        export_data = {}

        # 全テーブルのデータを取得
        tables_result = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        """))

        tables = [row[0] for row in tables_result]

        for table in tables:
            result = db.execute(text(f"SELECT * FROM {table}"))
            columns = result.keys()
            rows = [dict(zip(columns, row)) for row in result]
            export_data[table] = rows

        if format == "json":
            return {
                "format": "json",
                "exported_at": datetime.utcnow().isoformat(),
                "data": export_data
            }
        else:
            raise HTTPException(status_code=400, detail="サポートされていない形式です")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"エクスポートエラー: {str(e)}")

@router.post("/database/import")
def import_database(data: Dict, db: Session = Depends(get_db)):
    """データベースにインポート（システムイメージ.txt 行135）"""
    try:
        imported_tables = []

        for table_name, rows in data.get("data", {}).items():
            if not rows:
                continue

            # テーブルが存在するか確認
            result = db.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = :table_name
            """), {"table_name": table_name})

            if not result.fetchone():
                continue

            # データをインサート
            for row in rows:
                columns = ", ".join(row.keys())
                placeholders = ", ".join(f":{key}" for key in row.keys())
                query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
                db.execute(text(query), row)

            imported_tables.append(table_name)

        db.commit()

        return {
            "success": True,
            "imported_tables": imported_tables,
            "message": f"{len(imported_tables)}個のテーブルをインポートしました"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"インポートエラー: {str(e)}")

# ===== 統計・分析エンドポイント =====

@router.get("/analytics/consultation-stats")
def get_consultation_statistics(db: Session = Depends(get_db)):
    """診断履歴の統計を取得（システムイメージ.txt 行139）"""
    try:
        # 総診断数
        total_result = db.execute(text("SELECT COUNT(*) FROM consultation_sessions"))
        total_consultations = total_result.scalar()

        # 完了した診断数
        completed_result = db.execute(text("""
            SELECT COUNT(*) FROM consultation_sessions WHERE status = 'completed'
        """))
        completed_consultations = completed_result.scalar()

        # ビザタイプ別の結果
        visa_stats = {}
        for visa_type in ["E", "B", "L", "H-1B", "J-1"]:
            result = db.execute(text("""
                SELECT COUNT(*) FROM consultation_sessions
                WHERE status = 'completed'
                AND result::text LIKE :pattern
            """), {"pattern": f"%{visa_type}%"})
            visa_stats[visa_type] = result.scalar()

        # 平均質問数
        avg_questions_result = db.execute(text("""
            SELECT AVG(answer_count) FROM (
                SELECT session_id, COUNT(*) as answer_count
                FROM consultation_answers
                GROUP BY session_id
            ) as subquery
        """))
        avg_questions = avg_questions_result.scalar() or 0

        return {
            "total_consultations": total_consultations,
            "completed_consultations": completed_consultations,
            "visa_type_stats": visa_stats,
            "average_questions": float(avg_questions)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"統計取得エラー: {str(e)}")

@router.get("/analytics/question-paths")
def get_question_paths(limit: int = 10, db: Session = Depends(get_db)):
    """よく使われる質問パスを分析（システムイメージ.txt 行140）"""
    try:
        # 最も頻繁に使われる質問の順序を取得
        result = db.execute(text("""
            SELECT
                fact_name,
                COUNT(*) as usage_count,
                AVG(question_order) as avg_order
            FROM consultation_answers
            GROUP BY fact_name
            ORDER BY usage_count DESC
            LIMIT :limit
        """), {"limit": limit})

        paths = []
        for row in result:
            paths.append({
                "fact": row[0],
                "usage_count": row[1],
                "average_order": float(row[2])
            })

        return {
            "most_common_questions": paths
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"分析エラー: {str(e)}")

@router.get("/analytics/audit-log")
def get_audit_log(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """監査ログを取得（システムイメージ.txt 行121）"""
    logs = db.query(models.AuditLog)\
        .order_by(models.AuditLog.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()

    return {
        "logs": [
            {
                "id": log.id,
                "action": log.action,
                "table_name": log.table_name,
                "record_id": log.record_id,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "count": len(logs)
    }
