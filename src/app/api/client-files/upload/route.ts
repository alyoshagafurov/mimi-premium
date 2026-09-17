import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getSafeSession } from '@/lib/session';
import { isAdminLike } from '@/lib/roles';

const MAX_BYTES = 50 * 1024 * 1024; // 50 МБ — отчёт из Excel с графиками бывает тяжёлым

/**
 * Выдаёт браузеру одноразовый токен, и PDF грузится напрямую в Vercel Blob.
 * Через нашу функцию файл не идёт: у функций Vercel лимит тела запроса
 * 4,5 МБ, а отчёт с графиками легко больше.
 *
 * Запись в базу делает отдельный POST /api/client-files после загрузки —
 * колбэк onUploadCompleted не приходит на localhost и приходит с задержкой.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSafeSession();
        if (!isAdminLike((session?.user as any)?.role)) throw new Error('forbidden');
        if (!pathname.startsWith('reports/') || !pathname.toLowerCase().endsWith('.pdf')) {
          throw new Error('Можно загружать только PDF');
        }
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upload_failed';
    return NextResponse.json({ error: msg }, { status: msg === 'forbidden' ? 403 : 400 });
  }
}
