import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-вывод для Docker-образа (см. Dockerfile: runner копирует
  // .next/standalone + .next/static + public и запускает node server.js).
  output: 'standalone',
  reactStrictMode: true,
  // Витрина — отдельный проект внутри репозитория платформы. Next/Turbopack
  // при авто-детекте корня уходит вверх до lock-файла родителя (Uni_BD) и
  // начинает компилировать его middleware.ts (админский барьер). Прибиваем
  // корень к каталогу витрины, чтобы трейсинг не выходил за её пределы.
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
