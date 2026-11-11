/**
 * 로컬 Chrome(CDP)로 앱을 띄워 렌더링·콘솔·클릭 인터랙션을 검증한다.
 * 사전: Chrome --headless=new --remote-debugging-port=9222 로 실행
 * 실행(Windows node): node scripts\browser-check.mjs
 */
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const APP = process.env.APP_URL ?? 'http://localhost:5173/';

const list = await (await fetch(`${CDP}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('CDP page target 없음');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let seq = 0;
const pending = new Map();
const errors = [];
const logs = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text);
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = (msg.params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
    if (msg.params.type === 'error') errors.push(text);
    else if (msg.params.type === 'warning') logs.push(text);
  }
};

function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.text ?? 'evaluate failed');
  return res.result?.value;
}

async function click(x, y) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  await sleep(150);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await sleep(60);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
}

await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');
await send('Page.navigate', { url: APP });
await sleep(8000);

const state = await evaluate(`(() => {
  const s = window.__lib?.getState?.();
  if (!s) return { ready: false };
  return {
    ready: !!s.layouts,
    loading: s.loading,
    total: s.total,
    error: s.error,
    zone: s.zone,
    bays: s.layouts ? Object.fromEntries(Object.entries(s.layouts).map(([k, z]) => [k, z.bays.length])) : null,
    books: s.layouts ? Object.fromEntries(Object.entries(s.layouts).map(([k, z]) => [k, z.bays.reduce((n, b) => n + b.books.length, 0)])) : null,
  };
})()`);
console.log('[state]', JSON.stringify(state));

// 3D 책 위치를 화면 좌표로 투영해 실제 클릭
const target = await evaluate(`(() => {
  const s = window.__lib.getState();
  const zone = s.layouts.general;
  const bay = zone.bays.find((b) => b.rotationY === 0 && b.books.length > 40);
  const idx = 6;
  const row = Math.floor(idx / bay.cols);
  const col = idx % bay.cols;
  const slot = (bay.width - 0.16) / bay.cols;
  const rowCount = Math.min(bay.cols, bay.books.length - row * bay.cols);
  const rowWidth = rowCount * slot;
  const rowGap = (bay.height - 0.22) / bay.rows;
  const x = bay.position[0] - rowWidth / 2 + slot * (col + 0.5);
  const y = bay.position[1] + 0.1 + rowGap * row + 0.12;
  const z = bay.position[2] + 0.05;
  const p = window.__project(x, y, z);
  return { x: Math.round(p.x), y: Math.round(p.y), bay: bay.label, title: bay.books[idx].t };
})()`);
console.log('[target]', JSON.stringify(target));

await click(target.x, target.y);
await sleep(400);
const selected = await evaluate(`(() => {
  const s = window.__lib?.getState?.();
  return s?.selected ? { title: s.selected.book.t, call: s.selected.book.call, bay: s.selected.bay.label } : null;
})()`);
console.log('[after click]', JSON.stringify(selected));

await sleep(1800);
const panel = await evaluate(`(() => {
  const p = document.querySelector('.panel');
  if (!p) return null;
  return {
    title: p.querySelector('h2')?.textContent,
    badges: [...p.querySelectorAll('.badge')].map((b) => b.textContent),
    call: [...p.querySelectorAll('.info dd')].map((d) => d.textContent).slice(0, 3),
    cover: !!p.querySelector('.panel-cover img'),
  };
})()`);
console.log('[panel]', JSON.stringify(panel));

// 검색: 현재 서가에 실제로 있는 책 제목으로 검색
const search = await evaluate(`(async () => {
  const s = window.__lib.getState();
  const bay = s.layouts.general.bays.find((b) => b.rotationY === 0 && b.books.length > 40);
  const title = bay.books[3].t.slice(0, 4);
  const input = document.querySelector('.search input');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, title);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  return { keyword: title, results: [...document.querySelectorAll('.search-results .result .result-title')].map((n) => n.textContent).slice(0, 5) };
})()`);
console.log('[search]', JSON.stringify(search));

// 도서관정보나루 원격 검색 + API 지연 측정
const api = await evaluate(`(async () => {
  const t0 = performance.now();
  const res = await fetch('/api/naru/srchBooks?keyword=' + encodeURIComponent('전쟁') + '&pageNo=1&pageSize=3&format=json');
  const json = await res.json();
  return { ms: Math.round(performance.now() - t0), numFound: json?.response?.numFound, err: json?.response?.errCode ?? null };
})()`);
console.log('[api]', JSON.stringify(api));

const remote = await evaluate(`(async () => {
  const btn = document.querySelector('.search-more');
  if (!btn) return { ok: false, reason: 'no button' };
  btn.click();
  const t0 = performance.now();
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 300));
    const titles = [...document.querySelectorAll('.search-results .result .result-title')].map((n) => n.textContent);
    const err = document.querySelector('.search-results .result-empty.error')?.textContent;
    if (err) return { ok: false, error: err, ms: Math.round(performance.now() - t0) };
    if (titles.length > 1) return { ok: true, ms: Math.round(performance.now() - t0), results: titles.slice(1, 5) };
  }
  return { ok: false, reason: 'timeout', html: document.querySelector('.search-results')?.textContent?.slice(0, 200) };
})()`);
console.log('[remote search]', JSON.stringify(remote));

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(process.env.SHOT_PATH ?? '.browser-check.png', Buffer.from(shot.data, 'base64'));

console.log('[console errors]', errors.length ? errors.slice(0, 10) : 'none');
console.log('[warnings]', logs.slice(0, 6));
ws.close();
