export interface Destination {
  id?: number;
  trip_id?: number;
  name: string;
  country?: string | null;
}

export interface Trip {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  travelers_count: number;
  notes?: string;
  created_at?: string;
  total_spent_inr?: number;
  expense_count?: number;
  destinations: Destination[];
  expenses?: Expense[];
  category_breakdown?: {
    name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
  }[];
  destination_breakdown?: {
    name: string;
    total: number;
    count: number;
  }[];
  daily_spending?: {
    date: string;
    total: number;
  }[];
}

export interface Subcategory {
  id: number;
  category_id?: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  expense_count?: number;
  total_spent_inr?: number;
  subcategories: Subcategory[];
}

export interface FamilyMember {
  id: number;
  name: string;
  notes?: string;
  avatar_color: string;
  expense_count?: number;
  total_spent_inr?: number;
}

export interface Expense {
  id: number;
  trip_id: number;
  trip_name?: string;
  destination_id?: number | null;
  destination_name?: string | null;
  name: string;
  amount: number;
  currency: string;
  exchange_rate_to_inr: number;
  amount_inr: number;
  expense_date: string;
  category_id?: number | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  subcategory_id?: number | null;
  subcategory_name?: string | null;
  paid_by_member_id?: number | null;
  paid_by_name?: string | null;
  paid_by_color?: string | null;
  comment?: string;
  created_at?: string;
}

export interface DashboardData {
  total_trips: number;
  total_expenses_count: number;
  total_spent_inr: number;
  recent_trips: Trip[];
  recent_expenses: Expense[];
  category_spending: {
    name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
  }[];
  destination_spending: {
    name: string;
    total: number;
    count: number;
  }[];
}

export interface CombinedData {
  total_trips: number;
  total_spent_inr: number;
  trips: Trip[];
  category_breakdown: {
    name: string;
    color: string;
    icon: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  destination_breakdown: {
    name: string;
    country?: string | null;
    total: number;
    count: number;
  }[];
  spending_trends: {
    month_year: string;
    total: number;
    count: number;
  }[];
  member_spending: {
    name: string;
    avatar_color: string;
    total: number;
    count: number;
  }[];
}
