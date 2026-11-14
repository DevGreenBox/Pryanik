import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadForm } from '@/components/lead-form';

export const metadata: Metadata = { title: 'Пряники под заказ по эскизу' };

export default function CustomPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Под заказ
          </nav>
          <h1>Пряники под заказ по эскизу</h1>
          <p>Логотип, портрет по фото, любимый герой или тематика праздника — нарисуем сахарной глазурью что угодно.</p>
        </div>
      </section>

      <section>
        <div className="wrap contact-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', alignItems: 'start' }}>
          <div>
            <h3>Как это работает</h3>
            <ol style={{ lineHeight: 1.9 }}>
              <li>Пришлите идею или картинку и укажите повод.</li>
              <li>Согласуем эскиз, количество и цену.</li>
              <li>Печём и расписываем вручную (обычно 2 дня).</li>
              <li>Бережно упакуем и отправим СДЭК.</li>
            </ol>
            <p className="muted">Ссылку на изображение можно указать в поле контакта или описать в сообщении.</p>
          </div>
          <div>
            <h3>Заявка по эскизу</h3>
            <LeadForm
              topic="По эскизу"
              submitLabel="Отправить заявку"
              messagePlaceholder="Опишите идею, повод, количество, желаемую дату; ссылку на картинку"
            />
          </div>
        </div>
      </section>
    </>
  );
}
