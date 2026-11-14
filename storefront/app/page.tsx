import Link from 'next/link';
import { getProducts, getCategories } from '@/lib/api';
import { ProductCard } from '@/components/product-card';
import { LeadForm } from '@/components/lead-form';

/**
 * Главная. Секции 1:1 из макета (Pryanik/index.html): hero, полоса преимуществ,
 * «два пути», категории (из Storefront API), гриды «Хиты»/«Новинки» (из API),
 * тизеры «под заказ»/«оптом» с видео, отзывы и форма заявки. Стили — globals.css
 * (перенесены из styles.css макета), иконки категорий — SVG-спрайт из layout.
 */
export const dynamic = 'force-dynamic';

// Плитки категорий: цвет-подложка + иконка спрайта, циклично по порядку категорий
// (совпадает с макетом: Мультгерои/Мальчикам/Девочкам/Разное).
const CAT_STYLE = [
  { tile: 't-orange', icon: 'ck-man' },
  { tile: 't-blue', icon: 'ck-star' },
  { tile: 't-berry', icon: 'ck-heart' },
  { tile: 't-mint', icon: 'ck-flower' },
] as const;

export default async function HomePage() {
  const [featuredRaw, freshRaw, pool, categories] = await Promise.all([
    getProducts({ featured: 1, limit: 8 }),
    getProducts({ new: 1, limit: 8 }),
    getProducts({ limit: 24 }),
    getCategories(),
  ]);

  // Блоки «Готовые пряники» и «Новинки» всегда показывают ровно по 4 карточки
  // (полный ряд grid-4). Берём помеченные товары, при нехватке дополняем из
  // общего пула, исключая уже показанные — без дублей между блоками.
  const takeFill = (base: typeof pool, exclude: Set<string>, n: number): typeof pool => {
    const out: typeof pool = [];
    const seen = new Set(exclude);
    for (const p of [...base, ...pool]) {
      if (out.length >= n) break;
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push(p);
    }
    return out;
  };
  const hits = takeFill(featuredRaw, new Set<string>(), 4);
  const news = takeFill(freshRaw, new Set(hits.map((p) => p.slug)), 4);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="pill-tag">⭐ 4.8 на Wildberries · печём каждый день</span>
            <h1>
              Пряники, которым <span className="hl">радуются</span>
            </h1>
            <p className="lede">
              Имбирные пряники-топперы ручной работы для детских тортов и праздников. Готовый каталог,
              пряники под заказ по вашему эскизу и корпоративные подарки с логотипом.
            </p>
            <div className="hero-cta">
              <Link className="btn primary" href="/catalog">В каталог</Link>
              <Link className="btn ghost" href="/custom">Заказать по эскизу</Link>
            </div>
            <ul className="hero-facts">
              <li><b>14+</b> готовых тем</li>
              <li><b>2 дня</b> на изготовление</li>
              <li><b>СДЭК</b> по всей России</li>
            </ul>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="blob b1"></span>
            <span className="blob b2"></span>
            <span className="blob b3"></span>
            <span className="cookie-disc d1 t-honey"><img src="/media/products/174032047.webp" alt="" /></span>
            <span className="cookie-disc d2 t-mint"><img src="/media/products/174038071.webp" alt="" /></span>
            <span className="cookie-disc d3 t-berry"><img src="/media/products/281031742.webp" alt="" /></span>
            <span className="cookie-disc d4 t-blue"><img src="/media/products/295888663.webp" alt="" /></span>
          </div>
        </div>
      </section>

      {/* Полоса преимуществ */}
      <section id="delivery-strip" className="trust-sec" style={{ paddingBlock: '8px 0' }}>
        <div className="wrap">
          <div className="trust-grid">
            <div className="trust-item"><span className="ti-ico">🚚</span><div><b>Доставка СДЭК</b><span>по России, расчёт автоматически</span></div></div>
            <div className="trust-item"><span className="ti-ico">💳</span><div><b>Оплата онлайн</b><span>СДЭК Pay, карты, СБП</span></div></div>
            <div className="trust-item"><span className="ti-ico">🍪</span><div><b>Свежая выпечка</b><span>печём под заказ</span></div></div>
            <div className="trust-item"><span className="ti-ico">💬</span><div><b>На связи</b><span>Telegram и почта</span></div></div>
          </div>
        </div>
      </section>

      {/* Как удобнее заказать — розница / опт */}
      <section className="paths-sec">
        <div className="wrap">
          <div className="sec-head">
            <h2>Как вам удобнее заказать</h2>
            <p>Розница — готовые наборы с доставкой. Опт — крупные партии на мероприятия и для бизнеса.</p>
          </div>
          <div className="paths">
            <Link className="path-card p-retail" href="/catalog">
              <span className="path-ico">🛒</span>
              <h3>Купить готовые</h3>
              <p>Наборы пряников-топперов из каталога — для торта, дня рождения и в подарок.</p>
              <ul className="path-list">
                <li>Доставка СДЭК по России</li>
                <li>Оплата онлайн и промокоды</li>
                <li>Отправляем за 2 дня</li>
              </ul>
              <span className="path-cta">В каталог →</span>
            </Link>
            <Link className="path-card p-b2b" href="/corporate">
              <span className="path-ico">📦</span>
              <h3>Заказать оптом</h3>
              <p>Крупные партии на мероприятия, корпоративные подарки с логотипом и опт для бизнеса.</p>
              <ul className="path-list">
                <li>Партии от 20 штук, цена по объёму</li>
                <li>Мероприятия, корпоратив, перепродажа</li>
                <li>Договор и документы для юрлиц</li>
              </ul>
              <span className="path-cta">Оптовый заказ →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Категории (из Storefront API) */}
      {categories.length > 0 && (
        <section className="cats">
          <div className="wrap">
            <div className="sec-head">
              <h2>Выберите, что по душе</h2>
            </div>
            <div className="cat-tiles">
              {categories.map((c, i) => {
                const s = CAT_STYLE[i % CAT_STYLE.length];
                return (
                  <Link key={c.slug} className={`cat-tile ${s.tile}`} href={`/catalog?cat=${encodeURIComponent(c.slug)}`}>
                    <span className="ct-ico">
                      <svg viewBox="0 0 100 100"><use href={`#${s.icon}`} /></svg>
                    </span>
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Хиты продаж */}
      {hits.length > 0 && (
        <section className="catalog">
          <div className="wrap">
            <div className="sec-head">
              <h2>Готовые пряники на торт</h2>
              <p>Самые популярные пряники-топперы — их заказывают чаще всего.</p>
            </div>
            <div className="product-grid grid-4">
              {hits.map((p, i) => (
                <ProductCard key={p.slug} p={p} index={i} />
              ))}
            </div>
            <div style={{ marginTop: 36, textAlign: 'center' }}>
              <Link className="btn primary" href="/catalog">Смотреть весь каталог</Link>
            </div>
          </div>
        </section>
      )}

      {/* Новинки */}
      {news.length > 0 && (
        <section>
          <div className="wrap">
            <div className="sec-head">
              <h2>Новинки</h2>
              <p>Свежие темы — недавно добавили в каталог.</p>
            </div>
            <div className="product-grid grid-4">
              {news.map((p, i) => (
                <ProductCard key={p.slug} p={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Пряник по эскизу */}
      <section className="custom">
        <div className="wrap custom-in">
          <div className="custom-copy">
            <h2>Пряник по вашему эскизу</h2>
            <p>Логотип, портрет, любимый герой или тематика праздника — нарисуем глазурью что угодно. Пришлите картинку, остальное сделаем сами.</p>
            <ol className="steps">
              <li><span>1</span>Присылаете идею или картинку</li>
              <li><span>2</span>Согласуем эскиз и стоимость</li>
              <li><span>3</span>Печём и доставляем к дате</li>
            </ol>
            <Link className="btn primary" href="/custom">Подробнее о заказе</Link>
          </div>
          <div className="custom-media">
            <div className="video-frame">
              <span className="vf-badge">🎬 Пример работы</span>
              <video
                poster="/media/video/custom-poster.webp"
                src="/media/video/custom.mp4"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                aria-label="Пример пряников под заказ"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Опт / корпоратив */}
      <section className="corp">
        <div className="wrap corp-home">
          <div className="video-frame">
            <span className="vf-badge">🎬 Партия с логотипом</span>
            <video
              poster="/media/video/corp-poster.webp"
              src="/media/video/corp.mp4"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-label="Корпоративная партия пряников с логотипом"
            />
          </div>
          <div>
            <h2>Опт, мероприятия и корпоративные заказы</h2>
            <p style={{ color: 'var(--muted)', fontSize: 18, margin: '14px 0 24px', maxWidth: '46ch' }}>
              Крупные партии на события, брендированные наборы с логотипом и опт для бизнеса. От 20 штук,
              договор и документы для юрлиц, доставка по России.
            </p>
            <Link className="btn primary" href="/corporate">Условия и заявка</Link>
          </div>
        </div>
      </section>

      {/* Отзывы */}
      <section className="reviews">
        <div className="wrap">
          <div className="sec-head">
            <h2>Что говорят покупатели</h2>
          </div>
          <div className="review-grid">
            <article className="review">
              <div className="stars">★★★★★</div>
              <p>Заказывала набор на день рождения — красивые и очень вкусные! Приехали целые, упаковано отлично.</p>
              <div className="who"><span className="ava t-berry">Е</span><div><b>Елена</b><span>Москва</span></div></div>
            </article>
            <article className="review">
              <div className="stars">★★★★★</div>
              <p>Делали корпоративные пряники с логотипом на 150 человек. Уложились в срок, все были в восторге.</p>
              <div className="who"><span className="ava t-mint">И</span><div><b>Игорь</b><span>компания Nimbus</span></div></div>
            </article>
            <article className="review">
              <div className="stars">★★★★★</div>
              <p>Пряник по фото ребёнка — просто вау! Спасибо, что помогли с эскизом и всё объяснили.</p>
              <div className="who"><span className="ava t-honey">М</span><div><b>Мария</b><span>Казань</span></div></div>
            </article>
          </div>
        </div>
      </section>

      {/* Оставьте заявку */}
      <section className="corp" id="zayavka" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap contact-grid">
          <div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', marginTop: 8 }}>Оставьте заявку</h2>
            <p className="lede" style={{ color: 'var(--muted)', fontSize: 18, marginTop: 14, maxWidth: '42ch' }}>
              Не нашли нужный набор или хотите пряник под заказ? Напишите — поможем подобрать, посчитаем
              стоимость и сроки в течение дня.
            </p>
            <ul className="contact-list">
              <li><span className="cl-ico">✈️</span><a href="https://t.me/yarkiy_pryanik">Telegram: @yarkiy_pryanik</a></li>
              <li><span className="cl-ico">✉️</span><a href="mailto:hello@yarkiy-pryanik.ru">hello@yarkiy-pryanik.ru</a></li>
              <li><span className="cl-ico">🕒</span><span>Отвечаем ежедневно с 9:00 до 21:00</span></li>
            </ul>
          </div>
          <LeadForm
            topic="Заявка с главной"
            submitLabel="Отправить заявку"
            messagePlaceholder="Повод, количество, пожелания — например: набор «Три кота», 6 шт, к 15 мая"
            messageRequired={false}
          />
        </div>
      </section>
    </>
  );
}
