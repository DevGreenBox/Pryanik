# =============================================================================
# Витрина «Яркий пряник» — многоступенчатый Dockerfile для Next.js 16
# (output: standalone) + pnpm. По образцу Dockerfile платформы Admik.
# =============================================================================
# Этапы: deps (зависимости) -> build (сборка) -> runner (минимальный рантайм).
#
# Healthcheck (docker-compose.yml, сервис storefront) дергает КОРЕНЬ витрины:
#   node -e "fetch('http://localhost:3000/')..." — значит standalone-сервер
# должен отдавать 200 на GET / (главная страница). Дополнительно есть
# GET /api/health для ручной диагностики.
# =============================================================================

# -----------------------------------------------------------------------------
# Базовый образ с включённым corepack/pnpm.
# node:22-alpine (а не 20): pnpm 11.x требует node:sqlite (Node 22+),
# версия pnpm закреплена в package.json ("packageManager": "pnpm@11.8.0").
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /app
# pnpm 11 по умолчанию делает ignored build-скрипты ФАТАЛЬНЫМИ (strictDepBuilds=true),
# из-за чего `pnpm install --frozen-lockfile` падает на sharp@ (build-скрипт которого
# не одобрен). Витрине сборка sharp не нужна (используются обычные <img>, не next/image;
# sharp работает на prebuilt-бинарях), поэтому отключаем строгость — install проходит,
# ignored-build остаётся безвредным предупреждением.
ENV PNPM_CONFIG_STRICT_DEP_BUILDS=false

# -----------------------------------------------------------------------------
# Этап deps — установка зависимостей (кешируется отдельно от исходников)
# -----------------------------------------------------------------------------
FROM base AS deps
# pnpm-workspace.yaml несёт настройку onlyBuiltDependencies (одобрение build-скрипта
# sharp) — без него `pnpm install --frozen-lockfile` падает ERR_PNPM_IGNORED_BUILDS.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    else \
      echo "pnpm-lock.yaml не найден — установка без frozen-lockfile" && \
      pnpm install; \
    fi

# -----------------------------------------------------------------------------
# Этап build — сборка приложения в standalone
# -----------------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Публичный адрес Storefront API Admik для КЛИЕНТСКОГО бандла (checkout,
# автокомплит городов СДЭК). Значение «впекается» при сборке — поэтому это
# build-arg (docker-compose.yml передаёт его в build.args).
ARG NEXT_PUBLIC_ADMIK_API_URL
ENV NEXT_PUBLIC_ADMIK_API_URL=${NEXT_PUBLIC_ADMIK_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# -----------------------------------------------------------------------------
# Этап runner — финальный минимальный образ
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Непривилегированный пользователь для запуска приложения
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Публичные статические файлы (media товаров, лого, видео)
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Standalone-сервер Next.js (включает минимальный node_modules)
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
# Статика Next.js (.next/static обслуживается standalone-сервером)
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js генерируется Next.js в standalone-выводе
CMD ["node", "server.js"]
