// 1. bootstrap — 설정과 공통 기반. 화면이 그려지기 전에 자리를 잡는 계층.

export default ({ manifest, helpers }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'bootstrap');

  return [
    sec({
      id: 'bootstrap-overview',
      category: '1. bootstrap',
      group: '계층 개요',
      title: 'bootstrap 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 설정·상태·공통 유틸`,
      summary:
        '가장 먼저 로드되는 계층입니다. 화면이 그려지기 전에 끝내야 하는 일(서버 설정 동기화, 테마 적용)과, ' +
        '이후 모든 계층이 공유하는 기반(공통 순수 함수, 전역 상태, 되돌리기 엔진, 검색 기록, 문자표, 맞춤법)이 여기 모여 있습니다. ' +
        '이 계층의 이름을 바꾸면 사실상 앱 전체가 영향을 받습니다.',
      usage: [
        {
          title: '순서가 의미를 갖는 구간',
          body:
            'state-sync.js → theme.js 순서가 중요합니다. state-sync 가 동기 XHR 로 서버 설정을 받아 localStorage 를 먼저 채워야, ' +
            'theme.js 가 읽는 값이 서버에 저장된 테마가 됩니다. 순서가 뒤집히면 포트가 바뀔 때마다 테마가 초기화됩니다.',
        },
        {
          title: '순수 함수와 DOM 코드의 분리',
          body:
            'core.js 는 UMD 형태로 감싸 module.exports 도 지원합니다. 덕분에 node --test 에서 브라우저 없이 그대로 require 할 수 있고, ' +
            '실제로 tests/core.test.js 가 이 계층의 순수 함수를 가장 넓게 검사합니다.',
        },
        {
          title: '공용 엔진들',
          body:
            'MNEditHistory(되돌리기), MNSearchHistory(최근 검색어), MNSpecialChars(문자표), MNKoreanSpellcheck(맞춤법)는 ' +
            '각 편집기가 따로 만들던 기능을 하나로 모은 결과물입니다. 모두 moduleBoundaries 에 공개 API 로 등록돼 있습니다.',
        },
      ],
      features: [
        { title: '실행 형태 흡수', body: 'state-sync.js 가 EXE/브라우저 차이를 이 계층에서 흡수해 위 계층은 localStorage 만 보면 됩니다.' },
        { title: '깜빡임 방지', body: 'theme.js 12줄이 문서 렌더 전에 data-theme 을 찍습니다. 이 리뷰 페이지도 같은 방식을 씁니다.' },
        { title: '번역 계층', body: 'i18n.js 가 DOM 텍스트·title·aria 를 자동 번역합니다. 새 문구를 넣으면 영문 사전도 함께 봐야 합니다.' },
        { title: '시작 비용 관리', body: 'lazy.js 가 vendor 7.2MB 를 시작 시점에서 걷어냈습니다. 이 계층에서 가장 성능에 직접 기여하는 파일입니다.' },
      ],
      files: [
        { path: 'scripts.manifest.json', label: 'manifest', range: [1, 40], description: 'bootstrap 계층 로드 순서' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'core.js 를 UMD 로 감싼 판단이 이 프로젝트의 테스트 가능성을 거의 혼자 지탱합니다. 브라우저 전역 코드에서 순수 함수만 떼어 낸 좋은 사례입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'core.js 4,104줄 / state.js 646줄이지만 state.js 가 core 에서 구조 분해로 가져오는 이름이 100개가 넘습니다. ' +
            'core.js 는 이미 "공통 유틸"이 아니라 여러 도메인의 순수 로직 창고입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'core.js 의 전역 이름은 MN* 규칙이 아니라 PdfSignerCore 입니다. package.json 이름도 pdf-signer-local 로, 프로젝트 초기 이름이 남아 있는 흔적입니다.',
        },
      ],
    }),

    mod('state-sync.js', {
      title: 'state-sync.js — 포트 무관 설정 유지',
      subtitle: '로컬 서버와 localStorage 브리지, 실행별 토큰 부착',
      summary:
        'localStorage 는 origin(127.0.0.1:포트)별로 갈리는데 EXE 는 포트가 바뀔 수 있습니다. 그러면 테마·자동복원·탭 순서가 통째로 초기화됩니다. ' +
        '이 파일은 서버측 app-state.json 을 단일 원본으로 삼아 그 문제를 없앱니다. 시작할 때 동기 XHR 로 서버 저장분을 받아 localStorage 를 먼저 채우고, ' +
        '이후 변경을 디바운스해 서버로 미러링합니다. 서버가 없는 환경(file://, 일반 브라우저)에서는 아무 일도 하지 않고 기존 동작을 그대로 둡니다.',
      usage: [
        {
          title: '동기 XHR 을 쓰는 이유',
          body:
            'theme.js 를 비롯한 다른 모듈이 localStorage 를 읽기 전에 값을 채워야 하기 때문입니다. 비동기였다면 첫 화면이 기본 테마로 한 번 그려진 뒤 바뀝니다. ' +
            '드물게 정당한 동기 XHR 사용 사례입니다.',
        },
        {
          title: 'fetch 를 감싸는 부분',
          body:
            'window.fetch 를 래핑해 같은 origin 요청에만 X-Manneung-Token 헤더를 붙입니다. 각 호출부가 토큰을 신경 쓰지 않아도 되도록 한 지점에서 처리합니다.',
        },
      ],
      features: [
        { title: '조건부 활성', body: 'http/https 이면서 host 가 127.0.0.1 또는 localhost 일 때만 동작합니다. 그 외에는 즉시 return 합니다.' },
        { title: '종료 직전 전송', body: '창을 닫기 직전 상태도 서버로 보내 마지막 변경을 잃지 않게 합니다.' },
        { title: '토큰 주입', body: '런처가 HTML 에 심어 둔 window.__MANNEUNG_LOCAL_TOKEN__ 을 읽어 씁니다.' },
      ],
      files: [{ path: 'desktop/launcher.cs', label: 'launcher.cs (토큰)', range: [740, 800], description: '서버측 토큰 검증' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'fetch 래핑을 같은 origin 으로 한정했습니다. 무분별하게 모든 요청에 토큰을 붙였다면 외부로 토큰이 새는 경로가 됐을 것입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '전역 fetch 를 덮어씁니다. 이후 로드되는 코드가 fetch 를 다시 감싸면 순서에 따라 토큰이 빠질 수 있고, 디버깅 시 스택이 한 겹 깊어집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '동기 XHR 은 메인 스레드를 막습니다. 로컬 서버라 응답이 빠르지만, 서버가 느려지면 첫 화면이 그만큼 늦습니다.',
        },
      ],
    }),

    mod('theme.js', {
      title: 'theme.js — 초기 테마 적용',
      subtitle: '렌더 전 실행',
      summary:
        '저장된 다크·라이트 테마를 문서가 그려지기 전에 적용해 초기 화면 깜빡임을 막습니다. 전체 12줄로 이 계층에서 가장 작은 파일이며, ' +
        '오직 "가장 먼저 실행되어야 한다"는 이유로 독립 파일입니다.',
      features: [
        { title: '위치의 의미', body: 'state-sync.js 바로 다음, 나머지 전부보다 앞. 이 자리가 파일의 존재 이유입니다.' },
        { title: '단일 책임', body: '테마 전환 UI 는 state.js·app.js 에 있고 여기에는 초기 적용만 있습니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"작아서 합쳐도 된다"의 반대 판단입니다. 실행 시점이 곧 기능인 코드는 따로 두는 편이 옳습니다.',
        },
      ],
    }),

    mod('i18n.js', {
      title: 'i18n.js — 한국어·영어 사전과 자동 번역',
      subtitle: 'DOM 텍스트·title·aria 자동 치환',
      summary:
        '한국어를 기준 문구로 두고 영어 사전을 매핑합니다. 정적 문자열뿐 아니라 매개변수가 낀 문구, DOM 의 textContent·title·aria-label 까지 ' +
        '훑어 치환하고 언어 전환 시 다시 적용합니다. 사용자에게 보이는 새 문구를 추가하면 이 파일의 영문 사전도 함께 채워야 합니다.',
      usage: [
        {
          title: '왜 DOM 을 훑는가',
          body:
            '템플릿 엔진이 없어 문구가 innerHTML 문자열로 흩어져 있기 때문입니다. 각 호출부에 t() 를 심는 대신 렌더 후 DOM 을 훑는 방식을 택했습니다.',
        },
        {
          title: '동적 UI',
          body: '나중에 추가되는 DOM 도 관찰해 보정합니다. icons.js 가 아이콘에 대해 같은 전략을 씁니다.',
        },
      ],
      features: [
        { title: '두 언어', body: '한국어(기본)와 영어. 기준 문구가 곧 사전 키라서 문구를 고치면 사전 키도 따라 바뀝니다.' },
        { title: '접근성 속성', body: 'title 과 aria-label 까지 번역 대상입니다. 스크린 리더 문구가 한국어로 남는 흔한 누락을 막습니다.' },
        { title: '파라미터 치환', body: '"파일 3개"처럼 수치가 들어가는 문구를 위한 매개변수 번역을 지원합니다.' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            '한국어 원문이 곧 사전 키입니다. 오타 수정 같은 사소한 문구 변경도 영문 번역을 조용히 끊습니다. 키를 별도 식별자로 두지 않은 대가입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'DOM 을 훑는 방식이라 번역 대상이 늘수록 비용이 커지고, 사용자가 입력한 텍스트를 실수로 번역할 위험도 구조적으로 존재합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '1,753줄 대부분이 사전 데이터입니다. 로직 자체는 크지 않습니다.',
        },
      ],
    }),

    mod('lazy.js', {
      title: 'lazy.js — 지연 vendor 로더 (MNLazy)',
      subtitle: '시작 비용 7.2MB 제거',
      summary:
        '예전에는 vendor 18개(약 7.2MB)를 시작할 때 전부 실행했습니다. .txt 하나를 열어도 엑셀·한글·PPT·맞춤법 사전이 함께 파싱돼 저사양 교실 PC 의 첫 화면이 늦었습니다. ' +
        'MNLazy 는 묶음(bundle)을 정의하고 "그 형식을 열 때·그 버튼을 누를 때" 처음 싣습니다. PDF 만은 앱의 중심 기능이라 지금도 시작 시 함께 싣습니다.',
      usage: [
        {
          title: '두 가지 모드',
          body:
            '단일 파일(오프라인 HTML·EXE)에서는 빌드가 라이브러리 소스를 실행되지 않는 text/plain 블록(data-mn-lazy 속성)으로 심어 두고, 필요할 때 그 텍스트를 실행 가능한 script 로 옮겨 심습니다. ' +
            '원본 HTML 에서는 vendor 경로를 가리키는 script 를 그때 만들어 붙입니다. 판별은 data-mn-lazy 블록의 존재 여부로 자동입니다.',
        },
        {
          title: 'JSZip 버전 충돌 처리',
          body:
            'docx-preview 는 JSZip 3.x(loadAsync)를 요구하고, PPTXjs·엑셀 복구 코드는 동기 API 의 2.6.1 을 씁니다. ' +
            'jszipSwap 플래그와 직렬화 큐(jszipBundleQueue)로 "3.x 로드 → docx-preview 로드 → 2.6.1 로 되돌리기" 순서를 재현합니다. 지연 로드 때문에 순서가 뒤바뀔 수 있는 상황(PPT 먼저, Word 나중)을 명시적으로 다룹니다.',
        },
      ],
      features: [
        { title: '중복 방지', body: '파일 단위·묶음 단위로 진행 중 Promise 를 재사용합니다. 동시에 여러 번 요청해도 로드는 한 번입니다.' },
        { title: '묶음 12종', body: 'spellcheck, jszip, zip, xlsx, yaml, exceljs, hwp, officeCrypt, capture, pptx, docx — 라벨이 사용자에게 보이는 로딩 문구가 됩니다.' },
        { title: 'manifest 와 쌍방 검사', body: 'check-source.js 가 BUNDLES 의 파일 목록과 manifest 의 lazy vendor 목록이 정확히 같은지 양방향으로 확인합니다.' },
        { title: '실행 순서 보장', body: 'files 배열의 순서가 곧 실행 순서입니다. pptx 묶음은 jquery → jszip → divs2slides → pptxjs 순서가 필수입니다.' },
      ],
      files: [
        { path: 'tools/check-source.js', label: 'check-source.js', range: [52, 90], description: '지연 vendor 쌍방 검사' },
        { path: 'build-offline.js', label: 'build-offline.js', description: 'text/plain 블록을 심는 쪽' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"묶음 정의(lazy.js)와 manifest 가 어긋나면 빌드 실패"라는 쌍방 검사가 있습니다. 한쪽만 고쳐 "시작할 때도 안 싣고 필요할 때도 안 싣는" 조용한 누락을 막습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'JSZip 두 버전 공존 문제를 감추지 않고 주석으로 이유까지 남기고 큐로 직렬화했습니다. 이 종류의 vendor 충돌은 보통 재현 어려운 버그로 남습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '전역 JSZip 을 서로 바꿔 끼우는 구조라, 두 묶음을 쓰는 코드가 동시에 비동기로 돌면 이론적으로 잘못된 버전을 볼 수 있습니다. 큐가 그것을 막고 있으므로 큐를 우회하는 새 경로를 만들지 않는 것이 중요합니다.',
        },
      ],
    }),

    mod('core.js', {
      title: 'core.js — 공통 순수 함수 (PdfSignerCore)',
      subtitle: 'UMD, 테스트 가능성의 근간',
      summary:
        '경로 정규화, 작업공간 마커, 인코딩 판별, CSV 파싱, Python 오류 설명·경로 분석·자동완성 후보, Markdown/HTML 살균, 코드 편집 순수 함수, ' +
        '단축키 정규화, Office XML 텍스트 추출까지 — DOM 없이 계산할 수 있는 로직을 모아 둔 파일입니다. ' +
        'UMD 로 감싸 module.exports 를 지원하므로 node --test 에서 브라우저 없이 그대로 검증됩니다.',
      usage: [
        {
          title: 'state.js 와의 관계',
          body: 'state.js 가 최상단에서 PdfSignerCore 를 구조 분해해 100개 이상의 이름을 꺼내 씁니다. 사실상 이 파일이 앱의 표준 라이브러리입니다.',
        },
        {
          title: '작업공간 마커',
          body:
            '.manneung-folder-keep-9f4d2a7b 같은 상수 마커 파일명을 여기서 정의합니다. 빈 폴더 보존, 이미지 건너뜀 표시, 원본 저장 표시를 파일 시스템에 남기는 방식입니다.',
        },
        {
          title: '테스트 커버리지',
          body: 'tests/core.test.js 1,425줄이 이 파일을 중심으로 돕니다. 프로젝트에서 가장 큰 단위 테스트입니다.',
        },
      ],
      features: [
        { title: '경로·작업공간', body: 'normalizeWorkspacePath, safeArchivePath, resolveSiblingPath, 폴더 마커 경로 계산.' },
        { title: 'Python 정적 분석', body: 'import 색인, 자동완성 후보, traceback 파싱, stderr 분류, 오류 한국어 설명, 가벼운 재들여쓰기.' },
        { title: '편집기 순수 로직', body: 'diffTextEdit, remapTextRangesAfterEdit, 캐럿 상태, 괄호 자동 닫기 계획, 자동완성 삽입 계획.' },
        { title: '문서·표', body: 'CSV 구분자 추론·레코드 파싱, Markdown → HTML, HTML 살균, Office XML 문단·run 텍스트 추출.' },
        { title: '분할 작업·드래그', body: '탭 드롭 분할 판정, 내부 드래그 MIME, 폴더 피커 필요 여부 판정.' },
        {
          title: 'LaTeX → MathML',
          body:
            'latexToMathML 이 노트북 셀과 화이트보드 수식이 함께 쓰는 변환기입니다. ' +
            '2026-08-12 에 환경(texEnvironment)·구분자(texDelimiter)·행렬 조판이 더해지며 이 파일이 4,000줄을 넘겼습니다.',
        },
      ],
      files: [{ path: 'tests/core.test.js', label: 'core.test.js', description: '이 파일을 검증하는 1,425줄 테스트' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'DOM 없는 계산을 한곳에 모아 UMD 로 노출한 덕분에, 브라우저 앱인데도 핵심 로직 상당 부분이 빠른 단위 테스트로 덮여 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '"공통"이라는 이름으로 여러 도메인이 한 파일에 누적됐습니다. Python 분석, Office XML, CSV, Markdown, 단축키가 한 파일에 있을 이유는 "순수 함수"라는 것뿐입니다. ' +
            '도메인별 파일로 쪼개도 UMD 패턴은 그대로 유지할 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'state.js 의 구조 분해 목록이 100개를 넘습니다. 이름을 하나 바꾸면 그 목록도 함께 고쳐야 하고, 빠뜨리면 런타임 undefined 로 나타납니다(빌드가 잡지 못함).',
        },
      ],
    }),

    mod('icons.js', {
      title: 'icons.js — 이모지 버튼의 SVG 치환',
      subtitle: 'MutationObserver 로 동적 UI 보정',
      summary:
        '앱의 이모지형 버튼을 테마에 맞는 단색 SVG 아이콘으로 정리하고, 나중에 추가되는 UI 도 관찰해 같은 처리를 적용합니다. ' +
        '이모지는 OS·폰트마다 모양과 색이 달라 교실 PC 환경에서 일관성이 깨지는데, 그 문제를 렌더 후 치환으로 해결한 방식입니다.',
      features: [
        { title: '테마 대응', body: '단색 SVG 라 다크·라이트 양쪽에서 대비가 유지됩니다.' },
        { title: '동적 UI', body: '관찰자를 두어 나중에 붙은 버튼도 보정합니다. i18n.js 와 같은 전략입니다.' },
        { title: '테스트 계약', body: 'tests/ink-toolbar-icons.test.js 가 필기·표시 도구막대가 이모지 대신 공용 아이콘을 쓰는지 검사합니다.' },
      ],
      files: [{ path: 'tests/ink-toolbar-icons.test.js', label: 'ink-toolbar-icons.test.js', description: '아이콘 사용 계약 테스트' }],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '소스에는 여전히 이모지 문자를 쓰고 화면에서만 바꾸는 방식입니다. 코드 가독성은 유지되지만, 치환 목록에 없는 새 이모지는 그대로 노출됩니다.',
        },
      ],
    }),

    mod('state.js', {
      title: 'state.js — 전역 상태와 설정·단축키',
      subtitle: '열린 문서·탭·사이드바·토스트의 원본',
      summary:
        '열린 문서 목록(docs), 탭 순서, 사이드바 트리(navNodes), 활성 문서, 앱 설정과 단축키 정의, 공용 토스트·로딩 UI 를 관리합니다. ' +
        '파일 크기는 646줄로 크지 않지만 앱 전체가 참조하는 상태의 원본이라 실질적 영향력이 가장 큰 파일 중 하나입니다.',
      usage: [
        {
          title: '조회 성능 인덱스',
          body:
            'docsBySourceKey(Map)로 "이미 열린 파일" 중복 검사를 O(1)로 만들고, navIndex + navTreeVersion 으로 트리 조회 캐시를 둡니다. ' +
            '파일 수천 개짜리 폴더·압축을 여는 상황을 염두에 둔 최적화입니다.',
        },
        {
          title: '단축키 정의',
          body: 'SHORTCUT_DEFINITIONS 가 기본 단축키의 원본입니다. 설정 화면은 app.js 가 그립니다.',
        },
      ],
      features: [
        { title: '문서 생명주기 상태', body: 'makeDoc 에서 인덱스에 등록하고 closeDoc 에서 해제합니다. 등록/해제 짝이 맞지 않으면 중복 열기 판정이 깨집니다.' },
        { title: '지연 무효화 캐시', body: 'bumpNavTree() 로 버전만 올리고 다음 조회 때 인덱스를 다시 만듭니다. 트리 변경이 잦은 상황에서 재구축 비용을 미룹니다.' },
        { title: '공용 UI', body: '토스트와 로딩 표시를 여기서 제공해 각 기능이 자체 UI 를 만들지 않게 합니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '성능 인덱스마다 "왜 필요한가"를 주석으로 남겼습니다(수천 개 폴더에서 선형 탐색 제거). 최적화의 근거가 코드에 남아 있어 나중에 안전하게 되돌릴 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'core.js 에서 100개 넘는 이름을 구조 분해로 받습니다. 이 목록 자체가 두 파일 사이의 계약인데 manifest 의 moduleBoundaries 에는 등록돼 있지 않아 자동 검사 밖입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '전역 가변 배열(docs, navNodes, tabOrder)을 직접 노출합니다. 어느 파일이든 순서를 바꿀 수 있어 "누가 이 배열을 흔들었는가"를 추적하기 어렵습니다.',
        },
      ],
    }),

    mod('history.js', {
      title: 'history.js — 공용 되돌리기 엔진 (MNEditHistory)',
      subtitle: '7개 편집기가 공유',
      summary:
        'PDF·표·이미지·화이트보드·파이썬·노트북·메모 편집기가 저마다 만들던 스냅샷 스택을 하나로 모았습니다. ' +
        '각 편집기는 capture·apply·isEqual 세 함수만 넘기고, 스택·상한·redo 무효화·버튼 상태·연속 입력 묶기는 공통으로 처리합니다. ' +
        '123줄짜리 파일이 7개 편집기의 되돌리기 정책을 통일한, 이 코드베이스에서 재사용 밀도가 가장 높은 모듈입니다.',
      usage: [
        {
          title: '불변 조건',
          body:
            'entries[index] 는 항상 화면의 현재 상태와 같습니다. 그래서 commit() 은 편집 직전이 아니라 편집을 마친 뒤에 부릅니다. ' +
            '이 규칙 덕분에 canUndo/canRedo 가 capture() 없이 index 만으로 결정돼 버튼 갱신이 쌉니다.',
        },
        {
          title: 'isEqual 을 필수로 받는 이유',
          body:
            'undo() 는 아직 기록되지 않은 현재 상태를 먼저 commit() 해서 확정합니다. 이때 "안 바뀌었으면 쌓지 않는다"를 판정하지 못하면, ' +
            'capture() 가 매번 새 객체를 주는 편집기에서 undo 가 방금 만든 같은 상태로 되돌아가 아무 일도 하지 않습니다. 조용히 깨지는 종류라 선택이 아니라 필수 인자로 받습니다.',
        },
        {
          title: '종류별 상한',
          body:
            'text 300 / board 140 / image 50 / pdf 50 / sheet 40 / notebook 24. 스냅샷 하나의 무게가 편집기마다 달라(글자 몇 줄 vs 시트 전체 복제) 상한을 나눴고, ' +
            '노트북은 개수와 총 바이트를 함께 겁니다.',
        },
      ],
      features: [
        { title: 'redo 무효화', body: '새 편집이 들어오면 앞쪽 redo 기록을 버립니다. tests/e2e/undo-redo.spec.js 가 이 동작을 검증합니다.' },
        { title: '연속 입력 묶기', body: '타이핑처럼 잦은 변경을 한 단계로 묶어 되돌리기 깊이를 낭비하지 않습니다.' },
        { title: '버튼 상태 콜백', body: 'onChange 로 각 편집기의 undo/redo 버튼 활성 상태를 갱신합니다.' },
      ],
      files: [{ path: 'tests/edit-history.test.js', label: 'edit-history.test.js', description: '되돌리기 엔진 단위 테스트' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"이 인자를 안 받으면 조용히 깨진다"는 판단으로 isEqual 을 필수 인자로 만들고 그 이유를 주석에 남겼습니다. 실수를 API 설계로 막은 좋은 예입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '상한을 한 파일에 모아 두어 "탭마다 되돌리기 깊이가 왜 다른지"를 한눈에 비교할 수 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '스냅샷 방식이라 문서가 커지면 메모리를 그만큼 씁니다. sheet 40 / notebook 24 라는 낮은 상한이 그 대가입니다.',
        },
      ],
    }),

    mod('search-history.js', {
      title: 'search-history.js — 최근 검색어 (MNSearchHistory)',
      subtitle: '구획별 12개 보관',
      summary:
        '검색어를 구획(통합검색·편집기·PDF·노트북·표·일괄바꾸기)별로 나눠 localStorage 에 12개까지 보관하고, ' +
        '찾기 창을 열 때 마지막 검색어를 채워 주며 드롭다운을 그립니다. 찾기 옵션(대소문자·단어·정규식)도 함께 기억합니다.',
      usage: [
        {
          title: '기록 시점',
          body:
            '창을 열 때가 아니라 Enter·다음/이전·바꾸기처럼 실제로 검색을 쓴 순간에만 남깁니다. 타이핑 중간값이 기록을 오염시키지 않습니다.',
        },
        {
          title: '기록하지 않는 것',
          body:
            "'바꿀 내용'은 기억하지 않습니다. 또 여러 파일을 한꺼번에 바꾸는 자리(시트 찾기·바꿈, 여러 파일 찾아 바꾸기)에서는 목록만 보여 주고 자동으로 채우지 않습니다 — 실수로 대량 치환이 일어나는 것을 막기 위한 판단입니다.",
        },
      ],
      features: [
        { title: '구획 분리', body: '한 구획의 검색어가 다른 화면에 튀어나오지 않습니다.' },
        { title: '옵션 기억', body: '정규식으로 찾던 사람이 다시 열었을 때 같은 옵션으로 시작합니다.' },
        { title: '설정에서 제어', body: '설정 → 일반에서 끄거나 한 번에 지울 수 있습니다.' },
      ],
      files: [{ path: 'tests/search-history.test.js', label: 'search-history.test.js', description: '구획·상한·자동채움 정책 테스트' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '대량 치환 화면에서만 자동채움을 끈 판단이 좋습니다. 편의 기능이 파괴적 동작과 만나는 지점을 정확히 구분했습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '검색어가 localStorage 에 남습니다. 공용 PC 를 상정한 앱이라면 개인정보가 될 수 있는데, 끄고 지우는 설정을 제공해 대응했습니다.',
        },
      ],
    }),

    mod('special-chars.js', {
      title: 'special-chars.js — 특수문자 문자표 (MNSpecialChars)',
      subtitle: '한자키를 대신하는 장치',
      summary:
        '브라우저 위에서 도는 편집기라 한글의 "ㅁ + 한자키" 입력이 오지 않습니다. 그래서 커서 자리에서 우클릭 → 특수문자(또는 Ctrl+F10)로 문자표를 열어 ' +
        '※ ○ ① ㎡ 같은 글자를 넣습니다. 한자키 자모(ㄱ·ㄴ·ㄷ…)와 같은 묶음 구성으로 보여 주어 기존 습관을 그대로 쓸 수 있게 했습니다.',
      features: [
        { title: '묶음 구성', body: '문장부호·괄호·수학·단위·일반기호·화살표·선/표·원문자·로마/그리스·분수·한글 자모·가나·키릴·라틴·그림문자.' },
        { title: '연속 삽입', body: 'Shift+클릭이면 문자표를 닫지 않고 이어서 넣습니다.' },
        { title: '최근 사용', body: '최근 쓴 글자 20개를 localStorage 에 기억합니다.' },
        {
          title: 'contenteditable 대응',
          body: '표 셀 같은 contenteditable 자리는 python-editor.js 의 attachEditableContextMenu 가 선택 Range 기준으로 같은 메뉴를 띄웁니다.',
        },
      ],
      files: [{ path: 'tests/special-chars.test.js', label: 'special-chars.test.js', description: '묶음·한자키 자모 대응·최근 기록 테스트' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"브라우저라서 안 되는 것"을 기능으로 메운 사례이고, 한자키 자모 배열을 그대로 따라 학습 비용을 없앴습니다. 교실용 도구다운 판단입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '공개 API 소비자는 python-editor.js 한 곳뿐입니다. 다른 편집기는 그 우클릭 메뉴를 통해 간접적으로 씁니다.',
        },
      ],
    }),

    mod('spellcheck.js', {
      title: 'spellcheck.js — 오프라인 한국어 맞춤법 (MNKoreanSpellcheck)',
      subtitle: '본체 외에 3MB hunspell 워커(지연 로드)',
      summary:
        '외부 API 없이 도는 한국어 맞춤법·띄어쓰기 규칙 엔진과 공통 검사 패널입니다. 문서 종류에 따라 검사 범위를 달리해서, ' +
        '일반 문서는 전체 글을, 마크다운은 코드 구간을 제외하고, 코드 파일은 주석·문자열만 검사합니다. ' +
        '확실한 규칙 검사에 더해 3MB hunspell 사전 워커를 검사 첫 실행 때 MNLazy 로 불러와 낱말 단위 오탈자까지 봅니다.',
      usage: [
        {
          title: '사전 워커의 타임아웃',
          body: '45초 안에 못 받아오면 규칙 검사 결과만 씁니다. 사전 로드 실패가 기능 전체를 막지 않게 하는 폴백입니다.',
        },
        {
          title: '한글 조합 처리',
          body: '조합 중인 글자를 오타로 표시하지 않도록 안전 재검사를 둡니다. IME 를 쓰는 언어에서 필수인 처리입니다.',
        },
      ],
      features: [
        { title: '범위 분기', body: '일반 문서 / 마크다운(코드 제외) / 코드(주석·문자열만) 세 갈래.' },
        { title: '사용자 사전', body: '무시 목록과 사용자 사전을 두어 반복 오탐을 줄입니다.' },
        { title: '워커 빌드', body: 'tools/build-korean-spell-worker.mjs 가 hunspell-wasm·hunspell-dict-ko 를 esbuild 로 묶고 manifest 의 sha384 도 갱신합니다.' },
      ],
      files: [
        { path: 'tools/build-korean-spell-worker.mjs', label: 'build-korean-spell-worker.mjs', description: '사전 워커 빌드 도구' },
        { path: 'tests/spellcheck.test.js', label: 'spellcheck.test.js', description: '규칙·범위·사용자 사전 테스트' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '맞춤법 검사를 외부 API 로 보내지 않습니다. 학생 문서가 외부로 나가지 않는다는 이 앱의 기본 원칙과 일관됩니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '3MB 사전을 시작 로드가 아니라 첫 검사 시점으로 미루고, 45초 타임아웃 폴백까지 둔 것이 실사용 환경(느린 교실 PC)을 고려한 설계입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '규칙 엔진과 hunspell 결과가 섞여 나옵니다. 사전을 못 받은 경우와 받은 경우의 결과가 달라지므로, 사용자가 "어제는 잡히던 게 오늘은 안 잡힌다"고 느낄 수 있습니다.',
        },
      ],
    }),
  ];
};
