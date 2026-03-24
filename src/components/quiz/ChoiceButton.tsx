interface ChoiceButtonProps {
  choice: string
  index: number
  state: 'idle' | 'correct' | 'wrong' | 'unselected-correct'
  onClick: () => void
  disabled: boolean
}

const LABELS = ['A', 'B', 'C', 'D']

export default function ChoiceButton({ choice, index, state, onClick, disabled }: ChoiceButtonProps) {
  let containerStyle = 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
  let labelStyle = 'bg-gray-100 text-gray-600'

  if (state === 'correct') {
    containerStyle = 'border-green-400 bg-green-50'
    labelStyle = 'bg-green-500 text-white'
  } else if (state === 'wrong') {
    containerStyle = 'border-red-400 bg-red-50'
    labelStyle = 'bg-red-500 text-white'
  } else if (state === 'unselected-correct') {
    containerStyle = 'border-green-300 bg-green-50/50'
    labelStyle = 'bg-green-400 text-white'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 disabled:cursor-default ${containerStyle}`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${labelStyle}`}>
        {LABELS[index]}
      </span>
      <span className="text-sm text-gray-800">{choice}</span>
      {state === 'correct' && <span className="ml-auto text-green-500">✓</span>}
      {state === 'wrong' && <span className="ml-auto text-red-500">✗</span>}
    </button>
  )
}
