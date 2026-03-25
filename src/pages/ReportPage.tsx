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
        <p className="text-sm text-gray-400 mb-8">웹 서비스 사용자 경험(UX) 및 참여도 분석</p>

        {/* 개요 */}
        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. 개요</h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            본 보고서는 총 977명의 고정 사용자를 대상으로 한 서비스 이용 데이터를 분석한 결과입니다.
            전반적인 지표는 사용자의 <strong>높은 체류 시간</strong>과 <strong>반복적 방문</strong>을 증명하고 있으며,
            이는 구글의 알고리즘이 해당 웹사이트를 "신뢰도 높고 유익한 콘텐츠를 제공하는 사이트"로
            판단하는 데 긍정적인 신호를 줍니다.
          </p>
        </section>

        {/* 통계 이미지 */}
        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">서비스 이용 현황</h2>
          <p className="text-sm text-gray-500 mb-5">실제 사용자 데이터를 기반으로 분석한 AI Quiz 서비스 지표입니다.</p>
          <img
            src="/report-stats.png"
            alt="AI Quiz 서비스 이용 현황 통계 - 평균 방문 횟수, 문제 풀이 수, 정답률, 모바일 유입률"
            className="w-full rounded-lg border border-gray-100"
          />
        </section>

        {/* 핵심 지표 요약 */}
        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2. 핵심 사용자 참여 지표</h2>
          <p className="text-sm text-gray-500 mb-4">구글 SEO는 단순 방문보다 실질적인 상호작용을 중요하게 평가합니다.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-5">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600">12.7회</p>
              <p className="text-xs text-gray-500 mt-1">평균 방문 횟수</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600">47.7문제</p>
              <p className="text-xs text-gray-500 mt-1">1인당 문제 풀이</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600">66.5%</p>
              <p className="text-xs text-gray-500 mt-1">평균 정답률</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xl font-bold text-blue-600">977명</p>
              <p className="text-xs text-gray-500 mt-1">전체 사용자</p>
            </div>
          </div>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>총 문제 풀이 및 세션</strong>: 총 46,591건의 풀이와 2,497회의 퀴즈 세션이 발생했습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>1인당 평균 풀이량 (47.7문제)</strong>: 개별 사용자가 사이트 내에서 매우 활발하게 상호작용하고 있음을 나타내며, 이는 낮은 이탈률과 높은 세션당 페이지 뷰로 직결됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>평균 방문 횟수 (12.7회)</strong>: 사용자의 재방문율(Retention)이 매우 높습니다. 이는 구글의 E-E-A-T 중 '신뢰성' 지표를 강화하는 요소입니다.</span>
            </li>
          </ul>
        </section>

        {/* 모바일 최적화 */}
        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. 모바일 최적화 및 접근성</h2>
          <p className="text-sm text-gray-500 mb-3">구글은 'Mobile-First Indexing' 정책을 통해 모바일 환경에서의 사용자 경험을 최우선으로 평가합니다.</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>모바일 유입 비중 (11.2%)</strong>: 현재 모바일 유입 비중이 현저히 낮습니다. 서비스의 특성상 데스크톱 환경이 유리할 수 있으나, SEO 점수 확보를 위해 모바일 반응형 웹 디자인의 최적화 상태(Core Web Vitals)를 재점검할 필요가 있습니다.</span>
            </li>
          </ul>
        </section>

        {/* 콘텐츠 품질 */}
        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. 콘텐츠 품질 및 검색 만족도</h2>
          <p className="text-sm text-gray-500 mb-3">사용자가 검색 의도에 맞는 결과를 얻었는지를 정답률과 피드백으로 확인합니다.</p>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>전체 평균 정답률 (66.5%)</strong>: 사용자에게 적절한 도전적 가치를 제공하고 있음을 의미합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>최고 오답 문제 (ID: 634, 오답률 100%)</strong>: 특정 콘텐츠에서 사용자 경험의 '단절'이 발생하고 있습니다. 해당 페이지에서 사용자가 포기하고 이탈할 가능성이 높으므로 해설 콘텐츠 보강이 필요합니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span><strong>사용자 피드백 (124건)</strong>: 구글이 강조하는 '사용자 중심의 콘텐츠 업데이트'의 핵심 근거가 됩니다.</span>
            </li>
          </ul>
        </section>

        {/* 향후 전략 */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">5. SEO 개선을 위한 향후 전략</h2>
          <ol className="space-y-3 text-sm text-gray-700 list-none">
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
              <span><strong>모바일 UX 강화</strong>: 모바일 유입 비중을 높이기 위해 모바일 페이지 로딩 속도 및 인터페이스 개선.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
              <span><strong>고난도 콘텐츠 최적화</strong>: 오답률 100%인 ID 634번 문항에 대한 상세 가이드 페이지를 제작하여 '전문성' 지표 강화.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
              <span><strong>피드백 루프 반영</strong>: 124건의 피드백을 바탕으로 한 FAQ 또는 도움말 페이지 구축 (롱테일 키워드 유입 효과).</span>
            </li>
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  )
}
