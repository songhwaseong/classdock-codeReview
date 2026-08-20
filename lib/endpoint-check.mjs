// EXE 엔드포인트 계약 대조.
//
// 전역 공개 API 는 scripts.manifest.json 의 moduleBoundaries 라는 "정답 목록"이 있어서,
// 계약 카드가 빠지면 생성 스크립트가 바로 잡아낸다. EXE 엔드포인트에는 그런 목록이 없다 —
// launcher.cs 의 else-if 사슬이 곧 목록이라, 런처에 새 경로가 생겨도 아무 데서도 티가 나지
// 않는다. 실제로 지도 엔드포인트 10개가 그렇게 조용히 빠진 채로 남아 있었다.
//
// 그래서 사슬에서 경로를 뽑아 계약 카드의 endpoints 와 양쪽으로 맞춘다.
//   ① 런처에 있는데 어느 카드도 맡지 않은 경로 → 계약이 빠졌다
//   ② 카드가 적었는데 런처에 없는 경로 → 경로가 사라졌거나 오타다
// ②를 함께 보는 이유는, 계약 카드도 소스만큼 낡기 때문이다. 삭제된 엔드포인트를 설명하는
// 카드가 남아 있으면 읽는 사람이 없는 기능을 있다고 믿는다.

import { readFileSync } from 'node:fs';
import path from 'node:path';

// path == "/x" 와 path.StartsWith("/x" 두 꼴을 모두 잡는다. 뒤에 붙는 ? 는 떼어 낸다
// (StartsWith("/geocode?") 처럼 쿼리까지 포함해 비교하는 자리가 있다).
const ROUTE_PATTERN = /path(?:\.StartsWith\(|\s*==\s*)"(\/[A-Za-z0-9_/-]*)\??"/g;

// 엔드포인트가 아닌 것들. 정적 파일 서빙 루트와 자산 접두사라 계약으로 설명할 대상이 아니다.
const NOT_ENDPOINTS = new Set(['/', '/pyodide/', '/__pycache__/']);

// "/js-npm-" 처럼 끝이 - 로 끝나는 것들은 한 벌을 통째로 가리키는 분기 접두사다(토큰 규칙이
// 그 단위로 걸려 있다). 따로 걸러 내지 않고 그 벌을 맡은 계약 카드가 함께 적어 두게 한다 —
// 접두사를 목록에서 빼면 "이 한 줄이 어느 카드 소관인가"가 아무 데도 안 남기 때문이다.

/** launcher.cs 의 라우팅에서 경로를 뽑는다. 읽지 못하면 null(부르는 쪽이 검사를 건너뛴다). */
export const collectLauncherRoutes = (rootDir, relativePath = 'desktop/launcher.cs') => {
  let source;
  try {
    source = readFileSync(path.join(rootDir, relativePath), 'utf8');
  } catch {
    return null;
  }
  const routes = new Set();
  for (const match of source.matchAll(ROUTE_PATTERN)) {
    if (!NOT_ENDPOINTS.has(match[1])) routes.add(match[1]);
  }
  return routes;
};

/**
 * 계약 카드의 endpoints 와 런처 경로를 맞춘다.
 * @returns { missing, stale, uncovered } — uncovered 는 endpoints 를 아예 안 적은 카드
 */
export const checkEndpointContracts = (routes, contracts) => {
  const claimed = new Map(); // 경로 → 그 경로를 맡은 카드 제목들
  const uncovered = [];

  for (const card of contracts) {
    if (card.kind === 'API') continue;
    if (!Array.isArray(card.endpoints) || !card.endpoints.length) {
      uncovered.push(card.title);
      continue;
    }
    for (const endpoint of card.endpoints) {
      if (!claimed.has(endpoint)) claimed.set(endpoint, []);
      claimed.get(endpoint).push(card.title);
    }
  }

  const missing = [...routes].filter((route) => !claimed.has(route)).sort();
  const stale = [...claimed.keys()].filter((endpoint) => !routes.has(endpoint)).sort();
  // 한 경로를 두 카드가 맡으면 어느 쪽이 그 경로의 계약인지 흐려진다.
  const duplicated = [...claimed.entries()]
    .filter(([, titles]) => titles.length > 1)
    .map(([endpoint, titles]) => `${endpoint} — ${titles.join(' / ')}`);

  return { missing, stale, uncovered, duplicated };
};
