import { useEffect } from 'react'

interface ToastProps {
  message: string
  onClose: () => void
  duration?: number
}

// [학습] 디폴트 인자값 — duration = 3000. optional prop 의 기본값을 함수 시그니처에서 직접 지정.
export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  // [학습] setTimeout + cleanup — 컴포넌트 언마운트 시 타이머 취소. cleanup 없으면 이미 사라진 컴포넌트의 onClose 가 호출돼 경고/오류.
  //        deps [onClose, duration] — 둘 중 하나라도 바뀌면 기존 타이머 취소 후 새 타이머. duration 이 props 로 동적이면 정확하게 갱신.
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    // [학습] left-1/2 + -translate-x-1/2 — 가로 중앙 정렬의 흔한 Tailwind 패턴. 부모가 fixed 일 때 가운데에 안정적으로 위치.
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg transition-all duration-300">
      {message}
    </div>
  )
}
