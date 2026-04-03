import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { useMeta } from '../hooks/useMeta'

export default function ContactPage() {
  useMeta(
    'Contact - AI Quiz',
    'AI Quiz 문의 및 오류 제보. 이메일 또는 설문조사를 통해 서비스 개선에 참여해보세요.',
  )
  return (
    <div className="min-h-screen bg-[#F8F6F1] dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-5 py-10 w-full">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8">Contact</h1>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            AI Quiz를 이용해주셔서 감사합니다.
            서비스 이용 중 문의사항, 오류 제보, 개선 아이디어가 있다면 아래 이메일로 연락해주세요.
            보내주신 의견은 더 나은 서비스 운영과 문제 품질 개선에 큰 도움이 됩니다.
          </p>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">문의 이메일</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0">이메일</span>
              <a href="mailto:qe092783@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                qe092783@gmail.com
              </a>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400 w-20 shrink-0">설문조사</span>
              <a
                href="https://forms.gle/VRzC3myk3DBRPeE68"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                서비스 이용 설문조사 바로가기
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">이런 내용을 보내주시면 좋아요</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> 문제 오류 제보</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> 정답 또는 해설 수정 제안</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> 기능 개선 아이디어</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> 서비스 이용 중 불편 사항</li>
            <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> 기타 문의</li>
          </ul>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">참고 사항</h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2"><span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span> 본 서비스는 학습 보조를 목적으로 제작된 프로젝트입니다.</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span> 문의 내용에 따라 답변까지 다소 시간이 걸릴 수 있습니다.</li>
            <li className="flex items-start gap-2"><span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span> 문제 오류 제보 시 <strong>문제 번호, 문제 내용, 신고 사유</strong>를 함께 보내주시면 더 빠르게 확인할 수 있습니다.</li>
          </ul>
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            여러분의 피드백은 AI Quiz를 더 정확하고 유용한 서비스로 만드는 데 큰 힘이 됩니다.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
