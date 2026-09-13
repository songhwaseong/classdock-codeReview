// 8. learning-tools — 원격 터미널(SSH)과 원격 파일.
//
// learning-tools 계층이지만 "문서"가 아니라 사이드바에서 열리는 독립 패널이고,
// 브라우저 쪽보다 EXE 쪽(desktop/ssh_terminal.cs · ssh_files.cs)이 더 큰 드문 기능이라 따로 둔다.
// EXE 쪽 구현과 엔드포인트는 60-desktop.mjs 의 launcher-ssh 섹션에서 본다.
//
// 2026-09 에 원격 파일(미리보기·다운로드)이 붙어 브라우저 쪽 파일이 셋이 됐다.
// 줄 수는 문장에 적지 않고 생성 때 잰다 — 여기 적혀 있던 "브라우저 쪽 558줄" 이
// remote-terminal.js 가 1,324줄이 되는 동안 그대로 남아 있었다.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const frontLines = linesLabel(rootDir, 'src/js/remote-terminal.js');
  const backLines = linesLabel(rootDir, 'desktop/ssh_terminal.cs');
  const filesBackLines = linesLabel(rootDir, 'desktop/ssh_files.cs');

  return [
    sec({
      id: 'remote-terminal-overview',
      category: '8. learning-tools',
      group: '원격 터미널',
      title: '원격 터미널 개요 (SSH · 리눅스 실습)',
      subtitle: `브라우저 ${frontLines} + EXE ${backLines} · ${filesBackLines}(원격 파일) — 무게중심이 런처에 있는 유일한 기능`,
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
            '도킹 상태(방향·너비·접힘)는 localStorage 에 남고, 문서 쪽 레이아웃에는 알림으로만 전달합니다. ' +
            '원격 파일 패널도 같은 도킹 영역에서 터미널과 자리를 나눠 쓰고, 좁으면 탭으로 전환합니다 — 새 도킹 영역을 만들지 않았습니다.',
        },
        {
          title: '작업공간마다 독립된 세션',
          body:
            '작업공간을 바꾸면 그 공간의 터미널이 살아납니다. 한 창에서 여러 실습 환경을 오갈 때 세션이 섞이지 않게 ' +
            '작업공간 식별자를 세션 상태의 열쇠로 삼고, 도킹 상태와 접속 기억도 그 단위로 갈라 둡니다. ' +
            '작업공간을 지우면 그 공간의 세션도 함께 정리합니다.',
        },
      ],
      features: [
        { title: 'EXE 전용', body: '/ssh-capability 로 Windows 10 1809 이상 + OpenSSH 클라이언트를 확인합니다. 없으면 이유를 문장으로 돌려줍니다.' },
        { title: '대화형 PTY', body: 'ConPTY 라서 vim·top·화면 지우기·색·방향키가 그대로 동작합니다. 창 크기를 바꾸면 원격 셸에도 전달됩니다.' },
        { title: '증분 폴링', body: 'WebSocket 없이 오프셋 기반 폴링으로 출력을 받습니다. 이미 받은 구간은 다시 내려오지 않습니다.' },
        { title: '동시 4세션', body: '런처가 세션 4개로 제한하고, 쓰지 않는 세션은 쓸어 냅니다. 앱을 닫으면 전부 정리합니다.' },
        { title: '지연 로드', body: 'xterm.js 는 MNLazy 의 xterm 묶음으로 원격 터미널을 실제로 열 때만 실행됩니다.' },
        { title: '파일 올리기', body: 'scp.exe 를 따로 띄워 올립니다. 파일 고르기 창은 /ssh-upload-pick 으로 런처가 엽니다.' },
        { title: '원격 파일 보기', body: '경로를 입력해 이미지·텍스트·CSV·PDF 를 읽기 전용으로 미리 보고, 어떤 형식이든 내려받습니다. 고치거나 지우거나 실행하지 않습니다.' },
        { title: '현재 폴더 자동 채우기', body: 'Bash 세션에 시작 스크립트를 물려 OSC 7 로 현재 폴더를 알립니다. 업로드·원격 파일 입력칸의 기본값이 그 값입니다.' },
      ],
      files: [
        { path: 'docs/원격터미널-설계.md', label: '원격터미널-설계.md', description: '1·2·3차 설계 — 범위·사용자 흐름·구성·비범위' },
        { path: 'docs/원격파일-미리보기-다운로드-설계.md', label: '원격파일-미리보기-다운로드-설계.md', description: '원격 파일 설계 — 범위·한도·검증 기록' },
        { path: 'tests/remote-terminal.test.js', label: 'remote-terminal.test.js', description: '배선·도킹·토큰·비밀번호 전달·지문·ConPTY' },
        { path: 'tests/remote-terminal-workspaces.test.js', label: 'remote-terminal-workspaces.test.js', description: '작업공간별 독립 세션·전환·삭제 정리' },
        { path: 'tests/ssh-shell-integration.test.js', label: 'ssh-shell-integration.test.js', description: 'Bash 시작 스크립트가 기존 PROMPT_COMMAND 를 보존하는지' },
        { path: 'tests/ssh-session-retention.test.js', label: 'ssh-session-retention.test.js', description: '세션 보존·정리 계약' },
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
            'RequiresLocalAuthToken 이 /ssh- 로 시작하는 모든 POST 를 잡습니다 — 접두사 한 줄이 경로 전부를 덮는 구조라 ' +
            '새 /ssh-* 경로를 추가해도 자동으로 보호되지만, 반대로 이 한 줄이 지워지면 전부 동시에 열립니다. ' +
            '경로 수는 원격 파일이 붙으며 아홉에서 열일곱으로 늘었고, 그동안 이 한 줄은 그대로였습니다 — ' +
            '접두사 방식이 실제로 값을 한 셈이자, 그 한 줄에 걸린 무게가 두 배가 된 셈이기도 합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '원격 파일이 들어오며 EXE 쪽 파일이 하나 더 늘어(ssh_files.cs) SSH 백엔드가 두 파일이 됐습니다. ' +
            '둘은 같은 정적 클래스(ClassDockSshTerminal)를 partial 로 나눠 쓰므로, 상태와 잠금이 파일 경계를 넘나듭니다 — ' +
            '터미널 쪽은 잠금이 여섯 개(SessionsLock·PrivateKeysLock·UploadSessionsLock 등)로 쪼개져 있고 파일 쪽은 FileGate 하나인데, ' +
            '종료·정리 경로에서는 양쪽을 함께 다룹니다. ' +
            '파일을 나눈 것이 곧 책임을 나눈 것은 아니라는 점을 이 자리가 보여 줍니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '무게중심이 브라우저가 아니라 EXE 에 있는 유일한 기능입니다. 다른 기능은 런처가 거들기만 하고 로직은 src/js 에 있는데, ' +
            `여기는 브라우저 ${frontLines} 에 EXE ${backLines} + ${filesBackLines} 로 뒤집혀 있습니다. ` +
            '오프라인 HTML 로 만들면 화면은 남고 기능만 빠집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '원격 파일 설계 문서에는 회귀 하나가 날짜와 함께 적혀 있습니다 — Windows 이벤트 로그의 .NET Runtime 오류를 따라가 ' +
            '인증 pipe 의 비동기 대기 핸들을 일찍 Dispose 한 것이 ObjectDisposedException 으로 앱 전체를 내렸다는 것입니다. ' +
            '고친 뒤 실제 named pipe 로 인증·취소 40회, 시간 초과 10회를 돌려 확인한 기록까지 남겼습니다. ' +
            '"무엇을 고쳤다" 가 아니라 "어떻게 알아냈고 어떻게 확인했다" 가 적힌 드문 형태입니다.',
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

    mod('remote-files.js', {
      group: '원격 터미널',
      title: 'remote-files.js — 원격 파일 판정 규칙 (MNRemoteFiles)',
      subtitle: 'DOM 없는 순수 정책 — 원격 내용을 앱 HTML 로 다루지 않는다',
      summary:
        '원격 파일을 미리 볼 때 "어디까지 받아서 어떻게 보여 줄지" 만 정하는 순수 모듈입니다. ' +
        '경로 검사, 텍스트 디코딩과 줄 자르기, CSV·TSV 파싱, 이미지 헤더 읽기, 오류 코드의 사람 말 옮김, 크기 표기가 전부입니다. ' +
        '파일 첫머리 한 줄이 이 모듈의 성격을 요약합니다 — 원격 내용을 애플리케이션 HTML 로 취급하지 않는다.',
      usage: [
        {
          title: '경로는 전체 경로만 받는다',
          body:
            '/ 로 시작하지 않으면 거절하고, 제어문자가 섞이면 거절하고, 4,096자를 넘으면 거절합니다. ' +
            '상대 경로와 ~ 는 아예 지원하지 않습니다 — 원격에서 무엇으로 풀릴지 이쪽이 알 수 없기 때문입니다. ' +
            '주목할 점은 `..` 을 접지 않는다는 것입니다. 앞 구성요소가 원격 심볼릭 링크일 수 있어, ' +
            '로컬에서 정규화하면 서버가 볼 경로와 달라집니다 — 로컬 경로 검사의 습관을 원격에 그대로 적용하지 않은 자리입니다.',
        },
        {
          title: '판정을 먼저, 그림을 나중에',
          body:
            'imageInfo 가 바이트 앞부분만 읽어 형식과 크기를 알아내고, 25메가픽셀을 넘으면 그리기 전에 막습니다. ' +
            '디코딩을 시작하고 나서 크기를 아는 순서였다면 교실 PC 가 이미 멈춘 뒤입니다. ' +
            '텍스트도 마찬가지로 제어문자가 섞여 있으면 "바이너리라 표시할 수 없다" 로 갈라 다운로드로 보냅니다.',
        },
        {
          title: '자른 것은 자랐다고 말한다',
          body:
            '10,000줄·한 줄 10,000자·표 1,000행·100열에서 자르고, 자를 때마다 limited 를 함께 돌려줍니다. ' +
            '화면은 그것을 받아 "앞부분만 표시" 를 적습니다. 잘린 내용을 전부인 것처럼 보여 주지 않는 규칙이 ' +
            'DB 결과 표(1000행·12000셀)와 같은 결로 지켜집니다.',
        },
        {
          title: '따옴표 규칙을 CSV 쪽에도 같은 원칙으로',
          body:
            'parseTable 이 큰따옴표를 칸의 첫 글자일 때만 인용 부호로 봅니다. grid-selection.js 의 클립보드 파서와 같은 판단이고, ' +
            '남이 만든 파일을 읽는 파서는 "우리 형식" 보다 "실제로 오는 것" 을 견뎌야 한다는 같은 이유에서 나왔습니다.',
        },
      ],
      features: [
        { title: '미리보기 형식', body: '이미지 · 텍스트/코드/로그 · CSV/TSV · PDF. 그 밖은 이유를 적고 다운로드로 안내합니다.' },
        { title: '텍스트 인코딩', body: 'BOM 으로 UTF-16LE/BE 를 가르고 그 밖은 UTF-8 로 읽되 fatal:true — 조용히 깨진 글자를 만들지 않습니다.' },
        { title: '오류 사전', body: 'errorText 가 ssh-file-* 코드를 사람 말로 옮깁니다. 원본 문자열을 그대로 띄우지 않습니다.' },
      ],
      files: [
        { path: 'tests/remote-files.test.js', label: 'remote-files.test.js', description: '경로 검사·디코딩·표 파싱·이미지 헤더' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '`..` 을 정규화하지 않는 이유가 코드 옆에 한 줄로 적혀 있습니다. ' +
            '경로 검사에서 `..` 을 접는 것은 거의 반사적인 습관인데, 원격 파일에서는 그 습관이 틀린다는 것을 짚고 그 근거(앞 구성요소가 심볼릭 링크일 수 있음)를 남겼습니다. ' +
            '"안 한 일" 에 이유가 붙어 있어 나중에 누군가 "왜 정규화를 안 하지" 하고 넣어 버리는 것을 막습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '읽기 전용이라는 범위를 판정 단계에서부터 지킵니다. 이 모듈에는 쓰기·삭제·실행에 해당하는 함수가 아예 없고, ' +
            '설계 문서도 "원격 파일을 수정·삭제·실행하지 않는다" 를 첫 문단에 두었습니다. ' +
            '기능이 커질 때 무엇을 거절해야 하는지가 코드 표면으로 드러나 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '설계 문서와 코드의 픽셀 상한이 다릅니다 — 문서는 "이미지 캔버스·PDF 페이지는 800만 픽셀로 제한한다" 인데 ' +
            '코드는 MAX_PIXELS 25,000,000 이고 오류 문구도 "25메가픽셀" 입니다. ' +
            '한도는 교실 PC 가 버티는지를 정하는 값이라, 문서를 보고 판단하면 세 배 넘게 어긋납니다. ' +
            '문서 쪽 숫자를 코드에 맞추거나, 이 프로젝트가 다른 자리에서 하듯 문서에서 숫자를 빼는 편이 맞습니다.',
        },
      ],
    }),

    mod('remote-files-ui.js', {
      group: '원격 터미널',
      title: 'remote-files-ui.js — 원격 파일 패널 (MNRemoteFilesUI)',
      subtitle: '경로 입력 · 미리보기 · 다른 이름으로 저장',
      summary:
        '터미널 도킹 영역 안에 보조 패널을 열어 원격 파일 경로를 받고, 미리보기를 그리고, ' +
        'Windows 저장창을 거쳐 내려받습니다. 파일 연결은 터미널 세션에 얹지 않고 따로 인증해 엽니다 — ' +
        '지금 터미널이 재사용 가능한 SFTP 객체를 갖고 있지 않기 때문입니다.',
      usage: [
        {
          title: '터미널 연결에 그냥 얹을 수 있다고 가정하지 않았다',
          body:
            '설계 문서가 현재 코드를 먼저 확인하고 "접속 정보는 재사용하되 파일 연결은 별도로 여는 설계" 라고 못 박았습니다. ' +
            '이미 붙어 있는 SSH 세션에 파일 전송을 얹는 것이 자연스러워 보이지만, 그 세션은 PTY 에 붙은 대화형 셸이지 SFTP 채널이 아닙니다. ' +
            '있는 것으로 될 것 같은 자리에서 실제 코드를 확인하고 시작한 사례입니다.',
        },
        {
          title: '토큰 위에 헤더를 하나 더 요구한다',
          body:
            'POST /ssh-file-* 는 실행별 토큰에 더해 X-ClassDock-Action: 1 헤더를 요구합니다(HasLocalActionHeader). ' +
            '헤더가 없으면 403 입니다. 폼 전송이나 단순 요청으로는 붙일 수 없는 헤더라, ' +
            '토큰이 어떤 경로로 새더라도 한 겹이 더 남습니다. 이 앱에서 토큰 위에 조건을 하나 더 얹은 드문 경로입니다.',
        },
        {
          title: '요청 id 를 프런트가 만들고 서명으로 묶는다',
          body:
            '요청마다 128비트 난수 id 를 만들어 보내고, 런처는 같은 id 로 다시 온 요청의 서명(작업 종류 + 인자)이 ' +
            '처음과 같은지 확인합니다. 다르면 거절합니다. 폴링 중 재시도가 다른 작업으로 바뀌는 것을 막고, ' +
            '같은 요청을 여러 번 보내도 작업이 하나만 생깁니다.',
        },
        {
          title: '비밀번호를 쓴 버퍼를 지운다',
          body:
            'bundle 로 만든 바이트 배열을 보낸 뒤 finally 에서 fill(0) 으로 덮습니다. ' +
            '자바스크립트에서 문자열은 지울 수 없지만 TypedArray 는 지울 수 있다는 차이를 이용한 처리이고, ' +
            '원격 터미널이 비밀번호를 다루던 기준을 파일 쪽에서도 이어받았습니다.',
        },
        {
          title: '실패한 새로고침이 화면을 비우지 않는다',
          body:
            '새로고침은 새 결과가 준비됐을 때만 화면을 교체하고, 실패하면 기존 내용을 남긴 채 "새로고침 실패 — 이전 내용" 을 붙입니다. ' +
            '보고 있던 로그가 한 번의 네트워크 실패로 사라지지 않게 하는 처리입니다. ' +
            'PDF 첫 페이지 렌더 실패도 빈 성공 화면을 만들지 않고 기존 미리보기와 실패 안내를 유지합니다.',
        },
        {
          title: 'PDF 를 격리해서 연다',
          body:
            'pdf.js 를 전용 Worker 이름으로 띄우고 isEvalSupported:false · disableFontFace:true · useSystemFonts:false 로 겁니다. ' +
            '원격 서버에서 받은 PDF 는 이 앱이 여는 문서 중 출처가 가장 불확실한 축이라, ' +
            '평가·폰트 로딩처럼 문서가 환경을 건드릴 수 있는 통로를 모두 닫고 시작합니다. 15초·10초 제한 시간도 함께 겁니다.',
        },
      ],
      features: [
        { title: '현재 폴더 자동 채우기', body: 'Bash 세션이 OSC 7 로 알린 경로가 기본값입니다. 파일명을 덧붙이면 이후 폴더 이동이 입력을 덮어쓰지 않고, 비우면 자동 경로로 돌아갑니다.' },
        { title: '저장창 취소와 전송 취소', body: '둘을 다른 결과로 다룹니다 — 저장 위치를 안 고른 것과 받다가 그만둔 것은 사용자에게 다른 일입니다.' },
        { title: '부분 다운로드 기록', body: '런처가 partial-downloads 에 진행을 남겨 이어받기·정리를 관리합니다.' },
        { title: '이미지 디코딩 격리', body: 'Worker 에서 createImageBitmap 으로 풉니다. 실패하면 다운로드로 안내합니다.' },
        { title: '안 되는 것을 말한다', body: '애니메이션 WebP·암호화 PDF·UNC 경로 저장은 미리보기 대신 이유와 다운로드를 내놓습니다.' },
      ],
      files: [
        { path: 'docs/원격파일-미리보기-다운로드-설계.md', label: '원격파일-미리보기-다운로드-설계.md', description: '설계 문서 — 범위·화면·한도·검증 기록' },
        { path: 'tests/remote-files-ui.test.js', label: 'remote-files-ui.test.js', description: '패널 배선·요청 서명·저장 흐름' },
        { path: 'tests/ssh-files.test.js', label: 'ssh-files.test.js', description: '모의 SFTP 스트림으로 프로토콜·디스크 동작 검증' },
        { path: 'tests/fixtures/ssh-files.cs', label: 'fixtures/ssh-files.cs', description: 'C# 쪽을 실제로 컴파일해 돌려 보는 실행 테스트 픽스처' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '토큰 하나에 기대지 않고 X-ClassDock-Action 헤더를 한 겹 더 얹었습니다. ' +
            '원격 서버의 파일을 로컬 디스크로 내려받는 경로라 다른 엔드포인트보다 결과가 무겁고, ' +
            '그 무게에 맞춰 경계를 한 단계 올린 판단입니다. 이 앱의 다른 강력한 경로(/run-python·/ssh-session-*)에는 없는 조건입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서에 검증 기록을 실행 결과와 함께 남겼습니다 — npm test 1,707개 통과·실패 0·건너뜀 2, ' +
            'OpenSSH 9.5 설정 출력에서 SFTP subsystem·PTY 비활성화 인수가 적용되는 것 확인, ' +
            '그리고 "실제 서버 전송과 브라우저·저장창 조작은 실행하지 않았다" 까지. ' +
            '확인한 것과 확인하지 않은 것을 갈라 적은 것이 이 기록의 값어치입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '원격에서 받은 바이트를 브라우저가 직접 해석하는 통로가 넷 열렸습니다(이미지·텍스트·CSV·PDF). ' +
            'MNRemoteFiles 의 판정과 Worker 격리로 좁혀 두긴 했지만, 이 앱이 여는 파일 중 출처가 가장 불확실한 축입니다. ' +
            'pdf.js 처럼 큰 파서를 원격 입력에 물리는 자리는 vendor 버전이 올라갈 때마다 다시 봐야 하는 표면입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 묶음은 세 파일 모두 moduleBoundaries 밖입니다 — MNRemoteFiles · MNRemoteFilesUI · MNRemoteTerminal 어느 것도 ' +
            '공개 API 로 등록돼 있지 않습니다. manifest 의 scriptDependencies 에 로드 순서만 적혀 있어 ' +
            '"선언이 실제로 있는가 · 소비자가 정말 그 이름을 쓰는가" 는 check-source.js 가 보지 못합니다. ' +
            'context-menu.js·grid-selection.js 는 새로 들어오면서 경계로 등록했는데 이쪽 셋은 빠져 있어, ' +
            '같은 시기에 들어온 모듈끼리도 검사 수준이 갈립니다.',
        },
      ],
    }),
  ];
};
