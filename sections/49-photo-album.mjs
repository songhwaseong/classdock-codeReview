// 7. document-editors — 사진첩(photo-album.js)과 그 내보내기를 받치는 두 인코더(gif-encoder.js · mp4-writer.js).
//
// 사진첩은 파일 문서가 아니라 앱에 하나뿐인 탭이고, 원본은 EXE 의 앱 데이터 폴더(없으면 IndexedDB)에 둔다.
// photo-album.js 가 3천 줄대라 40-editors.mjs 에서 떼어 둔다. 런처 쪽 저장 경로(/photo-album-*)는
// 60-desktop.mjs 와 계약 카드에서 본다. mp4-writer.js 는 수업 리플레이(lesson-replay.js)도 함께 쓴다.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const G = '사진첩';
  const albumLines = linesLabel(rootDir, 'src/js/photo-album.js');
  const deps = manifest.scriptDependencies ?? {};
  const replayDeclares = (deps['lesson-replay.js'] ?? []).includes('mp4-writer.js');

  return [
    mod('photo-album.js', {
      group: G,
      title: 'photo-album.js — 사진첩',
      subtitle: `${albumLines} 한 IIFE — 사진 꾸미기·움직임·배경음악·감상 모드·GIF/MP4 내보내기`,
      summary:
        '사진·영상을 모아 두고 한 장씩 꾸미는 앱 안의 사진첩입니다. 안경·모자·옷·신발 장식, 직접 그린 장식, 글자·이모지를 얹고 색·무늬·테두리·그림자·반사·흐림과 움직임을 줍니다. ' +
        '사진마다 또는 사진첩 전체에 배경음악 재생목록을 걸고, 감상 모드에서 넘기기 효과와 함께 틀며, 움직이는 사진을 GIF·MP4 로 내보냅니다. ' +
        '파일을 여는 문서가 아니라 탭 하나뿐인 앱 기능이라, 열려 있던 탭만 작업공간 복원 때 다시 엽니다.',
      usage: [
        {
          title: '원본은 브라우저가 아니라 앱 데이터에',
          body:
            'EXE 로 돌면 원본을 %LOCALAPPDATA%\\ClassDock\\photo-album 에 GUID 이름의 .bin + .json 으로 둡니다. 런처는 실행마다 포트가 바뀌어 IndexedDB(포트별 origin)에 두면 다음 실행에서 사진이 "사라져" 보이기 때문입니다. ' +
            '런처가 없으면 IndexedDB 를 쓰고, 다음에 EXE 로 열면 예전 IndexedDB 항목을 한 번만 앱 저장소로 옮긴 뒤 지웁니다.',
        },
        {
          title: '런처 쪽은 이름을 GUID 로만',
          body:
            '/photo-album-file·meta·delete 는 id 를 Guid.TryParse 로만 받아 경로를 만들므로 경로 넘기기가 구조적으로 막힙니다. 메타데이터는 id 가 파일 이름과 같고 type 이 다섯 갈래 중 하나일 때만, ' +
            '원본이 있는 항목만 쓰며, 쓰기는 원자적으로 합니다. 목록 읽기에서 손상된 항목 하나는 건너뛰어 나머지 사진첩을 감추지 않습니다. 모든 경로가 실행별 토큰을 요구합니다.',
        },
        {
          title: '미리 듣기 · 감상 모드 · MP4 가 같은 소리',
          body:
            '재생목록의 곡별 구간·반복·음량·페이드·빠르기(음높이 유지)·곡 사이 겹침과 섞어 틀기 순서를 세 곳이 같은 함수로 계산합니다. 감상 모드는 <audio>, MP4 는 Web Audio 로 구워 AAC 로 넣는데, ' +
            '페이드 곡선을 고르는 규칙까지 둘이 같은 결과를 내도록 맞춰 두었습니다.',
        },
      ],
      features: [
        { title: '장식', body: '기본 그림, 직접 그린 그림(점 1,500개까지), 글자·이모지. 묶기·겹침 순서·자석 정렬·여러 개 고르기.' },
        { title: '효과', body: '색 입히기·무늬·테두리, 투명도 그라데이션·그림자·반사·흐림, 움직임(방향 기준으로 옮기고 돌리고 키우기).' },
        { title: '감상 모드', body: '넘기기 효과·빠르기는 브라우저에 기억. 움직임 줄이기 설정이면 흐려지기로 바꿉니다.' },
        { title: '내보내기', body: '움직이는 GIF(긴 변 640·256색), MP4(WebCodecs H.264 + AAC, 긴 변 1280, 6초 이상 되풀이), 정지 그림.' },
      ],
      files: [
        { path: 'tests/photo-album-harness.js', label: 'photo-album-harness.js', description: 'DOM 없이 PhotoAlbum 을 읽어 내부 함수를 시험하는 하네스' },
        { path: 'tests/photo-album-sound.test.js', label: 'photo-album-sound.test.js', description: '재생목록·섞기 순서·구간·페이드·빠르기' },
        { path: 'tests/photo-album-stickers.test.js', label: 'photo-album-stickers.test.js', description: '겹침 순서·묶음·크기 한도' },
        { path: 'tests/photo-album-effects.test.js', label: 'photo-album-effects.test.js', description: '그라데이션·그림자·반사가 화면과 내보내기에서 같은 기하' },
        { path: 'tests/photo-album-view-effects.test.js', label: 'photo-album-view-effects.test.js', description: '감상 모드 넘기기 효과' },
        { path: 'tests/photo-album-restore.test.js', label: 'photo-album-restore.test.js', description: '열려 있던 탭만 복원·다른 작업공간에서는 뒤에서' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '저장 위치를 고른 이유("포트가 바뀌어도 찾을 수 있도록")가 런처 상수 바로 위에 있고, 예전 IndexedDB 에 남은 사진을 버리지 않고 한 번 옮기는 길까지 만들었습니다. ' +
            '런처 쪽도 GUID 이름·type 검사·원자적 쓰기·손상 항목 건너뛰기로, 브라우저가 보낸 값을 그대로 경로나 파일 내용으로 쓰지 않습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '화면과 내보내기가 같은 계산을 쓰는지를 시험합니다 — "그림자는 돌리고 뒤집어도 사진 기준 같은 쪽으로", "반사·흐림은 내보내기에서 같은 간격·같은 흐림", "섞어 틀기는 미리 듣기·감상·MP4 가 같은 순서". ' +
            '내보낸 결과가 화면과 다르면 사용자는 버그로 여기는 종류라, 그 일치를 테스트로 묶은 것이 맞습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '사진첩 원본이 사용자가 볼 수 있는 파일 어디에도 없습니다. 앱 데이터 폴더에 GUID 이름으로만 있고, 앱의 백업(backup.js)에도 들어가지 않으며, 사진첩 전체를 내보내거나 다시 들여오는 길이 없습니다(한 장씩 그림·GIF·MP4 로만 나감). ' +
            'PC 를 바꾸거나 다시 설치하면 꾸민 사진첩이 통째로 남겨집니다. 일기장·여행일지가 "파일 하나 = 한 권" 으로 옮겨 다니는 것과 대조됩니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `${albumLines}이 머리말 주석 없이 const PhotoAlbum = (() => { 로 바로 시작합니다. 다른 새 파일들이 "무엇을 · 왜 · 실측 함정" 을 첫머리에 두는 것과 달리 이 파일은 구조를 알려 주는 첫 문단이 없고, ` +
            '전역 이름도 MN 접두사 없이 PhotoAlbum 이며 manifest 의 moduleBoundaries 에 없습니다. 단위 테스트는 하네스로 넉넉하지만 사진첩을 여는 e2e 는 없습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '원본 한 개를 256MB 까지 받는데, 런처는 요청 본문을 한 번에 byte[] 로 읽습니다. 인증 실패 요청은 본문을 읽기 전에 끊고 상한도 본문을 읽기 전에 보므로 남이 메모리를 쓰게 할 수는 없지만, ' +
            '큰 영상 몇 개를 연달아 올리면 런처 메모리가 그만큼 잠깐씩 튑니다.',
        },
      ],
    }),

    mod('gif-encoder.js', {
      group: G,
      title: 'gif-encoder.js — 움직이는 GIF 만들기 (MNGifEncoder)',
      subtitle: '외부 라이브러리 없이 미디언 컷 + LZW',
      summary:
        '여러 장면에서 고르게 뽑은 색으로 256색 팔레트를 하나 만들어(미디언 컷) 모든 장면이 함께 쓰고, LZW 로 압축해 GIF89a 를 씁니다. ' +
        '색이 256개 이하이면 그 색을 그대로 써 그림·글자 장식만 있는 장면은 한 점도 틀리지 않습니다.',
      files: [
        { path: 'tests/gif-encoder.test.js', label: 'gif-encoder.test.js', description: '머리(장면 수·지연·반복)·256색 이하 무손실·사진 색 줄이기 오차' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '테스트가 만든 GIF 를 다시 풀어 "색이 256개 이하면 한 점도 틀리지 않고 되살아난다" 를 확인합니다 — LZW 사전을 여러 번 비우는 큰 그림까지 넣어, 손으로 짠 압축기에서 가장 틀리기 쉬운 경계를 덮었습니다.',
        },
      ],
    }),

    mod('mp4-writer.js', {
      group: G,
      title: 'mp4-writer.js — H.264·AAC 조각을 MP4 로 (MNMp4Writer)',
      subtitle: 'WebCodecs 가 내준 조각을 moov 를 앞에 둔 MP4 로 묶는다',
      summary:
        'VideoEncoder 가 내준 avc 조각(과 AudioEncoder 의 AAC 조각)을 트랙마다 한 덩어리로 담고 moov 를 앞에 둬 받자마자 재생되는 MP4 를 만듭니다. ' +
        'B 프레임이 있으면 ctts 와 편집 목록으로 표시 시각을 맞추고, 조각마다 길이가 다른 영상(VFR)도 적을 수 있습니다 — 화면이 바뀔 때만 장면을 굽는 수업 리플레이를 위한 것입니다.',
      files: [
        { path: 'tests/mp4-writer.test.js', label: 'mp4-writer.test.js', description: '상자 순서·조각 크기와 위치·열쇠 장면·ctts·소리 트랙·VFR' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'moov 를 앞에 두려면 조각 시작 위치(stco)가 moov 크기에 달려 있는 닭과 달걀 문제가 생기는데, "한 번 재 보고 다시 만든다(숫자 크기만 바뀌어 길이는 같다)" 로 풀고 그 이유를 주석에 남겼습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            (replayDeclares
              ? ''
              : '사진첩과 수업 리플레이(lesson-replay.js) 두 곳이 쓰는데 manifest 의존은 photo-album.js → mp4-writer.js 하나뿐입니다. 리플레이 쪽은 typeof 로 감싸 두어, 로드 순서가 바뀌면 MP4 내보내기 단추가 오류 없이 사라집니다. ') +
            '또 상자 크기·조각 위치를 32비트(stco)로만 적고 결과 전체를 Uint8Array 하나로 모읍니다. 사진첩의 몇 초짜리 영상에는 넉넉하지만, 긴 수업을 굽는 리플레이가 4GB 에 닿으면 오류 없이 깨진 파일이 나옵니다 — 넘기 전에 막는 검사 한 줄이 맞습니다.',
        },
      ],
    }),
  ];
};
