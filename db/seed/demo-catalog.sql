-- =============================================================================
-- db/seed/demo-catalog.sql
-- -----------------------------------------------------------------------------
-- Этап 4 онбординга «Яркий пряник» — сид-каталог магазина (ретематизация
-- нейтрального демо-каталога П5 под нишу: имбирные пряники-топперы на торт).
--
-- ИСТОЧНИК ДАННЫХ. Статический макет витрины Pryanik/assets/js/products.js
-- (выгрузка с Wildberries): 4 плоские категории (YP.CATS), 14 товаров
-- (YP.products; sku = артикул WB), промокоды YP.PROMOS (PRYANIK10 −10%,
-- WB15 −15%).
--
-- СООТВЕТСТВИЕ ПОЛЕЙ МАКЕТА → БД:
--   id      → products.sku (артикул WB) и имена файлов галереи;
--   name    → products.name;
--   price   → products.base_price (РУБЛИ, NUMERIC(14,2) — как во всей схеме);
--   old     → products.compare_at_price («было»; скидка ВЫЧИСЛЯЕТСЯ по
--             compare_at_price > base_price — ADR-009, флаг sale не хранится);
--   badge   → 'hit' → is_featured=true; 'new' → is_new=true (прочим — явный
--             false, чтобы вычисление «новизны» по created_at не пометило весь
--             свежесозданный сид новинками); 'sale' — вычисляемый предикат;
--   disc    → не хранится (витрина считает из цен, значения совпадают);
--   cat     → product_categories (M2M, is_primary=true);
--   gallery → product_media: 4 изображения <sku>.webp, <sku>_2..4.webp,
--             url = /media/products/<файл> (статика витрины), первое — primary;
--   desc    → products.description (в макете одно на все товары);
--   rating/reviews/tile → НЕ переносятся: в схеме платформы нет полей
--             рейтинга/отзывов, tile — чисто презентационный класс витрины.
--
-- Промокоды YP.PROMOS → promo_codes (kind='percent', активные, без лимитов).
--
-- ИДЕМПОТЕНТНОСТЬ (стиль П5 сохранён). Естественные ключи: categories.slug,
-- products.sku/slug, promo_codes.code, inventory_unit_uniq. Все INSERT — с
-- ON CONFLICT ... DO NOTHING; product_media не имеет уникального ключа, поэтому
-- дополнительно защищён WHERE NOT EXISTS по (product_id, storage_key).
-- Повторный накат не плодит дублей и не падает. Никаких хардкод-UUID.
--
-- ПОДКЛЮЧЕНИЕ: накатывается psql из init-shop (шаг 5) ТОЛЬКО под флагом
-- SEED_DEMO_CATALOG=true. Использует таблицы миграций 0005–0011, 0014.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Категории — 4 плоские (без дерева, parent_id NULL), как YP.CATS.
--    Ключ — categories.slug.
-- -----------------------------------------------------------------------------
INSERT INTO categories (slug, name, description, sort, is_active) VALUES
  ('multgeroi', 'Мультгерои', 'Пряники-топперы с героями мультфильмов.',      10, true),
  ('malchikam', 'Мальчикам',  'Пряники на торт для мальчиков.',               20, true),
  ('devochkam', 'Девочкам',   'Пряники на торт для девочек.',                 30, true),
  ('raznoe',    'Разное',     'Пряники на торт на разные темы и праздники.',  40, true)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Товары — 14 позиций макета. Ключ — products.sku (= артикул WB).
--    Цены в рублях; compare_at_price — зачёркнутая цена «было» (old);
--    is_featured — бейдж «хит»; is_new — бейдж «новинка» (явный override,
--    прочим false — иначе весь сид вычислился бы «новинками» по created_at).
-- -----------------------------------------------------------------------------
INSERT INTO products
  (sku, slug, name, description, status, base_price, compare_at_price, is_featured, is_new)
SELECT
  v.sku, v.slug, v.name,
  'Имбирные пряники ручной работы для украшения торта. Каждый пряник расписан вручную сахарной глазурью — яркий, аккуратный и вкусный комплимент к празднику. Печём под заказ, бережно упаковываем и отправляем СДЭК по всей России.',
  'active', v.base_price, v.compare_at_price, v.is_featured, v.is_new
FROM (VALUES
  -- sku,         slug,                              name,                                          price,   old,      hit,   new
  ('295888663', 'pryaniki-na-tort-dinozavriki',    'Пряники на торт динозаврики',                  527.00, 1300.00, false, false),
  ('174038071', 'pryaniki-schenyachiy-patrul',     'Имбирные пряники «Щенячий патруль»',           570.00, 2200.00, true,  false),
  ('279569982', 'pryaniki-kuromi-i-melodi',        'Пряники «Kuromi и Мелоди» для торта',          535.00, 2000.00, false, false),
  ('281016608', 'pryaniki-na-tort-fiksiki',        'Пряники на торт «Фиксики»',                    535.00, 2200.00, false, false),
  ('281026889', 'pryaniki-holodnoe-serdce',        'Пряники на торт «Холодное сердце»',            374.00, 2000.00, false, false),
  ('174034773', 'pryaniki-traktor',                'Имбирные пряники «Трактор»',                   502.00, 2000.00, false, false),
  ('174032047', 'pryaniki-tri-kota',               'Имбирные пряники «Три кота», набор на торт',   517.00, 2200.00, true,  false),
  ('281031742', 'pryaniki-chelovek-pauk',          'Набор пряников «Человек-паук», 6 шт',          442.00, 2100.00, false, false),
  ('498237933', 'pryaniki-dlya-devochki-14-let',   'Пряники на торт для девочки 14 лет',           413.00, 2300.00, false, true),
  ('223755570', 'pryaniki-dachniku',               'Пряники на торт «Дачнику»',                    510.00, 2100.00, false, false),
  ('281034830', 'pryaniki-mashinki',               'Пряники на торт «Машинки»',                    493.00, 2100.00, false, false),
  ('177418126', 'pryaniki-stroitelnye-mashinki',   'Имбирные пряники «Строительные машинки»',      410.00, 2100.00, false, false),
  ('177689786', 'pryaniki-futbol',                 'Имбирные пряники на торт «Футбол»',            367.00, 1470.00, false, false),
  ('498237934', 'pryaniki-dlya-devochki',          'Пряники на торт для девочки',                  304.00, 2000.00, false, true)
) AS v(sku, slug, name, base_price, compare_at_price, is_featured, is_new)
ON CONFLICT (sku) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. Привязка товаров к категориям (M2M product_categories, cat из макета).
--    Ключ — PK (product_id, category_id); единственная связка — основная.
-- -----------------------------------------------------------------------------
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT p.id, c.id, true
FROM (VALUES
  -- sku,        категория (cat макета: hero/boy/girl/other)
  ('295888663', 'raznoe'),
  ('174038071', 'multgeroi'),
  ('279569982', 'multgeroi'),
  ('281016608', 'multgeroi'),
  ('281026889', 'multgeroi'),
  ('174034773', 'malchikam'),
  ('174032047', 'multgeroi'),
  ('281031742', 'multgeroi'),
  ('498237933', 'devochkam'),
  ('223755570', 'raznoe'),
  ('281034830', 'malchikam'),
  ('177418126', 'malchikam'),
  ('177689786', 'malchikam'),
  ('498237934', 'devochkam')
) AS link(sku, cat_slug)
JOIN products   p ON p.sku  = link.sku
JOIN categories c ON c.slug = link.cat_slug
ON CONFLICT (product_id, category_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. Медиа — галерея 4 изображения/товар (gallery макета):
--    <sku>.webp, <sku>_2.webp, <sku>_3.webp, <sku>_4.webp.
--    Файлы лежат в статике витрины по /media/products/ — url публичный путь,
--    storage_key — относительный mock-путь (байты в S3 не сидируются).
--    У product_media нет уникального ключа (кроме частичного primary) —
--    идемпотентность через WHERE NOT EXISTS по (product_id, storage_key);
--    ON CONFLICT DO NOTHING дополнительно гасит гонку по primary-индексу.
-- -----------------------------------------------------------------------------
INSERT INTO product_media
  (product_id, storage_key, url, type, mime, alt, sort, is_primary)
SELECT
  p.id,
  'media/products/' || f.file,
  '/media/products/' || f.file,
  'image', 'image/webp', p.name,
  (f.n - 1) * 10,
  f.n = 1
FROM products p
CROSS JOIN LATERAL (
  SELECT n, p.sku || CASE WHEN n = 1 THEN '' ELSE '_' || n END || '.webp' AS file
  FROM generate_series(1, 4) AS n
) AS f
WHERE p.sku IN
  ('295888663','174038071','279569982','281016608','281026889','174034773',
   '174032047','281031742','498237933','223755570','281034830','177418126',
   '177689786','498237934')
  AND NOT EXISTS (
    SELECT 1 FROM product_media pm
    WHERE pm.product_id = p.id
      AND pm.storage_key = 'media/products/' || f.file
  )
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. Остатки (inventory) — товары без вариантов (variant_id NULL), склад
--    'main', по 20 шт (пряники пекутся под заказ — разумный демо-остаток).
--    Идемпотентность — уникальный индекс inventory_unit_uniq.
-- -----------------------------------------------------------------------------
INSERT INTO inventory (product_id, variant_id, warehouse_code, quantity)
SELECT p.id, NULL, 'main', 20
FROM products p
WHERE p.sku IN
  ('295888663','174038071','279569982','281016608','281026889','174034773',
   '174032047','281031742','498237933','223755570','281034830','177418126',
   '177689786','498237934')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Промокоды макета (YP.PROMOS) → promo_codes: процентные, активные,
--    без лимитов (usage_limit / per_customer_limit / сроки — NULL по умолчанию).
--    Ключ — promo_codes.code (citext, регистронезависим).
-- -----------------------------------------------------------------------------
INSERT INTO promo_codes (code, kind, value, is_active, comment) VALUES
  ('PRYANIK10', 'percent', 10.00, true, 'Промокод витрины «Яркий пряник»: −10% на заказ.'),
  ('WB15',      'percent', 15.00, true, 'Промокод для покупателей с Wildberries: −15% на заказ.')
ON CONFLICT (code) DO NOTHING;
