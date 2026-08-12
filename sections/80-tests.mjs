// 테스트 — node --test 단위·계약 테스트 94개와 Playwright 화면 흐름 36개.

export default ({ helpers }) => {
  const { sec } = helpers;
  const CAT = '테스트';

  return [
    sec({
      id: 'tests-overview',
      category: CAT,
      group: '개요',
      title: '테스트 전략',
      subtitle: '단위·계약 94개(14,891줄) + E2E 36개, 외부 프레임워크 없음',
      summary:
        '테스트 러너도 외부 프레임워크를 쓰지 않습니다 — Node 내장 러너(node --test)와 Playwright 둘뿐입니다. ' +
        '브라우저 전역 스크립트라는 구조 때문에 "DOM 없이 검증할 수 있는 것"을 최대한 늘리는 방향으로 짜여 있고, ' +
        '그 전략의 핵심이 core.js 의 UMD 노출과 MNOfficeReplace·MNDataConvert 같은 순수 코어 분리입니다.',
      usage: [
        {
          title: '세 가지 층',
          body:
            '① 순수 함수 단위 테스트(core, office-replace, data-convert, diff, board-render 등) ' +
            '② 계약 테스트(목록끼리 일치하는가 — release-contract, e2e-contract, tool-visibility) ' +
            '③ 화면 흐름 E2E(Playwright, EXE 없는 상태).',
        },
        {
          title: '소스를 문자열로 읽는 테스트',
          body:
            '상당수 테스트가 src/js/*.js 를 텍스트로 읽어 특정 패턴이 있는지 확인합니다. 브라우저 없이 UI 계약을 고정하는 방법이지만, ' +
            '실제 동작이 아니라 코드 모양을 검사한다는 한계가 있습니다.',
        },
        {
          title: '문서까지 검사 대상',
          body:
            'release-contract.test.js 가 docs/JS-파일별-기능.md 를 읽어 manifest 의 모든 파일이 문서에 있는지 확인합니다. 문서 갱신을 잊으면 테스트가 실패합니다.',
        },
      ],
      features: [
        { title: '단위·계약 94개', body: '총 14,891줄. JavaScript 실행·라이브러리·EXE npm 계약 테스트 3개가 새로 추가됐습니다.' },
        { title: 'E2E 36개', body: 'tools/e2e-server.js 위에서 돕니다.' },
        { title: '도메인 밀도', body: 'Python 관련 안전망에 더해 JavaScript 런타임 801줄, 라이브러리 65줄, EXE npm 계약 33줄이 추가됐습니다.' },
        {
          title: '기능과 함께 늘어나는가',
          body:
            '2026-08-08~09 의 Word 편집·화이트보드 도구상자 확장에서 소스 4,900줄에 테스트 900줄이 함께 들어왔습니다(신규 4개 파일 + office-replace.test.js 확장). ' +
            '기능만 늘고 테스트가 뒤처지는 패턴은 아직 나타나지 않았습니다.',
        },
      ],
      files: [{ path: 'package.json', label: 'package.json', description: 'test / test:e2e / verify 스크립트' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '브라우저 앱인데도 핵심 로직 다수가 빠른 단위 테스트로 덮여 있습니다. 순수 함수를 의도적으로 분리한 설계가 그대로 테스트 가능성으로 돌아왔습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '테스트 프레임워크 의존이 0 입니다. Node 버전만 맞으면 어디서나 돌고, 프레임워크 버전 업그레이드 부담이 없습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '소스를 문자열로 읽어 패턴을 확인하는 테스트가 많습니다. 리팩터링으로 코드 모양만 바뀌어도 깨지고, 반대로 동작이 깨져도 모양이 같으면 통과합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '새로 들어온 UI 테스트가 이 방식을 더 밀고 나갔습니다. whiteboard-education-toolbox.test.js 는 styles.css 의 선택자와 min-height:43px 같은 ' +
            '수치까지 정규식으로 굳혔고, docx-context-menu.test.js 도 배선을 문자열로 확인합니다. ' +
            '값이 CSS 파일과 테스트 두 곳에 있게 되므로, 화면을 고칠 때마다 테스트를 함께 고치는 비용이 붙습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'EXE 백엔드가 붙은 상태의 E2E 가 없습니다. 로컬 저장·터미널·커널·PowerPoint 변환은 자동 회귀 검증 밖입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '새 기능이 순수 함수를 먼저 만들고 테스트를 붙이는 순서로 들어옵니다. Word 편집 확장은 office-replace.test.js 를, ' +
            '도구상자는 whiteboard.js 의 module.exports 를 각각 새로 만들었습니다 — 화면부터 만들고 나중에 테스트를 붙이려 했다면 둘 다 불가능했을 형태입니다.',
        },
      ],
    }),

    sec({
      id: 'tests-unit',
      category: CAT,
      group: '단위',
      title: '순수 로직 단위 테스트',
      subtitle: 'core · office-replace · data-convert · diff · doc-legacy',
      summary:
        'DOM 없이 계산되는 로직을 직접 검증하는 테스트들입니다. core.test.js 가 경로·인코딩·Markdown·코드 편집·Python 분석을 폭넓게 다루고, ' +
        'office-replace 는 순수 계산과 실제 파일 왕복을 나눠 검증하며, data-convert 는 8개 형식 변환과 손실 리포트를 봅니다.',
      usage: [
        {
          title: '가장 큰 테스트',
          body: 'core.test.js 1,378줄. core.js 3,992줄에 대응하며 이 프로젝트에서 가장 넓은 안전망입니다.',
        },
        {
          title: '왕복 검증',
          body:
            'office-replace-roundtrip(실제 docx/pptx 를 만들어 바꾸고 다시 읽기), notebook-serialize(ipynb 왕복), xlsx-edit(표 저장 왕복), ' +
            'mnote(직렬화 안정성). 포맷을 다루는 코드는 전부 왕복으로 검증합니다.',
        },
        {
          title: '픽스처 생성',
          body: 'tests/fixtures/build-doc.js 와 build-pdf.js 가 테스트용 문서를 만듭니다. 바이너리 픽스처를 레포에 넣지 않고 코드로 생성합니다.',
        },
        {
          title: '가장 빠르게 자란 테스트',
          body:
            'Word 편집 확장과 함께 office-replace.test.js 가 1,123줄까지 늘어 core.test.js 다음으로 큰 단위 테스트가 됐습니다. ' +
            '표 병합·목록 번호·그림 관계처럼 손으로 확인하기 어려운 XML 조작이 순수 함수로 나와 있어서 가능했던 증가입니다.',
        },
      ],
      features: [
        { title: '파서 검증', body: 'doc-legacy.test.js 가 Word 97 조각표에서 유니코드·CP1252 본문을 뽑는 파서를 검사합니다.' },
        { title: 'diff', body: 'diff-viewer.test.js 가 판정·짝짓기·인라인 강조·HTML 이스케이프를 봅니다.' },
        { title: '되돌리기', body: 'edit-history.test.js 가 공용 히스토리 엔진을 검증합니다.' },
        { title: '도구상자 목록', body: 'whiteboard-education-toolbox.test.js 가 도구 개수·묶음별 최소 항목·id 중복·수식 틀의 입력 위치·스텐실 SVG 안전성을 봅니다.' },
        { title: 'JavaScript 실행', body: 'js-runtime.test.js 가 Worker 프로토콜·입력·자동채점·지속 커널·라이브러리 실행 경계를 폭넓게 검증합니다.' },
      ],
      files: [
        { path: 'tests/core.test.js', label: 'core.test.js', description: '1,378줄 — 가장 큰 단위 테스트' },
        { path: 'tests/office-replace.test.js', label: 'office-replace.test.js', description: '1,123줄 — 문단·서식·표·패키지 순수 편집' },
        { path: 'tests/whiteboard-education-toolbox.test.js', label: 'whiteboard-education-toolbox.test.js', description: '수학·과학 도구상자' },
        { path: 'tests/data-convert.test.js', label: 'data-convert.test.js', description: '형식 변환·손실 리포트' },
        { path: 'tests/js-runtime.test.js', label: 'js-runtime.test.js', description: '801줄 — JavaScript Worker 실행·채점·커널' },
        { path: 'tests/js-libraries.test.js', label: 'js-libraries.test.js', description: '내장·로컬·npm 라이브러리 상태' },
        { path: 'tests/js-npm-desktop.test.js', label: 'js-npm-desktop.test.js', description: 'EXE npm 라우팅·제한·번들 계약' },
        { path: 'tests/fixtures/build-doc.js', label: 'fixtures/build-doc.js', description: '테스트 문서 생성' },
        { path: 'tests/fixtures/build-pdf.js', label: 'fixtures/build-pdf.js', description: '테스트 PDF 생성' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '바이너리 픽스처를 커밋하지 않고 코드로 생성합니다. 레포가 가벼워지고 픽스처가 무엇을 담고 있는지 코드로 읽힙니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '포맷 처리 코드를 전부 왕복으로 검증하는 일관된 방침이 있습니다. 사용자 파일을 다시 쓰는 기능에서 가장 중요한 안전장치입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'core.test.js 1,378줄이 core.js 3,992줄을 덮습니다. 비율상 커버리지가 낮은 영역이 있을 수 있고, 커버리지 측정 도구는 설정돼 있지 않습니다.',
        },
      ],
    }),

    sec({
      id: 'tests-contract',
      category: CAT,
      group: '계약',
      title: '계약 테스트 — 목록끼리 일치하는가',
      subtitle: 'release-contract · e2e-contract · tool-visibility',
      summary:
        '이 프로젝트에서 가장 특징적인 테스트 종류입니다. 코드 동작이 아니라 "여러 곳에 흩어진 목록이 서로 맞는가"를 검사합니다. ' +
        'release-contract.test.js 는 vendor 고정본과 sha384, manifest 의 로딩 순서·의존·공개 API, 그리고 docs/JS-파일별-기능.md 의 파일 목록 완전성까지 한 파일에서 봅니다.',
      usage: [
        {
          title: '왜 필요한가',
          body:
            '전역 스크립트 + 수동 문서 구조에서는 "한쪽만 고친 상태"가 조용히 생깁니다. 계약 테스트는 그 어긋남 자체를 실패로 만듭니다. ' +
            'check-source.js 와 역할이 겹치지만, 이쪽은 문서와 vendor 까지 범위가 넓습니다.',
        },
        {
          title: '검사 항목',
          body:
            'vendor src 가 vendor/ 로 시작 · sha384 형식과 실제 해시 일치 · lazy 는 시작 태그 없음 / 비lazy 는 태그 있음 · ' +
            'HTML 에 http(s) script 없음 · manifest 파일이 문서에 모두 등재 · documents.js/app.js/command-palette.js 의 특정 계약.',
        },
        {
          title: '문서를 테스트하는 발상',
          body:
            'jsGuide 변수로 docs/JS-파일별-기능.md 를 읽습니다. 문서가 코드의 일부처럼 검사 대상이 되는, 흔치 않지만 효과적인 방식입니다.',
        },
      ],
      features: [
        { title: 'tool-visibility', body: '헤더·도구막대 버튼 노출 레지스트리와 필수 버튼 제외 규칙을 고정합니다.' },
        { title: 'e2e-contract', body: 'E2E 설정과 필수 시나리오가 유지되는지 단위 테스트에서 확인합니다.' },
        { title: 'document-enhancements', body: '표시 이름·복구 스냅샷·검색 보강 계약.' },
      ],
      files: [
        { path: 'tests/release-contract.test.js', label: 'release-contract.test.js', description: 'vendor·manifest·문서 완전성' },
        { path: 'tests/tool-visibility.test.js', label: 'tool-visibility.test.js', description: '버튼 노출 레지스트리' },
        { path: 'tests/e2e-contract.test.js', label: 'e2e-contract.test.js', description: 'E2E 설정 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '문서 최신성을 테스트로 강제하는 방식이 실제로 작동하고 있습니다. docs/JS-파일별-기능.md 가 지금도 정확한 이유가 이 테스트입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'check-source.js 와 release-contract.test.js 가 같은 것을 일부 중복 검사합니다. 규칙이 바뀌면 두 곳을 고쳐야 하고, 한쪽만 고치면 서로 다른 규칙을 강제하게 됩니다.',
        },
      ],
    }),

    sec({
      id: 'tests-e2e',
      category: CAT,
      group: 'E2E',
      title: 'Playwright 화면 흐름 테스트',
      subtitle: '36개, EXE 없는 브라우저 상태만',
      summary:
        '파일 열기·탭 전환·저장 같은 핵심 흐름부터 열 편집 클립보드, 코드 따라치기, 되돌리기, 사이드바 서랍, 탭 드래그 분할, ' +
        '메모 펼치기, 팔레트 항목 노출까지 실제 화면 동작을 검증합니다. tools/e2e-server.js 위에서 돌므로 항상 "EXE 가 없는 상태"입니다.',
      usage: [
        {
          title: '자체 편집기를 검증하는 자리',
          body:
            'column-clipboard, column-edit-font, goto-line, code-practice 같은 테스트는 직접 만든 편집기 기능을 화면에서 확인합니다. ' +
            '자체 편집기를 유지하려면 반드시 필요한 종류의 테스트입니다.',
        },
        {
          title: '고정폭·가변폭 글꼴',
          body:
            'column-edit-font.spec.js 는 두 종류 글꼴에서 열 편집이 가리킨 경계에 정확히 놓이는지 봅니다. 좌표 계산 회귀를 잡는 정밀한 테스트입니다.',
        },
        {
          title: '지연 로드 검증',
          body: 'lazy-vendor.spec.js 가 무거운 vendor 를 형식을 열 때만 불러오는지 실제로 확인합니다. 시작 성능 회귀를 막는 장치입니다.',
        },
      ],
      features: [
        { title: '핵심 흐름', body: 'critical-flows.spec.js 가 파일 열기·탭 전환·저장을 봅니다.' },
        { title: '되돌리기', body: 'undo-redo · notebook-undo · spreadsheet-undo 세 편집기의 되돌리기를 각각 검증합니다.' },
        { title: '저장 대상 표시', body: 'save-target-badge.spec.js 가 원본/사본 배지와 안내를 확인합니다.' },
        { title: '접근 경로', body: 'palette-coverage.spec.js 가 문맥별 명령 노출과 도움말 진입점을 봅니다.' },
      ],
      files: [
        { path: 'tests/e2e/critical-flows.spec.js', label: 'critical-flows.spec.js', description: '핵심 사용자 흐름' },
        { path: 'tests/e2e/lazy-vendor.spec.js', label: 'lazy-vendor.spec.js', description: '지연 로드 검증' },
        { path: 'tests/e2e/save-target-badge.spec.js', label: 'save-target-badge.spec.js', description: '원본/사본 배지' },
        { path: 'tests/e2e/helpers.js', label: 'helpers.js', description: '공통 헬퍼' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"무거운 vendor 를 시작할 때 싣지 않는다"는 성능 약속을 E2E 로 검증합니다. 성능 회귀는 보통 아무도 눈치채지 못하는데, 여기서는 테스트가 막습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '원본/사본 저장 배지를 화면 수준에서 검증합니다. 이 앱에서 사용자가 가장 크게 다칠 수 있는 지점이라 우선순위가 맞습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'E2E 가 npm run verify 에 포함되지 않습니다. 별도 실행이라 잊기 쉽고, 실제로는 수동 결정에 의존합니다.',
        },
      ],
    }),

    sec({
      id: 'tests-gaps',
      category: CAT,
      group: '공백',
      title: '테스트 공백과 우선순위',
      subtitle: '무엇이 검증되지 않는가',
      summary:
        '이 프로젝트의 테스트는 넓지만 균일하지 않습니다. 순수 로직과 계약은 촘촘하고, EXE 백엔드가 붙은 실제 동작과 큰 UI 파일의 상호작용은 얇습니다. ' +
        '리뷰에서 수동 확인 비중을 어디에 둘지 정하려면 이 분포를 알아야 합니다.',
      usage: [
        {
          title: '가장 큰 공백 — EXE 경로',
          body:
            '로컬 저장, 지속형 터미널, 노트북 커널, PowerPoint 변환, ffmpeg, SQLite 실행, 시험지 LAN 수신은 자동 화면 테스트가 없습니다. ' +
            'local-server-security.test.js 가 보안 계약 일부를 보지만 기능 동작은 아닙니다.',
        },
        {
          title: '두 번째 공백 — 대형 파일 상호작용',
          body:
            'documents.js·code-viewer.js·spreadsheet-viewer.js·app.js 는 각각 테스트가 있지만, 이들이 함께 동작할 때의 조합(분할 작업 중 저장, 탭 전환 중 비동기 저장 등)은 일부만 덮여 있습니다.',
        },
        {
          title: '세 번째 공백 — 접근성',
          body: '자체 편집기·자체 문자표·자체 팔레트를 쓰는데 스크린 리더·키보드 전용 조작에 대한 테스트가 보이지 않습니다.',
        },
        {
          title: '새로 생긴 공백 — Word 편집의 갈래 선택',
          body:
            'docx-editor.js 는 문서에 따라 제자리 편집 · 북마크 재매핑 · 문단 목록 세 갈래 중 하나로 떨어집니다. ' +
            '되쓰기 계산은 office-replace.test.js 가 촘촘히 덮지만, "어떤 문서가 어느 갈래로 가는가"를 확인하는 테스트는 없습니다. ' +
            'mc:AlternateContent·w:sdt·altChunk 가 든 docx 픽스처를 build-doc.js 로 만들어 각 갈래를 한 번씩 유도하면, ' +
            '가장 조용히 틀리는 경로(잘못 이어진 채 저장)를 자동으로 잡을 수 있습니다.',
        },
        {
          title: '새로 생긴 공백 — 수식 래스터화',
          body:
            '화이트보드 수식은 foreignObject 안 MathML 을 <img> 로 불러 캔버스에 그립니다. 테스트는 SVG 문자열만 보고 실제 그림이 나오는지는 보지 않아, ' +
            'PNG 내보내기와 리플레이에서 수식만 비는 상황이 자동으로 잡히지 않습니다. E2E 에서 캔버스 픽셀을 한 번 확인하면 덮이는 종류입니다.',
        },
      ],
      features: [
        { title: '환경 의존 테스트', body: 'python-kernel.test.js 는 로컬 Python 이 없으면 제외될 수 있어 항상 도는 보증이 없습니다.' },
        { title: '커버리지 미측정', body: 'c8·nyc 같은 커버리지 도구 설정이 없습니다. 공백이 수치로 드러나지 않습니다.' },
        { title: '타입 검사 없음', body: 'JSDoc·TypeScript·checkJs 가 없어 이름 오타는 런타임에서만 드러납니다.' },
      ],
      files: [
        { path: 'tests/local-server-security.test.js', label: 'local-server-security.test.js', description: 'EXE 경로에서 유일하게 자동 검증되는 부분' },
        { path: 'tests/python-kernel.test.js', label: 'python-kernel.test.js', description: '환경에 따라 제외될 수 있는 테스트' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            'EXE 전용 경로가 제품의 핵심 차별점인데 자동 검증이 가장 얇습니다. 헤드리스 모드로 로컬 서버를 띄워 엔드포인트를 직접 두드리는 통합 테스트를 추가하면 ' +
            '가장 큰 위험을 가장 적은 비용으로 줄일 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '커버리지를 재지 않아 "어디가 비었는지"를 논의할 근거가 없습니다. node --test 는 --experimental-test-coverage 를 지원하므로 추가 의존성 없이 붙일 수 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '반대로, 계약 테스트라는 층을 만들어 문서·목록의 어긋남을 자동화한 것은 같은 규모의 다른 프로젝트에서도 드문 강점입니다.',
        },
      ],
    }),
  ];
};
