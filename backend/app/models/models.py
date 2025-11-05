from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.config import Base

class Rule(Base):
    """ルールテーブル - 全ビザタイプのルールを統合管理"""
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)  # ルール名
    visa_type = Column(String(50), nullable=False, index=True)  # E, B, L, H-1B, J-1等
    rule_type = Column(String(50), nullable=False)  # #i1 (開始ルール) or #m (問結ルール)
    conditions = Column(JSON, nullable=False)  # 条件部 [{fact: "...", operator: "AND/OR"}]
    actions = Column(JSON, nullable=False)  # 結論部 [{"fact": "...", "value": true}]
    priority = Column(Integer, default=0)  # 優先順位
    flag = Column(Boolean, default=True)  # ルールの有効/無効
    description = Column(Text)  # ルールの説明
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Fact(Base):
    """事実テーブル - 基本事実と導出事実"""
    __tablename__ = "facts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(500), unique=True, nullable=False, index=True)  # 事実名（日本語）
    fact_type = Column(String(50), nullable=False)  # basic(基本事実) or derived(導出事実)
    category = Column(String(100))  # カテゴリ（E, B, L等）
    is_question = Column(Boolean, default=True)  # この事実を質問するかどうか
    question_text = Column(Text)  # 質問文
    description = Column(Text)  # 説明
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class QuestionPriority(Base):
    """質問の優先順位テーブル"""
    __tablename__ = "question_priorities"

    id = Column(Integer, primary_key=True, index=True)
    fact_id = Column(Integer, ForeignKey("facts.id"), nullable=False)
    visa_type = Column(String(50), nullable=False)  # どのビザタイプの診断での優先順位か
    priority = Column(Integer, nullable=False)  # 優先順位（数値が小さいほど優先）
    reasoning = Column(Text)  # なぜこの順序なのかの理由
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fact = relationship("Fact")

class ConsultationSession(Base):
    """診断セッションテーブル"""
    __tablename__ = "consultation_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    visa_types = Column(JSON, nullable=False)  # 診断対象のビザタイプ ["E", "B", "L"]
    status = Column(String(50), default="in_progress")  # in_progress, completed, abandoned
    current_question = Column(String(500))  # 現在の質問
    findings = Column(JSON, default=dict)  # 確認された事実 {"fact_name": true/false}
    hypotheses = Column(JSON, default=dict)  # 導出された仮説 {"hypothesis_name": true/false}
    evaluated_rules = Column(JSON, default=list)  # 評価されたルール [rule_id, ...]
    fired_rules = Column(JSON, default=list)  # 発火したルール [rule_id, ...]
    result = Column(JSON)  # 診断結果
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    answers = relationship("ConsultationAnswer", back_populates="session", cascade="all, delete-orphan")

class ConsultationAnswer(Base):
    """診断回答履歴テーブル"""
    __tablename__ = "consultation_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("consultation_sessions.id"), nullable=False)
    fact_name = Column(String(500), nullable=False)  # 質問された事実
    answer = Column(String(50), nullable=False)  # yes, no, unknown
    question_order = Column(Integer, nullable=False)  # 質問順序
    answered_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ConsultationSession", back_populates="answers")

class RuleDependency(Base):
    """ルール依存関係テーブル"""
    __tablename__ = "rule_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=False)
    depends_on_fact = Column(String(500), nullable=False)  # どの事実に依存するか
    derived_from_rule_id = Column(Integer, ForeignKey("rules.id"))  # その事実を導出するルールID
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    """監査ログテーブル - ルール編集履歴等"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)  # create, update, delete
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    old_value = Column(JSON)
    new_value = Column(JSON)
    user_id = Column(String(100))  # 将来の拡張用
    created_at = Column(DateTime, default=datetime.utcnow)
