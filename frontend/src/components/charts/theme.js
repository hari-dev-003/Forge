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

echarts.use([LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export { echarts };

export const CHART_COLORS = ['#eeb31c', '#80db66', '#3b82f6', '#f59e0b', '#ef4444'];

export const axisCommon = {
  axisLine: { lineStyle: { color: 'rgba(204,211,217,0.2)' } },
  axisLabel: { color: '#9b9db1', fontFamily: 'Open Sans, sans-serif', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(204,211,217,0.08)' } },
  axisTick: { show: false },
};

export const tooltipCommon = {
  backgroundColor: '#25262f',
  borderColor: 'rgba(204,211,217,0.2)',
  borderWidth: 1,
  textStyle: { color: '#ffffff', fontFamily: 'Open Sans, sans-serif', fontSize: 12 },
};
