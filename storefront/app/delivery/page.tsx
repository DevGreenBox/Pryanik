import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings, formatPrice } from '@/lib/api';

export const metadata: Metadata = { title: 'Доставка и оплата' };
export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const settings = await getSettings();
  const threshold = settings?.delivery?.freeDeliveryThreshold;
  const freeText = threshold ? `Бесплатная доставка от ${formatPrice(threshold)}.` : null;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Доставка и оплата
          </nav>
          <h1>Доставка и оплата</h1>
          <p>Доставляем пряники по всей России. Стоимость доставки считается автоматически при оформлении.</p>
        </div>
      </section>

      <section>
        <div className="wrap trust-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
          <div className="info-card t-honey">
            <span className="ic-ico">📦</span>
            <h3>СДЭК — ПВЗ и постаматы</h3>
            <p>Заберите заказ в удобном пункте выдачи. Стоимость и срок рассчитываются автоматически по вашему городу.</p>
          </div>
          <div className="info-card t-mint">
            <span className="ic-ico">🚚</span>
            <h3>Курьер СДЭК до двери</h3>
            <p>Доставим по адресу. Тариф и срок — на шаге оформления после выбора города.</p>
          </div>
          <div className="info-card t-berry">
            <span className="ic-ico">🏠</span>
            <h3>Самовывоз по Москве</h3>
            <p>Заберите заказ самостоятельно — бесплатно.</p>
          </div>
          <div className="info-card t-blue">
            <span className="ic-ico">💳</span>
            <h3>Оплата онлайн</h3>
            <p>Оплата картой/СБП онлайн при оформлении. {freeText}</p>
          </div>
        </div>

        <div className="wrap" style={{ marginTop: 24 }}>
          <p><Link className="btn primary" href="/catalog">Перейти в каталог</Link></p>
        </div>
      </section>
    </>
  );
}
