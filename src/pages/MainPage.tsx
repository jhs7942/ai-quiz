import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import Sidebar from '../components/layout/Sidebar'
import QuizSettingsPanel from '../components/quiz/QuizSettings'
import MockExamGrid from '../components/mock-exam/MockExamGrid'
import { fetchCategories, buildQuestions } from '../lib/quiz'
import { fetchMockExams, fetchMockExamQuestions } from '../lib/mockExam'
import { useQuizStore } from '../store/quizStore'
import { useSession } from '../hooks/useSession'
import type { MockExam, QuizCategory } from '../types'

type Mode = 'category' | 'mock-exam'

export default function MainPage() {
  useSession('/')
  const navigate = useNavigate()
  const { selectedCategories, questionCount, difficulty, shuffle, setCategories, setSettings, startQuiz, startMockExam } = useQuizStore()
  const [categories, setCategories_] = useState<QuizCategory[]>([])
  const [mockExams, setMockExams] = useState<MockExam[]>([])
  const [loading, setLoading] = useState(true)
  const [mockExamsLoading, setMockExamsLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('category')

  useEffect(() => {
    fetchCategories()
      .then(setCategories_)
      .finally(() => setLoading(false))
  }, [])

  // 모의고사 모드 진입 시 목록 로드
  useEffect(() => {
    if (mode !== 'mock-exam') return
    setMockExamsLoading(true)
    fetchMockExams()
      .then(setMockExams)
      .finally(() => setMockExamsLoading(false))
  }, [mode])

  const selectedCats = categories.filter((c) => selectedCategories.includes(c.id))
  const estimatedMax = selectedCats.reduce((sum, cat) => sum + cat.questionCount, 0)

  async function handleStart() {
    if (selectedCats.length === 0) return
    setStarting(true)
    try {
      const questions = await buildQuestions(selectedCats, difficulty, questionCount, shuffle)
      if (questions.length === 0) {
        alert('선택한 조건에 맞는 문제가 없습니다. 난이도를 변경해보세요.')
        return
      }
      startQuiz(questions)
      navigate('/quiz')
    } finally {
      setStarting(false)
    }
  }

  async function handleMockExamSelect(exam: MockExam) {
    setStarting(true)
    try {
      const questions = await fetchMockExamQuestions(exam)
      startMockExam(exam, questions)
      navigate('/quiz')
    } finally {
      setStarting(false)
    }
  }

  function handleToggle(id: string) {
    if (selectedCategories.includes(id)) {
      setCategories(selectedCategories.filter((c) => c !== id))
    } else {
      setCategories([...selectedCategories, id])
    }
  }

  function handleToggleAll() {
    if (selectedCategories.length === categories.length) {
      setCategories([])
    } else {
      setCategories(categories.map((c) => c.id))
    }
  }

  function handleMockExamClick() {
    setMode('mock-exam')
    setCategories([])
  }

  function handleCategoryToggle(id: string) {
    setMode('category')
    handleToggle(id)
  }

  function handleCategoryToggleAll() {
    setMode('category')
    handleToggleAll()
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Header onMenuToggle={() => setDrawerOpen(true)} showMenuButton />
      <div className="flex">
        <Sidebar
          categories={categories}
          selected={selectedCategories}
          onToggle={handleCategoryToggle}
          onToggleAll={handleCategoryToggleAll}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={mode}
          onMockExamClick={handleMockExamClick}
        />
        <main className="flex-1 p-4 sm:p-5 lg:p-6">
          {starting && (
            <p className="text-sm text-blue-600 mb-4 text-center">문제를 불러오는 중...</p>
          )}

          {mode === 'mock-exam' ? (
            <MockExamGrid
              exams={mockExams}
              onSelect={handleMockExamSelect}
              loading={mockExamsLoading}
            />
          ) : loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              카테고리를 불러오는 중...
            </div>
          ) : selectedCats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
              <span className="text-5xl">📚</span>
              <p className="text-base font-medium">
                <span className="lg:hidden">☰ 메뉴에서 퀴즈 카테고리를 선택하세요</span>
                <span className="hidden lg:inline">좌측에서 퀴즈 카테고리를 선택하세요</span>
              </p>
              <p className="text-sm">여러 카테고리를 동시에 선택할 수 있습니다</p>
            </div>
          ) : (
            <div className="w-full max-w-xl">
              <QuizSettingsPanel
                settings={{ questionCount, difficulty, shuffle }}
                maxQuestions={estimatedMax}
                onChange={setSettings}
                onStart={handleStart}
              />
            </div>
          )}
        </main>
      </div>
      {/* 서비스 소개 — SEO 콘텐츠 */}
      <section className="bg-white border-t border-gray-200 py-10 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-4">AI Quiz — 시험 직전 10분, 핵심 개념 완벽 마스터</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            AI Quiz는 인공지능 핵심 이론부터 실전 문제까지 아우르는 퀴즈 기반 학습 플랫폼입니다.
            머신러닝, 딥러닝, 자연어 처리, 컴퓨터 비전 등 다양한 AI 분야의 개념을
            객관식과 주관식 문제로 빠르게 점검할 수 있습니다.
            짧은 시간 안에 핵심만 골라 학습할 수 있어 시험 직전 마무리 정리에 최적화되어 있습니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            현재까지 <strong>1,556명 이상의 사용자</strong>가 총 <strong>73,000건 이상의 문제</strong>를 풀었으며,
            1인당 평균 126.9문제를 풀어볼 만큼 높은 참여도를 기록하고 있습니다.
            평균 정답률 67.5%로, 너무 쉽지도 어렵지도 않은 적절한 난이도를 제공합니다.
            카테고리별 문제 선택, 난이도 필터링, 문제 수 조절 등 맞춤형 학습 설정을 지원하며,
            모의고사 모드를 통해 실전과 동일한 환경에서 실력을 측정할 수도 있습니다.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[#F8F6F1] rounded-lg p-3">
              <p className="text-base font-bold text-gray-800">1,556+</p>
              <p className="text-xs text-gray-500">누적 사용자</p>
            </div>
            <div className="bg-[#F8F6F1] rounded-lg p-3">
              <p className="text-base font-bold text-gray-800">73,000+</p>
              <p className="text-xs text-gray-500">문제 풀이 수</p>
            </div>
            <div className="bg-[#F8F6F1] rounded-lg p-3">
              <p className="text-base font-bold text-gray-800">67.5%</p>
              <p className="text-xs text-gray-500">평균 정답률</p>
            </div>
            <div className="bg-[#F8F6F1] rounded-lg p-3">
              <p className="text-base font-bold text-gray-800">13.3회</p>
              <p className="text-xs text-gray-500">평균 재방문</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
