import type { ReactNode } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  children?: ReactNode;
};

export function DeleteConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Keep it',
  onClose,
  onConfirm,
  loading,
  children,
}: Props) {
  return (
    <ConfirmModal
      visible={visible}
      tone="danger"
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      children={children}
    />
  );
}
