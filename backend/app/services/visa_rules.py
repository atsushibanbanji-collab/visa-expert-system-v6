"""
30個のビザ選定ルールの定義
ビザ選定知識.txtから変換
"""

# ルール定義
VISA_RULES = [
    # ============= Eビザ関連 (ルール1-11) =============
    {
        "id": 1,
        "name": "Eビザでの申請ができます",
        "visa_type": "E",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "申請者と会社の国籍が同じです", "operator": "AND"},
            {"fact": "会社がEビザの条件を満たします", "operator": "AND"},
            {"fact": "申請者がEビザの条件を満たします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Eビザでの申請ができます", "value": True}
        ],
        "priority": 1,
        "flag": True,
        "description": "Eビザの申請可能性を判定するメインルール"
    },
    {
        "id": 2,
        "name": "会社がEビザの条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "会社がEビザの投資の条件を満たします", "operator": "OR"},
            {"fact": "会社がEビザの貿易の条件を満たします", "operator": "OR"}
        ],
        "actions": [
            {"fact": "会社がEビザの条件を満たします", "value": True}
        ],
        "priority": 2,
        "flag": True,
        "description": "会社がEビザの条件（投資または貿易）を満たすか"
    },
    {
        "id": 3,
        "name": "会社がEビザの投資の条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "減価償却前の設備や建物が30万ドル以上財務諸表の資産に計上されています", "operator": "OR"},
            {"fact": "30万ドル以上で企業を買収した会社か、買収された会社です", "operator": "OR"},
            {"fact": "まだ十分な売り上げがなく、これまでに人件費などのランニングコストを含め、30万ドル以上支出しています", "operator": "OR"},
            {"fact": "会社設立のために、30万ドル以上支出しました（不動産を除く）", "operator": "OR"}
        ],
        "actions": [
            {"fact": "会社がEビザの投資の条件を満たします", "value": True}
        ],
        "priority": 3,
        "flag": True,
        "description": "投資額30万ドル以上の条件"
    },
    {
        "id": 4,
        "name": "会社がEビザの貿易の条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "会社の行う貿易の50％が日米間です", "operator": "AND"},
            {"fact": "会社の行う貿易は継続的です", "operator": "AND"},
            {"fact": "貿易による利益が会社の経費の80％以上をカバーしています", "operator": "AND"}
        ],
        "actions": [
            {"fact": "会社がEビザの貿易の条件を満たします", "value": True}
        ],
        "priority": 4,
        "flag": True,
        "description": "貿易条件：50%日米間、継続的、利益80%以上"
    },
    {
        "id": 5,
        "name": "申請者がEビザの条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "申請者がEビザのマネージャー以上の条件を満たします", "operator": "OR"},
            {"fact": "申請者がEビザのスタッフの条件を満たします", "operator": "OR"},
            {"fact": "EビザTDY(short-term needs)の条件を満たします", "operator": "OR"}
        ],
        "actions": [
            {"fact": "申請者がEビザの条件を満たします", "value": True}
        ],
        "priority": 5,
        "flag": True,
        "description": "申請者がEビザのポジション条件を満たすか"
    },
    {
        "id": 6,
        "name": "申請者がEビザのマネージャー以上の条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "米国拠点でEビザでマネージャー以上として認められるポジションに就きます", "operator": "AND"},
            {"fact": "マネージャー以上のポジションの業務を遂行する十分な能力があります", "operator": "AND"}
        ],
        "actions": [
            {"fact": "申請者がEビザのマネージャー以上の条件を満たします", "value": True}
        ],
        "priority": 6,
        "flag": True,
        "description": "Eビザマネージャーの条件"
    },
    {
        "id": 7,
        "name": "米国拠点でEビザでマネージャー以上として認められるポジションに就きます",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "CEOなどのオフィサーのポジションに就きます", "operator": "OR"},
            {"fact": "経営企画のマネージャーなど、米国拠点の経営に関わるポジションに就きます", "operator": "OR"},
            {"fact": "評価・雇用に責任を持つ複数のフルタイムのスタッフを部下に持つマネージャー以上のポジションに就きます", "operator": "OR"}
        ],
        "actions": [
            {"fact": "米国拠点でEビザでマネージャー以上として認められるポジションに就きます", "value": True}
        ],
        "priority": 7,
        "flag": True,
        "description": "Eビザで認められるマネージャーポジション"
    },
    {
        "id": 8,
        "name": "マネージャー以上のポジションの業務を遂行する十分な能力があります",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "米国拠点のポジションの業務に深く関連する業務の経験が2年以上あります", "operator": "AND"},
            {"fact": "マネジメント経験が2年以上あります", "operator": "AND"}
        ],
        "actions": [
            {"fact": "マネージャー以上のポジションの業務を遂行する十分な能力があります", "value": True}
        ],
        "priority": 8,
        "flag": True,
        "description": "マネージャーとしての能力要件"
    },
    {
        "id": 9,
        "name": "マネジメント経験が2年以上あります",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "2年以上のマネージャー経験があります", "operator": "OR"},
            {"fact": "マネジメントが求められるプロジェクトマネージャーなどの2年以上の経験があります", "operator": "OR"}
        ],
        "actions": [
            {"fact": "マネジメント経験が2年以上あります", "value": True}
        ],
        "priority": 9,
        "flag": True,
        "description": "マネジメント経験の判定"
    },
    {
        "id": 10,
        "name": "申請者がEビザのスタッフの条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "理系の大学院卒で、米国拠点の技術系の業務に深く関連する3年以上の業務経験があります", "operator": "OR"},
            {"fact": "理系の学部卒で、米国拠点の技術系の業務に深く関連する4年以上の業務経験があります", "operator": "OR"},
            {"fact": "米国拠点の業務に深く関連する5年以上の業務経験があります", "operator": "OR"}
        ],
        "actions": [
            {"fact": "申請者がEビザのスタッフの条件を満たします", "value": True}
        ],
        "priority": 10,
        "flag": True,
        "description": "Eビザスタッフ（専門職）の条件"
    },
    {
        "id": 11,
        "name": "EビザTDY(short-term needs)の条件を満たします",
        "visa_type": "E",
        "rule_type": "#m",
        "conditions": [
            {"fact": "2年以内の期間で、目的を限定した派遣理由を説明できます", "operator": "AND"},
            {"fact": "米国拠点の業務に深く関連する2年以上の業務経験があります", "operator": "AND"}
        ],
        "actions": [
            {"fact": "EビザTDY(short-term needs)の条件を満たします", "value": True}
        ],
        "priority": 11,
        "flag": True,
        "description": "短期派遣のEビザ条件"
    },

    # ============= Lビザ関連 (ルール12-21) =============
    # Blanket Lビザ (ルール12-17)
    {
        "id": 12,
        "name": "Blanket Lビザでの申請ができます",
        "visa_type": "L",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "アメリカ以外からアメリカへのグループ内での異動です", "operator": "AND"},
            {"fact": "会社がBlanket Lビザの条件を満たします", "operator": "AND"},
            {"fact": "申請者がBlanket Lビザの条件を満たします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Blanket Lビザでの申請ができます", "value": True}
        ],
        "priority": 12,
        "flag": True,
        "description": "Blanket Lビザの申請可能性"
    },
    {
        "id": 13,
        "name": "会社がBlanket Lビザの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "アメリカにある子会社の売り上げの合計が25百万ドル以上です", "operator": "OR"},
            {"fact": "アメリカにある子会社が1,000人以上ローカル採用をしています", "operator": "OR"},
            {"fact": "1年間に10人以上Lビザのペティション申請をしています", "operator": "OR"}
        ],
        "actions": [
            {"fact": "会社がBlanket Lビザの条件を満たします", "value": True}
        ],
        "priority": 13,
        "flag": True,
        "description": "Blanket Lビザの会社要件"
    },
    {
        "id": 14,
        "name": "申請者がBlanket Lビザの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "直近3年のうち1年以上、アメリカ以外のグループ会社に所属していました", "operator": "AND"},
            {"fact": "Blanket Lビザのマネージャーまたはスタッフの条件を満たします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "申請者がBlanket Lビザの条件を満たします", "value": True}
        ],
        "priority": 14,
        "flag": True,
        "description": "Blanket Lビザの申請者要件"
    },
    {
        "id": 15,
        "name": "Blanket Lビザのマネージャーまたはスタッフの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "Blanket Lビザのマネージャーの条件を満たします", "operator": "OR"},
            {"fact": "Blanket Lビザスタッフの条件を満たします", "operator": "OR"}
        ],
        "actions": [
            {"fact": "Blanket Lビザのマネージャーまたはスタッフの条件を満たします", "value": True}
        ],
        "priority": 15,
        "flag": True,
        "description": "マネージャーまたはスタッフの判定"
    },
    {
        "id": 16,
        "name": "Blanket Lビザのマネージャーの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "マネージャーとしての経験があります", "operator": "AND"},
            {"fact": "アメリカでの業務はマネージャーとみなされます", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Blanket Lビザのマネージャーの条件を満たします", "value": True}
        ],
        "priority": 16,
        "flag": True,
        "description": "Blanket Lビザマネージャー条件"
    },
    {
        "id": 17,
        "name": "Blanket Lビザスタッフの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "specialized knowledgeがあります", "operator": "AND"},
            {"fact": "アメリカでの業務はspecialized knowledgeを必要とします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Blanket Lビザスタッフの条件を満たします", "value": True}
        ],
        "priority": 17,
        "flag": True,
        "description": "Blanket Lビザスタッフ（専門知識）条件"
    },

    # Individual Lビザ (ルール18-21)
    {
        "id": 18,
        "name": "Lビザ（Individual）での申請ができます",
        "visa_type": "L",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "アメリカ以外からアメリカへのグループ内での異動です", "operator": "AND"},
            {"fact": "申請者がLビザ（Individual）の条件を満たします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Lビザ（Individual）での申請ができます", "value": True}
        ],
        "priority": 18,
        "flag": True,
        "description": "Individual Lビザの申請可能性"
    },
    {
        "id": 19,
        "name": "申請者がLビザ（Individual）の条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "直近3年のうち1年以上、アメリカ以外のグループ会社に所属していました", "operator": "AND"},
            {"fact": "Lビザ（Individual）のマネージャーまたはスタッフの条件を満たします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "申請者がLビザ（Individual）の条件を満たします", "value": True}
        ],
        "priority": 19,
        "flag": True,
        "description": "Individual Lビザの申請者要件"
    },
    {
        "id": 20,
        "name": "Lビザ（Individual）のマネージャーの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "マネージャーとしての経験があります", "operator": "AND"},
            {"fact": "アメリカでの業務はマネージャーとみなされます", "operator": "AND"},
            {"fact": "アメリカでは大卒、フルタイムの部下が2名以上います", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Lビザ（Individual）のマネージャーの条件を満たします", "value": True}
        ],
        "priority": 20,
        "flag": True,
        "description": "Individual Lビザマネージャー条件"
    },
    {
        "id": 21,
        "name": "Lビザ（Individual）のスタッフの条件を満たします",
        "visa_type": "L",
        "rule_type": "#m",
        "conditions": [
            {"fact": "specialized knowledgeがあります", "operator": "AND"},
            {"fact": "アメリカでの業務はspecialized knowledgeを必要とします", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Lビザ（Individual）のスタッフの条件を満たします", "value": True}
        ],
        "priority": 21,
        "flag": True,
        "description": "Individual Lビザスタッフ条件"
    },

    # ============= H-1Bビザ (ルール22) =============
    {
        "id": 22,
        "name": "H-1Bビザでの申請ができます",
        "visa_type": "H-1B",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "大卒以上で、専攻内容と業務内容が一致しています", "operator": "OR"},
            {"fact": "大卒以上で、専攻内容と業務内容が異なりますが、実務経験が3年以上あります", "operator": "OR"},
            {"fact": "大卒以上ではありませんが、実務経験が(高卒は12年以上、高専卒は3年以上）あります", "operator": "OR"}
        ],
        "actions": [
            {"fact": "H-1Bビザでの申請ができます", "value": True}
        ],
        "priority": 22,
        "flag": True,
        "description": "H-1Bビザの学歴・経験要件"
    },

    # ============= Bビザ関連 (ルール23-27) =============
    {
        "id": 23,
        "name": "Bビザの申請ができます",
        "visa_type": "B",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "Bビザの申請条件を満たす（ESTAの認証は通る）", "operator": "OR"},
            {"fact": "Bビザの申請条件を満たす（ESTAの認証は通らない）", "operator": "OR"}
        ],
        "actions": [
            {"fact": "Bビザの申請ができます", "value": True}
        ],
        "priority": 23,
        "flag": True,
        "description": "Bビザ申請可能性"
    },
    {
        "id": 24,
        "name": "Bビザの申請条件を満たす（ESTAの認証は通る）",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "アメリカでの活動は商用の範囲です", "operator": "AND"},
            {"fact": "1回の滞在期間は90日を越えます", "operator": "AND"},
            {"fact": "1回の滞在期間は6か月を越えません", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Bビザの申請条件を満たす（ESTAの認証は通る）", "value": True}
        ],
        "priority": 24,
        "flag": True,
        "description": "Bビザ（ESTA対象国、長期滞在）"
    },
    {
        "id": 25,
        "name": "Bビザの申請条件を満たす（ESTAの認証は通らない）",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "アメリカでの活動は商用の範囲です", "operator": "AND"},
            {"fact": "1回の滞在期間は6か月を越えません", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Bビザの申請条件を満たす（ESTAの認証は通らない）", "value": True}
        ],
        "priority": 25,
        "flag": True,
        "description": "Bビザ（ESTA非対象国）"
    },
    {
        "id": 26,
        "name": "契約書に基づくBビザの申請ができます",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "アメリカの会社に販売した装置や設備のための作業をします", "operator": "AND"},
            {"fact": "装置や設備の販売を示す契約書や発注書があります", "operator": "AND"},
            {"fact": "1回の滞在期間は6か月を越えません", "operator": "AND"}
        ],
        "actions": [
            {"fact": "契約書に基づくBビザの申請ができます", "value": True}
        ],
        "priority": 26,
        "flag": True,
        "description": "契約に基づく機器設置等のBビザ"
    },
    {
        "id": 27,
        "name": "B-1 in lieu of H-1Bビザの申請ができます",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "H-1Bビザが必要な専門性の高い作業をします", "operator": "AND"},
            {"fact": "1回の滞在期間は6か月を越えません", "operator": "AND"}
        ],
        "actions": [
            {"fact": "B-1 in lieu of H-1Bビザの申請ができます", "value": True}
        ],
        "priority": 27,
        "flag": True,
        "description": "H-1B相当の業務のBビザ"
    },

    # ============= J-1ビザ (ルール28) =============
    {
        "id": 28,
        "name": "J-1ビザの申請ができます",
        "visa_type": "J-1",
        "rule_type": "#i1",
        "conditions": [
            {"fact": "研修にOJTが含まれます", "operator": "AND"},
            {"fact": "研修期間は18か月以内です", "operator": "AND"},
            {"fact": "申請者に研修に必要な英語力はあります", "operator": "AND"}
        ],
        "actions": [
            {"fact": "J-1ビザの申請ができます", "value": True}
        ],
        "priority": 28,
        "flag": True,
        "description": "J-1研修ビザの条件"
    },

    # ============= Bビザ（研修） (ルール29-30) =============
    {
        "id": 29,
        "name": "Bビザ（研修）の申請ができます",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "研修内容は商用の範囲です", "operator": "AND"},
            {"fact": "研修期間は６か月以内です", "operator": "AND"}
        ],
        "actions": [
            {"fact": "Bビザの申請ができます", "value": True}
        ],
        "priority": 29,
        "flag": True,
        "description": "研修目的のBビザ"
    },
    {
        "id": 30,
        "name": "B-1 in lieu of H3ビザの申請ができます",
        "visa_type": "B",
        "rule_type": "#m",
        "conditions": [
            {"fact": "研修内容は商用の範囲です", "operator": "AND"},
            {"fact": "研修期間は６か月以内です", "operator": "AND"}
        ],
        "actions": [
            {"fact": "B-1 in lieu of H3ビザの申請ができます", "value": True}
        ],
        "priority": 30,
        "flag": True,
        "description": "H3相当の研修のBビザ"
    }
]

# ゴール（診断で達成したい結論）
VISA_GOALS = [
    "Eビザでの申請ができます",
    "Blanket Lビザでの申請ができます",
    "Lビザ（Individual）での申請ができます",
    "H-1Bビザでの申請ができます",
    "Bビザの申請ができます",
    "契約書に基づくBビザの申請ができます",
    "B-1 in lieu of H-1Bビザの申請ができます",
    "J-1ビザの申請ができます",
    "B-1 in lieu of H3ビザの申請ができます"
]
