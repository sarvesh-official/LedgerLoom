"use client";
// This file is a client component because it uses hooks and state management.
import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { SpendingPieProps } from "@/types/dashboard";
import { TooltipProps } from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";


const COLORS = ["#2EA4FF", "#F5F5F5", "#F55E5E"];

type FixedTooltipProps = TooltipProps<ValueType, NameType> & {
  payload?: {
    payload: {
      label: string;
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
    const { label, value } = payload[0].payload;

    return (
      <div className="bg-[#2a2a2a] border border-[#444] text-white p-3 rounded-lg text-xs shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-blue-400">{value}% of spending</p>
      </div>
    );
  }

  return null;
};


export const SpendingPie = ({ data }: SpendingPieProps) => {
  const [filter, setFilter] = useState<"Month" | "Year">("Month");

  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-5 md:p-6 rounded-xl shadow-md w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold">Your spendings</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "Month" | "Year")}
          className="bg-neutral-900 text-white text-xs sm:text-sm px-2 py-1 rounded-md border border-neutral-700"
        >
          <option value="Month">Month</option>
          <option value="Year">Year</option>
        </select>
      </div>

      {/* Donut Chart */}
      <div className="w-full h-44 sm:h-52 md:h-56 lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="50%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center gap-5 text-xs sm:text-sm flex-wrap">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span className="text-gray-300">
              {entry.label.replace("payments", "").trim()}
              <span className="inline lg:hidden"> – {entry.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
