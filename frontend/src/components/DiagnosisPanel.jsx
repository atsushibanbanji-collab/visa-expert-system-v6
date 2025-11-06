import { useState } from 'react'

function DiagnosisPanel({ currentQuestion, answers, onAnswer, onBack, onReset, isLoading, detailQuestionsMode, detailQuestionsContext }) {
  return (
    <div className="w-1/2 border-r border-gray-300 flex flex-col bg-white">
      {/* パネルヘッダー */}
      <div className="bg-gray-100 border-b border-gray-300 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-800">診断画面</h2>
        <p className="text-sm text-gray-600 mt-1">質問に回答してください</p>
      </div>

      {/* 回答履歴 */}
      <div className="flex-1 overflow-y-auto p-6">
        {answers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">回答履歴</h3>
            <div className="space-y-2">
              {answers.map((item, index) => (
                <div key={index} className="bg-white p-3 border border-gray-300">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">質問 {index + 1}</p>
                  <p className="text-gray-800 font-medium mb-2">{item.question}</p>
                  <p className="text-sm text-gray-700">
                    回答: <span className="font-semibold text-gray-800">
                      {item.answer === 'yes' ? 'はい' :
                       item.answer === 'no' ? 'いいえ' :
                       'わからない'}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 詳細質問モードの説明 */}
        {detailQuestionsMode && detailQuestionsContext && (
          <div className="bg-gray-50 border-l-4 border-gray-600 p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              詳細質問モード
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              前の質問「<span className="font-medium">{detailQuestionsContext}</span>」に対して
              「わからない」と回答されました。
            </p>
            <p className="text-sm text-gray-600">
              この事実を判定するため、より具体的な質問をします。これらの回答から推論エンジンが結論を導出します。
            </p>
          </div>
        )}

        {/* 現在の質問 */}
        {currentQuestion && (
          <div className="bg-white border-2 border-gray-300 p-6">
            <h3 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">
              質問 {answers.length + 1}
            </h3>
            <p className="text-xl text-gray-800 mb-6 font-medium">{currentQuestion}</p>

            {/* 回答ボタン */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onAnswer('yes')}
                disabled={isLoading}
                className="border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                はい
              </button>
              <button
                onClick={() => onAnswer('no')}
                disabled={isLoading}
                className="border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                いいえ
              </button>
              <button
                onClick={() => onAnswer('unknown')}
                disabled={isLoading}
                className="border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                わからない
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="text-gray-600 mt-2">処理中...</p>
          </div>
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div className="border-t border-gray-300 p-4 bg-white">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onBack}
            disabled={answers.length === 0 || isLoading}
            className="border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            前の質問に戻る
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="border-2 border-gray-400 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            最初から
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosisPanel
