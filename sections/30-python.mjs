// 3. python-and-notebooks — Python 편집·실행과 Jupyter 노트북.

export default ({ manifest, helpers }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'python-and-notebooks');

  return [
    sec({
      id: 'python-overview',
      category: '3. python·notebooks',
      group: '계층 개요',
      title: 'python·notebooks 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 코드를 실제로 돌리는 계층`,
      summary:
        '이 계층은 "브라우저 안에서 파이썬을 진짜로 돌린다"는 요구를 감당합니다. 실행 백엔드가 두 개(EXE 로컬 Python, 브라우저 Pyodide)이고, ' +
        '실행 단위도 두 개(단일 .py 파일, 노트북 셀)라서 조합만 네 가지입니다. 그 네 갈래를 python-runtime.js 가 흡수하고, ' +
        '나머지 파일이 편집기·실행 문맥·터미널·노트북 모델/화면으로 나뉩니다.',
      usage: [
        {
          title: '가장 깊은 의존 사슬',
          body:
            'code-viewer.js → python-editor.js → python-run-context.js → python-runtime.js → python-terminal.js. ' +
            '앱 전체에서 가장 긴 선형 의존 체인이며, 아래로 갈수록 "실행 환경"에 가까워집니다.',
        },
        {
          title: '노트북의 3층 구조',
          body:
            'notebook-model.js(DOM 없는 모델·직렬화) → notebook-tools.js(작업공간·커널 통신) → notebook-run.js(화면·도구막대) + notebook-cells.js(셀 UI). ' +
            '모델을 DOM 과 분리해 tests/notebook-serialize.test.js 로 왕복 검증이 가능합니다.',
        },
        {
          title: '백엔드 판정',
          body:
            'python-run-context.js 가 _pyBackend 캐시로 로컬 Python 가용 여부를 기억하고, 없으면 Pyodide(0.27.7)로 갑니다. ' +
            'EXE 는 vendor/pyodide/ 를 로컬 서빙하고, 그것도 없으면 CDN 으로 폴백합니다.',
        },
      ],
      features: [
        { title: '실행 모드 5종', body: '일반 실행, 과제 자동채점(gradeTests), 진단(diagnose), 추적(trace), 노트북 셀(cellMode).' },
        { title: '옆 파일 함께 실행', body: '열린 프로젝트 파일을 번들로 묶어 import 가 되게 합니다. 합계 상한 50MB, 초과 시 단일 파일 실행.' },
        { title: '공유 터미널', body: '앱에 터미널을 하나만 두고 열린 .py 문서들이 세션·변수·명령 기록을 공유합니다.' },
        { title: '한글 그래프', body: 'vendor/korean-font.js 의 NanumGothic 을 Pyodide 파일시스템에 넣어 Matplotlib 한글이 깨지지 않게 합니다. 글꼴은 파이썬을 처음 돌릴 때 MNLazy 의 kfont 묶음으로 싣습니다.' },
      ],
      files: [
        { path: 'src/js/python-run-context.js', label: 'python-run-context.js (상수)', range: [1, 60], description: '백엔드 판정과 실행 상한' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '노트북 모델을 DOM 과 분리해 .ipynb 왕복을 단위 테스트로 덮었습니다. 직렬화 포맷을 다루는 코드에서 가장 중요한 안전장치입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '백엔드 2종 × 실행 단위 2종의 조합이 자동 테스트로 완전히 덮이지 않습니다. tests/python-kernel.test.js 는 환경에 따라 제외될 수 있다고 문서에 명시돼 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'Pyodide 최초 실행과 패키지 설치에는 인터넷이 필요합니다. "완전 오프라인"이라는 앱의 성격에서 유일하게 예외인 지점입니다.',
        },
      ],
    }),

    mod('python-snippets.js', {
      title: 'python-snippets.js — 예제 갤러리와 import 색인',
      subtitle: '대부분 예제 데이터',
      summary:
        'Python 예제 갤러리와 난이도·검색 필터, 예제 열기를 담당하고, 로컬 Python 의 import 색인과 자동완성 후보를 미리 준비합니다. ' +
        '수업용 도구답게 "빈 화면에서 시작하지 않게" 하는 것이 목적입니다.',
      features: [
        { title: '난이도 필터', body: '학습 단계에 맞춰 예제를 거릅니다.' },
        { title: 'import 색인', body: 'EXE 의 /python-import-index 로 로컬 환경의 모듈 목록을 받아 자동완성 후보로 씁니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '1,671줄 중 대부분이 예제 코드 문자열입니다. 로직 비중은 낮아 실제 리뷰 부담은 줄 수보다 훨씬 작습니다.',
        },
      ],
    }),

    mod('python-editor.js', {
      title: 'python-editor.js — 자체 코드 편집기',
      subtitle: 'CodeMirror 없이 직접 구현',
      summary:
        '외부 편집기 라이브러리 없이 줄번호·구문 강조·자동 들여쓰기·찾기 바꾸기·자동완성·다중 캐럿·셀 경계·오류 줄·정의 이동을 직접 구현했습니다. ' +
        '여기에 열 편집(Alt+세로 드래그)의 사각 선택과 전용 클립보드, 코드 따라치기 엔진, 줄 번호로 이동 미니 창, ' +
        '우클릭 상황 메뉴, contenteditable 자리용 attachEditableContextMenu 까지 들어 있습니다.',
      usage: [
        {
          title: '왜 직접 만들었는가',
          body:
            'CodeMirror·Monaco 를 넣으면 단일 오프라인 HTML 용량이 크게 늘고, 지연 로드 대상이 하나 더 생깁니다. ' +
            '또 한국어 IME·특수문자 문자표·따라치기처럼 이 앱 고유의 요구가 많아 통제권을 가져간 것으로 보입니다.',
        },
        {
          title: '순수 로직은 core.js 에',
          body:
            'diffTextEdit, remapTextRangesAfterEdit, 캐럿 상태, 괄호 자동 닫기 계획, 자동완성 삽입 계획 같은 계산은 core.js 에 있고 이 파일은 DOM 배선을 맡습니다. ' +
            '그래서 편집기 로직이 tests/python-editor-*.test.js 들로 검증됩니다.',
        },
        {
          title: 'contenteditable 재사용',
          body: 'attachEditableContextMenu 가 표 셀·메모 블록 같은 contenteditable 자리에 같은 우클릭 메뉴를 붙입니다. mnote·scratchpad·spreadsheet 가 이것을 씁니다.',
        },
      ],
      features: [
        { title: '열 편집', body: 'Alt+세로 드래그 사각 선택과 그 전용 클립보드(복사·잘라내기·붙여넣기).' },
        { title: '다중 캐럿', body: '같은 식별자 동시 편집을 지원합니다.' },
        { title: '따라치기', body: '교본 위에 그대로 쳐 보며 오타를 표시하고 진행률·정확도를 냅니다.' },
        { title: '실시간 진단', body: '입력을 묶어(debounce) 진단을 돌리고 최신 결과만 반영합니다.' },
        { title: '정의 이동', body: '로컬 정의와 import 된 모듈 정의를 찾아 읽기 전용 분할 뷰어로 엽니다.' },
      ],
      files: [
        { path: 'tests/python-editor-word-select.test.js', label: 'word-select.test.js', description: 'F3 단어 선택' },
        { path: 'tests/python-editor-completion.test.js', label: 'completion.test.js', description: '자동완성 닫기·응답 무효화' },
        { path: 'tests/python-editor-jump-down.test.js', label: 'jump-down.test.js', description: '문서 끝 빈 줄·들여쓰기 유지' },
        { path: 'tests/python-live-diagnostics.test.js', label: 'live-diagnostics.test.js', description: '진단 입력 묶기·최신 결과' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '편집기를 직접 만들면서 순수 계산을 core.js 로 밀어낸 구조가 좋습니다. 자체 편집기는 보통 테스트가 불가능해지는데, 여기서는 편집 로직 다수가 단위 테스트로 덮여 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '자동완성 "응답 무효화"를 테스트로 고정했습니다. 비동기 자동완성에서 오래된 응답이 늦게 도착해 덮어쓰는 문제를 정확히 겨냥한 검증입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '3,181줄에 편집기 코어와 따라치기·열 편집·우클릭 메뉴가 함께 있습니다. JavaScript 편집기도 이 파일의 공용 편집기와 저장 도구를 재사용하므로 변경 파급 범위가 한 계층 더 넓어졌습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '자체 편집기라 접근성(스크린 리더, 고대비, 키보드 전용 조작)의 책임을 전부 떠안습니다. 이 부분에 대한 테스트는 보이지 않습니다.',
        },
      ],
    }),

    mod('python-run-context.js', {
      title: 'python-run-context.js — 실행 문맥과 경로 계산',
      subtitle: '실행 언어 판정·작업폴더·프로젝트 루트·번들 구성',
      summary:
        '.py와 .js/.mjs 중 어느 실행기를 붙일지도 판정하고, 함께 연 프로젝트 파일을 Python 실행 번들로 구성해 작업 폴더·프로젝트 루트·상대 경로·import·출력 파일 경로를 계산합니다. ' +
        '"내 PC 에서 되던 상대 경로가 브라우저에서도 되게" 만드는 것이 이 파일의 존재 이유입니다.',
      usage: [
        {
          title: '실행 백엔드 캐시',
          body: '_pyBackend(null=미확인 / true·false)와 _localPyConfirmed(세션당 1회 동의)로 로컬 Python 사용 여부를 기억합니다.',
        },
        {
          title: '번들 상한',
          body: 'RUN_BUNDLE_CAP 50MB. 옆 파일을 함께 넣다가 이 값을 넘으면 단일 파일 실행으로 떨어집니다.',
        },
        {
          title: '압축 안에서 실행',
          body: 'extractZipAll 로 압축 전체를 {path, bytes}[] 로 다시 뽑아 실행 작업 폴더를 복원합니다. 디렉터리와 맥 메타데이터는 제외합니다.',
        },
      ],
      features: [
        { title: 'import 루트 추론', body: 'core.js 의 inferPythonLocalImportRoots 로 sys.path 에 넣을 폴더를 정합니다.' },
        { title: '간접 경로', body: 'import 된 모듈이 쓰는 상대 출력 폴더까지 번들에 포함합니다(tests/python-indirect-path.test.js).' },
        { title: '출력 파일 회수', body: '실행이 만든 파일을 실행 후 수집해 사용자에게 돌려줍니다.' },
      ],
      files: [
        { path: 'tests/python-path-helper.test.js', label: 'python-path-helper.test.js', description: '경로 도우미·작업공간 번들' },
        { path: 'tests/python-indirect-path.test.js', label: 'python-indirect-path.test.js', description: '간접 출력 폴더 포함' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"import 된 모듈이 쓰는 출력 폴더까지 번들에 넣는다"는 케이스를 테스트로 잡아 뒀습니다. 실제 수업에서 학생이 부딪히는 종류의 문제를 겨냥한 검증입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'Pyodide 버전(0.27.7)이 코드 상수로 박혀 있습니다. vendor/pyodide/VERSION 과 어긋나면 로컬 서빙과 CDN 폴백이 다른 버전을 가리킬 수 있습니다.',
        },
      ],
    }),

    mod('python-runtime.js', {
      title: 'python-runtime.js — 실행 총괄',
      subtitle: '5개 실행 모드와 스트리밍 출력',
      summary:
        '실행의 총괄 지점입니다. 백엔드(로컬 Python / Pyodide)를 고르고 패키지를 준비하고, 표준입력을 받고, 출력을 스트리밍하고, 중지·진단·단계 실행을 처리하고, ' +
        '실행이 만든 결과 파일을 수집합니다. runPythonSource 하나가 일반 실행·채점·진단·추적·노트북 셀 다섯 모드를 분기합니다.',
      usage: [
        {
          title: '모드 분기',
          body:
            'gradeTests 가 있으면 채점, diagnoseMode 면 진단 하네스로 소스를 감싸고, traceMode 면 추적 하네스, notebookCells 면 셀 모드입니다. ' +
            '채점·진단·추적 중에는 셀 모드가 꺼집니다.',
        },
        {
          title: '하네스 주입',
          body:
            '진단·추적은 학생 코드를 그대로 돌리지 않고 buildPythonDiagnosticHarness 등으로 감싸서 실행합니다. 오류 위치를 원본 줄 번호로 되돌리는 보정이 함께 필요합니다.',
        },
        {
          title: '한글 폰트 주입',
          body:
            'Pyodide 경로에서 koreanFontGzB64 가 MNLazy.tryNeed("kfont") 로 vendor/korean-font.js 를 그때 싣고, ' +
            '그 데이터를 파일시스템에 써 넣어 Matplotlib 폰트로 등록합니다. 메인 스레드 Pyodide 와 워커 초기화 두 곳이 같은 함수를 부릅니다.',
        },
      ],
      features: [
        { title: '스트리밍 출력', body: 'EXE 는 폴링으로, Pyodide 는 콜백으로 출력을 흘려보냅니다. 긴 실행에서도 중간 출력이 보입니다.' },
        { title: '중지', body: '실행 중지를 지원합니다. 백엔드마다 방식이 달라 별도 처리가 필요합니다.' },
        { title: 'stderr 분류', body: 'core.js 의 classifyPythonStderr 로 경고와 실패를 구분해 표시합니다.' },
        { title: '오류 설명', body: 'explainPythonError 가 흔한 예외를 한국어로 풀어 설명합니다. 수업용 도구다운 기능입니다.' },
        { title: '그래프 확대', body: 'image-lightbox.js 와 연결돼 결과 그래프를 클릭하면 큰 창으로 봅니다.' },
      ],
      files: [
        { path: 'tests/python-stderr-classify.test.js', label: 'stderr-classify.test.js', description: '경고·실패 분류' },
        { path: 'tests/python-autosave.test.js', label: 'python-autosave.test.js', description: '자동 저장 기본 꺼짐·설정 이어받기' },
        { path: 'tests/python-local-detect.test.js', label: 'python-local-detect.test.js', description: '로컬 파이썬 탐색과 Store 가짜 실행 파일 제외' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'Python 예외를 한국어로 설명하는 기능(explainPythonError)이 있습니다. 교육용 도구에서 실제로 학습 효과가 큰 부분이고, 순수 함수라 core.js 에서 테스트됩니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '한글 글꼴(약 0.9MB, 앱 코드 중 가장 큰 파일)을 시작 로드에서 빼 kfont 지연 묶음으로 옮겼습니다. .txt 하나를 열어도 함께 파싱하던 비용이 사라졌습니다. ' +
            'tryNeed 로 실어 글꼴을 못 실어도 파이썬은 그대로 돌고 한글 라벨만 깨지게 했고, 예전에 선언이 없던 python-runtime.js → lazy.js 의존도 manifest 에 들어갔습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'Windows Store 의 가짜 python.exe(실행하면 스토어를 여는 스텁)를 걸러 내는 처리를 테스트로 고정했습니다. 실환경에서 반드시 만나는 함정입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'runPythonSource 하나에 5개 모드가 플래그로 분기합니다. 모드가 더 늘면 조합 폭발이 생기고, 이미 "채점 중에는 셀 모드를 끈다" 같은 암묵 규칙이 코드에 섞여 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'Python 자동 저장이 기본 꺼짐입니다. 안전한 기본값이지만, 실행 결과가 파일을 만드는 경우 사용자가 저장 상태를 헷갈릴 수 있습니다.',
        },
      ],
    }),

    mod('python-terminal.js', {
      title: 'python-terminal.js — 공유 터미널',
      subtitle: '앱 전체에 하나뿐인 세션',
      summary:
        '결과/터미널 전환, 명령 기록·중지·초기화를 담당하고, EXE 에서는 지속형 로컬 PowerShell 세션을, 브라우저에서는 상태가 유지되는 Pyodide 콘솔을 같은 UI 로 제공합니다. ' +
        'sharedPythonTerminal() 로 앱에 하나만 만들고 각 문서는 자기 터미널 버튼만 attach·detach 합니다.',
      usage: [
        {
          title: '왜 하나만 두는가',
          body:
            '열린 파이썬 파일들이 세션·변수·명령 기록을 함께 쓰게 하기 위해서입니다. 파일마다 터미널을 두면 변수 상태가 갈라져 수업 흐름이 끊깁니다.',
        },
        {
          title: '작업 폴더 규칙',
          body:
            '다른 파일에서 열면 그 파일 폴더로 자동 이동(Set-Location)하고, 같은 파일에서 다시 열면 사용자가 직접 옮긴 폴더를 유지합니다. ' +
            '"자동 편의"와 "사용자 의도 존중"을 구분한 규칙입니다.',
        },
        {
          title: '정리 시점',
          body: '마지막 파이썬 문서가 닫히면 잠깐 뒤에 셸과 전역 단축키를 정리합니다. 새로고침으로 잠시 사라지는 경우를 대비한 지연입니다.',
        },
      ],
      features: [
        { title: 'attach/detach', body: '문서별로 버튼만 등록·해제하고 세션은 공유합니다.' },
        { title: '자동완성', body: 'EXE 의 /terminal-complete 로 셸 자동완성을 지원합니다.' },
        { title: '중단', body: 'tests/e2e/terminal-interrupt.spec.js 가 실행 중단 흐름을 검증합니다.' },
      ],
      files: [{ path: 'tests/python-terminal-shared.test.js', label: 'python-terminal-shared.test.js', description: '공유 터미널 attach/detach 계약' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"다른 파일에서 열면 폴더를 옮기고, 같은 파일이면 사용자가 옮긴 폴더를 유지한다"는 규칙이 세심합니다. 자동화가 사용자 의도를 덮어쓰지 않도록 경계를 그었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '지속형 PowerShell 세션은 사실상 로컬 셸입니다. 로컬 서버 토큰으로 보호되지만, 이 앱에서 보안상 가장 강력한 기능이므로 엔드포인트 검증이 느슨해지면 영향이 큽니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '전역 단일 인스턴스라 문서별 상태가 없습니다. 여러 프로젝트를 동시에 다루면 작업 폴더가 오갈 수 있습니다.',
        },
      ],
    }),

    mod('notebook-model.js', {
      title: 'notebook-model.js — .ipynb 모델과 직렬화',
      subtitle: 'DOM 비종속·Python/JavaScript 언어 판정',
      summary:
        '.ipynb(nbformat 4) 파싱·직렬화, 셀·출력 모델, 복구본·자동 저장, 실행 상태 해시, 셀 추가·삭제·이동을 담당합니다. ' +
        'DOM 을 쓰지 않아 단위 테스트가 가능하고, 저장 포맷을 중간 형식으로 바꾸지 않고 .ipynb 를 직접 다룹니다.',
      usage: [
        {
          title: '.ipynb 직접 사용',
          body:
            '자체 포맷을 만들지 않고 nbformat 4 를 그대로 씁니다. 기존 출력·첨부와 새 실행 결과를 함께 보존하므로 Jupyter 로 열어도 그대로입니다.',
        },
        {
          title: '실행 상태 해시',
          body: '셀 내용이 바뀌었는지 해시로 판정해 "실행 결과가 지금 코드와 맞는지"를 표시합니다.',
        },
      ],
      features: [
        { title: '왕복 안정성', body: 'tests/notebook-serialize.test.js 가 파싱 → 직렬화 왕복에서 정보가 손실되지 않는지 검사합니다.' },
        { title: '되돌리기', body: 'MNEditHistory 소비자. notebook 상한은 24단계이고 총 바이트 상한도 함께 겁니다.' },
        { title: '자동 저장·복구', body: '작업 중 스냅샷을 남겨 비정상 종료 후 되살립니다.' },
        { title: '노트북 언어', body: '.ipynb metadata의 kernelspec·language_info를 읽어 Python 또는 JavaScript 실행 경로를 정합니다.' },
      ],
      files: [{ path: 'tests/notebook-serialize.test.js', label: 'notebook-serialize.test.js', description: 'ipynb 왕복·셀·출력·첨부' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '자체 포맷 대신 .ipynb 를 직접 다루는 선택이 옳습니다. 학생이 만든 파일을 다른 도구에서 열 수 있어야 교육용으로 의미가 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '되돌리기 상한에 개수뿐 아니라 총 바이트를 함께 건 것이 적절합니다. 출력 이미지가 든 셀은 한 단계가 수 MB 가 될 수 있습니다.',
        },
      ],
    }),

    mod('notebook-tools.js', {
      title: 'notebook-tools.js — 노트북 작업공간과 커널 통신',
      subtitle: '작업공간 번들과 Python 셀 커널 제어',
      summary:
        '노트북 실행 작업공간과 파일 번들을 만들고, 로컬 셀 커널 선택·시작·중지와 커널 통신을 담당합니다. ' +
        '로컬 Python 이 없을 때의 설치 안내도 여기서 다룹니다. 실제 커널 프로세스는 desktop/python_kernel.py 입니다.',
      usage: [
        {
          title: '작업공간 번들 캐시',
          body: '_nbWorkspacePromise 로 압축 추출을 문서당 한 번만 수행합니다. 셀을 여러 번 실행해도 다시 풀지 않습니다.',
        },
        {
          title: '커널이 필요한 이유',
          body: '셀 사이에 변수 상태가 이어져야 노트북입니다. 매 셀을 새 프로세스로 돌리면 노트북이 아니라 스크립트 실행이 됩니다.',
        },
      ],
      features: [
        { title: '커널 수명 관리', body: '시작·중지와 상태 표시를 관리합니다. EXE 의 /python-kernel-* 엔드포인트를 씁니다.' },
        { title: '설치 안내', body: '로컬 Python 이 없으면 안내로 유도합니다.' },
      ],
      files: [
        { path: 'desktop/python_kernel.py', label: 'python_kernel.py', description: 'EXE 가 띄우는 실제 커널 프로세스' },
        { path: 'tests/python-kernel.test.js', label: 'python-kernel.test.js', description: '셀 간 상태 유지(환경에 따라 제외 가능)' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            'python-kernel.test.js 는 로컬 Python 이 있어야 도는 테스트라 CI 환경에 따라 건너뛸 수 있습니다. 즉 커널 경로는 항상 검증된다고 보기 어렵습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '커널은 EXE 전용입니다. 브라우저에서는 Pyodide 콘솔이 상태 유지 역할을 대신합니다.',
        },
      ],
    }),

    mod('notebook-run.js', {
      title: 'notebook-run.js — 노트북 화면과 도구막대',
      subtitle: '전체 실행·저장·목차·찾기·JS 라이브러리',
      summary:
        '노트북 전체 화면과 상단 도구막대를 만들고 셀 렌더링, 전체 실행, 저장, 목차, 찾기, 출력 메뉴, 커널 상태 UI 를 연결합니다. ' +
        'JavaScript 노트북이면 라이브러리 선택 버튼을 붙이고 선택이 바뀔 때 기존 Worker 커널을 재시작합니다. ' +
        '모델(notebook-model)과 셀 UI(notebook-cells) 사이의 조립 지점입니다.',
      features: [
        { title: '전체 실행', body: '셀을 순서대로 실행하며 중간 실패 처리를 합니다.' },
        { title: '목차', body: '마크다운 헤딩으로 목차를 만듭니다.' },
        { title: '찾기', body: 'MNSearchHistory 의 노트북 구획을 씁니다.' },
        { title: '커널 상태', body: '커널 연결·실행 중 표시를 도구막대에 노출합니다.' },
        { title: 'JavaScript 라이브러리', body: '문서별 내장·npm·내 파일 선택을 JavaScript 일반 실행과 같은 저장 형식으로 공유합니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '이 파일은 조립 담당이라 자체 로직이 적습니다. 노트북 관련 변경은 대부분 model 또는 cells 쪽에서 시작합니다.',
        },
      ],
    }),

    mod('notebook-pdf-export.js', {
      title: 'notebook-pdf-export.js — 노트북 PDF 내보내기',
      subtitle: 'A4 페이지 분할과 리치 출력 스냅샷',
      summary:
        '노트북을 A4 PDF 로 내보냅니다. 셀 경계를 고려한 페이지 분할, 캔버스 배치, 지도·iframe 같은 리치 출력의 스냅샷 처리를 담당합니다. ' +
        '화면 캡처 라이브러리는 MNLazy 의 capture 묶음으로 지연 로드합니다.',
      features: [
        { title: '셀 경계 분할', body: '셀 중간에서 페이지가 끊기지 않도록 배치합니다.' },
        { title: '리치 출력', body: 'iframe·지도처럼 그대로 인쇄되지 않는 출력을 이미지로 떠서 넣습니다.' },
      ],
      files: [{ path: 'tests/pdf-layout.test.js', label: 'pdf-layout.test.js', description: '레이아웃·폭 계산' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '캡처 라이브러리를 지연 로드로 둔 판단이 맞습니다. PDF 내보내기는 자주 쓰지 않는 기능인데 라이브러리는 무겁습니다.',
        },
      ],
    }),

    mod('notebook-cells.js', {
      title: 'notebook-cells.js — 셀 UI',
      subtitle: 'Python·JavaScript 코드와 마크다운·Raw 셀',
      summary:
        '개별 코드·마크다운·Raw 셀의 UI, 셀 실행·입력, 선택·복사·붙여넣기, 드래그 순서 변경, 접기, 메모 보내기와 셀 도구 버튼을 담당합니다. ' +
        '셀 편집기는 python-editor.js 를 재사용하되 노트북 metadata가 JavaScript이면 JS 자동완성·강조·Worker 커널을 선택하고, 맞춤법은 MNKoreanSpellcheck 를 씁니다.',
      features: [
        { title: '셀 타입 3종', body: '코드·마크다운·Raw. 마크다운 셀은 렌더/편집 전환을 합니다.' },
        { title: '드래그 정렬', body: '셀 순서를 드래그로 바꿉니다. 되돌리기 대상입니다.' },
        { title: '메모 보내기', body: '셀을 임시 메모(scratchpad)로 보냅니다. 수업 중 스크랩 흐름입니다.' },
        { title: '되돌리기', body: 'tests/e2e/notebook-undo.spec.js 가 셀 작업 되돌리기·다시 실행을 화면 수준에서 검증합니다.' },
        { title: '언어별 실행', body: 'Python은 로컬 커널/Pyodide, JavaScript는 문서별 지속형 Worker 커널로 보냅니다.' },
      ],
      files: [{ path: 'tests/e2e/notebook-undo.spec.js', label: 'notebook-undo.spec.js', description: '셀 되돌리기 화면 흐름' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '셀 편집기로 python-editor.js 를 그대로 재사용합니다. 편집 경험이 파일 편집과 노트북에서 동일해집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'scratchpad.js 로 셀을 보내는 경로가 있어 learning-tools 계층과 양방향으로 얽힙니다. 계층 순서상 notebook-cells 가 먼저라 scratchpad 쪽에서 훅을 겁니다.',
        },
      ],
    }),
  ];
};
