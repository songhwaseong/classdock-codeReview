// 5. document-editors — 개념 관계도(.concept)와 암기 카드(.study). 두 파일.
//
// 두 문서는 같은 수업 흐름의 앞뒤라서 함께 읽는 편이 낫다 — 관계도로 개념을 정리하고,
// 그 카드를 그대로 암기 카드로 넘긴다. study-doc.js 가 manifest 에서 concept-doc.js 에
// 의존하는 것도 그 때문이다. 40-editors.mjs 가 이미 두꺼워 지도·연대표와 같은 방식으로 떼어 둔다.

import { linesLabel, topLevelFunctionSpan, functionShare } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  // 줄 수와 "한 함수가 파일의 몇 %인가" 는 생성 때 잰다(lib/source-metrics.mjs).
  const conceptLines = linesLabel(rootDir, 'src/js/concept-doc.js');
  const studyLines = linesLabel(rootDir, 'src/js/study-doc.js');
  const conceptMount = topLevelFunctionSpan(rootDir, 'src/js/concept-doc.js', 'mountConceptEditor');
  const conceptMountShare = functionShare(rootDir, 'src/js/concept-doc.js', 'mountConceptEditor');
  const conceptPure = conceptMount ? `앞쪽 ${(conceptMount.start - 1).toLocaleString('en-US')}줄` : '앞쪽 절반';

  return [
    sec({
      id: 'concept-overview',
      category: '5. document-editors',
      group: '관계도 · 암기',
      title: '관계도 · 암기 카드 개요 (.concept / .study)',
      subtitle: '개념을 이어 그리고, 그 카드를 그대로 외우기로 넘긴다',
      summary:
        '개념 관계도(.concept)는 카드와 연결선으로 개념 사이의 관계를 그리는 문서이고, ' +
        '암기 카드(.study)는 앞뒤가 있는 카드를 넘겨 가며 자기평가로 복습하는 문서입니다. ' +
        '둘 다 JSON 한 파일이라 통합 검색·되돌아 열기·복구 저장이 다른 문서와 똑같이 동작합니다. ' +
        '관계도에서 정리한 카드를 암기 카드로 넘길 수 있어, 두 문서가 한 수업의 앞뒤를 이룹니다.',
      usage: [
        {
          title: '관계는 다섯 갈래만',
          body:
            '원인 → 결과, 상위 → 하위, 비교, 근거·뒷받침, 관련. 자유 텍스트로 두지 않고 목록으로 고정했습니다. ' +
            '덕분에 자동 정렬이 "원인·포함 관계는 방향대로 다음 열에 놓는다" 처럼 관계의 뜻을 읽고 배치할 수 있습니다 — ' +
            '이름을 마음대로 붙일 수 있었다면 배치는 그저 선 길이 최소화 문제가 됐을 것입니다.',
        },
        {
          title: '자동 정렬 네 가지',
          body:
            '가계도·방사형·원형·격자형. 같은 관계 목록을 서로 다른 구조로 놓습니다. ' +
            '자유 배치와 자동 정렬을 둘 다 지원하되, 자동 정렬은 좌표를 덮어쓰는 한 번의 동작이고 되돌리기 한 번으로 취소됩니다.',
        },
        {
          title: '발표 순서는 관계에서 나온다',
          body:
            '카드를 하나씩 드러내는 발표 모드가 있는데, 그 순서를 사람이 정하지 않고 관계 방향의 세대·과정별로 만듭니다. ' +
            '같은 단계는 화면 위쪽부터 둡니다. 관계를 고치면 발표 순서가 따라 바뀌므로 둘이 어긋날 수 없습니다.',
        },
        {
          title: '상한을 값으로 박아 둔다',
          body:
            '카드 300개, 연결선 800개, 좌표 ±30000, 확대 0.35~2배. 손으로 고친 .concept 가 들어와도 화면이 폭주하지 않습니다. ' +
            '지도(.map)·악보(.msheet)가 쓰는 것과 같은 방어이며, 이 코드베이스에서 새 문서 종류를 만들 때의 표준이 됐습니다.',
        },
        {
          title: '빈칸 카드',
          body:
            '암기 카드는 앞뒤 두 면짜리(qa)와 빈칸 채우기(cloze) 두 종류입니다. 빈칸은 본문에 {{정답}} 으로 적으면 ' +
            '그 자리를 가리고 정답을 모읍니다 — 한 문장에 빈칸을 여럿 둘 수 있습니다.',
        },
      ],
      features: [
        { title: '카드·연결선', body: '색 6종, 관계 5갈래. 카드를 끌어 자유 배치하거나 네 가지 자동 정렬을 씁니다.' },
        { title: '확대·이동', body: '커서 중심 확대와 두 손가락 핀치. 확대 전후 같은 지점이 포인터 아래 남습니다.' },
        { title: '가장자리 자동 이동', body: '카드를 화면 끝으로 끌면 캔버스가 따라 움직이되, 카드가 마우스 아래에서 한 번 더 밀리지 않게 좌표를 보정합니다.' },
        { title: '발표 모드', body: '관계 방향에서 만든 순서로 카드를 하나씩 드러냅니다. 애니메이션을 고를 수 있습니다.' },
        { title: '표로 개요', body: '카드와 관계를 표 형태로 펼쳐 한눈에 고칩니다.' },
        { title: '자기평가 복습', body: '암기 카드는 다시·어려움·좋음 세 단계로 스스로 평가하고, 결과와 다음 복습일을 문서에 적습니다.' },
        { title: 'CSV 왕복', body: '암기 카드를 CSV 로 꺼내고 다시 읽습니다. 줄바꿈·쉼표가 든 카드도 그대로 돌아옵니다.' },
      ],
      files: [
        { path: 'tests/concept-doc.test.js', label: 'concept-doc.test.js', description: '모델 왕복·자동 정렬·발표 순서·확대 기준점 19개' },
        { path: 'tests/study-doc.test.js', label: 'study-doc.test.js', description: '빈칸·자기평가·CSV 왕복 4개' },
        { path: 'tests/e2e/concept-table-outline.spec.js', label: 'concept-table-outline.spec.js', description: '표 개요 화면' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '관계 이름을 자유 문자열이 아니라 다섯 갈래 목록으로 못 박은 것이 이 문서의 성격을 결정했습니다. ' +
            '자동 정렬과 발표 순서가 관계의 "뜻"을 읽어 계산할 수 있게 됐고, 두 기능 모두 사람이 따로 순서를 정하지 않아도 됩니다. ' +
            '데이터 모양 하나를 좁힌 대가로 기능 둘을 얻은 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '확대·이동 판정이 순수 함수로 빠져 있어 "확대 전후 같은 캔버스 지점이 포인터 아래 남는가", ' +
            '"핀치 축소에도 두 손가락 가운데가 제자리인가" 를 브라우저 없이 검증합니다. ' +
            '눈으로는 미묘해서 놓치기 쉬운 종류의 버그를 값으로 고정했습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            `${conceptPure}이 DOM 없는 모델·배치 계산이고 화면은 mountConceptEditor 하나에 모였습니다. ` +
            '지도(.map)가 겪은 "화면 함수가 파일의 절반" 을 이 파일은 아직 겪지 않았습니다 — 정렬·발표·좌표 계산을 바깥에 둔 덕입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `암기 카드는 ${studyLines}로 작지만, 실은 이 문서의 알맹이인 복습 일정(다음 복습일 계산)이 자기평가 세 단계에 ` +
            '바로 매여 있습니다. 간격 반복(SRS)을 제대로 하려면 카드마다 난이도·간격 계수가 필요한데 지금은 streak 하나뿐입니다. ' +
            '나중에 일정 규칙을 바꾸면 이미 쌓인 .study 파일의 복습 이력을 어떻게 옮길지가 문제가 됩니다 — 지금 버전이 1 이므로 그때 이전 경로가 필요합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '두 문서 모두 자기 확장자로 열고 저장하는 경로를 새로 쓰지 않고 saveTextDoc 을 재사용합니다. ' +
            '.mnote → .msheet → .map → .timeline 에 이어 다섯·여섯 번째로, 이 프로젝트에서 새 문서 종류를 붙이는 방식이 완전히 굳었습니다.',
        },
      ],
    }),

    mod('concept-doc.js', {
      group: '관계도 · 암기',
      title: 'concept-doc.js — 개념 관계도 (.concept)',
      subtitle: `${conceptLines} — 모델·배치·발표 계산은 밖에, 화면은 한 함수에`,
      summary:
        '.concept 의 데이터 모델과 정규화, 네 가지 자동 정렬, 발표 순서 계산, 확대·이동 기준점 계산, ' +
        '그리고 편집기 화면이 들어 있습니다. 카드와 연결선만 다루므로 모델이 작고, 대신 "어떻게 놓을 것인가" 가 이 파일의 무게 중심입니다.',
      usage: [
        {
          title: '배치는 관계를 읽는다',
          body:
            '가계도는 원인·포함 관계의 방향을 따라 세대를 나누고, 방사형·원형·격자형은 같은 관계 목록을 다른 구조로 놓습니다. ' +
            '정렬 간격과 화면 맞춤 배율도 관계도 크기에 따라 달라집니다 — 카드가 셋일 때와 백일 때 같은 간격을 쓰면 한쪽은 텅 비고 한쪽은 겹칩니다.',
        },
        {
          title: '확대 기준점',
          body:
            '휠 확대는 커서 아래 지점을, 핀치는 두 손가락 가운데 지점을 제자리에 남깁니다. ' +
            '발표 모드는 가운데 맞춤 여백이 달라지는데도 같은 규칙을 지킵니다. 세 경우가 각각 단위 테스트로 고정돼 있습니다.',
        },
        {
          title: '화면 밖으로는 놓치지 않는다',
          body:
            '자유 이동은 사방으로 열려 있되 CONCEPT_PAN_KEEP(120px)만큼은 늘 화면에 남깁니다. ' +
            '무한 캔버스에서 관계도를 잃어버리는 상황을 값 하나로 막았습니다.',
        },
        {
          title: '카드는 화면 아래로도 자란다',
          body:
            '캔버스 기본 크기(1800×1100)보다 아래에 놓인 카드가 있으면 캔버스가 그 위치까지 늘어납니다. ' +
            '좌표를 기본 크기로 잘라 버리면 옛 파일의 카드가 사라지므로, 자르는 대신 캔버스를 넓힙니다.',
        },
      ],
      features: [
        { title: '자동 정렬 4종', body: '가계도 · 방사형 · 원형 · 격자형. 되돌리기 한 번으로 취소됩니다.' },
        { title: '발표 순서 관리', body: '중복·사라진 카드를 걷어 내고 새 카드는 뒤에 붙입니다. 애니메이션 종류를 고릅니다.' },
        { title: '표 개요', body: '카드와 관계를 표로 펼쳐 한 화면에서 고칩니다.' },
        { title: '되돌리기', body: 'MNEditHistory 소비자. 상한 35단계.' },
        { title: '복구 저장', body: '고친 것이 있으면 작업공간에 스냅샷을 남깁니다(850ms 지연).' },
      ],
      files: [
        { path: 'tests/concept-doc.test.js', label: 'concept-doc.test.js', description: '모델·정렬·발표·확대 19개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"같은 관계를 네 구조로 놓는다" 는 요구를 배치 함수 넷으로 나누고 각각을 테스트로 고정했습니다. ' +
            '정렬은 눈으로만 확인하기 쉬운 영역인데, "원인·포함 관계의 방향대로 다음 열에 놓는가" 처럼 검증 가능한 문장으로 바꿔 두었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            conceptMountShare
              ? `mountConceptEditor 가 ${conceptMount.span.toLocaleString('en-US')}줄로 파일의 ${conceptMountShare}% 입니다. ` +
                '아직 지도만큼은 아니지만 같은 방향이며, 새 기능(표 개요·발표 설정)이 들어올 때마다 이 함수가 길어집니다. ' +
                '모델·배치·발표 계산은 이미 밖에 있으니, 다음에 떼어 낼 것은 화면 조립 자체입니다.'
              : '화면 조립이 한 함수에 모여 있어, 새 기능이 들어올 때마다 그 함수가 길어집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '문서 버전이 1 입니다. 아직 이전 경로가 필요 없지만, 상한(카드 300·연결선 800)과 관계 갈래 5종은 ' +
            '나중에 바꾸면 옛 파일 해석이 달라지는 값이라 버전과 함께 봐야 합니다.',
        },
      ],
    }),

    mod('study-doc.js', {
      group: '관계도 · 암기',
      title: 'study-doc.js — 암기 카드 (.study)',
      subtitle: `${studyLines} — 이 계층에서 가장 작은 문서 종류`,
      summary:
        '.study 의 카드 모델과 정규화, 빈칸 처리, 자기평가 기록, CSV 왕복, 그리고 79줄짜리 편집기 화면이 전부입니다. ' +
        '관계도에서 넘어온 카드를 받아 복습에 쓰는 것이 주된 쓰임이라 문서 자체는 단순하게 두었습니다.',
      usage: [
        {
          title: '빈칸은 본문 안에 적는다',
          body:
            '{{정답}} 으로 감싼 부분을 가립니다. 별도 필드로 두지 않았기 때문에 문장을 고치면 빈칸도 함께 따라오고, ' +
            '한 문장에 빈칸을 여럿 둬도 정답이 순서대로 모입니다.',
        },
        {
          title: '평가는 문서에 남는다',
          body:
            '다시·어려움·좋음 세 단계와 다음 복습일이 카드마다 .study 파일에 적힙니다. ' +
            '별도 저장소가 아니라 문서 안이라, 파일을 옮기면 복습 이력도 함께 갑니다.',
        },
        {
          title: '카드 상한 1,000개',
          body:
            '사진은 한 장 900KB 까지, 그것도 data URL 형식만 받습니다. .map 의 사진 규칙과 같은 값이며, ' +
            '손으로 고친 파일이나 큰 사진 때문에 문서가 열리지 않는 상황을 막습니다.',
        },
      ],
      features: [
        { title: '카드 두 종류', body: '앞뒤 두 면(qa)과 빈칸 채우기(cloze).' },
        { title: 'CSV 왕복', body: '줄바꿈·쉼표가 든 카드도 그대로 돌아옵니다.' },
        { title: '사진', body: '카드마다 한 장. PNG·JPEG·WebP 의 data URL 만 받습니다.' },
        { title: '되돌리기', body: 'MNEditHistory 소비자. 상한 45단계.' },
      ],
      files: [
        { path: 'tests/study-doc.test.js', label: 'study-doc.test.js', description: '빈칸·자기평가·CSV·연결 4개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '작게 유지한 판단이 좋습니다. 카드 넘기기와 자기평가라는 두 동작만 하고, 화면도 79줄입니다. ' +
            '기능을 더 넣고 싶은 유혹이 큰 종류의 문서인데(통계·태그 필터·학습 그래프 …) 지금은 문서 모델이 그것을 감당할 만큼만 열려 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '단위 테스트가 4개뿐입니다. 카드 모델·빈칸·CSV 는 덮였지만 복습 일정 계산(다음 복습일)은 ' +
            '"결과와 다음 복습일을 문서에 기록한다" 한 건으로만 확인됩니다. 날짜 계산은 경계값(오늘·자정 넘김·연속 실패)에서 틀리기 쉬운 영역이라 ' +
            '카드 수보다 이쪽에 테스트를 더 두는 편이 값이 큽니다.',
        },
      ],
    }),
  ];
};
