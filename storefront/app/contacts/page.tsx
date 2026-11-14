import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/api';
import { LeadForm } from '@/components/lead-form';

export const metadata: Metadata = { title: 'О нас и контакты' };
export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const settings = await getSettings();
  const c = settings?.contacts ?? {};
  const brand = settings?.branding ?? {};
  const phone = c.phone || brand.supportPhone;
  const email = c.email || brand.supportEmail;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span>/</span>
            О нас и контакты
          </nav>
          <h1>О мастерской «Яркий пряник»</h1>
          <p>Семейная пряничная мастерская. Печём имбирные пряники ручной работы и отправляем радость по всей России.</p>
        </div>
      </section>

      <section>
        <div className="wrap contact-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', alignItems: 'start' }}>
          <div>
            <h3>Контакты</h3>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: 2 }}>
              {phone && <li>📞 <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a></li>}
              {email && <li>✉️ <a href={`mailto:${email}`}>{email}</a></li>}
              {c.address && <li>📍 {c.address}</li>}
              {c.workingHours && <li>🕐 {c.workingHours}</li>}
            </ul>
            {c.socials && c.socials.length > 0 && (
              <p style={{ display: 'flex', gap: 12 }}>
                {c.socials.map((s, i) => s.url && (
                  <a key={i} className="btn ghost" href={s.url} target="_blank" rel="noreferrer">{s.type || 'Соцсеть'}</a>
                ))}
              </p>
            )}
            {!phone && !email && (
              <p className="muted">Контактные данные скоро появятся — заполните форму, и мы свяжемся с вами.</p>
            )}
          </div>
          <div>
            <h3>Написать нам</h3>
            <LeadForm topic="Контакты" submitLabel="Отправить сообщение" messagePlaceholder="Ваш вопрос или пожелание" />
          </div>
        </div>
      </section>
    </>
  );
}
