import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function RuleValidator() {
  const [validationResults, setValidationResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    runValidation()
  }, [])

  const runValidation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rules/validation/check`)
      const data = await response.json()
      setValidationResults(data.results)
      setIsValid(data.is_valid)
    } catch (error) {
      console.error('整合性チェックエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-white border-2 border-gray-600 text-gray-800'
      case 'medium':
        return 'bg-white border-2 border-gray-500 text-gray-800'
      case 'low':
        return 'bg-white border border-gray-400 text-gray-800'
      default:
        return 'bg-gray-100 border border-gray-300 text-gray-800'
    }
  }

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return '不明'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="text-gray-600 mt-4">整合性チェック実行中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">整合性チェック</h2>
          <p className="text-gray-600 mt-1">ルール間の矛盾・循環参照・到達不可能ルールの検出（システムイメージ.txt 行117-120）</p>
        </div>
        <button
          onClick={runValidation}
          disabled={isLoading}
          className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 font-semibold transition duration-200"
        >
          再チェック
        </button>
      </div>

      {/* 総合結果 */}
      {validationResults && (
        <div className="border-l-4 border-gray-600 bg-gray-50 p-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              {isValid ? '整合性チェック: 合格' : '整合性チェック: 問題検出'}
            </h3>
            <p className="text-sm text-gray-700 mt-2">
              {isValid
                ? '全てのルールは整合性が取れています。システムは正常に動作します。'
                : '以下の問題が検出されました。修正が必要です。'
              }
            </p>
          </div>
        </div>
      )}

      {/* 矛盾の検出結果 */}
      {validationResults && validationResults.contradictions && validationResults.contradictions.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            ルール間の矛盾 ({validationResults.contradictions.length}件)
          </h3>
          <div className="space-y-3">
            {validationResults.contradictions.map((issue, index) => (
              <div
                key={index}
                className={`border p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">矛盾 #{index + 1}</span>
                  <span className="text-xs px-2 py-1 border border-gray-400 bg-gray-100">
                    重要度: {getSeverityLabel(issue.severity)}
                  </span>
                </div>
                <p className="text-sm mb-2">{issue.message}</p>
                <div className="text-xs">
                  <strong>関連ルール:</strong> {issue.rule_ids.join(', ')}
                </div>
                <div className="text-xs mt-1">
                  <strong>事実:</strong> {issue.fact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 到達不可能なルール */}
      {validationResults && validationResults.unreachable_rules && validationResults.unreachable_rules.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            到達不可能なルール ({validationResults.unreachable_rules.length}件)
          </h3>
          <div className="space-y-3">
            {validationResults.unreachable_rules.map((issue, index) => (
              <div
                key={index}
                className={`border p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">ルール #{issue.rule_id}</span>
                  <span className="text-xs px-2 py-1 border border-gray-400 bg-gray-100">
                    重要度: {getSeverityLabel(issue.severity)}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  <strong>{issue.rule_name}</strong>
                </div>
                <p className="text-sm mb-2">{issue.message}</p>
                <div className="text-xs">
                  <strong>満たせない条件:</strong>{' '}
                  {issue.impossible_conditions.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 循環参照 */}
      {validationResults && validationResults.circular_references && validationResults.circular_references.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            循環参照 ({validationResults.circular_references.length}件)
          </h3>
          <div className="space-y-3">
            {validationResults.circular_references.map((issue, index) => (
              <div
                key={index}
                className={`border p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">循環 #{index + 1}</span>
                  <span className="text-xs px-2 py-1 border border-gray-400 bg-gray-100">
                    重要度: {getSeverityLabel(issue.severity)}
                  </span>
                </div>
                <p className="text-sm mb-2">{issue.message}</p>
                <div className="text-xs mb-2">
                  <strong>循環パス:</strong>
                  <div className="mt-1 bg-gray-100 p-2 border border-gray-300 font-mono text-xs">
                    {issue.cycle.join(' → ')} → {issue.cycle[0]}
                  </div>
                </div>
                <div className="text-xs">
                  <strong>関連ルール:</strong> {issue.involved_rules.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 孤立した事実 */}
      {validationResults && validationResults.orphaned_facts && validationResults.orphaned_facts.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
            孤立した事実 ({validationResults.orphaned_facts.length}件)
          </h3>
          <div className="space-y-3">
            {validationResults.orphaned_facts.map((issue, index) => (
              <div
                key={index}
                className={`border p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">事実 #{index + 1}</span>
                  <span className="text-xs px-2 py-1 border border-gray-400 bg-gray-100">
                    重要度: {getSeverityLabel(issue.severity)}
                  </span>
                </div>
                <p className="text-sm mb-2">{issue.message}</p>
                <div className="text-xs mb-1">
                  <strong>事実名:</strong> {issue.fact}
                </div>
                <div className="text-xs">
                  <strong>導出するルール:</strong> {issue.deriving_rules.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 問題なしの場合 */}
      {validationResults && isValid && (
        <div className="bg-white border shadow p-6 text-center py-10">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            全てのチェックをパスしました
          </h3>
          <p className="text-gray-600">
            ルールシステムは正常に動作します。
          </p>
        </div>
      )}
    </div>
  )
}

export default RuleValidator
