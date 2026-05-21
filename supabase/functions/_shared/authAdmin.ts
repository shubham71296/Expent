type AuthUser = { id: string; email?: string };

/** Look up auth user by email via GoTrue Admin REST API (works on all Supabase versions). */
export async function findAuthUserByEmail(
  supabaseUrl: string,
  serviceKey: string,
  email: string
): Promise<{ user: AuthUser | null; lookupError?: string }> {
  const base = supabaseUrl.replace(/\/$/, '');
  const url = `${base}/auth/v1/admin/users?email=${encodeURIComponent(email)}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      return { user: null };
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[authAdmin] lookup failed', res.status, detail);
      return { user: null, lookupError: `Could not verify email (${res.status}).` };
    }

    const data = (await res.json()) as { users?: AuthUser[] } | AuthUser | null;
    const users = Array.isArray((data as { users?: AuthUser[] })?.users)
      ? (data as { users: AuthUser[] }).users
      : data && typeof data === 'object' && 'id' in data
        ? [data as AuthUser]
        : [];

    const user =
      users.find((u) => u.email?.trim().toLowerCase() === email) ?? (users[0] ?? null);
    return { user };
  } catch (e) {
    console.error('[authAdmin] lookup exception', e);
    return { user: null, lookupError: 'Could not verify email. Try again.' };
  }
}
