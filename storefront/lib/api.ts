/**
 * Обёртка над fetch к публичному Storefront API Admik (/api/storefront/v1/*).
 *
 * Два базовых адреса (см. docker-compose.yml платформы, docs/21):
 *  - на сервере (SSR/route handlers) — ADMIK_API_URL (в docker: http://app:3000),
 *    запросы идут внутри docker-сети;
 *  - в браузере — NEXT_PUBLIC_ADMIK_API_URL (публичный https://admin.<домен>,
 *    «впекается» в клиентский бандл при сборке).
 *
 * Формат ответов API:
 *  - успех:  { data, pagination?, count? }
 *  - ошибка: { error, message?, fieldErrors? }
 * Деньги приходят в КОПЕЙКАХ (целые) — см. formatMoney.
 *
 * Недоступный API — штатная ситуация (заглушка/пустые данные), рендер витрины
 * падать не должен: все хелперы возвращают ApiResult, а не бросают исключения.
 */

const API_PREFIX = '/api/storefront/v1';

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  count: number;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
  pagination?: Pagination;
  count?: number;
}

export interface ApiFail {
  ok: false;
  /** Код ошибки API либо 'unavailable' (сеть/таймаут) / 'bad_response' (не-JSON). */
  error: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** HTTP-статус, если ответ был получен. */
  status?: number;
}

export type ApiResult<T> = ApiOk<T> | ApiFail;

/** Базовый URL API: на сервере — внутренний, в браузере — публичный. */
function apiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.ADMIK_API_URL || process.env.NEXT_PUBLIC_ADMIK_API_URL || '';
  }
  return process.env.NEXT_PUBLIC_ADMIK_API_URL || '';
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Объект сериализуется в JSON (Content-Type проставляется автоматически). */
  body?: unknown;
  /** Таймаут запроса, мс (по умолчанию 10 000). */
  timeoutMs?: number;
}

/**
 * Запрос к Storefront API. `path` — путь ПОСЛЕ /api/storefront/v1,
 * например apiFetch('/products?limit=8').
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  const base = apiBaseUrl();
  if (!base) {
    return { ok: false, error: 'unavailable', message: 'Storefront API не сконфигурирован (ADMIK_API_URL)' };
  }

  const { body, timeoutMs = 10_000, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');
  if (body !== undefined) finalHeaders.set('Content-Type', 'application/json');
  // Ключ витрины — ТОЛЬКО server-side (в клиентский бандл не попадает:
  // process.env.STOREFRONT_API_KEY без NEXT_PUBLIC не инлайнится).
  if (typeof window === 'undefined' && process.env.STOREFRONT_API_KEY) {
    finalHeaders.set('X-Storefront-Key', process.env.STOREFRONT_API_KEY);
  }

  try {
    const res = await fetch(`${base}${API_PREFIX}${path}`, {
      ...init,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options.signal ?? AbortSignal.timeout(timeoutMs),
    });

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      return { ok: false, error: 'bad_response', message: `Не-JSON ответ API (HTTP ${res.status})`, status: res.status };
    }

    const obj = (payload ?? {}) as Record<string, unknown>;

    if (!res.ok || typeof obj.error === 'string') {
      return {
        ok: false,
        error: typeof obj.error === 'string' ? obj.error : `http_${res.status}`,
        message: typeof obj.message === 'string' ? obj.message : undefined,
        fieldErrors: obj.fieldErrors as Record<string, string> | undefined,
        status: res.status,
      };
    }

    return {
      ok: true,
      data: obj.data as T,
      pagination: obj.pagination as Pagination | undefined,
      count: typeof obj.count === 'number' ? obj.count : undefined,
    };
  } catch (err) {
    // Сеть/таймаут/DNS — API недоступен: витрина рендерится с пустыми данными.
    return {
      ok: false,
      error: 'unavailable',
      message: err instanceof Error ? err.message : 'Storefront API недоступен',
    };
  }
}

/** GET-шорткат: apiGet<Product[]>('/products?limit=8'). */
export function apiGet<T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  return apiFetch<T>(path, { ...options, method: 'GET' });
}

/** POST-шорткат: apiPost('/leads', { name, contact, message }). */
export function apiPost<T>(path: string, body: unknown, options: ApiFetchOptions = {}): Promise<ApiResult<T>> {
  return apiFetch<T>(path, { ...options, method: 'POST', body });
}

/**
 * Данные либо fallback — для мест, где ошибка API равнозначна «пусто»:
 * const products = unwrapOr(await apiGet<Product[]>('/products'), []);
 */
export function unwrapOr<T>(result: ApiResult<T>, fallback: T): T {
  return result.ok ? result.data : fallback;
}

/**
 * Деньги: API отдаёт суммы в копейках → «1 234 ₽» (ru-RU).
 * Копейки показываются только если сумма не круглая: 123456 → «1 234,56 ₽».
 */
export function formatMoney(kopecks: number): string {
  const rubles = kopecks / 100;
  const hasKopecks = kopecks % 100 !== 0;
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: hasKopecks ? 2 : 0,
      maximumFractionDigits: hasKopecks ? 2 : 0,
    }).format(rubles) + ' ₽'
  );
}

/**
 * Форматирует денежную величину Storefront API (РУБЛИ строкой/числом, напр.
 * "570.00") в «570 ₽» / «1 140 ₽». Дробная часть — только если ненулевая.
 *
 * ВНИМАНИЕ О ЕДИНИЦАХ. Контракт docs/21 §0 заявляет «деньги в копейках», но
 * реальная реализация Storefront API (проверено на `/products` и `/cart/quote`,
 * 2026-07-09) отдаёт суммы РУБЛЯМИ строкой: `"570.00"`, `"1140.00"`. Поэтому
 * значения из API форматируем этим хелпером, а `formatMoney` (копейки) —
 * только там, где сумма реально в копейках-целых. Расхождение зафиксировано
 * как follow-up платформы (docs/00).
 */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    }).format(n) + ' ₽'
  );
}

// ---------------------------------------------------------------------------
// Типы DTO Storefront API (docs/21 §1–2, §6) — только используемые витриной.
// Денежные поля приходят строкой в рублях (см. formatPrice).
// ---------------------------------------------------------------------------

export interface BrandRef {
  slug: string;
  name: string;
  logoUrl?: string | null;
}

/** Элемент списка `GET /products` (без id — id есть в карточке `/products/:slug`). */
export interface ProductListItem {
  slug: string;
  name: string;
  price: string;
  compareAtPrice?: string | null;
  discountPct?: number | null;
  onSale?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  brand?: BrandRef | null;
  imageUrl?: string | null;
  inStock?: boolean;
  availableQty?: number;
}

export interface ProductMedia {
  url: string;
  type?: string;
  alt?: string | null;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name?: string | null;
  price: string;
  compareAtPrice?: string | null;
  discountPct?: number | null;
  onSale?: boolean;
  attributes?: Record<string, string>;
  inStock?: boolean;
  availableQty?: number;
}

/** Карточка `GET /products/:slug` (с id, медиа, вариантами). */
export interface ProductDetail extends ProductListItem {
  id: string;
  sku?: string | null;
  description?: string | null;
  categories?: string[];
  attributes?: Record<string, string>;
  variants?: ProductVariant[];
  media?: ProductMedia[];
  meta?: {
    title?: string | null;
    description?: string | null;
    canonical?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImageUrl?: string | null;
    noindex?: boolean;
  };
}

export interface Category {
  slug: string;
  name: string;
  description?: string | null;
  children?: Category[];
}

/** Список товаров с фильтрами (query как в docs/21 §1). Ошибка → []. */
export async function getProducts(
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<ProductListItem[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return unwrapOr(await apiGet<ProductListItem[]>(`/products${suffix}`), []);
}

/** Карточка товара по slug. Не найдено/ошибка → null. */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const res = await apiGet<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  return res.ok ? res.data : null;
}

/** Дерево категорий (плоское для «Пряника»). Ошибка → []. */
export async function getCategories(): Promise<Category[]> {
  return unwrapOr(await apiGet<Category[]>('/categories'), []);
}

// ---------------------------------------------------------------------------
// Корзина, заказы, доставка, оплата, формы (docs/21 §2–4, §6). Денежные поля —
// рубли строкой (formatPrice). Вызовы client-side ходят на NEXT_PUBLIC_ADMIK_API_URL.
// ---------------------------------------------------------------------------

export interface QuoteItemInput {
  productId?: string;
  variantId?: string;
  qty: number;
}

export interface DeliveryInput {
  type: 'pvz' | 'door' | 'pickup';
  city?: string;
  cityCode?: number;
  postalCode?: string;
  pvzCode?: string;
  address?: string;
}

export interface QuoteLine {
  productId?: string;
  variantId?: string | null;
  qty: number;
  price: string;
  lineTotal: string;
  discount?: string;
  name?: string;
  sku?: string;
}

export interface QuoteResult {
  itemsTotal: string;
  discountTotal: string;
  deliveryTotal: string;
  grandTotal: string;
  currency: string;
  lines: QuoteLine[];
  promo?: { code: string; valid: boolean; discountTotal: string } | null;
  delivery?: { type: string; cost: string; etaDays?: number } | null;
  fulfillable?: boolean;
  issues?: string[];
}

export function quoteCart(body: {
  items: QuoteItemInput[];
  promoCode?: string;
  delivery?: DeliveryInput;
}): Promise<ApiResult<QuoteResult>> {
  return apiPost<QuoteResult>('/cart/quote', body);
}

export interface OrderInput {
  items: QuoteItemInput[];
  customer: { name: string; email?: string; phone: string };
  delivery: DeliveryInput;
  paymentMethod?: string;
  promoCode?: string;
  comment?: string;
  idempotencyKey?: string;
}

export interface OrderCreated {
  number: string;
  status: string;
  paymentStatus: string;
  grandTotal: string;
  currency: string;
  accessToken: string;
}

export function createOrder(body: OrderInput): Promise<ApiResult<OrderCreated>> {
  const { idempotencyKey, ...rest } = body;
  return apiPost<OrderCreated>('/orders', rest, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export interface OrderStatus {
  number: string;
  status: string;
  paymentStatus: string;
  deliveryStatus?: string;
  grandTotal: string;
  currency: string;
  items: { sku: string; name: string; qty: number; price: string; lineTotal: string }[];
  delivery?: { type: string; address?: string; trackingUrl?: string | null };
}

/** Трекинг заказа по номеру + accessToken (SSR). Неверный token → null (404). */
export async function getOrder(number: string, token: string): Promise<OrderStatus | null> {
  const res = await apiGet<OrderStatus>(
    `/orders/${encodeURIComponent(number)}?token=${encodeURIComponent(token)}`,
  );
  return res.ok ? res.data : null;
}

// --- СДЭК ---
export interface CdekCity {
  code: number;
  name: string;
  region?: string;
}
export interface CdekPvz {
  code: string;
  name: string;
  address: string;
  type: string;
  location?: { latitude: number; longitude: number };
  workTime?: string;
}
export interface CdekCalc {
  tariffCode: number;
  cost: string;
  etaDays?: number;
  periodMin?: number;
  periodMax?: number;
}

export function cdekCities(q: string, limit = 10): Promise<ApiResult<CdekCity[]>> {
  return apiGet<CdekCity[]>(`/delivery/cdek/cities?q=${encodeURIComponent(q)}&limit=${limit}`);
}
export function cdekPvz(cityCode: number): Promise<ApiResult<CdekPvz[]>> {
  return apiGet<CdekPvz[]>(`/delivery/cdek/pvz?city_code=${cityCode}`);
}
export function cdekCalculate(body: {
  to: { city_code?: number; postal_code?: string };
  deliveryMode: 'door' | 'pvz';
  items: QuoteItemInput[];
}): Promise<ApiResult<CdekCalc>> {
  return apiPost<CdekCalc>('/delivery/cdek/calculate', body);
}

// --- Оплата (mock Т-Банк) ---
export interface PaymentInit {
  paymentUrl: string;
  paymentId: string;
  status: string;
  isMock: boolean;
}
export function paymentInit(body: {
  orderNumber: string;
  accessToken?: string;
  email?: string;
  returnUrl?: string;
}): Promise<ApiResult<PaymentInit>> {
  return apiPost<PaymentInit>('/payments/tbank/init', body);
}

// --- Формы ядра ---
export function postLead(body: { name: string; contact: string; message: string }): Promise<ApiResult<{ id: string }>> {
  return apiPost<{ id: string }>('/leads', body);
}
export function postNewsletter(email: string): Promise<ApiResult<{ ok: true }>> {
  return apiPost<{ ok: true }>('/newsletter', { email });
}

// --- CMS + настройки ---
export interface CmsPage {
  slug: string;
  title: string;
  description?: string;
  sections?: { type: string; [k: string]: unknown }[];
  meta?: Record<string, unknown>;
}
export async function getPage(slug: string): Promise<CmsPage | null> {
  const res = await apiGet<CmsPage>(`/pages/${encodeURIComponent(slug)}`);
  return res.ok ? res.data : null;
}

export interface Settings {
  branding?: { shopName?: string; logoUrl?: string; supportEmail?: string; supportPhone?: string; theme?: Record<string, unknown> };
  currency?: { code?: string; symbol?: string; locale?: string; fractionDigits?: number };
  contacts?: { phone?: string; email?: string; address?: string; workingHours?: string; socials?: { type?: string; url?: string }[] };
  legalEntity?: { name?: string; inn?: string; kpp?: string; ogrn?: string; legalAddress?: string };
  delivery?: { freeDeliveryThreshold?: number | string };
  home?: Record<string, unknown>;
  navigation?: { header?: { label: string; href: string }[]; footer?: { label: string; href: string }[] };
  seo?: Record<string, unknown>;
}
export async function getSettings(): Promise<Settings | null> {
  const res = await apiGet<Settings>('/settings');
  return res.ok ? res.data : null;
}
