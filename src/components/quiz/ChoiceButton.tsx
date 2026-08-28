// [학습] state 를 리터럴 union 으로 정의 — 5가지 상태를 명시. 부모(QuizCard)에서 채점/선택 상태를 한 string 으로 묶어 전달하는 설계.
//        boolean 여러 개로 표현하면(`isSelected`, `isCorrect`, `isWrong`...) 조합이 늘어 모순 상태(둘 다 true)가 가능.
//        하나의 union 으로 강제하면 "한 시점에 한 상태만" 컴파일러가 보장.
interface ChoiceButtonProps {
  choice: string
  index: number
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'unselected-correct'
  onClick: () => void
  disabled: boolean
}

// [학습] 모듈 상수 — A/B/C/D 라벨을 컴포넌트 외부로 뽑았다. 매 렌더에서 새 배열 생성을 막는 작은 최적화.
const LABELS = ['A', 'B', 'C', 'D']

export default function ChoiceButton({ choice, index, state, onClick, disabled }: ChoiceButtonProps) {
  // [학습] let + 조건부 재할당으로 className 문자열 빌드 — Tailwind 의 한계를 우회하는 흔한 패턴.
  //        대안 ① classnames 라이브러리, ② 객체 매핑(stateStyles[state]). 문자열이 한두 개면 let 분기로 충분.
  let containerStyle = 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:border-blue-500 dark:hover:bg-blue-900/20'
  let labelStyle = 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'

  if (state === 'selected') {
    containerStyle = 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
    labelStyle = 'bg-blue-500 text-white'
  } else if (state === 'correct') {
    containerStyle = 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
    labelStyle = 'bg-green-500 text-white'
  } else if (state === 'wrong') {
    containerStyle = 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
    labelStyle = 'bg-red-500 text-white'
  } else if (state === 'unselected-correct') {
    containerStyle = 'border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-700'
    labelStyle = 'bg-green-400 text-white'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-4 min-h-[44px] rounded-xl border text-left transition-all duration-200 disabled:cursor-default ${containerStyle}`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${labelStyle}`}>
        {LABELS[index]}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-200">{choice}</span>
      {state === 'correct' && <span className="ml-auto text-green-500">✓</span>}
      {state === 'wrong' && <span className="ml-auto text-red-500">✗</span>}
    </button>
  )
}
