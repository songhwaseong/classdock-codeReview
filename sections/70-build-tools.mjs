// 빌드·검증 도구 — 앱 화면에 로드되지 않고 개발·배포 과정에서만 실행되는 코드.

import { statSync } from 'node:fs';
import path from 'node:path';

import { sourceLines, formatLines } from '../lib/source-metrics.mjs';

// manifest 에 실린 src/js 전체 줄 수. "전역 스크립트로 6만 줄" 이라고 적어 두었던 문장이
// 실제 118,000줄이 될 때까지 그대로 남아 있었다 — 산출물 크기와 같은 이유로 여기서도 잰다.
const scriptTotalLines = (rootDir, manifest) => {
  const total = manifest.localScripts.reduce(
    (sum, file) => sum + (sourceLines(rootDir, `src/js/${file}`) ?? 0),
    0,
  );
  return total ? formatLines(total) : null;
};

// 산출물 크기는 손으로 적지 않는다. 19MB 로 적어 둔 문장이 실제 30MB 가 될 때까지
// 아무도 눈치채지 못했다(악보 MP3 샘플이 들어오며 커졌다). 있으면 재고, 없으면 그 사실을 적는다.
const artifactSize = (rootDir, name) => {
  try {
    return `${(statSync(path.join(rootDir, name)).size / 1024 / 1024).toFixed(1)}MiB`;
  } catch {
    return null;
  }
};

export default ({ manifest, helpers, diagrams, rootDir }) => {
  const { sec } = helpers;
  const CAT = '빌드 · 도구';
  const vendorCount = manifest.vendorScripts.length;
  const offlineSize = artifactSize(rootDir, 'classdock-offline.html');
  const exeSize = artifactSize(rootDir, 'ClassDock.exe');
  const scriptLines = scriptTotalLines(rootDir, manifest);
  const sampleLines = sourceLines(rootDir, 'tools/make-sample-files.py');

  return [
    sec({
      id: 'pipeline-overview',
      category: CAT,
      group: '개요',
      title: '빌드·검증 파이프라인',
      subtitle: 'npm run verify → desktop\\build.bat',
      summary:
        'npm run verify 한 줄이 check → test → build → release-check 를 순서대로 겁니다. 한 단계라도 실패하면 다음으로 넘어가지 않습니다. ' +
        'EXE 재생성만 수동 단계이며, AGENTS.md 에 "실행 중 프로세스 종료 → 오프라인 HTML 생성 → build.bat" 순서가 규칙으로 적혀 있습니다.',
      diagram: diagrams.pipeline,
      usage: [
        {
          title: '검사의 성격',
          body:
            '이 프로젝트의 검사는 대부분 "코드가 도는가"가 아니라 "목록끼리 일치하는가"입니다 — HTML 태그 순서 vs manifest, ' +
            'MNLazy 묶음 vs manifest lazy 목록, vendor 해시 vs 실제 파일, manifest 파일명 vs 문서 표. 전역 스크립트 구조의 취약점을 도구로 메운 것입니다.',
        },
        {
          title: '생성 파일',
          body:
            'classdock-offline.html, desktop/app.html, 사용법.html, THIRD_PARTY_NOTICES.txt, vendor/korean-font.js, vendor/korean-hunspell-worker.js, vendor/hand-font-*.js(손글씨), vendor/korea-regions.js·korea-emd.js(행정경계) 는 생성물입니다. ' +
            '직접 고치면 다음 빌드에 덮어써지거나 --check 에 걸립니다 — 만드는 도구는 아래 "문서 생성기"·"자산 생성기" 섹션에 있습니다.',
        },
        {
          title: '오프라인 원칙의 강제',
          body:
            'check-release.js 가 오프라인 HTML 에 네트워크 script URL 이 하나도 남지 않았는지 확인합니다. "오프라인 우선"이 구호가 아니라 검사 대상입니다.',
        },
      ],
      features: [
        { title: 'check', body: 'ESLint(전역 스크립트의 최상위 선언을 모아 no-undef 에 알려 줌) → tools/check-source.js(문법·전역 충돌·계층·의존·공개 API·지연 vendor) → 라이선스 고지 동기화(--check).' },
        { title: 'test', body: 'node --test tests/*.test.js — 단위·계약 테스트.' },
        { title: 'build', body: '맞춤법 워커 빌드 → 사용법.md → 사용법.html → 라이선스 고지 생성 → build-offline.js 로 단일 HTML 생성(빌드 정보 블록을 새김).' },
        { title: 'release-check', body: 'tools/check-release.js — 로컬 경로 잔존·vendor 해시·산출물 검사.' },
      ],
      files: [
        { path: 'package.json', label: 'package.json', description: 'verify 스크립트 정의' },
        { path: 'AGENTS.md', label: 'AGENTS.md', description: 'EXE 반영 절차 규칙' },
        { path: 'eslint.config.cjs', label: 'eslint.config.cjs', description: 'manifest 의 스크립트에서 모은 전역 선언을 no-undef 에 넘기는 설정' },
        { path: 'tools/source-globals.js', label: 'source-globals.js', description: '전역 스크립트의 최상위 선언 이름 모으기(espree)' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"검사 가능한 구조 계약"을 다층으로 쌓았습니다. 번들러·타입 시스템 없이 전역 스크립트로 ' +
            `${scriptLines ? `${scriptLines}줄` : '10만 줄대'}(파일 ${manifest.localScripts.length}개)을 유지하려면 이런 도구가 필수인데, 실제로 갖춰 놓았습니다.`,
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'verify 에 타입 검사가 없습니다. 전역 이름의 오타는 이제 ESLint 가 잡습니다 — source-globals.js 가 manifest 순서의 스크립트들에서 최상위 선언을 모아 no-undef 에 알려 주므로, ' +
            '어느 파일에도 선언되지 않은 이름을 쓰면 check 에서 실패합니다. 하지만 속성 이름(obj.foo)의 오타나 함수 인자 모양의 어긋남은 여전히 런타임에야 드러나고, state.js 의 100개짜리 구조 분해 같은 곳이 그 자리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'E2E(Playwright)는 verify 에 포함되지 않습니다. 별도로 npm run test:e2e 를 돌려야 하므로 화면 회귀는 자동 게이트 밖입니다.',
        },
      ],
    }),

    sec({
      id: 'tool-build-offline',
      category: CAT,
      group: '빌드',
      title: 'build-offline.js — 단일 파일 생성기',
      subtitle: 'HTML·CSS·JS·vendor 를 한 파일로',
      summary:
        'classdock.html 을 읽어 로컬 CSS 와 애플리케이션 스크립트를 인라인하고, CDN/vendor script 태그를 번들 파일로 바꾸고, ' +
        'pdf.worker 를 런타임 Blob 용 text/js-worker 블록으로 심어 classdock-offline.html 을 만듭니다. ' +
        `vendor ${vendorCount}개의 sha384 를 만들 때마다 검증해 파일이 조용히 바뀐 경우를 잡습니다.`,
      usage: [
        {
          title: '해시 검증의 이중 계산',
          body:
            '원본 바이트로 계산한 해시가 맞지 않으면 줄바꿈(CRLF→LF)을 정규화한 바이트로 다시 계산합니다. Windows 체크아웃에서 텍스트 vendor 의 줄바꿈이 바뀌는 문제를 흡수합니다.',
        },
        {
          title: '스크립트 종료 태그 이스케이프',
          body:
            'esc() 가 소스 안의 "</script" 를 "<\\/script" 로 바꿉니다. 인라인할 때 문자열 안의 종료 태그가 HTML 을 조기 종료시키는 고전적 문제를 막습니다.',
        },
        {
          title: '지연 vendor 처리',
          body:
            '지연 로드 대상은 실행되는 script 가 아니라 text/plain 블록(data-mn-lazy 속성)으로 심습니다. MNLazy 가 필요할 때 그 텍스트를 꺼내 실행합니다.',
        },
      ],
      features: [
        { title: '태그 존재 확인', body: 'requireTag 가 예상한 태그가 없으면 즉시 실패시킵니다. HTML 구조가 바뀌면 조용히 잘못 만들지 않습니다.' },
        { title: '무결성 실패', body: 'verifyVendorIntegrity 가 해시 불일치를 예외로 던집니다.' },
        {
          title: '새로 들어온 고정본',
          body:
            'vendor/sql-formatter.min.js 가 DB 클라이언트의 SQL 정렬용으로 더해졌습니다. ' +
            'MNLazy 의 sqlFormat 묶음으로 지연 로드되므로 시작 비용은 늘지 않고, 라이선스 사본도 vendor/licenses 에 함께 들어왔습니다 — ' +
            '이 레포가 vendor 를 더할 때 지켜 온 두 가지(해시 고정 · 라이선스 동봉)를 그대로 따랐습니다.',
        },
        {
          title: '산출물 크기',
          body:
            (offlineSize && exeSize
              ? `생성 시점의 오프라인 HTML 은 ${offlineSize}, EXE 는 ${exeSize} 입니다. `
              : '이 리뷰를 만들 때 빌드 산출물이 없어 크기를 재지 못했습니다. ') +
            '용량의 큰 몫은 Pyodide·폰트·문서 라이브러리이고, 2026-08-13 에 악보 악기 샘플 MP3 49개(9.5MB)가 base64 로 더해지며 한 번 더 뛰었습니다.',
        },
      ],
      files: [{ path: 'build-offline.js', label: 'build-offline.js', description: '단일 파일 생성기 전체' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"</script" 이스케이프와 줄바꿈 정규화 재계산 — 인라인 빌드에서 실제로 물리는 두 함정을 모두 처리했습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '태그를 못 찾으면 경고가 아니라 종료입니다. 빌드 도구는 조용히 반쪽짜리 산출물을 만드는 것이 가장 나쁜 실패 방식입니다.',
        },
      ],
    }),

    sec({
      id: 'tool-check-source',
      category: CAT,
      group: '검사',
      title: 'tools/check-source.js — 구조 계약 검사',
      subtitle: '이 프로젝트를 지탱하는 도구',
      summary:
        'JavaScript 문법, 전역 선언 충돌, manifest 로딩 계층, 공개 API 경계, 지연 vendor 계약을 한 번에 검사합니다. ' +
        '번들러도 타입 시스템도 없는 이 프로젝트에서 구조가 무너지지 않게 붙잡는 유일한 자동 장치입니다.',
      usage: [
        {
          title: '전역 충돌 검사',
          body:
            'vm 모듈로 각 스크립트를 평가해 전역에 무엇을 선언하는지 수집하고 충돌을 찾습니다. 전역 스크립트 방식에서 가장 위험한 사고(같은 이름 재선언)를 잡습니다.',
        },
        {
          title: '검사 5종',
          body:
            '① HTML script 순서 = manifest.localScripts ② applicationLayers 가 모든 파일을 정확히 한 번씩 ③ scriptDependencies 순서 역전 없음 ' +
            '④ moduleBoundaries 의 publicApi 선언·소비자 참조·로드 순서 ⑤ MNLazy 묶음 ↔ manifest lazy vendor 쌍방 일치.',
        },
        {
          title: '지연 vendor 이중 검사',
          body:
            'BUNDLES 에 있는데 manifest 에 lazy 로 없으면 실패하고, manifest 에 lazy 인데 어느 묶음에도 없으면 실패합니다. 한쪽만 고친 상태를 허용하지 않습니다.',
        },
      ],
      features: [
        { title: '태그 잔존 검사', body: '지연 vendor 의 script 태그가 HTML 에 남아 있으면 실패시킵니다.' },
        { title: '플레이스홀더', body: '<!--MN_LAZY_VENDOR--> 자리표시자가 없으면 실패합니다.' },
        { title: 'vendor 파일 존재', body: 'manifest 에 적힌 vendor 파일이 실제로 있는지 확인합니다.' },
      ],
      files: [{ path: 'tools/check-source.js', label: 'check-source.js', description: '구조 계약 검사 전체' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '이 파일 하나가 "전역 스크립트라서 생기는 문제" 대부분을 자동으로 막습니다. 218줄로 얻는 안전성 대비 효율이 이 프로젝트에서 가장 높습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '경계 검사는 정규식으로 "이름을 언급하는가"만 봅니다. 주석 안에 이름만 적혀 있어도 통과하므로, 소비자 목록의 정확성은 "언급 여부" 수준에서만 보장됩니다.',
        },
      ],
    }),

    sec({
      id: 'tool-check-release',
      category: CAT,
      group: '검사',
      title: 'tools/check-release.js — 배포 산출물 검사',
      subtitle: '"오프라인"이 진짜인지 확인',
      summary:
        '생성된 단일 파일 빌드가 실행 가능한 자산을 모두 담고 있고 네트워크 script URL 은 하나도 없는지 검증합니다. ' +
        '의도적으로 DOM·브라우저 없이 도는 순수 검사이며, vendor URL 이 반드시 vendor/ 로 시작하는지도 봅니다.',
      usage: [
        {
          title: '실행 가능한 script 만 추출',
          body:
            'executableScriptSources 가 script 태그를 직접 파싱해 src 가 있는 것만 모읍니다. text/plain 지연 블록은 실행되지 않으므로 검사에서 제외하기 위한 구현입니다.',
        },
        {
          title: '해시 재검증',
          body: 'build-offline.js 와 같은 방식으로 vendor 해시를 다시 확인합니다. 빌드 이후 파일이 바뀌었는지 잡습니다.',
        },
      ],
      features: [
        { title: '네트워크 URL 금지', body: '오프라인 산출물에 http(s) script 가 하나라도 있으면 실패합니다.' },
        { title: 'vendor 로컬 강제', body: 'manifest 의 vendor src 가 vendor/ 로 시작하지 않으면 실패합니다.' },
      ],
      files: [{ path: 'tools/check-release.js', label: 'check-release.js', description: '배포 산출물 검사 전체' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"오프라인 우선"이라는 제품 약속을 자동 검사로 바꿨습니다. 이런 원칙은 보통 코드 리뷰에서 사람이 놓치는데, 여기서는 빌드가 막습니다.',
        },
      ],
    }),

    sec({
      id: 'tool-spell-worker',
      category: CAT,
      group: '빌드',
      title: 'tools/build-korean-spell-worker.mjs — 사전 워커 빌드',
      subtitle: 'esbuild 로 3MB 워커 생성',
      summary:
        'hunspell-wasm 과 hunspell-dict-ko 를 esbuild 로 묶어 vendor/korean-hunspell-worker.js 를 만들고, ' +
        'scripts.manifest.json 의 sha384 도 함께 갱신합니다. npm run build 가 오프라인 HTML 을 만들기 전에 먼저 실행합니다.',
      usage: [
        {
          title: '해시 자동 갱신',
          body:
            '생성물이 바뀌면 manifest 의 해시도 바뀌어야 하는데, 사람이 손으로 맞추면 반드시 어긋납니다. 도구가 함께 갱신하도록 만든 것이 옳습니다.',
        },
        {
          title: '빌드 의존성과 사용자 패키지의 분리',
          body: 'package.json 의 dependencies 인 hunspell-dict-ko 와 hunspell-wasm 은 사전 워커 빌드에만 씁니다. EXE가 설치하는 사용자 npm 패키지는 프로젝트 node_modules가 아니라 별도 캐시에 저장됩니다.',
        },
      ],
      features: [
        { title: 'esbuild', body: 'devDependency 로 esbuild 0.25.8 을 고정 버전으로 씁니다.' },
        { title: '지연 로드 대상', body: '결과물은 MNLazy 의 spellcheck 묶음으로만 로드됩니다.' },
      ],
      files: [{ path: 'tools/build-korean-spell-worker.mjs', label: 'build-korean-spell-worker.mjs', description: '워커 빌드 도구' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '생성물과 그 해시를 한 도구가 함께 갱신합니다. 사람이 맞춰야 하는 두 값이 있으면 반드시 어긋난다는 것을 전제한 설계입니다.',
        },
      ],
    }),

    sec({
      id: 'tool-download-pyodide',
      category: CAT,
      group: '자산',
      title: 'tools/download-pyodide.js — 오프라인 Python 자산',
      subtitle: 'vendor/pyodide 구성',
      summary:
        'EXE 의 오프라인 Python 실행에 필요한 Pyodide 코어와 패키지를 내려받아 vendor/pyodide 를 구성합니다. ' +
        'EXE 는 이 폴더를 /pyodide/ 로 로컬 서빙하고, 없으면 CDN 으로 폴백합니다.',
      usage: [
        {
          title: '레포에 들어 있는 것',
          body:
            'vendor/pyodide 에 pyodide.asm.wasm(35,805줄 상당), python_stdlib.zip, pyodide.asm.js, pyodide-lock.json, VERSION 이 커밋돼 있습니다. ' +
            'faker·pymysql 휠도 vendor/wheels 에 함께 들어 있습니다.',
        },
        {
          title: '버전 일치',
          body: 'python-run-context.js 의 PYODIDE_VER 상수(0.27.7)와 vendor/pyodide/VERSION 이 같아야 로컬 서빙과 폴백이 어긋나지 않습니다.',
        },
      ],
      features: [
        { title: '오프라인 실행', body: '이 자산이 있으면 로컬 Python 이 없어도 인터넷 없이 Pyodide 를 씁니다.' },
        { title: '휠 동봉', body: '수업에서 쓰는 패키지를 미리 넣어 pip 없이 쓸 수 있게 합니다.' },
      ],
      files: [
        { path: 'tools/download-pyodide.js', label: 'download-pyodide.js', description: '자산 내려받기 도구' },
        { path: 'vendor/pyodide/VERSION', label: 'pyodide VERSION', description: '고정 버전' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Pyodide 버전이 코드 상수와 vendor 파일 두 곳에 있습니다. 자동 검사가 없어 어긋나면 런타임에서만 드러납니다 — check-source 에 넣을 만한 항목입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'wasm·stdlib·휠이 레포에 커밋돼 있어 저장소가 큽니다. 오프라인 배포를 위해 감수한 비용입니다.',
        },
      ],
    }),

    sec({
      id: 'tool-e2e-server',
      category: CAT,
      group: '테스트 인프라',
      title: 'tools/e2e-server.js · playwright.config.js',
      subtitle: '작은 정적 서버와 설정 두 파일로 EXE 없는 상태를 재현',
      summary:
        'Playwright 테스트용 로컬 정적 서버입니다. 실제 EXE 백엔드 대신 화면 흐름 테스트에 필요한 파일만 제공합니다. ' +
        '즉 모든 E2E 테스트는 "EXE 가 없는 브라우저 환경"에서 돕니다.',
      usage: [
        {
          title: '이 선택의 의미',
          body:
            'E2E 가 항상 폴백 경로만 검증한다는 뜻입니다. 원본 저장 대신 사본 저장, 로컬 Python 대신 Pyodide, PowerPoint 변환 대신 근사 미리보기가 테스트 대상입니다.',
        },
        {
          title: '계약 테스트',
          body: 'tests/e2e-contract.test.js 가 E2E 설정과 필수 시나리오가 유지되는지 단위 테스트 수준에서 확인합니다.',
        },
      ],
      features: [
        { title: '정적 서빙', body: '최소한의 정적 서버입니다. 별도 프레임워크가 없습니다.' },
        { title: '설정', body: 'playwright.config.js 가 서버·브라우저·테스트 경로를 지정합니다.' },
      ],
      files: [
        { path: 'tools/e2e-server.js', label: 'e2e-server.js', description: '정적 서버' },
        { path: 'playwright.config.js', label: 'playwright.config.js', description: 'E2E 설정' },
        { path: 'tests/e2e-contract.test.js', label: 'e2e-contract.test.js', description: 'E2E 설정 계약' },
        { path: 'tests/e2e/helpers.js', label: 'e2e/helpers.js', description: '공통 헬퍼' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            'EXE 백엔드가 붙은 상태의 화면 흐름은 자동 테스트가 전혀 없습니다. 로컬 저장·터미널·커널·변환 같은 EXE 전용 기능은 전부 수동 확인에 의존합니다. ' +
            '이 프로젝트에서 가장 큰 테스트 공백입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '메모에 기록된 검증 방식(PDFSIGNER_NO_BROWSER=1 + HTTP 로 exe 백엔드 직접 호출)이 이 공백을 수동으로 메우는 방법입니다.',
        },
      ],
    }),

    sec({
      id: 'tool-generated-docs',
      category: CAT,
      group: '생성기',
      title: '문서 생성기 — 사용법.html · THIRD_PARTY_NOTICES.txt',
      subtitle: '원본 하나 → 생성물, 그리고 --check',
      summary:
        '사람이 손으로 두 벌을 맞추던 문서를 "원본 + 생성기 + 동기화 검사" 로 바꾼 두 도구입니다. build-manual-html.mjs 는 사용법.md 를 사용법.html 로, ' +
        'build-third-party-notices.mjs 는 vendor/licenses/*.txt 와 자산의 ATTRIBUTION.md 를 모아 라이선스 고지 한 파일로 만듭니다. 둘 다 --check 로 "생성 결과와 다르면 실패" 를 돌릴 수 있습니다.',
      usage: [
        {
          title: '두 벌을 손으로 맞추지 않는다',
          body:
            '예전에는 사용법.md 와 사용법.html 을 나란히 고쳐야 해서 한쪽만 바뀌면 조용히 어긋났고, 앱에 들어가는 것은 HTML 이라 사용자는 낡은 쪽을 봤습니다. 이제 마크다운이 원본입니다(머리말에 그 이유가 그대로 있습니다).',
        },
        {
          title: '고지는 빠뜨림을 실패로',
          body:
            '앱에 들어가는 라이브러리·글꼴·음원·데이터가 EXE 하나에 인라인되므로 라이선스 전문과 저작자 표시도 배포본에 실어야 합니다. 목록(COMPONENTS)에 없는 파일이 vendor/licenses 에 있으면 생성이 실패하고, ' +
            'check 단계가 --check 로 고지가 최신인지 봅니다. 앱 안에서는 도움말 → "오픈소스 라이선스" 가 같은 파일을 엽니다.',
        },
      ],
      files: [
        { path: 'tools/build-manual-html.mjs', label: 'build-manual-html.mjs', description: '사용법.md → 사용법.html' },
        { path: 'tools/build-third-party-notices.mjs', label: 'build-third-party-notices.mjs', description: 'vendor/licenses + ATTRIBUTION → THIRD_PARTY_NOTICES.txt' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"있는데 목록에 없으면 실패" 라는 방향이 맞습니다. 새 vendor 를 넣고 고지를 잊는 실수는 흔하고 결과(라이선스 위반)는 무거운데, 전문 파일을 두는 순간 목록에 올리지 않으면 빌드가 멈춥니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'check:manual 스크립트는 있지만 verify 에는 고지 검사(check:notices)만 들어가 있습니다. build 가 사용법.html 을 매번 다시 만들어 산출물은 늘 맞지만, ' +
            '레포에 커밋된 사용법.html 이 원본과 어긋난 채로 남는 것은 verify 가 잡지 않습니다.',
        },
      ],
    }),

    sec({
      id: 'tool-release',
      category: CAT,
      group: '배포',
      title: '버전과 배포 묶음 — tools/release.js · pack.ps1',
      subtitle: '번호는 package.json 한 곳, "바뀌었는가" 는 앱 내용의 지문으로',
      summary:
        '버전 번호는 package.json 의 version 한 곳에만 두고, 빌드 날짜·커밋 꼬리표는 빌드할 때 HTML 에 빌드 정보 블록으로 새깁니다(EXE 는 AssemblyInfo.generated.cs). ' +
        'pack.ps1 은 빌드한 앱 내용의 지문(빌드 정보 블록을 뺀 단일 HTML + EXE 에 함께 실리는 파일들의 SHA-256)을 지난 배포 기록(release.json)과 비교해, 같으면 번호를 그대로 두고 바뀌었으면 올릴지 묻습니다. ' +
        '오프라인 PC 용으로 ffmpeg·자바 라이브러리·JDK 를 함께 담을지도 고릅니다.',
      usage: [
        {
          title: '지문에서 빼는 것',
          body:
            '빌드할 때마다 바뀌는 날짜·꼬리표 블록과 EXE 바이트(빌드마다 다름)는 지문에서 빼고, ffmpeg·JDK·java-libs 는 "담을지 고르는 덧붙이개" 라 앱 내용으로 치지 않습니다. ' +
            '그래서 같은 소스를 다시 묶거나 덧붙이개만 바꿔 묶으면 번호가 오르지 않습니다.',
        },
        {
          title: 'JDK 도 앱과 같은 방식으로 받는다',
          body: 'pack.ps1 이 JDK 를 담을 때 앱의 자동 설치와 같은 배포처(Adoptium)·같은 체크섬 확인을 쓰고, 받은 zip 은 dist\\cache 에 두고 다시 씁니다.',
        },
      ],
      files: [
        { path: 'tools/release.js', label: 'release.js', description: 'status · next · set-version · record — 지문과 배포 기록' },
        { path: 'pack.ps1', label: 'pack.ps1', description: '빌드 → 고지 → 버전 정하기 → (JDK·ffmpeg·jar) → zip' },
        { path: 'release.json', label: 'release.json', description: '배포 기록' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"번호를 올릴까" 를 기억이 아니라 내용 비교로 정합니다. 학교마다 손으로 옮겨 설치하는 앱에서 "같은 1.0.3 인데 내용이 다르다" 는 가장 고치기 어려운 문의라, 그 상황을 구조적으로 막는 장치입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '레포의 release.json 은 아직 releases 가 비어 있습니다. 묶은 zip 을 기록하는 record 가 실제로 돈 적이 없거나 기록이 커밋되지 않은 상태라, 지금은 매번 "바뀌었다" 로 판정됩니다. ' +
            '기록 파일을 커밋하는 단계가 pack.ps1 의 안내에 있으면 지문 비교가 비로소 쓸모를 냅니다.',
        },
      ],
    }),

    sec({
      id: 'tool-asset-generators',
      category: CAT,
      group: '생성기',
      title: '자산 생성기 — 브랜드 락업 · 손글씨 글꼴 · 행정경계',
      subtitle: 'build-brand-lockup.py · build-hand-fonts.py · build-korea-regions.mjs',
      summary:
        '앱에 들어가는 큰 자산을 원자료에서 다시 만드는 도구들입니다. 결과물만 레포에 있고 원자료(글꼴 TTF, 행정경계 JSON)는 레포 밖에서 받아 넣는 구조라, 다시 만드는 법이 각 도구 머리말에 적혀 있습니다.',
      usage: [
        {
          title: '브랜드 락업 — 함정 기록이 먼저',
          body:
            '헤더의 Class + 심볼 + ock 워드마크를 글꼴 없이 외곽선 패스로 만들어 classdock.html·styles.css 에 넣습니다(--apply, --check). ' +
            '머리말이 "값을 고치기 전에 읽을 것" 으로 시작합니다 — 외곽선에는 힌팅이 없어 작은 크기에서 세로획이 2.17px 로 번지므로 크기를 키웠고, 간격은 정수여야 한다는 식의 실측 함정이 번호를 달고 적혀 있습니다.',
        },
        {
          title: '손글씨 글꼴 — OFL 을 지키며 줄인다',
          body:
            '나눔손글씨(SIL OFL 1.1)를 WOFF2 → base64 JS 로 바꿔 vendor 에 넣고 일기장이 고를 때만 지연 로드합니다. 붓 윤곽 글꼴은 한 벌 2.6MB 라 자주 쓰는 한글 2,350자만 남기는데, ' +
            '글자를 줄이면 OFL 의 "고친 글꼴" 이 되어 예약 이름을 쓸 수 없으므로 글꼴 안 이름을 ClassDock Hand … 로 바꾸고 원본과 고친 내용을 설명에 적습니다. 끝에 manifest 의 sha384 를 바꾸라고 출력합니다.',
        },
        {
          title: '행정경계 — 가볍게 담는 법',
          body:
            '통계청 SGIS 경계(가공 vuski/admdongkor, CC BY 4.0)를 소수 넷째 자리로 반올림해 인코딩 폴리라인 글자로 담고(JSON 배열의 약 1/4), 두 시점(최신·통합 전)에서 같은 경계는 한 번만 담습니다. ' +
            '읍면동은 따로 떼어 고를 때만 읽습니다. 통계가 한두 해 늦으므로 옛 이름으로도 칠할 수 있게 한 것이 이유로 적혀 있습니다.',
        },
      ],
      files: [
        { path: 'tools/build-brand-lockup.py', label: 'build-brand-lockup.py', description: '헤더 락업 SVG · 아이콘 생성(--apply · --check)' },
        { path: 'tools/build-hand-fonts.py', label: 'build-hand-fonts.py', description: '손글씨 글꼴 → vendor/hand-font-*.js (부분 글꼴·이름 바꾸기)' },
        { path: 'tools/build-korea-regions.mjs', label: 'build-korea-regions.mjs', description: '행정경계 → vendor/korea-regions.js · korea-emd.js' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '라이선스를 "출처 한 줄" 이 아니라 도구의 동작으로 지켰습니다 — 글꼴을 줄이면 이름을 바꾸고 원본을 적고, 경계 자료는 CC BY 출처를 색칠 지도가 켜졌을 때 함께 표시합니다. ' +
            '이 도구들이 없었다면 다음 사람이 글꼴을 다시 줄이며 예약 이름을 그대로 둘 자리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '셋 다 결과물을 만든 뒤 사람이 해야 할 일이 남습니다(손글씨: manifest sha384 바꾸기, 락업: 오프라인 HTML·EXE 다시 만들기, 경계: 원자료를 레포 밖에서 받기). ' +
            '락업만 --check 가 있고 나머지 둘은 "원자료로 다시 만들면 지금 vendor 파일과 같은가" 를 확인할 길이 없어, 생성물이 손으로 고쳐져도 드러나지 않습니다.',
        },
      ],
    }),

    sec({
      id: 'tool-misc',
      category: CAT,
      group: '기타 도구',
      title: '패키징과 1회성 자산 도구',
      subtitle: 'clean.bat · make-sample-files.py · recolor-calico-sprites.js · clean-sprite.ps1',
      summary:
        '산출물 정리(clean.bat), 샘플 파일 생성(make-sample-files.py), 픽셀 펫 스프라이트 리컬러(recolor-calico-sprites.js)·테두리 정리(clean-sprite.ps1) 같은 주변 도구들입니다. ' +
        '앱에 로드되지 않습니다. 배포 묶음(pack.ps1)은 "버전과 배포 묶음" 섹션으로 옮겼습니다.',
      usage: [
        {
          title: '샘플 생성기',
          body:
            `tools/make-sample-files.py${sampleLines ? `(${formatLines(sampleLines)}줄)` : ''}가 테스트·시연용 문서를 만듭니다. 각 형식을 실제로 열어 보는 회귀 확인에 쓰입니다.`,
        },
        {
          title: '1회성 자산 도구',
          body: 'recolor-calico-sprites.js 는 복실고양이 스프라이트를 삼색고양이 배색으로 바꾼 1회성 도구입니다. 결과물만 레포에 남아 있습니다.',
        },
      ],
      features: [
        { title: 'clean', body: '생성 산출물을 지웁니다.' },
        { title: 'clean-sprite', body: '사진을 픽셀로 바꾼 스프라이트에 남는 흰 테두리를 지웁니다. 의도한 그림(기둥·벽·그림자)은 건드리지 않게 단계를 나눴고, -Backup 으로 원본을 남길 수 있습니다.' },
      ],
      files: [
        { path: 'clean.bat', label: 'clean.bat', description: '산출물 정리' },
        { path: 'tools/clean-sprite.ps1', label: 'clean-sprite.ps1', description: '스프라이트 흰 테두리 정리' },
        { path: 'tools/make-sample-files.py', label: 'make-sample-files.py', description: '샘플 파일 생성기' },
        { path: 'tools/recolor-calico-sprites.js', label: 'recolor-calico-sprites.js', description: '1회성 스프라이트 리컬러' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '1회성 도구를 레포에 남긴 것은 재현 가능성 측면에서 나쁘지 않습니다. 다만 "이건 다시 안 돌린다"는 표시가 문서에만 있습니다.',
        },
      ],
    }),
  ];
};
