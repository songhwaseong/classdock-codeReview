// 만능파일교실 코드리뷰 데이터 생성기.
//
//   node code-review/generate-review-data.mjs
//
// 소스 루트는 기본이 이 폴더의 부모다. 리뷰 폴더를 레포 밖으로 옮겨서 쓸 때는
// MN_ROOT 환경 변수로 실제 소스 위치를 넘긴다.
//
//   MN_ROOT=D:/my/myOffice node generate-review-data.mjs
//
// 출력은 review-data.generated.js 한 개이며 직접 수정하지 않는다. 사람이 쓰는
// 리뷰 문장은 sections/*.mjs 에, 줄 앵커 주석은 review-comments.js 에 둔다.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHelpers } from './lib/section.mjs';
import {
  buildLayerDiagram,
  buildDependencyDiagram,
  buildBoundaryDiagram,
  buildRuntimeDiagram,
  buildPipelineDiagram,
} from './lib/diagram.mjs';

import buildOverview from './sections/00-overview.mjs';
import buildGlossary, { GLOSSARY_TERMS } from './sections/05-glossary.mjs';
import buildCodeWords, { CODE_WORDS } from './sections/06-code-words.mjs';
import buildCodeReferences, { CODE_REFERENCES } from './sections/07-code-symbols.mjs';
import buildCodePatterns, { CODE_PATTERNS } from './sections/08-code-patterns.mjs';
import { buildProjectFunctionSection, collectProjectFunctions } from './lib/project-functions.mjs';
import buildBootstrap from './sections/10-bootstrap.mjs';
import buildDocuments from './sections/20-documents.mjs';
import buildPython from './sections/30-python.mjs';
import buildJavaScript from './sections/35-javascript.mjs';
import buildEditors from './sections/40-editors.mjs';
import buildLearning from './sections/50-learning.mjs';
import buildDesktop from './sections/60-desktop.mjs';
import buildTools from './sections/70-build-tools.mjs';
import buildTests from './sections/80-tests.mjs';

const reviewDir = path.dirname(fileURLToPath(import.meta.url));

// 소스 루트 찾기: MN_ROOT → 부모 폴더 → 형제 폴더 myOffice 순서로 본다.
// 리뷰 폴더를 레포 밖으로 옮겨 두는 경우가 흔하므로 형제 폴더까지 자동으로 확인한다.
const rootCandidates = process.env.MN_ROOT
  ? [path.resolve(process.env.MN_ROOT)]
  : [path.resolve(reviewDir, '..'), path.resolve(reviewDir, '..', 'myOffice')];

let rootDir = null;
let manifestRaw = null;
for (const candidate of rootCandidates) {
  try {
    manifestRaw = await readFile(path.join(candidate, 'scripts.manifest.json'), 'utf8');
    rootDir = candidate;
    break;
  } catch {
    /* 다음 후보로 */
  }
}

if (!rootDir) {
  console.error('만능파일교실 소스 루트를 찾지 못했습니다(scripts.manifest.json 없음).');
  console.error(`확인한 위치:\n  ${rootCandidates.join('\n  ')}`);
  console.error('\n소스 위치를 직접 지정하세요:');
  console.error('  MN_ROOT=D:/my/myOffice node generate-review-data.mjs        (bash)');
  console.error('  $env:MN_ROOT="D:\\my\\myOffice"; node generate-review-data.mjs  (PowerShell)');
  process.exit(1);
}

// 큰 파일도 가급적 통째로 싣는다. 5,900줄짜리 spreadsheet-viewer.js 하나만 잘린다.
//
// 상한을 소스의 최대 파일 크기에 딱 맞추지 않고 여유를 둔다. 파일이 자라 상한을 넘으면
// 리뷰에서 꼬리가 조용히 사라지기 때문이다(실제로 core.js 가 3,993 → 4,103줄이 되며 그럴
// 뻔했다). 여유와 별개로, 잘린 파일은 아래 "잘린 파일" 경고로 매번 드러낸다.
const MAX_LINES = 4400;

const manifest = JSON.parse(manifestRaw);
// manifest 의 계층 키는 name 이다. 아래 코드가 id 로 참조하므로 한 번만 맞춰 둔다.
manifest.applicationLayers.forEach((layer) => {
  layer.id = layer.name;
});

const helpers = createHelpers(manifest);
const dependencyCount = Object.keys(manifest.scriptDependencies ?? {}).length;
const formatArtifactSize = async (relativePath) => {
  try {
    const info = await stat(path.join(rootDir, relativePath));
    return `${(info.size / 1024 / 1024).toFixed(1)}MB`;
  } catch {
    return null;
  }
};
const artifactSizes = {
  offline: await formatArtifactSize('manneung-classroom-offline.html'),
  exe: await formatArtifactSize('manneung-classroom.exe'),
};

const diagrams = {
  layers: {
    title: '스크립트 로딩 계층',
    caption:
      'scripts.manifest.json 의 applicationLayers 를 그대로 그린 것입니다. 위에서 아래가 곧 HTML 의 <script> 태그 순서이고, 아래 계층은 위 계층의 전역을 쓸 수 있습니다.',
    svg: buildLayerDiagram(manifest),
    legend: [
      {
        title: '왜 계층이 필요한가',
        body: 'ES module 이 아니라 전역 스크립트라서, "누가 먼저 로드되는가"가 곧 의존 방향입니다. 계층은 그 순서를 사람이 읽을 수 있게 묶은 것입니다.',
      },
      {
        title: '검사 방법',
        body: 'tools/check-source.js 가 manneung-classroom.html 의 script 태그 순서와 manifest 의 localScripts 가 완전히 같은지, applicationLayers 가 모든 파일을 정확히 한 번씩 담는지 확인합니다.',
      },
      {
        title: '새 파일을 넣을 때',
        body: 'HTML 태그만 추가하면 check 가 실패합니다. manifest 의 계층과 docs/JS-파일별-기능.md 표에도 함께 등록해야 release-contract 테스트까지 통과합니다.',
      },
    ],
  },
  dependency: {
    title: '모듈 의존 그래프',
    caption:
      `manifest 의 scriptDependencies ${dependencyCount}건을 계층 열로 배치했습니다. 간선은 "먼저 로드돼야 하는 파일 → 그것을 쓰는 파일" 방향이고, 노드 오른쪽 숫자는 그 파일에 의존하는 파일 수입니다. 휠로 확대, 드래그로 이동합니다.`,
    svg: buildDependencyDiagram(manifest),
    legend: [
      {
        title: '읽는 법',
        body: '간선이 왼쪽에서 오른쪽으로만 흐릅니다. 같은 열 안의 곡선은 같은 계층 내부 의존이며, 이것도 위(먼저 로드) → 아래(나중 로드) 방향입니다.',
      },
      {
        title: '허브 노드',
        body: 'documents.js 와 code-viewer.js 로 들어오는 간선이 가장 많습니다. 이 둘의 시그니처를 바꾸면 파급 범위가 가장 넓습니다.',
      },
      {
        title: '선언되지 않은 의존',
        body: `manifest 에 적힌 ${dependencyCount}건은 "반드시 지켜야 하는 순서"이지 전역 사용의 전부는 아닙니다. state.js·i18n.js 처럼 거의 모든 파일이 쓰는 전역은 선언에 없어도 실제 의존입니다.`,
      },
    ],
  },
  boundary: {
    title: '공개 API 경계',
    caption:
      'manifest 의 moduleBoundaries 10건입니다. MN* 전역 하나를 창구로 두고, 어떤 파일이 그것을 쓰는지 명시적으로 선언해 둔 관계입니다.',
    svg: buildBoundaryDiagram(manifest),
    legend: [
      {
        title: '경계의 뜻',
        body: '"이 파일의 내부 함수는 마음대로 바꿔도 되지만 이 이름 하나는 계약이다"라는 선언입니다. 전역 스크립트 방식에서 모듈 캡슐화를 흉내 내는 장치입니다.',
      },
      {
        title: '자동 검사',
        body: 'check-source.js 가 선언된 publicApi 가 실제로 const/let/var 로 선언돼 있는지, 소비자로 적힌 파일이 정말 그 이름을 참조하는지까지 확인합니다. 소비자 목록이 낡으면 빌드가 실패합니다.',
      },
      {
        title: '가장 넓은 경계',
        body: 'MNLazy 는 소비자가 10개로 가장 많습니다. 무거운 vendor 를 언제 부를지 결정하는 지점이라, 시작 성능과 직결됩니다.',
      },
    ],
  },
  runtime: {
    title: '실행 형태와 경계',
    caption: '같은 소스가 온라인 HTML · 단일 오프라인 HTML · EXE 세 가지로 배포되고, 형태마다 쓸 수 있는 기능의 경계가 다릅니다.',
    svg: buildRuntimeDiagram(manifest, artifactSizes),
    legend: [
      {
        title: '기능 경계가 코드에 미치는 영향',
        body: '거의 모든 저장·실행 기능이 "EXE 로컬 서버가 있으면 그쪽, 없으면 브라우저 폴백" 두 갈래로 작성돼 있습니다. 한쪽만 고치면 나머지 형태에서 조용히 다르게 동작합니다.',
      },
      {
        title: '테스트가 보는 형태',
        body: 'node --test 는 순수 함수와 계약을, Playwright 는 tools/e2e-server.js 로 띄운 정적 서버(=EXE 없는 상태)를 봅니다. EXE 전용 경로는 자동 테스트 밖입니다.',
      },
      {
        title: '배포 산출물',
        body: `exe ${artifactSizes.exe ?? '약 19MB'}, 오프라인 HTML ${artifactSizes.offline ?? '약 19MB'} — 대부분이 vendor(pyodide·폰트·문서 라이브러리)입니다. 소스 자체는 그중 일부입니다.`,
      },
    ],
  },
  pipeline: {
    title: '빌드·검증 파이프라인',
    caption: 'npm run verify 한 줄이 네 단계를 순서대로 겁니다. EXE 재빌드만 수동 단계입니다.',
    svg: buildPipelineDiagram(),
    legend: [
      {
        title: '계약 테스트의 역할',
        body: 'release-contract.test.js 는 코드 동작이 아니라 "목록끼리 일치하는가"를 봅니다. manifest·문서·vendor 고정본이 서로 어긋나면 실패합니다.',
      },
      {
        title: '생성 파일',
        body: 'manneung-classroom-offline.html, desktop/app.html, src/js/korean-font.js 는 생성물입니다. 직접 고치면 다음 빌드에 덮어써집니다.',
      },
      {
        title: 'EXE 단계',
        body: 'AGENTS.md 규칙상 EXE 반영은 실행 중 프로세스 종료 → 오프라인 HTML 생성 → desktop\\build.bat 순서입니다.',
      },
    ],
  },
};

const context = { manifest, helpers, diagrams, rootDir };

const reviewSections = [
  ...buildOverview(context),
  ...buildGlossary(context),
  ...buildCodeWords(context),
  ...buildCodeReferences(context),
  ...buildCodePatterns(context),
  ...buildBootstrap(context),
  ...buildDocuments(context),
  ...buildPython(context),
  ...buildJavaScript(context),
  ...buildEditors(context),
  ...buildLearning(context),
  ...buildDesktop(context),
  ...buildTools(context),
  ...buildTests(context),
];

// 4차 사전은 고정 목록이 아니라 현재 프로젝트 소스에서 다시 계산합니다. 표준 사전과 이름이
// 겹치는 함수는 제외하고, 실제 선언·호출 빈도와 기능 영역별 몫을 기준으로 150개만 남깁니다.
const standardCodeNames = new Set([
  ...CODE_WORDS.map((item) => item.name),
  ...CODE_REFERENCES.map((item) => item.name),
  ...CODE_PATTERNS.map((item) => item.name),
]);
const PROJECT_FUNCTIONS = await collectProjectFunctions({
  rootDir,
  sections: reviewSections,
  standardNames: standardCodeNames,
  limit: 150,
});
const projectFunctionSection = buildProjectFunctionSection({ helpers, entries: PROJECT_FUNCTIONS });
const projectFunctionInsertAt = reviewSections.findIndex((section) => section.id === 'code-patterns') + 1;
reviewSections.splice(projectFunctionInsertAt, 0, ...projectFunctionSection);

// ── 소스 주입 ──────────────────────────────────────────

const sourceCache = new Map();
// 상한을 넘겨 꼬리가 잘린 파일. 구간(range) 참조는 의도한 자르기라 여기에 넣지 않는다.
const truncatedFiles = new Map();

const readWhole = async (relativePath) => {
  if (sourceCache.has(relativePath)) return sourceCache.get(relativePath);
  const raw = await readFile(path.join(rootDir, relativePath), 'utf8');
  const lines = raw.split(/\r?\n/);
  sourceCache.set(relativePath, lines);
  return lines;
};

/**
 * range 가 있으면 그 구간만, 없으면 전체(상한까지)를 담는다.
 * 줄 번호는 언제나 원본 기준이라 lineOffset 을 함께 넘긴다.
 */
const readSource = async (relativePath, range) => {
  const lines = await readWhole(relativePath);
  const total = lines.length;

  if (Array.isArray(range)) {
    const start = Math.max(1, range[0]);
    const end = Math.min(total, range[1]);
    return {
      code: lines.slice(start - 1, end).join('\n'),
      lineCount: end - start + 1,
      lineOffset: start - 1,
      totalLines: total,
    };
  }

  if (total > MAX_LINES) {
    truncatedFiles.set(relativePath, total);
    return {
      code:
        `${lines.slice(0, MAX_LINES).join('\n')}\n\n` +
        `// … 이 아래 ${total - MAX_LINES}줄은 리뷰 페이지 용량을 위해 잘렸습니다. 원본은 ${relativePath} 를 보세요.`,
      lineCount: MAX_LINES,
      lineOffset: 0,
      totalLines: total,
    };
  }

  return { code: lines.join('\n'), lineCount: total, lineOffset: 0, totalLines: total };
};

const hydrate = async () => {
  const hydrated = [];
  const missing = [];

  for (const section of reviewSections) {
    const files = [];
    for (const file of section.files) {
      try {
        files.push({ ...file, ...(await readSource(file.path, file.range)) });
      } catch (error) {
        missing.push(`${section.id} → ${file.path}: ${error.message}`);
        files.push({
          ...file,
          code: `// 파일을 읽지 못했습니다: ${file.path}\n// ${error.message}`,
          lineCount: 0,
          lineOffset: 0,
          totalLines: 0,
        });
      }
    }
    hydrated.push({ ...section, files });
  }

  return { hydrated, missing };
};

const { hydrated, missing } = await hydrate();

// ── 무결성 점검 ────────────────────────────────────────

const ids = new Set();
for (const section of hydrated) {
  if (ids.has(section.id)) throw new Error(`섹션 id가 중복됩니다: ${section.id}`);
  ids.add(section.id);
  if (!section.summary) throw new Error(`요약이 비어 있습니다: ${section.id}`);
  if (!section.category || !section.group) throw new Error(`분류가 비어 있습니다: ${section.id}`);
}

const codeWordIds = new Set();
const codeWordNames = new Set();
const supportedCodeWordLanguages = new Set(['js', 'cs', 'py']);
for (const item of CODE_WORDS) {
  if (codeWordIds.has(item.id)) throw new Error(`코드 낱말 id가 중복됩니다: ${item.id}`);
  if (codeWordNames.has(item.name)) throw new Error(`코드 낱말 표기가 중복됩니다: ${item.name}`);
  if (!item.name || !item.label || !item.body || !item.languages.length) {
    throw new Error(`코드 낱말 정보가 비어 있습니다: ${item.id}`);
  }
  if (item.languages.some((language) => !supportedCodeWordLanguages.has(language))) {
    throw new Error(`지원하지 않는 코드 낱말 언어입니다: ${item.id}`);
  }
  codeWordIds.add(item.id);
  codeWordNames.add(item.name);
}

const codeReferenceIds = new Set();
const codeReferenceNames = new Set();
for (const item of CODE_REFERENCES) {
  if (codeReferenceIds.has(item.id)) throw new Error(`코드 기본 기능 id가 중복됩니다: ${item.id}`);
  if (codeReferenceNames.has(item.name)) throw new Error(`코드 기본 기능 표기가 중복됩니다: ${item.name}`);
  if (!item.name || !item.label || !item.body || !item.languages.length) {
    throw new Error(`코드 기본 기능 정보가 비어 있습니다: ${item.id}`);
  }
  if (item.languages.some((language) => !supportedCodeWordLanguages.has(language))) {
    throw new Error(`지원하지 않는 코드 기본 기능 언어입니다: ${item.id}`);
  }
  codeReferenceIds.add(item.id);
  codeReferenceNames.add(item.name);
}

const codePatternIds = new Set();
const codePatternNames = new Set();
for (const item of CODE_PATTERNS) {
  if (codePatternIds.has(item.id)) throw new Error(`코드 메서드·패턴 id가 중복됩니다: ${item.id}`);
  if (codePatternNames.has(item.name)) throw new Error(`코드 메서드·패턴 표기가 중복됩니다: ${item.name}`);
  if (!item.name || !item.label || !item.body || !item.languages.length) {
    throw new Error(`코드 메서드·패턴 정보가 비어 있습니다: ${item.id}`);
  }
  if (item.languages.some((language) => !supportedCodeWordLanguages.has(language))) {
    throw new Error(`지원하지 않는 코드 메서드·패턴 언어입니다: ${item.id}`);
  }
  codePatternIds.add(item.id);
  codePatternNames.add(item.name);
}

const projectFunctionIds = new Set();
const projectFunctionKeys = new Set();
for (const item of PROJECT_FUNCTIONS) {
  const key = `${item.languages[0]}:${item.name}`;
  if (projectFunctionIds.has(item.id)) throw new Error(`프로젝트 함수 id가 중복됩니다: ${item.id}`);
  if (projectFunctionKeys.has(key)) throw new Error(`프로젝트 함수 표기가 중복됩니다: ${key}`);
  if (!item.name || !item.label || !item.body || !item.languages.length || !item.definitions.length) {
    throw new Error(`프로젝트 함수 정보가 비어 있습니다: ${item.id}`);
  }
  if (item.languages.some((language) => !supportedCodeWordLanguages.has(language))) {
    throw new Error(`지원하지 않는 프로젝트 함수 언어입니다: ${item.id}`);
  }
  projectFunctionIds.add(item.id);
  projectFunctionKeys.add(key);
}

// manifest 의 모든 src/js 파일이 어딘가의 섹션에 실려 있는지 확인한다.
// (docs/JS-파일별-기능.md 와 release-contract.test.js 가 서로를 검사하는 것과 같은 발상)
const covered = new Set();
hydrated.forEach((section) => section.files.forEach((file) => covered.add(file.path)));
const uncoveredModules = manifest.localScripts.filter((file) => !covered.has(`src/js/${file}`));

// 설계 문서는 전부 실린다는 전제로 검사한다. docs 는 기능 하나에 문서 하나꼴이라 수가 적고,
// 새 기능이 들어오면 거의 항상 문서가 함께 생기므로 "리뷰가 뒤처졌다"는 신호로 정확하다.
//
// tests 는 같은 방식으로 검사하지 않는다. 리뷰가 테스트를 전수로 싣는 것이 아니라 기능별
// 대표를 골라 싣는 구조라(139개 중 75개), 전수 검사를 걸면 의도한 생략까지 매번 경고로
// 떠서 경고 자체가 무시된다. 대신 참조 비율만 아래 요약에 찍어 흐름을 눈에 보이게 둔다.
const listDir = async (relativeDir, ext) => {
  try {
    const entries = await readdir(path.join(rootDir, relativeDir));
    return entries.filter((name) => name.endsWith(ext));
  } catch {
    return [];
  }
};

const docFiles = await listDir('docs', '.md');
const uncoveredDocs = docFiles.filter((file) => !covered.has(`docs/${file}`));

const testFiles = await listDir('tests', '.test.js');
const e2eFiles = await listDir('tests/e2e', '.spec.js');
const testCoverage = {
  unit: { total: testFiles.length, covered: testFiles.filter((f) => covered.has(`tests/${f}`)).length },
  e2e: { total: e2eFiles.length, covered: e2eFiles.filter((f) => covered.has(`tests/e2e/${f}`)).length },
};

// 사전에 실린 말이 리뷰 어딘가에 실제로 나오는지 확인한다. 리뷰 문장이 바뀌어 더는 쓰지 않는
// 말이 사전에 조용히 남는 것을 막는다(위의 "섹션에 실리지 않은 파일" 검사와 같은 발상).
// 섹션 산문뿐 아니라 줄 앵커 주석·흐름·계약도 화면에 나오는 글이므로 함께 본다.
const sidecarProse = (
  await Promise.all(
    ['review-comments.js', 'flows.js', 'contracts.js'].map((name) =>
      readFile(path.join(reviewDir, name), 'utf8').catch(() => ''),
    ),
  )
).join('\n');

const glossaryProse = hydrated
  .filter((section) => section.id !== 'glossary')
  .flatMap((section) => [
    section.title,
    section.subtitle,
    section.summary,
    ...(section.usage ?? []).flatMap((item) => [item.title, item.body]),
    ...(section.features ?? []).flatMap((item) => [item.title, item.body]),
    ...(section.notes ?? []).map((item) => item.body),
  ])
  .filter(Boolean)
  .concat(sidecarProse)
  .join('\n');

const unusedTerms = GLOSSARY_TERMS.filter(
  (item) => !item.match.some((keyword) => glossaryProse.includes(keyword)),
).map((item) => item.term);

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  root: path.basename(rootDir),
  sections: hydrated,
  // 본문의 용어에 툴팁·링크를 걸기 위한 색인. 렌더러가 화면에서 쓰는 최소 정보만 담는다.
  glossary: GLOSSARY_TERMS.map((item) => ({
    id: item.id,
    term: item.term,
    en: item.en ?? '',
    aliases: item.aliases,
    short: item.short,
  })),
  // 코드 하이라이터와 코드 낱말 툴팁이 함께 쓰는 색인. 언어별 목록도 여기서 파생한다.
  codeWords: CODE_WORDS.map((item) => ({
    id: item.id,
    name: item.name,
    languages: item.languages,
    languageLabel: item.languageLabel,
    kind: item.kind,
    label: item.label,
    short: item.short,
  })),
  codeReferences: CODE_REFERENCES.map((item) => ({
    id: item.id,
    name: item.name,
    languages: item.languages,
    languageLabel: item.languageLabel,
    kind: item.kind,
    label: item.label,
    short: item.short,
    type: item.type,
  })),
  codePatterns: CODE_PATTERNS.map((item) => ({
    id: item.id,
    name: item.name,
    languages: item.languages,
    languageLabel: item.languageLabel,
    kind: item.kind,
    label: item.label,
    short: item.short,
    type: item.type,
  })),
  projectFunctions: PROJECT_FUNCTIONS.map((item) => ({
    id: item.id,
    name: item.name,
    languages: item.languages,
    languageLabel: item.languageLabel,
    kind: item.kind,
    label: item.label,
    short: item.short,
    type: item.type,
    definitions: item.definitions,
    callCount: item.callCount,
    usedFileCount: item.usedFileCount,
  })),
};

// 출력은 객체 리터럴 그대로 둔다. "큰 데이터는 JSON.parse 가 빠르다"는 통설이 이 페이로드에는
// 해당하지 않는다 — 내용 대부분이 따옴표·역슬래시·개행이 가득한 소스 코드라, 문자열로 한 번 더 감싸면
// 이스케이프가 두 겹이 되어 파일이 오히려 커지고(6.98MB → 7.29MB) 언이스케이프도 두 번 한다.
// 실측(vm.Script, 컴파일 캐시 배제, 5회 중앙값): 리터럴 28ms / JSON.parse 63ms.
const output = `// 자동 생성 파일입니다. 직접 수정하지 마세요.\n// 다시 만들기: node code-review/generate-review-data.mjs\nwindow.MN_REVIEW_DATA = ${JSON.stringify(
  payload,
  null,
  2,
)};\n`;

await writeFile(path.join(reviewDir, 'review-data.generated.js'), output, 'utf8');

// ── 요약 출력 ──────────────────────────────────────────

const fileEntries = hydrated.reduce((sum, section) => sum + section.files.length, 0);
const totalLines = hydrated.reduce(
  (sum, section) => sum + section.files.reduce((acc, file) => acc + (file.lineCount || 0), 0),
  0,
);
const notes = hydrated.reduce((sum, section) => sum + section.notes.length, 0);

console.log(`섹션 ${hydrated.length}개 · 파일 참조 ${fileEntries}건 · 고유 파일 ${covered.size}개`);
console.log(`실린 코드 ${totalLines.toLocaleString('ko-KR')}줄 · 리뷰 포인트 ${notes}개`);
console.log(`출력 ${(output.length / 1024 / 1024).toFixed(2)}MB → code-review/review-data.generated.js`);

console.log(`용어 사전 ${GLOSSARY_TERMS.length}개`);
console.log(`코드 낱말 사전 ${CODE_WORDS.length}개`);
console.log(`코드 기호·기본 기능 사전 ${CODE_REFERENCES.length}개`);
console.log(`코드 메서드·실행 패턴 사전 ${CODE_PATTERNS.length}개`);
console.log(`프로젝트 API 사전 ${PROJECT_FUNCTIONS.length}개`);
console.log(
  `테스트 참조 단위 ${testCoverage.unit.covered}/${testCoverage.unit.total} · ` +
    `E2E ${testCoverage.e2e.covered}/${testCoverage.e2e.total} (전수가 아니라 기능별 대표만 싣습니다)`,
);

if (truncatedFiles.size) {
  console.warn(`\n[경고] 상한 ${MAX_LINES.toLocaleString('ko-KR')}줄을 넘겨 꼬리가 잘린 파일 ${truncatedFiles.size}개:`);
  for (const [file, total] of truncatedFiles) {
    console.warn(`  ${file} — ${total.toLocaleString('ko-KR')}줄 중 ${(total - MAX_LINES).toLocaleString('ko-KR')}줄이 빠졌습니다`);
  }
  console.warn('  구간(range)으로 나눠 싣거나 MAX_LINES 를 올리세요.');
}
if (uncoveredDocs.length) {
  console.warn(`\n[경고] 섹션에 실리지 않은 docs 문서 ${uncoveredDocs.length}개:`);
  console.warn(`  ${uncoveredDocs.join(', ')}`);
}
if (unusedTerms.length) {
  console.warn(`\n[경고] 리뷰 본문에 나오지 않는 사전 항목 ${unusedTerms.length}개:`);
  console.warn(`  ${unusedTerms.join(', ')}`);
}
if (uncoveredModules.length) {
  console.warn(`\n[경고] 섹션에 실리지 않은 src/js 파일 ${uncoveredModules.length}개:`);
  console.warn(`  ${uncoveredModules.join(', ')}`);
}
if (missing.length) {
  console.warn(`\n[경고] 읽지 못한 파일 ${missing.length}건:`);
  missing.forEach((line) => console.warn(`  ${line}`));
}
