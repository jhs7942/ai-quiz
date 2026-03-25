import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useMeta } from '../hooks/useMeta'

export default function PrivacyPage() {
  useMeta(
    '개인정보처리방침 - AI Quiz',
    'AI Quiz 개인정보처리방침. 수집 정보, 이용 목적, 보관 및 파기 정책을 확인하세요.',
  )
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-5 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-8">Privacy Policy</p>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <p className="text-gray-700 leading-relaxed">
            AI Quiz는 사용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">1. 수집하는 정보</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            본 서비스는 기본적으로 회원가입 없이 이용 가능하며, 별도의 개인정보를 수집하지 않습니다.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            단, 서비스 개선 및 이용 통계 분석을 위해 다음과 같은 비식별 정보가 수집될 수 있습니다.
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 접속 로그</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 이용 기록</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 기기 정보 (브라우저, OS 등)</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">2. 정보 이용 목적</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            수집된 정보는 다음의 목적을 위해 사용됩니다.
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 서비스 품질 개선</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 사용자 경험 향상</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 통계 분석</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">3. 개인정보 보관 및 파기</h2>
          <p className="text-gray-700 leading-relaxed">
            본 서비스는 개인정보를 별도로 저장하지 않으며, 수집된 비식별 정보는 목적 달성 후 지체 없이 파기됩니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">4. 제3자 제공</h2>
          <p className="text-gray-700 leading-relaxed">
            AI Quiz는 사용자의 정보를 외부에 제공하지 않습니다.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">5. 광고 및 쿠키 사용</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            본 서비스는 Google AdSense를 통해 광고를 제공할 수 있습니다. Google은 쿠키를 사용하여 사용자의 관심사에 맞는 광고를 표시합니다.
          </p>
          <ul className="space-y-1 text-sm text-gray-600 mb-3">
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> Google이 사용하는 쿠키는 광고 맞춤화 및 사용자 통계 목적으로 사용됩니다.</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> 쿠키 사용을 원하지 않으시면 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">•</span> Google의 개인정보 처리 방식에 대한 자세한 내용은 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google 개인정보처리방침</a>을 참고하세요.</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">6. 문의</h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            개인정보 관련 문의는 아래 연락처를 통해 가능합니다.
          </p>
          <a href="mailto:saver7942@gmail.com" className="text-sm text-blue-600 hover:underline">
            saver7942@gmail.com
          </a>
        </section>
      </main>
      <Footer />
    </div>
  )
}
