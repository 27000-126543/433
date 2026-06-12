import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface BarChartProps {
  xData: string[];
  series: {
    name: string;
    data: number[];
    color?: string;
    type?: 'bar' | 'line';
  }[];
  yAxisName?: string;
  height?: number;
  showLegend?: boolean;
  onPointClick?: (index: number, item: any) => void;
  selectedIndex?: number | null;
}

export const BarChart: React.FC<BarChartProps> = ({
  xData,
  series,
  yAxisName,
  height = 300,
  showLegend = true,
  onPointClick,
  selectedIndex = null,
}) => {
  const colors = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444'];

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#e2e8f0' },
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(14, 165, 233, 0.1)' },
      },
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
      data: xData,
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
      type: s.type || 'bar',
      barWidth: s.type === 'line' ? undefined : '40%',
      barMaxWidth: 30,
      itemStyle: {
        color: (params: any) => {
          if (params.dataIndex === selectedIndex && s.type !== 'line') {
            return '#8B5CF6';
          }
          return s.color || colors[index % colors.length];
        },
        borderRadius: [4, 4, 0, 0],
        cursor: onPointClick ? 'pointer' : 'default',
      },
      lineStyle: s.type === 'line' ? {
        width: 2,
        color: s.color || colors[index % colors.length],
        type: 'dashed',
      } : undefined,
      symbol: s.type === 'line' ? 'none' : undefined,
      data: s.data,
    })),
  };

  const onEvents = useCallback(() => {
    if (!onPointClick) return {};
    return {
      click: (params: any) => {
        if (params.dataIndex !== undefined) {
          const values: Record<string, number> = {};
          series.forEach(s => {
            values[s.name] = s.data[params.dataIndex] ?? 0;
          });
          onPointClick(params.dataIndex, {
            index: params.dataIndex,
            label: xData[params.dataIndex],
            values,
          });
        }
      },
    };
  }, [onPointClick, xData, series]);

  const hasData = series.some(s => s.data && s.data.length > 0 && s.data.some(v => v !== undefined && v !== null));
  
  if (!xData || xData.length === 0 || !hasData) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '14px' }}>暂无数据</p>
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ height }}
      opts={{ renderer: 'canvas' }}
      onEvents={onEvents()}
    />
  );
};
