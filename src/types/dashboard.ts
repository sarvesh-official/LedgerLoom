// types/dashboard.ts
export interface SummaryCardProps {
  totalProfit: number;
  growthRate: number;
  totalReceivables: number;
  totalPayables: number;
  creditSpent: number;
  creditLimit: number;
}

export interface ChartCardProps {
  incomeData: { [year: string]: number[] };
  expenseData: { [year: string]: number[] };
}

export interface CardsOverviewProps {
  cardBalance: number;
  lastFourDigits: number;
  transactions: {
    id: number;
    label: string;
    amount: number;
  }[];
}

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
}

export interface InventoryCardProps {
  inventory: InventoryItem[];
}

export interface SpendingPieProps {
  data: {
    label: string;
    value: number;
  }[];
}

export interface Task {
  id: number;
  name: string;
  progress: number;
}

export interface TaskProgressProps {
  tasks: Task[];
}
