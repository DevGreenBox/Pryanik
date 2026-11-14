import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, formatPrice } from '@/lib/api';
import { AddToCart } from '@/components/add-to-cart';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Товар не найден' };
  return {
    title: p.meta?.title || p.name,
    description: p.meta?.description || p.description || undefined,
    robots: p.meta?.noindex ? { index: false, follow: false } : undefined,
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const media = (p.media && p.media.length > 0
    ? p.media
    : [{ url: p.imageUrl ?? '/media/products/placeholder.webp', alt: p.name, isPrimary: true }]);
  const primary = media.find((m) => m.isPrimary) ?? media[0];

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            <Link href="/catalog">Каталог</Link>
            <span>/</span>
            {p.name}
          </nav>
        </div>
      </section>

      <section className="pdp">
        <div className="wrap">
          <div className="pdp-grid">
            {/* Галерея */}
            <div className="gallery">
              <div className="gallery-strip">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primary.url} alt={primary.alt ?? p.name} />
              </div>
              {media.length > 1 && (
                <div className="g-thumbs">
                  {media.map((m, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} className="g-thumb" src={m.url} alt={m.alt ?? p.name} loading="lazy" />
                  ))}
                </div>
              )}
            </div>

            {/* Инфо */}
            <div>
              <h1>{p.name}</h1>
              <div className="pdp-price">
                <b>{formatPrice(p.price)}</b>
                {p.compareAtPrice ? <s>{formatPrice(p.compareAtPrice)}</s> : null}
                {p.onSale && p.discountPct ? <span className="disc">−{p.discountPct}%</span> : null}
              </div>

              <p className={p.inStock ? 'in-stock' : 'out-stock'}>
                {p.inStock ? `В наличии${p.availableQty ? ` · ${p.availableQty} шт` : ''}` : 'Под заказ'}
              </p>

              <AddToCart
                item={{
                  productId: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  imageUrl: primary.url,
                }}
              />

              {p.description && (
                <div className="pdp-desc" style={{ marginTop: 20 }}>
                  <h3>Описание</h3>
                  <p>{p.description}</p>
                </div>
              )}
            </div>
          </div>

          <p style={{ marginTop: 32 }}>
            <Link className="btn ghost" href="/catalog">← Ко всему каталогу</Link>
          </p>
        </div>
      </section>
    </>
  );
}
