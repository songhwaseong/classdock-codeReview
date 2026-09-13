// 2. documents — 파일 입력, 문서 생명주기, PDF, 코드 보기.

import { linesLabel } from '../lib/source-metrics.mjs';

export default ({ manifest, helpers, rootDir }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'documents');
  // 줄 수는 문장에 적지 않고 생성 때 잰다(lib/source-metrics.mjs 의 이유 참고).
  const documentsLines = linesLabel(rootDir, 'src/js/documents.js');
  const codeViewerLines = linesLabel(rootDir, 'src/js/code-viewer.js');

  return [
    sec({
      id: 'documents-overview',
      category: '2. documents',
      group: '계층 개요',
      title: 'documents 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 파일이 들어와 문서가 되기까지`,
      summary:
        '이 계층은 "바깥에서 들어온 무언가"를 "앱 안의 문서"로 바꾸는 일을 합니다. 드래그·파일 선택·폴더 핸들·압축 해제가 file-loaders.js 로 들어오고, ' +
        'documents.js 가 문서 객체와 탭·사이드바를 만들고, 형식별 뷰어가 실제 화면을 그립니다. PDF 는 이 앱의 중심 기능이라 렌더·편집·페이지·복구·OCR 로 5개 파일에 나뉘어 있습니다.',
      usage: [
        {
          title: '입력 → 문서 경로',
          body:
            'file-loaders.js(어떤 로더로 보낼지 판정) → documents.js(makeDoc 으로 문서 생성, 탭·트리 등록) → viewer-base.js 또는 형식별 뷰어(지연 렌더). ' +
            '문서는 만들어질 때 바로 그려지지 않고 처음 활성화될 때 render() 가 불립니다.',
        },
        {
          title: '지원 형식의 원본',
          body:
            'documents.js 상단이 확장자 표의 실제 원본입니다 — IMG_EXTS, SQLITE_EXTS, BINARY_ASSET_EXTS, CODE_EXTS(확장자 → 구문강조 프로파일). 새 형식 지원은 여기서 시작합니다.',
        },
        {
          title: '저장 대상의 분기',
          body:
            'File System Access 핸들이 있으면 원본, 없으면 EXE 의 자동 저장 폴더 또는 다운로드 사본입니다. 이 판정이 code-viewer.js 의 saveTextDoc 에 모여 있고 여러 기능이 그것을 재사용합니다.',
        },
      ],
      features: [
        { title: '다중 문서', body: '탭바·사이드바 트리·분할 작업(참고 화면 고정)까지 documents.js 한 파일이 관리합니다.' },
        { title: '작업공간 복원', body: 'workspace-store.js 가 EXE 서버 또는 IndexedDB 에 같은 바이너리 포맷으로 저장해 재실행 시 복원합니다.' },
        { title: '알 수 없는 확장자', body: 'file-loaders.js 가 앞 8KB 를 보고 텍스트인지 판별해 안전하게 엽니다. NUL·제어문자가 10%를 넘으면 이진으로 봅니다.' },
        { title: '지연 렌더', body: '폴더째 열어도 활성화된 문서만 실제로 그립니다. 파일 수천 개짜리 폴더를 상정한 설계입니다.' },
      ],
      files: [
        {
          // 확장자표는 2026-08-14 의 분할로 documents.js 에서 이 파일로 옮겨졌다. 100줄짜리라
          // 구간을 잡지 않고 통째로 가리킨다(자기 섹션에도 같은 파일이 실린다).
          path: 'src/js/document-types.js',
          label: 'document-types.js (확장자표)',
          description: '지원 형식과 코드 프로파일 정의 — MNDocumentTypes 레지스트리',
        },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"등록되지 않은 확장자도 내용을 보고 텍스트면 연다"는 판정이 보수적입니다. 이진 파일을 텍스트로 열어 손상시키는 사고를 구조적으로 막습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `documents.js ${documentsLines} + code-viewer.js ${codeViewerLines} 이 이 계층의 절반입니다. 두 파일 모두 의존하는 파일이 9개 이상이라 분할 비용이 가장 큽니다.`,
        },
      ],
    }),

    mod('pdf-recovery.js', {
      title: 'pdf-recovery.js — PDF 복구본과 편집 히스토리',
      subtitle: 'IndexedDB 2개 스토어',
      summary:
        'PDF 편집 복구본을 IndexedDB 에 저장·복원하고, PDF 편집의 되돌리기/다시실행 히스토리를 관리합니다. ' +
        'pdf-signer-recovery 데이터베이스에 documents(복구본)와 signatures(서명 이미지) 두 스토어를 둡니다.',
      usage: [
        {
          title: '복구가 필요한 이유',
          body:
            'PDF 편집은 서명·텍스트·필기 같은 작업이 쌓이는데 브라우저 탭이 닫히면 전부 사라집니다. 자동으로 스냅샷을 남겨 다음 실행 때 되살립니다.',
        },
        {
          title: '히스토리 연결',
          body: 'MNEditHistory 의 소비자로 등록돼 있고 pdf 상한(50단계)을 씁니다.',
        },
      ],
      features: [
        { title: '스토어 분리', body: 'documents 는 문서별 복구본, signatures 는 재사용하는 서명 이미지입니다.' },
        { title: '차이 판별', body: 'tests/pdf-recovery.test.js 가 "무엇을 복구할 값어치가 있는가" 판정을 검사합니다.' },
        { title: '편집 여부 판정', body: 'tests/pdf-pending-edits.test.js 는 회전만 해도 "저장하지 않은 편집"으로 본다는 계약을 고정합니다.' },
      ],
      files: [
        { path: 'tests/pdf-recovery.test.js', label: 'pdf-recovery.test.js', description: '복구 차이 판별·적용' },
        { path: 'tests/pdf-pending-edits.test.js', label: 'pdf-pending-edits.test.js', description: '미저장 편집 판정' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"회전만 해도 편집으로 본다"를 테스트로 고정했습니다. 판정이 느슨해지면 사용자가 작업을 잃는 방향으로 깨지는 종류라 적절한 방어입니다.',
        },
      ],
    }),

    mod('video-viewer.js', {
      title: 'video-viewer.js — 영상·오디오와 자막',
      subtitle: 'SRT/VTT/SMI 변환과 EXE MP4 변환',
      summary:
        '브라우저 기본 재생을 쓰되, 재생되지 않는 형식은 EXE 의 ffmpeg 로 MP4 변환합니다. 자막은 SRT·VTT·SMI 를 브라우저가 이해하는 형태로 변환하고 ' +
        '영상과 같은 이름이면 자동으로 연결합니다. 폴더 일괄 MP4 변환도 여기서 다룹니다.',
      usage: [
        {
          title: 'SMI 를 다루는 이유',
          body: 'SMI 는 국내 자막에서 여전히 흔한 형식이지만 브라우저가 직접 이해하지 못합니다. 변환 코드를 두어 그대로 열리게 했습니다.',
        },
        {
          title: 'EXE 의존',
          body: 'mkv·avi·wmv·flv 처럼 브라우저가 못 여는 형식은 EXE + ffmpeg 가 있어야 합니다. HTML 형태에서는 안내로 끝납니다.',
        },
      ],
      features: [
        { title: '자동 연결', body: '영상과 같은 이름의 자막 파일을 자동으로 붙입니다.' },
        { title: '자막 표시 제어', body: '표시/숨기기와 글자 크기 조절을 제공합니다.' },
        { title: '작업공간 제외', body: '영상은 용량이 커서 작업공간 저장에서 제외합니다. tests/video-subtitles.test.js 가 그 계약을 검사합니다.' },
      ],
      files: [{ path: 'tests/video-subtitles.test.js', label: 'video-subtitles.test.js', description: '자막 변환·자동 연결·작업공간 제외' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '영상을 작업공간 저장에서 제외한 판단이 맞습니다. 안 그러면 IndexedDB·서버 저장이 순식간에 수 GB 가 됩니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'ffmpeg 는 EXE 가 필요할 때 설치하는 방식(/install-ffmpeg)이라, 첫 변환에서 네트워크가 필요합니다.',
        },
      ],
    }),

    mod('document-types.js', {
      title: 'document-types.js — 파일 형식 레지스트리',
      subtitle: '확장자 하나가 아이콘·분류·인코딩·압축 열기를 동시에 정한다',
      summary:
        '98줄짜리 표에 가까운 파일입니다. 확장자를 받아 아이콘 글자(iconFor), 사이드바 분류(extCategory), ' +
        '텍스트로 읽을지 여부(TEXT_ENCODING_EXTS), 압축 안에서 열 수 있는지(ZIP_OPENABLE), 구문강조 계열(CODE_EXTS) 을 결정합니다. ' +
        '"이 확장자를 어떻게 대할 것인가" 라는 판단이 코드 여기저기 흩어지지 않도록 한 곳에 모은 것이 목적입니다.',
      usage: [
        {
          title: '구문강조 계열을 주석 문법으로 묶는다',
          body:
            'CODE_EXTS 는 확장자를 언어가 아니라 "c" · "hash" · "python" · "css" · "sql" · "xml" · "text" 같은 계열로 매핑합니다. ' +
            'js·java·go·rust 를 전부 "c" 로 묶는 식이라, 언어 수만큼 강조기를 만들지 않고 주석·문자열 문법이 같은 것끼리 재사용합니다.',
        },
        {
          title: '.env 를 확장자처럼 다룬다',
          body:
            'isEnvFile() 이 .env · .env.local · .env.production 을 알아보고, fileExtOf() 가 이들에 "env" 를 돌려줍니다. ' +
            '점으로 시작해 확장자가 없는 파일인데도 구문강조와 분류가 붙는 이유입니다.',
        },
        {
          title: '숨김 판정과 .env 의 예외',
          body:
            'isHiddenFolderEntry() 는 점으로 시작하는 항목과 그 하위를 전부 숨기지만 .env 만 예외로 둡니다. ' +
            '.git · .venv 는 사이드바에서 치우고 설정 파일은 남기려는 절충입니다.',
        },
      ],
      features: [
        {
          title: '압축 폭탄 상한',
          body: 'ZIP_EXTRACT_CAP 256MB(전체) · ZIP_ENTRY_CAP 128MB(항목 하나). 압축을 푸는 쪽에서 메모리를 지키는 두 겹 상한입니다.',
        },
        {
          title: '학습 산출물을 이진으로 분류',
          body:
            'BINARY_ASSET_EXTS 에 onnx · safetensors · pt · h5 · joblib · npy 등을 넣어, 텍스트로 열어 깨뜨리는 대신 이진 파일로 다룹니다. ' +
            'tests/binary-model-extension.test.js 가 이 목록을 검사합니다.',
        },
        {
          title: '브라우저·Node 양쪽 노출',
          body: '전역 상수 MNDocumentTypes 로 두면서 module.exports 도 함께 내보내, 화면 없이 단위 테스트에서 바로 부를 수 있습니다.',
        },
      ],
      files: [
        { path: 'tests/tokens-extension.test.js', label: 'tokens-extension.test.js', description: '확장자→계열 매핑' },
        { path: 'tests/binary-model-extension.test.js', label: 'binary-model-extension.test.js', description: '학습 산출물 이진 분류' },
        { path: 'tests/sidebar-search-collapse.test.js', label: 'sidebar-search-collapse.test.js', description: '숨김 폴더 판정' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '확장자 판단을 한 파일로 모은 것이 맞습니다. 아이콘·분류·인코딩·압축 열기가 각자 자기 목록을 들고 있었다면 ' +
            '"사이드바엔 코드로 보이는데 압축 안에서는 안 열리는" 종류의 불일치가 필연이었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'SUBTITLE_EXTS · VIDEO_EXTS · AUDIO_EXTS 를 typeof 검사로 읽고, 없으면 빈 배열로 넘어갑니다(24–26줄). ' +
            '이 값들은 IIFE 가 실행되는 순간 TEXT_ENCODING_EXTS 와 ZIP_OPENABLE 에 펼쳐져 굳으므로, video-viewer.js 가 뒤에 로드되면 ' +
            '자막·영상·음성 확장자가 통째로 빠진 목록이 만들어집니다. 오류는 나지 않고 "압축 안의 자막이 안 열린다" 로만 드러납니다. ' +
            'manifest 의 scriptDependencies 에 순서가 선언돼 있고 check-source.js 가 지키지만, 폴백이 빈 배열이라 방어선이 하나뿐입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'iconFor() 는 모르는 확장자에 앞 4글자를 대문자로 돌려줍니다. 목록에 없는 형식도 사이드바에서 깨지지 않고 그럴듯하게 보이는 이유입니다.',
        },
      ],
    }),

    mod('documents.js', {
      title: 'documents.js — 문서 생명주기의 중심',
      subtitle: '탭·사이드바·분할 작업·검색',
      summary:
        '문서 객체 생성, 탭바, 사이드바 그룹 트리, 활성 문서 전환, 통합 검색, 분할 작업, 새로고침·닫기 — 다중 문서 앱의 중심입니다. ' +
        '지원 확장자와 코드 구문강조 프로파일도 이 파일이 정의합니다. 13개 파일이 이 파일에 의존하며, 이 앱에서 가장 파급 범위가 넓은 모듈입니다.',
      usage: [
        {
          title: '확장자 정의',
          body:
            'IMG_EXTS, SQLITE_EXTS, BINARY_ASSET_EXTS(학습 모델·NumPy·pyc 등 이진 자산), CODE_EXTS(확장자 → c/python/hash/css/sql/xml 프로파일). ' +
            '새 형식을 지원하려면 여기부터 손댑니다.',
        },
        {
          title: '탭바 정책',
          body:
            '파일이 하나만 열려 있어도 탭바를 표시합니다. 또 폴더·압축을 열 때 첫 파일을 자동으로 띄우지 않는 배치(suppressUiBatchAutoOpen)와 빈 화면(#docEmpty) 전환도 여기서 다룹니다.',
        },
        {
          title: '이진 자산 보호',
          body:
            '.model/.npy/.pkl/.pyc 같은 파일은 텍스트 편집기로 열지 않고 원본 바이트를 보존합니다. Python 학습 코드와 함께 쓰는 상황을 고려한 처리입니다.',
        },
        {
          title: '손 도구와 글자 선택의 경계',
          body:
            '문서 여백을 끌면 화면이 움직이고(손 도구), 글자 위를 끌면 브라우저 기본 선택이 되어야 합니다. ' +
            'Office 렌더러들이 공통 클래스를 주지 않아, 태그 이름(P·SPAN·LI·TD·H1~H6 …)과 "자식 없이 글자만 든 잎 요소"로 판정하고 ' +
            'user-select:none 인 요소는 제외합니다. Word 제자리 편집 중에는 여백을 눌러도 이동 모드로 들어가지 않게 따로 막습니다.',
        },
      ],
      features: [
        { title: '문서 객체', body: 'makeDoc 이 kind(pdf/office/image/…)별 컨테이너를 만들고 활성 문서만 보이게 합니다.' },
        { title: '통합 검색', body: '사이드바 검색이 열린 문서의 내용까지 봅니다. 저장 전 편집기 내용을 보는지도 테스트로 고정돼 있습니다.' },
        { title: '분할 작업', body: '아무 문서나 참고 화면으로 고정해 작업 문서와 나란히 두고, 필요할 때만 잠급니다.' },
        { title: '그룹 트리', body: '폴더·압축을 열면 트리로 묶습니다. 수천 개 항목을 상정해 navIndex 캐시(state.js)와 함께 동작합니다.' },
      ],
      files: [
        { path: 'tests/single-tab-and-auto-open.test.js', label: 'single-tab-and-auto-open.test.js', description: '탭바 표시·자동 열기 억제' },
        { path: 'tests/content-search-live-text.test.js', label: 'content-search-live-text.test.js', description: '저장 전 내용 검색' },
        { path: 'tests/study-mode.test.js', label: 'study-mode.test.js', description: '분할 작업 선택·참고 잠금·상태 복원' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '이진 자산 확장자를 명시적으로 열거해 텍스트 편집기로 열리는 것을 막았습니다. Python 수업에서 .pkl 을 열어 망가뜨리는 사고를 예방합니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `${documentsLines} 안에 문서 모델, 탭 UI, 트리 UI, 검색, 분할 작업이 함께 있습니다. 13개 파일이 여기 의존해서, 분할하려면 로드 순서와 전역 참조를 동시에 정리해야 합니다. ` +
            '리팩터링 계획이 있다면 "확장자 정의"와 "검색"을 먼저 떼는 것이 위험이 낮습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '확장자 표가 코드 상수라, 새 형식을 추가할 때 documents.js·file-loaders.js·뷰어·문서를 각각 손대야 합니다. 등록 지점이 한 곳이 아닙니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '손 도구/글자 선택 판정이 태그 이름 목록과 "잎 요소인가"라는 추정에 기대고 있습니다. 렌더러가 문단을 DIV 로 그리거나 글자를 한 겹 더 감싸면 판정이 바뀌므로, ' +
            'vendor 를 올릴 때 함께 확인해야 하는 종류의 코드입니다. 판정을 렌더러별 클래스 하나로 받을 수 있다면 그쪽이 안정적입니다.',
        },
      ],
    }),

    mod('workspace-store.js', {
      title: 'workspace-store.js — 최근 작업공간 저장·복원',
      subtitle: '서버/IndexedDB 이중 경로 · 동일 포맷',
      summary:
        'EXE 로컬 서버가 있으면 서버에, 없으면(오프라인·온라인 HTML·file:// 포함) 같은 바이너리 포맷으로 이 브라우저의 IndexedDB 에 저장합니다. ' +
        '복원과 정리 동선은 두 경로가 완전히 동일합니다. 재실행 시 파일·폴더·탭 상태를 되살리는 근거 데이터입니다.',
      usage: [
        {
          title: '변경 직렬화',
          body:
            'workspaceMutationQueue(Promise 체인)로 저장·삭제를 직렬화합니다. 여러 문서를 동시에 닫거나 폴더를 정리할 때 경합으로 데이터가 꼬이는 것을 막습니다.',
        },
        {
          title: '삭제 지연',
          body: 'pendingWorkspaceRemovals + 타이머로 삭제를 모아서 처리합니다. 탭을 연달아 닫을 때 서버 왕복을 줄입니다.',
        },
      ],
      features: [
        { title: '동일 포맷', body: '두 저장소가 같은 바이너리를 쓰므로 EXE ↔ HTML 사이에 개념적 차이가 없습니다.' },
        { title: '진행 표시', body: 'setWorkspaceActivity 로 저장·정리 중임을 사용자에게 알립니다.' },
        { title: '백업 연동', body: 'backup.js 가 이 저장소를 ZIP 으로 내보내고 되돌립니다.' },
      ],
      files: [{ path: 'tests/folder-workspace.test.js', label: 'folder-workspace.test.js', description: '폴더 저장·복원·새로고침 계약' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '두 저장 경로의 포맷을 같게 맞춘 결정이 좋습니다. 복원·백업·정리 코드를 한 벌만 유지하면 됩니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '변경을 Promise 큐로 직렬화했습니다. 비동기 저장소에서 흔한 "동시에 쓰다 마지막 것만 남는" 버그를 구조로 막았습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '작업공간에 파일 내용이 통째로 들어갑니다. 큰 폴더를 열어 두면 IndexedDB 용량이 빠르게 늘고, 브라우저 저장 한도에 걸릴 수 있습니다.',
        },
      ],
    }),

    mod('recent-files.js', {
      title: 'recent-files.js — 최근 연 파일·폴더 (MNRecent)',
      subtitle: 'FS 핸들 재사용',
      summary:
        '최근 연 파일·폴더 목록을 localStorage 에 두되, 다시 열 때는 이미 보관해 둔 File System Access 핸들(saveFsHandle·rememberFolderHandle)을 찾아 ' +
        '권한 확인 한 번으로 되살립니다. 옮겨지거나 지워진 항목은 안내와 함께 목록에서 지울 수 있습니다.',
      usage: [
        {
          title: '핸들 보관의 의미',
          body:
            '경로 문자열만 저장하면 브라우저는 그 파일을 다시 열 수 없습니다. 핸들을 IndexedDB 에 보관해 두어야 권한 확인만으로 원본 저장까지 이어집니다.',
        },
        {
          title: '같은 이름 다른 경로',
          body: 'tests/recent-files.test.js 가 이름이 같고 경로가 다른 항목을 구분하는지, 중복 항목이 위로 승격되는지 검사합니다.',
        },
      ],
      features: [
        { title: '권한 1회', body: '핸들이 있으면 다시 여는 데 파일 선택 창이 필요 없습니다.' },
        { title: '유실 처리', body: '핸들이 무효가 된 항목은 안내 후 목록에서 제거할 수 있습니다.' },
      ],
      files: [{ path: 'tests/recent-files.test.js', label: 'recent-files.test.js', description: '정렬·중복 승격·경로 구분' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"최근 목록"을 경로 표시가 아니라 실제로 다시 열 수 있는 핸들과 묶었습니다. 브라우저 앱에서 이 부분을 제대로 하는 경우가 드뭅니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'File System Access 를 지원하지 않는 브라우저(Firefox·Safari)에서는 목록만 남고 원본 저장이 되지 않습니다.',
        },
      ],
    }),

    mod('file-loaders.js', {
      title: 'file-loaders.js — 입력 판정과 로더 분배',
      subtitle: '드래그·폴더·압축·확장자 판정',
      summary:
        '파일·폴더·드래그로 들어온 입력을 문서 종류별 로더로 넘깁니다. 폴더 핸들, 빈 폴더, 새로고침, ZIP/TAR/GZ 해제, PPTX 변환 폴백까지 여기서 관리합니다. ' +
        '등록되지 않은 확장자라도 앞 8KB 를 검사해 텍스트로 판단되면 안전하게 엽니다.',
      usage: [
        {
          title: '텍스트 판별 규칙',
          body:
            'isLikelyTextBytes 가 UTF-16 BOM 이면 텍스트로 보고, NUL 바이트가 있으면 즉시 이진으로 봅니다. 그 외에는 제어문자 비율이 10% 이하일 때만 텍스트입니다. ' +
            '샘플은 앞 8,192바이트, 압축 안 탐색은 32MB 상한입니다.',
        },
        {
          title: '압축 처리',
          body: 'ZIP·TAR·GZ 를 풀어 트리로 보여 줍니다. 첫 파일을 자동으로 열지 않는 정책이 documents.js 와 함께 동작합니다.',
        },
      ],
      features: [
        { title: '폴더 권한', body: 'Chrome·Edge 의 폴더 열기(Ctrl+Shift+O)나 폴더 드래그면 권한을 받아 원본에 직접 씁니다.' },
        { title: '새로고침', body: '열어 둔 폴더의 변경을 다시 읽습니다. 하위 폴더만 새로고침하는 것은 현재 지원하지 않습니다.' },
        { title: 'PPTX 폴백', body: 'EXE 정확 변환이 실패하면 pptx-viewer.js 의 근사 미리보기로 넘깁니다.' },
        { title: '이진 거부', body: 'tests/unknown-text-extension.test.js 가 "텍스트면 허용, 이진이면 거부" 계약을 고정합니다.' },
      ],
      files: [
        { path: 'tests/unknown-text-extension.test.js', label: 'unknown-text-extension.test.js', description: '알 수 없는 확장자 판정' },
        { path: 'tests/binary-model-extension.test.js', label: 'binary-model-extension.test.js', description: '학습 모델·NumPy 이진 보관 경로' },
        { path: 'tests/folder-new-document.test.js', label: 'folder-new-document.test.js', description: '폴더 안 새 문서의 문맥 상속' },
        { path: 'tests/large-file-open-confirm.test.js', label: 'large-file-open-confirm.test.js', description: '큰 파일은 열기 전에 묻는다 — 상한은 메모리에서 몇 배로 부푸는가를 따른다' },
        { path: 'tests/e2e/large-file-open.spec.js', label: 'large-file-open.spec.js', description: '상한을 넘는 파일에서 "열지 않기" 를 고르면 열리지 않는다' },
        { path: 'tests/tar-parser.test.js', label: 'tar-parser.test.js', description: 'TAR 크기·체크섬·블록 경계 검증 — 무한 반복과 잘린 파일 추출 방지' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '텍스트 판별을 확장자가 아니라 내용으로 하되 보수적으로 잡았습니다(NUL 즉시 거부, 제어문자 10%). 데이터 손상 위험이 있는 판정에 맞는 방향입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '앞 8KB 만 봅니다. 앞부분이 텍스트이고 뒤가 이진인 파일(일부 컨테이너 포맷)은 텍스트로 열릴 수 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '압축 안 텍스트 탐색은 32MB 에서 멈춥니다. 큰 압축 파일의 뒷부분은 통합 검색에 잡히지 않습니다.',
        },
      ],
    }),

    mod('pdf-render.js', {
      title: 'pdf-render.js — PDF.js 로딩과 지연 캔버스 렌더',
      subtitle: '페이지 자리표시자와 화질·야간 모드',
      summary:
        'PDF.js 로 문서를 열고, 모든 페이지를 미리 그리는 대신 자리표시자를 깔아 두고 보이는 페이지만 캔버스로 렌더합니다. ' +
        '화질·배율·야간 모드와 한글 폰트 렌더링을 담당합니다.',
      features: [
        { title: '지연 렌더', body: '수백 쪽 PDF 도 첫 화면이 빨리 뜹니다. 스크롤에 따라 필요한 페이지만 그립니다.' },
        { title: '야간 모드', body: '캔버스 결과를 반전해 다크 테마에서 눈부심을 줄입니다.' },
        { title: '한글 폰트', body: 'EXE 에서는 FontFace 로 부분 한글 글꼴을 믿고 싣기 어려워, PDF 에 박힌 글리프를 캔버스에 직접 그려 한글이 네모로 바뀌지 않게 합니다.' },
        { title: '시작 로드', body: 'PDF 는 앱의 중심 기능이라 MNLazy 지연 대상이 아니라 시작할 때 함께 싣습니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: 'PDF 관련 파일이 render/editor/pages/recovery/ocr 5개로 나뉘어 있습니다. 이 계층에서 유일하게 책임 분할이 잘된 영역입니다.',
        },
      ],
    }),

    mod('pdf-ocr.js', {
      title: 'pdf-ocr.js — 스캔 PDF OCR 과 캐시',
      subtitle: '문서 지문 기준 IndexedDB 캐시',
      summary:
        '스캔 PDF 를 Tesseract 로 OCR 하고 결과를 문서 지문(fingerprint) 기준으로 IndexedDB 에 캐시해 PDF 검색과 사이드바 통합 검색에 제공합니다. ' +
        '같은 문서를 다시 열면 OCR 을 다시 돌리지 않습니다.',
      features: [
        { title: '지문 기반 캐시', body: '파일 경로가 아니라 내용 지문으로 캐시해, 파일을 옮겨도 결과를 재사용합니다.' },
        { title: '검색 연동', body: 'OCR 결과가 통합 검색 대상에 포함됩니다.' },
      ],
      files: [{ path: 'tests/lesson-ocr.test.js', label: 'lesson-ocr.test.js', description: 'OCR 캐시 문서 식별' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '경로가 아니라 내용 지문을 캐시 키로 삼았습니다. 같은 파일을 여러 폴더에서 열어도 OCR 이 한 번만 돕니다.',
        },
      ],
    }),

    mod('pdf-editor.js', {
      title: 'pdf-editor.js — PDF 편집 화면',
      subtitle: '서명·텍스트·날짜·체크·필기',
      summary:
        'PDF 확대·축소, 현재 페이지 표시, 전체화면, 검색·강조, 서명·텍스트·날짜·체크·필기(펜/형광펜) 배치와 저장 UI 를 담당합니다. ' +
        '이 앱의 원래 출발점(pdf-signer)이자 지금도 가장 완성도 높은 편집 기능입니다.',
      usage: [
        {
          title: '요소 모델',
          body: 'state.js 의 문서 객체에 elements[] 로 편집 요소가 쌓이고, pdf-pages.js 가 저장 시 실제 PDF 바이트로 굽습니다.',
        },
        {
          title: '되돌리기',
          body: 'pdf-recovery.js 를 통해 MNEditHistory 를 씁니다(pdf 상한 50).',
        },
      ],
      features: [
        { title: '필기', body: '펜·형광펜 획을 벡터로 쌓고 저장 시 PDF 에 굽습니다.' },
        { title: '검색·강조', body: 'MNSearchHistory 소비자로 등록돼 최근 검색어를 공유합니다.' },
        { title: '탭 전환 안전', body: 'tests/pdf-export-tab-switch.test.js 가 저장 중 탭을 바꿔도 대상 문서가 바뀌지 않음을 고정합니다.' },
        { title: '분할 화면 레이아웃', body: 'tests/pdf-layout.test.js 가 숨김·분할 상태의 폭 계산을 검증합니다.' },
      ],
      files: [
        { path: 'tests/pdf-markup.test.js', label: 'pdf-markup.test.js', description: 'PDF 편집 표시와 팔레트 연결' },
        { path: 'tests/pdf-export-tab-switch.test.js', label: 'pdf-export-tab-switch.test.js', description: '저장 중 탭 전환 안전성' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"저장 중 탭을 바꿔도 대상 문서가 바뀌지 않는다"를 테스트로 고정했습니다. 비동기 저장과 전역 활성 문서가 함께 있으면 반드시 생기는 버그를 정확히 짚었습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '편집 요소가 전역 활성 문서(state)에 붙어 있어, 새 비동기 경로를 추가할 때마다 같은 종류의 "대상이 바뀌는" 위험이 재발할 수 있습니다.',
        },
      ],
    }),

    mod('pdf-pages.js', {
      title: 'pdf-pages.js — 저장 바이트 생성과 페이지 조작',
      subtitle: '책갈피·추출·삭제·회전·합치기',
      summary:
        'PDF 다운로드 바이트를 만드는 곳이자, 책갈피 목차 편집과 페이지 선택·추출·삭제·회전·순서 변경·합치기를 담당합니다. ' +
        'pdf-lib 로 실제 PDF 구조를 다시 씁니다.',
      features: [
        { title: '책갈피 목차', body: '계층 구조를 만들고, 페이지가 바뀌면 목차의 페이지 참조를 보정합니다.' },
        { title: '페이지 조작', body: '선택 → 추출/삭제/회전/순서 변경. 여러 PDF 합치기도 지원합니다.' },
      ],
      files: [{ path: 'tests/pdf-outline.test.js', label: 'pdf-outline.test.js', description: '책갈피 생성·계층·페이지 변경 보정' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '페이지 순서가 바뀔 때 책갈피 참조를 보정하는 부분을 테스트로 덮었습니다. 손으로 검증하기 번거로운 종류의 로직입니다.',
        },
      ],
    }),

    mod('viewer-base.js', {
      title: 'viewer-base.js — Office·텍스트 뷰어 공통 진입점',
      subtitle: '지연 렌더 계약의 정의 지점',
      summary:
        'DOCX·DOC·PPTX·HWP·HWPX·Markdown·일반 텍스트·HTML·SQLite 미리보기의 공통 진입점입니다. ' +
        'loadOffice 가 문서 객체를 만들고 render 클로저를 붙이는데, 이 render 는 문서가 처음 활성화될 때 실행됩니다 — 지연 렌더 계약이 여기서 정의됩니다.',
      usage: [
        {
          title: 'render 클로저',
          body:
            'doc.render = async () => { ... } 형태로 붙이고, 확장자에 따라 renderDocx / renderDocLegacy / renderPptx / renderHwp 로 분기합니다. ' +
            '파일을 갈아 끼운 쪽이 캐시된 바이트를 비울 수 있도록 renderOptions 를 문서 객체에 노출합니다.',
        },
        {
          title: 'sourceFile 보관',
          body: '내용 검색용 원본 파일 핸들을 문서에 들고 있습니다. 텍스트·코드만 실제로 읽습니다.',
        },
        {
          title: 'CSV → XLSX',
          body: 'CSV 를 표 편집기로 변환해 열 때 첫 줄 머리글 선택을 spreadsheetHasHeader 로 전달합니다.',
        },
      ],
      features: [
        { title: 'Markdown', body: 'core.js 의 markdownToHtml 과 살균 함수를 써서 렌더합니다.' },
        { title: 'HTML 상대 리소스', body: '열린 HTML 안의 상대 경로 이미지·CSS 를 해석합니다.' },
        { title: 'SQLite 읽기 전용', body: 'DB 파일을 읽기 전용으로 미리보기합니다. 편집은 EXE 가 확인한 디스크 경로에서만 허용됩니다.' },
      ],
      files: [{ path: 'tests/sqlite-editor-safety.test.js', label: 'sqlite-editor-safety.test.js', description: 'SQLite 편집 안전 조건' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: 'SQLite 편집을 "서버가 확인한 디스크 경로에서만" 으로 제한하고 그것을 테스트로 고정했습니다. DB 파일을 사본으로 편집해 원본과 어긋나는 사고를 막습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: 'renderOptions 를 문서에 노출하는 것은 캐시 무효화를 위한 의도적 결합입니다. 주석에 이유가 남아 있어 실수로 지우기 어렵게 돼 있습니다.',
        },
      ],
    }),

    mod('workspace-python.js', {
      title: 'workspace-python.js — 작업공간 Python 색인',
      subtitle: '열지 않은 .py 까지 읽어 자동완성·import 검사에 쓴다',
      summary:
        '폴더를 열었을 때 그 안의 .py 들을 "탭으로 열지 않은 것까지" 백그라운드로 읽어 두고, 자동 import 후보 · import 문 완성 · import 오류 검사에 씁니다. ' +
        '완성 팝업은 동기라 그 자리에서 디스크를 읽을 수 없다는 제약이 이 파일 전체의 설계를 정합니다 — 미리 읽어 캐시에 채워 두는 것 말고는 방법이 없습니다. ' +
        'Ctrl+클릭 정의 이동도 Jedi 보다 먼저 여기서 작업공간 안의 from ... import ... 를 풀어 봅니다.',
      usage: [
        {
          title: '왜 미리 읽어야 하는가',
          body:
            '자동완성 후보를 만드는 순간은 동기 호출이라 await 을 걸 수 없습니다. 그래서 열린 문서로 우선 답하고, ' +
            '열리지 않은 .py 는 requestIdleCallback 으로 미리 읽어 캐시에 채웁니다. 그 파일들은 다음 타이핑부터 후보에 들어옵니다.',
        },
        {
          title: '못 읽은 파일과 빈 파일의 구분',
          body:
            'workspacePyUnreadable Set 을 따로 둡니다. 권한·스냅샷 만료·용량 초과로 못 읽은 파일도 캐시에는 빈 본문으로 들어가는데, ' +
            '이 목록이 없으면 "내용이 없는 __init__.py" 와 구별되지 않습니다. import 검사가 그 둘을 다르게 다뤄야 하므로 필요한 구분입니다.',
        },
        {
          title: '읽기 예산',
          body:
            '512KB 를 넘는 .py 는 색인에서 제외하고(대개 생성 코드), 한 번에 400개까지만 읽은 뒤 다음 유휴 차례로 넘깁니다. ' +
            '한 파일마다 setTimeout(0) 으로 프레임을 양보해 타이핑이 끊기지 않게 합니다.',
        },
        {
          title: '압축·폴더 묶음 격리',
          body:
            'archiveCtx 가 같은 문서만 색인에 넣습니다. 서로 다른 폴더나 압축 묶음을 섞으면 import 루트가 모호해지기 때문입니다.',
        },
      ],
      features: [
        {
          title: '문자열 동일성으로 메모 판정',
          body:
            'workspacePyIndexMemoHit() 이 지난 색인을 재사용할지 본문 문자열 비교로 정합니다. 바뀌지 않은 파일은 같은 문자열 객체라 비교가 사실상 즉시 끝나고, ' +
            '한 글자만 바뀌어도 정확히 걸립니다. 타이핑마다 전체 .py 를 다시 훑지 않게 하는 장치입니다.',
        },
        {
          title: 'Jedi 미러는 색인이 바뀔 때만',
          body:
            'scheduleJediProjectSync() 를 색인이 실제로 갱신된 순간에만 부릅니다. 서버 쪽 미러 갱신은 비싸므로 타이핑마다 보내지 않습니다.',
        },
        {
          title: '임시 복사본을 열지 않는다',
          body:
            'openWorkspaceDefinitionTarget() 이 Jedi 가 미러 안에서 찾은 경로를 원래 작업공간 탭으로 되돌려 매칭합니다. 같은 경로가 여럿이면 부모가 같은 문서를 먼저 고릅니다.',
        },
        {
          title: '실행 기준 폴더 추정',
          body:
            'inferOpenPythonProjectRoot() 로 sys.path 루트를 추정하고, 자동 import 경로와 Jedi 프로젝트 루트가 같은 값을 쓰게 맞춥니다.',
        },
      ],
      files: [
        { path: 'tests/python-workspace-import-index.test.js', label: 'python-workspace-import-index.test.js', description: '모듈 색인과 자동 import 후보' },
        { path: 'tests/python-import-check.test.js', label: 'python-import-check.test.js', description: 'import 검사' },
        { path: 'tests/python-jedi-project.test.js', label: 'python-jedi-project.test.js', description: 'Jedi 프로젝트 미러 동기화' },
        { path: 'tests/python-definition-view.test.js', label: 'python-definition-view.test.js', description: '정의 이동' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '아직 못 읽은 .py 가 하나라도 있으면 import 검사를 통째로 건너뜁니다(214–222줄). ' +
            '"없는 모듈" 이라고 말하려면 전부 읽었다는 근거가 있어야 하는데, 부분 색인으로 경고를 띄우면 멀쩡한 import 에 빨간 줄이 그어집니다. ' +
            '틀린 진단을 내느니 진단을 미루는 쪽을 고른 판단이 옳습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '읽지 못한 파일도 캐시에 빈 본문으로 못 박아 다시 시도하지 않게 하면서, stamp(크기:수정시각)가 달라지면 자동으로 다시 읽습니다. ' +
            '"재시도 폭주" 와 "영영 안 읽음" 사이를 stamp 하나로 가른 부분입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '전역을 대하는 태도가 일관되지 않습니다. pythonWorkspaceModuleIndex · scheduleJediProjectSync · openDocRunText 는 typeof 로 확인하고 부르는데, ' +
            '문서 목록 docs 와 setActiveDoc · toast 는 확인 없이 그대로 씁니다(13 · 66 · 79 · 238줄). ' +
            '같은 파일 안에서 어떤 전역은 없을 수 있다고 보고 어떤 전역은 반드시 있다고 보는 셈이라, 어느 쪽이 진짜 계약인지 읽는 사람이 알 수 없습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'pruneWorkspacePyTextCache() 는 캐시를 정리하지만 프리워밍 대기열(workspacePyPrewarmQueue)은 건드리지 않습니다. ' +
            '400개를 넘겨 이어 읽는 중에 그 문서를 닫으면 대기열에 다시 들어가 남은 파일을 계속 읽습니다. ' +
            '모두 캐시에 차면 멈추므로 무한 반복은 아니지만, 이미 닫힌 문서를 위해 디스크를 읽는 구간이 생깁니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            'WORKSPACE_PY_MAX_BYTES(512KB) · WORKSPACE_PY_PREWARM_MAX(400) 는 상수로 박혀 있습니다. ' +
            '대형 저장소에서는 색인에서 빠지는 파일이 생기는데, 화면에는 그 사실이 드러나지 않습니다.',
        },
      ],
    }),

    mod('code-viewer.js', {
      title: 'code-viewer.js — 코드 보기·저장의 허브',
      subtitle: '자체 구문강조 + 저장 분기 + 실행기 연결',
      summary:
        '코드·설정 파일의 구문 강조와 줄번호, Python·JavaScript 실행 바, 코드·텍스트 저장, 원본 핸들/자동 저장 폴더 분기, 노트북 변환, 정의 이동 연결을 담당합니다. ' +
        '외부 하이라이터 없이 정규식 기반 강조를 직접 구현했고, 여기 있는 saveTextDoc 이 앱 전체의 텍스트 저장 창구입니다.',
      usage: [
        {
          title: 'saveTextDoc 이 창구인 이유',
          body:
            '원본 핸들이 있으면 원본, 없으면 EXE 자동 저장 폴더 또는 다운로드 사본이라는 분기를 한곳에 모았습니다. ' +
            'batch-replace.js·table-export.js·data-convert-ui.js·exam-paper.js 가 모두 이 함수를 통해 저장합니다. {silent, existingOnly} 같은 옵션으로 조용한 저장도 지원합니다.',
        },
        {
          title: '구문 강조 프로파일',
          body:
            'CODE_KW(공통 키워드), PY_BUILTIN_FN·PY_BUILTIN_EXC(Python 내장·예외), SQL_KW 를 정규식으로 둡니다. ' +
            'Python 프로파일에서는 int·float·bool 같은 겹치는 이름이 내장색으로 먼저 매칭되도록 순서를 조정했습니다.',
        },
        {
          title: '따라치기',
          body: '실행 바에 교본 위에 그대로 쳐 보는 타자 연습 모드가 있습니다. 진행률·정확도를 표시하며 python-editor.js 의 엔진을 씁니다.',
        },
      ],
      features: [
        { title: '줄 번호로 이동', body: 'Ctrl+G 진입점을 편집 화면과 읽기 화면 양쪽에 답니다.' },
        { title: '형식 변환 연결', body: 'CONVERTIBLE_EXTS(json·yaml·xml·csv·md·html 등)면 🔄 변환 버튼을 붙여 data-convert-ui.js 를 엽니다.' },
        { title: '정의 이동', body: 'Python 정의를 읽기 전용 분할 뷰어로 엽니다(sourceKey 가 "definition:" 로 시작).' },
        { title: '노트북 변환', body: '.py 를 셀로 나눠 노트북으로 여는 진입점입니다.' },
        { title: 'JavaScript 실행', body: '.js·.mjs 문서는 js-editor.js 의 전용 실행 화면으로 보내고 Worker 실행기를 붙입니다.' },
      ],
      files: [
        { path: 'tests/python-syntax-highlighting.test.js', label: 'python-syntax-highlighting.test.js', description: '데코레이터·f-string 등 토큰 강조' },
        { path: 'tests/python-definition-view.test.js', label: 'python-definition-view.test.js', description: '정의 보기 분할 뷰어' },
        { path: 'tests/scratch-save-name.test.js', label: 'scratch-save-name.test.js', description: '첫 저장 이름 지정 시 확장자·경로 유지' },
        { path: 'tests/structured-diagnostic.test.js', label: 'structured-diagnostic.test.js', description: 'XML·HTML 오류를 줄 번호 요약과 한국어 풀이로 나눠 보여 주기' },
        { path: 'tests/e2e/css-completion.spec.js', label: 'css-completion.spec.js', description: 'CSS 속성·값 자동완성' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '저장 분기를 saveTextDoc 한 함수로 모은 것이 이 코드베이스에서 가장 값어치 있는 추상화입니다. "원본이냐 사본이냐" 판정이 기능마다 흩어졌다면 배지 표시와 실제 동작이 어긋났을 것입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            `${codeViewerLines}에 구문 강조, 저장, 두 언어 실행 바, 따라치기, 정의 이동, 변환 진입점이 함께 있습니다. 9개 파일이 의존하는 허브라 변경 파급이 큽니다. ` +
            '구문 강조 부분(정규식 상수 + 렌더)은 의존이 적어 가장 먼저 떼기 좋은 후보입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'window.__lastCodeLinkDocId 같은 전역 변수를 직접 씁니다. 상태가 state.js 밖에 흩어지는 사례이고, 추적이 어려운 종류입니다.',
        },
      ],
    }),
  ];
};
