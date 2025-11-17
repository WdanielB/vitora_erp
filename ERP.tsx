
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPanel from './panels/DashboardPanel';
import MainPanel from './MainPanel';
import StockPanel from './panels/StockPanel';
import OrdersPanel from './panels/OrdersPanel';
import CalendarPanel from './panels/CalendarPanel';
import FinancePanel from './panels/FinancePanel';
import SettingsPanel from './SettingsPanel';
import PinPadModal from './PinPadModal';
import type { FlowerItem, FixedItem, View, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client } from './types';
import * as api from './services/api';

interface ERPProps {
    user: User;
    onLogout: () => void;
}

const ERP: React.FC<ERPProps> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [view, setView] = useState<View>('dashboard');
  
  // Data states
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Control states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>('all'); // For admin view
  
  // PIN security states
  const [pinChallenge, setPinChallenge] = useState<View | null>(null);
  const [unlockedModules, setUnlockedModules] = useState<Set<View>>(new Set());

  const loadData = useCallback(async (currentSelectedUserId: string | null) => {
      if (!user) return;
      try {
        setIsLoading(true);
        setError(null);
        
        const [flowers, fixed, stockData, ordersData, clientsData, eventsData, expensesData, summaryData] = await Promise.all([
          api.fetchFlowerItems(user, currentSelectedUserId),
          api.fetchFixedItems(user, currentSelectedUserId),
          api.fetchStock(user, currentSelectedUserId),
          api.fetchOrders(user, currentSelectedUserId),
          api.fetchClients(user, currentSelectedUserId),
          api.fetchEvents(user, currentSelectedUserId),
          api.fetchFixedExpenses(user, currentSelectedUserId),
          api.fetchFinancialSummary(user, currentSelectedUserId),
        ]);

        setFlowerItems(flowers);
        setFixedItems(fixed);
        setStock(stockData);
        setOrders(ordersData);
        setClients(clientsData);
        setEvents(eventsData);
        setFixedExpenses(expensesData);
        setFinancialSummary(summaryData);

        if (user.role === 'admin') {
            const usersData = await api.fetchUsers(user);
            setAllUsers(usersData);
        }

      } catch (err) {
        setError("No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
  }, [user]);

  useEffect(() => {
    loadData(selectedUserId);
  }, [loadData, selectedUserId]);

  const handleSetView = (newView: View) => {
    if (user.role === 'user' && user.modulePins?.[newView] && !unlockedModules.has(newView)) {
        setPinChallenge(newView);
    } else {
        setView(newView);
    }
  };
  
  const handlePinSuccess = () => {
    if (pinChallenge) {
        setUnlockedModules(prev => new Set(prev).add(pinChallenge));
        setView(pinChallenge);
        setPinChallenge(null);
    }
  };

  const handleSetFlowerItems = async (newItems: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(flowerItems) : newItems;
    try {
        setFlowerItems(itemsToSave);
        await api.updateFlowerItems(itemsToSave, user._id);
    } catch (e) { console.error("Failed to save flower items", e); }
  };

  const handleSetFixedItems = async (newItems: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(fixedItems) : newItems;
     try {
        setFixedItems(itemsToSave);
        await api.updateFixedItems(itemsToSave, user._id);
    } catch (e) { console.error("Failed to save fixed items", e); }
  };

  const onUserPinsUpdate = (updatedUser: User) => {
      setUser(updatedUser); // Update user state with new PINs
  }

  const renderContent = () => {
    const panelWrapper = (content: React.ReactNode, fullHeight: boolean = false) => (
         <div className={`bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500 ${fullHeight ? 'h-full' : 'min-h-[calc(100vh-10rem)]'}`}>
            {content}
         </div>
    );

    if (isLoading) {
      return panelWrapper(<div className="flex items-center justify-center h-full text-center p-10 text-lg font-semibold text-gray-400">Cargando datos...</div>);
    }
    if (error) {
      return panelWrapper(<div className="flex items-center justify-center h-full text-center p-10 text-red-400">{error}</div>);
    }
    
    const allItems = [...flowerItems, ...fixedItems];

    switch(view) {
      case 'dashboard':
        return panelWrapper(<DashboardPanel orders={orders} financialSummary={financialSummary} allItems={allItems} />);
      case 'quotation':
        return panelWrapper(<MainPanel flowerItems={flowerItems} setFlowerItems={handleSetFlowerItems} fixedItems={fixedItems} />, true);
      case 'stock':
        return panelWrapper(<StockPanel stockItems={stock} onStockUpdate={() => loadData(selectedUserId)} user={user} selectedUserId={selectedUserId} />);
      case 'orders':
        return panelWrapper(<OrdersPanel orders={orders} allItems={allItems} clients={clients} onDataNeedsRefresh={() => loadData(selectedUserId)} user={user} />);
      case 'calendar':
        return panelWrapper(<CalendarPanel events={events} orders={orders} />);
      case 'finance':
        return panelWrapper(<FinancePanel summary={financialSummary} fixedExpenses={fixedExpenses} orders={orders} allItems={allItems} />);
      case 'settings':
        return <SettingsPanel flowerItems={flowerItems} setFlowerItems={handleSetFlowerItems} fixedItems={fixedItems} setFixedItems={handleSetFixedItems} user={user} onUserPinsUpdate={onUserPinsUpdate} />;
      default:
        return panelWrapper(<DashboardPanel orders={orders} financialSummary={financialSummary} allItems={allItems} />);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex font-sans">
      <Sidebar currentView={view} setView={handleSetView} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} onLogout={onLogout} allUsers={allUsers} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            {renderContent()}
        </div>
      </main>
      {pinChallenge && (
        <PinPadModal
            isOpen={!!pinChallenge}
            onClose={() => setPinChallenge(null)}
            correctPin={user.modulePins?.[pinChallenge] || ''}
            onSuccess={handlePinSuccess}
        />
      )}
    </div>
  );
};

export default ERP;