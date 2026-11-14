/**
 * Health-эндпоинт витрины. Healthcheck docker-compose дергает корень «/»,
 * этот роут — дополнительная точка для ручной диагностики и внешних мониторов.
 */
export function GET() {
  return Response.json({ status: 'ok', service: 'storefront' });
}
