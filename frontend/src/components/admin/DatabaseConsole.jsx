import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function DatabaseConsole() {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableData, setTableData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, page)
    }
  }, [selectedTable, page])

  const fetchTables = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/database/tables`)
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error) {
      console.error('テーブル取得エラー:', error)
      setMessage('テーブル一覧の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTableData = async (tableName, pageNum) => {
    setIsLoading(true)
    try {
      const offset = pageNum * pageSize
      const response = await fetch(
        `${API_BASE_URL}/api/admin/database/tables/${tableName}?limit=${pageSize}&offset=${offset}`
      )
      const data = await response.json()
      setTableData(data)
    } catch (error) {
      console.error('データ取得エラー:', error)
      setMessage('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/database/export`)
      const data = await response.json()

      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `database_export_${new Date().toISOString()}.json`
      a.click()
      URL.revokeObjectURL(url)

      setMessage('データベースをエクスポートしました')
    } catch (error) {
      console.error('エクスポートエラー:', error)
      setMessage('エクスポートに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const totalPages = tableData ? Math.ceil(tableData.total_count / pageSize) : 0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">データベース管理</h2>
          <p className="text-gray-600 mt-1">テーブル閲覧・データエクスポート（システムイメージ.txt 行124-143）</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isLoading}
          className="border-2 border-gray-600 bg-white hover:bg-gray-100 text-gray-800 px-6 py-2 font-semibold transition duration-200 disabled:opacity-50"
        >
          エクスポート
        </button>
      </div>

      {message && (
        <div className="bg-white border-2 border-gray-400 text-gray-800 px-4 py-3">
          {message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* 左側: テーブル一覧 */}
        <div className="bg-white border shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">テーブル一覧</h3>
          <div className="space-y-2">
            {tables.map(table => (
              <button
                key={table}
                onClick={() => {
                  setSelectedTable(table)
                  setPage(0)
                }}
                className={`w-full text-left px-4 py-2 rounded transition duration-200 ${
                  selectedTable === table
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm font-medium">{table}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 右側: テーブルデータ */}
        <div className="col-span-3 bg-white border shadow p-6">
          {selectedTable ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedTable}
                </h3>
                {tableData && (
                  <div className="text-sm text-gray-600">
                    全{tableData.total_count}件（{page * pageSize + 1}～
                    {Math.min((page + 1) * pageSize, tableData.total_count)}件を表示）
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-gray-600 mt-2">読み込み中...</p>
                </div>
              ) : tableData ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          {tableData.columns.map(col => (
                            <th key={col} className="px-4 py-2 text-left font-semibold text-gray-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b hover:bg-gray-50">
                            {tableData.columns.map(col => (
                              <td key={col} className="px-4 py-2 text-gray-800">
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

                  {/* ページネーション */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        前へ
                      </button>
                      <span className="text-gray-700">
                        ページ {page + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        次へ
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20">
              テーブルを選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DatabaseConsole
