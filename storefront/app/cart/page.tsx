import type { Metadata } from 'next';
import Link from 'next/link';
import { CartClient } from '@/components/cart-client';

export const metadata: Metadata = { title: 'Корзина' };

export default function CartPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Корзина
          </nav>
          <h1>Корзина</h1>
          <p>Проверьте состав заказа, примените промокод, выберите доставку и оформите оплату.</p>
        </div>
      </section>
      <section>
        <div className="wrap">
          <CartClient />
        </div>
      </section>
    </>
  );
}
