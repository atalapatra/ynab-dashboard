import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import './IncomeExpenses.css';

const IncomeExpenses = ({
  data,
  categories,
  selectedIncomeCategories,
  selectedExpenseCategories,
  onIncomeSelectionChange,
  onExpenseSelectionChange
}) => {
  if (data.length === 0) {
    return (
      <div className="income-expenses">
        <p className="loading-message">Loading income and expense data...</p>
      </div>
    );
  }

  // Calculate filtered data based on selections
  const filteredData = useMemo(() => {
    return data.map((month) => {
      let income = 0;
      let expenses = 0;

      selectedIncomeCategories.forEach((cat) => {
        income += month[cat] || 0;
      });

      selectedExpenseCategories.forEach((cat) => {
        expenses += month[cat] || 0;
      });

      return {
        month: month.month,
        income,
        totalExpenses: expenses,
        net: income - expenses
      };
    });
  }, [data, selectedIncomeCategories, selectedExpenseCategories]);

  const toggleIncomeCategory = (category) => {
    if (selectedIncomeCategories.includes(category)) {
      onIncomeSelectionChange(selectedIncomeCategories.filter((c) => c !== category));
    } else {
      onIncomeSelectionChange([...selectedIncomeCategories, category]);
    }
  };

  const toggleExpenseCategory = (category) => {
    if (selectedExpenseCategories.includes(category)) {
      onExpenseSelectionChange(selectedExpenseCategories.filter((c) => c !== category));
    } else {
      onExpenseSelectionChange([...selectedExpenseCategories, category]);
    }
  };

  const toggleAllIncome = () => {
    if (selectedIncomeCategories.length === categories.income.length) {
      onIncomeSelectionChange([]);
    } else {
      onIncomeSelectionChange(categories.income);
    }
  };

  const toggleAllExpenses = () => {
    if (selectedExpenseCategories.length === categories.expenses.length) {
      onExpenseSelectionChange([]);
    } else {
      onExpenseSelectionChange(categories.expenses);
    }
  };

  // Custom dot component that colors based on positive/negative value
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const color = payload.net >= 0 ? '#059669' : '#dc2626';

    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
          <p style={{ color: '#059669', fontSize: '14px', margin: '4px 0' }}>
            Income: ${data.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p style={{ color: '#dc2626', fontSize: '14px', margin: '4px 0' }}>
            Total Expenses: ${data.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p style={{
            fontWeight: 'bold',
            fontSize: '15px',
            margin: '8px 0 4px 0',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '8px',
            color: data.net >= 0 ? '#059669' : '#dc2626'
          }}>
            Net: ${data.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const totalIncome = filteredData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = filteredData.reduce((sum, d) => sum + d.totalExpenses, 0);
  const totalNet = filteredData.reduce((sum, d) => sum + d.net, 0);
  const avgIncome = totalIncome / filteredData.length;
  const avgExpenses = totalExpenses / filteredData.length;
  const avgNet = totalNet / filteredData.length;

  const positiveMonths = filteredData.filter(d => d.net >= 0).length;
  const negativeMonths = filteredData.filter(d => d.net < 0).length;

  return (
    <div className="income-expenses">
      <h2>Net Income & Expenses by Month</h2>
      <p className="description">
        Track your monthly income, expenses, and net cash flow over time.
      </p>

      <div className="category-selection-section">
        <div className="category-selection-column">
          <div className="selection-header">
            <h3>Income Categories</h3>
            <button onClick={toggleAllIncome} className="toggle-all-btn">
              {selectedIncomeCategories.length === categories.income.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="category-checkboxes">
            {categories.income.map((cat) => (
              <label key={cat} className="category-checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedIncomeCategories.includes(cat)}
                  onChange={() => toggleIncomeCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="category-selection-column">
          <div className="selection-header">
            <h3>Expense Categories</h3>
            <button onClick={toggleAllExpenses} className="toggle-all-btn">
              {selectedExpenseCategories.length === categories.expenses.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="category-checkboxes">
            {categories.expenses.map((cat) => (
              <label key={cat} className="category-checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedExpenseCategories.includes(cat)}
                  onChange={() => toggleExpenseCategory(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Average Monthly</h3>
          <div className="summary-row">
            <span>Income:</span>
            <span className="positive">${avgIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row">
            <span>Expenses:</span>
            <span className="negative">${avgExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row net">
            <span>Net:</span>
            <span className={avgNet >= 0 ? 'positive' : 'negative'}>
              ${avgNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <h3>Total ({filteredData.length} months)</h3>
          <div className="summary-row">
            <span>Income:</span>
            <span className="positive">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row">
            <span>Expenses:</span>
            <span className="negative">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row net">
            <span>Net:</span>
            <span className={totalNet >= 0 ? 'positive' : 'negative'}>
              ${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="summary-card">
          <h3>Month Distribution</h3>
          <div className="summary-row">
            <span>Positive Months:</span>
            <span className="positive">{positiveMonths} ({((positiveMonths / filteredData.length) * 100).toFixed(0)}%)</span>
          </div>
          <div className="summary-row">
            <span>Negative Months:</span>
            <span className="negative">{negativeMonths} ({((negativeMonths / filteredData.length) * 100).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 80, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              angle={-45}
              textAnchor="end"
              height={100}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={40}
            />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#2563eb"
              strokeWidth={2}
              dot={<CustomDot />}
              name="Net (Income - Expenses)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="legend-note">
        <div className="legend-item">
          <div className="legend-dot positive"></div>
          <span>Positive Month (Green dot)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot negative"></div>
          <span>Negative Month (Red dot)</span>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenses;