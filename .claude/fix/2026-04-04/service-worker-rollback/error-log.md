# Service Worker(PWA) 배포 후 롤백

## 발생 환경
- 날짜: 2026-04-04 / 관련 파일: `vite.config.ts`, `.npmrc` / `vite-plugin-pwa@1.2.0`, `vite@8.0.2`

## 증상
1. **Vercel 빌드 실패**: `vite-plugin-pwa@1.2.0`이 `vite@"^3~^7"` peer dep을 선언하나 프로젝트는 `vite@8.0.2` 사용
   - 로컬: `--legacy-peer-deps`로 설치 성공
   - Vercel CI: `npm ci` 기본 실행으로 peer dep 충돌 → 빌드 실패
2. **DB 저장 문제와 결합**: PWA + 배치 저장 + RLS 문제가 동시에 존재하여 디버깅 복잡도 증가

## 원인
- `vite-plugin-pwa`가 아직 Vite 8을 공식 지원하지 않음 (peer dep 범위: `^3 || ^4 || ^5 || ^6 || ^7`)
- `.npmrc`에 `legacy-peer-deps=true` 추가로 Vercel 빌드는 통과했으나, PWA 기능 자체의 안정성 미검증
- 배치 저장 구현과 동시 배포되어 DB 저장 실패 원인 분리가 어려웠음

## 해결책
- `git reset --hard a357920`으로 4개 커밋 롤백 (PWA, .npmrc, 배치 저장, 모의고사 저장 수정)
- `git push --force`로 원격 반영
- 이후 필요한 기능만 개별적으로 재구현:
  - 모의고사 quiz_answers 저장 스킵 조건 제거
  - 문제별 즉시 저장 (배치 저장 대신 개별 INSERT 방식으로 변경)

## 재발 방지
- Vite 메이저 버전 업그레이드 시 플러그인 호환성 확인 필수
- `--legacy-peer-deps` 사용 시 `.npmrc`에도 반영해야 CI 환경에서 동작
- 여러 기능을 한 번에 배포하지 말고, 기능별로 분리 커밋 및 배포하여 문제 격리 용이하게 할 것
