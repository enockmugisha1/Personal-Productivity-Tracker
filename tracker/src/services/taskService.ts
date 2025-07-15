import { v4 as uuidv4 } from 'uuid';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  location?: Location;
}

class TaskService {
  private readonly STORAGE_KEY = 'tasks';

  getTasks(): Task[] {
    const tasks = localStorage.getItem(this.STORAGE_KEY);
    if (!tasks) return [];
    return JSON.parse(tasks);
  }

  addTask(task: Omit<Task, 'id'>): Task {
    const tasks = this.getTasks();
    const newTask = { ...task, id: uuidv4() };
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTasks));
    return newTask;
  }

  updateTask(task: Task): Task {
    const tasks = this.getTasks();
    const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTasks));
    return task;
  }

  deleteTask(id: string): void {
    const tasks = this.getTasks();
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTasks));
  }
}

export const taskService = new TaskService(); 