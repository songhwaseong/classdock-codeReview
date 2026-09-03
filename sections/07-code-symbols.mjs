// 코드 기호·기본 기능 사전 — 1차 코드 낱말 사전 다음 단계.
// 현재 리뷰 코드에서 실제로 쓰는 연산자·문법 기호와 표준 내장 기능만 싣는다.

const entry = (key, name, languages, kind, label, body, type = 'identifier') => ({
  key,
  name,
  languages,
  kind,
  label,
  body,
  type,
});
const operator = (key, name, languages, label, body) =>
  entry(key, name, languages, '연산자·기호', label, body, 'operator');
const builtin = (name, languages, kind, label, body) => entry(name, name, languages, kind, label, body);

const ENTRIES = [
  // 연산자·문법 기호 — 개수는 적지 않는다. 항목을 더할 때마다 주석만 낡는다.
  operator('assign', '=', ['js', 'cs', 'py'], '값 대입', '오른쪽에서 계산한 값을 왼쪽 변수나 속성에 넣습니다. 같음을 비교하는 기호가 아니라 저장하는 기호입니다.'),
  operator('strict-equal', '===', ['js'], '엄격한 같음', 'JavaScript에서 값과 자료형이 모두 같은지 비교합니다. 자동 형 변환을 하지 않습니다.'),
  operator('strict-not-equal', '!==', ['js'], '엄격한 다름', 'JavaScript에서 값이나 자료형 중 하나라도 다른지 비교합니다. 자동 형 변환을 하지 않습니다.'),
  operator('equal', '==', ['js', 'cs', 'py'], '같음 비교', '두 값이 같은지 비교합니다. JavaScript의 ==는 자료형을 자동 변환할 수 있어 보통 ===를 우선합니다.'),
  operator('not-equal', '!=', ['js', 'cs', 'py'], '다름 비교', '두 값이 서로 다른지 비교합니다.'),
  operator('arrow', '=>', ['js'], '화살표 함수', 'JavaScript에서 짧은 함수를 만들거나 함수의 매개변수와 본문을 연결합니다. 바깥 this를 그대로 쓰는 특징이 있습니다.'),
  operator('optional-chain', '?.', ['js'], '선택적 연결', '앞의 값이 null이나 undefined면 오류를 내지 않고 undefined로 멈추며, 값이 있을 때만 뒤 속성이나 함수를 읽습니다.'),
  operator('nullish', '??', ['js', 'cs'], '빈 값 대체', '왼쪽 값이 null 계열일 때만 오른쪽 기본값을 사용합니다. JavaScript에서는 undefined도 빈 값으로 봅니다.'),
  operator('spread-rest', '...', ['js'], '펼치기·나머지', '배열·객체의 값을 펼치거나, 함수 매개변수에서 남은 값들을 하나로 모읍니다.'),
  operator('increment', '++', ['js', 'cs'], '1 증가', '변수의 숫자 값을 1만큼 늘립니다. 값이 사용되는 시점이 앞·뒤 위치에 따라 달라질 수 있어 단독 문장으로 쓰는 편이 읽기 쉽습니다.'),
  operator('decrement', '--', ['js'], '1 감소', 'JavaScript에서 변수의 숫자 값을 1만큼 줄입니다. 값이 사용되는 시점이 앞·뒤 위치에 따라 달라질 수 있습니다.'),
  operator('floor-divide', '//', ['py'], '몫 나누기', 'Python에서 나눈 결과를 아래쪽 정수로 내림한 몫을 구합니다.'),
  operator('logical-and', '&&', ['js', 'cs'], '논리 그리고', '양쪽 조건이 모두 참인지 검사합니다. JavaScript에서는 왼쪽이 거짓이면 오른쪽 계산을 건너뜁니다.'),
  operator('logical-or', '||', ['js', 'cs'], '논리 또는', '양쪽 조건 중 하나라도 참인지 검사합니다. JavaScript에서는 왼쪽이 참이면 오른쪽 계산을 건너뜁니다.'),
  operator('logical-not', '!', ['js', 'cs'], '논리 반전', '참을 거짓으로, 거짓을 참으로 뒤집습니다.'),
  operator('plus', '+', ['js', 'cs', 'py'], '더하기·문자열 연결', '숫자를 더합니다. 언어와 값의 종류에 따라 문자열을 이어 붙이는 데도 쓰입니다.'),
  operator('minus', '-', ['js', 'cs', 'py'], '빼기·음수', '숫자를 빼거나 값 앞에 붙여 부호를 반대로 만듭니다.'),
  operator('multiply', '*', ['js', 'cs', 'py'], '곱하기', '숫자를 곱합니다. Python에서는 문자열·목록 반복이나 값을 펼치는 문법에도 쓰입니다.'),
  operator('divide', '/', ['js', 'py'], '나누기', '숫자를 나눕니다. Python에서 소수점 아래를 버린 몫이 필요할 때는 //를 씁니다.'),
  operator('remainder', '%', ['js', 'py'], '나머지', '나눗셈 뒤 남는 나머지를 구합니다. 반복 주기나 짝수·홀수 판정에 자주 씁니다.'),
  operator('less-than', '<', ['js', 'cs', 'py'], '작음 비교', '왼쪽 값이 오른쪽 값보다 작은지 비교합니다.'),
  operator('greater-than', '>', ['js', 'cs', 'py'], '큼 비교', '왼쪽 값이 오른쪽 값보다 큰지 비교합니다.'),
  operator('less-equal', '<=', ['js', 'cs', 'py'], '작거나 같음', '왼쪽 값이 오른쪽 값보다 작거나 같은지 비교합니다.'),
  operator('greater-equal', '>=', ['js', 'cs', 'py'], '크거나 같음', '왼쪽 값이 오른쪽 값보다 크거나 같은지 비교합니다.'),
  operator('add-assign', '+=', ['js', 'cs', 'py'], '더한 뒤 대입', '기존 값에 오른쪽 값을 더한 결과를 다시 같은 변수에 저장합니다.'),

  // JavaScript 기본 기능
  builtin('document', ['js'], 'JavaScript 기본 기능', '현재 웹 문서', '현재 페이지의 DOM 문서를 나타냅니다. 요소를 찾고 만들고 수정하는 출발점입니다.'),
  builtin('Math', ['js'], 'JavaScript 기본 기능', '수학 함수 모음', '반올림·절댓값·최솟값·최댓값·난수 같은 수학 계산 함수를 모아 둔 내장 객체입니다.'),
  builtin('String', ['js'], 'JavaScript 기본 기능', '문자열 변환·도구', '값을 문자열로 바꾸거나 문자열 관련 정적 기능을 제공하는 내장 함수입니다.'),
  builtin('addEventListener', ['js'], 'JavaScript 기본 기능', '이벤트 연결', '요소나 브라우저 객체에서 클릭·입력·키보드 같은 이벤트가 발생할 때 실행할 함수를 등록합니다.'),
  builtin('window', ['js'], 'JavaScript 기본 기능', '브라우저 창 전역', '브라우저 탭의 최상위 객체입니다. 화면 크기·주소·타이머와 여러 전역 기능이 여기에 속합니다.'),
  builtin('Number', ['js'], 'JavaScript 기본 기능', '숫자 변환·도구', '값을 숫자로 바꾸거나 유한수·정수 여부 같은 숫자 관련 검사를 제공합니다.'),
  builtin('Array', ['js'], 'JavaScript 기본 기능', '배열 생성·도구', '순서 있는 값 목록을 나타내는 내장 형식이며 배열 생성과 판별 기능을 제공합니다.'),
  builtin('Error', ['js'], 'JavaScript 기본 기능', '오류 객체', '문제의 설명과 실행 위치를 담아 throw할 수 있는 기본 오류 객체입니다.'),
  builtin('Set', ['js'], 'JavaScript 기본 기능', '중복 없는 값 모음', '같은 값을 한 번만 보관하는 내장 컬렉션입니다.'),
  builtin('JSON', ['js'], 'JavaScript 기본 기능', 'JSON 변환', 'JavaScript 값과 JSON 문자열을 서로 바꾸는 parse와 stringify를 제공합니다.'),
  builtin('console', ['js'], 'JavaScript 기본 기능', '개발자 콘솔 출력', '개발자 도구에 로그·경고·오류를 남겨 동작을 확인할 때 씁니다.'),
  builtin('querySelector', ['js'], 'JavaScript 기본 기능', '첫 요소 찾기', 'CSS 선택자와 일치하는 첫 번째 DOM 요소를 찾습니다.'),
  builtin('TextEncoder', ['js'], 'JavaScript 기본 기능', '문자열 → 바이트', '문자열을 UTF-8 바이트 배열로 바꿉니다. 글자 수와 바이트 수가 다른 한글·이모지를 정확한 길이로 보낼 때 씁니다.'),
  builtin('TextDecoder', ['js'], 'JavaScript 기본 기능', '바이트 → 문자열', 'UTF-8 바이트 배열을 문자열로 되돌립니다. 여러 번 나눠 들어온 바이트를 이어 붙여 해석할 수도 있습니다.'),
  builtin('DataView', ['js'], 'JavaScript 기본 기능', '바이트를 숫자로 읽고 쓰기', '바이트 배열의 특정 위치에 정수·실수를 넣거나 꺼냅니다. 바이트 순서(리틀·빅 엔디언)를 직접 고를 수 있어 통신 규약을 다룰 때 씁니다.'),
  builtin('AbortController', ['js'], 'JavaScript 기본 기능', '요청 중단 신호', '진행 중인 fetch 같은 작업을 바깥에서 취소하게 해 주는 신호 객체입니다. 응답이 오지 않는 요청에 시간 제한을 걸 때 씁니다.'),
  builtin('atob', ['js'], 'JavaScript 기본 기능', 'Base64 → 글자', 'Base64로 적힌 문자열을 원래 바이트 값의 문자열로 되돌립니다.'),
  builtin('btoa', ['js'], 'JavaScript 기본 기능', '글자 → Base64', '바이트 값의 문자열을 Base64 표기로 바꿉니다.'),
  builtin('ResizeObserver', ['js'], 'JavaScript 기본 기능', '요소 크기 변화 감시', '창 크기뿐 아니라 특정 요소의 크기가 바뀔 때마다 알려 줍니다. 패널을 끌어 넓힐 때 안쪽 화면을 다시 계산하는 데 씁니다.'),
  builtin('localStorage', ['js'], 'JavaScript 기본 기능', '브라우저 문자열 저장소', '출처별로 문자열 데이터를 저장하며 창을 닫아도 남습니다.'),
  builtin('Object', ['js'], 'JavaScript 기본 기능', '객체 기본 기능', '일반 객체를 만들고 키·값·속성 정보를 다루는 여러 정적 기능을 제공합니다.'),
  builtin('setTimeout', ['js'], 'JavaScript 기본 기능', '지연 실행 예약', '정해진 시간이 지난 뒤 함수를 한 번 실행하도록 예약합니다.'),
  builtin('Map', ['js'], 'JavaScript 기본 기능', '키와 값 모음', '문자열뿐 아니라 다양한 값을 키로 사용할 수 있는 순서 있는 키·값 컬렉션입니다.'),
  builtin('clearTimeout', ['js'], 'JavaScript 기본 기능', '지연 실행 취소', 'setTimeout으로 예약한 실행을 취소합니다.'),
  builtin('Date', ['js'], 'JavaScript 기본 기능', '날짜와 시간', '특정 시점의 날짜·시간을 만들고 읽고 계산하는 내장 객체입니다.'),
  builtin('Promise', ['js'], 'JavaScript 기본 기능', '미래의 비동기 결과', '나중에 성공값이나 실패 이유가 정해질 비동기 작업을 나타냅니다.'),
  builtin('Uint8Array', ['js'], 'JavaScript 기본 기능', '바이트 배열', '0부터 255까지의 정수로 원시 파일 바이트를 다루는 형식화 배열입니다.'),
  builtin('removeEventListener', ['js'], 'JavaScript 기본 기능', '이벤트 연결 해제', '앞서 addEventListener로 등록한 같은 이벤트 처리 함수를 제거합니다.'),
  builtin('querySelectorAll', ['js'], 'JavaScript 기본 기능', '모든 요소 찾기', 'CSS 선택자와 일치하는 모든 DOM 요소를 목록으로 찾습니다.'),
  builtin('Boolean', ['js'], 'JavaScript 기본 기능', '논리값 변환', '값을 true 또는 false로 변환하거나 논리값 관련 기능을 제공합니다.'),
  builtin('fetch', ['js'], 'JavaScript 기본 기능', '네트워크 요청', 'HTTP 요청을 보내고 응답을 Promise로 받는 브라우저 표준 함수입니다.'),
  builtin('URL', ['js'], 'JavaScript 기본 기능', '주소 해석·조립', '웹 주소를 구성 요소로 안전하게 나누고 수정하고 다시 문자열로 만드는 객체입니다.'),
  builtin('requestAnimationFrame', ['js'], 'JavaScript 기본 기능', '다음 화면 그리기 예약', '브라우저가 다음 화면을 그리기 직전에 실행할 함수를 예약합니다.'),
  builtin('Blob', ['js'], 'JavaScript 기본 기능', '바이너리 데이터 덩어리', '파일처럼 다룰 수 있는 메모리 안의 바이트 데이터와 형식 정보를 묶습니다.'),
  builtin('getElementById', ['js'], 'JavaScript 기본 기능', 'ID로 요소 찾기', '문서에서 지정한 id를 가진 DOM 요소 하나를 찾습니다.'),

  // C# 기본 기능
  builtin('Encoding', ['cs'], 'C# 기본 기능', '문자 인코딩 변환', '문자열과 UTF-8 같은 바이트 인코딩을 서로 변환하는 .NET 형식입니다.'),
  builtin('Environment', ['cs'], 'C# 기본 기능', '실행 환경 정보', '운영체제·환경 변수·현재 폴더·프로세스 종료 등 실행 환경 기능을 제공합니다.'),
  builtin('Path', ['cs'], 'C# 기본 기능', '파일 경로 조립', '경로 문자열을 결합하고 파일명·확장자·폴더를 안전하게 나누는 .NET 기능입니다.'),
  builtin('Dictionary', ['cs'], 'C# 기본 기능', '키와 값 컬렉션', '키로 값을 빠르게 찾는 제네릭 컬렉션입니다.'),
  builtin('Process', ['cs'], 'C# 기본 기능', '프로세스 실행·관리', '다른 프로그램을 실행하거나 실행 중인 프로세스의 상태와 출력을 관리합니다.'),
  builtin('DateTime', ['cs'], 'C# 기본 기능', '날짜와 시간', '날짜와 시간을 나타내고 비교·계산·문자열 변환하는 .NET 값 형식입니다.'),
  builtin('StringBuilder', ['cs'], 'C# 기본 기능', '효율적인 문자열 조립', '문자열을 여러 번 이어 붙일 때 중간 문자열 생성을 줄이는 가변 버퍼입니다.'),
  builtin('File', ['cs'], 'C# 기본 기능', '파일 작업', '파일 읽기·쓰기·복사·삭제·존재 확인 같은 정적 기능을 제공합니다.'),
  builtin('Directory', ['cs'], 'C# 기본 기능', '폴더 작업', '폴더 생성·삭제·목록 조회·존재 확인 같은 정적 기능을 제공합니다.'),
  builtin('Thread', ['cs'], 'C# 기본 기능', '실행 스레드', '독립적인 실행 흐름을 만들거나 현재 스레드를 기다리게 하는 .NET 형식입니다.'),
  builtin('List', ['cs'], 'C# 기본 기능', '가변 순서 목록', '값을 순서대로 담고 추가·삭제할 수 있는 제네릭 컬렉션입니다.'),
  builtin('Convert', ['cs'], 'C# 기본 기능', '형식 변환 모음', '문자열·숫자·바이트 배열·Base64 사이를 바꾸는 정적 기능을 모아 둔 형식입니다. 이 프로젝트에서는 바이트를 Base64 글자로 만들어 JSON 응답에 실을 때 가장 많이 나옵니다.'),
  builtin('Guid', ['cs'], 'C# 기본 기능', '겹치지 않는 식별자', '사실상 겹치지 않는 128비트 값을 만듭니다. 세션 번호나 일회용 이름처럼 남이 맞히면 안 되는 이름을 만들 때 씁니다.'),
  builtin('IntPtr', ['cs'], 'C# 기본 기능', '네이티브 핸들·주소', '운영체제가 돌려준 핸들이나 메모리 주소를 담는 값입니다. .NET 바깥(Windows API)과 주고받는 값이라 내용이 아니라 "가리키는 것"만 들고 있습니다.'),
  builtin('Marshal', ['cs'], 'C# 기본 기능', '관리·비관리 메모리 다리', '.NET 객체와 네이티브 메모리 사이에서 값을 옮기거나 메모리를 잡고 놓아 줍니다. Windows API 를 부를 때 짝으로 나옵니다.'),
  builtin('DllImport', ['cs'], 'C# 기본 기능', 'Windows API 직접 호출', 'kernel32.dll 같은 네이티브 라이브러리의 함수를 C# 에서 바로 부르겠다고 선언하는 표식입니다(P/Invoke). .NET 이 감싸 주지 않는 기능 — 이 프로젝트에서는 가짜 터미널(ConPTY) — 을 쓸 때만 나옵니다.'),

  // Python 기본 기능
  builtin('os', ['py'], 'Python 기본 기능', '운영체제 기능 모듈', '파일 경로·환경 변수·프로세스 등 운영체제와 상호작용하는 표준 모듈입니다.'),
  builtin('len', ['py'], 'Python 기본 기능', '길이 구하기', '문자열·목록·사전 같은 값에 들어 있는 항목 수를 돌려줍니다.'),
  builtin('int', ['py'], 'Python 기본 기능', '정수 변환·형식', '값을 정수로 바꾸거나 정수 값을 만드는 기본 형식입니다.'),
  builtin('print', ['py'], 'Python 기본 기능', '출력', '값을 사람이 읽을 수 있는 문자열로 표준 출력에 표시합니다.'),
  builtin('range', ['py'], 'Python 기본 기능', '정수 범위', '반복문에서 사용할 연속된 정수 범위를 만듭니다.'),
  builtin('json', ['py'], 'Python 기본 기능', 'JSON 모듈', 'Python 값과 JSON 문자열·파일을 서로 변환하는 표준 모듈입니다.'),
  builtin('sys', ['py'], 'Python 기본 기능', 'Python 실행 환경 모듈', '명령행 인자·표준 입출력·모듈 경로 등 Python 실행기와 관련된 정보를 제공합니다.'),
  builtin('str', ['py'], 'Python 기본 기능', '문자열 변환·형식', '값을 문자열로 바꾸거나 문자열 객체를 만드는 기본 형식입니다.'),
  builtin('subprocess', ['py'], 'Python 기본 기능', '외부 프로세스 실행', '다른 명령이나 프로그램을 실행하고 입출력·종료 상태를 관리하는 표준 모듈입니다.'),
  builtin('base64', ['py'], 'Python 기본 기능', 'Base64 변환 모듈', '바이트 데이터를 글자로 안전하게 표현하는 Base64 방식으로 인코딩·디코딩합니다.'),
  builtin('isinstance', ['py'], 'Python 기본 기능', '형식 확인', '값이 지정한 클래스나 그 하위 클래스의 객체인지 검사합니다.'),
  builtin('time', ['py'], 'Python 기본 기능', '시간 모듈', '현재 시각·경과 시간·잠시 기다리기 같은 기본 시간 기능을 제공합니다.'),
  builtin('enumerate', ['py'], 'Python 기본 기능', '번호와 값을 함께 반복', '반복 가능한 값에서 순번과 원소를 한 쌍씩 꺼내 줍니다.'),
  builtin('io', ['py'], 'Python 기본 기능', '메모리 입출력 모듈', '문자열·바이트를 파일처럼 읽고 쓰는 스트림 기능을 제공합니다.'),
  builtin('getattr', ['py'], 'Python 기본 기능', '이름으로 속성 읽기', '객체에서 문자열로 지정한 이름의 속성을 읽고, 없을 때 기본값을 사용할 수 있습니다.'),
  builtin('open', ['py'], 'Python 기본 기능', '파일 열기', '파일을 읽거나 쓰기 위한 객체를 열며 with와 함께 쓰면 자동으로 닫힙니다.'),

  // 2026-09-03 보완 — 같은 갈래인데 짝만 빠져 있던 것들.
  // len·range·isinstance 는 있는데 list·dict·sorted 가 없었고, setTimeout·clearTimeout 은
  // 있는데 setInterval·clearInterval 이 없었다. JSON 은 걸리는데 stringify 는 안 걸리던 것과 같은 결이다.
  builtin('list', ['py'], 'Python 기본 기능', '목록 변환·형식', '값을 차례가 있는 목록으로 만들거나, 반복 가능한 값을 한 번에 펼쳐 담습니다.'),
  builtin('dict', ['py'], 'Python 기본 기능', '사전 변환·형식', '키와 값을 짝지어 담는 자료형입니다. 이 앱의 워커가 응답을 만들 때 기본 단위가 되는 형식입니다.'),
  builtin('set', ['py'], 'Python 기본 기능', '중복 없는 모음', '같은 값을 한 번만 담는 모음입니다. "이미 처리했는가"를 빠르게 확인할 때 씁니다.'),
  builtin('tuple', ['py'], 'Python 기본 기능', '바뀌지 않는 묶음', '만든 뒤에는 원소를 바꿀 수 없는 값 묶음입니다. 고정된 목록(허용 모드·객체 종류)을 상수로 둘 때 씁니다.'),
  builtin('bytes', ['py'], 'Python 기본 기능', '바이트 열', '글자가 아니라 바이트 그대로를 담는 값입니다. 인코딩을 정하기 전의 원본 데이터가 이 형태입니다.'),
  builtin('float', ['py'], 'Python 기본 기능', '실수 변환·형식', '값을 소수점이 있는 수로 바꾸거나 실수 값을 만듭니다.'),
  builtin('sorted', ['py'], 'Python 기본 기능', '정렬한 새 목록', '원본을 그대로 두고 정렬된 새 목록을 돌려줍니다. key로 정렬 기준을 따로 줄 수 있습니다.'),
  builtin('max', ['py'], 'Python 기본 기능', '가장 큰 값', '여러 값이나 모음에서 가장 큰 것을 고릅니다. 상한을 씌울 때도 씁니다.'),
  builtin('min', ['py'], 'Python 기본 기능', '가장 작은 값', '여러 값이나 모음에서 가장 작은 것을 고릅니다. 하한을 씌우거나 상한과 짝지어 값을 범위 안으로 누를 때 씁니다.'),
  builtin('sum', ['py'], 'Python 기본 기능', '합계', '모음 안 숫자를 모두 더합니다. 셀 수·바이트 수처럼 예산을 셀 때 나옵니다.'),
  builtin('abs', ['py'], 'Python 기본 기능', '절댓값', '음수 부호를 떼고 크기만 남깁니다.'),
  builtin('round', ['py'], 'Python 기본 기능', '반올림', '소수를 지정한 자리에서 반올림합니다.'),
  builtin('any', ['py'], 'Python 기본 기능', '하나라도 참인가', '모음 중 하나라도 참이면 True입니다. 조건을 만족하는 것이 있는지 볼 때 씁니다.'),
  builtin('all', ['py'], 'Python 기본 기능', '모두 참인가', '모음이 전부 참일 때만 True입니다. 비어 있으면 True라는 점이 함정입니다.'),
  builtin('repr', ['py'], 'Python 기본 기능', '디버깅용 표현', '사람이 읽기 좋은 str과 달리 "코드에 가까운" 표현을 돌려줍니다. 따옴표·이스케이프가 그대로 보여 값의 실제 모양을 확인할 때 씁니다.'),

  builtin('crypto', ['js'], 'JavaScript 기본 기능', '난수·암호 기능', '브라우저가 제공하는 암호용 난수 생성기입니다. randomUUID로 겹치지 않는 이름을, getRandomValues로 예측할 수 없는 바이트를 만듭니다 — Math.random과 달리 남이 맞힐 수 없어야 하는 값에 씁니다.'),
  builtin('setInterval', ['js'], 'JavaScript 기본 기능', '되풀이 실행 예약', '정해진 간격마다 함수를 계속 실행하도록 예약합니다. setTimeout과 달리 취소하기 전까지 멈추지 않습니다.'),
  builtin('clearInterval', ['js'], 'JavaScript 기본 기능', '되풀이 실행 취소', 'setInterval로 걸어 둔 되풀이를 멈춥니다. 화면을 닫을 때 이것을 부르지 않으면 보이지 않는 타이머가 계속 돕니다.'),
  builtin('MutationObserver', ['js'], 'JavaScript 기본 기능', 'DOM 변화 감시', '화면 요소가 추가·삭제되거나 속성이 바뀌는 것을 지켜보다 알려 줍니다. 남이 바꾼 DOM에 반응해야 할 때 씁니다.'),
  builtin('WeakMap', ['js'], 'JavaScript 기본 기능', '약한 참조 키 모음', '키로 쓴 객체가 다른 곳에서 모두 사라지면 그 항목도 함께 정리되는 Map입니다. 요소마다 딸린 정보를 붙여 두면서 누수를 만들지 않으려고 씁니다.'),
  builtin('structuredClone', ['js'], 'JavaScript 기본 기능', '깊은 복사', '중첩된 객체를 통째로 복사합니다. JSON을 거치는 방식과 달리 Map·Set·날짜·순환 참조도 그대로 옮깁니다.'),
];

const LANGUAGE_LABEL = { js: 'JavaScript', cs: 'C#', py: 'Python' };
const KINDS = ['연산자·기호', 'JavaScript 기본 기능', 'C# 기본 기능', 'Python 기본 기능'];
const firstSentence = (text) => (/^.*?\.(?=\s|$)/.exec(text) ?? [text])[0];

export const CODE_REFERENCES = ENTRIES.map((item) => ({
  ...item,
  id: `cr-${item.key}`,
  languageLabel: item.languages.map((language) => LANGUAGE_LABEL[language]).join(' · '),
  short: firstSentence(item.body),
}));

export default ({ helpers }) => {
  const { sec } = helpers;
  const byKind = (kind) => CODE_REFERENCES.filter((item) => item.kind === kind);

  return [
    sec({
      id: 'code-symbols',
      category: '개요',
      group: '코드 기호·기본 기능 사전',
      title: '코드 기호·기본 기능 사전',
      subtitle: `연산자·기호 25개와 기본 기능 55개`,
      summary:
        `1차 코드 낱말 사전 다음으로 코드 읽기를 막는 연산자·기호 25개와 표준 기본 기능 55개, 모두 ${CODE_REFERENCES.length}개를 모았습니다. ` +
        '프로젝트가 직접 만든 함수와 외부 라이브러리 API는 제외했습니다. 코드에서 기본 기능은 점선 밑줄로 표시되고, 연산자는 원래 모양을 유지하다가 마우스를 올렸을 때 반응합니다.',
      usage: KINDS.map((kind) => ({
        title: `${kind} (${byKind(kind).length}개)`,
        body: byKind(kind).map((item) => item.name).join(', '),
      })),
      features: CODE_REFERENCES.map((item) => ({
        id: item.id,
        title: `\`${item.name}\` — ${item.label}`,
        body: `${item.languageLabel} · ${item.body}`,
      })),
      files: [],
      notes: [
        {
          type: 'info',
          label: '표시',
          body: '기본 기능은 점선 밑줄로 표시합니다. 매우 자주 나오는 =·+ 같은 연산자는 코드를 어지럽히지 않도록 밑줄 없이 마우스를 올렸을 때만 반응합니다.',
        },
        {
          type: 'info',
          label: '범위',
          body: '여기 실린 이름은 언어와 브라우저·.NET·Python이 기본으로 제공하는 기능입니다. 프로젝트 전용 이름과 외부 패키지는 다루지 않습니다.',
        },
      ],
    }),
  ];
};
