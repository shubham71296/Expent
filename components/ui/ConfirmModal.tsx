import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

export type ConfirmTone = 'danger' | 'primary' | 'success';

const TONE_CONFIG: Record<
  ConfirmTone,
  {
    headerBg: string;
    outerCircle: string;
    innerCircle: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor: string;
    confirmVariant: 'primary' | 'destructive';
  }
> = {
  danger: {
    headerBg: 'bg-rose-50 dark:bg-rose-950/25',
    outerCircle: 'bg-rose-100/90 dark:bg-rose-950/50',
    innerCircle: 'bg-white dark:bg-slate-900',
    icon: 'trash-can-outline',
    iconColor: '#e11d48',
    confirmVariant: 'destructive',
  },
  success: {
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/25',
    outerCircle: 'bg-emerald-100/90 dark:bg-emerald-950/50',
    innerCircle: 'bg-white dark:bg-slate-900',
    icon: 'swap-horizontal',
    iconColor: '#059669',
    confirmVariant: 'primary',
  },
  primary: {
    headerBg: 'bg-indigo-50 dark:bg-indigo-950/25',
    outerCircle: 'bg-indigo-100/90 dark:bg-indigo-950/50',
    innerCircle: 'bg-white dark:bg-slate-900',
    icon: 'information-outline',
    iconColor: '#4f46e5',
    confirmVariant: 'primary',
  },
};

type Props = {
  visible: boolean;
  tone?: ConfirmTone;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  children?: ReactNode;
};

export function ConfirmModal({
  visible,
  tone = 'primary',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onClose,
  onConfirm,
  loading,
  children,
}: Props) {
  const config = TONE_CONFIG[tone];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          className="absolute inset-0 bg-slate-900/55"
          onPress={onClose}
          accessibilityLabel="Close dialog"
        />
        <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <View className={`items-center px-6 pb-5 pt-8 ${config.headerBg}`}>
            <View
              className={`mb-4 h-[72px] w-[72px] items-center justify-center rounded-full ${config.outerCircle}`}>
              <View
                className={`h-14 w-14 items-center justify-center rounded-full ${config.innerCircle}`}>
                <MaterialCommunityIcons name={config.icon} size={28} color={config.iconColor} />
              </View>
            </View>
            <Text className="text-center text-xl font-bold text-slate-900 dark:text-white">{title}</Text>
            <Text className="mt-2 text-center text-sm leading-5 text-slate-500 dark:text-slate-400">
              {message}
            </Text>
          </View>

          {children ? (
            <View className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">{children}</View>
          ) : null}

          <View className="flex-row gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/50">
            <View className="flex-1">
              <Button title={cancelLabel} variant="secondary" onPress={onClose} disabled={loading} />
            </View>
            <View className="flex-1">
              <Button
                title={confirmLabel}
                variant={config.confirmVariant}
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
