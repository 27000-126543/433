import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface LineChartProps {
  data: { time: string; [key: string]: number | string }[];
  series: {
    key: string;
    name: string;
    color?: string;
    unit?: string;
  }[];
  yAxisName?: string;
  height?: number;
  smooth?: boolean;
  showLegend?: boolean;
  markLines?: { yAxis: number; label: string; color: string }[];
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  series,
  yAxisName,
  height = 300,
  smooth = true,
  showLegend = true,
  markLines = [],
}) => {
  const colors = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e2e8f0' },
    },
    legend: showLegend
      ? {
          data: series.map((s) => s.name),
          textStyle: { color: '#94a3b8' },
          top: 0,
        }
      : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: showLegend ? 40 : 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((d) => d.time),
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: yAxisName,
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
    },
    series: series.map((s, index) => ({
      name: s.name,
      type: 'line',
      smooth,
      symbol: 'circle',
      symbolSize: 4,
      showSymbol: false,
      lineStyle: {
        width: 2,
        color: s.color || colors[index % colors.length],
      },
      itemStyle: {
        color: s.color || colors[index % colors.length],
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: `${s.color || colors[index % colors.length]}30` },
            { offset: 1, color: `${s.color || colors[index % colors.length]}00` },
          ],
        },
      },
      data: data.map((d) => d[s.key] as number),
      markLine: markLines.length > 0 && index === 0 ? {
        silent: true,
        symbol: 'none',
        lineStyle: {
          type: 'dashed',
          width: 1,
        },
        data: markLines.map((ml) => ({
          yAxis: ml.yAxis,
          label: {
            formatter: ml.label,
            color: ml.color,
            fontSize: 10,
          },
          lineStyle: { color: ml.color },
        })),
      } : undefined,
    })),
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
};
