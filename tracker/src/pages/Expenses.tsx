import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { transactionService, Transaction } from '../services/transactionService';
import { formatCurrency } from '../config/currencies';
import AddTransaction from '../components/AddTransaction';
import TransactionCharts from '../components/TransactionCharts';
import CurrencySelector from '../components/CurrencySelector';
import { FiPlus, FiDownload, FiFilter, FiTrash2 } from 'react-icons/fi';

const Expenses: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, selectedDateRange, selectedCategory]);

  const loadTransactions = () => {
    if (!user) return;
    let filteredTransactions = transactionService.getTransactionsByDateRange(
      user.id,
      selectedDateRange.start,
      selectedDateRange.end
    );
    
    if (selectedCategory !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.category === selectedCategory);
    }
    
    setTransactions(filteredTransactions);
  };

  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'userId' | 'date'>) => {
    if (!user) return;
    const newTransaction = transactionService.addTransaction({
      ...transaction,
      userId: user.id,
      date: new Date()
    });
    setTransactions([...transactions, newTransaction]);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      transactionService.deleteTransaction(id, user.id);
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (!user) return;
    const csv = transactionService.exportToCSV(user.id);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalBalance = transactionService.getTotalBalance(user?.id || '');
  const totalIncome = transactionService.getTotalIncome(user?.id || '');
  const totalExpenses = transactionService.getTotalExpenses(user?.id || '');

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Expense Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your finances effectively</p>
        </div>
        <div className="flex items-center space-x-4">
          <CurrencySelector />
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <FiFilter className="mr-2" />
              Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <FiDownload className="mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              <FiPlus className="mr-2" />
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={selectedDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDateRange(prev => ({
                  ...prev,
                  start: new Date(e.target.value)
                }))}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={selectedDateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDateRange(prev => ({
                  ...prev,
                  end: new Date(e.target.value)
                }))}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Balance</h3>
          <p className="text-2xl font-bold mt-2">{formatCurrency(totalBalance, currency)}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {totalBalance >= 0 ? 'Positive balance' : 'Negative balance'}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Income</h3>
          <p className="text-2xl font-bold text-green-500 mt-2">{formatCurrency(totalIncome, currency)}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last 30 days
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-500 mt-2">{formatCurrency(totalExpenses, currency)}</p>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-6">
        <TransactionCharts transactions={transactions} />
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-primary-500 hover:text-primary-600"
              >
                Add your first transaction
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border-b dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{transaction.description}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddTransaction
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddTransaction}
        />
      )}
    </div>
  );
};

export default Expenses; 
