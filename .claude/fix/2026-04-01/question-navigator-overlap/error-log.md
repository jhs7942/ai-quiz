# 문제 목록 네비게이터 버튼 겹침

## 발생 환경
- 날짜: 2026-04-01 / 관련 파일: `src/pages/QuizPage.tsx`, `src/components/quiz/QuestionNavigator.tsx` / 라이브러리·버전: Tailwind CSS v4, React 19

## 증상
데스크톱 뷰(≥1024px)의 문제 목록 네비게이터에서 번호 버튼들이 서로 겹쳐 표시됨.

## 원인
`QuizPage.tsx`의 데스크톱 사이드바 컨테이너 너비(`w-44` = 176px)가 너무 좁아
5열 그리드에 필요한 공간이 부족했음.

| 항목 | 값 |
|------|-----|
| 컨테이너 너비 (`w-44`) | 176px |
| 내부 패딩 (`p-4` × 2) | 32px |
| 가용 너비 | 144px |
| 버튼 5개 (`w-8` × 5) | 160px |
| gap 4개 (`gap-1.5` × 4) | 24px |
| 필요 너비 | **184px** (가용 너비 초과) |

## 해결책
`QuizPage.tsx` 251번째 줄, 사이드바 컨테이너 너비를 `w-44` → `w-56`으로 변경.

```diff
- <div className="hidden lg:block w-44 shrink-0">
+ <div className="hidden lg:block w-56 shrink-0">
```

`w-56` = 224px → 가용 너비 192px → 184px 수용 가능 (여유 8px)

## 재발 방지
고정 크기 버튼을 그리드에 배치할 때, 컨테이너 내부 가용 너비(컨테이너 - 패딩)가
`버튼크기 × 열수 + gap × (열수-1)` 이상인지 사전에 계산 확인.
