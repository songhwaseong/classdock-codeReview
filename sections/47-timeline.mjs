// 5. document-editors — 연대표 문서(.timeline). timeline.js 한 파일.
//
// document-editors 계층이지만 40-editors.mjs 가 이미 두껍고 이 파일 하나가 1,900줄대라
// 지도(45-map.mjs)와 같은 방식으로 떼어 둔다. 카테고리는 같으므로 사이드바에서는
// document-editors 안의 "연대표" 묶음으로 이어 붙는다.

import { linesLabel, topLevelFunctionSpan, functionShare } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  // 줄 수와 "한 함수가 파일의 몇 %인가" 는 생성 때 잰다(lib/source-metrics.mjs).
  const timelineLines = linesLabel(rootDir, 'src/js/timeline.js');
  const mount = topLevelFunctionSpan(rootDir, 'src/js/timeline.js', 'mountTimelineEditor');
  const mountShare = functionShare(rootDir, 'src/js/timeline.js', 'mountTimelineEditor');
  const mountLabel = mount
    ? `${mount.span.toLocaleString('en-US')}줄(${mount.start}–${mount.end})`
    : '한 함수';
  const pureLabel = mount ? `앞쪽 ${(mount.start - 1).toLocaleString('en-US')}줄` : '앞쪽 절반';

  return [
    sec({
      id: 'timeline-overview',
      category: '5. document-editors',
      group: '연대표',
      title: '연대표 문서 개요 (.timeline)',
      subtitle: '기원전부터 오늘까지 한 축에 — 그리고 같은 화면이 여행 일정표가 된다',
      summary:
        '사건과 기간을 시간 축에 늘어놓고 제목·설명·분류·사진·장소를 붙여, 인터넷 없이 만들고 발표하는 수업용 문서입니다. ' +
        '.timeline 은 사건 배열과 보기 방식을 담은 JSON 이라 통합 검색·되돌아 열기·복구 저장이 다른 문서와 똑같이 동작합니다. ' +
        '같은 편집기가 문서 용도(purpose)만 바꿔 "일반 연대표"와 "여행 일정" 두 얼굴로 쓰입니다 — ' +
        '역사 수업의 연표와 수학여행 일정표는 "시간 순서로 늘어선 항목"이라는 점에서 같은 자료이기 때문입니다.',
      usage: [
        {
          title: '기원전을 라이브러리 없이 정렬한다',
          body:
            '날짜 칸은 2026 · 2026-08 · 2026-08-20 · 2026-08-20 09:30 뿐 아니라 "기원전 300" · "BC 300" 도 받습니다. ' +
            'timelineParseDate 가 이것을 천문학적 연도(기원전 1년 = 0년)로 환산해 하나의 정렬 가능한 수로 바꿉니다. ' +
            'Date 객체는 기원전을 다루지 못하고 별도 달력 라이브러리를 넣으면 오프라인 원칙과 시작 비용이 걸리는데, ' +
            '"정렬만 되면 된다"로 문제를 좁혀 상수 하나짜리 환산으로 끝냈습니다. "약 300년" 같은 어림 표기(약·경·~·c.)도 여기서 함께 걷어 냅니다.',
        },
        {
          title: '보기 방식은 보기 상태가 아니라 자료다',
          body:
            '균등 보기(읽기 좋게 같은 간격)와 시간 비례 보기(실제 간격대로)를 문서에 저장합니다. ' +
            '지도가 중심 좌표·확대를 "고친 것"으로 세지 않는 것과 반대 방향의 판단인데, 이유는 파일 첫머리 주석에 있습니다 — ' +
            '연표에서 "간격을 어떻게 보여 줄 것인가"는 화면 상태가 아니라 자료를 만든 사람의 의도라는 것입니다. ' +
            '반면 배율(zoom)과 개요 열림 여부는 저장하지 않습니다.',
        },
        {
          title: '표 들이기가 이 문서의 진짜 입구',
          body:
            '사건을 한 건씩 손으로 넣는 것보다, 이미 있는 표를 가져오는 쪽이 수업 준비의 실제 모습입니다. ' +
            'CSV 와 엑셀(.xlsx) 을 같은 단추로 받고, 열 이름 해석·날짜 검사·건너뛴 줄 세기까지 timelineEventsFromRows 한 곳에서 처리합니다 — ' +
            'CSV 든 엑셀이든 "칸 값이 담긴 2차원 배열"까지 오면 같은 자료라는 판단입니다.',
        },
        {
          title: '엑셀 한 파일로 사진까지 들어온다',
          body:
            'xlsx 는 ZIP 이고 시트에 붙인 사진은 xl/media/ 에 원본으로, 어느 칸에 놓였는지는 그림 앵커에 남습니다. ' +
            'ExcelJS 는 표 편집에서 이미 쓰는 번들이라 새 라이브러리 없이 둘 다 읽습니다. ' +
            '덕분에 예전의 "CSV 를 넣고 → 이미지 폴더를 따로 고른다" 두 단계가 엑셀 파일 하나로 끝납니다. ' +
            '파일명으로 사진을 잇는 옛 경로(이미지 폴더)도 그대로 남아 있어 CSV 로 만든 자료는 계속 쓸 수 있습니다.',
        },
        {
          title: '지도와는 이름으로만 이어진다',
          body:
            '사건에 적은 장소 이름·주소를 누르면 globalThis.searchMapForPlace 로 지도 문서를 열어 그 자리를 찾습니다. ' +
            '연대표가 좌표를 들고 있지 않고 지도 모듈을 직접 부르지도 않습니다 — 실행 시점에 함수가 있는지 확인하고, ' +
            '없으면 안내만 띄웁니다. 지도 없이도 연대표가 그대로 동작하고, 지도 쪽 구현이 바뀌어도 이 파일은 영향을 받지 않습니다.',
        },
        {
          title: '앱 본체에 남긴 자국',
          body:
            'classdock.html 의 script 한 줄, manifest 의 계층·의존 선언, document-types.js 의 kind 두 줄(뱃지 "연표" 와 아이콘 갈래), ' +
            'file-loaders.js 의 확장자 분기, documents.js 의 새 문서 메뉴, lazy.js 는 건드리지 않았습니다. ' +
            `${timelineLines}짜리 문서 종류를 붙이면서 기존 파일에 남긴 자국이 이 정도입니다 — .map 이 닦아 둔 "새 문서 종류" 경로를 그대로 따랐습니다.`,
        },
      ],
      features: [
        { title: '사건과 기간', body: '한 시점(사건)과 시작–끝(기간)을 같은 축에 놓습니다. 색은 분류별로 자동 배정되고 목록에서 검색·선택할 수 있습니다.' },
        { title: '두 가지 보기', body: '균등(읽기 좋게) · 시간 비례(실제 간격대로). 배율 0.55~2.2배, 배경 드래그로 이동, ▤ 개요로 전체를 한 화면에.' },
        { title: '발표 모드', body: '▶ 발표 가 사건을 한 장씩 크게 넘깁니다. 사진·설명·장소가 함께 뜨고 자판 ←/→ 로 넘어갑니다.' },
        { title: '표 왕복', body: 'CSV·엑셀로 들이고, CSV·엑셀(사진 포함)로 내보냅니다. 내보낸 xlsx 를 그대로 다시 들일 수 있습니다.' },
        { title: '인쇄', body: '가로 축 대신 세로 목록으로 다시 짜서 인쇄합니다 — 종이는 가로로 길지 않기 때문입니다.' },
        { title: '여행 일정', body: '문서 용도를 바꾸면 "사건 → 일정", "유적지 → 장소" 처럼 화면 낱말이 통째로 갈아 끼워집니다.' },
      ],
      files: [
        { path: 'tests/timeline.test.js', label: 'timeline.test.js', description: '날짜 파싱·정렬·배치·왕복 21개' },
        { path: 'tests/timeline-xlsx.test.js', label: 'timeline-xlsx.test.js', description: '엑셀 칸 값·시트 그림·표 왕복 6개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '한 화면 안에서 용도를 바꾸는 방식을 "비슷한 문서 종류를 하나 더 만들기"로 풀지 않았습니다. ' +
            'purpose 값 하나와 applyPurposeLabels 로 낱말만 갈아 끼우므로, 날짜 파싱·정렬·배치·표 왕복·발표·인쇄가 두 벌로 갈라지지 않습니다. ' +
            '여행 일정에서 버그가 고쳐지면 연대표에서도 함께 고쳐집니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '사진은 base64 로 문서 안에 들어갑니다. 한 장 900KB · 한 문서 40MB 상한이고, 상한 라벨(TIMELINE_PHOTO_TOTAL_LABEL)은 ' +
            '상수에서 계산해 만들어 화면 안내와 상수가 어긋나지 않습니다. 지도(.map)의 12MB 보다 큰 것은 연표가 사건마다 사진을 붙이는 문서이기 때문입니다.',
        },
      ],
    }),

    mod('timeline.js', {
      group: '연대표',
      title: 'timeline.js — 연대표 문서 (.timeline)',
      subtitle: '날짜 파싱·정렬·배치 계산·표 왕복·편집기를 한 파일에',
      summary:
        '.timeline 의 데이터 모델과 정규화, 기원전을 포함한 날짜 파싱, 시간순 정렬과 수동 순서, ' +
        '균등·시간 비례 배치 계산, CSV·엑셀 왕복(시트 그림 포함), 그리고 편집기 화면 전체가 들어 있습니다. ' +
        `${pureLabel}은 DOM 을 만들지 않는 순수 함수라 node --test 로 검증되고, 뒤쪽은 mountTimelineEditor 한 함수입니다.`,
      usage: [
        {
          title: '되돌리기 스냅샷에서 사진을 뺐다',
          body:
            '사진 한 장이 최대 900KB(base64)이고 한 문서에 수십 장이 들어갑니다. 되돌리기 80단계와 ' +
            '"고친 것이 있는가" 판정(타자 한 글자마다 돕니다)이 이 바이트를 매번 문자열로 뜨면 문서 하나로 수백 MB 를 씁니다. ' +
            'timelineSnapshot 은 사진을 뺀 값만 JSON 으로 만들고 사진은 배열에 객체 참조로만 담습니다 — ' +
            '사진을 바꾸면 정규화가 새 객체를 만들므로 참조 비교(===)만으로 정확히 잡힙니다. ' +
            '"비교를 위해 복사한다"를 "비교를 위해 참조만 든다"로 바꾼 자리이고, 그 근거가 함수 위 주석에 그대로 있습니다.',
        },
        {
          title: '같은 시각일 때만 손으로 순서를 바꾼다',
          body:
            'timelineCanMoveEvent 가 ↑/↓ 를 같은 날짜·시각 안에서만 허용합니다. ' +
            '다른 시각끼리 순서를 바꿀 수 있게 하면 "시간순"이라는 이 문서의 유일한 약속이 깨지고, ' +
            '정렬을 한 번 더 돌리는 순간 사용자가 만든 순서가 조용히 사라집니다. 바꿀 수 없는 상황에서는 단추 자체가 꺼집니다.',
        },
        {
          title: '배치 계산을 화면에서 떼어 냈다',
          body:
            'timelineLayoutEntries(상세 보기)와 timelineOverviewEntries(개요)는 사건 배열·보기 방식·배율만 받아 좌표를 돌려주는 순수 함수입니다. ' +
            '시간 비례 보기에서 "실제 간격은 보존하되 날짜가 붙어 있는 사건이 겹쳐 읽히지 않게" 하는 규칙, ' +
            '개요에서 "한 화면 폭 안에 모든 점을 넣고 높이를 엇갈리게" 하는 규칙이 전부 여기 있어 브라우저 없이 검증됩니다.',
        },
        {
          title: '엑셀 칸 값은 글자로 풀어 읽는다',
          body:
            'timelineCellText 가 Date · 수식 결과 · 서식 글자(richText) · 하이퍼링크를 모두 문자열로 내립니다. ' +
            '엑셀 칸은 "보이는 것"과 "들어 있는 것"이 다른 경우가 많아, 이 정규화가 없으면 날짜 칸이 [object Object] 로 들어옵니다. ' +
            '계산되지 않은 수식은 빈 칸으로 둡니다 — 값 대신 수식 문자열이 사건 제목이 되는 쪽이 더 나쁩니다.',
        },
        {
          title: '시트 그림은 왼쪽 위 줄로 붙인다',
          body:
            '그림 앵커의 nativeRow 는 0부터 센 줄 번호라 timelineSheetRows 의 첨자와 그대로 맞습니다. ' +
            '여러 줄에 걸친 그림은 왼쪽 위가 놓인 줄로 보고, 한 줄에 여러 장이면 첫 장만 씁니다(사건당 사진 한 장). ' +
            'emf·wmf·gif 는 사진으로 쓰지 않고 건너뜁니다.',
        },
        {
          title: '들이기 결과를 숫자로 되돌려 준다',
          body:
            '가져온 개수, 날짜/제목이 잘못돼 건너뛴 줄 수, 시트 사진 연결 수, 사진 처리 실패 수, ' +
            '40MB 상한에 걸려 빠진 수, 파일명만 있어 [이미지 폴더]가 필요한 수를 한 줄로 모아 알립니다. ' +
            '조용히 일부만 들어오는 것이 표 들이기에서 가장 흔한 사고인데, 그 자리를 숫자로 막아 두었습니다.',
        },
      ],
      features: [
        { title: '순수 계산부', body: '날짜 파싱·형식화, 정렬과 수동 이동 가능 여부, 상세·개요 배치, CSV 파싱·직렬화, 행 → 사건 변환, 사진 총량 계산.' },
        { title: '사진 담기', body: '긴 변 1280px·JPEG 로 줄여 담습니다. 한 장 900KB · 한 문서 40MB 상한이며 넘치는 장수를 세어 알립니다.' },
        { title: '이미지 폴더', body: 'CSV 의 이미지 파일명과 폴더를 잇습니다. webkitRelativePath 맨 앞의 선택 폴더 이름을 벗겨 전체 경로·파일명 둘 다로 찾습니다.' },
        { title: '우클릭 메뉴', body: '편집 · 앞/뒤 순서 · 지도에서 검색 · 삭제. 자판(Esc·방향키)으로도 닫고 옮길 수 있습니다.' },
        { title: '복구 저장', body: '고친 것이 있으면 900ms 뒤 작업공간에 스냅샷을 남깁니다. 타자 중에는 550ms 로 미뤄 한 글자마다 저장하지 않습니다.' },
        { title: '탭을 닫으면', body: 'ResizeObserver·전역 키 리스너·발표 모드·우클릭 메뉴 리스너를 모두 떼고 doc.printTimeline 같은 바깥 훅도 되돌립니다.' },
      ],
      files: [
        { path: 'tests/timeline.test.js', label: 'timeline.test.js', description: '날짜·정렬·배치·왕복 21개' },
        { path: 'tests/timeline-xlsx.test.js', label: 'timeline-xlsx.test.js', description: '엑셀 읽기·쓰기 6개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'module.exports 로 순수 함수 25개를 내보내 브라우저 없이 검증합니다. ' +
            '날짜 파싱·정렬·배치처럼 "틀리면 수업에서 바로 드러나는" 계산이 전부 이쪽에 있고, ' +
            `DOM 이 필요한 부분만 mountTimelineEditor 안에 남겼습니다. ${timelineLines} UI 파일치고 테스트 가능한 표면이 넓습니다.`,
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '엑셀 읽기에 새 라이브러리를 들이지 않았습니다. 표 편집이 이미 쓰는 ExcelJS 번들을 MNLazy.tryNeed("exceljs") 로 그대로 빌려 씁니다. ' +
            '시작 비용이 0 이고, 준비가 안 됐으면 xlsx-runtime 으로 갈라 "잠시 뒤 다시" 라고 안내합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `mountTimelineEditor 가 ${mountLabel}${mountShare ? `, 파일의 ${mountShare}%` : ''}입니다. ` +
            '화면 상태(배율·선택·발표 위치·이력·도킹)가 전부 이 함수의 지역 변수라, 기능을 붙일 때마다 함수가 길어지는 것 말고는 선택지가 없습니다. ' +
            'map-viewer.js 의 mountMapEditor 와 똑같은 모양이고, 지도가 그랬듯 이 파일도 상한(MAX_LINES) 쪽으로 자라는 파일입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 파일은 moduleBoundaries 에 공개 API 로 등록돼 있지 않은데 바깥에서 부르는 이름을 만듭니다 — ' +
            'loadTimelineDoc(file-loaders.js), newTimelineScratch·newTimelineScratchInFolder(documents.js), saveTimelineDoc. ' +
            'check-source.js 의 경계 검사(선언이 있는지 · 소비자가 정말 쓰는지 · 로드 순서가 맞는지)를 이 이름들은 받지 못합니다. ' +
            'map-viewer.js 와 같은 빈틈이고, 이제 두 번째입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '사건 상한이 1,000개입니다. 표를 들일 때 남은 자리만큼만 받고, 한 건도 못 넣으면 event-limit 으로 갈라 ' +
            '"최대 1,000개까지" 라고 알립니다. 상한을 넘긴 줄이 조용히 사라지지 않습니다.',
        },
      ],
    }),
  ];
};
