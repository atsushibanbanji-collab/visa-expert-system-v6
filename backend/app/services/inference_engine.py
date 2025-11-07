"""
推論エンジン - バックワードチェイニング（後向き推論）方式
システムイメージ.txt完全準拠版
"""

from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

class AnswerType(Enum):
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"
    NOT_ASKED = "not_asked"

class RuleStatus(Enum):
    NOT_EVALUATED = "not_evaluated"
    EVALUATING = "evaluating"
    FIRED = "fired"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class WorkingMemory:
    """作業記憶 - Smalltalkの WorkingMemory に相当"""
    findings: Dict[str, bool] = field(default_factory=dict)  # 確認された基本事実
    hypotheses: Dict[str, bool] = field(default_factory=dict)  # 導出された仮説
    conflict_set: Set[int] = field(default_factory=set)  # 発火したルールの集合
    evaluated_rules: Dict[int, RuleStatus] = field(default_factory=dict)  # ルール評価状態
    skipped_facts: Set[str] = field(default_factory=set)  # スキップされた事実
    asked_derivable_facts: Set[str] = field(default_factory=set)  # 直接質問した導出可能な事実

@dataclass
class Rule:
    """ルールクラス"""
    id: int
    name: str
    visa_type: str
    rule_type: str
    conditions: List[Dict]
    actions: List[Dict]
    flag: bool

    def check_conditions(self, wm: WorkingMemory) -> Tuple[bool, List[str], List[str]]:
        """
        条件をチェック
        Returns: (全条件成立?, 満たされた条件, 満たされていない条件)
        """
        if not self.conditions:
            return True, [], []

        satisfied = []
        unsatisfied = []
        unknown = []

        for cond in self.conditions:
            fact = cond["fact"]

            # スキップされた事実は評価不要
            if fact in wm.skipped_facts:
                continue

            # findingsまたはhypothesesから値を取得
            if fact in wm.findings:
                value = wm.findings[fact]
            elif fact in wm.hypotheses:
                value = wm.hypotheses[fact]
            else:
                unknown.append(fact)
                continue

            if value:
                satisfied.append(fact)
            else:
                unsatisfied.append(fact)

        # AND条件の場合、一つでもfalseがあれば失敗
        if unsatisfied:
            return False, satisfied, unsatisfied + unknown

        # 全て判明していて満たされている
        if unknown:
            return False, satisfied, unknown

        return True, satisfied, []

    def fire(self, wm: WorkingMemory) -> List[str]:
        """ルールを発火させ、結論を導出"""
        derived_facts = []
        for action in self.actions:
            fact = action["fact"]
            value = action.get("value", True)
            wm.hypotheses[fact] = value
            derived_facts.append(fact)
        return derived_facts

class InferenceEngine:
    """推論エンジン - システムイメージ.txt完全準拠"""

    def __init__(self, rules: List[Rule]):
        self.rules = {rule.id: rule for rule in rules}
        self.fact_to_deriving_rules = self._build_fact_to_rules_map()
        self.fact_to_dependent_rules = self._build_dependency_map()

    def _build_fact_to_rules_map(self) -> Dict[str, List[int]]:
        """事実→それを導出するルールIDのマッピング"""
        mapping = {}
        for rule_id, rule in self.rules.items():
            for action in rule.actions:
                fact = action["fact"]
                if fact not in mapping:
                    mapping[fact] = []
                mapping[fact].append(rule_id)
        return mapping

    def _build_dependency_map(self) -> Dict[str, List[int]]:
        """事実→それを条件とするルールIDのマッピング"""
        mapping = {}
        for rule_id, rule in self.rules.items():
            for cond in rule.conditions:
                fact = cond["fact"]
                if fact not in mapping:
                    mapping[fact] = []
                mapping[fact].append(rule_id)
        return mapping

    def is_derivable_fact(self, fact: str) -> bool:
        """導出可能な事実かどうか"""
        return fact in self.fact_to_deriving_rules

    def is_basic_fact(self, fact: str) -> bool:
        """基本事実かどうか（どのルールからも導出されない）"""
        return not self.is_derivable_fact(fact)

    def get_deriving_rules(self, fact: str) -> List[int]:
        """指定された事実を導出できるルールIDのリスト"""
        return self.fact_to_deriving_rules.get(fact, [])

    def get_dependent_rules(self, fact: str) -> List[int]:
        """指定された事実を条件とするルールIDのリスト"""
        return self.fact_to_dependent_rules.get(fact, [])

    def cascade_invalidate_rules(self, fact: str, wm: WorkingMemory):
        """
        ルール間依存関係の連鎖的無効化（システムイメージ行53-55）
        事実がfalseになった場合、それを条件とする全ルールを連鎖的に無効化
        """
        # この事実を条件とするルールを全て取得
        dependent_rule_ids = self.get_dependent_rules(fact)

        for rule_id in dependent_rule_ids:
            if rule_id not in self.rules:
                continue

            # まだ評価されていないか、失敗していないルールのみ処理
            current_status = wm.evaluated_rules.get(rule_id, RuleStatus.NOT_EVALUATED)
            if current_status in [RuleStatus.FIRED, RuleStatus.SKIPPED]:
                continue

            # ルールをスキップ状態にする
            wm.evaluated_rules[rule_id] = RuleStatus.SKIPPED

            # このルールの結論も連鎖的に無効化
            rule = self.rules[rule_id]
            for action in rule.actions:
                derived_fact = action["fact"]
                # 導出された事実をfalseに設定（既に存在する場合）
                if derived_fact in wm.hypotheses:
                    wm.hypotheses[derived_fact] = False
                # この事実に依存するルールも連鎖的に無効化
                self.cascade_invalidate_rules(derived_fact, wm)

    def get_next_question(self, goals: List[str], wm: WorkingMemory) -> Optional[str]:
        """
        次に質問すべき事実を決定（システムイメージ行41-46準拠）
        導出可能な条件も直接質問する
        """
        # 各ゴールに必要な事実を収集（導出可能な事実も含む）
        all_needed_facts = set()
        goal_facts_map = {}

        for goal in goals:
            # このゴールは既に評価済みか確認
            if goal in wm.hypotheses or goal in wm.findings:
                continue

            needed = self._get_facts_for_goal(goal, wm, include_derivable=True)
            goal_facts_map[goal] = needed
            all_needed_facts.update(needed)

        # 既に質問済みまたはスキップされた事実を除外
        unasked_facts = [
            fact for fact in all_needed_facts
            if fact not in wm.findings
            and fact not in wm.skipped_facts
            and fact not in wm.hypotheses  # 既に導出された事実も除外
        ]

        if not unasked_facts:
            return None

        # 質問の優先順位を決定（システムイメージ.txt 行41-46準拠）
        # 1. 答えやすい質問を最優先（短い質問文）
        # 2. 導出可能な事実を優先（質問数削減のため）
        # 3. ビザタイプ優先度（E > L > B）
        # 4. 複数のゴールで共有されている事実を優先
        fact_scores = {}
        for fact in unasked_facts:
            score = 0

            # ビザタイプ優先度ボーナス（E > L > B）
            visa_type_bonus = 0
            for goal, needed_facts in goal_facts_map.items():
                if fact in needed_facts:
                    if "Eビザ" in goal:
                        visa_type_bonus = max(visa_type_bonus, 50)  # Eビザ最優先
                    elif "Lビザ" in goal or "Blanket L" in goal:
                        visa_type_bonus = max(visa_type_bonus, 30)  # Lビザ次
                    elif "Bビザ" in goal or "B-1" in goal:
                        visa_type_bonus = max(visa_type_bonus, 10)  # Bビザ最後

            score += visa_type_bonus

            # 複数のゴールで共有されているか
            shared_count = sum(1 for needed in goal_facts_map.values() if fact in needed)
            score += shared_count * 10

            # 導出可能な事実を優先（質問数削減のため、システムイメージ行41-46）
            if self.is_derivable_fact(fact):
                score += 50  # 導出可能な事実を優先
            else:
                score += 30  # 基本事実は次点

            # 答えやすさボーナス（短い質問文 = 抽象的で答えやすい）
            if len(fact) <= 30:
                score += 30  # 短い質問は答えやすい

            fact_scores[fact] = score

        # スコアが最も高い事実を返す
        if fact_scores:
            next_fact = max(fact_scores.keys(), key=lambda f: fact_scores[f])
            return next_fact

        return None

    def _get_facts_for_goal(self, goal: str, wm: WorkingMemory,
                           include_derivable: bool = True,
                           visited: Set[str] = None) -> Set[str]:
        """
        ゴール達成に必要な全ての事実を収集
        include_derivable=True の場合、導出可能な事実も含める
        """
        if visited is None:
            visited = set()

        if goal in visited:
            return set()

        visited.add(goal)
        needed_facts = set()

        # 既に判明している場合はスキップ
        if goal in wm.findings or goal in wm.hypotheses:
            return needed_facts

        # このゴールを導出できるルールを探す
        deriving_rule_ids = self.get_deriving_rules(goal)

        if not deriving_rule_ids:
            # 基本事実
            needed_facts.add(goal)
            return needed_facts

        # 導出可能な事実の場合
        if include_derivable:
            # この事実自体も質問候補に含める（システムイメージ行41-46）
            needed_facts.add(goal)

        # 最も条件の少ないルールを選択（簡略化）
        min_rule = min(
            [self.rules[rid] for rid in deriving_rule_ids if rid in self.rules],
            key=lambda r: len(r.conditions),
            default=None
        )

        if min_rule:
            for cond in min_rule.conditions:
                cond_fact = cond["fact"]
                # 再帰的に必要な事実を収集
                nested_facts = self._get_facts_for_goal(cond_fact, wm, include_derivable, visited)
                needed_facts.update(nested_facts)

        return needed_facts

    def process_answer(self, fact: str, answer: AnswerType, wm: WorkingMemory) -> Dict:
        """
        回答を処理（システムイメージ行56-62準拠）
        「わからない」の場合、詳細質問への分岐を提案
        """
        result = {
            "fired_rules": [],
            "derived_facts": [],
            "detail_questions_needed": False,
            "detail_questions": [],
            "working_memory": {}
        }

        is_derivable = self.is_derivable_fact(fact)

        if answer == AnswerType.YES:
            # 「はい」の場合
            if is_derivable:
                # 導出可能な事実を直接確認
                wm.hypotheses[fact] = True
                wm.asked_derivable_facts.add(fact)
                # 詳細質問（この事実を導出するための基本事実）はスキップ
                self._skip_detail_questions(fact, wm)
            else:
                # 基本事実
                wm.findings[fact] = True

        elif answer == AnswerType.NO:
            # 「いいえ」の場合
            if is_derivable:
                wm.hypotheses[fact] = False
                wm.asked_derivable_facts.add(fact)
            else:
                wm.findings[fact] = False

            # この事実に依存するルールを連鎖的に無効化（システムイメージ行53-55）
            self.cascade_invalidate_rules(fact, wm)

        elif answer == AnswerType.UNKNOWN:
            # 「わからない」の場合（システムイメージ行58-60）
            if is_derivable:
                # 詳細質問が必要
                detail_questions = self._get_detail_questions(fact, wm)
                result["detail_questions_needed"] = True
                result["detail_questions"] = detail_questions
                # まだ回答を記録しない（詳細質問の結果を待つ）
                return result
            else:
                # 基本事実で「わからない」の場合はfalseとして扱う
                wm.findings[fact] = False
                self.cascade_invalidate_rules(fact, wm)

        # ルールを評価
        fired_rules = self.evaluate_rules(wm)
        result["fired_rules"] = fired_rules
        result["derived_facts"] = list(wm.hypotheses.keys())
        result["working_memory"] = {
            "findings": wm.findings,
            "hypotheses": wm.hypotheses
        }

        return result

    def _skip_detail_questions(self, fact: str, wm: WorkingMemory):
        """
        導出可能な事実を直接確認した場合、詳細質問（基本事実）をスキップ
        """
        deriving_rules = self.get_deriving_rules(fact)
        for rule_id in deriving_rules:
            if rule_id not in self.rules:
                continue
            rule = self.rules[rule_id]
            for cond in rule.conditions:
                cond_fact = cond["fact"]
                # この条件（基本事実）をスキップ対象に追加
                if self.is_basic_fact(cond_fact):
                    wm.skipped_facts.add(cond_fact)

    def _get_detail_questions(self, fact: str, wm: WorkingMemory) -> List[str]:
        """
        「わからない」と回答された導出可能な事実について、
        それを判定するための詳細質問（基本事実）を取得
        """
        detail_questions = []
        deriving_rules = self.get_deriving_rules(fact)

        for rule_id in deriving_rules:
            if rule_id not in self.rules:
                continue
            rule = self.rules[rule_id]
            for cond in rule.conditions:
                cond_fact = cond["fact"]
                # 未回答の基本事実を詳細質問として追加
                if cond_fact not in wm.findings and cond_fact not in wm.hypotheses:
                    detail_questions.append(cond_fact)

        return detail_questions

    def evaluate_rules(self, wm: WorkingMemory) -> List[int]:
        """
        ルールを評価し、発火可能なルールを実行
        AND条件の最適化を含む（システムイメージ行49-52）
        """
        fired_rules = []

        for rule_id, rule in self.rules.items():
            if not rule.flag:
                continue

            current_status = wm.evaluated_rules.get(rule_id, RuleStatus.NOT_EVALUATED)

            if current_status in [RuleStatus.FIRED, RuleStatus.SKIPPED]:
                continue

            # 条件チェック
            all_satisfied, satisfied, unsatisfied = rule.check_conditions(wm)

            if all_satisfied:
                # 全条件が満たされた → 発火
                derived_facts = rule.fire(wm)
                wm.evaluated_rules[rule_id] = RuleStatus.FIRED
                fired_rules.append(rule_id)
                wm.conflict_set.add(rule_id)

                # 新たに導出された事実により他のルールも評価可能になる可能性
                newly_fired = self.evaluate_rules(wm)
                fired_rules.extend(newly_fired)
                break

            elif unsatisfied:
                # AND条件で少なくとも1つがfalse → スキップ（システムイメージ行49-52）
                has_definite_false = any(
                    (fact in wm.findings and not wm.findings[fact]) or
                    (fact in wm.hypotheses and not wm.hypotheses[fact])
                    for fact in unsatisfied
                )

                if has_definite_false:
                    wm.evaluated_rules[rule_id] = RuleStatus.SKIPPED
                    # このルールの残りの未確認条件はスキップ
                    for cond in rule.conditions:
                        cond_fact = cond["fact"]
                        if cond_fact not in wm.findings and cond_fact not in wm.hypotheses:
                            wm.skipped_facts.add(cond_fact)

        return fired_rules

    def check_goals(self, goals: List[str], wm: WorkingMemory) -> Dict[str, bool]:
        """ゴールの達成状況をチェック"""
        results = {}
        for goal in goals:
            if goal in wm.hypotheses:
                results[goal] = wm.hypotheses[goal]
            elif goal in wm.findings:
                results[goal] = wm.findings[goal]
            else:
                results[goal] = False
        return results
