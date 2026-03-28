/**
 * prerender.mjs
 * 빌드 후 정적 페이지들을 Puppeteer로 렌더링해 HTML 파일로 저장한다.
 * 크롤러(Google AdSense 심사 포함)가 콘텐츠를 인식할 수 있도록 하기 위함.
 *
 * 사용: node scripts/prerender.mjs
 * (npm run build 이후 실행. 내부적으로 vite preview 서버를 띄우고 종료)
 */

import { launch } from 'puppeteer';
import { preview } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

// prerender 대상 라우트 (상태 의존 페이지 /quiz, /result 제외)
const ROUTES = ['/', '/about', '/contact', '/privacy', '/report'];

const PORT = 4174;
const BASE_URL = `http://localhost:${PORT}`;

async function prerender() {
  // 빌드 결과물 확인
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist/ 디렉토리가 없습니다. 먼저 npm run build를 실행하세요.');
    process.exit(1);
  }

  // vite preview 서버 실행
  const previewServer = await preview({
    root: path.resolve(__dirname, '..'),
    preview: { port: PORT, open: false },
  });
  console.log(`🚀 preview 서버 시작: ${BASE_URL}`);

  const browser = await launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route}`;
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      // React 렌더링 완료 대기
      await page.waitForSelector('#root > *', { timeout: 15000 });

      const html = await page.content();
      await page.close();

      // 출력 경로: / → dist/index.html, /about → dist/about/index.html
      let outputPath;
      if (route === '/') {
        outputPath = path.join(DIST_DIR, 'index.html');
      } else {
        const routeDir = path.join(DIST_DIR, route);
        fs.mkdirSync(routeDir, { recursive: true });
        outputPath = path.join(routeDir, 'index.html');
      }

      fs.writeFileSync(outputPath, html, 'utf-8');
      console.log(`✅ ${route} → ${path.relative(process.cwd(), outputPath)}`);
    }
  } finally {
    await browser.close();
    previewServer.httpServer.close();
    console.log('🏁 prerender 완료');
  }
}

prerender().catch((err) => {
  console.error('❌ prerender 실패:', err);
  process.exit(1);
});
