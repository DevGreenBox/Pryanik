'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  readCart,
  setQty,
  removeItem,
  clearCart,
  onCartChange,
  type CartLine,
} from '@/lib/cart';
import {
  quoteCart,
  createOrder,
  paymentInit,
  cdekCities,
  cdekPvz,
  formatPrice,
  type QuoteResult,
  type CdekCity,
  type CdekPvz,
  type DeliveryInput,
} from '@/lib/api';

type DeliveryMode = 'pickup' | 'pvz' | 'door';

function itemsForApi(lines: CartLine[]) {
  return lines.map((l) => ({ productId: l.productId, qty: l.qty }));
}

export function CartClient() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);

  // Доставка
  const [mode, setMode] = useState<DeliveryMode>('pickup');
  const [cityQuery, setCityQuery] = useState('');
  const [cityOptions, setCityOptions] = useState<CdekCity[]>([]);
  const [city, setCity] = useState<CdekCity | null>(null);
  const [pvzList, setPvzList] = useState<CdekPvz[]>([]);
  const [pvzCode, setPvzCode] = useState('');
  const [address, setAddress] = useState('');

  // Промокод и расчёт
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  // Оформление
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Гидратация корзины из localStorage + подписка на изменения.
  useEffect(() => {
    setLines(readCart());
    setHydrated(true);
    return onCartChange(() => setLines(readCart()));
  }, []);

  const deliveryInput = useCallback((): DeliveryInput | undefined => {
    if (mode === 'pickup') return { type: 'pickup' };
    if (!city) return undefined;
    if (mode === 'pvz') {
      if (!pvzCode) return undefined;
      return { type: 'pvz', city: city.name, cityCode: city.code, pvzCode };
    }
    if (!address.trim()) return undefined;
    return { type: 'door', city: city.name, cityCode: city.code, address: address.trim() };
  }, [mode, city, pvzCode, address]);

  // Пересчёт корзины на сервере при изменении состава/промокода/доставки.
  const recalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    if (recalcRef.current) clearTimeout(recalcRef.current);
    recalcRef.current = setTimeout(async () => {
      setQuoting(true);
      setQuoteError(null);
      const res = await quoteCart({
        items: itemsForApi(lines),
        promoCode: promo || undefined,
        delivery: deliveryInput(),
      });
      setQuoting(false);
      if (res.ok) setQuote(res.data);
      else {
        setQuote(null);
        setQuoteError(res.message || 'Не удалось рассчитать корзину.');
      }
    }, 350);
    return () => {
      if (recalcRef.current) clearTimeout(recalcRef.current);
    };
  }, [hydrated, lines, promo, deliveryInput]);

  // Автокомплит города СДЭК.
  const cityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode === 'pickup') return;
    if (cityQuery.trim().length < 2 || (city && city.name === cityQuery)) {
      return;
    }
    if (cityRef.current) clearTimeout(cityRef.current);
    cityRef.current = setTimeout(async () => {
      const res = await cdekCities(cityQuery.trim(), 8);
      if (res.ok) setCityOptions(res.data);
    }, 300);
    return () => {
      if (cityRef.current) clearTimeout(cityRef.current);
    };
  }, [cityQuery, mode, city]);

  async function pickCity(c: CdekCity) {
    setCity(c);
    setCityQuery(c.name);
    setCityOptions([]);
    setPvzCode('');
    if (mode === 'pvz') {
      const res = await cdekPvz(c.code);
      setPvzList(res.ok ? res.data : []);
    }
  }

  const subtotalLocal = useMemo(
    () => lines.reduce((s, l) => s + Number(l.price) * l.qty, 0),
    [lines],
  );

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setOrderError(null);
    const delivery = deliveryInput();
    if (!delivery) {
      setOrderError('Укажите способ и данные доставки.');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setOrderError('Заполните имя и телефон.');
      return;
    }
    setPlacing(true);
    const res = await createOrder({
      items: itemsForApi(lines),
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim() || undefined },
      delivery,
      // Онлайн-оплата (шлюз Т-Банк в mock). Значение из enum заказа платформы:
      // unset|cod|card|sbp|cdek_pay|invoice. Сама оплата инициируется /payments/tbank/init.
      paymentMethod: 'card',
      promoCode: promo || undefined,
      comment: comment.trim() || undefined,
      idempotencyKey: `${phone.trim()}-${lines.map((l) => l.productId + 'x' + l.qty).join('_')}`,
    });
    if (!res.ok) {
      setPlacing(false);
      setOrderError(res.message || 'Не удалось оформить заказ. Проверьте данные.');
      return;
    }
    const { number, accessToken } = res.data;
    clearCart();
    // Инициируем оплату (mock) → редирект на paymentUrl; при неудаче — на трекинг.
    const pay = await paymentInit({ orderNumber: number, accessToken });
    if (pay.ok && pay.data.paymentUrl) {
      window.location.href = pay.data.paymentUrl;
      return;
    }
    router.push(`/order/${encodeURIComponent(number)}?token=${encodeURIComponent(accessToken)}`);
  }

  if (!hydrated) {
    return <p className="muted">Загружаем корзину…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="cart-empty info-card t-honey" style={{ maxWidth: 560 }}>
        <span className="ic-ico">🛒</span>
        <h3>Корзина пуста</h3>
        <p>
          Загляните в <Link href="/catalog">каталог</Link> — там 14 тем пряников на торт.
        </p>
      </div>
    );
  }

  return (
    <div className="cart-grid">
      {/* Список позиций */}
      <div className="cart-list">
        {lines.map((l) => (
          <div className="cart-item" key={l.productId}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.imageUrl} alt={l.name} width={72} height={72} loading="lazy" />
            <div style={{ flex: 1 }}>
              <Link href={`/product/${l.slug}`}><b>{l.name}</b></Link>
              <div className="ci-price">{formatPrice(l.price)}</div>
            </div>
            <div className="qty" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <button type="button" className="icon-btn" aria-label="Меньше" onClick={() => setQty(l.productId, l.qty - 1)}>−</button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>{l.qty}</span>
              <button type="button" className="icon-btn" aria-label="Больше" onClick={() => setQty(l.productId, l.qty + 1)}>+</button>
            </div>
            <button type="button" className="icon-btn" aria-label="Удалить" onClick={() => removeItem(l.productId)}>✕</button>
          </div>
        ))}

        {/* Промокод */}
        <div className="form-card" style={{ marginTop: 16 }}>
          <label htmlFor="promo"><b>Промокод</b></label>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              id="promo"
              style={{ flex: 1, minWidth: 0 }}
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="PRYANIK10 / WB15"
            />
            <button type="button" className="btn ghost" style={{ flex: 'none' }} onClick={() => setPromo(promoInput.trim())}>Применить</button>
          </div>
          {quote?.promo?.code && (
            <p className={quote.promo.valid ? 'in-stock' : 'out-stock'} style={{ marginTop: 8 }}>
              {quote.promo.valid
                ? `Промокод ${quote.promo.code}: −${formatPrice(quote.promo.discountTotal)}`
                : `Промокод ${quote.promo.code} недействителен`}
            </p>
          )}
        </div>

        {/* Доставка */}
        <div className="form-card" style={{ marginTop: 16 }}>
          <b>Доставка</b>
          <div className="chips" style={{ marginTop: 8 }}>
            {(['pickup', 'pvz', 'door'] as DeliveryMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`chip${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m === 'pickup' ? 'Самовывоз (Москва)' : m === 'pvz' ? 'ПВЗ СДЭК' : 'Курьер СДЭК'}
              </button>
            ))}
          </div>

          {mode !== 'pickup' && (
            <div className="field" style={{ marginTop: 12, position: 'relative' }}>
              <label htmlFor="city">Город</label>
              <input
                id="city"
                value={cityQuery}
                onChange={(e) => { setCityQuery(e.target.value); setCity(null); }}
                placeholder="Начните вводить: Москва, Санкт-Петербург…"
                autoComplete="off"
              />
              {cityOptions.length > 0 && !city && (
                <ul className="autocomplete" style={{ listStyle: 'none', margin: 0, padding: 0, top: '100%' }}>
                  {cityOptions.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        className="ac-item"
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
                        onClick={() => pickCity(c)}
                      >
                        {c.name}{c.region ? `, ${c.region}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {mode === 'pvz' && city && (
            <div className="field" style={{ marginTop: 12 }}>
              <label htmlFor="pvz">Пункт выдачи</label>
              <select id="pvz" value={pvzCode} onChange={(e) => setPvzCode(e.target.value)}>
                <option value="">— выберите ПВЗ —</option>
                {pvzList.map((p) => (
                  <option key={p.code} value={p.code}>{p.name} — {p.address}</option>
                ))}
              </select>
              {pvzList.length === 0 && <p className="muted" style={{ marginTop: 6 }}>ПВЗ не найдены для этого города.</p>}
            </div>
          )}

          {mode === 'door' && city && (
            <div className="field" style={{ marginTop: 12 }}>
              <label htmlFor="addr">Адрес доставки</label>
              <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="улица, дом, квартира" />
            </div>
          )}
        </div>
      </div>

      {/* Итоги + оформление */}
      <aside className="cart-summary form-card" style={{ alignSelf: 'start' }}>
        <h3>Итого</h3>
        {quoting && <p className="muted">Пересчитываем…</p>}
        {quoteError && <p className="out-stock">{quoteError}</p>}
        <dl className="totals" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }}>
          <dt>Товары</dt>
          <dd>{formatPrice(quote?.itemsTotal ?? subtotalLocal)}</dd>
          {quote && Number(quote.discountTotal) > 0 && (
            <>
              <dt>Скидка</dt>
              <dd>−{formatPrice(quote.discountTotal)}</dd>
            </>
          )}
          <dt>Доставка</dt>
          <dd>{quote ? (Number(quote.deliveryTotal) > 0 ? formatPrice(quote.deliveryTotal) : 'бесплатно') : '—'}</dd>
          <dt><b>К оплате</b></dt>
          <dd><b>{formatPrice(quote?.grandTotal ?? subtotalLocal)}</b></dd>
        </dl>
        {quote?.issues && quote.issues.length > 0 && (
          <ul className="out-stock" style={{ marginTop: 8 }}>
            {quote.issues.map((i, k) => <li key={k}>{i}</li>)}
          </ul>
        )}

        <form onSubmit={placeOrder} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="field">
            <label htmlFor="co-name">Имя *</label>
            <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Как к вам обращаться" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="co-phone">Телефон *</label>
            <input id="co-phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 …" inputMode="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="co-email">E-mail (для трекинга)</label>
            <input id="co-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="co-comment">Комментарий к заказу</label>
            <textarea id="co-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Пожелания, желаемая дата…" rows={2} />
          </div>
          {orderError && <p className="out-stock">{orderError}</p>}
          <button type="submit" className="btn primary block" disabled={placing}>
            {placing ? 'Оформляем…' : 'Оформить и оплатить'}
          </button>
          <p className="muted" style={{ fontSize: 13 }}>
            Оплата онлайн СДЭК Pay (в демо — тестовая страница). Итоги считает сервер.
          </p>
        </form>
      </aside>
    </div>
  );
}
