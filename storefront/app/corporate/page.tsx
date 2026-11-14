import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadForm } from '@/components/lead-form';

export const metadata: Metadata = { title: 'Опт, мероприятия и корпоративные заказы' };

export default function CorporatePage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            Оптом
          </nav>
          <h1>Опт, мероприятия и корпоративные заказы</h1>
          <p>Крупные партии на события, брендированные наборы с логотипом и опт для бизнеса. От 20 штук, документы для юрлиц, доставка по России.</p>
        </div>
      </section>

      <section>
        <div className="wrap contact-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', alignItems: 'start' }}>
          <div>
            <h3>Что делаем для бизнеса</h3>
            <ul style={{ lineHeight: 1.9 }}>
              <li>Брендированные пряники с логотипом и в фирменных цветах.</li>
              <li>Наборы на конференции, дни рождения компании, подарки клиентам.</li>
              <li>Опт от 20 штук с гибкими ценами.</li>
              <li>Договор и закрывающие документы для юрлиц.</li>
              <li>Доставка СДЭК по всей России.</li>
            </ul>
          </div>
          <div>
            <h3>Заявка на опт / корпоратив</h3>
            <LeadForm
              topic="Опт/B2B"
              submitLabel="Отправить заявку"
              messagePlaceholder="Повод, тираж, желаемая дата, пожелания по дизайну"
            />
          </div>
        </div>
      </section>
    </>
  );
}
