import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useMeta } from '../hooks/useMeta'

export default function ReportPage() {
  useMeta(
    'Report - AI Quiz',
    'AI Quiz 서비스 이용 현황. 방문자 수, 문제 풀이 수, 정답률 등 실제 사용 데이터를 확인하세요.',
  )
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-5 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Report</h1>
        <p className="text-sm text-gray-400 mb-8">서비스 현황 데이터</p>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">서비스 이용 현황</h2>
          <p className="text-sm text-gray-500 mb-5">
            실제 사용자 데이터를 기반으로 분석한 AI Quiz 서비스 지표입니다.
          </p>
          <img
            src="/report-stats.png"
            alt="AI Quiz 서비스 이용 현황 통계 - 평균 방문 횟수, 문제 풀이 수, 정답률, 모바일 유입률"
            className="w-full rounded-lg border border-gray-100"
          />
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">주요 지표 요약</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xl font-bold text-gray-800">12.7회</p>
              <p className="text-xs text-gray-500 mt-1">평균 방문 횟수</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xl font-bold text-gray-800">47.7문제</p>
              <p className="text-xs text-gray-500 mt-1">1인당 문제 풀이</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xl font-bold text-gray-800">66.5%</p>
              <p className="text-xs text-gray-500 mt-1">평균 정답률</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xl font-bold text-gray-800">977명</p>
              <p className="text-xs text-gray-500 mt-1">전체 사용자</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
