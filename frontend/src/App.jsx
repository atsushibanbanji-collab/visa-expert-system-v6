import { useState, useEffect } from 'react'
import DiagnosisPanel from './components/DiagnosisPanel'
import InferencePanel from './components/InferencePanel'
import ResultPanel from './components/ResultPanel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [rules, setRules] = useState([])
  const [workingMemory, setWorkingMemory] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [detailQuestionsMode, setDetailQuestionsMode] = useState(false)
  const [detailQuestionsContext, setDetailQuestionsContext] = useState(null)

  // 診断開始
  const startDiagnosis = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/consultation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visa_types: ["E", "B", "L", "H-1B", "J-1"]
        })
      })

      const data = await response.json()
      setSessionId(data.session_id)
      setCurrentQuestion(data.next_question)
      setAnswers([])
      setIsCompleted(false)
      setResult(null)

      // ルールと作業記憶を取得
      await fetchRulesAndMemory(data.session_id)
    } catch (error) {
      console.error('診断開始エラー:', error)
      alert('診断を開始できませんでした')
    } finally {
      setIsLoading(false)
    }
  }

  // ルールと作業記憶を取得
  const fetchRulesAndMemory = async (sid) => {
    try {
      const [rulesResponse, memoryResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/consultation/${sid}/rules`),
        fetch(`${API_BASE_URL}/api/consultation/${sid}/working-memory`)
      ])

      const rulesData = await rulesResponse.json()
      const memoryData = await memoryResponse.json()

      setRules(rulesData)
      setWorkingMemory(memoryData)
    } catch (error) {
      console.error('データ取得エラー:', error)
    }
  }

  // 回答を送信
  const submitAnswer = async (answer) => {
    if (!sessionId || !currentQuestion) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/consultation/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          fact: currentQuestion,
          answer: answer
        })
      })

      const data = await response.json()

      // 回答履歴に追加
      setAnswers(prev => [...prev, {
        question: currentQuestion,
        answer: answer
      }])

      // 詳細質問モードのチェック（システムイメージ.txt行56-62準拠）
      if (data.detail_questions_needed && data.detail_questions && data.detail_questions.length > 0) {
        // 「わからない」回答に対する詳細質問
        setDetailQuestionsMode(true)
        setDetailQuestionsContext(currentQuestion)  // 元の質問を保持
        setCurrentQuestion(data.next_question)
      } else {
        // 通常の質問フロー
        setDetailQuestionsMode(false)
        setDetailQuestionsContext(null)
        setCurrentQuestion(data.next_question)
        setIsCompleted(data.is_completed)
        setResult(data.result)
      }

      // ルールと作業記憶を更新
      await fetchRulesAndMemory(sessionId)
    } catch (error) {
      console.error('回答送信エラー:', error)
      alert('回答を送信できませんでした')
    } finally {
      setIsLoading(false)
    }
  }

  // 前の質問に戻る
  const goBack = () => {
    if (answers.length === 0) return
    // 簡略実装: 最初からやり直し
    alert('前の質問に戻る機能は、現在「最初から」と同じ動作です')
    resetDiagnosis()
  }

  // 最初からやり直し
  const resetDiagnosis = () => {
    setSessionId(null)
    setCurrentQuestion(null)
    setAnswers([])
    setRules([])
    setWorkingMemory(null)
    setIsCompleted(false)
    setResult(null)
    setDetailQuestionsMode(false)
    setDetailQuestionsContext(null)
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-primary text-white py-4 px-6 shadow-md">
        <h1 className="text-2xl font-bold">ビザ選定エキスパートシステム</h1>
        <p className="text-sm text-gray-200 mt-1">
          オブジェクト指向エキスパートシステム - バックワードチェイニング方式
        </p>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 開始画面 */}
        {!sessionId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ビザ診断を開始します
              </h2>
              <p className="text-gray-600 mb-8 max-w-md">
                このシステムは、あなたに適したビザタイプを診断します。
                質問に答えていくことで、E、B、L、H-1B、J-1ビザの申請可能性を判定します。
              </p>
              <button
                onClick={startDiagnosis}
                disabled={isLoading}
                className="bg-primary hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {isLoading ? '準備中...' : '診断を開始する'}
              </button>
            </div>
          </div>
        )}

        {/* 2分割画面 */}
        {sessionId && !isCompleted && (
          <>
            {/* 左側: 診断画面 */}
            <DiagnosisPanel
              currentQuestion={currentQuestion}
              answers={answers}
              onAnswer={submitAnswer}
              onBack={goBack}
              onReset={resetDiagnosis}
              isLoading={isLoading}
              detailQuestionsMode={detailQuestionsMode}
              detailQuestionsContext={detailQuestionsContext}
            />

            {/* 右側: 推論過程可視化 */}
            <InferencePanel
              rules={rules}
              workingMemory={workingMemory}
              currentQuestion={currentQuestion}
            />
          </>
        )}

        {/* 診断完了画面 */}
        {sessionId && isCompleted && (
          <ResultPanel
            result={result}
            answers={answers}
            onReset={resetDiagnosis}
          />
        )}
      </div>
    </div>
  )
}

export default App
