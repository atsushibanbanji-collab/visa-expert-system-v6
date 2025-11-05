import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function SQLConsole() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(true)
  const [queryHistory, setQueryHistory] = useState([])

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('クエリを入力してください')
      return
    }

    setIsLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          read_only: readOnly
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data)
        setQueryHistory(prev => [{ query, timestamp: new Date(), success: true }, ...prev.slice(0, 9)])
      } else {
        setError(data.detail || 'クエリの実行に失敗しました')
        setQueryHistory(prev => [{ query, timestamp: new Date(), success: false }, ...prev.slice(0, 9)])
      }
    } catch (err) {
      setError('サーバーエラーが発生しました: ' + err.message)
      setQueryHistory(prev => [{ query, timestamp: new Date(), success: false }, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistoryQuery = (historyQuery) => {
    setQuery(historyQuery)
  }

  const clearResults = () => {
    setResults(null)
    setError('')
  }

  const sampleQueries = [
    {
      label: '全セッション取得',
      query: 'SELECT * FROM consultation_sessions LIMIT 10'
    },
    {
      label: '完了した診断の数',
      query: 'SELECT COUNT(*) as total FROM consultation_sessions WHERE status = \'completed\''
    },
    {
      label: 'よく使われる質問トップ10',
      query: 'SELECT fact_name, COUNT(*) as count FROM consultation_answers GROUP BY fact_name ORDER BY count DESC LIMIT 10'
    },
    {
      label: '監査ログ（最新10件）',
      query: 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
    }
  ]

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">SQLコンソール</h2>
        <p className="text-gray-600 mt-1">SQLクエリ実行・データベース操作（システムイメージ.txt 行134）</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 左側: クエリ入力 */}
        <div className="col-span-2 space-y-4">
          {/* モード切替 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={readOnly}
                  onChange={() => setReadOnly(true)}
                  className="mr-2"
                />
                <span className="text-gray-700">読み取り専用（SELECT のみ）</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!readOnly}
                  onChange={() => setReadOnly(false)}
                  className="mr-2"
                />
                <span className="text-gray-700 text-red-600 font-semibold">
                  書き込み可能（⚠️危険）
                </span>
              </label>
            </div>
          </div>

          {/* クエリエディタ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">SQLクエリ</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM table_name..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded font-mono text-sm"
              style={{ fontFamily: 'monospace' }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={executeQuery}
                disabled={isLoading || !query.trim()}
                className="flex-1 bg-primary hover:bg-blue-800 text-white font-semibold py-3 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '実行中...' : '実行'}
              </button>
              <button
                onClick={clearResults}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded transition duration-200"
              >
                クリア
              </button>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded">
              <strong>エラー:</strong> {error}
            </div>
          )}

          {/* 結果表示 */}
          {results && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">実行結果</h3>

              {results.success && results.rows ? (
                <div>
                  <div className="mb-2 text-sm text-gray-600">
                    {results.row_count}件の結果
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          {results.columns.map(col => (
                            <th key={col} className="px-4 py-2 text-left font-semibold text-gray-700 border-r">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b hover:bg-gray-50">
                            {results.columns.map(col => (
                              <td key={col} className="px-4 py-2 text-gray-800 border-r">
                                {typeof row[col] === 'object'
                                  ? JSON.stringify(row[col])
                                  : String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : results.success && results.rows_affected !== undefined ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                  {results.message} （{results.rows_affected}行が影響を受けました）
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 右側: サンプルクエリ & 履歴 */}
        <div className="space-y-4">
          {/* サンプルクエリ */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">サンプルクエリ</h3>
            <div className="space-y-2">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => loadHistoryQuery(sample.query)}
                  className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition duration-200"
                >
                  <div className="font-semibold text-gray-800">{sample.label}</div>
                  <div className="text-xs text-gray-600 mt-1 font-mono truncate">
                    {sample.query}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* クエリ履歴 */}
          {queryHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">実行履歴</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {queryHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => loadHistoryQuery(item.query)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition duration-200 ${
                      item.success
                        ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                        : 'bg-red-50 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-xs">
                        {item.success ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate text-gray-700">
                      {item.query}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SQLConsole
