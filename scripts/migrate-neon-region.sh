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

# pg_dump обязан быть НЕ СТАРШЕ сервера, иначе он отказывается работать
# («продолжение работы с другой версией сервера невозможно»). Neon сейчас на 17,
# а системный клиент в macOS часто 16 — поэтому берём явный путь, если он есть.
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}"
if [ -x "${PG_BIN}/pg_dump" ]; then
  PG_DUMP="${PG_BIN}/pg_dump"; PSQL="${PG_BIN}/psql"
else
  PG_DUMP="pg_dump"; PSQL="psql"
fi
echo "▸ Использую: $("${PG_DUMP}" --version)"


: "${OLD_URL:?Задайте OLD_URL — строка подключения текущей базы}"
: "${NEW_URL:?Задайте NEW_URL — строка подключения новой базы в нужном регионе}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DUMP="neon-dump-${STAMP}.sql"

echo "▸ 1/3  Снимаю дамп текущей базы → ${DUMP}"
# --no-owner/--no-acl: роли в новом проекте другие, права выставит Neon сам.
"${PG_DUMP}" "${OLD_URL}" \
  --no-owner --no-acl --no-comments \
  --format=plain --file="${DUMP}"

echo "▸ 2/3  Размер дампа: $(du -h "${DUMP}" | cut -f1)"

echo "▸ 3/3  Заливаю в новую базу"
"${PSQL}" "${NEW_URL}" --quiet --set ON_ERROR_STOP=on --file="${DUMP}"

echo
echo "✓ Готово. Дамп сохранён: ${DUMP} (не удаляйте, пока не убедитесь, что всё работает)"
echo
echo "Проверка — число строк в ключевых таблицах должно совпасть:"
for T in '"User"' '"Client"' '"CalendarEvent"' '"StaffNote"' '"MonthlyReport"'; do
  OLD_N=$("${PSQL}" "${OLD_URL}" -tAc "select count(*) from ${T}" 2>/dev/null || echo '?')
  NEW_N=$("${PSQL}" "${NEW_URL}" -tAc "select count(*) from ${T}" 2>/dev/null || echo '?')
  printf '  %-18s старая: %-8s новая: %s\n' "${T}" "${OLD_N}" "${NEW_N}"
done
