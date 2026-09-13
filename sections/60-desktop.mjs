// EXE — desktop/launcher.cs 가 만드는 127.0.0.1 로컬 서버.
// 만 줄이 넘는 단일 C# 파일이라 기능 구간별로 잘라서 싣는다(정확한 줄 수는 생성 때 잰다).
//
// 구간을 [시작줄, 끝줄] 로 적어 두면 그 파일이 자라는 순간 다른 코드를 가리킨다. 실제로
// launcher.cs 가 7,118 → 7,861줄이 되면서 여기 걸려 있던 구간 21개가 전부 어긋났고,
// "인증 판정" 을 눌러도 폴더 고르기 코드가 뜨는 상태가 됐다. 그래서 지금은 줄 번호가 아니라
// 코드 안의 잘 안 변하는 문자열(함수 이름·라우팅 경로)을 앵커로 두고 생성 때 다시 찾는다.
// 앵커를 못 찾으면 조용히 넘어가지 않고 생성 스크립트가 경고한다.

import { anchoredRange, linesLabel } from '../lib/source-metrics.mjs';

// 앵커를 찾지 못한 구간. 생성 스크립트가 이 목록을 경고로 찍는다.
export const brokenAnchors = [];

export default ({ helpers, diagrams, rootDir }) => {
  const { sec } = helpers;
  const CAT = 'EXE · 로컬 서버';
  // 줄 수는 문장에 적지 않고 생성 때 잰다(lib/source-metrics.mjs 의 이유 참고).
  const workerLines = linesLabel(rootDir, 'desktop/db_worker.py');
  const launcherLines = linesLabel(rootDir, 'desktop/launcher.cs');

  /**
   * @param label       화면에 보일 구간 이름
   * @param anchor      { from, to?, lines?, before?, after? } — lib/source-metrics.mjs 참고
   * @param description 구간 설명
   */
  /*
   * 앵커를 못 찾으면 경고대로 "코드 없이" 싣는다([0, 0] → 빈 구간).
   * 예전에는 range 를 undefined 로 넘겼는데, readSource 는 range 가 없으면 파일 전체를 싣는다.
   * 2026-09-13 에 앵커 하나(class WorkspaceFile — 소스에서 클래스가 사라짐)가 깨지자 그 한 칸이
   * launcher.cs 전체를 끌어와 "상한을 넘겨 꼬리가 잘린 파일" 경고까지 냈다. 원인은 앵커 하나였는데
   * 경고는 두 개였고, 둘 중 더 무거워 보이는 쪽(잘림)은 증상이었다.
   */
  const L = (label, anchor, description) => {
    const range = anchoredRange(rootDir, 'desktop/launcher.cs', anchor);
    if (!range) brokenAnchors.push(`${label} — ${anchor.from}`);
    return range
      ? { path: 'desktop/launcher.cs', label, range, description }
      : { path: 'desktop/launcher.cs', label, range: [0, 0], description: `(앵커를 찾지 못해 코드 없이 실림) ${description}` };
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
          title: '거의 단일 파일 C#',
          body:
            'launcher.cs 하나에 서버·라우팅·프로세스 관리·파일 IO·보안이 모두 있습니다. .NET Framework 의 csc.exe 로 빌드하며, ' +
            'C# 컴파일러가 없으면 build.bat 이 Go 폴백(main.go)으로 떨어집니다 — 다만 Go 빌드에는 PowerPoint 변환과 SSH 원격 터미널이 없습니다. ' +
            '2026-08-21 에 SSH 백엔드가 desktop/ssh_terminal.cs 로 갈라져, EXE 소스가 두 파일이 됐습니다 — launcher.cs 쪽에는 라우팅만 남습니다.',
        },
        {
          title: '내장 리소스',
          body:
            'app.html(오프라인 HTML), python_kernel.py, npm_package_runner.js 를 exe 리소스로 넣습니다. 그래서 exe 파일 하나만 옮겨도 앱 전체가 따라갑니다.',
        },
        {
          title: '중요 클래스',
          body:
            'LimitedTextBuffer(출력 상한 버퍼), PythonSession·JavaSession(실행 세션), PipJob·NpmJob·JavaLibJob(설치 작업), ' +
            'TerminalSession(지속 셸), PythonKernel(노트북 커널), MediaConvertJob(경로 방식 MP4 변환), SqliteProcessCapture. 각각 상태를 들고 폴링으로 프런트와 통신합니다. ' +
            '작업공간 항목을 담던 WorkspaceFile 은 2026-09-06 에 사라졌습니다 — 저장이 파일 전체를 객체 목록으로 읽어 다시 직렬화하던 방식에서 ' +
            '레코드 위치만 기억하고 흘려 쓰는 WorkspaceBodyRecord·RewriteWorkspace 로 바뀌었기 때문입니다.',
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
        L('launcher.cs (버퍼·세션 클래스)', { from: 'class LimitedTextBuffer', before: 2, to: 'class PythonKernel' }, 'LimitedTextBuffer · PythonSession · JavaSession · PipJob · NpmJob · TerminalSession · PythonKernel'),
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
            `${launcherLines} 단일 파일입니다. 라우팅 하나가 else-if 사슬로 이어져 있어 엔드포인트를 추가할 때마다 그 사슬이 길어집니다. ` +
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
        L('launcher.cs (Main)', { from: 'public static void Run()', before: 9, lines: 106 }, '포트 후보 결정과 단일 인스턴스 처리'),
        L('launcher.cs (단일 인스턴스 확인)', { from: '// 포트 파일만으로는 두 프로세스가 동시에 시작하는 순간을 막을 수 없으므로', to: 'static bool IsOurServerAt(int port)', after: 20 }, 'OS 뮤텍스 획득 · 기록된 포트의 /ping 으로 우리 서버인지 확인'),
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
        L('launcher.cs (작업공간 저장)', { from: '===== 최근 작업공간', to: 'static int RemoveWorkspaceFiles(byte[] body)', after: 30 }, '레코드 색인 · 흘려 쓰기(RewriteWorkspace) · 원자적 교체 · 512MB 상한'),
        { path: 'tests/native-folder-terminal.test.js', label: 'native-folder-terminal.test.js', description: '실제 경로 전달과 Shell 직접 호출' },
        { path: 'tests/workspace-atomic-save.test.js', label: 'workspace-atomic-save.test.js', description: '실제 launcher.cs 복사본의 File.Replace·Move 에 실패를 주입해 csc 로 컴파일·실행 — 원본 보존과 임시 파일 정리' },
        { path: 'tests/local-file-save.test.js', label: 'local-file-save.test.js', description: '실제 HTTP 저장 경로가 불완전 본문·교체 실패에서 원본을 보존하는지' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '작업공간 저장을 "전체 읽기 → 항목별 파싱 → 직렬화 → ToArray" 에서 레코드 위치만 기억하고 1MB 버퍼로 흘려 쓰는 RewriteWorkspace 로 바꿨습니다. ' +
            '예전 방식은 최종 크기의 4~5배를 한꺼번에 잡아 상한을 올릴 수 없었다는 이유가 주석에 있고, 그 덕에 자동복원 상한이 256MB → 512MB 로 올라갔습니다. ' +
            '교체는 임시 파일 → File.Replace 이고, 실패해도 원본을 지우거나 직접 덮어쓰는 우회를 하지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '쓰는 쪽만 흘려 쓰기로 바뀌었고 읽는 쪽(LoadWorkspace)은 여전히 File.ReadAllBytes 로 workspace.bin 을 통째로 올려 응답으로 보냅니다. ' +
            '상한을 512MB 로 올린 만큼, 복원할 때 런처와 브라우저가 각각 그 크기의 배열을 한 번에 잡는 순간이 생깁니다 — 저장에서 없앤 메모리 봉우리가 복원 쪽에 그대로 남았습니다.',
        },
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
      id: 'launcher-java',
      category: CAT,
      group: 'Java',
      title: 'Java — JDK 찾기·원클릭 설치·jar 라이브러리·컴파일 실행',
      subtitle: '자바 계층의 실행기 전부가 여기 있다',
      summary:
        '브라우저에는 자바 실행기가 없으므로 .java 의 저장 검사·실행·채점·JUnit 이 모두 이 구간을 거칩니다. ' +
        'JDK 를 앱 설치본 → JAVA_HOME → PATH → 레지스트리·표준 폴더 순으로 찾고, 없으면 Eclipse Temurin 21 을 받아 SHA-256 을 대조한 뒤 풉니다. ' +
        '실행은 임시 폴더에 주 파일과 형제 .java 를 풀고 javac 로 컴파일한 다음 main 을 가진 타입을 명시해 java 로 띄웁니다. ' +
        '실습용 jar 는 단일 jar 로 끝나는 검증된 카탈로그와 Maven Central 검색·설치로 공급합니다.',
      usage: [
        {
          title: 'source-file 모드를 쓰지 않는다',
          body:
            'java Foo.java 한 줄 실행은 무조건 파일의 첫 타입을 실행하므로 보조 클래스를 앞에 둔 정상 코드가 실패합니다. 그래서 javac 로 컴파일한 뒤 ' +
            'JavaLaunchClassName 이 고른 main 보유 타입(요청이 있으면 그 이름, 없으면 첫 main 보유 타입)을 package 까지 붙여 -cp 로 실행합니다. ' +
            '파일 이름은 public 최상위 타입으로 짓습니다(javac 의 파일 이름 규칙).',
        },
        {
          title: '경로는 받지 않는다',
          body:
            '실행 봉투는 [길이][소스][길이][표준입력] 뒤에 [개수]([길이][소스])* 로 형제 본문만 잇습니다. 형제 파일의 자리는 소스가 적은 package 와 선언 타입에서 정하고, ' +
            '각 조각이 자바 식별자 정규식을 통과해야 폴더·파일 이름이 됩니다. 이미 있는 자리는 건너뛰어 형제가 주 파일을 덮을 수 없습니다.',
        },
        {
          title: '대화형과 파이프를 나눈다',
          body:
            '대화형은 표준입력을 열어 두고 /java-session-input 으로 받습니다. 채점(?piped=1)은 리더와 감시 스레드를 먼저 세운 뒤 별도 스레드에서 입력을 쓰고 닫습니다 — ' +
            '큰 입력과 큰 출력이 서로의 파이프를 기다리는 교착이 생겨도 중지 요청과 서버 제한 시간이 계속 작동하게 한 순서입니다.',
        },
        {
          title: 'jar 는 검증하기 전에는 .part 로만',
          body:
            '카탈로그에 SHA-256 이 박혀 있으면 그것으로 대조해 변조까지 거르고, 없으면(직접 좌표) 배포처의 .sha1 로 맞춥니다. 기준을 하나도 얻지 못하면 설치를 접고, ' +
            '통과하기 전에는 .part 이름으로만 존재해 반쯤 받은 jar 가 클래스패스에 얹히지 않습니다. 설치 시작은 토큰 외에 X-ClassDock-JavaLib-Confirm 헤더를 요구합니다.',
        },
      ],
      features: [
        { title: '상한', body: '실행 30분·컴파일 30초·프로세스 트리 메모리는 파이썬과 같은 상한. 형제 파일 60개·파일당 512KB. 라이브러리는 실행당 20개·설치 20개.' },
        { title: 'JDK 설치', body: '배포처 메타데이터에서 주소와 SHA-256 을 받고, 디스크 여유를 먼저 확인하고, zip-slip 을 버리며 옆 폴더에 풀어 제자리로 옮깁니다.' },
        { title: 'Lombok·JUnit', body: '고른 jar 를 -processorpath 에도 넣어 JDK 24+ 에서도 annotation processor 가 돌고, JUnit 은 console-standalone 으로 --scan-class-path 실행합니다.' },
        { title: '정의 원문', body: '/java-definition 이 설치된 JDK 의 src.zip 에서 표준 클래스 원문(5MB 이하)과 선언 줄을 돌려줍니다.' },
      ],
      files: [
        L('launcher.cs (Java 라우팅)', { from: 'else if (path == "/can-run-java")', before: 1, to: 'path.StartsWith("/java-session-stop"', after: 5 }, '/can-run-java · /java-* · /java-lib-* · /java-session-*'),
        L('launcher.cs (JDK 탐색)', { from: 'const int JavaMinimumFeatureVersion = 11;', before: 1, to: 'static string JdkPortableRoot()', after: 5 }, '탐색 캐시·후보 순서(앱 설치본 → JAVA_HOME → PATH → 레지스트리)'),
        L('launcher.cs (표준 클래스 원문)', { from: 'static string JavaDefinitionSource(byte[] body)', to: 'static readonly object JdkInstallLock', after: 0 }, 'src.zip 에서 선언 줄 찾기'),
        L('launcher.cs (JDK 원클릭 설치)', { from: '===== JDK 원클릭 설치', to: 'static void ReplaceDirectory(string staging, string dest)', after: 18 }, '메타데이터·SHA-256·여유 공간·zip-slip·교체'),
        L('launcher.cs (라이브러리 카탈로그)', { from: '===== 자바 실습용 라이브러리(jar) =====', to: 'static JavaLibrary FindJavaLibraryCatalogItem(string id)', after: 0 }, '단일 jar 카탈로그와 고정 SHA-256'),
        L('launcher.cs (클래스패스·설치 규칙)', { from: 'static string JavaClassPath(string tempRoot, List<string> jars)', before: 3, to: 'class JavaLibJob', after: 0 }, '-cp · -processorpath · Maven Central 고정'),
        L('launcher.cs (라이브러리 설치·검증)', { from: 'static string StartJavaLibraryInstall(byte[] body)', to: 'static string FetchJavaLibraryChecksum(JavaLibraryTarget target)', after: 0 }, '.part 로 받기 → SHA-256 또는 .sha1 대조 → 제자리'),
        L('launcher.cs (실행 세션)', { from: '===== 자바(.java) 실행 세션', to: 'static string JavaDeclaredFileClassName(string source)', after: 6 }, '저장 검사·세션 시작·봉투 해석·형제 파일 쓰기'),
        L('launcher.cs (컴파일·실행 프로세스)', { from: 'static string StartJavaSessionProcess(string java, string scriptPath, string sourceFileClassName,', before: 1, to: 'static bool CompileJavaSource(string javac, string scriptPath, string tempRoot, JavaSession session,', after: 40 }, 'javac → java -cp / JUnit, 감시·파이프 입력'),
        { path: 'tests/java-local-detect.test.js', label: 'java-local-detect.test.js', description: '탐색 순서·JRE 제외·재검사 인증·진단' },
        { path: 'tests/java-libraries-desktop.test.js', label: 'java-libraries-desktop.test.js', description: '카탈로그·경로 조립·클래스패스·processor 경로' },
        { path: 'tests/launcher-arg-quoting.test.js', label: 'launcher-arg-quoting.test.js', description: '자바·파이썬 프로세스 인자 인용을 한 곳으로' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '프로세스 인자 인용을 QuoteProcessArgument 한 곳으로 모으고, 테스트가 "자바 실행·컴파일 인자에 손으로 붙인 따옴표가 남아 있지 않다" 를 검사합니다. ' +
            '지금까지 새지 않은 이유가 "Windows 경로에 따옴표를 못 쓰고 클래스 이름은 정규식으로 뽑은 식별자라서" 라는, 코드 어디에도 적혀 있지 않은 약속이었다는 반성이 주석에 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '없는 라이브러리를 조용히 빼고 실행하지 않습니다. 실행이면 프로세스 없는 완료 세션을 만들어 출력 칸에 붉게 알리고, 저장 검사면 검사 자체를 건너뜁니다 — ' +
            '없는 jar 때문에 난 import 오류를 학생 코드의 잘못으로 표시하면 고칠 수 없는 빨간 줄이 남기 때문입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'JDK 원클릭 설치(/java-install)는 서버가 토큰만 요구하고 확인 헤더를 받지 않습니다. 화면(java-runtime.js)은 누르기 전에 확인 창을 띄우지만, ' +
            '같은 파일의 jar 설치(X-ClassDock-JavaLib-Confirm)·npm 설치는 그 확인을 서버 쪽 헤더로 한 번 더 강제하는데 가장 큰(약 200MB) 실행 파일 묶음을 받는 이 경로만 화면에 맡깁니다. ' +
            '받는 곳이 고정되고 SHA-256 을 대조하므로 위험은 작지만, "인터넷에서 실행될 코드를 받는 동작은 확인 헤더" 라는 규칙이 여기서 끊깁니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'JavaMinimumFeatureVersion 옆 주석이 "단일 파일 소스 실행이 들어온 버전" 이라고 최소 버전의 근거를 대는데, 지금 실행기는 source-file 모드를 쓰지 않고 javac 로 컴파일합니다. ' +
            '근거가 사라진 상수라, 누군가 최소 버전을 바꿀 때 무엇을 기준으로 삼을지 코드가 답하지 못합니다(예제 쪽 기준은 설계 문서의 Java 11 문법입니다).',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '저장 검사(/java-check)도 고른 jar 를 -processorpath 로 넘기므로, Lombok 같은 annotation processor 코드가 저장할 때마다(자동 저장 검사를 켰다면 3초 간격으로) 로컬에서 실행됩니다. ' +
            '카탈로그 jar 는 SHA-256 으로 고정돼 있어 문제가 되지 않지만, 직접 좌표로 받은 jar 는 .sha1 대조뿐이라 "고르는 순간 컴파일 때 코드가 돈다" 는 성질을 알고 있어야 합니다.',
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
      id: 'launcher-map',
      category: CAT,
      group: '지도',
      title: '지도 타일·장소 검색 라우팅',
      subtitle: '브라우저가 지도 서버를 직접 부르지 않게 하는 여덟 경로',
      summary:
        '지도 문서가 바깥을 보는 지점은 배경 타일과 장소 검색 둘뿐이고, EXE 로 돌 때는 둘 다 이 라우팅을 거칩니다. ' +
        '런처 한 곳에서 목적지 허용 목록·요청 간격·API 키·디스크 캐시를 통제하므로, 브라우저 쪽에는 키도 호스트 목록도 남지 않습니다.',
      usage: [
        {
          title: '타일은 목적지 허용 목록으로 막는다',
          body:
            '/tile-proxy 는 임의 주소를 받아 오는 통로가 될 수 있어 TileProxyHosts 허용 목록으로 목적지를 좁힙니다. ' +
            '이 목록은 map-viewer.js 의 배경지도 호스트와 항상 같아야 하고, tests/map-viewer.test.js 가 양쪽을 대조합니다. ' +
            '지도 스냅샷의 sandbox iframe(Origin: null)이 부르는 유일한 경로이기도 해서 인증 판정에서도 여기만 예외로 둡니다.',
        },
        {
          title: '능력 프로브를 따로 둔 이유가 코드에 있다',
          body:
            '/can-proxy-tiles 는 "파일 저장이 되는가" 와 다른 질문입니다 — Go 폴백 런처는 저장은 못 해도 타일은 받습니다. ' +
            '그 판단이 라우팅 바로 위 주석에 적혀 있어, 나중에 "프로브가 둘이나 필요한가" 라는 질문이 나올 때 답이 코드 옆에 남아 있습니다.',
        },
        {
          title: '장소 검색은 런처가 예의를 지킨다',
          body:
            '/geocode 가 식별 User-Agent, 초당 1건(GeocodeMinIntervalMs 1100ms — 정책은 1000ms 이지만 여유를 둡니다), 검색 캐시를 적용합니다. ' +
            '공급자를 CLASSDOCK_GEOCODER_URL 로 Nominatim 호환 서버로 바꿀 수 있고, 카카오를 골랐는데 키가 없으면 ' +
            '502 가 아니라 428 Precondition Required 로 갈라 화면이 "키를 넣으세요" 를 정확히 띄울 수 있게 합니다.',
        },
        {
          title: '카카오 REST 키는 브라우저에 두지 않는다',
          body:
            '/map-search-key 로 넣고 DELETE 로 지우며, 화면은 /map-search-key-status 로 "있다/없다" 만 봅니다. ' +
            '키 값 자체는 런처가 들고 Authorization 헤더를 붙입니다. 배포본에 키가 실려 학생 PC 마다 퍼지는 문제를 구조로 막은 자리입니다. ' +
            '고른 공급자(/map-search-provider)는 파일로 남겨 앱 모드처럼 브라우저 프로필이 갈려도 따라옵니다.',
        },
      ],
      features: [
        { title: '타일 대리 수신', body: '/tile-proxy — 화면에 실제로 표시된 타일만 받아 서버 디스크에 캐시합니다. 사전 다운로드는 하지 않습니다.' },
        { title: '캐시 관리', body: '/tile-cache-status · /tile-cache-clear — 400MB 상한. 넘치면 80% 까지 쓸어 냅니다.' },
        { title: '장소 검색', body: '/geocode — 이름 → 좌표, 좌표 → 주소. 공급자는 OSM(Nominatim) 또는 카카오.' },
        { title: '키 보관', body: '/map-search-key(POST·DELETE) · /map-search-key-status · /map-search-provider.' },
      ],
      files: [
        L('launcher.cs (지도 라우팅)', { from: 'method == "GET" && path.StartsWith("/tile-proxy?"', before: 2, to: 'method == "POST" && path == "/tile-cache-clear"', after: 10 }, '/tile-proxy · /geocode · /map-search-* · /tile-cache-*'),
        L('launcher.cs (타일 캐시)', { from: 'static readonly string[] TileProxyHosts', before: 2, to: 'static bool ClearTileCache()', after: 0 }, '허용 호스트 목록 · 메모리/디스크 캐시 · 400MB 정리'),
        L('launcher.cs (타일 대리 수신)', { from: 'static bool TryProxyMapTile', before: 2, lines: 62 }, '호스트 허용 판정과 실패 시 오래된 캐시 내주기'),
        { path: 'tests/map-viewer.test.js', label: 'map-viewer.test.js', description: '허용 호스트·캐시 상한·토큰 요구를 두 런처와 함께 대조' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"인터넷이 필요한 지점"이 여덟 경로로 모여 있습니다. 지도 기능이 아무리 커져도 바깥과 닿는 면은 여기만 보면 되고, ' +
            '허용 목록·요청 간격·키가 모두 이 한 파일에 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '이 구간은 오랫동안 어느 섹션에도 실리지 않아, 지도 계약 카드 네 장의 "파일 위치" 를 눌러도 코드가 뜨지 않았습니다. ' +
            '엔드포인트 대조(102/102)는 통과하고 있었는데, 계약이 가리키는 코드가 화면에 없는 것은 그 검사가 보지 않는 종류의 빈틈이었습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-transit',
      category: CAT,
      group: '지도',
      title: '실시간 교통 대리 수신 — 서울 지하철 · 제주 버스',
      subtitle: '인증키를 브라우저에 두지 않고, 조회 한도와 남의 사이트 부담을 런처 한 곳에서 묶는다',
      summary:
        '지도의 실시간 열차·버스 층이 바깥을 보는 경로입니다. 지하철은 서울시 realtimePosition API 를 인증키로 부르고, 제주 버스는 제주 버스정보 사이트의 조회 네 가지를 부릅니다. ' +
        '둘 다 원격 주소를 프런트에서 받지 않고 호스트·경로·메서드를 고정하며, 응답 크기 상한과 짧은 캐시를 두어 한 교실의 여러 화면이 같은 노선을 봐도 상류 호출을 한 번으로 묶습니다.',
      usage: [
        {
          title: '지하철 API 는 https 를 받지 않는다',
          body:
            '그래서 브라우저에서 직접 부르면 https 로 연 화면에서 막히고, 무엇보다 인증키가 화면 코드에 드러납니다. 런처가 대신 받되, 키가 URL 에 평문으로 실리는 것은 ' +
            '제공처 사정이라 어쩔 수 없다는 점(읽기 전용·무료 키)을 주석이 인정합니다.',
        },
        {
          title: '오류도 HTTP 200 으로 온다',
          body:
            '본문의 code 로 가릅니다 — INFO-000 정상, INFO-100 키 오류, INFO-200 자료 없음. INFO-200 은 "지금 이 노선에 열차가 없다" 는 정상 답이라 그대로 내보내고, ' +
            '키 저장 시 시험 조회도 심야의 INFO-200 을 "키는 멀쩡하다" 로 받아들입니다. 환율 API 에서 이미 한 번 겪은 함정이라는 기록이 있습니다.',
        },
        {
          title: '키는 DPAPI 로 사용자 계정에 묶는다',
          body:
            '"기억하기" 를 고르면 ProtectedData(CurrentUser) 로 암호화해 LocalAppData 에 임시 파일 → 교체로 씁니다. 기억하지 않으면 파일을 지우고 메모리에만 둡니다. ' +
            '키를 지우면 그 키로 받아 둔 캐시도 함께 비웁니다. 키 상태·저장·삭제는 토큰에 더해 X-ClassDock-Action 헤더를 요구합니다.',
        },
        {
          title: '제주 버스: 같은 조회는 한 줄로 세운다',
          body:
            '조회 키(종류:값)를 16개 잠금 중 하나에 배정해, 같은 노선을 여러 화면이 동시에 물으면 앞 요청이 끝날 때까지 기다렸다가 그 결과를 받습니다. ' +
            '캐시는 위치 30초·노선·정류장·경로 24시간이고 항목 100개를 넘으면 가장 오래 안 쓴 것부터 버립니다. 새로고침 요청도 30초 안에는 상류를 다시 부르지 않습니다.',
        },
        {
          title: '실패하면 늦게, 그러나 마지막 위치는 알린다',
          body:
            '상류가 Retry-After 를 주면 30초~24시간 범위에서 따르고, 실패한 동안에는 2분 이내 위치 캐시를 X-ClassDock-Bus-Stale: 1 로 내줍니다. ' +
            '원본 수신 시각은 X-ClassDock-Bus-Fetched-At 으로 보존해, 캐시를 다시 전달해도 새 관측으로 보이지 않게 합니다.',
        },
      ],
      features: [
        { title: '지하철 캐시', body: '노선마다 한 칸, 12초 신선 · 받기 실패 시 1분 이내 값. 하루 1,000회 한도라 캐시가 절약이 아니라 필수라는 주석이 있습니다.' },
        { title: '노선 허용 목록', body: '노선 이름이 URL 경로에 들어가므로 16개 목록에 있는 것만 통과. 표·main.go 와 같은 목록인지 테스트가 봅니다.' },
        { title: '응답 상한', body: '지하철 512KB · 제주 위치 2MB · 제주 노선·정류장·경로 5MB. 제한 시간 12초, 제주 요청은 리다이렉트를 따라가지 않습니다.' },
        { title: '능력 프로브', body: '/can-proxy-subway · /can-proxy-jeju-bus. 지하철은 Go 폴백 런처에도 있고, 제주 버스는 C# 런처에만 있습니다.' },
      ],
      files: [
        L('launcher.cs (교통 라우팅)', { from: 'else if (method == "GET" && path == "/can-proxy-jeju-bus")', before: 1, to: 'else if (method == "DELETE" && path == "/subway-key")', after: 10 }, '/jeju-bus-* · /subway-position · /subway-key*'),
        L('launcher.cs (지하철 대리 수신)', { from: '===== 지하철 실시간 열차 위치 =====', to: '// 제주 사이트 시범 연결.', after: -1 }, '노선 목록·키 보관(DPAPI)·결과 코드·캐시'),
        L('launcher.cs (제주 버스 대리 수신)', { from: '// 제주 사이트 시범 연결.', to: 'static bool TryProxyMapTile(string url, out byte[] data, out string mime)', after: -1 }, '조회 네 가지·잠금 16개·캐시 100개·Retry-After'),
        { path: 'tests/subway-stations.test.js', label: 'subway-stations.test.js', description: '노선 목록이 표·main.go·launcher.cs 세 곳에서 같은지' },
        { path: 'tests/jeju-bus-controller.test.js', label: 'jeju-bus-controller.test.js', description: '런처 캐시 시각·Retry-After 보존' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '두 대리 수신 모두 "원격 URL 을 입력받지 않는다" 를 지킵니다. 지하철은 노선 이름을 목록으로, 제주 버스는 조회 종류를 네 가지로·값을 숫자(노선 검색만 하이픈 허용) 12자로 좁히고, ' +
            '제주 요청은 AllowAutoRedirect=false 로 리다이렉트를 통한 목적지 변경까지 막았습니다. /tile-proxy 가 허용 호스트 목록으로 막은 것과 같은 결의 방어입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '제주 응답을 캐시에 넣기 전에 JavaScriptSerializer 로 파싱해 종류별 모양(정류장 목록 배열·차량 배열·노선 배열)을 확인합니다. 잘못된 JSON 이나 오류 페이지를 24시간 캐시하는 사고를 막습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '제주 버스 잠금은 네트워크 호출(최대 12초) 동안 잡혀 있고, 잠금이 16개뿐이라 해시가 같은 칸에 떨어진 서로 다른 노선도 그동안 기다립니다. ' +
            'HTTP 요청마다 스레드를 쓰는 런처라 상류가 느린 날에는 대기 스레드가 쌓입니다. 한 교실 규모에서는 문제가 되지 않을 크기지만, 조회 키별 진행 중 작업을 공유하는 방식이 더 정확한 도구입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '지하철 조회 예산은 화면 15초 · 런처 12초 캐시로 한 노선을 4시간 남짓 볼 수 있는 계산입니다(하루 1,000회). 여러 시간 연속으로 켜 두는 교실이나 여러 노선을 번갈아 보는 수업에서는 ' +
            '오후에 한도가 떨어질 수 있고, 그때 화면은 "열차 정보를 받지 못했어요" 로만 보입니다 — 한도 소진을 구분하는 결과 코드 처리는 없습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-ssh',
      category: CAT,
      group: '원격 터미널',
      title: 'SSH 원격 터미널 백엔드',
      subtitle: 'Windows OpenSSH + ConPTY — desktop/ssh_terminal.cs',
      summary:
        'launcher.cs 는 /ssh-* 아홉 경로를 받아 ClassDockSshTerminal 로 넘기기만 하고, 실제 구현은 별도 파일 desktop/ssh_terminal.cs 에 있습니다. ' +
        'SSH 프로토콜을 직접 구현하지 않고 Windows 에 설치된 OpenSSH 클라이언트(ssh.exe)를 ConPTY 에 붙여, ' +
        '원격 PTY 의 ANSI 입출력을 브라우저 xterm.js 와 중계합니다. 암호 협상·키 교환은 OpenSSH 가 지고, 이 파일은 바이트를 나릅니다.',
      usage: [
        {
          title: '비밀번호는 일회성 named pipe 로만',
          body:
            '디스크·명령행·환경변수 어디에도 두지 않습니다. 난수 이름(classdock_ssh_askpass_<GUID>)의 파이프 서버를 열고 ' +
            'SSH_ASKPASS 를 ClassDock.exe 자신으로 지정한 뒤 SSH_ASKPASS_REQUIRE=force 로 강제합니다. ' +
            'OpenSSH 가 비밀번호를 물을 때 ClassDock.exe 가 다시 실행되고, TryRunAskPassHelper 가 파이프에서 읽어 표준출력으로 흘리고 끝납니다. ' +
            '넘긴 바이트는 Array.Clear 로 지웁니다. 명령행은 작업 관리자에서 보이고 환경변수는 자식 프로세스로 새므로 둘 다 피한 구조입니다.',
        },
        {
          title: 'known_hosts 를 따로 가진다',
          body:
            'ssh 인자에 UserKnownHostsFile=<LocalAppData>/ClassDock/ssh/known_hosts 와 GlobalKnownHostsFile=NUL 을 줍니다. ' +
            '사용자가 평소 쓰는 OpenSSH 설정(-F NUL 로 config 도 무시)과 완전히 갈라, ClassDock 이 신뢰한 키만으로 접속합니다. ' +
            'StrictHostKeyChecking=yes 라 목록에 없으면 붙지 않고, Open() 은 그 전에 TrustedFingerprint 가 비었으면 ssh-host-key-not-trusted 로 먼저 막습니다.',
        },
        {
          title: 'ssh 인자를 고정한다',
          body:
            'BuildSshArguments 가 PubkeyAuthentication=no · PreferredAuthentications=password,keyboard-interactive · ' +
            'ClearAllForwardings=yes · ConnectTimeout=15 · ServerAliveInterval=30 을 못 박습니다. ' +
            '설계 문서가 1차 범위에서 뺀 것(개인키·포트 포워딩)을 문서로만 적어 두지 않고 인자로 닫아 둔 형태입니다.',
        },
        {
          title: '입력값을 문자 단위로 검사한다',
          body:
            'ValidateHost 는 영숫자·점·하이픈·콜론만, ValidateUser 는 영숫자·점·밑줄·하이픈만 받고 둘 다 첫 글자가 - 이면 거부합니다. ' +
            '호스트나 계정이 -oProxyCommand=... 같은 모양으로 들어와 ssh 옵션으로 해석되는 것을 막는 자리입니다. ' +
            '호스트 키 알고리즘은 5종 허용 목록, 키는 base64 로 풀어 길이까지 확인합니다.',
        },
        {
          title: '세션은 4개까지',
          body:
            'MaxSessions 4 · 세션당 출력 버퍼 4MB · 입력 한 번에 256KB 상한입니다. ' +
            '버퍼가 넘치면 앞을 버리고 폴링 응답에 reset 을 실어 화면이 "잘렸다"는 것을 알 수 있게 합니다. ' +
            'SweepSessions 가 쓰지 않는 세션을 정리하고, ShutdownAll 이 앱 종료 때 전부 닫습니다.',
        },
      ],
      features: [
        { title: '능력 확인', body: 'CapabilityJson — ConPTY API 3종(Create·Resize·Close)과 ssh.exe 존재를 확인하고, 없으면 이유를 문장으로 돌려줍니다.' },
        { title: '지문 읽기', body: 'ScanHostKey — ssh-keyscan 으로 공개키를 읽습니다. 최신 KEX 를 지원하지 않는 구형이면 ssh.exe 협상으로 폴백합니다.' },
        { title: '지문 저장', body: 'TrustHostKey — 같은 호스트의 다른 키가 이미 있으면 replace 없이는 ssh-host-key-changed 로 거부합니다.' },
        { title: '세션 개폐', body: 'Open · Input · Poll · Resize · Stop. Poll 은 오프셋 이후 증분만 base64 로 내려 줍니다.' },
        { title: '크기 전달', body: 'ResizePseudoConsole 로 원격 PTY 크기를 바꿉니다. 20~300열 · 5~120행으로 클램프합니다.' },
      ],
      files: [
        { path: 'desktop/ssh_terminal.cs', label: 'ssh_terminal.cs', description: 'SSH 터미널 백엔드 — ConPTY 상호운용, askpass, known_hosts, 세션, scp 업로드' },
        { path: 'desktop/ssh_files.cs', label: 'ssh_files.cs', description: '읽기 전용 SFTP v3 백엔드 — 같은 정적 클래스를 partial 로 나눠 쓴다' },
        { path: 'desktop/ssh_shell_integration.bash', label: 'ssh_shell_integration.bash', description: 'Bash 세션에 현재 폴더 알림만 얹는 시작 스크립트(EXE 내장 리소스)' },
        L('launcher.cs (SSH 라우팅)', { from: 'method == "GET" && path == "/ssh-capability"', before: 2, to: 'path.StartsWith("/ssh-session-stop"', after: 6 }, '접속·세션·크기 전달'),
        L('launcher.cs (개인키·파일 고르기)', { from: 'method == "POST" && path == "/ssh-key-pick"', before: 2, to: 'method == "GET" && path == "/ssh-upload-pick-status"', after: 10 }, '/ssh-key-pick-* · /ssh-upload-pick-*'),
        L('launcher.cs (파일 올리기)', { from: 'method == "POST" && path == "/ssh-upload-start"', before: 2, to: 'path.StartsWith("/ssh-upload-cancel"', after: 10 }, '/ssh-upload-start · -poll · -cancel'),
        L('launcher.cs (원격 파일 라우팅)', { from: 'method == "POST" && path.StartsWith("/ssh-file-"', before: 2, to: 'path.StartsWith("/ssh-file-content?"', after: 8 }, '/ssh-file-* — 토큰 위에 헤더를 하나 더 요구한다'),
        { path: 'docs/원격터미널-설계.md', label: '원격터미널-설계.md', description: '1·2·3차 설계' },
        { path: 'docs/원격파일-미리보기-다운로드-설계.md', label: '원격파일-미리보기-다운로드-설계.md', description: '원격 파일 설계와 검증 기록' },
        { path: 'tests/remote-terminal.test.js', label: 'remote-terminal.test.js', description: '토큰·비밀번호 전달·지문·ConPTY 계약' },
        { path: 'tests/ssh-files.test.js', label: 'ssh-files.test.js', description: '모의 SFTP 스트림으로 프로토콜·디스크 동작 검증' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'SSH 를 직접 구현하지 않은 것이 이 기능에서 가장 중요한 판단입니다. ' +
            '암호 협상·키 교환·알고리즘 폐기 대응은 틀리면 곧바로 보안 사고가 되는 영역인데, 그 부분을 OS 에 딸려 오는 OpenSSH 에 맡기고 ' +
            'ClassDock 은 프로세스를 띄우고 바이트를 나르는 일만 합니다. 라이브러리 하나를 아낀 것이 아니라 책임 하나를 넘긴 것입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '별도 파일로 뗐습니다. launcher.cs 에 다 붙이지 않고 ClassDockSshTerminal 정적 클래스로 갈라 라우팅만 남겼고, ' +
            '원격 파일이 붙을 때도 같은 방식으로 ssh_files.cs 를 더했습니다. 이 레포에서 EXE 코드가 여러 파일로 나뉜 첫 사례이자, ' +
            '그 방식이 두 번째로 이어진 자리입니다 — 반대로 DB 는 라우팅과 세션 관리가 launcher.cs 안에 남아 있어 관행이 아직 고르지 않습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '원격 파일 쪽 POST 는 실행별 토큰에 더해 X-ClassDock-Action: 1 헤더를 요구합니다(HasLocalActionHeader). ' +
            '없으면 403 입니다. 폼 전송 같은 단순 요청으로는 붙일 수 없는 헤더라 토큰 위에 한 겹이 더 남고, ' +
            '원격 파일을 로컬 디스크로 내려받는 경로의 무게에 맞춰 경계를 한 단계 올린 판단입니다. ' +
            '/run-python·/ssh-session-* 에는 없는 조건이라, 이 앱에서 경계 수준이 경로마다 갈리기 시작한 지점이기도 합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '앱 전체에서 가장 강력한 원격 실행 경로입니다. 경계는 실행별 토큰 하나이고, ' +
            'RequiresLocalAuthToken 의 path.StartsWith("/ssh-") 한 줄이 POST 전부를 덮습니다. ' +
            '경로 수는 원격 파일·개인키 고르기가 붙으며 아홉에서 열일곱으로 늘었는데 그 한 줄은 그대로였습니다 — ' +
            '접두사 방식이 값을 한 증거이자, 한 줄에 걸린 무게가 두 배가 됐다는 뜻이기도 합니다. ' +
            'GET 쪽은 접두사가 아니라 경로를 하나씩 적어 두는데(/ssh-capability · /ssh-key-pick-status · /ssh-upload-pick-status · ' +
            '/ssh-session-poll · /ssh-upload-poll · /ssh-file-job · /ssh-file-content), 새 GET 경로를 더할 때 이 목록을 잊으면 조용히 열립니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'ClassDock.exe 가 자기 자신을 SSH_ASKPASS 로 지정해 다시 실행됩니다. ' +
            '즉 EXE 진입점에 "CLASSDOCK_SSH_ASKPASS_PIPE 가 있으면 helper 로 동작하고 끝낸다"는 갈래가 생겼습니다. ' +
            '환경변수 하나로 프로그램의 정체가 바뀌는 구조라, 진입점을 손볼 때 이 갈래를 함께 보지 않으면 앱이 뜨지 않거나 helper 가 서버를 띄우는 사고가 납니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'ConPTY(CreatePseudoConsole)는 Windows 10 1809 부터 있습니다. ' +
            'GetProcAddress 로 세 함수의 존재를 직접 확인해 판정하므로 버전 문자열을 읽지 않습니다 — ' +
            '"버전이 몇이냐" 대신 "그 API 가 있느냐" 를 묻는 형태입니다.',
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
        '영상은 두 길입니다 — 끌어다 놓아 연 파일은 /convert-media 로 본문을 주고받고, EXE 로 연 폴더 안의 파일은 바이트를 옮기지 않고 ' +
        '/convert-media-path 로 경로만 넘겨 ffmpeg 가 디스크에서 직접 변환하며 /media-ticket · /media-stream 으로 Range 재생합니다. ffmpeg 가 없으면 /install-ffmpeg 로 설치합니다. ' +
        'SQLite 는 /sqlite-preview(작업공간 파일), /sqlite-disk-preview(디스크 원본), /sqlite-exec(임의 SQL) 세 갈래입니다.',
      usage: [
        {
          title: '수 GB 영상은 본문으로 옮기지 않는다',
          body:
            '수업 영상을 통째로 브라우저로 올리면 런처와 브라우저가 각각 그만큼 메모리를 쓰고, 2GB 를 넘으면 런처의 byte[] 상한에 걸려 아예 열리지 않습니다. ' +
            '그래서 원본 폴더 안의 파일은 (폴더 ID + 상대 경로)만 들고 다니고, 변환은 작업(job)으로 띄워 700ms 폴링으로 단계·진행률·배속을 받습니다. ' +
            '결과는 언제나 .mp4 이고 원본과 같은 경로를 막으며, 완성되기 전에는 .part 이름으로만 존재합니다.',
        },
        {
          title: '<video> 는 헤더를 못 붙인다 — 그래서 표',
          body:
            '미디어 요소의 요청에는 X-ClassDock-Token 을 실을 수 없어, 토큰이 필요한 POST /media-ticket 으로 파일 하나에만 쓰는 표를 먼저 받고 ' +
            'GET /media-stream?t= 가 그 표로 파일을 흘려보냅니다. 표는 실제 경로가 아니라 원본 폴더 ID + 상대 경로를 들고 있어 새어 나가도 그 폴더 밖은 열 수 없고, ' +
            '12시간 뒤 만료되며 최대 512개까지만 둡니다. 응답에는 no-store · nosniff · no-referrer 를 붙여 주소가 다른 곳으로 흘러가지 않게 합니다.',
        },
        {
          title: '멈춘 재생이 연결을 끊지 않게',
          body:
            '재생을 멈춰 두면 브라우저가 버퍼를 채운 뒤 몇 분씩 읽지 않아 Write 가 막힙니다. WriteFileStreamResponse 가 이 응답에서만 보내기 제한을 10분으로 늘렸다 되돌리고, ' +
            '약속한 Content-Length 를 못 채우면 0 으로 메우지 않고 연결을 닫아 잘린 응답임을 알립니다.',
        },
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
        L('launcher.cs (변환)', { from: 'method == "POST" && path == "/convert-pptx"', before: 4, to: 'method == "POST" && path == "/install-ffmpeg"', after: 14 }, '/convert-pptx · /convert-media · /convert-media-path·job·cancel · /media-ticket · /media-stream · /install-ffmpeg'),
        L('launcher.cs (Range 스트리밍)', { from: 'static void WriteFileStreamResponse(Stream stream, string full, string contentType, Dictionary<string, string> headers)', to: 'static void WriteCorsResponse(', after: -2 }, '206 Partial Content · 보내기 제한 10분 · 잘린 응답은 연결 닫기'),
        L('launcher.cs (재생 표)', { from: 'static string MediaContentType(string path)', to: 'static long ParseTimecodeUs(string text)', after: -3 }, '/media-ticket 발급과 확인'),
        L('launcher.cs (경로 방식 변환 작업)', { from: 'static bool RunFfmpegTracked(string cmd, string args, MediaConvertJob job)', before: 1, to: 'static string FindPython()', after: -2 }, '진행률 읽기 · 단계 재시작 · .part → 제자리 · 취소'),
        { path: 'tests/video-convert-by-path.test.js', label: 'video-convert-by-path.test.js', description: '경로 방식 변환·재생 표의 런처·화면 계약' },
        L('launcher.cs (SQLite)', { from: 'method == "POST" && path == "/sqlite-preview"', before: 1, to: 'method == "POST" && path == "/sqlite-exec"', after: 16 }, '/sqlite-preview · /sqlite-disk-preview · /sqlite-exec'),
        L('launcher.cs (SQLite 실행기)', { from: 'static string SqliteDiskPreview(Dictionary<string, string> headers)', to: 'static readonly System.Text.RegularExpressions.Regex NpmPackageNameRe', after: -2 }, '경로 해석 · SQLite 헤더 확인 · 내용 지문 대조 · .bak 백업 경로'),
        { path: 'tests/sqlite-editor-safety.test.js', label: 'sqlite-editor-safety.test.js', description: 'DB 편집 안전 조건' },
        { path: 'tests/media-convert-desktop.test.js', label: 'media-convert-desktop.test.js', description: '호환 스트림 보존·GPU 실패 대체·취소와 실제 MP4 출력' },
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
        {
          type: 'good',
          label: 'Good',
          body:
            '토큰을 못 쓰는 한 경로(/media-stream)를 "인증 예외" 로 열지 않고 좁은 열쇠로 대신했습니다. 표는 무작위 값·만료·개수 상한을 갖고, ' +
            '열 때마다 원본 폴더 ID 와 상대 경로를 다시 풀어 확인하므로 발급 뒤 폴더 등록이 사라지면 표도 통하지 않습니다. ' +
            'RequiresLocalAuthToken 옆 주석에 "GET /media-stream 만 예외인 이유" 가 적혀 있어 나중에 규칙을 넓히려는 사람이 멈출 자리가 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '경로 방식 변환은 결과 파일이 이미 있으면 묻지 않고 지웁니다(RunMediaConvertJob 의 File.Delete(job.OutPath)). 결과 이름은 화면이 "원본 이름.mp4" 로 정하므로, ' +
            '수업.mkv 를 변환하면 같은 폴더에 원래 있던 다른 수업.mp4 가 교체됩니다. 일괄 변환은 먼저 /source-folder-entry 로 있는지 보고 건너뛰지만, 영상 탭 하나에서 누르는 단일 변환에는 그 확인이 없습니다 — ' +
            '사용자의 원본 폴더를 고치는 경로라, 이름을 비켜 짓거나 덮어쓰기 전에 확인하는 쪽이 안전합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '변환은 CPU 를 다 쓰므로 MediaConvLock 으로 한 번에 하나만 돌고, 뒤 작업은 queued 로 기다립니다(화면이 "앞선 변환이 끝나기를 기다리는 중" 으로 알림). ' +
            '작업표는 끝난 뒤 6시간이 지나야 치우고 최대 64개라, 일괄 변환을 여러 번 걸면 too-many-convert-jobs 로 거절될 수 있습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-db',
      category: CAT,
      group: '변환 · DB',
      title: 'DB 클라이언트 백엔드 — 상주 Python 워커',
      subtitle: `desktop/db_worker.py ${workerLines} + launcher.cs 의 /db-* 라우팅 19갈래`,
      summary:
        '브라우저는 TCP 로 MySQL 에 붙을 수 없으므로 접속은 런처가 띄운 Python 워커가 pymysql 로 맺습니다. ' +
        'SQLite 미리보기처럼 한 번 실행하고 끝내는 구조가 아니라 접속 하나당 프로세스 하나가 상주합니다 — ' +
        '트랜잭션·임시 테이블·세션 변수·USE 로 바꾼 스키마가 요청 사이에 유지돼야 하고, 실행 중인 쿼리를 취소할 커넥션이 남아 있어야 하기 때문입니다. ' +
        '규약은 새로 만들지 않고 노트북 커널(python_kernel.py)의 것을 그대로 씁니다 — stdin 으로 base64(JSON) 한 줄, stdout 으로 한 줄.',
      usage: [
        {
          title: '런처에 JSON 파서가 없다',
          body:
            '워커는 응답 한 줄을 "+"(성공) 또는 "-"(실패) 다음에 base64(JSON) 으로 냅니다. ' +
            '런처는 첫 글자로 성공 여부만 판단하고 본문은 열어 보지 않은 채 그대로 브라우저에 넘깁니다. ' +
            'C# 쪽에 JSON 파서를 들이지 않으려고 고른 모양이고, 결과적으로 워커가 응답 스키마를 바꿔도 런처를 고칠 일이 없습니다.',
        },
        {
          title: '진행 보고가 있어도 "요청 하나에 응답 하나"',
          body:
            '오래 걸리는 작업은 최종 응답 앞에 "*" + base64(JSON) 진행 줄을 흘릴 수 있습니다. ' +
            '런처는 그 줄을 DbQueryJob.Progress 에 담고 계속 읽으므로 규약 자체는 그대로입니다. ' +
            '이때 제한 시간이 총 실행 시간이 아니라 줄 하나를 기다리는 시간이 되는 것이 핵심입니다 — ' +
            '살아 있는 덤프는 몇십 분이 걸려도 끊기지 않고(DbDumpIdleMs 120초), 조용히 멈춘 워커는 제때 끊깁니다.',
        },
        {
          title: '취소만 응답을 내지 않는다',
          body:
            '실행 중인 쿼리는 stdin 을 읽지 못하므로 취소는 리더 스레드가 즉시 처리해야 하는데, 여기서 응답까지 내보내면 ' +
            '실행 중인 쿼리의 응답과 순서가 뒤섞입니다. 그래서 cancel 은 fire-and-forget 이고, 취소 결과는 ' +
            '취소당한 쿼리 자신의 응답(cancelled)으로 드러납니다. 세션에 잠금이 둘(ExecLock·StdinLock)인 이유도 이것입니다.',
        },
        {
          title: '취소가 남의 작업을 죽이지 않게',
          body:
            'DbSession.ActiveJobId 를 두고 실행 중인 작업 id 가 일치할 때만 워커에 cancel 을 보냅니다. ' +
            '같은 세션의 작업은 ExecLock 으로 직렬화되므로, 이 검사가 없으면 대기 중인 덤프를 취소했을 때 ' +
            '앞서 돌던 쿼리가 끊깁니다. 실행권을 얻기 전에 취소된 작업은 아예 워커에 보내지 않습니다.',
        },
        {
          title: '입력 검사는 C# 이 하고 값은 JSON 으로만 넘어간다',
          body:
            'DbCheckField 가 호스트·데이터베이스·계정의 허용 문자와 길이를 검사합니다(DbHostRe). ' +
            '통과한 값도 워커에는 JSON 필드로만 넘겨 명령행에 닿지 않게 합니다. ' +
            '비밀번호는 검사 대상이 아니라 그대로 지나가되, 프로세스 인수가 아니라 기동 직후 stdin 의 첫 connect 요청에만 실립니다 — ' +
            'SqliteExec 가 SQL 을 stdin 으로 넘기는 방식과 같습니다.',
        },
        {
          title: '경로를 만드는 곳은 런처 한 곳',
          body:
            '덤프 파일의 경로는 프런트도 워커도 만들지 않습니다. 프런트가 이름만 보내면 런처가 ' +
            'SafeRelPath → TryResolveSaveRootPath 로 저장 폴더 안으로 풀어 절대 경로를 워커에 넘깁니다. ' +
            '워커가 경로를 지으면 저장 위치 정책이 그대로 뚫리기 때문입니다.',
        },
      ],
      features: [
        { title: '동시 4접속', body: 'MaxDbSessions 4 — 원격 터미널의 동시 세션 상한과 같은 기조입니다. 유휴 30분(DbIdleMinutes)이면 스스로 정리합니다.' },
        { title: '제한 시간 셋', body: '메타데이터 조회 60초(DbMetadataTimeoutMs), 쿼리 기본 60초·최대 600초, 덤프는 무진행 120초.' },
        { title: '한도를 두 곳이 같은 값으로', body: 'MaxDbDumpObjects 500 · MaxDbImportRows 10,000 · MaxDbImportCells 100,000 이 워커의 상수와 짝입니다. 본문 크기(8MB)는 런처가 한 번 더 막습니다 — 행·셀을 세기 전에 거대한 본문을 읽어 들이지 않으려고.' },
        { title: '워커가 하는 일', body: '접속·스키마·테이블 정의·DDL·의존 관계·ERD 관계·쿼리 실행·페이징·셀 재조회·묶음 적용·트랜잭션·덤프·적재. 오류 분류(classify_error)도 워커 몫입니다.' },
        { title: '내장 리소스', body: 'db_worker.py 를 /resource: 로 exe 에 넣고 기동할 때 임시 경로에 풀어 실행합니다. python_kernel.py 와 같은 방식입니다.' },
      ],
      files: [
        { path: 'desktop/db_worker.py', label: 'db_worker.py', description: 'MySQL 워커 전체 — 접속·쿼리·편집 판정·트랜잭션·덤프·적재' },
        L('launcher.cs (DB 라우팅)', { from: 'method == "GET" && path == "/db-capability"', before: 2, to: 'path.StartsWith("/db-session-close"', after: 6 }, '/db-* 19갈래'),
        L('launcher.cs (DB 세션 기동)', { from: 'static string StartDbSession(byte[] body)', before: 6, to: 'static string DbMetadataRequest(string sessionId, string requestJson)', after: 6 }, '입력 검사 · 워커 기동 · handshake'),
        { path: 'docs/DB클라이언트-설계.md', label: 'DB클라이언트-설계.md', description: '로컬 API 목록과 한도가 적힌 설계 문서' },
        { path: 'tests/db-client.test.js', label: 'db-client.test.js', description: '토큰·비밀번호 전달·읽기 전용·묶음 적용 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '새 규약을 만들지 않고 있던 것 둘을 이어 붙였습니다 — 상주 프로세스와 base64 JSON 라인은 노트북 커널에서, ' +
            '"시작만 시키고 폴링으로 받기" 는 pip 설치에서 가져왔습니다. ' +
            'EXE 안에서 프로세스를 다루는 방식이 커널·터미널·워커 셋으로 늘었는데도 읽는 사람이 배울 규칙은 늘지 않았습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '워커의 stderr 를 프런트에 그대로 흘리지 않고 LimitedTextBuffer 에 담아 둡니다. ' +
            '드라이버 예외 문자열에 접속 문자열이 섞여 나오는 경우가 있어서인데, 그 판단이 설계 문서의 보안 원칙에 이유와 함께 적혀 있습니다. ' +
            '대신 워커가 분류한 코드와 다듬은 메시지만 나가고, SQL 오류 원문만은 학습 정보라 함께 보냅니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '런처가 여는 원격 실행 경로가 하나 더 늘었습니다 — 이쪽은 "학교 DB 서버에서 그 계정 권한으로 무엇이든" 입니다. ' +
            '경계는 RequiresLocalAuthToken 의 path.StartsWith("/db-") 한 줄이고, 이 한 줄이 19개 경로를 GET·POST 양쪽에서 덮습니다. ' +
            'SSH 와 똑같은 구조라 장단점도 같습니다 — 새 경로가 자동으로 보호되는 대신, 지워지면 19개가 동시에 열립니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'launcher.cs 가 이 기능으로 1,200줄 넘게 늘어 9,800줄대가 됐습니다. SSH 는 ssh_terminal.cs 로, 원격 파일은 ssh_files.cs 로 ' +
            '갈라 냈는데 DB 는 라우팅과 세션 관리가 모두 launcher.cs 안에 있습니다. ' +
            '워커 쪽 로직이 Python 으로 빠져 C# 쪽이 얇긴 하지만, 클래스 둘(DbSession·DbQueryJob)과 헬퍼 20여 개가 한 파일에 더 얹힌 상태입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '워커는 접속을 연 사용자의 권한 그대로 동작합니다. 앱이 권한을 대신 넓히거나 관리자 계정을 권하지 않는다는 원칙이 문서에 적혀 있고, ' +
            '읽기 전용도 앱이 아니라 서버가(SET SESSION TRANSACTION READ ONLY) 겁니다. ' +
            '런처는 SQL 을 짓지도 고치지도 않고 바이트를 나르기만 하는 자리에 머물러 있습니다.',
        },
      ],
    }),

    sec({
      id: 'launcher-diagnostics',
      category: CAT,
      group: '진단',
      title: '진단 로그 — /diagnostics/*',
      subtitle: '무슨 일이 있었는지 나중에 물어볼 수 있게',
      summary:
        '교실 PC 에서 난 문제를 재현 없이 짚기 위한 기록 장치입니다. 브라우저 쪽 diagnostics.js 가 사건을 모으고 ' +
        '런처가 세션별 파일로 남깁니다. /diagnostics/events 로 보내고 /diagnostics/session 으로 지금 세션을 묻고, ' +
        '/diagnostics/open-folder 로 그 폴더를 열고, /diagnostics/clear 로 지웁니다.',
      usage: [
        {
          title: '왜 로그를 서버에 두나',
          body:
            '브라우저 콘솔은 창을 닫으면 사라지고, 앱 모드로 열린 창에는 개발자 도구를 열기도 어렵습니다. ' +
            '"어제 그 PC 에서 저장이 안 됐다" 는 신고를 받았을 때 볼 것이 남아 있어야 하므로, 세션마다 파일로 떨굽니다. ' +
            '폴더를 여는 엔드포인트가 따로 있는 것도 같은 이유입니다 — 사용자가 그 파일을 첨부해 보낼 수 있어야 합니다.',
        },
        {
          title: '지우는 길을 함께 둔다',
          body:
            '/diagnostics/clear 가 기록을 지웁니다. 무엇이 남는지 사용자가 알고 지울 수 있어야 한다는 기조는 ' +
            'DB 클라이언트의 실행 이력 패널에 지우기 버튼을 둔 것과 같습니다.',
        },
      ],
      features: [
        { title: '세션 단위', body: '앱 실행 한 번이 세션 하나입니다. /diagnostics/session 이 지금 세션 식별자를 돌려줍니다.' },
        { title: '묶어 보내기', body: '사건마다 요청을 보내지 않고 diagnostics.js 가 모았다가 /diagnostics/events 로 한 번에 넘깁니다.' },
        { title: '폴더 열기', body: '/diagnostics/open-folder 가 탐색기로 기록 폴더를 엽니다.' },
      ],
      files: [
        L('launcher.cs (진단 라우팅)', { from: 'method == "GET" && path.StartsWith("/diagnostics/events"', before: 4, to: 'method == "POST" && path == "/diagnostics/open-folder"', after: 10 }, '/diagnostics/* 다섯 갈래'),
        { path: 'src/js/diagnostics.js', label: 'diagnostics.js', description: '브라우저 쪽 수집기 — 10-bootstrap 의 diagnostics 섹션에서 함께 봅니다' },
        { path: 'tests/diagnostics.test.js', label: 'diagnostics.test.js', description: '수집·묶기·전송 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '교실 배포 소프트웨어에 실제로 필요한 기능입니다. 사용자가 재현 방법을 설명하지 못하는 환경이라, ' +
            '"무슨 일이 있었는지" 를 나중에 물어볼 수 있게 해 두는 것이 지원 비용을 가장 크게 줄입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '기록에 무엇이 담기는지가 이 기능의 안전선입니다 — 사용자가 그 파일을 첨부해 보내는 것이 원래 용도이기 때문입니다. ' +
            '거르는 일은 브라우저 쪽 diagnostics.js 의 scrubString·privateKey 가 하고 런처는 받은 것을 그대로 적습니다. ' +
            '즉 서버 쪽에는 두 번째 방어선이 없어, 앞으로 다른 코드가 /diagnostics/events 를 직접 부르면 거르는 단계를 건너뜁니다.',
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
        'build.bat 은 세 단계입니다 — ① 오프라인 HTML 을 app.html 로 복사 ② csc.exe 로 launcher.cs · ssh_terminal.cs · ssh_files.cs 를 함께 컴파일하며 ' +
        'app.html·python_kernel.py·db_worker.py·npm_package_runner.js·ssh_shell_integration.bash 를 리소스로 넣기 ③ 결과를 프로젝트 루트의 ClassDock.exe 로 출력. ' +
        'C# 컴파일러가 없으면 Go 폴백(main.go)으로 빌드하는데, 이때는 PowerPoint 변환과 SSH 원격 터미널이 빠집니다.',
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
        { title: '리소스 내장 다섯 개', body: 'app.html · python_kernel.py · db_worker.py · npm_package_runner.js · ssh_shell_integration.bash. 앞의 넷은 실행 대상이고 마지막은 원격 Bash 에 물릴 시작 스크립트입니다.' },
        { title: '소스 세 벌', body: '컴파일 대상이 launcher.cs → +ssh_terminal.cs → +ssh_files.cs 로 늘었습니다. 리소스가 아니라 함께 컴파일되는 소스입니다.' },
        { title: '두 배치의 리소스가 다르다', body: 'build.bat 에는 ssh_shell_integration.bash 가 들어 있고 build-dotnet.bat 에는 없습니다.' },
        { title: 'winexe', body: '/target:winexe 라 콘솔 창이 뜨지 않습니다.' },
        { title: 'build-dotnet.bat', body: 'Go 폴백 없이 C# 만 강제하는 변형입니다.' },
      ],
      files: [
        { path: 'desktop/build.bat', label: 'build.bat', description: '기본 빌드(Go 폴백 포함)' },
        { path: 'desktop/ssh_terminal.cs', label: 'ssh_terminal.cs', description: 'launcher.cs 와 함께 컴파일되는 두 번째 C# 소스' },
        { path: 'desktop/ssh_files.cs', label: 'ssh_files.cs', description: '세 번째 C# 소스 — 읽기 전용 SFTP' },
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
            'Go 폴백은 기능이 다른 산출물을 같은 파일명으로 만듭니다. 빌드 로그를 보지 않으면 어느 쪽으로 빌드됐는지 알 수 없어, PowerPoint 변환이 조용히 사라질 수 있습니다. ' +
            '빠지는 기능은 이제 셋입니다 — PowerPoint 변환·SSH 원격 터미널에 원격 파일과 DB 클라이언트까지, C# 쪽에만 있는 코드가 계속 늘고 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '두 빌드 배치의 /resource: 목록이 서로 다릅니다 — build.bat 은 ssh_shell_integration.bash 를 넣고 build-dotnet.bat 은 넣지 않습니다. ' +
            'C# 전용 빌드로 만든 EXE 는 원격 터미널의 현재 폴더 자동 채우기가 조용히 동작하지 않는다는 뜻입니다. ' +
            '컴파일 명령줄이 두 파일에 손으로 복사돼 있어 한쪽만 고치기 쉬운 구조이고, 이 목록을 대조하는 검사는 없습니다.',
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
