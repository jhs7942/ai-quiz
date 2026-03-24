import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM 환경에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 스크린샷 저장 경로
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots')

// 스크린샷 헬퍼
async function capture(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: false,
  })
}

// 공통 퀴즈 시작 헬퍼 (5문제 설정 후 시작)
async function startQuiz(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('aside.hidden.lg\\:flex')
  await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

  // 카테고리 선택
  await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

  // 퀴즈 설정 패널 대기
  const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
  await expect(settingsPanel).toBeVisible({ timeout: 5000 })

  // 5문제 버튼: exact: true 로 '15문제' 매칭 방지
  await settingsPanel.getByRole('button', { name: '5문제', exact: true }).click()

  // 퀴즈 시작
  await settingsPanel.getByRole('button', { name: /퀴즈 시작하기/ }).click()
  await page.waitForURL('**/quiz', { timeout: 15000 })
}

test.describe('AI Quiz 핵심 사용자 플로우', () => {
  test('Step 1: 메인 페이지 로딩 - 사이드바 카테고리 목록 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 사이드바 "퀴즈 카테고리" 헤딩 확인
    const sidebarHeading = page.locator('h2', { hasText: '퀴즈 카테고리' })
    await expect(sidebarHeading).toBeVisible({ timeout: 10000 })

    // 카테고리 카드 로딩 대기
    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.locator('div.cursor-pointer').first()).toBeVisible({ timeout: 15000 })

    // 세 가지 카테고리 모두 표시 확인
    const categories = ['AI 기초 개념', 'NumPy & Pandas', 'ML/DL 알고리즘']
    for (const catName of categories) {
      await expect(sidebar.getByText(catName)).toBeVisible({ timeout: 10000 })
    }

    await capture(page, '01-main-page-categories')
    console.log('✅ Step 1 완료: 메인 페이지 카테고리 목록 확인')
  })

  test('Step 2~3: "AI 기초 개념" 카테고리 선택 후 퀴즈 설정 패널 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

    // Step 2: "AI 기초 개념" 카테고리 카드 클릭
    await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

    await capture(page, '02-category-selected')
    console.log('✅ Step 2 완료: AI 기초 개념 카테고리 클릭')

    // Step 3: 퀴즈 설정 패널 확인 - 패널 컨텍스트 범위 지정
    const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
    await expect(settingsPanel).toBeVisible({ timeout: 5000 })

    // 난이도 섹션 확인 ("난이도" 레이블 텍스트 존재)
    await expect(settingsPanel.locator('p', { hasText: '난이도' })).toBeVisible()
    // 난이도 버튼: '전체'는 2개 존재(난이도/문항수)하므로 first()로 지정
    await expect(settingsPanel.getByRole('button', { name: '전체', exact: true }).first()).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '쉬움', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '보통', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '어려움', exact: true })).toBeVisible()

    // 문항 수 섹션 확인 ("문항 수" 레이블)
    await expect(settingsPanel.locator('p', { hasText: '문항 수' })).toBeVisible()
    // 문항 수 버튼 확인 (exact: true 로 '15문제' 오매칭 방지)
    await expect(settingsPanel.getByRole('button', { name: '5문제', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '10문제', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '15문제', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '20문제', exact: true })).toBeVisible()

    // 문제 순서 섹션 확인 ("문제 순서" 레이블)
    await expect(settingsPanel.locator('p', { hasText: '문제 순서' })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '순서대로', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '랜덤 셔플', exact: true })).toBeVisible()

    await capture(page, '03-quiz-settings-panel')
    console.log('✅ Step 3 완료: 퀴즈 설정 패널 (난이도, 문항수, 순서 버튼) 확인')
  })

  test('Step 4~5: 퀴즈 시작 및 /quiz 페이지 이동 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

    // 카테고리 선택
    await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

    const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
    await expect(settingsPanel).toBeVisible({ timeout: 5000 })

    // 5문제 선택
    await settingsPanel.getByRole('button', { name: '5문제', exact: true }).click()

    await capture(page, '04-before-start')

    // Step 4: 퀴즈 시작하기 버튼 클릭
    const startButton = settingsPanel.getByRole('button', { name: /퀴즈 시작하기/ })
    await expect(startButton).toBeVisible()
    await expect(startButton).toBeEnabled()
    await startButton.click()

    console.log('✅ Step 4 완료: 퀴즈 시작하기 버튼 클릭')

    // Step 5: /quiz 페이지 이동 확인
    await page.waitForURL('**/quiz', { timeout: 15000 })
    expect(page.url()).toContain('/quiz')

    // 진행률 바 확인 (ProgressBar: "0 / 5" 형태)
    const progressText = page.locator('span', { hasText: /^\d+ \/ \d+$/ }).first()
    await expect(progressText).toBeVisible({ timeout: 5000 })

    // 문제 카드 확인 (QuizCard - bg-white rounded-2xl 첫 번째 카드)
    const quizCard = page.locator('div.bg-white.rounded-2xl').first()
    await expect(quizCard).toBeVisible({ timeout: 5000 })

    await capture(page, '05-quiz-page')
    console.log('✅ Step 5 완료: /quiz 페이지 이동, 문제 카드 및 진행률 확인')
  })

  test('Step 6~7: 객관식 답안 선택 후 피드백 패널 확인 및 다음 버튼 클릭', async ({ page }) => {
    await startQuiz(page)

    // 퀴즈 페이지 문제 카드 로딩 대기
    const quizCard = page.locator('div.bg-white.rounded-2xl').first()
    await expect(quizCard).toBeVisible({ timeout: 5000 })

    await capture(page, '06-before-answer')

    // ChoiceButton: w-full flex items-center gap-3 p-4 rounded-xl border
    // QuizCard 내부의 객관식 보기 버튼 선택
    const choiceButton = page.locator('button.w-full.rounded-xl.border').first()
    await expect(choiceButton).toBeVisible({ timeout: 5000 })

    // Step 6: 첫 번째 보기 클릭
    await choiceButton.click()

    // FeedbackPanel 등장 확인 (mt-4 p-4 rounded-xl border)
    // 정답(border-green-400) 또는 오답(border-red-400) 패널
    const feedbackPanel = page.locator('div.mt-4.p-4.rounded-xl.border').first()
    await expect(feedbackPanel).toBeVisible({ timeout: 5000 })

    // 피드백 내 "정답입니다!" 또는 "오답입니다" 텍스트 확인
    const feedbackText = page.locator('span', { hasText: /정답입니다!|오답입니다/ }).first()
    await expect(feedbackText).toBeVisible({ timeout: 3000 })

    await capture(page, '06-feedback-panel')
    console.log('✅ Step 6 완료: 객관식 선택 후 피드백 패널(정답/오답+해설) 확인')

    // Step 7: "다음 →" 버튼 클릭
    const nextButton = page.getByRole('button', { name: /다음/ })
    await expect(nextButton).toBeVisible({ timeout: 3000 })
    await nextButton.click()

    // 2번 문제로 이동 확인 (문제 번호 "2 / 5")
    const questionCounter = page.locator('p', { hasText: /^2 \/ \d+$/ })
    await expect(questionCounter).toBeVisible({ timeout: 5000 })

    await capture(page, '07-next-question')
    console.log('✅ Step 7 완료: 다음 버튼 클릭 후 2번 문제로 이동 확인')
  })

  test('Step 8: 우측 문제 번호 네비게이터 확인', async ({ page }) => {
    await startQuiz(page)

    // 퀴즈 페이지 로딩 대기
    await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

    // Step 8: QuestionNavigator 패널 확인 ("문제 목록" 텍스트 포함)
    const navigator = page.locator('div.bg-white.rounded-2xl', { hasText: '문제 목록' })
    await expect(navigator).toBeVisible({ timeout: 5000 })

    // 문제 번호 버튼이 존재하는지 확인 (w-8 h-8 rounded-lg)
    const navButtons = navigator.locator('button.w-8.h-8.rounded-lg')
    const navButtonCount = await navButtons.count()
    expect(navButtonCount).toBeGreaterThan(0)
    console.log(`  -> 문제 네비게이터 버튼 수: ${navButtonCount}`)

    // 현재 문제(1번) 버튼이 파란색(활성) 상태인지 확인
    const currentNavButton = navigator.locator('button.bg-blue-600').first()
    await expect(currentNavButton).toBeVisible()

    // 범례 텍스트 확인
    await expect(navigator.getByText('완료')).toBeVisible()
    await expect(navigator.getByText('건너뜀')).toBeVisible()
    await expect(navigator.getByText('미풀이')).toBeVisible()

    await capture(page, '08-question-navigator')
    console.log('✅ Step 8 완료: 우측 문제 번호 네비게이터 확인')
  })
})
