'use client';

/**
 * Sticky-шапка витрины: логотип, навигация, корзина, бургер-меню.
 * Разметка/классы перенесены 1:1 из макета (index.html + app.js):
 *  - активная ссылка — по текущему пути (в макете — data-nav + сравнение href);
 *  - счётчик корзины читается из localStorage 'yp_cart' формата {"<id>": qty}
 *    и обновляется по событию 'yp:cart' (как YP.cartSave в products.js);
 *  - бургер открывает mobile-nav, блокирует скролл body, закрывается по
 *    Escape/клику по ссылке.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const NAV_LINKS = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/custom', label: 'Под заказ' },
  { href: '/corporate', label: 'Оптом' },
  { href: '/delivery', label: 'Доставка' },
  { href: '/contacts', label: 'Контакты' },
] as const;

const CART_KEY = 'yp_cart';

/** Сумма количеств в корзине из localStorage (формат {"<id>": qty}). */
function readCartCount(): number {
  try {
    const cart = JSON.parse(window.localStorage.getItem(CART_KEY) || '{}') as Record<string, number>;
    return Object.values(cart).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  } catch {
    return 0;
  }
}

/** Активна ли ссылка навигации (страницы товара подсвечивают «Каталог» — как в макете). */
function isActive(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (href === '/catalog' && pathname.startsWith('/product')) return true;
  return false;
}

function BrandSeal() {
  return (
    <span className="brand-seal" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="20" cy="20" r="15" />
        <circle cx="20" cy="20" r="9" strokeDasharray="0.5 4" strokeLinecap="round" strokeWidth="2.6" />
        <circle cx="20" cy="20" r="2.4" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}

function CartButton() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    const sync = () => setCount(readCartCount());
    const onCartEvent = () => {
      sync();
      // Перезапуск анимации «bump» (в макете — remove/add класса)
      setBump(false);
      requestAnimationFrame(() => setBump(true));
    };
    sync();
    mounted.current = true;
    window.addEventListener('yp:cart', onCartEvent);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('yp:cart', onCartEvent);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <Link className={`cart-btn${bump ? ' bump' : ''}`} href="/cart" aria-label="Корзина">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6L5 3H2" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
      <span className="cart-count" hidden={count === 0}>{count}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Блокировка скролла body при открытом меню (body.menu-open в макете)
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  // Escape закрывает меню
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, closeMenu]);

  // Навигация на другую страницу закрывает меню
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="top">
        <div className="wrap nav">
          <Link className="brand" href="/" aria-label="Яркий пряник — на главную">
            <BrandSeal />
            Яркий пряник
          </Link>
          <nav className="nav-links" aria-label="Основная навигация">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={isActive(pathname, href) ? 'active' : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-right">
            <CartButton />
            <button
              className={`burger${menuOpen ? ' is-open' : ''}`}
              type="button"
              aria-label="Меню"
              aria-expanded={menuOpen}
              aria-controls="mobileNav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
      <nav className={`mobile-nav${menuOpen ? ' open' : ''}`} id="mobileNav" aria-label="Мобильное меню">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(pathname, href) ? 'active' : undefined}
            onClick={closeMenu}
          >
            {href === '/delivery' ? 'Доставка и оплата' : label}
          </Link>
        ))}
      </nav>
    </>
  );
}
