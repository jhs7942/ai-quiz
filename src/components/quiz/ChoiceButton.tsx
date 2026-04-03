interface ChoiceButtonProps {
  choice: string
  index: number
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'unselected-correct'
  onClick: () => void
  disabled: boolean
}

const LABELS = ['A', 'B', 'C', 'D']

export default function ChoiceButton({ choice, index, state, onClick, disabled }: ChoiceButtonProps) {
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
