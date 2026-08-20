// 4. javascript — JavaScript 편집·Worker 실행·라이브러리·자동채점.

import { anchoredRange } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'javascript');

  return [
    sec({
      id: 'javascript-overview',
      category: '4. javascript',
      group: '계층 개요',
      title: 'javascript 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 별도 런타임 없이 브라우저 엔진으로 실행`,
      summary:
        '.js·.mjs 파일을 자체 편집기에서 고치고 격리된 Blob Worker에서 실행합니다. 일반 실행은 매번 새 Worker, 자동채점은 테스트마다 새 Worker, ' +
        'JavaScript 노트북은 문서마다 살아 있는 Worker 커널을 사용합니다. js-libraries.js 가 실행 전에 넣을 내장·npm·로컬 라이브러리를 준비하고, ' +
        'js-runtime.js 가 실행·출력·채점·커널을 맡으며, js-editor.js 가 그 기능을 기존 Python 편집기 UI와 연결합니다.',
      usage: [
        {
          title: 'Python 계층 다음에 놓이는 이유',
          body:
            'js-editor.js 가 createPythonEditor·saveTextDoc·채점 테스트 창처럼 Python 편집기에서 먼저 만든 공용 UI를 재사용합니다. ' +
            'manifest 는 code-viewer.js·python-editor.js·js-libraries.js·js-runtime.js 가 먼저 와야 한다고 명시합니다.',
        },
        {
          title: '세 가지 실행 수명',
          body:
            '일반 실행은 한 번 쓰고 버리는 Worker, 채점은 테스트마다 새 Worker, 노트북은 앞 셀의 값이 이어지는 지속형 Worker입니다. ' +
            '같은 실행 엔진을 쓰되 상태 격리 요구에 따라 수명만 다르게 둡니다.',
        },
        {
          title: '라이브러리 공급 경로',
          body:
            'Lodash·Day.js·Papa Parse·Math.js 고정본은 오프라인 vendor에서, 사용자가 고른 로컬 .js는 localStorage에서, npm 패키지는 EXE 캐시의 브라우저용 번들에서 읽습니다. ' +
            '세 경로 모두 사용자 코드보다 먼저 Worker 전역에 주입됩니다.',
        },
      ],
      features: [
        { title: '실행·중지', body: 'Ctrl+Enter 실행, 10초 시간 제한, 사용자가 누르는 중지, 실행 중 출력 스트리밍.' },
        { title: '자동채점', body: 'Python 과 같은 테스트 편집 창·결과 화면을 쓰되, 테스트마다 새 Worker로 상태를 격리합니다.' },
        { title: 'JavaScript 노트북', body: '.ipynb metadata 언어가 JavaScript이면 Pyodide 대신 지속형 Worker 커널로 셀을 실행합니다.' },
        { title: '문서별 라이브러리', body: '선택 상태를 문서별 키에 저장하고 일반 실행·채점·노트북에 똑같이 적용합니다.' },
      ],
      files: [
        {
          path: 'src/js/python-run-context.js',
          label: 'python-run-context.js (실행 언어 판정)',
          range: [1, 24],
          description: '.py와 .js/.mjs 실행기를 한곳에서 선택',
        },
        {
          path: 'src/js/code-viewer.js',
          label: 'code-viewer.js (실행 화면 연결)',
          range: anchoredRange(rootDir, 'src/js/code-viewer.js', {
            from: 'const extRunLang =',
            before: 6,
            lines: 22,
          }) ?? undefined,
          description: '파일 확장자에 따라 Python 또는 JavaScript 실행 화면 부착',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '기존 Python 편집기의 저장·초안·분할·채점 UI를 재사용하고 실행 엔진만 분리했습니다. 새 언어를 넣으면서 문서 생명주기를 다시 만들지 않은 선택이 좋습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '일반 실행·채점·노트북이 같은 결과 모양을 사용해 출력 화면과 채점 보고서를 그대로 공유합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Worker는 DOM과 메인 화면을 분리하지만 보안 샌드박스라는 뜻은 아닙니다. 사용자 코드와 추가 라이브러리는 네트워크 API 등 Worker가 가진 권한을 그대로 쓸 수 있으므로 신뢰 경계를 문서에서 분명히 해야 합니다.',
        },
      ],
    }),

    mod('js-libraries.js', {
      title: 'js-libraries.js — 실행 라이브러리와 npm 연결',
      subtitle: '내장·npm·내 파일을 한 실행 목록으로 정규화',
      summary:
        'JavaScript 실행 전에 넣을 라이브러리를 관리합니다. Lodash·Day.js·Papa Parse·Math.js는 vendor 고정본으로 제공하고, ' +
        '사용자가 고른 로컬 .js 파일과 EXE가 설치·번들한 npm 패키지를 같은 {id, name, source, global} 모양으로 바꿔 Worker에 넘깁니다.',
      usage: [
        {
          title: '내장 라이브러리',
          body: '네 파일은 manifest에 고정 버전·sha384로 등록되고 MNLazy.source() 또는 vendor fetch로 원문을 읽습니다.',
        },
        {
          title: '문서별 상태',
          body:
            'pdf-signer-js-libraries: 접두사의 localStorage 키에 선택을 저장합니다. 내 파일은 최대 8개, 파일당 512KB, 합계 1MB이며 알 수 없는 항목은 복원할 때 버립니다.',
        },
        {
          title: 'npm은 EXE 전용',
          body:
            '/js-npm-status·list·bundle·install-start·install-poll·install-cancel·remove를 사용합니다. 일반 HTML에서는 내장 라이브러리와 내 파일만 사용할 수 있습니다.',
        },
      ],
      features: [
        { title: '고정본 4종', body: 'Lodash 4.17.21, Day.js 1.11.13, Papa Parse 5.4.1, Math.js 14.0.1.' },
        { title: '자동완성', body: '선택한 라이브러리의 전역 이름과 대표 멤버만 편집기 자동완성 후보에 더합니다.' },
        { title: 'npm 진행 스트림', body: '설치를 시작하고 450ms 간격으로 증분 로그를 받아오며, 네트워크 오류는 세 번까지 재시도합니다.' },
        { title: '번들 캐시', body: 'EXE에서 받은 npm 번들 원문을 메모리에 캐시하고 삭제 시 함께 무효화합니다.' },
      ],
      files: [
        { path: 'tests/js-libraries.test.js', label: 'js-libraries.test.js', description: '카탈로그·상한·자동완성·실제 Worker 로드' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '저장된 상태를 그대로 신뢰하지 않고 jsLibraryState에서 항목 수·크기·전역 이름을 다시 정규화합니다. localStorage가 오래되거나 수동으로 바뀌어도 실행 상한을 우회하기 어렵습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '내장 vendor를 vm의 Worker와 비슷한 전역 환경에서 실제 평가하는 테스트가 있어, 파일 존재·해시만 맞고 실행은 깨지는 경우까지 잡습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '선택 상태(localStorage)와 npm 설치 캐시(디스크)의 생명주기가 다릅니다. 캐시를 외부에서 지우거나 EXE 없이 문서를 열면 저장된 선택은 남고 실행 시점에야 실패합니다.',
        },
      ],
    }),

    mod('js-runtime.js', {
      title: 'js-runtime.js — Worker 실행·채점·노트북 커널',
      subtitle: '세 실행 수명을 한 엔진으로 처리',
      summary:
        'Blob Worker를 만들어 사용자 JavaScript를 실행하고 console 출력·input·prompt·타이머·오류 위치·한국어 도움말을 앱 결과 모양으로 바꿉니다. ' +
        '일반 실행과 자동채점은 새 Worker를 만들고, JavaScript 노트북은 같은 Worker를 살려 앞 셀의 전역 값을 다음 셀로 이어 줍니다.',
      usage: [
        {
          title: '실행 상한',
          body: '기본 실행 10초, 본문 종료 뒤 비동기 대기 3초, 출력 앞 1MB, 출력 조각 4,000개. 80ms 또는 8KB마다 결과를 화면으로 흘립니다.',
        },
        {
          title: '오류 줄 보정',
          body:
            '일반 실행은 async 래퍼 앞줄 수를 실제 문자열에서 계산해 스택 줄에서 빼고, 노트북 셀은 sourceURL을 붙여 셀 원본 줄 번호를 유지합니다.',
        },
        {
          title: '라이브러리 주입',
          body:
            '라이브러리는 사용자 코드에 문자열로 이어 붙이지 않고 별도 간접 eval로 먼저 실행합니다. 그래서 라이브러리가 커져도 사용자 오류 줄 번호가 밀리지 않습니다.',
        },
      ],
      features: [
        { title: '출력 스트림', body: 'log·warn·error를 구분하고 중지·시간 초과 전까지 이미 받은 출력은 남깁니다.' },
        { title: '프로토콜 토큰', body: '작업마다 토큰을 만들어 사용자 postMessage가 완료 메시지를 위조하지 못하게 합니다.' },
        { title: '문법·오류 도움말', body: '닫히지 않은 괄호·따옴표 위치를 추정하고 자주 나는 ReferenceError·TypeError에 한국어 설명을 붙입니다.' },
        { title: '커널 상태', body: '노트북 셀의 바깥 선언을 다시 실행 가능한 형태로 바꾸며, top-level await 셀은 async 함수 폴백임을 결과에 표시합니다.' },
      ],
      files: [
        { path: 'tests/js-runtime.test.js', label: 'js-runtime.test.js', description: '실행·출력·채점·커널·편집기 연결 55개 이상 검증' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '사용자 postMessage와 내부 프로토콜을 임의 토큰으로 구분하고, 출력은 완료 응답에 다시 싣지 않습니다. 사용자 코드와 실행 제어 메시지가 섞이는 문제와 대용량 복사를 함께 피했습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '자동채점은 테스트마다 코드를 처음부터 새 Worker에서 실행해 테스트 순서에 따른 전역 상태 오염을 막습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '시간 제한은 Worker를 종료할 수 있지만 그 전에 큰 배열·문자열을 할당해 브라우저 메모리를 압박하는 것은 막지 못합니다. 출력 상한과 실행 시간 상한은 메모리 상한이 아닙니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '노트북에서 top-level await를 쓴 셀은 async 함수로 다시 실행되므로 그 셀에서 만든 변수는 다음 셀로 이어지지 않습니다. 결과에 이 사실을 표시합니다.',
        },
      ],
    }),

    mod('js-editor.js', {
      title: 'js-editor.js — JavaScript 편집·실행 화면',
      subtitle: 'Python 편집기 뼈대를 재사용하는 얇은 어댑터',
      summary:
        '.js·.mjs 문서에 실행 바·입력값·출력·라이브러리 선택·자동채점·저장·원본 되돌리기를 붙입니다. ' +
        '편집기·초안·자동저장·분할선·채점 테스트 창은 python-editor.js와 python-run-context.js의 공용 함수를 재사용하고, 실행만 runJsSource로 보냅니다.',
      usage: [
        {
          title: '문서 생명주기 재사용',
          body: '700ms 초안 저장과 3초 파일 자동저장, 저장 핸들·EXE·다운로드 폴백을 기존 텍스트 편집기와 똑같이 사용합니다.',
        },
        {
          title: '채점 저장 분리',
          body: '테스트 편집 창은 Python과 같지만 pdf-signer-js-grade: 접두사를 써 같은 파일명의 Python 채점 설정과 섞이지 않습니다.',
        },
        {
          title: '라이브러리 선택 UI',
          body: '내장·npm·내 파일 세 탭을 제공하며 npm 설치 전에는 패키지와 실행 위험을 확인 대화상자로 다시 알립니다.',
        },
      ],
      features: [
        { title: '새 파일', body: '사이드바·명령 팔레트·폴더 우클릭에서 새 .js 문서를 만들고 작업공간 자동복원에도 포함합니다.' },
        { title: '언어별 자동완성', body: 'Python 전용 지능을 끄고 js-runtime의 전역·멤버 후보와 선택 라이브러리 후보를 사용합니다.' },
        { title: '실행 중 중지', body: '실행 버튼을 중지 버튼으로 바꾸고 현재 Worker의 cancel을 호출합니다.' },
        { title: '과제 채점', body: 'Python 채점 보고서 컴포넌트를 그대로 사용하지만 .task 내보내기는 아직 main.py 전용이라 제공하지 않습니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '저장과 편집 UI를 재사용해 JavaScript 전용 코드가 실행·라이브러리 선택에 집중합니다. 신규 언어 기능이 565줄로 제한된 이유입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'ES module import는 지원하지 않고 모든 라이브러리를 Worker 전역 이름으로 사용합니다. .mjs 확장자를 실행할 수 있지만 실제 module 로더 의미와는 다르므로 사용자 문서에서 차이를 계속 강조해야 합니다.',
        },
      ],
    }),
  ];
};
