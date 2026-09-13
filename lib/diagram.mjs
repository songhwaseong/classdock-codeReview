// 다이어그램 생성기.
//
// 앱이 오프라인 우선이라 리뷰 산출물도 CDN을 쓰지 않는다. Mermaid 같은 런타임
// 렌더러 대신, 생성 시점에 scripts.manifest.json 을 읽어 SVG 문자열을 직접 만든다.
// 덕분에 manifest 가 바뀌면 다이어그램도 같이 바뀌고, 손으로 그린 그림이 코드와
// 어긋나는 일이 생기지 않는다.
//
// 색은 CSS 변수(currentColor 계열)가 아니라 테마 양쪽에서 읽히는 고정값을 쓰되,
// 선/글자는 `var(--...)` 를 참조해 다크 모드에서도 대비가 유지되도록 한다.

const LAYER_META = {
  bootstrap: { label: '1. bootstrap', desc: '설정·공통 상태', hue: '#2f5fd0' },
  documents: { label: '2. documents', desc: '파일·문서·PDF·코드', hue: '#12805c' },
  'python-and-notebooks': { label: '3. python-and-notebooks', desc: 'Python·Jupyter', hue: '#b45309' },
  javascript: { label: '4. javascript', desc: 'JS 실행·라이브러리·채점', hue: '#0f766e' },
  java: { label: '5. java', desc: 'Java 실행·라이브러리·예제', hue: '#a1570f' },
  'snippet-gallery': { label: '6. snippet-gallery', desc: 'Python·Java 예제 갤러리', hue: '#5b6b12' },
  'document-editors': { label: '7. document-editors', desc: 'Office·표·이미지·칠판·지도', hue: '#7a5cd0' },
  'learning-tools': { label: '8. learning-tools', desc: '수업·과제·펫·메모·이벤트', hue: '#c0392f' },
};

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// 한글·영문이 섞인 라벨의 대략 폭. 정확할 필요는 없고 박스가 글자를 자르지만 않으면 된다.
const textWidth = (text, size) => {
  let units = 0;
  for (const ch of String(text)) units += /[ㄱ-힝＀-￯]/.test(ch) ? 1 : 0.55;
  return units * size;
};

const svgWrap = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
  `font-family="'Malgun Gothic','맑은 고딕','Apple SD Gothic Neo',sans-serif">` +
  `<style>
     .dg-node { fill: var(--panel); stroke-width: 1.2; }
     .dg-node-text { fill: var(--text); font-size: 11px; }
     .dg-sub { fill: var(--text-faint); font-size: 10px; }
     .dg-title { fill: var(--text); font-size: 13px; font-weight: 700; }
     .dg-edge { fill: none; stroke: var(--border-strong); stroke-width: 1.1; }
     .dg-edge-strong { fill: none; stroke: var(--accent); stroke-width: 1.6; }
     .dg-band { fill: var(--panel-alt); stroke: var(--border); }
     .dg-chip { fill: var(--panel); stroke: var(--border); }
     .dg-chip-text { fill: var(--text-soft); font-size: 10.5px; }
   </style>` +
  body +
  `</svg>`;

const arrowDefs = () =>
  `<defs>
     <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
       <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-strong)" />
     </marker>
     <marker id="dg-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
       <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
     </marker>
   </defs>`;

/**
 * 로딩 계층도 — manifest 계층을 순서대로 두고 각 계층에 속한 스크립트를 칩으로 나열한다.
 * scripts.manifest.json 의 applicationLayers 순서가 곧 HTML script 태그 순서다.
 */
export const buildLayerDiagram = (manifest) => {
  const layers = manifest.applicationLayers;
  const width = 1180;
  const pad = 24;
  const bandGap = 18;
  const chipH = 24;
  const chipGap = 7;
  const headH = 44;

  let y = pad;
  const parts = [arrowDefs()];

  layers.forEach((layer, layerIndex) => {
    const meta = LAYER_META[layer.id] ?? { label: layer.id, desc: '', hue: '#55637a' };
    const innerWidth = width - pad * 2 - 24;

    // 칩을 줄바꿈 배치해 밴드 높이를 먼저 계산한다.
    const rows = [];
    let row = [];
    let rowWidth = 0;
    layer.scripts.forEach((file) => {
      const w = Math.round(textWidth(file, 10.5)) + 22;
      if (rowWidth + w + chipGap > innerWidth && row.length) {
        rows.push(row);
        row = [];
        rowWidth = 0;
      }
      row.push({ file, w });
      rowWidth += w + chipGap;
    });
    if (row.length) rows.push(row);

    const bandH = headH + rows.length * (chipH + chipGap) + 6;

    parts.push(
      `<rect class="dg-band" x="${pad}" y="${y}" width="${width - pad * 2}" height="${bandH}" rx="12" />`,
      `<rect x="${pad}" y="${y}" width="5" height="${bandH}" rx="2.5" fill="${meta.hue}" />`,
      `<text class="dg-title" x="${pad + 18}" y="${y + 22}">${esc(meta.label)}</text>`,
      `<text class="dg-sub" x="${pad + 18 + Math.round(textWidth(meta.label, 13)) + 12}" y="${y + 22}">${esc(
        meta.desc,
      )} · ${layer.scripts.length}개</text>`,
    );

    rows.forEach((chips, rowIndex) => {
      let x = pad + 18;
      const chipY = y + headH + rowIndex * (chipH + chipGap) - 8;
      chips.forEach(({ file, w }) => {
        parts.push(
          `<rect class="dg-chip" x="${x}" y="${chipY}" width="${w}" height="${chipH}" rx="7" />`,
          `<text class="dg-chip-text" x="${x + 11}" y="${chipY + 16}">${esc(file)}</text>`,
        );
        x += w + chipGap;
      });
    });

    if (layerIndex < layers.length - 1) {
      const arrowY = y + bandH;
      parts.push(
        `<path class="dg-edge-strong" d="M ${width / 2} ${arrowY + 2} L ${width / 2} ${
          arrowY + bandGap - 3
        }" marker-end="url(#dg-arrow-accent)" />`,
      );
    }

    y += bandH + bandGap;
  });

  return svgWrap(width, y - bandGap + pad, parts.join(''));
};

/**
 * 의존 그래프 — scriptDependencies 를 계층별 열로 배치해 그린다.
 * check-source.js 가 "의존 대상은 반드시 먼저 로드된다"를 강제하므로 간선은 언제나
 * 왼쪽(먼저 로드) → 오른쪽(나중 로드) 방향이고, 같은 열 안에서만 위→아래로 흐른다.
 */
export const buildDependencyDiagram = (manifest) => {
  const layers = manifest.applicationLayers;
  const deps = manifest.scriptDependencies ?? {};

  const colWidth = 210;
  const colGap = 52;
  const nodeH = 26;
  const nodeGap = 9;
  const pad = 30;
  const headH = 34;

  const pos = new Map();
  layers.forEach((layer, col) => {
    layer.scripts.forEach((file, row) => {
      pos.set(file, {
        x: pad + col * (colWidth + colGap),
        y: pad + headH + row * (nodeH + nodeGap),
        col,
        row,
      });
    });
  });

  const maxRows = Math.max(...layers.map((layer) => layer.scripts.length));
  const width = pad * 2 + layers.length * colWidth + (layers.length - 1) * colGap;
  const height = pad * 2 + headH + maxRows * (nodeH + nodeGap);

  const parts = [arrowDefs()];

  // 열 배경과 제목
  layers.forEach((layer, col) => {
    const meta = LAYER_META[layer.id] ?? { label: layer.id, hue: '#55637a' };
    const x = pad + col * (colWidth + colGap);
    const h = headH + layer.scripts.length * (nodeH + nodeGap) + 6;
    parts.push(
      `<rect class="dg-band" x="${x - 10}" y="${pad - 10}" width="${colWidth + 20}" height="${h + 8}" rx="12" />`,
      `<text class="dg-title" x="${x}" y="${pad + 8}" font-size="12">${esc(meta.label)}</text>`,
    );
  });

  // 간선 먼저(노드 아래로 깔리도록)
  Object.entries(deps).forEach(([target, sources]) => {
    const to = pos.get(target);
    if (!to) return;
    sources.forEach((source) => {
      const from = pos.get(source);
      if (!from) return;

      if (from.col === to.col) {
        // 같은 계층: 열 왼쪽으로 부풀린 곡선으로 위→아래를 잇는다.
        const x = from.x - 4;
        const bow = 26 + Math.abs(to.row - from.row) * 2;
        parts.push(
          `<path class="dg-edge" d="M ${x} ${from.y + nodeH / 2} C ${x - bow} ${from.y + nodeH / 2}, ${x - bow} ${
            to.y + nodeH / 2
          }, ${to.x - 4} ${to.y + nodeH / 2}" marker-end="url(#dg-arrow)" />`,
        );
        return;
      }
      // 다른 계층: 오른쪽 끝 → 다음 열 왼쪽 끝
      const sx = from.x + colWidth;
      const sy = from.y + nodeH / 2;
      const tx = to.x - 4;
      const ty = to.y + nodeH / 2;
      const mid = (sx + tx) / 2;
      parts.push(
        `<path class="dg-edge" d="M ${sx} ${sy} C ${mid} ${sy}, ${mid} ${ty}, ${tx} ${ty}" marker-end="url(#dg-arrow)" />`,
      );
    });
  });

  // 노드
  layers.forEach((layer, col) => {
    const meta = LAYER_META[layer.id] ?? { hue: '#55637a' };
    layer.scripts.forEach((file) => {
      const p = pos.get(file);
      const inbound = (deps[file] ?? []).length;
      const outbound = Object.values(deps).filter((list) => list.includes(file)).length;
      parts.push(
        `<rect class="dg-node" x="${p.x}" y="${p.y}" width="${colWidth}" height="${nodeH}" rx="8" stroke="${meta.hue}" />`,
        `<text class="dg-node-text" x="${p.x + 11}" y="${p.y + 17}">${esc(file)}</text>`,
      );
      if (outbound) {
        parts.push(
          `<text class="dg-sub" x="${p.x + colWidth - 10}" y="${p.y + 17}" text-anchor="end">←${outbound}</text>`,
        );
      } else if (inbound) {
        parts.push(`<text class="dg-sub" x="${p.x + colWidth - 10}" y="${p.y + 17}" text-anchor="end">·</text>`);
      }
    });
  });

  return svgWrap(width, height, parts.join(''));
};

/**
 * 공개 API 경계도 — moduleBoundaries 의 MN* 전역과 소비자를 방사형으로 잇는다.
 */
export const buildBoundaryDiagram = (manifest) => {
  const boundaries = [...(manifest.moduleBoundaries ?? [])].sort(
    (a, b) => (b.consumers?.length ?? 0) - (a.consumers?.length ?? 0),
  );

  const rowH = 34;
  const pad = 26;
  const apiX = 40;
  const apiW = 210;
  const consumerX = 380;
  const width = 1080;

  let y = pad + 26;
  const parts = [arrowDefs(), `<text class="dg-title" x="${pad}" y="${pad + 6}">전역 공개 API → 소비 파일</text>`];

  boundaries.forEach((boundary) => {
    const consumers = boundary.consumers ?? [];
    const chips = [];
    let x = consumerX;
    let rows = 1;
    consumers.forEach((file) => {
      const w = Math.round(textWidth(file, 10.5)) + 20;
      if (x + w > width - pad) {
        x = consumerX;
        rows += 1;
      }
      chips.push({ file, w, x, row: rows - 1 });
      x += w + 7;
    });

    const blockH = Math.max(rowH, rows * 26 + 8);
    parts.push(
      `<rect class="dg-node" x="${apiX}" y="${y}" width="${apiW}" height="26" rx="8" stroke="var(--accent)" />`,
      `<text class="dg-node-text" x="${apiX + 12}" y="${y + 17}" font-weight="600">${esc(boundary.publicApi)}</text>`,
      `<text class="dg-sub" x="${apiX}" y="${y + 39}">${esc(boundary.file)}</text>`,
      `<path class="dg-edge-strong" d="M ${apiX + apiW} ${y + 13} L ${consumerX - 10} ${
        y + 13
      }" marker-end="url(#dg-arrow-accent)" />`,
    );

    chips.forEach(({ file, w, x: cx, row }) => {
      const cy = y + row * 26;
      parts.push(
        `<rect class="dg-chip" x="${cx}" y="${cy}" width="${w}" height="22" rx="6" />`,
        `<text class="dg-chip-text" x="${cx + 10}" y="${cy + 15}">${esc(file)}</text>`,
      );
    });

    y += blockH + 22;
  });

  return svgWrap(width, y + pad - 12, parts.join(''));
};

/**
 * 실행 형태 경계도 — 같은 코드가 세 가지 방식으로 뜨고, 무엇이 브라우저 안에 갇히고
 * 무엇이 EXE 로컬 서버를 거치는지 보여 준다. 이 그림은 manifest 로부터 계산되지 않는
 * 설계 사실이라 손으로 좌표를 잡았다.
 */
export const buildRuntimeDiagram = (manifest, artifactSizes = {}) => {
  const width = 1080;
  const height = 470;
  const box = (x, y, w, h, stroke) =>
    `<rect class="dg-node" x="${x}" y="${y}" width="${w}" height="${h}" rx="11" stroke="${stroke}" />`;
  const label = (x, y, text, weight = '600', size = 12) =>
    `<text class="dg-node-text" x="${x}" y="${y}" font-weight="${weight}" font-size="${size}">${esc(text)}</text>`;
  const sub = (x, y, text) => `<text class="dg-sub" x="${x}" y="${y}">${esc(text)}</text>`;

  const parts = [
    arrowDefs(),
    `<text class="dg-title" x="30" y="30">한 벌의 소스 → 세 가지 실행 형태</text>`,

    // 소스
    box(30, 56, 220, 118, '#2f5fd0'),
    label(46, 80, `src/js/*.js (${manifest.localScripts.length}개)`),
    sub(46, 100, 'scripts.manifest.json 순서'),
    sub(46, 118, 'src/styles.css'),
    sub(46, 136, `vendor/*.js (${manifest.vendorScripts.length}개)`),
    sub(46, 154, 'classdock.html'),

    // 빌드
    box(320, 86, 180, 58, '#7a5cd0'),
    label(336, 110, 'build-offline.js'),
    sub(336, 130, 'npm run build'),

    box(320, 172, 180, 58, '#7a5cd0'),
    label(336, 196, 'desktop/build.bat'),
    sub(336, 216, 'launcher.cs → exe'),

    `<path class="dg-edge-strong" d="M 250 115 L 310 115" marker-end="url(#dg-arrow-accent)" />`,
    `<path class="dg-edge-strong" d="M 250 130 C 285 130, 285 200, 310 200" marker-end="url(#dg-arrow-accent)" />`,

    // 산출물 3종
    box(570, 46, 480, 116, '#12805c'),
    label(590, 70, '① classdock.html — 온라인 HTML'),
    sub(590, 92, 'vendor 를 CDN 에서 받는 원본. 첫 실행에 인터넷 필요.'),
    sub(590, 112, '브라우저 샌드박스 안에서만 동작 — File System Access 로 원본 저장.'),
    sub(590, 132, '로컬 Python·PowerPoint 연동 없음, Pyodide 만 사용.'),
    sub(590, 150, '개발 중 기준 파일이자 check-source.js 의 검사 대상.'),

    box(570, 176, 480, 116, '#12805c'),
    label(590, 200, '② classdock-offline.html — 단일 파일'),
    sub(590, 222, `HTML·CSS·로컬 JS·vendor 를 한 파일로 인라인(${artifactSizes.offline ?? '약 19MB'}).`),
    sub(590, 242, '지연 vendor 는 text/plain 블록으로 넣고 MNLazy 가 꺼내 쓴다.'),
    sub(590, 262, '인터넷 없이 열기·편집 가능. Pyodide 최초 실행만 예외.'),
    sub(590, 280, 'check-release.js 가 로컬 경로 잔존·해시를 검사.'),

    box(570, 306, 480, 136, '#c0392f'),
    label(590, 330, '③ ClassDock.exe — 로컬 서버 동반'),
    sub(590, 352, 'launcher.cs 가 127.0.0.1 고정 포트(17645→…)로 바인딩.'),
    sub(590, 372, `오프라인 HTML 을 품은 ${artifactSizes.exe ?? '약 19MB'} 실행 파일이 브라우저를 자동으로 연다.`),
    sub(590, 392, '추가로 열리는 것: 실제 디스크 저장, 로컬 Python·pip·커널,'),
    sub(590, 412, 'PowerPoint 정확 변환, ffmpeg 미디어 변환, SQLite, 시험지 수신.'),
    sub(590, 430, '모든 위험 엔드포인트는 실행별 X-ClassDock-Token 을 요구.'),

    `<path class="dg-edge" d="M 500 108 C 535 108, 535 104, 560 104" marker-end="url(#dg-arrow)" />`,
    `<path class="dg-edge" d="M 500 122 C 535 122, 535 234, 560 234" marker-end="url(#dg-arrow)" />`,
    `<path class="dg-edge" d="M 500 201 C 535 201, 535 374, 560 374" marker-end="url(#dg-arrow)" />`,
  ];

  return svgWrap(width, height, parts.join(''));
};

/**
 * 빌드·검증 파이프라인 — npm run verify 가 무엇을 순서대로 거는지.
 */
export const buildPipelineDiagram = () => {
  const width = 1120;
  const height = 300;
  const steps = [
    { x: 30, title: 'check', sub: ['tools/check-source.js', '문법·전역 충돌', 'manifest 계층·의존', '공개 API 경계'] },
    { x: 250, title: 'test', sub: ['node --test tests/*', '단위·계약 테스트', 'release-contract 가', '문서 목록까지 검사'] },
    {
      x: 470,
      title: 'build',
      sub: ['build-korean-spell-worker', '→ build-offline.js', '오프라인 HTML 합치기', 'sha384 무결성 확인'],
    },
    { x: 690, title: 'release-check', sub: ['tools/check-release.js', '로컬 경로 잔존 검사', 'vendor 해시·산출물', '배포 계약'] },
    { x: 910, title: 'exe', sub: ['desktop/build.bat', 'launcher.cs 컴파일', '오프라인 HTML 내장', '(수동 단계)'] },
  ];

  const parts = [arrowDefs(), `<text class="dg-title" x="30" y="30">npm run verify → desktop\\build.bat</text>`];

  steps.forEach((step, index) => {
    const stroke = index === steps.length - 1 ? '#c0392f' : '#2f5fd0';
    parts.push(
      `<rect class="dg-node" x="${step.x}" y="60" width="190" height="150" rx="12" stroke="${stroke}" />`,
      `<text class="dg-node-text" x="${step.x + 16}" y="88" font-weight="700" font-size="13">${esc(step.title)}</text>`,
    );
    step.sub.forEach((line, i) => {
      parts.push(`<text class="dg-sub" x="${step.x + 16}" y="${112 + i * 20}">${esc(line)}</text>`);
    });
    if (index < steps.length - 1) {
      const gap = steps[index + 1].x - (step.x + 190);
      parts.push(
        `<path class="dg-edge-strong" d="M ${step.x + 190} 135 L ${step.x + 190 + gap - 8} 135" marker-end="url(#dg-arrow-accent)" />`,
      );
    }
  });

  parts.push(
    `<text class="dg-sub" x="30" y="248">한 단계라도 실패하면 다음으로 넘어가지 않는다. release-contract.test.js 는 manifest·문서·vendor 목록이 서로 어긋나면 실패하므로,</text>`,
    `<text class="dg-sub" x="30" y="268">새 src/js 파일을 추가하고 docs/JS-파일별-기능.md 갱신을 잊으면 test 단계에서 걸린다.</text>`,
  );

  return svgWrap(width, height, parts.join(''));
};

export { LAYER_META };
