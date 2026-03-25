import type { MockExam } from '../../types'

interface MockExamGridProps {
  exams: MockExam[]
  onSelect: (exam: MockExam) => void
  loading?: boolean
}

export default function MockExamGrid({ exams, onSelect, loading }: MockExamGridProps) {
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
        <h2 className="text-xl font-bold text-gray-800">실전 모의고사</h2>
        <p className="text-sm text-gray-500 mt-1">총 {exams.length}회 · 회차당 {exams[0]?.questionCount}문제</p>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exams.map((exam, index) => {
          const round = exam.title.replace('실전 모의고사 ', '')
          return (
            <button
              key={exam.id}
              onClick={() => onSelect(exam)}
              className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
            >
              {/* 상단 컬러 배너 */}
              <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500 transition-colors" />

              <div className="p-4 flex flex-col gap-2">
                {/* 회차 번호 뱃지 */}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold group-hover:bg-blue-100 transition-colors">
                  {index + 1}
                </span>

                {/* 제목 */}
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">실전 모의고사</p>
                  <p className="text-base font-bold text-gray-800 leading-tight">{round}</p>
                </div>

                {/* 문제 수 + 시작 힌트 */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{exam.questionCount}문제</span>
                  <span className="text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
