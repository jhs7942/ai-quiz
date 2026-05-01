import { useEffect } from 'react'

// [학습] children: React.ReactNode — Modal 의 내용물을 자식 prop 으로 받는 "wrapper 컴포넌트" 패턴.
//        호출처: <Modal onClose={...}><FeedbackModal 내용/></Modal>. Modal 은 외곽(배경+닫기)만 담당.
interface ModalProps {
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ onClose, children }: ModalProps) {
  // [학습] document keydown 리스너 — ESC 키로 모달 닫기. 컴포넌트 안에 가둔 이벤트가 아닌 전역 리스너라 cleanup 필수.
  //        cleanup 누락하면 모달이 닫혀도 리스너가 남아 메모리/이벤트 누수.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    // [학습] portal 없이 fixed inset-0 z-50 — 트리 어디에 있든 화면 전체를 덮는다.
    //        진짜 portal(createPortal)을 쓰면 DOM 트리상 body 직속으로 가서 z-index 충돌이 더 적지만,
    //        이 앱은 트리 깊이가 얕아 portal 없이 fixed 만으로 충분.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      {/* [학습] e.stopPropagation() — 이벤트 버블링 차단. 자식 영역(모달 본체) 클릭이 부모(배경)의 onClose 로 올라가지 않게.
          배경 클릭 시 닫기 + 본체 클릭 유지 — 두 동작을 한 트리에서 분리하는 표준 패턴. */}
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
