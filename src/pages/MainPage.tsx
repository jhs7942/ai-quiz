import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
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
    </div>
  )
}
