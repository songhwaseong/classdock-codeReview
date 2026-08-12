// 코드리뷰 맵 렌더러.
// 데이터는 네 개의 전역에서 온다 — review-data.generated.js(섹션·소스코드),
// review-comments.js(줄 앵커 주석), flows.js(흐름 추적), contracts.js(전역 API·EXE 엔드포인트).
// 앱 본체와 마찬가지로 번들러 없이 전역 스크립트로만 돌아간다.

const state = {
  activeSectionId: null,
  activeFileIndex: 0,
  query: '',
  openCategory: null,
  lastFocused: null,
  modalFile: null,
  seenTerms: new Set(), // 이번 렌더에서 이미 링크를 건 용어(용어당 한 번만 건다)
};

const data = window.MN_REVIEW_DATA;
const comments = window.MN_REVIEW_COMMENTS ?? [];
const flows = window.MN_FLOWS ?? [];
const contracts = window.MN_CONTRACTS ?? [];

const $ = (id) => document.getElementById(id);

const nav = $('reviewNav');
const searchInput = $('searchInput');
const sectionEyebrow = $('sectionEyebrow');
const sectionTitle = $('sectionTitle');
const sectionSummary = $('sectionSummary');
const sectionStats = $('sectionStats');
const sectionJump = $('sectionJump');
const diagramPanel = $('diagramPanel');
const diagramTitle = $('diagramTitle');
const diagramCaption = $('diagramCaption');
const diagramStage = $('diagramStage');
const diagramLegend = $('diagramLegend');
const diagramZoomControl = $('diagramZoom');
const diagramZoomLabel = $('diagramZoomLevel');
const layoutPanel = $('layoutPanel');
const layoutUsage = $('layoutUsage');
const featurePanel = $('featurePanel');
const featureTitle = $('featureTitle');
const featureList = $('featureList');
const flowPanel = $('flowPanel');
const flowList = $('flowList');
const contractPanel = $('contractPanel');
const contractList = $('contractList');
const codePanel = $('codePanel');
const fileTabs = $('fileTabs');
const codeMeta = $('codeMeta');
const codeBlock = $('codeBlock');
const codeCommentNav = $('codeCommentNav');
const codeCopy = $('codeCopy');
const notesPanel = $('notesPanel');
const reviewNotes = $('reviewNotes');
const codeModal = $('codeModal');
const codeModalTitle = $('codeModalTitle');
const codeModalMeta = $('codeModalMeta');
const codeModalBlock = $('codeModalBlock');
const codeModalCopy = $('codeModalCopy');
const themeToggle = $('themeToggle');
const navToggle = $('navToggle');
const navBackdrop = $('navBackdrop');
const sidebar = $('sidebar');
const resizer = $('resizer');
const content = document.querySelector('.content');

// ── 공통 유틸 ──────────────────────────────────────────

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalize = (value) => String(value).toLowerCase();

// 검색어 표시는 원문에서 자리를 찾고, 조각마다 escape 한 뒤에 <mark> 를 끼운다.
// 이스케이프한 뒤에 찾으면 "amp"·"quot" 같은 검색어가 &amp; 안쪽에 걸려 엔티티가 깨지고,
// 반대로 <, >, & 는 원문에 있어도 영영 찾지 못한다(목록 필터는 원문 기준이라 더 헷갈린다).
const highlight = (value) => {
  const text = String(value);
  if (!state.query) return escapeHtml(text);
  const escaped = state.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let html = '';
  let last = 0;
  for (const match of text.matchAll(new RegExp(escaped, 'ig'))) {
    html += escapeHtml(text.slice(last, match.index)) + `<mark>${escapeHtml(match[0])}</mark>`;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
};

// 산문 속 코드 조각(파일명·경로·전역 이름·명령)을 찾아 <code> 로 감싼다.
//
// 리뷰 문장 96개 섹션이 이미 마크업 없는 평문이라 저자가 일일이 표시하는 대신 규칙으로 집는다.
// 그래서 "확신이 서는 모양"만 좁게 잡는다 — 일반 PascalCase 를 넣으면 PowerPoint·JavaScript 같은
// 제품 이름까지 코드로 칠해지므로 일부러 뺐다. 규칙이 못 잡는 것은 `백틱` 으로 직접 지정한다.
const CODE_PATTERN = new RegExp(
  [
    '`[^`\\n]+`', // 백틱 — 저자가 직접 지정
    '</?[A-Za-z][\\w:.-]*>', // <script>, <w:p>
    '\\b(?:npm|npx|node)(?:\\s+(?:--)?[\\w:.-]+){1,2}', // npm run verify, node --test
    // src/js, vendor/, docs/JS-파일별-기능.md — 경로 중간의 한글은 허용하되 끝에는 두지 않는다.
    // 그러지 않으면 "tools/check-source.js가" 처럼 조사까지 코드로 삼킨다.
    '\\b(?:src|vendor|docs|tools|desktop|tests|dist|node_modules)/(?:[\\w가-힣.*/-]*[\\w*])?',
    '(?<![가-힣])[\\w가-힣./-]*[\\w가-힣]\\.(?:js|mjs|cjs|cs|py|html|json|css|md|bat|cmd|ps1|vbs|sh|exe)\\b',
    '\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b', // 127.0.0.1
    '\\bwindow\\.[\\w$.]+', // window.MN_REVIEW_DATA
    '\\bMN\\w+\\b', // MNLazy, MN_REVIEW_DATA
    '\\b[a-z]+[A-Z][A-Za-z0-9]*\\b', // applicationLayers, publicApi
  ].join('|'),
  'g',
);

// ── 용어 링크 ──────────────────────────────────────────
// 사전에 실린 말이 본문에 나오면 툴팁(뜻)과 링크(사전 항목)를 건다.
// 다만 '전역'은 리뷰에 850번 나온다. 전부 걸면 밑줄 범벅이 되므로 한 화면에서 용어당
// 첫 번째 등장에만 건다(state.seenTerms). 사전 섹션 자신은 건드리지 않는다 — 뜻풀이 안에서
// 그 말이 또 링크가 되면 제자리를 맴돈다.

const glossary = data.glossary ?? [];
const termById = new Map(glossary.map((item) => [item.id, item]));
const aliasToId = new Map();
glossary.forEach((item) => {
  item.aliases.forEach((alias) => {
    if (!aliasToId.has(alias.toLowerCase())) aliasToId.set(alias.toLowerCase(), item.id);
  });
});

const codeWords = data.codeWords ?? [];
const codeWordByName = new Map(codeWords.map((item) => [item.name, item]));
const codeReferences = data.codeReferences ?? [];
const codePatterns = data.codePatterns ?? [];
const projectFunctions = data.projectFunctions ?? [];
const codeEntryById = new Map([
  ...codeWords.map((item) => [item.id, { ...item, sectionId: 'code-words', type: 'keyword' }]),
  ...codeReferences.map((item) => [item.id, { ...item, sectionId: 'code-symbols' }]),
  ...codePatterns.map((item) => [item.id, { ...item, sectionId: 'code-patterns' }]),
  ...projectFunctions.map((item) => [item.id, { ...item, sectionId: 'project-functions' }]),
]);
const codeIdentifierByLanguage = new Map();
const codeMethodByLanguage = new Map();
const projectFunctionByLanguage = new Map();
const codeOperatorsByLanguage = { js: [], cs: [], py: [] };
codeReferences.forEach((item) => {
  item.languages.forEach((language) => {
    if (item.type === 'operator') codeOperatorsByLanguage[language]?.push(item);
    else codeIdentifierByLanguage.set(`${language}:${item.name}`, item);
  });
});
codePatterns.forEach((item) => {
  if (item.type !== 'method') return;
  item.languages.forEach((language) => codeMethodByLanguage.set(`${language}:${item.name}`, item));
});
projectFunctions.forEach((item) => {
  item.languages.forEach((language) => projectFunctionByLanguage.set(`${language}:${item.name}`, item));
});
Object.values(codeOperatorsByLanguage).forEach((items) => items.sort((a, b) => b.name.length - a.name.length));
const UNLINKED_COMPOUND_OPERATORS = [
  '>>>=',
  '<<=',
  '>>=',
  '&&=',
  '||=',
  '??=',
  '**=',
  '**',
  '//=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
];

// 긴 별칭을 먼저 둬야 '전역 스크립트'가 '전역'에 먼저 잘리지 않는다.
const TERM_PATTERN = aliasToId.size
  ? new RegExp(
      [...aliasToId.keys()]
        .sort((a, b) => b.length - a.length)
        .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|'),
      'gi',
    )
  : null;

// 낱말 안쪽에서 잘못 걸리는 것을 막는다. 한글은 뒤에 조사가 붙으므로(‘전역이’, ‘폴백을’)
// 뒤쪽은 열어 두고 앞쪽만 막는다. 영문은 양쪽 모두 낱말 경계를 요구한다.
const isTermBoundary = (text, start, end) => {
  const before = text[start - 1] ?? '';
  if (/[가-힣A-Za-z0-9_]/.test(before)) return false;
  const isAscii = /[A-Za-z0-9_]$/.test(text.slice(start, end));
  return !(isAscii && /[A-Za-z0-9_]/.test(text[end] ?? ''));
};

const annotateTerms = (text) => {
  if (!TERM_PATTERN || state.activeSectionId === 'glossary') return highlight(text);
  let html = '';
  let last = 0;
  for (const match of text.matchAll(TERM_PATTERN)) {
    const id = aliasToId.get(match[0].toLowerCase());
    if (!id || state.seenTerms.has(id) || match.index < last) continue;
    if (!isTermBoundary(text, match.index, match.index + match[0].length)) continue;
    state.seenTerms.add(id);
    html +=
      highlight(text.slice(last, match.index)) +
      `<a class="term" href="#glossary" data-term="${id}">${highlight(match[0])}</a>`;
    last = match.index + match[0].length;
  }
  return html + highlight(text.slice(last));
};

// 코드 조각과 일반 텍스트를 나눈 뒤, 코드가 아닌 쪽에만 용어 링크를 건다.
// (highlight 가 escape 까지 맡으므로 태그 경계가 깨지지 않는다)
const prose = (value) => {
  const text = String(value);
  let html = '';
  let last = 0;
  for (const match of text.matchAll(CODE_PATTERN)) {
    const raw = match[0];
    const inner = raw.startsWith('`') && raw.endsWith('`') ? raw.slice(1, -1) : raw;
    html += annotateTerms(text.slice(last, match.index)) + `<code>${highlight(inner)}</code>`;
    last = match.index + raw.length;
  }
  return html + annotateTerms(text.slice(last));
};

// ── 구문 강조 ──────────────────────────────────────────
// 외부 하이라이터를 쓰지 않으므로 가벼운 토크나이저를 직접 돌린다.
// 파일 하나를 그리는 동안 상태를 공유해 여러 줄 주석·문자열 안에 코드 사전 링크가 잘못 붙지 않게 한다.

const KEYWORDS = { js: new Set(), cs: new Set(), py: new Set() };
codeWords.forEach((item) => {
  item.languages.forEach((language) => KEYWORDS[language]?.add(item.name));
});

const getLang = (path) => {
  if (/\.cs$/i.test(path)) return 'cs';
  if (/\.(py|pyw)$/i.test(path)) return 'py';
  if (/\.(js|mjs|cjs)$/i.test(path)) return 'js';
  if (/\.(json|manifest)$/i.test(path)) return 'json';
  if (/\.(md|markdown)$/i.test(path)) return 'md';
  if (/\.(bat|cmd|ps1|vbs|sh)$/i.test(path)) return 'shell';
  return 'plain';
};

const LINE_COMMENT = { js: '//', cs: '//', py: '#', json: null, md: null, shell: '#', plain: null };

const isRegexLiteralStart = (line, index) => {
  if (line[index] !== '/' || line[index + 1] === '/' || line[index + 1] === '*') return false;
  const prefix = line.slice(0, index).trimEnd();
  if (!prefix) return true;
  return (
    /[=(:,!&|?{;\[]$/.test(prefix) ||
    /(?:=>|\b(?:return|case|throw|delete|typeof|void|new|in|of))$/.test(prefix)
  );
};

const highlightCode = (line, lang, lexerState = {}) => {
  if (!line) return ' ';
  if (lang === 'md') return escapeHtml(line);

  const keywords = KEYWORDS[lang];
  const lineComment = LINE_COMMENT[lang];
  let html = '';
  let i = 0;
  const n = line.length;

  while (i < n) {
    const rest = line.slice(i);
    const ch = line[i];

    if (lexerState.blockComment) {
      const end = rest.indexOf('*/');
      const chunk = end >= 0 ? rest.slice(0, end + 2) : rest;
      html += `<span class="tok-comment">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      if (end >= 0) lexerState.blockComment = false;
      else break;
      continue;
    }
    if (lexerState.multilineString) {
      const delimiter = lexerState.multilineString;
      const end = rest.indexOf(delimiter);
      const chunk = end >= 0 ? rest.slice(0, end + delimiter.length) : rest;
      html += `<span class="tok-string">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      if (end >= 0) lexerState.multilineString = null;
      else break;
      continue;
    }
    if (lineComment && rest.startsWith(lineComment)) {
      html += `<span class="tok-comment">${escapeHtml(rest)}</span>`;
      break;
    }
    if ((lang === 'js' || lang === 'cs') && ch === '/' && line[i + 1] === '*') {
      const end = rest.indexOf('*/');
      const chunk = end >= 0 ? rest.slice(0, end + 2) : rest;
      html += `<span class="tok-comment">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      if (end < 0) lexerState.blockComment = true;
      continue;
    }
    if (lang === 'py' && (rest.startsWith("'''") || rest.startsWith('"""'))) {
      const delimiter = rest.slice(0, 3);
      const end = rest.indexOf(delimiter, 3);
      const chunk = end >= 0 ? rest.slice(0, end + 3) : rest;
      html += `<span class="tok-string">${escapeHtml(chunk)}</span>`;
      i += chunk.length;
      if (end < 0) lexerState.multilineString = delimiter;
      continue;
    }
    if (lang === 'js' && isRegexLiteralStart(line, i)) {
      let j = i + 1;
      let inClass = false;
      while (j < n) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === '[') inClass = true;
        else if (line[j] === ']') inClass = false;
        else if (line[j] === '/' && !inClass) {
          j += 1;
          while (/[A-Za-z]/.test(line[j] ?? '')) j += 1;
          break;
        }
        j += 1;
      }
      html += `<span class="tok-string">${escapeHtml(line.slice(i, Math.min(j, n)))}</span>`;
      i = Math.min(j, n);
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j += 1;
          closed = true;
          break;
        }
        j += 1;
      }
      const stop = Math.min(j, n);
      html += `<span class="tok-string">${escapeHtml(line.slice(i, stop))}</span>`;
      i = stop;
      if (ch === '`' && !closed) lexerState.multilineString = '`';
      continue;
    }
    if (/[0-9]/.test(ch) && !/[A-Za-z0-9_$]/.test(line[i - 1] ?? '')) {
      const match = /^[0-9][0-9_]*(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(rest);
      if (match) {
        html += `<span class="tok-number">${escapeHtml(match[0])}</span>`;
        i += match[0].length;
        continue;
      }
    }
    if (/[A-Za-z_$@]/.test(ch)) {
      const word = /^[@A-Za-z_$][A-Za-z0-9_$]*/.exec(rest)[0];
      const prefix = line.slice(0, i).trimEnd();
      const functionClass = line.slice(i + word.length).trimStart().startsWith('(') ? ' tok-function' : '';
      const projectItem = functionClass ? projectFunctionByLanguage.get(`${lang}:${word}`) : null;
      const methodItem = prefix.endsWith('.') ? codeMethodByLanguage.get(`${lang}:${word}`) : null;
      if (projectItem) {
        html += `<span class="code-reference project-reference${functionClass}" data-code-entry="${escapeHtml(projectItem.id)}" data-code-lang="${lang}">${escapeHtml(word)}</span>`;
      } else if (methodItem) {
        html += `<span class="code-reference method-reference${functionClass}" data-code-entry="${escapeHtml(methodItem.id)}" data-code-lang="${lang}">${escapeHtml(word)}</span>`;
      } else if (keywords && keywords.has(word)) {
        const item = codeWordByName.get(word);
        html += item
          ? `<span class="tok-keyword code-word code-reference" data-code-entry="${escapeHtml(item.id)}" data-code-lang="${lang}">${escapeHtml(word)}</span>`
          : `<span class="tok-keyword">${escapeHtml(word)}</span>`;
      } else {
        const item = codeIdentifierByLanguage.get(`${lang}:${word}`);
        html += item
          ? `<span class="code-reference ${item.type === 'method' ? 'method-reference' : 'builtin-reference'}${functionClass}" data-code-entry="${escapeHtml(item.id)}" data-code-lang="${lang}">${escapeHtml(word)}</span>`
          : functionClass
            ? `<span class="tok-function">${escapeHtml(word)}</span>`
            : escapeHtml(word);
      }
      i += word.length;
      continue;
    }
    const unlinkedOperator = UNLINKED_COMPOUND_OPERATORS.find((token) => rest.startsWith(token));
    if (unlinkedOperator) {
      html += escapeHtml(unlinkedOperator);
      i += unlinkedOperator.length;
      continue;
    }
    const operator = codeOperatorsByLanguage[lang]?.find((item) => rest.startsWith(item.name));
    if (operator) {
      html += `<span class="code-reference operator-reference" data-code-entry="${escapeHtml(operator.id)}" data-code-lang="${lang}">${escapeHtml(operator.name)}</span>`;
      i += operator.name.length;
      continue;
    }
    html += escapeHtml(ch);
    i += 1;
  }
  return html;
};

// ── 섹션 조회 ──────────────────────────────────────────

const getCurrentSection = () =>
  data.sections.find((section) => section.id === state.activeSectionId) ?? data.sections[0];

// 같은 파일이 여러 섹션에 실릴 수 있고, 큰 파일은 구간(range)만 실린다.
// 점프할 줄이 실제로 들어 있는 조각을 우선 고른다.
const holdsLine = (file, lineNo) => {
  if (!lineNo) return true;
  const start = (file.lineOffset || 0) + 1;
  return lineNo >= start && lineNo < start + file.lineCount;
};

const findFileEntry = (filePath, lineNo, preferredSectionId = null) => {
  const candidates = [];
  data.sections.forEach((section) => {
    section.files.forEach((file) => {
      if (file.path === filePath) candidates.push({ section, file });
    });
  });
  if (!candidates.length) return null;
  return (
    candidates.find((item) => item.section.id === preferredSectionId && holdsLine(item.file, lineNo)) ??
    candidates.find((item) => holdsLine(item.file, lineNo)) ??
    candidates.find((item) => item.section.id === preferredSectionId) ??
    candidates[0]
  );
};

const sectionSearchText = new Map();
const getSectionSearchText = (section) => {
  if (sectionSearchText.has(section.id)) return sectionSearchText.get(section.id);

  // 사이드카 데이터도 해당 섹션 화면에 함께 렌더되므로 검색 색인에 포함한다.
  // 그렇지 않으면 흐름 제목이나 /ping 같은 계약 식별자가 화면에는 보여도
  // 사이드바 검색으로는 해당 섹션을 찾을 수 없다.
  const sectionComments = comments.filter((item) => item.sectionId === section.id);
  const sectionFlows = flows.filter((flow) => (flow.sectionIds ?? []).includes(section.id));
  const sectionContracts = contracts.filter((item) => (item.sectionIds ?? []).includes(section.id));

  const parts = [
    section.title,
    section.subtitle,
    section.summary,
    section.group,
    section.category,
    ...(section.usage ?? []).flatMap((item) => [item.title, item.body]),
    ...(section.features ?? []).flatMap((item) => [item.title, item.body]),
    ...(section.notes ?? []).map((item) => item.body),
    ...(section.files ?? []).flatMap((file) => [file.path, file.label, file.description]),
    ...sectionComments.flatMap((item) => [item.type, item.title, item.body, item.file, item.line]),
    ...sectionFlows.flatMap((flow) => [
      flow.title,
      flow.summary,
      ...(flow.steps ?? []).flatMap((step) => [step.label, step.location, step.body, step.file, step.line]),
    ]),
    ...sectionContracts.flatMap((item) => [
      item.kind,
      item.title,
      item.source,
      item.file,
      item.line,
      item.when,
      ...(item.tags ?? []),
      item.snippet,
      item.note,
    ]),
  ];
  const text = normalize(parts.filter(Boolean).join(' '));
  sectionSearchText.set(section.id, text);
  return text;
};

const sectionMatches = (section) => !state.query || getSectionSearchText(section).includes(normalize(state.query));

const getSectionComments = (section) => comments.filter((item) => item.sectionId === section.id);

// 큰 파일은 구간(range)만 실리므로, 그 구간에 실제로 들어 있는 주석만 붙인다.
// 그러지 않으면 이동 버튼은 보이는데 눌러도 아무 데도 가지 않는다.
const getFileComments = (section, file) =>
  getSectionComments(section)
    .filter((item) => item.file === file.path && holdsLine(file, item.line))
    .sort((a, b) => a.line - b.line);

const getSectionFlows = (section) => flows.filter((flow) => (flow.sectionIds ?? []).includes(section.id));
const getSectionContracts = (section) => contracts.filter((item) => (item.sectionIds ?? []).includes(section.id));

// ── 사이드바 ───────────────────────────────────────────

const renderNav = () => {
  const visible = data.sections.filter(sectionMatches);

  if (!visible.length) {
    nav.innerHTML = '<p class="empty">검색 결과가 없습니다.</p>';
    return;
  }

  // 카테고리 → 그룹 → 섹션 3단계. 검색 중에는 전부 펼친다.
  const categories = [];
  const byCategory = new Map();
  visible.forEach((section) => {
    if (!byCategory.has(section.category)) {
      byCategory.set(section.category, new Map());
      categories.push(section.category);
    }
    const groups = byCategory.get(section.category);
    if (!groups.has(section.group)) groups.set(section.group, []);
    groups.get(section.group).push(section);
  });

  // 열린 대분류는 state.openCategory 하나뿐이고, null 은 "사용자가 직접 닫았다"는 뜻이다.
  // 여기서 현재 섹션의 대분류로 되돌리면 같은 머리를 다시 눌러도 곧바로 다시 열린다.
  const openCategory = state.query ? null : state.openCategory;

  nav.innerHTML = categories
    .map((category) => {
      const groups = byCategory.get(category);
      const count = [...groups.values()].reduce((sum, list) => sum + list.length, 0);
      const isOpen = state.query ? true : category === openCategory;
      const showGroupLabels = groups.size > 1;

      const items = [...groups.entries()]
        .map(([group, list]) => {
          const rows = list
            .map(
              (section) => `
                <button type="button" class="nav-item${
                  section.id === state.activeSectionId ? ' active' : ''
                }" data-section="${section.id}" title="${escapeHtml(section.subtitle ?? section.title)}">
                  ${highlight(section.title)}
                </button>`,
            )
            .join('');
          // 사전류처럼 섹션 하나짜리 그룹의 이름이 그 섹션 제목과 같으면 같은 글자가 두 줄로 찍힌다.
          const isEchoLabel = list.length === 1 && list[0].title === group;
          return showGroupLabels && !isEchoLabel
            ? `<p class="nav-group-label">${escapeHtml(group)}</p>${rows}`
            : rows;
        })
        .join('');

      return `
        <div class="nav-category${isOpen ? ' open' : ''}" data-category="${escapeHtml(category)}">
          <button type="button" class="nav-category-head" data-toggle-category="${escapeHtml(category)}">
            <span class="nav-caret">▶</span>
            <span>${highlight(category)}</span>
            <span class="nav-count">${count}</span>
          </button>
          <div class="nav-items">${items}</div>
        </div>`;
    })
    .join('');
};

// 사이드바에서 "지금 보고 있는 곳"을 다시 짚어 준다.
// 대분류를 접어 두거나 다른 대분류를 펼쳐 두면 현재 위치가 화면에서 사라지는데,
// 96개 섹션에서는 그 상태로 한참 읽다가 내가 어디인지 잃기 쉽다.
const revealActiveInNav = () => {
  const category = getCurrentSection()?.category;
  if (!category) return;

  // 검색 중에는 모든 대분류가 이미 펼쳐져 있으므로 접힘 상태를 건드리지 않는다.
  if (!state.query && state.openCategory !== category) {
    state.openCategory = category;
    renderNav();
  }

  // 검색으로 걸러져 현재 섹션이 목록에 없을 수 있다.
  const item = nav.querySelector('.nav-item.active');
  if (!item) return;

  item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  item.classList.remove('ping');
  void item.offsetWidth; // 연달아 눌러도 애니메이션이 다시 시작되도록 리플로우를 강제한다.
  item.classList.add('ping');
};

// ── 통계 ───────────────────────────────────────────────

const renderStats = (section) => {
  const files = section.files ?? [];
  const lines = files.reduce((sum, file) => sum + (file.lineCount || 0), 0);
  const rows = [
    ['파일', files.length],
    ['총 줄 수', lines.toLocaleString('ko-KR')],
    ['리뷰 주석', getSectionComments(section).length],
    ['리뷰 포인트', (section.notes ?? []).length],
  ].filter(([, value]) => value !== 0 && value !== '0');

  sectionStats.innerHTML = rows
    .map(
      ([label, value]) => `
      <dl class="stat">
        <dt>${label}</dt>
        <dd>${value}</dd>
      </dl>`,
    )
    .join('');
};

// ── 다이어그램(생성 스크립트가 만든 인라인 SVG) ────────

const diagramView = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0 };

const applyDiagramTransform = () => {
  const svg = diagramStage.querySelector('svg');
  if (!svg) return;
  svg.style.transform = `translate(${diagramView.x}px, ${diagramView.y}px) scale(${diagramView.scale})`;
  diagramZoomLabel.textContent = `${Math.round(diagramView.scale * 100)}%`;
};

const resetDiagramView = () => {
  diagramView.scale = 1;
  diagramView.x = 0;
  diagramView.y = 0;
  applyDiagramTransform();
};

// svg:false 는 "검색어만 바뀌었다"는 뜻이다. SVG 자체는 검색어와 무관하므로 다시 넣지 않는다.
// 다시 넣으면 21KB 문자열을 파싱할 뿐 아니라 사용자가 맞춰 둔 확대/이동까지 초기화된다.
const renderDiagram = (section, { svg = true } = {}) => {
  if (!section.diagram) {
    diagramPanel.hidden = true;
    diagramStage.innerHTML = '';
    return;
  }
  diagramPanel.hidden = false;
  diagramTitle.textContent = section.diagram.title ?? '구조도';
  diagramCaption.textContent = section.diagram.caption ?? '';
  if (svg) diagramStage.innerHTML = section.diagram.svg;
  diagramLegend.innerHTML = (section.diagram.legend ?? [])
    .map(
      (item) => `
      <article class="usage-card">
        <h4>${prose(item.title)}</h4>
        <p>${prose(item.body)}</p>
      </article>`,
    )
    .join('');
  if (svg) resetDiagramView();
};

// ── 섹션 내 이동 ───────────────────────────────────────

const JUMP_TARGETS = [
  ['diagramPanel', '구조도'],
  ['layoutPanel', '놓인 자리'],
  ['featurePanel', '기능'],
  ['flowPanel', '흐름'],
  ['contractPanel', '계약'],
  ['codePanel', '코드'],
  ['notesPanel', '리뷰 포인트'],
];

const renderJumpTabs = () => {
  const tabs = JUMP_TARGETS.filter(([id]) => {
    const panel = $(id);
    return panel && !panel.hidden;
  });
  sectionJump.innerHTML =
    tabs.length <= 1
      ? ''
      : tabs.map(([id, label]) => `<button type="button" data-jump="${id}">${label}</button>`).join('');
};

// ── 본문 패널 ──────────────────────────────────────────

const renderUsage = (section) => {
  const items = section.usage ?? [];
  layoutPanel.hidden = !items.length;
  layoutUsage.innerHTML = items
    .map(
      (item) => `
      <article class="usage-card">
        <h4>${prose(item.title)}</h4>
        <p>${prose(item.body)}</p>
      </article>`,
    )
    .join('');
};

const renderFeatures = (section) => {
  const items = section.features ?? [];
  featurePanel.hidden = !items.length;
  featureList.innerHTML = items
    .map(
      (item) => `
      <article class="feature-card"${item.id ? ` id="${escapeHtml(item.id)}"` : ''}>
        <h4>${prose(item.title)}</h4>
        <p>${prose(item.body)}</p>
      </article>`,
    )
    .join('');
};

const renderFlows = (section) => {
  const list = getSectionFlows(section);
  flowPanel.hidden = !list.length;
  if (!list.length) {
    flowList.innerHTML = '';
    return;
  }
  flowList.innerHTML = list
    .map(
      (flow) => `
      <article class="flow">
        <h4>${prose(flow.title)}</h4>
        <p>${prose(flow.summary)}</p>
        <div class="flow-steps">
          ${flow.steps
            .map(
              (step) => `
            <button type="button" class="flow-step" data-file="${escapeHtml(step.file)}" data-line="${step.line}">
              <span>
                <span class="flow-step-label">${prose(step.label)}</span>
                <span class="flow-step-loc">${escapeHtml(step.location)}</span>
                <span class="flow-step-body">${prose(step.body)}</span>
              </span>
            </button>`,
            )
            .join('')}
        </div>
      </article>`,
    )
    .join('');
};

const renderContracts = (section) => {
  const list = getSectionContracts(section);
  contractPanel.hidden = !list.length;
  if (!list.length) {
    contractList.innerHTML = '';
    return;
  }
  contractList.innerHTML = list
    .map((item) => {
      const source = item.file
        ? `<button type="button" data-file="${escapeHtml(item.file)}" data-line="${item.line ?? 1}">${escapeHtml(
            item.source,
          )}</button>`
        : escapeHtml(item.source);
      return `
        <article class="contract">
          <div class="contract-head">
            <span class="contract-kind" data-kind="${escapeHtml(item.kind)}">${escapeHtml(item.kind)}</span>
            <h4>${prose(item.title)}</h4>
          </div>
          <p class="contract-src">${source}</p>
          ${item.when ? `<p class="contract-when">${prose(item.when)}</p>` : ''}
          ${
            (item.tags ?? []).length
              ? `<div class="contract-tags">${item.tags
                  .map((tag) => `<span class="contract-tag">${escapeHtml(tag)}</span>`)
                  .join('')}</div>`
              : ''
          }
          ${item.snippet ? `<pre>${escapeHtml(item.snippet)}</pre>` : ''}
          ${item.note ? `<p class="contract-note">${prose(item.note)}</p>` : ''}
        </article>`;
    })
    .join('');
};

const renderNotes = (section) => {
  const items = section.notes ?? [];
  notesPanel.hidden = !items.length;
  reviewNotes.innerHTML = items
    .map(
      (note) => `
      <div class="note" data-type="${escapeHtml(note.type)}">
        <span class="note-label">${escapeHtml(note.label)}</span>
        <p>${prose(note.body)}</p>
      </div>`,
    )
    .join('');
};

// ── 코드 ───────────────────────────────────────────────

// 파일 메타 한 줄. 일부만 실은 구간이면 원본 전체 줄 수와 함께 어디를 잘라 왔는지 밝힌다.
const describeFile = (file) => {
  const offset = file.lineOffset || 0;
  const total = file.totalLines || file.lineCount;
  const scope =
    offset > 0 || file.lineCount < total
      ? `L${offset + 1}–L${offset + file.lineCount} / 전체 ${total.toLocaleString('ko-KR')}줄`
      : `${total.toLocaleString('ko-KR')}줄`;
  return `${file.path} · ${scope}${file.description ? ` · ${file.description}` : ''}`;
};

const renderCode = (file, fileComments, { target = codeBlock, idPrefix = 'line-' } = {}) => {
  if (!file) {
    target.innerHTML = '';
    return;
  }
  const lang = getLang(file.path);
  const byLine = new Map();
  fileComments.forEach((item) => {
    if (!byLine.has(item.line)) byLine.set(item.line, []);
    byLine.get(item.line).push(item);
  });

  const offset = file.lineOffset || 0;
  const lexerState = {};

  target.innerHTML = file.code
    .split('\n')
    .map((line, index) => {
      const lineNo = index + 1 + offset;
      const notes = (byLine.get(lineNo) ?? [])
        .map(
          (note) => `
        <div class="code-note">
          <div class="code-note-head">
            <span class="code-note-type">${escapeHtml(note.type)}</span>
            <span class="code-note-title">${escapeHtml(note.title)}</span>
          </div>
          <p class="code-note-body">${escapeHtml(note.body)}</p>
        </div>`,
        )
        .join('');
      return `
      <div class="code-line" id="${idPrefix}${lineNo}">
        <span class="code-no">${lineNo}</span>
        <span class="code-text">${highlightCode(line, lang, lexerState)}</span>
        ${notes}
      </div>`;
    })
    .join('');
};

const renderFiles = (section) => {
  const files = section.files ?? [];
  codePanel.hidden = !files.length;
  if (!files.length) {
    fileTabs.innerHTML = '';
    codeBlock.innerHTML = '';
    codeMeta.textContent = '';
    codeCommentNav.innerHTML = '';
    return;
  }

  const index = Math.min(state.activeFileIndex, files.length - 1);
  const file = files[index];
  const fileComments = getFileComments(section, file);

  fileTabs.innerHTML = files
    .map(
      (item, i) => `
      <button type="button" role="tab" class="file-tab${i === index ? ' active' : ''}" data-file-index="${i}"
        title="${escapeHtml(item.path)}">${escapeHtml(item.label)}</button>`,
    )
    .join('');

  codeMeta.textContent = describeFile(file);
  renderCode(file, fileComments);

  codeCommentNav.innerHTML = fileComments
    .filter((item) => item.line > 1)
    .map((item) => `<button type="button" data-goto-line="${item.line}">L${item.line} ${escapeHtml(item.type)}</button>`)
    .join('');
};

// ── 코드 모달(다른 섹션의 파일로 점프할 때) ────────────

const openCodeModal = (filePath, lineNo) => {
  const found = findFileEntry(filePath, lineNo, state.activeSectionId);
  if (!found) {
    window.alert(`이 리뷰 데이터에는 ${filePath} 코드가 포함되어 있지 않습니다.`);
    return;
  }
  const { section, file } = found;
  state.lastFocused = document.activeElement;
  state.modalFile = file;

  codeModalTitle.textContent = file.label;
  codeModalMeta.textContent = `${describeFile(file)} · ${section.title}`;
  renderCode(file, getFileComments(section, file), { target: codeModalBlock, idPrefix: 'modal-line-' });

  codeModal.classList.add('open');
  document.body.style.overflow = 'hidden';

  const target = codeModalBlock.querySelector(`#modal-line-${lineNo}`);
  if (target) {
    target.scrollIntoView({ block: 'center' });
    target.classList.add('flash');
  }
};

const closeCodeModal = () => {
  codeModal.classList.remove('open');
  document.body.style.overflow = '';
  codeModalBlock.innerHTML = '';
  state.modalFile = null;
  if (state.lastFocused instanceof HTMLElement) state.lastFocused.focus();
};

// ── 복사 ───────────────────────────────────────────────

const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    /* 아래 폴백으로 계속 */
  }
  // file:// 로 열면 클립보드 API가 막히는 브라우저가 있어 execCommand 폴백을 남긴다.
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (error) {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
};

const flashCopyResult = (button, ok) => {
  button.classList.toggle('ok', ok);
  button.classList.toggle('fail', !ok);
  button.textContent = ok ? '복사됨' : '복사 실패';
  window.setTimeout(() => {
    button.classList.remove('ok', 'fail');
    button.textContent = button.dataset.label;
  }, 1600);
};

// ── 섹션 렌더 ──────────────────────────────────────────

// 사용자가 고른 섹션은 히스토리에 쌓아 뒤로가기로 돌아올 수 있게 한다.
// 첫 진입과 검색 중 갱신은 쌓지 않는다(검색은 섹션을 바꾸지 않으므로 대개 여기서 바로 빠진다).
const syncHash = (id, { push = false } = {}) => {
  if (window.location.hash.slice(1) === id) return;
  if (push) window.history.pushState(null, '', `#${id}`);
  else window.history.replaceState(null, '', `#${id}`);
};

// code:false 는 "검색어만 바뀌었다"는 뜻이다. 파일 탭·메타·코드 본문은 검색어를 전혀 쓰지 않는데
// (구문 강조는 highlightCode, 주석은 escapeHtml) 섹션에서 가장 비싼 렌더라, 글자 하나 칠 때마다
// 4,000줄을 다시 그리면 입력이 눈에 띄게 밀린다.
const renderSection = ({ code = true, pushHash = false } = {}) => {
  const section = getCurrentSection();
  if (!section) return;
  state.activeSectionId = section.id;
  state.seenTerms.clear();

  sectionEyebrow.textContent = `${section.category} · ${section.group}`;
  sectionTitle.innerHTML = prose(section.title);
  sectionSummary.innerHTML = prose(section.summary);
  featureTitle.textContent =
    section.id === 'glossary'
      ? '용어 풀이'
      : section.id === 'code-words'
        ? '코드 낱말 풀이'
        : section.id === 'code-symbols'
          ? '코드 기호·기본 기능 풀이'
          : section.id === 'code-patterns'
            ? '코드 메서드·실행 패턴 풀이'
            : section.id === 'project-functions'
              ? '프로젝트 함수 풀이'
              : '기능별 코드 설명';

  renderStats(section);
  renderDiagram(section, { svg: code });
  renderUsage(section);
  renderFeatures(section);
  renderFlows(section);
  renderContracts(section);
  if (code) renderFiles(section);
  renderNotes(section);
  renderJumpTabs();
  renderNav();
  syncHash(section.id, { push: pushHash });
};

const selectSection = (id, { resetFile = true, push = true } = {}) => {
  if (!data.sections.some((section) => section.id === id)) return;
  state.activeSectionId = id;
  if (resetFile) state.activeFileIndex = 0;
  state.openCategory = data.sections.find((section) => section.id === id)?.category ?? state.openCategory;
  renderSection({ pushHash: push });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── 이벤트 ─────────────────────────────────────────────

nav.addEventListener('click', (event) => {
  const categoryButton = event.target.closest('[data-toggle-category]');
  if (categoryButton) {
    const category = categoryButton.dataset.toggleCategory;
    state.openCategory = state.openCategory === category ? null : category;
    renderNav();
    return;
  }
  const item = event.target.closest('[data-section]');
  if (!item) return;
  selectSection(item.dataset.section);
  if (window.matchMedia('(max-width: 960px)').matches) closeNav();
});

// 본문 아무 곳이나 누르면 사이드바가 현재 섹션을 다시 펼쳐 짚어 준다.
// 끈 동작(글자 고르기, 다이어그램 이동)도 mouseup 뒤에 click 이 오므로,
// 누른 자리에서 얼마나 움직였는지를 보고 "누른 것"과 "끈 것"을 가른다.
let contentPressAt = null;
content.addEventListener('mousedown', (event) => {
  contentPressAt = { x: event.clientX, y: event.clientY };
});

content.addEventListener('click', (event) => {
  const pressed = contentPressAt;
  contentPressAt = null;

  // 용어 링크는 사전으로 이동하는 것이 목적이라 여기서 사이드바까지 건드리지 않는다.
  if (event.target.closest('.term')) return;
  // 좁은 화면에서는 사이드바가 본문을 덮는 서랍이라 열지 않는다.
  if (window.matchMedia('(max-width: 960px)').matches) return;
  if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 4) return;
  // 더블클릭으로 낱말을 고른 경우처럼 움직임 없이 선택이 생기는 경우도 있다.
  if (String(window.getSelection?.() ?? '').trim()) return;

  revealActiveInNav();
});

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  renderSection({ code: false });
});

fileTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-file-index]');
  if (!tab) return;
  state.activeFileIndex = Number(tab.dataset.fileIndex);
  renderFiles(getCurrentSection());
});

codeCommentNav.addEventListener('click', (event) => {
  const button = event.target.closest('[data-goto-line]');
  if (!button) return;
  const target = codeBlock.querySelector(`#line-${button.dataset.gotoLine}`);
  if (!target) return;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.classList.remove('flash');
  void target.offsetWidth;
  target.classList.add('flash');
});

const handleJumpToCode = (event) => {
  const button = event.target.closest('[data-file]');
  if (!button) return;
  openCodeModal(button.dataset.file, Number(button.dataset.line || 1));
};

flowList.addEventListener('click', handleJumpToCode);
contractList.addEventListener('click', handleJumpToCode);

sectionJump.addEventListener('click', (event) => {
  const button = event.target.closest('[data-jump]');
  if (!button) return;
  $(button.dataset.jump)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

codeCopy.addEventListener('click', async () => {
  const section = getCurrentSection();
  const file = section.files[Math.min(state.activeFileIndex, section.files.length - 1)];
  if (!file) return;
  flashCopyResult(codeCopy, await copyText(file.code));
});

codeModalCopy.addEventListener('click', async () => {
  if (!state.modalFile) return;
  flashCopyResult(codeModalCopy, await copyText(state.modalFile.code));
});

codeModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-modal-close]')) closeCodeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && codeModal.classList.contains('open')) {
    closeCodeModal();
    return;
  }
  if (event.key === 'Escape') {
    hideTermTip();
    hideCodeWordTip();
  }
  // 앱 본체와 같은 감각으로 Ctrl+K 를 검색에 준다.
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// 다이어그램 확대/이동
diagramZoomControl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-zoom]');
  if (!button) return;
  const mode = button.dataset.zoom;
  if (mode === 'reset') {
    resetDiagramView();
    return;
  }
  const factor = mode === 'in' ? 1.2 : 1 / 1.2;
  diagramView.scale = Math.min(4, Math.max(0.3, diagramView.scale * factor));
  applyDiagramTransform();
});

diagramStage.addEventListener(
  'wheel',
  (event) => {
    if (!diagramStage.querySelector('svg')) return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    diagramView.scale = Math.min(4, Math.max(0.3, diagramView.scale * factor));
    applyDiagramTransform();
  },
  { passive: false },
);

diagramStage.addEventListener('mousedown', (event) => {
  if (!diagramStage.querySelector('svg')) return;
  diagramView.dragging = true;
  diagramView.startX = event.clientX - diagramView.x;
  diagramView.startY = event.clientY - diagramView.y;
  diagramStage.classList.add('dragging');
});

window.addEventListener('mousemove', (event) => {
  if (!diagramView.dragging) return;
  diagramView.x = event.clientX - diagramView.startX;
  diagramView.y = event.clientY - diagramView.startY;
  applyDiagramTransform();
});

window.addEventListener('mouseup', () => {
  diagramView.dragging = false;
  diagramStage.classList.remove('dragging');
});

// ── 용어 툴팁 ──────────────────────────────────────────
// 읽던 자리를 잃지 않고 뜻만 확인하는 것이 목적이라, 뜻풀이 첫 문장만 보여 주고
// 더 볼 사람은 눌러서 사전으로 가게 한다. 키보드 포커스에서도 똑같이 뜬다.

const glossaryTip = $('glossaryTip');
const codeWordTip = $('codeWordTip');

const hideTermTip = () => {
  glossaryTip.hidden = true;
  glossaryTip.classList.remove('show');
};

const hideCodeWordTip = () => {
  codeWordTip.hidden = true;
  codeWordTip.classList.remove('show');
};

const placeTip = (tip, anchor) => {
  const rect = anchor.getBoundingClientRect();
  const bounds = tip.getBoundingClientRect();
  const left = Math.min(Math.max(10, rect.left), window.innerWidth - bounds.width - 10);
  const below = rect.bottom + 9;
  const top = below + bounds.height > window.innerHeight - 10 ? rect.top - bounds.height - 9 : below;
  tip.style.left = `${left}px`;
  tip.style.top = `${Math.max(10, top)}px`;
  tip.classList.add('show');
};

const showTermTip = (anchor) => {
  const item = termById.get(anchor.dataset.term);
  if (!item) return;

  glossaryTip.innerHTML =
    `<strong>${escapeHtml(item.term)}</strong>${item.en ? `<span>${escapeHtml(item.en)}</span>` : ''}` +
    `<p>${escapeHtml(item.short)}</p><em>눌러서 사전에서 보기</em>`;
  glossaryTip.hidden = false;
  placeTip(glossaryTip, anchor);
};

content.addEventListener('mouseover', (event) => {
  const anchor = event.target.closest('.term');
  if (anchor) showTermTip(anchor);
});

content.addEventListener('mouseout', (event) => {
  if (event.target.closest('.term')) hideTermTip();
});

content.addEventListener('focusin', (event) => {
  const anchor = event.target.closest('.term');
  if (anchor) showTermTip(anchor);
});

content.addEventListener('focusout', (event) => {
  if (event.target.closest('.term')) hideTermTip();
});

// 용어를 누르면 사전으로 가서 그 항목을 짚어 준다.
content.addEventListener('click', (event) => {
  const anchor = event.target.closest('.term');
  if (!anchor) return;
  event.preventDefault();
  hideTermTip();
  const id = anchor.dataset.term;
  selectSection('glossary');
  // selectSection 이 동기로 렌더를 끝내므로 카드는 이미 있다. requestAnimationFrame 을 끼우면
  // 탭이 뒤에 있거나 화면을 그리지 않는 상태에서 콜백이 늦거나 오지 않아 이동이 조용히 실패한다.
  const card = $(id);
  if (!card) return;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
});

window.addEventListener('scroll', hideTermTip, { passive: true });

// ── 코드 낱말·기호·기본 기능 툴팁 · 사전 이동 ─────────

const showCodeReferenceTip = (anchor) => {
  const item = codeEntryById.get(anchor.dataset.codeEntry);
  if (!item) return;
  const destination =
    item.sectionId === 'code-words'
      ? '코드 낱말 사전'
      : item.sectionId === 'code-symbols'
        ? '코드 기호·기본 기능 사전'
        : item.sectionId === 'code-patterns'
          ? '코드 메서드·실행 패턴 사전'
          : '프로젝트 API 사전';
  codeWordTip.innerHTML =
    `<strong>${escapeHtml(item.name)} — ${escapeHtml(item.label)}</strong>` +
    `<span>${escapeHtml(item.languageLabel)} · ${escapeHtml(item.kind)}</span>` +
    `<p>${escapeHtml(item.short)}</p><em>눌러서 ${destination}에서 보기</em>`;
  codeWordTip.hidden = false;
  placeTip(codeWordTip, anchor);
};

const openCodeReference = (anchor) => {
  const id = anchor.dataset.codeEntry;
  const item = codeEntryById.get(id);
  if (!item) return;
  hideCodeWordTip();
  hideTermTip();
  if (codeModal.classList.contains('open')) closeCodeModal();
  selectSection(item.sectionId);
  const card = $(id);
  if (!card) return;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
};

[codeBlock, codeModalBlock].forEach((box) => {
  box.addEventListener('mouseover', (event) => {
    const anchor = event.target.closest('.code-reference');
    if (anchor) showCodeReferenceTip(anchor);
  });
  box.addEventListener('mouseout', (event) => {
    if (event.target.closest('.code-reference')) hideCodeWordTip();
  });
  box.addEventListener('click', (event) => {
    const anchor = event.target.closest('.code-reference');
    if (!anchor) return;
    event.preventDefault();
    event.stopPropagation();
    openCodeReference(anchor);
  });
  box.addEventListener('scroll', hideCodeWordTip, { passive: true });
});

window.addEventListener('scroll', hideCodeWordTip, { passive: true });

// 테마
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('mn-review-theme', next);
  syncThemeIcon();
});

const syncThemeIcon = () => {
  themeToggle.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾';
};

// 모바일 서랍
const openNav = () => {
  sidebar.classList.add('open');
  navBackdrop.hidden = false;
};
const closeNav = () => {
  sidebar.classList.remove('open');
  navBackdrop.hidden = true;
};
navToggle.addEventListener('click', () => (sidebar.classList.contains('open') ? closeNav() : openNav()));
navBackdrop.addEventListener('click', closeNav);

// 사이드바 너비
let resizing = false;
resizer.addEventListener('mousedown', () => {
  resizing = true;
  resizer.classList.add('dragging');
  document.body.style.userSelect = 'none';
});
window.addEventListener('mousemove', (event) => {
  if (!resizing) return;
  const width = Math.min(560, Math.max(220, event.clientX));
  document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
});
window.addEventListener('mouseup', () => {
  if (!resizing) return;
  resizing = false;
  resizer.classList.remove('dragging');
  document.body.style.userSelect = '';
  localStorage.setItem('mn-review-sidebar', document.documentElement.style.getPropertyValue('--sidebar-width'));
});
resizer.addEventListener('dblclick', () => {
  document.documentElement.style.removeProperty('--sidebar-width');
  localStorage.removeItem('mn-review-sidebar');
});

window.addEventListener('hashchange', () => {
  // 뒤로/앞으로가 부른 것이므로 주소는 이미 바뀌어 있다. 여기서 또 쌓으면 안 된다.
  const id = window.location.hash.slice(1);
  if (id && id !== state.activeSectionId) selectSection(id, { push: false });
});

// ── 시작 ───────────────────────────────────────────────

const savedWidth = localStorage.getItem('mn-review-sidebar');
if (savedWidth) document.documentElement.style.setProperty('--sidebar-width', savedWidth);

syncThemeIcon();
state.activeSectionId = window.location.hash.slice(1) || data.sections[0].id;
if (!data.sections.some((section) => section.id === state.activeSectionId)) {
  state.activeSectionId = data.sections[0].id;
}
state.openCategory = data.sections.find((section) => section.id === state.activeSectionId)?.category ?? null;
renderSection();
