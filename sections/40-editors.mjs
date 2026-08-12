// 5. document-editors — Office, 표, 이미지, 화이트보드.

export default ({ manifest, helpers }) => {
  const { mod, sec } = helpers;
  const layer = manifest.applicationLayers.find((item) => item.id === 'document-editors');

  return [
    sec({
      id: 'editors-overview',
      category: '5. document-editors',
      group: '계층 개요',
      title: 'document-editors 계층 개요',
      subtitle: `${layer.scripts.length}개 파일 — 보기를 넘어 고치는 영역`,
      summary:
        '이 계층은 "미리보기"와 "편집" 사이의 경계를 다룹니다. HWP·PPTX 는 보기 전용, XLSX 는 본격 편집, ' +
        '이미지와 화이트보드는 완전 편집입니다. DOCX 는 2026-08-08 의 확장으로 "문단 글자만"에서 ' +
        '"글자 서식·문단 배치·목록·표·페이지·머리글·그림"까지 넓어져, 이제 XLSX 다음가는 편집 대상입니다. ' +
        '각 형식의 원본 구조를 어디까지 이해하고 되쓸 수 있는지가 그 경계를 정합니다.',
      usage: [
        {
          title: '되쓰기의 난이도 순서',
          body:
            'XLSX(exceljs 로 구조를 온전히 다룸) < DOCX 편집(XML 을 부분 치환) < PPTX(근사 미리보기라 되쓰기 불가) < HWP(읽기 전용). ' +
            '이 순서가 각 파일의 기능 범위와 그대로 대응합니다. DOCX 가 넓어진 뒤에도 순서 자체는 바뀌지 않았는데, ' +
            '"XML 을 부분 치환한다"는 방식의 한계(손대지 않은 바이트를 지켜야 한다)가 그대로이기 때문입니다.',
        },
        {
          title: '순수 코어 분리',
          body:
            'MNOfficeReplace(office-replace.js)가 Word·PowerPoint 되쓰기 계산을 DOM 없는 순수 함수로 갖고, ' +
            'docx-editor.js 는 화면만, batch-replace.js 는 여러 파일 적용만 맡습니다. 이 계층에서 가장 잘 분리된 부분입니다. ' +
            '기능이 세 배로 늘어난 Phase 2 에서도 새 순수 함수는 전부 office-replace 쪽으로 갔습니다.',
        },
        {
          title: '공용 렌더러',
          body: 'MNBoardRenderer(board-render.js)를 화이트보드와 수업 리플레이가 공유합니다. 그리기 결과를 재생할 수 있어야 해서 렌더러를 분리했습니다.',
        },
      ],
      features: [
        { title: 'Office 암호', body: 'Agile 방식 열기 암호를 지원합니다(officeCrypt 지연 묶음). 단, 암호를 풀어 연 문서는 저장 시 암호가 사라지므로 편집을 붙이지 않습니다.' },
        { title: '표 편집', body: '셀 편집·수식·자동 채우기·필터·정렬·행/열·서식·병합·조건부 서식·드롭다운·차트·미니 피벗·저장까지 지원합니다.' },
        { title: 'Word 편집', body: '미리보기 위 제자리 편집, 글자·문단 서식, 목록, 표 구조·셀 서식, 용지·여백, 머리글/바닥글, 그림 추가·교체.' },
        { title: '이미지 편집', body: '회전·뒤집기·자르기·모자이크·보정과 PNG/JPG/PDF 저장, 되돌리기.' },
        { title: '화이트보드', body: '벡터 그리기, 리플레이 녹화 연결, 수학·과학 도구상자(기호·수식·도형·과학 스텐실).' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '"어디까지 되쓸 수 있는가"를 형식별로 솔직하게 그었습니다. PPTX 를 근사 미리보기로 두고 편집을 막은 것이 데이터 손상을 막는 옳은 판단입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            'Word 편집이 세 배로 늘어나는 동안 "순수 코어 / 화면" 경계가 유지됐습니다. 기능을 급히 넣을 때 가장 먼저 무너지는 것이 이런 경계인데, ' +
            '새 코드가 전부 정해진 쪽으로 갔습니다. 이 계층의 설계가 실제로 작동하고 있다는 증거입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: 'spreadsheet-viewer.js 5,915줄은 이 프로젝트에서 가장 큰 파일입니다. 시트 UI·수식 엔진·서식·저장이 한곳에 있어 분할 1순위 후보입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '이틀 만에 이 계층이 4,000줄 넘게 늘었습니다(office-replace +1,312 · docx-editor +1,608 · whiteboard +706). ' +
            '분할 1순위였던 spreadsheet-viewer 는 그대로인 채 docx-editor 2,202줄·office-replace 2,123줄이 새 대형 파일로 합류했습니다. ' +
            '"파일이 커지는 것을 막는 구조적 압력이 없다"는 개요의 지적이 실시간으로 재현된 셈입니다.',
        },
      ],
    }),

    mod('office-doc-viewers.js', {
      title: 'office-doc-viewers.js — DOCX·HWP·HWPX 미리보기',
      subtitle: '778줄, 암호 판별과 편집 토글 부착',
      summary:
        'DOCX·HWP·HWPX 미리보기와 Office 암호화 문서 판별·복호화 보조를 담당합니다. .docx 는 docx-preview 로 그린 뒤 MNDocxEditor 의 문단 편집 토글을 붙이는데, ' +
        '암호를 풀어서 연 문서에는 붙이지 않습니다 — 저장하면 암호가 사라지기 때문입니다.',
      usage: [
        {
          title: '암호 문서에 편집을 막는 이유',
          body:
            '복호화해서 연 문서를 그대로 저장하면 암호 없는 파일이 됩니다. 사용자가 그 사실을 모르고 원본을 덮어쓰면 보호가 조용히 사라집니다. 편집 토글 자체를 붙이지 않는 방식으로 막았습니다.',
        },
        {
          title: 'HWPX 는 별도 파서',
          body: '.hwp 는 hwp.js 뷰어, .hwpx(신형 OWPML)는 문단·표·그림·기본 서식만 뽑는 간이 미리보기입니다. DRM·암호 문서는 제외입니다.',
        },
      ],
      features: [
        { title: '지연 로드', body: 'docx 묶음(jszip3 + docx-preview)과 hwp 묶음을 MNLazy 로 필요할 때 싣습니다.' },
        { title: '암호 판별', body: 'officeCrypt 묶음(crypto-js + office-decrypt)으로 Agile 암호를 풉니다.' },
        { title: '구형 .doc', body: 'renderDocLegacy 가 Word 97 조각표에서 유니코드·CP1252 본문을 문단으로 뽑습니다(글자만).' },
      ],
      files: [
        { path: 'tests/doc-legacy.test.js', label: 'doc-legacy.test.js', description: '구형 .doc 파서' },
        { path: 'tests/e2e/doc-legacy.spec.js', label: 'doc-legacy.spec.js', description: '구형 .doc 열기 화면 흐름' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '암호 해제 문서에 편집 UI 를 아예 노출하지 않는 처리가 좋습니다. 경고 문구로 처리했다면 사용자가 넘겨 읽고 보호를 잃었을 것입니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '구형 .doc 는 글자만 뽑습니다. 표·그림·서식이 빠진다는 점이 사용자에게 명시돼 있습니다.',
        },
      ],
    }),

    mod('office-replace.js', {
      title: 'office-replace.js — Word·PPT 되쓰기 코어 (MNOfficeReplace)',
      subtitle: '2,123줄, DOM 없는 순수 함수 + zip 재조립',
      summary:
        'Word(.docx)와 PowerPoint(.pptx)는 문단·run·글자 태그가 이름공간만 다르고 구조가 같습니다(<w:p>/<w:r>/<w:t> ↔ <a:p>/<a:r>/<a:t>). ' +
        '그래서 한 코어가 둘을 처리하고, 형식별로 다른 것은 "어느 파트를 어떻게 다루는가" 표(officePartRole)뿐입니다. ' +
        '처음에는 찾아 바꾸기 전용(811줄)이었으나, 2026-08-08 의 Word 편집 확장(Phase 2)으로 글자 서식·문단 배치·목록·표 구조·셀 서식·페이지·머리글/바닥글·그림까지 ' +
        '전부 이 파일의 순수 함수로 들어와 2,123줄이 됐습니다. 화면 코드는 여전히 한 줄도 여기 없습니다. ' +
        '이 계층에서 설계가 가장 정교한 파일입니다.',
      usage: [
        {
          title: 'run 이 쪼개진 낱말 찾기',
          body:
            'Word·PowerPoint 는 한 낱말을 서식 때문에 여러 run 으로 쪼개 둡니다. 그래서 문단을 이어붙인 평문에서 찾고, ' +
            '되쓸 때만 run 경계를 봅니다 — 일치가 시작된 첫 조각에 치환문을 넣고 겹친 나머지 조각은 비웁니다. 문단 안 다른 서식은 그대로 남습니다.',
        },
        {
          title: '3단계 API',
          body:
            'read(zip.js 로 파트를 한 번만 푼다) → compute(찾을 말이 바뀔 때마다 다시 계산) → build(바꾼 파트만 갈아끼운 새 zip 생성). ' +
            '나머지 zip 엔트리는 바이트 그대로 옮기므로 건드리지 않은 부분이 재인코딩되지 않습니다.',
        },
        {
          title: '제외 판정',
          body: '암호 문서·변경 이력·데이터 바인딩·40MB 초과는 처리를 거부합니다. 모두 DOM 없는 순수 함수로 판정합니다.',
        },
        {
          title: '찾아 바꾸기와 편집이 같은 엔진인 이유',
          body:
            '찾아 바꾸기는 "정규식으로 구간을 찾아 → run 조각에 배치"의 두 단계인데, 뒤쪽은 형식·용도와 무관한 순수 매핑입니다. ' +
            'officeApplyRangesToSegments 로 그 매핑을 떼어 낸 덕분에, 문단 편집은 앞단만 diffTextEdit(core.js)으로 갈아 끼우면 끝납니다. ' +
            '되쓰기 규칙(첫 조각 배치·xml:space·이스케이프·잠긴 조각 건너뛰기)을 두 벌 만들지 않으려는 판단입니다.',
        },
        {
          title: '편집을 절대 오프셋 하나로 합치기',
          body:
            '글자 교체·문단 삭제·문단 추가가 섞이면 오프셋이 엉킵니다. 셋 다 문서 기준 절대 오프셋 편집 목록으로 바꾼 뒤 ' +
            'officeApplyEdits(오프셋 내림차순 적용)에 한 번에 넘깁니다. 표·서식·그림 편집이 새로 들어왔지만 이 적용 함수는 그대로입니다.',
        },
      ],
      features: [
        { title: '파트 갈래', body: '본문 · 머리말/꼬리말 · 각주 · 발표자 노트 · 메모 · 차트를 구분합니다. 본문 밖 포함 여부는 설정에서 정합니다.' },
        { title: 'XML 세부 처리', body: 'xml:space="preserve", XML 이스케이프, 탭/줄바꿈을 넘는 일치 건너뛰기, pPr 탭 정의와 fld(슬라이드 번호 등 자동 값) 제외.' },
        { title: '왕복 테스트', body: 'tests/office-replace-roundtrip.test.js 가 실제 파일을 만들어 바꾸고 다시 읽는 왕복을 검증합니다.' },
        { title: '문단 편집 계획', body: 'officeParagraphEditPlan 이 docx-editor.js 의 문단 편집에서 "무엇을 어떻게 되쓸지"를 전부 정합니다.' },
        {
          title: '글자 서식 (Phase 2)',
          body:
            'officeParagraphTextFormat 이 선택 위치 run 의 직접 서식을 읽고, officeParagraphFormatEdit 이 범위에 걸친 run 을 앞·선택·뒤로 쪼개 선택 조각만 고칩니다. ' +
            '글꼴은 ascii/hAnsi/eastAsia/cs 를 함께 적고, 크기는 Word 의 반포인트 sz/szCs 로, 해제는 val="0"·val="none" 으로 명시합니다.',
        },
        {
          title: '문단 배치 (Phase 2)',
          body:
            'officeParagraphLayoutEdit 이 pPr 의 jc/spacing/ind 만 건드립니다. 줄 간격과 앞뒤 간격이 같은 spacing 요소를 공유하므로 속성 단위로 갱신해 서로 덮어쓰지 않고, ' +
            '들여쓰기도 left/right/firstLine/hanging 을 독립 보존합니다. 배치 지우기가 pStyle 과 sectPr 을 건드리지 않는 것이 핵심입니다.',
        },
        {
          title: '표 구조·셀 서식 (Phase 2)',
          body:
            'officeTableOutline 이 문단마다 tableIndex/tableRow/tableCell 좌표를 만들고, officeTableStructureEdit 이 행·열 추가/삭제를 오프셋 편집으로 바꿉니다. ' +
            '새 행·셀은 선택 위치의 trPr·tcPr·첫 문단 pPr 을 물려받되 글자만 비웁니다. officeTableCellMergeEdit 은 gridSpan 가로 병합과 분할까지 담당합니다.',
        },
        {
          title: '패키지 편집 (Phase 2)',
          body:
            '목록은 numbering.xml 에 앱 전용 bullet/decimal 정의를 한 번만 만들어 numPr 로 연결하고, 그림은 word/media 엔트리와 관계를 새로 만들어 DrawingML inline 로 넣습니다. ' +
            '[Content_Types].xml 과 관계 파일 갱신(officeEnsureContentTypeDefault·officeAddRelationship)까지 전부 순수 함수입니다.',
        },
        {
          title: '저장 규칙 공용화',
          body:
            'saveDocument·reflectSaved·rememberSaved 를 이 파일이 내보내고, docx-editor 와 batch-replace 가 같은 것을 씁니다. ' +
            '"핸들이면 원본, 없으면 사본"이라는 규칙이 두 곳에서 갈라지지 않습니다.',
        },
      ],
      files: [
        { path: 'docs/오피스-찾아바꾸기-설계.md', label: '찾아바꾸기-설계.md', description: '설계 문서' },
        { path: 'tests/office-replace.test.js', label: 'office-replace.test.js', description: '순수 함수 단위 테스트' },
        { path: 'tests/office-replace-roundtrip.test.js', label: 'office-replace-roundtrip.test.js', description: '실제 파일 왕복' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            'Word 와 PowerPoint 의 구조적 동일성을 발견하고 한 코어로 합쳤습니다. 두 형식을 따로 구현했다면 코드가 두 배가 되고 버그도 두 벌이 됐을 것입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '"바꾼 파트만 갈아끼우고 나머지는 바이트 그대로" 라는 방침이 정확합니다. zip 전체를 다시 만들면 건드리지 않은 이미지·글꼴이 재압축되며 파일이 미묘하게 달라집니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '변경 이력·데이터 바인딩 문서를 처리에서 제외했습니다. 이런 문서는 부분 치환이 구조를 깨뜨리기 쉬워 거부가 옳은 선택입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '"첫 조각에 넣고 나머지는 비운다"는 규칙은 서식이 낱말 중간에서 바뀌는 경우 치환문 전체가 첫 조각의 서식을 따릅니다. 의도된 절충이지만 사용자에게는 서식이 바뀐 것처럼 보일 수 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            'Phase 2 에서 파일이 811 → 2,123줄로 커졌는데도 화면 코드가 한 줄도 넘어오지 않았습니다. 표 병합·목록 번호·그림 관계처럼 틀리기 쉬운 XML 조작이 ' +
            '전부 DOM 없는 테스트 대상으로 남았고, 그래서 office-replace.test.js 가 1,123줄까지 늘어날 수 있었습니다. 기능이 세 배가 될 때 경계가 무너지지 않은 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '"바꾼 파트만 갈아끼운다"는 Phase 1 의 약속을 표·그림 편집에서도 지켰습니다. 왕복 테스트가 word/document.xml 을 뺀 모든 zip 엔트리의 바이트 동일성을 확인하므로, ' +
            '이 약속이 문장이 아니라 검사로 남아 있습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '위험한 편집을 넓게 여는 대신 거부 조건을 촘촘히 뒀습니다 — 세로 병합 표의 행 조작, 비직사각형 표의 열 조작, 중첩 표의 셀 서식, gridSpan/hMerge/vMerge 가 섞인 열 추가. ' +
            '"안 되는 것을 안 된다고 하는" 쪽이 구조를 조용히 깨뜨리는 것보다 낫습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '제한 규칙이 순수 함수 곳곳에 흩어져 있습니다(세로 병합·중첩 표·비직사각형·gridBefore/gridAfter). ' +
            '한 곳에 모인 표가 아니라 함수마다 각자 판정하는 형태라, 새 편집 기능을 더할 때 같은 판정을 다시 쓰다가 한 조건을 빠뜨리기 쉽습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '2,123줄에 찾아 바꾸기·문단 diff·글자 서식·문단 배치·목록·표 구조·셀 서식·페이지·머리글·그림·저장이 모두 있습니다. ' +
            '아직 "순수"라는 성격은 일관되지만 도메인은 이미 여럿입니다. 나눈다면 성격(순수/화면)이 아니라 대상(문단·표·패키지)으로 자르는 편이 자연스럽습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '.pptx 는 Phase 2 범위 밖입니다. 설계 문서가 이유를 적어 뒀습니다 — 슬라이드는 문단보다 도형 배치가 본질이라 같은 화면으로 다루면 거짓말이 된다는 것입니다.',
        },
      ],
    }),

    mod('docx-editor.js', {
      title: 'docx-editor.js — Word 제자리 편집 (MNDocxEditor)',
      subtitle: '2,202줄, 미리보기 위에서 직접 고치기 + 목록 화면 대비',
      summary:
        '보기는 docx-preview 결과를 그대로 두고, 편집 모드에서 그 미리보기 DOM 을 직접 편집 가능하게 만듭니다(제자리 편집). ' +
        'docx-preview 가 DOM ↔ 원본 XML 매핑을 남기지 않는다는 사실은 지금도 그대로여서, 이 파일은 매핑을 "순서"로 잇고 그 순서를 믿지 않고 검증합니다. ' +
        '검증이 실패하면 임시 북마크로 다시 잇고, 그것마저 안 되면 Phase 2 의 문단 목록 화면으로 물러납니다. ' +
        '2026-08-08 에 글자 서식·문단 배치·목록·표·페이지·머리글/바닥글·그림 도구가 들어오며 594 → 2,202줄이 됐고, ' +
        '무엇을 어떻게 되쓸지는 여전히 전부 MNOfficeReplace 의 순수 함수가 정합니다.',
      usage: [
        {
          title: '제자리 편집 — 순서로 잇는다',
          body:
            '미리보기 DOM 에서 본문 문단만 골라내면(inlineBodyParagraphs) 그 차례가 officeParagraphOutline 의 차례와 같아집니다. ' +
            'docx-preview 가 본문 밖에서 만드는 <p> 는 전부 조상으로 갈라지기 때문입니다 — 머리말·꼬리말은 header/footer, 각주는 ol, ' +
            '텍스트 상자는 <p> 안의 <p>. 세 갈래를 closest() 로 걷어내면 남는 것이 본문입니다.',
        },
        {
          title: '순서를 믿지 않는 3단 폴백',
          body:
            'mc:AlternateContent·w:sdt·altChunk·렌더러가 그리지 못한 요소가 대응을 깰 수 있고, 깨진 채로 저장하면 사용자가 고친 것과 다른 문단이 바뀌면서 화면상으로는 멀쩡해 보입니다. ' +
            '그래서 ① officeInlineMapVerify 로 문단 글자를 전부 대조하고, ② 어긋나면 저장하지 않을 임시 북마크를 넣어 다시 build·재렌더한 뒤 docx-preview 가 만든 <span id> 로 위치를 다시 찾고, ' +
            '③ 그것으로도 못 이으면 문단 목록 화면으로 물러납니다.',
        },
        {
          title: '공백을 지우고 대조하는 이유',
          body:
            'docx-preview 는 <w:tab/> 을 U+2003 으로, <w:br/> 을 <br>(textContent 에 아무것도 안 남김)로 그려서 평문과 공백 표현이 애초에 다릅니다. ' +
            '대조는 공백을 다 지운 글자로 하고, 읽을 때는 inlineTextOf 가 그 둘을 \\t·\\n 으로 되돌려 모델 평문과 자리를 맞춥니다.',
        },
        {
          title: '역할 분리',
          body:
            '이 파일은 화면만 맡고 되쓰기 계획은 officeParagraphEditPlan 이 전부 정합니다. 도구가 열 배로 늘어난 뒤에도 이 경계는 그대로입니다 — ' +
            '편집 규칙을 테스트하려면 office-replace 쪽만 보면 됩니다.',
        },
        {
          title: '금지 구역',
          body:
            '표 안 문단과 쪽 설정(sectPr)이 든 문단은 추가·삭제를 막고 이유를 툴팁으로 알립니다. 표 안에서는 대신 셀을 골라 행·열 구조와 셀 서식을 다룹니다.',
        },
        {
          title: '표 구조까지 되돌리기',
          body:
            '표 구조를 바꾸기 직전의 글자 편집을 먼저 현재 XML 에 반영하고, XML 버전 번호를 편집 기록에 넣습니다. ' +
            '그래서 Ctrl+Z 가 글자와 표 구조를 한 줄에서 되돌립니다. 문단 배열 스냅샷만으로는 표 구조를 되돌릴 수 없어 생긴 층입니다.',
        },
      ],
      features: [
        { title: '문단 조작', body: 'Enter 로 나누기, 빈 문단에서 Backspace 로 지우기, ＋/🗑 버튼. 새 문단은 직전 문단의 pPr 을 물려받되 sectPr 은 복제하지 않습니다.' },
        { title: '글자 서식 도구', body: '글꼴·크기·굵게·기울임·밑줄·취소선·위/아래 첨자·글자색·형광펜, 서식 복사/붙임/지우기. 드래그한 범위가 있으면 그 범위만, 없으면 문단 전체 run 에 적용합니다.' },
        { title: '문단 배치 도구', body: '정렬·줄 간격·문단 앞뒤 간격·좌우 들여쓰기·첫 줄/내어쓰기·글머리표/번호 목록.' },
        { title: '표 도구', body: '선택 셀 기준 행·열 추가/삭제, 가로·세로 정렬, 배경·테두리색, 열 너비·행 높이, 오른쪽 셀과의 가로 병합과 분할.' },
        { title: '문서 도구', body: '마지막 구역의 용지 방향·여백, 머리글·바닥글 첫 문단 편집.' },
        { title: '그림 도구', body: 'PNG/JPG/GIF 추가, 첫 그림 교체, 10% 단위 확대/축소. 교체는 공유 파일을 덮지 않고 새 media 경로로 관계 대상을 바꿉니다.' },
        { title: '모드별 배너', body: '제자리 편집과 문단 목록에 각각 다른 안내를 띄웁니다. 목록 화면 쪽은 "글자만 고치는 간이 표시"라는 경고가 그대로 남아 있습니다.' },
        { title: 'Ctrl+S 를 공짜로', body: '저장 버튼에 class="run-save" 를 달아 app.js 의 saveCurrent 가 활성 문서의 .run-save 를 눌러 주는 기존 경로에 얹었습니다.' },
      ],
      files: [
        { path: 'docs/워드-문단편집-설계.md', label: '워드-문단편집-설계.md', description: '설계 문서(Phase 2·3)' },
        { path: 'tests/docx-context-menu.test.js', label: 'docx-context-menu.test.js', description: '편집 중 우클릭 메뉴 배선' },
        { path: 'tests/docx-empty-paragraph-save.test.js', label: 'docx-empty-paragraph-save.test.js', description: '빈 문단 저장 회귀' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body:
            '"편집 화면과 인쇄 모습이 다르다"는 이전 리뷰의 지적을 정면으로 해결했습니다. 우회하지 않고 docx-preview DOM 위에서 직접 고치게 만들었고, ' +
            '그러면서도 "순서가 맞다"를 가정하지 않았습니다. 어려운 쪽을 택하고 안전장치를 같이 넣은 변경입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '북마크 폴백의 발상이 좋습니다 — 저장하지 않을 임시 마커를 넣어 한 번 build·재렌더한 뒤, 렌더러가 만든 span id 로 XML 위치를 역추적합니다. ' +
            '"렌더러가 매핑을 안 남긴다"는 제약을 렌더러를 고치지 않고 우회했습니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '틀렸을 때의 증상이 조용하다는 것을 설계자가 알고 있습니다. 설계 문서가 "깨진 채로 저장하면 화면상으로는 멀쩡해 보인다"고 적어 두고 거기에 검증을 붙였습니다. ' +
            '위험을 알아본 뒤 대응까지 간 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body: '화면(이 파일)과 되쓰기 계획(office-replace)을 나눈 덕분에, 위험한 쪽 로직이 전부 DOM 없는 테스트 대상이 됐습니다. 도구가 열 배로 늘어난 뒤에도 그대로입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '북마크 폴백은 임시 마커를 넣은 docx 를 한 번 새로 만들어 다시 렌더합니다. 큰 문서에서 편집 모드 진입이 눈에 띄게 느려질 수 있고, ' +
            '이 경로는 "검증이 실패한 문서"에서만 도는 만큼 실사용 성능이 확인되기 어려운 자리입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '2,202줄 대부분이 도구 모음 DOM 생성입니다. 버튼·select·color input 을 하나씩 만드는 코드가 attach() 안에 길게 이어져 있어, ' +
            '도구가 더 늘면 이 함수가 계속 자랍니다. 도구 정의를 표(kind·label·title·적용 함수)로 두고 한 번에 그리는 형태가 자연스럽습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '편집 경로가 제자리·북마크·목록 세 갈래로 늘었습니다. 자동 테스트는 순수 코어(office-replace)와 소스 문자열 검사(docx-context-menu)에 몰려 있어, ' +
            '"어떤 문서에서 어느 갈래로 떨어지는가"는 실제 파일로 확인해야 합니다. 세 갈래를 각각 유도하는 픽스처가 있으면 좋겠습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body:
            '표 안 문단의 추가·삭제, 여러 구역의 개별 페이지 설정, 필드가 섞인 머리글 재구성, 그림 이동·자르기, .pptx 편집은 여전히 범위 밖입니다. ' +
            '설계 문서가 "비목표"로 명시해 뒀습니다.',
        },
      ],
    }),

    mod('spreadsheet-viewer.js', {
      title: 'spreadsheet-viewer.js — 표 편집기',
      subtitle: '5,915줄, 프로젝트 최대 파일',
      summary:
        'XLSX/XLS/CSV 로딩과 시트 UI, 셀 편집·선택·복사, 수식 계산, 행/열·병합·서식·필터·정렬, 저장과 새 표 생성을 담당합니다. ' +
        '엑셀 편집의 거의 전 영역을 한 파일에서 다루며, 이 프로젝트에서 가장 큰 파일입니다.',
      usage: [
        {
          title: 'vendor 두 벌',
          body: 'xlsx 묶음(SheetJS)으로 읽고 exceljs 묶음으로 편집·저장합니다. 둘 다 MNLazy 지연 로드 대상입니다.',
        },
        {
          title: '되돌리기',
          body: 'MNEditHistory 의 sheet 상한(40단계)을 씁니다. 스냅샷이 시트 전체 복제라 이 프로젝트에서 가장 무거운 히스토리입니다.',
        },
        {
          title: '대용량 CSV',
          body: 'CSV 는 페이지 단위 보기로 처리하고 필요할 때 XLSX 로 변환합니다. core.js 의 detectCsvDelimiter·indexCsvRows 가 뒤를 받칩니다.',
        },
      ],
      features: [
        { title: '수식', body: '셀 수식 계산과 자동 채우기.' },
        { title: '서식', body: '조건부 서식, 병합, 드롭다운(데이터 유효성).' },
        { title: '차트·피벗', body: 'spreadsheet-chart.js 로 SVG 차트를, 자체 미니 피벗을 제공합니다.' },
        { title: '컨텍스트 메뉴', body: 'tests/e2e/spreadsheet-context-menu.spec.js 가 우클릭 동작을 검증합니다.' },
      ],
      files: [
        { path: 'tests/xlsx-edit.test.js', label: 'xlsx-edit.test.js', description: '편집·수식·병합·차트·저장 왕복' },
        { path: 'tests/e2e/spreadsheet-undo.spec.js', label: 'spreadsheet-undo.spec.js', description: '표 되돌리기 화면 흐름' },
      ],
      notes: [
        {
          type: 'risk',
          label: 'Risk',
          body:
            '5,915줄 단일 파일입니다. 이 리뷰 페이지에도 앞 4,000줄만 실려 있습니다. 시트 렌더링·수식 엔진·서식·저장은 서로 의존이 약해 분할이 실제로 가능한 구조로 보입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '되돌리기 스냅샷이 시트 전체 복제입니다. 큰 시트에서 40단계를 쌓으면 메모리 사용이 급격히 늘 수 있습니다.',
        },
        {
          type: 'info',
          label: 'Info',
          body: '읽기(SheetJS)와 쓰기(exceljs)가 다른 라이브러리입니다. 두 라이브러리의 해석 차이가 왕복 손실로 나타날 수 있어 xlsx-edit.test.js 의 왕복 검증이 중요합니다.',
        },
      ],
    }),

    mod('spreadsheet-chart.js', {
      title: 'spreadsheet-chart.js — 표 범위 차트',
      subtitle: '443줄, 외부 차트 라이브러리 없이 SVG 생성',
      summary:
        '선택한 표 범위에서 차트에 적합한 데이터를 추론하고 막대·선·원형 SVG 차트를 만듭니다. ' +
        '차트 라이브러리를 넣지 않고 직접 SVG 를 그려 오프라인 용량을 아꼈습니다.',
      features: [
        { title: '데이터 추론', body: '머리글 행·열을 짐작해 계열과 라벨을 정합니다.' },
        { title: '차트 3종', body: '막대·선·원형. 수업용으로 필요한 최소 집합입니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '차트 라이브러리를 추가하지 않고 SVG 를 직접 생성했습니다. 오프라인 단일 파일 배포라는 제약과 일관된 선택입니다.',
        },
      ],
    }),

    mod('pptx-viewer.js', {
      title: 'pptx-viewer.js — PPTX 근사 미리보기',
      subtitle: '315줄, EXE 정확 변환의 폴백',
      summary:
        'PPTX 간이 슬라이드 미리보기, 슬라이드 맞춤, 포함 폰트 변환과 상대 리소스 경로 해석을 담당합니다. ' +
        'EXE + 설치된 PowerPoint 로 PDF 정확 변환이 가능하면 그쪽을 쓰고, 실패하거나 EXE 가 없으면 이 근사 미리보기로 떨어집니다.',
      usage: [
        {
          title: '두 경로의 품질 차이',
          body:
            'PowerPoint 변환은 실제 렌더 결과라 정확하고, pptxjs 근사 미리보기는 레이아웃이 어긋날 수 있습니다. 찾아 바꾸기는 근사 미리보기로 열렸을 때만 제공됩니다.',
        },
      ],
      features: [
        { title: '지연 로드', body: 'pptx 묶음은 jquery → jszip → jszip-utils → divs2slides → pptxjs 순서가 필수입니다.' },
        { title: '폰트 처리', body: '슬라이드에 포함된 폰트를 변환해 적용합니다.' },
      ],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: 'pptx 묶음만 jQuery 를 끌고 옵니다. 앱에서 jQuery 를 쓰는 유일한 지점이며 pptxjs 의 요구사항입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body: '같은 파일이 환경에 따라 다르게 보입니다. 교실에서 선생님 화면(EXE)과 학생 화면(HTML)이 다를 수 있다는 뜻입니다.',
        },
      ],
    }),

    mod('image-viewer.js', {
      title: 'image-viewer.js — 이미지 보기·편집',
      subtitle: '1,513줄, 편집·갤러리·복구',
      summary:
        '이미지 보기·확대·회전·뒤집기·자르기·내보내기와 작업공간 복구, 폴더 안 이미지/PDF 격자 갤러리를 담당합니다. ' +
        'MNEditHistory 의 image 상한(50단계)을 씁니다.',
      features: [
        { title: '편집', body: '회전·뒤집기·자르기·표시·모자이크·보정, PNG/JPG/PDF 저장.' },
        { title: '갤러리', body: '폴더 안 이미지를 격자로 모아 봅니다.' },
        { title: '도구 노출 설정', body: 'tests/e2e/image-tool-visibility.spec.js 가 편집 도구 노출 설정과 켜 둔 모드 정리를 검증합니다.' },
      ],
      files: [{ path: 'tests/e2e/image-tool-visibility.spec.js', label: 'image-tool-visibility.spec.js', description: '도구 노출 설정' }],
      notes: [
        {
          type: 'info',
          label: 'Info',
          body: '모자이크 기능이 있습니다. 수업 자료에서 학생 이름·얼굴을 가리는 용도로 보이며, 교육 현장의 요구가 반영된 기능입니다.',
        },
      ],
    }),

    mod('image-lightbox.js', {
      title: 'image-lightbox.js — 결과 그림 큰 창',
      subtitle: '312줄, 실행 결과와 노트북 출력용',
      summary:
        '파이썬 실행 결과 그래프와 노트북 출력 그림을 클릭하면 큰 오버레이로 띄우고 확대·이동·넘기기·PNG 저장·메모 보내기를 제공합니다. ' +
        'Matplotlib 그래프를 작은 결과창에서 보던 불편을 해결하는 얇은 계층입니다.',
      features: [
        { title: '넘기기', body: '한 실행에서 나온 여러 그래프를 좌우로 넘깁니다.' },
        { title: '메모 보내기', body: '그림을 임시 메모로 보냅니다. 수업 스크랩 흐름과 이어집니다.' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '312줄짜리 작은 파일이 python-runtime·notebook-cells·image-viewer 세 곳의 공통 요구를 해결합니다. 재사용 대비 비용이 좋은 모듈입니다.',
        },
      ],
    }),

    mod('board-render.js', {
      title: 'board-render.js — 벡터 렌더러 (MNBoardRenderer)',
      subtitle: '186줄, 화이트보드와 리플레이 공유',
      summary:
        '화이트보드와 수업 리플레이가 공유하는 선·도형·텍스트·이미지 벡터 렌더러입니다. ' +
        '그리기 결과를 나중에 재생해야 하므로, "그리는 코드"와 "화면을 만드는 코드"를 분리한 것이 핵심입니다. ' +
        '2026-08-09 의 수학·과학 도구상자를 받기 위해 group·polyline 항목과 채우기·회전·점선·투명도를 더해 124 → 186줄이 됐습니다.',
      usage: [
        {
          title: '왜 분리했는가',
          body:
            '리플레이는 사용자 입력 없이 저장된 항목 배열만 보고 같은 그림을 그려야 합니다. 렌더러가 화이트보드 UI 안에 있었다면 리플레이가 UI 를 통째로 흉내 내야 했을 것입니다.',
        },
        {
          title: 'group — 스텐실이 벡터로 남는 이유',
          body:
            'group 은 items 배열을 품고, sourceW/sourceH 대비 w/h 비율로 translate+scale 한 뒤 자식을 재귀로 그립니다. ' +
            '교육 도형이 이미지가 아니라 이 group 으로 들어오기 때문에, 사용자가 "분리"로 풀어 구성 요소를 하나씩 고칠 수 있습니다.',
        },
      ],
      features: [
        { title: '선택 판정', body: '좌표가 어느 항목 위에 있는지 판정합니다. 화이트보드의 선택·이동이 이 계산을 씁니다.' },
        { title: '항목 이동', body: '이동 좌표 계산도 렌더러 쪽에 있어 두 소비자가 같은 결과를 냅니다.' },
        { title: 'polyline', body: '점 배열·닫힘·채우기를 지원합니다. 다각형·좌표축·회로 기호가 이 항목으로 표현됩니다.' },
        { title: '회전 타원의 경계', body: '회전한 타원은 bounds 를 삼각함수로 다시 계산합니다. 선택 사각형이 도형과 어긋나지 않게 하려는 계산입니다.' },
        { title: '방어적 기본값', body: 'width·color·좌표가 없거나 숫자가 아닐 때 기본값으로 떨어집니다. 외부에서 들어온 .lesson 항목을 그리는 코드라 필요한 처리입니다.' },
      ],
      files: [{ path: 'tests/board-render.test.js', label: 'board-render.test.js', description: '선택 판정·이동 좌표·group/polyline' }],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '186줄로 두 기능의 공통 기반을 만들었습니다. 선택 판정 같은 순수 계산을 렌더러에 둔 덕분에 단위 테스트로 덮입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '도구상자를 이미지가 아니라 벡터 group 으로 받은 판단이 좋습니다. 스텐실을 PNG 로 넣었다면 색 변경도 확대도 분해도 불가능했을 것이고, ' +
            '.lesson 파일 크기도 함께 커졌을 것입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            'group 이 자식을 재귀로 그립니다. 렌더러 자체에는 깊이 제한이 없고, 대신 lesson-replay.js 의 검증(깊이 8·자식 1,000개)이 그 역할을 합니다. ' +
            '즉 방어가 렌더러가 아니라 소비자 한쪽에 있어서, 다른 경로로 group 이 들어오면 같은 보호를 받지 못합니다.',
        },
      ],
    }),

    mod('whiteboard.js', {
      title: 'whiteboard.js — 화이트보드 문서',
      subtitle: '1,342줄, 그리기·선택·복구·녹화 + 수학·과학 도구상자',
      summary:
        '독립 화이트보드 문서, 그리기 도구, 선택·이동, 이미지 삽입, 되돌리기, 복구 저장과 리플레이 녹화 연결을 담당합니다. ' +
        'MNEditHistory 의 board 상한(140단계)을 씁니다 — 벡터 항목 배열이라 스냅샷이 가볍기 때문입니다. ' +
        '2026-08-09 에 수학·과학 도구상자(기호·수식·도형·과학 스텐실)가 들어오며 636 → 1,342줄이 됐고, ' +
        '이 파일에서 처음으로 순수 함수 일부가 module.exports 로 나와 단위 테스트 대상이 됐습니다.',
      usage: [
        {
          title: '삽입물을 세 갈래로 나눈다',
          body:
            '기호(±·√·∑·℃·Ω)는 text 항목, 수식은 MathML 을 그린 SVG 이미지 항목, 도형·과학 스텐실은 벡터 group 항목으로 들어갑니다. ' +
            '"글자로 충분한 것 / 수식 조판이 필요한 것 / 분해해서 고칠 것"이라는 성격 차이를 항목 종류로 옮긴 분류입니다.',
        },
        {
          title: '수식은 원문을 함께 들고 다닌다',
          body:
            '수식 항목은 그려진 이미지와 함께 formulaSource(LaTeX 원문)·formulaColor·기준 크기를 보관합니다. ' +
            '그래서 삽입한 뒤에도 원문을 고쳐 다시 그릴 수 있습니다 — 이미지만 남겼다면 한 글자를 고치려고 지우고 다시 넣어야 했을 것입니다.',
        },
        {
          title: 'LaTeX → MathML 은 기존 것을 재사용',
          body:
            'PdfSignerCore.latexToMathML 은 노트북 셀(notebook-cells.js)이 쓰려고 core.js 에 이미 있던 함수입니다. ' +
            '화이트보드가 그것을 그대로 가져다 쓰고, 없으면 원문을 글자로 보여 주는 폴백을 둡니다.',
        },
      ],
      features: [
        { title: '문서로서의 화이트보드', body: '탭·사이드바에 다른 문서와 똑같이 올라갑니다. 별도 모드가 아니라 문서 종류의 하나입니다.' },
        { title: '녹화', body: 'lesson-replay.js 와 연결해 그리는 과정을 .lesson 으로 남깁니다.' },
        { title: '메모 왕복', body: 'tests/whiteboard-memo-roundtrip.test.js 가 메모와의 왕복을 검증합니다.' },
        {
          title: '도구상자 목록',
          body:
            '기호·수식·도형·과학 4묶음에 50개 이상, 스텐실만 60개 이상입니다. 도형은 평면·입체·작도·그래프, ' +
            '과학은 역학·전기·광학·화학·생물·지구로 다시 나뉩니다.',
        },
        {
          title: '수식 사전',
          body:
            '교과별 50개 이상의 틀을 검색어·설명과 함께 제공합니다. 틀의 [[분자]] 같은 표시를 펼치면서 입력 위치를 함께 계산해, ' +
            'Tab 으로 칸을 옮겨 다니며 채울 수 있습니다.',
        },
        { title: '내 수식·즐겨찾기·최근', body: 'localStorage 에 사용자 수식과 즐겨찾기·최근 사용을 저장하고, 읽을 때 유효한 항목만 남기고 중복을 지웁니다.' },
        { title: '두 가지 삽입 방법', body: '클릭하면 보드 한가운데, 드래그해 놓으면 놓은 자리에 들어갑니다. 커스텀 DataTransfer 타입 하나로 두 경로가 같은 함수를 부릅니다.' },
        { title: '그룹 분리', body: '스텐실 group 을 "분리"로 풀면 선·도형 낱개가 되어 하나씩 고칠 수 있습니다. 명령 팔레트에도 올라가 있습니다.' },
      ],
      files: [
        { path: 'tests/whiteboard-education-toolbox.test.js', label: 'whiteboard-education-toolbox.test.js', description: '도구 목록·수식 틀·스텐실 SVG 안전성' },
        { path: 'tests/e2e/undo-redo.spec.js', label: 'undo-redo.spec.js', description: '획 되돌리기·redo 무효화·단축키' },
        { path: 'tests/e2e/whiteboard-save.spec.js', label: 'whiteboard-save.spec.js', description: '화이트보드 저장 흐름' },
      ],
      notes: [
        {
          type: 'good',
          label: 'Good',
          body: '화이트보드를 별도 모드가 아니라 문서 종류로 만든 설계가 좋습니다. 탭·저장·복구·분할 작업이 전부 공짜로 따라옵니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '도구상자를 붙이면서 순수부(목록·수식 틀 전개·스텐실 SVG·저장값 정규화)를 module.exports 로 빼 단위 테스트를 붙였습니다. ' +
            '이 계층에서 UI 파일이 테스트 가능한 표면을 갖게 된 첫 사례입니다.',
        },
        {
          type: 'good',
          label: 'Good',
          body:
            '스텐실 SVG 에 script·foreignObject·외부 http(s) 참조가 없는지를 테스트가 직접 확인합니다. ' +
            '오프라인 원칙과 안전성을 문장이 아니라 검사로 못 박은 부분입니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '수식 SVG 는 foreignObject 안에 MathML 을 넣고 그것을 <img> 로 불러 캔버스에 그립니다. 테스트는 SVG 문자열에 MathML 과 색이 들어갔는지만 확인하고, ' +
            '실제로 래스터화되는지는 보지 않습니다. img 로 불린 SVG 의 foreignObject·MathML 처리는 브라우저·버전 편차가 큰 영역이라 ' +
            'PNG 내보내기와 리플레이 재생에서 수식만 비는 상황이 조용히 생길 수 있습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '스텐실 60개 이상의 좌표가 코드 상수로 들어 있습니다. 도형을 고치거나 더할 때마다 이 파일이 커지고, ' +
            '"도구 목록"과 "그리기 코드"가 같은 파일에 있어 whiteboard.js 가 계속 자랍니다. 목록을 데이터 파일로 떼면 그리기 로직만 남습니다.',
        },
        {
          type: 'risk',
          label: 'Risk',
          body:
            '도구상자 UI 검증이 소스 문자열 매칭(정규식으로 whiteboard.js·styles.css·command-palette.js 를 훑는 방식)에 기대고 있습니다. ' +
            'CSS 선택자와 min-height 값까지 문자열로 굳혀 놓아, 이름만 바꿔도 깨지고 실제 화면이 깨져도 문자열이 같으면 통과합니다.',
        },
      ],
    }),
  ];
};
