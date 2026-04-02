"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { ChartCardProps } from "@/types/dashboard";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

type FixedTooltipProps = TooltipProps<ValueType, NameType> & {
  payload?: {
    payload: {
      name: string;
      value: number;
    };
  }[];
};

const CustomTooltip = ({ active, payload }: FixedTooltipProps) => {
  if (
    active &&
    payload &&
    payload.length > 0 &&
    payload[0]
  ) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-[#2a2a2a] border border-[#444] text-white p-3 rounded-lg text-xs shadow-md">
        <p className="font-semibold">{name}</p>
        <p className="text-blue-400">${value.toLocaleString()}</p>
      </div>
    );
  }

  return null;
};

export const ChartCard = ({ incomeData, expenseData }: ChartCardProps) => {
  const [selected, setSelected] = useState<"Income" | "Expense">("Income");

  const availableYears =
    selected === "Income"
      ? Object.keys(incomeData)
      : Object.keys(expenseData);

  const [selectedYear, setSelectedYear] = useState<string>(availableYears[0]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data =
    selected === "Income"
      ? incomeData[selectedYear] || []
      : expenseData[selectedYear] || [];

  const chartData = data.map((val, i) => ({
    name: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ][i],
    value: val * 1000,
  }));

  return (
    <div className="bg-[#1e1e1e] px-1 py-2 sm:p-4 md:p-5 rounded-xl shadow-md w-full h-full">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
        {/* Type Switch */}
        <div className="flex gap-2 flex-wrap">
          {["Income", "Expense"].map((type) => (
            <button
              key={type}
              className={`text-sm px-4 py-1.5 rounded-full transition ${
                selected === type
                  ? "bg-neutral-100 text-black"
                  : "bg-neutral-800 text-white"
              }`}
              onClick={() => {
                setSelected(type as "Income" | "Expense");
                const newYears =
                  type === "Income"
                    ? Object.keys(incomeData)
                    : Object.keys(expenseData);
                setSelectedYear(newYears[0]);
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-neutral-900 text-white text-sm px-3 py-1.5 rounded-md border border-neutral-700"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[320px] xl:h-[340px] overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            onMouseLeave={() => setActiveIndex(null)}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: "#ccc", fontSize: 10 }}
              interval={0}
            />
            <YAxis
              tick={{ fill: "#ccc", fontSize: 10 }}
              tickFormatter={(val) => `$${val / 1000}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              onMouseOver={(_, index) => setActiveIndex(index)}
              background={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`bar-${index}`}
                  fill={
                    selected === "Expense"
                      ? activeIndex === index
                        ? "#FF4D4F"
                        : "#999"
                      : activeIndex === index
                      ? "#2EA4FF"
                      : "#666"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
