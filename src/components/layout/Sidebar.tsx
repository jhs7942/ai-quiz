import type { QuizCategory } from '../../types'
import CategoryCard from '../common/CategoryCard'
import { useWrongNoteStore } from '../../store/wrongNoteStore'

interface SidebarProps {
  categories: QuizCategory[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
  isOpen?: boolean
  onClose?: () => void
  mode?: 'category' | 'mock-exam' | 'wrong-note'
  onMockExamClick?: () => void
  onWrongNoteClick?: () => void
}

// [학습] 디폴트 값을 구조 분해에서 직접 — `mode = 'category'`. 호출처가 mode 를 안 넘기면 'category'.
//        타입은 optional('mode?:')이지만 런타임 기본값을 여기서 보장 → 함수 본체에서 mode 가 항상 정의됨.
export default function Sidebar({
  categories,
  selected,
  onToggle,
  onToggleAll,
  isOpen,
  onClose,
  mode = 'category',
  onMockExamClick,
  onWrongNoteClick,
}: SidebarProps) {
  // [학습] derived state — selected.length === categories.length 만 검사하면 둘 다 0일 때도 true 가 되어 잘못된 표시.
  //        && categories.length > 0 으로 빈 상태 가드.
  const allSelected = selected.length === categories.length && categories.length > 0
  // [학습] selector 패턴 — useWrongNoteStore((s) => s.wrongNotes.length) 처럼 함수를 넘기면
  //        그 함수가 반환하는 값이 바뀔 때만 컴포넌트가 리렌더된다. wrongNotes 배열 참조 자체보다 length 변경에만 반응.
  //        성능 최적화의 핵심 패턴 — store 의 다른 키 변경에 영향 받지 않는다.
  const wrongNoteCount = useWrongNoteStore((s) => s.wrongNotes.length)

  const content = (
    <div className="flex flex-col h-full">
      {/* 실전 모의고사 항목 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { onMockExamClick?.(); onClose?.() }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            mode === 'mock-exam'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span>📋</span>
          <span>실전 모의고사</span>
        </button>
      </div>

      {/* 카테고리 영역 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">퀴즈 카테고리</h2>
          <button
            onClick={onToggleAll}
            className="text-xs text-blue-600 hover:underline"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        {selected.length > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-1.5">
            {selected.length}개 선택됨 (총{' '}
            {categories
              .filter((c) => selected.includes(c.id))
              .reduce((s, c) => s + c.questionCount, 0)}
            문제)
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            selected={selected.includes(cat.id)}
            onToggle={onToggle}
          />
        ))}
      </div>

      {/* 오답노트 */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <button
          onClick={() => { onWrongNoteClick?.(); onClose?.() }}
          disabled={wrongNoteCount === 0}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 ${
            mode === 'wrong-note'
              ? 'bg-orange-500 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>오답노트</span>
          </div>
          {wrongNoteCount > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              mode === 'wrong-note'
                ? 'bg-white/20 text-white'
                : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
            }`}>
              {wrongNoteCount}
            </span>
          )}
        </button>
      </div>
    </div>
  )

  // [학습] Fragment(<>...</>) — 의미 없는 래퍼 div 추가 없이 형제 요소 여러 개를 반환할 때 사용.
  //        React 컴포넌트는 단일 루트 요소만 반환 가능한데, Fragment 가 그 제약을 우회.
  return (
    <>
      {/* [학습] 반응형 분기 — 같은 콘텐츠({content})를 데스크톱(고정 사이드바) 과 모바일(드로어 오버레이) 두 형태로 렌더.
          Tailwind 의 `hidden lg:flex` (lg 이상에서만 보임) 와 `lg:hidden` (lg 미만에서만 보임) 으로 화면 크기에 따라 켜고 끈다. */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#F0EDE8] dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-56px)] sticky top-14 flex-col">
        {content}
      </aside>

      {/* 모바일: 드로어 */}
      {/* [학습] 드로어 패턴 — fixed inset-0 (전체 화면 덮음) + 반투명 배경(`bg-black/40`) + 슬라이드 사이드 패널.
          배경 클릭 시 onClose — 사용자 직관적 UX. */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="relative w-72 bg-[#F0EDE8] dark:bg-gray-800 h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">퀴즈 카테고리</span>
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
