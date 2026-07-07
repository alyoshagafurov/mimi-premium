/**
 * Config-driven CMS collections — the 8 flat-list content types share one
 * generic API + admin UI. Each collection maps to a Prisma model (by its
 * camelCase client property) and declares its editable fields.
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'image' | 'url' | 'date' | 'rating' | 'socials';

export type Field = { name: string; label: string; type: FieldType; required?: boolean; placeholder?: string };

export type Collection = {
  key: string; // URL segment: /admin/content/<key>
  model: string; // Prisma client property (camelCase model name)
  label: string; // plural, e.g. "Отзывы"
  singular: string; // "Отзыв"
  eyebrow: string;
  fields: Field[];
  titleField: string; // which field to show as the row title
};

export const COLLECTIONS: Collection[] = [
  {
    key: 'testimonials', model: 'testimonial', label: 'Отзывы', singular: 'Отзыв', eyebrow: 'Testimonials', titleField: 'name',
    fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'company', label: 'Компания', type: 'text' },
      { name: 'position', label: 'Должность', type: 'text' },
      { name: 'photo', label: 'Фото', type: 'image' },
      { name: 'rating', label: 'Рейтинг (1–5)', type: 'rating' },
      { name: 'text', label: 'Отзыв', type: 'textarea', required: true },
      { name: 'date', label: 'Дата', type: 'date' },
    ],
  },
  {
    key: 'team', model: 'teamMember', label: 'Команда', singular: 'Сотрудник', eyebrow: 'Team', titleField: 'name',
    fields: [
      { name: 'name', label: 'Имя', type: 'text', required: true },
      { name: 'position', label: 'Должность', type: 'text', required: true },
      { name: 'photo', label: 'Фото', type: 'image' },
      { name: 'bio', label: 'Описание', type: 'textarea' },
      { name: 'socials', label: 'Соцсети', type: 'socials' },
    ],
  },
  {
    key: 'clients', model: 'clientLogo', label: 'Клиенты', singular: 'Клиент', eyebrow: 'Clients', titleField: 'name',
    fields: [
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'logo', label: 'Логотип', type: 'image' },
      { name: 'url', label: 'Ссылка', type: 'url' },
      { name: 'category', label: 'Категория', type: 'text' },
    ],
  },
  {
    key: 'faq', model: 'faq', label: 'FAQ', singular: 'Вопрос', eyebrow: 'FAQ', titleField: 'question',
    fields: [
      { name: 'question', label: 'Вопрос', type: 'text', required: true },
      { name: 'answer', label: 'Ответ', type: 'textarea', required: true },
    ],
  },
  {
    key: 'stats', model: 'companyStat', label: 'Статистика', singular: 'Показатель', eyebrow: 'Stats', titleField: 'label',
    fields: [
      { name: 'label', label: 'Название', type: 'text', required: true, placeholder: 'Клиентов / Проектов / Лет опыта' },
      { name: 'value', label: 'Значение', type: 'text', required: true, placeholder: '150+ / 4.8 / 20M' },
      { name: 'suffix', label: 'Суффикс', type: 'text', placeholder: '%, +, сомони' },
    ],
  },
  {
    key: 'partners', model: 'partner', label: 'Партнёры', singular: 'Партнёр', eyebrow: 'Partners', titleField: 'name',
    fields: [
      { name: 'name', label: 'Название', type: 'text', required: true },
      { name: 'logo', label: 'Логотип', type: 'image' },
      { name: 'url', label: 'Ссылка', type: 'url' },
    ],
  },
  {
    key: 'certificates', model: 'certificate', label: 'Сертификаты', singular: 'Сертификат', eyebrow: 'Certificates', titleField: 'title',
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'image', label: 'Изображение', type: 'image' },
      { name: 'issuer', label: 'Кем выдан', type: 'text' },
      { name: 'date', label: 'Дата', type: 'date' },
    ],
  },
  {
    key: 'awards', model: 'award', label: 'Награды', singular: 'Награда', eyebrow: 'Awards', titleField: 'title',
    fields: [
      { name: 'title', label: 'Название', type: 'text', required: true },
      { name: 'image', label: 'Изображение', type: 'image' },
      { name: 'issuer', label: 'Кем выдана', type: 'text' },
      { name: 'date', label: 'Дата', type: 'date' },
    ],
  },
];

export function getCollection(key: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.key === key);
}

/** Coerce a raw form body into Prisma-ready data for a collection. */
export function coerceBody(col: Collection, body: Record<string, any>): Record<string, any> {
  const data: Record<string, any> = {};
  for (const f of col.fields) {
    if (!(f.name in body)) continue;
    const v = body[f.name];
    if (f.type === 'number' || f.type === 'rating') data[f.name] = Number(v) || 0;
    else if (f.type === 'date') data[f.name] = v ? new Date(v) : null;
    else if (f.type === 'socials') data[f.name] = v && typeof v === 'object' ? v : null;
    else if (f.type === 'image' || f.type === 'url') data[f.name] = v || null;
    else data[f.name] = v ?? '';
  }
  if ('published' in body) data.published = !!body.published;
  if ('sortOrder' in body) data.sortOrder = Number(body.sortOrder) || 0;
  return data;
}
