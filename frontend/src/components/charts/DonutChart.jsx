import { echarts, ReactEChartsCore, CHART_COLORS, tooltipCommon } from './theme.js';

/** Category-distribution donut (e.g. meeting type split). */
export default function DonutChart({ data = [], height = 200 }) {
  const option = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item', ...tooltipCommon },
    legend: {
      bottom: 0,
      textStyle: { color: '#9b9db1', fontFamily: 'Open Sans, sans-serif', fontSize: 12 },
      icon: 'circle',
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '75%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#25262f', borderWidth: 2 },
        label: { color: '#ffffff', fontFamily: 'Open Sans, sans-serif', fontSize: 12 },
        labelLine: { lineStyle: { color: 'rgba(204,211,217,0.3)' } },
        data: data.map((d) => ({ name: d.name, value: d.value })),
      },
    ],
  };

  return <ReactEChartsCore echarts={echarts} option={option} style={{ height }} notMerge />;
}
