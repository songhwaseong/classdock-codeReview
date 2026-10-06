// 7. document-editors · 8. learning-tools — 교실 놀이 도구.
// 티어표(.tier) · 대진표(.bracket) · 복불복(.pick, 게임 pick-*.js) 은 document-editors, 로또·연금복권 번호 뽑기(lotto.js)는 learning-tools.
//
// 넷이 같은 결 — 사진·글 카드나 명단을 놓고 "고르기·뽑기" 를 하는 교실용 놀이 — 이라 한 파일에서 함께 읽는다.
// 계층이 둘로 갈려 사이드바에서는 각 계층 안의 "놀이 도구" 묶음으로 나뉘어 보인다.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const G = '놀이 도구';
  const gameFiles = manifest.localScripts.filter((file) => /^pick-[a-z]+\.js$/.test(file));
  const gameLines = gameFiles.reduce((sum, file) => {
    const label = linesLabel(rootDir, `src/js/${file}`);
    return sum + (Number(label.replace(/[^0-9]/g, '')) || 0);
  }, 0);

  return [
    sec({
      id: 'play-overview',
      category: '7. document-editors',
      group: G,
      title: '놀이 도구 개요 — 티어표 · 대진표 · 복불복 · 번호 뽑기',
      subtitle: '카드와 명단으로 고르고 뽑는 교실 놀이 — 결과는 파일을 바꾸지 않는다',
      summary:
        '사진·글 카드를 등급 줄에 올리는 티어표, 토너먼트 나무에서 이긴 쪽을 올려 보내는 대진표, 명단 하나로 룰렛·사다리·구슬 경주 등 ' +
        `${gameFiles.length}가지 뽑기를 돌리는 복불복, 그리고 로또·연금복권 번호 뽑기입니다. 앞의 셋은 JSON 문서(.tier · .bracket · .pick)이고 사진은 작게 줄여 data URL 로 담으며, ` +
        '이미지 줄이기·아이콘 같은 공용 조각은 tier-list.js 에 두고 대진표·복불복이 가져다 씁니다.',
      usage: [
        {
          title: '놀이 결과로 파일이 바뀌지 않게',
          body:
            '티어표의 월드컵 진행, 복불복의 뽑힌 결과는 화면에만 둡니다. 파일에는 카드·명단·설정만 담아, 수업 시간에 몇 번을 돌려도 문서가 "저장 안 됨" 이 되지 않고 다음 반에서 같은 파일을 그대로 씁니다. ' +
            '대진표만은 경기 결과가 문서의 내용이라 저장합니다.',
        },
        {
          title: '공정함을 먼저 정하고 연출은 맞춘다',
          body:
            '복불복은 뽑기 결과를 crypto 난수로 먼저 정하고 움직임을 그 결과에 맞춥니다 — 구슬 경주는 순위를 먼저 섞은 뒤 등수마다 도착 시각을 주고, 진행도를 뒤로 가지 않게 흔들어 중간에 앞뒤가 바뀌어 보이게 합니다. ' +
            '로또는 모든 조합에 순번을 매겨 그 순번을 고르게 뽑습니다. 화면에는 "모든 조합의 당첨 확률은 같습니다" 를 적습니다.',
        },
      ],
      features: [
        { title: '티어표 (.tier)', body: 'S·A·B·C·D 줄, 카드 끌어 올리기·숫자 키, 줄 끌어 옮기기·비우기, 월드컵(둘 중 하나 고르기)으로 순위를 매겨 줄에 놓기, PNG.' },
        { title: '대진표 (.bracket)', body: '2~128칸, 씨드 차례·부전승, 모양 6가지(양쪽·한쪽·아래→위 …)·배경 템플릿, 점수, PNG.' },
        { title: '복불복 (.pick)', body: `명단 100명, 게임 ${gameFiles.length}가지(룰렛·사다리·카드·슬롯·구슬·캡슐·주사위·공·폭탄·스크래치 …), 결과 창·효과음·색종이.` },
        { title: '번호 뽑기', body: '로또 6/45(1~5게임, 제외 번호·직전 회차 제외·공통 번호), 연금복권(조 + 여섯 자리). 기록은 브라우저에.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"연출이 어떻든 확률은 모두 같다" 를 구조로 지켰습니다. 결과를 먼저 정하므로 물리 계산이나 애니메이션의 버릇이 확률을 비틀 길이 없고, 테스트가 "뽑기는 0~n-1 을 고르게" · "구슬 진행도의 기울기는 늘 0 보다 크다" 를 확인합니다. ' +
            '교실에서 "저 게임은 앞사람이 유리하다" 는 말이 나오지 않게 하는 설계입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '토너먼트가 두 벌 있습니다 — 티어표의 월드컵(화면에만, 섞은 뒤 홀수 판은 맨 끝 카드 부전승)과 대진표(문서에 저장, 2의 거듭제곱 칸·씨드 차례로 부전승을 흩음). 쓰임이 달라 둘 다 맞는 선택이지만, ' +
            '"강" 이름 짓기·부전승 규칙이 두 곳에 따로 있어 한쪽만 고치면 같은 낱말이 다른 뜻이 됩니다.',
        },
      ],
    }),

    mod('tier-list.js', {
      group: G,
      title: 'tier-list.js — 티어표 (.tier)',
      subtitle: '카드를 등급 줄에 올려 순서를 매기는 문서 — 놀이 도구의 공용 조각도 여기',
      summary:
        '아래 카드 모음(사진·글)을 끌어 S·A·B·C·D 같은 줄에 올립니다. 카드 차례는 items 배열 순서 그대로이고 tier 가 "" 인 카드가 아직 안 올린 모음입니다. ' +
        '사진은 긴 변 360px 로 줄여 data URL 로 담습니다(카드 한 장 400KB 상한). 월드컵은 카드 둘 중 하나를 골라 올라가며 우승을 뽑고, 끝나면 결과를 줄에 놓을지만 고릅니다.',
      usage: [
        {
          title: '읽을 때 믿지 않는다',
          body: '빈 카드·겹친 id 는 버리고, 없는 줄을 가리키는 카드는 아래 모음으로 내립니다. 줄을 비우거나 지워도 카드는 모음에 남고, 마지막 한 줄은 지울 수 없습니다.',
        },
        {
          title: '화면과 PNG 가 같은 경로 글',
          body: '줄 이름 칸의 왕관·별·새싹·보석은 SVG(화면)와 Path2D(PNG)가 같은 경로 문자열을 씁니다. 대진표의 우승 왕관도 이 표를 빌립니다.',
        },
      ],
      files: [
        { path: 'tests/tier-list.test.js', label: 'tier-list.test.js', description: '새 문서·JSON 왕복·읽기 정리·카드 옮기기·줄 지우기·월드컵' },
        { path: 'tests/e2e/tier-list.spec.js', label: 'tier-list.spec.js', description: '끌어 올리기·숫자 키·되돌리기·사진 여러 장·줄 옮기기·검색' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            '공용 조각(tierPrepareImage · TIER_ICON_PATHS 등)이 "티어표" 라는 이름의 파일에 있어, 대진표·복불복이 manifest 의존으로 tier-list.js 를 끌어갑니다. 티어표를 고치다 이 함수의 모양을 바꾸면 다른 두 문서가 깨지는데, ' +
            '그 사실이 파일 이름으로는 보이지 않습니다. 놀이 공용 파일로 떼거나 moduleBoundaries 에 소비자를 적어 두는 편이 맞습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '사진을 JSON 안 data URL 로 담고 0.7초마다 복구본을 씁니다. 카드 400장 상한까지 가면 문서가 수십 MB 가 되고 편집마다 그 전체를 다시 직렬화합니다. 일기장이 같은 이유로 ZIP + 자산을 고른 것과 다른 선택인데, ' +
            '카드 사진을 360px 로 작게 줄이는 것으로 대부분의 교실 쓰임에서는 충분히 가볍게 유지됩니다.',
        },
      ],
    }),

    mod('bracket.js', {
      group: G,
      title: 'bracket.js — 대진표 (.bracket)',
      subtitle: '토너먼트 나무 하나를 계산하고 모양만 바꿔 그린다',
      summary:
        '참가자를 토너먼트 나무에 놓고 이긴 쪽 카드를 눌러 한 칸씩 올려 보냅니다. 나무는 늘 2의 거듭제곱 칸(2~128)이고 빈 칸은 부전승입니다. ' +
        '1회전 자리는 slots, 경기 결과는 results["회전:번호"] 로 두고, 결과에는 그 경기의 두 참가자를 함께 적습니다.',
      usage: [
        {
          title: '앞 경기가 바뀌면 뒤 결과는 저절로 무효',
          body:
            '결과에 두 참가자(a·b)를 함께 적어 두었기 때문에, 앞 경기 승자를 바꾸면 그 사람이 올라가 있던 뒤 경기 결과가 더는 맞지 않아 bracketPrune 이 지웁니다. ' +
            '"누가 이겼나" 만 적었다면 바뀐 참가자에게 옛 결과가 붙어 남았을 자리입니다.',
        },
        {
          title: '씨드와 부전승',
          body: '씨드 차례는 1·2번이 결승에서야 만나게 놓고, 빈 칸은 높은 씨드 쪽에 흩어 둡니다. 참가자가 칸보다 많아지면 두 배로 키워 128명까지 받습니다.',
        },
        {
          title: '모양은 좌표 변환만',
          body: '양쪽에서 가운데로·한쪽·아래→위·위아래에서 가운데로 등 모양 여섯은 같은 나무를 "몇 회전 × 몇 번째" 로 한 번 계산한 뒤 화면 좌표로 옮기는 방법만 다릅니다(bracketGeometry).',
        },
      ],
      files: [
        { path: 'tests/bracket.test.js', label: 'bracket.test.js', description: '씨드 차례·부전승·키우기·올려 보내기·뒤 결과 무효' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '결과에 "이긴 사람" 이 아니라 "누구와 누구의 경기에서 이긴 사람" 을 적은 자료 설계 하나로, 승자 바꾸기·참가자 바꾸기·되돌리기가 모두 같은 정리(prune) 한 곳으로 풀립니다.',
        },
      ],
    }),

    mod('pick.js', {
      group: G,
      title: 'pick.js — 복불복 (.pick)',
      subtitle: '명단 하나로 여러 뽑기 — 게임은 pick-*.js 가 스스로 올라온다',
      summary:
        '참가자 명단 하나로 여러 뽑기 게임을 돌리는 문서입니다. 파일엔 명단·고른 게임·게임별 설정만 담고 결과는 화면에만 둡니다. ' +
        '이 파일은 명단·머리말·결과 창·효과음·색종이와 공용 난수(pickCryptoRandom · pickRandomInt · pickShuffle)를 맡고, 게임 몸체는 pick-*.js 가 PICK_GAME_IMPL 에 { mount } 로 올립니다. ' +
        '몸체가 아직 없는 게임은 메뉴에 나오지 않습니다.',
      usage: [
        {
          title: '모르는 게임 설정도 들고 간다',
          body:
            '옛 앱이 새 게임이 든 파일을 열어 저장해도 그 설정이 사라지지 않게, 모르는 게임의 설정은 JSON 으로 2만 자 이하이면 그대로 들고 갑니다. 그래서 게임을 더해도 파일 판을 올리지 않습니다.',
        },
        {
          title: '게임과 문서 사이의 창구',
          body: '게임은 api.active()·settings()·setSettings()·isBusy()·refresh() 같은 창구로만 문서와 말합니다. 바쁜 동안(뽑는 중)에는 설정을 바꾸지 못하게 게임이 스스로 막습니다.',
        },
      ],
      files: [
        { path: 'tests/pick.test.js', label: 'pick.test.js', description: '명단 JSON·모르는 게임 설정 보존·색 돌리기·고른 난수·게임별 규칙' },
        { path: 'tests/pick-screen.test.js', label: 'pick-screen.test.js', description: '게임마다 열자마자 붙고 결과 창에 명단의 사람이 나오는지' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"모르는 것은 버리지 않고 들고 간다" 는 앞으로의 호환을 테스트로 못 박았습니다("옛 앱이 저장해도 새 게임 설정이 남게"). 일기장·여행일지가 새 값마다 파일 판을 올려 옛 앱이 새 파일을 거절하게 하는 것과 대조되는, ' +
            '같은 앱 안의 더 나은 선례입니다 — 크기 상한을 두어 이상한 파일이 덩치를 키우지 못하게 한 것까지 맞습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '공용 난수 pickCryptoRandom 이 있는데 게임 파일마다 pickXxxRandom 을 따로 두고 "없으면 Math.random" 으로 물러섭니다. pick.js 가 늘 먼저 로드되므로 물러설 일은 없지만, 같은 세 줄이 게임 수만큼 복사돼 있습니다.',
        },
      ],
    }),

    sec({
      id: 'pick-games',
      category: '7. document-editors',
      group: G,
      title: `복불복 게임 ${gameFiles.length}가지 (pick-*.js)`,
      subtitle: `게임 하나 = 파일 하나, 모두 합쳐 ${gameLines.toLocaleString('en-US')}줄 — PICK_GAME_IMPL 에 스스로 올라온다`,
      summary:
        '게임마다 normalize(설정 정리)·mount(api) 를 내놓는 작은 파일입니다. 당첨 수를 고르는 게임(카드·스크래치·풍선·사다리 등)은 당첨 카드 뭉치를 crypto 로 먼저 섞어 나눠 주고, ' +
        '차례로 굴리는 게임(주사위·빙고 등)은 굴릴 때마다 고른 난수를 씁니다. 구슬 경주는 물리 계산 없이 순위를 먼저 정한 뒤 진행도를 수식으로 흔듭니다.',
      files: gameFiles.map((file) => ({ path: `src/js/${file}`, label: file, description: '게임 몸체' })),
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '게임을 더하는 비용이 파일 하나와 manifest 한 줄입니다. 문서·결과 창·효과음은 손대지 않고, 몸체가 없으면 메뉴에서 저절로 빠지므로 반쯤 만든 게임이 사용자에게 보이지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `게임 ${gameFiles.length}개가 모두 시작 스크립트로 실립니다. 복불복 문서를 열지 않는 사용자도 매번 이 파일들을 읽고 파싱하는데, 같은 앱이 PDF 외의 큰 라이브러리를 lazy.js 로 미뤄 첫 화면을 줄인 것과 반대 방향입니다. ` +
            '게임 몸체는 PICK_GAME_IMPL 에 스스로 올라오는 구조라 지연 묶음 하나로 옮기기 쉬운 자리입니다.',
        },
      ],
    }),

    mod('lotto.js', {
      group: G,
      title: 'lotto.js — 로또·연금복권 번호 뽑기 (MNLotto · MNPension)',
      subtitle: '모든 조합에 순번을 매겨 고르게 뽑는다',
      summary:
        '로또 6/45 는 후보 번호(제외 번호·직전 회차 제외·공통 번호 조건을 반영한 것)의 모든 6개 조합에 순번을 매기고, 그 순번을 겹치지 않게 고르게 뽑아 조합으로 되돌립니다. ' +
        '연금복권은 조(1~5)와 여섯 자리를 순번 하나로 묶어 같은 방식으로 뽑습니다. 화면과 같은 규칙을 Node 에서도 검사할 수 있는 순수 모델이고, 기록은 브라우저에 둡니다.',
      files: [
        { path: 'tests/lotto.test.js', label: 'lotto.test.js', description: '서로 다른 6개·겹치지 않는 조합·순번 ↔ 조합 복원·제외 조건' },
        { path: 'tests/e2e/lotto-layout.spec.js', label: 'lotto-layout.spec.js', description: '배치·확대·5게임·저장·기록 복원·오프라인 HTML' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"번호를 하나씩 뽑고 겹치면 다시" 대신 조합 순번을 고르게 뽑아, 조건이 빡빡해 후보가 적어도 재시도 없이 끝나고 모든 조합의 확률이 정확히 같습니다. 정수 난수는 거절 표본으로 치우침을 없앴고, ' +
            '조합이 모자라면 "서로 다른 조합이 n 개뿐" 이라고 정확한 수를 알려 줍니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '교실 앱 안에서 실제 복권 상품 이름(로또 6/45 · 연금복권 720+)을 그대로 쓰고, 회차 기록·직전 회차 제외처럼 실제 복권을 사는 쓰임을 전제로 한 기능입니다. 조합·확률 수업의 재료로는 좋은 구현이지만, 학생이 쓰는 앱이라는 맥락에서 ' +
            '"확률이 모두 같다" 에 더해 기댓값(산 만큼 돌려받지 못한다)을 보여 주는 쪽이 이 앱의 결에 더 맞습니다.',
        },
      ],
    }),
  ];
};
