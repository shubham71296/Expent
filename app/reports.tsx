import { Button } from '@/components/ui/Button';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { BlockIcon, Card, CardSectionHeader } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import { filterExpensesByRange, resolveFilterRange } from '@/hooks/useExpenseFilters';
import { useAppStore } from '@/store/useAppStore';
import type { Expense } from '@/types/models';
import {
  buildAllReportFileName,
  buildCustomReportFileName,
  exportDocReport,
  exportExcelReport,
  exportPdfReport,
  type ExportDeliveryResult,
} from '@/services/reportExport';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { endOfDay, startOfDay } from 'date-fns';
import { toast } from '@/lib/toast';
import { formatDisplayDate } from '@/utils/dateFormat';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';

type ExportFormat = 'pdf' | 'xlsx' | 'doc';
type ExportAction = 'all' | 'custom';

function exportExt(format: ExportFormat) {
  if (format === 'xlsx') return 'xlsx';
  if (format === 'doc') return 'doc';
  return 'pdf';
}

type PendingExport =
  | { action: 'all'; list: Expense[]; title: string }
  | { action: 'custom'; list: Expense[]; title: string; start: Date; end: Date };

const FORMAT_OPTIONS: {
  format: ExportFormat;
  label: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBgClass: string;
}[] = [
  {
    format: 'pdf',
    label: 'PDF',
    subtitle: 'Best for printing and sharing',
    icon: 'file-pdf-box',
    iconColor: '#E5252A',
    iconBgClass: 'bg-red-100 dark:bg-red-950/50',
  },
  {
    format: 'xlsx',
    label: 'Excel (.xlsx)',
    subtitle: 'Spreadsheet for analysis',
    icon: 'file-excel-box',
    iconColor: '#217346',
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  {
    format: 'doc',
    label: 'Word (.doc)',
    subtitle: 'Editable document',
    icon: 'file-word-box',
    iconColor: '#2B579A',
    iconBgClass: 'bg-blue-100 dark:bg-blue-950/50',
  },
];

const FORMAT_PILLS = [
  { label: 'PDF', textClass: 'text-red-600', bgClass: 'bg-red-100 dark:bg-red-950/80' },
  { label: 'Excel', textClass: 'text-emerald-700', bgClass: 'bg-emerald-100 dark:bg-emerald-950/80' },
  { label: 'Word', textClass: 'text-blue-700', bgClass: 'bg-blue-100 dark:bg-blue-950/80' },
] as const;

function ChooseFormatModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (format: ExportFormat) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
          accessibilityLabel="Close format picker"
        />
        <View className="rounded-t-3xl border-t border-slate-200 bg-white px-4 pb-8 pt-5 dark:border-slate-700 dark:bg-slate-900">
          <View className="mb-4 items-center">
            <View className="mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
            <Text className="text-lg font-bold text-slate-900 dark:text-white">Choose format</Text>
            <Text className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
              Select how you want to download the report.
            </Text>
          </View>

          <View className="gap-2">
            {FORMAT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.format}
                accessibilityRole="button"
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={() => onSelect(option.format)}
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
                <View
                  className={`h-11 w-11 items-center justify-center rounded-xl ${option.iconBgClass}`}>
                  <MaterialCommunityIcons name={option.icon} size={26} color={option.iconColor} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-slate-900 dark:text-white">
                    {option.label}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {option.subtitle}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-4">
            <Button title="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReportActionCard({
  title,
  subtitle,
  badge,
  icon,
  iconColor,
  iconBg,
  borderClass,
  bgClass,
  loading,
  disabled,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  borderClass: string;
  bgClass: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: (event: GestureResponderEvent) => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-3xl border p-4 shadow-sm web:opacity-95 web:hover:opacity-100 ${borderClass} ${bgClass} ${
        disabled && !loading ? 'opacity-50' : ''
      }`}>
      <View className="flex-row items-center gap-3">
        <BlockIcon name={icon} color={iconColor} containerClassName={iconBg} size={24} />
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-slate-900 dark:text-white">{title}</Text>
          <Text className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{subtitle}</Text>
          {badge ? (
            <View className="mt-2 self-start rounded-full bg-white/80 px-2.5 py-0.5 dark:bg-slate-900/60">
              <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={22} color={iconColor} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function DateStepButton({
  label,
  value,
  step,
  disabled,
  active,
  onPress,
}: {
  label: string;
  value: string | null;
  step: number;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 ${
        active
          ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/40'
          : value
            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30'
            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
      } ${disabled ? 'opacity-40' : ''}`}>
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          value ? 'bg-emerald-600' : active ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}>
        {value ? (
          <MaterialCommunityIcons name="check" size={16} color="#fff" />
        ) : (
          <Text
            className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
            {step}
          </Text>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</Text>
        <Text className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">
          {value ?? 'Tap to choose'}
        </Text>
      </View>
      <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#6366f1" />
    </TouchableOpacity>
  );
}

export default function ReportsScreen() {
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const primary = useAppStore((s) => s.settings.primaryCurrency);

  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [datePicker, setDatePicker] = useState<'start' | 'end' | null>(null);
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(null);

  const rangeComplete = customStart !== null && customEnd !== null;

  const customRange = useMemo(() => {
    if (!rangeComplete) return null;
    return resolveFilterRange('custom', customStart, customEnd);
  }, [customStart, customEnd, rangeComplete]);

  const customList = useMemo(() => {
    if (!customRange) return [];
    return filterExpensesByRange(expenses, customRange);
  }, [expenses, customRange]);

  const runExport = useCallback(
    async (
      format: ExportFormat,
      list: Expense[],
      reportTitle: string,
      fileName: string
    ): Promise<ExportDeliveryResult> => {
      const params = {
        title: `Expent — ${reportTitle}`,
        fileName,
        expenses: list,
        categories,
        primaryCurrency: primary,
      };
      if (format === 'pdf') return exportPdfReport(params);
      if (format === 'xlsx') return exportExcelReport(params);
      return exportDocReport(params);
    },
    [categories, primary]
  );

  const exportMut = useMutation({
    mutationFn: async ({
      format,
      list,
      title,
      fileName,
    }: {
      format: ExportFormat;
      list: Expense[];
      title: string;
      fileName: string;
      action: ExportAction;
    }) => runExport(format, list, title, fileName),
    onSuccess: (result) => {
      if (result.delivery === 'downloads') {
        toast.success(`Saved as ${result.fileName} in Downloads.`, 'Report downloaded');
        return;
      }
      if (result.delivery === 'web-download') {
        toast.success(`Downloaded ${result.fileName}.`, 'Report ready');
        return;
      }
      if (result.delivery === 'web-print') {
        toast.success('Use your browser print dialog to save as PDF.', 'Report ready');
        return;
      }
      toast.success('Choose “Save to Files” or a file app to keep the report.', 'Report ready');
    },
    onError: (e: Error) => {
      toast.error(e.message, 'Export failed');
      Alert.alert('Export failed', e.message);
    },
  });

  const loadingAction = exportMut.isPending ? exportMut.variables?.action : undefined;
  const loadingAll = loadingAction === 'all';
  const loadingCustom = loadingAction === 'custom';

  const closeFormatPicker = () => setPendingExport(null);

  const handleFormatSelect = (format: ExportFormat) => {
    if (!pendingExport) return;
    const ext = exportExt(format);
    const fileName =
      pendingExport.action === 'all'
        ? buildAllReportFileName(ext)
        : buildCustomReportFileName(pendingExport.start, pendingExport.end, ext);
    const { list, title, action } = pendingExport;
    closeFormatPicker();
    exportMut.mutate({ format, list, title, fileName, action });
  };

  const downloadAll = () => {
    setPendingExport({ action: 'all', list: expenses, title: 'All records' });
  };

  const openCustomFlow = () => {
    setShowCustom(true);
    setCustomStart(null);
    setCustomEnd(null);
    setDatePicker(null);
  };

  const downloadCustomRange = () => {
    if (!customStart || !customEnd) return;
    if (customStart > customEnd) {
      Alert.alert('Invalid range', 'Start date must be on or before end date.');
      return;
    }
    setPendingExport({
      action: 'custom',
      list: customList,
      title: `${formatDisplayDate(customStart)} to ${formatDisplayDate(customEnd)}`,
      start: customStart,
      end: customEnd,
    });
  };

  const onDateChange = (
    target: 'start' | 'end',
    event: { type: string },
    date?: Date
  ) => {
    if (Platform.OS === 'android') setDatePicker(null);
    if (event.type === 'dismissed' || !date) return;
    if (target === 'start') {
      const next = startOfDay(date);
      setCustomStart(next);
      if (customEnd && next > customEnd) setCustomEnd(null);
    } else {
      setCustomEnd(endOfDay(date));
    }
  };

  return (
    <AppScreen scroll>
      <View className="gap-4 px-4 pb-10">
        <View className="flex-row items-center">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <MaterialCommunityIcons name="arrow-left" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="overflow-hidden rounded-3xl border border-sky-200 bg-sky-600 p-5 shadow-sm dark:border-sky-800 dark:bg-sky-700">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <MaterialCommunityIcons name="file-export-outline" size={30} color="#ffffff" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold text-white">Export reports</Text>
              <Text className="mt-1 text-sm leading-5 text-sky-100">
                Download polished PDF, Excel, or Word summaries of your spending.
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {FORMAT_PILLS.map((pill) => (
              <View key={pill.label} className={`rounded-full px-3 py-1 ${pill.bgClass}`}>
                <Text className={`text-xs font-bold ${pill.textClass}`}>{pill.label}</Text>
              </View>
            ))}
          </View>
          <View className="mt-3 rounded-2xl bg-white/15 px-3.5 py-2.5">
            <Text className="text-sm font-semibold text-white">
              {expenses.length} {expenses.length === 1 ? 'record' : 'records'} ready to export
            </Text>
          </View>
        </View>

        <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Choose export type
        </Text>

        <View className="gap-3">
          <ReportActionCard
            title="Download all report"
            subtitle="Every expense in your account"
            badge={`${expenses.length} records`}
            icon="cloud-download-outline"
            iconColor="#0284c7"
            iconBg="bg-sky-100 dark:bg-sky-950/60"
            borderClass="border-sky-200 dark:border-sky-800"
            bgClass="bg-sky-50/95 dark:bg-sky-950/40"
            loading={loadingAll}
            disabled={!!loadingAction && !loadingAll}
            onPress={downloadAll}
          />

          <ReportActionCard
            title="Download custom report"
            subtitle="Pick a start and end date"
            icon="calendar-range"
            iconColor="#7c3aed"
            iconBg="bg-violet-100 dark:bg-violet-950/60"
            borderClass="border-violet-200 dark:border-violet-800"
            bgClass="bg-violet-50/95 dark:bg-violet-950/40"
            disabled={!!loadingAction}
            onPress={openCustomFlow}
          />
        </View>

        {showCustom ? (
          <Card className="mt-5 border border-violet-100 dark:border-violet-900/50">
            <CardSectionHeader
              title="Custom date range"
              subtitle="Step 1 · Start date  ·  Step 2 · End date"
              icon="calendar-edit"
              iconColor="#7c3aed"
              iconBg="bg-violet-100 dark:bg-violet-950/60"
              className="mb-4"
            />

            <View className="gap-3">
              <DateStepButton
                step={1}
                label="Start date"
                value={customStart ? formatDisplayDate(customStart) : null}
                active={datePicker === 'start'}
                onPress={() => setDatePicker('start')}
              />

              {datePicker === 'start' ? (
                <View className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <DateTimePicker
                    value={customStart ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, d) => onDateChange('start', event, d)}
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      onPress={() => setDatePicker(null)}
                      className="border-t border-slate-200 py-3 dark:border-slate-700">
                      <Text className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Done
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <DateStepButton
                step={2}
                label="End date"
                value={customEnd ? formatDisplayDate(customEnd) : null}
                disabled={!customStart}
                active={datePicker === 'end'}
                onPress={() => setDatePicker('end')}
              />

              {datePicker === 'end' ? (
                <View className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <DateTimePicker
                    value={customEnd ?? customStart ?? new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={customStart ?? undefined}
                    onChange={(event, d) => onDateChange('end', event, d)}
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      onPress={() => setDatePicker(null)}
                      className="border-t border-slate-200 py-3 dark:border-slate-700">
                      <Text className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Done
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>

            {rangeComplete ? (
              <View className="mt-5 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/90 dark:border-indigo-800 dark:bg-indigo-950/40">
                <View className="border-b border-indigo-100 px-4 py-4 dark:border-indigo-900">
                  <Text className="text-center text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Download report from
                  </Text>
                  <Text className="mt-1.5 text-center text-base font-bold text-violet-700 dark:text-violet-300">
                    {formatDisplayDate(customStart!)} to {formatDisplayDate(customEnd!)}
                  </Text>
                  <Text className="mt-2 text-center text-xs text-indigo-700/80 dark:text-indigo-300/80">
                    {customList.length} {customList.length === 1 ? 'expense' : 'expenses'} in this
                    range
                  </Text>
                </View>
                <View className="p-4">
                  <Button
                    title="Download custom date report"
                    loading={loadingCustom}
                    disabled={!!loadingAction && !loadingCustom}
                    onPress={downloadCustomRange}
                  />
                </View>
              </View>
            ) : (
              <Text className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Select both dates to enable download
              </Text>
            )}
          </Card>
        ) : null}

        <View className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          {Platform.OS === 'android' ? (
            <Text className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              The first export may ask you to allow access to Downloads. After that, reports save
              directly to your Downloads folder.
            </Text>
          ) : Platform.OS === 'web' ? (
            <Text className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              Sharing behaves differently on web; use a device build for native share sheets.
            </Text>
          ) : (
            <Text className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
              Choose a format, then save or share your report from the system sheet.
            </Text>
          )}
        </View>
      </View>

      <ChooseFormatModal
        visible={pendingExport !== null}
        onClose={closeFormatPicker}
        onSelect={handleFormatSelect}
      />
    </AppScreen>
  );
}
