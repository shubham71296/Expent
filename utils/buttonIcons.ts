import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type ButtonIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function resolveButtonIcon(
  title: string,
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive' = 'primary'
): ButtonIconName {
  const t = title.toLowerCase().trim();

  if (t === 'view' || t.startsWith('view ')) return 'eye-outline';
  if (t.includes('edit expense') || t === 'edit') return 'pencil-outline';
  if (t.includes('update profile')) return 'account-edit-outline';
  if (t === 'next') return 'arrow-right';
  if (t.includes('get started')) return 'rocket-launch-outline';
  if (t.includes('skip')) return 'skip-next-outline';
  if (t.includes('sign out') || t.includes('log out')) return 'logout';
  if (t.includes('sign in') || t.includes('log in')) return 'login';
  if (t.includes('create account')) return 'account-plus-outline';
  if (t.includes('send reset')) return 'email-fast-outline';
  if (t.includes('replay onboarding')) return 'replay';
  if (t.includes('add category')) return 'tag-plus-outline';
  if (t.includes('save') || t.includes('add expense')) return 'content-save-outline';
  if (variant === 'destructive' || t.includes('delete') || t === 'remove') return 'trash-can-outline';
  if (t.includes('cancel') || t === 'close' || t.includes('keep it')) return 'close';
  if (t.includes('confirm') || t.includes('change primary')) return 'check-circle-outline';
  if (t.includes('download')) return 'download';
  if (t.includes('send')) return 'send';

  return variant === 'ghost' ? 'chevron-right' : 'gesture-tap-button';
}
