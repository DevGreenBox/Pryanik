import type { Metadata, Viewport } from 'next';
import { Comfortaa, Nunito } from 'next/font/google';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

// Шрифты макета — через next/font/google (self-hosted, без запросов к Google
// в рантайме). Переменные пробрасываются в --display/--body в globals.css.
const comfortaa = Comfortaa({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-comfortaa',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const FAVICON =
  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23F0592B"/><circle cx="50" cy="50" r="30" fill="none" stroke="%23FFE3A6" stroke-width="6" stroke-dasharray="1 12" stroke-linecap="round"/><circle cx="50" cy="50" r="9" fill="%23FFE3A6"/></svg>';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Яркий пряник — имбирные пряники ручной работы на торт',
    template: '%s — Яркий пряник',
  },
  description:
    'Яркий пряник — имбирные пряники ручной работы на торт и в подарок. Готовый каталог, пряники под заказ по эскизу и корпоративные подарки. Доставка СДЭК по России.',
  icons: { icon: FAVICON },
  openGraph: {
    type: 'website',
    siteName: 'Яркий пряник',
    locale: 'ru_RU',
    title: 'Яркий пряник — имбирные пряники ручной работы на торт',
    description:
      'Яркий пряник — имбирные пряники ручной работы на торт и в подарок. Готовый каталог, пряники под заказ по эскизу и корпоративные подарки. Доставка СДЭК по России.',
    images: ['/media/products/174032047.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Яркий пряник — имбирные пряники ручной работы на торт',
    description:
      'Яркий пряник — имбирные пряники ручной работы на торт и в подарок. Готовый каталог, пряники под заказ по эскизу и корпоративные подарки. Доставка СДЭК по России.',
    images: ['/media/products/174032047.webp'],
  },
  robots: process.env.STOREFRONT_NOINDEX
    ? { index: false, follow: false }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: '#F0592B',
};

/** SVG-спрайт пряничных иконок макета (используется плитками категорий). */
function CookieSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="ck-heart" viewBox="0 0 100 100">
          <path d="M50 84C22 64 18 40 30 30c9-8 20-2 20 8 0-10 11-16 20-8 12 10 8 34-20 54z" fill="#C08149" />
          <circle cx="50" cy="52" r="4" fill="#FFFCF4" />
        </symbol>
        <symbol id="ck-star" viewBox="0 0 100 100">
          <path d="M50 12l10 24 26 2-20 17 6 25-22-14-22 14 6-25-20-17 26-2z" fill="#C08149" />
          <circle cx="50" cy="46" r="4" fill="#FFFCF4" />
        </symbol>
        <symbol id="ck-man" viewBox="0 0 100 100">
          <circle cx="50" cy="26" r="13" fill="#C08149" />
          <path d="M50 38c12 0 16 8 16 18 0 8-2 12-2 18l6 10-10 2-6-8h-8l-6 8-10-2 6-10c0-6-2-10-2-18 0-10 4-18 16-18z" fill="#C08149" />
          <path d="M22 52l14 6M78 52l-14 6" stroke="#C08149" strokeWidth="7" strokeLinecap="round" />
          <circle cx="45" cy="25" r="2.4" fill="#FFFCF4" />
          <circle cx="55" cy="25" r="2.4" fill="#FFFCF4" />
        </symbol>
        <symbol id="ck-flower" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="34" fill="#C08149" />
          <circle cx="50" cy="50" r="26" fill="none" stroke="#FFFCF4" strokeWidth="2.5" strokeDasharray="0.1 7" strokeLinecap="round" />
          <g fill="#FFFCF4">
            <circle cx="50" cy="34" r="4" />
            <circle cx="50" cy="66" r="4" />
            <circle cx="34" cy="50" r="4" />
            <circle cx="66" cy="50" r="4" />
            <circle cx="50" cy="50" r="5" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${comfortaa.variable} ${nunito.variable}`}>
      <body id="top">
        <a className="skip-link" href="#main">К содержимому</a>
        <CookieSprite />
        <div className="promo">🍯 Бесплатная доставка от 2000 ₽ по России · оплата онлайн СДЭК Pay</div>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
