# E2E 테스트 결과: AI Quiz

## 테스트 환경
- URL: http://localhost:5173
- 브라우저: Chromium (Playwright MCP)
- 날짜: 2026-03-24

## 테스트 결과

| # | 시나리오 | 결과 | 비고 |
|---|----------|------|------|
| 1 | 메인 화면 렌더링 | PASS | 카테고리 목록, 안내 문구 정상 표시 |
| 2 | 카테고리 선택 | PASS | 체크박스 선택 시 퀴즈 설정 패널 노출 |
| 3 | 퀴즈 설정 패널 | PASS | 난이도/문항수/순서 버튼 동작 정상 |
| 4 | 퀴즈 시작 | PASS | /quiz 라우팅, 문제 카드 정상 표시 |
| 5 | 객관식 — 정답 선택 | PASS | 선택 후 버튼 활성화, 정답 피드백(초록) 표시 |
| 6 | 주관식 — 오답 입력 | PASS | 오답 피드백(빨강) + 정답 표시 정상 |
| 7 | 건너뛰기 | PASS | ◈ 표시로 상태 구분, 다음 문제 이동 |
| 8 | 신고 모달 | PASS | 5개 유형 라디오, 내용 입력, 취소/제출 버튼 |
| 9 | 나가기 확인 팝업 | PASS | 계속 풀기/나가기 팝업 정상 |
| 10 | 미풀이 문제 팝업 | PASS | "풀지 않은 문제 N개" 팝업 + 문제 풀러 가기/제출 |
| 11 | 결과 화면 | PASS | 도넛 차트, 탭, 리뷰 카드, 버튼 정상 |
| 12 | 결과 — 탭 전환 | PASS | 전체/맞은/틀린/건너뛴 탭 필터링 |
| 13 | quiz_sessions DB 저장 | **FAIL** | HTTP 400 에러 — 아래 이슈 참고 |
| 14 | 문제 번호 네비게이터 | PASS | ●완료 / ◈건너뜀 / 숫자 미풀이 구분 정상 |
| 15 | 프로그레스 바 | PASS | 채점 완료 수에 따라 % 업데이트 |

## 발견된 이슈

### Issue 1: quiz_sessions INSERT HTTP 400 에러
- **심각도**: warning (퀴즈 기능 자체에는 영향 없음 — silent fail)
- **에러 메시지**: `Failed to load resource: the server responded with a status of 400 @ supabase.co/rest/v1/quiz_sessions?select=id`
- **원인**: Supabase `quiz_sessions` 테이블에 RLS 정책이 설정되어 있으나, anon 키로 INSERT를 허용하는 Policy가 없거나 테이블 스키마가 코드와 불일치할 가능성
- **재현 방법**: 퀴즈 완료 후 결과 화면 진입 시 발생
- **스크린샷**: 10-result.png (콘솔 에러)
- **영향**: 퀴즈 풀이 기록이 DB에 저장되지 않음. 화면 동작은 정상

## 요약
- 전체: 15개 시나리오
- 통과: 14개 ✅
- 실패: 1개 ❌ (quiz_sessions DB 저장)

## 스크린샷 목록
- 01-main.png — 메인 화면
- 02-category-selected.png — 카테고리 선택 후 퀴즈 설정
- 03-quiz-start.png — 퀴즈 화면 (객관식)
- 04-correct-feedback.png — 정답 피드백
- 05-wrong-feedback.png — 오답 피드백 (주관식)
- 06-skip.png — 건너뛰기 후 ◈ 표시
- 07-report-modal.png — 신고 모달
- 08-exit-confirm.png — 나가기 확인 팝업
- 09-unanswered-popup.png — 미풀이 문제 팝업
- 10-result.png — 결과 화면
