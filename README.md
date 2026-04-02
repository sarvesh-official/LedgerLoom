# LedgerLoom Finance Dashboard UI

A frontend-only finance dashboard built for the Frontend Developer Intern assignment.

## Tech Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Recharts
- shadcn-style UI primitives (Radix Select + custom Button/Input)

## How To Run
1. Install dependencies:
```bash
npm install
```
2. Start development server:
```bash
npm run dev
```
3. Open [http://localhost:3000](http://localhost:3000)

## Assignment Requirement Coverage

### 1. Dashboard Overview
- Summary cards: `Total Balance`, `Income`, `Expenses`
- Time-based visualization: interactive area chart with time range (`90d`, `30d`, `7d`)
- Categorical visualization: spending breakdown pie chart by category

### 2. Transactions Section
- Transaction fields displayed: date, description, category, type, amount
- Features implemented:
  - Search (description/category)
  - Filter by type and category
  - Sorting by date or amount
  - Empty state when no matching results

### 3. Basic Role-Based UI (Frontend Simulated)
- Role switcher: `Viewer` / `Admin`
- `Viewer`: read-only mode
- `Admin`: can add and edit transactions using the form and edit actions

### 4. Insights Section
- Highest spending category
- Month-over-month expense comparison
- Savings rate observation

### 5. State Management
- State handled with `useReducer` for:
  - transactions
  - filters
  - selected role
- Derived values computed with `useMemo`

### 6. UI/UX Expectations
- Responsive layout across mobile/tablet/desktop
- Readable cards, charts, table, and controls
- Graceful no-data/empty-result states

## Optional Enhancements Included
- Dark mode + light mode toggle
- Local persistence using `localStorage` for transactions
- Mock API integration (`/api/transactions` route)
- Export filtered transactions as CSV and JSON
- Advanced grouping mode for transactions by category
- Polished chart and control interactions

## Key Implementation Notes
- Main implementation lives in:
  - `src/app/dashboard/page.tsx`
- Mock API route:
  - `src/app/api/transactions/route.ts`
- Mock data source:
  - `src/mocks/transactions.ts`
- Planning document for assignment walkthrough:
  - `plan.md`

## Submission Notes
- This project is intentionally frontend-only and uses mock/static data.
- No backend or authentication is required for this assignment scenario.
