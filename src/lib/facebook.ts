/**
 * Facebook Graph API helpers.
 *
 * All calls require a per-client Page/Ad access token (stored on FacebookAccount).
 * Every function degrades gracefully: on missing token or API error it returns
 * null / [] and logs, so a misconfigured account never crashes a request.
 */
const GRAPH = 'https://graph.facebook.com/v19.0';

export type FbLead = {
  id: string;
  createdTime?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  raw: Record<string, string>;
};

/** Fetch a single Lead Ads submission by its leadgen id. */
export async function fetchLead(leadgenId: string, accessToken: string): Promise<FbLead | null> {
  try {
    const url = `${GRAPH}/${leadgenId}?fields=created_time,field_data&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[fb] fetchLead failed', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    const raw: Record<string, string> = {};
    for (const f of data.field_data ?? []) raw[f.name] = (f.values && f.values[0]) ?? '';
    const pick = (...keys: string[]) => {
      for (const k of Object.keys(raw)) if (keys.some((n) => k.toLowerCase().includes(n))) return raw[k];
      return undefined;
    };
    return {
      id: data.id ?? leadgenId,
      createdTime: data.created_time,
      fullName: pick('full_name', 'name'),
      phone: pick('phone'),
      email: pick('email'),
      raw,
    };
  } catch (err) {
    console.error('[fb] fetchLead error', err);
    return null;
  }
}

export type FbInsight = {
  date: string;
  spend: number;
  reach: number;
  clicks: number;
  impressions: number;
  leads: number;
};

/** Pull daily ad-account insights for the last `days` days. */
export async function fetchInsights(
  adAccountId: string,
  accessToken: string,
  days = 7,
): Promise<FbInsight[]> {
  try {
    const acct = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const url =
      `${GRAPH}/${acct}/insights` +
      `?fields=spend,reach,clicks,impressions,actions` +
      `&level=account&time_increment=1&date_preset=last_${days}d` +
      `&access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[fb] fetchInsights failed', res.status, await res.text().catch(() => ''));
      return [];
    }
    const data = await res.json();
    return (data.data ?? []).map((row: any): FbInsight => {
      const leadAction = (row.actions ?? []).find((a: any) => a.action_type === 'lead' || a.action_type === 'leadgen_grouped');
      return {
        date: row.date_start,
        spend: parseFloat(row.spend ?? '0'),
        reach: parseInt(row.reach ?? '0', 10),
        clicks: parseInt(row.clicks ?? '0', 10),
        impressions: parseInt(row.impressions ?? '0', 10),
        leads: leadAction ? parseInt(leadAction.value ?? '0', 10) : 0,
      };
    });
  } catch (err) {
    console.error('[fb] fetchInsights error', err);
    return [];
  }
}
