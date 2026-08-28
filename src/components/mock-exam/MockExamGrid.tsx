import type { MockExam } from '../../types'

interface MockExamGridProps {
  exams: MockExam[]
  onSelect: (exam: MockExam) => void
  loading?: boolean
}

export default function MockExamGrid({ exams, onSelect, loading }: MockExamGridProps) {
  // [학습] 3가지 상태 분기 — loading / empty / data. 각각 early return 으로 처리.
  //        UX 의 핵심 — "데이터가 없을 때" 와 "로딩 중일 때" 를 구분해 사용자에게 다른 메시지 노출.
  //        한 return 안에서 ternary 로 묶어도 되지만, 분기가 3개 이상이면 early return 이 가독성 ↑.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        모의고사 목록을 불러오는 중...
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
        <span className="text-5xl">📋</span>
        <p className="text-base font-medium">등록된 모의고사가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">실전 모의고사</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">총 {exams.length}회 · 회차당 {exams[0]?.questionCount}문제</p>
      </div>

      {/* [학습] 반응형 그리드 — sm/lg/xl 브레이크포인트마다 컬럼 수가 다르다. 모바일 2열, 태블릿/데스크톱 3열, 큰 화면 4열.
          Tailwind 의 grid-cols-N 클래스가 화면 크기별로 누적 적용되는 mobile-first 방식. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exams.map((exam, index) => {
          const round = exam.title.replace('실전 모의고사 ', '')
          return (
            <button
              key={exam.id}
              onClick={() => onSelect(exam)}
              className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
            >
              {/* [학습] group + group-hover — 부모 요소(group 클래스)에 hover 가 일어날 때 자식에 스타일 적용.
                  버튼 전체에 마우스 올리면 상단 배너 색이 진해지는 식의 인터랙션. CSS 의 :has() 없이 Tailwind 가 제공하는 기능. */}
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500 transition-colors" />

              <div className="p-4 flex flex-col gap-2">
                {/* 회차 번호 뱃지 */}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  {index + 1}
                </span>

                {/* 제목 */}
                <div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">실전 모의고사</p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight">{round}</p>
                </div>

                {/* 문제 수 + 시작 힌트 */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{exam.questionCount}문제</span>
                  <span className="text-xs text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    시작 →
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
