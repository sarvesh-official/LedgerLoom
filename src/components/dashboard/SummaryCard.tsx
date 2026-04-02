import { SummaryCardProps } from "@/types/dashboard";

export const SummaryCard = ({
  totalProfit,
  growthRate,
  totalReceivables,
  totalPayables,
  creditSpent,
  creditLimit,
}: SummaryCardProps) => {
  const creditPercent = Math.round((creditSpent / creditLimit) * 100);

  return (
    <div className="bg-[#1e1e1e] p-4 sm:p-5 md:p-6 rounded-xl shadow-md w-full h-full flex flex-col justify-between gap-4">
      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1">
          Total Profit
        </h2>
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
          ${totalProfit.toLocaleString()}
        </p>
        <p className="text-green-400 text-xs sm:text-sm md:text-base mt-1">
          +{growthRate}% from last month
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-2 justify-between">
        <button className="bg-neutral-800 text-sm md:text-base px-4 py-2 w-full sm:w-auto rounded-full">
          Create Invoice
        </button>
        <button className="bg-blue-600 text-sm md:text-base px-4 py-2 w-full sm:w-auto rounded-full">
          Add Expense
        </button>
      </div>

      {/* Financial Summary */}
      <div className="text-sm sm:text-base mt-2 sm:mt-4 flex flex-col sm:flex-row gap-4">
        {/* Receivables */}
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs sm:text-sm">Total Receivables</span>
          <span className="text-white font-semibold text-base sm:text-lg md:text-xl">
            ${totalReceivables.toLocaleString()}
          </span>
        </div>

        {/* Payables */}
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs sm:text-sm">Total Payables</span>
          <span className="text-white font-semibold text-base sm:text-lg md:text-xl">
            ${totalPayables.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Credit Progress */}
      <div className="flex flex-col gap-2">
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${creditPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs sm:text-sm text-gray-500">
          <span>${creditSpent.toLocaleString()} credit spent</span>
          <span>{creditPercent}%</span>
        </div>
      </div>
    </div>
  );
};
