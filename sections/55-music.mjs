// 6. learning-tools — 악보 문서(.msheet). 모델·MusicXML·소리·편집기 네 파일.
//
// learning-tools 계층에 속하지만 파일이 넷이고 4,800줄이라 50-learning.mjs 에서 떼어 둔다.
// 카테고리는 같으므로 사이드바에서는 learning-tools 안의 "악보" 묶음으로 이어 붙는다.

export default ({ helpers }) => {
  const { mod, sec } = helpers;

  return [
    sec({
      id: 'music-overview',
      category: '6. learning-tools',
      group: '악보',
      title: '악보 문서 개요 (.msheet)',
      subtitle: '모델·MusicXML·소리·편집기 4개 파일 — 새 문서 종류를 붙이는 표준 경로',
      summary:
        '오선을 클릭해 음표를 놓고, 놓는 즉시 그 음을 듣고, 전체나 고른 마디만 재생하고, 들은 것과 같은 소리를 WAV 로 저장합니다. ' +
        '자체 확장자 .msheet(JSON)로 저장·재편집하고 MusicXML(.musicxml/.mxl)로 주고받습니다. ' +
        '.mnote 가 닦아 둔 "새 문서 종류" 경로(file-loaders 분기 → makeDoc → saveTextDoc 재사용)를 그대로 따르므로 ' +
        '앱 본체에 들어간 변경은 한 줄짜리 분기 몇 개뿐입니다.',
      usage: [
        {
          title: '네 파일의 경계',
          body:
            'music-model.js 는 음악 규칙(틱·음높이·조표·마디 채움)만 알고 DOM·오디오·VexFlow 를 참조하지 않습니다. ' +
            'music-xml.js 는 MusicXML 과의 변환, music-audio.js 는 소리, music-editor.js 는 화면과 조작입니다. ' +
            '모델이 순수하기 때문에 음악 규칙 24개를 node --test 로 브라우저 없이 검증합니다.',
        },
        {
          title: '앱 본체에 남긴 자국',
          body:
            'file-loaders.js 에 확장자 분기 2줄, documents.js 에 폴더 우클릭 "+Ms" 항목, command-palette.js 에 명령 1개, ' +
            'app.js 에 사이드바 버튼과 인쇄 분기, lazy.js 에 vexflow 묶음, i18n.js 에 문구 2개. ' +
            '4,800줄짜리 기능을 붙이면서 기존 파일에는 이만큼만 손댔습니다.',
        },
        {
          title: '이름을 music* 로 통일한 이유',
          body:
            '이 코드베이스에서 sheet 는 이미 스프레드시트를 뜻합니다(spreadsheet-viewer.js 의 sheetBaseName). ' +
            '번들러 없이 전역을 공유하는 구조라 이름이 겹치면 조용히 덮어쓰므로, 확장자만 .msheet 로 두고 코드는 music* 로 맞췄습니다.',
        },
        {
          title: '지연 로드',
          body:
            'VexFlow(710KB, 음악 글꼴 Bravura 내장)는 시작할 때 싣지 않고 악보를 처음 열 때 MNLazy 가 꺼냅니다. ' +
            '악기 MP3 샘플도 그 음색을 처음 재생할 때만 읽습니다. 악보를 안 쓰는 사람은 어느 쪽도 내려받지 않습니다.',
        },
      ],
      features: [
        { title: '입력', body: '오선 클릭, 도·레·미 버튼, 숫자키 1~5(음길이)·R(쉼표)·.(점). 세 경로가 같은 삽입 함수로 모입니다.' },
        { title: '소리', body: '피아노·기타·실로폰·하프·플루트·클라리넷 실제 녹음 6종 + 합성음 3종.' },
        { title: '재생', body: '전체·마디 범위·반복, 속도 50/75/100%, 카운트인, 메트로놈.' },
        { title: '내보내기', body: 'WAV(OfflineAudioContext 렌더), MusicXML, 인쇄(같은 문서 안 인쇄용 층).' },
        { title: '되돌리기', body: 'MNEditHistory 소비자. 스냅샷은 악보 JSON 문자열이라 가볍고, 제목 타자는 한 단계로 묶습니다.' },
      ],
      files: [
        { path: 'docs/악보-설계.md', label: '악보-설계.md', description: '설계 문서 — 결정과 그 근거, P0~P4 단계' },
        { path: 'tests/music-model.test.js', label: 'music-model.test.js', description: '음악 규칙 24개' },
        { path: 'tests/music-xml.test.js', label: 'music-xml.test.js', description: 'MusicXML 왕복 7개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서를 먼저 쓰고 결정마다 근거를 남겼습니다. "VexFlow 표기로 저장하지 않는 이유", ' +
            '"↑↓ 를 반음이 아니라 흰건반 한 음으로 바꾼 이유", "인쇄를 새 창으로 하지 않은 이유(Bravura 글꼴이 따라가지 않는다)" 처럼 ' +
            '나중에 되돌리기 쉬운 판단들이 근거와 함께 남아 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '기존 저장 경로(saveTextDoc)를 재사용해 원본 덮어쓰기·서버 저장·다운로드 세 경로를 공짜로 얻었습니다. ' +
            '새 문서 종류마다 저장 로직을 새로 쓰지 않는다는 원칙이 .mnote 에 이어 두 번째로 지켜졌습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '설계 문서의 "범위" 절이 구현을 따라오지 못했습니다. 1차 제외로 적힌 화음·두 성부·대보표·붙임줄·이음줄·가사·셈여림·반복기호·MusicXML 이 ' +
            '모두 구현돼 있고(잇단음표만 남음), 저장 포맷도 문서의 version 2 가 아니라 4 입니다. ' +
            '문서를 읽고 "이건 아직 없겠구나" 판단하면 틀립니다. §1·§2 를 현재 구현에 맞추는 편이 좋습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '단위 테스트 76개(모델 24 · 편집기 32 · 소리 13 · MusicXML 7)가 붙어 있습니다. ' +
            '다만 실제 조판과 소리는 브라우저가 있어야 확인되므로, 설계 문서도 각 단계마다 "남은 확인"으로 그 한계를 적어 두었습니다. ' +
            'tools/music-audio-check.html 이 그 수동 확인용 페이지입니다.',
        },
      ],
    }),

    mod('music-model.js', {
      group: '악보',
      title: 'music-model.js — 악보 모델 (.msheet)',
      subtitle: '순수 규칙 891줄 — DOM·오디오·VexFlow 를 모름',
      summary:
        '.msheet 의 데이터 모델과 음악 규칙 전부입니다. 음표·쉼표·마디 생성, 틱 계산, 마디 채움 검사, 조표 30종, ' +
        '{step, octave, alter} → MIDI → 주파수 변환, 오선 자리 ↔ 음높이 변환, 도돌이를 펼친 재생 타임라인, 줄바꿈 배치까지 여기 있습니다. ' +
        '이 파일이 순수하기 때문에 나머지 세 파일이 바뀌어도 음악 규칙은 node 테스트로 지켜집니다.',
      usage: [
        {
          title: '왜 VexFlow 표기로 저장하지 않는가',
          body:
            'VexFlow 는 음을 "g/4" 문자열로 받습니다. 그대로 저장하면 파일 포맷이 렌더 라이브러리에 묶입니다. ' +
            'MusicXML 과 같은 결의 {step, octave, alter} 로 저장하고 musicVexNote(화면)·musicMidiNumber(소리) 두 함수에서만 변환합니다. ' +
            '렌더러를 갈아끼우거나 MIDI 를 붙일 때 모델은 그대로입니다.',
        },
        {
          title: '틱은 정수만',
          body:
            '4분음표 = 480틱. 점음표(720)도 겹점(840)도 나눠떨어져 부동소수 오차가 없습니다. ' +
            '마디 용량은 beats × (1920 / beatValue) 로 계산하고, 넘치는 입력은 musicCanFit 이 미리 막습니다.',
        },
        {
          title: '버전 이전',
          body:
            'musicParse 는 version 1~4 를 모두 읽고 항상 4 로 정규화해 돌려줍니다. ' +
            'v1 의 기본 음색이던 triangle 은 자동으로 piano 로 옮겨, 옛 악보도 설정을 건드리지 않고 개선된 소리를 듣습니다.',
        },
      ],
      features: [
        { title: '조표 30종', body: '5도권 계산으로 장·단조를 만들어 두므로 조표마다 임시표 표를 손으로 적지 않습니다.' },
        { title: '음역 제한', body: '높은음자리표 G3~C6, 낮은음자리표 C2~C5. 화면 입력은 막되 파일에서 읽을 때는 넉넉히 받습니다.' },
        { title: '도돌이 펼치기', body: 'musicPlaybackMeasureIndexes 가 반복·1·2번 괄호를 재생 순서로 펼칩니다.' },
        { title: '줄바꿈 배치', body: 'musicPackLines 가 마디별 폭을 어림해 줄에 채우고 남는 폭을 비례 배분합니다.' },
      ],
      files: [
        { path: 'tests/music-model.test.js', label: 'music-model.test.js', description: '학교종 4마디 표본으로 규칙 24개 검증' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '이 계층에서 가장 깔끔한 순수 코어 분리입니다. data-convert.js 와 같은 방식이며, ' +
            '테스트가 vm 컨텍스트에 파일을 통째로 넣고 전역 함수를 꺼내 쓰는 것만으로 성립합니다 — 모의 객체가 하나도 없습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '조표 변경(musicRetuneForKey)이 "임시표 없이 적혀 있던 음만" 새 조표를 따르게 합니다. ' +
            '일부러 붙인 임시표는 남습니다. alter 가 실제 울리는 반음이라 표시와 소리가 함께 맞습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'musicParse 가 손상된 값을 예외 대신 기본값으로 조용히 바꿉니다. 모르는 조표는 다장조, 범위 밖 빠르기는 잘라내기입니다. ' +
            '남의 파일을 열 때는 관대해서 좋지만, 사용자는 조표가 바뀐 것을 모른 채 저장하게 됩니다. ' +
            'mnote.js 가 "지원하지 않는 버전을 명시적으로 거부"하는 것과는 반대 방향의 선택입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '891줄 중 절반이 상수 표(조표 30종·음표 값·샘플 음역)입니다. 로직 자체는 크지 않고, ' +
            '표가 커진 만큼 손으로 적은 예외가 줄었습니다.',
        },
      ],
    }),

    mod('music-xml.js', {
      group: '악보',
      title: 'music-xml.js — MusicXML 가져오기·내보내기',
      subtitle: '표준 포맷과의 다리 558줄',
      summary:
        'MusicXML(.musicxml)과 압축형(.mxl)을 읽어 .msheet 모델로 옮기고, 편집한 악보를 표준 score-partwise 로 내보냅니다. ' +
        '.mxl 은 제품에 이미 들어 있는 JSZip 을 지연 로드해 풀기 때문에 새 의존이 늘지 않습니다. ' +
        '표현할 수 없는 요소(32분음표·잇단음표 등)는 버리지 않고 경고로 모아 사용자에게 알립니다.',
      usage: [
        {
          title: '네임스페이스에 견디기',
          body:
            'musicXmlLocalName 이 태그의 접두사를 떼고 비교합니다. MusicXML 파일마다 네임스페이스 선언이 제각각이라 ' +
            'querySelector 로 짜면 프로그램마다 다르게 깨집니다.',
        },
        {
          title: '손실을 숨기지 않기',
          body:
            'musicXmlSupportedDuration 이 지원 범위 밖 음길이를 가장 가까운 값으로 낮추면서 warnings 에 쌓습니다. ' +
            '가져오기는 성공시키되 무엇이 달라졌는지는 알립니다. data-convert 의 손실 리포트와 같은 태도입니다.',
        },
      ],
      features: [
        { title: '가져오기', body: '조표·박자·음표·화음·대보표·붙임줄을 읽습니다.' },
        { title: '내보내기', body: 'divisions 를 480 으로 고정해 틱을 그대로 씁니다.' },
        { title: '압축형', body: '.mxl 은 JSZip 지연 로드 후 container.xml 로 본체를 찾습니다.' },
      ],
      files: [
        { path: 'tests/music-xml.test.js', label: 'music-xml.test.js', description: '왕복 변환과 손실 경고 7개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '자체 포맷을 만들면서 표준 포맷으로 나가는 문을 같이 냈습니다. 학생 작업물이 이 앱 안에 갇히지 않습니다. ' +
            '모델을 MusicXML 과 같은 결({step, octave, alter})로 설계해 둔 덕에 변환 계층이 558줄로 끝났습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '테스트 7개는 네 파일 중 가장 얇습니다. 남이 만든 MusicXML 은 형태가 넓게 갈리는 입력이라 ' +
            '실제 파일(Finale·MuseScore·Sibelius 내보내기)을 픽스처로 몇 개 넣어 두는 편이 안전합니다.',
        },
      ],
    }),

    mod('music-audio.js', {
      group: '악보',
      title: 'music-audio.js — 소리 엔진 (MNMusicAudio)',
      subtitle: '샘플 6종·예약 스케줄러·WAV 저장 581줄',
      summary:
        '실제 악기 녹음 6종과 오실레이터 합성음 3종으로 음을 울리고, AudioContext 시계에 미리 예약해 템포를 지키고, ' +
        '같은 예약 함수를 OfflineAudioContext 에 태워 WAV 로 렌더합니다. 전역 경계 MNMusicAudio 로 노출되며 ' +
        '소비자는 music-editor.js 하나입니다.',
      usage: [
        {
          title: 'setTimeout 을 쓰지 않는 이유',
          body:
            '메인 스레드가 파이썬 실행 등으로 잠깐 밀리면 setTimeout 기반 재생은 템포가 흔들립니다. ' +
            '25ms 마다 도는 타이머가 앞으로 200ms 안에 시작할 음만 AudioContext.currentTime 기준으로 예약하므로, ' +
            '스레드가 밀려도 이미 예약된 소리는 정확히 납니다.',
        },
        {
          title: '들은 것과 저장본이 같은 이유',
          body:
            'scheduleInto(target, destination, …) 하나가 실시간 컨텍스트와 오프라인 컨텍스트를 모두 받습니다. ' +
            '재생과 WAV 저장이 같은 코드를 타므로 "들은 것과 다른 파일이 저장되는" 사고가 구조적으로 막힙니다. ' +
            '오프라인 렌더는 실시간을 기다리지 않아 3분 곡도 1초 안에 끝납니다.',
        },
        {
          title: '화면 강조는 오디오가 아니라 rAF',
          body:
            '재생 중 음표 강조는 requestAnimationFrame 에서 ctx.currentTime 을 보고 처리합니다. ' +
            '오디오 콜백에서 DOM 을 만지지 않는다는 경계가 지켜집니다.',
        },
        {
          title: '샘플 지연 로드',
          body:
            '악기 MP3 는 그 음색을 처음 재생할 때만 읽습니다. 단일 HTML 에서는 악기별 JSON 블록의 data URL 에서 꺼내고, ' +
            '디코딩이 끝나면 그 블록의 문자열을 비워 base64 원문이 메모리를 이중으로 잡지 않게 합니다.',
        },
      ],
      features: [
        { title: 'ADSR', body: '게인을 0에서 램프로 올리고 내립니다 — 안 그러면 딸깍 잡음이 납니다.' },
        { title: '음역 덮기', body: '단3도 간격 실제 녹음으로 G3~C6 을 덮고 사이 음은 재생 속도로 최대 2반음만 옮깁니다.' },
        { title: '연습 기능', body: '카운트인·메트로놈·구간 반복·속도 50/75/100%. WAV 저장본에는 섞지 않습니다.' },
        { title: 'WAV 인코더', body: '16bit PCM 헤더 44바이트를 직접 씁니다. 외부 의존 없음.' },
      ],
      files: [
        { path: 'tests/music-audio.test.js', label: 'music-audio.test.js', description: '가짜 AudioContext 로 예약 시각·주파수·WAV 헤더 13개' },
        { path: 'tools/music-audio-check.html', label: 'music-audio-check.html', description: '브라우저에서 실제 소리를 듣는 수동 확인 페이지' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '샘플 로드에 실패하면 재생을 포기하지 않고 합성음(triangle)으로 내려앉으면서 onError 로 알립니다. ' +
            '실패한 음색의 Promise 를 null 로 되돌려 다음 재생에서 다시 시도할 수도 있습니다. 교실 네트워크를 감안한 설계입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '대기 화면(화면보호기) 충돌을 screensaver.js 를 고치지 않고 해결했습니다. ' +
            'Web Audio 소리는 <audio> 요소가 아니라 기존 검사에 걸리지 않는데, 재생 중에만 컨테이너에 .is-running 클래스를 붙여 ' +
            '"파이썬 실행 중" 규칙에 얹었습니다. 남의 파일을 건드리지 않고 기존 규칙을 재사용한 사례입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'MP3 샘플 49개(9.5MB)가 단일 HTML 에 base64 로 들어가면서 오프라인 산출물이 19MB → 30.4MiB 로 커졌습니다. ' +
            '실행되지 않는 JSON 블록이라 시작할 때 파싱하지는 않지만, 브라우저가 30MB 문서를 읽어야 하는 것은 그대로입니다. ' +
            '악기가 더 늘면 이 방식의 한계에 먼저 닿습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '재생 중 강조는 매 프레임 타임라인을 앞에서부터 훑습니다. 동요 길이에서는 문제가 없지만 ' +
            '긴 악보에서는 현재 위치를 기억해 이어 찾는 편이 자연스럽습니다.',
        },
      ],
    }),

    mod('music-editor.js', {
      group: '악보',
      title: 'music-editor.js — 악보 편집기',
      subtitle: '2,793줄 — 조판·도구상자·입력·재생 화면',
      summary:
        '.msheet 열기·저장, VexFlow 조판, 도구상자, 오선 클릭 입력, 선택·이동·삭제, 미리듣기, 재생 화면, WAV·MusicXML 내보내기, ' +
        '인쇄, 되돌리기, 확대, 창 크기 변경 시 재조판을 담당합니다. 음악 규칙은 music-model.js, 소리는 MNMusicAudio 에 맡기고 ' +
        '이 파일은 화면과 조작만 압니다.',
      usage: [
        {
          title: 'VexFlow 경계를 좁게',
          body:
            'VexFlow 에는 음자리표·조표·박자표·마디별 StaveNote 배열만 넘깁니다. 꼬리 잇기는 Beam, 간격은 Formatter 에 맡기고 ' +
            '소리·편집·저장은 전부 우리 코드입니다. 자동 줄바꿈은 VexFlow 가 해 주지 않아 musicPackLines 가 폭을 계산합니다.',
        },
        {
          title: '클릭 좌표 → 음높이',
          body:
            'stave.getYForLine(line) 으로 줄마다 y 를 얻어 표를 만들고, 클릭한 y 에 가장 가까운 줄·칸을 고릅니다. ' +
            '변환 자체(musicPitchFromStaveLine)는 모델에 있어 테스트로 검증됩니다.',
        },
        {
          title: '인쇄를 같은 문서 안에서',
          body:
            'VexFlow 5 는 음표를 Bravura 글꼴의 글자로 그립니다. SVG 만 새 창으로 옮기면 그 문서에는 글꼴이 없어 악보가 깨집니다. ' +
            '화이트보드 printBoard 와 같이 같은 문서 안에 인쇄용 층을 만들고 나머지를 @media print 로 숨깁니다. ' +
            'PDF 내보내기를 따로 만들지 않은 것도 같은 이유입니다.',
        },
        {
          title: '재조판 비용',
          body: '편집마다 전체를 다시 조판하지 않도록 180ms 디바운스를 두었습니다. 저사양 교실 PC 를 전제한 값입니다.',
        },
      ],
      features: [
        { title: '도구상자', body: '길이 5종·점·쉼표·♯♭♮·지우개·마디 추가/삭제.' },
        { title: '자판', body: '1~5 길이, R 쉼표, . 점, ↑↓ 한 음, Shift+↑↓ 옥타브, ←→ 이웃 음표. 입력칸 안에서는 무시합니다.' },
        { title: '계이름', body: '음표 아래 도·레·미 표시를 켜고 끕니다. 저학년 수업용입니다.' },
        { title: '예제', body: '학교종·작은별 4마디를 넣습니다. 기존 내용 교체는 확인을 받고, 되돌리기 한 단계로 취소됩니다.' },
      ],
      files: [
        { path: 'tests/music-editor.test.js', label: 'music-editor.test.js', description: '접점 계약 32개 — 소스 문자열 매칭 방식' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '↑↓ 이동 단위를 반음에서 흰건반 한 음으로 바꾼 판단이 설계 문서에 근거와 함께 남아 있습니다. ' +
            '반음 이동은 임시표를 계속 바꾸고 F→F# 처럼 음표가 화면에서 제자리에 머물러 동요 편집에서 예측하기 어렵습니다. ' +
            '반음은 ♯·♭·♮ 버튼이 맡습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'mountMusicEditor 한 함수가 124행부터 2,793행까지, 안에 중첩 함수 107개를 담고 있습니다. ' +
            '상태를 클로저로 공유하는 편집기라 이 구조가 나오는 이유는 분명하지만, ' +
            '조판(drawScore 301줄)·도구상자·재생 제어는 상태를 인자로 받는 별도 함수로 떼어낼 수 있습니다. ' +
            '이 파일에 생긴 버그는 재현 조건이 클로저 상태 전체가 됩니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '테스트 32개가 대부분 소스 문자열 매칭입니다(whiteboard-context-menu-phase2.test.js 와 같은 방식). ' +
            '접점이 사라진 것은 잡지만 조판·조작이 실제로 동작하는지는 잡지 못합니다. ' +
            '설계 문서가 E2E 를 P2 이후로 예고했는데 아직 없습니다 — 새 악보 → 음표 3개 → 저장 → 다시 열기 한 개만 있어도 ' +
            '이 파일의 회귀 위험이 크게 줄어듭니다.',
        },
      ],
    }),
  ];
};
