import Link from 'next/link';
import { formatPrice, type ProductListItem } from '@/lib/api';

// Пресет пастельных плиток макета (класс `tile` презентационный — в API его нет,
// поэтому назначаем по индексу для визуального разнообразия, как в Pryanik).
const TILES = ['t-honey', 't-orange', 't-berry', 't-mint', 't-blue', 't-lilac'] as const;

export function tileFor(index: number): string {
  return TILES[index % TILES.length];
}

/** Бейдж карточки: скидка приоритетнее «хита»/«новинки» (как в макете). */
function Badge({ p }: { p: ProductListItem }) {
  if (p.onSale && p.discountPct) return <span className="badge sale">−{p.discountPct}%</span>;
  if (p.isFeatured) return <span className="badge hit">Хит</span>;
  if (p.isNew) return <span className="badge new">Новинка</span>;
  return null;
}

/**
 * Карточка товара в разметке макета (`.card`). Данные — из Storefront API
 * (`ProductListItem`). Клик по медиа/заголовку ведёт на карточку товара.
 * Кнопка «в корзину» подключается в клиентском слое (следующий слой Этапа 5).
 */
export function ProductCard({ p, index = 0 }: { p: ProductListItem; index?: number }) {
  const href = `/product/${p.slug}`;
  return (
    <article className={`card ${tileFor(index)}`}>
      <Link className="card-media-link" href={href} tabIndex={-1} aria-hidden="true">
        <div className="card-media">
          <Badge p={p} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl ?? '/media/products/placeholder.webp'} alt={p.name} loading="lazy" />
        </div>
      </Link>
      <div className="card-body">
        <Link className="card-title" href={href}>
          <h3>{p.name}</h3>
        </Link>
        <div className="price">
          <b>{formatPrice(p.price)}</b>
          {p.compareAtPrice ? <s>{formatPrice(p.compareAtPrice)}</s> : null}
        </div>
        <Link className="btn primary" href={href} style={{ width: '100%', justifyContent: 'center' }}>
          Подробнее
        </Link>
      </div>
    </article>
  );
}
