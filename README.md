# YNAB Net Worth Dashboard

A React dashboard that visualizes net worth by category over time from YNAB CSV exports.

## Features

- **Stacked line chart** showing net worth trends by category
- **Category extraction** from account names (format: `Owner - Category - Source - Account Name`)
- **Debt visualization** with negative values displayed in red
- **CSV upload** to update the dashboard with new data
- **Interactive tooltips** showing detailed values for each category

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

- The dashboard automatically loads the CSV file from `/data/ynab-reflect-net-worth-2025-09-29.csv`
- Click "Upload New CSV" to load a different CSV file
- Hover over the chart to see detailed values for each category at any point in time
- Negative values (debt) are shown in red throughout the dashboard

## CSV Format

The CSV should have:
- First column: Account names in format `Owner - Category - Source - Account Name`
- Remaining columns: Monthly values with dates as headers
- Accounts marked with `(Closed)` are automatically excluded

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.