// 8. learning-tools — 악보 문서(.msheet). 모델·MusicXML·소리·편집기·음감 테스트 다섯 파일.
//
// learning-tools 계층에 속하지만 파일이 다섯이고 분량이 커서 50-learning.mjs 에서 떼어 둔다.
// 카테고리는 같으므로 사이드바에서는 learning-tools 안의 "악보" 묶음으로 이어 붙는다.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  // 줄 수는 문장에 적지 않고 생성 때 잰다(lib/source-metrics.mjs).
  const modelLines = linesLabel(rootDir, 'src/js/music-model.js');
  const editorLines = linesLabel(rootDir, 'src/js/music-editor.js');
  const xmlLines = linesLabel(rootDir, 'src/js/music-xml.js');
  const audioLines = linesLabel(rootDir, 'src/js/music-audio.js');

  return [
    sec({
      id: 'music-overview',
      category: '8. learning-tools',
      group: '악보',
      title: '악보 문서 개요 (.msheet)',
      subtitle: '모델·MusicXML·소리·편집기·음감 테스트 5개 파일 — 새 문서 종류를 붙이는 표준 경로',
      summary:
        '오선을 클릭해 음표를 놓고, 놓는 즉시 그 음을 듣고, 전체나 고른 마디만 재생하고, 들은 것과 같은 소리를 WAV 로 저장합니다. ' +
        '자체 확장자 .msheet(JSON)로 저장·재편집하고 MusicXML(.musicxml/.mxl)로 주고받습니다. ' +
        '.mnote 가 닦아 둔 "새 문서 종류" 경로(file-loaders 분기 → makeDoc → saveTextDoc 재사용)를 그대로 따르므로 ' +
        '앱 본체에 들어간 변경은 한 줄짜리 분기 몇 개뿐입니다.',
      usage: [
        {
          title: '다섯 파일의 경계',
          body:
            'music-model.js 는 음악 규칙(틱·음높이·조표·마디 채움)만 알고 DOM·오디오·VexFlow 를 참조하지 않습니다. ' +
            'music-xml.js 는 MusicXML 과의 변환, music-audio.js 는 소리, music-editor.js 는 화면과 조작, ' +
            'music-eartest.js 는 음감 테스트 화면입니다. ' +
            '모델이 순수하기 때문에 음악 규칙 62개를 node --test 로 브라우저 없이 검증합니다 — 문제 만들기(musicEarQuestions)까지 이쪽에 있습니다.',
        },
        {
          title: '앱 본체에 남긴 자국',
          body:
            'file-loaders.js 에 확장자 분기 2줄, documents.js 에 폴더 우클릭 "+Ms" 항목, command-palette.js 에 명령 1개, ' +
            'app.js 에 사이드바 버튼과 인쇄 분기, lazy.js 에 vexflow 묶음, i18n.js 에 문구 2개. ' +
            '기능 하나를 통째로 붙이면서 기존 파일에는 이만큼만 손댔습니다.',
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
        { title: '소리', body: '피아노·기타·실로폰·하프·플루트·클라리넷 실제 녹음 6종 + 합성음 3종. 음색은 처음 재생할 때만 샘플을 읽습니다.' },
        { title: '재생', body: '전체·마디 범위·반복, 속도 50/75/100%, 카운트인, 메트로놈.' },
        { title: '내보내기', body: 'WAV(OfflineAudioContext 렌더), MusicXML, 인쇄(같은 문서 안 인쇄용 층).' },
        { title: '되돌리기', body: 'MNEditHistory 소비자. 스냅샷은 악보 JSON 문자열이라 가볍고, 제목 타자는 한 단계로 묶습니다.' },
        {
          title: '조옮김',
          body:
            '노래 전체를 반음 단위로 올리고 내립니다. 조표만 바꾸는 "조표 선택"과 헷갈리기 쉬운 자리라, ' +
            '두 단추의 title 에 무엇이 다른지 한 줄씩 적어 두었습니다. 음역을 벗어나는 음이 생겨도 막지 않고 물어보기만 합니다.',
        },
        { title: '대보표', body: '단선율과 피아노 대보표(높은음자리 + 낮은음자리)를 같은 모델로 다룹니다.' },
        { title: '메모지 왕복', body: '악보를 메모 그림으로 보내고 되돌아옵니다. 이어진 탭의 내용이 그림과 다르면 그 갈림길만 사용자에게 묻습니다.' },
        {
          title: '가사 여러 절',
          body:
            '1~6절. 1절은 예전과 같은 note.lyric 자리에 그대로 두고 2절부터를 배열에 담아, 옛 .msheet·옛 판 앱·MusicXML 어디로 가도 1절은 반드시 살아남습니다. ' +
            '음표마다 창을 여는 대신 "이어치기"로 죽 쳐 넣거나 한 줄을 붙여 넣어 음절 단위로 배분합니다.',
        },
        {
          title: '마디 번호 · 연습 기호',
          body:
            '합주에서 "32마디부터", "B부터"가 되게 합니다. 연습 기호는 도돌이 시작·1번 괄호·수동 줄바꿈처럼 "음악이 새로 시작하는 곳"에 자동으로 매기고, ' +
            '한 줄에 넣을 마디 수를 고정해 인쇄본마다 마디 위치가 달라지지 않게 합니다.',
        },
        {
          title: '이조 악기 파트',
          body: 'B♭ 클라리넷·E♭ 알토색소폰 같은 파트보를 손으로 옮겨 적지 않아도 됩니다.',
        },
        {
          title: '파트 연습 음원',
          body: '합창·합주 파트 연습용 음원을 파트마다·템포마다 일괄로 저장합니다.',
        },
        {
          title: '따라치기 · 음감 테스트',
          body:
            '따라치기는 악보를 교본 삼아 그대로 쳐 보는 연습이고, 음감 테스트는 반대로 악보를 감추고 소리만 듣고 음이름을 맞힙니다. ' +
            '형제 기능이지만 규칙이 정반대라 파일을 나눴습니다.',
        },
      ],
      files: [
        { path: 'docs/악보-설계.md', label: '악보-설계.md', description: '1차 설계 문서 — 결정과 그 근거, P0~P4 단계' },
        { path: 'docs/악보-확장-설계.md', label: '악보-확장-설계.md', description: '2차 설계 문서(2026-08-30) — 실무용 4종. 먼저 기존 구현을 훑고 시작합니다' },
        { path: 'tests/music-model.test.js', label: 'music-model.test.js', description: '음악 규칙 62개' },
        { path: 'tests/music-xml.test.js', label: 'music-xml.test.js', description: 'MusicXML 왕복 10개' },
        { path: 'tests/music-memo-roundtrip.test.js', label: 'music-memo-roundtrip.test.js', description: '메모 그림 ↔ 악보 탭 왕복 9개' },
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
          type: 'good',
          label: 'Good',
          body:
            '2차 설계 문서가 "먼저 조사한 것 — 이미 있는 기능" 으로 시작합니다. 넣으려던 기능(코드 기호 → 자동 반주)이 ' +
            '이미 구현돼 있다는 것을 확인하고 설계에서 뺐습니다. 설계 문서가 대개 "무엇을 만들 것인가"만 적는 것과 달리 ' +
            '"무엇이 이미 있는가"를 먼저 적었고, 그 조사가 실제로 범위를 줄였습니다. 이 코드베이스에서 문서가 일한 가장 좋은 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '가사 여러 절을 넣으면서 1절을 예전 자리(note.lyric)에 그대로 남겼습니다. ' +
            '옛 .msheet 로도, 옛 판 앱으로도, MusicXML 로 내보내도 1절은 반드시 살아남습니다. ' +
            '데이터를 확장할 때 "옛 독자가 무엇을 읽게 되는가"를 먼저 정한 형태이며, 설계 문서에 그 결정과 이유가 표로 남아 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '설계 문서가 "구현하며 접었다"·"구현하며 추가했다" 를 그대로 적습니다. ' +
            '가사 보기 상태(lyricVerseView)를 두려다 접은 이유 — 인쇄도 그림도 화면에 그린 그 SVG 를 쓰므로 상태를 하나 더 두면 ' +
            '렌더를 한 벌 더 돌려야 한다 — 가 남아 있습니다. 계획대로 되지 않은 부분을 지우지 않고 남긴 문서라 다음 사람이 같은 길을 다시 밟지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '1차 설계 문서(악보-설계.md)의 "범위" 절이 구현을 따라오지 못한 상태 그대로입니다. ' +
            '1차 제외로 적힌 화음·두 성부·대보표·붙임줄·이음줄·가사·셈여림·반복기호·MusicXML 이 모두 구현돼 있고, ' +
            '저장 포맷도 문서의 version 2 가 아니라 12 입니다. 그 문서만 읽고 "이건 아직 없겠구나" 판단하면 틀립니다. ' +
            '다만 2차 문서(악보-확장-설계.md)는 이 문제를 정면으로 다뤘습니다 — §0 을 "먼저 조사한 것"으로 시작해 기존 구현을 표로 훑고, ' +
            '넣으려던 기능 하나(코드 기호 자동 반주)가 이미 있다는 것을 확인해 설계에서 뺐습니다. ' +
            '2차가 만든 이 습관을 1차 문서 §1·§2 에도 한 번 적용하면 됩니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '단위 테스트 163개(모델 62 · 편집기 63 · 소리 19 · MusicXML 10 · 메모 왕복 9)가 붙어 있습니다. ' +
            '다만 실제 조판과 소리는 브라우저가 있어야 확인되므로, 설계 문서도 각 단계마다 "남은 확인"으로 그 한계를 적어 두었습니다. ' +
            'tools/music-audio-check.html 이 그 수동 확인용 페이지입니다.',
        },
      ],
    }),

    mod('music-model.js', {
      group: '악보',
      title: 'music-model.js — 악보 모델 (.msheet)',
      subtitle: `순수 규칙 ${modelLines} — DOM·오디오·VexFlow 를 모름`,
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
            'musicParse 는 version 1~12 를 모두 읽고 항상 12 로 정규화해 돌려줍니다. 3주 사이에 버전이 8단계 올랐는데도 옛 악보가 그대로 열립니다. ' +
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
        { path: 'tests/music-model.test.js', label: 'music-model.test.js', description: '학교종 4마디 표본으로 규칙 62개 검증' },
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
            `${modelLines} 중 절반이 상수 표(조표 30종·음표 값·샘플 음역)입니다. 로직 자체는 크지 않고, ` +
            '표가 커진 만큼 손으로 적은 예외가 줄었습니다.',
        },
      ],
    }),

    mod('music-xml.js', {
      group: '악보',
      title: 'music-xml.js — MusicXML 가져오기·내보내기',
      subtitle: `표준 포맷과의 다리 ${xmlLines}`,
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
      subtitle: `샘플 6종·예약 스케줄러·WAV 저장 ${audioLines}`,
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
      subtitle: `${editorLines} — 조판·도구상자·입력·재생 화면`,
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
            '설계 문서가 E2E 를 P2 이후로 예고했는데, 2차 확장에서 네 개가 붙었습니다(가사·마디 번호·이조 파트·파트 연습 음원). ' +
            '다만 그것들은 새 기능을 겨눈 것이라, "새 악보 → 음표 3개 → 저장 → 다시 열기" 라는 기본 왕복은 여전히 비어 있습니다.',
        },
      ],
    }),

    mod('music-eartest.js', {
      group: '악보',
      title: 'music-eartest.js — 음감 테스트',
      subtitle: '소리만 듣고 음이름 맞히기 — 따라치기의 거울상',
      summary:
        '악보를 감추고 소리만 들려준 뒤 음이름을 맞히는 연습 모드입니다. ' +
        '문제를 만드는 규칙은 music-model.js 에 순수 함수로 있고, 이 파일은 그 문제를 소리로 내고 답을 받아 채점만 합니다. ' +
        'MNMusicEarTest.create(options) 하나로 화면 한 조각과 조작 몇 개를 돌려주는 형태라, 편집기가 자리만 내주면 됩니다.',
      usage: [
        {
          title: '따라치기와 규칙이 정반대인 세 곳',
          body:
            '① 악보를 보여 주지 않습니다 — 따라치기는 악보가 교본이지만 여기서는 악보가 곧 정답표입니다. ' +
            '② 틀려도 진도가 나갑니다 — 정답을 바로 들려주는 것이 학습 신호이고, 악보 위 위치를 잃을 일도 없습니다. ' +
            '③ 다시 듣기를 한 번으로 제한합니다 — 몇 번이고 다시 들으면 시행착오 게임이 됩니다. ' +
            '형제 기능인데도 파일을 나눈 이유가 이 세 줄에 적혀 있습니다.',
        },
        {
          title: '입력 경로를 새로 만들지 않았다',
          body:
            '자판·MIDI·도레미 버튼 세 갈래 입력을 편집기가 이미 갖고 있으므로, 이 파일은 press()·answerOctave() 두 문으로만 받습니다. ' +
            '입력 장치를 다시 다루지 않아 파일이 작게 유지됩니다.',
        },
        {
          title: '시간 상수에 이유가 붙어 있다',
          body:
            '간섭음이 끝나고 문제 음까지 750ms, 정답을 보여 주고 다음 문제까지 1,200ms, 시작 버튼에서 첫 소리까지 450ms(패널이 먼저 보이게). ' +
            '넷 다 숫자 옆에 왜 그 값인지가 적혀 있습니다.',
        },
      ],
      features: [
        { title: '문제 만들기', body: 'music-model.js 의 musicEarQuestions 가 만듭니다 — 순수 함수라 브라우저 없이 검증됩니다.' },
        { title: '간섭음', body: '문제 음 앞에 다른 음을 들려줘 직전 음을 기준 삼는 것을 막습니다.' },
        { title: '다시 듣기 1회', body: '문제마다 한 번만. 시행착오로 맞히는 것을 막습니다.' },
        { title: '옥타브 답', body: '음이름과 옥타브를 따로 받습니다.' },
      ],
      files: [],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"형제 기능인데 왜 합치지 않았는가"를 파일 첫머리에 세 줄로 적었습니다. 규칙이 정반대인 지점을 나열한 것이라, ' +
            '나중에 "둘을 합치자"는 제안이 나왔을 때 무엇을 포기하게 되는지가 바로 보입니다. 분리 자체보다 그 근거를 남긴 것이 값입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '문제 생성을 모델에 두고 이 파일은 소리·채점만 맡았습니다. "무엇을 물을 것인가"는 음악 규칙이고 ' +
            '"어떻게 들려줄 것인가"는 화면이라는 구분이며, 덕분에 문제 만들기가 단위 테스트로 덮입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 파일 자체를 겨눈 테스트가 없습니다. 문제 생성은 모델 쪽에서 덮이지만, ' +
            '채점·다시 듣기 제한·간섭음 순서 같은 이 파일의 규칙은 검증되지 않습니다. ' +
            'create() 가 화면 조각을 돌려주는 구조라 순수부(채점·상태 전이)를 조금만 밖으로 빼면 그대로 테스트할 수 있습니다.',
        },
      ],
    }),
  ];
};
