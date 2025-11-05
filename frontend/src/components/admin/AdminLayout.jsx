import { Link, Outlet, useLocation } from 'react-router-dom'

function AdminLayout() {
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: '統計・ダッシュボード', icon: '📊' },
    { path: '/admin/rules', label: 'ルール管理', icon: '📋' },
    { path: '/admin/validator', label: '整合性チェック', icon: '✓' },
    { path: '/admin/database', label: 'DB管理', icon: '🗄️' },
    { path: '/admin/sql', label: 'SQLコンソール', icon: '💻' },
  ]

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">管理画面</h1>
          <p className="text-sm text-gray-200 mt-1">
            ルール・データベース管理（システムイメージ.txt 行108-143準拠）
          </p>
        </div>
        <Link
          to="/"
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100 transition duration-200 font-semibold"
        >
          診断画面に戻る
        </Link>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* サイドバー */}
        <nav className="w-64 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">メニュー</h2>
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* コンテンツエリア */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
