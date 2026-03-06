import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface ForecastChartProps {
  historyDates: string[];
  historyValues: number[];
  forecastDates: string[];
  forecastValues: number[];
}

const ForecastChart = ({
  historyDates,
  historyValues,
  forecastDates,
  forecastValues,
}: ForecastChartProps) => {
  // Only show last 36 history points for better visibility near forecast
  const tailSize = 36;
  const startIdx = Math.max(0, historyDates.length - tailSize);
  const trimmedDates = historyDates.slice(startIdx);
  const trimmedValues = historyValues.slice(startIdx);

  const lastHistoryDate = trimmedDates[trimmedDates.length - 1];
  const lastHistoryValue = trimmedValues[trimmedValues.length - 1];

  const data = [
    ...trimmedDates.map((date, i) => ({
      date: date.slice(0, 10),
      history: trimmedValues[i],
      forecast: null as number | null,
    })),
    // bridge point
    {
      date: lastHistoryDate?.slice(0, 10),
      history: lastHistoryValue,
      forecast: lastHistoryValue,
    },
    ...forecastDates.map((date, i) => ({
      date: date.slice(0, 10),
      history: null as number | null,
      forecast: forecastValues[i],
    })),
  ];

  // deduplicate bridge
  const seen = new Set<string>();
  const unique = data.filter((d) => {
    const key = d.date + (d.forecast !== null ? "f" : "h");
    if (d.history !== null && d.forecast !== null) {
      // bridge point, always keep
      return true;
    }
    if (seen.has(d.date + "h") && d.history !== null) return false;
    seen.add(key);
    return true;
  });

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={unique} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(220 14% 18%)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "hsl(220 14% 18%)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220 18% 12%)",
            border: "1px solid hsl(220 14% 18%)",
            borderRadius: "8px",
            color: "hsl(210 20% 92%)",
            fontSize: 13,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "hsl(215 15% 55%)" }}
        />
        {lastHistoryDate && (
          <ReferenceLine
            x={lastHistoryDate.slice(0, 10)}
            stroke="hsl(215 15% 55%)"
            strokeDasharray="4 4"
            label=""
          />
        )}
        <Line
          type="monotone"
          dataKey="history"
          stroke="hsl(210 100% 56%)"
          strokeWidth={2}
          dot={false}
          name="Historique"
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="hsl(28 100% 55%)"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          name="Prévision"
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart;
