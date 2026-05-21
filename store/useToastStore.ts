import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

type ToastPayload = {
  type: ToastType;
  title: string;
  message: string;
};

type ToastState = {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
  show: (payload: ToastPayload) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | undefined;

const DURATION: Record<ToastType, number> = {
  success: 2800,
  error: 3500,
  info: 2800,
};

export const useToastStore = create<ToastState>((set, get) => ({
  visible: false,
  type: 'info',
  title: '',
  message: '',
  show: ({ type, title, message }) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: true, type, title, message });
    hideTimer = setTimeout(() => {
      if (get().visible) set({ visible: false });
    }, DURATION[type]);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
}));
