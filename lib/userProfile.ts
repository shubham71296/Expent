import type { Session, User } from '@supabase/supabase-js';

function readMetaString(user: User | undefined, key: string): string | undefined {
  const raw = user?.user_metadata?.[key];
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return undefined;
}

export function getUserDisplayName(user: User | undefined): string {
  const fullName = readMetaString(user, 'full_name') ?? readMetaString(user, 'name');
  if (fullName) return fullName;
  const email = user?.email?.trim();
  if (email) return email.split('@')[0] ?? 'User';
  return 'User';
}

export function getUserEmail(user: User | undefined): string | null {
  return user?.email?.trim() ?? null;
}

export function getAvatarLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function getProfileFromSession(session: Session | null) {
  const user = session?.user;
  const name = getUserDisplayName(user);
  return {
    name,
    email: getUserEmail(user),
    avatarLetter: getAvatarLetter(name),
  };
}
