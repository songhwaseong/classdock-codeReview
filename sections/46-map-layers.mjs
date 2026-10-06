// 7. document-editors — 지도 위에 얹는 "지금 이 순간" 층과 도우미들.
// 항공(flight-*) · 여객선(ship-*) · 날씨(weather-*) · 장날(market-days) · 주변 교통(nearby-transit) ·
// KOSIS 색칠 지도(kosis-*) · 한국 평면 좌표(korea-coords).
//
// 모두 map-viewer.js 가 mount 하는 별도 파일이라 45-map.mjs 에서 떼어 둔다. 실시간 버스·지하철(45-map.mjs)과
// 같은 모양 — mount({ map, stage, toolRow, doc, t, movePanel }) → { freeze, captureNote, … } — 을 따른다.
// 카테고리가 같으므로 사이드바에서는 document-editors 안의 "지도" 묶음으로 이어 붙는다.
// 런처 쪽 대리 수신(/flight-* · /ship-* · /weather-* · /market-days · /kosis · /world-wind-*)은 60-desktop.mjs 에서 본다.

import { readFileSync } from 'node:fs';
import path from 'node:path';

// map-viewer.js 가 손으로 나열한 캡처 목록에 어떤 층이 들어 있는지 생성 때 센다 — 층이 늘 때마다 낡는 문장이라서다.
const captureList = (rootDir) => {
  try {
    const source = readFileSync(path.join(rootDir, 'src/js/map-viewer.js'), 'utf8');
    const notes = [...source.matchAll(/(\w+) && \1\.captureNote\(\)/g)].map((m) => m[1]);
    const freezes = [...source.matchAll(/const resume\w* = (\w+) \? \1\.freeze\(\)/g)].map((m) => m[1]);
    return { notes, freezes };
  } catch {
    return null;
  }
};

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const G = '지도';
  const LAYER_FILES = [
    'flight-api.js', 'flight-map.js', 'ship-ports-data.js', 'ship-api.js', 'ship-map.js',
    'weather-api.js', 'weather-map.js', 'weather-typhoon.js', 'weather-wind.js',
    'market-days.js', 'nearby-transit.js', 'kosis-api.js', 'kosis-choro.js', 'korea-coords.js',
  ];
  const registered = LAYER_FILES.filter((file) => (manifest.moduleBoundaries ?? []).some((item) => item.file === file)).length;
  const capture = captureList(rootDir);
  const mapDeps = (manifest.scriptDependencies ?? {})['map-viewer.js'] ?? [];

  return [
    sec({
      id: 'map-layers-overview',
      category: '7. document-editors',
      group: G,
      title: '지도 확장 층 개요 — 항공 · 여객선 · 날씨 · 장날 · 주변 교통 · 통계',
      subtitle: '한 모양의 mount 로 붙이고, 문서에는 아무것도 쓰지 않는다',
      summary:
        '실시간 버스 다음으로 지도에 붙은 층들입니다. 공항 운항 게시판을 노선 선으로, 여객선 시간표를 항구 사이 점선으로, 기상청 예보·태풍·바람을 딱지와 입자로, ' +
        '오늘 장이 서는 전통시장을 점으로, 화면 둘레의 역·정류장을 자동으로 보입니다. KOSIS 는 색칠 지도에 값을 대 주고, korea-coords 는 평면 좌표 표를 위경도로 바꿉니다. ' +
        '바람의 한국 둘레 격자(Open-Meteo)만 빼면 모든 바깥 조회는 런처를 거치고, 공공데이터포털 키 하나를 버스와 함께 씁니다.',
      usage: [
        {
          title: '같은 모양으로 붙인다',
          body:
            '각 층은 mount({ map, stage, toolRow, doc, t, movePanel }) 하나를 내놓고 도구막대 단추·떠 있는 패널·Leaflet pane 을 스스로 만들고 거둡니다. ' +
            'map-viewer.js 는 typeof 로 있으면 붙이고, 캡처 때 freeze() 로 멈추고 captureNote() 로 출처·수신 시각을 받아 그림 아래에 새깁니다. 버스 층(jeju-bus-map.js)이 처음 정한 모양을 그대로 따랐습니다.',
        },
        {
          title: '문서에 남기지 않는다',
          body:
            '운항 게시판·시간표·예보·장날은 지금 이 순간의 값이라 .map 에 담으면 다음에 열 때 어제 것이 되살아납니다. 켜 둔 상태조차 문서가 아니라 이 브라우저에 두고, ' +
            '표시 목록·CSV·되돌리기·자동 저장에도 닿지 않습니다. 캡처(칠판·PNG·인쇄)에만 그 순간이 남습니다.',
        },
        {
          title: '응답의 함정을 머리말에 실측으로',
          body:
            '파일마다 머리말이 "2026-09-19 실측" 으로 시작합니다 — 항공 API 는 한 쪽 100줄이 넘으면 HTTP 200 에 게이트웨이 오류를 주고, 여객선 도착 시각은 여러 섬을 들르면 모두 같은 값이며, ' +
            '기상청 실황에는 하늘 상태가 없고, KOSIS 시군구 이름은 시도 없이 "중구" 로 옵니다. 테스트가 그 실측 응답을 fixture 로 다시 읽습니다.',
        },
      ],
      features: [
        { title: '항공', body: '공항 하나의 출발·도착 게시판 → 상대 공항마다 선 하나(굵기 = 편수, 색 = 지연·결항). 편명 찾기는 구간 하나.' },
        { title: '여객선', body: '출발 항구 하나의 그날 시간표 → 도착지마다 점선. 실제 항로가 아니라는 뜻으로 점선입니다.' },
        { title: '날씨·바람·태풍', body: '지도 가운데 지금·시간별·7일 예보, 전국 주요 도시 딱지. 바람 창에 지상·상층 바람 입자, 기압·기온, 기상청 태풍 통보.' },
        { title: '장날·주변 교통·통계', body: '오늘 장 서는 시장, 화면 둘레 역·정류장 자동 표시, KOSIS 통계로 시도·시군구 칠하기.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"하지 않는 것" 을 화면과 머리말에 함께 적었습니다 — 항공은 비행기 위치를 쫓지 않고(좌표가 없다), 여객선은 결항·지연을 모르고(API 에 없다), 바람 입자의 속도는 설명용이며, 이동 거리는 직선입니다. ' +
            '데이터가 말하지 않는 것을 그림이 말하는 것처럼 보이지 않게 하는 원칙이 버스 층에서 시작해 층마다 이어졌습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `새 층 ${LAYER_FILES.length}개 파일이 각자 MN* 전역(MNFlightApi · MNShipMap · MNWeatherApi …)을 만들지만 manifest 의 moduleBoundaries 에 등록된 것은 ${registered}개입니다. ` +
            'check-source.js 가 "선언이 있는가 · 소비자가 정말 쓰는가 · 소비자가 나중에 로드되는가" 를 보는 것은 등록된 경계뿐이라 이 층들은 그 검사 밖에 있습니다. ' +
            '선언되지 않은 의존도 셋 있습니다 — map-viewer.js 는 MNKoreaCoords 를 쓰는데 scriptDependencies 에 korea-coords.js 가 없고, nearby-transit.js 는 MNJejuBusApi·MNSubwayLive 를, ' +
            'ship-api.js 는 MNShipPortData 를 쓰는데 의존 목록이 비어 있습니다. 지금은 로드 순서가 맞아 돌지만 typeof 로 감싼 자리라, 순서가 뒤집히면 오류 대신 기능이 조용히 빠집니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            (capture
              ? `캡처 연결을 map-viewer.js 가 손으로 나열합니다 — captureNote 를 모으는 목록에 ${capture.notes.length}개(${capture.notes.join(' · ')}), freeze 를 거는 목록에 ${capture.freezes.length}개(${capture.freezes.join(' · ')})가 따로 적혀 있습니다. `
              : '캡처 연결을 map-viewer.js 가 손으로 나열합니다. ') +
            '주변 교통(nearbyTransit)은 두 목록 어디에도 없어, 역·정류장 점이 캡처에 찍혀도 그 자료(역 좌표는 OSM·ODbL, 정류장은 TAGO·서울시)의 출처가 붙지 않습니다. ' +
            `mount 결과를 배열 하나에 모아 두고 캡처 때 그 배열을 돌면, 층을 더할 때 고칠 곳이 한 줄이 됩니다(지금 map-viewer.js 의 의존 목록만 ${mapDeps.length}개입니다).`,
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '예외가 하나 있습니다 — 한국 둘레 바람(weather-wind.js)은 런처 없이 브라우저가 api.open-meteo.com 을 직접 부릅니다. 키가 없는 서비스라 오프라인 HTML 에서도 바람 그림이 돌게 한 선택이고, ' +
            'credentials:"omit" · referrerPolicy:"no-referrer" 로 보내는 것을 줄였습니다. 대신 런처의 허용 목록·캐시·한도 묶음 밖이라 아래 바람 섹션의 한도 계산이 PC 마다 따로 돕니다.',
        },
      ],
    }),

    mod('flight-map.js', {
      group: G,
      title: 'flight-map.js · flight-api.js — 항공 운항 게시판 (MNFlightMap · MNFlightApi)',
      subtitle: '비행기 위치가 아니라 공항 게시판을 노선 선으로',
      summary:
        '한국공항공사의 공항 운항 게시판(예정·변경 시각, 상태, 게이트)을 받아 "이 공항에서 오늘 어디로 몇 편이 뜨고, 어느 쪽이 지연·결항인가" 를 선의 굵기·색으로 보입니다. ' +
        '응답에 좌표가 없어 flight-api.js 가 공항 코드(IATA) 표로 지도에 올리고, 큰 게시판(제주 도착 등)은 100줄씩 여러 쪽으로 나눠 묻습니다.',
      usage: [
        {
          title: '실측 함정 셋',
          body:
            '아직 움직이지 않은 편은 상태가 빈 칸이고(전국 절반 가까이), 영문 상태에는 꼬리 공백이 붙으며, 자정을 넘기면 예정 2350 · 변경 0005 처럼 거꾸로 보입니다. ' +
            '인천(ICN)은 한국공항공사 관할이 아니지만 국내선은 이 API 에 나와 표에 넣었습니다.',
        },
        {
          title: '자주 묻지 않는다',
          body: '게시판은 몇 분에 한 번 바뀌는 정도라 3분마다 다시 묻고(런처도 1분 캐시), 지도가 보이지 않으면 묻지 않으며, 런처가 준 Retry-After 가 더 길면 그것을 따릅니다.',
        },
      ],
      files: [
        { path: 'src/js/flight-api.js', label: 'flight-api.js', description: '응답 해석·공항 표·쪽 나눠 묻기(MNFlightApi)' },
        { path: 'tests/flight-api.test.js', label: 'flight-api.test.js', description: '봉투·게이트웨이 오류 04·출도착 방향·상태 갈래' },
        { path: 'tests/e2e/flight-map.spec.js', label: 'flight-map.spec.js', description: '런처 여부·상대 공항마다 선 하나·편명 찾기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '지도 이름표의 상태 줄을 공항 게시판 약어(ON TIME · DLY · CNL · DIV)로 둬, 교실 화면에서 실제 공항 전광판과 같은 말로 읽히게 했습니다. 색만으로 가르지 않는 접근성 처리이기도 합니다.',
        },
      ],
    }),

    mod('ship-map.js', {
      group: G,
      title: 'ship-map.js · ship-api.js · ship-ports-data.js — 여객선 시간표',
      subtitle: '결항·지연도 위치도 없는 시간표 — 그 한계를 패널에 적는다',
      summary:
        '출발 항구 하나를 고르면 그날 떠나는 편의 선박명·도착지·예정 시각·운임을 받고(TAGO 국내선박운항정보), 도착지마다 점선 하나를 긋습니다. ' +
        '응답에 좌표가 없어 ship-ports-data.js 의 기항지 이름 표로 지도에 올리고, 표에 없는 도착지는 목록에만 둡니다.',
      usage: [
        {
          title: '좌표 표를 만든 방법이 표 머리에',
          body:
            '전국 항구를 모두 물어 나온 기항지 이름을 큰 터미널은 손으로, 나머지는 OSM 으로 찾되 "이미 놓인 뱃길 상대 항구 둘레 상자 안" 의 후보만 썼습니다. ' +
            '이름만으로 찾으면 "여수" 가 방송국, "통영" 이 학교에 잡히기 때문입니다. 못 놓은 곳과 같은 이름 항구 처리, ODbL 출처까지 적혀 있습니다.',
        },
        {
          title: '도착 시각을 소요 시간으로 읽지 않는다',
          body: '한 배가 여러 섬을 들르면 모든 도착지에 같은 도착 예정 시각(마지막 도착 무렵)이 옵니다. 그래서 "몇 분 걸린다" 를 계산하지 않고, 같은 시각에 떠나는 한 배를 한 줄(항해)로 묶습니다.',
        },
      ],
      files: [
        { path: 'src/js/ship-api.js', label: 'ship-api.js', description: '응답 해석·항해 묶기(MNShipApi)' },
        { path: 'src/js/ship-ports-data.js', label: 'ship-ports-data.js', description: '기항지 이름 → 좌표 표(MNShipPortData, OSM·ODbL)' },
        { path: 'tests/ship-api.test.js', label: 'ship-api.test.js', description: '봉투·숫자 시각·운임 0·선박명 공백·항해 묶기' },
        { path: 'tests/e2e/ship-map.spec.js', label: 'ship-map.spec.js', description: '도착지마다 점선·근처 항구 누르기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '선을 점선으로 그은 이유("실제 항로가 아니라 두 항구를 곧게 이은 그림이라 섬을 가로지른다")가 코드 머리에 있고, 운임 0 을 "무료" 가 아니라 "정보 없음" 으로 읽습니다. 데이터의 빈칸을 그림이 메우지 않습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '기항지 표는 2026-09-19 하루치 시간표에서 만든 손 작업 결과물이라, 새 기항지가 생기면 목록에만 보이고 지도에는 선이 빠집니다. 표를 다시 만드는 도구가 tools/ 에 없어 갱신 방법은 머리말의 설명이 전부입니다.',
        },
      ],
    }),

    mod('weather-api.js', {
      group: G,
      title: 'weather-api.js — 기상청 날씨·특일 해석 (MNWeatherApi)',
      subtitle: '지도·일기장·여행일지가 함께 쓰는 날씨 창구',
      summary:
        '기상청 단기·중기예보와 지상 관측 일자료, 태풍 통보, 한국천문연구원 특일(공휴일·24절기) 응답을 읽고 런처 /weather-* 로 묻습니다. ' +
        '지도 날씨 패널뿐 아니라 일기장의 "기상청 날씨로 채우기" 와 여행일지의 "그날 그곳 날씨"·여정 띠 공휴일이 이 파일을 씁니다.',
      usage: [
        {
          title: '위경도가 아니라 격자로 묻는다',
          body: '단기예보 계열은 기상청 격자(nx, ny)로 묻습니다. toGrid 가 람베르트 정각원추 도법으로 바꾸고, 테스트가 기상청 안내서의 대표 지점으로 맞춰 봅니다.',
        },
        {
          title: '지난 날은 가장 가까운 관측 지점',
          body:
            '지난 날 날씨는 ASOS 일자료라 어제까지만 있고 지점 단위입니다. 실제로 일자료가 온 지점 표를 들고 좌표에서 가장 가까운 곳을 고릅니다 — 여행일지가 "지점을 묻지 않는다" 를 지킬 수 있는 이유입니다.',
        },
        {
          title: '빈 값은 0 이 아니다',
          body: '강수량이 없으면 빈 문자열이 오고 Number("") 는 0 이라, num() 이 먼저 숫자 꼴인지 보고 아니면 null 로 둡니다. 실황에 없는 하늘 상태는 초단기예보의 가장 이른 시각에서 가져옵니다.',
        },
      ],
      files: [
        { path: 'tests/weather-api.test.js', label: 'weather-api.test.js', description: '격자 변환·가까운 지점·실황 + 초단기예보 합치기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '발표 시각을 화면이 아니라 런처가 한국 시각으로 정합니다(KmaBaseTime). 화면이 고르면 PC 시간대·아직 안 나온 발표 때문에 "자료 없음" 을 받기 쉬운데, 그 판단을 한곳에 두고 캐시 열쇠에도 발표 시각을 넣었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '지도 층 파일이지만 일기장(diary.js)이 manifest 의존으로 이 파일을 끌어갑니다. 계층으로는 document-editors 가 learning-tools 보다 앞이라 순서는 맞지만, 일기장 쪽 기능이 지도 쪽 파일 이름(weather-*)에 묶여 있어 ' +
            '"지도 층을 정리하다 weather-api.js 를 옮기면 일기장이 깨진다" 는 연결이 파일 이름만으로는 보이지 않습니다. 공용 창구라면 moduleBoundaries 에 소비자로 함께 적어 두는 편이 맞습니다.',
        },
      ],
    }),

    mod('weather-map.js', {
      group: G,
      title: 'weather-map.js — 지도 날씨 패널 (MNWeatherMap)',
      subtitle: '지도 가운데·우클릭 자리의 예보, 전국 주요 도시 딱지',
      summary:
        '지도 가운데(또는 우클릭한 자리)의 지금 · 시간별 · 약 7일 예보를 보이고 그 자리에 점 하나를 찍습니다. "전국 주요 도시" 는 도시마다 지금 하늘·기온을 딱지로 펼쳐 수업 첫머리의 "오늘 전국 날씨" 화면을 만듭니다. ' +
        '중기예보 지역은 map-viewer.js 가 넘긴 resolveArea(내장 행정경계)로 정해 인터넷 없이 고릅니다.',
      files: [
        { path: 'tests/e2e/weather.spec.js', label: 'weather.spec.js', description: '런처 여부·지금/시간별/날짜별·문서 불변·키 문제 안내' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '키 문제일 때 "어느 서비스를 활용신청하라" 까지 알려 줍니다(e2e 로 확인). 같은 공공데이터포털 키라도 서비스마다 신청이 따로라, "키가 틀렸다" 만으로는 사용자가 고칠 수 없기 때문입니다.',
        },
      ],
    }),

    mod('weather-wind.js', {
      group: G,
      title: 'weather-wind.js · weather-typhoon.js — 바람·기압·태풍 (MNWeatherWind · MNTyphoonLayer)',
      subtitle: '한국 둘레는 Open-Meteo, 세계·상층은 런처가 받은 NOAA GFS',
      summary:
        '바람 창은 두 범위를 씁니다. 한국 둘레는 키 없는 Open-Meteo GFS 를 1° 격자로 받아 벡터로 보간하고 해면기압·기온을 색으로 칠합니다. ' +
        '세계·상층(850·500·250hPa)은 EXE 런처가 NOAA GFS 원자료(GRIB2)를 받아 해독한 프레임을 /world-wind-* 로 줍니다(desktop/world_wind.cs). ' +
        '태풍 층은 기상청 공식 통보로 지나온 길·강풍 반경·진로 예보를 그립니다.',
      usage: [
        {
          title: '받은 것을 믿지 않는다',
          body:
            '세계 프레임은 바이트 길이부터 정해 둔 모양과 맞는지, 발표·수신 시각이 앞뒤가 맞는지, 값이 물리적으로 가능한 범위(기압 850~1100 등)인지 확인하고 하나라도 어긋나면 프레임 전체를 버립니다. ' +
            '한국 둘레 응답도 지점 ID·단위·시각·좌표가 요청과 다르면 거절합니다.',
        },
        {
          title: '태풍은 공식 통보만',
          body:
            '모델 바람 그림과 달리 이름·중심기압·최대풍속·지나온 길은 기상청 통보문 기준입니다. 진로 예보는 태풍마다 가장 늦은 통보의 것을 받고, 받지 못해도 지나온 길은 그립니다. ' +
            '이름표는 말풍선이 아니라 표지 안에 둡니다 — 지도 그림 저장이 말풍선 층을 숨기기 때문입니다.',
        },
      ],
      files: [
        { path: 'src/js/weather-typhoon.js', label: 'weather-typhoon.js', description: '기상청 태풍 층(MNTyphoonLayer)' },
        { path: 'desktop/world_wind.cs', label: 'world_wind.cs', description: 'NOAA GFS GRIB2 받기·해독·디스크 캐시(런처 쪽)' },
        { path: 'tests/weather-wind.test.js', label: 'weather-wind.test.js', description: '풍향 규약·요청 모양·응답 검증·보간' },
        { path: 'tests/weather-typhoon.test.js', label: 'weather-typhoon.test.js', description: '통보 → 경로, 정정 통보 갈음, 실측 응답, 위치를 지어내지 않기' },
        { path: 'tests/world-wind-desktop.test.js', label: 'world-wind-desktop.test.js', description: 'GRIB 해독이 ecCodes 와 모든 격자점에서 일치 · 세계 경로의 토큰 요구' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'GRIB2 해독기를 직접 만들면서 기준 구현(ecCodes)과 전 지구 격자점 모두를 대조하는 테스트를 붙였습니다. 바이너리 기상 자료를 손으로 푸는 코드는 틀려도 "그럴듯한 그림" 이 나와 눈으로는 못 잡는 종류라, 이 대조가 유일한 안전망입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '머리말의 한도 계산("195지점 × 하루 24번 ≈ 4,700회라 무료 한도 10,000회 안")은 PC 한 대 기준입니다. Open-Meteo 무료 한도는 IP 단위인데 학교 PC 들은 대개 하나의 공인 IP 로 나가고, ' +
            '캐시는 브라우저마다 따로(localStorage, 1시간)입니다. 한 교실 몇 대가 하루 종일 바람 창을 켜 두면 학교 전체가 한도를 넘어 모든 PC 의 바람 그림이 함께 멈춥니다. ' +
            '런처를 거치게 하거나(교실 단위 캐시), 한도 초과 응답을 따로 알려 "인터넷 문제" 와 구분하는 편이 맞습니다.',
        },
      ],
    }),

    mod('market-days.js', {
      group: G,
      title: 'market-days.js — 오늘 장날 (MNMarketDays)',
      subtitle: '"2일+7일" 을 날짜 끝자리로 푼다',
      summary:
        '전국전통시장표준데이터를 런처 /market-days 로 받아, 오늘 장이 서는 시장을 지도에 찍습니다. 장날은 "시장개설주기" 글로 오는데 실측해 보니 "매일" 이거나 날짜 끝자리를 + 로 이은 꼴뿐이어서, ' +
        '끝자리 집합으로 바꿔 판정합니다(2·7일장 = 2·7·12·17·22·27일). 목록은 한 해 단위로 바뀌어 브라우저에 이레 동안 담아 둡니다.',
      files: [
        { path: 'tests/market-days.test.js', label: 'market-days.test.js', description: '개설주기 글 풀기·31일·실제 응답 봉투' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '규칙의 모서리를 숨기지 않았습니다. 31일은 끝자리 1 이라 1·6일장에 넣는데, 시장마다 다를 수 있어 그 사실과 명절 휴장을 패널 안내 글에 적었고, 좌표가 빈 시장은 지도에 못 찍는다고 개수로 알립니다.',
        },
      ],
    }),

    mod('nearby-transit.js', {
      group: G,
      title: 'nearby-transit.js — 주변 교통 자동 표시 (MNNearbyTransit)',
      subtitle: '지도를 옮길 때마다 화면 둘레의 역·정류장을 — 하루 한도 안에서',
      summary:
        '켜 두면 지도를 옮길 때마다 화면 둘레의 지하철역과 버스 정류장을 저절로 찍습니다. 역은 subway-stations.js 의 내장 좌표라 API 를 부르지 않고, 같은 이름 역은 노선을 모아 점 하나(환승역)로 합칩니다. ' +
        '정류장은 화면을 덮는 격자 칸마다 가운데 좌표로 MNJejuBusApi.nearbyAt 에 묻습니다. 누르면 버스 창·지하철 도착 창을 빌려 엽니다.',
      usage: [
        {
          title: '한도를 아끼는 네 규칙',
          body:
            '① 확대 16 이상에서만 ② 옮기기를 멈추고 잠시 뒤에 ③ 가운데에서 가까운 칸부터 두 개씩, 한 화면에 16칸까지 ④ 한 번 물은 칸은 10분 동안 다시 묻지 않습니다. ' +
            '칸은 반경 500m 조회 원 안에 꼭 들어가는 크기라 빈틈이 없고, 칸 가운데 좌표로만 물으므로 런처의 하루 캐시도 그대로 맞습니다.',
        },
        {
          title: '이름이 같아도 다른 역',
          body: '같은 이름이라도 600m 넘게 떨어지면 다른 역으로 둡니다(5호선 양평 ↔ 경의중앙선 양평). 테스트가 실제 역 표에서 환승역이 합쳐지는지 봅니다.',
        },
      ],
      files: [
        { path: 'tests/nearby-transit.test.js', label: 'nearby-transit.test.js', description: '환승역 합치기·칸 가운데 좌표·한도 규칙' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"자동으로 계속 묻는" 기능을 하루 한도가 있는 키 위에 올리면서, 묻는 횟수를 줄이는 규칙을 칸 크기 계산까지 숫자로 남겼습니다. 키·한도 문제를 받으면 미리보기를 끄고 더 묻지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'MNJejuBusApi·MNSubwayLive 를 쓰지만 manifest 의존이 비어 있고, 캡처 연결(freeze·captureNote)도 없습니다 — 개요 섹션의 두 Risk 가 가장 겹치는 파일입니다.',
        },
      ],
    }),

    mod('kosis-choro.js', {
      group: G,
      title: 'kosis-choro.js · kosis-api.js — 색칠 지도의 KOSIS 가져오기',
      subtitle: '통계를 "시도 시군구\\t값" 글로 바꿔 붙여넣기 칸에 넣는 데까지만',
      summary:
        '색칠 지도 창 안의 "KOSIS에서 가져오기" 칸입니다. 자주 쓰는 통계(이름 맞춤을 미리 확인한 표) 또는 검색으로 고른 아무 KOSIS 표를 받아, ' +
        '결과를 색칠 지도의 붙여넣기 칸에 글로 넣습니다. 이름 맞추기·칠하기는 색칠 지도가 하므로, 고칠 곳이 붙여넣기 칸에 그대로 보이고 저장된 지도를 다시 열 때도 같은 길로 읽습니다.',
      usage: [
        {
          title: '코드 모양이 표마다 다르다',
          body:
            '11010 · 11110 · 11101HJG11010 · 1236010 처럼 지역 코드가 표마다 다르지만 "끝 숫자만 떼면 앞머리 = 상위 지역" 이라는 규칙 하나로 시도를 찾아 "서울특별시 중구" 로 붙이고, ' +
            '도 아래 일반구에는 같은 자리 끝이 0 인 시를 끼웁니다. 2026-07 행정 개편 뒤 메타 정보와 옛 자료 이름이 어긋나 이름은 받은 자료 줄에서만 씁니다.',
        },
      ],
      files: [
        { path: 'src/js/kosis-api.js', label: 'kosis-api.js', description: '자주 쓰는 통계 표·응답 해석·런처 조회(MNKosisApi)' },
        { path: 'tests/kosis-api.test.js', label: 'kosis-api.test.js', description: '시도 붙이기·코드 모양·일반구' },
        { path: 'tests/e2e/kosis-choro.spec.js', label: 'kosis-choro.spec.js', description: '런처 여부·자주 쓰는 통계로 칠하기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '역할을 "글로 바꾸기" 까지로 자른 경계가 좋습니다. 새 데이터 원천이 색칠 지도의 내부를 모르고, 사람이 붙여넣은 표와 같은 길을 타므로 이름 맞추기 규칙이 둘로 갈라지지 않습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '"검색해서 고르기" 는 아무 표나 받지만, 런처가 조회 셋(search · meta · data)과 매개변수 모양(기관·표 ID·주기·분류 값)을 정규식으로 좁혀 원격 주소를 받지 않습니다. 키는 공공데이터포털 키와 따로입니다.',
        },
      ],
    }),

    mod('korea-coords.js', {
      group: G,
      title: 'korea-coords.js — 한국 평면 좌표 ↔ 위경도 (MNKoreaCoords)',
      subtitle: 'TM·UTM-K 를 공식으로 직접 — 키·인터넷 없이',
      summary:
        '공공데이터 표에 흔한 평면 좌표(도로명주소·국가공간정보의 UTM-K, 인허가 자료의 중부원점 TM 등)를 위경도로 바꿔, 지도 표 들이기가 이런 줄을 "좌표 오류" 로 버리지 않게 합니다. ' +
        '횡메르카토르 크뤼거 급수와 옛 Bessel 좌표계의 7변수 변환을 넣었고, 표의 좌표계를 짐작하는 guess 와 국내 판정 inKorea 도 여기 있습니다. 여행일지의 국내·해외 판정도 이 inKorea 를 씁니다.',
      files: [
        { path: 'tests/korea-coords.test.js', label: 'korea-coords.test.js', description: '카카오 변환값과 1m 안·보정 없는 원점의 어긋남·왕복 1cm' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '외부 API 를 쓰지 않은 이유가 실측입니다 — 카카오 좌표 변환은 가장 흔한 UTM-K(EPSG:5179)를 받지 않았습니다(실제 키로 400). 그래서 공식을 넣되, 결과는 카카오 변환값과 1m 안으로 맞는지 ' +
            '테스트로 붙들고, "보정 없는 중부원점은 동서로 250m 남짓 어긋난다" 같은 틀리기 쉬운 경우를 따로 시험합니다.',
        },
      ],
    }),
  ];
};
