import { useState } from 'react'

function DiagnosisPanel({ currentQuestion, answers, onAnswer, onBack, onReset, isLoading }) {
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
                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">質問 {index + 1}:</p>
                  <p className="text-gray-800 font-medium mb-2">{item.question}</p>
                  <p className="text-sm">
                    回答: <span className={`font-semibold ${
                      item.answer === 'yes' ? 'text-green-600' :
                      item.answer === 'no' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
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

        {/* 現在の質問 */}
        {currentQuestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              質問 {answers.length + 1}
            </h3>
            <p className="text-xl text-gray-800 mb-6">{currentQuestion}</p>

            {/* 回答ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => onAnswer('yes')}
                disabled={isLoading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                はい
              </button>
              <button
                onClick={() => onAnswer('no')}
                disabled={isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                いいえ
              </button>
              <button
                onClick={() => onAnswer('unknown')}
                disabled={isLoading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                わからない
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-600 mt-2">処理中...</p>
          </div>
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div className="border-t border-gray-300 p-4 bg-gray-50">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={answers.length === 0 || isLoading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前の質問に戻る
          </button>
          <button
            onClick={onReset}
            disabled={isLoading}
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            最初から
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosisPanel
