"""
推論エンジン - バックワードチェイニング（後向き推論）方式
Smalltalkのプロダクションシステムを参考に実装
"""

from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class AnswerType(Enum):
    YES = "yes"
    NO = "no"
    UNKNOWN = "unknown"
    NOT_ASKED = "not_asked"

class RuleStatus(Enum):
    NOT_EVALUATED = "not_evaluated"  # 未評価
    EVALUATING = "evaluating"  # 評価中
    FIRED = "fired"  # 発火した
    FAILED = "failed"  # 発火失敗（条件不成立）
    SKIPPED = "skipped"  # スキップ（AND条件の一部がfalse）

@dataclass
class WorkingMemory:
    """作業記憶 - Smalltalkの WorkingMemory に相当"""
    findings: Dict[str, bool]  # 確認された基本事実
    hypotheses: Dict[str, bool]  # 導出された仮説
    conflict_set: Set[int]  # 発火可能なルールの集合
    evaluated_rules: Dict[int, RuleStatus]  # ルールの評価状態

    def __init__(self):
        self.findings = {}
        self.hypotheses = {}
        self.conflict_set = set()
        self.evaluated_rules = {}

@dataclass
class Rule:
    """ルールクラス"""
    id: int
    name: str
    visa_type: str
    rule_type: str
    conditions: List[Dict]  # [{"fact": "...", "operator": "AND"/"OR"}]
    actions: List[Dict]  # [{"fact": "...", "value": true}]
    flag: bool

    def check_conditions(self, wm: WorkingMemory) -> Tuple[bool, List[str], List[str]]:
        """
        条件をチェック
        Returns: (全条件成立?, 満たされた条件リスト, 満たされていない条件リスト)
        """
        if not self.conditions:
            return True, [], []

        satisfied = []
        unsatisfied = []
        unknown = []

        # 条件を評価
        for cond in self.conditions:
            fact = cond["fact"]

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

        # AND/OR演算子による評価
        # 簡略化のため、ここではすべてANDとして扱う（実際のビザルールはほぼAND）
        # ORは個別のルールとして分割済み

        # AND条件: 一つでもfalseがあれば失敗
        if unsatisfied:
            return False, satisfied, unsatisfied + unknown

        # すべて判明していて満たされている
        if unknown:
            return False, satisfied, unknown

        return True, satisfied, []

    def fire(self, wm: WorkingMemory) -> List[str]:
        """
        ルールを発火させ、結論を導出
        Returns: 導出された事実のリスト
        """
        derived_facts = []

        for action in self.actions:
            fact = action["fact"]
            value = action.get("value", True)

            # hypothesesに追加
            wm.hypotheses[fact] = value
            derived_facts.append(fact)

        return derived_facts

class InferenceEngine:
    """推論エンジン - バックワードチェイニング"""

    def __init__(self, rules: List[Rule]):
        self.rules = {rule.id: rule for rule in rules}
        self.rule_dependencies = self._build_dependencies()

    def _build_dependencies(self) -> Dict[str, List[int]]:
        """
        事実→それを導出するルールIDのマッピングを構築
        """
        dependencies = {}

        for rule_id, rule in self.rules.items():
            for action in rule.actions:
                fact = action["fact"]
                if fact not in dependencies:
                    dependencies[fact] = []
                dependencies[fact].append(rule_id)

        return dependencies

    def get_facts_that_can_derive(self, fact: str) -> List[int]:
        """
        指定された事実を導出できるルールIDのリストを返す
        """
        return self.rule_dependencies.get(fact, [])

    def is_basic_fact(self, fact: str) -> bool:
        """
        基本事実かどうか（どのルールの結論にも現れない事実）
        """
        return fact not in self.rule_dependencies

    def get_all_conditions_for_goal(self, goal_fact: str, wm: WorkingMemory, visited: Set[str] = None) -> Set[str]:
        """
        ゴール達成に必要な全ての基本事実を再帰的に収集（バックワードチェイニング）
        """
        if visited is None:
            visited = set()

        if goal_fact in visited:
            return set()

        visited.add(goal_fact)
        needed_facts = set()

        # すでに判明している場合はスキップ
        if goal_fact in wm.findings or goal_fact in wm.hypotheses:
            return needed_facts

        # このゴールを導出できるルールを探す
        deriving_rules = self.get_facts_that_can_derive(goal_fact)

        if not deriving_rules:
            # 基本事実
            needed_facts.add(goal_fact)
            return needed_facts

        # 導出可能な事実の場合、そのルールの条件を再帰的に探索
        # 最も条件の少ないルールを選択（簡略化）
        min_conditions_rule = min(
            [self.rules[rid] for rid in deriving_rules if rid in self.rules],
            key=lambda r: len(r.conditions),
            default=None
        )

        if min_conditions_rule:
            for cond in min_conditions_rule.conditions:
                cond_fact = cond["fact"]
                needed_facts.update(
                    self.get_all_conditions_for_goal(cond_fact, wm, visited)
                )

        return needed_facts

    def get_next_question(self, goals: List[str], wm: WorkingMemory) -> Optional[str]:
        """
        次に質問すべき事実を決定（バックワードチェイニング）

        複数のゴールに共通する事実を優先的に質問
        """
        # 各ゴールに必要な基本事実を収集
        all_needed_facts = set()
        goal_facts_map = {}

        for goal in goals:
            needed = self.get_all_conditions_for_goal(goal, wm)
            goal_facts_map[goal] = needed
            all_needed_facts.update(needed)

        # すでに質問済みの事実を除外
        unasked_facts = [
            fact for fact in all_needed_facts
            if fact not in wm.findings
        ]

        if not unasked_facts:
            return None

        # 複数のゴールで共有されている事実を優先
        # （効率的な質問順序）
        fact_score = {}
        for fact in unasked_facts:
            score = sum(1 for needed in goal_facts_map.values() if fact in needed)
            fact_score[fact] = score

        # スコアが最も高い事実を返す
        next_fact = max(unasked_facts, key=lambda f: fact_score[f])
        return next_fact

    def evaluate_rules(self, wm: WorkingMemory) -> List[int]:
        """
        現在の作業記憶でルールを評価し、発火可能なルールを特定
        Returns: 発火したルールIDのリスト
        """
        fired_rules = []

        for rule_id, rule in self.rules.items():
            if not rule.flag:  # 無効なルール
                continue

            if wm.evaluated_rules.get(rule_id) == RuleStatus.FIRED:
                continue  # すでに発火済み

            if wm.evaluated_rules.get(rule_id) == RuleStatus.SKIPPED:
                continue  # スキップ済み

            # 条件チェック
            all_satisfied, satisfied, unsatisfied = rule.check_conditions(wm)

            if all_satisfied:
                # 発火
                derived_facts = rule.fire(wm)
                wm.evaluated_rules[rule_id] = RuleStatus.FIRED
                fired_rules.append(rule_id)
                wm.conflict_set.add(rule_id)

                # 新たに導出された事実により、他のルールも評価可能になる可能性
                # 再帰的に評価
                newly_fired = self.evaluate_rules(wm)
                fired_rules.extend(newly_fired)
                break  # 1つ発火したら再評価

            elif unsatisfied:
                # AND条件で少なくとも1つがfalseの場合、スキップ
                has_definite_false = any(
                    (fact in wm.findings and not wm.findings[fact]) or
                    (fact in wm.hypotheses and not wm.hypotheses[fact])
                    for fact in unsatisfied
                )

                if has_definite_false:
                    wm.evaluated_rules[rule_id] = RuleStatus.SKIPPED

        return fired_rules

    def process_answer(self, fact: str, answer: AnswerType, wm: WorkingMemory) -> Dict:
        """
        ユーザーの回答を処理し、推論を進める
        """
        # 回答を作業記憶に記録
        if answer == AnswerType.YES:
            wm.findings[fact] = True
        elif answer == AnswerType.NO:
            wm.findings[fact] = False
        elif answer == AnswerType.UNKNOWN:
            # UNKNOWNの場合は、その事実を導出するための質問を生成
            # （実装簡略化のため、ここでは単にfalseとして扱う）
            wm.findings[fact] = False

        # ルールを評価
        fired_rules = self.evaluate_rules(wm)

        return {
            "fired_rules": fired_rules,
            "derived_facts": list(wm.hypotheses.keys()),
            "working_memory": {
                "findings": wm.findings,
                "hypotheses": wm.hypotheses
            }
        }

    def check_goals(self, goals: List[str], wm: WorkingMemory) -> Dict[str, bool]:
        """
        ゴールの達成状況をチェック
        """
        results = {}

        for goal in goals:
            if goal in wm.hypotheses:
                results[goal] = wm.hypotheses[goal]
            elif goal in wm.findings:
                results[goal] = wm.findings[goal]
            else:
                results[goal] = False

        return results
