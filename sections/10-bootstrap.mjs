// 1. bootstrap — 설정과 공통 기반. 화면이 그려지기 전에 자리를 잡는 계층.

import { anchoredRange, linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'bootstrap');
  // 줄 수는 문장에 적지 않고 생성 때 잰다(lib/source-metrics.mjs 의 이유 참고).
  const coreLines = linesLabel(rootDir, 'src/js/core.js');
  const stateLines = linesLabel(rootDir, 'src/js/state.js');
  const coreTestLines = linesLabel(rootDir, 'tests/core.test.js');
  // 지연 vendor 통계도 손으로 적지 않는다 — 묶음이 늘 때마다 문장이 조용히 낡는 자리였다.
  const lazyVendors = (manifest.vendorScripts ?? []).filter((item) => item.lazy);
  const lazyBundleNames = [...new Set(lazyVendors.map((item) => item.lazy))];
  // Worker 전달용(js*) 은 실행 묶음이 아니라 소스 문자열로만 쓰인다.
  const runBundleNames = lazyBundleNames.filter((name) => !/^js[A-Z]/.test(name));

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
        {
          path: 'scripts.manifest.json',
          label: 'manifest (bootstrap 계층)',
          // 줄 번호가 아니라 앵커로 — 계층에 파일이 붙으면 뒤 구간이 통째로 밀린다.
          range: anchoredRange(rootDir, 'scripts.manifest.json', {
            from: '"name": "bootstrap"',
            before: 1,
            to: '"name": "documents"',
            after: -3,
          }) ?? undefined,
          description: 'bootstrap 계층 로드 순서',
        },
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
            `core.js ${coreLines} / state.js ${stateLines} 이지만 state.js 가 core 에서 구조 분해로 가져오는 이름이 100개가 넘습니다. ` +
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
            'window.fetch 를 래핑해 같은 origin 요청에만 X-ClassDock-Token 헤더를 붙입니다. 각 호출부가 토큰을 신경 쓰지 않아도 되도록 한 지점에서 처리합니다.',
        },
      ],
      features: [
        { title: '조건부 활성', body: 'http/https 이면서 host 가 127.0.0.1 또는 localhost 일 때만 동작합니다. 그 외에는 즉시 return 합니다.' },
        { title: '종료 직전 전송', body: '창을 닫기 직전 상태도 서버로 보내 마지막 변경을 잃지 않게 합니다.' },
        { title: '토큰 주입', body: '런처가 HTML 에 심어 둔 window.__CLASSDOCK_LOCAL_TOKEN__ 을 읽어 씁니다.' },
      ],
      files: [
        {
          path: 'desktop/launcher.cs',
          label: 'launcher.cs (토큰)',
          // 줄 번호가 아니라 앵커로 찾는다 — launcher.cs 가 자라며 [740, 800] 이 엉뚱한 함수를 가리켰다.
          range: anchoredRange(rootDir, 'desktop/launcher.cs', {
            from: 'static bool TokenEquals',
            before: 4,
            lines: 60,
          }) ?? undefined,
          description: '서버측 토큰 검증',
        },
      ],
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

    mod('diagnostics.js', {
      title: 'diagnostics.js — 앱 공통 진단 로그 (MNDiagnostics)',
      subtitle: '문서 본문 없이 오류와 마지막 정상 상태만 남긴다',
      summary:
        '교실 PC 에서 난 문제를 재현 없이 짚기 위한 기록 장치입니다. 오류와 마지막 정상 화면 상태를 모아 ' +
        'EXE 에서는 %LOCALAPPDATA%\\ClassDock\\logs 로 보내고, 서버가 없으면 작은 localStorage 순환 기록(160건)에 남깁니다. ' +
        'state-sync.js 다음, theme.js 앞에 놓여 다른 모듈이 만든 오류를 처음부터 받을 수 있게 했습니다.',
      usage: [
        {
          title: '무엇을 안 남길지가 먼저다',
          body:
            'sanitize 가 값을 옮기기 전에 privateKey 로 키 이름부터 봅니다 — password·secret·token·authorization·cookie 는 물론 ' +
            'document text·source·content·body·code 까지 통째로 "[제외]" 로 바꿉니다. 사용자의 문서 본문이 로그로 새는 길을 ' +
            '이름 단계에서 끊은 것입니다. 값 쪽은 scrubString 이 Windows·macOS·리눅스 개인 폴더 경로, ' +
            '쿼리 문자열의 token·key·secret·password, sk-·pk- 형식 키, 180자 넘는 base64 덩어리를 각각 자리표시자로 바꿉니다.',
        },
        {
          title: '멈춘 화면은 그 자리에서 기록할 수 없다',
          body:
            '화면이 완전히 멈추면 그 뒤 코드는 실행되지 않으므로, 멈춘 사실을 그 순간에 적을 방법이 없습니다. ' +
            '그래서 5초마다 생존 신호를 남기고(HEARTBEAT_MS), 다음 실행에서 마지막 신호가 15초(FREEZE_GAP_MS) 넘게 끊겼던 세션을 ' +
            '비정상 종료로 판정해 그때의 마지막 정상 상태를 함께 보여 줍니다. "그 순간을 기록한다" 가 불가능한 실패를 ' +
            '"다음 실행에서 되짚는다" 로 바꾼 구조입니다.',
        },
        {
          title: '문맥은 화면 쪽이 등록한다',
          body:
            'registerContext 로 각 화면이 "지금 무엇을 하고 있었는지" 를 내주는 함수를 등록해 둡니다. ' +
            '오류가 났을 때 진단이 그 함수들을 불러 공통 문맥을 만들되, 그 값도 같은 sanitize 를 거칩니다 — ' +
            '문맥 제공자가 실수로 문서 본문을 넣어도 걸러지는 자리에 두었습니다.',
        },
        {
          title: '깊이와 길이를 둘 다 자른다',
          body:
            '객체는 4단계까지만 따라 내려가고, 문자열은 1,200자(stack 은 3,600자)에서 자릅니다. ' +
            '순환 참조는 seen 으로 끊습니다. 로그 파일이 커지는 것보다 "진단을 켜 두면 앱이 느려진다" 가 더 큰 문제라, ' +
            '값을 통째로 담지 않는 쪽을 기본값으로 잡았습니다.',
        },
      ],
      features: [
        { title: '세 갈래 기록', body: 'info · warn · error. error 는 Error 객체를 받아 message·name·stack 을 따로 다듬습니다.' },
        { title: '두 저장소', body: '런처가 있으면 /diagnostics/events 로, 없으면 localStorage 순환 기록으로. 어느 쪽인지는 한 번 판정해 두고 씁니다(serverAvailable).' },
        { title: '설정 패널', body: 'wireSettings 가 설정 화면에 목록·내보내기·지우기·폴더 열기를 붙입니다.' },
        { title: '확장 프로그램 걸러 내기', body: 'extensionOnly — 브라우저 확장에서 난 오류를 앱 오류와 갈라냅니다.' },
      ],
      files: [
        { path: 'tests/diagnostics.test.js', label: 'diagnostics.test.js', description: '제거 규칙·순환 기록·비정상 종료 판정·설정 패널·임시 기록 위치' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '진단 도구에서 가장 흔한 사고(로그에 남을 것이 남았다)를 기본 동작으로 막았습니다. ' +
            '키 이름 목록에 content·body·source·document text 까지 넣어 "문서 편집기의 진단 로그" 라는 이 앱 특유의 위험을 짚었고, ' +
            'tests/diagnostics.test.js 의 첫 테스트 제목이 그대로 "문서 내용·키·개인 경로를 제거하고 길이를 제한한다" 입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '진단 임시 기록이 사용자 백업으로 옮겨 가거나 Git 작업 폴더에 만들어지지 않는지를 테스트가 따로 봅니다. ' +
            '"기록을 남긴다" 는 기능이 "기록이 엉뚱한 곳으로 따라간다" 로 번지는 경로를 미리 막은 검사입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '거르는 일이 전부 브라우저 쪽 이 파일에 있고 런처는 받은 것을 그대로 적습니다. ' +
            '지금은 모든 기록이 이 모듈을 거치므로 문제가 없지만, 다른 코드가 /diagnostics/events 를 직접 부르면 그 단계를 건너뜁니다. ' +
            '서버 쪽 두 번째 방어선이 없다는 점은 알고 있어야 할 성질입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'bootstrap 계층 두 번째로 로드됩니다 — state-sync.js 가 토큰 붙은 fetch 를 먼저 마련해야 하고, ' +
            '그 뒤로는 최대한 앞에 있어야 다른 모듈의 초기화 오류를 받을 수 있기 때문입니다. 로딩 순서 자체가 이 모듈의 요구사항입니다.',
        },
      ],
    }),

    mod('context-menu.js', {
      title: 'context-menu.js — 여러 층 우클릭 메뉴 (MNContextMenu)',
      subtitle: '항목이 스무 개를 넘으면 한 줄로 쌓을 수 없다',
      summary:
        '서브메뉴가 층층이 열리는 우클릭 메뉴를 만드는 모듈입니다. 층 쌓기, 오른쪽 공간이 모자라면 왼쪽으로 뒤집기, ' +
        '옆 항목으로 지나갈 때 220ms 유예 뒤 닫기, Escape 로 한 층만 닫기, 바깥 클릭·창 크기 변경으로 전부 닫기가 들어 있습니다. ' +
        '겉모습은 부르는 쪽 CSS 를 그대로 씁니다 — base 를 주면 그 접두사로 클래스를 붙이므로, ' +
        '이미 있는 메뉴를 이 모듈로 옮겨도 보이는 모습이 바뀌지 않습니다.',
      usage: [
        {
          title: '같은 코드가 이미 두 벌 있었다',
          body:
            '파일 첫머리에 이유가 그대로 적혀 있습니다 — docx 편집기와 악보 편집기에 같은 잔손질이 한 벌씩 들어 있고, ' +
            '여기로 모아 두면 세 번째 복사본이 생기지 않는다는 것입니다. ' +
            '"공용 모듈을 만든다" 가 아니라 "세 번째를 막는다" 로 적힌 동기라, 언제 이 판단이 옳았는지 나중에 셀 수 있습니다.',
        },
        {
          title: '겉모습을 바꾸지 않는 이전 경로',
          body:
            'base:"text-context" 를 주면 .text-context-menu / -sub / -parent / -sep 를 붙입니다. ' +
            '공용화의 가장 큰 걸림돌이 "옮기면 모양이 달라진다" 인데, 클래스 접두사를 인자로 받아 그 걸림돌을 없앴습니다. ' +
            '옛 구현을 하나씩 옮길 수 있게 만든 설계입니다.',
        },
        {
          title: '터치·펜에는 pointerenter 가 오지 않는다',
          body:
            '부모 항목은 pointerenter 로도 열리고 click 으로도 열립니다. ' +
            '마우스만 생각하면 hover 로 충분하지만, 그러면 태블릿에서 서브메뉴를 열 방법이 없어집니다. ' +
            '이미 열려 있는 층을 다시 열지 않도록 부모 버튼을 층에 기억시켜(__parentButton) 깜빡임도 막습니다.',
        },
        {
          title: '대각선으로 지나가는 커서',
          body:
            '서브메뉴로 가려고 옆 항목 위를 스치면 그때마다 닫히는 것이 우클릭 메뉴에서 가장 성가신 동작입니다. ' +
            '다른 항목에 들어오면 곧바로 닫지 않고 220ms(SUB_CLOSE_MS) 기다렸다가 닫으며, ' +
            '그 사이 서브메뉴 위로 들어오면 pointerenter 가 타이머를 취소합니다.',
        },
        {
          title: '포커스와 선택을 뺏지 않는다',
          body:
            '실행 항목의 pointerdown 에서 preventDefault 를 부릅니다. ' +
            '편집기에서 글자를 선택해 두고 우클릭한 상황에서 메뉴 버튼이 포커스를 가져가면 그 선택이 풀리고, ' +
            '"선택한 것에 적용" 하려던 동작이 빗나갑니다. 메뉴가 도구가 아니라 도구를 고르는 자리라는 점을 반영한 처리입니다.',
        },
        {
          title: '자기 자신을 여는 클릭에 곧바로 닫히지 않게',
          body:
            '바깥 클릭 감지 리스너를 setTimeout(0) 으로 다음 차례에 붙입니다. ' +
            '지금 처리 중인 pointerdown 이 그대로 "바깥 클릭" 으로 잡히면 메뉴가 뜨자마자 닫힙니다. ' +
            '리스너는 등록과 해제를 close 가 짝지어 관리해 document 에 남지 않습니다.',
        },
      ],
      features: [
        { title: '항목 모양', body: '{ label, title, action, disabled, children, active, separator }. children 이 있으면 부모가 되고 action 은 무시합니다 — 층을 여는 일이 곧 동작입니다.' },
        { title: '접근성 속성', body: 'role=menu / menuitem, 구분선은 separator. active 를 주면 menuitemcheckbox 와 aria-checked 로 바뀝니다.' },
        { title: 'Escape 는 한 층씩', body: '서브메뉴가 열려 있으면 그 층만 닫고, 1단만 남았을 때 전체를 닫습니다.' },
        { title: 'disabled 를 함수로', body: 'disabled 에 함수를 주면 메뉴를 그릴 때 불러 판정합니다 — 여는 시점의 상태를 반영합니다.' },
        { title: '닫는 함수를 돌려준다', body: 'open() 의 반환값이 이 메뉴를 닫는 함수라, 부르는 쪽이 자기 사정으로 닫을 수 있습니다.' },
      ],
      files: [],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '공용화를 하면서 "보이는 모습은 한 픽셀도 바뀌지 않는다" 를 설계 목표로 잡았습니다. ' +
            '클래스 접두사를 인자로 받는 작은 결정 하나로, 옛 구현을 한꺼번에 갈아엎지 않고 하나씩 옮길 수 있게 됐습니다. ' +
            '리팩터링이 중간에 멈춰도 화면이 어긋나지 않는 형태입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '메뉴 UI 에서 실제로 사람을 괴롭히는 세부(대각선 커서, 터치에 hover 없음, 선택 뺏기, 자기 클릭에 닫힘)를 ' +
            '네 가지 모두 코드에 이유 주석과 함께 담았습니다. 168줄짜리 파일치고 담긴 경험의 밀도가 높고, ' +
            '옛 구현을 옮길 때 무엇을 잃지 말아야 하는지가 이 주석들로 남습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '흡수가 아직 시작 단계입니다. manifest 의 소비자로 등록된 것은 python-editor.js 하나뿐이고, ' +
            '파일 주석이 지목한 docx 편집기·악보 편집기의 복사본은 그대로 남아 있습니다. ' +
            '세 번째 복사본을 막으려고 만든 모듈인데 첫 번째·두 번째가 아직 살아 있어, 지금은 같은 기능이 세 벌인 상태입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '키보드 조작은 Escape 와 autoFocus 로 첫 항목에 포커스를 주는 것까지입니다. ' +
            '위·아래 화살표로 항목을 옮기거나 →/← 로 층을 여닫는 처리는 없어, 열고 나면 Tab 에 의존합니다. ' +
            '자체 편집기·자체 팔레트를 쓰는 이 앱의 접근성 공백과 같은 결의 빈자리입니다.',
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
      subtitle: `시작 비용 제거 — vendor ${lazyVendors.length}개를 필요할 때로 미룸`,
      summary:
        `예전에는 vendor 를 시작할 때 전부 실행했습니다(지금 지연 대상만 세어도 ${lazyVendors.length}개입니다). ` +
        '.txt 하나를 열어도 엑셀·한글·PPT·맞춤법 사전이 함께 파싱돼 저사양 교실 PC 의 첫 화면이 늦었습니다. ' +
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
        {
          title: `실행 묶음 ${runBundleNames.length}종`,
          body: `${runBundleNames.join(', ')} — 라벨이 사용자에게 보이는 로딩 문구가 됩니다. 목록은 manifest 에서 생성 때 세므로 묶음이 늘어도 이 문장은 낡지 않습니다.`,
        },
        {
          title: '가장 늦게 들어온 묶음',
          body:
            'leaflet(지도)과 xterm(원격 터미널)입니다. 둘 다 "그 기능을 실제로 열 때" 만 실행되므로, ' +
            '지도와 SSH 가 들어오면서 늘어난 시작 비용은 0 입니다. 새 기능이 vendor 를 데려와도 첫 화면이 느려지지 않는 구조가 여기서 지켜집니다.',
        },
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

    mod('interaction-core.js', {
      title: 'interaction-core.js — 드래그·분할 판정 순수 함수',
      subtitle: 'DOM 없이 결정하는 드롭 대상과 참고 잠금 허용 범위',
      summary:
        'core.js 에서 떼어낸 137줄짜리 순수 함수 묶음입니다. "탭을 이 칸에 놓으면 무슨 일이 일어나야 하는가", ' +
        '"이 드롭이 내부 이동인가 외부 파일인가", "참고 잠금 중 이 키·클릭을 통과시킬 것인가" 를 DOM 을 만지지 않고 문자열과 좌표만으로 판정합니다. ' +
        '분할 화면 상태 전이는 경우의 수가 많아 화면 코드에 섞이면 검증이 불가능해지는데, 그 판단만 끌어내 테이블처럼 읽히게 만든 것이 이 파일의 핵심입니다.',
      usage: [
        {
          title: '상태 전이를 문자열로 돌려준다',
          body:
            'tabDropSplitAction() 은 DOM 을 바꾸지 않고 "keep" · "swap" · "replace-reference" · "pin-with-mate" 같은 결정만 돌려줍니다. ' +
            '호출부(core.js)가 그 문자열을 보고 실제 전이를 수행하므로, 판정 로직만 따로 테스트할 수 있습니다.',
        },
        {
          title: '경계선과 판정이 같은 값을 쓴다',
          body:
            'splitDropSideAtPoint() 에 splitRatio 를 넘겨, 드롭 안내로 그리는 시각적 경계와 실제 판정이 반드시 같은 비율을 쓰게 했습니다. ' +
            '"보이는 곳과 떨어지는 곳이 다르다" 는 종류의 버그를 구조로 막은 부분입니다.',
        },
        {
          title: '내부 드래그 식별',
          body:
            'INTERNAL_DRAG_MIME("application/x-classdock-internal-drag") 을 DataTransfer 에 심어 내부 이동을 표시합니다. ' +
            'isInternalDragTransfer() 는 이 MIME 이 없더라도 fallbackActive 플래그로 한 번 더 봐 주지만, types 에 "Files" 가 있으면 항상 외부 파일로 판정합니다.',
        },
      ],
      features: [
        {
          title: '참고 잠금은 허용 목록 방식',
          body:
            'studyReadonlyPointerAllowed() · studyReadonlyKeyAllowed() 는 막을 것을 나열하지 않고 통과시킬 것만 나열합니다. ' +
            '표는 한 번 클릭(선택)까지만 열어 두고 더블클릭·컨텍스트 메뉴는 막아, 읽기와 편집 진입의 경계를 표면 단위로 나눴습니다.',
        },
        {
          title: '드롭 항목 즉시 확보',
          body:
            'captureDroppedFileItems() 가 files·entries·getAsFileSystemHandle() Promise 를 이벤트가 끝나기 전에 한 번에 붙잡습니다. ' +
            'DataTransfer 는 이벤트 핸들러를 벗어나면 무효화되므로 await 이후에 읽으면 이미 비어 있습니다.',
        },
        {
          title: '폴더 드롭 보정',
          body:
            'droppedTransferNeedsFolderPicker() 는 브라우저가 폴더를 크기 0·타입 없음의 가짜 파일 하나로 넘기는 경우를 감지해 폴더 선택창으로 넘깁니다.',
        },
      ],
      files: [
        { path: 'tests/study-mode.test.js', label: 'study-mode.test.js', description: '분할 전이와 참고 잠금 허용 범위' },
        { path: 'tests/folder-workspace.test.js', label: 'folder-workspace.test.js', description: '드롭 판정과 폴더 선택창 보정' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '분할 화면 전이를 순수 함수로 뽑아낸 판단이 이 파일의 값어치입니다. tabDropSplitAction() 하나에 분할 여부 × 드롭 역할 × 끌어온 문서의 정체까지 ' +
            '경우의 수가 열 갈래 가까이 있는데, DOM 이 섞여 있었다면 이 조합을 테스트로 고정할 방법이 없습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '참고 잠금을 차단 목록이 아니라 허용 목록으로 짠 것이 맞습니다. 편집 진입 경로는 계속 늘어나므로, 막을 것을 세는 방식이었다면 새 기능이 생길 때마다 잠금이 조용히 뚫립니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'droppedTransferNeedsFolderPicker() 가 폴더를 "크기 0 · 타입 없음 · 항목 1개" 로 추정합니다. ' +
            '확장자 없는 진짜 빈 파일(예: LICENSE 를 비워 둔 것)을 하나만 끌어다 놓으면 폴더로 오인해 선택창을 띄웁니다. ' +
            '브라우저가 폴더와 빈 파일을 구분해 주지 않는 한계에서 온 것이지만, 사용자에겐 "파일을 놨는데 창이 뜬다" 로 보입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'isInternalDragTransfer() 의 fallbackActive 는 호출부가 들고 있는 플래그라 stale 될 수 있습니다. ' +
            '주석이 그 점을 인정하고 "Files 가 있으면 외부 우선" 이라는 안전판을 뒀지만, 정답은 MIME 이 항상 실리는 것입니다.',
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
            '.classdock-folder-keep-9f4d2a7b 같은 상수 마커 파일명을 여기서 정의합니다. 빈 폴더 보존, 이미지 건너뜀 표시, 원본 저장 표시를 파일 시스템에 남기는 방식입니다.',
        },
        {
          title: '테스트 커버리지',
          body: `tests/core.test.js ${coreTestLines}이 이 파일을 중심으로 돕니다. 프로젝트에서 가장 큰 단위 테스트입니다.`,
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
      files: [{ path: 'tests/core.test.js', label: 'core.test.js', description: '이 파일을 검증하는 테스트' }],
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
        `파일 크기는 ${stateLines}로 크지 않지만 앱 전체가 참조하는 상태의 원본이라 실질적 영향력이 가장 큰 파일 중 하나입니다.`,
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

    mod('workspaces.js', {
      title: 'workspaces.js — 가상 작업공간',
      subtitle: '파일을 복제하지 않고 한 문서를 여러 화면이 나눠 쓴다',
      summary:
        '열려 있는 문서들을 여러 "작업공간"으로 갈라, 화면마다 다른 탭·사이드바·분할 배치를 두는 기능입니다. ' +
        '핵심은 파일을 복사하지 않는다는 것입니다 — 같은 문서 모델 하나를 여러 작업공간이 가리키고, ' +
        '이 파일은 멤버십(어느 작업공간이 어느 문서를 갖는가)과 탭·배치만 저장합니다.',
      usage: [
        {
          title: '기존 저장소를 건드리지 않는다',
          body:
            '자동 복원의 원본 풀인 workspace.bin 은 그대로 두고, 작업공간 정보는 localStorage 의 별도 키에 담습니다. ' +
            '두 저장소의 역할이 갈려 있어 "작업공간을 지워도 파일은 남는다"가 구조적으로 보장됩니다. ' +
            '이름이 비슷해 헷갈리기 쉬운 자리인데(workspace.bin 대 classdock-workspaces), 파일 첫 주석이 그 구분을 먼저 밝힙니다.',
        },
        {
          title: '복원 순서의 함정을 막는다',
          body:
            'workspaceRestoreNeedsPreservation 이 "복원할 원본은 있는데 멤버십 기록이 아직 없는" 상태를 따로 판정합니다. ' +
            '이 판정이 없으면 첫 실행에서 저장된 문서 키가 빈 화면으로 덮어써집니다 — 테스트 제목이 그대로 ' +
            '"복원 원본이 없을 때 저장된 작업공간 문서 키를 빈 화면으로 덮어쓰지 않는다" 입니다.',
        },
        {
          title: '경로 인덱스',
          body:
            '문서를 원본 절대경로·복원 경로·파일 핸들 세 갈래로 색인해 둡니다(Map 둘 + WeakMap 하나). ' +
            '폴더를 드롭했을 때 "이 파일이 이미 열려 있는가"를 전체 문서 순회 없이 판정하기 위해서입니다. ' +
            '수천 개짜리 폴더를 여는 상황을 염두에 둔 최적화이며, state.js 의 docsBySourceKey 와 같은 발상입니다.',
        },
        {
          title: '상한을 값으로',
          body:
            '작업공간 24개, 문서 키 10,000개, 탭 1,000개, 최근 목록 50개, 이름 40자. ' +
            '손으로 고친 localStorage 가 들어와도 화면이 폭주하지 않습니다.',
        },
      ],
      features: [
        { title: '작업공간 6색', body: '색으로 구분합니다. 만들기·이름 변경은 브라우저 prompt 가 아니라 앱 입력창을 씁니다.' },
        { title: '공유 문서', body: '한 문서가 여러 작업공간에 속할 수 있고, 닫으면 현재 작업공간에서만 분리됩니다.' },
        { title: '배치 기억', body: '사이드바 접힘·검색어, 분할 위·아래/좌·우 전환을 작업공간마다 따로 둡니다.' },
        { title: '폴더 재배치', body: '낱개로 열려 있던 파일이 드롭한 폴더에 포함되면 그 폴더 아래로 옮깁니다.' },
        { title: '종료 확정', body: '종료 직전 변경을 서버 상태로 한 번 더 확정합니다.' },
      ],
      files: [
        { path: 'tests/workspaces.test.js', label: 'workspaces.test.js', description: '정규화·복원 순서·경로 인덱스·공유 문서 14개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"파일을 복제하지 않는다"는 결정이 이 기능의 성격을 정했습니다. 복제했다면 같은 파일의 두 사본이 갈라져 ' +
            '어느 쪽을 저장할지 매번 물어야 했을 것입니다. 대신 멤버십만 저장하기로 하면서 이 파일이 다루는 것은 ' +
            '"목록과 배치" 뿐이고, 문서 모델 자체는 손대지 않습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '테스트 14개가 대부분 "조용히 깨지는" 종류를 겨눕니다 — 빈 화면 덮어쓰기, 폴더 중복 재읽기, ' +
            '다른 작업공간의 숨은 트리 동기화. 화면으로는 한참 뒤에야 드러나는 상태 오염들이라, 여기에 테스트를 둔 판단이 맞습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '작업공간 정보가 localStorage 에만 있습니다. 런처는 실행마다 다른 포트를 잡을 수 있고 앱 모드는 별도 브라우저 프로필로 열리는데, ' +
            '그 두 경우 origin 이 달라져 작업공간 구성이 통째로 사라져 보입니다. ' +
            '같은 문제를 지도의 검색 공급자는 런처(/app-state)에 저장해 피했습니다 — 이쪽도 같은 길이 열려 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '문서를 세 갈래(절대경로·복원경로·핸들)로 색인하는데, 색인 등록과 해제가 짝을 이루지 않으면 ' +
            '"이미 열린 파일" 판정이 조용히 어긋납니다. 등록은 workspaceIndexDocument 한 곳이지만 해제는 문서 닫기 경로에 흩어져 있어, ' +
            '새 문서 종류를 붙일 때 함께 확인해야 하는 지점입니다.',
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
