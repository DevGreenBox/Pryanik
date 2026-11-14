import Link from 'next/link';

/**
 * Заглушка страницы в дизайн-каркасе макета: page-hero с хлебными крошками
 * и заголовком (как на внутренних страницах Pryanik) + секция «в разработке».
 * Контент страниц придёт следующим этапом (данные — из Storefront API Admik).
 */
export function PageStub({
  title,
  lede,
  crumb,
  crumbParent,
  children,
}: {
  /** Заголовок h1 страницы (как в макете). */
  title: string;
  /** Подводка под заголовком. */
  lede?: string;
  /** Текст текущей крошки (по умолчанию = title). */
  crumb?: string;
  /** Промежуточная крошка-родитель (например, Каталог для страницы товара). */
  crumbParent?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            {crumbParent && (
              <>
                <Link href={crumbParent.href}>{crumbParent.label}</Link>
                <span>/</span>
              </>
            )}
            {crumb ?? title}
          </nav>
          <h1>{title}</h1>
          {lede && <p>{lede}</p>}
        </div>
      </section>
      <section>
        <div className="wrap">
          {children ?? (
            <div className="info-card t-honey" style={{ maxWidth: 560 }}>
              <span className="ic-ico">🍪</span>
              <h3>Раздел в разработке</h3>
              <p>
                Мы уже печём эту страницу — совсем скоро здесь появится контент.
                А пока загляните в <Link href="/catalog">каталог</Link>.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
