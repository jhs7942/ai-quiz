import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useMeta } from '../hooks/useMeta'
import GoogleAdSense from '../components/common/GoogleAdSense'

export default function ReportPage() {
  useMeta(
    'Report - AI Quiz',
    'AI Quiz 서비스 성과 리포트. 누적 사용자 1,556명, 문제 풀이 73,000건 이상의 실제 데이터를 확인하세요.',
  )
  return (
    <div className="min-h-screen bg-[#F8F6F1] dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-5 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Report</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">AI Quiz 서비스 성과 리포트</p>

        {/* 개요 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">1. 개요</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            AI Quiz는 인공지능 학습을 돕기 위해 만들어진 퀴즈 기반 플랫폼입니다.
            서비스 운영 이후 총 <strong>1,556명의 사용자</strong>가 <strong>73,000건 이상의 문제</strong>를 풀었으며,
            높은 재방문율과 문제 풀이량이 서비스의 실질적인 가치를 증명하고 있습니다.
            축적된 데이터를 바탕으로 더 나은 AI 학습 경험을 제공하기 위해 계속 발전해 나가겠습니다.
          </p>
        </section>

        {/* 광고 */}
        <div className="mb-5">
          <GoogleAdSense adSlot="9154610564" adFormat="fluid" adLayoutKey="-fb+5w+4e-db+86" />
        </div>

        {/* 통계 이미지 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">서비스 이용 현황</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">실제 사용자 데이터를 기반으로 분석한 AI Quiz 서비스 지표입니다.</p>
          <img
            src="/report-stats.png"
            alt="AI Quiz 서비스 이용 현황 통계 - 평균 방문 횟수, 문제 풀이 수, 정답률, 모바일 유입률"
            className="w-full rounded-lg border border-gray-100 dark:border-gray-700"
          />
        </section>

        {/* 핵심 지표 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">2. 핵심 성과 지표</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-5">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">13.3회</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">평균 방문 횟수</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">126.9문제</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1인당 문제 풀이</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">67.5%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">평균 정답률</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">1,556명</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">전체 사용자</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>총 문제 풀이 및 세션</strong>: 총 73,848건의 풀이와 4,795회의 퀴즈 세션이 발생했습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>높은 재방문율 (13.3회)</strong>: 사용자가 반복적으로 방문해 학습하고 있으며, 이는 서비스의 지속적인 학습 가치를 보여줍니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>사용자 피드백 (134건)</strong>: 적극적인 사용자 피드백을 바탕으로 문제 품질을 지속적으로 개선하고 있습니다.</span>
            </li>
          </ul>
        </section>

        {/* 성장 비교 테이블 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">3. 서비스 성장 지표</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">서비스 초기 대비 현재까지의 성장을 확인하세요.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 dark:bg-gray-700 text-white">
                  <th className="px-4 py-3 text-left font-medium rounded-tl-lg">항목</th>
                  <th className="px-4 py-3 text-center font-medium">이전</th>
                  <th className="px-4 py-3 text-center font-medium rounded-tr-lg">현재</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">사용자 수</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">800~977명</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">1,556명</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">문제 풀이</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">23,000~46,000건</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">73,000건</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">1인당 풀이</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">47.7문제</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">126.9문제</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">평균 정답률</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">66.5%</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">67.5%</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">평균 재방문</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">12.7회</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">13.3회</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">퀴즈 세션</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">2,497회</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">4,795회</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 rounded-bl-lg">피드백</td>
                  <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">124건</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400 rounded-br-lg">134건</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 앞으로의 계획 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">4. 앞으로의 계획</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            AI Quiz를 통해 축적된 <strong>73,000건 이상의 풀이 데이터</strong>와 <strong>134건의 사용자 피드백</strong>을
            바탕으로 AI 모델을 파인 튜닝할 예정입니다.
            이를 통해 사용자 맞춤형 문제를 자동으로 생성하는 진정한 의미의 AI 기반 퀴즈 서비스로 돌아오겠습니다.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
