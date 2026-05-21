import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AppScreen } from '@/components/ui/Screen';
import { useFilteredExpenses } from '@/hooks/useExpenseFilters';
import { useExpenseStats, useSpendingBars, useSpendingTrend } from '@/hooks/useExpenseStats';
import { formatMoneyAmount } from '@/hooks/useFormatMoney';
import { useAppStore } from '@/store/useAppStore';
import type { DateFilterPreset } from '@/types/models';
import {
  chartMaxValue,
  fitBarLayout,
  fitLineSpacing,
  formatChartAxisValue,
  thinAxisLabels,
} from '@/utils/chartHelpers';
import { useMemo, useState, type ReactNode } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

type AnalyticsPreset = Extract<DateFilterPreset, 'monthly' | 'yearly'>;

const PRESETS: { key: AnalyticsPreset; label: string }[] = [
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
];

const CHART_HEIGHT = 190;
const Y_AXIS_WIDTH = 46;

export default function AnalyticsScreen() {
  const scheme = useColorScheme();
  const expenses = useAppStore((s) => s.expenses);
  const [preset, setPreset] = useState<AnalyticsPreset>('monthly');
  const [barChartWidth, setBarChartWidth] = useState(0);
  const [lineChartWidth, setLineChartWidth] = useState(0);
  const { list } = useFilteredExpenses(expenses, preset);
  const stats = useExpenseStats(list);
  const bars = useSpendingBars(list, preset);
  const trend = useSpendingTrend(list, preset);
  const innerCircle = scheme === 'dark' ? '#0f172a' : '#ffffff';
  const axisColor = scheme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = scheme === 'dark' ? '#334155' : '#e2e8f0';

  const pieData = useMemo(() => {
    return stats.topCategories.slice(0, 8).map((x) => ({
      value: Math.round(x.total * 100) / 100,
      color: x.category.color,
    }));
  }, [stats.topCategories]);

  const pieTotal = useMemo(() => pieData.reduce((sum, slice) => sum + slice.value, 0), [pieData]);

  const barData = useMemo(() => {
    const raw = bars.points.map((m) => ({
      value: Math.round(m.value * 100) / 100,
      label: m.label,
    }));
    return preset === 'yearly' ? thinAxisLabels(raw, 6) : raw;
  }, [bars.points, preset]);

  const lineData = useMemo(() => {
    const raw = trend.points.map((p) => ({
      value: Math.round(p.value * 100) / 100,
      label: p.label,
    }));
    return preset === 'yearly' ? thinAxisLabels(raw, 6) : raw;
  }, [trend.points, preset]);

  const barValues = barData.map((b) => b.value);
  const lineValues = lineData.map((p) => p.value);
  const barMax = chartMaxValue(barValues);
  const lineMax = chartMaxValue(lineValues);
  const barCount = Math.max(barData.length, 1);
  const lineCount = Math.max(lineData.length, 1);

  const barLayout = useMemo(() => {
    const plotWidth = Math.max(barChartWidth - Y_AXIS_WIDTH, 0);
    return fitBarLayout(plotWidth, barCount, preset);
  }, [barChartWidth, barCount, preset]);

  const lineSpacing = useMemo(() => {
    const plotWidth = Math.max(lineChartWidth - Y_AXIS_WIDTH, 0);
    return fitLineSpacing(plotWidth, lineCount, preset);
  }, [lineChartWidth, lineCount, preset]);

  const lineLabelWidth = useMemo(
    () => (preset === 'yearly' ? Math.max(lineSpacing, 24) : Math.max(lineSpacing, 40)),
    [lineSpacing, preset]
  );

  const hasBarData = barValues.some((v) => v > 0);
  const hasLineData = lineValues.some((v) => v > 0);
  const lineCurved = lineValues.filter((v) => v > 0).length >= 3;

  const secondaryStat =
    preset === 'yearly'
      ? {
          label: 'This year (all)',
          value: formatMoneyAmount(stats.yearTotal.total, stats.yearTotal.currency),
          icon: 'calendar-range' as const,
        }
      : {
          label: 'This month (all)',
          value: formatMoneyAmount(stats.monthTotal.total, stats.monthTotal.currency),
          icon: 'calendar-month-outline' as const,
        };

  return (
    <AppScreen scroll variant="tab">
      <View className="px-4">
        <TabScreenTopBar
          title="Analytics"
          subtitle="Monthly and yearly spending insights"
          icon="chart-line"
        />

        <View className="mb-4 flex-row gap-2">
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.key}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={() => setPreset(p.key)}
              className={`flex-1 rounded-xl py-2.5 ${preset === p.key ? 'bg-indigo-600' : 'bg-white dark:bg-slate-900'}`}>
              <Text
                className={`text-center text-sm font-semibold ${preset === p.key ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-4 flex-row flex-wrap gap-3">
          <MiniStat
            label={preset === 'yearly' ? 'Total (this year)' : 'Total (this month)'}
            value={formatMoneyAmount(stats.rangeTotal.total, stats.rangeTotal.currency)}
            icon="calculator-variant-outline"
            iconColor="#4f46e5"
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
          />
          <MiniStat
            label={secondaryStat.label}
            value={secondaryStat.value}
            icon={secondaryStat.icon}
            iconColor="#7c3aed"
            iconBg="bg-violet-50 dark:bg-violet-950/50"
          />
        </View>

        <Card className="mb-4 items-center py-4">
          <CardSectionHeader
            title="Categories"
            icon="chart-donut"
            iconColor="#7c3aed"
            iconBg="bg-violet-50 dark:bg-violet-950/50"
            className="mb-3 self-stretch"
          />
          {pieData.length === 0 ? (
            <Text className="py-8 text-slate-500">No data for this range.</Text>
          ) : (
            <>
              <PieChart
                data={pieData}
                donut
                innerRadius={52}
                radius={88}
                innerCircleColor={innerCircle}
                showText={false}
                focusOnPress
                centerLabelComponent={() => (
                  <View className="items-center px-2">
                    <Text className="text-[10px] font-medium uppercase text-slate-500 dark:text-slate-400">
                      Total
                    </Text>
                    <Text
                      className="text-center text-sm font-bold text-slate-900 dark:text-white"
                      numberOfLines={2}>
                      {formatMoneyAmount(pieTotal, stats.rangeTotal.currency)}
                    </Text>
                  </View>
                )}
              />
              <View className="mt-4 w-full gap-2 px-1">
                {stats.topCategories.slice(0, 8).map((item) => {
                  const pct = pieTotal > 0 ? Math.round((item.total / pieTotal) * 100) : 0;
                  return (
                    <View
                      key={item.category.id}
                      className="flex-row items-center justify-between gap-2">
                      <View className="min-w-0 flex-1 flex-row items-center gap-2">
                        <View
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.category.color }}
                        />
                        <Text
                          className="flex-1 text-sm text-slate-700 dark:text-slate-200"
                          numberOfLines={1}>
                          {item.category.name}
                        </Text>
                      </View>
                      <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatMoneyAmount(item.total, item.currency)}
                      </Text>
                      <Text className="w-10 text-right text-xs text-slate-500">{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </Card>

        <Card className="mb-4">
          <CardSectionHeader
            title={bars.title}
            icon="chart-bar"
            iconColor="#4f46e5"
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
            className="mb-3"
          />
          {!hasBarData ? (
            <Text className="py-6 text-center text-slate-500">No spending data for this range.</Text>
          ) : (
            <ChartContainer onWidth={setBarChartWidth}>
              {barChartWidth > 0 ? (
                <BarChart
                  data={barData}
                  width={barChartWidth}
                  height={CHART_HEIGHT}
                  barWidth={barLayout.barWidth}
                  spacing={barLayout.spacing}
                  initialSpacing={barLayout.spacing}
                  endSpacing={barLayout.spacing}
                  maxValue={barMax}
                  noOfSections={4}
                  yAxisLabelWidth={Y_AXIS_WIDTH}
                  formatYLabel={formatChartAxisValue}
                  xAxisLabelsHeight={24}
                  labelsExtraHeight={6}
                  disableScroll
                  roundedTop
                  roundedBottom
                  frontColor="#6366f1"
                  yAxisColor="transparent"
                  xAxisColor={gridColor}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  rulesColor={gridColor}
                  rulesType="solid"
                  hideRules={false}
                  yAxisTextStyle={{ color: axisColor, fontSize: 11 }}
                  xAxisLabelTextStyle={{
                    color: axisColor,
                    fontSize: preset === 'yearly' ? 10 : 11,
                    width: barLayout.labelWidth,
                    textAlign: 'center',
                  }}
                />
              ) : null}
            </ChartContainer>
          )}
        </Card>

        <Card className="mb-4">
          <CardSectionHeader
            title={trend.title}
            icon="chart-timeline-variant"
            iconColor="#059669"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            className="mb-3"
          />
          {!hasLineData ? (
            <Text className="py-6 text-center text-slate-500">No trend data for this range.</Text>
          ) : (
            <ChartContainer onWidth={setLineChartWidth}>
              {lineChartWidth > 0 ? (
                <LineChart
                  data={lineData}
                  width={lineChartWidth}
                  height={CHART_HEIGHT}
                  spacing={lineSpacing}
                  initialSpacing={barLayout.spacing}
                  endSpacing={barLayout.spacing}
                  maxValue={lineMax}
                  noOfSections={4}
                  yAxisLabelWidth={Y_AXIS_WIDTH}
                  formatYLabel={formatChartAxisValue}
                  xAxisLabelsHeight={24}
                  labelsExtraHeight={6}
                  adjustToWidth
                  thickness={2.5}
                  color="#059669"
                  dataPointsColor="#059669"
                  dataPointsRadius={preset === 'yearly' ? 3 : 4}
                  curved={lineCurved}
                  yAxisColor="transparent"
                  xAxisColor={gridColor}
                  yAxisThickness={0}
                  xAxisThickness={1}
                  rulesColor={gridColor}
                  rulesType="solid"
                  hideRules={false}
                  yAxisTextStyle={{ color: axisColor, fontSize: 11 }}
                  xAxisLabelTextStyle={{
                    color: axisColor,
                    fontSize: preset === 'yearly' ? 10 : 11,
                    width: lineLabelWidth,
                    textAlign: 'center',
                  }}
                />
              ) : null}
            </ChartContainer>
          )}
        </Card>
      </View>
    </AppScreen>
  );
}

function ChartContainer({
  children,
  onWidth,
}: {
  children: ReactNode;
  onWidth: (w: number) => void;
}) {
  return (
    <View
      className="w-full overflow-hidden"
      style={{ minHeight: CHART_HEIGHT + 32 }}
      onLayout={(e) => {
        const w = Math.floor(e.nativeEvent.layout.width);
        if (w > 0) onWidth(w);
      }}>
      {children}
    </View>
  );
}

function MiniStat({
  label,
  value,
  icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <View className="min-w-[45%] flex-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</Text>
        <View className={`h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
      </View>
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}
