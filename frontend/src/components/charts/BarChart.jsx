import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts, axisCommon, tooltipCommon } from './theme.js';

/** Horizontal ranking bar (e.g. top performers by points). */
export default function BarChart({ data = [], height = 200 }) {
  // ECharts renders category axes bottom-to-top, so reverse to show the
  // highest value at the top of the list.
  const rows = [...data].reverse();

  const option = {
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipCommon },
    xAxis: { type: 'value', minInterval: 1, ...axisCommon },
    yAxis: {
      type: 'category',
      data: rows.map((d) => d.name),
      ...axisCommon,
    },
    series: [
      {
        type: 'bar',
        data: rows.map((d) => d.points),
        barMaxWidth: 22,
        itemStyle: { color: '#eeb31c', borderRadius: [0, 4, 4, 0] },
      },
    ],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />;
}
