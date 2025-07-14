
import React from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Transaction } from '../services/transactionService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TransactionChartsProps {
  transactions: Transaction[];
}

const TransactionCharts: React.FC<TransactionChartsProps> = ({ transactions }) => {
  // Prepare data for expense by category pie chart
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  // Prepare data for income vs expenses line chart
  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.date).toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0 };
    }
    if (t.type === 'income') {
      acc[month].income += t.amount;
    } else {
      acc[month].expenses += t.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);

  const lineChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Income',
        data: Object.values(monthlyData).map(d => d.income),
        borderColor: '#4CAF50',
        tension: 0.1
      },
      {
        label: 'Expenses',
        data: Object.values(monthlyData).map(d => d.expenses),
        borderColor: '#F44336',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
        <Pie data={pieChartData} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
        <Line data={lineChartData} />
      </div>
    </div>
  );
};

export default TransactionCharts; 
