import React from "react";
import { InventoryCardProps } from "@/types/dashboard";

export const InventoryCard = ({ inventory }: InventoryCardProps) => {
  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-5 md:p-6 rounded-xl shadow-md w-full h-full">
      <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Inventory</h2>

      <ul className="divide-y divide-neutral-800 text-sm sm:text-sm md:text-base max-h-[220px] sm:max-h-[260px] md:max-h-[300px] lg:max-h-[240px] overflow-y-auto pr-1">
        {inventory.map((item) => (
          <li
            key={item.id}
            className="py-2 flex justify-between items-center text-xs sm:text-sm lg:text-sm"
          >
            <span className="truncate">{item.name}</span>

            {item.stock === 0 ? (
              <span className="text-red-500 font-semibold whitespace-nowrap">
                Out of stock
              </span>
            ) : (
              <span className="whitespace-nowrap">
                <span className="text-white font-semibold">{item.stock}</span>{" "}
                <span className="text-gray-400">in stock</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
