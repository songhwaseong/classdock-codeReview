// 8. learning-tools — 일기장(.diary) · 여행일지(.trip) · 그 곁의 NEIS 조회(neis-api.js).
//
// learning-tools 계층이지만 diary.js·trip.js 두 파일이 합쳐 만 줄을 넘고, 여행일지가 일기장의 종이 엔진을
// 그대로 빌려 쓰므로 50-learning.mjs 에서 떼어 함께 읽는다. 악보(55-music)·DB 클라이언트(58-db-client)와
// 같은 이유이고, 카테고리가 같으므로 사이드바에서는 learning-tools 안의 "일기장·여행일지" 묶음으로 이어 붙는다.
//
// 여행일지가 쓰는 korea-coords.js(국내·해외 판정)는 document-editors 계층이라 지도(45-map.mjs)에서 읽는다.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { linesLabel, topLevelFunctionSpan, functionShare } from '../lib/source-metrics.mjs';

// 파일 판 번호도 손으로 적지 않는다 — 이 두 상수는 2주 사이에 열 번 넘게 올랐다.
const constNumber = (rootDir, relativePath, name) => {
  try {
    const match = new RegExp(`^const ${name} = (\\d+);`, 'm').exec(readFileSync(path.join(rootDir, relativePath), 'utf8'));
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
};

export default ({ helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const G = '일기장·여행일지';
  // 줄 수·함수 길이·판 번호는 생성 때 잰다(lib/source-metrics.mjs).
  const diaryLines = linesLabel(rootDir, 'src/js/diary.js');
  const tripLines = linesLabel(rootDir, 'src/js/trip.js');
  const span = (file, name) => {
    const fn = topLevelFunctionSpan(rootDir, file, name);
    return fn ? `${fn.span.toLocaleString('en-US')}줄` : '';
  };
  const diaryEditor = span('src/js/diary.js', 'mountDiaryEditor');
  const diaryPaper = span('src/js/diary.js', 'mountDiaryPaper');
  const diaryPanels = span('src/js/diary.js', 'mountDiaryPanels');
  const tripEditor = span('src/js/trip.js', 'mountTripEditor');
  const diaryEditorShare = functionShare(rootDir, 'src/js/diary.js', 'mountDiaryEditor');
  const tripEditorShare = functionShare(rootDir, 'src/js/trip.js', 'mountTripEditor');
  const diaryVersion = constNumber(rootDir, 'src/js/diary.js', 'DIARY_VERSION');
  const tripVersion = constNumber(rootDir, 'src/js/trip.js', 'TRIP_VERSION');

  return [
    sec({
      id: 'diary-overview',
      category: '8. learning-tools',
      group: G,
      title: '일기장·여행일지 개요 (.diary · .trip)',
      subtitle: `diary.js ${diaryLines} + trip.js ${tripLines} — 종이 엔진 하나를 두 문서가 나눠 쓴다`,
      summary:
        '일기장은 "날짜 → 종이 한 장" 을 달력으로 묶은 개인 다이어리이고, 여행일지는 "여행 한 건 → 날 → 들른 곳" 을 여정 띠로 묶은 기록입니다. ' +
        '뼈대(달력 대 여정)가 달라 문서는 둘로 두되, 줄 무늬·스티커·그리기·조명·인쇄를 그리는 종이 엔진은 diary.js 안에 하나만 두고 trip.js 가 빌려 씁니다. ' +
        '두 형식 모두 무압축 ZIP(본문 JSON + assets/<해시>) 이고, 사진·녹음·영상 바이트는 SHA-256 앞 20자리 이름으로 한 번만 담깁니다.',
      usage: [
        {
          title: '일기장에 얹지 않고 새 문서로 — 대신 종이만 떼었다',
          body:
            '여행일지 설계 문서는 세 안(일기장에 purpose 얹기 · 종이 엔진 통째 추출 · 종이 한 장 그리는 부분만 떼기)을 견주고 세 번째를 골랐습니다. ' +
            `그 결과가 mountDiaryPaper(${diaryPaper})와 꾸미기·스티커 창 mountDiaryPanels(${diaryPanels})이고, 인쇄 종이 diaryBuildPrintPaper 와 ZIP 읽기도 함께 씁니다. ` +
            '여행일지는 같은 DOM 뼈대를 만들어 넘기고 행동만 받아 갑니다.',
        },
        {
          title: '떼어 내기를 실측으로 했다',
          body:
            '처음 잰 종이 구역의 바깥 의존은 64개였고, ① 꾸미기 창 동기화를 창 곁으로 ② 바·창 위젯을 되부름 넷으로 ③ 상태를 읽기 창구로 — 세 걸음마다 다시 재서 ' +
            '"경계 넘는 쓰기 0 · 위젯 0" 을 확인한 뒤에 함수를 떼었습니다. 그 표와 밟은 함정(ctx 라는 이름이 캔버스 컨텍스트와 겹쳐 종이 높이가 0 이 된 일)이 설계 문서에 그대로 있습니다.',
        },
        {
          title: '글은 textarea, 사진은 스티커',
          body:
            '글이 사진을 비켜 흐르게 하려면 contenteditable 이 필요한데, .mnote 때 표·이미지·커서 버그로 일부러 피한 길이라 다시 들이지 않았습니다. ' +
            '사진·그림·글상자·녹음은 종이 위에 뜬 스티커이고 자리·크기·글자 크기는 모두 종이 폭에 대한 비율이라, 창 폭이나 인쇄 폭(680px)이 달라도 같은 자리·같은 줄바꿈에 섭니다. ' +
            '원고지에서도 textarea 를 커서 자리에 숨긴 입력칸으로만 쓰고 칸은 따로 그려, IME·되돌리기·맞춤법을 그대로 살렸습니다.',
        },
      ],
      features: [
        { title: '일기장', body: '달력·찾기·돌아보기(월간·연간·기분 지도), 날씨·기분·태그·즐겨찾기, 글감, 기념일, 그림일기·원고지, 손글씨 글꼴, 조명, 파일 암호·화면 잠금, 인쇄·Markdown·HTML 내보내기.' },
        { title: '여행일지', body: '여정 띠, 들른 곳(시각·좌표·종류·경비·사진·영상), 살아 있는 지도 칸과 굳힌 지도 그림, EXIF·날씨·다녀온 지역·환율, 준비물, 되돌아보기, 연대표·지도·일기장으로 보내기.' },
        { title: '우리 학교', body: 'neis-api.js — 일기장 달력에 급식·학사일정·시간표를 얹습니다. 고른 학교는 파일이 아니라 이 브라우저에만 둡니다.' },
      ],
      files: [
        { path: 'docs/일기장-설계.md', label: '일기장-설계.md', description: '결정 표 · 파일 형식 · 암호 봉투 · 단계별로 더한 것과 밟은 함정 · 접점표' },
        { path: 'docs/여행일지-설계.md', label: '여행일지-설계.md', description: '새 문서로 둔 이유 · 결정 다섯 · 종이 엔진 떼어 내기 실측 · 단계 기록' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '두 설계 문서가 "결정 → 이유 → 밟은 함정" 을 같은 모양으로 쌓았습니다. 특히 접점표 끝의 "새 필드 추가 — normalize·clean·isEmpty 세 곳을 함께, 하나라도 빠지면 저장에서 사라진다" 는 ' +
            '한 번 겪은 사고를 다음 사람이 피하도록 일반 규칙으로 바꿔 둔 문장이고, 여행일지 설계가 같은 줄을 그대로 물려받았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            (diaryVersion && tripVersion
              ? `파일 판 번호가 빠르게 오릅니다 — 지금 일기장 ${diaryVersion}판 · 여행일지 ${tripVersion}판이고, 일기장 설계 문서가 8판이던 2026-09-20 무렵부터 2주 남짓 사이의 일입니다. `
              : '파일 판 번호가 빠르게 오릅니다. ') +
            '규칙은 "옛 앱이 모르는 값을 버린 채 덮어쓰느니 새 파일을 거절한다" 로 옳지만, 조명 견본 다섯 개를 더하는 일까지 판을 올리니 ' +
            '조금 옛 ClassDock 을 쓰는 다른 PC(교사와 학생, 집과 학교)에서는 어제 만든 파일이 열리지 않습니다. 모르는 필드·모르는 자산을 읽은 그대로 들고 있다가 다시 쓰는 길(라운드트립 보존)을 열면, ' +
            '판은 "옛 앱이 잘못 그리게 되는" 변화에만 올리면 됩니다. 같은 앱의 복불복(pick.js)이 이미 "모르는 게임 설정은 그대로 들고 간다" 로 이렇게 하고 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `설계 문서가 피하려던 모양이 여행일지에서 다시 생겼습니다. 일기장 설계 때 mountDiaryEditor 가 "한 덩어리 클로저라 지금 모양으로는 못 쓴다" 고 진단했는데, ` +
            `지금 mountDiaryEditor 는 ${diaryEditor}(파일의 ${diaryEditorShare}%)이고 새로 만든 mountTripEditor 는 ${tripEditor}(파일의 ${tripEditorShare}%)로 그보다 큽니다. ` +
            '지도 칸·장소 목록·경비·되돌아보기가 모두 한 클로저 안이라, 다음에 장소 목록만 다른 곳에서 쓰고 싶어지면 종이 때와 같은 떼어 내기를 처음부터 다시 해야 합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '두 설계 문서의 머리가 본문을 따라가지 못했습니다. 여행일지 설계 문서는 첫 줄 상태가 아직 "검토 완료, 구현 없음" 이고, 본문에 "체험학습·답사 갈래" 표가 걷어낸 뒤에도 남아 있습니다(맨 위 안내로만 알림). ' +
            '일기장 설계 문서는 형식 예시가 version 8 이고, 맨 끝 "다음 후보" 에 이미 끝낸 내보내기·맞춤법·내 글감이 그대로 있습니다. 둘 다 접점·함정 기록이 좋은 문서라 머리만 고치면 됩니다.',
        },
      ],
    }),

    mod('diary.js', {
      group: G,
      title: 'diary.js — 일기장과 공용 종이 엔진',
      subtitle: '형식·ZIP·암호 봉투·종이·창·편집기를 한 파일에',
      summary:
        '앞쪽은 DOM 없이 부를 수 있는 전역 함수입니다 — 형식 정규화, 무압축 ZIP 쓰기·읽기, 암호 봉투, 원고지 배치, 줄 무늬·종이 효과, 스티커 정규화, 내장 그림 표, 조명 SVG, 내보내기. ' +
        `뒤쪽은 세 마운트 함수입니다: 종이 한 장의 행동 mountDiaryPaper(${diaryPaper}), 꾸미기·스티커 창 mountDiaryPanels(${diaryPanels}), 일기장 화면 전체 mountDiaryEditor(${diaryEditor}). ` +
        '앞의 둘은 여행일지가 함께 씁니다.',
      usage: [
        {
          title: 'ZIP 을 직접 만든다',
          body:
            '사진은 이미 압축돼 있어 DEFLATE 로 줄일 게 없고, JSZip 은 지연 로드라 새 문서 뼈대를 동기로 만들 수 없습니다(폴더에서 새로 만들기의 makeContent 가 동기여야 함). ' +
            '그래서 STORE 로 직접 쓰고, 읽기는 남이 다시 묶은 DEFLATE 항목도 브라우저 내장 DecompressionStream 으로 받습니다.',
        },
        {
          title: '암호 봉투는 ZIP 전체를 감싼다',
          body:
            'diary.json 만 잠그면 사진이 그대로 보이므로 ZIP 바이트 전체를 PBKDF2-SHA256(600,000회) → AES-256-GCM 으로 봉인합니다. ' +
            '머리 40바이트(표지·반복 수·salt·IV)도 추가 인증 데이터로 묶어 반복 수를 몰래 낮추는 변조를 막고, 읽을 때 반복 수가 정한 범위 밖이면 계산 전에 거절합니다. ' +
            '키는 extractable:false CryptoKey 로만 들고, 다시 저장할 때마다 IV 를 새로 뽑습니다. 자동 복구본·작업공간 사본도 같은 봉투로 쓰고, 문서별 큐로 평문 복구본이 암호 저장본을 뒤늦게 덮지 못하게 합니다.',
        },
        {
          title: '열 때 신뢰하지 않는다',
          body:
            '날짜는 실제 있는 날만, 자산 이름은 정해 둔 꼴(assets/[a-z0-9_-]+.확장자)이면서 ZIP 안에 실제로 있어야 받습니다. 가리키는 바이트가 없는 스티커·배경, 모르는 내장 그림 이름은 버립니다. ' +
            '저장할 때는 모델이 가리키는 자산만 담아, 뗀 스티커의 사진은 다음 저장에서 빠집니다.',
        },
      ],
      features: [
        { title: '스티커 네 갈래', body: '사진·내장 그림·글상자·녹음. 그림과 글상자는 바이트 없이 이름·색·글만 저장해 여든 장을 붙여도 파일이 거의 안 늡니다.' },
        { title: '화면 잠금', body: '암호 일기장에서 즉시·5·10·30분 자동 잠금. 같은 암호를 PBKDF2 로 다시 확인합니다(검증 바이트는 저장하지 않음).' },
        { title: '내보내기', body: 'Markdown(줄 머리의 #·>·- 를 막음)과 HTML(사진·녹음을 data: 로 넣은 한 파일, 모든 글을 이스케이프).' },
        { title: '여행일지에서 받기', body: 'doc._diaryReceiveEntry — 그날 일기가 있으면 뒤에 이어 붙이고 받은 스티커는 있던 것 아래로 내립니다. 되돌리기 한 번.' },
      ],
      files: [
        { path: 'tests/diary.test.js', label: 'diary.test.js', description: 'ZIP 왕복·DEFLATE 읽기·암호 봉투 변조·옛 판 열기·돌아보기·스티커 갈래' },
        { path: 'tests/diary-lighting.test.js', label: 'diary-lighting.test.js', description: '종이 조명' },
        { path: 'tests/e2e/diary.spec.js', label: 'diary.spec.js', description: '쓰기·스티커·드롭·꾸미기·저장·새로고침 복구' },
        { path: 'tests/e2e/diary-extras.spec.js', label: 'diary-extras.spec.js', description: '맞춤법(F7)·내 글감·사진 테두리·녹음 스티커·기념일' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '암호 봉투를 교과서대로 만들었습니다 — 머리까지 인증하고, 파일이 주는 KDF 반복 수에 위아래 한계를 두고, 키를 꺼낼 수 없게 두고, 암호 변경·제거는 저장이 성공했을 때만 확정합니다. ' +
            '그리고 할 수 없는 것을 먼저 적었습니다: "암호를 잊으면 복구할 수 없다", "화면 잠금은 DOM 을 가릴 뿐 메모리의 모델을 지우지 않는다". 테스트가 봉투를 한 바이트 바꿔 인증 실패를 확인합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'ZIP 읽기(diaryZipRead)가 압축 해제 뒤의 크기를 제한하지 않습니다. 항목 크기 상한(64MB)은 중앙 디렉터리에 적힌 값으로만 보고, DEFLATE 항목은 DecompressionStream 결과를 끝까지 메모리에 모읍니다. ' +
            '게다가 diary.json·assets/ 로 거르기 전에 모든 항목을 풉니다. 적힌 크기를 작게 속인 압축 폭탄 .diary·.trip 하나면 탭이 메모리를 다 쓰고 죽습니다 — 교사와 학생이 서로 파일을 건네는 앱이라 남이 만든 파일을 여는 일이 흔합니다. ' +
            '필요한 이름만 풀고, 풀면서 상한을 넘으면 스트림을 끊는 편이 맞습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '사진 원본을 그대로 담는 길이 위치 정보를 남깁니다. diaryPrepareImage 는 긴 변이 상한 이하이고 1.5MB 이하인 사진을 다시 굽지 않고 원본 바이트로 담는데, 그 원본의 EXIF 에 GPS 가 있으면 .diary·.trip 과 HTML 내보내기에 함께 실립니다. ' +
            '여행일지는 "GPS 는 개인정보라 누른 사진만 읽는다" 고 읽기를 막았고 영상 줄이기는 -map_metadata -1 로 위치를 지우는데, 정작 작은 사진(과 8MB 이하라 줄이지 않는 영상)은 위치를 품은 채 저장됩니다. ' +
            '원본을 지킬 때도 EXIF 만 걷어 내는 한 단계가 있으면 세 길의 규칙이 맞습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '읽을 때 CRC 를 확인하지 않습니다. 암호 일기장은 GCM 인증이 무결성을 대신하지만, 평문 ZIP 의 깨진 사진은 깨진 채로 열립니다(쓸 때는 CRC 를 계산해 넣습니다).',
        },
      ],
    }),

    mod('trip.js', {
      group: G,
      title: 'trip.js — 여행일지',
      subtitle: '여정 띠 + 일기장 종이 + 지도 칸 — 장소는 스티커와 따로 둔다',
      summary:
        '여행 한 건을 날짜별 "날" 로 나누고, 날마다 일기장과 같은 종이와 들른 곳(spots) 목록을 둡니다. 장소는 시각·이름·주소·좌표·종류·메모·경비·사진·영상을 갖고, ' +
        '지도 칸·경비 합계·연대표 내보내기·되돌아보기가 모두 이 목록을 읽습니다. 형식·ZIP·사진 줄이기·스티커 정규화·종이·창·인쇄 종이는 diary.js 의 것을 부르고, ' +
        `화면 전체는 mountTripEditor(${tripEditor}) 한 함수입니다.`,
      usage: [
        {
          title: '장소를 스티커로 두지 않은 이유',
          body:
            '스티커는 "종이 위 좌표" 이고 장소는 지도·일정·경비 세 화면이 함께 읽는 자료라 성격이 다릅니다. 같은 사진을 장소와 스티커가 함께 가리켜도 해시 이름이라 바이트는 한 벌입니다.',
        },
        {
          title: '국내·해외는 한 곳에서',
          body:
            'tripIsDomestic(model) 하나가 좌표 있는 장소들로 정하고, 좌표가 하나도 없으면 국내로 봅니다. 해외 문서에서는 기상청 날씨·특일·색칠 지도 같은 국내 전용 단추를 감출 뿐 이미 든 값은 보여 주고, ' +
            '환율은 반대로 해외에서 켜집니다. 단추마다 따로 재면 어떤 것은 감춰지고 어떤 것은 남는다는 것이 한 곳에 둔 이유입니다.',
        },
        {
          title: '지도는 두 겹 — 굳히기는 단추로만',
          body:
            '편집 중에는 살아 있는 Leaflet 칸, 인쇄에는 굳힌 그림(날마다 한 장 + 전체 한 장)을 씁니다. canFreeze 가 설계의 규칙을 그대로 지킵니다 — 칸이 접혀 있으면, 타일이 아직 안 그려졌으면 단추를 끕니다(회색 사각형이 파일에 박히는 것이 가장 나쁜 결과). ' +
            '굳힐 때의 서명(stillKey)을 함께 저장해 장소가 바뀌면 "지도 그림이 낡았어요" 를 띄우고, 출처는 그림 자체에 새깁니다.',
        },
        {
          title: '사진의 때·자리는 누를 때만 읽는다',
          body:
            '사진 묶음에서 장소를 만드는 단추를 눌렀을 때만 EXIF(촬영 시각·GPS)를 읽고, 사진을 줄이기 전 원본에서 읽습니다. EXIF 가 없는 사진은 장소를 만들지 않고 그렇다고 알려 줍니다(메신저로 받은 사진이 흔히 그렇습니다).',
        },
      ],
      features: [
        { title: '장소 영상', body: '장소마다 3개, 한 개 2분·60MB, 문서 합계 300MB. EXE 에 ffmpeg 가 있으면 /shrink-media 로 720p·2Mbps 로 줄이고 위치 메타데이터를 지웁니다. 넣기 전에 실제 <video> 로 첫 장면이 나오는지 봅니다.' },
        { title: '경비·환율', body: '화폐가 섞이면 더하지 않고 따로 셉니다. 환율은 손으로 적어 굳힙니다.' },
        { title: '보내기', body: '연대표(여행 일정 모드)·지도 문서로 한 방향 내보내기, 그날을 일기장으로 보내기.' },
        { title: '거리', body: '대권 직선 거리만 셉니다. 화면에 늘 "직선" 이라고 적습니다.' },
      ],
      files: [
        { path: 'tests/trip.test.js', label: 'trip.test.js', description: '옛 갈래 버리기·좌표 불신·참조 자산·영상 한도·EXIF·국내 판정·동기 뼈대' },
        { path: 'tests/trip-user-templates.test.js', label: 'trip-user-templates.test.js', description: '사용자 템플릿' },
        { path: 'tests/e2e/trip.spec.js', label: 'trip.spec.js', description: '여정 띠·장소·지도 칸·굳히기가 막히는 경우·EXIF·내보내기·경비·인쇄의 자료 출처' },
        { path: 'tests/e2e/trip-video.spec.js', label: 'trip-video.spec.js', description: '장소 영상 넣기·재생·저장' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '갈래(체험학습·답사)를 걷어낸 방식이 깔끔합니다. 쓰는 사람이 없다는 이유로 없애면서 옛 파일의 purpose·질문·조사 항목은 읽을 때 버리게 하고, ' +
            '그 규칙을 테스트("체험학습·답사 갈래는 없다 — 옛 파일의 … 읽을 때 버린다")로 못 박았습니다. 처음에 갈래를 "자료가 아니라 말·기본값만 바꾸는 것" 으로 설계해 둔 덕에 걷어내는 데 자료 이전이 필요 없었습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '"조용히 사라지는" 종류의 버그를 형식 쪽에서 막았습니다. 굳힌 지도 그림·녹음·영상을 참조 자산 목록에 넣지 않으면 다음 저장에서 사라진다는 것을 미리 적고 테스트로 묶었고, ' +
            '영상 한 개 상한(60MB)은 ZIP 읽기 상한(64MB)보다 작아야 한다는 이유까지 상수 옆에 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '여행일지에는 암호가 없습니다. 설계 문서는 저장을 "무압축 ZIP + 일기장과 같은 암호 봉투" 로 정했고 "잠긴 여행일지라도 타일 캐시에는 남는다" 는 함정까지 적었지만, trip.js 는 봉투 함수를 한 번도 부르지 않습니다. ' +
            '날짜별 좌표와 사진이 든 여행일지는 일기장보다 더 많은 것(집·숙소·동선)을 드러내는 문서라, 일기장에만 잠금이 있는 것은 순서가 거꾸로입니다. 봉투는 이미 ZIP 바이트 전체를 감싸는 함수라 붙이는 비용도 작습니다.',
        },
      ],
    }),

    mod('neis-api.js', {
      group: G,
      title: 'neis-api.js — NEIS 학교 정보 (MNNeisApi)',
      subtitle: '학교 찾기·급식·학사일정·시간표 — 일기장의 "우리 학교"',
      summary:
        'NEIS 교육정보 개방 포털 응답을 읽어 일기장 달력에 급식·학사일정을, 날짜 칸에 시간표를 얹습니다. 조회는 런처의 /neis 를 거치고(키는 런처에만), ' +
        '고른 학교는 일기장 파일이 아니라 이 브라우저에 남깁니다 — 사용자 편의이지 일기의 내용이 아니기 때문입니다.',
      usage: [
        {
          title: '키가 없으면 다섯 줄만 온다',
          body:
            'NEIS 는 키 없이도 답하지만 샘플 5줄만 줍니다. 런처가 X-ClassDock-Neis-Sample 로 그 사실을 알리고, 이 파일이 total 과 비교해 "잘렸다(truncated)" · "반 목록이 모자란다(complete:false)" 를 화면에 넘깁니다. ' +
            '한 달 학사일정이 다섯 줄에서 끊긴 것을 "이 달은 행사가 다섯 개" 로 보이게 두지 않습니다.',
        },
        {
          title: '실측한 응답 모양을 머리말에',
          body:
            '정상·자료 없음·틀린 키의 모양, 급식 메뉴의 <br/> 와 알레르기 번호, 학교급마다 다른 시간표 서비스, 매주 있어 달력을 덮는 "토요휴업일" 을 빼는 이유가 2026-09-19 실측으로 적혀 있습니다.',
        },
      ],
      files: [
        { path: 'tests/neis-api.test.js', label: 'neis-api.test.js', description: '응답 해석' },
        { path: 'tests/e2e/neis-diary.spec.js', label: 'neis-diary.spec.js', description: '일기장의 우리 학교' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '샘플 응답을 정상 응답처럼 쓰지 않는 처리가 정직합니다. 키 없는 상태를 "안 됨" 으로 막지 않고 되는 만큼 보이되, 모자란 것은 모자라다고 말합니다 — 학년·반 목록이 모자라면 직접 치게 둡니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '"개인 다이어리" 로 설계한 일기장에 학교 정보가 붙으면서 성격이 학급 쪽으로 조금 넓어졌습니다. 학교 선택을 파일에 넣지 않은 것은 그 경계를 지킨 판단이라, 일기장 파일을 남에게 건네도 어느 학교인지는 따라가지 않습니다.',
        },
      ],
    }),
  ];
};
