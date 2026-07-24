import { echarts, ReactEChartsCore, axisCommon, tooltipCommon } from './theme.js';

/** 7-day (or N-day) trend line, themed to match the app. */
export default function LineChart({ data = [], height = 200 }) {
  const option = {
    grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', ...tooltipCommon },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.day?.slice(5) ?? ''),
      boundaryGap: false,
      ...axisCommon,
    },
    yAxis: { type: 'value', minInterval: 1, ...axisCommon },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.count),
        smooth: true,
        symbolSize: 6,
        lineStyle: { color: '#eeb31c', width: 2.5 },
        itemStyle: { color: '#eeb31c' },
        areaStyle: { color: 'rgba(238,179,28,0.15)' },
      },
    ],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />;
}
