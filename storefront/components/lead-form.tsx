'use client';

import { useId, useState } from 'react';
import { postLead } from '@/lib/api';

/**
 * Форма заявки → `POST /leads` (обратная связь, опт, заказ по эскизу). Заявка
 * видна в админке `/admin/leads`. `topic` добавляется в начало сообщения, чтобы
 * различать источник (обычная/корпоративная/по эскизу) без правок бизнес-логики.
 * Разметка — `.form-card` + `.field` (стили макета в globals.css).
 */
export function LeadForm({
  topic,
  submitLabel = 'Отправить',
  messagePlaceholder = 'Сообщение',
  messageRequired = true,
}: {
  topic?: string;
  submitLabel?: string;
  messagePlaceholder?: string;
  messageRequired?: boolean;
}) {
  const uid = useId();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) {
      setError('Укажите имя и контакт.');
      setState('error');
      return;
    }
    setState('sending');
    setError(null);
    const body = {
      name: name.trim(),
      contact: contact.trim(),
      message: (topic ? `[${topic}] ` : '') + message.trim(),
    };
    const res = await postLead(body);
    if (res.ok) {
      setState('ok');
      setName('');
      setContact('');
      setMessage('');
    } else {
      setState('error');
      setError(res.message || 'Не удалось отправить заявку. Попробуйте ещё раз.');
    }
  }

  if (state === 'ok') {
    return (
      <div className="info-card t-mint" style={{ maxWidth: 520 }}>
        <span className="ic-ico">✅</span>
        <h3>Заявка отправлена</h3>
        <p>Спасибо! Мы свяжемся с вами в ближайшее время.</p>
        <button type="button" className="btn ghost" onClick={() => setState('idle')} style={{ marginTop: 14 }}>
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit}>
      <div className="field">
        <label htmlFor={`${uid}-name`}>Как вас зовут</label>
        <input
          id={`${uid}-name`}
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
        />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-contact`}>Телефон или e-mail</label>
        <input
          id={`${uid}-contact`}
          type="text"
          required
          autoComplete="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="+7 … или e-mail"
        />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-message`}>Что нужно</label>
        <textarea
          id={`${uid}-message`}
          required={messageRequired}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={messagePlaceholder}
          rows={4}
        />
      </div>
      {error && (
        <p className="form-note" style={{ color: 'var(--brand-d)', fontWeight: 700 }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn primary block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Отправляем…' : submitLabel}
      </button>
      <p className="form-note">Нажимая кнопку, вы соглашаетесь с обработкой данных.</p>
    </form>
  );
}
