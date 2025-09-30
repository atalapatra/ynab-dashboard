# YNAB Dashboard

A comprehensive React dashboard for visualizing net worth, income & expenses, and emergency fund scenarios from YNAB CSV exports.

## Features

### Net Worth Tab
- **Stacked area chart** showing net worth trends by category over time
- **Category extraction** from account names (format: `Owner - Category - Source - Account Name`)
- **Interactive category selection** - click categories to show/hide them on the chart
- **Debt visualization** with negative values displayed in red
- **Account details** grouped by category with current balances
- **Dynamic net worth calculation** based on selected categories

### Income & Expenses Tab
- **Line chart** showing net cash flow by month
- **Color-coded data points** - green dots for positive months, red dots for negative months
- **Category selection** for both income and expenses
- **Select/Deselect all** buttons for quick filtering
- **Summary statistics** showing averages, totals, and month distributions
- **Real-time updates** as categories are selected/deselected

### Emergency Funds Tab
- **Account selection** by category with checkboxes for entire categories or individual accounts
- **Multiple income streams** - add, edit, and remove income sources
- **Monthly expenses** input
- **Scenario calculator** - automatically generates all possible income loss scenarios
- **Months of funds remaining** calculated for each scenario with color coding:
  - Green (∞): Sustainable indefinitely
  - Green: 12+ months
  - Orange: 6-12 months
  - Red: Less than 6 months
- **Persistent settings** - your selections are saved when switching tabs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to the URL shown (typically http://localhost:5173)

## Usage

### Loading Data
- The dashboard automatically loads sample data on startup
- **Upload Net Worth CSV** - Load your net worth data
- **Upload Income/Expense CSV** - Load your income and expense data
- Sample data files are located in `/sample-data/`

### Net Worth Tab
- Click category names or use checkboxes to include/exclude categories from the chart
- Use "Select All" / "Deselect All" to quickly toggle all categories
- View accounts included in each category at the bottom of the page
- Closed accounts are marked and displayed with reduced opacity

### Income & Expenses Tab
- Select which income and expense categories to include in the analysis
- Use the "Select All" / "Deselect All" buttons for quick filtering
- Chart and summary statistics update automatically based on selections
- Hover over data points to see detailed breakdown

### Emergency Funds Tab
1. Select accounts that count as emergency funds (click category headers to select all accounts in that category)
2. Add your income streams with monthly amounts
3. Enter your total monthly expenses
4. View all scenarios showing how long your funds would last if one or more income streams stopped

## CSV Formats

### Net Worth CSV
- First column: Account names in format `Owner - Category - Source - Account Name`
- Remaining columns: Monthly values with dates as headers
- Accounts marked with `(Closed)` are shown but can be excluded

### Income/Expense CSV
- First column: Category names
- Section markers:
  - Income section starts after "All Income Sources"
  - Expense section starts at "Fixed Household Expenses" and "Variable Household Expenses"
- Summary rows (e.g., "Total Income", "Fixed Household Expenses") are automatically excluded
- Monthly values in remaining columns with dates as headers

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.