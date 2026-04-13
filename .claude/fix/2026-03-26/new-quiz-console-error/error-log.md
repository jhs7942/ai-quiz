# 새 퀴즈 생성 클릭 시 React 렌더링 에러

## 발생 환경
- 날짜: 2026-03-26 / 관련 파일: `src/pages/ResultPage.tsx` (추정) / 라이브러리: React 19, react-router-dom

## 증상
결과 페이지(`/result`)에서 "새 퀴즈 생성" 버튼 클릭 시 브라우저 콘솔에 에러 2건 발생.

```
Cannot update a component (`BrowserRouter`) while rendering
a different component (`ResultPage`).
```
```
There was an error during concurrent rendering but React was able to
recover by instead synchronously rendering the entire root.
```

화면 동작 자체는 정상(`/`으로 이동)이나 콘솔에 에러 기록됨.

## 원인
`ResultPage` 컴포넌트의 렌더 함수 실행 중 `navigate()`(useNavigate 훅)를 직접 호출.
React는 렌더 단계에서 다른 컴포넌트(`BrowserRouter`)의 상태를 업데이트하는 것을 금지함.
이는 React Concurrent 모드에서 예측 불가 동작을 유발할 수 있는 안티패턴임.

## 해결책
렌더 중 호출되는 `navigate()` 를 `useEffect`로 감싸 렌더 완료 후 실행되도록 수정.

```tsx
// ❌ 잘못된 패턴
if (shouldRedirect) {
  navigate('/');
}

// ✅ 올바른 패턴
useEffect(() => {
  if (shouldRedirect) {
    navigate('/');
  }
}, [shouldRedirect, navigate]);
```

## 재발 방지
- 렌더 함수 본문에서 `navigate()`, `setState()` 등 부수효과 호출 금지
- ESLint 규칙 `react/no-render-side-effects` 또는 `react-hooks/rules-of-hooks` 활성화 검토
- 코드 리뷰 시 렌더 중 라우터 상태 변경 패턴 체크리스트 추가
