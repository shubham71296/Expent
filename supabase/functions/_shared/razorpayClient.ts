export function razorpayAuthHeader(): string {
  const id = Deno.env.get('RAZORPAY_KEY_ID')?.trim() || '';
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim() || '';
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

function parseRazorpayError(text: string, status: number): string {
  let message = text || `Razorpay error ${status}`;
  try {
    const parsed = JSON.parse(text) as { error?: { description?: string; reason?: string } };
    const desc = parsed.error?.description ?? parsed.error?.reason;
    if (desc) message = desc;
  } catch {
    /* keep raw */
  }
  return message;
}

export async function razorpayGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    headers: { Authorization: razorpayAuthHeader() },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(parseRazorpayError(text, res.status));
  }
  return JSON.parse(text) as T;
}

export async function razorpayPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: razorpayAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(parseRazorpayError(text, res.status));
  }
  return JSON.parse(text) as T;
}

type CustomerRow = { id: string; email?: string };

/** Reuse Razorpay customer when the same email already exists (signup + upgrade). */
export async function resolveOrCreateRazorpayCustomer(params: {
  name: string;
  email: string;
  contact: string;
}): Promise<{ id: string }> {
  try {
    return await razorpayPost<{ id: string }>('/customers', {
      name: params.name,
      email: params.email,
      contact: params.contact,
      fail_existing: '0',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already exists/i.test(msg)) {
      throw e;
    }
    const existingId = await findRazorpayCustomerIdByEmail(params.email);
    if (existingId) {
      return { id: existingId };
    }
    throw e;
  }
}

async function findRazorpayCustomerIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let skip = 0;
  const pageSize = 100;

  for (let page = 0; page < 10; page++) {
    const data = await razorpayGet<{
      items?: CustomerRow[];
      count?: number;
    }>(`/customers?count=${pageSize}&skip=${skip}`);

    const items = data.items ?? [];
    const match = items.find((c) => c.email?.trim().toLowerCase() === normalized);
    if (match?.id) return match.id;

    if (items.length < pageSize) break;
    skip += pageSize;
  }

  return null;
}
