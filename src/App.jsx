import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [accountsByCategory, setAccountsByCategory] = useState({});
  const [isUsingSampleData, setIsUsingSampleData] = useState(true);

  // Load sample data on mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = async () => {
    try {
      const response = await fetch('/data/sample-data.csv');
      const text = await response.text();
      processCSV(text);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processCSV(e.target.result);
        setIsUsingSampleData(false);
      };
      reader.readAsText(file);
    }
  };

  const processCSV = (csvText) => {
    Papa.parse(csvText, {
      complete: (result) => {
        const rows = result.data;
        if (rows.length < 2) return;

        // Extract headers (dates)
        const headers = rows[0].slice(1); // Skip "Account" column

        // Parse accounts and group by category
        const categoryData = {};
        const accountsMap = {};

        rows.slice(1).forEach((row) => {
          if (!row[0] || row[0] === 'Net Worth') return; // Skip empty or net worth row

          const accountName = row[0];

          // Extract category from account name format: "Owner - Category - Source - Account Name"
          const parts = accountName.split(' - ');
          if (parts.length < 2) return;

          const category = parts[1].trim();
          const fullAccountName = parts.slice(2).join(' - ').trim() || accountName;

          if (!categoryData[category]) {
            categoryData[category] = {};
            accountsMap[category] = [];
          }

          // Track accounts by category
          accountsMap[category].push({
            name: fullAccountName,
            fullName: accountName
          });

          // Sum values for each date
          row.slice(1).forEach((value, index) => {
            const date = headers[index];
            const numValue = parseFloat(value.replace(/,/g, '')) || 0;
            categoryData[category][date] = (categoryData[category][date] || 0) + numValue;
          });
        });

        // Separate positive and negative categories
        const allCategories = Object.keys(categoryData);
        const positiveCategories = [];
        const negativeCategories = [];

        allCategories.forEach((category) => {
          const avgValue = Object.values(categoryData[category]).reduce((a, b) => a + b, 0) /
                          Object.values(categoryData[category]).length;
          if (avgValue < 0) {
            negativeCategories.push(category);
          } else {
            positiveCategories.push(category);
          }
        });

        // Transform data for Recharts with net worth calculation
        const chartData = headers.map((date) => {
          const dataPoint = { date };
          let netWorth = 0;

          Object.keys(categoryData).forEach((category) => {
            const value = categoryData[category][date] || 0;
            dataPoint[category] = value;
            netWorth += value;
          });

          dataPoint.netWorth = netWorth;
          return dataPoint;
        });

        const sortedCategories = {
          all: allCategories.sort(),
          positive: positiveCategories.sort(),
          negative: negativeCategories.sort()
        };

        setData(chartData);
        setCategories(sortedCategories);
        setSelectedCategories(sortedCategories.all); // Select all by default
        setAccountsByCategory(accountsMap);
      },
    });
  };

  // Color scheme for different categories
  const getColorForCategory = (category) => {
    const positiveColors = [
      '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#06b6d4',
      '#0891b2', '#ea580c', '#4f46e5', '#65a30d', '#e11d48',
      '#0284c7', '#d97706', '#7c3aed', '#059669', '#be123c'
    ];

    const negativeColors = [
      '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#ef4444',
      '#f87171', '#fca5a5'
    ];

    if (categories.negative?.includes(category)) {
      const index = categories.negative.indexOf(category) % negativeColors.length;
      return negativeColors[index];
    }

    const index = categories.positive?.indexOf(category) % positiveColors.length;
    return positiveColors[index];
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.all?.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.all || []);
    }
  };

  // Recalculate net worth based on selected categories
  const getFilteredNetWorth = (dataPoint) => {
    let netWorth = 0;
    selectedCategories.forEach((category) => {
      netWorth += dataPoint[category] || 0;
    });
    return netWorth;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const netWorthEntry = payload.find(p => p.dataKey === 'netWorth');
      const categoryEntries = payload.filter(p => p.dataKey !== 'netWorth');

      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{label}</p>
          {netWorthEntry && (
            <p style={{ fontWeight: 'bold', fontSize: '15px', margin: '4px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              Net Worth: ${netWorthEntry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          {categoryEntries
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
            .map((entry) => (
              <p key={entry.name} style={{ color: entry.color, fontSize: '14px', margin: '4px 0' }}>
                {entry.name}: ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="app">
        <div className="empty-state">
          <h1>Net Worth by Category Over Time</h1>
          <p>Loading sample data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Net Worth by Category Over Time</h1>
        <div className="upload-section">
          {isUsingSampleData && (
            <span className="sample-data-badge">Using Sample Data</span>
          )}
          <label htmlFor="file-upload" className="file-upload-label">
            Upload New CSV
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </header>

      <div className="controls">
        <button onClick={toggleAllCategories} className="toggle-all-button">
          {selectedCategories.length === categories.all?.length ? 'Deselect All' : 'Select All'}
        </button>
        <span className="selection-count">
          {selectedCategories.length} of {categories.all?.length} categories selected
        </span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={700}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 80, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
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
              height={60}
              wrapperStyle={{ paddingBottom: '20px' }}
            />

            {/* Positive categories as stacked areas above 0 */}
            {categories.positive?.filter(cat => selectedCategories.includes(cat)).map((category) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="positive"
                stroke={getColorForCategory(category)}
                fill={getColorForCategory(category)}
                fillOpacity={0.6}
                name={category}
              />
            ))}

            {/* Negative categories as stacked areas below 0 */}
            {categories.negative?.filter(cat => selectedCategories.includes(cat)).map((category) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="negative"
                stroke={getColorForCategory(category)}
                fill={getColorForCategory(category)}
                fillOpacity={0.6}
                name={category}
              />
            ))}

            {/* Net worth line in black */}
            <Line
              type="monotone"
              dataKey={(dataPoint) => getFilteredNetWorth(dataPoint)}
              stroke="#000000"
              strokeWidth={3}
              dot={false}
              name="Net Worth"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="summary">
        <div className="net-worth-summary">
          <h2>Current Net Worth (Selected Categories)</h2>
          <div className="net-worth-value">
            ${getFilteredNetWorth(data[data.length - 1] || {}).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <h2>Categories (click to show/hide)</h2>
        <div className="category-list">
          {categories.all?.map((category) => {
            const latestValue = data[data.length - 1]?.[category] || 0;
            const isDebt = latestValue < 0;
            const isSelected = selectedCategories.includes(category);
            return (
              <div
                key={category}
                className={`category-item ${isSelected ? 'selected' : 'unselected'}`}
                onClick={() => toggleCategory(category)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="category-checkbox"
                />
                <div
                  className="category-color"
                  style={{ backgroundColor: getColorForCategory(category) }}
                />
                <span className="category-name">{category}</span>
                <span className={`category-value ${isDebt ? 'negative' : ''}`}>
                  ${latestValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>

        <div className="accounts-section">
          <h2>Accounts Included in Chart</h2>
          {selectedCategories.length === 0 ? (
            <p className="no-accounts">No categories selected</p>
          ) : (
            <div className="accounts-by-category">
              {selectedCategories.map((category) => (
                <div key={category} className="account-category-group">
                  <h3 className="account-category-header">
                    <span
                      className="account-category-color"
                      style={{ backgroundColor: getColorForCategory(category) }}
                    />
                    {category}
                  </h3>
                  <ul className="account-list">
                    {accountsByCategory[category]?.map((account, index) => (
                      <li key={index} className="account-list-item">
                        {account.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;