#!/usr/bin/env bash
# Перенос базы Neon в другой регион (ближе к пользователям).
#
# Зачем: функции Vercel и база должны быть в ОДНОМ регионе. Сейчас обе в
# us-east-1, а пользователи в Душанбе — дорога туда-обратно ~800 мс на каждый
# запрос. Франкфурт (eu-central-1 + fra1) сокращает это примерно втрое.
#
# Использование:
#   OLD_URL="postgresql://...(текущая)"  NEW_URL="postgresql://...(новая)" \
#     bash scripts/migrate-neon-region.sh
#
# Скрипт НИЧЕГО не удаляет: старая база остаётся как есть, пока вы сами её не
# удалите. Откат = вернуть прежний DATABASE_URL.
set -euo pipefail

: "${OLD_URL:?Задайте OLD_URL — строка подключения текущей базы}"
: "${NEW_URL:?Задайте NEW_URL — строка подключения новой базы в нужном регионе}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="neon-dump-${STAMP}.sql"

echo "▸ 1/3  Снимаю дамп текущей базы → ${DUMP}"
# --no-owner/--no-acl: роли в новом проекте другие, права выставит Neon сам.
pg_dump "${OLD_URL}" \
  --no-owner --no-acl --no-comments \
  --format=plain --file="${DUMP}"

echo "▸ 2/3  Размер дампа: $(du -h "${DUMP}" | cut -f1)"

echo "▸ 3/3  Заливаю в новую базу"
psql "${NEW_URL}" --quiet --set ON_ERROR_STOP=on --file="${DUMP}"

echo
echo "✓ Готово. Дамп сохранён: ${DUMP} (не удаляйте, пока не убедитесь, что всё работает)"
echo
echo "Проверка — число строк в ключевых таблицах должно совпасть:"
for T in '"User"' '"Client"' '"CalendarEvent"' '"StaffNote"' '"MonthlyReport"'; do
  OLD_N=$(psql "${OLD_URL}" -tAc "select count(*) from ${T}" 2>/dev/null || echo '?')
  NEW_N=$(psql "${NEW_URL}" -tAc "select count(*) from ${T}" 2>/dev/null || echo '?')
  printf '  %-18s старая: %-8s новая: %s\n' "${T}" "${OLD_N}" "${NEW_N}"
done
