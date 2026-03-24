/**
 * AI Quiz 웹앱 전체 E2E 시나리오 테스트
 * 스크린샷 저장 경로: /Users/jeonghyeonseung/workspaces/AI_quiz/.claude/fix/2026-03-24/
 */
import { test, expect, type Page } from '@playwright/test'

const SCREENSHOT_BASE = '/Users/jeonghyeonseung/workspaces/AI_quiz/.claude/fix/2026-03-24'

async function capture(page: Page, filename: string) {
  await page.screenshot({
    path: `${SCREENSHOT_BASE}/${filename}`,
    fullPage: false,
  })
}

// 5문제로 퀴즈 시작하는 공통 헬퍼
async function startQuiz(page: Page) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const sidebar = page.locator('aside.hidden.lg\\:flex')
  await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

  await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

  const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
  await expect(settingsPanel).toBeVisible({ timeout: 5000 })

  await settingsPanel.getByRole('button', { name: '5문제', exact: true }).click()
  await settingsPanel.getByRole('button', { name: /퀴즈 시작하기/ }).click()
  await page.waitForURL('**/quiz', { timeout: 15000 })
}

// 현재 문제 유형을 판별하고 답변하는 헬퍼
async function answerCurrentQuestion(page: Page) {
  const isMultiple = await page.locator('button.w-full.rounded-xl.border').first().isVisible({ timeout: 2000 }).catch(() => false)
  if (isMultiple) {
    await page.locator('button.w-full.rounded-xl.border').first().click()
  } else {
    // 주관식: 간단한 답 입력
    const input = page.locator('input[placeholder="답을 입력하세요"]')
    const isInputVisible = await input.isVisible({ timeout: 2000 }).catch(() => false)
    if (isInputVisible) {
      await input.fill('테스트 답변')
    }
  }
  // 정답 확인 버튼 클릭
  const checkBtn = page.getByRole('button', { name: '정답 확인', exact: true })
  const isCheckVisible = await checkBtn.isVisible({ timeout: 2000 }).catch(() => false)
  if (isCheckVisible) {
    const isEnabled = await checkBtn.isEnabled({ timeout: 1000 }).catch(() => false)
    if (isEnabled) {
      await checkBtn.click()
      // 피드백 패널 로딩 대기
      await page.locator('div.mt-4.p-4.rounded-xl.border').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    }
  }
}

test.describe('시나리오 1: 메인 페이지 로딩', () => {
  test('사이드바 카테고리 목록 및 카드 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 사이드바 헤딩 확인
    const sidebarHeading = page.locator('h2', { hasText: '퀴즈 카테고리' })
    await expect(sidebarHeading).toBeVisible({ timeout: 10000 })

    // 카테고리 카드 로딩 대기
    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.locator('div.cursor-pointer').first()).toBeVisible({ timeout: 15000 })

    // 카테고리 목록 확인
    for (const cat of ['AI 기초 개념', 'NumPy & Pandas', 'ML/DL 알고리즘']) {
      await expect(sidebar.getByText(cat)).toBeVisible({ timeout: 10000 })
    }

    await capture(page, '01-main.png')
    console.log('PASS: 시나리오 1 - 메인 페이지 로딩')
  })
})

test.describe('시나리오 2: 카테고리 선택 & 퀴즈 설정', () => {
  test('첫 번째 카테고리 클릭 후 퀴즈 설정 패널 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

    // 첫 번째 카테고리 클릭
    await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

    // 퀴즈 설정 패널 확인
    const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
    await expect(settingsPanel).toBeVisible({ timeout: 5000 })

    // 난이도 필터 확인
    await expect(settingsPanel.locator('p', { hasText: '난이도' })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '전체', exact: true }).first()).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '쉬움', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '보통', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '어려움', exact: true })).toBeVisible()

    // 문항 수 확인
    await expect(settingsPanel.locator('p', { hasText: '문항 수' })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '5문제', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '10문제', exact: true })).toBeVisible()

    // 문제 순서 확인
    await expect(settingsPanel.locator('p', { hasText: '문제 순서' })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '순서대로', exact: true })).toBeVisible()
    await expect(settingsPanel.getByRole('button', { name: '랜덤 셔플', exact: true })).toBeVisible()

    await capture(page, '02-category-settings.png')
    console.log('PASS: 시나리오 2 - 카테고리 선택 & 퀴즈 설정 패널')
  })
})

test.describe('시나리오 3: 퀴즈 시작', () => {
  test('5문제 선택 후 퀴즈 시작 -> /quiz 이동 및 문제 카드 확인', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar.getByText('AI 기초 개념')).toBeVisible({ timeout: 15000 })

    await sidebar.locator('div.cursor-pointer', { hasText: 'AI 기초 개념' }).click()

    const settingsPanel = page.locator('div.bg-white.rounded-2xl', { hasText: '퀴즈 설정' })
    await expect(settingsPanel).toBeVisible({ timeout: 5000 })

    // 5문제 선택
    await settingsPanel.getByRole('button', { name: '5문제', exact: true }).click()

    // 퀴즈 시작
    const startBtn = settingsPanel.getByRole('button', { name: /퀴즈 시작하기/ })
    await expect(startBtn).toBeVisible()
    await expect(startBtn).toBeEnabled()
    await startBtn.click()

    // /quiz 이동 확인
    await page.waitForURL('**/quiz', { timeout: 15000 })
    expect(page.url()).toContain('/quiz')

    // 문제 카드 확인
    const quizCard = page.locator('div.bg-white.rounded-2xl').first()
    await expect(quizCard).toBeVisible({ timeout: 5000 })

    // 문제 번호 표시 확인 (1 / 5)
    const questionNum = page.locator('p', { hasText: /^1 \/ \d+$/ })
    await expect(questionNum).toBeVisible({ timeout: 5000 })

    // 프로그레스 바 확인 (0 / 5 형태)
    const progressText = page.locator('span', { hasText: /^\d+ \/ \d+$/ }).first()
    await expect(progressText).toBeVisible({ timeout: 5000 })

    await capture(page, '03-quiz-start.png')
    console.log('PASS: 시나리오 3 - 퀴즈 시작 및 /quiz 이동')
  })
})

test.describe('시나리오 4: 객관식 답변 & 피드백', () => {
  test('객관식 선택 후 정답 확인 버튼 클릭, 피드백 표시 확인', async ({ page }) => {
    await startQuiz(page)

    const quizCard = page.locator('div.bg-white.rounded-2xl').first()
    await expect(quizCard).toBeVisible({ timeout: 5000 })

    // 객관식 보기가 있는지 확인
    const choiceBtn = page.locator('button.w-full.rounded-xl.border').first()
    const isMultiple = await choiceBtn.isVisible({ timeout: 3000 }).catch(() => false)

    if (isMultiple) {
      // 첫 번째 보기 클릭
      await choiceBtn.click()

      // 정답 확인 버튼 클릭
      const checkBtn = page.getByRole('button', { name: '정답 확인', exact: true })
      await expect(checkBtn).toBeVisible({ timeout: 3000 })
      await expect(checkBtn).toBeEnabled()
      await checkBtn.click()

      // 피드백 패널 확인
      const feedbackPanel = page.locator('div.mt-4.p-4.rounded-xl.border').first()
      await expect(feedbackPanel).toBeVisible({ timeout: 5000 })

      // 정답/오답 텍스트 확인
      const feedbackText = page.locator('span', { hasText: /정답입니다!|오답입니다/ }).first()
      await expect(feedbackText).toBeVisible({ timeout: 3000 })

      // 다음 버튼 활성화 확인
      const nextBtn = page.getByRole('button', { name: /다음/ })
      await expect(nextBtn).toBeVisible({ timeout: 3000 })

      await capture(page, '04-feedback.png')
      console.log('PASS: 시나리오 4 - 객관식 피드백 확인')
    } else {
      // 주관식인 경우
      const input = page.locator('input[placeholder="답을 입력하세요"]')
      await expect(input).toBeVisible({ timeout: 3000 })
      await input.fill('테스트 답변')

      const checkBtn = page.getByRole('button', { name: '정답 확인', exact: true })
      await expect(checkBtn).toBeEnabled()
      await checkBtn.click()

      const feedbackPanel = page.locator('div.mt-4.p-4.rounded-xl.border').first()
      await expect(feedbackPanel).toBeVisible({ timeout: 5000 })

      await capture(page, '04-feedback.png')
      console.log('PASS: 시나리오 4 - 주관식 피드백 확인')
    }
  })
})

test.describe('시나리오 5: 건너뛰기 기능', () => {
  test('건너뛰기 버튼 클릭 후 다음 문제 이동 확인', async ({ page }) => {
    await startQuiz(page)

    await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

    // 건너뛰기 버튼 확인 (채점 전에만 표시)
    const skipBtn = page.getByRole('button', { name: '건너뛰기', exact: true })
    await expect(skipBtn).toBeVisible({ timeout: 3000 })

    // 건너뛰기 클릭
    await skipBtn.click()

    // 다음 문제(2번)로 이동 확인
    const questionNum2 = page.locator('p', { hasText: /^2 \/ \d+$/ })
    await expect(questionNum2).toBeVisible({ timeout: 5000 })

    await capture(page, '05-skip.png')
    console.log('PASS: 시나리오 5 - 건너뛰기 기능')
  })
})

test.describe('시나리오 6: 문제 번호 네비게이터', () => {
  test('네비게이터 패널 확인 및 특정 문제 이동', async ({ page }) => {
    await startQuiz(page)

    await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

    // 데스크톱 네비게이터 확인 (문제 목록 패널)
    const navigator = page.locator('div.bg-white.rounded-2xl', { hasText: '문제 목록' })
    await expect(navigator).toBeVisible({ timeout: 5000 })

    // 문제 번호 버튼 개수 확인
    const navBtns = navigator.locator('button.w-8.h-8.rounded-lg')
    const btnCount = await navBtns.count()
    expect(btnCount).toBeGreaterThan(0)

    // 현재 문제(1번) 파란색 활성 상태 확인
    const activeBluBtn = navigator.locator('button.bg-blue-600').first()
    await expect(activeBluBtn).toBeVisible()

    // 범례 확인
    await expect(navigator.getByText('완료')).toBeVisible()
    await expect(navigator.getByText('건너뜀')).toBeVisible()
    await expect(navigator.getByText('미풀이')).toBeVisible()

    await capture(page, '06-navigator.png')
    console.log(`PASS: 시나리오 6 - 문제 번호 네비게이터 (버튼 수: ${btnCount})`)
  })
})

test.describe('시나리오 7: 퀴즈 완료 & 결과 화면', () => {
  test('5문제 모두 풀고 결과 화면 이동 및 도넛차트+탭 확인', async ({ page }) => {
    await startQuiz(page)

    // 5문제 모두 답변
    for (let i = 0; i < 5; i++) {
      await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

      await answerCurrentQuestion(page)

      const isLastQuestion = i === 4
      if (isLastQuestion) {
        // 결과 보기 버튼 클릭
        const resultBtn = page.getByRole('button', { name: /결과 보기/ })
        const isResultVisible = await resultBtn.isVisible({ timeout: 3000 }).catch(() => false)
        if (isResultVisible) {
          await resultBtn.click()
        }
      } else {
        // 다음 버튼 클릭
        const nextBtn = page.getByRole('button', { name: /다음/ })
        const isNextVisible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)
        if (isNextVisible) {
          await nextBtn.click()
          // 다음 문제 로딩 대기
          await page.locator('p', { hasText: new RegExp(`^${i + 2} \\/ \\d+$`) }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
        }
      }
    }

    // /result 이동 확인 (팝업이 뜰 경우 처리)
    const unansweredModal = page.locator('h2', { hasText: '아직 풀지 않은 문제가 있어요' })
    const isUnansweredVisible = await unansweredModal.isVisible({ timeout: 2000 }).catch(() => false)
    if (isUnansweredVisible) {
      await page.getByRole('button', { name: '제출' }).click()
    }

    await page.waitForURL('**/result', { timeout: 15000 })
    expect(page.url()).toContain('/result')

    // 결과 화면 요소 확인
    const resultHeading = page.locator('h1', { hasText: /\d+ \/ \d+ 정답/ })
    await expect(resultHeading).toBeVisible({ timeout: 5000 })

    // 도넛 차트(SVG) 확인
    const chart = page.locator('svg').first()
    await expect(chart).toBeVisible({ timeout: 5000 })

    // 탭 확인
    const tabAll = page.getByRole('button', { name: /전체/ })
    await expect(tabAll).toBeVisible({ timeout: 3000 })
    const tabCorrect = page.getByRole('button', { name: /맞은/ })
    await expect(tabCorrect).toBeVisible({ timeout: 3000 })
    const tabWrong = page.getByRole('button', { name: /틀린/ })
    await expect(tabWrong).toBeVisible({ timeout: 3000 })
    const tabSkipped = page.getByRole('button', { name: /건너뛴/ })
    await expect(tabSkipped).toBeVisible({ timeout: 3000 })

    await capture(page, '07-result.png')
    console.log('PASS: 시나리오 7 - 결과 화면 (도넛차트 + 탭)')
  })
})

test.describe('시나리오 8: 결과 화면 액션 버튼', () => {
  test('오답 다시 풀기, 같은 문제 다시 풀기, 새 퀴즈 생성 버튼 확인', async ({ page }) => {
    await startQuiz(page)

    // 5문제 모두 빠르게 답변
    for (let i = 0; i < 5; i++) {
      await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })
      await answerCurrentQuestion(page)

      if (i < 4) {
        const nextBtn = page.getByRole('button', { name: /다음/ })
        const visible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)
        if (visible) await nextBtn.click()
      } else {
        const resultBtn = page.getByRole('button', { name: /결과 보기/ })
        const visible = await resultBtn.isVisible({ timeout: 3000 }).catch(() => false)
        if (visible) await resultBtn.click()
      }
    }

    const unansweredModal = page.locator('h2', { hasText: '아직 풀지 않은 문제가 있어요' })
    const isUnansweredVisible = await unansweredModal.isVisible({ timeout: 2000 }).catch(() => false)
    if (isUnansweredVisible) {
      await page.getByRole('button', { name: '제출' }).click()
    }

    await page.waitForURL('**/result', { timeout: 15000 })

    // 액션 버튼 확인
    await expect(page.getByRole('button', { name: '오답만 다시 풀기' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: '같은 문제 다시 풀기' })).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('button', { name: '새 퀴즈 생성' })).toBeVisible({ timeout: 3000 })

    await capture(page, '08-result-actions.png')
    console.log('PASS: 시나리오 8 - 결과 화면 액션 버튼')
  })
})

test.describe('시나리오 9: 문제 오류 신고 기능', () => {
  test('신고하기 버튼 클릭 후 모달 확인, 취소 클릭으로 닫기', async ({ page }) => {
    await startQuiz(page)

    await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

    // 신고하기 버튼 클릭
    const reportBtn = page.getByRole('button', { name: /신고하기/ })
    await expect(reportBtn).toBeVisible({ timeout: 5000 })
    await reportBtn.click()

    // 신고 모달 확인
    const modalTitle = page.locator('h3', { hasText: '문제 오류 신고' })
    await expect(modalTitle).toBeVisible({ timeout: 5000 })

    // 신고 유형 라디오 버튼 확인
    const radioInputs = page.locator('input[type="radio"][name="reportType"]')
    const radioCount = await radioInputs.count()
    expect(radioCount).toBeGreaterThan(0)

    // 상세 내용 텍스트 영역 확인
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // 첫 번째 신고 유형 선택
    await radioInputs.first().click()

    await capture(page, '09-report-modal.png')

    // 취소 버튼 클릭 후 모달 닫기
    const cancelBtn = page.getByRole('button', { name: '취소' })
    await expect(cancelBtn).toBeVisible({ timeout: 3000 })
    await cancelBtn.click()

    // 모달 닫힘 확인
    await expect(modalTitle).not.toBeVisible({ timeout: 3000 })

    console.log('PASS: 시나리오 9 - 문제 오류 신고 기능')
  })
})

test.describe('시나리오 10: 나가기 팝업', () => {
  test('퀴즈 중 나가기 버튼 클릭 후 팝업 확인, 계속 풀기로 닫기', async ({ page }) => {
    await startQuiz(page)

    await expect(page.locator('div.bg-white.rounded-2xl').first()).toBeVisible({ timeout: 5000 })

    // 나가기 버튼 클릭
    const exitBtn = page.getByRole('button', { name: '나가기' })
    await expect(exitBtn).toBeVisible({ timeout: 5000 })
    await exitBtn.click()

    // 나가기 확인 팝업 확인
    const popupTitle = page.locator('h2', { hasText: '퀴즈를 나가시겠습니까?' })
    await expect(popupTitle).toBeVisible({ timeout: 5000 })

    // 팝업 내 텍스트 확인
    const popupBody = page.locator('p', { hasText: '진행 상황이 사라집니다.' })
    await expect(popupBody).toBeVisible({ timeout: 3000 })

    await capture(page, '10-exit-popup.png')

    // 계속 풀기 버튼 클릭 후 팝업 닫기
    const continueBtn = page.getByRole('button', { name: '계속 풀기' })
    await expect(continueBtn).toBeVisible({ timeout: 3000 })
    await continueBtn.click()

    // 팝업 닫힘 확인
    await expect(popupTitle).not.toBeVisible({ timeout: 3000 })

    // 퀴즈 페이지 유지 확인
    expect(page.url()).toContain('/quiz')

    console.log('PASS: 시나리오 10 - 나가기 팝업')
  })
})
