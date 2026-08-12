import { readFile } from 'node:fs/promises';
import path from 'node:path';

const LANGUAGE_BY_EXTENSION = new Map([
  ['.js', 'js'],
  ['.mjs', 'js'],
  ['.cjs', 'js'],
  ['.cs', 'cs'],
  ['.py', 'py'],
  ['.pyw', 'py'],
]);

const LANGUAGE_LABEL = { js: 'JavaScript', cs: 'C#', py: 'Python' };
const CONTROL_WORDS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'catch',
  'with',
  'function',
  'constructor',
  'get',
  'set',
]);

// 프로젝트 선언처럼 보이기 쉬운 테스트 DSL·모듈 로더·플랫폼 API입니다. 표준 사전에 이미
// 들어간 이름과 더불어 여기서 한 번 더 제외해 프로젝트 함수 링크의 오탐을 줄입니다.
const NON_PROJECT_NAMES = new Set([
  'test',
  'it',
  'describe',
  'expect',
  'before',
  'after',
  'beforeEach',
  'afterEach',
  'require',
  'define',
  'importScripts',
  'setUp',
  'tearDown',
  'Main',
  // 짧고 일반적인 콜백·로컬 메서드 및 브라우저/.NET/Python 표준 API. 프로젝트 안에도 같은
  // 이름의 래퍼가 있지만 소유 객체를 모르는 구문 하이라이터에서는 안전하게 구분할 수 없습니다.
  'add',
  'append',
  'apply',
  'attach',
  'abort',
  'cancel',
  'capture',
  'cell',
  'clear',
  'close',
  'code',
  'collect',
  'commit',
  'create',
  'createWritable',
  'current',
  'destroy',
  'done',
  'draw',
  'emit',
  'error',
  'execute',
  'fail',
  'fill',
  'finish',
  'flush',
  'getBoundingClientRect',
  'getFile',
  'getItem',
  'getState',
  'getValue',
  'log',
  'line',
  'main',
  'max',
  'min',
  'moveTo',
  'now',
  'open',
  'parse',
  'put',
  'postMessage',
  'read',
  'redraw',
  'refresh',
  'removeItem',
  'rename',
  'render',
  'reset',
  'row',
  'resolve',
  'restore',
  'run',
  'save',
  'select',
  'setColor',
  'setItem',
  'setValue',
  'setWidth',
  'show',
  'start',
  'step',
  'stroke',
  'strokeRect',
  'task',
  'terminate',
  'toggle',
  'undo',
  'warn',
  'write',
]);

const categoryForPath = (filePath) => {
  const value = filePath.replaceAll('\\', '/').toLowerCase();
  if (value.startsWith('desktop/') || value.endsWith('.cs')) return 'EXE·로컬 서버';
  if (value.startsWith('tests/') || /(?:^|\/)test(?:s)?\//.test(value)) return '테스트';
  if (value.startsWith('tools/') || value.startsWith('scripts/')) return '빌드·도구';
  if (value.endsWith('.py') || value.endsWith('.pyw') || /python|notebook|pyodide/.test(value)) {
    return 'Python·노트북';
  }
  if (/document|spreadsheet|excel|word|pdf|ppt|odt|hwp|viewer/.test(value)) return '문서·편집';
  if (/editor|monaco|codemirror/.test(value)) return '편집기';
  if (/javascript|js-runtime|js-librar/.test(value)) return 'JavaScript 실행';
  if (/learning|whiteboard|quiz|flashcard|mindmap|chart|media|image/.test(value)) return '학습 도구';
  return '앱 코어';
};

const QUOTAS = new Map([
  ['앱 코어', 25],
  ['문서·편집', 30],
  ['Python·노트북', 20],
  ['JavaScript 실행', 15],
  ['편집기', 15],
  ['학습 도구', 15],
  ['EXE·로컬 서버', 15],
  ['빌드·도구', 10],
  ['테스트', 5],
]);

const actionForName = (name) => {
  const rules = [
    [/^(?:get|read|find|lookup|resolve|detect|measure|collect)/i, '조회·수집'],
    [/^(?:set|write|save|store|persist|cache)/i, '설정·저장'],
    [/^(?:render|draw|paint|display|show)/i, '화면 표시'],
    [/^(?:hide|close|dismiss|collapse)/i, '닫기·숨기기'],
    [/^(?:open|launch|start|activate|focus)/i, '열기·시작'],
    [/^(?:create|make|build|generate|compose|assemble)/i, '생성·구성'],
    [/^(?:load|fetch|request|download|import)/i, '불러오기'],
    [/^(?:export|upload|send|emit|post)/i, '내보내기'],
    [/^(?:parse|decode|deserialize|extract)/i, '해석·추출'],
    [/^(?:format|encode|serialize|normalize|convert|transform)/i, '변환·정규화'],
    [/^(?:update|refresh|sync|rebuild|recompute)/i, '갱신·동기화'],
    [/^(?:add|append|insert|register|attach|bind)/i, '추가·연결'],
    [/^(?:remove|delete|clear|reset|dispose|destroy|unregister)/i, '삭제·정리'],
    [/^(?:handle|on[A-Z_]|process|dispatch|route)/, '이벤트·요청 처리'],
    [/^(?:is|has|can|should|validate|verify|check|assert)/i, '상태·유효성 판별'],
    [/^(?:ensure|guard|require)/i, '조건 보장'],
    [/^(?:apply|merge|patch|replace)/i, '적용·병합'],
    [/^(?:run|execute|eval|compile)/i, '실행'],
    [/^(?:init|initialize|setup|bootstrap)/i, '초기화'],
    [/^(?:toggle|switch|select|choose)/i, '선택·전환'],
  ];
  return rules.find(([pattern]) => pattern.test(name))?.[1] ?? '프로젝트 처리';
};

// 문자열과 주석을 공백으로 바꾸되 줄바꿈은 보존합니다. 완전한 파서는 아니지만 함수 선언과
// 호출을 셀 때 설명 문자열·주석의 예제가 끼어드는 문제는 막을 수 있습니다.
const maskSource = (source, language) => {
  let output = '';
  let i = 0;
  let quote = null;
  let blockComment = false;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1] ?? '';
    const triple = source.slice(i, i + 3);

    if (ch === '\n' || ch === '\r') {
      output += ch;
      i += 1;
      if (quote && quote.length === 1 && quote !== '`') quote = null;
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        output += '  ';
        i += 2;
        blockComment = false;
      } else {
        output += ' ';
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (ch === '\\') {
        output += '  ';
        i += Math.min(2, source.length - i);
      } else if (source.startsWith(quote, i)) {
        output += ' '.repeat(quote.length);
        i += quote.length;
        quote = null;
      } else {
        output += ' ';
        i += 1;
      }
      continue;
    }
    if ((language === 'js' || language === 'cs') && ch === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      const stop = end < 0 ? source.length : end;
      output += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if ((language === 'js' || language === 'cs') && ch === '/' && next === '*') {
      output += '  ';
      i += 2;
      blockComment = true;
      continue;
    }
    if (language === 'py' && ch === '#') {
      const end = source.indexOf('\n', i);
      const stop = end < 0 ? source.length : end;
      output += ' '.repeat(stop - i);
      i = stop;
      continue;
    }
    if (language === 'py' && (triple === "'''" || triple === '\"\"\"')) {
      quote = triple;
      output += '   ';
      i += 3;
      continue;
    }
    if (ch === "'" || ch === '"' || (language === 'js' && ch === '`')) {
      quote = ch;
      output += ' ';
      i += 1;
      continue;
    }
    output += ch;
    i += 1;
  }
  return output;
};

const lineNumberAt = (lineStarts, index) => {
  let low = 0;
  let high = lineStarts.length;
  while (low + 1 < high) {
    const middle = (low + high) >> 1;
    if (lineStarts[middle] <= index) low = middle;
    else high = middle;
  }
  return low + 1;
};

const declarationMatches = (source, language) => {
  const patterns =
    language === 'js'
      ? [
          /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
          /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\b\s*(?:[A-Za-z_$][\w$]*)?\s*\(/g,
          /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^;{}]*?\)|[A-Za-z_$][\w$]*)\s*=>/g,
          /^\s*(?:static\s+)?(?:async\s+)?(?:get\s+|set\s+)?([A-Za-z_$][\w$]*)\s*\([^;{}]*?\)\s*\{/gm,
          /^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function\b\s*\([^;{}]*?\)|(?:\([^;{}]*?\)|[A-Za-z_$][\w$]*)\s*=>)/gm,
        ]
      : language === 'py'
        ? [/^\s*(?:async\s+)?def\s+([A-Za-z_][\w]*)\s*\(/gm]
        : [
            /^\s*(?:(?:public|private|protected|internal|static|async|virtual|override|sealed|extern|unsafe|new|partial)\s+)*(?:[A-Za-z_][\w.<>,?\[\]]*\s+)+([A-Za-z_][\w]*)\s*\([^;{}]*?\)\s*(?:\{|=>)/gm,
          ];

  const found = [];
  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      if (!CONTROL_WORDS.has(match[1])) found.push({ name: match[1], index: match.index });
    }
  });
  return found;
};

const stableId = (language, name) => {
  const slug = name.replace(/[^A-Za-z0-9_-]/g, '-').toLowerCase();
  let hash = 2166136261;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `pf-${language}-${slug}-${(hash >>> 0).toString(36)}`;
};

export const collectProjectFunctions = async ({ rootDir, sections, standardNames, limit = 150 }) => {
  const fileDescriptions = new Map();
  sections.forEach((section) => {
    (section.files ?? []).forEach((file) => {
      if (!fileDescriptions.has(file.path)) fileDescriptions.set(file.path, file.description ?? file.label ?? '');
    });
  });

  const sourceFiles = [];
  await Promise.all(
    [...fileDescriptions.keys()].map(async (filePath) => {
      const language = LANGUAGE_BY_EXTENSION.get(path.extname(filePath).toLowerCase());
      if (!language) return;
      try {
        const source = await readFile(path.join(rootDir, filePath), 'utf8');
        sourceFiles.push({ path: filePath.replaceAll('\\', '/'), language, source, masked: maskSource(source, language) });
      } catch {
        // 본문 주입 단계에서 읽기 실패를 별도로 보고하므로 여기서는 사전 후보에서만 제외합니다.
      }
    }),
  );
  sourceFiles.sort((a, b) => a.path.localeCompare(b.path));

  const declarations = new Map();
  const calls = new Map();
  sourceFiles.forEach((file) => {
    const lineStarts = [0];
    for (let index = file.masked.indexOf('\n'); index >= 0; index = file.masked.indexOf('\n', index + 1)) {
      lineStarts.push(index + 1);
    }
    declarationMatches(file.masked, file.language).forEach(({ name, index }) => {
      const key = `${file.language}:${name}`;
      if (!declarations.has(key)) declarations.set(key, []);
      const list = declarations.get(key);
      const definition = { path: file.path, line: lineNumberAt(lineStarts, index) };
      if (!list.some((item) => item.path === definition.path && item.line === definition.line)) list.push(definition);
    });

    const seenInFile = new Set();
    for (const match of file.masked.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
      const key = `${file.language}:${match[1]}`;
      const stat = calls.get(key) ?? { count: 0, files: new Set() };
      stat.count += 1;
      stat.files.add(file.path);
      calls.set(key, stat);
      seenInFile.add(key);
    }
  });

  const excluded = new Set([...standardNames, ...NON_PROJECT_NAMES]);
  const candidates = [...declarations.entries()]
    .map(([key, definitions]) => {
      const separator = key.indexOf(':');
      const language = key.slice(0, separator);
      const name = key.slice(separator + 1);
      const stat = calls.get(key) ?? { count: definitions.length, files: new Set(definitions.map((item) => item.path)) };
      const primary = definitions.find((item) => !/^(?:tests?|tools|scripts)\//i.test(item.path)) ?? definitions[0];
      const category = categoryForPath(primary.path);
      const production = !['빌드·도구', '테스트'].includes(category);
      const productionDefinitions = definitions.filter(
        (definition) => !/^(?:tests?|tools|scripts)\//i.test(definition.path),
      );
      const score =
        stat.files.size * 1000 +
        Math.min(stat.count, 500) * 8 +
        (production ? 500 : 0) +
        (primary.path.startsWith('src/js/') ? 350 : 0) +
        (/^(?:MN|mn)[A-Z_]/.test(name) ? 250 : 0);
      return {
        key,
        language,
        name,
        definitions,
        primary,
        category,
        calls: stat.count,
        usedFiles: stat.files.size,
        score,
        productionDefinitionCount: productionDefinitions.length,
      };
    })
    .filter(
      (item) =>
        item.name.length >= 3 &&
        !excluded.has(item.name) &&
        !item.name.startsWith('_') &&
        item.productionDefinitionCount <= 1 &&
        (item.productionDefinitionCount > 0 || item.definitions.length === 1) &&
        item.calls >= 2,
    )
    .sort((a, b) => b.score - a.score || b.calls - a.calls || a.name.localeCompare(b.name));

  const selected = [];
  const selectedKeys = new Set();
  QUOTAS.forEach((quota, category) => {
    candidates
      .filter((item) => item.category === category)
      .slice(0, quota)
      .forEach((item) => {
        selected.push(item);
        selectedKeys.add(item.key);
      });
  });
  candidates.forEach((item) => {
    if (selected.length >= limit || selectedKeys.has(item.key)) return;
    selected.push(item);
    selectedKeys.add(item.key);
  });

  return selected
    .slice(0, limit)
    .sort((a, b) => a.category.localeCompare(b.category, 'ko') || b.score - a.score || a.name.localeCompare(b.name))
    .map((item, order) => {
      const definitionText = item.definitions
        .slice(0, 3)
        .map((definition) => `${definition.path}:${definition.line}`)
        .join(', ');
      const extraDefinitions = Math.max(0, item.definitions.length - 3);
      const location = `${definitionText}${extraDefinitions ? ` 외 ${extraDefinitions}곳` : ''}`;
      const description = fileDescriptions.get(item.primary.path) ?? '';
      const short = `${item.primary.path}:${item.primary.line}에서 정의되며, 코드에서 호출 형태 ${item.calls}회·사용 파일 ${item.usedFiles}개가 확인됩니다.`;
      return {
        id: stableId(item.language, item.name),
        name: item.name,
        languages: [item.language],
        languageLabel: LANGUAGE_LABEL[item.language],
        kind: item.category,
        label: actionForName(item.name),
        short,
        body:
          `${short} 정의 위치: ${location}.` +
          (description ? ` 대표 파일 역할: ${description}` : ''),
        type: 'project-function',
        definitions: item.definitions,
        callCount: item.calls,
        usedFileCount: item.usedFiles,
        order,
      };
    });
};

export const buildProjectFunctionSection = ({ helpers, entries }) => {
  const { sec } = helpers;
  const categories = [...QUOTAS.keys()];
  const byCategory = (category) => entries.filter((item) => item.kind === category);
  return [
    sec({
      id: 'project-functions',
      category: '개요',
      group: '프로젝트 API 사전',
      title: '프로젝트 API 사전',
      subtitle: `공유·반복 호출 함수 ${entries.length}개`,
      summary:
        `프로젝트에서 직접 선언한 함수 가운데 여러 파일에서 공유되거나 반복 호출되는 상위 ${entries.length}개를 추렸습니다. ` +
        '표준 API·외부 라이브러리·테스트 DSL과 이름이 겹치는 항목은 제외했으며, 코드에서 함수 호출 형태일 때만 사전으로 연결합니다.',
      usage: categories
        .map((category) => ({
          title: `${category} (${byCategory(category).length}개)`,
          body: byCategory(category).map((item) => item.name).join(', '),
        }))
        .filter((item) => !item.title.endsWith('(0개)')),
      features: entries.map((item) => ({
        id: item.id,
        title: `\`${item.name}\` — ${item.label}`,
        body: `${item.languageLabel} · ${item.kind} · ${item.body}`,
      })),
      files: [],
      notes: [
        {
          type: 'info',
          label: '선정 기준',
          body: '실제 함수 선언을 출발점으로 호출 횟수와 사용 파일 수를 계산하고, 기능 영역별 최소 몫을 둔 뒤 상위 150개를 선택합니다. 소스가 바뀌면 생성 스크립트를 실행할 때 목록도 다시 계산됩니다.',
        },
        {
          type: 'info',
          label: '연결 기준',
          body: '같은 이름의 변수까지 밑줄을 긋지 않도록 괄호가 뒤따르는 함수 호출·메서드 호출에서만 연결합니다. 표준 사전에 있는 이름은 프로젝트 함수 후보에서 제외합니다.',
        },
      ],
    }),
  ];
};
