import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureAdmin } from '@/lib/api-guard';
import { getCollection } from '@/lib/cms-collections';

/** Resolve a resource key to its Prisma delegate. */
function delegate(resource: string): any | null {
  if (resource === 'cases') return prisma.case;
  if (resource === 'blog') return prisma.blogPost;
  const col = getCollection(resource);
  return col ? (prisma as any)[col.model] : null;
}

/** Bulk publish / hide / delete for any CMS resource. Body: { resource, action, ids[] }. */
export async function POST(req: Request) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { resource, action, ids } = await req.json().catch(() => ({}));
  const model = delegate(resource);
  if (!model || !Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const where = { id: { in: ids as string[] } };

  if (action === 'publish') await model.updateMany({ where, data: { published: true } });
  else if (action === 'hide') await model.updateMany({ where, data: { published: false } });
  else if (action === 'delete') await model.deleteMany({ where });
  else return NextResponse.json({ error: 'unknown_action' }, { status: 400 });

  return NextResponse.json({ ok: true, count: ids.length });
}
