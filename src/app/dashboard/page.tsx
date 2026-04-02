"use client";

import { FormEvent, useEffect, useMemo, useReducer, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Role = "viewer" | "admin";
type TransactionType = "income" | "expense";
type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
};

type Filters = {
  search: string;
  type: "all" | TransactionType;
  category: string;
  sort: SortOption;
};

type DashboardState = {
  role: Role;
  transactions: Transaction[];
  filters: Filters;
};

type DashboardAction =
  | { type: "LOAD_TRANSACTIONS"; payload: Transaction[] }
  | { type: "SET_ROLE"; payload: Role }
  | { type: "SET_FILTER"; payload: Partial<Filters> }
  | { type: "RESET_FILTERS" }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction };

const STORAGE_KEY = "sharkfince-dashboard-transactions";

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    date: "2026-04-01",
    description: "Salary",
    category: "Income",
    type: "income",
    amount: 3500,
  },
  {
    id: "tx-2",
    date: "2026-03-30",
    description: "Freelance Payment",
    category: "Side Income",
    type: "income",
    amount: 820,
  },
  {
    id: "tx-3",
    date: "2026-03-29",
    description: "Apartment Rent",
    category: "Housing",
    type: "expense",
    amount: 1200,
  },
  {
    id: "tx-4",
    date: "2026-03-28",
    description: "Groceries",
    category: "Food",
    type: "expense",
    amount: 185,
  },
  {
    id: "tx-5",
    date: "2026-03-26",
    description: "Internet Bill",
    category: "Utilities",
    type: "expense",
    amount: 59,
  },
  {
    id: "tx-6",
    date: "2026-03-22",
    description: "Movie Night",
    category: "Entertainment",
    type: "expense",
    amount: 36,
  },
  {
    id: "tx-7",
    date: "2026-03-20",
    description: "Metro Card Recharge",
    category: "Transport",
    type: "expense",
    amount: 48,
  },
  {
    id: "tx-8",
    date: "2026-03-18",
    description: "Dividend",
    category: "Investments",
    type: "income",
    amount: 240,
  },
  {
    id: "tx-9",
    date: "2026-03-14",
    description: "Gym Membership",
    category: "Health",
    type: "expense",
    amount: 60,
  },
  {
    id: "tx-10",
    date: "2026-02-28",
    description: "Electricity Bill",
    category: "Utilities",
    type: "expense",
    amount: 104,
  },
];

const DEFAULT_FILTERS: Filters = {
  search: "",
  type: "all",
  category: "all",
  sort: "date_desc",
};

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "LOAD_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
      };
    case "SET_ROLE":
      return {
        ...state,
        role: action.payload,
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case "RESET_FILTERS":
      return {
        ...state,
        filters: DEFAULT_FILTERS,
      };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? action.payload : tx
        ),
      };
    default:
      return state;
  }
}

function getMonthLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getTrendData(transactions: Transaction[]) {
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    const existing = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    if (tx.type === "income") {
      existing.income += tx.amount;
    } else {
      existing.expense += tx.amount;
    }
    monthlyMap.set(key, existing);
  }

  const sortedKeys = [...monthlyMap.keys()].sort();

  return sortedKeys.map((key) => {
    const values = monthlyMap.get(key) ?? { income: 0, expense: 0 };
    return {
      month: getMonthLabel(`${key}-01`),
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense,
    };
  });
}

function getSpendingBreakdown(transactions: Transaction[]) {
  const categoryMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") {
      continue;
    }
    categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + tx.amount);
  }

  return [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

function getMonthlyComparison(transactions: Transaction[]) {
  const monthExpenseMap = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== "expense") {
      continue;
    }

    const key = tx.date.slice(0, 7);
    monthExpenseMap.set(key, (monthExpenseMap.get(key) ?? 0) + tx.amount);
  }

  const months = [...monthExpenseMap.keys()].sort();
  if (months.length < 2) {
    return null;
  }

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];

  const current = monthExpenseMap.get(currentMonth) ?? 0;
  const previous = monthExpenseMap.get(previousMonth) ?? 0;

  if (previous === 0) {
    return {
      currentMonth,
      previousMonth,
      changePct: current > 0 ? 100 : 0,
      direction: "up" as const,
      current,
      previous,
    };
  }

  const changePct = ((current - previous) / previous) * 100;

  return {
    currentMonth,
    previousMonth,
    changePct: Math.abs(changePct),
    direction: changePct >= 0 ? ("up" as const) : ("down" as const),
    current,
    previous,
  };
}

const Dashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    role: "viewer",
    transactions: INITIAL_TRANSACTIONS,
    filters: DEFAULT_FILTERS,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    description: "",
    category: "",
    type: "expense" as TransactionType,
    amount: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Transaction[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "LOAD_TRANSACTIONS", payload: parsed });
        }
      }
    } catch {
      // Keep initial data if local storage parsing fails.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }, [state.transactions]);

  const allCategories = useMemo(() => {
    const categories = new Set(state.transactions.map((tx) => tx.category));
    return ["all", ...Array.from(categories).sort()];
  }, [state.transactions]);

  const filteredTransactions = useMemo(() => {
    const searchTerm = state.filters.search.toLowerCase().trim();

    const filtered = state.transactions.filter((tx) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        tx.description.toLowerCase().includes(searchTerm) ||
        tx.category.toLowerCase().includes(searchTerm);

      const matchesType =
        state.filters.type === "all" || tx.type === state.filters.type;

      const matchesCategory =
        state.filters.category === "all" || tx.category === state.filters.category;

      return matchesSearch && matchesType && matchesCategory;
    });

    return filtered.sort((a, b) => {
      switch (state.filters.sort) {
        case "date_asc":
          return a.date.localeCompare(b.date);
        case "date_desc":
          return b.date.localeCompare(a.date);
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });
  }, [state.filters, state.transactions]);

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    for (const tx of state.transactions) {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expenses += tx.amount;
      }
    }

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [state.transactions]);

  const trendData = useMemo(() => getTrendData(state.transactions), [state.transactions]);
  const spendingData = useMemo(
    () => getSpendingBreakdown(state.transactions),
    [state.transactions]
  );

  const highestSpending = spendingData[0];
  const comparison = getMonthlyComparison(state.transactions);
  const savingsRate = totals.income === 0 ? 0 : ((totals.balance / totals.income) * 100);

  const isAdmin = state.role === "admin";

  const submitLabel = editingId ? "Update Transaction" : "Add Transaction";

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) {
      return;
    }

    const amount = Number(form.amount);
    if (
      !form.date ||
      !form.description.trim() ||
      !form.category.trim() ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      return;
    }

    const payload: Transaction = {
      id: editingId ?? `tx-${Date.now()}`,
      date: form.date,
      description: form.description.trim(),
      category: form.category.trim(),
      type: form.type,
      amount,
    };

    dispatch({
      type: editingId ? "UPDATE_TRANSACTION" : "ADD_TRANSACTION",
      payload,
    });

    setForm({
      date: "",
      description: "",
      category: "",
      type: "expense",
      amount: "",
    });
    setEditingId(null);
  };

  const onEdit = (tx: Transaction) => {
    if (!isAdmin) {
      return;
    }

    setEditingId(tx.id);
    setForm({
      date: tx.date,
      description: tx.description,
      category: tx.category,
      type: tx.type,
      amount: String(tx.amount),
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden pb-4">
      <section className="rounded-3xl p-5 sm:p-7 bg-[radial-gradient(circle_at_top_right,#21325b_0%,#101726_45%,#0a0f19_100%)] border border-[#273350] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.24em] text-[#8da5d6] uppercase">Finance Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
              Personal Finance Command Center
            </h1>
            <p className="text-sm text-[#b4c2e3] mt-2">
              Track cashflow, monitor spending patterns, and manage transactions with role-based controls.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <label className="text-sm text-[#d0dcf7]" htmlFor="role-switcher">
              Role
            </label>
            <select
              id="role-switcher"
              value={state.role}
              onChange={(e) =>
                dispatch({ type: "SET_ROLE", payload: e.target.value as Role })
              }
              className="bg-[#111b2e] border border-[#33466f] rounded-full px-4 py-2 text-sm text-white"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl bg-[#141f35] border border-[#2f4268] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7f96c7]">Total Balance</p>
            <p className="text-2xl font-semibold text-white mt-2">{formatCurrency(totals.balance)}</p>
          </div>
          <div className="rounded-2xl bg-[#111f1f] border border-[#21544f] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7fc4bc]">Income</p>
            <p className="text-2xl font-semibold text-[#7CF3C0] mt-2">{formatCurrency(totals.income)}</p>
          </div>
          <div className="rounded-2xl bg-[#2b1920] border border-[#5b2b3b] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d7a2b5]">Expenses</p>
            <p className="text-2xl font-semibold text-[#ff9bb8] mt-2">{formatCurrency(totals.expenses)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <article className="lg:col-span-2 rounded-2xl bg-[#131313] border border-[#2b2b2b] p-4 sm:p-5 min-h-[300px]">
          <h2 className="text-lg font-semibold text-white">Monthly Cashflow Trend</h2>
          <p className="text-sm text-neutral-400 mt-1">Time-based view of income and expenses.</p>
          <div className="h-64 mt-4">
            {trendData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-neutral-700 grid place-items-center text-neutral-400 text-sm">
                No data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b2b2b" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#61f2ba" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#ff7ea5" strokeWidth={2} />
                  <Line type="monotone" dataKey="net" stroke="#72a2ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-[#131313] border border-[#2b2b2b] p-4 sm:p-5 min-h-[300px]">
          <h2 className="text-lg font-semibold text-white">Spending Breakdown</h2>
          <p className="text-sm text-neutral-400 mt-1">Categorical view by expense category.</p>
          <div className="h-64 mt-4">
            {spendingData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-neutral-700 grid place-items-center text-neutral-400 text-sm">
                Add expense transactions to view spending categories.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa"][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {spendingData.length > 0 && (
            <div className="text-xs text-neutral-300 mt-2">
              Top: <span className="text-white font-medium">{spendingData[0].name}</span> ({formatCurrency(spendingData[0].value)})
            </div>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <article className="xl:col-span-2 rounded-2xl bg-[#131313] border border-[#2b2b2b] p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Transactions</h2>
              <p className="text-sm text-neutral-400 mt-1">Search, filter, and sort your activity.</p>
            </div>
            <button
              disabled={!isAdmin}
              className="rounded-full px-4 py-2 text-sm font-medium bg-[#1f345f] border border-[#365998] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setEditingId(null);
                setForm({
                  date: "",
                  description: "",
                  category: "",
                  type: "expense",
                  amount: "",
                });
              }}
            >
              {isAdmin ? "Add New Transaction" : "Viewer mode (read-only)"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <input
              value={state.filters.search}
              onChange={(e) => dispatch({ type: "SET_FILTER", payload: { search: e.target.value } })}
              placeholder="Search description/category"
              className="md:col-span-2 rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white"
            />
            <select
              value={state.filters.type}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  payload: { type: e.target.value as Filters["type"] },
                })
              }
              className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={state.filters.category}
              onChange={(e) => dispatch({ type: "SET_FILTER", payload: { category: e.target.value } })}
              className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white"
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-3">
            <select
              value={state.filters.sort}
              onChange={(e) =>
                dispatch({
                  type: "SET_FILTER",
                  payload: { sort: e.target.value as SortOption },
                })
              }
              className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white"
            >
              <option value="date_desc">Newest Date</option>
              <option value="date_asc">Oldest Date</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
            <button
              onClick={() => dispatch({ type: "RESET_FILTERS" })}
              className="rounded-xl border border-[#2b2b2b] px-3 py-2 text-sm text-neutral-300"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700 px-4 py-10 text-center text-sm text-neutral-400">
                No transactions match your filters.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-neutral-400 border-b border-neutral-700">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Description</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-neutral-800 text-white">
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="py-3 pr-4">{tx.description}</td>
                      <td className="py-3 pr-4">{tx.category}</td>
                      <td className="py-3 pr-4 capitalize">{tx.type}</td>
                      <td
                        className={`py-3 pr-4 font-medium ${
                          tx.type === "income" ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3">
                        <button
                          disabled={!isAdmin}
                          onClick={() => onEdit(tx)}
                          className="text-xs px-3 py-1 rounded-full border border-[#34558f] text-[#aac2f4] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-[#131313] border border-[#2b2b2b] p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-white">Admin Transaction Form</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {isAdmin
              ? "Add a new transaction or update an existing one."
              : "Switch to Admin role to add or edit transactions."}
          </p>

          <form onSubmit={onSubmit} className="space-y-3 mt-4">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              disabled={!isAdmin}
              className="w-full rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white disabled:opacity-50"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              disabled={!isAdmin}
              className="w-full rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white disabled:opacity-50"
            />
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
              disabled={!isAdmin}
              className="w-full rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white disabled:opacity-50"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value as TransactionType }))
                }
                disabled={!isAdmin}
                className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Amount"
                disabled={!isAdmin}
                className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] px-3 py-2 text-sm text-white disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!isAdmin}
              className="w-full rounded-xl bg-[#244785] border border-[#3d65a8] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl bg-[#131313] border border-[#2b2b2b] p-4 sm:p-5 mt-4">
        <h2 className="text-lg font-semibold text-white">Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] p-3 text-neutral-300">
            Highest spending category:{" "}
            <span className="text-white font-medium">
              {highestSpending
                ? `${highestSpending.name} (${formatCurrency(highestSpending.value)})`
                : "Not enough expense data"}
            </span>
          </div>

          <div className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] p-3 text-neutral-300">
            Monthly expense comparison:{" "}
            <span className="text-white font-medium">
              {comparison
                ? `${comparison.direction === "up" ? "Up" : "Down"} ${comparison.changePct.toFixed(
                    1
                  )}% (${getMonthLabel(`${comparison.previousMonth}-01`)} to ${getMonthLabel(
                    `${comparison.currentMonth}-01`
                  )})`
                : "Need at least two months of expenses"}
            </span>
          </div>

          <div className="rounded-xl bg-[#0f0f0f] border border-[#2b2b2b] p-3 text-neutral-300">
            Savings rate:{" "}
            <span className="text-white font-medium">{savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
