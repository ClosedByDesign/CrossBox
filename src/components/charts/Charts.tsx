import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisStyle = { fontSize: 11, fill: 'rgb(var(--c-muted))' };
const gridColor = 'rgb(var(--c-line))';
const brand = 'rgb(var(--c-brand))';

const tooltipStyle = {
  background: 'rgb(var(--c-surface))',
  border: '1px solid rgb(var(--c-line))',
  borderRadius: 10,
  fontSize: 12,
  color: 'rgb(var(--c-ink))',
};

export function TrendChart({
  data,
  xKey,
  yKey,
  unit,
  height = 220,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={{ stroke: gridColor }} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}${unit ? ` ${unit}` : ''}`, '']} labelStyle={{ color: 'rgb(var(--c-muted))' }} />
        <Line type="monotone" dataKey={yKey} stroke={brand} strokeWidth={2.5} dot={{ r: 3, fill: brand }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ColumnChart({
  data,
  xKey,
  yKey,
  unit,
  height = 220,
  highlightIndex,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
  highlightIndex?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={{ stroke: gridColor }} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={48} />
        <Tooltip cursor={{ fill: 'rgb(var(--c-elevated))' }} contentStyle={tooltipStyle} formatter={(value) => [`${value}${unit ? ` ${unit}` : ''}`, '']} />
        <Bar dataKey={yKey} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((_, index) => (
            <Cell key={index} fill={highlightIndex === index ? brand : 'rgb(var(--c-brand) / 0.55)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Auslastung nach Wochentag und Uhrzeit – reines SVG, damit es in beiden Themes sauber sitzt */
export function Heatmap({
  rows,
  columns,
  values,
  formatValue,
}: {
  rows: string[];
  columns: string[];
  values: number[][];
  formatValue?: (value: number) => string;
}) {
  const max = Math.max(1, ...values.flat());
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th />
            {columns.map((col) => (
              <th key={col} className="pb-1 text-center font-medium text-muted">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, y) => (
            <tr key={row}>
              <th className="pr-2 text-right font-medium text-muted">{row}</th>
              {columns.map((col, x) => {
                const value = values[y]?.[x] ?? 0;
                const intensity = value / max;
                return (
                  <td
                    key={col}
                    className="h-8 rounded text-center tabular-nums"
                    style={{
                      background: value === 0 ? 'rgb(var(--c-elevated))' : `rgb(var(--c-brand) / ${0.12 + intensity * 0.75})`,
                      color: intensity > 0.55 ? 'white' : 'rgb(var(--c-ink))',
                    }}
                    title={`${row} ${col}: ${formatValue ? formatValue(value) : value}`}
                  >
                    {value === 0 ? '' : formatValue ? formatValue(value) : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
