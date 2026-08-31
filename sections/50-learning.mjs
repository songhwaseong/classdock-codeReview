// 6. learning-tools — 수업·과제·펫·메모와 최종 이벤트 배선.

export default ({ manifest, helpers }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'learning-tools');

  return [
    sec({
      id: 'learning-overview',
      category: '6. learning-tools',
      group: '계층 개요',
      title: 'learning-tools 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 이 앱을 "교실 도구"로 만드는 계층`,
      summary:
        '앞의 네 계층이 "파일을 다루는 도구"였다면 이 계층은 그것을 수업에 쓰게 만드는 부분입니다. 과제 배포·제출·채점, 시험지 출제·응시·성적, ' +
        '수업 녹화·재생, 임시 메모와 블록 문서, 악보, 집중 타이머와 픽셀 펫이 여기 있습니다. 그리고 계층의 마지막 두 파일 app.js·command-palette.js 가 ' +
        '앞의 모든 기능을 이벤트와 명령 팔레트로 묶습니다.',
      usage: [
        {
          title: '가장 큰 계층',
          body: `${layer.scripts.length}개로 전체의 3분의 1 가까이 됩니다. 기능이 계속 붙는 자리라 자연스러운 결과지만, 계층 내부의 상호 의존은 계층 구조로 표현되지 않습니다.`,
        },
        {
          title: '순수 코어 3단 분리',
          body:
            'MNDataConvert(순수 변환) → MNTableExport(표 꺼내기) → data-convert-ui.js(모달·버튼). ' +
            '변환 규칙은 DOM 을 전혀 모르고, UI 는 규칙을 전혀 모릅니다. 이 계층에서 가장 깔끔한 분리입니다.',
        },
        {
          title: '마지막 배선',
          body:
            'app.js 가 드래그 앤 드롭, 파일 열기, 설정 모달, 자동 저장 폴더, 도움말, 단축키, 헤더 메뉴, 서버 heartbeat, 시작·종료 흐름을 연결합니다. ' +
            'command-palette.js 는 그 위에서 Ctrl+K 명령 목록과 문맥별 활성 조건을 관리합니다.',
        },
      ],
      features: [
        { title: '과제', body: '.task 만들기 → 배포 → .taskdone 제출 → 자동채점·재채점 → 성적 CSV.' },
        { title: '시험지', body: '.examkey(원본) → .exam(정답 제거 배포본) → .examdone(봉인 제출본) → 일괄 채점 → 누적 성적.' },
        { title: '수업 기록', body: '.lesson 으로 화이트보드·PDF·Python 이벤트를 녹화하고 타임라인으로 재생합니다.' },
        { title: '메모', body: 'scratchpad(임시 메모 탭)와 mnote(.mnote 블록 문서), image-memo(캡처 이미지)로 나뉩니다.' },
        { title: '악보', body: '.msheet 악보 문서 4개 파일(모델·MusicXML·소리·편집기). 이 계층에서 가장 최근에 늘어난 묶음이라 리뷰도 "악보" 항목으로 따로 묶었습니다.' },
        { title: '픽셀 펫', body: '5개 파일(data·custom·events·pet·focus)로 이동·행동·대사·도감·집중 타이머를 다룹니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'exam-paper.js 의 봉인·검증 설계와 data-convert 의 순수 코어 분리는 이 계층에서 가장 공들인 부분입니다. 둘 다 설계 문서가 별도로 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `펫 관련 5개 파일이 이 계층 ${layer.scripts.length}개 중 5개를 차지합니다. 기능적으로는 부수적인데 파일 수와 테스트 수(펫 관련 단위 테스트 8개)가 상당합니다. 유지보수 비중을 의식할 필요가 있습니다.`,
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'app.js 가 "사실상 모든 기능 파일"과 얽혀 있습니다. 계층 마지막이라 구조적으로는 맞지만, 여기 생긴 버그는 재현 조건이 복잡해집니다.',
        },
      ],
    }),

    mod('lesson-replay.js', {
      title: 'lesson-replay.js — 수업 녹화·재생',
      subtitle: '.lesson 타임라인',
      summary:
        '.lesson 데이터 검증, 화이트보드·PDF·Python 이벤트 녹화, 타임라인 재생·탐색·속도 조절과 파일 저장을 담당합니다. ' +
        '화면 영상이 아니라 이벤트를 기록하므로 파일이 작고, 재생 중에도 확대·이동이 가능합니다.',
      usage: [
        {
          title: '영상이 아닌 이유',
          body:
            '화면 녹화는 용량이 크고 편집이 불가능합니다. 이벤트 기록은 board-render.js 로 같은 그림을 다시 그릴 수 있어 파일이 작고 속도 조절이 자유롭습니다.',
        },
        {
          title: '입력 검증이 이 파일에 있는 이유',
          body:
            '.lesson 은 남이 만들어 건네줄 수 있는 파일입니다. lessonValidItem 이 항목마다 숫자 유효성과 크기를 확인하고, ' +
            '수학·과학 도구상자가 들여온 group 항목에는 재귀 깊이 8·자식 1,000개 상한을 겁니다 — 중첩 group 으로 재생 코드를 멈추게 하는 파일을 막습니다.',
        },
      ],
      features: [
        { title: '3종 이벤트', body: '화이트보드 획, PDF 조작, Python 실행을 함께 기록합니다.' },
        { title: '타임라인', body: '탐색과 속도 조절을 제공합니다.' },
        { title: '검증', body: 'tests/lesson-ocr.test.js 가 .lesson 데이터 검증을 다룹니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '이벤트 기록 방식이 이 용도에 정확히 맞습니다. board-render.js 를 미리 분리해 둔 덕분에 가능한 설계입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '화이트보드에 group·polyline 이 생겼을 때 재생 쪽 검증을 같이 넓혔습니다. 렌더러만 고치고 검증을 잊는 것이 흔한 실수인데, ' +
            '깊이 제한까지 붙여 재귀를 의식했습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '재귀 깊이·개수 상한이 여기에만 있습니다. board-render.js 자체는 무제한으로 그리므로, .lesson 이 아닌 다른 경로(복구 스냅샷, 메모 왕복)로 ' +
            'group 이 들어오면 같은 보호를 받지 못합니다. 상한을 렌더러 쪽에 두는 편이 새는 곳이 없습니다.',
        },
      ],
    }),

    mod('diff-viewer.js', {
      title: 'diff-viewer.js — 파일 비교',
      subtitle: 'patience diff 자체 구현',
      summary:
        'diff 라이브러리를 넣지 않고 patience diff 를 직접 구현했습니다. 나란히/한 줄 보기, 공백 무시, 접기, 두 파일 선택 모달, 저장본 비교, ' +
        '과제 시작 코드와의 비교 진입점을 제공합니다.',
      usage: [
        {
          title: 'patience diff 를 고른 이유',
          body:
            '일반 LCS diff 는 코드에서 흔한 반복 줄(닫는 괄호, 빈 줄) 때문에 엉뚱하게 짝지어집니다. patience 는 고유한 줄을 앵커로 삼아 사람이 보기에 자연스러운 결과를 냅니다.',
        },
        {
          title: '과제 연동',
          body: 'task-package.js 와 이어져 "학생 제출본 vs 시작 코드"를 바로 비교할 수 있습니다.',
        },
      ],
      features: [
        { title: '두 가지 보기', body: '나란히(side-by-side)와 한 줄(inline).' },
        { title: '인라인 강조', body: '바뀐 줄 안에서 달라진 부분만 강조합니다. chg 짝짓기 로직이 테스트로 덮여 있습니다.' },
        { title: 'HTML 이스케이프', body: 'tests/diff-viewer.test.js 가 행 HTML 이스케이프까지 검사합니다 — 코드 내용이 화면을 깨지 않도록.' },
      ],
      files: [{ path: 'tests/diff-viewer.test.js', label: 'diff-viewer.test.js', description: 'diff 판정·짝짓기·강조·이스케이프' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'diff 결과의 HTML 이스케이프를 테스트로 고정했습니다. 사용자 파일 내용을 화면에 그리는 코드에서 반드시 필요한 검증입니다.',
        },
      ],
    }),

    mod('batch-replace.js', {
      title: 'batch-replace.js — 여러 파일 찾아 바꾸기',
      subtitle: '텍스트 + Word·PowerPoint',
      summary:
        '열린 텍스트·코드 문서와 Word(.docx) 본문·PowerPoint(.pptx) 슬라이드에서 한꺼번에 찾아 바꿉니다(대소문자·정규식·그룹 치환). ' +
        '미리보기 체크리스트를 거쳐 saveTextDoc({silent, existingOnly})로 조용히 저장하고 되돌리기를 제공합니다. ' +
        '오피스 문서는 MNOfficeReplace 로 계산해 저장합니다.',
      usage: [
        {
          title: '저장하지 못하면 화면도 바꾸지 않는다',
          body:
            '오피스 문서는 편집기가 없어서, 화면만 바꾸고 저장이 실패하면 "바뀐 줄 알았는데 파일은 그대로"가 됩니다. ' +
            '그래서 저장 성공을 먼저 확인하고 화면을 갱신합니다. 이 계층에서 가장 중요한 안전 규칙입니다.',
        },
        {
          title: '원본이냐 사본이냐',
          body:
            'File System Access 핸들이 있으면 원본에, 없으면 EXE 의 /save-file 로 자동 저장 폴더에 사본으로 저장하고, 어느 쪽인지 결과 문구로 알립니다.',
        },
        {
          title: '자동채움을 끄는 자리',
          body: '여러 파일을 한꺼번에 바꾸는 화면이라 MNSearchHistory 의 최근 검색어를 목록으로만 보여 주고 자동으로 채우지 않습니다.',
        },
      ],
      features: [
        { title: '본문 밖 처리', body: '머리말·꼬리말·각주·발표자 노트 포함 여부를 설정▸문서에서 정하고, 바꾸지 않은 곳은 "머리말 2곳"처럼 숫자로 알립니다.' },
        { title: '미리보기 라벨', body: 'Word 는 "문단 12", PowerPoint 는 "슬라이드 3" 으로 위치를 표시합니다.' },
        { title: '위험 패턴 거부', body: 'tests/batch-replace.test.js 가 정규식 이스케이프와 위험 패턴 거부를 검사합니다.' },
        { title: '변경 기록', body: '줄 단위 변경 기록을 남겨 되돌릴 수 있습니다.' },
      ],
      files: [{ path: 'tests/batch-replace.test.js', label: 'batch-replace.test.js', description: '정규식·그룹 치환·변경 기록·위험 패턴' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"저장 실패 시 화면도 바꾸지 않는다"는 규칙이 정확합니다. 여러 파일을 한꺼번에 바꾸는 기능에서 화면과 디스크가 어긋나면 사용자가 되돌릴 방법이 없습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '바꾸지 않은 위치를 "머리말 2곳"처럼 숫자로 알립니다. 조용히 건너뛰지 않고 남은 것을 알려 주는 처리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '정규식 그룹 치환을 열어 두었습니다. 위험 패턴 거부가 있지만, 여러 파일을 한 번에 바꾸는 기능에서 사용자가 만든 정규식은 근본적으로 위험합니다.',
        },
      ],
    }),

    mod('task-package.js', {
      title: 'task-package.js — 과제 패키지 (.task/.taskdone)',
      subtitle: '배포·제출·자동채점 — 코드 문제와 지도 문제 두 갈래',
      summary:
        '.task 과제 만들기·검증·내보내기, .taskdone 제출본 생성·검수·재채점, 일괄 검수와 성적 CSV 를 담당합니다. ' +
        '채점은 python-runtime.js 의 gradeTests 모드로 학생 코드를 돌려 판정합니다. ' +
        '여기에 지도 문제(kind:"map")가 더해져, 코드 대신 지도 위에서 자리를 찍어 푸는 과제도 같은 봉투로 오갑니다.',
      usage: [
        {
          title: '재채점이 필요한 이유',
          body: '채점 기준이 잘못됐거나 문제를 고쳤을 때 이미 받은 제출본을 다시 채점해야 합니다. 제출본이 학생 코드를 통째로 담고 있어 가능합니다.',
        },
        {
          title: '문제 종류가 둘로 늘었다',
          body:
            'kind 가 없으면 기존 코드 문제, kind:"map" 이면 지도 문제입니다. 지도 문제는 tests·starter 대신 map 을 들고 ' +
            '배경지도·중심·확대와 함께 문항마다 정답 좌표와 허용 반경(toleranceM)을 갖습니다. 채점은 파이썬을 부르지 않고 거리로 판정합니다. ' +
            '봉투(패키지 형식·해시·제출 규약)는 그대로 두고 내용물 종류만 늘린 형태라, 배포·제출·성적 CSV 경로가 그대로 재사용됩니다.',
        },
        {
          title: '검증을 지도 쪽에 위임한다',
          body:
            '배경 이미지 검증을 자기가 다시 쓰지 않고 map-viewer.js 의 mapNormalizeBackgroundImage 가 있으면 그것을 쓰고, ' +
            '없으면 이미지를 버립니다. 허용 반경도 10m 아래로는 못 내려가게 막는데, 그보다 좁으면 지도에서 손으로 찍을 수 없기 때문입니다 — ' +
            '숫자의 근거가 상수 옆에 적혀 있습니다.',
        },
        {
          title: '경로 충돌',
          body: 'tests/task-package.test.js 가 과제·제출본의 경로 충돌 처리와 재채점 대상 선택을 검사합니다.',
        },
      ],
      features: [
        { title: '자동채점', body: '테스트 케이스를 넣어 두면 실행 결과로 판정합니다.' },
        { title: '일괄 검수', body: '여러 제출본을 한 번에 확인합니다.' },
        { title: '성적 CSV', body: '결과를 CSV 로 내보냅니다.' },
        { title: '샘플', body: 'docs/샘플-두수의합.task 와 3개의 .taskdone 이 실제 예시로 들어 있습니다.' },
      ],
      files: [
        { path: 'docs/과제패키지-설계.md', label: '과제패키지-설계.md', description: '설계 문서' },
        { path: 'tests/task-package.test.js', label: 'task-package.test.js', description: '경로 충돌·검증·재채점 대상' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '샘플 .task 와 .taskdone 을 레포에 넣어 두었습니다. 기능을 이해하거나 회귀를 확인할 때 즉시 쓸 수 있는 자산입니다.',
        },
      ],
    }),

    mod('exam-paper.js', {
      title: 'exam-paper.js — 시험지 (.examkey/.exam/.examdone)',
      subtitle: '봉인·검증·LAN 제출',
      summary:
        '출제부터 채점까지의 전 과정을 다룹니다. 선생님 암호로 잠근 원본 .examkey, 최신 원본과 버전이 일치하는 정답 제거 배포본 .exam(열기 암호 선택), ' +
        '학생이 이름·서명 후 공개키로 봉인한 제출본 .examdone, 봉인 내부의 신원·버전을 검증하는 일괄 채점표, 수동 채점 영구 저장과 시험별·누적 성적 CSV. ' +
        '교실 LAN 직접 제출도 여기서 다룹니다.',
      usage: [
        {
          title: '세 파일로 나눈 이유',
          body:
            '.examkey 는 정답이 든 원본(선생님만), .exam 은 정답을 뺀 배포본(학생에게), .examdone 은 봉인된 제출본입니다. ' +
            '배포본에 정답이 없으므로 학생이 파일을 뜯어도 답을 얻지 못합니다.',
        },
        {
          title: '버전 일치 검사',
          body:
            '배포본이 최신 원본과 버전이 일치해야 채점됩니다. 문제를 고친 뒤 예전 배포본으로 응시한 답안이 섞이는 것을 막습니다.',
        },
        {
          title: 'LAN 제출',
          body:
            '선생님은 EXE 의 제출 전용 리스너를 열고(개폐·접수 목록 폴링), 학생은 주소와 6자리 코드로 연결해 바로 보냅니다. ' +
            '실패하면 파일 제출로 폴백합니다.',
        },
      ],
      features: [
        { title: '문항 편집', body: '객관식·주관식·이미지 문항을 만듭니다.' },
        { title: '봉인', body: '학생 서명 후 공개키로 봉인해 내용 변조를 어렵게 합니다.' },
        { title: '수동 채점 보존', body: '주관식 수동 채점 결과를 영구 저장합니다.' },
        { title: '누적 성적', body: '시험별·누적 CSV 를 냅니다.' },
      ],
      files: [
        { path: 'docs/시험지-설계.md', label: '시험지-설계.md', description: '설계 문서' },
        { path: 'docs/시험지-온라인제출-설계.md', label: '온라인제출-설계.md', description: 'LAN 제출 설계' },
        { path: 'tests/exam-paper.test.js', label: 'exam-paper.test.js', description: '봉인·검증·채점 테스트' },
        { path: 'tests/e2e/exam-cumulative-csv.spec.js', label: 'exam-cumulative-csv.spec.js', description: '누적 성적 CSV 화면 흐름' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '원본/배포본/제출본을 파일 단위로 분리하고 버전 일치를 검사합니다. 시험이라는 도메인에서 가장 중요한 요구를 구조로 풀었습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'LAN 제출이 실패하면 파일 제출로 폴백합니다. 교실 네트워크는 불안정하다는 전제를 반영했습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '2,593줄에 출제·응시·봉인·채점·성적·LAN 제출이 모두 들어 있습니다. 역할이 명확히 다른 다섯 덩어리라 분할하기 좋은 후보인데, 도메인 규칙이 얽혀 있어 신중해야 합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '"공개키로 봉인"이 무결성 보장인지 기밀성 보장인지 코드로 확인이 필요합니다. 브라우저 안에서 도는 이상 결정적 위조 방지는 어렵고, 실제 목적은 "우발적 수정 방지"에 가까울 것입니다.',
        },
      ],
    }),

    mod('screensaver.js', {
      title: 'screensaver.js — 유휴 화면',
      subtitle: '시계·영상 재생',
      summary:
        '유휴 상태에서 시계나 지정한 영상을 재생합니다. 영상 목록을 IndexedDB 에 저장하고 재생 가능성을 검사하며 전체화면 종료를 처리합니다. ' +
        '교실 앞 화면을 쉬는 시간에 쓰는 용도로 보입니다.',
      features: [
        { title: '영상 목록', body: 'IndexedDB 에 보관해 다시 실행해도 유지됩니다.' },
        { title: '재생 가능성 검사', body: '브라우저가 못 여는 형식을 미리 걸러 냅니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '앱 성격상 부수 기능이지만 전체화면·유휴 감지라 app.js·state.js 와 이벤트가 얽힙니다.',
        },
      ],
    }),

    mod('pet-data.js', {
      title: 'pet-data.js — 펫 스프라이트와 기본 데이터',
      subtitle: '종족별 시트·팔레트·대사',
      summary: '픽셀 펫 종족별 스프라이트 좌표, 팔레트, 이름과 기본 대사를 정의합니다. 로직이 아니라 데이터 파일입니다.',
      features: [
        { title: '종족', body: '복실고양이·삼색고양이·이끼골렘·하늘섬·사람 등. 각각 전용 스프라이트 시트를 씁니다.' },
        { title: '자산 연결', body: 'src/assets 의 PNG 스프라이트 시트와 좌표가 대응합니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '1,319줄 대부분이 좌표·팔레트 데이터입니다. tools/recolor-calico-sprites.js 같은 1회성 자산 도구가 이 데이터를 만들었습니다.',
        },
      ],
    }),

    mod('pet-custom.js', {
      title: 'pet-custom.js — 나만의 펫',
      subtitle: '대사 편집과 외형 조합',
      summary: '펫 대사 편집, 사용자별 종족 대사, 나만의 펫 외형 조합과 저장·복원을 담당합니다.',
      features: [
        { title: '우선순위', body: 'tests/pet-custom-priority.test.js 가 사용자 설정이 기본값을 덮는 우선순위를 고정합니다.' },
        { title: '외형 저장', body: '조합한 외형을 저장해 다시 실행해도 유지합니다.' },
      ],
      files: [{ path: 'tests/pet-custom-priority.test.js', label: 'pet-custom-priority.test.js', description: '사용자 설정 우선순위' }],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '펫에 사용자 대사를 넣을 수 있어, 학생이 볼 화면에 부적절한 문구가 들어갈 수 있습니다. 교실 도구라면 검토할 지점입니다.',
        },
      ],
    }),

    mod('pet-events.js', {
      title: 'pet-events.js — 행동 도감 데이터',
      subtitle: '이벤트 이름과 한·영 설명',
      summary: '펫 행동 도감의 고유 이벤트 이름과 한국어·영어 설명을 정의합니다. 가장 작은 데이터 파일입니다.',
      features: [{ title: '무결성 검사', body: 'tests/pet-events.test.js 가 도감 데이터와 종족 참조가 어긋나지 않는지 검사합니다.' }],
      files: [{ path: 'tests/pet-events.test.js', label: 'pet-events.test.js', description: '도감 데이터·종족 참조 무결성' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '데이터 파일에도 참조 무결성 테스트를 걸었습니다. 종족을 추가하다 도감 항목을 빠뜨리는 실수를 잡습니다.',
        },
      ],
    }),

    mod('pet.js', {
      title: 'pet.js — 픽셀 펫 엔진',
      subtitle: '이동·점프·플랫폼 탐색·애니메이션',
      summary:
        '픽셀 펫의 이동·점프·플랫폼 탐색·행동·대사·드래그·이벤트 도감과 실제 DOM 애니메이션 엔진입니다. ' +
        '펫이 화면 요소 위를 걸어다니므로 레이아웃을 실시간으로 읽어 플랫폼을 찾습니다.',
      usage: [
        {
          title: '전체화면 대응',
          body:
            '문서 전체화면 중에는 펫을 전체화면 요소 안에 붙여야 보입니다. tests/pet-fullscreen.test.js 가 호스트 선택 로직을 고정합니다.',
        },
        {
          title: '알림 대행',
          body: '펫이 앱 알림을 말풍선으로 대신 말합니다. 선택·덮어쓰기 규칙이 테스트로 정해져 있습니다.',
        },
      ],
      features: [
        { title: '플랫폼 탐색', body: '화면 요소를 발판으로 삼아 걷고 점프합니다.' },
        { title: '조용한 자리', body: '집중 모드에서는 좌우 코너로 물러납니다. 끌어다 놓은 코너를 기억합니다.' },
        { title: '주사율 무관', body: 'tests/pet-fluffy-cat.test.js 가 24프레임 시트와 주사율 무관 시간 배율을 검사합니다.' },
      ],
      files: [
        { path: 'tests/pet-fullscreen.test.js', label: 'pet-fullscreen.test.js', description: '전체화면 호스트 선택' },
        { path: 'tests/pet-notification.test.js', label: 'pet-notification.test.js', description: '알림 대행 선택·덮어쓰기' },
        { path: 'tests/pet-quiet-corner.test.js', label: 'pet-quiet-corner.test.js', description: '조용한 자리 규칙' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '주사율에 따라 속도가 달라지지 않도록 시간 배율을 쓰고 그것을 테스트로 고정했습니다. 애니메이션에서 흔히 놓치는 부분입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '2,270줄짜리 애니메이션 엔진이 상시 돌면서 레이아웃을 읽습니다. 저사양 교실 PC 를 겨냥한 앱에서 이 비용은 의식적으로 관리돼야 하고, 끄는 설정이 있는지 확인이 필요합니다.',
        },
      ],
    }),

    mod('pet-focus.js', {
      title: 'pet-focus.js — 집중·휴식 타이머',
      subtitle: '뽀모도로와 펫 행동 연동',
      summary:
        '집중·휴식 타이머, 오늘 완료 횟수, 타이핑 중 조용한 상태, 집중 모드에 따른 펫 행동을 관리합니다. ' +
        '펫을 방해 요소가 아니라 학습 리듬의 표시로 쓰는 연결점입니다.',
      features: [
        { title: '타이핑 감지', body: '입력 중에는 펫을 조용하게 만듭니다.' },
        { title: '기록 유지', body: '오늘 완료 횟수를 저장·복원합니다.' },
      ],
      files: [{ path: 'tests/pet-focus.test.js', label: 'pet-focus.test.js', description: '타이머 저장·복원과 UI 계약' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '타이핑 중 펫을 조용하게 만드는 처리가 좋습니다. 장식 기능이 작업을 방해하지 않도록 명시적으로 다뤘습니다.',
        },
      ],
    }),

    mod('data-convert.js', {
      title: 'data-convert.js — 형식 변환 코어 (MNDataConvert)',
      subtitle: 'DOM 없는 순수 모듈',
      summary:
        'JSON·JSONL·YAML·XML·CSV·TSV·마크다운 표·HTML 표를 중간 표현(Value ⇄ Table)을 거쳐 서로 변환합니다. ' +
        '자체 마크업 토크나이저로 XML·HTML 을 브라우저 API 없이 읽고(YAML 만 setYaml 으로 주입받은 js-yaml 사용), ' +
        '경로 평탄화(주소.시 · 태그[0]), 타입 추론(원문 raw 보존), 왕복 재검사로 만든 손실 리포트를 제공합니다.',
      usage: [
        {
          title: '중간 표현을 두는 이유',
          body:
            '형식이 8종이면 직접 변환은 조합이 56가지입니다. Value(트리) ⇄ Table(표) 두 중간 표현을 거치면 형식마다 읽기·쓰기 한 벌씩만 있으면 됩니다.',
        },
        {
          title: '브라우저 API 를 안 쓰는 이유',
          body:
            'DOMParser 를 쓰면 순수 모듈이 아니게 되고 node --test 에서 검증할 수 없습니다. XML·HTML 토크나이저를 직접 만들어 DOM 의존을 끊었습니다.',
        },
        {
          title: '손실 리포트',
          body: '변환 결과를 다시 원래 형식으로 되돌려 비교하고, 무엇이 사라졌는지 알려 줍니다. 형식 변환 도구가 흔히 생략하는 부분입니다.',
        },
      ],
      features: [
        { title: '평탄화', body: '중첩 구조를 "주소.시", "태그[0]" 같은 경로 컬럼으로 펴고 되돌립니다.' },
        { title: '타입 추론', body: '문자열을 숫자·불리언으로 추론하되 원문 raw 를 함께 보존해 되돌릴 수 있습니다.' },
        { title: 'CSV 인용', body: 'RFC 4180 인용 규칙을 이 모듈이 갖고, table-export.js 가 위임해 씁니다.' },
      ],
      files: [
        { path: 'docs/형식변환-설계.md', label: '형식변환-설계.md', description: '설계 문서' },
        { path: 'tests/data-convert.test.js', label: 'data-convert.test.js', description: '변환·평탄화·타입 추론·손실 리포트' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '왕복 재검사로 손실 리포트를 만드는 발상이 좋습니다. "변환은 됐는데 뭔가 사라졌다"를 사용자가 사후에 발견하는 상황을 없앱니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '타입을 추론하면서 원문 raw 를 함께 보존합니다. 추론이 틀려도 되돌릴 수 있어 데이터 손실이 되지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'XML·HTML 토크나이저를 직접 구현했습니다. 순수성을 얻는 대가로, 실제 문서의 온갖 변칙을 이 코드가 혼자 감당해야 합니다.',
        },
      ],
    }),

    mod('table-export.js', {
      title: 'table-export.js — 표 꺼내기 (MNTableExport)',
      subtitle: '메모·블록 문서의 표를 바깥으로',
      summary:
        '메모창과 블록 문서의 표를 탭 구분(TSV)으로 복사, 엑셀용 CSV(BOM·RFC 4180 인용 — 규칙 자체는 MNDataConvert 에 위임)로 저장, ' +
        '복사본을 새 탭의 표 편집기(xlsx)로 열기, 형식 변환 창으로 보내기를 담당합니다.',
      usage: [
        {
          title: '저장 상태를 건드리지 않는 설계',
          body:
            'saveTextDoc 에 문서를 넘기지 않아(=null) 메모·문서의 "수정됨" 상태를 바꾸지 않습니다. 표를 내보냈다고 원본 메모가 저장 대상이 되면 안 되기 때문입니다.',
        },
        {
          title: 'BOM 을 붙이는 이유',
          body: 'Excel 이 UTF-8 CSV 를 BOM 없이 열면 한글이 깨집니다. 사용자 환경을 고려한 실용적 선택입니다.',
        },
      ],
      features: [
        { title: '4가지 출구', body: 'TSV 복사 · CSV 저장 · 표 편집기로 열기 · 형식 변환 창으로 보내기.' },
        { title: '3곳에서 재사용', body: 'scratchpad·mnote·data-convert-ui 가 같은 버튼 묶음을 씁니다.' },
      ],
      files: [{ path: 'tests/table-export.test.js', label: 'table-export.test.js', description: '내보내기 경로와 저장 상태 비간섭' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '179줄로 세 화면의 공통 요구를 처리하고, "저장 상태를 건드리지 않는다"는 미묘한 규칙까지 지켰습니다.',
        },
      ],
    }),

    mod('data-convert-ui.js', {
      title: 'data-convert-ui.js — 형식 변환 창',
      subtitle: '규칙은 없고 배선만',
      summary:
        'Ctrl+K → 형식 변환, 코드 뷰어의 🔄 변환, 표 블록의 변환 버튼으로 열리는 창입니다. 입력·미리보기 두 칸, 손실 배너, ' +
        '평탄화·타입 추론·빈 칸·구분자·XML 요소 이름 옵션과 복사·표 편집기·파일 저장·새 탭 열기를 제공합니다. ' +
        '변환 규칙은 하나도 두지 않고 MNDataConvert 만 호출합니다.',
      usage: [
        {
          title: '원본에 되쓰지 않는다',
          body: '변환 결과를 원본 파일에 되쓰는 경로를 아예 만들지 않았습니다. 변환은 손실이 있을 수 있으므로 항상 새 산출물로만 나갑니다.',
        },
        {
          title: '활성 문서 연동',
          body: '활성 문서가 표면 doc.sheetRows() 로 시트를 받아 입력을 채웁니다.',
        },
      ],
      features: [
        { title: '손실 배너', body: 'MNDataConvert 의 손실 리포트를 배너로 띄웁니다.' },
        { title: '옵션', body: '평탄화·타입 추론·빈 칸 처리·구분자·XML 요소 이름.' },
        { title: '4가지 출구', body: '복사 · 표 편집기 · 파일 저장 · 새 탭.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"원본에 되쓰는 경로를 만들지 않는다"가 명시적 설계 결정입니다. 손실 가능한 변환에서 사용자가 원본을 잃을 방법 자체를 없앴습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'UI 파일에 변환 규칙이 한 줄도 없습니다. MNDataConvert 와의 경계가 실제로 지켜지고 있습니다.',
        },
      ],
    }),

    mod('exchange-rate.js', {
      title: 'exchange-rate.js — 환율 공용 모듈',
      subtitle: '두 출처의 서로 다른 응답을 화면이 쓰는 한 모양으로',
      summary:
        '런처가 받아 온 환율 JSON 원본을 화면이 쓰는 한 모양으로 바꾸는 순수 모듈입니다. ' +
        '한국수출입은행 고시환율과 유럽중앙은행 참고환율 두 출처를 다루는데, 두 응답의 성질이 달라 ' +
        '"표에 무엇을 보여 줄지"가 갈립니다. 그 구분을 화면이 아니라 여기서 합니다. DOM 도 fetch 도 쓰지 않습니다.',
      usage: [
        {
          title: '왜 런처가 아니라 여기서 해석하는가',
          body:
            '런처가 둘(launcher.cs·main.go)이라 파싱을 그쪽에 두면 같은 규칙을 C# 과 Go 로 두 번 적고 두 번 틀립니다. ' +
            '그래서 "런처는 받아만 오고 뜻풀이는 JS 가" 로 나눴습니다 — 지도의 /geocode 가 먼저 쓴 방식이고(map-viewer.js 의 mapKakaoPlaces), ' +
            '두 번째 적용입니다. 이 판단이 파일 첫머리에 근거와 함께 적혀 있습니다.',
        },
        {
          title: '두 출처의 성질이 다르다',
          body:
            '수출입은행은 매매기준율에 더해 송금 보낼 때·받을 때 값까지 있지만 영업일 11시 무렵 이후에만 그날 값이 뜨고, 없는 날은 빈 배열이 옵니다. ' +
            'ECB 는 키가 없어도 되고 휴일이면 직전 영업일 값을 알아서 돌려주지만 송금 값이 없습니다. ' +
            '그래서 표의 송금 칸은 그 값이 있는 출처에서만 나옵니다.',
        },
        {
          title: '고시 단위를 잃지 않는다',
          body:
            '엔화는 JPY(100) 처럼 100단위로 고시됩니다. 고시된 값과 1단위 환산값을 함께 들고 있어, ' +
            '표에는 고시 그대로 보이고 환전 계산은 단위에 휘둘리지 않습니다. 양방향 계산이 모두 맞는지 테스트로 고정돼 있습니다.',
        },
        {
          title: '빈 값과 0원을 가른다',
          body:
            '빈 칸·null 을 0원으로 보지 않고 "값 없음"으로 다룹니다. Number("")===0 이 조용히 통과하는 자리이고, ' +
            '환율에서 0원은 화면상 그럴듯해 보여 더 위험합니다 — 지도가 좌표에서 겪은 것과 같은 함정입니다.',
        },
      ],
      features: [
        { title: '출처 2종', body: '수출입은행 고시환율(키 필요) · ECB 참고환율(키 없이).' },
        { title: '교차환율', body: 'ECB 는 유로 기준이라 교차환율로 계산하고 기준통화 유로를 직접 채웁니다.' },
        { title: '기간 조회', body: '통화 하나를 날짜 순으로 폅니다 — 그대로 그래프가 됩니다.' },
        { title: '환전 계산', body: '고시 단위를 반영해 양방향 모두 계산합니다.' },
        { title: '오류 구분', body: '수출입은행의 잘못은 본문 result 값으로 갈라 서로 다른 안내가 되게 합니다.' },
      ],
      files: [
        { path: 'tests/exchange-rate.test.js', label: 'exchange-rate.test.js', description: '단위·빈값·교차환율·계약 12개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"런처는 받아만 오고 해석은 JS 가" 라는 규칙이 두 기능(지도 검색·환율)에 연속으로 적용되면서 패턴이 됐습니다. ' +
            '런처가 둘이라는 사실에서 나온 규칙이라 근거가 분명하고, 덕분에 두 언어에 같은 파싱을 중복해 적을 일이 없습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            'DOM·fetch 가 없어 node --test 로 그대로 검증됩니다. 환율 해석 규칙 12개가 값으로 고정돼 있고, ' +
            '화면(exchange-rate-ui.js)에는 규칙이 한 줄도 없습니다 — MNDataConvert ↔ data-convert-ui.js 와 같은 나눔입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '테스트 중 셋은 브라우저 코드가 아니라 런처와의 계약을 봅니다 — 두 런처가 같은 엔드포인트·같은 목적지를 쓰는지, ' +
            '토큰을 요구하는지, 인증키가 런처 밖으로 나가지 않는지. 지도가 먼저 만든 검사 방식이 그대로 이어졌습니다.',
        },
      ],
    }),

    mod('exchange-rate-ui.js', {
      title: 'exchange-rate-ui.js — 환율 창',
      subtitle: 'Ctrl+K → 환율. 규칙은 한 줄도 두지 않는다',
      summary:
        'MNExchangeRate 에 화면만 붙입니다. 통화·기간을 고르고 표로 보고, 복사·CSV·표 편집기·칠판 그래프 네 갈래로 꺼냅니다. ' +
        '환율 해석 규칙은 여기 한 줄도 없습니다 — 그래야 규칙은 node --test 로, 화면은 눈으로 각각 확인할 수 있습니다.',
      usage: [
        {
          title: '반드시 런처를 거친다',
          body:
            '수출입은행 API 는 CORS 를 열어 주지 않아 브라우저에서 직접 부를 수 없고, 인증키도 HTML·작업공간에 남기면 안 됩니다. ' +
            '그래서 런처로 열지 않았으면(file://·일반 브라우저) 창은 뜨되 조회를 막고 이유를 밝힙니다 — 버튼을 감추지 않는 쪽을 골랐습니다.',
        },
        {
          title: '내보내는 길은 새로 만들지 않았다',
          body:
            '복사·CSV 는 copyDocumentMenuText·saveTextDoc, 표 편집기는 MNTableExport.openInEditor, ' +
            '칠판 그래프는 newWhiteboard → insertBoardChart 입니다. 넷 다 이미 검증된 경로이고, ' +
            '칠판 그래프는 지도의 지역 통계가 먼저 쓴 길과 같습니다.',
        },
        {
          title: '휴일을 거슬러 올라간다',
          body:
            '수출입은행은 영업일에만 값이 있으므로 주말·연휴를 최대 7일까지 거슬러 올라가며 찾습니다. ' +
            '"오늘 값이 없다"고 빈 화면을 보여 주는 대신 가장 가까운 영업일 값을 찾아 주는 선택입니다.',
        },
      ],
      features: [
        { title: '표', body: '통화별 매매기준율과, 값이 있는 출처에서는 송금 보낼 때·받을 때까지.' },
        { title: '환전 계산', body: '금액을 넣으면 양방향으로 환산합니다.' },
        { title: '기간 그래프', body: '통화 하나를 날짜 순으로 펴서 칠판 차트로 넘깁니다.' },
        { title: '칠판 💱', body: '칠판 도구막대에서도 부릅니다. 런처 능력이 없으면 버튼 자체를 감춥니다.' },
      ],
      files: [
        { path: 'tests/e2e/exchange-rate.spec.js', label: 'exchange-rate.spec.js', description: '창 열기·조회·내보내기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"창은 뜨되 조회를 막고 이유를 밝힌다" 와 "칠판 버튼은 아예 감춘다" 를 상황에 따라 갈랐습니다. ' +
            '전자는 기능의 존재를 알려야 하는 자리(명령 팔레트에서 일부러 찾아온 사람)이고, 후자는 도구막대를 어지럽히지 않아야 하는 자리입니다. ' +
            '지도가 "감추지 않고 흐리게 둔다"로 같은 문제를 다룬 것과 함께 보면, 이 코드베이스가 이 판단을 매번 의식적으로 하고 있음이 드러납니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'openExchangeRate 한 함수가 이 파일의 3분의 2입니다. 아직 관리할 만한 크기지만, ' +
            '통화 즐겨찾기·알림 같은 것이 붙으면 지도·연대표가 간 길을 그대로 갑니다. ' +
            '순수부가 이미 완전히 분리돼 있어 다음에 떼어 낼 것은 화면 조립뿐입니다.',
        },
      ],
    }),

    mod('scratchpad.js', {
      title: 'scratchpad.js — 임시 메모',
      subtitle: '여러 탭·블록·펼치기',
      summary:
        '여러 탭 임시 메모와 글·이미지·표·노트북 셀 블록, 배치·크기·잠금·드래그 순서·자동 저장·이전 형식 마이그레이션을 담당합니다. ' +
        '각 블록 도구막대의 ⤢ 는 그 블록만 편집 가능한 채로 펼치고 ⤡ 또는 Esc 로 복귀합니다. ▦ 목록은 메모 카드 격자를 보여 주고, ' +
        '전체 내용 보기를 켜면 모든 메모의 블록을 세로 흐름으로 잇습니다.',
      usage: [
        {
          title: '블록 4종',
          body: '글·이미지·표·노트북 셀. 노트북 셀 블록이 있어 notebook-cells.js 와 이어지고, 표 블록에는 MNTableExport 버튼이 붙습니다.',
        },
        {
          title: '그림 블록은 편집용 스냅샷을 함께 든다',
          body:
            '화이트보드·악보·지도에서 온 그림은 보이는 PNG 옆에 편집용 JSON 스냅샷을 같이 가리킵니다. ' +
            '그래서 메모의 그림을 눌러 원래 문서로 되돌아갈 수 있습니다. ' +
            '이미 그 문서가 탭으로 열려 있는데 내용이 그림과 다르면, 세 종류 모두 같은 규약으로 "새 탭으로 열까요"만 묻습니다 — ' +
            '말없이 열린 탭을 보여 주면 딴판인 문서가 뜨고, 스냅샷으로 되돌리면 메모로 보낸 뒤의 편집이 사라지기 때문입니다.',
        },
        {
          title: '상한을 칸 총수로도 건다',
          body:
            '표 블록은 행·열 상한과 별개로 칸 총수로도 막습니다. 지도 표시 표는 7열이라 200행이면 1,400칸인데, ' +
            '행 상한만 두면 열이 넓은 표에서 화면이 눈에 띄게 밀립니다. 지도 스냅샷은 배경 이미지를 data URI 로 품을 수 있어 상한을 따로 둡니다.',
        },
        {
          title: '마이그레이션',
          body: '이전 형식의 메모 데이터를 새 형식으로 옮기는 코드가 들어 있습니다. 저장 포맷이 여러 번 바뀐 흔적입니다.',
        },
      ],
      features: [
        { title: '펼쳐 보기 2종', body: '블록 하나만 편집 가능하게 펼치기(⤢), 메모 카드 하나를 읽기 전용 전체 내용으로 펼치기.' },
        { title: '전 메모 검색', body: '모든 메모의 제목·본문을 걸러 일치 부분을 강조합니다.' },
        { title: '탭 미리보기', body: '탭에 마우스를 올리면 본문 앞 세 줄이 뜹니다.' },
        { title: 'Esc 단계별 닫기', body: 'tests/e2e/scratchpad-overview.spec.js 가 단계별 복귀를 검증합니다.' },
      ],
      files: [
        { path: 'tests/scratchpad.test.js', label: 'scratchpad.test.js', description: '데이터 이전·블록·잠금·노트북 셀' },
        { path: 'tests/e2e/scratchpad-overview.spec.js', label: 'scratchpad-overview.spec.js', description: '카드 격자·전 메모 검색·Esc' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '이전 형식 마이그레이션 코드를 남겨 두고 테스트로 덮었습니다. 사용자 데이터가 든 로컬 저장소를 다룰 때 반드시 필요한 처리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '한 파일에 메모 모델·블록 4종·펼치기 2종·검색·마이그레이션이 함께 있습니다. mnote.js 와 블록 개념이 겹치는데 코드는 공유하지 않습니다.',
        },
      ],
    }),

    mod('mnote.js', {
      title: 'mnote.js — 블록 문서 (.mnote)',
      subtitle: '글·이미지·표 블록 문서',
      summary:
        '글·이미지·표 블록을 한 문서에서 편집하고 .mnote JSON 으로 저장·재편집합니다. 내용 검색 이동, 되돌리기, HTML/Markdown 내보내기, ' +
        '표 블록의 복사·CSV·표 편집기 버튼을 제공합니다. scratchpad 가 "임시"라면 이쪽은 "저장하는 문서"입니다.',
      usage: [
        {
          title: 'scratchpad 와의 차이',
          body:
            'scratchpad 는 localStorage 기반 임시 메모 탭이고 mnote 는 파일로 저장하는 정식 문서입니다. 블록 개념은 비슷하지만 생명주기가 다릅니다.',
        },
        {
          title: '버전 거부',
          body: 'tests/mnote.test.js 가 지원하지 않는 버전·블록을 거부하는지 검사합니다. 앞으로 포맷이 바뀌어도 안전하게 실패하도록 한 장치입니다.',
        },
      ],
      features: [
        { title: '되돌리기', body: 'MNEditHistory 소비자(text 상한 300).' },
        { title: '내보내기', body: 'HTML·Markdown 으로 뽑습니다.' },
        { title: '맞춤법', body: 'MNKoreanSpellcheck 소비자입니다.' },
      ],
      files: [
        { path: 'docs/mnote-design.md', label: 'mnote-design.md', description: '설계 문서' },
        { path: 'tests/mnote.test.js', label: 'mnote.test.js', description: '직렬화 안정성·버전 거부·본문 검색' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '지원하지 않는 버전을 조용히 무시하지 않고 명시적으로 거부합니다. 사용자 문서 포맷에서 옳은 실패 방식입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'scratchpad.js 와 블록 편집 개념이 겹치는데 코드가 분리돼 있습니다. 블록 렌더·편집 로직을 공유했다면 두 파일 합쳐 3,000줄이 줄었을 것입니다.',
        },
      ],
    }),

    mod('image-memo.js', {
      title: 'image-memo.js — 캡처 이미지 메모',
      subtitle: '붙여넣기·자동 저장·복구',
      summary:
        '캡처 이미지 여러 장 붙여넣기·드롭, EXE 자동 저장, 브라우저 임시 복구, 다시 시도·삭제·미리보기·일반 메모 보내기를 담당합니다. ' +
        'EXE 의 /image-memo-* 엔드포인트를 씁니다.',
      usage: [
        {
          title: '두 저장 경로',
          body: 'EXE 가 있으면 실제 폴더에 저장하고, 없으면 브라우저 임시 저장 후 복구를 제공합니다. 다른 기능과 같은 이중화 패턴입니다.',
        },
      ],
      features: [
        { title: '다중 붙여넣기', body: '여러 장을 한 번에 받습니다.' },
        { title: '재시도', body: '저장 실패한 항목을 다시 시도할 수 있습니다.' },
      ],
      files: [{ path: 'tests/image-memo.test.js', label: 'image-memo.test.js', description: '파일명·자동 저장·임시 복구 조건' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '저장 실패 항목에 재시도를 붙였습니다. 캡처는 다시 만들기 어려운 자료라 유실 방지 가치가 큽니다.',
        },
      ],
    }),

    mod('backup.js', {
      title: 'backup.js — 전체 백업·복원',
      subtitle: '매니페스트가 든 ZIP',
      summary:
        '미저장 작업·메모·복구 데이터와 설정을 전용 매니페스트가 든 ZIP 으로 내보내고, 형식·버전·필수 구조를 검증해 ' +
        'IndexedDB·localStorage·작업공간으로 복원합니다. 여러 저장소에 흩어진 상태를 한 파일로 옮기는 유일한 경로입니다.',
      usage: [
        {
          title: '왜 매니페스트가 필요한가',
          body:
            '아무 ZIP 이나 복원하면 앱 상태가 깨집니다. 전용 매니페스트를 넣고 형식·버전·필수 구조를 검증해 잘못된 파일을 거부합니다.',
        },
        {
          title: '흩어진 저장소',
          body: 'IndexedDB(작업공간·PDF 복구·이미지 메모·노트북 복구) + localStorage(설정·메모·최근 목록) + 서버 저장(EXE)을 모두 모읍니다.',
        },
      ],
      features: [
        { title: '버전 거부', body: 'tests/backup.test.js 가 매니페스트 없는 ZIP 과 버전 불일치를 거부하는지 검사합니다.' },
        { title: '편집기 복구 훅', body: '각 편집기의 복구 데이터를 모으는 훅과 연결됩니다.' },
      ],
      files: [{ path: 'tests/backup.test.js', label: 'backup.test.js', description: '매니페스트·버전 거부·메뉴 연결' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '상태가 4~5개 저장소에 흩어진 앱에서 "한 파일로 백업"을 제공한 것이 실용적입니다. 교실 PC 를 바꾸거나 초기화하는 상황을 상정한 기능입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '백업에 미저장 작업과 설정이 모두 들어갑니다. 파일을 공유하면 작업 내용이 함께 나가므로 사용자가 그 범위를 알 수 있어야 합니다.',
        },
      ],
    }),

    mod('app.js', {
      title: 'app.js — 최종 이벤트 배선',
      subtitle: '앱의 마지막 조립 지점',
      summary:
        '드래그 앤 드롭, 파일/폴더 열기, 설정 모달, 자동 저장 폴더, 도움말, 단축키, 헤더 메뉴, 서버 heartbeat, 앱 시작·종료 흐름을 연결합니다. ' +
        '이 파일 자체에는 도메인 로직이 거의 없고, 앞의 모든 기능을 사용자 동작에 붙이는 일을 합니다. 계층 순서상 마지막에서 두 번째입니다.',
      usage: [
        {
          title: '왜 마지막인가',
          body: '앞의 모든 기능이 정의된 뒤에 이벤트를 걸어야 합니다. manifest 의 의존 선언도 file-loaders·notebook-cells·whiteboard·backup 네 개를 지정합니다.',
        },
        {
          title: '설정 화면',
          body: '단축키 기본값은 state.js 의 SHORTCUT_DEFINITIONS 에 있고, 그것을 편집하는 화면이 여기 있습니다.',
        },
        {
          title: 'heartbeat',
          body: 'EXE 로컬 서버에 주기적으로 살아 있음을 알립니다. 브라우저를 닫으면 서버가 정리될 수 있게 하는 신호입니다.',
        },
      ],
      features: [
        { title: '드래그 앤 드롭', body: '파일·폴더 드롭을 받아 file-loaders 로 넘깁니다. 내부 드래그와 외부 파일 드래그를 MIME 으로 구분합니다.' },
        { title: '설정 모달', body: '일반·문서·자동 저장·단축키 탭.' },
        { title: '단축키 이전', body: 'tests/shortcut-migration.test.js 가 새 기본 단축키의 충돌 회피와 예전 조합 사용자만 1회 이전하는 규칙을 검사합니다.' },
        { title: '시작 화면', body: 'tests/ux-p0.test.js 가 시작 화면 기본 행동과 원본·사본 저장 안내를 고정합니다.' },
      ],
      files: [
        { path: 'tests/shortcut-migration.test.js', label: 'shortcut-migration.test.js', description: '단축키 기본값 이전 규칙' },
        { path: 'tests/ux-p0.test.js', label: 'ux-p0.test.js', description: '시작 화면·저장 대상 안내' },
        { path: 'tests/tool-visibility.test.js', label: 'tool-visibility.test.js', description: '버튼 노출·숨김 레지스트리' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"예전 조합을 쓰던 사용자만 1회 이전"이라는 단축키 마이그레이션 규칙이 세심합니다. 기본값을 바꿀 때 기존 사용자를 다치게 하지 않는 방법을 고민한 흔적입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '한 파일에 앱 전체의 이벤트가 모여 있습니다. 여기서 생긴 버그는 "어떤 기능과 어떤 기능을 같이 썼을 때"라는 조합 조건을 갖기 쉬워 재현이 어렵습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '설정 모달·헤더 메뉴·도움말 같은 UI 가 이벤트 배선과 한 파일에 있습니다. UI 를 별도 파일로 빼면 이 파일의 성격이 훨씬 명확해집니다.',
        },
      ],
    }),

    mod('command-palette.js', {
      title: 'command-palette.js — Ctrl+K 명령 팔레트',
      subtitle: '로드 순서상 마지막 파일',
      summary:
        '명령 목록, 현재 문맥별 활성화 조건, 검색·키보드 선택과 실제 기능 호출을 담당합니다. ' +
        `${manifest.localScripts.length}개 스크립트 중 마지막으로 로드되며, 그 이유는 모든 기능이 준비된 뒤에야 명령으로 노출할 수 있기 때문입니다.`,
      usage: [
        {
          title: '문맥별 활성화',
          body:
            '현재 활성 문서 종류에 따라 쓸 수 있는 명령만 보여 줍니다. PDF 문서에서 표 명령이 나오지 않는 식입니다.',
        },
        {
          title: '기능 발견 경로',
          body:
            '기능이 많은 앱에서 메뉴로 다 노출할 수 없으므로 팔레트가 실질적인 발견 창구입니다. tests/e2e/palette-coverage.spec.js 가 문맥별 항목 노출과 도움말 진입점을 검증합니다.',
        },
      ],
      features: [
        { title: '검색', body: '명령 이름으로 거릅니다.' },
        { title: '키보드 조작', body: '위/아래·Enter 로 실행합니다.' },
        { title: '진입점 통합', body: '형식 변환·여러 파일 찾아 바꾸기·파일 비교·메모 등이 팔레트를 통해 열립니다.' },
      ],
      files: [{ path: 'tests/e2e/palette-coverage.spec.js', label: 'palette-coverage.spec.js', description: '문맥별 항목 노출·도움말 진입점' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '팔레트 항목 노출을 E2E 로 검증합니다. 기능을 추가하고 팔레트 등록을 잊는 흔한 누락을 잡습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '이 파일이 마지막인 것은 우연이 아니라 계약입니다. 여기에 무언가를 추가하려면 그 기능이 이미 정의돼 있어야 합니다.',
        },
      ],
    }),
  ];
};
