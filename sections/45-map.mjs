// 5. document-editors — 지도 문서(.map). map-viewer.js 한 파일.
//
// document-editors 계층에 속하지만 한 파일이 4,800줄대라 40-editors.mjs 에서 떼어 둔다.
// 카테고리는 같으므로 사이드바에서는 document-editors 안의 "지도" 묶음으로 이어 붙는다.
// 도구상자 계산부(board-tools.js)는 화이트보드와 함께 읽어야 해서 40-editors.mjs 에 남겼다.

import { linesLabel, topLevelFunctionSpan, functionShare } from '../lib/source-metrics.mjs';

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  // 줄 수와 "한 함수가 파일의 몇 %인가" 는 생성 때 잰다(lib/source-metrics.mjs).
  const mapLines = linesLabel(rootDir, 'src/js/map-viewer.js');
  const mount = topLevelFunctionSpan(rootDir, 'src/js/map-viewer.js', 'mountMapEditor');
  const mountShare = functionShare(rootDir, 'src/js/map-viewer.js', 'mountMapEditor');
  const mountLabel = mount
    ? `${mount.span.toLocaleString('en-US')}줄(${mount.start}–${mount.end})`
    : '한 함수';

  return [
    sec({
      id: 'map-overview',
      category: '5. document-editors',
      group: '지도',
      title: '지도 문서 개요 (.map)',
      subtitle: 'Leaflet + 공개 타일 — 키도 도메인 등록도 없이 교실에서 도는 지도',
      summary:
        '배경지도 위에 표시를 찍어 이름·메모·색·사진을 붙이고, 거리와 넓이를 재고, 지금 보이는 화면을 그대로 칠판(화이트보드)으로 옮기는 문서 종류입니다. ' +
        '.map 은 중심 좌표·확대·표시·도형을 담은 JSON 이라 통합 검색·되돌아 열기·복구 저장이 다른 문서와 똑같이 동작합니다. ' +
        '지도 라이브러리(Leaflet)는 vendor 에 들어 있어 오프라인이고, 인터넷은 배경 타일에만 필요합니다.',
      usage: [
        {
          title: '왜 카카오·네이버 지도 SDK 가 아닌가',
          body:
            '두 SDK 모두 JS 키에 "사이트 도메인"을 등록해야 합니다. 그런데 이 앱은 실행할 때마다 127.0.0.1 의 빈 포트를 잡고, ' +
            '오프라인 HTML 은 file:// 로도 열립니다 — 등록할 주소 자체가 없습니다. 게다가 키가 배포본에 실려 학생 PC 마다 퍼지고, ' +
            '타일을 저장해 두는 것도 약관이 막습니다. "인터넷 없이 동작한다"는 이 앱의 전제와 정면으로 부딪히는 조건들이라, ' +
            '키도 도메인 등록도 필요 없는 Leaflet + 공개 타일을 골랐습니다. 이 판단이 파일 첫머리 주석에 근거와 함께 적혀 있습니다.',
        },
        {
          title: '인터넷이 필요한 지점을 한 곳으로 모았다',
          body:
            '배경 타일과 장소 검색만 바깥을 봅니다. 그리고 그 둘 다 EXE 로 돌 때는 런처를 거칩니다 — 타일은 /tile-proxy, ' +
            '이름 검색은 /geocode 입니다. 브라우저가 지도 서버를 직접 부르지 않으므로 런처 한 곳에서 호스트 허용 목록·요청 간격·API 키를 모두 통제합니다. ' +
            '프록시가 없는 환경(file://·옛 EXE)에서는 타일 주소를 그대로 쓰고 이름 검색은 막습니다.',
        },
        {
          title: '능력마다 프로브를 따로 둔다',
          body:
            '타일 프록시 가능 여부를 /can-save-file 로 판단하지 않고 전용 프로브 /can-proxy-tiles 를 씁니다. ' +
            'Go 폴백 런처는 파일 저장은 못 해도 타일 프록시는 하기 때문입니다. ' +
            '"런처가 있다 = 무엇이든 된다"로 뭉뚱그리지 않고 능력을 하나씩 물어보는 방식이며, tests/map-viewer.test.js 가 이 규칙을 고정해 두었습니다.',
        },
        {
          title: '칠판과 지도는 양방향',
          body:
            '지도 → 칠판은 🖊️ 칠판으로 가 지금 화면을 PNG 로 굳혀 새 화이트보드에 올립니다(whiteboard.js 의 doc.insertBoardImage 훅). ' +
            '칠판 → 지도는 🗺️ 가 openMapPicker() 로 지도 고르기 창을 열어 자리를 잡고 캡처만 가져갑니다. ' +
            'map-viewer.js 가 whiteboard.js 보다 뒤에 로드되므로 서로를 실행 시점에 확인해 부릅니다.',
        },
        {
          title: '앱 본체에 남긴 자국',
          body:
            'file-loaders.js 의 확장자 분기, documents.js 의 폴더 우클릭 항목과 "지도에서 검색" 메뉴, code-viewer.js 의 .map 텍스트 폴백, ' +
            `lazy.js 의 leaflet 묶음, i18n.js 의 지도 문구가 전부입니다. ${mapLines}짜리 기능을 붙이면서 기존 파일에는 이만큼만 손댔습니다 — ` +
            '.mnote·.msheet 가 닦아 둔 "새 문서 종류" 경로를 세 번째로 그대로 따랐습니다.',
        },
      ],
      features: [
        { title: '배경지도 4종', body: '일반(OSM) · 지형 등고선(OpenTopoMap) · 흑백 판서용(CARTO) · 위성(Esri). 여기에 내 이미지를 올려 배경으로 쓸 수도 있습니다.' },
        { title: '표시와 도형', body: '색 지정 표시(마커), 거리선, 면적 영역, 반경 원. 거리·넓이는 구면 계산으로 재어 라벨로 붙습니다.' },
        { title: '주소 ↔ 좌표', body: '주소 CSV 일괄 지오코딩(한 번에 200줄), 새 표시에 주소 자동 채우기, 클릭한 자리의 건물·시설 이름 되묻기.' },
        { title: '주변 시설', body: '카카오 갈래 코드 또는 직접 적은 말로 반경(500m~3km) 안을 찾아 갈래별 색으로 찍습니다. 묶음째 되돌리기·삭제됩니다.' },
        { title: '지역 통계', body: '표시를 시도·시군구로 세어 칠판 차트로 넘깁니다 — 지도에서 센 값이 board-tools 의 차트로 이어집니다.' },
        { title: '수업 도구', body: '축척 막대·방위표·위경도 격자, 표시 목록 패널, 발표(스토리) 모드, 표시에 사진 붙이기, PNG 저장·인쇄.' },
        { title: '지도 문제', body: '.task 과제 패키지와 연동해 학생이 지도 위에서 푸는 문제를 냅니다. 학생 화면에서는 편집 도구막대를 아예 내놓지 않습니다.' },
      ],
      files: [
        { path: 'tests/map-viewer.test.js', label: 'map-viewer.test.js', description: '모델 왕복·타일 캐시·검색·런처 계약 89개' },
        { path: 'tests/map-memo-roundtrip.test.js', label: 'map-memo-roundtrip.test.js', description: '표시 목록 ↔ 메모 표 왕복 20개' },
        { path: 'tests/e2e/map-document.spec.js', label: 'map-document.spec.js', description: '지도 문서 열기·표시·저장' },
        { path: 'tests/e2e/map-view-tools.spec.js', label: 'map-view-tools.spec.js', description: '축척·방위표·격자·목록 패널' },
        { path: 'tests/e2e/map-region-stats.spec.js', label: 'map-region-stats.spec.js', description: '지역 통계 → 칠판 차트' },
        { path: 'tests/e2e/map-story-photo-quiz.spec.js', label: 'map-story-photo-quiz.spec.js', description: '발표 모드·사진·지도 문제' },
        { path: 'tests/e2e/board-map-picker.spec.js', label: 'board-map-picker.spec.js', description: '칠판에서 지도 고르기' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '외부 서비스를 고르는 판단에 근거를 남겼습니다. "카카오를 안 쓴다"가 아니라 "실행마다 포트가 바뀌고 file:// 로도 열리므로 등록할 도메인이 없다"까지 적혀 있어, ' +
            '나중에 조건이 바뀌었을 때(예: 고정 포트를 쓰기로 하면) 이 결정을 다시 볼 수 있습니다. 되돌리기 쉬운 형태로 적힌 결정입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '타일을 미리 받아 두지 않고 실제로 화면에 뜬 타일만 캐시합니다. 공개 지도 서버가 금지하는 대량 사전 다운로드를 피하면서 ' +
            '"같은 지역을 다음 수업에 다시 연다"는 실제 필요는 채웁니다. 이 규칙을 문장이 아니라 테스트로 못 박아 두었습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '배경지도 목록(MAP_BASEMAPS)의 호스트가 런처 허용 목록(launcher.cs TileProxyHosts)과 같은지, ' +
            '그리고 C# 런처와 Go 런처의 허용 목록이 서로 같은지를 테스트가 직접 대조합니다. ' +
            '세 곳에 흩어진 목록이 조용히 어긋나면 지도가 회색으로 남는데, 그 실패를 빌드 시점으로 당겨 놓았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `mountMapEditor 한 함수가 ${mountLabel}로 파일의 ${mountShare}% 입니다. 도구막대 구성·표시 편집·도형 그리기·검색·주변 시설·통계·발표 모드·우클릭 메뉴·정리가 모두 이 함수의 지역 스코프에 있습니다. ` +
            'spreadsheet-viewer.js 의 renderXlsx 와 같은 모양이며, 같은 결과(구간을 어디로 잘라도 함수 중간이 끊긴다)를 이미 낳고 있습니다. ' +
            '순수부는 이미 module.exports 로 잘 빠져 있으니, 다음은 화면 조립부를 mountMapToolbar·mountMapStage 처럼 나누는 쪽입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '설계 문서가 없습니다. 악보(악보-설계.md)·화이트보드 집중 도구(화이트보드-집중도구-설계.md)·과제 패키지는 결정과 근거를 문서로 남겼는데, ' +
            `${mapLines}에 외부 API 두 곳과 런처 엔드포인트 10개가 걸린 지도는 코드 주석만 있습니다. ` +
            '주석 품질은 높지만 "무엇을 안 하기로 했는가"(비목표)와 단계별 범위가 남아 있지 않아, 기능이 어디까지 자랄지에 제동이 없습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '문서 버전이 벌써 6 입니다(MAP_DOC_VERSION). mapDocParse 가 옛 버전을 모두 읽어 6 으로 정규화하므로 옛 .map 도 그대로 열리며, ' +
            'tests/map-viewer.test.js 가 "새 도형·사용자 배경 필드 없이도 그대로 열린다"를 검증합니다. 이 방식은 music-model.js 의 버전 이전과 같습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '단위 테스트 109개(지도 89 · 메모 왕복 20)와 E2E 5개가 붙어 있습니다. ' +
            '주목할 점은 그중 상당수가 브라우저 코드가 아니라 런처(C#·Go) 와의 계약을 검사한다는 것입니다 — ' +
            '허용 목록 일치, 검색 후보 개수 일치, 토큰 없는 캐시 조회 차단처럼 두 언어에 걸친 약속을 JS 테스트가 소스를 읽어 대조합니다.',
        },
      ],
    }),

    mod('map-viewer.js', {
      group: '지도',
      title: 'map-viewer.js — 지도 문서 (.map)',
      subtitle: '모델·거리 계산·타일·검색·화면을 한 파일에 — src/js 에서 3번째로 큰 파일',
      summary:
        '.map 의 데이터 모델과 정규화, 구면 거리·넓이 계산, 축척·격자 눈금 계산, CSV 왕복, 타일 프록시 판단, ' +
        '장소 검색과 좌표 → 주소 되묻기, 그리고 편집기 화면 전체가 들어 있습니다. ' +
        `앞쪽 절반(약 ${mount ? (mount.start - 1).toLocaleString('en-US') + '줄' : '절반'})은 DOM 을 만들지 않는 순수 계산과 통신 함수라 node --test 로 검증되고, ` +
        '뒤쪽 절반은 mountMapEditor 한 함수입니다.',
      usage: [
        {
          title: '모델은 손으로 고친 파일을 전제한다',
          body:
            'mapDocParse 는 .map 이 사람이 열어 고칠 수 있는 JSON 이라는 점을 전제로 씁니다. ' +
            '좌표는 mapClampLat/mapClampLng 로 눌러 담고, 색은 목록에 있는 값만 받고, 격자는 선이 60개를 넘지 않게 잘라 냅니다. ' +
            '"이상한 값이 들어와도 지도가 깨지지 않는다"가 테스트 제목으로 그대로 남아 있습니다.',
        },
        {
          title: '보기만 바꾼 것은 고친 것이 아니다',
          body:
            'mapDocContentKey 가 중심·확대를 뺀 내용만으로 키를 만듭니다. 지도를 끌어 옮기고 확대만 했다면 ● (저장 안 됨)이 켜지지 않습니다. ' +
            '지도는 보기 상태가 늘 변하는 문서라, 이 구분이 없으면 아무것도 안 고쳐도 매번 저장을 묻게 됩니다.',
        },
        {
          title: '되묻기는 좌표를 끊어 캐시한다',
          body:
            '표시 하나마다 좌표 → 주소를 한 번씩 부르게 되므로, 좌표를 소수점 5자리로 끊어 _mapPlaceInfoCache 에 담습니다. ' +
            '장소 검색도 공급자+검색어로 캐시합니다. 같은 자리를 두 번 묻지 않는 것이 외부 서비스에 대한 예의이자 속도입니다.',
        },
        {
          title: '카카오 → OSM 자동 폴백',
          body:
            '카카오를 고르면 주소 검색 → 키워드 검색 순으로 찾고, 키가 없거나 결과가 없으면 OSM 으로 자동 재검색합니다. ' +
            'API 키는 브라우저 설정에도 localStorage 에도 두지 않습니다 — 런처가 Authorization 헤더를 붙입니다.',
        },
        {
          title: '빈 문자열이 좌표로 통과하지 않게',
          body:
            'mapKakaoPlaces 가 Number("")===0 을 명시적으로 막습니다. 좌표 칸이 빈 응답이 오면 (0, 0) 으로 조용히 통과해 ' +
            '엉뚱한 바다 한가운데로 지도가 날아가는데, 그 자리를 주석과 함께 막아 두었습니다.',
        },
        {
          title: '탭을 닫으면 전부 뗀다',
          body:
            'cleanupFns 에 Leaflet 인스턴스, ResizeObserver, window 전역 키 리스너 5개, 우클릭 메뉴의 document 리스너, ' +
            '되돌리기 묶음, 지연 타이머를 모두 등록합니다. doc.mapSearchFor·doc.printMap 같은 바깥 훅도 null 로 되돌려 ' +
            '닫힌 지도를 머리글 인쇄 단추가 계속 부르지 않게 합니다.',
        },
      ],
      features: [
        { title: '순수 계산부', body: '거리·선길이·다각형 넓이, 축척 눈금(mapNiceScaleMeters), 위경도 격자 간격, 원 근사, CSV 파싱·직렬화, 지역 집계.' },
        { title: '사진 담기', body: '긴 변 1280px·JPEG 로 줄여 담고 넘치면 화질을 두 번 더 낮춥니다. 한 장 900KB · 한 지도 12MB 상한.' },
        { title: '칠판 캡처', body: '타일을 기다린 뒤 컨트롤·말풍선·이름표 칸을 감추고 찍습니다. 닫은 말풍선이 200ms 남는 것까지 계산에 넣었습니다.' },
        { title: '최근 검색어', body: '성공한 검색만 최신순 8개까지 중복 없이 남깁니다. 목록 개수는 화면과 두 런처가 같은 값을 씁니다.' },
        { title: '도구막대 접기', body: '머리말 줄과 편집 도구 줄을 갈라, H 로 편집 도구만 접습니다. 접은 상태는 .map 이 아니라 localStorage 에 남습니다.' },
        { title: '복구 저장', body: '고친 것이 있거나 아직 한 번도 저장하지 않은 새 지도면 작업공간에 스냅샷을 남깁니다.' },
      ],
      files: [
        {
          path: 'vendor/licenses/leaflet-1.9.4.txt',
          label: 'leaflet-1.9.4.txt',
          description: '지도 라이브러리 라이선스 — 본체(vendor/leaflet.min.js, 144KB)는 압축본이라 싣지 않고 MNLazy 의 leaflet 묶음으로 지연 로드합니다',
        },
        { path: 'tests/map-viewer.test.js', label: 'map-viewer.test.js', description: '모델·계산·타일·검색·런처 계약 89개' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '순수 함수 50개 이상을 module.exports 로 내보내 브라우저 없이 검증합니다. ' +
            '거리·넓이·축척·격자·CSV·지역 집계처럼 "틀리면 수업에서 바로 드러나는" 계산이 전부 이쪽에 있고, ' +
            `DOM 이 필요한 부분만 mountMapEditor 안에 남겼습니다. ${mapLines} UI 파일치고 테스트 가능한 표면이 넓습니다.`,
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '외부 응답을 그대로 쓰지 않고 mapOsmPlaces·mapKakaoPlaces·mapKakaoAddressInfo·mapOsmReverseInfo 로 한 번 정규화합니다. ' +
            '공급자가 둘이고 응답 모양이 완전히 다른데, 화면 코드는 {name, lat, lng} 하나만 압니다. ' +
            '공급자를 하나 더 붙일 때 고칠 자리가 이 함수들뿐입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `mountMapEditor 가 ${mountLabel}입니다. 이 함수의 지역 변수에 화면 상태가 전부 들어 있어, ` +
            '기능을 하나 더 붙일 때마다 함수가 길어지는 것 말고는 선택지가 없습니다. ' +
            '리뷰에서도 이 파일은 구간으로 나누지 못하고 통째로 싣습니다 — 어디를 잘라도 함수 중간이기 때문입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이 파일은 moduleBoundaries 에 공개 API 로 등록돼 있지 않은데, 바깥에서 부르는 이름을 여럿 만듭니다 — ' +
            'openMapPicker(칠판이 부름), openMapTaskDoc(과제 패키지), newMapScratch, mapSearchMenuItem(문서 우클릭 메뉴). ' +
            'check-source.js 의 경계 검사(선언이 있는지 · 소비자가 정말 쓰는지 · 로드 순서가 맞는지)를 이 이름들은 받지 못합니다. ' +
            'MNMapDoc 같은 경계를 하나 두면 whiteboard.js → map-viewer.js 의 늦은 로드 순서도 함께 검사됩니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '설정을 localStorage 키 5개(자동 주소·장소 정보·목록 패널·검색 기록·고르기 창 위치)로 흩어 두었습니다. ' +
            '앱 모드가 별도 브라우저 프로필로 열리면 이 값들이 따라오지 않는데, 검색 공급자만 런처에 저장해 동기화합니다 ' +
            '(window.__classDockMapSearchProviderReady). 같은 성격의 설정이 두 저장소로 갈려 있어, 어느 쪽에 넣을지 판단이 매번 필요합니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '주소 CSV 일괄 지오코딩 상한이 200줄인 이유가 상수 옆에 적혀 있습니다 — OSM 정책상 초당 1건이라 한 줄에 한 번씩 부르면 ' +
            '200줄이 수업 시간 안에 끝나는 한계입니다. 상한 숫자가 아니라 그 숫자가 나온 계산이 남아 있는 형태입니다.',
        },
      ],
    }),
  ];
};
