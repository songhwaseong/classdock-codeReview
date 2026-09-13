// 개요 — 프로젝트 전체 구조와, 이 프로젝트를 읽을 때 먼저 알아야 할 계약들.

import { anchoredRange, largestScriptsLabel, linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, diagrams, rootDir }) => {
  const { sec } = helpers;
  // 큰 파일 목록은 순위가 자주 바뀐다 — 적어 두지 않고 생성 때 고른다.
  const biggestFiles = largestScriptsLabel(rootDir, manifest, 4);
  // manifest 안의 구간도 줄 번호로 적지 않는다 — 파일이 늘면 그대로 어긋난다(실제로 어긋났다).
  const manifestRange = (from, to) => anchoredRange(rootDir, 'scripts.manifest.json', { from, to, after: -1 }) ?? undefined;
  const whiteboardNow = linesLabel(rootDir, 'src/js/whiteboard.js');
  const lazyCount = manifest.vendorScripts.filter((item) => item.lazy).length;
  const layerCount = manifest.applicationLayers.length;
  const dependencyCount = Object.keys(manifest.scriptDependencies ?? {}).length;
  // 가장 큰 계층은 기능이 붙을 때마다 바뀐다. 숫자를 적어 두면 반드시 낡으므로 매니페스트에서 고른다.
  const biggestLayer = manifest.applicationLayers.reduce((largest, layer) =>
    layer.scripts.length > largest.scripts.length ? layer : largest,
  );

  return [
    sec({
      id: 'project-map',
      category: '개요',
      group: '전체 구조',
      title: '프로젝트 구조',
      subtitle: '단일 HTML 앱 + C# 로컬 서버 + 오프라인 vendor',
      summary:
        'ClassDock 은 번들러도 프레임워크도 쓰지 않습니다. classdock.html 한 장이 src/js 의 전역 스크립트 ' +
        `${manifest.localScripts.length}개를 정해진 순서로 부르고, 무거운 문서 라이브러리는 vendor/ 에 고정본으로 두고 필요할 때만 불러옵니다. ` +
        '여기에 desktop/launcher.cs 가 만드는 127.0.0.1 로컬 서버를 얹으면 브라우저가 못 하는 일(실제 디스크 저장, 로컬 Python, PowerPoint 변환)이 열립니다. ' +
        '즉 "브라우저만으로 되는 것"과 "EXE 가 있어야 되는 것"의 이중 경로가 이 코드베이스 전체를 관통하는 가장 큰 축입니다.',
      usage: [
        {
          title: '소스의 원본',
          body:
            'src/js/*.js 와 src/styles.css 가 원본입니다. classdock-offline.html 과 desktop/app.html 은 생성물이라 직접 고치지 않습니다. ' +
            'vendor/korean-font.js 도 vendor/NanumGothic.ttf 에서 만든 파생물입니다.',
        },
        {
          title: '모듈 시스템 없음',
          body:
            'import/export 가 없는 전역 스크립트입니다. 그래서 "이름 충돌"과 "로딩 순서"가 곧 아키텍처이고, scripts.manifest.json 이 그 계약을 문서가 아니라 데이터로 들고 있습니다.',
        },
        {
          title: '의존성 최소화',
          body:
            'package.json 의 런타임 의존성은 맞춤법 사전 관련 2개뿐이고, devDependencies 는 Playwright 와 esbuild 2개입니다. ' +
            '앱이 기본 제공하는 라이브러리(PDF.js, exceljs, JSZip, Pyodide, JavaScript 연습용 4종)는 vendor/ 에 버전 고정 파일로 들어 있습니다. ' +
            '사용자가 EXE에서 고르는 npm 패키지만 별도 캐시에 설치합니다.',
        },
        {
          title: '테스트',
          body:
            'node --test 로 도는 단위·계약 테스트 94개와 Playwright 화면 흐름 테스트 36개가 있습니다. ' +
            '테스트 러너도 외부 프레임워크 없이 Node 내장 러너를 씁니다.',
        },
      ],
      features: [
        {
          title: '다중 문서 워크스페이스',
          body:
            'documents.js 가 탭·사이드바·그룹 트리·활성 문서 전환·분할 작업을 총괄합니다. 파일 하나를 여는 앱이 아니라 폴더째 열어 두고 오가는 작업대에 가깝습니다.',
        },
        {
          title: '형식별 뷰어·편집기',
          body:
            'PDF, Word, Excel, PowerPoint, HWP, 이미지, 영상, 자막, Python, JavaScript, Jupyter, SQLite 를 각각의 모듈이 맡습니다. viewer-base.js 와 file-loaders.js 가 공통 진입점입니다.',
        },
        {
          title: '수업 도구',
          body:
            '과제 패키지(.task/.taskdone), 시험지(.exam/.examkey/.examdone), 수업 리플레이(.lesson), 화이트보드, 임시 메모, 블록 문서(.mnote), 악보(.msheet), 픽셀 펫까지 learning-tools 계층에 모여 있습니다.',
        },
        {
          title: '오프라인 우선',
          body:
            `vendor ${manifest.vendorScripts.length}개 중 ${lazyCount}개는 지연 로드 대상입니다. 시작할 때 싣지 않고 그 형식을 열 때 MNLazy 가 꺼내며, 단일 HTML 빌드에서는 text/plain 블록에서 꺼냅니다.`,
        },
      ],
      files: [
        { path: 'package.json', label: 'package.json', description: '스크립트와 의존성 — 런타임 의존성이 2개뿐입니다' },
        { path: 'AGENTS.md', label: 'AGENTS.md', description: '작업 지침(빌드 절차와 검증 범위 규칙)' },
        {
          path: 'classdock.html',
          label: 'classdock.html',
          description: '앱 셸. script 태그 순서가 곧 manifest 계약입니다',
        },
        {
          path: 'docs/JS-파일별-기능.md',
          label: 'JS-파일별-기능.md',
          description: '파일별 책임 색인. release-contract 테스트가 이 문서의 완전성을 검사합니다',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '구조 계약이 산문이 아니라 scripts.manifest.json 이라는 데이터로 존재하고, check-source.js 가 그것을 강제합니다. ' +
            '전역 스크립트 방식의 최대 약점(암묵적 의존)을 도구로 막은 드문 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            'docs/JS-파일별-기능.md 가 최신으로 유지되고, 그 최신성 자체를 release-contract.test.js 가 검사합니다. 문서가 썩지 않도록 테스트를 건 구조입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `전역 스크립트라 파일 하나가 커지는 것을 막는 구조적 압력이 없습니다. 지금 가장 큰 넷은 ${biggestFiles} 입니다. ` +
            '분할하려면 로딩 순서와 전역 이름을 함께 손봐야 해서 비용이 큽니다. ' +
            '이 진단은 3주 사이에 네 번 재확인됐습니다 — 2026-08-08~09 의 Word 편집·화이트보드 확장으로 docx-editor.js·office-replace.js·whiteboard.js 가 이 목록권에 들어왔고, ' +
            '08-11~12 의 집중 도구·우클릭 메뉴로 whiteboard.js 가 다시 두 배가 됐으며, ' +
            `08-15~17 의 수학·과학 도구상자로 또 한 번 늘어 지금 ${whiteboardNow}이고, ` +
            '08-17~20 에는 지도(map-viewer.js)가 통째로 새 상위권 파일로 들어왔습니다. ' +
            '다만 같은 기간에 반대 방향의 움직임도 있었습니다 — spreadsheet-viewer.js 에서 수식 엔진을, whiteboard.js 에서 계산 도구를 떼어 냈습니다. ' +
            '떼어 낸 쪽은 둘 다 DOM 없는 순수 모듈이라, 압력이 없는 구조에서도 분할이 되는 조건("계산과 화면이 갈리는 자리")이 무엇인지는 드러났습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '기능 대부분이 "EXE 가 있으면 서버 경로, 없으면 브라우저 폴백" 두 갈래입니다. 자동 테스트는 대부분 폴백 쪽만 보므로 EXE 전용 경로의 회귀는 수동 확인에 의존합니다.',
        },
      ],
    }),

    sec({
      id: 'loading-contract',
      category: '개요',
      group: '전체 구조',
      title: '스크립트 로딩 계층',
      subtitle: `applicationLayers — ${layerCount}계층, script 태그 순서가 곧 의존 방향`,
      summary:
        `${manifest.localScripts.length}개의 전역 스크립트를 ${layerCount}개 계층으로 묶고, 그 순서를 classdock.html 의 script 태그 순서와 완전히 일치시킵니다. ` +
        '아래 계층은 위 계층의 전역을 쓸 수 있고 그 반대는 불가능합니다. 이 규칙을 사람의 주의력이 아니라 tools/check-source.js 가 지킵니다.',
      diagram: diagrams.layers,
      usage: [
        {
          title: '계약의 실체',
          body:
            'manifest.localScripts 는 로드 순서 그대로의 평평한 배열이고, applicationLayers 는 같은 목록을 계층으로 나눈 것입니다. ' +
            'check-source.js 는 두 목록을 이어붙여 비교하므로, 계층에서 파일을 빠뜨리거나 순서를 바꾸면 즉시 실패합니다.',
        },
        {
          title: '계층의 의미',
          body:
            'bootstrap 은 설정·상태·공통 유틸, documents 는 파일과 뷰어, python-and-notebooks 는 Python 실행 환경, javascript 는 Worker 실행·라이브러리, ' +
            'document-editors 는 오피스·표·그림, learning-tools 는 수업 기능과 최종 이벤트 배선입니다.',
        },
        {
          title: '마지막 두 파일',
          body:
            'app.js 와 command-palette.js 가 항상 마지막입니다. 앞의 모든 기능이 준비된 뒤에 이벤트를 배선하고 명령 팔레트에 노출하기 위해서입니다.',
        },
      ],
      features: [
        {
          title: '순서 검사',
          body:
            'HTML 의 <script src="src/js/..."> 를 정규식으로 뽑아 manifest.localScripts 와 문자열로 비교합니다. 태그만 추가하고 manifest 를 잊는 실수를 잡습니다.',
        },
        {
          title: '계층 완전성',
          body: 'applicationLayers 의 scripts 를 모두 이어붙인 것이 localScripts 와 정확히 같아야 합니다. 중복 등록도 누락도 허용되지 않습니다.',
        },
        {
          title: '지연 vendor 계약',
          body:
            'lazy 로 표시된 vendor 는 HTML 에 태그가 남아 있으면 실패합니다. "지연 로드로 바꿨는데 태그를 안 지워 시작 비용이 그대로"인 상황을 막습니다.',
        },
        {
          title: '무결성 해시',
          body: 'vendor 파일마다 sha384 를 manifest 에 기록해 두고, 파일이 조용히 바뀌면 검사에서 드러나게 합니다.',
        },
      ],
      files: [
        {
          path: 'scripts.manifest.json',
          label: 'manifest (계층)',
          range: manifestRange('"styles"', '"applicationLayers"'),
          description: 'styles 와 localScripts — 로드 순서의 원본',
        },
        {
          path: 'tools/check-source.js',
          label: 'check-source.js',
          description: '문법·전역 충돌·계층·경계·지연 vendor 를 한 번에 검사',
        },
        {
          path: 'classdock.html',
          label: 'classdock.html',
          description: '앱 셸. script 태그 순서가 manifest 와 대조됩니다',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"순서가 곧 아키텍처"인 구조에서 그 순서를 단일 원본(manifest)으로 두고 기계가 검사합니다. 리뷰에서 사람이 볼 필요가 없어진 항목입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            `계층은 ${layerCount}개지만 ${biggestLayer.id} 에 ${biggestLayer.scripts.length}개가 몰려 있습니다. 수업 기능이 계속 붙는 자리라 자연스러운 결과지만, 이 계층 안의 상호 의존은 계층 구조로는 표현되지 않습니다.`,
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `manifest 의 scriptDependencies 는 ${dependencyCount}건뿐입니다. state.js·i18n.js·icons.js 처럼 거의 모든 파일이 쓰는 전역은 선언에 없어서, 이 목록만 보면 실제 결합도가 실제보다 낮아 보입니다.`,
        },
      ],
    }),

    sec({
      id: 'dependency-map',
      category: '개요',
      group: '전체 구조',
      title: '모듈 의존 그래프',
      subtitle: `scriptDependencies ${dependencyCount}건 — 무엇이 무엇보다 먼저 와야 하는가`,
      summary:
        'manifest 의 scriptDependencies 는 "이 파일은 저 파일들보다 반드시 나중에 로드돼야 한다"는 선언입니다. ' +
        'check-source.js 가 로드 인덱스를 비교해 역전을 막으므로, 이 그래프는 문서가 아니라 실행되는 제약입니다. ' +
        '그래프를 보면 documents.js 와 code-viewer.js 가 명백한 허브라는 점이 드러납니다.',
      diagram: diagrams.dependency,
      usage: [
        {
          title: '허브 파일',
          body:
            'documents.js 는 13개 파일이, code-viewer.js 는 9개 파일이 의존합니다. 문서 생명주기와 코드 화면이 거의 모든 기능의 전제라는 뜻입니다.',
        },
        {
          title: '체인이 가장 긴 축',
          body:
            'core.js → state.js → documents.js → code-viewer.js → python-editor.js → python-run-context.js → python-runtime.js → python-terminal.js. ' +
            'Python 실행 계열이 가장 깊은 사슬을 이룹니다.',
        },
        {
          title: '수렴 지점',
          body:
            'app.js 는 file-loaders.js, notebook-cells.js, whiteboard.js, backup.js 에 의존합니다. 각 계층의 마지막 파일을 하나씩 잡아 두는 방식으로 "전부 준비된 뒤"를 표현합니다.',
        },
      ],
      features: [
        {
          title: '역전 방지',
          body:
            'scriptIndex 로 로드 위치를 비교해 dependency 가 target 보다 뒤면 예외를 던집니다. 순환 의존은 순서 역전으로 나타나므로 자연히 함께 걸립니다.',
        },
        {
          title: '선언되지 않은 결합',
          body:
            `선언은 ${dependencyCount}건이지만 실제 전역 참조는 훨씬 많습니다. 이 그래프는 "깨지면 즉시 죽는 순서"만 담고, "이름을 바꾸면 조용히 깨지는 참조"는 담지 않습니다.`,
        },
        {
          title: '계층 내부 의존',
          body:
            'pdf-render → pdf-editor → pdf-pages 처럼 같은 계층 안에서도 순서가 강제됩니다. 그래프에서 같은 열 안의 곡선이 이에 해당합니다.',
        },
      ],
      files: [
        {
          path: 'scripts.manifest.json',
          label: 'manifest (의존)',
          range: manifestRange('"scriptDependencies"', '"vendorScripts"'),
          description: 'scriptDependencies 와 moduleBoundaries 선언',
        },
        {
          path: 'tools/check-source.js',
          label: 'check-source.js',
          range: [1, 60],
          description: '순서 역전과 경계 위반을 잡는 부분',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '의존 선언이 주석이 아니라 검사 가능한 데이터입니다. 리팩터링 시 "이걸 먼저 옮겨도 되나"를 그래프로 답할 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'documents.js 를 쪼개려면 그것에 의존하는 9개 파일의 로드 순서와 전역 참조를 모두 확인해야 합니다. 가장 손대기 어려운 지점이며, 리팩터링 계획이 있다면 여기가 첫 병목입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'korean-font.js 는 전역 스크립트 목록에서 빠져 vendorScripts 의 kfont 지연 묶음(sha384 포함)으로 옮겨졌고, python-runtime.js → lazy.js 의존이 선언됐습니다. ' +
            '예전에는 의존 선언 없이 전역으로 쓰여 이름을 바꾸면 검사에 걸리지 않고 깨졌지만, 지금은 manifest 가 그 관계를 들고 있습니다.',
        },
      ],
    }),

    sec({
      id: 'module-boundaries',
      category: '개요',
      group: '전체 구조',
      title: '공개 API 경계',
      subtitle: 'moduleBoundaries — 전역 스크립트에서 캡슐화를 흉내 내는 방법',
      summary:
        '전역 스크립트에는 export 가 없으므로 "무엇이 공개 API 이고 무엇이 내부 구현인지"를 구분할 언어적 장치가 없습니다. ' +
        `이 프로젝트는 manifest 의 moduleBoundaries 에 ${manifest.moduleBoundaries.length}건의 계약을 적어 그 구분을 만들었습니다 — ` +
        '파일 하나당 MN* 전역 하나를 창구로 두고, 그것을 쓰는 파일을 명시적으로 열거합니다.',
      diagram: diagrams.boundary,
      usage: [
        {
          title: '세 가지 검사',
          body:
            '① publicApi 이름이 그 파일에 const/let/var 로 실제 선언돼 있는가 ② 소비자로 적힌 파일이 정말 그 이름을 참조하는가 ③ 소비자가 경계 파일보다 나중에 로드되는가.',
        },
        {
          title: '소비자 목록의 효과',
          body:
            '②번 검사 때문에 소비자 목록이 낡으면 빌드가 실패합니다. 즉 이 목록은 "정확한 사용처 목록"임이 보장됩니다 — 영향 범위를 신뢰하고 읽을 수 있습니다.',
        },
        {
          title: '경계가 없는 파일',
          body:
            `${manifest.localScripts.length}개 중 ${manifest.moduleBoundaries.length}개만 경계가 선언돼 있습니다. 나머지는 전역을 그냥 노출하며, 그 파일들의 "무엇이 공개인가"는 여전히 암묵적입니다.`,
        },
      ],
      features: [
        {
          title: 'MNLazy — 가장 넓은 경계',
          body: '소비자 10개. 무거운 vendor 를 언제 부를지 결정하는 지점이라 시작 성능과 직결됩니다.',
        },
        {
          title: 'MNEditHistory — 가장 재사용된 경계',
          body:
            '소비자 7개(PDF·표·노트북·이미지·화이트보드·파이썬·메모). 각 편집기는 capture·apply·isEqual 세 함수만 넘기고 되돌리기 정책은 공통 모듈이 갖습니다.',
        },
        {
          title: 'MNOfficeReplace — 순수 코어 분리',
          body:
            'Word·PowerPoint 찾아 바꾸기의 계산을 DOM 없는 순수 함수로 두고, 화면(docx-editor.js)과 배치 작업(batch-replace.js)이 그것을 씁니다. 테스트하기 좋은 형태입니다.',
        },
        {
          title: 'MNDataConvert / MNTableExport',
          body: 'MNDataConvert(순수 변환) → MNTableExport(표 꺼내기) → data-convert-ui.js(화면) 로 이어지는 3단 분리입니다.',
        },
      ],
      files: [
        {
          path: 'tools/check-source.js',
          label: 'check-source.js',
          range: [34, 52],
          description: '경계 검사 본문',
        },
        {
          path: 'scripts.manifest.json',
          label: 'manifest (경계)',
          range: manifestRange('"moduleBoundaries"', '"vendorScripts"'),
          description: 'moduleBoundaries 선언',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"공개 API 를 선언하고 소비자를 열거하면 기계가 그 정확성을 지켜 준다" — 번들러 없이 얻을 수 있는 캡슐화로는 상당히 좋은 절충입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '경계가 선언된 10개 밖에서는 여전히 아무 전역이나 참조할 수 있습니다. documents.js·state.js·core.js 같은 큰 파일이 경계 대상이 아니라서, 정작 결합도가 높은 곳이 계약 밖에 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '경계 검사는 "이름을 참조하는가"를 정규식으로 봅니다. 주석 안에 이름만 적어 둬도 통과하므로, 검사가 보증하는 것은 사용 여부가 아니라 언급 여부입니다.',
        },
      ],
    }),

    sec({
      id: 'runtime-shapes',
      category: '개요',
      group: '전체 구조',
      title: '실행 형태와 기능 경계',
      subtitle: '온라인 HTML · 단일 오프라인 HTML · EXE — 같은 코드, 다른 능력',
      summary:
        '한 벌의 소스가 세 가지로 배포되고, 형태마다 할 수 있는 일이 다릅니다. 이 차이가 코드 전반에 "서버가 있으면 A, 없으면 B" 분기로 스며 있습니다. ' +
        '리뷰에서 가장 자주 확인해야 할 질문도 여기서 나옵니다 — 이 기능은 EXE 없이도 되는가, 안 되면 폴백은 무엇인가, 폴백이 원본을 건드리는가 사본을 만드는가.',
      diagram: diagrams.runtime,
      usage: [
        {
          title: '저장 경로의 이중화',
          body:
            '브라우저는 File System Access 핸들이 있으면 원본에 직접 쓰고, 없으면 다운로드 사본입니다. EXE 는 /save-file 로 실제 경로에 씁니다. ' +
            '화면 위쪽의 "원본 저장 / 사본 저장" 배지가 이 분기를 사용자에게 드러냅니다.',
        },
        {
          title: 'Python 실행의 이중화',
          body: 'EXE 는 설치된 로컬 Python 을 우선 쓰고, 없거나 HTML 형태면 브라우저 Pyodide 로 떨어집니다. pip 설치와 지속형 터미널은 EXE 전용입니다.',
        },
        {
          title: 'PPTX 변환의 이중화',
          body: 'EXE + 설치된 PowerPoint 면 PDF 로 정확 변환, 아니면 pptx-viewer.js 의 근사 미리보기로 폴백합니다.',
        },
        {
          title: '포트 고정',
          body:
            '17645 를 기본으로 쓰고 점유 시 18645 → 19645 → 27645 → 37645 → 47645 로 결정적으로 폴백합니다. 랜덤 포트를 피한 이유는 origin 별 localStorage 를 유지하기 위해서입니다.',
        },
      ],
      features: [
        {
          title: '단일 파일 인라인',
          body:
            'build-offline.js 가 HTML·CSS·로컬 JS·vendor 를 한 파일로 합칩니다. 지연 vendor 는 실행되지 않도록 text/plain 블록으로 넣고 MNLazy 가 필요할 때 꺼내 씁니다.',
        },
        {
          title: '상태 동기화',
          body:
            'state-sync.js 가 포트가 바뀌어도 설정이 유지되도록 로컬 서버와 localStorage 를 동기화합니다. origin 이 포트에 묶이는 문제를 서버 쪽 저장으로 우회합니다.',
        },
        {
          title: '실행별 토큰',
          body:
            '로컬 서버의 위험한 엔드포인트는 실행마다 새로 만드는 X-ClassDock-Token 을 요구합니다. 같은 PC 의 다른 페이지가 로컬 API 를 부르는 것을 막습니다.',
        },
        {
          title: '상시 실행 모드',
          body:
            'desktop/start-server-hidden.vbs 로 콘솔 없이 서버만 띄우고 브라우저 즐겨찾기로 접속하는 사용법이 있습니다. 이때 EXE 를 또 누르면 중복 인스턴스가 됩니다.',
        },
      ],
      files: [
        { path: 'build-offline.js', label: 'build-offline.js', description: '단일 오프라인 HTML 생성기' },
        {
          path: 'desktop/launcher.cs',
          label: 'launcher.cs (부트)',
          range: [1, 200],
          description: '로컬 서버 진입부와 상수 — 포트 후보와 토큰',
        },
        { path: 'desktop/build.bat', label: 'build.bat', description: 'EXE 빌드 스크립트' },
        {
          path: 'desktop/start-server-hidden.vbs',
          label: 'start-server-hidden.vbs',
          description: '콘솔 없이 서버만 띄우는 상시 실행 진입점',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"원본 저장 / 사본 저장" 을 배지로 항상 보여 주는 선택이 좋습니다. 저장 경로가 이중화된 앱에서 사용자가 가장 많이 다치는 지점을 UI 로 드러냈습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '포트를 랜덤이 아니라 고정 후보 목록으로 폴백시켜 origin 별 브라우저 저장소를 보존합니다. 흔히 놓치는 디테일입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '분기 지점이 여러 파일에 흩어져 있습니다(파일 저장, Python 실행, 변환, 메모 저장, 시험지 수신 각각). 새 기능을 추가할 때 폴백을 빠뜨려도 EXE 환경에서는 정상으로 보입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Playwright 는 tools/e2e-server.js 정적 서버 위에서 돕니다. 즉 자동 화면 테스트는 항상 "EXE 없는 상태"만 검증하며, EXE 전용 경로에는 화면 테스트가 없습니다.',
        },
      ],
    }),
  ];
};
