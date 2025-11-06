function InferencePanel({ rules, workingMemory, currentQuestion }) {
  // 条件の色を決定（システムイメージ.txt 行86-91準拠）
  const getConditionColor = (fact) => {
    if (!workingMemory) return 'text-gray-500'

    // findingsから確認（ユーザーが直接回答した基本事実）
    if (fact in workingMemory.findings) {
      return workingMemory.findings[fact]
        ? 'text-green-700 font-bold'      // 緑：Yes（条件を満たす）
        : 'text-red-600 line-through'     // 赤：No（条件を満たさない）
    }

    // hypothesesから確認（他のルールの結論として導出された条件）
    if (fact in workingMemory.hypotheses) {
      return workingMemory.hypotheses[fact]
        ? 'text-purple-600 font-semibold underline'  // 紫+下線：導出された条件
        : 'text-red-600 line-through'                // 赤：導出されなかった
    }

    // 未確認
    return 'text-gray-500'  // グレー：未確認の条件
  }

  // ルールの状態による背景色
  const getRuleBackground = (rule) => {
    if (!rule.status) return 'bg-white border-gray-300'

    switch (rule.status) {
      case 'fired':
        return 'bg-white border-green-600'
      case 'failed':
      case 'skipped':
        return 'bg-white border-gray-300 opacity-40'
      case 'evaluating':
        return 'bg-white border-blue-600'
      default:
        return 'bg-white border-gray-300'
    }
  }

  // ルールの状態バッジ
  const getRuleStatusBadge = (status) => {
    if (!status || status === 'not_evaluated') return null

    const badges = {
      'fired': <span className="px-2 py-1 text-xs font-semibold bg-green-700 text-white">発火済み</span>,
      'evaluating': <span className="px-2 py-1 text-xs font-semibold border-2 border-blue-600 text-blue-700">評価中</span>,
      'failed': <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white">失敗</span>,
      'skipped': <span className="px-2 py-1 text-xs font-semibold bg-gray-500 text-white">スキップ</span>
    }

    return badges[status]
  }

  // 現在の質問に関連するルールのみ表示
  const getRelevantRules = () => {
    if (!rules || rules.length === 0) return []
    if (!currentQuestion && (!workingMemory || Object.keys(workingMemory.findings).length === 0)) {
      return []
    }

    // 質問されたことのある事実
    const askedFacts = workingMemory ? Object.keys(workingMemory.findings) : []
    const currentFact = currentQuestion ? [currentQuestion] : []
    const allFacts = [...askedFacts, ...currentFact]

    // これらの事実を含むルールを抽出
    return rules.filter(rule => {
      // 条件にこれらの事実が含まれているか
      const hasRelevantCondition = rule.conditions.some(cond =>
        allFacts.includes(cond.fact)
      )

      // 結論がこれらの事実を導出するか
      const hasRelevantAction = rule.actions.some(action =>
        allFacts.includes(action.fact)
      )

      // 発火済みのルールは常に表示
      const isFired = rule.status === 'fired'

      return hasRelevantCondition || hasRelevantAction || isFired
    })
  }

  const relevantRules = getRelevantRules()

  // ビザタイプごとにルールをグループ化
  const groupedRules = relevantRules.reduce((acc, rule) => {
    if (!acc[rule.visa_type]) {
      acc[rule.visa_type] = []
    }
    acc[rule.visa_type].push(rule)
    return acc
  }, {})

  return (
    <div className="w-1/2 flex flex-col bg-gray-50">
      {/* パネルヘッダー */}
      <div className="bg-gray-800 text-white px-6 py-4 border-b border-gray-700">
        <h2 className="text-xl font-bold">推論過程の可視化</h2>
        <p className="text-sm text-gray-300 mt-1">ルールの評価状態をリアルタイム表示</p>
      </div>

      {/* 凡例 - システムイメージ.txt 行86-94準拠 */}
      <div className="bg-white border-b border-gray-300 px-6 py-3">
        <h3 className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2">凡例</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <div>• 未確認: <span className="text-gray-500">グレー</span></div>
          <div>• Yes: <span className="font-bold text-green-700">緑</span></div>
          <div>• No: <span className="text-red-600 line-through">赤（取消線）</span></div>
          <div>• 導出された条件: <span className="font-semibold underline text-purple-600">紫（下線）</span></div>
          <div>• 導出された結論: <span className="font-bold text-blue-700">青</span></div>
        </div>
      </div>

      {/* ルール一覧 */}
      <div className="flex-1 overflow-y-auto p-6">
        {relevantRules.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>質問に回答すると、関連するルールがここに表示されます</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRules).map(([visaType, visaRules]) => (
              <div key={visaType} className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-300">
                  {visaType}ビザ関連ルール
                </h3>
                <div className="space-y-3">
                  {visaRules.map(rule => (
                    <div
                      key={rule.id}
                      className={`border-2 p-4 transition-all ${getRuleBackground(rule)}`}
                    >
                      {/* ルールヘッダー */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs text-gray-500 font-mono">Rule #{rule.id}</span>
                          <h4 className="text-sm font-semibold text-gray-800 mt-1">
                            {rule.name}
                          </h4>
                        </div>
                        {getRuleStatusBadge(rule.status)}
                      </div>

                      {/* 条件部 (IF) */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">IF（条件）:</p>
                        <div className="pl-3 space-y-1">
                          {rule.conditions.map((cond, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">
                                {idx > 0 && cond.operator === 'AND' ? '∧' : idx > 0 && cond.operator === 'OR' ? '∨' : '•'}
                              </span>
                              <p className={`text-sm ${getConditionColor(cond.fact)}`}>
                                {cond.fact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 結論部 (THEN) - システムイメージ.txt 行92-94準拠 */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">THEN（結論）:</p>
                        <div className="pl-3">
                          {rule.actions.map((action, idx) => (
                            <p key={idx} className={`text-sm ${
                              workingMemory && action.fact in workingMemory.hypotheses
                                ? 'text-blue-700 font-bold'      // 青：導出された結論
                                : 'text-gray-600 font-semibold'  // グレー：未導出の結論
                            }`}>
                              ⇒ {action.fact}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 作業記憶の状態 */}
      {workingMemory && (
        <div className="border-t border-gray-300 p-4 bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">作業記憶（Working Memory）</h3>
          <div className="text-xs space-y-1">
            <p className="text-gray-600">
              確認済み事実: {Object.keys(workingMemory.findings).length}個
            </p>
            <p className="text-gray-600">
              導出された仮説: {Object.keys(workingMemory.hypotheses).length}個
            </p>
            <p className="text-gray-600">
              発火したルール: {workingMemory.conflict_set ? workingMemory.conflict_set.length : 0}個
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default InferencePanel
