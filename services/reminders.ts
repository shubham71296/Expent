import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

const DAILY_REMINDER_KIND = 'expent-daily';
const LEGACY_DAILY_REMINDER_KIND = 'exptrack-daily';

export async function cancelExpenseReminders() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter(
        (n) =>
          n.content.data?.kind === DAILY_REMINDER_KIND ||
          n.content.data?.kind === LEGACY_DAILY_REMINDER_KIND
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function scheduleExpenseReminder(hour: number, minute: number) {
  await cancelExpenseReminders();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Expent',
      body: 'Add today’s expenses in a few taps.',
      data: { kind: DAILY_REMINDER_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
