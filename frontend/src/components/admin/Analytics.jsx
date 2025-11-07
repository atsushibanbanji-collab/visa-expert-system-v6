import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Analytics() {
  const [stats, setStats] = useState(null)
  const [questionPaths, setQuestionPaths] = useState(null)
  const [auditLog, setAuditLog] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [ruleDependencies, setRuleDependencies] = useState(null)
  const [showDependencies, setShowDependencies] = useState(false)
  const [showPathAnalysis, setShowPathAnalysis] = useState(false)
  const [showReportGeneration, setShowReportGeneration] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, pathsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/analytics/consultation-stats`),
        fetch(`${API_BASE_URL}/api/admin/analytics/question-paths`),
        fetch(`${API_BASE_URL}/api/admin/analytics/audit-log?limit=20`)
      ])

      const statsData = await statsRes.json()
      const pathsData = await pathsRes.json()
      const auditData = await auditRes.json()

      setStats(statsData)
      setQuestionPaths(pathsData)
      setAuditLog(auditData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ルール依存関係を表示（システムイメージ.txt 行145準拠）
  const handleShowRuleDependencies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rules/validation/check`)
      const data = await response.json()
      setRuleDependencies(data)
      setShowDependencies(true)
    } catch (error) {
      console.error('依存関係取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 診断パス分析（システムイメージ.txt 行146準拠）
  const handleShowPathAnalysis = () => {
    setShowPathAnalysis(true)
  }

  // 統計レポート生成（システムイメージ.txt 行147準拠）
  const handleGenerateReport = () => {
    setShowReportGeneration(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="text-gray-600 mt-4">データ読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">統計・分析ダッシュボード</h2>
        <p className="text-gray-600 mb-4">ワンクリックで高度な分析（システムイメージ.txt 行144-147準拠）</p>

        {/* ワンクリック分析ボタン - システムイメージ.txt 行145-147準拠 */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleShowRuleDependencies}
            disabled={isLoading}
            className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 text-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            ルール依存関係を表示
          </button>
          <button
            onClick={handleShowPathAnalysis}
            disabled={isLoading}
            className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 text-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            診断パス分析
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 text-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            統計レポート生成
          </button>
        </div>
      </div>

      {/* 統計カード */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border shadow p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">総診断数</div>
            <div className="text-3xl font-bold text-gray-800">{stats.total_consultations}</div>
          </div>
          <div className="bg-white border shadow p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">完了診断数</div>
            <div className="text-3xl font-bold text-gray-800">{stats.completed_consultations}</div>
          </div>
          <div className="bg-white border shadow p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">完了率</div>
            <div className="text-3xl font-bold text-gray-800">
              {stats.total_consultations > 0
                ? Math.round((stats.completed_consultations / stats.total_consultations) * 100)
                : 0}%
            </div>
          </div>
          <div className="bg-white border shadow p-6">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">平均質問数</div>
            <div className="text-3xl font-bold text-gray-800">
              {Math.round(stats.average_questions * 10) / 10}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* ビザタイプ別統計 */}
        {stats && (
          <div className="bg-white border shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">ビザタイプ別結果</h3>
            <div className="space-y-3">
              {Object.entries(stats.visa_type_stats).map(([visaType, count]) => {
                const total = stats.completed_consultations
                const percentage = total > 0 ? (count / total) * 100 : 0

                return (
                  <div key={visaType}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{visaType}ビザ</span>
                      <span className="text-sm text-gray-600">{count}件 ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div
                        className="bg-blue-700 h-2 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* よく使われる質問 */}
        {questionPaths && (
          <div className="bg-white border shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">よく使われる質問 Top 10</h3>
            <div className="space-y-2">
              {questionPaths.most_common_questions.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
                  <div className="flex-shrink-0 w-8 text-center text-sm font-semibold text-gray-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 font-medium">{item.fact}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      使用回数: {item.usage_count}回 / 平均順位: {Math.round(item.average_order * 10) / 10}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 監査ログ */}
      {auditLog && (
        <div className="bg-white border shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">監査ログ（最新20件）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">時刻</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">操作</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">テーブル</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">レコードID</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-semibold ${
                        log.action === 'create' ? 'bg-green-700 text-white' :
                        log.action === 'update' ? 'bg-blue-700 text-white' :
                        log.action === 'delete' ? 'bg-red-700 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-800">{log.table_name}</td>
                    <td className="px-4 py-2 text-gray-800">{log.record_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ルール依存関係の表示 - システムイメージ.txt 行145準拠 */}
      {showDependencies && ruleDependencies && (
        <div className="bg-white border shadow p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-semibold text-gray-800">ルール依存関係マップ</h3>
            <button
              onClick={() => setShowDependencies(false)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              閉じる
            </button>
          </div>
          <div className="space-y-4">
            {ruleDependencies.results && Object.keys(ruleDependencies.results).length > 0 ? (
              <div className="text-sm">
                <p className="text-gray-600 mb-4">各ルールの依存関係と検証結果を表示しています。</p>
                <div className="bg-gray-50 border border-gray-300 p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(ruleDependencies, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">依存関係データがありません</p>
            )}
          </div>
        </div>
      )}

      {/* 診断パス分析 - システムイメージ.txt 行146準拠 */}
      {showPathAnalysis && questionPaths && (
        <div className="bg-white border shadow p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-semibold text-gray-800">診断パス分析レポート</h3>
            <button
              onClick={() => setShowPathAnalysis(false)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              閉じる
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-300 p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">全質問パス数</h4>
                <p className="text-2xl font-bold text-gray-800">{questionPaths.total_paths || 0}</p>
              </div>
              <div className="border border-gray-300 p-4 bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">ユニーク質問数</h4>
                <p className="text-2xl font-bold text-gray-800">{questionPaths.unique_questions || 0}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">よく使われる質問パターン</h4>
              <div className="space-y-2">
                {questionPaths.most_common_questions.slice(0, 15).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-300 bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-800 font-medium">{item.fact}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        使用: {item.usage_count}回 | 平均順位: {Math.round(item.average_order * 10) / 10}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 統計レポート生成 - システムイメージ.txt 行147準拠 */}
      {showReportGeneration && stats && (
        <div className="bg-white border shadow p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-semibold text-gray-800">統計レポート</h3>
            <button
              onClick={() => setShowReportGeneration(false)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              閉じる
            </button>
          </div>
          <div className="space-y-6">
            {/* サマリー */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">診断実績サマリー</h4>
              <div className="bg-gray-50 border border-gray-300 p-4">
                <p className="text-sm text-gray-800 leading-relaxed">
                  総診断数: <strong>{stats.total_consultations}件</strong><br/>
                  完了診断数: <strong>{stats.completed_consultations}件</strong><br/>
                  完了率: <strong>{stats.total_consultations > 0 ? Math.round((stats.completed_consultations / stats.total_consultations) * 100) : 0}%</strong><br/>
                  平均質問数: <strong>{Math.round(stats.average_questions * 10) / 10}問</strong>
                </p>
              </div>
            </div>

            {/* ビザタイプ別 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">ビザタイプ別結果</h4>
              <div className="bg-gray-50 border border-gray-300 p-4">
                {Object.entries(stats.visa_type_stats).map(([visaType, count]) => {
                  const percentage = stats.completed_consultations > 0
                    ? Math.round((count / stats.completed_consultations) * 100)
                    : 0
                  return (
                    <p key={visaType} className="text-sm text-gray-800 mb-2">
                      <strong>{visaType}ビザ:</strong> {count}件 ({percentage}%)
                    </p>
                  )
                })}
              </div>
            </div>

            {/* ダウンロード */}
            <div>
              <button
                onClick={() => {
                  const reportText = `統計レポート\n生成日時: ${new Date().toLocaleString()}\n\n【診断実績サマリー】\n総診断数: ${stats.total_consultations}件\n完了診断数: ${stats.completed_consultations}件\n完了率: ${stats.total_consultations > 0 ? Math.round((stats.completed_consultations / stats.total_consultations) * 100) : 0}%\n平均質問数: ${Math.round(stats.average_questions * 10) / 10}問\n\n【ビザタイプ別結果】\n${Object.entries(stats.visa_type_stats).map(([visaType, count]) => {
                    const percentage = stats.completed_consultations > 0 ? Math.round((count / stats.completed_consultations) * 100) : 0
                    return `${visaType}ビザ: ${count}件 (${percentage}%)`
                  }).join('\n')}`

                  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `統計レポート_${new Date().toISOString().split('T')[0]}.txt`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 text-sm font-semibold transition duration-200"
              >
                レポートをダウンロード
              </button>
            </div>
          </div>
        </div>
      )}

      {/* データがない場合 */}
      {!stats && !questionPaths && !auditLog && !isLoading && (
        <div className="bg-white shadow p-6 text-center py-20">
          <div className="text-gray-500 text-lg">データがありません</div>
          <p className="text-gray-400 text-sm mt-2">診断を実行すると統計が表示されます</p>
        </div>
      )}
    </div>
  )
}

export default Analytics
