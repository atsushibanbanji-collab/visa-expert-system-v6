function ResultPanel({ result, answers, onReset }) {
  if (!result) return null

  const applicableVisas = result.applicable_visas || []

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">診断結果</h2>
          <p className="text-gray-600">以下のビザタイプが申請可能です</p>
        </div>

        {/* 申請可能なビザ */}
        <div className="mb-8">
          {applicableVisas.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-green-700 mb-4">
                ✅ 申請可能なビザ ({applicableVisas.length}件)
              </h3>
              {applicableVisas.map((visa, index) => (
                <div
                  key={index}
                  className="bg-green-50 border-2 border-green-300 rounded-lg p-6"
                >
                  <h4 className="text-lg font-bold text-green-900 mb-2">{visa}</h4>
                  <p className="text-sm text-green-800">
                    このビザタイプの条件を満たしています
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                申請可能なビザが見つかりませんでした
              </h3>
              <p className="text-yellow-700">
                現在の回答内容では、申請条件を満たすビザタイプがありません。
              </p>
            </div>
          )}
        </div>

        {/* すべてのビザタイプの評価結果 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            全ビザタイプの評価結果
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.all_goals).map(([visa, achieved]) => (
              <div
                key={visa}
                className={`border-2 rounded-lg p-4 ${
                  achieved
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{visa}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    achieved
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-400 text-white'
                  }`}>
                    {achieved ? '✓ 可能' : '✗ 不可'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 回答サマリー */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            回答サマリー ({answers.length}問)
          </h3>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {answers.map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-600">Q{index + 1}:</span>{' '}
                  <span className="text-gray-800">{item.question}</span>
                  {' '}→{' '}
                  <span className={`font-semibold ${
                    item.answer === 'yes' ? 'text-green-600' :
                    item.answer === 'no' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {item.answer === 'yes' ? 'はい' :
                     item.answer === 'no' ? 'いいえ' :
                     'わからない'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="text-center">
          <button
            onClick={onReset}
            className="bg-primary hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            新しい診断を開始する
          </button>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">⚠️ ご注意</h4>
          <p className="text-xs text-blue-800">
            この診断結果は、あくまで参考情報です。実際のビザ申請には、個別の状況に応じた詳細な確認が必要です。
            必ず専門家（移民弁護士等）にご相談ください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResultPanel
