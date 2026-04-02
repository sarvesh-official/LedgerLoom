import { CardsOverviewProps } from "@/types/dashboard";

export const CardsOverview = ({
  cardBalance,
  lastFourDigits,
  transactions,
}: CardsOverviewProps) => {
  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-5 md:p-6 rounded-xl shadow-md h-full w-full flex flex-col gap-4 sm:gap-5 md:gap-6">
      {/* Top Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-base sm:text-lg md:text-lg lg:text-base font-semibold">
          Your Cards
        </h2>
        <button className="text-xs sm:text-sm lg:text-xs px-3 py-1 bg-neutral-800 rounded-lg">
          + Add Card
        </button>
      </div>

      {/* Card Display */}
      <div className="bg-blue-600 p-4 rounded-xl text-white">
        <p className="text-xs sm:text-sm lg:text-xs">Card Balance</p>
        <p className="text-xl sm:text-2xl lg:text-xl font-bold">
          ${cardBalance.toLocaleString()}
        </p>
        <p className="text-xs sm:text-sm lg:text-xs mt-1 sm:mt-2">
          **** **** **** {lastFourDigits}
        </p>
      </div>

      {/* Transactions */}
      <div className="flex-1">
        <h3 className="text-xs sm:text-sm md:text-md text-gray-400 mb-2">
          Recent Transactions
        </h3>

        {/* Scrollable up to 10 items, responsive */}
        <ul
          className={`text-xs sm:text-sm lg:text-md divide-y divide-neutral-700 overflow-y-auto scrollbar-hidden pr-1
            max-h-[240px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[380px] xl:max-h-[420px]
          `}
        >
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="py-2 flex justify-between items-center"
            >
              <span className="truncate max-w-[60%] sm:max-w-[65%] lg:max-w-[75%]">
                {tx.label}
              </span>
              <span
                className={`whitespace-nowrap ${
                  tx.amount < 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                ${Math.abs(tx.amount).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
