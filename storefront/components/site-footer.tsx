import Link from 'next/link';

/** Футер витрины — разметка/классы 1:1 из макета (index.html). */
export function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="foot-brand">
          <Link className="brand" href="/">
            <span className="brand-seal" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="20" cy="20" r="15" />
                <circle cx="20" cy="20" r="9" strokeDasharray="0.5 4" strokeLinecap="round" strokeWidth="2.6" />
                <circle cx="20" cy="20" r="2.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Яркий пряник
          </Link>
          <p>Имбирные пряники ручной работы на торт и в подарок. Печём с любовью, отправляем по России.</p>
        </div>
        <nav className="foot-col" aria-label="Магазин">
          <b>Магазин</b>
          <Link href="/catalog">Каталог</Link>
          <Link href="/custom">Под заказ</Link>
          <Link href="/corporate">Оптом</Link>
        </nav>
        <nav className="foot-col" aria-label="Покупателю">
          <b>Покупателю</b>
          <Link href="/delivery">Доставка и оплата</Link>
          <Link href="/contacts">Контакты</Link>
          <Link href="/cart">Корзина</Link>
        </nav>
      </div>
      <div className="wrap foot-bottom">
        <small>© {new Date().getFullYear()} Яркий пряник</small>
        <small>Москва · доставка по России</small>
      </div>
    </footer>
  );
}
