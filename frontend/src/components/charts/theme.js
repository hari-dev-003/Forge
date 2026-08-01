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
export const CHART_COLORS = ['#eeb31c', '#80db66', '#3b82f6', '#f59e0b', '#ef4444', '#9b9db1'];

// Charts render outside the DOM's cascade (ECharts paints to canvas), so they
// can't inherit --font-sans and have to be told the family explicitly. Read it
// from the same CSS token the rest of the UI uses so the two can't drift apart.
export const CHART_FONT =
  typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
      'Clash Grotesk, system-ui, sans-serif'
    : 'Clash Grotesk, system-ui, sans-serif';

// ECharts renders to <canvas>, so it can't read CSS custom properties —
// these numbers are the canvas-side equivalents of --text-2xs/--text-xs in
// index.css and must be updated by hand if that scale ever changes.
export const axisCommon = {
  axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
  axisLabel: { color: '#9b9db1', fontFamily: CHART_FONT, fontSize: 10, margin: 8 }, // --text-2xs
  splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.03)' } },
  axisTick: { show: false },
};

export const tooltipCommon = {
  backgroundColor: 'rgba(24, 24, 27, 0.95)',
  borderColor: 'rgba(238, 179, 28, 0.15)',
  borderWidth: 1,
  borderRadius: 12,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 12,
  padding: [10, 14],
  textStyle: { color: '#ffffff', fontFamily: CHART_FONT, fontSize: 12 }, // --text-xs
};
