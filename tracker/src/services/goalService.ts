import { v4 as uuidv4 } from 'uuid';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'ongoing' | 'completed';
  location?: Location;
}

class GoalService {
  private readonly STORAGE_KEY = 'goals';

  getGoals(): Goal[] {
    const goals = localStorage.getItem(this.STORAGE_KEY);
    if (!goals) return [];
    return JSON.parse(goals);
  }

  addGoal(goal: Omit<Goal, 'id'>): Goal {
    const goals = this.getGoals();
    const newGoal = { ...goal, id: uuidv4() };
    const updatedGoals = [...goals, newGoal];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedGoals));
    return newGoal;
  }

  updateGoal(goal: Goal): Goal {
    const goals = this.getGoals();
    const updatedGoals = goals.map(g => g.id === goal.id ? goal : g);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedGoals));
    return goal;
  }

  deleteGoal(id: string): void {
    const goals = this.getGoals();
    const updatedGoals = goals.filter(g => g.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedGoals));
  }
}

export const goalService = new GoalService(); 