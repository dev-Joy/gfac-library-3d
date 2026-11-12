/** 드래그 시선과 책 클릭을 구분하기 위한 공유 상태 */
export const dragState = { moved: false };

/** 모바일 가상 조이스틱 입력 (−1…1) */
export const touchInput = { x: 0, y: 0 };

/** 포인터 락(마우스 시선 고정) 상태 — HUD 토글 버튼이 구독한다. */
export const lookState = { locked: false };

type LookListener = (locked: boolean) => void;
const lookListeners = new Set<LookListener>();

let lookTarget: HTMLElement | null = null;

export const registerLookTarget = (el: HTMLElement | null) => {
  lookTarget = el;
};

export const setLookLocked = (locked: boolean) => {
  if (lookState.locked === locked) return;
  lookState.locked = locked;
  for (const listener of lookListeners) listener(locked);
};

export const subscribeLook = (listener: LookListener) => {
  lookListeners.add(listener);
  return () => {
    lookListeners.delete(listener);
  };
};

/**
 * 포인터 락을 요청한다. iframe·헤드리스·권한 거부 등으로 실패하면 false를 돌려주고
 * 호출부는 기존 드래그 시선을 그대로 폴백으로 사용한다.
 */
export const requestLookLock = async (): Promise<boolean> => {
  const el = lookTarget;
  if (!el || typeof el.requestPointerLock !== 'function') return false;
  try {
    await el.requestPointerLock();
    return document.pointerLockElement === el;
  } catch {
    return false;
  }
};

export const exitLookLock = () => {
  if (document.pointerLockElement) document.exitPointerLock();
};
