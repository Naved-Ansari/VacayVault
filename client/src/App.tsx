import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { TripDetails } from './pages/TripDetails';
import { AllExpenses } from './pages/AllExpenses';
import { CombinedView } from './pages/CombinedView';
import { Categories } from './pages/Categories';
import { FamilyMembers } from './pages/FamilyMembers';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ExpenseModal } from './components/ExpenseModal';
import { TripModal } from './components/TripModal';
import { CategoryModal } from './components/CategoryModal';
import { MemberModal } from './components/MemberModal';
import { Trip, Category, FamilyMember, Expense } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  // Global shared state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenseDefaultTripId, setExpenseDefaultTripId] = useState<number | undefined>(undefined);

  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<FamilyMember | null>(null);

  const refreshAllData = async () => {
    try {
      const [tripsData, categoriesData, membersData] = await Promise.all([
        api.getTrips(),
        api.getCategories(),
        api.getMembers(),
      ]);
      setTrips(tripsData);
      setCategories(categoriesData);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to fetch initial application data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers for Opening Modals
  const handleOpenAddExpense = (tripId?: number) => {
    setExpenseToEdit(null);
    setExpenseDefaultTripId(tripId || (trips.length > 0 ? trips[0].id : undefined));
    setExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setExpenseDefaultTripId(expense.trip_id);
    setExpenseModalOpen(true);
  };

  const handleOpenCreateTrip = () => {
    setTripToEdit(null);
    setTripModalOpen(true);
  };

  const handleOpenEditTrip = (trip: Trip) => {
    setTripToEdit(trip);
    setTripModalOpen(true);
  };

  const handleSelectTrip = (tripId: number) => {
    setSelectedTripId(tripId);
    setActiveTab('trip-details');
  };

  const handleBackToTrips = () => {
    setSelectedTripId(null);
    setActiveTab('trips');
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab === 'trip-details' ? 'trips' : activeTab}
        setActiveTab={(tab) => {
          if (tab === 'trips') setSelectedTripId(null);
          setActiveTab(tab);
        }}
        onOpenAddExpense={() => handleOpenAddExpense()}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddExpense={() => handleOpenAddExpense()}
            onOpenCreateTrip={handleOpenCreateTrip}
            onSelectTrip={handleSelectTrip}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'trips' && (
          <Trips
            trips={trips}
            onRefresh={refreshAllData}
            onOpenCreateTrip={handleOpenCreateTrip}
            onOpenEditTrip={handleOpenEditTrip}
            onSelectTrip={handleSelectTrip}
          />
        )}

        {activeTab === 'trip-details' && selectedTripId && (
          <TripDetails
            tripId={selectedTripId}
            onBack={handleBackToTrips}
            onOpenAddExpense={handleOpenAddExpense}
            onOpenEditExpense={handleOpenEditExpense}
            onOpenEditTrip={handleOpenEditTrip}
            onDeleteTrip={async () => {
              await refreshAllData();
              handleBackToTrips();
            }}
          />
        )}

        {activeTab === 'expenses' && (
          <AllExpenses
            trips={trips}
            categories={categories}
            members={members}
            onOpenAddExpense={() => handleOpenAddExpense()}
            onOpenEditExpense={handleOpenEditExpense}
          />
        )}

        {activeTab === 'categories' && (
          <Categories
            categories={categories}
            onRefresh={refreshAllData}
            onOpenCreateCategory={() => {
              setCategoryToEdit(null);
              setCategoryModalOpen(true);
            }}
            onOpenEditCategory={(cat) => {
              setCategoryToEdit(cat);
              setCategoryModalOpen(true);
            }}
          />
        )}

        {activeTab === 'members' && (
          <FamilyMembers
            members={members}
            onRefresh={refreshAllData}
            onOpenCreateMember={() => {
              setMemberToEdit(null);
              setMemberModalOpen(true);
            }}
            onOpenEditMember={(member) => {
              setMemberToEdit(member);
              setMemberModalOpen(true);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <Reports trips={trips} categories={categories} members={members} />
        )}

        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Global Modals */}
      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={refreshAllData}
        expenseToEdit={expenseToEdit}
        defaultTripId={expenseDefaultTripId}
        trips={trips}
        categories={categories}
        members={members}
      />

      <TripModal
        isOpen={tripModalOpen}
        onClose={() => setTripModalOpen(false)}
        onSaved={(saved) => {
          refreshAllData();
          if (activeTab === 'trip-details' && selectedTripId === saved.id) {
            setSelectedTripId(saved.id);
          }
        }}
        tripToEdit={tripToEdit}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSaved={refreshAllData}
        categoryToEdit={categoryToEdit}
      />

      <MemberModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        onSaved={refreshAllData}
        memberToEdit={memberToEdit}
      />
    </div>
  );
};
export default App;
