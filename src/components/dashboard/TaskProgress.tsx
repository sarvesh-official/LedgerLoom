import React from "react";
import { TaskProgressProps } from "@/types/dashboard";

export const TaskProgress = ({ tasks }: TaskProgressProps) => {
  return (
    <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-md h-full w-full">
      <h2 className="text-lg font-semibold mb-4">Tasks</h2>
      <ul className="space-y-4">
        {tasks.map((task) => (
          <li key={task.id}>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>{task.name}</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-neutral-700 h-2 rounded-full">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
