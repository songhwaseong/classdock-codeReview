// 줄 앵커 리뷰 주석.
//
// 두 종류가 있다.
//  ① 파일 개요 — 섹션에 실린 모든 파일의 첫 줄에 "이 파일을 왜 여기서 보는가"를 붙인다(자동 생성).
//  ② 지목 주석 — 실제 줄 번호를 짚어 설계 의도나 위험을 적는다(손으로 작성).
//
// 큰 파일은 구간(range)만 실리므로, app.js 가 그 구간에 들어 있는 주석만 화면에 붙인다.

const makeFileOverviewComments = () => {
  const sections = window.MN_REVIEW_DATA?.sections ?? [];

  return sections.flatMap((section) =>
    section.files.map((file) => {
      const scope =
        (file.lineOffset || 0) > 0 || file.lineCount < (file.totalLines || file.lineCount)
          ? `원본 ${(file.totalLines || file.lineCount).toLocaleString('ko-KR')}줄 중 L${(file.lineOffset || 0) + 1}–L${
              (file.lineOffset || 0) + file.lineCount
            } 구간만 실려 있습니다. `
          : '';

      return {
        sectionId: section.id,
        file: file.path,
        line: (file.lineOffset || 0) + 1,
        type: '파일',
        title: `${file.label} 을(를) 이 섹션에서 보는 이유`,
        body:
          `${scope}이 파일은 "${section.title}" 리뷰에 ${
            file.description ? `"${file.description}" 역할로 ` : ''
          }묶여 있습니다. ` +
          `이 프로젝트는 ES module 이 아니라 전역 스크립트이므로, 읽는 순서는 "이 파일이 몇 번째로 로드되는가 → 어떤 전역을 새로 만드는가 → 어떤 전역을 가져다 쓰는가" 입니다. ` +
          `섹션 요약: ${section.summary.slice(0, 160)}${section.summary.length > 160 ? '…' : ''}`,
      };
    }),
  );
};

const targetedComments = [
  // ── 개요 ────────────────────────────────────────────
  {
    sectionId: 'loading-contract',
    file: 'tools/check-source.js',
    at: "const manifestScripts = manifest.localScripts.map((file) => \"src/js/\" + file);",
    type: '계약',
    title: 'HTML 과 manifest 를 문자열로 통째 비교',
    body:
      'script 태그를 정규식으로 뽑아 manifest.localScripts 와 join("\\n") 결과를 그대로 비교합니다. 부분 일치가 아니라 완전 일치라, 순서가 하나만 어긋나도 실패합니다. 태그만 추가하고 manifest 를 잊는 실수를 여기서 잡습니다.',
  },
  {
    sectionId: 'loading-contract',
    file: 'tools/check-source.js',
    at: "if (layerScripts.join(\"\\n\") !== manifest.localScripts.join(\"\\n\")) {",
    type: '계약',
    title: '계층이 모든 파일을 정확히 한 번씩',
    body:
      'applicationLayers 의 scripts 를 이어붙인 것이 localScripts 와 같아야 합니다. 누락도 중복도 허용하지 않으므로, 계층은 "분류"가 아니라 "완전 분할"입니다.',
  },
  {
    sectionId: 'dependency-map',
    file: 'tools/check-source.js',
    at: "for (const [script, dependencies] of Object.entries(manifest.scriptDependencies || {})) {",
    type: '계약',
    title: '의존 역전은 빌드 실패',
    body:
      'scriptIndex 로 로드 위치를 비교해 dependency 가 target 보다 뒤면 예외를 던집니다. 순환 의존은 반드시 순서 역전으로 나타나므로 자연히 함께 걸립니다.',
  },
  {
    sectionId: 'module-boundaries',
    file: 'tools/check-source.js',
    at: "if (!scriptIndex.has(boundary.file)) throw new Error(`Module boundary is not a local script: ${boundary.file}`);",
    type: '주의',
    title: '경계 검사는 "언급 여부"만 본다',
    body:
      'publicApi 선언 존재와 소비자의 참조를 정규식으로 확인합니다. 주석 안에 이름만 적혀 있어도 통과하므로, 소비자 목록이 보증하는 것은 실제 사용이 아니라 언급입니다. 목록을 신뢰할 때 이 한계를 함께 기억해야 합니다.',
  },

  // ── bootstrap ───────────────────────────────────────
  {
    sectionId: 'state-sync',
    file: 'src/js/state-sync.js',
    at: "var isLocal = (location.protocol === \"http:\" || location.protocol === \"https:\") &&",
    type: '분기',
    title: '서버가 없으면 즉시 손을 뗀다',
    body:
      'http/https 이면서 host 가 127.0.0.1 또는 localhost 일 때만 동작하고 그 외에는 바로 return 합니다. file:// 오프라인 HTML 과 일반 브라우저에서는 이 파일이 아무 일도 하지 않고 기존 localStorage 방식이 그대로 쓰입니다.',
  },
  {
    sectionId: 'state-sync',
    file: 'src/js/state-sync.js',
    at: "window.fetch = function (input, init) {",
    below: 1,
    type: '위험',
    title: '전역 fetch 를 덮어쓴다',
    body:
      '같은 origin 요청에만 X-ClassDock-Token 을 붙이도록 window.fetch 를 감쌉니다. 각 호출부가 토큰을 몰라도 되는 대신, 이후 로드되는 코드가 fetch 를 또 감싸면 순서에 따라 토큰이 빠질 수 있고 디버깅 스택이 한 겹 깊어집니다.',
  },
  {
    sectionId: 'core',
    file: 'src/js/core.js',
    line: 1,
    type: '설계',
    title: 'UMD 래퍼가 테스트 가능성의 근간',
    body:
      'module.exports 와 전역(PdfSignerCore) 양쪽으로 노출합니다. 이 한 줄 덕분에 브라우저 전역 앱인데도 node --test 에서 핵심 로직을 브라우저 없이 검증할 수 있습니다. tests/core.test.js 1,425줄이 전부 여기에 기대고 있습니다.',
  },
  {
    sectionId: 'state',
    file: 'src/js/state.js',
    at: "\"use strict\";",
    below: 2,
    type: '위험',
    title: '검사되지 않는 100개짜리 계약',
    body:
      'core.js 에서 100개 넘는 이름을 구조 분해로 가져옵니다. 이 목록 자체가 두 파일 사이의 계약인데 manifest 의 moduleBoundaries 에는 등록돼 있지 않아 check-source 의 검사 밖입니다. core 쪽 이름을 바꾸고 여기를 빠뜨리면 런타임 undefined 로만 드러납니다.',
  },
  {
    sectionId: 'lazy',
    file: 'src/js/lazy.js',
    at: "// 묶음 정의 — files 는 \"반드시 이 순서로\" 실행해야 하는 vendor 파일 목록이다.",
    type: '설계',
    title: 'files 배열 순서 = 실행 순서',
    body:
      'pptx 묶음은 jquery → jszip → jszip-utils → divs2slides → pptxjs 순서가 필수입니다. 배열 순서가 곧 계약이라, 알파벳순 정렬 같은 "정리"가 기능을 깨뜨립니다.',
  },
  {
    sectionId: 'lazy',
    file: 'src/js/lazy.js',
    at: "let jszipBundleQueue = Promise.resolve();",
    type: '설계',
    title: '모드 판별을 DOM 존재로',
    body:
      'data-mn-lazy 블록이 있으면 단일 파일 빌드, 없으면 서버 서빙입니다. 빌드 플래그를 심는 대신 산출물의 구조 자체로 판별해, 빌드와 런타임이 어긋날 여지를 없앴습니다.',
  },
  {
    sectionId: 'lazy',
    file: 'src/js/lazy.js',
    at: "loadedFiles.set(file, tracked);",
    type: '동시성',
    title: '진행 중 Promise 재사용',
    body:
      '같은 묶음을 동시에 여러 번 요청해도 로드는 한 번입니다. 여러 문서를 한꺼번에 열 때 같은 vendor 를 중복 실행하는 것을 막습니다.',
  },
  {
    sectionId: 'history',
    file: 'src/js/history.js',
    at: "text: 300,      // 문자열 스냅샷 — 가벼워서 깊게 쌓아도 된다",
    type: '설계',
    title: '상한을 한곳에 모은 이유',
    body:
      '스냅샷 하나의 무게가 편집기마다 다릅니다 — 글자 몇 줄 vs 시트 전체 복제. 상한을 종류별로 나누고 한 파일에 모아 두어 "탭마다 되돌리기 깊이가 왜 다른지"를 비교할 수 있게 했습니다.',
  },
  {
    sectionId: 'history',
    file: 'src/js/history.js',
    at: "function create(options){",
    type: '설계',
    title: 'isEqual 을 선택이 아니라 필수로',
    body:
      'undo() 는 아직 기록되지 않은 현재 상태를 먼저 commit 해서 확정합니다. 이때 동등성 판정이 없으면 capture() 가 매번 새 객체를 주는 편집기에서 undo 가 방금 만든 같은 상태로 되돌아가 아무 일도 하지 않습니다. 조용히 깨지는 종류라 인자로 강제했습니다.',
  },
  {
    sectionId: 'spellcheck',
    file: 'src/js/spellcheck.js',
    line: 1,
    type: '설계',
    title: '검사 범위를 문서 종류로 나눈다',
    body:
      '일반 문서는 전체, 마크다운은 코드 구간 제외, 코드 파일은 주석·문자열만. 코드 전체를 맞춤법 검사했다면 오탐이 쏟아져 기능 자체가 쓸모없어졌을 것입니다.',
  },

  // ── documents ───────────────────────────────────────
  {
    sectionId: 'file-loaders',
    file: 'src/js/file-loaders.js',
    at: "function isLikelyTextBytes(bytes){",
    type: '안전',
    title: '텍스트 판별은 보수적으로',
    body:
      'UTF-16 BOM 이면 텍스트, NUL 바이트가 하나라도 있으면 즉시 이진, 그 외에는 제어문자 비율 10% 이하일 때만 텍스트입니다. 판정이 틀리면 사용자 파일을 손상시키는 방향이라 보수적으로 잡은 것이 맞습니다. 다만 표본이 앞 8KB 뿐이라 앞은 텍스트이고 뒤가 이진인 파일은 통과합니다.',
  },
  {
    sectionId: 'documents',
    file: 'src/js/documents.js',
    at: "navNodes.push({ nodeId: d.nodeId, type: \"doc\", docId: id, parentId: d.parentId });",
    below: 1,
    type: '구조',
    title: '문서 생명주기의 시작점',
    body:
      'makeDoc 이 kind 별 컨테이너를 만들고 docsBySourceKey 에 등록합니다. 등록과 closeDoc 의 해제가 짝을 이루지 않으면 "이미 열린 파일" 판정이 조용히 깨집니다. 새 문서 종류를 추가할 때 반드시 함께 보는 지점입니다.',
  },
  {
    sectionId: 'documents',
    file: 'src/js/documents.js',
    at: "if (!d){ state=null; viewer=null; byId(\"activeFileName\").textContent=\"\"; byId(\"activeFileName\").removeAttribute(\"data-cat\"); byId(\"activeDocEncoding\").hidden=true; byId(\"activeDocStatus\").hidden=true; updateOriginalSaveBadge(null); byId(\"tools\").hidden=true; byId(\"officeTools\").hidden=true; updateModeBadges(); renderTabs(); updateDocEmptyState(); updateSidebarActive(); return; }",
    below: 1,
    type: '구조',
    title: '지연 렌더가 실제로 일어나는 곳',
    body:
      'setActiveDoc 이 아직 그려지지 않은 문서면 render() 를 부릅니다. 폴더째 열어도 첫 화면이 빠른 이유가 여기 있고, 반대로 "열었는데 안 보인다"류 버그도 이 경로에서 납니다.',
  },
  {
    sectionId: 'viewer-base',
    file: 'src/js/viewer-base.js',
    at: "async function loadOffice(file, ext, options={}){",
    type: '설계',
    title: 'render 클로저 — 지연 렌더 계약의 정의 지점',
    body:
      'loadOffice 가 doc.render 를 클로저로 붙이고 확장자별 렌더러로 분기합니다. renderOptions 를 문서 객체에 노출하는 것은 파일을 갈아 끼운 쪽이 캐시된 바이트를 비울 수 있게 하려는 의도적 결합이며, 주석에 이유가 남아 있습니다.',
  },
  {
    sectionId: 'code-viewer',
    file: 'src/js/code-viewer.js',
    at: "if (oldPath && oldPath !== path) forgetFsHandle(oldPath);",
    below: 2,
    type: '핵심',
    title: '앱 전체의 텍스트 저장 창구',
    body:
      '원본 핸들이 있으면 원본, 없으면 EXE 저장 루트 또는 다운로드 사본이라는 분기를 이 함수 하나에 모았습니다. batch-replace·table-export·data-convert-ui·exam-paper 가 모두 여기를 통과하므로, "원본 저장 / 사본 저장" 배지와 실제 동작이 어긋나지 않습니다. 이 코드베이스에서 가장 값어치 있는 추상화입니다.',
  },

  // ── python ──────────────────────────────────────────
  {
    sectionId: 'python-run-context',
    file: 'src/js/python-run-context.js',
    at: "const PYODIDE_VER = \"0.27.7\";",
    type: '위험',
    title: 'Pyodide 버전이 두 곳에 있다',
    body:
      'PYODIDE_VER 상수와 vendor/pyodide/VERSION 이 서로 맞는지 검사하는 장치가 없습니다. 어긋나면 EXE 의 로컬 서빙과 CDN 폴백이 다른 버전을 가리키게 되고, 런타임에서만 드러납니다. check-source 에 넣을 만한 항목입니다.',
  },
  {
    sectionId: 'python-run-context',
    file: 'src/js/python-run-context.js',
    at: "const RUN_BUNDLE_CAP = 50 * 1024 * 1024;   // 옆 파일 포함 실행 시 합계 상한(초과하면 단일 파일 실행)",
    type: '상한',
    title: '번들 상한 50MB',
    body:
      '옆 파일을 함께 넣다 이 값을 넘으면 단일 파일 실행으로 떨어집니다. 사용자에게는 "import 가 갑자기 안 된다"로 보일 수 있는 분기라, 안내가 함께 있는지 확인이 필요합니다.',
  },
  {
    sectionId: 'python-runtime',
    file: 'src/js/python-runtime.js',
    at: "async function runPythonSource(src, ui, runCtx, keepEditorFocus, options){",
    type: '위험',
    title: '한 함수에 5개 실행 모드',
    body:
      'gradeTests(채점) · diagnoseMode(진단) · traceMode(추적) · notebookCells(셀) · 일반. 게다가 "채점·진단·추적 중에는 셀 모드를 끈다" 같은 암묵 규칙이 플래그 조합으로 표현됩니다. 모드가 더 늘면 조합 폭발이 생기는 구조입니다.',
  },
  {
    sectionId: 'python-terminal',
    file: 'src/js/python-terminal.js',
    at: "// Python 편집기의 실행 결과와 분리된 모달 터미널을 제공한다.",
    type: '설계',
    title: '터미널은 앱에 하나뿐',
    body:
      '열린 파이썬 파일들이 세션·변수·명령 기록을 공유합니다. 파일마다 터미널을 두면 변수 상태가 갈라져 수업 흐름이 끊긴다는 판단입니다. 대신 여러 프로젝트를 동시에 다루면 작업 폴더가 오갈 수 있습니다.',
  },
  {
    sectionId: 'notebook-tools',
    file: 'src/js/notebook-tools.js',
    at: "async function buildNotebookWorkspaceBundle(ownerDoc){",
    type: '성능',
    title: '압축 추출을 문서당 한 번만',
    body:
      '_nbWorkspacePromise 로 캐시해 셀을 여러 번 실행해도 압축을 다시 풀지 않습니다. 노트북은 셀 단위로 반복 실행되므로 이 캐시가 없으면 체감 속도가 크게 떨어집니다.',
  },

  // ── javascript ──────────────────────────────────────
  {
    sectionId: 'js-libraries',
    file: 'src/js/js-libraries.js',
    at: "function jsLibraryState(value){",
    type: '안전',
    title: '저장 상태를 다시 정규화한다',
    body: 'localStorage의 선택 목록을 그대로 실행하지 않고 알려진 내장 ID·개수·파일 크기·전역 이름을 다시 검사합니다. 오래된 상태와 수동 변조가 실행 상한을 우회하지 못하게 하는 경계입니다.',
  },
  {
    sectionId: 'js-libraries',
    file: 'src/js/js-libraries.js',
    at: "async function jsLibraryVendorSource(file){",
    type: '설계',
    title: '내장 소스의 두 공급 경로',
    body: '단일 HTML에서는 MNLazy.source()로 인라인 원문을 꺼내고 개발 HTML에서는 vendor 파일을 fetch합니다. 같은 라이브러리가 두 배포 모드에서 동일하게 평가되는지 테스트가 계속 잡아야 합니다.',
  },
  {
    sectionId: 'js-libraries',
    file: 'src/js/js-libraries.js',
    at: "async function jsNpmInstallStream(spec, globalName, hooks){",
    type: '상태',
    title: '설치 작업은 증분 폴링',
    body: '450ms 간격으로 오프셋 이후 로그만 가져오고 일시적 네트워크 오류는 세 번 재시도합니다. UI 상태와 디스크 캐시의 수명이 달라 취소·재실행 뒤 목록 재동기화가 중요합니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "function jsWorkerMain(formatValue){",
    type: '보안',
    title: 'Worker는 완전한 보안 샌드박스가 아니다',
    body: 'DOM과 메인 전역은 분리되지만 Worker가 가진 fetch·네트워크 권한까지 제거하지는 않습니다. 사용자 코드와 추가 패키지는 신뢰한 코드만 실행한다는 제품 경계를 분명히 해야 합니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "// 사용자 코드도 Worker 전역의 postMessage 를 부를 수 있다. 실행 프로토콜은 미리 붙잡은",
    type: '보안',
    title: '사용자 메시지와 제어 메시지 분리',
    body: '실행마다 임의 토큰을 붙여 사용자 코드가 postMessage로 완료·입력 응답을 위조하지 못하게 합니다. 같은 메시지 채널을 공유하는 Worker 실행기에서 필요한 방어입니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "// 워커에는 화면이 없다. 그냥 ReferenceError 가 나면 초보자가 원인을 못 찾으므로 이유를 알려준다.",
    type: '경계',
    title: 'DOM 전역은 막지만 네트워크는 남는다',
    body: 'window·document 같은 화면 전역은 사용할 수 없게 명확한 오류를 내지만 이는 기능 호환성 경계입니다. 외부 통신 차단과는 별개라는 점을 보안 설명과 혼동하면 안 됩니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "// 라이브러리는 사용자 코드와 별도 eval 로 실행한다. 사용자 코드 앞에 문자열로 붙이지 않으므로",
    type: '설계',
    title: '라이브러리를 별도로 평가하는 이유',
    body: '라이브러리 문자열을 사용자 코드 앞에 합치지 않고 간접 eval로 먼저 실행해 사용자 오류 줄 번호가 번들 크기만큼 밀리지 않게 합니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "function startJsWorkerRun(source, options){",
    type: '상한',
    title: '시간 제한은 메모리 제한이 아니다',
    body: '시간 초과 시 Worker를 종료할 수 있지만 그 전에 거대한 배열·문자열을 할당해 브라우저 메모리를 압박하는 것은 막지 못합니다. 출력·시간 상한과 메모리 안전은 별개입니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "async function runJsGrading(source, tests, hooks){",
    type: '격리',
    title: '채점은 테스트마다 새 Worker',
    body: '각 테스트가 사용자 코드를 처음부터 독립 실행해 앞 테스트의 전역 변수·타이머가 다음 판정에 새지 않습니다. 실행 비용보다 채점 재현성을 택했습니다.',
  },
  {
    sectionId: 'js-runtime',
    file: 'src/js/js-runtime.js',
    at: "const _jsKernels = new Map();                 // kernelId → { worker, seq, jobs }",
    type: '상태',
    title: '노트북만 지속형 커널',
    body: '일반 실행과 달리 문서별 Worker를 살려 셀 사이 전역 상태를 이어 갑니다. top-level await 폴백에서 만든 지역 변수는 다음 셀로 이어지지 않는 예외가 있습니다.',
  },
  {
    sectionId: 'js-editor',
    file: 'src/js/js-editor.js',
    at: "function buildJsLibraryPicker(bar, button, storageKey, options){",
    type: '구조',
    title: '편집기보다 라이브러리 선택기가 먼저',
    body: 'JavaScript 전용 화면은 Python 편집기의 저장·초안·채점 UI를 재사용하고, 이 모듈은 라이브러리 상태와 실행 옵션을 연결하는 얇은 어댑터로 남습니다.',
  },
  {
    sectionId: 'js-editor',
    file: 'src/js/js-editor.js',
    at: "npmInstall.addEventListener(\"click\", async () => {",
    type: '보안',
    title: 'npm 설치 전 명시적 확인',
    body: '패키지 이름과 버전, 로컬 코드 실행 위험을 다시 보여 줍니다. 설치 스크립트를 막아도 패키지 본문은 실행되므로 확인 절차가 생략돼서는 안 됩니다.',
  },
  {
    sectionId: 'js-editor',
    file: 'src/js/js-editor.js',
    at: "function renderJsRunnable(context){",
    type: '구조',
    title: '실행 화면은 얇은 어댑터',
    body: '입력·출력·중지·채점 UI를 묶되 실제 실행·오류 해석·Worker 수명은 js-runtime.js로 넘깁니다. 신규 언어 지원이 문서 생명주기를 복제하지 않은 핵심 지점입니다.',
  },

  // ── editors ─────────────────────────────────────────
  {
    sectionId: 'office-replace',
    file: 'src/js/office-replace.js',
    at: "/* 행·열 한 동작을 document.xml 편집으로 만든다.",
    type: '설계',
    title: 'Word 와 PPT 의 유일한 차이',
    body:
      '두 형식은 문단·run·글자 태그가 이름공간만 다르고 구조가 같습니다(<w:p>/<w:r>/<w:t> ↔ <a:p>/<a:r>/<a:t>). 그래서 한 코어가 처리하고, 형식별로 갈리는 것은 "어느 파트를 어떻게 다루는가" 표인 이 함수뿐입니다.',
  },
  {
    sectionId: 'office-replace',
    file: 'src/js/office-replace.js',
    at: "const propsXml = propsMatch[2];",
    type: '설계',
    title: '평문에서 찾고 run 경계에서 되쓴다',
    body:
      'Word 는 한 낱말을 서식 때문에 여러 run 으로 쪼개 둡니다. 문단을 이어붙인 평문에서 찾은 뒤, 되쓸 때만 run 경계를 보고 첫 조각에 치환문을 넣고 겹친 나머지를 비웁니다. 결과적으로 치환문 전체가 첫 조각의 서식을 따르는데, 이는 의도된 절충입니다.',
  },
  {
    sectionId: 'office-replace',
    file: 'src/js/office-replace.js',
    at: "function officeSetWordPropertyAttributes(ownerXml, ownerName, propsName, childName, updates){",
    below: 1,
    type: '설계',
    title: '바꾼 파트만 갈아끼운 새 zip',
    body:
      '나머지 엔트리는 바이트 그대로 옮깁니다. zip 전체를 다시 만들면 건드리지 않은 이미지·글꼴이 재압축되며 파일이 미묘하게 달라지고, 원본과의 차이를 설명할 수 없게 됩니다.',
  },
  {
    sectionId: 'spreadsheet-viewer',
    file: 'src/js/spreadsheet-viewer.js',
    line: 1,
    type: '위험',
    title: '프로젝트 최대 파일 — 5,915줄',
    body:
      '시트 렌더링·수식 엔진·서식·필터·차트·저장이 한 파일에 있습니다. 이 리뷰 페이지에는 앞 4,000줄만 실렸습니다. 각 영역의 상호 의존이 약해 분할이 실제로 가능해 보이며, 분할 1순위 후보입니다.',
  },

  // ── learning ────────────────────────────────────────
  {
    sectionId: 'batch-replace',
    file: 'src/js/batch-replace.js',
    at: "function batchIsTargetDoc(doc, isTextSearchable, isLocked){",
    type: '안전',
    title: '저장 실패 시 화면도 바꾸지 않는다',
    body:
      '오피스 문서는 편집기가 없어서, 화면만 갱신하고 저장이 실패하면 "바뀐 줄 알았는데 파일은 그대로"가 됩니다. 여러 파일을 한꺼번에 바꾸는 기능에서 이 어긋남은 사용자가 되돌릴 방법이 없으므로, 저장 성공을 먼저 확인합니다.',
  },
  {
    sectionId: 'data-convert-ui',
    file: 'src/js/data-convert-ui.js',
    line: 1,
    type: '설계',
    title: '원본에 되쓰는 경로를 만들지 않았다',
    body:
      '변환은 손실이 있을 수 있으므로 결과는 항상 새 산출물(복사·저장·새 탭)로만 나갑니다. 기능을 막은 것이 아니라, 사용자가 원본을 잃을 방법 자체를 없앤 설계 결정입니다.',
  },
  {
    sectionId: 'app',
    file: 'src/js/app.js',
    line: 1,
    type: '구조',
    title: '마지막에서 두 번째로 로드되는 이유',
    body:
      '앞의 모든 기능이 정의된 뒤에 이벤트를 걸어야 합니다. manifest 는 file-loaders·notebook-cells·whiteboard·backup 네 개를 의존으로 지정해 각 계층의 마지막 파일을 하나씩 붙잡아 "전부 준비됨"을 표현합니다.',
  },

  // ── EXE ─────────────────────────────────────────────
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/launcher.cs',
    at: "if (path == \"/exam-receive-start\" || path == \"/exam-receive-stop\") return true;",
    type: '보안',
    title: 'npm 경로도 공통 인증 대상',
    body: '/js-npm-* 엔드포인트를 토큰 필요 접두사 목록에 묶었습니다. 새 하위 경로를 추가할 때 이 접두사 밖으로 새면 로컬 웹페이지가 설치·삭제 API를 호출할 수 있으므로 계약 테스트가 필요합니다.',
  },
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/launcher.cs',
    at: "byte[] bundle;",
    type: '보안',
    title: '설치 시작은 확인 헤더를 한 번 더 요구',
    body: '일반 토큰 외에 사용자가 설치 위험을 확인했다는 헤더를 검사합니다. 인증된 앱 화면에서의 오동작과 원치 않는 자동 설치를 구분하는 두 번째 문턱입니다.',
  },
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/npm_package_runner.js',
    at: "if (installedBytes > MAX_PROJECT_BYTES) throw new Error(\"설치 파일이 250MB 제한을 넘었습니다.\");",
    type: '위험',
    title: '250MB 상한은 설치 뒤에 확인된다',
    body: '캐시 결과가 제한을 넘으면 지우지만 npm이 다운로드·압축 해제하는 동안의 순간 디스크 사용량까지 사전에 막지는 못합니다. 신뢰하지 않는 패키지 설치에서 남는 자원 고갈 표면입니다.',
  },
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/npm_package_runner.js',
    at: "const install = cp.spawnSync(process.execPath, [npmCli, \"install\", \"--ignore-scripts\", \"--no-audit\", \"--no-fund\",",
    type: '보안',
    title: 'install·postinstall 스크립트 차단',
    body: 'npm install --ignore-scripts를 사용해 설치 단계의 임의 명령 실행을 줄입니다. 다만 완성된 패키지 본문은 Worker에서 실제 실행되므로 패키지 신뢰 문제 자체가 사라지는 것은 아닙니다.',
  },
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/npm_package_runner.js',
    at: "const installedBytes = folderBytes(stage);",
    type: '상한',
    title: '설치 크기는 사후 측정',
    body: 'node_modules를 만든 뒤 재귀 합계를 재고 250MB를 넘으면 실패시킵니다. 최종 캐시는 제한되지만 설치 도중의 임시 사용량은 별도입니다.',
  },
  {
    sectionId: 'launcher-js-npm',
    file: 'desktop/npm_package_runner.js',
    at: "esbuild.buildSync({",
    type: '호환성',
    title: 'Node 패키지를 browser IIFE로 변환',
    body: 'esbuild의 browser 플랫폼으로 Worker용 단일 번들을 만듭니다. Node 내장 모듈·DOM 전용 패키지·동적 로딩처럼 이 대상과 맞지 않는 패키지는 설치돼도 번들 또는 실행 단계에서 실패합니다.',
  },
  {
    sectionId: 'desktop-overview',
    file: 'desktop/launcher.cs',
    at: "const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000;",
    type: '보안',
    title: '실행마다 새로 만드는 토큰',
    body:
      'LocalAuthToken 은 프로세스 수명 동안만 유효합니다. 서빙하는 HTML 에 심어 브라우저에 전달하고, 위험한 엔드포인트는 이 값을 요구합니다. 같은 PC 의 다른 웹페이지가 로컬 API 를 부르는 것을 막는 핵심 자산입니다.',
  },
  {
    sectionId: 'desktop-overview',
    file: 'desktop/launcher.cs',
    at: "// 일반적인 수업용 데이터 분석은 허용하면서, 실수로 큰 배열을 반복 생성해 PC 전체가 멈추는 일을 줄인다.",
    type: '상한',
    title: '커널 셀만 10분인 이유',
    body:
      '지속형 커널은 프로세스가 살아 있어 일반 실행의 WaitForExit 제한을 타지 않습니다. 무한 실행은 막되 데이터 분석 셀은 일반 스크립트보다 길 수 있다는 판단으로 별도 상한을 뒀습니다. 상한 값에 근거가 적혀 있는 좋은 예입니다.',
  },
  {
    sectionId: 'launcher-security',
    file: 'desktop/launcher.cs',
    at: "return headers != null && headers.TryGetValue(\"X-ClassDock-Image-Memo\", out value) && value == \"1\";",
    below: 1,
    type: '보안',
    title: '상수 시간 비교',
    body:
      '길이 차이를 XOR 로 섞고 전체를 순회한 뒤 한 번에 판정합니다. 조기 반환이 없어 타이밍으로 토큰을 한 글자씩 알아내는 공격 표면을 줄입니다.',
  },
  {
    sectionId: 'launcher-security',
    file: 'desktop/launcher.cs',
    at: "// loopback에만 바인딩하더라도 DNS rebinding 등으로 다른 Host가 들어오는 요청은 받지 않는다.",
    type: '보안',
    title: 'DNS rebinding 차단',
    body:
      'loopback 에만 바인딩해도 다른 Host 헤더로 요청이 들어올 수 있습니다. IPv4 loopback 전용 서버이므로 Host 를 127.0.0.1/localhost 로 제한합니다. 로컬 서버에서 자주 빠뜨리는 방어입니다.',
  },
  {
    sectionId: 'launcher-security',
    file: 'desktop/launcher.cs',
    at: "return string.Equals(origin.Trim(), \"http://\" + host.Trim(), StringComparison.OrdinalIgnoreCase);",
    below: 1,
    type: '위험',
    title: '기본값이 "토큰 불필요" 인 구조',
    body:
      '토큰이 필요한 경로를 열거하는 방식이라, 새 엔드포인트를 추가하면서 여기 등록을 잊으면 인증 없이 열립니다. 실수의 방향이 위험한 쪽입니다. 기본을 "모두 필요"로 두고 공개 목록만 예외로 두는 편이 안전합니다.',
  },
  {
    sectionId: 'launcher-security',
    file: 'desktop/launcher.cs',
    at: "if (!HasAllowedLocalOrigin(headers) && !path.StartsWith(\"/tile-proxy\", StringComparison.Ordinal))",
    below: 1,
    type: '안전',
    title: '인증 실패 요청은 본문을 읽지 않는다',
    body:
      '인증 전에 큰 본문을 버퍼링하는 서버는 손쉬운 자원 소모 표적이 됩니다. 검증을 먼저 하고 실패하면 본문을 건너뛰는 순서가 맞습니다.',
  },
  {
    sectionId: 'launcher-boot',
    file: 'desktop/launcher.cs',
    at: "dir = Path.GetDirectoryName(dir);",
    below: 1,
    type: '설계',
    title: '랜덤 포트가 아닌 이유',
    body:
      'localStorage 는 origin(127.0.0.1:포트)별로 갈립니다. 매 실행 같은 포트로 떠야 테마·자동복원·탭 순서가 유지되므로, 첫 후보가 막혀도 랜덤이 아니라 다음 고정 후보로 결정적으로 떨어집니다. 같은 PC 는 재실행마다 같은 포트를 재사용합니다.',
  },
  {
    sectionId: 'launcher-boot',
    file: 'desktop/launcher.cs',
    at: "int remembered = ReadInstancePort();",
    below: 1,
    type: '동시성',
    title: '뮤텍스를 고른 이유',
    body:
      '포트 기록이 생기기 전 거의 동시에 두 프로세스가 뜨는 경쟁을 막습니다. 뮤텍스는 프로세스가 강제 종료돼도 OS 가 자동 해제하므로 별도 정리 코드가 필요 없습니다 — 정리 코드가 없는 것이 실수가 아니라 선택임이 주석에 남아 있습니다.',
  },
  {
    sectionId: 'launcher-boot',
    file: 'desktop/launcher.cs',
    at: "listener.Start();",
    type: '성능',
    title: 'TEMP 청소를 별도 스레드로',
    body:
      '지울 양이 수백 MB 일 수 있어 기동 경로에서 떼어 냈습니다. 첫 화면을 붙잡지 않으려는 처리이고, 실패해도 앱 기동에 영향을 주지 않습니다.',
  },
  {
    sectionId: 'launcher-save',
    file: 'desktop/launcher.cs',
    at: "WriteResponse(stream, \"200 OK\", \"text/plain; charset=utf-8\",",
    type: '위험',
    title: '경로가 헤더 문자열',
    body:
      'X-Save-Path 의 상대경로로 실제 디스크에 씁니다. 경로 탈출(..) 검증이 반드시 필요한 지점이고, 엔드포인트를 추가할 때마다 같은 검증을 되풀이해야 하는 구조입니다. 공통 정규화 함수로 모으면 누락 위험이 줄어듭니다.',
  },
  {
    sectionId: 'launcher-convert-sqlite',
    file: 'desktop/launcher.cs',
    at: "string json = SqlitePreview(body);",
    below: 9,
    type: '안전',
    title: '경로가 아니라 내용 해시로 확인',
    body:
      '최초 편집 활성화 때 브라우저가 연 파일의 SHA-256 과 디스크 파일이 일치해야 합니다. 경로만 믿으면 "화면에 띄운 DB"와 "고칠 DB"가 다를 수 있는데, 그 가능성을 구조로 없앴습니다.',
  },
  {
    sectionId: 'launcher-convert-sqlite',
    file: 'desktop/launcher.cs',
    at: "string json = SqliteDiskPreview(headers);",
    below: 17,
    type: '위험',
    title: '임의 SQL 실행 — .bak 이 유일한 안전망',
    body:
      'SELECT 뿐 아니라 DDL/DML 을 단일 트랜잭션으로 실행합니다. 수정 계열이면 같은 폴더에 .bak 을 남기는 것이 유일한 되돌릴 길이므로, 백업 생성에 실패했을 때의 동작이 무엇인지가 중요합니다.',
  },
  {
    sectionId: 'launcher-terminal-kernel',
    file: 'desktop/launcher.cs',
    at: "else if (method == \"GET\" && path.StartsWith(\"/python-session-poll\", StringComparison.Ordinal))",
    below: 1,
    type: '위험',
    title: '사실상 로컬 셸',
    body:
      '지속형 PowerShell 세션을 여는 엔드포인트입니다. 이 앱에서 가장 강력한 기능이고, 토큰 검증이 이 경로에서 실수로 빠지면 피해가 가장 큽니다. 변경 시 우선순위를 가장 높게 둬야 하는 지점입니다.',
  },
  {
    sectionId: 'launcher-python',
    file: 'desktop/launcher.cs',
    at: "string json = RunPython(body);",
    type: '보안',
    title: '임의 Python 실행의 입구',
    body:
      '작업폴더를 만들고 프로세스를 띄웁니다. 토큰이 유일한 경계이므로, 토큰 생성·전달 경로(launcher.cs:120 → HTML 주입 → state-sync.js 의 fetch 래핑)가 이 앱의 보안 축입니다.',
  },
  {
    sectionId: 'launcher-exam-lan',
    file: 'desktop/launcher.cs',
    at: "try { ok = EnsureJedi(); } catch { ok = false; }",
    type: '위험',
    title: 'LAN 노출은 여기서 시작된다',
    body:
      '앱 서버는 loopback 전용이지만 이 리스너는 다른 PC 가 접근합니다. 즉 Host·Origin 검증이 그대로 적용되지 않으므로 이 경로의 입력 검증과 6자리 코드의 시도 횟수 제한을 따로 확인해야 합니다.',
  },

  // ── 빌드·테스트 ─────────────────────────────────────
  {
    sectionId: 'tool-build-offline',
    file: 'build-offline.js',
    at: "const sha384 = (bytes) => \"sha384-\" + crypto.createHash(\"sha384\").update(bytes).digest(\"base64\");",
    type: '함정',
    title: '</script 이스케이프',
    body:
      '소스 문자열 안의 "</script" 를 그대로 인라인하면 HTML 이 그 지점에서 조기 종료됩니다. 인라인 빌드에서 반드시 물리는 고전적 함정이고, esc() 한 줄로 처리했습니다.',
  },
  {
    sectionId: 'tool-build-offline',
    file: 'build-offline.js',
    at: "const actual = raw === item.sha384 ? raw : sha384(normalizedTextBytes(bytes));",
    type: '함정',
    title: '해시를 두 번 계산하는 이유',
    body:
      '원본 바이트로 계산한 해시가 맞지 않으면 CRLF→LF 로 정규화한 바이트로 다시 계산합니다. Windows 체크아웃에서 텍스트 vendor 의 줄바꿈이 바뀌는 문제를 흡수하려는 처리이며, 같은 로직이 check-release.js 와 release-contract.test.js 에도 복제돼 있습니다.',
  },
  {
    sectionId: 'tool-check-release',
    file: 'tools/check-release.js',
    at: "function executableScriptSources(markup) {",
    type: '설계',
    title: '실행되는 script 만 골라낸다',
    body:
      'executableScriptSources 가 script 태그를 직접 파싱해 src 가 있는 것만 모읍니다. 지연 vendor 는 text/plain 블록이라 실행되지 않으므로 이 검사에서 제외돼야 하는데, 그 구분을 태그 파싱으로 해결했습니다.',
  },
  {
    sectionId: 'tests-contract',
    file: 'tests/release-contract.test.js',
    at: "const jsGuide = fs.readFileSync(path.join(root, \"docs\", \"JS-파일별-기능.md\"), \"utf8\");",
    type: '설계',
    title: '문서를 테스트가 읽는다',
    body:
      'docs/JS-파일별-기능.md 를 문자열로 읽어 manifest 의 모든 파일이 등재됐는지 확인합니다. 문서 최신성을 사람의 성실함이 아니라 테스트로 강제하는 방식이고, 실제로 그 문서가 지금도 정확한 이유입니다.',
  },
  {
    sectionId: 'tests-contract',
    file: 'tests/release-contract.test.js',
    at: "test(\"배포 라이브러리는 로컬 고정본과 SHA-384 무결성 값을 사용한다\", () => {",
    type: '계약',
    title: 'vendor 고정본 4중 검사',
    body:
      'src 가 vendor/ 로 시작하는지, sha384 형식이 맞는지, 실제 파일 해시가 같은지, lazy 여부에 따라 HTML 태그가 있어야 하는지/없어야 하는지를 한 번에 봅니다. 마지막에는 HTML 에 http(s) script 가 없는지도 확인합니다.',
  },
];

window.MN_REVIEW_COMMENTS = [...makeFileOverviewComments(), ...targetedComments];
