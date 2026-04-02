# LedgerLoom

A modern, responsive **Finance Dashboard UI** built for the Frontend Developer Intern assignment.

This project focuses on frontend architecture, interaction quality, role-based behavior, and clear data presentation using mock data (no backend dependency required).

## Live Demo
- Add your deployed URL here: `https://ledger-loom.vercel.app` (or latest preview URL)

## Repository
- GitHub: `https://github.com/sarvesh-official/LedgerLoom`

## Tech Stack
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS + custom design tokens
- **Charts:** Recharts
- **UI Components:** shadcn-style primitives (Button, Input, Select patterns, Card patterns)
- **State Management:** `useReducer` + `useState` + `useMemo`
- **Persistence:** `localStorage`

## Assignment Feature Coverage

### 1. Dashboard Overview
- Summary cards:
  - `Total Balance`
  - `Income`
  - `Expenses`
- Time-based visualization:
  - **Interactive Cashflow chart** with selectable view:
    - Area chart
    - Bar chart
  - Configurable time ranges
- Categorical visualization:
  - **Spending Breakdown** pie chart with month selection

### 2. Transactions Section
- Transaction table includes:
  - Date
  - Description
  - Category
  - Type (income/expense)
  - Amount
- Built-in interactions:
  - Search (description/category)
  - Filter by type
  - Filter by category
  - Sort by date/amount
  - Reset filters
  - Empty-state handling for no results

### 3. Basic Role-Based UI (Frontend Simulated)
- Role switcher:
  - `Viewer`
  - `Admin`
- Viewer mode:
  - Read-only table/form actions
- Admin mode:
  - Add new transactions
  - Edit existing transactions

### 4. Insights Section
- Highest spending category
- Month-over-month expense comparison
- Savings rate calculation
- Additional monthly comparison bar chart

### 5. State Management
- Central reducer handles:
  - Transactions dataset
  - Filters
  - Role state
- Derived analytics use `useMemo` for predictable computed results

### 6. UI/UX Expectations
- Responsive layout (mobile/tablet/desktop)
- Clean visual hierarchy and readable spacing
- Stable dropdown/search interactions (no layout jumps)
- Smooth scroll to transactions when searching from top bar

## Optional Enhancements Implemented
- Light mode and dark mode toggle
- Local persistence of transaction data (`localStorage`)
- Mock API integration (`/api/transactions`)
- CSV export
- JSON export
- Group-by-category mode in transactions
- Enhanced chart interactivity and view toggles

## Project Structure
```text
src/
  app/
    api/transactions/route.ts      # Mock API endpoint
    dashboard/page.tsx             # Main dashboard page
    layout.tsx                     # App shell/layout
  components/
    ui/                            # Reusable UI components
  mocks/
    transactions.ts                # Seed/mock data
plan.md                            # Planning document for assignment walkthrough
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

## Technical Decisions and Trade-offs
- Chose **Next.js + TypeScript** for strong structure, DX, and deployment simplicity.
- Used **local reducer-based state** instead of Redux/Zustand:
  - Pro: less boilerplate, faster iteration for assignment scope.
  - Trade-off: global store libraries may scale better for larger multi-page apps.
- Used **Recharts** for interactive charts:
  - Pro: highly customizable for assignment visuals.
  - Trade-off: requires careful responsive/container handling.
- Used **mock API + localStorage**:
  - Pro: realistic frontend data flow without backend dependency.
  - Trade-off: no real multi-user/server persistence.

## Known Limitations
- Role management is simulated (no real auth/RBAC backend).
- Data is local/mock only.
- Exports are client-side only.

## Future Improvements
- Integrate real backend + database
- Add auth and true role permissions
- Add unit/integration/e2e tests
- Add advanced analytics filters and drill-down views
- Improve accessibility audits and keyboard interaction coverage

## Screenshots
- Add screenshots to `public/screenshots` and link them here for submission polish.

## Submission Notes
- This project is intentionally frontend-focused per assignment requirements.
- `plan.md` documents planning and implementation flow to explain development process during review.
