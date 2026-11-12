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
  ctx.font = '700 48px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  const max = 400;
  let text = label;
  while (ctx.measureText(text).width > max && text.length > 2) text = `${text.slice(0, -2)}…`;
  ctx.fillText(text, 24, 66);

  ctx.fillStyle = '#6b6f74';
  ctx.font = '500 30px "Pretendard", sans-serif';
  ctx.fillText(sub, 26, 114);

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
