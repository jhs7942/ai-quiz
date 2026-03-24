import type { QuizSettings } from '../../types'

interface QuizSettingsProps {
  settings: QuizSettings
  maxQuestions: number
  onChange: (s: Partial<QuizSettings>) => void
  onStart: () => void
}

const DIFFICULTIES = [
  { value: 'all', label: '전체' },
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
] as const

const COUNTS = [5, 10, 15, 20, 'all'] as const

export default function QuizSettingsPanel({ settings, maxQuestions, onChange, onStart }: QuizSettingsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-5">퀴즈 설정</h2>

      {/* 난이도 */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-gray-600 mb-2">난이도</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => onChange({ difficulty: d.value })}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                settings.difficulty === d.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 문항 수 */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-gray-600 mb-2">문항 수</p>
        <div className="flex flex-wrap gap-2">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ questionCount: c })}
              className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                settings.questionCount === c
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {c === 'all' ? '전체' : `${c}문제`}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          현재 조건에서 최대 {maxQuestions}문제
        </p>
      </div>

      {/* 순서 */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-600 mb-2">문제 순서</p>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ shuffle: false })}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              !settings.shuffle
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            순서대로
          </button>
          <button
            onClick={() => onChange({ shuffle: true })}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              settings.shuffle
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            랜덤 셔플
          </button>
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={maxQuestions === 0}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        퀴즈 시작하기 →
      </button>
    </div>
  )
}
