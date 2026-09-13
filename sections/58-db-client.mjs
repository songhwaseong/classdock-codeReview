// 8. learning-tools — DB 클라이언트(.dbconn). db-client.js · db-dump.js · db-import.js.
//
// learning-tools 계층이지만 db-client.js 한 파일이 6천 줄대라 50-learning.mjs 에서 떼어 둔다.
// 지도(45-map)·악보(55-music)와 같은 이유이고, 카테고리가 같으므로 사이드바에서는
// learning-tools 안의 "DB 클라이언트" 묶음으로 이어 붙는다.
//
// EXE 쪽(desktop/db_worker.py 와 /db-* 라우팅)은 60-desktop.mjs 의 launcher-db 섹션에서 본다 —
// 원격 터미널이 브라우저/EXE 를 두 섹션으로 갈라 둔 것과 같은 배치다.

import { linesLabel, arrowFunctionSpan, arrowFunctionShare } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  // 줄 수와 "한 함수가 파일의 몇 %인가" 는 생성 때 잰다(lib/source-metrics.mjs).
  const clientLines = linesLabel(rootDir, 'src/js/db-client.js');
  const workerLines = linesLabel(rootDir, 'desktop/db_worker.py');
  const testLines = linesLabel(rootDir, 'tests/db-client.test.js');
  const mount = arrowFunctionSpan(rootDir, 'src/js/db-client.js', 'mount');
  const mountShare = arrowFunctionShare(rootDir, 'src/js/db-client.js', 'mount');
  const mountLabel = mount
    ? `${mount.span.toLocaleString('en-US')}줄(${mount.start}–${mount.end})`
    : '한 함수';

  return [
    sec({
      id: 'db-overview',
      category: '8. learning-tools',
      group: 'DB 클라이언트',
      title: 'DB 클라이언트 개요 (.dbconn)',
      subtitle: `브라우저 ${clientLines} + EXE 워커 ${workerLines} — 접속 하나가 문서 하나`,
      summary:
        '호스트·포트·계정으로 원격 MySQL·MariaDB 에 붙어 스키마를 훑고, SQL 을 쓰고 실행하고, 결과 표를 고치고, ' +
        '덤프를 뜨고, CSV·엑셀을 테이블에 적재하는 기능입니다. 접속 하나를 `.dbconn` 문서 하나로 두어 ' +
        '탭·작업공간·백업·최근 파일이 전부 기존 문서 구조를 그대로 따라옵니다. ' +
        '브라우저는 TCP 로 DB 에 붙을 수 없으므로 EXE 전용이고, 그마저도 로컬 Python 이 있어야 합니다 — ' +
        '실제 접속은 런처가 띄운 상주 Python 워커(desktop/db_worker.py)가 pymysql 로 맺습니다.',
      usage: [
        {
          title: '왜 도킹 패널이 아니라 문서 탭인가',
          body:
            '원격 터미널처럼 도킹 패널로 만드는 안을 먼저 검토했고, 설계 문서에 그 판단을 두 줄로 남겼습니다 — ' +
            '도킹 배치가 main 에 거는 ssh-dock-left · --ssh-dock-width 로 SSH 전용이라 두 번째 패널은 배치 코드를 복제해야 하고, ' +
            '520px 폭이 결과 그리드에 좁다는 것입니다. 문서로 두면 콘텐츠 영역 전체를 쓰고, 접속 하나가 탭 하나라 ' +
            '여러 서버를 동시에 열 수 있으며, 접속 파일 자체를 학생에게 나눠 줄 수도 있습니다(비밀번호는 들어 있지 않습니다).',
        },
        {
          title: '왜 SQLite 뷰어의 one-shot 구조를 그대로 못 쓰나',
          body:
            'SQLite 미리보기는 런처가 임시 Python 스크립트를 만들어 한 번 실행하고 stdout JSON 을 읽는 구조입니다(SqlitePreviewRunner). ' +
            '원격 DB 에는 이 모양이 맞지 않는 이유가 셋 적혀 있습니다 — 매 쿼리마다 새로 접속하면 왕복 지연이 쿼리보다 커지고, ' +
            '트랜잭션·임시 테이블·세션 변수·USE 로 바꾼 현재 스키마가 유지되지 않으며, 실행 중인 쿼리를 취소할 커넥션이 남지 않습니다. ' +
            '그래서 접속 하나당 상주 워커를 하나 띄웁니다. 새로 만든 구조가 아니라 노트북 커널(python_kernel.py)이 이미 쓰던 규약을 그대로 가져온 것입니다.',
        },
        {
          title: '읽기 전용을 안내 문구가 아니라 서버에서 건다',
          body:
            '접속은 기본이 읽기 전용이고, 그 판정을 프런트의 낱말 검사에 맡기지 않습니다. ' +
            '워커가 세션에 SET SESSION TRANSACTION READ ONLY 를 걸어 autocommit 상태에서도 각 문장이 세션 기본 접근 모드를 물려받게 하므로, ' +
            '쓰기 문장은 서버가 1792 로 거절합니다. 프런트 쪽 검사는 친절한 메시지를 위한 것이고 최종 판단은 서버가 합니다. ' +
            '"낱말 목록으로 SQL 을 막는다" 는 흔한 우회 가능 설계를 처음부터 피한 자리입니다.',
        },
        {
          title: '앱이 SQL 을 짓지 않는다',
          body:
            '사용자가 쓴 SQL 은 문자열 조작 없이 그대로 드라이버에 넘깁니다. 셀 편집·행 추가·행 삭제·CSV 적재도 마찬가지로 ' +
            '(값, NULL 여부) 만 실어 보내고 UPDATE·INSERT 문장은 워커가 자리표시자로 짓습니다. 런처는 변경 갈래 이름(update·delete·insert)만 ' +
            '알아보고 나머지는 JSON 값으로 옮깁니다. 값 창에 뜨는 미리보기 SQL 은 사람이 읽으라고 만든 글자이고 서버로 나가지 않습니다 — ' +
            "따옴표 처리를 프런트가 떠맡는 순간 NULL·숫자·날짜 구분이 O'Brien 한 줄에 무너지기 때문입니다.",
        },
        {
          title: '비밀번호가 지나가는 길을 원격 터미널과 같은 기준으로 좁혔다',
          body:
            '비밀번호는 .dbconn 파일·localStorage·앱 상태·명령행·환경변수·로그 어디에도 남지 않습니다. ' +
            '워커를 띄운 직후 stdin 으로 보내는 첫 handshake 라인에만 실리고 그 뒤로는 워커 프로세스 메모리에만 머뭅니다. ' +
            '워커의 stderr 도 그대로 흘리지 않습니다 — 드라이버 예외 문자열에 접속 문자열이 섞여 나오는 경우가 있어, ' +
            '분류한 코드와 다듬은 메시지만 내보냅니다. SQL 오류만은 원문이 곧 학습 정보라 함께 보입니다.',
        },
        {
          title: '오래 걸리는 일은 시작만 시키고 폴링으로 받는다',
          body:
            '쿼리·덤프·적재가 모두 "시작 → job id → 폴링" 모양입니다(/pip-install-start 와 같은 규약). ' +
            '60초짜리 fetch 에 화면이 매달리지 않고, 실행 중에도 취소를 보낼 수 있습니다. ' +
            '워커는 최종 응답 앞에 진행 보고를 흘릴 수 있고 런처가 그것을 작업 상태에 담으므로 "요청 하나에 응답 하나" 규약은 그대로입니다. ' +
            '이때 제한 시간이 총 실행 시간이 아니라 줄 하나를 기다리는 시간이 되는 것이 요점입니다 — ' +
            '살아 있는 덤프는 몇십 분이 걸려도 끊기지 않고, 조용히 멈춘 워커는 제때 끊깁니다.',
        },
        {
          title: '앱 본체에 남긴 자국',
          body:
            'document-types.js 의 dbconn 아이콘과 사이드바 분류, file-loaders.js 의 확장자 분기, app.js 와 classdock.html 의 ' +
            '"새 DB 접속(.dbconn)" 항목, lazy.js 의 sqlFormat 묶음이 전부입니다. ' +
            'SQL 편집기는 python-editor.js 의 buildCodeEditor 를 plain:true 로 그대로 쓰고, 결과 내보내기는 MNTableExport 를, ' +
            '칸 고르기는 새로 뗀 MNGridSelection 을 씁니다 — .mnote·.msheet·.map 이 닦아 둔 "새 문서 종류" 경로를 그대로 따랐습니다.',
        },
      ],
      features: [
        { title: 'EXE + 로컬 Python 전용', body: '/db-capability 로 Python 유무와 pymysql 설치 여부를 묻습니다. 없으면 설치 버튼과 "다시 검사" 를 띄웁니다(vendor/wheels 덕에 오프라인 설치).' },
        { title: '스키마 트리', body: '데이터베이스 → 테이블·뷰·프로시저·함수·이벤트·트리거. 컬럼 펼치기는 컬럼만 따로 받아 옵니다(미리보기 200행을 함께 끌어올 이유가 없어서).' },
        { title: 'SQL 편집기', body: '탭 여럿, 자동완성(키워드 + 현재 DB 의 테이블·컬럼), Ctrl+클릭 정의 이동, sql-formatter 정렬, EXPLAIN 실행 계획.' },
        { title: '실행 단위 규칙', body: '선택 영역이 있으면 그대로 · Ctrl+Enter 는 커서가 놓인 문장 하나 · Ctrl+Shift+Enter 는 전체. DBeaver·Workbench·DataGrip 공통 규칙입니다.' },
        { title: '결과 표', body: '칸·행·열·전체 고르기, Ctrl+C 로 TSV 복사(NULL 은 빈칸), 헤더 화살표로 서버 재조회 정렬, 결과 탭 여럿, 더 보기 페이징.' },
        { title: '표 고치기', body: '셀 편집·행 추가·행 삭제를 변경 목록에 담았다가 적용 때 한 묶음으로 보냅니다. 미리보기에서 문장을 확인하고 하나씩 뺄 수 있습니다.' },
        { title: '트랜잭션', body: '쓰기 허용 접속에 한해 자동 커밋 토글·커밋·롤백. 커밋 대기 배지, 자동 커밋 복귀·연결 끊기 앞 확인.' },
        { title: 'ERD·테이블 정보', body: '현재 데이터베이스의 외래키 관계를 그림으로, 테이블 하나의 컬럼·인덱스·외래키·CHECK·트리거를 모달로 봅니다.' },
        { title: '덤프·적재', body: 'db-dump.js 가 고른 객체를 .sql 파일로 내보내고, db-import.js 가 CSV·엑셀 행을 테이블에 넣습니다.' },
        { title: '접속 표시색', body: '운영 DB 를 빨강으로 두면 어느 탭에서 실행하는지 한눈에 보입니다. 색은 정해진 목록의 값만 받습니다(임의 문자열이 CSS 선택자에 들어가지 않게).' },
      ],
      files: [
        { path: 'docs/DB클라이언트-설계.md', label: 'DB클라이언트-설계.md', description: '1·2차 설계 — 범위·비범위·사용자 흐름·보안 원칙·한도·검증 항목' },
        { path: 'docs/DB-붙여넣기-데이터적재-설계.md', label: 'DB-붙여넣기-데이터적재-설계.md', description: '결과 그리드 붙여넣기와 CSV·엑셀 적재 설계' },
        { path: 'tests/db-client.test.js', label: 'db-client.test.js', description: `직렬화·문장 나누기·보안 계약·편집 판정·덤프 — ${testLines}` },
        { path: 'tests/db-import.test.js', label: 'db-import.test.js', description: '적재 미리보기·열 짝짓기·한도' },
        { path: 'tests/e2e/db-no-python.spec.js', label: 'db-no-python.spec.js', description: '파이썬 없는 PC 의 안내와 다시 검사 흐름' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서가 "무엇을 안 하기로 했는가" 를 먼저 적었습니다 — 스키마 편집 GUI·ERD 그리기·마이그레이션·프로시저 디버깅·SSH 터널 경유. ' +
            '보안 표면이 넓고 되돌릴 수 없는 동작이 많은 기능에서 범위를 문서로 고정한 형태이고, ' +
            '원격 터미널 설계 문서가 1·2·3차로 단계를 나눈 것과 같은 방식입니다. ' +
            '(다만 그 목록 중 ERD 는 그 뒤 실제로 들어왔습니다 — 문서의 비범위 목록이 코드보다 늦었습니다.)',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '되돌릴 수 없는 일에 확인을 붙이되, 검사 대상을 "편집기 전체" 가 아니라 "이번에 보낼 것" 으로 좁혔습니다. ' +
            '아래에 적어 둔 DROP 때문에 위의 SELECT 하나에도 확인창이 뜨면 아무도 확인창을 읽지 않게 된다 — 는 이유가 문서에 남아 있습니다. ' +
            '확인창을 다는 것보다 확인창이 계속 읽히게 만드는 쪽을 본 판단입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '1000행에서 잘린 결과를 화면에서 다시 늘어놓지 않고 문장의 ORDER BY 를 고쳐 서버에 다시 묻습니다. ' +
            '받아온 것만 정렬하면 "전체에서 가장 큰 값" 처럼 보이는 거짓말이 되기 때문입니다. ' +
            '게다가 화살표 표시는 클릭 기록이 아니라 실제로 실행된 문장의 ORDER BY 에서만 읽습니다 — ' +
            '사용자가 편집기를 손으로 고쳤을 때 화면이 거짓말하지 않게 하는, 한 단계 더 들어간 처리입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '"쓰는 길은 하나" 를 구조로 못 박았습니다. 셀 값 창의 담기, 그 자리 편집(F2·타자), 행 추가·삭제가 모두 같은 변경 목록에 쌓였다가 ' +
            '/db-apply 한 곳으로만 나갑니다. 칸 하나만 따로 쓰는 길을 남겨 두면 트랜잭션·되돌리기 규칙이 둘로 갈린다는 이유가 적혀 있고, ' +
            '칸을 여는 길도 openCellAt 하나로 모아 "두 번 누르기·F2·타자" 가 같은 길을 탑니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `mount 한 함수가 ${mountLabel}로 파일의 ${mountShare}% 입니다. spreadsheet-viewer.js 의 renderXlsx(73%) 와 ` +
            'map-viewer.js 의 mountMapEditor(47%) 를 넘어 이 레포에서 가장 큰 단일 함수가 됐습니다. ' +
            '스키마 트리·편집기·결과 표·셀 편집·트랜잭션·ERD·테이블 정의 편집이 전부 이 함수의 지역 스코프에 있어, ' +
            '기능을 하나 더 붙일 때마다 함수가 길어지는 것 말고는 선택지가 없습니다. ' +
            '리뷰에서도 이 파일은 구간으로 나누지 못하고 통째로 싣습니다 — 어디를 잘라도 함수 중간이기 때문입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '길이 접두 인코딩으로 평평하게 실어 보내는 요청이 셋으로 늘었습니다(/db-session-open · /db-apply · /db-dump). ' +
            '프런트가 싣는 차례와 런처가 읽는 차례가 어긋나면 값이 엉뚱한 칸으로 들어가는데, 그것을 막는 것이 테스트뿐입니다 — ' +
            '설계 문서도 이 자리에 ⚠ 를 두 번 붙였고 db-client.test.js 가 두 쪽을 나란히 놓고 봅니다. ' +
            '원격 터미널이 값 다섯 개로 쓰던 규약을 변경 500건짜리 묶음에까지 밀고 온 것이라, 다음에 필드를 하나 끼워 넣을 때가 이 방식의 시험대입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '기능 하나에 EXE 엔드포인트 19개가 걸렸습니다 — 이 앱에서 한 기능이 가진 가장 많은 수이고, ' +
            '지도(10개)·SSH(17개)보다 많습니다. 경계는 RequiresLocalAuthToken 의 path.StartsWith("/db-") 한 줄이라 ' +
            '새 /db-* 경로가 자동으로 보호되는 대신 그 한 줄이 지워지면 19개가 동시에 열립니다. SSH 와 같은 구조이고 같은 성질의 위험입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            `단위 테스트가 ${testLines}으로 이 레포에서 가장 큰 단위 테스트가 됐습니다. ` +
            '주목할 점은 상당수가 화면 동작이 아니라 "지켜야 하는 성질" 을 검사한다는 것입니다 — ' +
            '비밀번호가 명령행·환경변수가 아니라 stdin 으로만 가는지, 읽기 전용을 서버가 거는지, ' +
            '프런트와 워커의 문장 나누기가 같은 입력에 같은 결과를 내는지. remote-terminal.test.js 가 먼저 만든 방식을 이어받았습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '2차 범위(Oracle)는 열어 두되 "미확인 항목" 으로 묶어 두었습니다 — python-oracledb 휠을 vendor/wheels 에 오프라인 번들할 수 있는지, ' +
            '대상 기관의 Oracle 이 thin 모드가 붙는 12.1 이상인지. 확인 방법(pip download --only-binary)까지 적어 두고 ' +
            '확인 전에는 범위를 확정하지 않는다고 못 박았습니다.',
        },
      ],
    }),

    mod('db-client.js', {
      group: 'DB 클라이언트',
      title: 'db-client.js — 접속 문서 (MNDbClient)',
      subtitle: '스키마 트리 · SQL 편집기 · 결과 표 · 셀 편집 · ERD — src/js 에서 가장 큰 파일',
      summary:
        '.dbconn 의 직렬화, SQL 문장 나누기와 실행 단위 판정, ORDER BY 고쳐 쓰기, 셀 편집 미리보기 문장 만들기, ' +
        '테이블 정의 편집 계획(ALTER 조립), ERD 배치 계산 같은 순수부와, 접속 화면 전체가 한 파일에 있습니다. ' +
        `앞쪽 ${mount ? `약 ${(mount.start - 1).toLocaleString('en-US')}줄` : '일부'}이 DOM 을 만들지 않는 순수 함수라 node --test 로 검증되고, ` +
        '나머지가 mount 한 함수입니다.',
      usage: [
        {
          title: '문장 나누기를 두 곳이 같은 규칙으로 한다',
          body:
            'statementRanges 가 따옴표·역따옴표·주석 안의 세미콜론을 구분자로 보지 않고 문장을 가릅니다. ' +
            '같은 일을 워커의 statement_records 도 하는데, 확인창이 판단한 문장과 실제로 실행되는 문장이 다르면 ' +
            '"DROP 확인" 을 통과한 뒤 다른 것이 실행될 수 있습니다. 그래서 두 구현이 같은 입력에 같은 결과를 내는지를 테스트가 직접 대조합니다.',
        },
        {
          title: 'DELIMITER 를 문장 나누기로 풀지 않는다',
          body:
            '프로시저 본문에는 세미콜론이 들어가므로 세미콜론 나누기로는 다룰 수 없습니다. ' +
            'delimiterDirectiveAt 이 DELIMITER 지시를 알아보고, compoundExecutionScript 가 실행할 때만 임시 구분자로 감쌉니다. ' +
            'SQL 열기로 불러온 덤프가 DELIMITER 로 시작하면 그 사실을 먼저 알립니다 — 조용히 반만 실행되는 쪽을 피했습니다.',
        },
        {
          title: '정렬은 결과를 보는 방식이지 문장을 고치는 일이 아니다',
          body:
            'orderBySpot 이 문장에서 ORDER BY 를 넣을 자리를 찾고 applyOrderBy 가 그 자리만 갈아 끼워 서버에 다시 묻습니다. ' +
            '편집기 내용은 건드리지 않고, 대신 결과 줄에 "정렬 · ORDER BY …" 를 적어 편집기와 지금 보는 결과가 다르다는 것을 알립니다. ' +
            'SELECT 계열이 아니거나(SHOW 는 ORDER BY 를 못 받습니다) 문장이 4000자를 넘어 잘려 왔으면 정렬을 아예 걸지 않습니다.',
        },
        {
          title: '무엇을 고칠 수 있는지를 프런트가 짐작하지 않는다',
          body:
            '열 이름만으로는 별칭·조인·계산식을 가릴 수 없습니다. 드라이버가 서버에서 받아 둔 필드 메타데이터(org_table·org_name)를 봐야 ' +
            '어느 테이블 어느 컬럼인지 알 수 있으므로, 편집 가능 판정은 워커가 해서 결과에 실어 보내고 화면은 그것을 읽기만 합니다. ' +
            '잠긴 까닭(기본키 칸·계산식 열·이진 컬럼·생성 컬럼·뷰·조인)도 함께 와서 값 창이 그대로 밝힙니다.',
        },
        {
          title: '잘려 온 값을 그대로 저장하지 않는다',
          body:
            '표에 실린 값은 500자에서 잘려 있을 수 있습니다. 그 글자를 그대로 저장하면 서버의 값이 잘린 채 덮이므로, ' +
            '잘린 칸과 NULL 칸은 고치기를 열 때 /db-cell 로 원본을 다시 읽습니다. ' +
            '기본키가 잘려 온 행은 그 값으로 행을 짚을 수 없어 아예 열지 않습니다. ' +
            '"보이는 것이 전부가 아닐 수 있다" 를 편집 경로 전체에서 일관되게 다룬 자리입니다.',
        },
        {
          title: '낙관적 잠금을 일부러 쓰지 않았다',
          body:
            '조건에 옛 값을 섞지 않습니다. 표의 값은 글자로 옮겨진 것이라(FLOAT·DATETIME 소수부·잘린 텍스트) ' +
            '아무도 바꾸지 않았는데 0행이 반영되는 일이 잦기 때문입니다. 대신 고친 뒤 같은 조건으로 다시 읽어 ' +
            '"값이 이미 같았다" 와 "그 행이 사라졌다" 를 가릅니다. 흔한 기법을 안 쓴 이유가 코드 옆에 남아 있는 형태입니다.',
        },
        {
          title: '한글 IME 를 막지 않고 칸을 연다',
          body:
            '칸을 고르고 바로 타자를 치면 그 자리가 입력칸이 되는데, 한글 IME 는 keydown 이 Process(229)로 옵니다. ' +
            '그때 preventDefault 를 부르면 첫 글자 조합이 끊기므로 막지 않고 입력칸만 열어 조합이 그 칸에서 시작되게 합니다. ' +
            'spreadsheet-viewer.js 가 같은 이유로 같은 방식을 쓰고 있어, 두 표가 같은 규칙을 공유합니다.',
        },
        {
          title: 'pointerdown 에서 preventDefault 를 부르지 않는다',
          body:
            '표의 pointerdown 에서 preventDefault 를 부르면 뒤따르는 click·dblclick 까지 막힙니다. ' +
            '글자 드래그 선택은 CSS 의 user-select:none 이 이미 막고 있으므로 그 자리에서 부르지 않습니다. ' +
            '칸을 끄는 동작과 글자를 긁는 동작이 같은 드래그를 두고 다투는 문제를, 이벤트가 아니라 스타일로 푼 것입니다.',
        },
        {
          title: '칸마다 리스너를 달지 않는다',
          body:
            '1,000행 × 20열이면 리스너가 2만 개가 되므로 표 하나에서 위임으로 받습니다. ' +
            '고른 자리를 칠할 때도 바뀐 칸과 머리 구간만 다시 칠합니다 — 교실 PC 에서 표 전체를 매번 훑으면 끌리기 때문입니다. ' +
            '고르기 셈 자체는 grid-selection.js(MNGridSelection)로 떼어 스프레드시트 뷰어와 함께 씁니다.',
        },
      ],
      features: [
        { title: '순수부', body: 'parseProfile·serializeProfile, statementRanges·statementAt·firstKeyword, riskyStatements·implicitCommitStatements, orderBySpot·applyOrderBy, aliasMap, erdLayout, tableAlterPlan 등 40여 개를 내보냅니다.' },
        { title: 'SQL 탭', body: '한 접속 안에서 편집기 탭 여럿(MAX_SQL_TABS). 탭 이름은 첫 문장에서 뽑고, .dbconn 에 함께 저장됩니다.' },
        { title: '자동완성', body: 'completionWords 배열을 편집기 위젯이 참조로 붙들고 있어 접속 뒤 스키마가 오면 그 자리에서 채워집니다. `별칭.` 뒤에서는 그 별칭이 가리키는 테이블의 컬럼만 줍니다.' },
        { title: 'Ctrl+클릭 정의 이동', body: 'sqlDefinitionTargetAt 이 현재 DB 의 테이블·뷰·별칭과 프로시저·함수·이벤트·트리거를 해석해 정의 창을 엽니다.' },
        { title: '테이블 정의 편집', body: 'columnDraft·indexDraft·foreignKeyDraft·checkDraft 로 초안을 만들고 tableAlterPlan 이 바뀐 것만 골라 ALTER 를 조립합니다.' },
        { title: 'ERD', body: 'erdLayout 이 테이블 카드와 외래키 선을 배치합니다. 컬럼은 24개까지 그리고 나머지는 꼬리표로 알립니다.' },
        { title: '실행 이력', body: '접속(호스트·포트·DB·계정)별 최근 50건과 걸린 시간·성공 여부. 쿼리 본문이 남으므로 지우는 버튼을 함께 둡니다.' },
        { title: '우클릭 메뉴', body: '스키마 트리와 결과 표의 우클릭을 context-menu.js(MNContextMenu)로 붙입니다.' },
      ],
      files: [
        { path: 'docs/DB클라이언트-설계.md', label: 'DB클라이언트-설계.md', description: '설계 문서' },
        { path: 'tests/db-client.test.js', label: 'db-client.test.js', description: `순수부·보안 계약·편집 판정 — ${testLines}` },
        { path: 'tests/fixtures/db-cell-edit-probe.py', label: 'db-cell-edit-probe.py', description: '워커의 편집 판정·적용을 드라이버 없이 두드리는 프로브' },
        { path: 'tests/fixtures/db-multi-result-probe.py', label: 'db-multi-result-probe.py', description: '여러 결과 집합과 예산 소진 동작 프로브' },
        { path: 'tests/fixtures/db-dependency-probe.py', label: 'db-dependency-probe.py', description: '객체 삭제 전 의존 관계 조회 프로브' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '순수 함수 40여 개를 module.exports 로 내보내 브라우저 없이 검증합니다. ' +
            '문장 나누기·실행 단위 판정·되돌릴 수 없는 문장 고르기·ORDER BY 재작성·ALTER 조립처럼 ' +
            '"틀리면 남의 데이터가 사라지는" 계산이 전부 이쪽에 있습니다. ' +
            `${clientLines} UI 파일치고 테스트 가능한 표면이 넓고, map-viewer.js 가 먼저 보여 준 형태를 그대로 이었습니다.`,
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '실행 버튼의 이름이 지금 무엇이 실행되는지에 따라 바뀝니다(선택 실행 / 현재 문장 실행). ' +
            '겉모습이 같은 버튼이 상황마다 다르게 동작하는 것이 규칙 자체보다 위험하다는 판단이 설계 문서에 적혀 있습니다. ' +
            'DBeaver 계열의 관습을 따르되 그 관습이 초보에게 보이지 않는다는 점까지 본 자리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `mount 가 ${mountLabel}입니다. 이 함수의 지역 변수에 접속 상태·스키마 캐시·결과 집합·변경 목록·모달 스택이 전부 들어 있어, ` +
            '순수부를 아무리 잘 떼어 놓아도 화면 쪽은 나눌 수가 없습니다. ' +
            'mountDbSchemaTree · mountDbEditor · mountDbGrid 처럼 세로로 자르는 것이 다음 순서이고, ' +
            'renderXlsx·mountMapEditor 에 이미 같은 지적이 걸려 있어 이 파일이 세 번째 사례가 됐습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 파일은 moduleBoundaries 에 공개 API 로 등록돼 있지 않은데, 바깥에서 부르는 이름을 여럿 만듭니다 — ' +
            'loadDbConnDoc(file-loaders.js 가 부름), saveDbConnDoc, newDbConnScratch(+ 메뉴). ' +
            'check-source.js 의 경계 검사(선언이 있는지 · 소비자가 정말 쓰는지 · 로드 순서가 맞는지)를 이 이름들은 받지 못합니다. ' +
            'map-viewer.js 에 걸어 둔 것과 똑같은 지적이고, MNDbClient 를 경계로 등록하면 두 파일이 함께 풀립니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '값 창의 미리보기 SQL 은 서버로 나가지 않는 "읽기용 글자" 입니다. GUI 로 고친 일이 어떤 UPDATE 가 되는지 보여 주려고 만든 것이고, ' +
            'SQL 을 배우는 도구라 감추지 않는다는 이유가 설계 문서에 적혀 있습니다. ' +
            '보안 원칙(앱이 SQL 을 짓지 않는다)과 교육 목적이 부딪히는 자리를, 만들어 보여 주되 보내지는 않는 쪽으로 갈랐습니다.',
        },
      ],
    }),

    mod('db-dump.js', {
      group: 'DB 클라이언트',
      title: 'db-dump.js — SQL 덤프 내보내기 (MNDbDump)',
      subtitle: '고른 객체를 CREATE·INSERT 가 든 .sql 파일 하나로',
      summary:
        'mysqldump 가 하는 일을 앱 안에서 합니다. 편집·삭제까지 되는 도구인데 되돌릴 수단이 없어서 붙인 기능이라고 파일 첫머리에 적혀 있습니다. ' +
        '이 모듈은 화면만 맡습니다 — 파일을 만드는 일은 워커가, 저장 위치를 정하는 일은 런처가 합니다.',
      usage: [
        {
          title: '경로는 런처만 만든다',
          body:
            '프런트는 파일 "이름" 만 보내고 런처가 SafeRelPath → TryResolveSaveRootPath 로 저장 폴더 안으로 풀어 절대 경로를 워커에 넘깁니다. ' +
            '어디에 쓰였는지는 응답으로 돌려받습니다. 워커가 경로를 지으면 저장 위치 정책이 그대로 뚫리기 때문입니다 — ' +
            '"경로를 만드는 곳은 한 곳" 이라는 규칙을 세 계층에 걸쳐 지킨 자리입니다.',
        },
        {
          title: '진행 보고는 워커가 흘리고 런처가 모은다',
          body:
            '오래 걸리는 작업이라 시작만 시키고 결과는 폴링으로 가져갑니다(쿼리 실행과 같은 방식). ' +
            '워커가 최종 응답 앞에 진행 줄을 흘리면 런처가 그것을 작업 상태에 담아 두고, 화면은 /db-dump-poll 로 읽습니다. ' +
            '덤프의 무진행 제한 시간은 120초이고 총 실행 시간에는 상한을 두지 않습니다.',
        },
        {
          title: '취소는 쿼리 취소를 함께 쓴다',
          body:
            '/db-query-cancel 을 그대로 씁니다. 다만 실행 중인 작업 id 가 일치할 때만 워커에 cancel 을 보내므로, ' +
            '대기 중인 덤프를 취소해도 앞서 돌던 쿼리가 끊기지 않습니다. ' +
            '탭을 닫거나 연결을 끊을 때도 실행 중인 덤프를 먼저 취소하고 워커의 .part 정리를 기다립니다.',
        },
      ],
      features: [
        { title: '모드', body: '구조만 · 데이터만 · 둘 다. 옵션 여섯 개(DROP 먼저, 트랜잭션 감싸기, 외래키 검사 끄기 등)를 체크로 고릅니다.' },
        { title: '객체 고르기', body: '테이블·뷰·프로시저·함수·트리거·이벤트. 한 번에 500개까지이고 참조하는 쪽이 뒤에 오도록 순서가 고정돼 있습니다.' },
        { title: '문장 크기 제한', body: 'INSERT 한 문장은 200행 또는 100만 자에서 끊습니다 — 복원하는 서버의 max_allowed_packet 을 넘긴 문장은 통째로 거절되기 때문입니다.' },
        { title: '.part 로 쓴다', body: '다 적은 뒤에만 진짜 이름으로 바꿉니다. 취소·실패한 덤프는 파일을 남기지 않습니다.' },
      ],
      files: [
        { path: 'tests/fixtures/db-dump-probe.py', label: 'db-dump-probe.py', description: '워커의 덤프 생성을 실제 서버 없이 두드리는 프로브' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '기능을 붙인 이유가 파일 첫머리에 한 줄로 적혀 있습니다 — "편집·삭제까지 되는 도구인데 되돌릴 수단이 없어서". ' +
            '무엇을 만들었는지가 아니라 왜 필요해졌는지가 적힌 주석이라, 나중에 이 기능을 덜어 낼지 판단할 근거가 남습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '반쯤 쓰인 파일을 성공으로 남기지 않습니다. .part 로 쓰다가 이름을 바꾸고, 서버사이드 커서를 읽다가 끊기면 ' +
            '일부 행을 성공 덤프로 확정하지 않고 전체를 실패시킵니다. 복원용 파일에서 가장 위험한 실패 모양(조용히 일부만 든 파일)을 막았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '/db-dump 의 본문도 길이 접두 문자열의 평평한 줄입니다 — 파일 이름·모드·옵션 여섯 개·데이터베이스·대상 수에 이어 (종류, 이름) 이 옵니다. ' +
            '프런트가 싣는 차례와 런처가 읽는 차례가 어긋나면 엉뚱한 객체가 덤프되거나 옵션이 밀립니다. ' +
            '/db-apply 와 같은 위험이고 같은 방식(테스트가 두 쪽을 나란히 놓고 보기)으로만 막혀 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '덤프는 사용자 커넥션이 아니라 전용 커넥션에서 돕니다. 열어 둔 트랜잭션을 건드리지 않고 InnoDB 스냅샷으로 ' +
            '테이블 사이 시점이 어긋나지 않게 하기 위해서입니다. TIMESTAMP 는 UTC 로 읽고 복원 구간도 UTC 로 맞춘 뒤 원래 TIME_ZONE 을 되돌립니다.',
        },
      ],
    }),

    mod('db-import.js', {
      group: 'DB 클라이언트',
      title: 'db-import.js — CSV·엑셀 적재 (MNDbImport)',
      subtitle: '파일의 행을 한 테이블에 넣는다 — INSERT 문을 만들지 않고',
      summary:
        '지금까지 "가져오기" 는 .sql 텍스트를 편집기에 붙이는 것뿐이라 표를 그대로 넣는 길이 없었습니다. ' +
        '파일을 읽어 열을 테이블 컬럼에 짝지어 주면 (값, NULL 여부) 만 실어 보내고, INSERT 문장은 워커가 자리표시자로 짓습니다. ' +
        '결과 그리드에 그대로 붙여넣는 길도 같은 경로를 씁니다.',
      usage: [
        {
          title: '편집기에 INSERT 를 붙이지 않는 이유',
          body:
            '그러면 값을 SQL 에 이어 붙이게 되고, 따옴표·NULL·숫자·날짜 구분을 프런트가 떠맡는 순간 ' +
            "O'Brien 한 줄에 무너집니다. 셀 편집(/db-apply)과 같은 규약을 골라, 프런트는 값만 나르고 문장은 워커가 짓습니다.",
        },
        {
          title: 'REPLACE 를 일부러 넣지 않았다',
          body:
            '같은 키가 있을 때 고를 수 있는 것은 전체 취소(기본) · 건너뛰기 · 덮어쓰기 셋입니다. ' +
            'REPLACE 는 DELETE + INSERT 라 외래키 ON DELETE CASCADE 가 딸린 자식 행을 말없이 지웁니다 — ' +
            '적재 창이 낼 수 있는 결과가 아니라고 판단해 목록에서 뺐습니다. ' +
            '건너뛰기에도 "자료형이 틀린 행까지 조용히 빠지고 까닭은 알 수 없다" 는 주의가 붙어 있습니다.',
        },
        {
          title: '실패한 행을 짚어 준다',
          body:
            'executemany 로 500행씩 보내다가 실패하면 그 묶음만 한 행씩 다시 짚어(find_failing_row) 몇 번째 행 때문인지 알려 줍니다. ' +
            '한 행씩 보내면 느리고 통째로 보내면 어디가 틀렸는지 모르는 문제를, 실패했을 때만 좁혀 들어가는 방식으로 풀었습니다.',
        },
        {
          title: '한도를 세 곳이 같은 값으로 건다',
          body:
            '행 10,000 · 셀 100,000 · 열 512 · 값 65,535자를 프런트·런처·워커가 같은 상수로 겁니다. ' +
            '넘는 파일은 앞부분만 조용히 넣지 않고 나눠 달라고 말합니다. ' +
            '파일 한도(20MB)와 요청 한도(8MB)가 다른 것은 파일에서 고른 열만 보내기 때문입니다.',
        },
      ],
      features: [
        { title: '입력 형식', body: 'CSV·TSV·엑셀. 구분자와 인코딩(UTF-8·CP949·UTF-16LE)은 자동 판정이 기본이고 손으로 고를 수도 있습니다.' },
        { title: '미리보기', body: '앞 100행을 보여 주고 파일의 열을 테이블 컬럼에 짝지어 줍니다. 빈칸을 NULL 로 볼지 빈 문자열로 볼지 여기서 정합니다.' },
        { title: '결과 그리드 붙여넣기', body: '표에 그대로 붙여 넣은 값도 같은 적재 경로를 탑니다 — 넣는 길이 둘로 갈리지 않습니다.' },
      ],
      files: [
        { path: 'docs/DB-붙여넣기-데이터적재-설계.md', label: 'DB-붙여넣기-데이터적재-설계.md', description: '설계 문서' },
        { path: 'tests/db-import.test.js', label: 'db-import.test.js', description: '열 짝짓기·한도·미리보기 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '고를 수 있는 선택지마다 대가를 함께 적었습니다. "같은 키인 행은 건너뛰기" 옆에 ' +
            '"자료형이 틀린 행까지 조용히 빠집니다 — 건너뛴 까닭은 알 수 없습니다" 가 붙어 있습니다. ' +
            '기능을 감추는 대신 결과를 미리 말해 주는 쪽을 골랐고, 아예 뺀 것(REPLACE)과 경고를 붙인 것(ignore)을 기준을 두고 갈랐습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '되돌릴 수 없는 쓰기가 하나 더 늘었습니다. 덮어쓰기 모드는 기존 행의 값을 파일의 값으로 바꾸고, ' +
            '셀 편집과 달리 미리보기에서 문장 하나씩 빼는 단계가 없습니다. ' +
            '적재 자체는 워커가 한 트랜잭션으로 묶어 하나라도 실패하면 전부 되돌리지만, 성공한 덮어쓰기를 되돌리는 길은 수동 커밋 모드의 롤백뿐입니다.',
        },
      ],
    }),
  ];
};
