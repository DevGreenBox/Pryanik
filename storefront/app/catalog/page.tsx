import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, getCategories, type ProductListItem } from '@/lib/api';
import { ProductCard } from '@/components/product-card';

export const metadata: Metadata = { title: 'Каталог' };

// Каталог рендерится из живых данных при каждом запросе (свежие цены/остатки).
export const dynamic = 'force-dynamic';

type SortKey = 'pop' | 'cheap' | 'exp' | 'disc';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'pop', label: 'Популярные' },
  { key: 'cheap', label: 'Сначала дешёвые' },
  { key: 'exp', label: 'Сначала дорогие' },
  { key: 'disc', label: 'По скидке' },
];

function num(v: string | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Сортировка в компоненте: у API нет параметра sort и рейтинга (docs/21 §1). */
function sortProducts(items: ProductListItem[], sort: SortKey): ProductListItem[] {
  const arr = [...items];
  switch (sort) {
    case 'cheap':
      return arr.sort((a, b) => num(a.price) - num(b.price));
    case 'exp':
      return arr.sort((a, b) => num(b.price) - num(a.price));
    case 'disc':
      return arr.sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0));
    case 'pop':
    default:
      // «Популярные» ≈ хиты вперёд (рейтинга в API нет), дальше исходный порядок.
      return arr.sort((a, b) => Number(b.isFeatured ?? false) - Number(a.isFeatured ?? false));
  }
}

function hrefWith(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/catalog?${s}` : '/catalog';
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cat = typeof sp.cat === 'string' ? sp.cat : undefined;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const rawSort = typeof sp.sort === 'string' ? sp.sort : 'pop';
  const sort: SortKey = SORTS.some((s) => s.key === rawSort) ? (rawSort as SortKey) : 'pop';

  // Фильтры категории/поиска — на стороне API (docs/21 §1: category, q).
  const [products, categories] = await Promise.all([
    getProducts({ category: cat, q, limit: 100 }),
    getCategories(),
  ]);
  const list = sortProducts(products, sort);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Каталог
          </nav>
          <h1>Каталог пряников</h1>
          <p>Имбирные пряники-топперы ручной работы. Выберите тему, отсортируйте по цене или скидке.</p>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="cat-toolbar">
            {/* Поиск */}
            <form className="cat-search" action="/catalog" method="get">
              {cat && <input type="hidden" name="cat" value={cat} />}
              {sort !== 'pop' && <input type="hidden" name="sort" value={sort} />}
              <input
                type="search"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Поиск: динозаврики, машинки, единорог…"
                aria-label="Поиск по каталогу"
              />
              <button className="btn primary" type="submit">Найти</button>
            </form>

            {/* Чипы категорий */}
            <div className="chips" aria-label="Категории">
              <Link className={`chip${!cat ? ' is-active' : ''}`} href={hrefWith({ q, sort: sort !== 'pop' ? sort : undefined })}>
                Все
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  className={`chip${cat === c.slug ? ' is-active' : ''}`}
                  href={hrefWith({ cat: c.slug, q, sort: sort !== 'pop' ? sort : undefined })}
                >
                  {c.name}
                </Link>
              ))}
            </div>

            {/* Сортировка */}
            <div className="chips" aria-label="Сортировка">
              <span className="cat-sort-label">Сортировка:</span>
              {SORTS.map((s) => (
                <Link
                  key={s.key}
                  className={`chip${sort === s.key ? ' is-active' : ''}`}
                  href={hrefWith({ cat, q, sort: s.key !== 'pop' ? s.key : undefined })}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Грид товаров */}
          {list.length > 0 ? (
            <>
              <p className="muted" style={{ margin: '8px 0 16px' }}>Найдено: {list.length}</p>
              <div className="product-grid grid-4">
                {list.map((p, i) => (
                  <ProductCard key={p.slug} p={p} index={i} />
                ))}
              </div>
            </>
          ) : (
            <div className="info-card t-honey" style={{ maxWidth: 560 }}>
              <span className="ic-ico">🍪</span>
              <h3>Ничего не найдено</h3>
              <p>
                Попробуйте изменить запрос или{' '}
                <Link href="/catalog">сбросить фильтры</Link>.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
