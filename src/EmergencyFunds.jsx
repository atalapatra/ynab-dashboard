import React, { useMemo, useEffect } from 'react';
import './EmergencyFunds.css';

const EmergencyFunds = ({ categories, accountsByCategory, data, settings, onSettingsChange }) => {
  // Destructure settings
  const { selectedAccounts, incomeStreams, nextIncomeId, monthlyExpenses } = settings;

  // Update functions that modify settings
  const setSelectedAccounts = (updater) => {
    const newValue = typeof updater === 'function' ? updater(selectedAccounts) : updater;
    onSettingsChange({ ...settings, selectedAccounts: newValue });
  };

  const setIncomeStreams = (updater) => {
    const newValue = typeof updater === 'function' ? updater(incomeStreams) : updater;
    onSettingsChange({ ...settings, incomeStreams: newValue });
  };

  const setNextIncomeId = (value) => {
    onSettingsChange({ ...settings, nextIncomeId: value });
  };

  const setMonthlyExpenses = (value) => {
    onSettingsChange({ ...settings, monthlyExpenses: value });
  };

  // Calculate total emergency funds from selected accounts
  const totalEmergencyFunds = useMemo(() => {
    let total = 0;
    Object.entries(selectedAccounts).forEach(([key, isSelected]) => {
      if (isSelected) {
        const [category, accountIndex] = key.split('_');
        const account = accountsByCategory[category]?.[parseInt(accountIndex)];
        if (account) {
          total += account.value;
        }
      }
    });
    return total;
  }, [selectedAccounts, accountsByCategory]);

  // Calculate total monthly income
  const totalMonthlyIncome = useMemo(() => {
    return incomeStreams.reduce((sum, stream) => sum + (parseFloat(stream.amount) || 0), 0);
  }, [incomeStreams]);

  // Calculate net monthly (income - expenses)
  const netMonthly = totalMonthlyIncome - monthlyExpenses;

  // Generate all scenarios for income loss
  const scenarios = useMemo(() => {
    if (incomeStreams.length === 0 || monthlyExpenses === 0) {
      return [];
    }

    const results = [];

    // Scenario 0: All income streams active
    const monthsWithAllIncome = netMonthly > 0 ? Infinity : (totalEmergencyFunds / monthlyExpenses);
    results.push({
      name: 'All Income Active',
      lostIncomes: [],
      activeIncome: totalMonthlyIncome,
      monthlyExpenses,
      netMonthly,
      monthsRemaining: monthsWithAllIncome,
    });

    // Generate scenarios for each combination of lost income streams
    const numStreams = incomeStreams.length;
    for (let i = 1; i < Math.pow(2, numStreams); i++) {
      const lostStreams = [];
      const activeStreams = [];
      let lostIncome = 0;
      let activeIncome = 0;

      for (let j = 0; j < numStreams; j++) {
        if (i & (1 << j)) {
          lostStreams.push(incomeStreams[j]);
          lostIncome += parseFloat(incomeStreams[j].amount) || 0;
        } else {
          activeStreams.push(incomeStreams[j]);
          activeIncome += parseFloat(incomeStreams[j].amount) || 0;
        }
      }

      const scenarioNetMonthly = activeIncome - monthlyExpenses;
      const monthsRemaining = scenarioNetMonthly >= 0
        ? Infinity
        : totalEmergencyFunds / Math.abs(scenarioNetMonthly);

      results.push({
        name: lostStreams.length === 1
          ? `Lost: ${lostStreams[0].name}`
          : `Lost: ${lostStreams.map(s => s.name).join(', ')}`,
        lostIncomes: lostStreams,
        activeIncome,
        monthlyExpenses,
        netMonthly: scenarioNetMonthly,
        monthsRemaining,
      });
    }

    // Sort by months remaining (ascending)
    return results.sort((a, b) => {
      if (a.monthsRemaining === Infinity && b.monthsRemaining === Infinity) return 0;
      if (a.monthsRemaining === Infinity) return 1;
      if (b.monthsRemaining === Infinity) return -1;
      return a.monthsRemaining - b.monthsRemaining;
    });
  }, [incomeStreams, monthlyExpenses, totalEmergencyFunds, totalMonthlyIncome, netMonthly]);

  // Toggle account selection
  const toggleAccount = (category, accountIndex) => {
    const key = `${category}_${accountIndex}`;
    setSelectedAccounts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle entire category
  const toggleCategory = (category) => {
    const accounts = accountsByCategory[category] || [];
    const allSelected = accounts.every((_, index) => {
      const key = `${category}_${index}`;
      return selectedAccounts[key];
    });

    const updates = {};
    accounts.forEach((_, index) => {
      const key = `${category}_${index}`;
      updates[key] = !allSelected;
    });

    setSelectedAccounts(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Check if all accounts in a category are selected
  const isCategorySelected = (category) => {
    const accounts = accountsByCategory[category] || [];
    if (accounts.length === 0) return false;
    return accounts.every((_, index) => {
      const key = `${category}_${index}`;
      return selectedAccounts[key];
    });
  };

  // Check if some (but not all) accounts in a category are selected
  const isCategoryIndeterminate = (category) => {
    const accounts = accountsByCategory[category] || [];
    if (accounts.length === 0) return false;
    const selectedCount = accounts.filter((_, index) => {
      const key = `${category}_${index}`;
      return selectedAccounts[key];
    }).length;
    return selectedCount > 0 && selectedCount < accounts.length;
  };

  // Add income stream
  const addIncomeStream = () => {
    onSettingsChange({
      ...settings,
      incomeStreams: [...incomeStreams, { id: nextIncomeId, name: `Income ${nextIncomeId}`, amount: 0 }],
      nextIncomeId: nextIncomeId + 1
    });
  };

  // Remove income stream
  const removeIncomeStream = (id) => {
    setIncomeStreams(incomeStreams.filter(stream => stream.id !== id));
  };

  // Update income stream
  const updateIncomeStream = (id, field, value) => {
    setIncomeStreams(prevStreams => prevStreams.map(stream =>
      stream.id === id ? { ...stream, [field]: value } : stream
    ));
  };

  return (
    <div className="emergency-funds">
      <h2>Emergency Fund Calculator</h2>
      <p className="description">
        Select accounts to count as emergency funds, define income streams and expenses,
        and see how many months you can sustain if one or more income streams stop.
      </p>

      <div className="ef-grid">
        {/* Left Column: Account Selection */}
        <div className="ef-section">
          <h3>Select Emergency Fund Accounts</h3>
          <div className="total-funds">
            <span>Total Emergency Funds:</span>
            <span className="amount">${totalEmergencyFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="account-selection">
            {categories.all?.map((category) => {
              const accounts = accountsByCategory[category] || [];
              if (accounts.length === 0) return null;

              const categorySelected = isCategorySelected(category);
              const categoryIndeterminate = isCategoryIndeterminate(category);

              return (
                <div key={category} className="category-group">
                  <div
                    className={`category-header ${categorySelected ? 'selected' : ''} ${categoryIndeterminate ? 'indeterminate' : ''}`}
                    onClick={() => toggleCategory(category)}
                  >
                    <input
                      type="checkbox"
                      checked={categorySelected}
                      ref={(el) => {
                        if (el) el.indeterminate = categoryIndeterminate;
                      }}
                      onChange={() => {}}
                    />
                    <h4>{category}</h4>
                  </div>
                  {accounts.map((account, index) => {
                    const key = `${category}_${index}`;
                    const isSelected = selectedAccounts[key];
                    const isClosed = account.fullName?.startsWith('(Closed');

                    return (
                      <div
                        key={key}
                        className={`account-select-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleAccount(category, index)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={() => {}}
                        />
                        <span className="account-select-name">
                          {account.name}
                          {isClosed && <> <span className="closed-badge">Closed</span></>}
                        </span>
                        <span className={`account-select-value ${account.value < 0 ? 'negative' : ''}`}>
                          ${account.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Income & Expenses */}
        <div className="ef-section">
          <h3>Monthly Income & Expenses</h3>

          <div className="income-section">
            <div className="section-header">
              <h4>Income Streams</h4>
              <button onClick={addIncomeStream} className="add-button">+ Add Income</button>
            </div>
            {incomeStreams.map((stream) => (
              <div key={stream.id} className="income-item">
                <input
                  type="text"
                  value={stream.name}
                  onChange={(e) => updateIncomeStream(stream.id, 'name', e.target.value)}
                  placeholder="Income name"
                  className="income-name-input"
                />
                <div className="income-amount-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    value={stream.amount}
                    onChange={(e) => updateIncomeStream(stream.id, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="income-amount-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                {incomeStreams.length > 1 && (
                  <button
                    onClick={() => removeIncomeStream(stream.id)}
                    className="remove-button"
                    title="Remove income stream"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <div className="income-total">
              <span>Total Monthly Income:</span>
              <span className="amount">${totalMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="expenses-section">
            <h4>Monthly Expenses</h4>
            <div className="expense-input-wrapper">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="expense-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="net-monthly">
            <span>Net Monthly (Income - Expenses):</span>
            <span className={`amount ${netMonthly >= 0 ? 'positive' : 'negative'}`}>
              ${netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Scenarios Section */}
      <div className="scenarios-section">
        <h3>Emergency Fund Scenarios</h3>
        {scenarios.length === 0 ? (
          <p className="no-scenarios">Enter income and expenses to see scenarios</p>
        ) : (
          <div className="scenarios-grid">
            {scenarios.map((scenario, index) => (
              <div key={index} className="scenario-card">
                <h4 className="scenario-name">{scenario.name}</h4>
                <div className="scenario-details">
                  <div className="scenario-row">
                    <span>Active Income:</span>
                    <span className="value">${scenario.activeIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="scenario-row">
                    <span>Monthly Expenses:</span>
                    <span className="value">${scenario.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="scenario-row">
                    <span>Net Monthly:</span>
                    <span className={`value ${scenario.netMonthly >= 0 ? 'positive' : 'negative'}`}>
                      ${scenario.netMonthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="scenario-months">
                    <span>Months of Funds:</span>
                    <span className={`months ${scenario.monthsRemaining === Infinity ? 'infinite' : scenario.monthsRemaining < 6 ? 'critical' : scenario.monthsRemaining < 12 ? 'warning' : 'good'}`}>
                      {scenario.monthsRemaining === Infinity ? '∞' : scenario.monthsRemaining.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyFunds;