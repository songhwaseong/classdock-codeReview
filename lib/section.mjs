// 섹션 정의 도우미.
//
// src/js 모듈 섹션은 대부분 같은 모양이라, 사람이 쓰는 부분(요약·기능·리뷰 포인트)만
// 남기고 나머지(로딩 순서, 의존 관계, 공개 API, 파일 목록)는 manifest 에서 자동으로
// 채운다. 손으로 적은 의존 설명이 manifest 와 어긋나는 것을 원천적으로 막기 위해서다.

const LAYER_LABEL = {
  bootstrap: 'bootstrap',
  documents: 'documents',
  'python-and-notebooks': 'python-and-notebooks',
  javascript: 'javascript',
  'document-editors': 'document-editors',
  'learning-tools': 'learning-tools',
};

const LAYER_CATEGORY = {
  bootstrap: '1. bootstrap',
  documents: '2. documents',
  'python-and-notebooks': '3. python·notebooks',
  javascript: '4. javascript',
  'document-editors': '5. document-editors',
  'learning-tools': '6. learning-tools',
};

export const fileLabel = (path) => path.split('/').pop();

export const createHelpers = (manifest) => {
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
   * @param {object} config { id?, title, subtitle, summary, usage[], features[], files[], notes[] }
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
        { path: `src/js/${file}`, label: fileLabel(file), description: config.subtitle ?? '모듈 본문' },
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
