"use client";

import { FormEvent, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockTransactions } from "@/mocks/transactions";

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

const STORAGE_KEY = "ledgerloom-dashboard-transactions-v2";

const DEFAULT_FILTERS: Filters = {
  search: "",
  type: "all",
  category: "all",
  sort: "date_desc",
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "LOAD_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "SET_ROLE":
      return { ...state, role: action.payload };
    case "SET_FILTER":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "RESET_FILTERS":
      return { ...state, filters: DEFAULT_FILTERS };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((tx) => (tx.id === action.payload.id ? action.payload : tx)),
      };
    default:
      return state;
  }
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

function monthLabelFromKey(monthKey: string): string {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(date);
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getMonthlySeries(transactions: Transaction[]) {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const monthKey = tx.date.slice(0, 7);
    const row = byMonth.get(monthKey) ?? { income: 0, expense: 0 };
    if (tx.type === "income") {
      row.income += tx.amount;
    } else {
      row.expense += tx.amount;
    }
    byMonth.set(monthKey, row);
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, row]) => ({
      monthKey,
      monthLabel: monthLabelFromKey(monthKey),
      income: row.income,
      expense: row.expense,
    }));
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
  const transactionsSectionRef = useRef<HTMLElement | null>(null);
  const [state, dispatch] = useReducer(dashboardReducer, {
    role: "viewer",
    transactions: [],
    filters: DEFAULT_FILTERS,
  });

  const [mounted, setMounted] = useState(false);
  const [cashflowRange, setCashflowRange] = useState<"3m" | "6m" | "12m" | "all">("6m");
  const [activePieMonth, setActivePieMonth] = useState("");
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: "",
    description: "",
    category: "",
    type: "expense" as TransactionType,
    amount: "",
  });

  useEffect(() => {
    setMounted(true);
    let loadedFromStorage = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Transaction[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "LOAD_TRANSACTIONS", payload: parsed });
          loadedFromStorage = true;
        }
      }
    } catch {
      // Keep initial data if local storage parsing fails.
    }

    if (loadedFromStorage) {
      return;
    }

    const loadTransactions = async () => {
      try {
        const response = await fetch("/api/transactions", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch transactions");
        }
        const data = (await response.json()) as { transactions: Transaction[] };
        dispatch({ type: "LOAD_TRANSACTIONS", payload: data.transactions });
      } catch {
        dispatch({ type: "LOAD_TRANSACTIONS", payload: mockTransactions as Transaction[] });
      }
    };

    void loadTransactions();
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
  }, [mounted, state.transactions]);

  useEffect(() => {
    const syncSearchFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      dispatch({
        type: "SET_FILTER",
        payload: { search: params.get("q") ?? "" },
      });
    };

    const syncSearchFromEvent = (event: Event) => {
      const customEvent = event as CustomEvent<
        string | { query?: string; scrollToTransactions?: boolean }
      >;
      const detail = customEvent.detail;
      const query = typeof detail === "string" ? detail : detail?.query ?? "";
      dispatch({
        type: "SET_FILTER",
        payload: { search: query },
      });
      if (typeof detail === "object" && detail?.scrollToTransactions) {
        setTimeout(() => {
          transactionsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 60);
      }
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("ledgerloom-location-change"));
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("ledgerloom-location-change"));
    };

    syncSearchFromUrl();
    window.addEventListener("popstate", syncSearchFromUrl);
    window.addEventListener("ledgerloom-location-change", syncSearchFromUrl);
    window.addEventListener("ledgerloom-search", syncSearchFromEvent as EventListener);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", syncSearchFromUrl);
      window.removeEventListener("ledgerloom-location-change", syncSearchFromUrl);
      window.removeEventListener("ledgerloom-search", syncSearchFromEvent as EventListener);
    };
  }, []);

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

      const matchesType = state.filters.type === "all" || tx.type === state.filters.type;
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

  const fullMonthlyData = useMemo(
    () => getMonthlySeries(state.transactions),
    [state.transactions]
  );
  const monthlyData = useMemo(() => {
    if (cashflowRange === "all") {
      return fullMonthlyData;
    }
    if (cashflowRange === "12m") {
      return fullMonthlyData.slice(-12);
    }
    if (cashflowRange === "3m") {
      return fullMonthlyData.slice(-3);
    }
    return fullMonthlyData.slice(-6);
  }, [fullMonthlyData, cashflowRange]);
  const pieData = useMemo(
    () =>
      monthlyData
        .slice(-5)
        .map((row, index) => ({
          month: row.monthKey,
          label: row.monthLabel,
          value: row.expense,
          fill: ["#4f7cff", "#20c997", "#f59f00", "#d6336c", "#845ef7"][index % 5],
        })),
    [monthlyData]
  );
  const barTotals = useMemo(
    () => ({
      income: monthlyData.reduce((acc, curr) => acc + curr.income, 0),
      expense: monthlyData.reduce((acc, curr) => acc + curr.expense, 0),
    }),
    [monthlyData]
  );

  useEffect(() => {
    if (pieData.length === 0) {
      setActivePieMonth("");
      return;
    }
    if (!pieData.some((item) => item.month === activePieMonth)) {
      setActivePieMonth(pieData[0].month);
    }
  }, [pieData, activePieMonth]);

  const spendingData = useMemo(() => getSpendingBreakdown(state.transactions), [state.transactions]);
  const groupedTransactions = useMemo(() => {
    const groups = new Map<
      string,
      { category: string; income: number; expense: number; count: number }
    >();

    for (const tx of filteredTransactions) {
      const row = groups.get(tx.category) ?? {
        category: tx.category,
        income: 0,
        expense: 0,
        count: 0,
      };
      if (tx.type === "income") {
        row.income += tx.amount;
      } else {
        row.expense += tx.amount;
      }
      row.count += 1;
      groups.set(tx.category, row);
    }

    return [...groups.values()].sort(
      (a, b) => b.expense + b.income - (a.expense + a.income)
    );
  }, [filteredTransactions]);
  const highestSpending = spendingData[0];
  const comparison = getMonthlyComparison(state.transactions);
  const savingsRate = totals.income === 0 ? 0 : (totals.balance / totals.income) * 100;

  const isAdmin = state.role === "admin";
  const submitLabel = editingId ? "Update Transaction" : "Add Transaction";
  const selectBaseClass =
    "h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-3 pr-9 text-sm text-[var(--text)] shadow-[0_1px_0_var(--ring)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer";

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

    dispatch({ type: editingId ? "UPDATE_TRANSACTION" : "ADD_TRANSACTION", payload });

    setForm({ date: "", description: "", category: "", type: "expense", amount: "" });
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

  const exportTransactions = (format: "csv" | "json") => {
    const baseName = `ledgerloom-transactions-${new Date().toISOString().slice(0, 10)}`;
    if (format === "json") {
      downloadFile(
        `${baseName}.json`,
        JSON.stringify(filteredTransactions, null, 2),
        "application/json"
      );
      return;
    }

    const header = ["id", "date", "description", "category", "type", "amount"];
    const rows = filteredTransactions.map((tx) =>
      [
        tx.id,
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.category.replace(/"/g, '""')}"`,
        tx.type,
        tx.amount.toFixed(2),
      ].join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    downloadFile(`${baseName}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const activePieItem = useMemo(
    () => pieData.find((item) => item.month === activePieMonth),
    [pieData, activePieMonth]
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden pb-4">
      <section className="rounded-3xl p-6 sm:p-8 border border-[var(--border)] bg-[var(--panel)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Finance Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--text)] mt-1 font-[var(--font-sora)]">LedgerLoom Command Center</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              Interactive analytics, role-based controls, and clean transaction management.
            </p>
          </div>

          <div className="relative z-20 flex gap-3 items-center">
            <label className="text-sm text-[var(--muted)]" htmlFor="role-select">
              Role
            </label>
            <div className="relative">
              <select
                id="role-select"
                value={state.role}
                onChange={(event) =>
                  dispatch({ type: "SET_ROLE", payload: event.target.value as Role })
                }
                className="h-10 w-[164px] appearance-none rounded-full border border-[var(--border)] bg-[var(--surface-soft)] pl-4 pr-10 text-sm font-medium text-[var(--text)] shadow-[0_1px_0_var(--ring)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Total Balance</p>
            <p className="text-2xl font-semibold text-[var(--text)] mt-2">{formatCurrency(totals.balance)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Income</p>
            <p className="text-2xl font-semibold text-[var(--positive)] mt-2">{formatCurrency(totals.income)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Expenses</p>
            <p className="text-2xl font-semibold text-[var(--negative)] mt-2">{formatCurrency(totals.expenses)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <article className="lg:col-span-2 rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] px-6 py-4 gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] font-[var(--font-sora)]">
                Interactive Cashflow Area Chart
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Income vs expense trend over time.
              </p>
            </div>
            <div className="relative w-[150px]">
              <select
                value={cashflowRange}
                onChange={(event) =>
                  setCashflowRange(event.target.value as "3m" | "6m" | "12m" | "all")
                }
                className="h-9 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-3 pr-9 text-sm text-[var(--text)] shadow-[0_1px_0_var(--ring)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
              >
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
                <option value="all">All data</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </div>
          <div className="px-3 sm:px-6 py-5 h-[300px]">
            {!mounted || monthlyData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-[var(--border)] grid place-items-center text-sm text-[var(--muted)]">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ left: 8, right: 8, top: 6, bottom: 6 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="monthLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="var(--positive)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--negative)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Area
                    type="natural"
                    dataKey="expense"
                    stroke="var(--negative)"
                    strokeWidth={2}
                    fill="url(#expenseFill)"
                    name="Expense"
                  />
                  <Area
                    type="natural"
                    dataKey="income"
                    stroke="var(--positive)"
                    strokeWidth={2}
                    fill="url(#incomeFill)"
                    name="Income"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] font-[var(--font-sora)]">
                Interactive Expense Pie
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Highlight expense distribution by month.
              </p>
            </div>
            <div className="relative w-[130px]">
              <select
                value={activePieMonth}
                onChange={(event) => setActivePieMonth(event.target.value)}
                className="h-8 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-3 pr-8 text-sm text-[var(--text)] shadow-[0_1px_0_var(--ring)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
              >
                {pieData.map((item) => (
                  <option key={item.month} value={item.month}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </div>
          <div className="h-64 mt-4">
            {!mounted || pieData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-[var(--border)] grid place-items-center text-sm text-[var(--muted)]">
                Add expense transactions to view chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={56}
                    outerRadius={(entry) =>
                      entry.month === activePieMonth ? 98 : 88
                    }
                    strokeWidth={4}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.month} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox && activePieItem) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-[var(--text)] text-lg font-bold"
                              >
                                {formatCurrency(activePieItem.value)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-[var(--muted)] text-xs"
                              >
                                {activePieItem.label}
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section
        ref={transactionsSectionRef}
        className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4"
      >
        <article className="xl:col-span-2 rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] font-[var(--font-sora)]">Transactions</h2>
              <p className="text-sm text-[var(--muted)] mt-1">Search, filter, sort, and edit records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => exportTransactions("csv")}
              >
                Export CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportTransactions("json")}
              >
                Export JSON
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGroupByCategory((prev) => !prev)}
              >
                {groupByCategory ? "Hide Grouping" : "Group by Category"}
              </Button>
              <Button
                disabled={!isAdmin}
                className="rounded-full"
                onClick={() => {
                  setEditingId(null);
                  setForm({ date: "", description: "", category: "", type: "expense", amount: "" });
                }}
              >
                {isAdmin ? "Add New Transaction" : "Viewer mode (read-only)"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <Input
              value={state.filters.search}
              onChange={(e) => dispatch({ type: "SET_FILTER", payload: { search: e.target.value } })}
              placeholder="Search description/category"
              className="md:col-span-2 rounded-xl"
            />
            <div className="relative">
              <select
                value={state.filters.type}
                onChange={(event) =>
                  dispatch({
                    type: "SET_FILTER",
                    payload: { type: event.target.value as Filters["type"] },
                  })
                }
                className={selectBaseClass}
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
            <div className="relative">
              <select
                value={state.filters.category}
                onChange={(event) =>
                  dispatch({ type: "SET_FILTER", payload: { category: event.target.value } })
                }
                className={selectBaseClass}
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </div>

          <div className="flex gap-3 mt-3">
            <div className="relative w-[180px]">
              <select
                value={state.filters.sort}
                onChange={(event) =>
                  dispatch({
                    type: "SET_FILTER",
                    payload: { sort: event.target.value as SortOption },
                  })
                }
                className={selectBaseClass}
              >
                <option value="date_desc">Newest Date</option>
                <option value="date_asc">Oldest Date</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => dispatch({ type: "RESET_FILTERS" })}
              className="rounded-xl"
            >
              Reset Filters
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
                No transactions match your filters.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
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
                    <tr key={tx.id} className="border-b border-[var(--border)] text-[var(--text)]">
                      <td className="py-3 pr-4 whitespace-nowrap">{formatDate(tx.date)}</td>
                      <td className="py-3 pr-4">{tx.description}</td>
                      <td className="py-3 pr-4">{tx.category}</td>
                      <td className="py-3 pr-4 capitalize">{tx.type}</td>
                      <td className={`py-3 pr-4 font-medium ${tx.type === "income" ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin}
                          onClick={() => onEdit(tx)}
                          className="rounded-full text-[var(--brand)]"
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {groupByCategory && (
            <div className="mt-5 rounded-xl border border-[var(--border)] overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Transactions</th>
                    <th className="py-3 px-4">Income</th>
                    <th className="py-3 px-4">Expense</th>
                    <th className="py-3 px-4">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTransactions.map((row) => {
                    const net = row.income - row.expense;
                    return (
                      <tr key={row.category} className="border-b border-[var(--border)]">
                        <td className="py-3 px-4">{row.category}</td>
                        <td className="py-3 px-4">{row.count}</td>
                        <td className="py-3 px-4 text-[var(--positive)]">
                          {formatCurrency(row.income)}
                        </td>
                        <td className="py-3 px-4 text-[var(--negative)]">
                          {formatCurrency(row.expense)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={
                              net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                            }
                          >
                            {formatCurrency(net)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-[var(--text)] font-[var(--font-sora)]">Admin Transaction Form</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            {isAdmin ? "Add or edit transactions from here." : "Switch to Admin role to edit data."}
          </p>

          <form onSubmit={onSubmit} className="space-y-3 mt-4">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              disabled={!isAdmin}
              className="w-full rounded-xl"
            />
            <Input
              type="text"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              disabled={!isAdmin}
              className="w-full rounded-xl"
            />
            <Input
              type="text"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
              disabled={!isAdmin}
              className="w-full rounded-xl"
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as TransactionType,
                    }))
                  }
                  disabled={!isAdmin}
                  className={selectBaseClass}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              </div>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Amount"
                disabled={!isAdmin}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={!isAdmin}
              className="w-full rounded-xl"
            >
              {submitLabel}
            </Button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] p-4 sm:p-5 mt-4">
        <h2 className="text-lg font-semibold text-[var(--text)] font-[var(--font-sora)]">Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-[var(--muted)]">
            Highest spending category:{" "}
            <span className="text-[var(--text)] font-medium">
              {highestSpending
                ? `${highestSpending.name} (${formatCurrency(highestSpending.value)})`
                : "Not enough expense data"}
            </span>
          </div>

          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-[var(--muted)]">
            Monthly expense comparison:{" "}
            <span className="text-[var(--text)] font-medium">
              {comparison
                ? `${comparison.direction === "up" ? "Up" : "Down"} ${comparison.changePct.toFixed(1)}% (${monthLabelFromKey(comparison.previousMonth)} to ${monthLabelFromKey(comparison.currentMonth)})`
                : "Need at least two months of expenses"}
            </span>
          </div>

          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 text-[var(--muted)]">
            Savings rate: <span className="text-[var(--text)] font-medium">{savingsRate.toFixed(1)}%</span>
          </div>
        </div>
        <article className="mt-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--text)]">Monthly Comparison Bar Chart</h3>
              <p className="text-xs text-[var(--muted)]">
                Side-by-side income and expense totals for the selected range.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-[var(--positive)] font-medium">Income: {formatCurrency(barTotals.income)}</span>
              <span className="text-[var(--negative)] font-medium">Expense: {formatCurrency(barTotals.expense)}</span>
            </div>
          </div>
          <div className="h-64">
            {!mounted || monthlyData.length === 0 ? (
              <div className="h-full rounded-xl border border-dashed border-[var(--border)] grid place-items-center text-sm text-[var(--muted)]">
                Add transactions to populate comparison bars.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ left: 8, right: 8, top: 6, bottom: 6 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="monthLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      color: "var(--text)",
                    }}
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="var(--positive)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="var(--negative)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
