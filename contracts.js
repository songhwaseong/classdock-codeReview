// 계약 — ① 전역 스크립트가 서로를 부르는 창구(MN* 공개 API) ② EXE 로컬 서버 엔드포인트.
//
// ①은 scripts.manifest.json 의 moduleBoundaries 와 같은 목록이며, check-source.js 가
//   "선언이 실제로 있는가 / 소비자가 정말 쓰는가 / 소비자가 나중에 로드되는가"를 검사한다.
// ②는 desktop/launcher.cs 의 라우팅에서 뽑았다. 토큰 필요 여부는 RequiresLocalAuthToken 기준이다.

window.MN_CONTRACTS = [
  // ── 전역 공개 API ────────────────────────────────────

  {
    sectionIds: ['module-boundaries', 'lazy'],
    kind: 'API',
    title: 'MNLazy — 지연 vendor 로더',
    source: 'src/js/lazy.js',
    file: 'src/js/lazy.js',
    line: 158,
    when: '무거운 vendor 라이브러리가 실제로 필요해지는 순간(그 형식을 열 때, 그 버튼을 누를 때)',
    tags: ['소비자 10개', 'need()', 'tryNeed()', 'isLoaded()', 'bundleLabel()', 'source()', 'BUNDLES'],
    snippet: `// 묶음 12종: spellcheck jszip zip xlsx yaml exceljs hwp
//           officeCrypt capture pptx docx
await MNLazy.need("xlsx");        // 실패하면 예외
const ok = await MNLazy.tryNeed("hwp");  // 실패해도 false 만
MNLazy.isLoaded("docx");          // 이미 실행됐는가
MNLazy.bundleLabel("pptx");       // 사용자에게 보일 로딩 문구
MNLazy.source("lodash");          // Worker에 넣을 내장 JS 소스`,
    note: 'BUNDLES 를 바꾸면 scripts.manifest.json 의 lazy vendor 목록도 함께 바꿔야 합니다 — check-source.js 가 양방향으로 검사합니다.',
  },
  {
    sectionIds: ['module-boundaries', 'history'],
    kind: 'API',
    title: 'MNEditHistory — 공용 되돌리기',
    source: 'src/js/history.js:30',
    file: 'src/js/history.js',
    line: 30,
    when: 'PDF·표·이미지·화이트보드·파이썬·노트북·메모 편집기가 되돌리기를 붙일 때',
    tags: ['소비자 7개', 'create()', 'commit()', 'undo()', 'redo()'],
    snippet: `const history = MNEditHistory.create({
  capture,          // 현재 상태 스냅샷 (필수)
  apply,            // 스냅샷을 화면에 되돌리기 (필수)
  isEqual,          // 두 스냅샷이 같은가 (필수 — 없으면 undo 가 조용히 깨진다)
  limit: 40,        // 종류별 상한: text 300 board 140 image/pdf 50 sheet 40 notebook 24
  onChange,         // undo/redo 버튼 상태 갱신
});
// 편집을 마친 "뒤에" commit — entries[index] 는 항상 현재 화면과 같다`,
    note: 'isEqual 을 옵션이 아니라 필수 인자로 받습니다. 없으면 undo 가 방금 만든 같은 상태로 되돌아가 아무 일도 하지 않는, 조용히 깨지는 버그가 납니다.',
  },
  {
    sectionIds: ['module-boundaries', 'office-replace'],
    kind: 'API',
    title: 'MNOfficeReplace — Word·PPT 찾아 바꾸기 코어',
    source: 'src/js/office-replace.js:806',
    file: 'src/js/office-replace.js',
    line: 806,
    when: 'docx-editor 의 문단 편집과 batch-replace 의 여러 파일 치환',
    tags: ['소비자 2개', 'read()', 'compute()', 'build()', 'officeParagraphEditPlan()', 'officePartRole()'],
    snippet: `const raw   = await MNOfficeReplace.read(file, "docx", opts);   // zip 을 한 번만 푼다
const plan  = MNOfficeReplace.compute(raw, matcher, replacement, opts); // 찾을 말이 바뀔 때마다
const bytes = await MNOfficeReplace.build(original, plan.newXmlByPath); // 바꾼 파트만 교체

// 문단 편집은 화면(docx-editor.js)이 아니라 이 순수 함수가 계획을 만든다
MNOfficeReplace.officeParagraphEditPlan(xml, rows);`,
    note: 'Word 와 PowerPoint 의 유일한 차이는 officePartRole 표뿐입니다. 두 형식의 <w:p>/<w:r>/<w:t> 와 <a:p>/<a:r>/<a:t> 구조가 같기 때문입니다.',
  },
  {
    sectionIds: ['module-boundaries', 'data-convert'],
    kind: 'API',
    title: 'MNDataConvert — 형식 변환 코어',
    source: 'src/js/data-convert.js',
    file: 'src/js/data-convert.js',
    line: 1,
    when: 'table-export 의 CSV 인용, data-convert-ui 의 모든 변환',
    tags: ['소비자 2개', 'DOM 미사용', 'setYaml()', '손실 리포트'],
    snippet: `// 8개 형식 ⇄ 중간 표현(Value 트리 / Table 표) ⇄ 8개 형식
// JSON JSONL YAML XML CSV TSV 마크다운표 HTML표
MNDataConvert.setYaml(jsYaml);   // YAML 만 외부 라이브러리를 주입받는다
// XML·HTML 은 자체 토크나이저 — DOMParser 를 쓰지 않아 node --test 에서 그대로 검증된다`,
    note: '타입을 추론하면서 원문 raw 를 함께 보존하고, 왕복 재검사로 손실 리포트를 만듭니다. 추론이 틀려도 되돌릴 수 있습니다.',
  },
  {
    sectionIds: ['module-boundaries', 'table-export'],
    kind: 'API',
    title: 'MNTableExport — 표 꺼내기',
    source: 'src/js/table-export.js',
    file: 'src/js/table-export.js',
    line: 1,
    when: 'scratchpad·mnote 의 표 블록, data-convert-ui 의 내보내기',
    tags: ['소비자 3개', 'TSV 복사', 'CSV 저장', '표 편집기', '변환 창'],
    snippet: `// CSV 저장은 saveTextDoc 에 문서를 넘기지 않는다(=null)
// → 메모·문서의 "수정됨" 상태를 건드리지 않는다
// 인용 규칙 자체는 MNDataConvert 에 위임`,
    note: '표를 내보냈다고 원본 메모가 저장 대상이 되면 안 된다는 미묘한 규칙을 지킵니다.',
  },
  {
    sectionIds: ['module-boundaries', 'spellcheck'],
    kind: 'API',
    title: 'MNKoreanSpellcheck — 오프라인 맞춤법',
    source: 'src/js/spellcheck.js',
    file: 'src/js/spellcheck.js',
    line: 1,
    when: '코드 뷰어·노트북 셀·임시 메모·블록 문서에서 맞춤법 검사를 열 때',
    tags: ['소비자 4개', '규칙 엔진', 'hunspell 워커(3MB, 지연)', '45초 타임아웃'],
    snippet: `// 문서 종류별 검사 범위
//   일반 문서 → 전체 글
//   마크다운  → 코드 구간 제외
//   코드 파일 → 주석·문자열만
// 사전 워커는 첫 검사 때 MNLazy 로 로드, 45초 안에 못 받으면 규칙 검사 결과만 사용`,
    note: '외부 API 를 쓰지 않습니다. 학생 문서가 밖으로 나가지 않는다는 앱의 기본 원칙과 일관됩니다.',
  },
  {
    sectionIds: ['module-boundaries', 'search-history'],
    kind: 'API',
    title: 'MNSearchHistory — 최근 검색어',
    source: 'src/js/search-history.js',
    file: 'src/js/search-history.js',
    line: 1,
    when: '통합검색·편집기·PDF·노트북·표·일괄바꾸기의 찾기 창을 열 때',
    tags: ['소비자 7개', '구획별 12개', '옵션 기억'],
    snippet: `// 기록 시점: Enter·다음/이전·바꾸기 — 실제로 검색을 쓴 순간만
// 기록하지 않음: '바꿀 내용'
// 자동채움 제외: 시트 찾기·바꿈, 여러 파일 찾아 바꾸기 (목록만 보여 준다)`,
    note: '대량 치환 화면에서만 자동채움을 끕니다. 편의 기능이 파괴적 동작과 만나는 지점을 구분했습니다.',
  },
  {
    sectionIds: ['module-boundaries', 'board-render'],
    kind: 'API',
    title: 'MNBoardRenderer — 벡터 렌더러',
    source: 'src/js/board-render.js',
    file: 'src/js/board-render.js',
    line: 1,
    when: '화이트보드가 그릴 때, 수업 리플레이가 기록을 재생할 때',
    tags: ['소비자 2개', '선택 판정', '이동 좌표'],
    snippet: `// 선·도형·텍스트·이미지 항목 배열 → 같은 그림
// 리플레이는 사용자 입력 없이 이 렌더러만으로 화면을 재현한다`,
    note: '렌더러를 화이트보드 UI 밖으로 뺀 덕분에 리플레이가 UI 를 흉내 내지 않아도 됩니다.',
  },
  {
    sectionIds: ['module-boundaries', 'recent-files'],
    kind: 'API',
    title: 'MNRecent — 최근 연 파일·폴더',
    source: 'src/js/recent-files.js',
    file: 'src/js/recent-files.js',
    line: 1,
    when: '시작 화면의 최근 목록, 파일을 열 때의 기록',
    tags: ['소비자 2개', 'FS 핸들 재사용', '권한 1회'],
    snippet: `// 목록은 localStorage, 핸들은 IndexedDB
// 다시 열 때 saveFsHandle·rememberFolderHandle 로 보관한 핸들을 찾아
// 권한 확인 한 번으로 원본 저장까지 이어 간다`,
    note: '경로 문자열만 저장했다면 다시 열 수 없습니다. 브라우저 앱에서 흔히 빠뜨리는 부분입니다.',
  },
  {
    sectionIds: ['module-boundaries', 'special-chars'],
    kind: 'API',
    title: 'MNSpecialChars — 특수문자 문자표',
    source: 'src/js/special-chars.js',
    file: 'src/js/special-chars.js',
    line: 1,
    when: '우클릭 → 특수문자, 또는 Ctrl+F10',
    tags: ['소비자 1개', '한자키 자모 대응', '최근 20개'],
    snippet: `// 브라우저에는 "ㅁ + 한자키" 입력이 오지 않는다.
// 한자키와 같은 자모별 묶음(ㄱ ㄴ ㄷ …)으로 보여 기존 습관을 그대로 쓰게 한다.
// Shift+클릭이면 닫지 않고 이어서 삽입`,
    note: 'contenteditable 자리는 python-editor.js 의 attachEditableContextMenu 가 같은 메뉴를 띄웁니다.',
  },

  // ── EXE 로컬 서버 — 기동·상태 ────────────────────────

  {
    sectionIds: ['launcher-boot', 'launcher-security'],
    kind: 'GET',
    title: '/ping · /mem — 생존과 메모리',
    source: 'desktop/launcher.cs:1358',
    file: 'desktop/launcher.cs',
    line: 1358,
    when: '프런트가 로컬 서버 존재를 확인할 때, 메모리 사용을 볼 때',
    tags: ['토큰 불필요', '/ping', '/mem'],
    note: '/mem 은 자기 자신과 자식 프로세스(파이썬 커널·드라이버)의 메모리를 함께 측정합니다.',
  },
  {
    sectionIds: ['launcher-boot'],
    kind: 'GET',
    title: '/launcher-config · /reopen-app-mode — 앱 모드',
    source: 'desktop/launcher.cs:1562',
    file: 'desktop/launcher.cs',
    line: 1562,
    when: '설정 화면이 앱 모드 값을 읽거나, "지금 앱 모드로 열기"를 누를 때',
    tags: ['토큰 필요', 'GET/POST'],
    snippet: `// 앱 모드(--app 창) 값만은 localStorage 가 아니라 파일에 둔다.
// 브라우저가 앱 화면보다 먼저 실행되므로 런처가 기동 중 읽을 수 있어야 한다. 값은 "1"/"0"`,
    note: '설정 저장은 다음 실행 동작을 바꾸고 재열기는 브라우저 프로세스를 띄우므로 둘 다 토큰이 필요합니다.',
  },

  // ── EXE 로컬 서버 — 파일 ─────────────────────────────

  {
    sectionIds: ['launcher-save', 'code-viewer', 'runtime-shapes'],
    kind: 'POST',
    title: '/save-file — 실제 디스크에 쓰기',
    source: 'desktop/launcher.cs:1901',
    file: 'desktop/launcher.cs',
    line: 1901,
    when: '브라우저 권한 팝업 없이 저장 루트 아래에 파일을 쓸 때',
    tags: ['토큰 필요', 'X-Save-Path(퍼센트 인코딩)', '본문 = 내용'],
    snippet: `POST /save-file
X-Manneung-Token: <실행별 토큰>
X-Save-Path: src%2Fmain.py        // 저장 루트 기준 상대경로

<파일 내용>`,
    note: '경로는 헤더 문자열입니다. 경로 탈출 검증이 필수인 지점이고 tests/local-server-security.test.js 가 이를 다룹니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'POST',
    title: '/save-file-exists — 첫 저장 충돌 확인',
    source: 'desktop/launcher.cs:1879',
    file: 'desktop/launcher.cs',
    line: 1879,
    when: '새 문서를 처음 저장하기 전',
    tags: ['토큰 필요'],
    note: '저장 루트의 기존 파일과 겹치는지 미리 확인해 덮어쓰기를 막습니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'GET',
    title: '/save-root · /choose-save-folder — 저장 루트',
    source: 'desktop/launcher.cs:1621',
    file: 'desktop/launcher.cs',
    line: 1621,
    when: '설정에서 자동 저장 폴더를 보거나 바꿀 때',
    tags: ['토큰 필요', '기본값: 내 문서\\만능교실'],
    note: '폴더 선택창은 버튼을 누른 브라우저 창을 소유자로 지정해 뒤에 숨지 않게 합니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'POST',
    title: '/open-save-folder · /open-file-folder — 탐색기 열기',
    source: 'desktop/launcher.cs:1630',
    file: 'desktop/launcher.cs',
    line: 1630,
    when: '헤더의 "저장 폴더" 버튼',
    tags: ['토큰 필요', 'X-Save-Path'],
    note: '가능하면 방금 저장한 파일을 하이라이트하고, 없으면 상위 폴더 → 저장 루트 순으로 폴백합니다.',
  },
  {
    sectionIds: ['launcher-save', 'python-terminal'],
    kind: 'GET',
    title: '/source-folder-* — 드라이브 포함 절대경로',
    source: 'desktop/launcher.cs:1685',
    file: 'desktop/launcher.cs',
    line: 1685,
    when: '터미널 작업폴더를 실제 경로로 지정하거나 선택 루트 아래 파일을 읽을 때',
    tags: ['토큰 필요', '실행 중 발급 ID', 'capability/list/entry/file/remove'],
    note: '브라우저 API 가 숨기는 절대경로를 넘기되, 선택한 루트 밖에는 닿지 못하도록 실행 중 발급한 ID 로만 후속 요청을 받습니다.',
  },
  {
    sectionIds: ['launcher-save', 'image-memo'],
    kind: 'GET',
    title: '/image-memo-* — 캡처 이미지 메모',
    source: 'desktop/launcher.cs:1834',
    file: 'desktop/launcher.cs',
    line: 1834,
    when: '캡처 이미지를 자동 저장·조회·삭제할 때',
    tags: ['토큰 필요', 'list/file/delete'],
    note: 'EXE 가 없으면 브라우저 임시 저장 후 복구로 폴백합니다.',
  },

  // ── EXE 로컬 서버 — 작업공간 ─────────────────────────

  {
    sectionIds: ['launcher-save', 'workspace-store'],
    kind: 'GET',
    title: '/workspace-load · /workspace-save · /workspace-clear',
    source: 'desktop/launcher.cs:1286',
    file: 'desktop/launcher.cs',
    line: 1286,
    when: '재실행 시 파일·폴더·탭 상태를 복원하거나 저장할 때',
    tags: ['토큰 필요', 'replace 파라미터', '동일 포맷을 IndexedDB 와 공유'],
    note: '프런트는 저장·삭제를 Promise 큐로 직렬화합니다. 여러 탭을 동시에 닫을 때의 경합을 막습니다.',
  },
  {
    sectionIds: ['launcher-boot', 'state-sync'],
    kind: 'POST',
    title: '/app-state — 포트 무관 설정 저장소',
    source: 'desktop/launcher.cs:1340',
    file: 'desktop/launcher.cs',
    line: 1340,
    when: 'localStorage 가 바뀔 때(디바운스), 창을 닫기 직전',
    tags: ['토큰 필요', 'app-state.json'],
    snippet: `// localStorage 는 origin(127.0.0.1:포트)별로 갈린다.
// 런처가 다른 포트로 떠도 테마·자동복원·탭 순서가 초기화되지 않도록
// 서버측 JSON 스냅샷을 원본으로 삼는다.`,
    note: '시작 시 동기 XHR 로 먼저 받아 localStorage 를 채웁니다 — theme.js 가 읽기 전이어야 깜빡임이 없습니다.',
  },

  // ── EXE 로컬 서버 — JavaScript npm ───────────────────

  {
    sectionIds: ['launcher-js-npm', 'js-libraries', 'launcher-security'],
    kind: 'GET/POST',
    title: '/js-npm-* — 사용자 패키지 설치·번들 캐시',
    source: 'desktop/launcher.cs:2059',
    file: 'desktop/launcher.cs',
    line: 2059,
    when: 'JavaScript 실행 바에서 npm 패키지를 설치·조회·삭제하거나 완성된 Worker 번들을 받을 때',
    tags: ['토큰 필요', '확인 헤더 필요', 'install-start/poll/cancel', 'list/remove', 'bundle/status'],
    snippet: `POST /js-npm-install-start   // 이름·버전을 확인한 뒤 작업 시작
GET  /js-npm-install-poll    // 오프셋 기준 로그·상태
POST /js-npm-install-cancel  // 실행 중 npm/esbuild 중단
GET  /js-npm-list            // 캐시된 정확 버전 목록
POST /js-npm-remove          // 캐시·번들 삭제
GET  /js-npm-bundle          // Worker 앞에서 평가할 IIFE
GET  /js-npm-status          // Node/npm/esbuild 사용 가능 여부`,
    note: '설치 스크립트는 --ignore-scripts 로 차단하지만 패키지 본문은 Worker 안에서 실제 실행됩니다. 신뢰 여부와 250MB 사후 검사 시점은 별도 위험 경계입니다.',
  },

  // ── EXE 로컬 서버 — Python ───────────────────────────

  {
    sectionIds: ['launcher-python', 'python-runtime'],
    kind: 'GET',
    title: '/can-run-python · /python-diagnostics · /python-rescan',
    source: 'desktop/launcher.cs:1446',
    file: 'desktop/launcher.cs',
    line: 1446,
    when: '편집기를 열 때 로컬 실행/Pyodide 분기를 미리 정하려고',
    tags: ['/can-run-python 토큰 불필요', '/python-rescan 토큰 필요'],
    note: '/python-rescan 은 파이썬을 새로 설치한 사용자가 exe 를 껐다 켜지 않아도 되도록 캐시를 비우고 다시 찾습니다.',
  },
  {
    sectionIds: ['launcher-python', 'python-runtime'],
    kind: 'POST',
    title: '/run-python · /run-python-bundle — 실행',
    source: 'desktop/launcher.cs:2298',
    file: 'desktop/launcher.cs',
    line: 2298,
    when: '실행 버튼, 채점, 진단, 단계 실행',
    tags: ['토큰 필요', '작업폴더 생성', '출력 상한 4MB', '결과 JSON 구간 6MB'],
    snippet: `// bundle 경로는 옆 파일까지 포함한 작업폴더를 %TEMP% 에 만든다.
// 지난 실행이 남긴 고아 폴더는 다음 기동 때 별도 스레드가 청소한다.`,
    note: '임의의 Python 코드를 로컬에서 실행하는 엔드포인트입니다. 토큰이 유일한 경계입니다.',
  },
  {
    sectionIds: ['launcher-python'],
    kind: 'GET',
    title: '/python-session-poll · /python-session-file — 증분 폴링',
    source: 'desktop/launcher.cs:2222',
    file: 'desktop/launcher.cs',
    line: 2222,
    when: '실행 중 출력을 흘려 받을 때, 실행이 만든 파일을 회수할 때',
    tags: ['토큰 필요', '오프셋 기준 증분'],
    note: '폴링마다 누적 출력 전체(최대 1MB+)를 복사·전송하지 않기 위한 구조입니다.',
  },
  {
    sectionIds: ['launcher-python'],
    kind: 'POST',
    title: '/pip-install-start · /pip-install-poll — 패키지 설치',
    source: 'desktop/launcher.cs:2116',
    file: 'desktop/launcher.cs',
    line: 2116,
    when: '없는 패키지를 설치할 때',
    tags: ['토큰 필요', 'PipJob', '진행률 증분'],
    note: '파이썬 세션과 같은 방식으로 버퍼에 흘려 담고 프런트가 증분만 받아 갑니다.',
  },
  {
    sectionIds: ['launcher-python', 'python-editor'],
    kind: 'POST',
    title: '/complete · /definition — Jedi 자동완성·정의 이동',
    source: 'desktop/launcher.cs:1976',
    file: 'desktop/launcher.cs',
    line: 1976,
    when: '편집기에서 자동완성을 띄우거나 정의로 이동할 때',
    tags: ['토큰 필요', '/can-complete 로 사전 확인'],
    note: 'Jedi 가 없으면 1회 설치를 시도합니다. 프런트는 편집기 시작 시 백그라운드로 /can-complete 를 부릅니다.',
  },
  {
    sectionIds: ['launcher-terminal-kernel', 'notebook-tools'],
    kind: 'POST',
    title: '/python-kernel-start-bundle · /python-kernel-file',
    source: 'desktop/launcher.cs:2149',
    file: 'desktop/launcher.cs',
    line: 2149,
    when: '노트북 셀을 같은 전역 공간에서 이어 실행할 때',
    tags: ['토큰 필요', '셀 10분 제한', 'python_kernel.py'],
    note: '지속형 프로세스라 일반 실행의 WaitForExit 제한을 타지 않습니다. 그래서 셀 단위로 별도 제한을 겁니다.',
  },
  {
    sectionIds: ['launcher-terminal-kernel', 'python-terminal'],
    kind: 'POST',
    title: '/terminal-session-open · /terminal-complete',
    source: 'desktop/launcher.cs:2236',
    file: 'desktop/launcher.cs',
    line: 2236,
    when: '지속형 PowerShell 터미널을 열고 명령을 보낼 때',
    tags: ['토큰 필요', '앱 전체에 하나', 'Set-Location 자동 이동'],
    note: '이 앱에서 가장 강력한 기능입니다. 토큰 검증이 이 경로에서 빠지면 피해가 가장 큽니다.',
  },

  // ── EXE 로컬 서버 — 변환·DB ──────────────────────────

  {
    sectionIds: ['launcher-convert-sqlite', 'pptx-viewer'],
    kind: 'POST',
    title: '/convert-pptx — PowerPoint 정확 변환',
    source: 'desktop/launcher.cs:1318',
    file: 'desktop/launcher.cs',
    line: 1318,
    when: 'PPTX 를 열 때, 설치된 PowerPoint 가 있으면',
    tags: ['토큰 필요', '/can-convert 로 사전 확인'],
    note: '실패하거나 EXE 가 없으면 pptx-viewer.js 의 근사 미리보기로 폴백합니다. 같은 파일이 환경에 따라 다르게 보입니다.',
  },
  {
    sectionIds: ['launcher-convert-sqlite', 'video-viewer'],
    kind: 'POST',
    title: '/convert-media · /install-ffmpeg',
    source: 'desktop/launcher.cs:1394',
    file: 'desktop/launcher.cs',
    line: 1394,
    when: '브라우저가 못 여는 영상(mkv·avi·wmv·flv)을 MP4 로 바꿀 때',
    tags: ['토큰 필요', '/can-convert-media', '/ffmpeg-install-status'],
    note: 'ffmpeg 는 필요할 때 설치하는 방식이라 첫 변환에 네트워크가 필요합니다.',
  },
  {
    sectionIds: ['launcher-convert-sqlite', 'viewer-base'],
    kind: 'POST',
    title: '/sqlite-preview · /sqlite-disk-preview · /sqlite-exec',
    source: 'desktop/launcher.cs:1466',
    file: 'desktop/launcher.cs',
    line: 1466,
    when: 'DB 파일을 미리 보거나 임의 SQL 을 실행할 때',
    tags: ['토큰 필요', 'X-Db-Path', 'SHA-256 일치 필요', '.bak 백업'],
    snippet: `// 최초 편집 활성화 조건:
//   브라우저가 연 파일의 SHA-256 == 디스크 파일의 SHA-256
// 이후 새로고침은 이미 확인된 같은 상대경로를 다시 읽는다.
// 수정 계열 SQL 은 단일 트랜잭션 + 같은 폴더에 .bak 백업`,
    note: '경로만 믿지 않고 내용 해시로 동일성을 확인합니다. 임의 SQL 을 여는 기능에서 최소한의 안전 조건입니다.',
  },

  // ── EXE 로컬 서버 — 시험지 ───────────────────────────

  {
    sectionIds: ['launcher-exam-lan', 'exam-paper'],
    kind: 'POST',
    title: '/exam-receive-start · /exam-receive-stop · /exam-receive-status',
    source: 'desktop/launcher.cs:1938',
    file: 'desktop/launcher.cs',
    line: 1938,
    when: '선생님이 교실 LAN 제출을 열고 닫고 접수 목록을 볼 때',
    tags: ['토큰 필요', '별도 리스너', '6자리 코드'],
    snippet: `// 앱 서버는 loopback 전용이라 다른 PC 가 접근할 수 없다.
// 교실 제출은 LAN 접근이 필요하므로 목적이 다른 리스너를 따로 연다.
// 학생 쪽: 주소 + 6자리 코드 → 실패하면 파일 제출로 폴백`,
    note: 'LAN 리스너는 loopback 이 아니므로 Host·Origin 검증이 그대로 적용되지 않습니다. 이 경로의 입력 검증은 별도로 봐야 합니다.',
  },
];
