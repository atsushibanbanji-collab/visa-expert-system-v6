"""
ルール整合性チェック機能
システムイメージ.txt 行117-120準拠
"""

from typing import List, Dict, Set, Tuple
from app.services.inference_engine import Rule

class RuleValidator:
    """ルールの整合性検証"""

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

    def validate_all(self) -> Dict[str, List[Dict]]:
        """全ての整合性チェックを実行"""
        results = {
            "contradictions": self.detect_contradictions(),
            "unreachable_rules": self.detect_unreachable_rules(),
            "circular_references": self.detect_circular_references(),
            "orphaned_facts": self.detect_orphaned_facts()
        }
        return results

    def detect_contradictions(self) -> List[Dict]:
        """
        ルール間の矛盾を検出
        同じ条件で異なる結論を導くルールペアを検出
        """
        contradictions = []

        # 各事実について、それを導出するルールを確認
        for fact, rule_ids in self.fact_to_deriving_rules.items():
            if len(rule_ids) < 2:
                continue

            # 同じ事実を異なる値で導出するルールを確認
            for i in range(len(rule_ids)):
                for j in range(i + 1, len(rule_ids)):
                    rule1 = self.rules[rule_ids[i]]
                    rule2 = self.rules[rule_ids[j]]

                    # 両ルールが同じ条件を持つかチェック
                    conditions1 = set(c["fact"] for c in rule1.conditions)
                    conditions2 = set(c["fact"] for c in rule2.conditions)

                    if conditions1 == conditions2:
                        # 同じ条件で同じ事実を導出する場合、値が異なるかチェック
                        action1 = next((a for a in rule1.actions if a["fact"] == fact), None)
                        action2 = next((a for a in rule2.actions if a["fact"] == fact), None)

                        if action1 and action2:
                            value1 = action1.get("value", True)
                            value2 = action2.get("value", True)

                            if value1 != value2:
                                contradictions.append({
                                    "type": "contradiction",
                                    "severity": "high",
                                    "rule_ids": [rule_ids[i], rule_ids[j]],
                                    "fact": fact,
                                    "message": f"ルール{rule_ids[i]}と{rule_ids[j]}が同じ条件で'{fact}'に異なる値を設定しています"
                                })

        return contradictions

    def detect_unreachable_rules(self) -> List[Dict]:
        """
        到達不可能なルールを検出
        条件が満たせないルールを検出
        """
        unreachable = []

        for rule_id, rule in self.rules.items():
            if not rule.conditions:
                continue

            # このルールの条件を確認
            impossible_conditions = []
            for cond in rule.conditions:
                fact = cond["fact"]

                # この事実を導出できるルールが存在するか
                # または基本事実（導出されない）として質問可能か
                is_derivable = fact in self.fact_to_deriving_rules

                # 導出可能だが、それを導出するルールが全て無効な場合
                if is_derivable:
                    deriving_rules = self.fact_to_deriving_rules[fact]
                    all_disabled = all(not self.rules[rid].flag for rid in deriving_rules if rid in self.rules)

                    if all_disabled:
                        impossible_conditions.append(fact)

            if impossible_conditions:
                unreachable.append({
                    "type": "unreachable",
                    "severity": "medium",
                    "rule_id": rule_id,
                    "rule_name": rule.name,
                    "impossible_conditions": impossible_conditions,
                    "message": f"ルール{rule_id}({rule.name})は到達不可能です。条件{impossible_conditions}を満たせません"
                })

        return unreachable

    def detect_circular_references(self) -> List[Dict]:
        """
        循環参照を検出
        A→B→C→Aのような依存関係のループを検出
        """
        circular_refs = []

        def find_cycle(fact: str, visited: Set[str], path: List[str]) -> List[str]:
            """DFSで循環を検出"""
            if fact in visited:
                # 循環を検出
                cycle_start = path.index(fact)
                return path[cycle_start:]

            visited.add(fact)
            path.append(fact)

            # この事実を条件とするルールを探索
            if fact in self.fact_to_dependent_rules:
                for rule_id in self.fact_to_dependent_rules[fact]:
                    if rule_id not in self.rules:
                        continue

                    rule = self.rules[rule_id]
                    # このルールの結論を探索
                    for action in rule.actions:
                        next_fact = action["fact"]
                        cycle = find_cycle(next_fact, visited.copy(), path.copy())
                        if cycle:
                            return cycle

            return []

        # 全ての事実について循環をチェック
        checked_facts = set()
        for fact in self.fact_to_deriving_rules.keys():
            if fact in checked_facts:
                continue

            cycle = find_cycle(fact, set(), [])
            if cycle:
                # 循環に関与するルールを特定
                involved_rules = []
                for i in range(len(cycle)):
                    current_fact = cycle[i]
                    next_fact = cycle[(i + 1) % len(cycle)]

                    # current_factを条件とし、next_factを導出するルールを探す
                    if next_fact in self.fact_to_deriving_rules:
                        for rule_id in self.fact_to_deriving_rules[next_fact]:
                            rule = self.rules[rule_id]
                            if any(c["fact"] == current_fact for c in rule.conditions):
                                involved_rules.append(rule_id)

                circular_refs.append({
                    "type": "circular_reference",
                    "severity": "high",
                    "cycle": cycle,
                    "involved_rules": involved_rules,
                    "message": f"循環参照を検出: {' → '.join(cycle)} → {cycle[0]}"
                })

                checked_facts.update(cycle)

        return circular_refs

    def detect_orphaned_facts(self) -> List[Dict]:
        """
        孤立した事実を検出
        どのルールからも参照されない事実
        """
        orphaned = []

        # 全ての事実を収集
        all_facts = set()
        for rule in self.rules.values():
            for cond in rule.conditions:
                all_facts.add(cond["fact"])
            for action in rule.actions:
                all_facts.add(action["fact"])

        # 各事実が参照されているかチェック
        for fact in all_facts:
            # この事実を条件とするルールが存在するか
            is_used_in_condition = fact in self.fact_to_dependent_rules and len(self.fact_to_dependent_rules[fact]) > 0

            # この事実を結論とするルールが存在するか
            is_used_in_action = fact in self.fact_to_deriving_rules and len(self.fact_to_deriving_rules[fact]) > 0

            # 結論としてのみ使われ、どの条件でも参照されない
            if is_used_in_action and not is_used_in_condition:
                orphaned.append({
                    "type": "orphaned_fact",
                    "severity": "low",
                    "fact": fact,
                    "deriving_rules": self.fact_to_deriving_rules[fact],
                    "message": f"事実'{fact}'は導出されますが、どのルールの条件でも使用されていません"
                })

        return orphaned

    def test_rule_modification(self, modified_rule: Rule) -> Dict:
        """
        ルール変更のテスト実行
        変更が他のルールに影響を与えないかチェック
        """
        # 一時的にルールを変更して整合性チェック
        original_rule = self.rules.get(modified_rule.id)
        self.rules[modified_rule.id] = modified_rule

        # キャッシュを再構築
        self.fact_to_deriving_rules = self._build_fact_to_rules_map()
        self.fact_to_dependent_rules = self._build_dependency_map()

        # 整合性チェック実行
        validation_results = self.validate_all()

        # 元に戻す
        if original_rule:
            self.rules[modified_rule.id] = original_rule
        else:
            del self.rules[modified_rule.id]

        self.fact_to_deriving_rules = self._build_fact_to_rules_map()
        self.fact_to_dependent_rules = self._build_dependency_map()

        return {
            "is_valid": self._is_validation_passed(validation_results),
            "validation_results": validation_results
        }

    def _is_validation_passed(self, results: Dict) -> bool:
        """検証結果に重大なエラーがないかチェック"""
        # 高重要度のエラーがあれば失敗
        for category, issues in results.items():
            for issue in issues:
                if issue.get("severity") == "high":
                    return False
        return True
