import { echarts, ReactEChartsCore, CHART_COLORS, tooltipCommon, CHART_FONT } from './theme.js';

/** Category-distribution donut (e.g. meeting type split). */
export default function DonutChart({ data = [], height = 200 }) {
  const option = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item', ...tooltipCommon },
    legend: {
      bottom: 0,
      textStyle: { color: '#9b9db1', fontFamily: CHART_FONT, fontSize: 12 },
      icon: 'circle',
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#18181b', borderWidth: 3, borderRadius: 6 },
        label: { color: '#ffffff', fontFamily: CHART_FONT, fontSize: 12 },
        labelLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        data: data.map((d) => ({ name: d.name, value: d.value })),
      },
    ],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />;
}
