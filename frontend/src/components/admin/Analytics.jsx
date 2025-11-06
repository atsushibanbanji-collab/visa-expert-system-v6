import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Analytics() {
  const [stats, setStats] = useState(null)
  const [questionPaths, setQuestionPaths] = useState(null)
  const [auditLog, setAuditLog] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">統計・分析ダッシュボード</h2>
          <p className="text-gray-600 mt-1">診断履歴の統計・質問パス分析（システムイメージ.txt 行139-140）</p>
        </div>
        <button
          onClick={fetchAllData}
          className="border-2 border-gray-600 bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 font-semibold transition duration-200"
        >
          更新
        </button>
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
