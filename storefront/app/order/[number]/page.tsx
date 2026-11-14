import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrder, formatPrice } from '@/lib/api';

type Params = Promise<{ number: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { number } = await params;
  return { title: `Заказ ${decodeURIComponent(number)}`, robots: { index: false, follow: false } };
}

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'Готовится',
  shipped: 'Передан в доставку',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

function label(v: string | undefined): string {
  if (!v) return '—';
  return STATUS_LABELS[v] ?? v;
}

export default async function OrderPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { number } = await params;
  const sp = await searchParams;
  const orderNumber = decodeURIComponent(number);
  const token = typeof sp.token === 'string' ? sp.token : '';
  const order = token ? await getOrder(orderNumber, token) : null;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Заказ {orderNumber}
          </nav>
          <h1>Заказ {orderNumber}</h1>
        </div>
      </section>

      <section>
        <div className="wrap">
          {!order ? (
            <div className="info-card t-honey" style={{ maxWidth: 560 }}>
              <span className="ic-ico">🔎</span>
              <h3>Заказ не найден</h3>
              <p>
                Проверьте ссылку из письма/СМС — трекинг доступен только по вашему защищённому токену.
                Вернуться в <Link href="/catalog">каталог</Link>.
              </p>
            </div>
          ) : (
            <div className="order-card form-card" style={{ maxWidth: 720 }}>
              <div className="order-status" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                <div><span className="muted">Статус</span><br /><b>{label(order.status)}</b></div>
                <div><span className="muted">Оплата</span><br /><b>{label(order.paymentStatus)}</b></div>
                {order.deliveryStatus && <div><span className="muted">Доставка</span><br /><b>{label(order.deliveryStatus)}</b></div>}
                <div><span className="muted">Сумма</span><br /><b>{formatPrice(order.grandTotal)}</b></div>
              </div>

              <h3>Состав</h3>
              <ul className="order-items" style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
                {order.items.map((it, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span>{it.name} × {it.qty}</span>
                    <span>{formatPrice(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>

              {order.delivery && (
                <>
                  <h3>Доставка</h3>
                  <p>
                    {order.delivery.type === 'pvz' ? 'ПВЗ СДЭК' : order.delivery.type === 'door' ? 'Курьер СДЭК' : 'Самовывоз'}
                    {order.delivery.address ? ` · ${order.delivery.address}` : ''}
                  </p>
                  {order.delivery.trackingUrl && (
                    <p><a className="btn ghost" href={order.delivery.trackingUrl} target="_blank" rel="noreferrer">Отследить в СДЭК</a></p>
                  )}
                </>
              )}

              <p style={{ marginTop: 20 }}>
                <Link className="btn primary" href="/catalog">Продолжить покупки</Link>
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
