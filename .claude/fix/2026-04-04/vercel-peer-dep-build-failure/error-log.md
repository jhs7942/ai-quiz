# Vercel 빌드 실패 — vite-plugin-pwa peer dependency 충돌

## 발생 환경
- 날짜: 2026-04-04
- 관련 파일: `ai-quiz/package.json`, `ai-quiz/.npmrc`
- 라이브러리·버전: vite@8.0.2, vite-plugin-pwa@1.2.0

## 증상

GitHub 푸시 후 Vercel 자동 배포 실패.
로컬 `npm run build`는 정상 성공하나 Vercel CI에서만 빌드 오류 발생.

예상 에러 메시지 (Vercel 로그):
```
npm error ERESOLVE could not resolve
npm error peer vite@"^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
npm error from vite-plugin-pwa@1.2.0
npm error Found: vite@8.0.2
```

## 원인

`vite-plugin-pwa@1.2.0`의 peer dependency 선언이 vite v7까지만 지원:

```
"peerDependencies": {
  "vite": "^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"
}
```

프로젝트는 `vite@8.0.2` 사용 중으로 범위 불일치.

| 환경 | npm 설치 방식 | peer dep 처리 | 결과 |
|------|-------------|--------------|------|
| 로컬 | `npm install --legacy-peer-deps` | 충돌 무시 | 설치·빌드 성공 |
| Vercel CI | `npm ci` (기본값) | 충돌 시 오류 | 설치 실패 → 빌드 불가 |

로컬 설치 시 `--legacy-peer-deps` 플래그로 우회했으나,
이 플래그가 프로젝트 설정에 반영되지 않아 Vercel에서 동일하게 적용되지 않음.

## 해결책

`ai-quiz/.npmrc` 파일 생성:

```
legacy-peer-deps=true
```

Vercel은 빌드 시 `.npmrc`를 자동으로 인식하여 동일한 플래그로 `npm ci` 실행.

## 재발 방지

- `--legacy-peer-deps`로 패키지를 설치했다면 반드시 `.npmrc`에 동일 설정을 추가한다.
- 신규 패키지 도입 시 `npm install` 전에 peer dependency 호환 여부를 확인한다.
  ```bash
  npm info {패키지명} peerDependencies
  ```
- CI 환경(Vercel, GitHub Actions 등)은 로컬과 달리 플래그를 공유하지 않으므로,
  로컬에서 플래그를 사용했다면 설정 파일(`.npmrc`)로 옮겨야 한다.
