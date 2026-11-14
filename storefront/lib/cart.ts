'use client';

/**
 * Клиентская корзина витрины «Яркий пряник».
 *
 * Совместимо с макетом: хранение в localStorage под ключом `yp_cart`, изменения
 * транслируются событием `yp:cart` (чтобы шапка/бейдж обновлялись без перезагрузки).
 *
 * Источник ИСТИНЫ по ценам/итогам — сервер (`POST /cart/quote`, anti-tamper).
 * Здесь `price` хранится ТОЛЬКО для мгновенного отображения; при расчёте корзины
 * и оформлении на сервер уходит лишь выбор покупателя (`productId` + `qty`).
 */

export const CART_KEY = 'yp_cart';
export const CART_EVENT = 'yp:cart';

export interface CartLine {
  /** UUID товара из карточки (`GET /products/:slug`) — нужен для `/cart/quote`. */
  productId: string;
  slug: string;
  name: string;
  /** Цена в рублях строкой (кэш для отображения; сервер пересчитывает сам). */
  price: string;
  imageUrl: string;
  qty: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function readCart(): CartLine[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => l && typeof l.productId === 'string' && typeof l.qty === 'number')
      .map((l) => ({ ...l, qty: Math.max(1, Math.floor(l.qty)) }));
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

/** Добавляет товар (или увеличивает qty существующей строки). */
export function addItem(line: Omit<CartLine, 'qty'>, qty = 1): void {
  const lines = readCart();
  const existing = lines.find((l) => l.productId === line.productId);
  if (existing) {
    existing.qty += qty;
  } else {
    lines.push({ ...line, qty: Math.max(1, qty) });
  }
  writeCart(lines);
}

export function setQty(productId: string, qty: number): void {
  const lines = readCart();
  const line = lines.find((l) => l.productId === productId);
  if (!line) return;
  if (qty <= 0) {
    writeCart(lines.filter((l) => l.productId !== productId));
  } else {
    line.qty = Math.floor(qty);
    writeCart(lines);
  }
}

export function removeItem(productId: string): void {
  writeCart(readCart().filter((l) => l.productId !== productId));
}

export function clearCart(): void {
  writeCart([]);
}

export function cartCount(lines = readCart()): number {
  return lines.reduce((s, l) => s + l.qty, 0);
}

/** Подписка на изменения корзины (событие `yp:cart` + storage из других вкладок). */
export function onCartChange(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
