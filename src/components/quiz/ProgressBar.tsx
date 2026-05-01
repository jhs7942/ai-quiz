interface ProgressBarProps {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  // [학습] total > 0 가드 — 0 으로 나누기 방지. 빈 퀴즈에서도 폭발하지 않게.
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>{current} / {total}</span>
        <span>{percent}%</span>
      </div>
      {/* [학습] 동적 width 는 Tailwind 클래스로 표현 불가(빌드 타임 정적 추출이라 `w-${x}%` 패턴 안 됨).
          inline style 로 width: `${percent}%` 직접 지정. 동적 수치는 style, 정적 클래스는 className. */}
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
