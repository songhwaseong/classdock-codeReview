// 곁다리 파일(review-comments.js · flows.js · contracts.js)의 "파일 위치" 앵커 해석.
//
// 왜 필요한가
// -----------
// 섹션의 구간(range)은 이미 줄 번호 대신 코드 문자열 앵커를 쓴다(lib/source-metrics.mjs).
// 그런데 지목 주석·흐름 단계·계약 카드는 오랫동안 line: 2478 처럼 숫자를 그대로 적어 두었고,
// 이쪽에는 아무 검사가 없었다. 2026-08-22 에 세어 보니 227곳 중 47곳이 어긋나 있었고
// 3곳은 빈 줄을, 15곳은 어느 구간에도 실리지 않은 줄을 가리키고 있었다. 그중 일부는
// 훨씬 전부터 엉뚱한 코드를 가리켰다 — "임의 Python 실행의 입구" 가 지도 검색 키 라우팅을,
// "npm 250MB 상한" 이 런처가 아니라 npm_package_runner.js 에 있는 검사를 가리켰다.
//
// 화면에는 코드가 멀쩡히 뜨기 때문에 눈으로는 드러나지 않는 종류의 낡음이라, 구간과 같은
// 처방을 쓴다 — 줄 번호 대신 코드 안의 문자열을 적고 생성 때 다시 찾는다.
//
// 앵커 모양
// ---------
//   { file, at }              at 와 트림 결과가 같은 줄
//   { file, at, below: 2 }    그 줄에서 아래로 2줄
//   { file, at, nth: 2 }      같은 줄이 여럿일 때 2번째(1부터)
//   { file, line: 1 }         파일 첫 줄처럼 앵커가 필요 없는 자리는 숫자를 그대로 둔다
//
// 일부러 트림 비교만 한다. 들여쓰기가 바뀌어도 살아남되, 코드 자체가 바뀌면 못 찾고 경고가
// 뜨는 것이 목적이다 — 조용히 옆 줄로 미끄러지는 것보다 시끄럽게 실패하는 편이 낫다.

/** 파일 내용을 줄 배열로. 생성 한 번 안에서 같은 파일을 여러 번 읽지 않게 캐시한다. */
export const makeLineCache = (readFileSync, rootDir) => {
  const cache = new Map();
  return (relativePath) => {
    if (!cache.has(relativePath)) {
      let lines = null;
      try {
        lines = readFileSync(`${rootDir}/${relativePath}`, 'utf8').split(/\r?\n/);
      } catch {
        lines = null;
      }
      cache.set(relativePath, lines);
    }
    return cache.get(relativePath);
  };
};

// 키 구분자는 코드에 절대 나오지 않는 NUL 로 둔다(공백을 쓰면 앵커 문자열 안의 공백과 섞인다).
// app.js 도 같은 규칙으로 키를 만든다 — 한쪽만 바꾸면 표를 통째로 못 찾으니 함께 고칠 것.
const KEY_SEPARATOR = '\u0000';
export const anchorKey = (file, at, below) => file + KEY_SEPARATOR + at + KEY_SEPARATOR + (below ?? 0);

/**
 * 앵커 하나를 줄 번호로.
 * @returns { line } 또는 { error, hits } — 부르는 쪽이 경고로 드러낸다.
 */
export const resolveLineAnchor = (lines, anchor) => {
  if (!lines) return { error: '파일을 읽지 못했습니다' };
  const wanted = String(anchor.at ?? '').trim();
  if (!wanted) return { error: 'at 이 비어 있습니다' };

  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === wanted) hits.push(i + 1);
  if (!hits.length) return { error: '같은 줄을 찾지 못했습니다', hits: 0 };

  const nth = Number.isInteger(anchor.nth) ? anchor.nth : null;
  if (hits.length > 1 && nth == null) return { error: `같은 줄이 ${hits.length}곳입니다(nth 로 골라 주세요)`, hits: hits.length };
  if (nth != null && (nth < 1 || nth > hits.length)) return { error: `nth: ${nth} 인데 같은 줄은 ${hits.length}곳뿐입니다`, hits: hits.length };

  const base = hits[(nth ?? 1) - 1];
  const line = base + (Number.isInteger(anchor.below) ? anchor.below : 0);
  if (line < 1 || line > lines.length) return { error: `below 를 더하면 파일 밖(${line}줄)입니다`, hits: hits.length };
  return { line };
};

/** 객체 트리에서 { file, at } 또는 { file, line } 을 가진 노드를 모두 찾는다. */
export const collectRefs = (node, source, out = []) => {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, source, out);
    return out;
  }
  if (!node || typeof node !== 'object') return out;
  if (typeof node.file === 'string' && (typeof node.at === 'string' || typeof node.line === 'number')) {
    out.push({ ...node, source });
  }
  for (const value of Object.values(node)) collectRefs(value, source, out);
  return out;
};
