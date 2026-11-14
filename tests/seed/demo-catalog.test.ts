import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Тесты сид-каталога (Этап 4 онбординга «Яркий пряник») — db/seed/demo-catalog.sql.
 *
 * Сид ретематизирован под магазин «Яркий пряник» (имбирные пряники-топперы на
 * торт, выгрузка с Wildberries): 4 плоские категории, 14 товаров (sku = артикул
 * WB), цены в РУБЛЯХ NUMERIC(14,2), старая цена — compare_at_price, бейджи:
 * «хит» → is_featured, «новинка» → is_new (скидка вычисляется по
 * compare_at_price > base_price, отдельный флаг не хранится — ADR-009),
 * галерея 4 изображения/товар в product_media (/media/products/<id>.webp),
 * остатки inventory (склад 'main'), промокоды PRYANIK10/WB15 в promo_codes.
 *
 * ЮНИТ (всегда зелёные): статическая проверка содержимого SQL.
 * ИНТЕГРАЦИЯ (skipIf без DATABASE_URL): двойной накат не плодит дублей.
 * Накат по-прежнему ТОЛЬКО под флагом SEED_DEMO_CATALOG в init-shop.sh.
 */

const root = (rel: string) =>
  fileURLToPath(new URL(`../../${rel}`, import.meta.url));

const demoSql = readFileSync(root('db/seed/demo-catalog.sql'), 'utf8');
const initShop = readFileSync(root('scripts/init-shop.sh'), 'utf8');
const envExample = readFileSync(root('.env.example'), 'utf8');

/** Все 14 артикулов WB из макета (Pryanik/assets/js/products.js). */
const WB_SKUS = [
  '295888663', // Пряники на торт динозаврики
  '174038071', // Имбирные пряники «Щенячий патруль»
  '279569982', // Пряники «Kuromi и Мелоди» для торта
  '281016608', // Пряники на торт «Фиксики»
  '281026889', // Пряники на торт «Холодное сердце»
  '174034773', // Имбирные пряники «Трактор»
  '174032047', // Имбирные пряники «Три кота», набор на торт
  '281031742', // Набор пряников «Человек-паук», 6 шт
  '498237933', // Пряники на торт для девочки 14 лет
  '223755570', // Пряники на торт «Дачнику»
  '281034830', // Пряники на торт «Машинки»
  '177418126', // Имбирные пряники «Строительные машинки»
  '177689786', // Имбирные пряники на торт «Футбол»
  '498237934', // Пряники на торт для девочки
];

/** 4 плоские категории макета (YP.CATS). */
const CATEGORY_SLUGS = ['multgeroi', 'malchikam', 'devochkam', 'raznoe'];

describe('seed/demo-catalog.sql — файл и базовая структура', () => {
  it('файл существует', () => {
    expect(existsSync(root('db/seed/demo-catalog.sql'))).toBe(true);
  });

  it('идемпотентен: каждый INSERT снабжён ON CONFLICT ... DO NOTHING', () => {
    const inserts = (demoSql.match(/INSERT\s+INTO/gi) ?? []).length;
    const conflicts = (demoSql.match(/ON\s+CONFLICT[\s\S]*?DO\s+NOTHING/gi) ?? [])
      .length;
    expect(inserts).toBeGreaterThan(0);
    // Число ON CONFLICT DO NOTHING не меньше числа INSERT — каждый защищён.
    expect(conflicts).toBeGreaterThanOrEqual(inserts);
  });

  it('не использует хардкод-UUID (id генерируются БД, связи — по естественным ключам)', () => {
    // Любой литерал UUID вида xxxxxxxx-xxxx-... — признак хрупкой привязки.
    // Исключение: нулевой UUID из выражения COALESCE уникального индекса inventory
    // здесь тоже запрещён — сид не должен его подставлять.
    expect(demoSql).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
  });
});

describe('seed/demo-catalog.sql — наполняет таблицы каталога и промо', () => {
  const tables = [
    'categories',
    'products',
    'product_categories',
    'product_media',
    'inventory',
    'promo_codes',
  ];

  for (const table of tables) {
    it(`вставляет в таблицу ${table}`, () => {
      const re = new RegExp(`insert\\s+into\\s+${table}\\b`, 'i');
      expect(demoSql).toMatch(re);
    });
  }

  it('создаёт 4 плоские категории макета (YP.CATS)', () => {
    for (const slug of CATEGORY_SLUGS) {
      expect(demoSql, `нет категории ${slug}`).toContain(`'${slug}'`);
    }
    expect(demoSql).toContain('Мультгерои');
    expect(demoSql).toContain('Мальчикам');
    expect(demoSql).toContain('Девочкам');
    expect(demoSql).toContain('Разное');
  });

  it('создаёт все 14 товаров с артикулами WB в качестве sku', () => {
    for (const sku of WB_SKUS) {
      expect(demoSql, `нет товара с sku ${sku}`).toContain(`'${sku}'`);
    }
    expect(demoSql).toContain("'active'");
  });

  it('slug товаров — транслит имени', () => {
    expect(demoSql).toContain("'pryaniki-na-tort-dinozavriki'");
    expect(demoSql).toContain("'pryaniki-schenyachiy-patrul'");
    expect(demoSql).toContain("'pryaniki-holodnoe-serdce'");
    expect(demoSql).toContain("'pryaniki-dlya-devochki-14-let'");
  });
});

describe('seed/demo-catalog.sql — цены, бейджи, остатки, медиа', () => {
  it('цены — NUMERIC-литералы в рублях с дробной частью', () => {
    expect(demoSql).toMatch(/\b\d+\.\d{2}\b/);
    expect(demoSql.toLowerCase()).toContain('base_price');
  });

  it('конкретные цены макета: динозаврики 527/1300, Щенячий патруль 570/2200', () => {
    expect(demoSql).toContain('527.00');
    expect(demoSql).toContain('1300.00');
    expect(demoSql).toContain('570.00');
    expect(demoSql).toContain('2200.00');
  });

  it('старая цена макета (old) — в compare_at_price (скидка вычисляется, ADR-009)', () => {
    expect(demoSql.toLowerCase()).toContain('compare_at_price');
  });

  it('бейджи: «хит» → is_featured, «новинка» → is_new', () => {
    expect(demoSql.toLowerCase()).toContain('is_featured');
    expect(demoSql.toLowerCase()).toContain('is_new');
  });

  it('медиа: 4 изображения webp на товар по пути /media/products/', () => {
    expect(demoSql).toContain('/media/products/');
    expect(demoSql).toContain('image/webp');
    // Галерея строится из 4 файлов: <sku>.webp, <sku>_2.webp … _4.webp.
    expect(demoSql).toMatch(/generate_series\s*\(\s*1\s*,\s*4\s*\)|_4\.webp/);
  });

  it('остатки — целые quantity (20 шт) на складе main', () => {
    expect(demoSql.toLowerCase()).toContain('quantity');
    expect(demoSql).toContain("'main'");
    expect(demoSql).toMatch(/\b20\b/);
  });
});

describe('seed/demo-catalog.sql — промокоды макета (YP.PROMOS)', () => {
  it('заводит PRYANIK10 (−10%) и WB15 (−15%) типа percent', () => {
    expect(demoSql).toContain("'PRYANIK10'");
    expect(demoSql).toContain("'WB15'");
    expect(demoSql).toContain("'percent'");
    expect(demoSql).toMatch(/10\.00/);
    expect(demoSql).toMatch(/15\.00/);
  });

  it('промокоды активны и без лимитов (usage_limit не задаётся)', () => {
    expect(demoSql.toLowerCase()).toContain('is_active');
  });
});

describe('seed/demo-catalog.sql — ретематизация «Яркий пряник» (Этап 4)', () => {
  it('не содержит нейтральных демо-заглушек прежнего сида', () => {
    expect(demoSql).not.toContain('Демо-категория');
    expect(demoSql).not.toContain('Образец товара');
    expect(demoSql).not.toContain("'demo-root'");
    expect(demoSql).not.toContain("'DEMO-001'");
  });

  it('содержит товары ниши (имбирные пряники)', () => {
    expect(demoSql).toContain('Пряники на торт «Фиксики»');
    expect(demoSql).toContain('Имбирные пряники «Щенячий патруль»');
    expect(demoSql).toContain('Имбирные пряники ручной работы');
  });
});

describe('scripts/init-shop.sh — условный гейт сид-каталога', () => {
  it('содержит условие по переменной SEED_DEMO_CATALOG', () => {
    expect(initShop).toContain('SEED_DEMO_CATALOG');
  });

  it('накатывает demo-catalog.sql через psql', () => {
    expect(initShop).toContain('demo-catalog.sql');
    expect(initShop).toMatch(/psql[\s\S]*demo-catalog\.sql|DEMO_CATALOG_SQL/);
  });

  it('сид отделён от обязательного seed (по умолчанию пропускается)', () => {
    // Должна быть ветка-пропуск, когда флаг не задан/false.
    expect(initShop.toLowerCase()).toMatch(/пропущ|skip/);
  });
});

describe('.env.example — переменная SEED_DEMO_CATALOG', () => {
  it('документирует SEED_DEMO_CATALOG со значением по умолчанию false', () => {
    expect(envExample).toMatch(/SEED_DEMO_CATALOG\s*=\s*false/);
  });
});

// ---------------------------------------------------------------------------
// Интеграция: двойной накат сид-каталога не плодит дублей.
// Требует БД с накатанными миграциями (каталог 0005–0011, медиа 0009,
// остатки 0010, промо 0014).
// ---------------------------------------------------------------------------
const DB_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

describe.skipIf(!DB_URL)('demo-catalog (интеграция, требует DATABASE_URL)', () => {
  let sql: import('postgres').Sql;

  beforeAll(async () => {
    const postgres = (await import('postgres')).default;
    sql = postgres(DB_URL as string);
  });

  afterAll(async () => {
    if (sql) await sql.end({ timeout: 5 });
  });

  it('двойной накат demo-catalog.sql не плодит дублей', async () => {
    await sql.unsafe(demoSql);
    await sql.unsafe(demoSql);

    const cats = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM categories
      WHERE slug IN ('multgeroi','malchikam','devochkam','raznoe')`;
    const prods = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM products WHERE sku ~ '^[0-9]{9}$'`;
    const media = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM product_media pm
      JOIN products p ON p.id = pm.product_id
      WHERE p.sku ~ '^[0-9]{9}$'`;
    const promos = await sql<{ n: number }[]>`
      SELECT count(*)::int AS n FROM promo_codes WHERE code IN ('PRYANIK10','WB15')`;

    // 4 категории; 14 товаров; 14×4 медиа; 2 промокода — стабильно после повтора.
    expect(cats[0].n).toBe(4);
    expect(prods[0].n).toBe(14);
    expect(media[0].n).toBe(56);
    expect(promos[0].n).toBe(2);
  });

  it('бейджи и цены согласованы с макетом', async () => {
    const rows = await sql<
      { sku: string; base_price: string; compare_at_price: string | null;
        is_featured: boolean; is_new: boolean | null }[]
    >`
      SELECT sku, base_price, compare_at_price, is_featured, is_new
      FROM products WHERE sku IN ('174038071','498237933','295888663')`;

    const bySku = Object.fromEntries(rows.map((r) => [r.sku, r]));
    // «Щенячий патруль» — хит, 570 ₽ (было 2200 ₽).
    expect(Number(bySku['174038071'].base_price)).toBe(570);
    expect(Number(bySku['174038071'].compare_at_price)).toBe(2200);
    expect(bySku['174038071'].is_featured).toBe(true);
    // «Для девочки 14 лет» — новинка.
    expect(bySku['498237933'].is_new).toBe(true);
    // «Динозаврики» — скидка вычисляется: compare_at > base.
    expect(Number(bySku['295888663'].compare_at_price)).toBeGreaterThan(
      Number(bySku['295888663'].base_price),
    );
  });
});
