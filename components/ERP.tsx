
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
import type { FlowerItem, FixedItem, View, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client } from '../types.ts';
import * as api from '../services/api.ts';
import { moduleNames } from '../constants.ts';

interface ERPProps {
    user: User;
    onLogout: () => void;
}

const ERP: React.FC<ERPProps> = ({ user: initialUser, onLogout }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [view, setView] = useState<View>('dashboard');
  
  // Estados de Datos - Inicializados siempre como arrays vacíos
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Estados de Control
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>('all'); // Vista Admin
  
  // Seguridad PIN
  const [pinChallenge, setPinChallenge] = useState<View | null>(null);
  const [unlockedModules, setUnlockedModules] = useState<Set<View>>(new Set());

  const hasLoaded = useRef(false);

  // Carga de datos unificada y BLINDADA
  const loadData = useCallback(async (currentSelectedUserId: string | null) => {
      if (!user?._id) return;
      
      try {
        // Solo mostrar spinner en la primera carga para evitar parpadeos
        if (!hasLoaded.current) setIsLoading(true);
        setError(null);
        
        const [
            resFlowers, resFixed, resStock, resOrders, 
            resClients, resEvents, resExpenses, resSummary, resUsers
        ] = await Promise.all([
          api.fetchFlowerItems(user, currentSelectedUserId).catch(() => []),
          api.fetchFixedItems(user, currentSelectedUserId).catch(() => []),
          api.fetchStock(user, currentSelectedUserId).catch(() => []),
          api.fetchOrders(user, currentSelectedUserId).catch(() => []),
          api.fetchClients(user, currentSelectedUserId).catch(() => []),
          api.fetchEvents(user, currentSelectedUserId).catch(() => []),
          api.fetchFixedExpenses(user, currentSelectedUserId).catch(() => []),
          api.fetchFinancialSummary(user, currentSelectedUserId).catch(() => null),
          user.role === 'admin' ? api.fetchUsers(user).catch(() => []) : Promise.resolve([])
        ]);

        // Validación estricta: Si no es array, usar array vacío.
        // Esto evita que un error 500 del servidor rompa el frontend con "x.map is not a function"
        setFlowerItems(Array.isArray(resFlowers) ? resFlowers : []);
        setFixedItems(Array.isArray(resFixed) ? resFixed : []);
        setStock(Array.isArray(resStock) ? resStock : []);
        setOrders(Array.isArray(resOrders) ? resOrders : []);
        setClients(Array.isArray(resClients) ? resClients : []);
        setEvents(Array.isArray(resEvents) ? resEvents : []);
        setFixedExpenses(Array.isArray(resExpenses) ? resExpenses : []);
        setFinancialSummary(resSummary); // Puede ser null, el componente hijo lo maneja
        
        if (user.role === 'admin' && Array.isArray(resUsers)) {
            setAllUsers(resUsers);
        }
        
        hasLoaded.current = true;

      } catch (err) {
        console.error("Error crítico en carga de datos:", err);
        setError("Hubo un problema cargando los datos. Algunas funciones pueden no estar disponibles.");
        // No reseteamos los datos a vacío aquí para mantener lo que ya se veía si es un refresco fallido
      } finally {
        setIsLoading(false);
      }
  }, [user]); // Dependencias mínimas para evitar ciclos

  useEffect(() => {
    loadData(selectedUserId);
  }, [loadData, selectedUserId]);

  // Manejo de Vistas y Seguridad
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

  // Actualizadores optimistas
  const handleSetFlowerItems = async (newItems: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => {
    setFlowerItems(prev => {
        const updated = typeof newItems === 'function' ? newItems(prev) : newItems;
        api.updateFlowerItems(updated, user._id).catch(e => console.error(e));
        return updated;
    });
  };

  const handleSetFixedItems = async (newItems: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => {
    setFixedItems(prev => {
        const updated = typeof newItems === 'function' ? newItems(prev) : newItems;
        api.updateFixedItems(updated, user._id).catch(e => console.error(e));
        return updated;
    });
  };

  const onUserPinsUpdate = (updatedUser: User) => {
      setUser(updatedUser);
      sessionStorage.setItem('vitoraUser', JSON.stringify(updatedUser));
  }

  const renderContent = () => {
    const panelClass = "bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500";
    const panelWrapper = (content: React.ReactNode, fullHeight: boolean = false) => (
         <div className={`${panelClass} ${fullHeight ? 'h-full' : 'min-h-[calc(100vh-10rem)]'}`}>
            {content}
         </div>
    );

    if (isLoading && !hasLoaded.current) {
      return panelWrapper(<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div></div>, true);
    }
    
    switch(view) {
      case 'dashboard': return panelWrapper(<DashboardPanel orders={orders || []} financialSummary={financialSummary} stockItems={stock || []} user={user} allUsers={allUsers} onSelectUser={setSelectedUserId} />);
      case 'quotation': return panelWrapper(<MainPanel flowerItems={flowerItems || []} setFlowerItems={handleSetFlowerItems} fixedItems={fixedItems || []} />, true);
      case 'stock': return panelWrapper(<StockPanel stockItems={stock || []} onStockUpdate={() => loadData(selectedUserId)} user={user} selectedUserId={selectedUserId} flowerItems={flowerItems || []} setFlowerItems={handleSetFlowerItems} fixedItems={fixedItems || []} setFixedItems={handleSetFixedItems} />, true);
      case 'orders': return panelWrapper(<OrdersPanel orders={orders || []} allItems={[...(flowerItems || []), ...(fixedItems || [])]} clients={clients || []} onDataNeedsRefresh={() => loadData(selectedUserId)} user={user} />);
      case 'calendar': return panelWrapper(<CalendarPanel events={events || []} orders={orders || []} user={user} onDataNeedsRefresh={() => loadData(selectedUserId)} />, true);
      case 'finance': return panelWrapper(<FinancePanel summary={financialSummary} fixedExpenses={fixedExpenses || []} orders={orders || []} user={user} onDataNeedsRefresh={() => loadData(selectedUserId)} flowerItems={flowerItems || []} setFlowerItems={handleSetFlowerItems} fixedItems={fixedItems || []} setFixedItems={handleSetFixedItems} />, true);
      case 'settings': return <SettingsPanel flowerItems={flowerItems || []} fixedItems={fixedItems || []} user={user} onUserPinsUpdate={onUserPinsUpdate} allUsers={allUsers || []} />;
      default: return panelWrapper(<DashboardPanel orders={orders} financialSummary={financialSummary} stockItems={stock} />);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex font-sans">
      <Sidebar currentView={view} setView={handleSetView} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} onLogout={onLogout} allUsers={allUsers} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
             {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-lg flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-sm font-bold hover:text-white">✕</button>
                </div>
            )}
            {renderContent()}
        </div>
      </main>
      {pinChallenge && (
        <PinPadModal
            isOpen={!!pinChallenge}
            onClose={() => setPinChallenge(null)}
            correctPin={user.modulePins?.[pinChallenge] || ''}
            onSuccess={handlePinSuccess}
            moduleName={moduleNames[pinChallenge]}
        />
      )}
    </div>
  );
};

export default ERP;
