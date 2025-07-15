import { v4 as uuidv4 } from 'uuid';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  userId: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  location?: Location;
}

class TransactionService {
  private readonly STORAGE_KEY = 'transactions';

  // Get all transactions for a user
  getTransactions(userId: string): Transaction[] {
    const transactions = localStorage.getItem(this.STORAGE_KEY);
    if (!transactions) return [];
    return JSON.parse(transactions).filter((t: Transaction) => t.userId === userId);
  }

  // Add a new transaction
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const transactions = this.getTransactions(transaction.userId);
    const newTransaction = {
      ...transaction,
      id: uuidv4(),
      date: new Date()
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTransactions));
    return newTransaction;
  }

  // Update a transaction
  updateTransaction(transaction: Transaction): Transaction {
    const transactions = this.getTransactions(transaction.userId);
    const updatedTransactions = transactions.map(t => 
      t.id === transaction.id ? transaction : t
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTransactions));
    return transaction;
  }

  // Delete a transaction
  deleteTransaction(id: string, userId: string): void {
    const transactions = this.getTransactions(userId);
    const updatedTransactions = transactions.filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTransactions));
  }

  // Get transactions by category
  getTransactionsByCategory(userId: string, category: string): Transaction[] {
    return this.getTransactions(userId).filter(t => t.category === category);
  }

  // Get transactions by date range
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Transaction[] {
    return this.getTransactions(userId).filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
  }

  // Calculate total balance
  getTotalBalance(userId: string): number {
    const transactions = this.getTransactions(userId);
    return transactions.reduce((total, t) => {
      return total + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }

  // Calculate total income
  getTotalIncome(userId: string): number {
    const transactions = this.getTransactions(userId);
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0);
  }

  // Calculate total expenses
  getTotalExpenses(userId: string): number {
    const transactions = this.getTransactions(userId);
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0);
  }

  // Export transactions to CSV
  exportToCSV(userId: string): string {
    const transactions = this.getTransactions(userId);
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.description,
      t.amount.toString()
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

export const transactionService = new TransactionService(); 