// 5. java — 자바 편집·로컬 JDK 실행·jar 라이브러리·예제 목록.
// 6. snippet-gallery — 파이썬·자바 예제 갤러리(언어 탭). 계층이 따로지만 자바 예제가 들어오며 생긴
//    공용 렌더러라 같은 파일에서 이어 읽는다. category 는 mod() 가 manifest 계층에서 정한다.
//
// 자바는 JavaScript 계층과 달리 브라우저 안에서 돌지 않는다. 실행·검사·라이브러리 설치가 모두
// EXE 런처(launcher.cs)에 있으므로, 서버 쪽은 60-desktop.mjs 의 launcher-java 섹션과 함께 읽는다.

import { functionShare, linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'java');
  // 줄 수와 "한 함수가 파일의 몇 %인가" 는 문장에 적지 않고 생성 때 잰다(lib/source-metrics.mjs).
  const runnableShare = functionShare(rootDir, 'src/js/java-editor.js', 'renderJavaRunnable');
  const snippetLines = linesLabel(rootDir, 'src/js/java-snippets.js');

  return [
    sec({
      id: 'java-overview',
      category: '5. java',
      group: '계층 개요',
      title: 'java 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 편집은 브라우저, 컴파일·실행은 EXE 의 로컬 JDK`,
      summary:
        '.java 파일을 앱 안에서 고치고 ▶ 로 실행합니다. 파이썬(Pyodide)이나 JavaScript(Worker)와 달리 브라우저 안에 자바 실행기가 없으므로 ' +
        '컴파일과 실행은 전부 EXE 런처가 찾은(또는 내려받은) JDK 로 합니다. java-runtime.js 가 런처와의 세션 호출·javac 진단 해석·자동완성 규칙을, ' +
        'java-libraries.js 가 실행에 얹을 jar 선택을, java-editor.js 가 그것들을 기존 Python 편집기 뼈대에 붙이고, java-snippets.js 는 예제 데이터만 둡니다.',
      usage: [
        {
          title: 'Python 계층의 부품을 빌려 쓴다',
          body:
            'manifest 는 java-runtime.js 앞에 python-run-context.js·python-runtime.js 를, java-editor.js 앞에 code-viewer.js·python-editor.js 를 둡니다. ' +
            '실행 봉투(buildRunPayload), 채점 테스트 모양(normalizeAssignmentTests), 편집기·초안·분할선·진단 목록 CSS(py-diagnostic-*)를 그대로 쓰기 때문입니다. ' +
            'JavaScript 계층이 그랬듯 새 언어를 넣으면서 문서 생명주기를 다시 만들지 않았습니다.',
        },
        {
          title: '브라우저·오프라인 HTML 에서는 실행이 없다',
          body:
            '자바 탭이나 ▶ 를 숨기지 않고, 누르면 JDK 안내 화면으로 넘깁니다. 안내에는 원클릭 설치(/java-install)와 "다시 검사"(/java-rescan)가 함께 있어, ' +
            '학생이 누른 실행 흐름이 설치가 끝난 자리에서 그대로 이어집니다.',
        },
        {
          title: '형제 .java 를 함께 보낸다',
          body:
            '자바 수업은 Dog.java·Main.java 처럼 클래스마다 파일을 나눕니다. java-editor.js 가 같은 폴더·같은 압축 문맥에 열린 .java 본문을 모아 ' +
            '실행·채점·저장 검사에 똑같이 붙이고, 런처는 그것을 임시 폴더에 풀어 javac -sourcepath 로 "참조된 것만" 컴파일합니다. ' +
            '검사와 실행이 같은 묶음을 봐야 "검사는 통과했는데 실행은 안 되는" 짝이 생기지 않는다는 주석이 양쪽에 있습니다.',
        },
      ],
      features: [
        { title: '대화형 실행', body: 'Scanner 입력을 별도 칸 대신 터미널처럼 한 줄씩 주고받습니다. 표준입력을 읽는 코드면 실행 직후 포커스를 입력 칸으로 옮깁니다.' },
        { title: '저장 검사', body: '저장하면 javac 만 돌려 오류·경고 목록과 편집기 줄 표시를 갱신합니다. 자동 저장 때는 설정을 켠 경우에만 조용히 검사합니다.' },
        { title: '채점·JUnit', body: '파이썬과 같은 채점 테스트 창을 쓰되 입력을 파이프로 한 번에 넣고, JUnit 5 를 고르면 테스트 결과를 따로 요약합니다.' },
        { title: '자동완성·정의 이동', body: '표준 클래스·멤버·import 자동 삽입, Ctrl+클릭으로 현재 파일 정의나 JDK src.zip 의 원문 열기.' },
      ],
      files: [
        { path: 'tests/java-runtime.test.js', label: 'java-runtime.test.js', description: '진단 해석·자동완성·정의 이동·세션 호출·채점' },
        { path: 'tests/e2e/java-completion.spec.js', label: 'java-completion.spec.js', description: '편집기 자동완성과 import 자동 삽입' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"검사와 실행이 같은 파일 묶음을 본다" 를 프런트(javaSiblingSources 를 두 길에 똑같이 넘김)와 런처(RunJavaCheck 와 StartJavaSession 이 같은 CompileJavaSource) ' +
            '양쪽에서 지킵니다. 한쪽만 형제를 알면 학생 화면에서 두 버튼의 답이 갈리는데, 그 조합을 구조로 막았습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '형제 파일의 이름·경로를 프런트가 보내지 않습니다. 런처가 소스의 package 와 public 클래스에서 자리를 정하고 식별자 정규식을 통과한 것만 씁니다 — ' +
            '프런트가 준 경로를 믿으면 임시 폴더 밖에 파일을 쓰는 길이 열린다는 이유가 주석에 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'Python 계층의 내부 함수를 여럿 빌려 쓰지만 moduleBoundaries 에 등록된 경계는 없습니다. python-runtime.js 의 buildRunPayload 봉투 모양이나 ' +
            'python-editor.js 의 공용 편집기 인자가 바뀌면 check-source.js 는 로드 순서만 보고, 자바 쪽이 깨지는 것은 java-runtime.test.js 가 잡아야 합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '런처는 JDK 21 을 내려받지만 PATH·JAVA_HOME 의 JDK 11 이상도 받아들입니다. 그래서 예제는 Java 11 문법만 쓰기로 정했고(설계 문서), ' +
            'java-snippets.test.js 가 record·switch 식·텍스트 블록을 금지 문법으로 검사합니다. 학생이 직접 쓴 코드에는 이 제한이 없으므로 PC 마다 컴파일 결과가 달라질 수 있습니다.',
        },
      ],
    }),

    mod('java-snippets.js', {
      title: 'java-snippets.js — 자바 예제 목록',
      subtitle: '데이터만 — 그리는 쪽은 snippet-gallery.js',
      summary:
        `자바 예제 갤러리의 예제를 담은 ${snippetLines}짜리 데이터 파일입니다. 예제마다 갈래·제목·파일 이름·난이도·설명·개념 태그·코드를 한 객체에 두고, ` +
        '같은 문제를 파이썬으로도 풀어 둔 예제에는 pair 로 파이썬 쪽 id 를 적습니다. 렌더링 코드는 없습니다.',
      usage: [
        {
          title: '파일 이름 = public 클래스 이름',
          body:
            '파이썬 예제는 한글 파일 이름(구구단.py)을 쓰지만 자바는 그럴 수 없습니다. 제목만 한글이고 파일 이름은 영문 대문자로 시작하는 PascalCase 이며, ' +
            'java-editor.js 의 파일 이름 검사와 같은 규칙입니다.',
        },
        {
          title: 'JDK 클래스와 이름을 겹치지 않는다',
          body:
            'DayOfWeek.java 처럼 java.time 의 클래스와 같은 이름을 쓰면 그 클래스를 import 하는 순간 자기 자신과 부딪혀 컴파일이 막힙니다. ' +
            '그래서 WeekdayFinder 로 지었고, 보조 클래스도 예제끼리 이름이 겹치지 않게 static 중첩 클래스로 둡니다.',
        },
        {
          title: '병렬 배열을 쓰지 않는다',
          body:
            'python-snippets.js 는 난이도·설명을 PY_SNIPPET_META 병렬 배열에 따로 두지만, 자바 목록은 각 예제 안에 바로 적습니다. ' +
            '순서가 한 칸 밀리면 설명이 옆 예제에 붙는 종류의 사고를 처음부터 없앤 선택입니다.',
        },
      ],
      files: [
        { path: 'tests/java-snippets.test.js', label: 'java-snippets.test.js', description: '이름·클래스 일치, JDK 이름 충돌, Java 11 문법, 파이썬 짝 맞물림' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '규칙을 주석으로만 적지 않고 전부 테스트로 옮겼습니다 — 파일 이름과 public 클래스 일치, 예제 사이 최상위 클래스 이름 충돌, JDK 클래스 이름 금지, ' +
            'Java 11 을 넘는 문법, 파이썬 id 와 자바 pair 의 양방향 맞물림. 짝은 한쪽만 고치면 링크가 조용히 사라지는 종류라 이 검사가 특히 값집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '예제 데이터가 지연 로드가 아니라 시작 스크립트로 실립니다. python-snippets.js 와 합치면 갤러리를 열지 않는 사용자도 매번 파싱하는 양이 적지 않은데, ' +
            '같은 시기에 한글 글꼴(korean-font.js)은 같은 이유로 MNLazy 묶음으로 옮겨졌습니다.',
        },
      ],
    }),

    mod('java-libraries.js', {
      title: 'java-libraries.js — 실행에 얹는 jar 선택',
      subtitle: '카탈로그 id 또는 Maven 좌표만 보낸다',
      summary:
        '자바 실습에 함께 쓸 라이브러리(jar)의 선택 상태를 문서별로 기억하고, 런처의 /java-lib-* API 를 부르는 얇은 층입니다. ' +
        '고를 수 있는 목록·설치된 목록·Maven Central 검색·최신 버전 확인·javap 멤버 표·설치 스트림·삭제를 감싸고, ' +
        '고른 라이브러리의 클래스 이름을 자동완성과 import 후보로 넘깁니다.',
      usage: [
        {
          title: '보낼 수 있는 값을 먼저 좁힌다',
          body:
            'javaLibraryValidSpec 이 카탈로그 id(소문자·숫자·하이픈) 또는 group:artifact:version 좌표만 통과시키고, 어느 자리에서든 .. 를 막습니다. ' +
            '런처의 JavaLibraryIdRe·JavaLibrarySegmentRe 와 같은 모양이라 헛된 요청을 줄이는 것이고, 최종 판정은 서버가 다시 합니다.',
        },
        {
          title: '검색어는 이름 글자만',
          body:
            'Maven Central 검색어에 주소나 Solr 문법을 받지 않고 글자·숫자·공백·몇 개의 기호만 허용합니다. 외부 주소를 프런트가 직접 열지 않고 런처가 고정 주소만 조회합니다.',
        },
        {
          title: '기본 목록은 검색을 기다리지 않는다',
          body:
            'javaLibraryLocalSearch 가 검증된 기본 목록에서 먼저 찾아 보여 주고, Maven Central 결과가 늦게 오면 javaLibraryMergeSearchRows 가 같은 group:artifact 는 기본 행을 남깁니다. ' +
            '고정 검증값(SHA-256)이 붙은 행이 외부 검색 결과에 덮이지 않게 한 순서입니다.',
        },
      ],
      features: [
        { title: '문서별 선택', body: 'classdock-java-libraries: 접두사의 localStorage 키에 저장하고, 채점 테스트 저장 키와 자리를 나눕니다. 손상된 값은 {version, ids} 로 정규화합니다.' },
        { title: '설치 스트림', body: '시작 → 작업 번호 → 증분 폴링. 세 번 이어서 실패해야 받던 것을 접어 잠깐 끊긴 교실 인터넷을 견딥니다.' },
        { title: '멤버 표 캐시', body: '직접 좌표로 받은 jar 의 javap 멤버 표를 spec 별 Promise 로 캐시합니다. 기본 목록은 프런트에 손으로 적은 표를 씁니다.' },
      ],
      files: [
        { path: 'tests/java-libraries.test.js', label: 'java-libraries.test.js', description: '보낼 값 검증·검색 정규화·선택 저장·자동완성 후보' },
        { path: 'tests/java-libraries-desktop.test.js', label: 'java-libraries-desktop.test.js', description: '런처 카탈로그·경로 조립·클래스패스 계약' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"경로·URL 은 서버가 조립한다" 를 양쪽에서 지킵니다. 프런트가 보내는 것은 id·좌표 문자열뿐이고, 그것도 서버와 같은 정규식으로 한 번 거릅니다. ' +
            '좌표가 곧 캐시 폴더 이름이 되는 구조라 .. 차단이 경로 탈출 방어 그 자체입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '선택 상태(localStorage)와 설치 캐시(exe 옆 java-libs 또는 LocalAppData)의 수명이 다릅니다. 캐시를 지우거나 다른 PC 에서 문서를 열면 선택은 남고 실행 때에야 ' +
            '"라이브러리를 찾지 못했습니다" 가 뜹니다. js-libraries.js 의 npm 선택이 가진 것과 같은 성질입니다(런처가 조용히 빼지 않고 출력 칸에 알리는 점은 좋습니다).',
        },
      ],
    }),

    mod('java-runtime.js', {
      title: 'java-runtime.js — 세션 호출·javac 진단·자동완성 규칙',
      subtitle: '런처와 대화하는 쪽과 DOM 없는 해석기가 한 파일에',
      summary:
        '런처의 /java-session-* 로 컴파일·실행 세션을 열고 증분 폴링으로 출력을 받아 대화형 터미널·채점 보고서·JUnit 요약으로 바꿉니다. ' +
        '같은 파일에 javac 진단 파서(javacDiagnostics), 오류 줄 추정(javaErrorLine), 표준 클래스·멤버·import 자동완성 표, Ctrl+클릭 정의 찾기, ' +
        '코드 정렬(javaFormatSource)·import 정리(javaOrganizeImports), JDK 설치 안내 화면이 들어 있습니다.',
      usage: [
        {
          title: '임시 경로를 지운 뒤에 해석한다',
          body:
            '런처는 moidajava_session_<id> 임시 폴더에서 컴파일하므로 javac 메시지 앞에 그 전체 경로가 붙습니다. cleanJavaStderr 가 먼저 경로를 지워 ' +
            '"Foo.java:3: error:" 로 시작하게 만든 뒤에야 줄 번호·심각도·캐럿 위치를 읽습니다. 형제 파일에서 온 진단은 own=false 로 갈라, ' +
            '편집기 줄 표시는 지금 파일 것만 받습니다 — 남의 파일 5줄을 여기 5줄에 칠하면 없는 오류를 만들기 때문입니다.',
        },
        {
          title: '두 가지 실행 길',
          body:
            '대화형 실행은 표준입력을 열어 두고 /java-session-input 으로 한 줄씩 보냅니다. 채점은 ?piped=1 로 입력을 한 번에 흘리고 닫습니다. ' +
            '대화형 입력은 터미널처럼 보이려고 stdout 에 에코를 남기므로, 그 에코가 섞이면 채점의 출력 비교가 어긋나기 때문에 길을 나눴습니다.',
        },
        {
          title: '큰 출력은 꼬리만 그린다',
          body:
            '실행 중에는 마지막 16,000자만, 끝나면 앞 20,000자와 뒤 10,000자만 그립니다. 거대한 <pre> 를 폴마다 다시 배치하면 메인 스레드가 막혀 ' +
            '중지 버튼 클릭이 늦게 처리된다는 이유가 상수 옆에 있습니다.',
        },
        {
          title: 'import 자동 삽입은 파이썬 규칙 자리에 끼운다',
          body:
            'JAVA_IMPORT_PLANNER 가 core.js 의 completionApplicationPlan 이 받는 모양을 따릅니다. 이미 같은 import 가 있거나 java.util.* 처럼 한 칸 위 와일드카드가 덮으면 ' +
            '다시 적지 않고(java.util.stream.Stream 은 java.util.* 가 덮지 않는다는 구분까지), 넣는 자리는 package 선언 뒤·첫 코드 앞입니다.',
        },
      ],
      features: [
        { title: 'JDK 원클릭 설치 안내', body: '설치 → 800ms 폴링으로 내려받기·검증·풀기 진행을 한 줄로 보여 주고, 끝나면 누른 실행을 이어 줍니다.' },
        { title: '채점', body: '테스트마다 새 세션을 열어 30초 제한으로 끝까지 기다립니다. -Xlint 경고만 stderr 에 온 경우는 실패로 치지 않습니다.' },
        { title: 'JUnit 요약', body: 'console-standalone 출력에서 성공·실패·건너뜀 개수를 읽어 결과 머리말로 올립니다.' },
        { title: '정의 이동', body: '주석·문자열을 같은 길이의 공백으로 가린 뒤 현재 파일의 타입·메서드를 찾고, 없으면 import 로 완전 이름을 풀어 /java-definition 에 묻습니다.' },
      ],
      files: [
        { path: 'tests/java-runtime.test.js', label: 'java-runtime.test.js', description: '진단·스택 줄·자동완성·정의 이동·정렬·채점 판정' },
        { path: 'tests/java-local-detect.test.js', label: 'java-local-detect.test.js', description: 'JDK 탐색 순서와 가용성 캐시' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '저장 검사 응답이 늦게 오면 호출자가 넘긴 최신성 검사로 버립니다. 자동 저장 검사 도중 다시 입력했다면 그 응답은 예전 소스의 결과인데, ' +
            '그걸 그대로 칠하면 방금 고친 줄에 사라진 오류가 되살아납니다. javac 자체는 서버에서 정상 종료·정리되게 두고 화면 적용만 막았습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '실행 스택에서 오류 줄을 고를 때 JDK 안쪽 프레임을 건너뛰고 학생 파일의 프레임을 씁니다. NumberFormatException 이 Integer.parseInt 안에서 났다고 ' +
            'java.lang 소스 줄을 가리키면 학생은 고칠 곳을 찾을 수 없습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '역할이 넷입니다 — 런처 세션 클라이언트, 출력 화면 조립, javac·스택 해석기, 자동완성·정의·정렬 규칙. 뒤의 둘은 DOM 이 없는 순수 함수라 따로 떼기 쉬운데 ' +
            '세션·화면 코드와 한 파일에 섞여 있어, 자동완성 규칙만 고치려 해도 JDK 설치 안내와 대화형 터미널을 함께 읽게 됩니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'JAVA_INSTALL_FEATURE_VERSION(21)은 안내 문구에만 쓰이고 실제로 받는 판은 런처의 JdkFeatureVersion 이 정합니다. 두 값을 함께 고쳐야 한다는 주석이 있지만 검사는 없습니다.',
        },
      ],
    }),

    mod('java-editor.js', {
      title: 'java-editor.js — .java 실행 화면',
      subtitle: 'Python 편집기 뼈대 + 실행 구성·라이브러리·JUnit',
      summary:
        '.java 문서에 실행 바·대화형 출력·실행 구성(-Xlint, main 이 여럿일 때 실행 대상)·라이브러리 선택·JUnit·코드 정렬·import 정리·자동 저장·저장 검사를 붙입니다. ' +
        '편집기·초안·저장·분할선은 파이썬 쪽 공용 함수를 그대로 쓰고, 실행은 runJavaSource, 검사는 checkJavaSource 로 보냅니다. ' +
        `화면 조립은 renderJavaRunnable 한 함수에 있습니다${runnableShare ? `(파일의 ${runnableShare}%)` : ''}.`,
      usage: [
        {
          title: '파일 이름과 클래스 이름을 함께 옮긴다',
          body:
            '자바는 파일 이름이 public 클래스 이름이어야 합니다. 사이드바에서 파일 이름을 바꾸면 javaRenamePublicTypeForFile 이 깊이 0 의 public 타입을 찾아 ' +
            '선언·생성자·new 식의 같은 이름까지 바꾸고, 주석과 문자열은 가려 두어 설명 문구·출력 문자열은 남깁니다.',
        },
        {
          title: '새 파일 이름은 Main·Main2',
          body:
            '파이썬처럼 "새 코드 2.java" 를 만들면 식별자로 쓸 수 없는 이름이 됩니다. 그래서 스크래치 이름을 Main·Main2 로 짓고 시작 코드의 클래스 이름도 맞춰 찍습니다 — ' +
            '다른 IDE 나 javac 로 그대로 열어도 깨지지 않게 하려는 것입니다.',
        },
        {
          title: '새 파일은 queueFiles 로 연다',
          body:
            'handleFiles 만 부르면 편집 초안은 남아도 그 초안을 붙일 바탕 문서가 작업공간 저장에 들어가지 않아, 저장하지 않은 새 .java 가 자동복원에서 사라집니다. ' +
            '예제 갤러리의 자바 쪽도 같은 이유로 queueFiles 를 씁니다.',
        },
        {
          title: '자동 저장 검사는 조용히',
          body:
            '수동 저장은 늘 javac 검사를 돌리고, 자동 저장은 설정(javaCheckOnAutoSave)을 켰을 때만 돌립니다. 자동 검사는 밑줄과 상태만 갱신하고 사용자가 접어 둔 결과 칸은 열지 않습니다.',
        },
      ],
      features: [
        { title: '실행 구성', body: '-Xlint 켜기와 main 보유 클래스 선택을 파일별 키(classdock-java-lint: · classdock-java-main:)에 기억하고, 함께 컴파일될 형제 파일 이름을 보여 줍니다.' },
        { title: '형제 파일 상한', body: '같은 폴더 .java 최대 60개·본문 합계 2MB. 런처 쪽 상한(개수 60·파일당 512KB)과 짝입니다.' },
        { title: 'JDK 환경 창', body: 'Python 의 Py Env 와 같은 작은 모달에서 JDK 확인·설치를 끝냅니다. 실행 결과 칸은 프로그램 출력만 맡습니다.' },
        { title: '출력 찾기', body: '긴 실행 결과 안에서 찾기·다음·이전을 붙입니다.' },
      ],
      files: [
        { path: 'tests/e2e/java-completion.spec.js', label: 'java-completion.spec.js', description: '편집기에서 표준 클래스·멤버·import 자동 삽입' },
        { path: 'tests/e2e/scratch-hint.spec.js', label: 'scratch-hint.spec.js', description: '새 코드 첫 줄 안내가 저장 파일에 남지 않는지' },
        { path: 'tests/e2e/run-output-chrome.spec.js', label: 'run-output-chrome.spec.js', description: '결과 칸 숨기기와 결과를 편집기 아래·옆으로 옮기기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '자동 저장이 겹치지 않게 busy·again 두 깃발로 직렬화하고, 실패 안내는 문서당 한 번만 띄웁니다. 3초마다 자동 저장이 도는 편집기에서 ' +
            '네트워크 드라이브가 느리면 토스트가 쌓이는데, 그 경우를 미리 막았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '파일 이름을 바꾸면 그 파일 안의 클래스 이름은 따라 바뀌지만 같은 폴더 형제 파일의 참조(new Dog())는 그대로입니다. ' +
            '형제 컴파일을 지원하는 만큼, 이름 바꾸기 직후 다른 파일에서 "cannot find symbol" 이 나는 흐름이 생깁니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'renderJavaRunnable 한 함수가 실행 바·메뉴·출력·자동 저장·저장 검사·정리를 지역 스코프에 모두 들고 있습니다. ' +
            'js-editor.js 의 renderJsRunnable 과 같은 모양이라 언어마다 비슷한 흐름을 각자 한 함수에 복제하고 있는 셈이며, 자동 저장 규칙 같은 공통 수정이 언어 수만큼 필요합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '편집기의 파일 이름 검사는 첫 글자를 영문 대문자로 제한합니다(JAVA_FILE_ID_START_RE). 자바 언어는 유니코드 식별자를 허용하고 런처도 그렇게 읽지만, ' +
            '수업 규칙에 맞춘 의도적인 좁힘입니다.',
        },
      ],
    }),

    mod('snippet-gallery.js', {
      title: 'snippet-gallery.js — 언어 탭이 있는 예제 갤러리',
      subtitle: '파이썬 갤러리를 공용으로 옮기고 자바를 얹었다',
      summary:
        '예제 갤러리 모달을 그립니다. 데이터는 python-snippets.js·java-snippets.js 에 있고 여기서는 언어 탭·난이도 칩·검색·갈래별 카드와, ' +
        '같은 문제를 다른 언어로 풀어 둔 예제로 건너가는 "파이썬/자바 버전 보기" 링크만 만듭니다. 원래 python-snippets.js 안에 있던 렌더러를 옮겨 온 것입니다.',
      usage: [
        {
          title: '언어를 더하는 자리가 한 줄이다',
          body:
            'SNIPPET_LANGS 에 {id, label, ext, list, open} 한 줄을 늘리면 탭이 생기고, 갈래·난이도·검색은 데이터에서 뽑습니다. ' +
            '예제가 하나도 없는 언어는 탭에서 빠지므로 자바 목록이 비어 있어도 파이썬 갤러리는 그대로 열립니다.',
        },
        {
          title: '짝은 이름이 아니라 id 로 찾는다',
          body:
            '파이썬 목록에는 제목도 파일 이름도 겹치는 예제가 있습니다(소수.py·회문.py 등). 그래서 파이썬 쪽 id 와 자바 쪽 pair 를 따로 두고, ' +
            '갤러리를 열 때 id → 예제 Map 을 한 번 만들어 양방향 링크를 그립니다.',
        },
        {
          title: '버튼 안에 버튼을 넣지 않는다',
          body:
            '카드는 버튼이라 그 안에 짝 링크 버튼을 넣을 수 없습니다. 카드와 링크를 담는 칸(.snippet-cell)을 두고, 필터로 숨기는 대상도 카드가 아니라 이 칸으로 바꿨습니다.',
        },
        {
          title: '건너갈 때는 필터를 푼다',
          body:
            '짝 링크로 넘어간 카드가 검색어·난이도 필터에 걸려 안 보이면 소용이 없으므로, 링크로 이동할 때는 둘 다 풀고 그 카드로 스크롤해 2초간 표시합니다.',
        },
      ],
      features: [
        { title: '첫 탭 고르기', body: '지금 보고 있는 문서의 확장자로 첫 탭을 정합니다 — .java 를 편집하다 열면 자바 탭부터 보입니다.' },
        { title: '언어별 열기', body: '파이썬 예제는 handleFiles, 자바 예제는 queueFiles(isScratch) 로 엽니다. 자바 쪽 이유는 java-editor.js 의 새 파일 흐름과 같습니다.' },
        { title: '진입점 유지', body: '사이드바 ✨·환영 화면·드롭존·명령 팔레트("파이썬 예제 갤러리"·"자바 예제 갤러리")가 모두 openSnippetGallery 로 옵니다.' },
      ],
      files: [
        { path: 'docs/자바-예제갤러리-설계.md', label: '자바-예제갤러리-설계.md', description: '설계 문서 — 확정 방침·짝 연결·자바 쪽 구현 계약·예제 목록 확정본' },
        { path: 'tests/e2e/snippet-gallery.spec.js', label: 'snippet-gallery.spec.js', description: '언어 탭·짝 링크·필터 풀기·언어별 검색' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서가 "파이썬과 다른 점" 을 번호 매겨 계약으로 적었고(파일 이름 규칙·여는 방법·JDK 필요·한 예제 한 파일·JDK 이름 충돌·병렬 배열 금지), ' +
            '그 대부분이 java-snippets.test.js 와 snippet-gallery.spec.js 로 옮겨져 있습니다. 문서가 테스트 목록의 출처 역할을 한 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '공용화하면서 진입점을 옮기지 않았습니다. 사이드바·환영 화면·드롭존은 인자 없이 부르고(첫 탭은 지금 문서로 정함), 명령 팔레트에만 언어를 지정한 항목을 더해, 파이썬만 쓰던 흐름이 그대로 남습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '설계 문서가 파이썬 목록의 중복 16쌍을 "별개로 정리할 대상" 으로 남겨 두었습니다. 짝은 뒤쪽 예제에 걸었으므로, 중복을 지울 때 앞쪽을 지워야 링크가 살아남습니다.',
        },
      ],
    }),
  ];
};
