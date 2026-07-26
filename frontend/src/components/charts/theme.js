// Shared ECharts styling so every chart matches the app's dark/amber theme
// without repeating axis/tooltip boilerplate in each chart component.
//
// We register only the chart/component modules we actually use via
// `echarts/core` (tree-shakeable) instead of importing all of `echarts` —
// the full bundle pulls in every chart type + component and is ~1MB+ heavier.
import * as echarts from 'echarts/core';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCoreImport from 'echarts-for-react/lib/core';

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export { echarts };

// Vite's CJS interop for this subpath sometimes hands back the raw
// `{ default, __esModule }` wrapper instead of unwrapping it — fall back to
// `.default` when that happens.
export const ReactEChartsCore = ReactEChartsCoreImport?.default ?? ReactEChartsCoreImport;

// Gold-forward, not a rainbow: lead with the primary accent + a muted
// neutral (the two colors that actually show up in the 2-category donut),
// success/danger kept only as semantic fallbacks for genuinely
// positive/negative categories, not arbitrary series filler.
export const CHART_COLORS = ['#eeb31c', '#9b9db1', '#cb960e', '#80db66', '#ef4444'];

export const axisCommon = {
  axisLine: { lineStyle: { color: 'rgba(204,211,217,0.2)' } },
  axisLabel: { color: '#9b9db1', fontFamily: 'DM Sans, sans-serif', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(204,211,217,0.06)' } },
  axisTick: { show: false },
};

export const tooltipCommon = {
  backgroundColor: '#25262f',
  borderColor: 'rgba(204,211,217,0.2)',
  borderWidth: 1,
  textStyle: { color: '#ffffff', fontFamily: 'DM Sans, sans-serif', fontSize: 12 },
};
