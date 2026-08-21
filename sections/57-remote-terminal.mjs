// 6. learning-tools — 원격 터미널(SSH). remote-terminal.js 한 파일.
//
// learning-tools 계층이지만 "문서"가 아니라 사이드바에서 열리는 독립 패널이고,
// 브라우저 쪽 558줄보다 EXE 쪽(desktop/ssh_terminal.cs)이 더 큰 드문 기능이라 따로 둔다.
// EXE 쪽 구현과 엔드포인트는 60-desktop.mjs 의 launcher-ssh 섹션에서 본다.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const frontLines = linesLabel(rootDir, 'src/js/remote-terminal.js');
  const backLines = linesLabel(rootDir, 'desktop/ssh_terminal.cs');

  return [
    sec({
      id: 'remote-terminal-overview',
      category: '6. learning-tools',
      group: '원격 터미널',
      title: '원격 터미널 개요 (SSH · 리눅스 실습)',
      subtitle: `브라우저 ${frontLines} + EXE ${backLines} — 무게중심이 런처에 있는 유일한 기능`,
      summary:
        '사이드바의 더보기 → 원격 터미널로 SSH 서버에 붙어, 문서 옆에 붙은 패널에서 vim·top·방향키·Ctrl+C 가 그대로 되는 ' +
        '대화형 원격 셸을 씁니다. 리눅스 실습을 하려면 학생 PC 마다 터미널 프로그램을 따로 깔고 접속 정보를 알려 줘야 했는데, ' +
        '그 과정을 이미 깔려 있는 ClassDock 안으로 들여온 기능입니다. ' +
        '브라우저는 TCP 로 SSH 를 맺을 수 없으므로 이 기능은 EXE 전용이고, 오프라인 HTML 에서는 안내만 뜹니다.',
      usage: [
        {
          title: '왜 SSH 라이브러리를 넣지 않았나',
          body:
            '순수 자바스크립트 SSH 구현이나 .NET SSH 패키지를 넣는 대신 Windows 에 이미 있는 OpenSSH 클라이언트(ssh.exe)를 씁니다. ' +
            '암호 협상·키 교환·알고리즘 갱신처럼 "틀리면 보안 사고가 되는" 부분을 직접 지고 가지 않겠다는 선택입니다. ' +
            '대신 ClassDock 은 그 프로세스를 ConPTY 에 붙여 바이트를 나르는 일만 합니다 — vendor 에 늘어난 것은 화면 쪽 xterm.js 하나뿐입니다.',
        },
        {
          title: '비밀번호가 지나가는 길을 하나로 좁혔다',
          body:
            '비밀번호는 브라우저 저장소에 넣지 않고(호스트·포트·계정만 기억합니다), 런처에서도 디스크·명령행·환경변수에 두지 않습니다. ' +
            '난수 이름의 일회성 named pipe 를 열어 askpass helper 에게만 건네고, 넘긴 바이트는 곧바로 지웁니다. ' +
            'ClassDock.exe 자신이 SSH_ASKPASS 로 지정돼 다시 실행되며, 이때는 파이프에서 읽은 값을 표준출력으로 흘리고 끝납니다. ' +
            '명령행에 두면 작업 관리자에서 보이고, 환경변수에 두면 자식 프로세스에 새는 자리라 그 둘을 모두 피한 구조입니다.',
        },
        {
          title: '서버 지문을 사용자가 확인한다',
          body:
            'ssh-keyscan 으로 서버 공개키를 읽어 SHA-256 지문을 계산해 보여 주고, 사용자가 관리자에게 받은 값과 맞춰 본 뒤에만 신뢰합니다. ' +
            '신뢰한 키만 담긴 ClassDock 전용 known_hosts 를 만들어 StrictHostKeyChecking=yes 로 접속하므로, ' +
            '"처음이니까 그냥 yes" 로 넘어가는 흔한 우회가 구조적으로 막혀 있습니다. ' +
            '저장된 지문이 달라지면 강한 경고 뒤 명시적으로 교체할 때만 통과합니다(ssh-host-key-changed).',
        },
        {
          title: '실패 원인을 골라서 알려 준다',
          body:
            'OpenSSH 는 실패를 종료 코드 하나로만 알려 줍니다. classifySshFailure 가 출력 문자열에서 ANSI 코드를 벗겨 내고 ' +
            '인증 실패 · 시간 초과 · 연결 거부 · DNS · 네트워크 · 지문 불일치 · 협상 오류를 갈라, 해결 방법과 재접속 단추를 함께 띄웁니다. ' +
            '교실에서 "안 돼요" 가 나올 때 무엇이 안 되는지 교사가 바로 알 수 있어야 하는 기능이라, 이 분류가 화면의 절반을 차지합니다.',
        },
        {
          title: '문서 옆에 붙는 패널이지 문서가 아니다',
          body:
            '탭으로 열리는 문서 종류가 아니라 좌우로 도킹되는 패널입니다. 분할선을 끌어 너비를 바꾸고 ⇄ 로 좌우를 바꾸며, ' +
            '접어 두어도 세션은 살아 있습니다. 실습 안내 문서를 보면서 명령을 치는 것이 이 기능의 실제 사용 모습이기 때문입니다. ' +
            '도킹 상태(방향·너비·접힘)는 localStorage 에 남고, 문서 쪽 레이아웃에는 알림으로만 전달합니다.',
        },
      ],
      features: [
        { title: 'EXE 전용', body: '/ssh-capability 로 Windows 10 1809 이상 + OpenSSH 클라이언트를 확인합니다. 없으면 이유를 문장으로 돌려줍니다.' },
        { title: '대화형 PTY', body: 'ConPTY 라서 vim·top·화면 지우기·색·방향키가 그대로 동작합니다. 창 크기를 바꾸면 원격 셸에도 전달됩니다.' },
        { title: '증분 폴링', body: 'WebSocket 없이 오프셋 기반 폴링으로 출력을 받습니다. 이미 받은 구간은 다시 내려오지 않습니다.' },
        { title: '동시 4세션', body: '런처가 세션 4개로 제한하고, 쓰지 않는 세션은 쓸어 냅니다. 앱을 닫으면 전부 정리합니다.' },
        { title: '지연 로드', body: 'xterm.js 는 MNLazy 의 xterm 묶음으로 원격 터미널을 실제로 열 때만 실행됩니다.' },
      ],
      files: [
        { path: 'docs/원격터미널-설계.md', label: '원격터미널-설계.md', description: '1·2·3차 설계 — 범위·사용자 흐름·구성·비범위' },
        { path: 'tests/remote-terminal.test.js', label: 'remote-terminal.test.js', description: '배선·도킹·토큰·비밀번호 전달·지문·ConPTY 10개' },
        {
          path: 'vendor/licenses/xterm-6.0.0.txt',
          label: 'xterm-6.0.0.txt',
          description: '터미널 화면 라이브러리 라이선스 — 본체(vendor/xterm.js)는 압축본이라 싣지 않고 MNLazy 의 xterm 묶음으로 지연 로드합니다',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서(docs/원격터미널-설계.md)에 범위뿐 아니라 "범위가 아닌 것"을 명시했습니다 — 개인키·SFTP·포트 포워딩·여러 동시 탭. ' +
            '1차는 비밀번호 인증만, 2차는 도킹, 3차는 실패 원인·재접속·취소·종료 안정화로 단계를 나눴고 실제 커밋도 그 순서를 따랐습니다. ' +
            '보안 표면이 넓은 기능에서 "이번에는 여기까지" 를 문서로 고정한 형태입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 앱에서 가장 강력한 원격 실행 경로입니다. 지속형 PowerShell 터미널이 "이 PC 에서 무엇이든" 이라면, ' +
            '이쪽은 "학교 서버에서 그 계정 권한으로 무엇이든" 입니다. 경계는 실행별 토큰 하나이고, ' +
            'RequiresLocalAuthToken 이 /ssh- 로 시작하는 모든 경로를 잡습니다 — 접두사 한 줄이 9개 엔드포인트 전부를 덮는 구조라 ' +
            '새 /ssh-* 경로를 추가해도 자동으로 보호되지만, 반대로 이 한 줄이 지워지면 9개가 동시에 열립니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '무게중심이 브라우저가 아니라 EXE 에 있는 유일한 기능입니다. 다른 기능은 런처가 거들기만 하고 로직은 src/js 에 있는데, ' +
            `여기는 브라우저 ${frontLines} 에 EXE ${backLines} 로 뒤집혀 있습니다. 오프라인 HTML 로 만들면 화면은 남고 기능만 빠집니다.`,
        },
      ],
    }),

    mod('remote-terminal.js', {
      group: '원격 터미널',
      title: 'remote-terminal.js — SSH 패널 (MNRemoteTerminal)',
      subtitle: 'xterm.js 화면 · 도킹 · 폴링 · 실패 분류',
      summary:
        '접속 폼, 지문 확인, xterm.js 화면, 입력 묶어 보내기, 출력 증분 폴링, 창 크기 전달, 실패 분류와 재접속을 담당합니다. ' +
        'SSH 자체는 전혀 다루지 않습니다 — 바이트를 /ssh-session-* 로 나르고 화면에 그리는 일만 합니다.',
      usage: [
        {
          title: '입력은 모았다 보낸다',
          body:
            '키를 누를 때마다 요청을 보내면 타자 속도만큼 HTTP 왕복이 생깁니다. queueInput 이 입력을 큐에 쌓고 ' +
            'flushInput 이 짧은 타이머로 묶어 한 번에 보내되, inputChain 프라미스로 순서를 보장합니다 — ' +
            '터미널 입력은 순서가 뒤바뀌면 명령 자체가 달라지므로 "묶어 보내기"와 "순서 지키기"를 함께 만족해야 합니다.',
        },
        {
          title: '출력은 오프셋으로 받는다',
          body:
            '/ssh-session-poll 에 지금까지 받은 offset 을 실어 보내면 그 뒤 증분만 base64 로 내려옵니다. ' +
            '런처 버퍼가 상한(4MB)을 넘겨 앞을 버리면 reset 을 함께 내려 주고, 화면은 그때 잘렸다는 것을 알 수 있습니다. ' +
            'WebSocket 없이 대화형 터미널을 굴리는 방식이고, 지속형 PowerShell 터미널·Python 세션이 쓰는 폴링 모양과 같습니다.',
        },
        {
          title: '문자열을 길이 붙여 이어 보낸다',
          body:
            'encodeStrings 가 값마다 4바이트 길이(리틀엔디언)를 앞에 붙여 이어 붙입니다. ' +
            '호스트·계정·비밀번호는 JSON 으로 실으면 이스케이프와 인코딩이 한 겹 더 끼는데, 비밀번호에는 어떤 바이트든 들어올 수 있습니다. ' +
            '런처 쪽 ReadBundle 이 같은 규칙으로 풀며, 항목 수와 최대 길이를 함께 받아 검사합니다.',
        },
        {
          title: '요청마다 시간 제한을 건다',
          body:
            'fetchTimed 가 AbortController 로 15초 제한을 겁니다. 응답이 없는 서버에 붙을 때 폼이 영원히 "연결 중" 으로 남지 않게 하는 처리이고, ' +
            '중단되면 ssh-request-timeout 으로 갈라 friendlyError 가 사람 말로 바꿉니다.',
        },
        {
          title: '화면 크기를 서버에 알린다',
          body:
            'ResizeObserver 로 패널 크기 변화를 받아 cols·rows 를 다시 재고, 잠깐 모았다가 /ssh-session-resize 로 보냅니다. ' +
            '이 값이 어긋나면 vim 화면이 깨지거나 줄이 접힙니다. 20~300열 · 5~120행으로 양쪽에서 같은 범위를 클램프합니다.',
        },
      ],
      features: [
        { title: '접속 폼', body: '호스트·포트(기본 22)·계정·비밀번호. "기억하기"는 비밀번호를 빼고 호스트·포트·계정만 localStorage 에 남깁니다.' },
        { title: '지문 확인', body: '/ssh-host-key-scan 결과를 보여 주고 사용자가 확인한 뒤에만 /ssh-host-key-trust 로 저장합니다.' },
        { title: '도킹', body: '좌·우 방향, 분할선 드래그 너비, 접기. 접어도 세션은 유지되고 상태는 classdockSshDockV2 에 남습니다.' },
        { title: '실패 분류', body: 'classifySshFailure — 인증·시간초과·거부·DNS·네트워크·지문·협상. 종료 코드 0 은 정상 종료로 갈라냅니다.' },
        { title: '진단 꼬리', body: '출력 끝부분을 따로 들고 있다가 세션이 끝났을 때 원인 판정에 씁니다.' },
      ],
      files: [
        { path: 'docs/원격터미널-설계.md', label: '원격터미널-설계.md', description: '설계 문서' },
        { path: 'tests/remote-terminal.test.js', label: 'remote-terminal.test.js', description: '배선·도킹·보안 계약 10개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '비밀번호를 다루는 코드가 이 파일에서 딱 한 곳입니다 — 폼에서 읽어 encodeStrings 로 실어 보내는 자리. ' +
            '변수에 오래 담아 두지 않고, "기억하기" 대상에서도 명시적으로 빼며, 파일 첫머리 주석에 그 원칙을 적어 두었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 파일은 moduleBoundaries 에 등록돼 있지 않은 전역 MNRemoteTerminal 을 만듭니다. ' +
            '다른 src/js 파일이 이 이름을 부르지 않고 DOM 단추(#remoteTerminalOpen)에 직접 붙기 때문에 소비자가 없어 경계 검사 대상이 아닌데, ' +
            '그 결과 "HTML 에서 단추 id 를 바꾸면 조용히 동작하지 않는" 연결이 검사 없이 남습니다. ' +
            'tests/remote-terminal.test.js 가 이 id 를 검사해 그 자리를 대신 지키고 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'stripTerminalCodes 가 OSC · CSI · 제어문자를 걷어 내고 나서 실패 원인을 판정합니다. ' +
            '원격 셸의 출력에는 색·커서 이동 코드가 섞여 있어, 그대로 정규식을 걸면 "Permission denied" 사이에 색 코드가 끼어 매칭이 빗나갑니다.',
        },
      ],
    }),
  ];
};
