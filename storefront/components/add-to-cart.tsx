'use client';

import { useState } from 'react';
import { addItem, type CartLine } from '@/lib/cart';

/**
 * Кнопка «В корзину» на карточке товара. Кладёт выбор в клиентскую корзину
 * (localStorage `yp_cart`); цены/итоги считает сервер при `/cart/quote`.
 */
export function AddToCart({ item }: { item: Omit<CartLine, 'qty'> }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(item, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="add-to-cart" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
      <div className="qty" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Уменьшить количество"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span aria-live="polite" style={{ minWidth: 24, textAlign: 'center' }}>{qty}</span>
        <button
          type="button"
          className="icon-btn"
          aria-label="Увеличить количество"
          onClick={() => setQty((q) => q + 1)}
        >
          +
        </button>
      </div>
      <button type="button" className="btn primary" onClick={handleAdd}>
        {added ? '✓ Добавлено' : 'В корзину'}
      </button>
    </div>
  );
}
