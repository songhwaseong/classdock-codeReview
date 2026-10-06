// 섹션 정의 도우미.
//
// src/js 모듈 섹션은 대부분 같은 모양이라, 사람이 쓰는 부분(요약·기능·리뷰 포인트)만
// 남기고 나머지(로딩 순서, 의존 관계, 공개 API, 파일 목록)는 manifest 에서 자동으로
// 채운다. 손으로 적은 의존 설명이 manifest 와 어긋나는 것을 원천적으로 막기 위해서다.

import { anchoredRange } from './source-metrics.mjs';

const LAYER_LABEL = {
  bootstrap: 'bootstrap',
  documents: 'documents',
  'python-and-notebooks': 'python-and-notebooks',
  javascript: 'javascript',
  java: 'java',
  'snippet-gallery': 'snippet-gallery',
  'document-editors': 'document-editors',
  'learning-tools': 'learning-tools',
};

// 번호는 manifest.applicationLayers 순서 그대로다(= script 태그 순서). 계층이 끼어들면 뒤 번호가 밀린다.
const LAYER_CATEGORY = {
  bootstrap: '1. bootstrap',
  documents: '2. documents',
  'python-and-notebooks': '3. python·notebooks',
  javascript: '4. javascript',
  java: '5. java',
  'snippet-gallery': '6. snippet-gallery',
  'document-editors': '7. document-editors',
  'learning-tools': '8. learning-tools',
};

export const fileLabel = (path) => path.split('/').pop();

// mod() 의 ranges 앵커 중 찾지 못한 것. 생성 스크립트가 경고로 찍는다(launcher.cs 의 brokenAnchors 와 같은 역할).
export const brokenModuleRanges = [];

export const createHelpers = (manifest, rootDir) => {
  const deps = manifest.scriptDependencies ?? {};
  const boundaries = manifest.moduleBoundaries ?? [];
  const order = manifest.localScripts;

  const layerOf = (file) => manifest.applicationLayers.find((layer) => layer.scripts.includes(file));
  const dependsOn = (file) => deps[file] ?? [];
  const dependents = (file) =>
    Object.entries(deps)
      .filter(([, sources]) => sources.includes(file))
      .map(([target]) => target);
  const boundaryOf = (file) => boundaries.find((item) => item.file === file);
  const consumesApi = (file) => boundaries.filter((item) => (item.consumers ?? []).includes(file));

  /**
   * src/js 모듈 한 개짜리 섹션.
   * @param {string} file  예: 'core.js'
   * @param {object} config { id?, title, subtitle, summary, usage[], features[], files[], notes[], ranges? }
   *
   * ranges: [{ label, anchor, description }] — 파일을 통째로 싣는 대신 앵커로 찾은 구간들만 싣는다.
   *   상한(MAX_LINES)을 넘긴 파일을 꼬리 자르기 없이 싣기 위한 것이다. 구간은 함수 경계나
   *   "데이터 ↔ 로직" 경계처럼 자연스러운 자리에서만 나눈다. anchor 는 anchoredRange 와 같은 모양.
   */
  const mod = (file, config) => {
    const layer = layerOf(file);
    if (!layer) throw new Error(`manifest 계층에 없는 파일입니다: ${file}`);

    const index = order.indexOf(file);
    const before = dependsOn(file);
    const after = dependents(file);
    const boundary = boundaryOf(file);
    const consumed = consumesApi(file);

    const autoUsage = [
      {
        title: '로딩 위치',
        body:
          `${LAYER_LABEL[layer.id]} 계층의 ${layer.scripts.indexOf(file) + 1}번째, 전체 ${order.length}개 중 ` +
          `${index + 1}번째로 로드됩니다. 전역 스크립트라 이 순서보다 먼저 실행되는 코드에서는 이 파일의 이름을 쓸 수 없습니다.`,
      },
    ];

    if (before.length) {
      autoUsage.push({
        title: '먼저 로드돼야 하는 파일',
        body: `${before.join(', ')} — manifest의 scriptDependencies에 선언돼 있고, tools/check-source.js가 로드 순서 역전을 빌드 실패로 막습니다.`,
      });
    }
    if (after.length) {
      autoUsage.push({
        title: '이 파일에 의존하는 파일',
        body: `${after.join(', ')} — 이 파일의 공개 이름을 바꾸면 함께 확인해야 합니다.`,
      });
    }
    if (boundary) {
      autoUsage.push({
        title: `공개 API ${boundary.publicApi}`,
        body:
          `manifest의 moduleBoundaries에 등록된 전역 경계입니다. 소비자로 ${(boundary.consumers ?? []).join(', ')}가 ` +
          `선언돼 있고, check-source.js가 "선언이 실제로 존재하는지 / 소비자가 정말 그 이름을 쓰는지 / 소비자가 나중에 로드되는지"를 모두 검사합니다.`,
      });
    }
    if (consumed.length) {
      autoUsage.push({
        title: '가져다 쓰는 공개 API',
        body: consumed.map((item) => `${item.publicApi}(${item.file})`).join(', '),
      });
    }

    const extraFiles = config.files ?? [];
    const mainPath = `src/js/${file}`;
    // 못 찾은 앵커는 [0, 0](빈 구간)으로 싣는다 — range 를 비우면 readSource 가 파일 전체를 끌어온다.
    const mainFiles = config.ranges
      ? config.ranges.map(({ label, anchor, description }) => {
          const range = anchoredRange(rootDir, mainPath, anchor);
          if (!range) brokenModuleRanges.push(`${file} (${label}) — ${anchor.from}`);
          return {
            path: mainPath,
            label: `${fileLabel(file)} (${label})`,
            range: range ?? [0, 0],
            description: range ? description : `(앵커를 찾지 못해 코드 없이 실림) ${description}`,
          };
        })
      : [{ path: mainPath, label: fileLabel(file), description: config.subtitle ?? '모듈 본문' }];

    return {
      id: config.id ?? file.replace(/\.js$/, ''),
      category: LAYER_CATEGORY[layer.id],
      group: config.group ?? LAYER_LABEL[layer.id],
      title: config.title ?? file,
      subtitle: config.subtitle ?? '',
      summary: config.summary,
      diagram: config.diagram ?? null,
      usage: [...autoUsage, ...(config.usage ?? [])],
      features: config.features ?? [],
      files: [
        ...mainFiles,
        ...extraFiles.map((item) =>
          typeof item === 'string'
            ? { path: item, label: fileLabel(item), description: '함께 보는 파일' }
            : item,
        ),
      ],
      notes: config.notes ?? [],
    };
  };

  /** 모듈이 아닌 일반 섹션(개요, 계층 개요, EXE, 빌드 도구, 테스트 등). */
  const sec = (config) => ({
    id: config.id,
    category: config.category,
    group: config.group,
    title: config.title,
    subtitle: config.subtitle ?? '',
    summary: config.summary,
    diagram: config.diagram ?? null,
    usage: config.usage ?? [],
    features: config.features ?? [],
    files: (config.files ?? []).map((item) =>
      typeof item === 'string' ? { path: item, label: fileLabel(item), description: '' } : item,
    ),
    notes: config.notes ?? [],
  });

  return { mod, sec, layerOf, dependsOn, dependents, boundaryOf, consumesApi, order, boundaries, deps };
};
