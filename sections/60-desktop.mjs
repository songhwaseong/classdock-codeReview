// EXE — desktop/launcher.cs 가 만드는 127.0.0.1 로컬 서버.
// 7천 줄대 단일 C# 파일이라 기능 구간별로 잘라서 싣는다.
//
// 구간을 [시작줄, 끝줄] 로 적어 두면 그 파일이 자라는 순간 다른 코드를 가리킨다. 실제로
// launcher.cs 가 7,118 → 7,861줄이 되면서 여기 걸려 있던 구간 21개가 전부 어긋났고,
// "인증 판정" 을 눌러도 폴더 고르기 코드가 뜨는 상태가 됐다. 그래서 지금은 줄 번호가 아니라
// 코드 안의 잘 안 변하는 문자열(함수 이름·라우팅 경로)을 앵커로 두고 생성 때 다시 찾는다.
// 앵커를 못 찾으면 조용히 넘어가지 않고 생성 스크립트가 경고한다.

import { anchoredRange } from '../lib/source-metrics.mjs';

// 앵커를 찾지 못한 구간. 생성 스크립트가 이 목록을 경고로 찍는다.
export const brokenAnchors = [];

export default ({ helpers, diagrams, rootDir }) => {
  const { sec } = helpers;
  const CAT = 'EXE · 로컬 서버';

  /**
   * @param label       화면에 보일 구간 이름
   * @param anchor      { from, to?, lines?, before?, after? } — lib/source-metrics.mjs 참고
   * @param description 구간 설명
   */
  const L = (label, anchor, description) => {
    const range = anchoredRange(rootDir, 'desktop/launcher.cs', anchor);
    if (!range) brokenAnchors.push(`${label} — ${anchor.from}`);
    return { path: 'desktop/launcher.cs', label, range: range ?? undefined, description };
  };

  return [
    sec({
      id: 'desktop-overview',
      category: CAT,
      group: '개요',
      title: 'EXE 로컬 서버 개요',
      subtitle: 'launcher.cs 한 파일 — 브라우저가 못 하는 일을 여는 계층',
      summary:
        'ClassDock.exe 는 오프라인 HTML 을 리소스로 품고 127.0.0.1 에 작은 HTTP 서버를 띄운 뒤 브라우저를 엽니다. ' +
        '그때 열리는 것은 파일 저장(권한 팝업 없이 실제 경로), 로컬 Python 실행·pip·노트북 커널, 지속형 PowerShell 터미널, ' +
        'PowerPoint 를 이용한 정확한 PPTX→PDF 변환, ffmpeg 미디어 변환, SQLite 읽기·실행, 시험지 LAN 수신입니다. ' +
        '이 능력들은 전부 "브라우저 샌드박스 밖"이라 보안 경계 설계가 이 파일의 절반 가까운 무게를 차지합니다.',
      diagram: diagrams.runtime,
      usage: [
        {
          title: '단일 파일 C#',
          body:
            'launcher.cs 하나에 서버·라우팅·프로세스 관리·파일 IO·보안이 모두 있습니다. .NET Framework 의 csc.exe 로 빌드하며, ' +
            'C# 컴파일러가 없으면 build.bat 이 Go 폴백(main.go)으로 떨어집니다 — 다만 Go 빌드에는 PowerPoint 변환이 없습니다.',
        },
        {
          title: '내장 리소스',
          body:
            'app.html(오프라인 HTML), python_kernel.py, npm_package_runner.js 를 exe 리소스로 넣습니다. 그래서 exe 파일 하나만 옮겨도 앱 전체가 따라갑니다.',
        },
        {
          title: '중요 클래스',
          body:
            'WorkspaceFile(작업공간 항목), LimitedTextBuffer(출력 상한 버퍼), PythonSession(실행 세션), PipJob·NpmJob(설치 작업), ' +
            'TerminalSession(지속 셸), PythonKernel(노트북 커널), SqliteProcessCapture. 각각 상태를 들고 폴링으로 프런트와 통신합니다.',
        },
      ],
      features: [
        { title: '증분 폴링', body: '긴 출력은 전체를 매번 보내지 않고 오프셋 기준 증분만 보냅니다. LimitedTextBuffer 가 그 기반입니다.' },
        { title: '출력 상한', body: '학생 코드의 무한 print 가 서버 메모리를 채우지 않도록 앞 4MB 까지만 보관합니다(진단·채점 마커 구간은 별도 6MB).' },
        { title: '실행 시간 상한', body: '일반 실행에는 WaitForExit 제한이, 노트북 커널 셀에는 10분 제한이 걸립니다.' },
        { title: '메모리 감시', body: '자기 자신과 자식 프로세스(파이썬 커널·드라이버)의 메모리를 측정합니다. 수업용 PC 가 통째로 멈추는 것을 막기 위한 장치입니다.' },
      ],
      files: [
        L('launcher.cs (상수·클래스)', { from: '프로세스 트리', before: 8, lines: 160 }, '메모리 측정, 저장 경로, 상한 값 정의'),
        L('launcher.cs (버퍼·세션 클래스)', { from: 'class WorkspaceFile', before: 2, to: 'class PythonKernel' }, 'WorkspaceFile · LimitedTextBuffer · PythonSession · PipJob · TerminalSession · PythonKernel'),
        { path: 'desktop/main.go', label: 'main.go', description: 'C# 컴파일러가 없을 때의 Go 폴백 런처' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '학생 코드가 서버를 망가뜨릴 수 있는 세 축(출력 폭주, 무한 실행, 메모리 폭주)에 각각 상한을 걸었습니다. 교실 PC 를 상정한 방어로 적절합니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '증분 폴링을 쓴 것이 맞습니다. 누적 출력 전체를 폴링마다 복사·전송했다면 긴 실행에서 서버와 브라우저가 함께 느려졌을 것입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '7,257줄 단일 파일입니다. 라우팅 하나가 else-if 사슬로 이어져 있어 엔드포인트를 추가할 때마다 그 사슬이 길어집니다. ' +
            '메모리에 기록된 리팩터링 백로그에도 이 파일 분할이 첫 항목으로 올라 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'Go 폴백 빌드는 기능이 다릅니다(PowerPoint 변환 없음). 어떤 경로로 빌드됐는지에 따라 사용자가 보는 기능이 달라집니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-boot',
      category: CAT,
      group: '기동',
      title: '기동 · 포트 · 단일 인스턴스',
      subtitle: '고정 포트 후보와 뮤텍스 경쟁 처리',
      summary:
        '브라우저 localStorage 는 origin(127.0.0.1:포트)별로 갈립니다. 매 실행 같은 포트로 떠야 테마·자동복원·탭 순서가 유지되므로, ' +
        '랜덤 포트가 아니라 17645 → 18645 → 19645 → 27645 → 37645 → 47645 라는 고정 후보 목록으로 결정적으로 폴백합니다. ' +
        '직전 인스턴스가 실제로 바인딩한 포트를 파일에 기록해 두고, 다음 실행은 후보 전체를 뒤지지 않고 그 한 곳만 확인해 기동을 빠르게 합니다.',
      usage: [
        {
          title: '단일 인스턴스',
          body:
            '포트 기록이 생기기 전에 두 프로세스가 거의 동시에 뜨는 경쟁을 뮤텍스로 막습니다. 뮤텍스는 프로세스가 강제 종료돼도 OS 가 자동 해제하므로 별도 정리가 필요 없습니다. ' +
            '뒤에 온 프로세스는 앞선 프로세스가 포트를 기록할 때까지 잠시 기다렸다가 브라우저만 엽니다.',
        },
        {
          title: '앱 모드 설정',
          body:
            '탭·주소창 없는 --app 창으로 열지 여부는 브라우저가 앱 화면보다 먼저 실행되므로 localStorage 가 아니라 런처가 읽을 수 있는 파일에 둡니다. 값은 "1" 또는 "0".',
        },
        {
          title: 'TEMP 청소',
          body:
            '지난 실행이 %TEMP% 에 남긴 고아 작업폴더를 지웁니다. 수백 MB 일 수 있어 별도 스레드로 처리해 기동과 첫 화면을 붙잡지 않습니다.',
        },
      ],
      features: [
        { title: 'heartbeat', body: '브라우저가 주기적으로 살아 있음을 알리고, 일정 시간 끊기면 서버가 스스로 정리합니다.' },
        { title: '앱 창 전환 유예', body: '새 앱 창으로 넘어가는 동안 새 페이지 스크립트가 로드될 시간을 보장합니다. 없으면 기존 창을 닫은 뒤 서버가 먼저 종료될 수 있습니다.' },
        { title: '실행별 토큰', body: 'CreateLocalAuthToken() 으로 실행마다 새 토큰을 만들어 HTML 에 심습니다.' },
      ],
      files: [
        L('launcher.cs (Main)', { from: 'static void Main()', before: 9, lines: 106 }, '포트 후보 결정과 단일 인스턴스 처리'),
        L('launcher.cs (설정 상수)', { from: 'static readonly object WorkspaceLock', before: 4, lines: 80 }, '포트 기록·앱 모드·저장 루트·Pyodide·npm 폴더'),
        L('launcher.cs (앱 모드 API)', { from: 'method == "GET" && path == "/launcher-config"', before: 2, lines: 56 }, '/launcher-config · /reopen-app-mode'),
        { path: 'desktop/start-server-hidden.vbs', label: 'start-server-hidden.vbs', description: '콘솔 없이 서버만 띄우는 상시 실행' },
        { path: 'desktop/stop-server.cmd', label: 'stop-server.cmd', description: '서버 종료' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"왜 랜덤 포트가 아닌가"를 주석으로 정확히 설명했습니다. origin 이 바뀌면 브라우저 저장소가 통째로 초기화된다는 이 결정의 근거가 코드에 남아 있어 나중에 되돌릴 위험이 낮습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '뮤텍스를 고른 이유("강제 종료돼도 OS 가 해제")까지 적었습니다. 정리 코드가 없는 것이 실수가 아니라 선택임이 드러납니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '고정 포트라 같은 PC 의 다른 프로그램이 17645 를 쓰면 다음 후보로 밀리고, 그때는 사용자가 즐겨찾기 주소를 직접 바꿔야 합니다. README 에 안내돼 있지만 사용자 부담입니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-security',
      category: CAT,
      group: '보안',
      title: '보안 게이트 — 토큰 · Host · Origin',
      subtitle: '로컬 서버를 다른 페이지로부터 지키는 세 겹',
      summary:
        '127.0.0.1 에 뜬 서버는 같은 PC 의 어떤 웹페이지도 부를 수 있습니다. 그래서 세 겹으로 막습니다 — ' +
        '① 실행별 토큰(X-ClassDock-Token)을 상수 시간 비교로 검증, ② Host 헤더가 127.0.0.1/localhost 인지 확인해 DNS rebinding 을 차단, ' +
        '③ Origin 이 있으면 현재 loopback origin 과 일치하는지 확인. Origin 을 생략하는 로컬 도구를 위해 그 경우에는 토큰 검증을 경계로 삼습니다.',
      usage: [
        {
          title: '토큰이 필요한 엔드포인트',
          body:
            '작업공간 저장·삭제, 앱 상태, 변환, SQLite, 파일 저장, 폴더 열기, 런처 설정, 소스 폴더, 이미지 메모, 자동완성·정의, ' +
            'pip, heartbeat, 파이썬 커널·세션, 터미널 세션, 실행, 시험지 수신 — RequiresLocalAuthToken 이 메서드와 경로로 판정합니다.',
        },
        {
          title: '상수 시간 비교',
          body:
            'TokenEquals 가 길이 차이를 XOR 로 섞고 전체를 순회한 뒤 한 번에 판정합니다. 조기 반환을 없애 타이밍 공격 표면을 줄인 구현입니다.',
        },
        {
          title: '예외 하나',
          body:
            '지도 스냅샷의 sandbox iframe 은 Origin: null 로 /tile-proxy 만 호출합니다. 이 경로만 예외로 두고, 대신 별도의 목적지 allowlist 로 보호합니다.',
        },
      ],
      features: [
        { title: '무단 요청 본문 미판독', body: '인증 실패 요청은 본문을 읽지 않습니다. 큰 무단 요청으로 메모리·I/O 를 점유하는 것을 막습니다.' },
        { title: '경로 제한', body: '소스 폴더 접근은 실행 중 발급한 ID 로만 후속 요청을 받아, 선택한 루트 밖 파일에 닿지 못하게 합니다.' },
        { title: 'SQLite 안전 조건', body: '최초 편집 활성화 때 브라우저가 연 파일의 SHA-256 과 디스크 파일이 일치해야 합니다.' },
        { title: '테스트', body: 'tests/local-server-security.test.js 가 인증·경로 검증·보안 헤더·실행 상한을 검사합니다.' },
      ],
      files: [
        L('launcher.cs (인증 판정)', { from: 'static bool TokenEquals', before: 4, to: 'static bool IsImageMemoExtension', after: -1 }, 'TokenEquals · HasAllowedLocalHost · HasAllowedLocalOrigin · RequiresLocalAuthToken'),
        L('launcher.cs (요청 처리 진입)', { from: '지도 스냅샷의 sandbox iframe', before: 40, lines: 116 }, '인증 적용과 tile-proxy 예외'),
        { path: 'tests/local-server-security.test.js', label: 'local-server-security.test.js', description: '로컬 API 보안 계약 테스트' },
        { path: 'src/js/state-sync.js', label: 'state-sync.js', description: '프런트에서 토큰을 붙이는 쪽' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'DNS rebinding 을 명시적으로 의식하고 Host 헤더까지 검증합니다. loopback 서버에서 흔히 빠뜨리는 방어이고, 주석에 이유도 남아 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '이 리뷰의 계약 카드는 launcher.cs 의 라우팅과 생성 시 대조합니다 — 런처에 있는데 카드가 없는 경로, ' +
            '카드가 적었는데 런처에 없는 경로, 두 카드가 겹쳐 맡은 경로를 각각 경고합니다. ' +
            '전역 공개 API 와 달리 엔드포인트에는 manifest 같은 정답 목록이 없어 라우팅 사슬 자체를 목록으로 삼았습니다. ' +
            '이 검사가 없던 동안 지도 엔드포인트 10개가 조용히 빠진 채로 남아 있었습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '인증 실패 요청의 본문을 읽지 않는 처리가 좋습니다. 인증 전에 큰 본문을 버퍼링하는 서버는 손쉬운 자원 소모 표적이 됩니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'SQLite 편집을 "브라우저가 연 파일의 해시와 디스크 파일이 일치할 때만" 으로 묶었습니다. 경로만 믿지 않는 설계입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'RequiresLocalAuthToken 이 문자열 비교와 StartsWith 의 긴 목록입니다. 새 엔드포인트를 추가하면서 여기 등록을 잊으면 인증 없이 열립니다 — ' +
            '기본이 "토큰 불필요"이고 예외를 열거하는 구조라 실수의 방향이 위험한 쪽입니다. 기본을 반대로(모두 필요, 공개 목록만 예외) 두는 편이 안전합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Origin 헤더가 없으면 통과시킵니다(토큰이 있다는 전제). 브라우저가 아닌 로컬 프로세스는 Origin 을 붙이지 않으므로, 토큰이 유출되면 이 층은 방어가 되지 않습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-save',
      category: CAT,
      group: '파일',
      title: '파일 저장과 저장 루트',
      subtitle: '권한 팝업 없이 실제 디스크에 쓰는 경로',
      summary:
        '브라우저에서 편집한 코드를 권한 팝업 없이 바로 저장하는 폴더(기본: 내 문서\\ClassDock)를 런처가 관리합니다. ' +
        '프런트는 X-Save-Path 헤더(저장 루트 기준 상대경로, 퍼센트 인코딩)와 본문으로 /save-file 을 호출하고, ' +
        '/save-file-exists 로 첫 저장 전 충돌을 확인합니다. 저장 후 "저장 폴더" 버튼은 그 파일을 하이라이트한 채 탐색기를 엽니다.',
      usage: [
        {
          title: '저장 루트를 두는 이유',
          body:
            'File System Access 를 못 쓰는 브라우저나 낱개 파일 드래그에서는 원본 저장이 불가능합니다. 그때 다운로드 폴더로 흩어지지 않게 한곳으로 모읍니다.',
        },
        {
          title: '폴더 선택',
          body: '/choose-save-folder 가 네이티브 폴더 선택창을 띄웁니다. 버튼을 누른 브라우저 창을 소유자로 지정해 선택창이 뒤에 숨지 않게 합니다.',
        },
        {
          title: '소스 폴더',
          body:
            '브라우저 API 가 숨기는 드라이브 포함 절대경로를 터미널 작업폴더로 전달하되, 선택한 루트 밖 파일에는 접근하지 못하도록 실행 중 발급한 ID 로만 후속 요청을 받습니다.',
        },
      ],
      features: [
        { title: '탐색기 연동', body: '/open-save-folder · /open-file-folder 가 실제 경로로 탐색기를 엽니다. Windows Shell 을 직접 호출합니다.' },
        { title: '충돌 확인', body: '/save-file-exists 로 새 문서의 첫 저장 전 기존 파일과의 충돌을 확인합니다.' },
        { title: '이미지 메모', body: '/image-memo-list · /image-memo-file · /image-memo-delete 로 캡처 이미지를 관리합니다.' },
      ],
      files: [
        L('launcher.cs (저장 루트)', { from: 'method == "GET" && path == "/save-root"', before: 6, lines: 126 }, '/save-root · /open-save-folder · /open-file-folder · /choose-save-folder'),
        L('launcher.cs (파일 쓰기)', { from: 'method == "GET" && path == "/image-memo-list"', before: 14, lines: 104 }, '/image-memo-* · /save-file-exists · /save-file'),
        { path: 'tests/native-folder-terminal.test.js', label: 'native-folder-terminal.test.js', description: '실제 경로 전달과 Shell 직접 호출' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '폴더 선택창의 소유자 창을 지정해 창이 뒤로 숨지 않게 한 디테일이 좋습니다. 실사용에서 "눌렀는데 아무 일도 안 난다"로 보이는 문제입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '저장 경로는 헤더의 상대경로 문자열입니다. 경로 탈출(..)에 대한 검증이 반드시 필요한 지점이고, local-server-security.test.js 가 이를 다루지만 ' +
            '엔드포인트를 추가할 때마다 같은 검증을 반복해야 하는 구조입니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-js-npm',
      category: 'EXE · 로컬 서버',
      group: '기능별',
      title: 'JavaScript npm 패키지 캐시',
      subtitle: '토큰·사용자 확인·install script 차단·브라우저 Worker 번들',
      summary:
        'EXE에서만 Node.js와 npm을 찾아 사용자가 고른 레지스트리 패키지를 별도 캐시에 설치하고, 고정한 esbuild 0.25.8로 브라우저 Worker용 IIFE 번들을 만듭니다. ' +
        '설치 시작·증분 로그·취소·목록·번들 읽기·삭제를 /js-npm-* API로 제공하며 모든 경로는 실행별 토큰으로 보호됩니다.',
      usage: [
        {
          title: '두 번의 명시적 승인',
          body:
            '일반 로컬 API 토큰 외에 설치 시작은 X-ClassDock-Npm-Confirm: 1 헤더를 별도로 요구합니다. 화면도 패키지 다운로드와 실행 위험을 확인한 뒤에만 이 헤더를 보냅니다.',
        },
        {
          title: '설치와 실행의 분리',
          body:
            'npm_package_runner.js가 --ignore-scripts로 설치한 뒤 esbuild로 브라우저용 번들을 만들고, 런처는 완성된 bundle.js와 metadata.json만 프런트에 제공합니다.',
        },
        {
          title: '캐시 위치',
          body:
            'LocalApplicationData 아래 js-npm-packages에 최대 20개를 보관합니다. 중간 .work-*와 .old-* 폴더는 다음 설치 전에 복구·정리합니다.',
        },
      ],
      features: [
        { title: '설치 제한', body: '한 설치 250MB, 결과 번들 8MB, 실행 8분, 동시에 하나의 설치 작업만 허용.' },
        { title: '증분 폴링', body: '설치 로그 길이를 from으로 보내 새 부분만 받고, 완료 작업은 10분 또는 최근 8개를 넘으면 정리합니다.' },
        { title: '패키지 식별자', body: '요청 spec과 Worker 전역 이름의 SHA-256 앞 16바이트를 32자리 id로 사용해 경로 문자를 외부 입력에서 분리합니다.' },
        { title: '복구 가능한 교체', body: '새 설치를 stage에 만든 뒤 기존 캐시를 .old-*로 옮겨 교체하고, 실패하면 이전 폴더를 복구합니다.' },
      ],
      files: [
        L('launcher.cs (npm 라우팅)', { from: 'method == "GET" && path == "/js-npm-status"', before: 14, lines: 62 }, '/js-npm-status·list·bundle·install-start·install-poll·install-cancel·remove'),
        L('launcher.cs (npm 구현)', { from: 'static string JsNpmStatus()', before: 60, lines: 405 }, '입력 검증·Node 탐색·프로세스·캐시·폴링'),
        { path: 'desktop/npm_package_runner.js', label: 'npm_package_runner.js', description: '--ignore-scripts 설치와 esbuild Worker 번들 생성' },
        { path: 'tests/js-npm-desktop.test.js', label: 'js-npm-desktop.test.js', description: '토큰·제한·EXE 리소스 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '패키지명·선택 버전·전역 이름을 정규식으로 제한하고, 디스크 경로에는 외부 문자열 대신 해시 id만 씁니다. 경로 탈출과 명령 인자 주입을 서로 다른 층에서 막습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: 'npm install에 --ignore-scripts를 강제해 패키지의 preinstall·postinstall 코드가 로컬 PC에서 실행되지 않게 합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '250MB 상한은 npm install이 끝난 뒤 stage 폴더 크기를 재서 적용합니다. 매우 큰 패키지는 거부되기 전까지 디스크와 네트워크를 이미 사용할 수 있으므로 사전 상한이 아니라 사후 정리 장치입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'install script를 막아도 패키지 본문은 사용자가 선택한 순간 Worker 안에서 실행됩니다. 내장 라이브러리와 달리 검증된 코드가 아니므로 UI의 신뢰 경고가 보안 경계의 일부입니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-python',
      category: CAT,
      group: 'Python',
      title: 'Python 실행 · 진단 · pip',
      subtitle: '로컬 Python 탐색부터 설치 진행률까지',
      summary:
        '/can-run-python 으로 로컬 Python 가용 여부를 알려 주어 프런트가 로컬 실행/Pyodide 분기를 미리 정하게 하고, ' +
        '/run-python 과 /run-python-bundle 로 실제 실행합니다. 파이썬을 새로 설치한 사용자가 exe 를 껐다 켜지 않아도 되도록 /python-rescan 으로 캐시를 비우고 다시 찾습니다. ' +
        'pip 설치는 /pip-install-start 로 시작하고 /pip-install-poll 로 진행률을 증분 폴링합니다.',
      usage: [
        {
          title: '세션 모델',
          body:
            'PythonSession 이 실행 하나를 나타내고, 출력은 LimitedTextBuffer 에 흘려 담깁니다. 프런트는 /python-session-poll 로 오프셋 이후 증분만 받아 갑니다.',
        },
        {
          title: '출력 상한의 이중 구조',
          body:
            '일반 출력은 앞 4MB 까지, 진단·채점·단계 실행이 쓰는 "stdout 끝의 전용 마커 뒤 JSON" 구간은 별도로 6MB 까지 보존합니다. ' +
            '무한 print 로 앞이 꽉 차도 결과 JSON 은 살아남게 한 설계입니다.',
        },
        {
          title: '자동완성·정의',
          body:
            '/complete 와 /definition 이 Jedi 를 씁니다. /can-complete 로 사용 가능 여부를 확인하고 없으면 1회 설치를 시도합니다. ' +
            '/python-import-index 는 로컬 환경의 모듈 목록을 줍니다.',
        },
      ],
      features: [
        { title: '번들 실행', body: '/run-python-bundle 이 옆 파일까지 포함한 작업폴더를 만들어 실행합니다.' },
        { title: '프로젝트 동기화', body: '/python-project-sync 가 편집 중인 프로젝트 파일을 실행 환경에 반영합니다.' },
        { title: '진단', body: '/python-diagnostics 가 환경 상태를 알려 줍니다.' },
        { title: '설치 진행 표시', body: 'tests/python-pip-install-progress.test.js 가 라벨 축약과 경과 시간 표시를 검사합니다.' },
      ],
      files: [
        L('launcher.cs (가용성)', { from: 'path == "/can-run-python"', before: 2, lines: 24 }, '/can-run-python · /python-diagnostics · /python-rescan'),
        L('launcher.cs (pip)', { from: 'method == "POST" && path == "/pip-install-start"', before: 26, lines: 60 }, '/pip-install · /pip-install-start'),
        L('launcher.cs (실행)', { from: 'method == "POST" && path == "/run-python"', before: 4, lines: 60 }, '/run-python · /run-python-bundle'),
        L('launcher.cs (진단·자동완성)', { from: '로컬 파이썬 + Jedi 사용 가능 여부', before: 3, to: 'method == "POST" && path == "/definition"', after: 14 }, '/can-complete · /python-import-index · /complete · /definition'),
        { path: 'tests/python-pip-install-progress.test.js', label: 'pip-install-progress.test.js', description: '설치 진행 라벨·경과 시간' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '결과 JSON 구간에 별도 상한을 둔 것이 정확합니다. 일반 상한만 있었다면 출력이 많은 학생 코드에서 채점 결과가 잘려 "채점이 안 된다"가 됐을 것입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '/python-rescan 이 있습니다. 파이썬을 방금 설치한 사용자가 프로그램을 껐다 켜야 하는 흔한 불편을 없앴습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '임의의 Python 코드를 로컬에서 실행하는 엔드포인트입니다. 토큰이 유일한 경계이므로, 토큰 생성·전달 경로가 이 앱에서 가장 중요한 보안 자산입니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-terminal-kernel',
      category: CAT,
      group: 'Python',
      title: '지속형 터미널과 노트북 커널',
      subtitle: 'PowerShell 세션과 셀 간 상태 유지',
      summary:
        'TerminalSession 은 지속형 로컬 PowerShell 을, PythonKernel 은 노트북 셀을 같은 전역 변수 공간에서 차례로 실행하는 지속형 Python 프로세스를 나타냅니다. ' +
        '둘 다 프로세스가 살아 있으므로 일반 실행의 WaitForExit 제한을 타지 않습니다. 대신 커널 셀에는 10분 제한을 별도로 겁니다 — ' +
        '무한 실행은 막되 데이터 분석 셀은 일반 스크립트보다 길 수 있다는 판단입니다.',
      usage: [
        {
          title: '커널이 별도 파일인 이유',
          body:
            '실제 커널 로직은 desktop/python_kernel.py(507줄)에 있고 exe 리소스로 들어갑니다. C# 이 프로세스를 띄우고 표준입출력으로 통신합니다.',
        },
        {
          title: '터미널 자동완성',
          body: '/terminal-complete 가 셸 자동완성을 제공합니다. 지속 세션이라 현재 작업 폴더 기준으로 동작합니다.',
        },
      ],
      features: [
        { title: '세션 개폐', body: '/terminal-session-open · /terminal-session-poll 로 열고 증분 출력을 받습니다.' },
        { title: '커널 번들', body: '/python-kernel-start-bundle 이 노트북 작업공간 파일까지 포함해 커널을 시작합니다.' },
        { title: '커널 파일 접근', body: '/python-kernel-file 로 커널 작업폴더의 산출물을 가져옵니다.' },
      ],
      files: [
        L('launcher.cs (커널)', { from: 'method == "POST" && path == "/python-kernel-start-bundle"', before: 12, lines: 90 }, '/python-kernel-start-bundle'),
        L('launcher.cs (터미널)', { from: 'method == "POST" && path == "/terminal-session-open"', before: 4, to: 'method == "POST" && path == "/terminal-complete"', after: 12 }, '/terminal-session-open · /terminal-complete'),
        { path: 'desktop/python_kernel.py', label: 'python_kernel.py', description: '실제 커널 프로세스' },
        { path: 'tests/python-terminal-shared.test.js', label: 'python-terminal-shared.test.js', description: '공유 터미널 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '커널 셀 제한을 일반 실행과 다르게(10분) 둔 판단에 근거가 적혀 있습니다. 상한 값이 임의로 정해진 것이 아님이 드러납니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '지속형 PowerShell 은 사실상 원격 셸입니다. 이 앱에서 가장 강력한 기능이고, 토큰 검증이 이 엔드포인트에서 실수로 빠지면 피해가 가장 큽니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '커널 프로세스는 exe 종료 시 함께 정리돼야 합니다. 자식 프로세스 메모리를 측정하는 코드가 이 프로세스 트리를 함께 봅니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-convert-sqlite',
      category: CAT,
      group: '변환 · DB',
      title: 'PPTX·미디어 변환과 SQLite',
      subtitle: '설치된 PowerPoint, ffmpeg, DB 파일 직접 실행',
      summary:
        '/convert-pptx 는 설치된 PowerPoint 를 COM 으로 몰아 PPTX 를 PDF 로 정확히 변환합니다(근사 미리보기와 품질 차이가 가장 큰 지점). ' +
        '/convert-media 는 ffmpeg 로 브라우저가 못 여는 영상을 MP4 로 바꾸고, 없으면 /install-ffmpeg 로 설치합니다. ' +
        'SQLite 는 /sqlite-preview(작업공간 파일), /sqlite-disk-preview(디스크 원본), /sqlite-exec(임의 SQL) 세 갈래입니다.',
      usage: [
        {
          title: 'SQLite 안전 조건',
          body:
            '저장 루트의 실제 DB 를 읽되, 최초 편집 활성화 때는 브라우저가 연 파일의 SHA-256 과 디스크 파일이 일치해야 합니다. ' +
            '이후 새로고침은 이미 확인된 같은 상대경로를 다시 읽습니다.',
        },
        {
          title: 'SQL 실행 규칙',
          body:
            '경로는 X-Db-Path(퍼센트 인코딩, 저장 루트 기준 상대경로), SQL 은 본문 텍스트입니다. 단일 트랜잭션으로 처리하고 ' +
            '수정 계열이면 같은 폴더에 일관된 .bak 백업을 남깁니다.',
        },
        {
          title: '가용성 사전 확인',
          body: '/can-convert · /can-convert-media · /can-run-python · /can-save-file 로 프런트가 미리 분기할 수 있게 합니다.',
        },
      ],
      features: [
        { title: 'ffmpeg 설치 진행', body: '/ffmpeg-install-status 로 설치 상태를 폴링합니다.' },
        { title: 'DB 백업', body: '수정 SQL 전에 .bak 을 남깁니다.' },
        { title: '메모리 보고', body: '/mem 이 프로세스 트리 메모리를 알려 줍니다.' },
      ],
      files: [
        L('launcher.cs (변환)', { from: 'method == "POST" && path == "/convert-pptx"', before: 4, to: 'method == "POST" && path == "/install-ffmpeg"', after: 14 }, '/convert-pptx · /convert-media · /install-ffmpeg'),
        L('launcher.cs (SQLite)', { from: 'method == "POST" && path == "/sqlite-preview"', before: 1, to: 'method == "POST" && path == "/sqlite-exec"', after: 16 }, '/sqlite-preview · /sqlite-disk-preview · /sqlite-exec'),
        { path: 'tests/sqlite-editor-safety.test.js', label: 'sqlite-editor-safety.test.js', description: 'DB 편집 안전 조건' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '수정 SQL 전에 .bak 백업을 남깁니다. 임의 SQL 실행을 허용하는 기능에서 최소한의 되돌릴 길을 만들어 둔 것입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '해시 일치를 편집 활성화 조건으로 삼았습니다. "브라우저에서 연 파일"과 "디스크에서 열 파일"이 같음을 확인하는 정확한 방법입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '임의 SQL 실행(DDL/DML 포함)을 여는 엔드포인트입니다. 저장 루트로 경로가 제한되지만, 그 안에서는 무엇이든 가능합니다. ' +
            '.bak 이 유일한 안전망이라 백업 실패 시의 동작이 중요합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'PowerPoint COM 자동화는 사용자 PC 의 PowerPoint 를 실제로 띄웁니다. 변환 중 사용자가 PowerPoint 를 조작하면 충돌할 수 있습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-exam-lan',
      category: CAT,
      group: '시험지',
      title: '시험지 LAN 수신',
      subtitle: '선생님 PC 를 제출 서버로 여는 별도 리스너',
      summary:
        '학생이 파일을 옮기지 않고 선생님 PC 로 바로 제출할 수 있게, 런처가 제출 전용 리스너를 엽니다. ' +
        '/exam-receive-start 로 열고 /exam-receive-stop 으로 닫으며 /exam-receive-status 로 접수 목록을 폴링합니다. ' +
        '학생 쪽은 주소와 6자리 코드로 연결하고, 실패하면 파일 제출로 폴백합니다.',
      usage: [
        {
          title: '별도 리스너인 이유',
          body:
            '앱 서버는 loopback 전용이라 다른 PC 가 접근할 수 없습니다. 교실 제출은 LAN 접근이 필요하므로 목적이 다른 리스너를 따로 엽니다.',
        },
        {
          title: '6자리 코드',
          body: '주소만으로는 아무나 붙을 수 있으므로 코드를 함께 요구합니다. 수업 시간 동안만 열리는 임시 채널입니다.',
        },
      ],
      features: [
        { title: '개폐 제어', body: '선생님이 명시적으로 열고 닫습니다. 상시 열려 있지 않습니다.' },
        { title: '접수 목록', body: '폴링으로 누가 냈는지 실시간 확인합니다.' },
        { title: '폴백', body: '연결 실패 시 학생은 파일 제출로 돌아갑니다.' },
      ],
      files: [
        L('launcher.cs (제출 수신)', { from: 'method == "GET" && path == "/exam-hello"', before: 40, lines: 137 }, '/exam-hello 와 제출 리스너'),
        L('launcher.cs (수신 개폐)', { from: 'method == "POST" && path == "/exam-receive-start"', before: 2, to: 'method == "POST" && path == "/exam-receive-stop"', after: 12 }, '/exam-receive-start · /exam-receive-stop'),
        { path: 'docs/시험지-온라인제출-설계.md', label: '온라인제출-설계.md', description: '설계 문서' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '제출 리스너를 앱 서버와 분리하고 선생님이 명시적으로 열고 닫게 했습니다. LAN 노출 면적을 수업 시간으로 한정하는 옳은 구조입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '6자리 코드는 짧습니다. 같은 LAN 에 있는 학생이 무차별 시도하면 뚫릴 수 있으므로, 시도 횟수 제한이나 코드 회전이 있는지 확인이 필요합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'LAN 리스너는 loopback 이 아니므로 Host·Origin 검증이 그대로 적용되지 않습니다. 이 경로의 입력 검증은 별도로 봐야 합니다.',
        },
      ],
    }),

    sec({
      id: 'desktop-build',
      category: CAT,
      group: '빌드',
      title: 'EXE 빌드와 Go 폴백',
      subtitle: 'csc.exe 우선, 없으면 go build',
      summary:
        'build.bat 은 세 단계입니다 — ① 오프라인 HTML 을 app.html 로 복사 ② csc.exe 로 launcher.cs 를 컴파일하며 app.html·python_kernel.py·npm_package_runner.js 를 리소스로 넣기 ' +
        '③ 결과를 프로젝트 루트의 ClassDock.exe 로 출력. C# 컴파일러가 없으면 Go 폴백(main.go)으로 빌드하는데, 이때는 PowerPoint 변환 기능이 빠집니다.',
      usage: [
        {
          title: '선행 조건',
          body:
            '..\\classdock-offline.html 이 있어야 합니다. 없으면 "node build-offline.js 를 먼저 실행하라"는 메시지와 함께 중단합니다.',
        },
        {
          title: '.NET Framework 사용',
          body:
            '%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe 를 직접 부릅니다. SDK 설치 없이 Windows 에 기본 포함된 컴파일러를 쓰는 방식입니다.',
        },
        {
          title: '작업 순서',
          body:
            'AGENTS.md 규칙: 실행 중인 ClassDock.exe 프로세스를 먼저 종료하고 → 오프라인 HTML 생성 → desktop\\build.bat. 순서를 지키지 않으면 파일 잠김으로 실패합니다.',
        },
      ],
      features: [
        { title: '리소스 내장', body: '/resource:app.html, /resource:python_kernel.py, /resource:npm_package_runner.js 로 exe 안에 넣습니다.' },
        { title: 'winexe', body: '/target:winexe 라 콘솔 창이 뜨지 않습니다.' },
        { title: 'build-dotnet.bat', body: 'Go 폴백 없이 C# 만 강제하는 변형입니다.' },
      ],
      files: [
        { path: 'desktop/build.bat', label: 'build.bat', description: '기본 빌드(Go 폴백 포함)' },
        { path: 'desktop/build-dotnet.bat', label: 'build-dotnet.bat', description: 'C# 전용 빌드' },
        { path: 'desktop/main.go', label: 'main.go', description: 'Go 폴백 런처' },
        { path: 'desktop/console_windows.go', label: 'console_windows.go', description: 'Go 빌드의 콘솔 숨김' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'Windows 기본 포함 csc.exe 를 쓰므로 빌드 머신에 .NET SDK 설치가 필요 없습니다. 교실·학교 PC 환경을 고려한 선택입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Go 폴백은 기능이 다른 산출물을 같은 파일명으로 만듭니다. 빌드 로그를 보지 않으면 어느 쪽으로 빌드됐는지 알 수 없어, PowerPoint 변환이 조용히 사라질 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'EXE 는 서명되지 않아 SmartScreen 경고가 뜹니다. 배포 대상이 학교라면 이 부분이 실제 도입 장벽이 됩니다.',
        },
      ],
    }),
  ];
};
