import {
  Trip,
  Expense,
  Category,
  FamilyMember,
  DashboardData,
  CombinedData,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const errObj = await response.json();
      if (errObj && errObj.error) {
        errMsg = errObj.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Dashboard & Analytics
  getDashboard: () => request<DashboardData>('/analytics/dashboard'),
  getCombined: (year?: string) =>
    request<CombinedData>(`/analytics/combined${year ? `?year=${year}` : ''}`),

  // Trips
  getTrips: () => request<Trip[]>('/trips'),
  getTrip: (id: number) => request<Trip>(`/trips/${id}`),
  createTrip: (data: Partial<Trip> & { destinations?: { name: string; country?: string }[] }) =>
    request<Trip>('/trips', { method: 'POST', body: JSON.stringify(data) }),
  updateTrip: (id: number, data: Partial<Trip> & { destinations?: { name: string; country?: string }[] }) =>
    request<Trip>(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrip: (id: number) => request<{ message: string; id: number }>(`/trips/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: (filters?: {
    trip_id?: number | string;
    category_id?: number | string;
    destination_id?: number | string;
    paid_by_member_id?: number | string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.append(k, String(v));
        }
      });
    }
    const qs = params.toString();
    return request<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  },
  getExpense: (id: number) => request<Expense>(`/expenses/${id}`),
  createExpense: (data: Partial<Expense>) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id: number, data: Partial<Expense>) =>
    request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id: number) =>
    request<{ message: string; id: number }>(`/expenses/${id}`, { method: 'DELETE' }),
  duplicateExpense: (id: number) =>
    request<Expense>(`/expenses/${id}/duplicate`, { method: 'POST' }),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: { name: string; icon?: string; color?: string; subcategories?: string[] }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: number, data: { name: string; icon?: string; color?: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request<{ message: string; id: number }>(`/categories/${id}`, { method: 'DELETE' }),
  addSubcategory: (catId: number, name: string) =>
    request<{ id: number; category_id: number; name: string }>(`/categories/${catId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteSubcategory: (catId: number, subId: number) =>
    request<{ message: string; id: number }>(`/categories/${catId}/subcategories/${subId}`, {
      method: 'DELETE',
    }),

  // Family Members
  getMembers: () => request<FamilyMember[]>('/members'),
  createMember: (data: { name: string; notes?: string; avatar_color?: string }) =>
    request<FamilyMember>('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id: number, data: { name: string; notes?: string; avatar_color?: string }) =>
    request<FamilyMember>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMember: (id: number) =>
    request<{ message: string; id: number }>(`/members/${id}`, { method: 'DELETE' }),

  // Currency
  getCurrencyRates: () =>
    request<{ base: string; ratesToInr: Record<string, number>; lastUpdated: number }>('/currency'),
  refreshCurrencyRates: () => request<{ message: string; rates: Record<string, number> }>('/currency/refresh', { method: 'POST' }),
};
