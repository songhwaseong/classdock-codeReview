// 7. document-editors — 지도 문서(.map). map-viewer.js 와 그 위에 얹는 실시간 교통 층
// (subway-stations.js · subway-live.js · jeju-bus-api.js · jeju-bus-live.js · jeju-bus-map.js).
//
// document-editors 계층에 속하지만 map-viewer.js 한 파일이 워낙 커서 40-editors.mjs 에서 떼어 둔다.
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
      category: '7. document-editors',
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
        { title: '카카오맵 상세 보기', body: '🗺 이 카카오 장소 페이지를 iframe 으로 엽니다. 같은 검색 묶음(batch)의 시설을 ‹ · › 와 ←/→ 로 차례로 넘겨 봅니다.' },
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
          title: 'iframe 에 넣을 주소를 두 번 검사한다',
          body:
            'mapKakaoPlaceUrl 이 호스트가 place.map.kakao.com 이고 경로가 /숫자 인 것만 통과시키고, 사용자·비밀번호·포트가 붙어 있으면 버립니다. ' +
            '그런데 mapKakaoPlaceSlides 는 부르는 쪽을 믿지 않고 이 검사를 한 번 더 겁니다 — 주변 시설 묶음은 저장된 .map 에서 되읽을 수 있어서, ' +
            '남이 만든 지도 파일에 적힌 주소가 그대로 iframe 에 들어가는 길이 생기기 때문입니다. ' +
            '"들어올 때 걸렀으니 나갈 때는 믿는다"가 통하지 않는 자리를 정확히 짚었습니다.',
        },
        {
          title: 'iframe 은 하나만 갈아 끼운다',
          body:
            '한 검색 묶음이 많게는 100곳이라 장소마다 iframe 을 만들지 않고 하나를 재사용합니다. ' +
            '넘겨 볼 대상은 같은 batch 꼬리표가 붙은 시설로만 한정합니다 — 지도에 예전 검색 결과가 함께 남아 있어도 섞이지 않습니다. ' +
            '카카오 안내에 따라 페이지를 덮거나 잘라 내지 않고 ClassDock 쪽 머리말은 iframe 바깥에 둡니다.',
        },
        {
          title: '그리는 중의 우클릭은 "끝내기"다',
          body:
            '거리선·면적을 그리는 동안에는 우클릭이 빠른 메뉴 대신 finishDrawing(true) 로 갑니다 — Enter·같은 버튼 다시 누르기와 한 길입니다. ' +
            '점이 모자라면(선 2개·영역 3개 미만) 브라우저 기본 메뉴만 막고 안내를 띄웁니다. ' +
            '첫 점 이후에는 마지막 점에서 커서까지 점선 안내선(draftGuideLayer)이 따라와, 아직 안 찍힌 선이 어디로 갈지 보입니다.',
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
        { path: 'tests/map-radius.test.js', label: 'map-radius.test.js', description: 'A·B 생활권 비교 — 반경 경계·거리순·시설별 집계·칠판 차트 전송' },
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

    // ── 실시간 교통 층 ────────────────────────────────────
    // manifest 에서는 map-viewer.js 바로 앞에 로드되지만, 지도 문서를 먼저 읽어야 "문서에 남지 않는 층" 이
    // 무슨 뜻인지 보이므로 여기서는 뒤에 싣는다.

    sec({
      id: 'map-live-transit',
      category: '7. document-editors',
      group: '지도',
      title: '실시간 교통 층 개요 — 수도권 지하철 · 제주 버스',
      subtitle: '같은 "움직이는 점" 을 두 번, 서로 다른 데이터 성질에 맞춰 풀었다',
      summary:
        '지도 위에 지금 운행 중인 열차와 버스를 띄우는 두 기능입니다. 둘 다 EXE 런처가 외부 API 를 대신 받고, 둘 다 .map 문서에는 한 글자도 남기지 않으며, ' +
        '둘 다 캡처(칠판·PNG·인쇄)에는 그 순간의 위치를 남깁니다. 그러나 받는 데이터의 성질이 달라 계산은 공유하지 않습니다 — ' +
        '지하철 API 는 좌표 없이 "어느 역에 어떤 상태로" 라는 사건만 주고, 제주 버스는 좌표를 주지만 측정 시각이 없습니다.',
      usage: [
        {
          title: '지하철: 좌표가 없으니 역 사이를 계산한다',
          body:
            'subway-stations.js 가 OSM 에서 만든 역 좌표·이웃 표를 들고, subway-live.js 가 "진입·도착·출발" 사건을 그 표에 얹어 두 역 사이 몇 % 지점인지 계산합니다. ' +
            '정차 45초 + 거리÷15m/s 로 달리게 하고, 다음 역을 지나치지 않게 97% 에서 멈춥니다. 화면과 통신은 map-viewer.js 의 mountMapEditor 안에 있습니다.',
        },
        {
          title: '제주 버스: 좌표는 있으니 "움직였다고 말하지 않는 법" 을 계산한다',
          body:
            'jeju-bus-api.js 가 응답을 정규화하고, jeju-bus-live.js 가 같은 좌표 재수신·캐시 재전달·정류장만 바뀐 응답·큰 점프·부분 누락을 구분해 ' +
            '"새로 움직였다" 로 오해하지 않게 합니다. 경로가 검증되고 짧은 정상 이동일 때만 1.8초 동안 경로를 따라 옮기고, 미래 위치는 만들지 않습니다. ' +
            '화면은 jeju-bus-map.js 로 따로 떼어 map-viewer.js 는 장착과 캡처 연결만 합니다.',
        },
        {
          title: '공통 규칙: 문서에 남기지 않는다',
          body:
            '열차·버스는 지금 이 순간의 값이라 파일에 담으면 다음에 열 때 어제 차량이 되살아납니다. 켜 둔 사실조차 문서가 아니라 이 브라우저에 남기는데, ' +
            '지도를 건네받은 사람에게는 키가 없어 켜진 채로 열리면 오류만 보이기 때문입니다. 표시 목록·CSV·GPX·되돌리기·자동 저장에도 닿지 않습니다.',
        },
      ],
      features: [
        { title: '🚇 실시간 열차', body: '수도권 16개 노선 중 하나를 골라 열차 점과 노선(역을 곧게 이은 선)을 깔고, 가까이 가면 역 이름을 늘 붙입니다. 서울시 인증키가 필요합니다.' },
        { title: '🚌 제주 버스 (시범)', body: '노선번호로 세부 노선을 찾아 정류장·경로·차량을 표시합니다. 키 없이 EXE 에서 쓰며, C# 런처에만 있고 Go 폴백 런처에서는 단추가 비활성입니다.' },
        { title: '신선도 표시', body: '지하철은 5분 소식이 없으면 감춥니다. 버스는 2분 지연이면 흐리게, 5분이면 숨기고, 90초 좌표가 그대로면 "위치 변화 확인 안 됨" 이라고만 씁니다.' },
        { title: '보이지 않으면 묻지 않는다', body: '다른 탭을 보거나 지도가 숨으면 조회를 멈춥니다. 지하철은 하루 조회 한도를, 버스는 공식 API 가 아닌 사이트의 부담을 이유로 듭니다.' },
      ],
      files: [
        { path: 'docs/제주버스-실시간지도-설계.md', label: '제주버스-실시간지도-설계.md', description: '설계 문서 — 실측 관측·데이터 한계·표시 규칙표·캐시·동시성·1차 구현 결과' },
        { path: 'tools/build-subway-stations.mjs', label: 'build-subway-stations.mjs', description: 'OSM Overpass 에서 역 좌표·이웃 표를 만드는 생성기(--check 로 비교)' },
        { path: 'tests/e2e/subway-live.spec.js', label: 'subway-live.spec.js', description: '런처 여부·움직임·노선 깔기·문서에 안 남기기·키 없음·빈 운행' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '두 기능 모두 수치를 짐작이 아니라 실측으로 정했고, 그 근거를 코드 머리말과 설계 문서에 남겼습니다. 지하철은 진행 방향 판정 방식 셋을 실제 이동 기록에 대 보고(88.8% · 98.1% · 99.4%) ' +
            '가장 나은 것을 골랐으며, 버스는 201번 노선을 100초 동안 다섯 번 조회한 결과로 "좌표는 그대로인데 정류장만 바뀐다" · "큰 점프를 속도로 해석하면 안 된다" 같은 규칙을 뽑았습니다. ' +
            '그리고 둘 다 그 관측을 테스트 fixture 로 옮겨 라이브 호출 없이 검증합니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '제주 버스 설계 문서가 "하지 않는 것" 을 분명히 적었습니다 — 도착 예측·미래 위치 추정·전역 조회는 후속 범위이고, 정류장을 임의로 "다음 정류장" 이라 부르지 않으며, ' +
            '유효하지 않은 응답을 "운행 차량 없음" 으로 바꾸지 않습니다. 지도 개요에서 "비목표가 문서로 남아 있지 않다" 고 짚었던 빈자리가, 적어도 이 기능에서는 채워졌습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '두 기능의 코드 모양이 극단적으로 다릅니다. subway-live.js 는 한 줄마다 근거 주석이 붙은 반면, jeju-bus-* 세 파일은 주석이 거의 없고 세미콜론으로 이은 압축 문체입니다. ' +
            '설계 문서가 자세해 의도는 복원할 수 있지만, 코드와 문서의 연결(어느 함수가 표의 어느 칸인지)이 코드 쪽에는 남아 있지 않습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '지하철 화면은 여전히 mountMapEditor 안에 있고 제주 버스 화면만 jeju-bus-map.js 로 떼어 냈습니다. 설계 문서가 "지하철을 공통 교통 모듈로 재구성하지 않는다" 고 범위를 정한 결과지만, ' +
            '같은 종류의 층을 두 방식으로 붙여 둔 상태라 세 번째 교통 수단이 오면 어느 쪽을 따를지부터 정해야 합니다.',
        },
      ],
    }),

    mod('subway-stations.js', {
      group: '지도',
      title: 'subway-stations.js — 수도권 전철 역 좌표·이웃 표',
      subtitle: '생성물 — 손으로 고치지 말고 tools/build-subway-stations.mjs 로',
      summary:
        '실시간 열차 위치를 그리려고 수도권 노선마다 {역 이름 → [위도, 경도]} 와 {역 이름 → 이웃 역들} 을 담은 표입니다. ' +
        'OpenStreetMap 노선 관계의 정차역 순서와 좌표에서 만들었고, 키는 실시간 API 의 statnNm 을 정규화한 이름(공백·괄호 부역명·끝의 "역" 제거)입니다. ' +
        '종착역 자리에만 오는 가상 이름(성수지선 등)과 그 갈래의 끝 역 별칭도 함께 둡니다.',
      usage: [
        {
          title: '역 번호로 순서를 짐작하지 말 것',
          body:
            'statnId 뒤 여섯 자리가 역 순서처럼 보이지만 아닙니다 — 신분당선은 자리수가 늘어 689 다음이 6810 이고, 공항철도는 나중에 끼운 역이 가지번호를 받습니다. ' +
            '그래서 순서는 반드시 이웃(n) 표로만 보게 하고, 그 이유를 파일 머리말 경고로 남겼습니다.',
        },
        {
          title: '이웃에는 방향이 없다',
          body:
            '진행 방향은 이 표가 아니라 subway-live.js 가 "직전에 있던 역이 아닌 쪽" 으로 정합니다. 순환선·지선·회차를 표 하나로 다루려면 방향 없는 그래프가 맞습니다.',
        },
        {
          title: '관계 번호를 못박아 둔다',
          body:
            '한 노선에 OSM 관계(운행 계통)가 수십 개라 자동으로 고르면 급행·구간운행 계통이 뽑혀 역이 빠집니다. 생성기가 노선·지선마다 가장 길게 도는 관계를 번호로 고정하고, ' +
            'Overpass 미러 세 곳을 짧은 제한 시간으로 돌아가며 씁니다 — 한도를 넘긴 요청을 거절 대신 붙들어 두는 서버라 길게 기다릴수록 손해라는 관찰이 주석에 있습니다.',
        },
      ],
      files: [
        { path: 'tests/subway-stations.test.js', label: 'subway-stations.test.js', description: '이웃 대칭·연결성·거리 타당성·이름 정규화·노선 목록 세 곳 일치' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '노선 이름 목록이 이 표·main.go·launcher.cs 세 곳에 있는데(런처는 노선 이름을 URL 경로에 넣으므로 목록에 있는 것만 통과시킴), 테스트가 세 곳을 함께 읽어 같은지 봅니다. ' +
            '표에만 노선을 더하면 런처가 400 을 돌려주는 종류의 어긋남을 빌드 시점에 잡습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '표를 검증하는 방식이 "값이 맞는가" 가 아니라 "그래프로서 성립하는가" 입니다 — 이웃 대칭, 외톨이 역 없음, 노선이 끊긴 조각 없이 이어짐, 이웃 사이 거리가 그럴듯함.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '생성물이지만 src/js 에 있고 시작 스크립트로 실립니다. 실시간 열차를 켜지 않는 사용자도 매번 파싱하며, 같은 시기에 생성물인 한글 글꼴은 vendor 의 지연 묶음으로 옮겨졌습니다. ' +
            'OSM 데이터(ODbL)라 화면에 출처를 함께 보여야 한다는 조건도 머리말에 있습니다.',
        },
      ],
    }),

    mod('subway-live.js', {
      group: '지도',
      title: 'subway-live.js — 역 사건을 움직이는 열차로 (MNSubwayLive)',
      subtitle: 'DOM·fetch 없는 순수 모듈 — 실측으로 정한 규칙 셋',
      summary:
        '실시간 API(realtimePosition)는 좌표를 주지 않고 "어느 역에 어떤 상태로" 라는 사건만 줍니다. 그대로 그리면 열차가 역에서 역으로 순간이동합니다. ' +
        '이 모듈은 그 사건을 역 좌표·이웃 표에 얹어 "지금 이 열차는 두 역 사이 몇 % 지점" 을 계산합니다. 화면·통신은 map-viewer.js 가 맡습니다.',
      usage: [
        {
          title: '① 진행 방향은 직전 역이 아닌 쪽',
          body:
            '상·하행 표시만 보면 88.8%, 종착역까지 최단경로로 보면 98.1%, 직전 역을 쓰면 99.4% 가 맞았습니다. 상·하행은 지선 있는 노선에서 무너지고(1호선 50%), ' +
            '최단경로는 순환선을 먼 쪽으로 도는 열차와 회차 직전이라 종착역이 이미 바뀐 열차에서 틀립니다. 갈래가 둘 이상인 분기역에서만 종착역으로 고릅니다.',
        },
        {
          title: '② 늦게 찍히는 "출발" 때문에 뒤로 튀지 않게',
          body:
            '"출발" 사건은 실제보다 50초쯤 늦게 찍혀, 최신 행만 보면 같은 구간에서 진행률이 뒤로 밀립니다. positionOf 가 같은 구간을 가리키는 사건끼리 가장 많이 간 값을 씁니다.',
        },
        {
          title: '③ 속도는 도착 → 다음 역 도착으로 쟀다',
          body:
            '291건의 중앙값이 127초였고, 정차 45초 + 거리÷15m/s 가 가장 잘 맞았습니다. 진행률을 0.97 에서 막으면 위치 오차 중앙값이 39m 입니다 — ' +
            '"늦게 도착하느니 미리 가서 기다린다" 는 선택이 주석에 그대로 적혀 있습니다.',
        },
      ],
      features: [
        { title: 'ingest', body: '받아 온 행을 열차별 사건 이력(최대 6개)에 녹이고, 같은 (보고 시각·역·상태)는 한 번만 담습니다. 이번 응답에 없는 열차 키를 돌려줘 화면이 지우게 합니다.' },
        { title: 'positionOf · coordsOf', body: '지금 시각의 구간·진행률과, 두 역을 곧게 이은 선 위의 좌표. 실제 선로 곡선은 쓰지 않습니다.' },
        { title: 'useTable', body: '테스트에서 표를 직접 건네 전역 없이 검증합니다.' },
      ],
      files: [
        { path: 'tests/subway-live.test.js', label: 'subway-live.test.js', description: '이름 정규화·방향 판정 실측 재현·분기·회차·되돌림 방지·끊긴 열차 숨김' },
        { path: 'tests/fixtures/subway-live-moves.json', label: 'subway-live-moves.json', description: '방향 판정 비율을 재현하는 실측 이동 기록' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"바꾸기 전에 근거를 보라" 는 머리말과 함께 세 규칙의 실측 수치를 남겼고, 테스트가 그 수치를 fixture 로 다시 계산합니다 — "직전 역을 쓰면 실측 이동의 99% 이상에서 다음 역을 맞힌다" 가 테스트 제목입니다. ' +
            '누군가 상·하행 판정으로 "단순화" 하면 비율이 떨어져 빨개집니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'parseTime 이 API 의 "2026-09-06 15:12:40" 을 new Date(연, 월, …) 로 읽어 PC 의 지역 시간대로 해석합니다. 값은 한국 시각이라 한국 PC 에서는 맞지만, ' +
            '시간대가 다른 PC 에서는 사건 시각이 몇 시간 어긋나 STALE_SECONDS(5분) 판정에 걸려 열차가 전부 사라지거나 진행률이 0.97 에 붙어 버립니다. +09:00 으로 고정해 읽는 편이 안전합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'map-viewer.js 가 MNSubwayLive 와 SUBWAY_LINES 를 쓰지만 manifest 의 scriptDependencies 에는 map-viewer.js → jeju-bus-map.js 만 있고 지하철 두 파일은 없습니다. ' +
            '지금은 로드 순서가 맞아 동작하지만, typeof 검사로 감싸 두었기 때문에 순서가 뒤집히면 오류 대신 🚇 단추가 조용히 사라집니다.',
        },
      ],
    }),

    mod('jeju-bus-api.js', {
      group: '지도',
      title: 'jeju-bus-api.js — 제주 버스 응답 정규화 (MNJejuBusApi)',
      subtitle: '수신 시각을 GPS 측정 시각으로 쓰지 않는다',
      summary:
        '런처의 /jeju-bus-routes·route·shape·position 을 부르고, 제주 버스정보 사이트의 응답을 공급자와 무관한 모양으로 바꿉니다. ' +
        '노선은 {id, number, from, to, description, type}, 차량은 {id, label, at, stationId, stationName, observedAt:null} 이고, ' +
        '위치 응답에는 런처가 헤더로 준 원본 수신 시각·캐시 나이·지연 여부·Retry-After 를 붙입니다.',
      usage: [
        {
          title: '제주 범위 밖 좌표는 버린다',
          body:
            'coords 가 위도 33~33.7, 경도 126~127.1 안의 유한한 수만 받습니다. 0 좌표·NaN·빈 문자열이 (0, 0) 으로 조용히 통과해 지도가 바다 한가운데로 날아가는 일을 막습니다.',
        },
        {
          title: '"차량 없음" 과 "응답이 이상함" 을 가른다',
          body:
            '원본에 행이 있는데 유효한 차량이 하나도 안 나오면 빈 목록이 아니라 bus-invalid-data 예외를 던집니다. ' +
            '잘못된 응답을 "지금 운행 중인 버스가 없다" 로 보여 주면 학생이 사실로 받아들이기 때문입니다.',
        },
        {
          title: 'observedAt 은 늘 null',
          body:
            '원본에 차량 위치의 측정 시각이 없습니다. 받은 시각으로 채우면 "방금 측정한 위치" 처럼 보이므로 비워 두고, 신선도는 런처가 상류에서 받은 시각(fetchedAt)으로만 판단합니다.',
        },
      ],
      files: [
        { path: 'tests/jeju-bus-live.test.js', label: 'jeju-bus-live.test.js', description: '잘못된 응답·좌표 거부, 세부 노선 ID 유지, 정류장 정렬' },
        { path: 'tests/fixtures/jeju-bus-observations.json', label: 'jeju-bus-observations.json', description: '201번 노선 실측 응답에서 옮긴 최소 사례' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '공급자별 필드 이름(localY·localX·vhId·currStationNm)이 이 파일 밖으로 나가지 않습니다. 설계 문서가 예고한 TAGO 공식 API 로 바꿀 때 고칠 자리가 여기와 런처뿐인 구조입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '연결한 네 경로는 공식 개발자 API 가 아니라 제주 버스정보 사이트가 자기 화면에서 쓰는 조회 경로입니다. 설계 문서가 "안정성·이용 범위가 보장된다고 간주하지 않는다" 고 적고 ' +
            '버튼에도 "시범" 을 붙였습니다. 정식 배포 전 이용 조건 확인이 남은 일로 기록돼 있습니다.',
        },
      ],
    }),

    mod('jeju-bus-live.js', {
      group: '지도',
      title: 'jeju-bus-live.js — 차량 관측 이력과 이동 표시 (MNJejuBusLive)',
      subtitle: 'DOM 없는 계산 — 같은 좌표·캐시를 새 움직임으로 치지 않는다',
      summary:
        '정규화된 위치 응답을 차량별 상태(마지막 수신·좌표가 바뀐 시각·정류장만 바뀜·누락 횟수·이동 애니메이션)로 쌓고, ' +
        '지금 시각에 어디에 어떤 모양(흐림·숨김)으로 그릴지와 상태 문구를 돌려줍니다. 노선 경로가 있으면 좌표를 경로에 투영해 짧은 정상 이동만 경로를 따라 옮깁니다.',
      usage: [
        {
          title: '늦게 온 응답·캐시 재전달은 무시',
          body:
            'ingest 는 노선 키가 다르거나 fetchedAt 이 지금 상태보다 새롭지 않으면 아무것도 바꾸지 않습니다. 런처가 캐시를 다시 준 응답을 "또 관측됐다" 로 세면 ' +
            '누락 횟수와 신선도가 거짓으로 갱신됩니다.',
        },
        {
          title: '경로를 따라 옮기는 조건이 좁다',
          body:
            '두 좌표가 모두 경로 40m 안에 투영되고, 후보가 모호하지 않고(150m 넘게 떨어진 다른 후보가 비슷한 거리에 있으면 포기 — 왕복 노선의 반대편 차선), ' +
            '끊긴 구간을 건너지 않고, 앞으로 1.5km 이하이며, 수신 간격 대비 시속 100km 미만일 때만입니다. 아니면 이동선 없이 새 자리에 바로 놓습니다 — 건물·바다를 가로지르는 선을 만들지 않습니다.',
        },
        {
          title: '500m 넘는 이음새는 잇지 않는다',
          body:
            'prepareShape 가 경로 점 사이가 500m 를 넘으면 구간을 끊습니다. 실제 201번 경로에서 그런 이음새 두 곳이 발견됐고, 이어 그리면 노선이 엉뚱한 직선을 긋습니다.',
        },
      ],
      features: [
        { title: '누락 처리', body: '정상 응답에서 한 번 빠지면 흐리게, 연속 두 번이면 제거. 유효한 빈 응답이면 즉시 비웁니다.' },
        { title: '신선도', body: '마지막 수신 2분 이상 흐림, 5분 이상 숨김. 좌표가 90초 이상 같으면 "위치 변화 확인 안 됨" — 정차·오류·운행 종료로 단정하지 않습니다.' },
        { title: '움직임 줄이기', body: 'prefers-reduced-motion 이면 애니메이션 없이 표시 좌표만 바꿉니다.' },
      ],
      files: [
        { path: 'tests/jeju-bus-live.test.js', label: 'jeju-bus-live.test.js', description: '실측 좌표 갱신·정류장만 갱신·큰 점프, 캐시·역순 응답, 누락·지연 단계, 경로 이동' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '표시 규칙이 설계 문서의 표(상황 → 표시 동작) 와 한 줄씩 대응하고, 각 줄이 테스트 하나로 옮겨져 있습니다. "움직이는 척하지 않는다" 는 이 기능의 핵심 약속이 ' +
            '캐시·역순 응답·정류장만 바뀐 응답·큰 점프 네 갈래 모두에서 검증됩니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '500m·40m·150m·1.5km·시속 100km·1.8초·90초·2분·5분이 전부 이름 없는 숫자로 코드에 박혀 있습니다. 설계 문서는 "실측 보장이 아닌 초기 설정값이며 추가 표본으로 조정한다" 고 했는데, ' +
            '조정할 자리가 상수로 모여 있지 않아 문서의 어느 값이 코드의 어느 숫자인지 찾아야 합니다. subway-live.js 가 DWELL_SECONDS 같은 이름을 붙여 둔 것과 대조됩니다.',
        },
      ],
    }),

    mod('jeju-bus-map.js', {
      group: '지도',
      title: 'jeju-bus-map.js — 제주 버스 패널과 Leaflet 층 (MNJejuBusMap)',
      subtitle: '지도에만 속하는 실시간 층 — .map 모델과 사용자 표시를 고치지 않는다',
      summary:
        '지도 도구막대의 🚌 제주 버스 단추, 노선 검색·세부 노선 선택 패널, 경로·정류장·차량 층, 30초 조회와 1초 틱, 캡처 고정·재개, 정리까지 담당합니다. ' +
        'map-viewer.js 는 mount 한 번과 캡처 때 freeze()·captureNote() 호출만 합니다.',
      usage: [
        {
          title: '세대 번호로 늦은 응답을 버린다',
          body:
            '노선 검색·세부 노선 선택·실시간 조회가 각자 세대 번호와 AbortController 를 둡니다. 노선을 바꾸거나 끄면 번호를 올리고 요청을 취소하는데, ' +
            '취소가 늦어 응답이 도착해도 번호가 다르면 적용하지 않습니다.',
        },
        {
          title: '실패 간격을 늘리고 Retry-After 를 지킨다',
          body:
            '조회가 실패하거나 런처가 지연(stale) 응답을 주면 다음 조회를 30 → 60 → 120초로 미루고, 런처가 전한 Retry-After 가 더 길면 그것을 따릅니다.',
        },
        {
          title: '캡처하는 동안은 멈춘다',
          body:
            'freeze() 가 조회·그리기를 멈추고 재개 함수를 돌려줍니다. 칠판·PNG·인쇄 캡처 중에 차량이 움직이지 않고, 캡처 그림에는 "제주 버스 위치 · 마지막 수신 시각 · bus.jeju.go.kr" 이 함께 새겨져 ' +
            '정지 그림이 지금 화면으로 오해되지 않게 합니다.',
        },
      ],
      features: [
        { title: '능력 프로브', body: '/can-proxy-jeju-bus 가 yes 일 때만 단추를 켭니다. 브라우저로 그냥 연 경우와 Go 폴백 런처에서는 이유를 title 로 밝힌 채 비활성입니다.' },
        { title: '첫 표시만 맞춤', body: '지도를 켤 때 한 번만 노선 전체로 이동하고, 새 응답마다 사용자가 옮겨 둔 화면을 바꾸지 않습니다. "노선 전체 보기" 로 다시 맞춥니다.' },
        { title: '색만으로 구분하지 않기', body: '노선 유형 색에 노선번호 글자를 함께 붙이고, 단추에 aria-pressed·aria-expanded 를, 상태 줄에 aria-live 를 둡니다.' },
      ],
      files: [
        { path: 'tests/jeju-bus-controller.test.js', label: 'jeju-bus-controller.test.js', description: '늦은 응답 무시·닫을 때 정리·숨김 중 중지·캡처 고정·실패와 빈 운행 구분' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '정리 경로가 빠짐없습니다. destroy 가 타이머·visibilitychange·zoomend·세 AbortController·패널·단추·Leaflet pane 까지 떼고, 그 destroy 를 doc.cleanupFns 에 등록합니다. ' +
            '지도 탭을 닫았는데 30초마다 제주 사이트를 부르는 유령 조회가 남는 일을 테스트("지도를 닫으면 요청·타이머를 정리한다")가 막습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '노선 검색과 세부 노선 선택이 둘 다 먼저 stopLive() 를 부르는데, stopLive 는 끝에서 상태 줄을 "제주 버스 표시를 껐어요." 로 씁니다. ' +
            '그래서 한 번도 켜지 않은 채 노선을 검색하기만 해도 패널 상태 줄에 "껐어요" 가 남습니다. 켜져 있을 때만 그 문구를 쓰거나, 끄기 동작과 초기화를 나누는 편이 맞습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '이 파일은 module.exports 가 없어 테스트가 소스를 vm 으로 읽고 Leaflet·DOM 을 흉내 내 검증합니다. 순수 계산(jeju-bus-live.js)을 따로 뺀 덕에 화면 쪽 테스트는 수명·취소 규칙에만 집중합니다.',
        },
      ],
    }),
  ];
};
