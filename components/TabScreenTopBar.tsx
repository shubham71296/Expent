import { AvatarProfileMenu } from '@/components/AvatarProfileMenu';
import { BlockIcon } from '@/components/ui/Card';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getProfileFromSession } from '@/lib/userProfile';
import { useSupabase } from '@/providers/SupabaseProvider';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { formatDisplayHeaderDateTime } from '@/utils/dateFormat';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  showDateTime?: boolean;
};

function CurrentDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View className="mb-2.5 flex-row items-center gap-1.5">
      <MaterialCommunityIcons name="clock-outline" size={13} color="#6366f1" />
      <Text className="text-xs text-indigo-800/75 dark:text-indigo-200/70">
        {formatDisplayHeaderDateTime(now)}
      </Text>
    </View>
  );
}

function UserProfileBadge() {
  const { session } = useSupabase();
  if (!isSupabaseConfigured || !session?.user) return null;

  const { name, email, avatarLetter } = getProfileFromSession(session);

  return (
    <View className="max-w-[46%] shrink-0 flex-row items-center gap-2 pt-0.5">
      <View className="min-w-0 flex-1 items-end">
        <Text
          className="text-right text-sm font-semibold leading-5 text-slate-900 dark:text-white"
          numberOfLines={1}>
          {name}
        </Text>
        {email ? (
          <Text className="text-right text-xs leading-4 text-slate-600 dark:text-slate-300" numberOfLines={1}>
            {email}
          </Text>
        ) : null}
      </View>
      <AvatarProfileMenu avatarLetter={avatarLetter} name={name} email={email} />
    </View>
  );
}

/** Title, subtitle, and profile — one card-style header block. */
export function TabScreenTopBar({
  title,
  subtitle,
  className = 'mb-4',
  icon,
  showDateTime = false,
}: Props) {
  return (
    <View
      className={`rounded-3xl border border-indigo-100 bg-indigo-50/95 px-4 py-3.5 shadow-sm dark:border-indigo-950 dark:bg-indigo-950/55 ${className}`}>
      {showDateTime ? <CurrentDateTime /> : null}
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-2.5 pr-1">
          {icon ? (
            <BlockIcon
              name={icon}
              color="#4f46e5"
              containerClassName="bg-indigo-100 dark:bg-indigo-900/60"
              size={20}
            />
          ) : null}
          <View className="min-w-0 flex-1">
            <Text
              className="text-xl font-bold leading-7 text-indigo-950 dark:text-indigo-50"
              numberOfLines={1}
              accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text
                className="mt-0.5 text-xs font-normal leading-4 text-indigo-800/75 dark:text-indigo-200/70"
                numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <UserProfileBadge />
      </View>
    </View>
  );
}
