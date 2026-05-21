import { useToastStore, type ToastType } from '@/store/useToastStore';

function show(type: ToastType, message: string, title: string) {
  useToastStore.getState().show({ type, title, message });
}

export const toast = {
  success(message: string, title = 'Success') {
    show('success', message, title);
  },
  error(message: string, title = 'Error') {
    show('error', message, title);
  },
  info(message: string, title = 'Notice') {
    show('info', message, title);
  },
  hide() {
    useToastStore.getState().hide();
  },
};
