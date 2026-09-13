// 계약 — ① 전역 스크립트가 서로를 부르는 창구(MN* 공개 API) ② EXE 로컬 서버 엔드포인트.
//
// ①은 scripts.manifest.json 의 moduleBoundaries 와 같은 목록이며, check-source.js 가
//   "선언이 실제로 있는가 / 소비자가 정말 쓰는가 / 소비자가 나중에 로드되는가"를 검사한다.
// ②는 desktop/launcher.cs 의 라우팅에서 뽑았다. 토큰 필요 여부는 RequiresLocalAuthToken 기준이다.
//
// ② 의 카드에는 endpoints 를 반드시 적는다. 화면에는 나오지 않고 생성 시 대조에만 쓰는 값으로,
// 그 카드가 launcher.cs 의 어느 경로를 맡는지 선언한다. 생성 스크립트가 양쪽으로 맞춰 본다 —
// 런처에 있는데 아무 카드도 안 맡은 경로, 카드가 적었는데 런처에 없는 경로, 두 카드가 겹쳐
// 맡은 경로를 각각 경고한다. 제목에 경로를 다 적지 못하는 카드(/source-folder-* 처럼)도
// endpoints 에는 빠짐없이 적어야 한다. 이 검사가 없던 동안 지도 엔드포인트 10개가 조용히
// 빠져 있었다.

window.MN_CONTRACTS = [
  // ── 전역 공개 API ────────────────────────────────────

  {
    sectionIds: ['module-boundaries', 'lazy'],
    kind: 'API',
    title: 'MNLazy — 지연 vendor 로더',
    source: 'src/js/lazy.js',
    file: 'src/js/lazy.js',
    at: "const bundleLabel = (name) => (BUNDLES[name] && BUNDLES[name].label) || name;",
    when: '무거운 vendor 라이브러리가 실제로 필요해지는 순간(그 형식을 열 때, 그 버튼을 누를 때)',
    tags: ['소비자 13개', 'need()', 'tryNeed()', 'isLoaded()', 'bundleLabel()', 'source()', 'BUNDLES'],
    snippet: `// 실행 묶음 14종: xterm spellcheck jszip zip xlsx yaml exceljs
//               hwp vexflow leaflet officeCrypt capture pptx docx
// Worker 전달용 4종: jsLodash jsDayjs jsPapaParse jsMath (source() 로만 씀)
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
    source: 'src/js/history.js',
    file: 'src/js/history.js',
    at: "function create(options){",
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
    source: 'src/js/office-replace.js',
    file: 'src/js/office-replace.js',
    at: "\"cs=\\\"\" + escaped + \"\\\"/>\");",
    below: 1,
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
    sectionIds: ['module-boundaries', 'music-audio', 'music-overview'],
    kind: 'API',
    title: 'MNMusicAudio — 악보 소리 엔진',
    source: 'src/js/music-audio.js',
    file: 'src/js/music-audio.js',
    at: "const MNMusicAudio = (() => {",
    when: '악보에서 음표를 누를 때, ▶ 로 재생할 때, WAV 로 저장할 때',
    tags: ['소비자 1개', 'previewNote()', 'play()', 'stop()', 'renderWav()', '샘플 6종'],
    snippet: `MNMusicAudio.previewNote(note, timbre);            // 음표 클릭 미리듣기
await MNMusicAudio.play(sheet, { from, to, onNote, onEnd, countIn, metronome, loop });
MNMusicAudio.stop();
const blob = await MNMusicAudio.renderWav(sheet, { from, to });   // 같은 예약 함수를
                                  // OfflineAudioContext 에 태운다 → 들은 것과 같은 파일
// 25ms 마다 앞으로 200ms 안에 시작할 음만 AudioContext.currentTime 기준으로 예약한다.
// 재생 중 음표 강조는 오디오가 아니라 requestAnimationFrame 에서 한다.`,
    note:
      '실시간 재생과 WAV 저장이 scheduleInto 하나를 공유합니다. "들은 것과 다른 파일이 저장되는" 사고가 구조적으로 막힙니다. ' +
      '샘플 로드가 실패하면 합성음으로 내려앉고 onError 로 알립니다.',
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
  {
    sectionIds: ['module-boundaries', 'interaction-core'],
    kind: 'API',
    title: 'MNInteractionCore — 드래그·분할 판정',
    source: 'src/js/interaction-core.js',
    file: 'src/js/interaction-core.js',
    at: "const MNInteractionCore = (() => {",
    when: 'core.js 가 탭·파일 드롭을 받거나 참고 잠금 중 입력을 거를 때',
    tags: ['소비자 1개', 'tabDropSplitAction()', 'splitDropSideAtPoint()', 'captureDroppedFileItems()', 'studyReadonlyKeyAllowed()', 'INTERNAL_DRAG_MIME'],
    snippet: `// 판정만 돌려준다 — DOM 은 호출부가 바꾼다
MNInteractionCore.tabDropSplitAction(refId, workId, "reference", draggedId, mateId);
//  → "keep" | "swap" | "replace-reference" | "replace-work"
//  | "pin-with-mate" | "pin-only" | "mate-as-reference" | "pin-current"

// 안내선과 판정이 같은 비율을 쓰도록 splitRatio 를 넘긴다
MNInteractionCore.splitDropSideAtPoint(x, y, rect, stacked, 0.5); // "left"|"right"|"top"|"bottom"

// DataTransfer 는 이벤트가 끝나면 비므로 그 자리에서 붙잡는다
const { files, entries, handlePromises } = MNInteractionCore.captureDroppedFileItems(dt);

// 참고 잠금: 막을 것이 아니라 통과시킬 것만 나열
MNInteractionCore.studyReadonlyPointerAllowed("sheet-selection", "click"); // true
MNInteractionCore.studyReadonlyKeyAllowed({ key:"c", ctrlKey:true });      // true`,
    note: 'INTERNAL_DRAG_MIME 은 "application/x-classdock-internal-drag" 입니다. 내부 이동 표시를 심는 쪽과 읽는 쪽이 이 상수를 함께 써야 하며, 외부 파일(types 에 "Files")은 항상 내부 플래그보다 우선합니다.',
  },
  {
    sectionIds: ['module-boundaries', 'document-types'],
    kind: 'API',
    title: 'MNDocumentTypes — 파일 형식 레지스트리',
    source: 'src/js/document-types.js',
    file: 'src/js/document-types.js',
    at: "const MNDocumentTypes = (() => {",
    when: 'documents.js 가 사이드바 아이콘·분류를 정하거나 압축 안에서 열 수 있는지 볼 때',
    tags: ['소비자 1개', 'fileExtOf()', 'iconFor()', 'extCategory()', 'isHiddenFolderEntry()', 'ZIP_OPENABLE', 'CODE_EXTS'],
    snippet: `MNDocumentTypes.fileExtOf(".env.local");   // "env" — 점 파일도 확장자처럼
MNDocumentTypes.iconFor("pdf", name);      // "PDF" (모르는 형식은 앞 4글자 대문자)
MNDocumentTypes.extCategory(kind, name);   // "code"|"sheet"|"img"|"db"|"hwp"…
MNDocumentTypes.isHiddenFolderEntry(rel);  // .git·.venv 는 숨김, .env 는 예외

MNDocumentTypes.CODE_EXTS["go"];           // "c" — 주석 문법이 같은 것끼리 계열로 묶는다
MNDocumentTypes.ZIP_EXTRACT_CAP;           // 256MB (전체)
MNDocumentTypes.ZIP_ENTRY_CAP;             // 128MB (항목 하나)`,
    note: 'TEXT_ENCODING_EXTS 와 ZIP_OPENABLE 은 IIFE 실행 시점에 SUBTITLE_EXTS·VIDEO_EXTS·AUDIO_EXTS 를 펼쳐 굳힙니다. video-viewer.js 가 먼저 로드돼야 하며, 이 순서는 manifest 의 scriptDependencies 에 선언돼 check-source.js 가 검사합니다.',
  },
  {
    sectionIds: ['module-boundaries', 'workspace-python'],
    kind: 'API',
    title: 'MNWorkspacePython — 작업공간 Python 색인',
    source: 'src/js/workspace-python.js',
    file: 'src/js/workspace-python.js',
    at: "const MNWorkspacePython = (() => {",
    when: 'code-viewer.js 가 .py 자동완성 후보·import 검사·정의 이동을 만들 때',
    tags: ['소비자 1개', 'workspacePythonImportCandidates()', 'workspacePythonImportDiagnostics()', 'workspacePythonModuleIndex()', 'scheduleWorkspacePythonPrewarm()'],
    snippet: `// 열지 않은 .py 까지 미리 읽어 둔다(완성 팝업은 동기라 그 자리서 디스크를 못 읽는다)
MNWorkspacePython.scheduleWorkspacePythonPrewarm(ownerDoc, onReady);
await MNWorkspacePython.workspacePythonPrewarmReady(ownerDoc);

MNWorkspacePython.workspacePythonImportCandidates(ownerDoc);   // 자동 import 후보
MNWorkspacePython.workspacePythonProjectRoot(ownerDoc);        // sys.path 루트 추정값

// 아직 못 읽은 .py 가 하나라도 있으면 빈 결과 — 틀린 경고를 내지 않는다
MNWorkspacePython.workspacePythonImportDiagnostics(ownerDoc, source, onReady);`,
    note: '읽기 예산은 파일당 512KB · 한 번에 400개입니다. 못 읽은 파일은 빈 본문으로 캐시에 박아 재시도를 막되 workspacePyUnreadable 에 따로 표시해, 내용이 빈 __init__.py 와 구분합니다. 파일이 바뀌면 stamp(크기:수정시각)가 달라져 자동으로 다시 읽습니다.',
  },
  {
    sectionIds: ['module-boundaries', 'spreadsheet-formula'],
    kind: 'API',
    title: 'MNSpreadsheetFormula — 수식 엔진',
    source: 'src/js/spreadsheet-formula.js',
    file: 'src/js/spreadsheet-formula.js',
    at: "const MNSpreadsheetFormula = (() => {",
    when: 'spreadsheet-viewer.js 가 셀을 계산하거나, 행·열 편집으로 참조를 옮길 때',
    tags: ['소비자 1개', '함수 74개', 'parseFormula()', 'evaluateAst()', 'remapFormulaRefs()', 'spreadsheetTextSeries()', 'SPREADSHEET_FN_HELP'],
    snippet: `// 셀 값은 resolver 가 돌려준다 — 엔진은 모델을 모른다
const ast = MNSpreadsheetFormula.parseFormula("=SUM(A1:A9)/COUNT(A1:A9)");
const value = MNSpreadsheetFormula.evaluateAst(ast, resolver);

// 오류는 던지지 않고 값으로 흐른다
MNSpreadsheetFormula.isFormulaError(value);   // { __err:"#DIV/0!" }

// 행·열 삽입·삭제·정렬로 셀이 옮겨갈 때 참조를 따라가게 한다
MNSpreadsheetFormula.remapFormulaRefs(f, (c, r, { colAbs, rowAbs }) => ({ c, r:r+1 }));
//  $ 절대표기는 보존, transform 이 null 이면 #REF!

MNSpreadsheetFormula.formulaTypingContext(text, caret); // { type:"name"|"args", … }
MNSpreadsheetFormula.spreadsheetAutoFormulaJobs(model, b, "SUM"); // 자동합계 Σ`,
    note: 'DOM 의존이 전혀 없어 spreadsheet-viewer.js 를 띄우지 않고 단위 테스트할 수 있습니다. MOD 의 나머지 부호를 나눌 수 쪽에 맞추고 INT 를 음의 무한대로 내리는 등 엑셀 규약을 따르므로, 자바스크립트 기본 동작으로 "정리" 하면 호환이 깨집니다.',
  },

  {
    sectionIds: ['module-boundaries', 'board-tools'],
    kind: 'API',
    title: 'MNBoardTools — 화이트보드 수학·과학 계산',
    source: 'src/js/board-tools.js',
    file: 'src/js/board-tools.js',
    at: "const MNBoardTools = (() => {",
    when: '칠판에 그래프·차트·표·교구·화학·확률·과학 계산을 넣거나 다시 고칠 때',
    tags: ['소비자 1개', '주제 15갈래', 'eval 없음', 'DOM 없음', 'Object.freeze'],
    snippet: `// 어느 함수도 DOM 을 만들지 않는다 — board-render.js 가 그리는 벡터 group 만 돌려준다.
// 그래서 저장·되돌리기·PNG/PDF·수업 리플레이가 전부 그대로 따라온다.
const ast = MNBoardTools.parseExpression("2x(x+1)");   // eval 없이 토큰→구문나무
MNBoardTools.plotGroup({ curves, xMin, xMax });        // 그래프 + 매개변수 슬라이더
MNBoardTools.chartGroup({ kind:"box", text });         // 막대·꺾은선·원·히스토그램·산점도·상자그림
MNBoardTools.balanceEquation("H2 + O2 -> H2O");        // 유리수 가우스 소거로 정수 계수
MNBoardTools.recognizeStroke(stroke, {});              // 펜 획 → 반듯한 도형
MNBoardTools.snapToRuler(p, ruler, band);              // 교구 기하 (1cm = 37.8px)
MNBoardTools.transformedItem(item, transform, measure);// 대칭·회전·평행이동·닮음`,
    note:
      'eval·new Function 을 쓰지 않은 것이 이 경계의 안전 조건입니다 — 학생이 적은 식이 .lesson 으로 저장돼 다른 PC 에서 다시 열리기 때문입니다. ' +
      '반대로 공개 이름이 60개를 넘어 "무엇이 경계이고 무엇이 내부 도우미인지"는 이 목록만으로 갈리지 않습니다.',
  },

  // ── EXE 로컬 서버 — 기동·상태 ────────────────────────

  {
    sectionIds: ['launcher-boot', 'launcher-security'],
    kind: 'GET',
    title: '/ping · /mem — 생존과 메모리',
    endpoints: ['/ping', '/mem', '/heartbeat', '/heartbeat-close'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (path == \"/ping\")",
    when: '프런트가 로컬 서버 존재를 확인할 때, 메모리 사용을 볼 때',
    tags: ['토큰 불필요', '/ping', '/mem'],
    note: '/mem 은 자기 자신과 자식 프로세스(파이썬 커널·드라이버)의 메모리를 함께 측정합니다.',
  },
  {
    sectionIds: ['launcher-boot'],
    kind: 'GET',
    title: '/launcher-config · /reopen-app-mode — 앱 모드',
    endpoints: ['/launcher-config', '/reopen-app-mode'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/launcher-config\")",
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
    endpoints: ['/save-file', '/can-save-file'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/save-file\")",
    when: '브라우저 권한 팝업 없이 저장 루트 아래에 파일을 쓸 때',
    tags: ['토큰 필요', 'X-Save-Path(퍼센트 인코딩)', '본문 = 내용'],
    snippet: `POST /save-file
X-ClassDock-Token: <실행별 토큰>
X-Save-Path: src%2Fmain.py        // 저장 루트 기준 상대경로

<파일 내용>`,
    note: '경로는 헤더 문자열입니다. 경로 탈출 검증이 필수인 지점이고 tests/local-server-security.test.js 가 이를 다룹니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'POST',
    title: '/save-file-exists — 첫 저장 충돌 확인',
    endpoints: ['/save-file-exists'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/save-file-exists\")",
    when: '새 문서를 처음 저장하기 전',
    tags: ['토큰 필요'],
    note: '저장 루트의 기존 파일과 겹치는지 미리 확인해 덮어쓰기를 막습니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'GET',
    title: '/save-root · /choose-save-folder — 저장 루트',
    endpoints: ['/save-root', '/choose-save-folder', '/choose-save-folder-status'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/save-root\")",
    when: '설정에서 자동 저장 폴더를 보거나 바꿀 때',
    tags: ['토큰 필요', '기본값: 내 문서\\ClassDock'],
    note: '폴더 선택창은 버튼을 누른 브라우저 창을 소유자로 지정해 뒤에 숨지 않게 합니다.',
  },
  {
    sectionIds: ['launcher-save'],
    kind: 'POST',
    title: '/open-save-folder · /open-file-folder — 탐색기 열기',
    endpoints: ['/open-save-folder', '/open-file-folder'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/open-save-folder\")",
    when: '헤더의 "저장 폴더" 버튼',
    tags: ['토큰 필요', 'X-Save-Path'],
    note: '가능하면 방금 저장한 파일을 하이라이트하고, 없으면 상위 폴더 → 저장 루트 순으로 폴백합니다.',
  },
  {
    sectionIds: ['launcher-save', 'python-terminal'],
    kind: 'GET',
    title: '/source-folder-* — 드라이브 포함 절대경로',
    endpoints: [
      '/source-folder-capability', '/source-folder-directory', '/source-folder-entry', '/source-folder-file',
      '/source-folder-list', '/source-folder-remove', '/source-folder-restore', '/choose-source-folder',
      '/choose-source-folder-status', '/local-file',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/source-folder-entry?\", StringComparison.Ordinal))",
    when: '터미널 작업폴더를 실제 경로로 지정하거나 선택 루트 아래 파일을 읽을 때',
    tags: ['토큰 필요', '실행 중 발급 ID', 'capability/list/entry/file/remove'],
    note: '브라우저 API 가 숨기는 절대경로를 넘기되, 선택한 루트 밖에는 닿지 못하도록 실행 중 발급한 ID 로만 후속 요청을 받습니다.',
  },
  {
    sectionIds: ['launcher-save', 'image-memo'],
    kind: 'GET',
    title: '/image-memo-* — 캡처 이미지 메모',
    endpoints: ['/image-memo-list', '/image-memo-file', '/image-memo-delete'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/image-memo-list\")",
    when: '캡처 이미지를 자동 저장·조회·삭제할 때',
    tags: ['토큰 필요', 'list/file/delete'],
    note: 'EXE 가 없으면 브라우저 임시 저장 후 복구로 폴백합니다.',
  },

  // ── EXE 로컬 서버 — 작업공간 ─────────────────────────

  {
    sectionIds: ['launcher-save', 'workspace-store'],
    kind: 'GET',
    title: '/workspace-load · /workspace-save · /workspace-clear',
    endpoints: ['/workspace-load', '/workspace-save', '/workspace-clear', '/workspace-remove'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/workspace-save\", StringComparison.Ordinal))",
    when: '재실행 시 파일·폴더·탭 상태를 복원하거나 저장할 때',
    tags: ['토큰 필요', 'replace 파라미터', '동일 포맷을 IndexedDB 와 공유'],
    note: '프런트는 저장·삭제를 Promise 큐로 직렬화합니다. 여러 탭을 동시에 닫을 때의 경합을 막습니다.',
  },
  {
    sectionIds: ['launcher-boot', 'state-sync'],
    kind: 'POST',
    title: '/app-state — 포트 무관 설정 저장소',
    endpoints: ['/app-state'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/app-state\", StringComparison.Ordinal))",
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
    endpoints: [
      '/js-npm-', '/js-npm-status', '/js-npm-list', '/js-npm-bundle', '/js-npm-install-start',
      '/js-npm-install-poll', '/js-npm-install-cancel', '/js-npm-delete',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "WriteResponse(stream, \"200 OK\", \"application/json; charset=utf-8\", Encoding.UTF8.GetBytes(JsNpmStatus()));",
    below: 1,
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

  // ── EXE 로컬 서버 — Java ─────────────────────────────

  {
    sectionIds: ['launcher-java', 'java-overview', 'java-runtime'],
    kind: 'GET/POST',
    title: '/can-run-java · /java-diagnostics · /java-rescan · /java-install — JDK 찾기와 원클릭 설치',
    endpoints: ['/java-', '/can-run-java', '/java-diagnostics', '/java-rescan', '/java-install', '/java-install-status'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (path == \"/can-run-java\")",
    when: '▶ 를 눌렀는데 JDK 가 없을 때의 안내 화면, JDK 환경 창, 사용자가 직접 설치한 뒤의 "다시 검사"',
    tags: ['/can-run-java·/java-diagnostics·/java-install-status 토큰 불필요(GET)', '/java-rescan·/java-install 토큰 필요', 'Temurin 21 · SHA-256'],
    snippet: `GET  /can-run-java         → "yes" | "no"
GET  /java-diagnostics     → { 찾은 곳, 버전, minimum, 설치될 곳 }
POST /java-rescan          탐색 캐시를 비우고 다시 찾기 → 진단 JSON
POST /java-install         이미 있으면 "already", 아니면 "started"
GET  /java-install-status  → { state: metadata|downloading|verifying|extracting|done|error,
                              received, total, extracted, entries, version, error }`,
    note:
      '설치는 배포처 메타데이터에서 주소와 SHA-256 을 함께 받아 대조합니다 — 고정 리다이렉트 주소로 바로 받으면 "무엇을 받았는지" 확인할 방법이 없어서 한 번을 더 거칩니다. ' +
      '다만 jar·npm 설치와 달리 서버가 확인 헤더를 요구하지 않고 화면의 확인 창에 맡깁니다.',
  },
  {
    sectionIds: ['launcher-java', 'java-libraries'],
    kind: 'GET/POST',
    title: '/java-lib-* — jar 카탈로그·Maven Central 검색·설치·삭제',
    endpoints: [
      '/java-lib-', '/java-lib-catalog', '/java-lib-list', '/java-lib-search', '/java-lib-resolve', '/java-lib-members',
      '/java-lib-install-start', '/java-lib-install-poll', '/java-lib-install-cancel', '/java-lib-delete',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/java-lib-catalog\")",
    when: '자바 실행 바의 라이브러리 창에서 목록을 보고, 검색하고, 설치·삭제할 때',
    tags: ['GET·POST 모두 토큰 필요', '설치 시작은 X-ClassDock-JavaLib-Confirm', '단일 jar · 실행당 20개'],
    snippet: `GET  /java-lib-catalog               검증된 기본 목록(설치 여부 포함)
GET  /java-lib-list                  이 PC 에 실제로 있는 jar 전부
GET  /java-lib-search?q=             Maven Central 이름 검색(고정 HTTPS 주소만)
GET  /java-lib-resolve?group=&artifact=  최신 버전·의존성 개수 확인
GET  /java-lib-members?spec=         javap 멤버 표(처음 한 번만 돌리고 캐시)
POST /java-lib-install-start  본문: id 또는 group:artifact:version → { id }
GET  /java-lib-install-poll?id=&from=  증분 로그
POST /java-lib-install-cancel?id=  ·  POST /java-lib-delete?id=`,
    note:
      '프런트가 보내는 것은 id·좌표뿐이고 URL·경로는 서버가 조립합니다. 카탈로그에 SHA-256 이 있으면 변조까지, 직접 좌표는 배포처 .sha1 로 깨짐까지만 거릅니다 — ' +
      '그 차이를 설치 로그에 SHA-256 을 남겨 "카탈로그로 옮겨 적으라" 는 안내로 메웁니다.',
  },
  {
    sectionIds: ['launcher-java', 'java-runtime', 'java-editor'],
    kind: 'GET/POST',
    title: '/java-session-* — 컴파일·대화형 실행·채점',
    endpoints: ['/java-session-start', '/java-session-poll', '/java-session-input', '/java-session-eof', '/java-session-stop'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/java-session-start\", StringComparison.Ordinal))",
    when: '▶ 실행, 채점, JUnit 실행',
    tags: ['토큰 필요', '실행 30분 · 컴파일 30초', 'JDK 없으면 501 no-java'],
    snippet: `POST /java-session-start?libs=&lint=1&main=&junit=1&piped=1
     본문: [길이][소스][길이][표준입력] + [개수]([길이][형제 소스])*
     → { id }   (라이브러리를 못 찾으면 프로세스 없는 완료 세션으로 이유를 담아 돌려줌)
GET  /java-session-poll?id=&so=&se=   이미 받은 길이 이후 증분(그대로면 unchanged)
POST /java-session-input?id=          한 줄 입력(터미널처럼 에코)
POST /java-session-eof?id=  ·  POST /java-session-stop?id=`,
    note:
      'piped=1(채점)은 입력을 한 번에 흘리고 닫고, 대화형은 /java-session-input 이 stdout 에 에코를 남깁니다. 두 길을 섞으면 에코 때문에 채점의 출력 비교가 어긋나므로 쿼리로 나눴습니다.',
  },
  {
    sectionIds: ['launcher-java', 'java-runtime', 'java-editor'],
    kind: 'POST',
    title: '/java-check · /java-definition — 저장 검사와 표준 클래스 원문',
    endpoints: ['/java-check', '/java-definition'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/java-check\", StringComparison.Ordinal))",
    when: '저장(또는 설정을 켠 자동 저장) 직후의 javac 검사, 표준 클래스 이름을 Ctrl+클릭할 때',
    tags: ['토큰 필요', '세션을 남기지 않음', 'src.zip 원문 5MB 이하'],
    snippet: `POST /java-check?libs=&lint=1   본문: 실행과 같은 봉투
     → { ok, output, mainClass }  |  { ok:true, skipped:"libs" }  (jar 가 없으면 검사를 건너뜀)
POST /java-definition           본문: { "qualified": "java.util.List" }
     → { ok, qualified, name, fileName, entry, line, column, source }`,
    note:
      '저장 검사는 실행과 같은 CompileJavaSource 를 써서 "검사를 통과한 코드는 실행에서도 컴파일을 지난다" 를 보장하고, 폴링·세션 보관 없이 임시 폴더를 바로 지웁니다. ' +
      '/java-definition 은 완전 이름을 식별자 정규식으로 검사하고 JDK 의 src.zip 안에서만 찾으므로 임의 파일을 읽는 통로가 되지 않습니다.',
  },

  // ── EXE 로컬 서버 — Python ───────────────────────────

  {
    sectionIds: ['launcher-python', 'python-runtime'],
    kind: 'GET',
    title: '/can-run-python · /python-diagnostics · /python-rescan',
    endpoints: ['/can-run-python', '/python-diagnostics', '/python-rescan'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (path == \"/can-run-python\")",
    when: '편집기를 열 때 로컬 실행/Pyodide 분기를 미리 정하려고',
    tags: ['/can-run-python 토큰 불필요', '/python-rescan 토큰 필요'],
    note: '/python-rescan 은 파이썬을 새로 설치한 사용자가 exe 를 껐다 켜지 않아도 되도록 캐시를 비우고 다시 찾습니다.',
  },
  {
    sectionIds: ['launcher-python', 'python-runtime'],
    kind: 'POST',
    title: '/run-python · /run-python-bundle — 실행',
    endpoints: ['/run-python', '/run-python-bundle'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/run-python\")",
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
    endpoints: [
      '/python-session-', '/python-session-poll', '/python-session-file', '/python-session-input',
      '/python-session-start', '/python-session-start-bundle', '/python-session-stop',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/python-session-poll\", StringComparison.Ordinal))",
    when: '실행 중 출력을 흘려 받을 때, 실행이 만든 파일을 회수할 때',
    tags: ['토큰 필요', '오프셋 기준 증분'],
    note: '폴링마다 누적 출력 전체(최대 1MB+)를 복사·전송하지 않기 위한 구조입니다.',
  },
  {
    sectionIds: ['launcher-python'],
    kind: 'POST',
    title: '/pip-install-start · /pip-install-poll — 패키지 설치',
    endpoints: ['/pip-install', '/pip-install-start', '/pip-install-poll', '/pip-install-cancel'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/pip-install-start\")",
    when: '없는 패키지를 설치할 때',
    tags: ['토큰 필요', 'PipJob', '진행률 증분'],
    note: '파이썬 세션과 같은 방식으로 버퍼에 흘려 담고 프런트가 증분만 받아 갑니다.',
  },
  {
    sectionIds: ['launcher-python', 'python-editor'],
    kind: 'POST',
    title: '/complete · /definition — Jedi 자동완성·정의 이동',
    endpoints: ['/complete', '/definition', '/can-complete', '/python-import-index', '/python-project-sync'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/complete\")",
    when: '편집기에서 자동완성을 띄우거나 정의로 이동할 때',
    tags: ['토큰 필요', '/can-complete 로 사전 확인'],
    note: 'Jedi 가 없으면 1회 설치를 시도합니다. 프런트는 편집기 시작 시 백그라운드로 /can-complete 를 부릅니다.',
  },
  {
    sectionIds: ['launcher-terminal-kernel', 'notebook-tools'],
    kind: 'POST',
    title: '/python-kernel-start-bundle · /python-kernel-file',
    endpoints: [
      '/python-kernel-', '/python-kernel-start-bundle', '/python-kernel-file', '/python-kernel-exec',
      '/python-kernel-stop',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/python-kernel-start-bundle\")",
    when: '노트북 셀을 같은 전역 공간에서 이어 실행할 때',
    tags: ['토큰 필요', '셀 10분 제한', 'python_kernel.py'],
    note: '지속형 프로세스라 일반 실행의 WaitForExit 제한을 타지 않습니다. 그래서 셀 단위로 별도 제한을 겁니다.',
  },
  {
    sectionIds: ['launcher-terminal-kernel', 'python-terminal'],
    kind: 'POST',
    title: '/terminal-session-open · /terminal-complete',
    endpoints: [
      '/terminal-session-', '/terminal-session-open', '/terminal-session-poll', '/terminal-session-run',
      '/terminal-session-stop', '/terminal-complete',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/terminal-session-open\")",
    when: '지속형 PowerShell 터미널을 열고 명령을 보낼 때',
    tags: ['토큰 필요', '앱 전체에 하나', 'Set-Location 자동 이동'],
    note: '이 앱에서 가장 강력한 기능입니다. 토큰 검증이 이 경로에서 빠지면 피해가 가장 큽니다.',
  },

  // ── EXE 로컬 서버 — 원격 터미널(SSH) ─────────────────

  {
    sectionIds: ['launcher-ssh', 'remote-terminal-overview', 'remote-terminal'],
    kind: 'GET',
    title: '/ssh-capability · /ssh-host-key-scan · /ssh-host-key-trust — 붙기 전에',
    endpoints: ['/ssh-', '/ssh-capability', '/ssh-host-key-scan', '/ssh-host-key-trust'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/ssh-capability\")",
    when: '원격 터미널 패널을 열 때(능력 확인) · 처음 보는 서버에 붙기 전(지문 확인)',
    tags: ['토큰 필요', 'Windows OpenSSH', 'SHA-256 지문', 'known_hosts 전용 파일'],
    snippet: `GET  /ssh-capability     → {"available":bool,"client":"Windows OpenSSH","reason":"…"}
POST /ssh-host-key-scan  ← [host, port]            → {"algorithm","key","fingerprint"}
POST /ssh-host-key-trust ← [host, port, algo, key, replace]

// 본문은 JSON 이 아니라 "4바이트 길이(LE) + UTF-8 바이트" 를 이어 붙인 묶음이다.
// 비밀번호에 어떤 바이트든 들어올 수 있어 이스케이프 계층을 하나 줄였다.`,
    note:
      '지문은 사용자가 관리자에게 받은 값과 맞춰 본 뒤에만 저장됩니다. 저장된 키와 다른 키가 오면 replace 없이는 ' +
      'ssh-host-key-changed 로 409 를 돌려줍니다. known_hosts 는 <LocalAppData>/ClassDock/ssh 에 따로 두어 ' +
      '사용자가 평소 쓰는 OpenSSH 설정과 섞이지 않습니다.',
  },
  {
    sectionIds: ['launcher-ssh', 'remote-terminal-overview', 'remote-terminal'],
    kind: 'POST',
    title: '/ssh-session-* — 원격 PTY 세션',
    endpoints: ['/ssh-session-open', '/ssh-session-input', '/ssh-session-poll', '/ssh-session-resize', '/ssh-session-stop'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/ssh-session-open\")",
    when: 'SSH 로 붙어 명령을 주고받는 동안 — 열기·입력·출력 폴링·크기 변경·끊기',
    tags: ['토큰 필요', '동시 4세션', '출력 버퍼 4MB', '입력 256KB', 'ConPTY'],
    snippet: `POST /ssh-session-open              ← [host, port, user, password, cols, rows] → {"id",…}
POST /ssh-session-input?id=…        ← 입력 바이트 그대로
GET  /ssh-session-poll?id=…&offset=… → {"alive","complete","stopped","code","offset","reset","data"(base64)}
POST /ssh-session-resize?id=…       ← [cols, rows]
POST /ssh-session-stop?id=…`,
    note:
      '출력은 오프셋 기반 증분입니다. 버퍼 상한(4MB)을 넘겨 앞을 버리면 reset:true 를 함께 내려 화면이 잘렸음을 알 수 있습니다. ' +
      '비밀번호는 이 요청에서만 지나가고 런처는 디스크·명령행·환경변수 대신 일회성 named pipe 로 ssh.exe 에 건넵니다. ' +
      '실제 구현은 launcher.cs 가 아니라 desktop/ssh_terminal.cs 에 있습니다.',
  },
  {
    sectionIds: ['launcher-ssh', 'remote-terminal-overview', 'remote-terminal'],
    kind: 'POST',
    title: '/ssh-upload-* · /ssh-key-pick-* — 파일 올리기와 개인키 고르기',
    endpoints: [
      '/ssh-upload-start', '/ssh-upload-poll', '/ssh-upload-cancel',
      '/ssh-upload-pick', '/ssh-upload-pick-status',
      '/ssh-key-pick', '/ssh-key-pick-status',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/ssh-upload-start\")",
    when: '원격 터미널에서 로컬 파일을 서버로 올릴 때, 개인키 파일을 골라 붙을 때',
    tags: ['토큰 필요', '로컬 동작 헤더 필요', '증분 폴링', '탐색기 대화상자'],
    snippet: `POST /ssh-upload-pick          → 파일 고르기 창을 연다(비동기)
GET  /ssh-upload-pick-status   → 사용자가 고른 결과를 되묻는다
POST /ssh-upload-start         ← 올릴 파일과 원격 경로 → {"id",…}
GET  /ssh-upload-poll?id=…     → 진행률 증분
POST /ssh-upload-cancel?id=…

POST /ssh-key-pick             → 개인키 파일 고르기 창
GET  /ssh-key-pick-status      → 고른 결과`,
    note:
      '파일 고르기를 "열기 → 되묻기" 두 걸음으로 나눈 것은 저장 폴더 고르기(/choose-save-folder)가 먼저 쓴 방식입니다 — ' +
      '탐색기 대화상자는 사용자가 닫을 때까지 돌아오지 않으므로 요청을 붙잡아 둘 수 없습니다. ' +
      '창을 여는 쪽은 토큰만으로 부족하고 로컬 동작 헤더까지 요구합니다(HasLocalActionHeader) — ' +
      '다른 페이지가 몰래 파일 선택 창을 띄우는 것을 막기 위한 한 겹입니다. 올리기 진행률은 세션 출력과 같은 오프셋 증분 방식입니다.',
  },
  {
    sectionIds: ['launcher-ssh', 'remote-files-ui', 'remote-terminal-overview'],
    kind: 'POST',
    title: '/ssh-file-* — 원격 파일 미리보기와 다운로드',
    endpoints: ['/ssh-file-', '/ssh-file-job', '/ssh-file-content'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/ssh-file-\", StringComparison.Ordinal))",
    when: '원격 파일 패널에서 경로를 확인하고 미리 보고 내려받을 때',
    tags: ['토큰 필요', '로컬 동작 헤더 필요(POST)', '읽기 전용 SFTP v3', '요청 서명으로 재시도 묶음'],
    snippet: `POST /ssh-file-<op>        op: connect · inspect · preview · save-pick · download
                           cancel · release · disconnect
     ← 길이 접두 본문: 요청 id(16바이트 hex) + 인자 2~3개
GET  /ssh-file-job?id=…    진행 상태
GET  /ssh-file-content?id= 미리보기 바이트

// 같은 요청 id 로 다시 오면 서명(op + 인자)이 처음과 같을 때만 그 작업을 돌려준다.
// 다르면 거절 — 폴링 재시도가 다른 작업으로 바뀌지 않는다.
// PTY 를 붙이지 않은 별도 ssh 프로세스에서 SFTP subsystem 만 쓴다. 원격 셸 명령은 없다.`,
    note:
      'POST 는 실행별 토큰에 더해 X-ClassDock-Action: 1 을 요구하고 없으면 403 입니다 — 이 앱에서 토큰 위에 조건을 하나 더 얹은 드문 경로입니다. ' +
      'GET 두 개(/ssh-file-job · /ssh-file-content)는 접두사가 아니라 이름으로 토큰 목록에 적혀 있어, 새 GET 경로를 더할 때 이 목록을 함께 고쳐야 합니다. ' +
      '미리보기 캐시는 100MB 상한이고 화면에 바이트를 넘기면 즉시 해제합니다.',
  },

  // ── EXE 로컬 서버 — 변환·DB ──────────────────────────

  {
    sectionIds: ['launcher-convert-sqlite', 'pptx-viewer'],
    kind: 'POST',
    title: '/convert-pptx — PowerPoint 정확 변환',
    endpoints: ['/convert-pptx', '/can-convert'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/convert-pptx\")",
    when: 'PPTX 를 열 때, 설치된 PowerPoint 가 있으면',
    tags: ['토큰 필요', '/can-convert 로 사전 확인'],
    note: '실패하거나 EXE 가 없으면 pptx-viewer.js 의 근사 미리보기로 폴백합니다. 같은 파일이 환경에 따라 다르게 보입니다.',
  },
  {
    sectionIds: ['launcher-convert-sqlite', 'video-viewer'],
    kind: 'POST',
    title: '/convert-media · /install-ffmpeg',
    endpoints: ['/convert-media', '/can-convert-media', '/install-ffmpeg', '/ffmpeg-install-status'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (path == \"/can-convert-media\")",
    when: '브라우저가 못 여는 영상(mkv·avi·wmv·flv)을 MP4 로 바꿀 때',
    tags: ['토큰 필요', '/can-convert-media', '/ffmpeg-install-status'],
    note: 'ffmpeg 는 필요할 때 설치하는 방식이라 첫 변환에 네트워크가 필요합니다.',
  },
  {
    sectionIds: ['launcher-convert-sqlite', 'video-viewer'],
    kind: 'GET/POST',
    title: '/convert-media-path · /media-ticket · /media-stream — 경로 방식 변환과 Range 재생',
    endpoints: ['/convert-media-path', '/convert-media-job', '/convert-media-cancel', '/media-ticket', '/media-stream'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/media-stream?\", StringComparison.Ordinal))",
    when: 'EXE 로 연 폴더 안의 영상·오디오를 재생하거나, 브라우저가 못 여는 영상을 원본 옆 MP4 로 바꿀 때',
    tags: ['POST 는 토큰 필요', '/convert-media-job 조회도 토큰', '/media-stream 만 표로 연다', '표 12시간 · 최대 512개', '작업 최대 64개 · 한 번에 하나'],
    snippet: `POST /convert-media-path?id=&in=&out=&reencode=1   → { job }
     id = 원본 폴더 ID, in/out = 그 폴더 기준 상대 경로 (out 은 .mp4 만, in 과 같으면 거절)
GET  /convert-media-job?job=     → { state: queued|running|done|error|cancelled,
                                     stage: remux|copy|hardware|encode, percent, durationUs,
                                     doneUs, speedMilli, elapsedMs, name, error }
POST /convert-media-cancel?job=  ffmpeg 프로세스를 끊고 .part 를 지운다
POST /media-ticket?id=&path=     → { ticket }   파일이 실제로 열리는지 확인한 뒤 발급
GET  /media-stream?t=            200 / 206 Partial Content (Range), 표가 없거나 만료면 403`,
    note:
      '<video> 는 요청 헤더를 붙일 수 없어 토큰 대신 파일 하나에만 쓰는 표를 주소에 담습니다. 표는 원본 폴더 ID + 상대 경로만 들고 있어 새어도 그 폴더 밖은 못 엽니다. ' +
      '변환 결과가 이미 있으면 서버가 확인 없이 지우고 교체하므로, 덮어쓰기 판단은 지금 화면(일괄 변환만 존재 확인)에 달려 있습니다.',
  },
  {
    sectionIds: ['launcher-convert-sqlite', 'viewer-base'],
    kind: 'POST',
    title: '/sqlite-preview · /sqlite-disk-preview · /sqlite-exec',
    endpoints: ['/sqlite-preview', '/sqlite-disk-preview', '/sqlite-exec'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/sqlite-preview\")",
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
    endpoints: ['/exam-receive-start', '/exam-receive-stop', '/exam-receive-status', '/exam-hello'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path == \"/exam-receive-start\")",
    when: '선생님이 교실 LAN 제출을 열고 닫고 접수 목록을 볼 때',
    tags: ['토큰 필요', '별도 리스너', '6자리 코드'],
    snippet: `// 앱 서버는 loopback 전용이라 다른 PC 가 접근할 수 없다.
// 교실 제출은 LAN 접근이 필요하므로 목적이 다른 리스너를 따로 연다.
// 학생 쪽: 주소 + 6자리 코드 → 실패하면 파일 제출로 폴백`,
    note: 'LAN 리스너는 loopback 이 아니므로 Host·Origin 검증이 그대로 적용되지 않습니다. 이 경로의 입력 검증은 별도로 봐야 합니다.',
  },

  {
    sectionIds: ['module-boundaries', 'exchange-rate'],
    kind: 'API',
    title: 'MNExchangeRate — 환율 해석 코어',
    source: 'src/js/exchange-rate.js',
    file: 'src/js/exchange-rate.js',
    at: 'const MNExchangeRate = (function(){',
    when: '환율 창이 런처에서 받아 온 원본 JSON 을 표·계산에 쓸 모양으로 바꿀 때',
    tags: ['소비자 1개', 'DOM·fetch 없음', '출처 2종', '고시 단위 보존'],
    snippet: `// 런처는 받아만 오고 뜻풀이는 여기서 한다 — 런처가 둘(C#·Go)이라
// 파싱을 그쪽에 두면 같은 규칙을 두 언어로 두 번 적고 두 번 틀린다.
// 지도의 /geocode 가 먼저 쓴 방식이며 이것이 두 번째 적용이다.
MNExchangeRate.normalize(raw, "koreaexim");  // 매매기준율 + 송금 보낼 때·받을 때
MNExchangeRate.normalize(raw, "ecb");        // 유로 기준 교차환율, 송금 값 없음
// JPY(100) 처럼 고시 단위가 있는 통화는 고시값과 1단위값을 함께 들고 있다.
// 빈 칸·null 은 0원이 아니라 "값 없음" — Number("")===0 이 조용히 통과하는 자리다.`,
    note:
      '두 출처의 성질이 달라 표에 무엇을 보여 줄지가 갈립니다. 수출입은행은 영업일 11시 무렵 이후에만 그날 값이 있고, ' +
      'ECB 는 휴일이면 직전 영업일 값을 알아서 주지만 송금 값이 없습니다. 그 구분을 화면이 아니라 이 모듈이 합니다.',
  },
  {
    sectionIds: ['module-boundaries', 'music-eartest', 'music-overview'],
    kind: 'API',
    title: 'MNMusicEarTest — 음감 테스트',
    source: 'src/js/music-eartest.js',
    file: 'src/js/music-eartest.js',
    at: 'const MNMusicEarTest = (() => {',
    when: '악보 편집기에서 "소리만 듣고 음이름 맞히기" 연습을 열 때',
    tags: ['소비자 1개', 'create() 하나', '다시 듣기 1회', '문제 생성은 모델에'],
    snippet: `const ear = MNMusicEarTest.create(options);   // → { el, press(), answerOctave(), … }
// 편집기는 자리(el)만 내주고 입력은 두 문으로 넘긴다 —
// 자판·MIDI·도레미 버튼 세 갈래를 편집기가 이미 갖고 있기 때문이다.
// 문제를 만드는 규칙은 여기가 아니라 music-model.js(musicEarQuestions)에 순수 함수로 있다.`,
    note:
      '따라치기와 형제지만 규칙이 정반대인 곳이 셋입니다 — 악보를 보여 주지 않고, 틀려도 진도가 나가고, 다시 듣기를 제한합니다. ' +
      '그 셋이 파일을 나눈 이유이며 첫머리 주석에 적혀 있습니다.',
  },
  {
    sectionIds: ['module-boundaries', 'context-menu', 'python-editor'],
    kind: 'API',
    title: 'MNContextMenu — 여러 층 우클릭 메뉴',
    source: 'src/js/context-menu.js',
    file: 'src/js/context-menu.js',
    at: 'const MNContextMenu = (() => {',
    when: '항목이 많아 한 줄로 쌓을 수 없는 우클릭 메뉴를 열 때',
    tags: ['소비자 1개', 'open() 하나', '겉모습은 부르는 쪽 CSS', 'Escape 는 한 층씩'],
    snippet: `const close = MNContextMenu.open(x, y, items, { base:"text-context", onClose, autoFocus });
// 반환값이 이 메뉴를 닫는 함수다. MNContextMenu.close() · isOpen() 도 있다.

// 항목 = { label, title, action, disabled, children, active, separator }
//   children 이 있으면 부모가 되고 action 은 무시한다 — 층을 여는 일이 곧 동작이다.
//   disabled 에 함수를 주면 메뉴를 그릴 때 불러 판정한다.

// base 는 클래스 접두사다: base + "-menu" / "-sub" / "-parent" / "-sep".
// 이미 있는 메뉴를 옮겨도 보이는 모습이 바뀌지 않게 하려고 인자로 받는다.`,
    note:
      '같은 코드가 docx 편집기와 악보 편집기에 한 벌씩 있어 "세 번째 복사본을 막으려고" 만든 모듈입니다. ' +
      '그런데 아직 그 둘을 흡수하지 않아 소비자가 python-editor.js 하나뿐입니다 — 지금은 같은 기능이 세 벌인 상태입니다.',
  },
  {
    sectionIds: ['module-boundaries', 'grid-selection', 'spreadsheet-viewer', 'db-client'],
    kind: 'API',
    title: 'MNGridSelection — 표 칸 고르기 셈',
    source: 'src/js/grid-selection.js',
    file: 'src/js/grid-selection.js',
    at: 'const MNGridSelection = (() => {',
    when: '표에서 칸을 끌어 고르고, 고른 것을 클립보드로 옮기고 되읽을 때',
    tags: ['소비자 2개', 'DOM 을 모름', '칸 하나 = 정수 하나', 'TSV 왕복'],
    snippet: `// 선택 셈 — 칸 하나를 \`행 * 열수 + 열\` 키로 눌러 Set 에 담는다.
// 흩어진 선택이 특별한 경우가 되지 않는다.
gridSelectionRangeBetween(anchor, focus)          // 정규화된 사각 범위
gridSelectionCombineKeys(keys, range, mode, cols) // replace | add | subtract
gridSelectionRangeCovered(keys, range, cols)      // 이미 다 고른 범위인가(= Ctrl 끌기는 빼기)
gridSelectionBoundsFromKeys(keys, cols)           // { row1..col2, contiguous, count }
gridSelectionDragHitPoint(kind, point, …)         // 머리에서 시작한 끌기의 축 유지

// 클립보드 — 내보내기와 되읽기를 짝으로 둔다(규칙이 갈라지면 두 표 사이가 어긋난다)
gridSelectionToText(keys, cols, cellText)  // 고르지 않은 칸은 빈칸으로
gridClipboardTable(text)                   // 엑셀·시트에서 온 글자를 2차원 배열로
gridPastePlan(grid, anchor, size, spots)   // 넘친 행·열은 버리고 그 수만 돌려준다`,
    note:
      '스프레드시트 뷰어 안에 있던 셈을 DB 결과 표가 같은 규칙을 써야 하게 되면서 뗀 모듈입니다. ' +
      '키가 열 수에 묶여 있으므로 표를 다시 그릴 때 담아 둔 선택을 비우는 책임은 소비자에게 있습니다.',
  },

  // ── EXE 로컬 서버 — 환율 ─────────────────────────────

  {
    sectionIds: ['launcher-security', 'exchange-rate', 'exchange-rate-ui'],
    kind: 'GET',
    title: '/can-proxy-rates · /exchange-rate — 환율 대리 조회',
    endpoints: ['/can-proxy-rates', '/exchange-rate'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/exchange-rate?\", StringComparison.Ordinal))",
    when: '환율 창이 고시환율·참고환율을 조회할 때',
    tags: ['토큰 필요', '능력 프로브', '응답 캐시', '원본 JSON 그대로'],
    snippet: `GET /can-proxy-rates    → 이 런처가 환율을 대신 받아 주는가(지도의 /can-proxy-tiles 와 같은 꼴)
GET /exchange-rate?…    → 출처 원본 JSON 그대로
//                        캐시에서 준 응답에는 X-ClassDock-Rate-Cached: 1 이 붙는다

// 브라우저가 직접 못 부르는 이유 — 수출입은행 API 는 CORS 를 열어 주지 않는다.
// 런처는 파싱하지 않는다. 해석은 MNExchangeRate 한 곳에서만 한다.`,
    note:
      '능력마다 프로브를 따로 두는 규칙이 여기서도 지켜집니다 — 타일(/can-proxy-tiles)·저장(/can-save-file)과 나란히 ' +
      '환율은 /can-proxy-rates 를 씁니다. 런처가 있다고 모든 능력이 있는 것은 아니기 때문입니다.',
  },
  {
    sectionIds: ['launcher-security', 'exchange-rate-ui'],
    kind: 'POST',
    title: '/exchange-rate-key — 수출입은행 인증키 보관',
    endpoints: ['/exchange-rate-key', '/exchange-rate-key-status'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/exchange-rate-key-status\")",
    when: '설정에서 수출입은행 인증키를 넣거나 지울 때',
    tags: ['토큰 필요', 'DPAPI 암호화', '키를 브라우저에 두지 않음'],
    snippet: `GET    /exchange-rate-key-status  → { hasKey, remembered, … }  (상태만, 키는 안 준다)
POST   /exchange-rate-key         → 검증 후 보관
DELETE /exchange-rate-key         → 지운다

// 저장: ProtectedData.Protect(CurrentUser) + 이 용도 전용 엔트로피
// 카카오 지도 키와 같은 방식이되 엔트로피를 따로 둔다 — 한 키가 새도 다른 키는 못 푼다.`,
    note:
      'API 키를 프런트에 두지 않는 규칙의 두 번째 적용입니다(첫 번째는 카카오 지도 키). ' +
      'localStorage 에 뒀다면 오프라인 HTML·작업공간 백업·개발자 도구로 그대로 새어 나갑니다. ' +
      'tests/exchange-rate.test.js 가 "인증키는 런처 밖으로 나가지 않는다" 를 소스 대조로 검사합니다.',
  },

  // ── EXE 로컬 서버 — 지도 ─────────────────────────────

  {
    sectionIds: ['launcher-security', 'launcher-map', 'map-overview', 'map-viewer'],
    kind: 'GET',
    title: '/can-proxy-tiles · /tile-proxy — 배경 타일 대리 수신',
    endpoints: ['/can-proxy-tiles', '/tile-proxy'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/tile-proxy?\", StringComparison.Ordinal))",
    when: '지도 문서가 배경 타일을 그릴 때, 노트북 PDF 가 지도 스냅샷을 찍을 때',
    tags: ['/can-proxy-tiles 토큰 필요', '/tile-proxy 토큰 불필요', 'SSRF 방지', '2층 캐시'],
    snippet: `// 브라우저는 지도 서버를 직접 부르지 않는다 — 런처가 대신 받는다.
GET /can-proxy-tiles            → "yes" | 404      (능력 프로브)
GET /tile-proxy?u=<타일 URL>     → image/png|jpeg|webp

// 허용 호스트 6곳만 통과(TileProxyHosts). https 아니면 거부, 아니면 502.
//   tile.openstreetmap.org · basemaps.cartocdn.com · tile.opentopomap.org
//   server.arcgisonline.com · tiles.stadiamaps.com · tile.thunderforest.com
// 캐시: 메모리(같은 화면 다시 그리기) + 디스크 400MB·7일(인터넷 없는 교실)`,
    note:
      '/tile-proxy 만은 토큰도 Origin 검사도 없습니다 — 지도 스냅샷의 sandbox iframe 이 Origin: null 로 부르기 때문입니다. ' +
      '대신 호스트 허용 목록이 유일한 방어선이 되므로, MAP_BASEMAPS 에 호스트를 더할 때 이 목록도 함께 늘려야 합니다. ' +
      '디스크 캐시가 필요한 이유는 런처가 실행마다 다른 포트를 잡아 브라우저 origin 이 바뀌고, 그러면 IndexedDB·Cache API 가 다음 실행에서 남의 저장소가 되기 때문입니다.',
  },
  {
    sectionIds: ['launcher-security', 'launcher-map', 'map-viewer'],
    kind: 'GET',
    title: '/geocode — 장소 이름 검색과 좌표 되묻기',
    endpoints: ['/geocode'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/geocode?\", StringComparison.Ordinal))",
    when: '지도에서 장소를 검색하거나, 찍은 자리의 주소·행정구역·주변 시설을 물을 때',
    tags: ['토큰 필요', '공급자 6종', 'OSM 초당 1건', '검색 캐시'],
    snippet: `GET /geocode?provider=<공급자>&q=<검색어>[&x&y&radius&page&category]

// provider: osm | kakao-address | kakao-keyword
//           kakao-coord2address | kakao-coord2region | kakao-category
// 좌표·반경·갈래는 검색어가 아니므로 숫자·코드 꼴만 통과시킨다(ReadGeocodeSpot):
//   x ∈ [-180,180]  y ∈ [-85,85]  radius ∈ [1,20000]  page ∈ [1,3]
//   category 는 영문 두 글자 + 숫자 한 글자(SC4·CS2 …)
// OSM 은 정책상 요청 간격을 강제(GeocodeMinIntervalMs), 카카오는 키가 있을 때만.`,
    note:
      'CLASSDOCK_GEOCODER_URL 로 Nominatim 호환 공급자를 바꿀 수 있고, https 가 아니면 기본값으로 되돌립니다. ' +
      '프런트(mapGeocode)는 카카오 주소 → 키워드 → OSM 순으로 폴백하므로, 키가 없거나 카카오가 실패해도 검색이 끊기지 않습니다.',
  },
  {
    sectionIds: ['launcher-security', 'launcher-map', 'map-viewer'],
    kind: 'POST',
    title: '/map-search-key · /map-search-provider — 카카오 REST 키 보관',
    endpoints: ['/map-search-key', '/map-search-key-status', '/map-search-provider'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/map-search-key\", StringComparison.Ordinal))",
    when: '설정에서 카카오 REST 키를 넣거나 지우거나, 검색 공급자를 바꿀 때',
    tags: ['토큰 필요', 'DPAPI 암호화', '키를 브라우저에 두지 않음'],
    snippet: `GET    /map-search-key-status  → { hasKey, remembered, persistentSupported, provider }
POST   /map-search-key         → 키 검증 후 보관
DELETE /map-search-key         → 지우고 공급자를 osm 으로 되돌림
GET/POST /map-search-provider  → "kakao" | "osm"

// 키는 브라우저로 돌아가지 않는다. 상태만 돌려주고 요청에는 런처가 헤더를 붙인다.
// 저장: ProtectedData.Protect(DataProtectionScope.CurrentUser) + 별도 엔트로피
// 검증: 길이 16~128 · 영숫자와 -_ 만 → 실제 주소 한 건을 조회해 본 뒤에 저장`,
    note:
      'API 키를 프런트에 두지 않은 것이 이 계약의 핵심입니다. localStorage 에 뒀다면 오프라인 HTML·작업공간 백업·개발자 도구로 그대로 새어 나갑니다. ' +
      '앱 모드가 별도 브라우저 프로필로 열려 localStorage 가 비어도 공급자 선택이 이어지는 것도 이 저장 위치 덕분입니다.',
  },
  {
    sectionIds: ['launcher-security', 'launcher-map', 'map-overview'],
    kind: 'GET',
    title: '/tile-cache-status · /tile-cache-clear — 오프라인 지도 관리',
    endpoints: ['/tile-cache-status', '/tile-cache-clear'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/tile-cache-status\")",
    when: '"🗂️ 오프라인 지도" 창에서 받아 둔 양을 보거나 비울 때',
    tags: ['토큰 필요', '400MB 상한', '7일 만료'],
    snippet: `GET  /tile-cache-status → { files, bytes, maxBytes }
POST /tile-cache-clear  → 디스크 캐시 삭제

// 400MB 를 넘긴 쓰기 직후 오래된 것부터 80% 선까지 쓸어 낸다(SweepTileCache).
// 만료(7일)된 캐시도 버리지 않고 오프라인 fallback 으로 남겨 둔다.`,
    note:
      '조회조차 토큰을 요구합니다 — 같은 PC 의 아무 웹페이지나 "이 사람이 어느 지역을 봤는지"를 셀 수 있으면 안 되기 때문입니다. ' +
      'tests/map-viewer.test.js 가 이 토큰 요구를 검사하고, C# 런처와 Go 런처가 같은 상한·같은 정리 시점을 쓰는지도 함께 대조합니다.',
  },
  {
    sectionIds: ['launcher-transit', 'map-live-transit', 'subway-live'],
    kind: 'GET/POST/DELETE',
    title: '/subway-position · /subway-key — 수도권 실시간 열차 위치',
    endpoints: ['/can-proxy-subway', '/subway-position', '/subway-key', '/subway-key-status'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/subway-position?\", StringComparison.Ordinal))",
    when: '지도에서 🚇 실시간 열차를 켜 두는 동안 15초마다, 설정의 "지하철 실시간" 에서 키를 넣고 지울 때',
    tags: ['토큰 필요', '키 조작은 X-ClassDock-Action 도', '노선 16개 허용 목록', '캐시 12초 · 실패 시 1분'],
    snippet: `GET    /can-proxy-subway            → "yes"
GET    /subway-position?line=2호선  → 원본 JSON (캐시면 X-ClassDock-Subway-Cached: 1)
                                     키 없음 428 subway-key-required · 목록 밖 노선 400
GET    /subway-key-status           → { hasKey, remembered, persistentSupported }
POST   /subway-key?remember=1       본문: 키 → 2호선으로 시험 조회 후 저장(DPAPI)
DELETE /subway-key                  키와 그 키로 받은 캐시를 함께 지움`,
    note:
      '이 API 는 오류도 HTTP 200 으로 주므로 본문의 INFO-000/100/200 으로 가릅니다. INFO-200(열차 없음)은 정상 답입니다. ' +
      '하루 1,000회 한도라 화면 15초 · 런처 12초 캐시가 곧 예산이며, 한도 소진은 따로 구분하지 않고 일반 실패로 보입니다.',
  },
  {
    sectionIds: ['launcher-transit', 'map-live-transit', 'jeju-bus-api', 'jeju-bus-map'],
    kind: 'GET',
    title: '/jeju-bus-routes · route · shape · position — 제주 버스 (시범)',
    endpoints: ['/can-proxy-jeju-bus', '/jeju-bus-'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/jeju-bus-\", StringComparison.Ordinal))",
    when: '지도의 🚌 제주 버스 패널에서 노선을 검색·선택하고, 표시를 켜 둔 동안 30초마다',
    tags: ['토큰 필요', '키 없음', 'C# 런처 전용', '위치 30초 · 정적 24시간 캐시', 'Retry-After'],
    snippet: `GET /can-proxy-jeju-bus               → "yes"
GET /jeju-bus-routes?keyword=201      노선 검색     (숫자·하이픈 12자)
GET /jeju-bus-route?routeId=…         정류장 목록   (숫자 12자)
GET /jeju-bus-shape?routeId=…         노선 경로 좌표
GET /jeju-bus-position?routeId=…      실시간 차량 위치
    응답 헤더: X-ClassDock-Bus-Fetched-At(원본 수신 시각) · X-ClassDock-Bus-Stale · Retry-After
    &refresh=1 은 정적 조회만, 그래도 30초 안에는 상류를 다시 부르지 않음`,
    note:
      '원격 호스트(bus.jeju.go.kr/data/search/)·경로 네 개·POST 메서드를 고정하고 리다이렉트를 따라가지 않습니다. ' +
      '연결한 경로는 공식 개발자 API 가 아니라 사이트 자신의 조회 경로라, 이용 조건 확인과 TAGO 공식 API 전환이 설계 문서에 후속 과제로 남아 있습니다.',
  },

  // ── EXE 로컬 서버 — DB 클라이언트 ────────────────────

  {
    sectionIds: ['launcher-db', 'db-overview', 'db-client'],
    kind: 'POST',
    title: '/db-capability · /db-session-open · /db-session-close — 접속 수명',
    endpoints: ['/db-', '/db-capability', '/db-session-open', '/db-session-close'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path == \"/db-capability\")",
    when: '접속 화면을 열 때(능력 확인), 연결 단추를 누를 때, 탭을 닫거나 연결을 끊을 때',
    tags: ['토큰 필요', '동시 4접속', '유휴 30분 정리', '비밀번호는 stdin 으로만'],
    snippet: `GET  /db-capability   → { python, driver, version }
POST /db-session-open ← 길이 접두 본문 7개
     host · port · database · user · password · readOnly · autoCommit
     → { ok, id, readOnly, autoCommit, label, info }
POST /db-session-close?id=…

// 비밀번호는 프로세스 인수가 아니라 워커 기동 직후 stdin 의 첫 connect 요청에만 실린다.
// 파이썬을 못 찾으면 501 "no-python" — 화면이 설치 안내와 "다시 검사"를 띄운다.`,
    note:
      'endpoints 의 "/db-" 는 RequiresLocalAuthToken 의 접두사 한 줄입니다. 이 한 줄이 /db-* 열여덟 경로를 GET·POST 양쪽에서 덮습니다 — ' +
      '새 경로가 자동으로 보호되는 장점과, 이 줄이 지워지면 전부 동시에 열리는 단점이 같은 구조에서 나옵니다(/ssh- 와 같은 모양).',
  },
  {
    sectionIds: ['launcher-db', 'db-overview', 'db-client'],
    kind: 'GET',
    title: '/db-schema · /db-table · /db-object · /db-dependencies · /db-use — 스키마 읽기',
    endpoints: ['/db-schema', '/db-table', '/db-object', '/db-dependencies', '/db-use'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/db-schema?\", StringComparison.Ordinal))",
    when: '트리를 그릴 때, 테이블을 고를 때, 컬럼을 펼칠 때, 정의 창·ERD 를 열 때, 객체를 지우기 전에',
    tags: ['토큰 필요', '런처는 아는 mode 만 넘김', '메타데이터 제한 60초'],
    snippet: `GET  /db-schema?id=&mode=      tables(기본) · columns(자동완성) · erd(관계 일괄)
GET  /db-table?id=&name=&mode=  table(정의+200행) · columns · count · ddl · info
GET  /db-object?id=&kind=&name= 프로시저·함수·이벤트·트리거의 CREATE 문
GET  /db-dependencies?id=…      지우기 전에 무엇이 이 객체를 쓰는지
POST /db-use?id=&name=          현재 데이터베이스 전환`,
    note:
      '런처는 아는 mode·kind 만 워커에 넘깁니다. 값을 그대로 통과시키면 워커의 분기 하나가 곧 API 하나가 되어, ' +
      '무엇이 열려 있는지 C# 쪽만 읽어서는 알 수 없게 됩니다.',
  },
  {
    sectionIds: ['launcher-db', 'db-overview', 'db-client'],
    kind: 'POST',
    title: '/db-query · /db-query-poll · /db-query-cancel · /db-page — 실행',
    endpoints: ['/db-query', '/db-query-poll', '/db-query-cancel', '/db-page'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/db-query?\", StringComparison.Ordinal))",
    when: '실행·전체 실행·실행 계획, 실행 중 취소, 결과의 "더 보기"',
    tags: ['토큰 필요', '시작만 하고 폴링', '기본 60초 · 최대 600초', '1000행 · 12000셀'],
    snippet: `POST /db-query?id=        ← SQL + 제한 시간 → { job }
GET  /db-query-poll?job=  → { running } 또는 { statements:[…] }
POST /db-query-cancel?job=
GET  /db-page?id=&set=&offset=&limit=   워커가 들고 있는 결과의 다음 쪽

// 취소는 실행 중인 작업 id 가 일치할 때만 워커에 간다(DbSession.ActiveJobId).
// 그렇지 않으면 대기 중인 덤프를 취소했을 때 앞서 돌던 쿼리가 끊긴다.`,
    note:
      '워커는 취소에 응답하지 않습니다(fire and forget). 실행 중인 쿼리는 stdin 을 읽지 못해 취소를 리더 스레드가 즉시 처리해야 하는데, ' +
      '거기서 응답까지 내보내면 실행 중인 쿼리의 응답과 순서가 뒤섞이기 때문입니다. 취소 결과는 취소당한 쿼리 자신의 응답(cancelled)으로 드러납니다.',
  },
  {
    sectionIds: ['launcher-db', 'db-overview', 'db-client'],
    kind: 'POST',
    title: '/db-cell · /db-apply · /db-tx — 표 고치기와 트랜잭션',
    endpoints: ['/db-cell', '/db-apply', '/db-tx'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/db-cell?\", StringComparison.Ordinal))",
    when: '잘려 온 값을 고치려 열 때, 담아 둔 변경을 적용할 때, 커밋·롤백·자동 커밋 전환',
    tags: ['토큰 필요', '한 묶음 500건', '런처는 SQL 을 짓지 않음', '읽기 전용은 서버가 막음'],
    snippet: `POST /db-cell?id=   표의 값은 500자에서 잘려 있을 수 있어 원본을 다시 읽는다
POST /db-apply?id=  ← 길이 접두 평평한 줄
     database · table · 건수 · (갈래, 값…) × n   갈래: update · delete · insert
POST /db-tx?id=&op= commit · rollback · autocommit(&on=0|1) · state

// 런처는 갈래 이름만 알아보고 나머지는 JSON 값으로 옮긴다. 문장은 언제나 워커가
// 자리표시자로 짓는다 — UPDATE … SET \`col\` = %s WHERE \`pk\` = %s`,
    note:
      '⚠ 프런트가 싣는 차례와 런처가 읽는 차례가 어긋나면 값이 엉뚱한 칸으로 들어갑니다. 형식이 스스로 그 사실을 알려 주지 못하는 구조라 ' +
      'tests/db-client.test.js 가 두 쪽을 나란히 놓고 봅니다. 셀 편집은 읽기 전용 접속에서 편집 가능 판정 이전에 잠깁니다 — ' +
      '쿼리 경로에만 읽기 전용을 걸어 두면 셀 편집이 뒷문이 되기 때문입니다.',
  },
  {
    sectionIds: ['launcher-db', 'db-overview', 'db-dump', 'db-import'],
    kind: 'POST',
    title: '/db-dump · /db-dump-poll · /db-import — 덤프와 적재',
    endpoints: ['/db-dump', '/db-dump-poll', '/db-import'],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"POST\" && path.StartsWith(\"/db-dump?\", StringComparison.Ordinal))",
    when: '고른 객체를 .sql 로 내보낼 때, CSV·엑셀을 테이블에 넣을 때',
    tags: ['토큰 필요', '객체 500개', '행 10,000 · 셀 100,000 · 본문 8MB', '무진행 120초'],
    snippet: `POST /db-dump?id=   ← 파일 이름 · 모드 · 옵션 6 · DB · 대상 수 · (종류, 이름) × n
                    → { job, path }   경로는 런처가 만든다
GET  /db-dump-poll?job=   진행 보고 또는 결과 (취소는 /db-query-cancel 을 함께 씀)
POST /db-import?id= ← 테이블 · 열 목록 · 모드 · (값, NULL 여부) × n

// 파일 경로는 런처만 만든다: SafeRelPath → TryResolveSaveRootPath.
// 워커가 경로를 지으면 저장 위치 정책이 뚫린다.`,
    note:
      '덤프와 적재 모두 쿼리와 같은 작업 목록에 들어가고 폴링·취소 경로를 함께 씁니다. ' +
      '덤프는 총 실행 시간이 아니라 "진행 보고가 끊긴 시간"(DbDumpIdleMs 120초)으로 재므로, 살아 있는 덤프는 몇십 분이 걸려도 끊기지 않습니다.',
  },
  {
    sectionIds: ['launcher-diagnostics', 'diagnostics'],
    kind: 'POST',
    title: '/diagnostics/events · /diagnostics/session · /diagnostics/clear · /diagnostics/open-folder',
    endpoints: [
      '/diagnostics/', '/diagnostics/events', '/diagnostics/session',
      '/diagnostics/clear', '/diagnostics/open-folder',
    ],
    source: 'desktop/launcher.cs',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/diagnostics/events\", StringComparison.Ordinal))",
    when: '앱이 사건을 모아 넘길 때, 사용자가 기록 폴더를 열거나 지울 때',
    tags: ['토큰 필요', '세션 단위 파일', '묶어 보내기'],
    snippet: `POST /diagnostics/events       모아 둔 사건 묶음을 넘긴다
GET  /diagnostics/events       남아 있는 기록을 되읽는다
GET/POST /diagnostics/session  지금 세션 식별자
POST /diagnostics/clear        기록 삭제
POST /diagnostics/open-folder  탐색기로 기록 폴더 열기`,
    note:
      '기록에 무엇이 담기는지가 이 기능의 안전선입니다 — 사용자가 그 파일을 첨부해 보내는 것이 원래 용도이기 때문입니다. ' +
      '비밀번호·SQL 본문이 섞이지 않는지는 지금 수동 검증 항목으로만 남아 있습니다.',
  },
];
