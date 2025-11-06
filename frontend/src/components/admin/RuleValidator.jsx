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
        return 'bg-white border-2 border-red-600 text-red-800'
      case 'medium':
        return 'bg-white border-2 border-yellow-600 text-yellow-800'
      case 'low':
        return 'bg-white border border-blue-600 text-blue-800'
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
          <p className="text-gray-600 mt-1">ルールの問題を自動診断（システムイメージ.txt 行115-121準拠）</p>
        </div>
        <button
          onClick={runValidation}
          disabled={isLoading}
          className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 text-lg font-semibold transition duration-200"
        >
          整合性チェック実行
        </button>
      </div>

      {/* 総合結果 - システムイメージ.txt 行115-121準拠 */}
      {validationResults && (
        <div className={`border-l-4 ${isValid ? 'border-green-600' : 'border-red-600'} bg-white p-8`}>
          <div>
            <h3 className={`text-3xl font-bold ${isValid ? 'text-green-700' : 'text-red-700'}`}>
              {isValid ? '問題ありません' : '問題が見つかりました'}
            </h3>
            <p className="text-base text-gray-700 mt-3">
              {isValid
                ? 'ルールは正しく設定されています。'
                : '以下の問題を確認してください。'
              }
            </p>
          </div>
        </div>
      )}

      {/* 矛盾の検出結果 - システムイメージ.txt 行118準拠 */}
      {validationResults && validationResults.contradictions && validationResults.contradictions.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-red-700 mb-4 border-b pb-2">
            このルールは他のルールと矛盾しています ({validationResults.contradictions.length}件)
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

      {/* 到達不可能なルール - システムイメージ.txt 行119準拠 */}
      {validationResults && validationResults.unreachable_rules && validationResults.unreachable_rules.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-red-700 mb-4 border-b pb-2">
            このルールには到達できません ({validationResults.unreachable_rules.length}件)
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

      {/* 循環参照 - システムイメージ.txt 行120準拠 */}
      {validationResults && validationResults.circular_references && validationResults.circular_references.length > 0 && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-red-700 mb-4 border-b pb-2">
            ルールが循環しています ({validationResults.circular_references.length}件)
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
