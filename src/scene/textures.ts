import * as THREE from 'three';

/** 서가 표찰 — 흰 바탕 + 섹션 색 띠 + 분류명 */
export function makeShelfLabel(label: string, sub: string, color: string): THREE.CanvasTexture {
  const w = 512;
  const h = 150;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#fbfaf6';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, 22);
  ctx.strokeStyle = 'rgba(60,60,60,0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

  ctx.fillStyle = '#2c2f33';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const fontOf = (px: number) => `700 ${px}px "Pretendard", "Apple SD Gothic Neo", sans-serif`;
  const max = 400;
  let size = 48;
  ctx.font = fontOf(size);
  while (size > 30 && ctx.measureText(label).width > max) {
    size -= 4;
    ctx.font = fontOf(size);
  }
  let lines = [label];
  if (ctx.measureText(label).width > max) {
    const mid = label.includes(' ') ? label.lastIndexOf(' ', Math.floor(label.length / 2)) : -1;
    const cut = mid > 0 ? mid : Math.floor(label.length / 2);
    lines = [label.slice(0, cut).trim(), label.slice(cut).trim()].filter(Boolean);
    size = 40;
    ctx.font = fontOf(size);
    while (size > 26 && lines.some((line) => ctx.measureText(line).width > max)) {
      size -= 2;
      ctx.font = fontOf(size);
    }
    lines = lines.map((line) => {
      let text = line;
      while (ctx.measureText(text).width > max && text.length > 2) text = `${text.slice(0, -2)}…`;
      return text;
    });
  }
  lines.forEach((line, i) => ctx.fillText(line, 24, lines.length === 1 ? 66 : 48 + i * 38));

  ctx.fillStyle = '#6b6f74';
  ctx.font = '500 30px "Pretendard", sans-serif';
  ctx.fillText(sub, 26, lines.length === 1 ? 114 : 124);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 테라조(물갈이) 바닥 — 사진 속 밝은 회색 바닥 */
export function makeTerrazzo(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#dcd8d0';
  ctx.fillRect(0, 0, size, size);

  // 큰 집합체
  for (let i = 0; i < 2600; i++) {
    const r = 0.6 + Math.random() * 2.4;
    const g = 200 + Math.random() * 45;
    ctx.fillStyle = `rgba(${g | 0},${(g - 4) | 0},${(g - 10) | 0},${0.25 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // 어두운 스펙클
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(90,88,84,${0.08 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // 이음줄
  ctx.strokeStyle = 'rgba(150,146,140,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 천장에 매다는 자료실 사인 (민트/노랑) */
export function makeHangingSign(text: string, sub: string, bg = '#1f9d95'): THREE.CanvasTexture {
  const w = 640;
  const h = 168;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 5;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  const light = ['#f2c400', '#b8d98a', '#a9d6ea', '#efb6c8', '#cfd3d6'].includes(bg);
  ctx.fillStyle = light ? '#26302f' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 74px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(text, w / 2, 74);
  ctx.font = '500 30px "Pretendard", sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(sub, w / 2, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 절차적 나무결 텍스처 (서가·가구) */export function makeWoodTexture(base = '#b98a58', plank = 96): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += plank) {
    const shade = 0.9 + Math.random() * 0.16;
    ctx.fillStyle = `rgba(60,34,16,${(1 - shade) * 0.55})`;
    ctx.fillRect(0, y, size, plank);
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = `rgba(70,42,20,${0.04 + Math.random() * 0.08})`;
      ctx.lineWidth = 0.8 + Math.random() * 1.6;
      const yy = y + Math.random() * plank;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      for (let x = 0; x <= size; x += 26) {
        ctx.lineTo(x, yy + Math.sin((x + y) * 0.018) * 2 + (Math.random() - 0.5) * 1.2);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(50,28,12,0.18)';
    ctx.fillRect(0, y, size, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 미디어실 유리벽 ON AIR 데칼 */
export function makeOnAir(): THREE.CanvasTexture {
  const w = 512;
  const h = 320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#f2c400';
  ctx.lineWidth = 16;
  ctx.lineJoin = 'round';
  const r = 34;
  ctx.beginPath();
  ctx.moveTo(60 + r, 26);
  ctx.lineTo(w - 60 - r, 26);
  ctx.quadraticCurveTo(w - 60, 26, w - 60, 26 + r);
  ctx.lineTo(w - 60, 210 - r);
  ctx.quadraticCurveTo(w - 60, 210, w - 60 - r, 210);
  ctx.lineTo(60 + r, 210);
  ctx.quadraticCurveTo(60, 210, 60, 210 - r);
  ctx.lineTo(60, 26 + r);
  ctx.quadraticCurveTo(60, 26, 60 + r, 26);
  ctx.closePath();
  ctx.stroke();

  // 재생 아이콘
  ctx.fillStyle = '#f2c400';
  ctx.beginPath();
  ctx.moveTo(236, 72);
  ctx.lineTo(236, 164);
  ctx.lineTo(310, 118);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f2c400';
  ctx.textAlign = 'center';
  ctx.font = '800 86px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText('ON AIR', w / 2, 290);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 러그 — 테두리·스트라이프 패턴 */
export function makeRugTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 384;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b7a78b';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#8f7f66';
  ctx.fillRect(0, 0, w, 26);
  ctx.fillRect(0, h - 26, w, 26);
  ctx.fillRect(0, 0, 26, h);
  ctx.fillRect(w - 26, 0, 26, h);
  ctx.fillStyle = '#c9b99a';
  ctx.fillRect(40, 40, w - 80, h - 80);
  ctx.strokeStyle = 'rgba(120,102,76,0.5)';
  ctx.lineWidth = 3;
  for (let x = 70; x < w - 60; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 46);
    ctx.lineTo(x + 18, h - 46);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(90,76,56,${0.02 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 벽면 포스터 */
export function makePosterTexture(title: string, sub: string, bg: string): THREE.CanvasTexture {
  const w = 512;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fbfaf6';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(18, 18, w - 36, h - 36);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(w / 2, 250, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(w / 2, 250, 88, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '800 54px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(title, w / 2, 470);
  ctx.font = '500 28px "Pretendard", sans-serif';
  ctx.globalAlpha = 0.9;
  ctx.fillText(sub, w / 2, 522);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 게시판(코르크) */
export function makeNoticeTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 340;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b98f5c';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(90,60,30,${0.05 + Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2);
  }
  const papers = [
    ['#fdfbf4', 60, 52, 150, 190],
    ['#f6f0df', 236, 44, 120, 160],
    ['#fffdf7', 372, 66, 96, 132],
    ['#f9f4e6', 90, 236, 180, 70],
  ];
  for (const [color, x, y, pw, ph] of papers) {
    ctx.fillStyle = color as string;
    ctx.fillRect(x as number, y as number, pw as number, ph as number);
    ctx.strokeStyle = 'rgba(80,70,50,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x as number, y as number, pw as number, ph as number);
    ctx.fillStyle = 'rgba(70,60,40,0.35)';
    for (let ly = (y as number) + 18; ly < (y as number) + (ph as number) - 12; ly += 14) {
      ctx.fillRect((x as number) + 12, ly, (pw as number) - 24, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 창밖 풍경 — 하늘·건물·나무 실루엣 (블러 처리) */
export function makeWindowView(): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#cfe6f5');
  sky.addColorStop(0.55, '#e8f3fa');
  sky.addColorStop(1, '#f7fbfd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // 먼 건물
  ctx.fillStyle = 'rgba(176,192,202,0.55)';
  for (let i = 0; i < 12; i++) {
    const bw = 40 + Math.random() * 90;
    const bh = 80 + Math.random() * 180;
    ctx.fillRect(Math.random() * w, h * 0.42 - bh + 120, bw, bh);
  }
  // 나무
  const greens = ['rgba(112,146,92,0.85)', 'rgba(92,126,76,0.9)', 'rgba(130,162,106,0.8)'];
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = greens[i % greens.length];
    const x = Math.random() * w;
    const y = h * 0.5 + Math.random() * 150;
    const r = 50 + Math.random() * 120;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(70,96,60,0.5)';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(Math.random() * w, h * 0.62 + Math.random() * 120, 8 + Math.random() * 14, 120);
  }
  // 창문 유리에 비치는 빛 번짐
  const glow = ctx.createRadialGradient(w * 0.3, h * 0.25, 20, w * 0.3, h * 0.25, 380);
  glow.addColorStop(0, 'rgba(255,255,255,0.75)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** 책등(스파인) 디테일 — 라벨·밴드·질감 (인스턴스 색으로 틴트) */
export function makeSpineTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f6f1e6';
  ctx.fillRect(0, 0, w, h);

  // 좌우 곡률 음영
  const shade = ctx.createLinearGradient(0, 0, w, 0);
  shade.addColorStop(0, 'rgba(30,22,14,0.32)');
  shade.addColorStop(0.18, 'rgba(255,255,255,0.12)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  shade.addColorStop(0.82, 'rgba(255,255,255,0.1)');
  shade.addColorStop(1, 'rgba(30,22,14,0.34)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  // 상하 밴드
  ctx.fillStyle = 'rgba(55,44,32,0.55)';
  ctx.fillRect(0, 16, w, 7);
  ctx.fillRect(0, h - 26, w, 6);

  // 라벨
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(12, 52, w - 24, 58);
  ctx.strokeStyle = 'rgba(70,58,44,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 52, w - 24, 58);
  ctx.fillStyle = 'rgba(55,45,35,0.55)';
  ctx.fillRect(20, 66, w - 40, 4);
  ctx.fillRect(20, 78, w - 52, 4);
  ctx.fillRect(20, 90, w - 34, 4);

  // 제목 획
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(45,36,26,${0.28 + i * 0.04})`;
    ctx.fillRect(30, 132 + i * 18, w - 60, 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
