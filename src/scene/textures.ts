import * as THREE from 'three';

/** 절차적 나무 바닥 텍스처 */
export function makeWoodTexture(base = '#8a5a35', plank = 128): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += plank) {
    const shade = 0.86 + Math.random() * 0.2;
    ctx.fillStyle = `rgba(0,0,0,${(1 - shade) * 0.8})`;
    ctx.fillRect(0, y, size, plank);

    // 나뭇결
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = `rgba(30,18,10,${0.03 + Math.random() * 0.07})`;
      ctx.lineWidth = 1 + Math.random() * 1.6;
      ctx.beginPath();
      const yy = y + Math.random() * plank;
      ctx.moveTo(0, yy);
      for (let x = 0; x <= size; x += 24) {
        ctx.lineTo(x, yy + Math.sin((x + y) * 0.02) * 2.2 + (Math.random() - 0.5) * 1.6);
      }
      ctx.stroke();
    }

    // 이음선
    ctx.fillStyle = 'rgba(20,12,6,0.35)';
    ctx.fillRect(0, y, size, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 벽면 사인 텍스처 */
export function makeSignTexture(title: string, sub: string): THREE.CanvasTexture {
  const w = 1024;
  const h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(217,168,108,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, w - 3, h - 3);

  ctx.fillStyle = '#f2e4cd';
  ctx.font = '600 72px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, 84);

  ctx.fillStyle = '#c8a06a';
  ctx.font = '400 30px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(sub, w / 2, 150);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** 서가 라벨 텍스처 (KDC 분류 표찰) */
export function makeLabelTexture(main: string, sub: string): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1712';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c8a06a';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  ctx.fillStyle = '#f2e4cd';
  ctx.font = '600 58px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(main, 28, 62);

  ctx.fillStyle = '#c8a06a';
  ctx.font = '400 34px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(sub, 30, 118);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
