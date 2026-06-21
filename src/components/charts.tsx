"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { FinancialPoint, TechnicalPoint } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/format";

type FinancialChartProps = {
  data: FinancialPoint[];
};

export function FinancialChart({ data }: FinancialChartProps) {
  const chartData = [...data]
    .reverse()
    .map((item) => ({
      year: item.fiscalYear,
      revenue: item.revenue / 1000000000,
      fcf: item.freeCashFlow / 1000000000,
      netIncome: item.netIncome / 1000000000
    }))
    .slice(-6);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#d7ddd2" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => `$${value}B`}
          />
          <Tooltip
            cursor={{ fill: "#eef2e8" }}
            formatter={(value: number, name) => [
              formatCurrency(value * 1000000000),
              name === "fcf" ? "自由现金流" : name === "revenue" ? "收入" : String(name)
            ]}
            contentStyle={{ borderColor: "#d7ddd2", borderRadius: 6 }}
          />
          <Bar dataKey="revenue" fill="#2f5963" radius={[4, 4, 0, 0]} />
          <Bar dataKey="fcf" fill="#60764e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type PriceChartProps = {
  data: TechnicalPoint[];
};

export function PriceChart({ data }: PriceChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2f5963" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#2f5963" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#d7ddd2" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} minTickGap={24} />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value: number, name) => [
              name === "volume" ? formatNumber(value) : `$${value.toFixed(2)}`,
              name === "close" ? "收盘价" : name === "sma50" ? "50 日均线" : String(name)
            ]}
            contentStyle={{ borderColor: "#d7ddd2", borderRadius: 6 }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="#2f5963"
            fill="url(#priceFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="sma50"
            stroke="#a56b1f"
            fill="transparent"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
