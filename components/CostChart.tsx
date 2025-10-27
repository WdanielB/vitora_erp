import React from 'react';
import type { CostHistoryEntry } from '../types';

interface CostChartProps {
  data: CostHistoryEntry[];
  itemType: 'flower' | 'fixed';
}

const CostChart: React.FC<CostChartProps> = ({ data, itemType }) => {
  if (!data || data.length < 2) {
    return <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg text-gray-500">No hay suficientes datos para mostrar un gráfico.</div>;
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getValue = (entry: CostHistoryEntry) => itemType === 'flower' ? entry.costoPaquete : entry.costo;

  const validData = sortedData.filter(d => getValue(d) !== undefined && getValue(d) !== null);

  if (validData.length < 2) {
    return <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg text-gray-500">No hay suficientes datos de costos para mostrar un gráfico.</div>;
  }
  
  const width = 500;
  const height = 200;
  const padding = 40;

  const yMax = Math.max(...validData.map(d => getValue(d)!));
  const yMin = Math.min(...validData.map(d => getValue(d)!));
  const xMin = new Date(validData[0].date).getTime();
  const xMax = new Date(validData[validData.length - 1].date).getTime();

  const xScale = (date: string) => {
    const time = new Date(date).getTime();
    if (xMax === xMin) return padding + (width - 2 * padding) / 2;
    return padding + ((time - xMin) / (xMax - xMin)) * (width - 2 * padding);
  };
  
  const yScale = (value: number) => {
    if (yMax === yMin) return height / 2;
    return height - padding - ((value - yMin) / (yMax - yMin)) * (height - 2 * padding);
  };

  const pathData = validData.reduce((path, d, i) => {
    const x = xScale(d.date);
    const y = yScale(getValue(d)!);

    if (i === 0) {
      return `M ${x},${y}`;
    }
    
    // Get previous point's y-coordinate to create a stepped line
    const prevY = yScale(getValue(validData[i - 1])!);
    
    // Draw horizontal line to new x, then vertical line to new y
    return `${path} L ${x},${prevY} L ${x},${y}`;
  }, '');

  const yAxisLabels = () => {
    const labels = [];
    const numLabels = 5;
    if (yMax === yMin) {
        labels.push({ y: height / 2, label: `S/ ${yMax.toFixed(2)}` });
    } else {
        const range = yMax - yMin;
        for (let i = 0; i < numLabels; i++) {
            const value = yMin + (range / (numLabels - 1)) * i;
            labels.push({ y: yScale(value), label: `S/ ${value.toFixed(2)}` });
        }
    }
    return labels;
  };
  
  const xAxisLabels = () => {
      const labels = [];
      const numLabels = Math.min(validData.length, 4);
      if (numLabels <= 1) {
          if (validData.length > 0) {
              const d = validData[0];
              labels.push({ x: xScale(d.date), label: new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) });
          }
      } else {
        for (let i = 0; i < numLabels; i++) {
            const index = Math.floor(i * (validData.length - 1) / (numLabels - 1));
            const d = validData[index];
            labels.push({ x: xScale(d.date), label: new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) });
        }
      }
      return labels;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis Lines & Labels */}
        {yAxisLabels().map(({ y, label }, i) => (
          <g key={i}>
            <text x={padding - 8} y={y} textAnchor="end" alignmentBaseline="middle" fill="#9CA3AF" fontSize="10">{label}</text>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2"/>
          </g>
        ))}

        {/* X-axis Labels */}
        {xAxisLabels().map(({ x, label }, i) => (
            <text key={i} x={x} y={height - padding + 15} textAnchor="middle" fill="#9CA3AF" fontSize="10">{label}</text>
        ))}
        
        {/* Axis Lines */}
        <line x1={padding} y1={padding/2} x2={padding} y2={height - padding} stroke="#4B5563" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth="1" />
        
        {/* Line Path */}
        <path d={pathData} fill="none" stroke="#A78BFA" strokeWidth="2" />
        
        {/* Data Points */}
        {validData.map((d, i) => {
          const value = getValue(d)!;
          return (
            <g key={i} className="group">
              <circle cx={xScale(d.date)} cy={yScale(value)} r="8" fill="transparent" />
              <circle cx={xScale(d.date)} cy={yScale(value)} r="3" fill="#A78BFA" className="group-hover:r-4 transition-all" />
              <title>{`Fecha: ${new Date(d.date).toLocaleString('es-ES')}\nCosto: S/ ${value.toFixed(2)}`}</title>
            </g>
          )
        })}
      </svg>
    </div>
  );
};

export default CostChart;