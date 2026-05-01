import type { QuizSettings } from '../../types'

interface QuizSettingsProps {
  settings: QuizSettings
  maxQuestions: number
  onChange: (s: Partial<QuizSettings>) => void
  onStart: () => void
}

// [학습] as const — 배열·객체를 readonly + 리터럴 타입으로 동결. value 가 string 이 아니라 'all' | 'easy' | ... 로 좁혀진다.
//        그 결과 onChange({ difficulty: d.value }) 호출 시 d.value 가 정확히 QuizSettings.difficulty 와 호환되는지 컴파일러가 검증.
//        as const 없으면 string 으로 넓혀져 매직 문자열 검사가 풀린다.
const DIFFICULTIES = [
  { value: 'all', label: '전체' },
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
] as const

// [학습] 배열 형태의 as const — 결과 타입은 readonly [5, 10, 15, 20, 'all'] (정확한 튜플).
//        .map 등에서 c 의 타입이 number | 'all' 로 좁혀진다.
const COUNTS = [5, 10, 15, 20, 'all'] as const

// [학습] callback prop 패턴 — onChange/onStart 처럼 함수를 prop 으로 받아 부모에 이벤트 알림.
//        Partial<QuizSettings> 를 받아 부분 갱신만 부모로 보낸다. 부모(MainPage) 의 setSettings 가 store 의 일부 키만 업데이트.
//        "데이터는 위에서 아래로, 이벤트는 아래에서 위로" 가 React 의 단방향 데이터 흐름.
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
