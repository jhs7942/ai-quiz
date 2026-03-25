import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useMeta } from '../hooks/useMeta'

export default function AboutPage() {
  useMeta(
    'About us - AI Quiz',
    'AI Quiz 팀 소개. SSAFY 서울 18반이 만든 AI 핵심 개념 퀴즈 플랫폼의 개발 배경과 팀을 만나보세요.',
  )
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-5 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">About us</h1>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            AI Quiz는 인공지능(AI) 개념을 빠르게 학습할 수 있도록 설계된 웹 기반 퀴즈 플랫폼입니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. 왜 만들었나요?</h2>
          <p className="text-sm text-gray-500 italic mb-3">"시험 전 10분, 전공 서적을 다 읽을 순 없으니까!"</p>
          <p className="text-gray-700 leading-relaxed">
            AI 시험을 앞두고 막막했던 서울 18반 교육생들이 직접 만들었습니다.
            복잡한 이론 대신 핵심 키워드 중심의 퀴즈로, 가장 효율적인 '막판 뒤집기'를 돕기 위해 시작된 프로젝트입니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">2. 우리가 함께 만든 기록</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">800명+</p>
              <p className="text-xs text-gray-500 mt-1">함께 공부한 사람들</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">23,000+</p>
              <p className="text-xs text-gray-500 mt-1">격파한 총 문제 수</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">66.5%</p>
              <p className="text-xs text-gray-500 mt-1">평균 정답률</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            단순한 AI 퀴즈 서비스를 넘어, 실시간 오답 데이터를 통해 사용자들이 가장 헷갈려 하는 인공지능 개념을 분석하고 개선했습니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. 앞으로의 계획</h2>
          <p className="text-gray-700 leading-relaxed">
            현재는 수동으로 제작된 퀴즈 기반 서비스이지만,
            축적된 데이터를 바탕으로 AI가 직접 문제를 생성하는 맞춤형 퀴즈 서비스로 발전시킬 예정입니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">4. 만든 사람들</h2>
          <p className="text-sm text-gray-600 mb-4">문제를 발견하고 기술로 해결하는 것을 즐기는 서울 18반 팀입니다.</p>
          <ul className="space-y-2 text-sm text-gray-700 mb-6">
            <li><span className="font-medium">정현승</span> — 서비스 기획 및 퀴즈 로직 구현, 서비스 예외 처리</li>
            <li><span className="font-medium">문은서</span> — 전체 디렉팅 및 데이터 설계, SEO/광고 전략</li>
            <li><span className="font-medium">추창만</span> — 데이터 처리 및 품질 관리, 사용자 피드백 운영</li>
          </ul>
          <p className="text-xs text-gray-400 mb-2">데이터셋 제작에 기여해주신 분들</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>SSAFY 서울 18반 오동헌님</li>
            <li>SSAFY 서울 18반 이민규님</li>
            <li>SSAFY 서울 18반 김도균님</li>
            <li>SSAFY 18반 마이스터고 트랙 이재윤 강사님</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  )
}
