import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Dimensions, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  avatarLetter: string;
  name?: string;
  email?: string | null;
};

type MenuItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  destructive?: boolean;
  onPress: () => void;
};

export function AvatarProfileMenu({ avatarLetter, name, email }: Props) {
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ top: 0, right: 16 });
  const avatarRef = useRef<View>(null);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      const { width: winWidth } = Dimensions.get('window');
      setMenuLayout({
        top: y + height + 8,
        right: Math.max(12, winWidth - x - width),
      });
      setOpen(true);
    });
  }, []);

  const items: MenuItem[] = [
    {
      key: 'profile',
      label: 'My profile',
      subtitle: 'Name, email & account',
      icon: 'account-circle-outline',
      iconColor: '#4f46e5',
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/60',
      onPress: () => {
        close();
        router.push('/(tabs)/profile');
      },
    },
    {
      key: 'logout',
      label: 'Sign out',
      subtitle: 'Log out of this device',
      icon: 'logout',
      iconColor: '#e11d48',
      iconBg: 'bg-rose-100 dark:bg-rose-950/50',
      destructive: true,
      onPress: () => {
        close();
        router.replace('/signing-out');
      },
    },
  ];

  return (
    <>
      <TouchableOpacity
        ref={avatarRef}
        onPress={openMenu}
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
        className="rounded-full">
        <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-indigo-600 shadow-md dark:border-indigo-400/40 dark:bg-indigo-500">
          <Text className="text-base font-bold text-white">{avatarLetter}</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1">
          <Pressable
            className="absolute inset-0 bg-slate-900/40"
            onPress={close}
            accessibilityLabel="Close menu"
          />
          <View
            className="absolute w-[260px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            style={{ top: menuLayout.top, right: menuLayout.right }}>
            <View className="border-b border-indigo-100 bg-indigo-600 px-4 pb-4 pt-4 dark:border-indigo-900 dark:bg-indigo-700">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20">
                  <Text className="text-lg font-bold text-white">{avatarLetter}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-bold text-white" numberOfLines={1}>
                    {name ?? 'Account'}
                  </Text>
                  {email ? (
                    <Text className="mt-0.5 text-xs text-indigo-100" numberOfLines={1}>
                      {email}
                    </Text>
                  ) : (
                    <Text className="mt-0.5 text-xs text-indigo-100">ExpTrack account</Text>
                  )}
                </View>
              </View>
            </View>

            <View className="gap-1 p-2">
              {items.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                  onPress={item.onPress}
                  className="flex-row items-center gap-3 rounded-2xl px-3 py-3">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        item.destructive
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={item.destructive ? '#f43f5e' : '#94a3b8'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
