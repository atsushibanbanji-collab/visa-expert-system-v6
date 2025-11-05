function InferencePanel({ rules, workingMemory, currentQuestion }) {
  // 条件の色を決定
  const getConditionColor = (fact) => {
    if (!workingMemory) return 'text-gray-500'

    // findingsから確認
    if (fact in workingMemory.findings) {
      return workingMemory.findings[fact] ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
    }

    // hypothesesから確認（導出された事実）
    if (fact in workingMemory.hypotheses) {
      return workingMemory.hypotheses[fact] ? 'text-purple-600 font-semibold' : 'text-red-600 font-semibold'
    }

    // 未確認
    return 'text-gray-500'
  }

  // ルールの状態による背景色
  const getRuleBackground = (rule) => {
    if (!rule.status) return 'bg-white'

    switch (rule.status) {
      case 'fired':
        return 'bg-blue-50 border-blue-300'
      case 'failed':
      case 'skipped':
        return 'bg-gray-50 border-gray-200 opacity-60'
      case 'evaluating':
        return 'bg-yellow-50 border-yellow-300'
      default:
        return 'bg-white border-gray-200'
    }
  }

  // ルールの状態バッジ
  const getRuleStatusBadge = (status) => {
    if (!status || status === 'not_evaluated') return null

    const badges = {
      'fired': <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded">発火済み</span>,
      'evaluating': <span className="px-2 py-1 text-xs font-semibold bg-yellow-500 text-white rounded">評価中</span>,
      'failed': <span className="px-2 py-1 text-xs font-semibold bg-gray-400 text-white rounded">失敗</span>,
      'skipped': <span className="px-2 py-1 text-xs font-semibold bg-gray-400 text-white rounded">スキップ</span>
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

      {/* 凡例 */}
      <div className="bg-white border-b border-gray-300 px-6 py-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">凡例</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-500 rounded"></span>
            <span>未確認</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-600 rounded"></span>
            <span>Yes（条件満たす）</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-600 rounded"></span>
            <span>No（条件満たさず）</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-purple-600 rounded"></span>
            <span>導出された事実</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded"></span>
            <span>発火済みルール</span>
          </div>
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
                      className={`border-2 rounded-lg p-4 transition-all ${getRuleBackground(rule)}`}
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

                      {/* 結論部 (THEN) */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">THEN（結論）:</p>
                        <div className="pl-3">
                          {rule.actions.map((action, idx) => (
                            <p key={idx} className={`text-sm font-semibold ${
                              workingMemory && action.fact in workingMemory.hypotheses
                                ? 'text-blue-600'
                                : 'text-gray-600'
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
