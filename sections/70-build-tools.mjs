// 빌드·검증 도구 — 앱 화면에 로드되지 않고 개발·배포 과정에서만 실행되는 코드.

export default ({ manifest, helpers, diagrams }) => {
  const { sec } = helpers;
  const CAT = '빌드 · 도구';
  const vendorCount = manifest.vendorScripts.length;

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
            'manneung-classroom-offline.html, desktop/app.html, src/js/korean-font.js, vendor/korean-hunspell-worker.js 는 생성물입니다. 직접 고치면 다음 빌드에 덮어써집니다.',
        },
        {
          title: '오프라인 원칙의 강제',
          body:
            'check-release.js 가 오프라인 HTML 에 네트워크 script URL 이 하나도 남지 않았는지 확인합니다. "오프라인 우선"이 구호가 아니라 검사 대상입니다.',
        },
      ],
      features: [
        { title: 'check', body: 'tools/check-source.js — 문법·전역 충돌·계층·의존·공개 API·지연 vendor.' },
        { title: 'test', body: 'node --test tests/*.test.js — 단위·계약 테스트.' },
        { title: 'build', body: '맞춤법 워커 빌드 → build-offline.js 로 단일 HTML 생성.' },
        { title: 'release-check', body: 'tools/check-release.js — 로컬 경로 잔존·vendor 해시·산출물 검사.' },
      ],
      files: [
        { path: 'package.json', label: 'package.json', description: 'verify 스크립트 정의' },
        { path: 'AGENTS.md', label: 'AGENTS.md', description: 'EXE 반영 절차 규칙' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"검사 가능한 구조 계약"을 다층으로 쌓았습니다. 번들러·타입 시스템 없이 전역 스크립트로 6만 줄을 유지하려면 이런 도구가 필수인데, 실제로 갖춰 놓았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'verify 에 타입 검사가 없습니다. JS 전역 스크립트라 오타 하나가 런타임 undefined 로만 드러나고, state.js 의 100개짜리 구조 분해 같은 곳은 특히 취약합니다.',
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
        'manneung-classroom.html 을 읽어 로컬 CSS 와 애플리케이션 스크립트를 인라인하고, CDN/vendor script 태그를 번들 파일로 바꾸고, ' +
        'pdf.worker 를 런타임 Blob 용 text/js-worker 블록으로 심어 manneung-classroom-offline.html 을 만듭니다. ' +
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
        { title: '19MB 산출물', body: '현재 오프라인 HTML은 약 19.0MiB, EXE는 약 19.2MiB입니다. JavaScript 내장 라이브러리 4종이 추가됐고, 대부분의 용량은 여전히 Pyodide·폰트·문서 라이브러리입니다.' },
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
        { title: '정적 서빙', body: '34줄짜리 최소 서버입니다. 별도 프레임워크가 없습니다.' },
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
      id: 'tool-misc',
      category: CAT,
      group: '기타 도구',
      title: '패키징과 1회성 자산 도구',
      subtitle: 'pack.ps1 · clean.bat · make-sample-files.py · recolor-calico-sprites.js',
      summary:
        '배포 묶음 만들기(pack.ps1/pack.bat), 산출물 정리(clean.bat), 샘플 파일 생성(make-sample-files.py), ' +
        '픽셀 펫 스프라이트 리컬러(recolor-calico-sprites.js) 같은 주변 도구들입니다. 앱에 로드되지 않습니다.',
      usage: [
        {
          title: '샘플 생성기',
          body:
            'tools/make-sample-files.py(1,235줄)가 테스트·시연용 문서를 만듭니다. 각 형식을 실제로 열어 보는 회귀 확인에 쓰입니다.',
        },
        {
          title: '1회성 자산 도구',
          body: 'recolor-calico-sprites.js 는 복실고양이 스프라이트를 삼색고양이 배색으로 바꾼 1회성 도구입니다. 결과물만 레포에 남아 있습니다.',
        },
      ],
      features: [
        { title: 'pack', body: '배포용 묶음을 만듭니다.' },
        { title: 'clean', body: '생성 산출물을 지웁니다.' },
      ],
      files: [
        { path: 'pack.ps1', label: 'pack.ps1', description: '배포 묶음' },
        { path: 'clean.bat', label: 'clean.bat', description: '산출물 정리' },
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
