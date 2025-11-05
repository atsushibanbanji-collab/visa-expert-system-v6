import { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function RuleManagement() {
  const [rules, setRules] = useState([])
  const [filteredRules, setFilteredRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filterVisaType, setFilterVisaType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // フォームデータ
  const [formData, setFormData] = useState({
    name: '',
    visa_type: 'E',
    rule_type: 'selection',
    conditions: [],
    actions: [],
    flag: true
  })

  useEffect(() => {
    fetchRules()
  }, [])

  useEffect(() => {
    filterRules()
  }, [rules, filterVisaType, searchTerm])

  const fetchRules = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/rules`)
      const data = await response.json()
      setRules(data.rules || [])
    } catch (error) {
      console.error('ルール取得エラー:', error)
      setMessage('ルールの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const filterRules = () => {
    let filtered = rules

    if (filterVisaType !== 'all') {
      filtered = filtered.filter(r => r.visa_type === filterVisaType)
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toString().includes(searchTerm)
      )
    }

    setFilteredRules(filtered)
  }

  const handleCreateClick = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedRule(null)
    setFormData({
      name: '',
      visa_type: 'E',
      rule_type: 'selection',
      conditions: [],
      actions: [],
      flag: true
    })
  }

  const handleEditClick = (rule) => {
    setIsEditing(true)
    setIsCreating(false)
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      visa_type: rule.visa_type,
      rule_type: rule.rule_type,
      conditions: JSON.parse(JSON.stringify(rule.conditions)),
      actions: JSON.parse(JSON.stringify(rule.actions)),
      flag: rule.flag
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedRule(null)
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      let response
      if (isCreating) {
        response = await fetch(`${API_BASE_URL}/api/admin/rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      } else if (isEditing && selectedRule) {
        response = await fetch(`${API_BASE_URL}/api/admin/rules/${selectedRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
      }

      const data = await response.json()
      setMessage(`ルールを${isCreating ? '作成' : '更新'}しました`)
      await fetchRules()
      handleCancelEdit()
    } catch (error) {
      console.error('保存エラー:', error)
      setMessage(`ルールの${isCreating ? '作成' : '更新'}に失敗しました`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (ruleId) => {
    if (!confirm('このルールを削除しますか？')) return

    setIsLoading(true)
    try {
      await fetch(`${API_BASE_URL}/api/admin/rules/${ruleId}`, {
        method: 'DELETE'
      })
      setMessage('ルールを削除しました')
      await fetchRules()
      if (selectedRule && selectedRule.id === ruleId) {
        handleCancelEdit()
      }
    } catch (error) {
      console.error('削除エラー:', error)
      setMessage('ルールの削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { fact: '', value: true }]
    })
  }

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions]
    newConditions[index][field] = value
    setFormData({ ...formData, conditions: newConditions })
  }

  const removeCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    })
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { fact: '', value: true }]
    })
  }

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions]
    newActions[index][field] = value
    setFormData({ ...formData, actions: newActions })
  }

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">ルール管理</h2>
        <p className="text-gray-600 mt-1">ルールの追加・編集・削除（システムイメージ.txt 行108-122）</p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* 左側: ルール一覧 */}
        <div className="bg-white border shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">ルール一覧</h3>
            <button
              onClick={handleCreateClick}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold transition duration-200"
            >
              + 新規作成
            </button>
          </div>

          {/* フィルター */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="ルール名またはIDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            <select
              value={filterVisaType}
              onChange={(e) => setFilterVisaType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="all">全てのビザタイプ</option>
              <option value="E">Eビザ</option>
              <option value="B">Bビザ</option>
              <option value="L">Lビザ</option>
              <option value="H-1B">H-1Bビザ</option>
              <option value="J-1">J-1ビザ</option>
            </select>
          </div>

          {/* ルールリスト */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                className={`border rounded p-3 cursor-pointer transition duration-200 ${
                  selectedRule && selectedRule.id === rule.id
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-300 hover:border-primary'
                }`}
                onClick={() => handleEditClick(rule)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-800">
                      #{rule.id} - {rule.name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {rule.visa_type}
                      </span>
                      <span className="ml-2 text-xs">
                        条件: {rule.conditions.length} / 結論: {rule.actions.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(rule.id)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右側: ルール編集 */}
        <div className="bg-white border shadow p-6">
          {(isEditing || isCreating) ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'ルール作成' : 'ルール編集'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-600 hover:text-gray-800"
                >
                  ✕ キャンセル
                </button>
              </div>

              {/* 基本情報 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ルール名
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ビザタイプ
                  </label>
                  <select
                    value={formData.visa_type}
                    onChange={(e) => setFormData({ ...formData, visa_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="E">E</option>
                    <option value="B">B</option>
                    <option value="L">L</option>
                    <option value="H-1B">H-1B</option>
                    <option value="J-1">J-1</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ルールタイプ
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="selection">selection</option>
                    <option value="validation">validation</option>
                  </select>
                </div>
              </div>

              {/* 条件部 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    条件部（IF）
                  </label>
                  <button
                    onClick={addCondition}
                    className="text-primary hover:text-blue-800 text-sm"
                  >
                    + 条件追加
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {formData.conditions.map((cond, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={cond.fact}
                        onChange={(e) => updateCondition(index, 'fact', e.target.value)}
                        placeholder="事実名"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 結論部 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    結論部（THEN）
                  </label>
                  <button
                    onClick={addAction}
                    className="text-primary hover:text-blue-800 text-sm"
                  >
                    + 結論追加
                  </button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {formData.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={action.fact}
                        onChange={(e) => updateAction(index, 'fact', e.target.value)}
                        placeholder="導出する事実"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* フラグ */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="flag"
                  checked={formData.flag}
                  onChange={(e) => setFormData({ ...formData, flag: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="flag" className="text-sm text-gray-700">
                  有効
                </label>
              </div>

              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                disabled={isLoading || !formData.name}
                className="w-full bg-primary hover:bg-blue-800 text-white font-semibold py-3 rounded transition duration-200 disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20">
              ルールを選択するか、新規作成してください
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RuleManagement
