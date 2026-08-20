// 소스에서 직접 재는 값들.
//
// 리뷰 문장에 줄 수를 손으로 적으면 소스가 자라는 동안 문장만 조용히 낡는다. 실제로
// spreadsheet-viewer.js 의 "5,915줄" 은 수식 엔진을 떼어 5,161줄이 된 뒤에도 남아 있었고,
// core.js "4,104줄" · code-viewer.js "4,034줄" · state.js "646줄" 도 같은 이유로 어긋났다.
// 그래서 문장에 숫자가 꼭 필요하면 여기서 재서 끼워 넣는다.
//
// 40-editors.mjs 가 먼저 자기 안에 두고 쓰던 두 함수를 여기로 올렸다 — 같은 값을 여러 섹션이
// 쓰기 시작했고, 섹션마다 따로 재면 같은 파일에 다른 숫자가 적힐 수 있기 때문이다.

import { readFileSync } from 'node:fs';
import path from 'node:path';

/** 파일의 줄 수. 읽지 못하면 null(문장 쪽에서 숫자 없이 쓰도록). */
export const sourceLines = (rootDir, relativePath) => {
  try {
    return readFileSync(path.join(rootDir, relativePath), 'utf8').split(/\r?\n/).length;
  } catch {
    return null;
  }
};

/** 1,234 처럼 세 자리마다 쉼표. null 이면 "?" 대신 빈 문자열을 돌려주지 않고 호출부가 판단한다. */
export const formatLines = (count) => (count == null ? null : count.toLocaleString('en-US'));

/** `${lines(...)}줄` 을 바로 쓰기 위한 것. 못 재면 "" 라 문장이 "core.js 는" 처럼 자연스럽게 이어진다. */
export const linesLabel = (rootDir, relativePath) => {
  const count = sourceLines(rootDir, relativePath);
  return count == null ? '' : `${formatLines(count)}줄`;
};

// 최상위 함수 하나의 길이. spreadsheet-viewer.js 의 renderXlsx, map-viewer.js 의 mountMapEditor
// 처럼 "파일이 큰 것보다 한 함수가 큰 것" 이 문제인 경우를 문장이 아니라 측정으로 말하기 위해서다.
// 본문이 들여쓰기돼 있으므로 여는 선언 다음에 오는 첫 번째 "열 0 의 }" 가 그 함수의 끝이다.
export const topLevelFunctionSpan = (rootDir, relativePath, name) => {
  try {
    const lines = readFileSync(path.join(rootDir, relativePath), 'utf8').split(/\r?\n/);
    const start = lines.findIndex((line) => new RegExp(`^(async )?function ${name}\\b`).test(line));
    if (start < 0) return null;
    const offset = lines.slice(start + 1).findIndex((line) => /^\}/.test(line));
    if (offset < 0) return null;
    return { start: start + 1, end: start + offset + 2, span: offset + 2 };
  } catch {
    return null;
  }
};

/** 함수가 파일에서 차지하는 비율(정수 %). 재지 못하면 null. */
export const functionShare = (rootDir, relativePath, name) => {
  const total = sourceLines(rootDir, relativePath);
  const fn = topLevelFunctionSpan(rootDir, relativePath, name);
  if (!total || !fn) return null;
  return Math.round((fn.span / total) * 100);
};

/**
 * 앵커로 구간을 찾는다 — [시작줄, 끝줄] 을 손으로 적지 않기 위한 것.
 *
 * 손으로 적은 줄 번호는 그 파일이 자라는 순간 다른 코드를 가리키게 된다. 실제로
 * desktop/launcher.cs 가 7,118 → 7,861줄이 되자 여기 걸려 있던 구간 21개가 전부 어긋나,
 * "인증 판정" 을 눌러도 엉뚱한 함수가 뜨는 상태가 됐다. 줄 번호는 파일이 바뀌면 반드시 낡는
 * 값이라, 코드 안의 잘 안 변하는 문자열(함수 이름·라우팅 경로)로 매번 다시 찾는다.
 *
 * anchor:
 *   from   시작 지점을 찾을 문자열/정규식(첫 번째 일치)
 *   to     끝 지점을 찾을 문자열/정규식(from 이후 첫 번째 일치). 없으면 lines 로 길이를 정한다
 *   lines  to 대신 쓸 줄 수
 *   before from 앞으로 몇 줄 더 붙일지(주석·선언부를 함께 보이게)
 *   after  to 뒤로 몇 줄 더 붙일지
 *
 * 못 찾으면 null 을 돌려주고, 부르는 쪽이 그 사실을 경고로 드러낸다 — 조용히 빈 구간을
 * 싣는 것이 지금 고치고 있는 바로 그 실패이기 때문이다.
 */
export const anchoredRange = (rootDir, relativePath, anchor) => {
  const { from, to, lines: span, before = 0, after = 0 } = anchor;
  let text;
  try {
    text = readFileSync(path.join(rootDir, relativePath), 'utf8');
  } catch {
    return null;
  }
  const lines = text.split(/\r?\n/);
  const test = (pattern, line) => (pattern instanceof RegExp ? pattern.test(line) : line.includes(pattern));

  const startIndex = lines.findIndex((line) => test(from, line));
  if (startIndex < 0) return null;

  let endIndex;
  if (to) {
    const offset = lines.slice(startIndex + 1).findIndex((line) => test(to, line));
    if (offset < 0) return null;
    endIndex = startIndex + 1 + offset;
  } else {
    endIndex = startIndex + (span ?? 60) - 1;
  }

  const start = Math.max(1, startIndex + 1 - before);
  const end = Math.min(lines.length, endIndex + 1 + after);
  return end >= start ? [start, end] : null;
};

/**
 * src/js 에서 큰 파일 순으로 몇 개.
 * "가장 큰 파일" 목록을 손으로 적어 두면 순위가 바뀌어도 문장이 그대로 남는다 —
 * 실제로 whiteboard.js 와 map-viewer.js 가 새로 2·3위로 올라온 뒤 그 일이 일어났다.
 */
export const largestScripts = (rootDir, manifest, count) =>
  manifest.localScripts
    .map((file) => ({ file, lines: sourceLines(rootDir, `src/js/${file}`) }))
    .filter((item) => item.lines != null)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, count);

/** "spreadsheet-viewer.js 5,161줄 / whiteboard.js 4,930줄 / …" 한 줄로. */
export const largestScriptsLabel = (rootDir, manifest, count) =>
  largestScripts(rootDir, manifest, count)
    .map((item) => `${item.file} ${formatLines(item.lines)}줄`)
    .join(' / ');
