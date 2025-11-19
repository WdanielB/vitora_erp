
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Sidebar.tsx';
import Header from './Header.tsx';
import DashboardPanel from './panels/DashboardPanel.tsx';
import MainPanel from './MainPanel.tsx';
import StockPanel from './panels/StockPanel.tsx';
import OrdersPanel from './panels/OrdersPanel.tsx';
import CalendarPanel from './panels/CalendarPanel.tsx';
import FinancePanel from './panels/FinancePanel.tsx';
import SettingsPanel from './SettingsPanel.tsx';
import PinPadModal from './PinPadModal.tsx';
import type { FlowerItem, ProductItem, VariationGift, View, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, OrderItem } from '../types.ts';
import * as api from '../services/api.ts';
import { moduleNames } from '../constants.ts';

interface ERPProps { user: User; onLogout: () => void; }

const ERP: React.FC<ERPProps> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [view, setView] = useState<View>('dashboard');
  
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [variationGifts, setVariationGifts] = useState<VariationGift[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>('all');
  const [pinChallenge, setPinChallenge] = useState<View | null>(null);
  const [unlockedModules, setUnlockedModules] = useState<Set<View>>(new Set());
  const hasLoaded = useRef(false);

  // State for transferring order data from Quotation to Orders
  const [pendingOrderItems, setPendingOrderItems] = useState<OrderItem[] | undefined>(undefined);

  const loadData = useCallback(async (currentSelectedUserId: string | null) => {
      if (!user?._id) return;
      try {
        if (!hasLoaded.current) setIsLoading(true);
        setError(null);
        const [resFlowers, resProds, resGifts, resStock, resOrders, resClients, resEvents, resExpenses, resSummary, resUsers] = await Promise.all([
          api.fetchFlowerItems(user, currentSelectedUserId).catch(() => []),
          api.fetchProductItems(user, currentSelectedUserId).catch(() => []),
          api.fetchVariationGifts(user, currentSelectedUserId).catch(() => []),
          api.fetchStock(user, currentSelectedUserId).catch(() => []),
          api.fetchOrders(user, currentSelectedUserId).catch(() => []),
          api.fetchClients(user, currentSelectedUserId).catch(() => []),
          api.fetchEvents(user, currentSelectedUserId).catch(() => []),
          api.fetchFixedExpenses(user, currentSelectedUserId).catch(() => []),
          api.fetchFinancialSummary(user, currentSelectedUserId).catch(() => null),
          user.role === 'admin' ? api.fetchUsers(user).catch(() => []) : Promise.resolve([])
        ]);
        setFlowerItems(Array.isArray(resFlowers) ? resFlowers : []);
        setProductItems(Array.isArray(resProds) ? resProds : []);
        setVariationGifts(Array.isArray(resGifts) ? resGifts : []);
        setStock(Array.isArray(resStock) ? resStock : []);
        setOrders(Array.isArray(resOrders) ? resOrders : []);
        setClients(Array.isArray(resClients) ? resClients : []);
        setEvents(Array.isArray(resEvents) ? resEvents : []);
        setFixedExpenses(Array.isArray(resExpenses) ? resExpenses : []);
        setFinancialSummary(resSummary);
        if (user.role === 'admin' && Array.isArray(resUsers)) setAllUsers(resUsers);
        hasLoaded.current = true;
      } catch (err) { console.error(err); setError("Problema cargando datos."); } finally { setIsLoading(false); }
  }, [user]);

  useEffect(() => { loadData(selectedUserId); }, [loadData, selectedUserId]);

  const handleSetView = (newView: View) => {
    if (user.role === 'user' && user.modulePins?.[newView] && !unlockedModules.has(newView)) setPinChallenge(newView);
    else setView(newView);
  };
  
  const handlePinSuccess = () => {
    if (pinChallenge) { setUnlockedModules(prev => new Set(prev).add(pinChallenge)); setView(pinChallenge); setPinChallenge(null); }
  };

  const handleConvertOrder = (items: OrderItem[]) => {
      setPendingOrderItems(items);
      handleSetView('orders');
  };

  const renderContent = () => {
    const panelClass = "bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500";
    const wrapper = (content: React.ReactNode, fullHeight = false) => (<div className={`${panelClass} ${fullHeight ? 'h-full' : 'min-h-[calc(100vh-10rem)]'}`}>{content}</div>);

    if (isLoading && !hasLoaded.current) return wrapper(<div className="flex justify-center h-full items-center">Cargando...</div>, true);
    
    switch(view) {
      case 'dashboard': return wrapper(<DashboardPanel orders={orders} financialSummary={financialSummary} stockItems={stock} user={user} allUsers={allUsers} onSelectUser={setSelectedUserId} />);
      case 'quotation': return wrapper(<MainPanel flowerItems={flowerItems} variationGifts={variationGifts} onConvertOrder={handleConvertOrder} />, true);
      case 'stock': return wrapper(<StockPanel stockItems={stock} onStockUpdate={() => loadData(selectedUserId)} user={user} selectedUserId={selectedUserId} flowerItems={flowerItems} setFlowerItems={async(u)=>{/*optimistic*/}} productItems={productItems} setProductItems={async(u)=>{/*optimistic*/}} />, true);
      case 'orders': return wrapper(<OrdersPanel orders={orders} allItems={[...flowerItems, ...productItems]} clients={clients} onDataNeedsRefresh={() => loadData(selectedUserId)} user={user} prefillItems={pendingOrderItems} onOrderCreated={() => setPendingOrderItems(undefined)} />);
      case 'calendar': return wrapper(<CalendarPanel events={events} orders={orders} user={user} onDataNeedsRefresh={() => loadData(selectedUserId)} />, true);
      case 'finance': return wrapper(<FinancePanel summary={financialSummary} fixedExpenses={fixedExpenses} orders={orders} user={user} onDataNeedsRefresh={() => loadData(selectedUserId)} flowerItems={flowerItems} setFlowerItems={async(u)=>{}} productItems={productItems} setProductItems={async(u)=>{}} />, true);
      case 'settings': return <SettingsPanel flowerItems={flowerItems} productItems={productItems} user={user} onUserPinsUpdate={u => {setUser(u); sessionStorage.setItem('vitoraUser', JSON.stringify(u));}} allUsers={allUsers} onUsersRefresh={() => loadData(selectedUserId)} />;
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex font-sans">
      <Sidebar currentView={view} setView={handleSetView} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} onLogout={onLogout} allUsers={allUsers} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">{error && <div className="bg-red-900/50 p-2 mb-2 rounded">{error}</div>}{renderContent()}</div>
      </main>
      {pinChallenge && <PinPadModal isOpen={true} onClose={() => setPinChallenge(null)} correctPin={user.modulePins?.[pinChallenge] || ''} onSuccess={handlePinSuccess} moduleName={moduleNames[pinChallenge]} />}
    </div>
  );
};
export default ERP;
