import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface GaugeChartProps {
  value: number;
  max?: number;
  min?: number;
  title?: string;
  unit?: string;
  warningThreshold?: number;
  dangerThreshold?: number;
  height?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max = 100,
  min = 0,
  title,
  unit = '%',
  warningThreshold = 80,
  dangerThreshold = 90,
  height = 200,
}) => {
  const getColor = (val: number) => {
    if (val >= dangerThreshold) return '#EF4444';
    if (val >= warningThreshold) return '#F59E0B';
    return '#10B981';
  };

  const color = getColor(value);
  const percentage = ((value - min) / (max - min)) * 100;

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min,
        max,
        splitNumber: 10,
        radius: '90%',
        center: ['50%', '55%'],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#10B981' },
              { offset: 0.7, color: '#F59E0B' },
              { offset: 1, color: '#EF4444' },
            ],
          },
        },
        progress: {
          show: true,
          width: 12,
          roundCap: true,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 12,
            color: [[1, 'rgba(148, 163, 184, 0.1)']],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        anchor: {
          show: false,
        },
        title: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '0%'],
          fontSize: 28,
          fontWeight: 600,
          formatter: `{value}${unit}`,
          color,
        },
        data: [
          {
            value: Math.round(value * 10) / 10,
          },
        ],
      },
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min,
        max,
        splitNumber: 10,
        radius: '95%',
        center: ['50%', '55%'],
        itemStyle: {
          color: 'transparent',
        },
        progress: {
          show: false,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          distance: -18,
          splitNumber: 5,
          lineStyle: {
            width: 1,
            color: 'rgba(148, 163, 184, 0.3)',
          },
        },
        splitLine: {
          distance: -25,
          length: 10,
          lineStyle: {
            width: 2,
            color: 'rgba(148, 163, 184, 0.5)',
          },
        },
        axisLabel: {
          distance: 8,
          color: '#64748b',
          fontSize: 10,
          formatter: (v: number) => {
            if (v === min || v === max) return v.toString();
            return '';
          },
        },
        detail: {
          show: false,
        },
      },
    ],
    graphic: title
      ? [
          {
            type: 'text',
            left: 'center',
            bottom: 10,
            style: {
              text: title,
              fill: '#94a3b8',
              fontSize: 13,
              fontWeight: 500,
            },
          },
        ]
      : [],
  };

  return <ReactECharts option={option} style={{ height }} opts={{ renderer: 'canvas' }} />;
};
