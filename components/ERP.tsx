
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardPanel from './panels/DashboardPanel';
import MainPanel from './MainPanel';
import StockPanel from './panels/StockPanel';
import OrdersPanel from './panels/OrdersPanel';
import CalendarPanel from './panels/CalendarPanel';
import FinancePanel from './panels/FinancePanel';
import SettingsPanel from './SettingsPanel';
import type { FlowerItem, FixedItem, View, User } from '../types';
import * as api from '../services/api';

interface ERPProps {
    user: User;
    onLogout: () => void;
}

const ERP: React.FC<ERPProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<View>('dashboard');
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?._id) return;
      try {
        setIsLoading(true);
        setError(null);
        const [flowers, fixed] = await Promise.all([
          api.fetchFlowerItems(user._id),
          api.fetchFixedItems(user._id),
        ]);
        setFlowerItems(flowers);
        setFixedItems(fixed);
      } catch (err) {
        setError("No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);
  
  const handleSetFlowerItems = async (newItems: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(flowerItems) : newItems;
    try {
        setFlowerItems(itemsToSave); // Optimistic update
        await api.updateFlowerItems(itemsToSave, user._id);
    } catch (e) {
        console.error("Failed to save flower items", e);
        setError("Error al guardar las flores. Los cambios podrían no persistir.");
        // TODO: Revert state on failure
    }
  };

  const handleSetFixedItems = async (newItems: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(fixedItems) : newItems;
     try {
        setFixedItems(itemsToSave); // Optimistic update
        await api.updateFixedItems(itemsToSave, user._id);
    } catch (e) {
        console.error("Failed to save fixed items", e);
        setError("Error al guardar los items fijos. Los cambios podrían no persistir.");
        // TODO: Revert state on failure
    }
  };

  const renderContent = () => {
    const panelWrapper = (content: React.ReactNode, fullHeight: boolean = false) => (
         <div className={`bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500 ${fullHeight ? 'h-full' : 'min-h-[calc(100vh-10rem)]'}`}>
            {content}
         </div>
    );

    if (isLoading) {
      return panelWrapper(<div className="flex items-center justify-center h-full text-center p-10 text-lg font-semibold text-gray-400">Cargando datos del usuario...</div>);
    }
    if (error) {
      return panelWrapper(<div className="flex items-center justify-center h-full text-center p-10 text-red-400">{error}</div>);
    }
    
    switch(view) {
      case 'dashboard':
        return panelWrapper(<DashboardPanel />);
      case 'quotation':
        return panelWrapper(<MainPanel
          flowerItems={flowerItems}
          setFlowerItems={handleSetFlowerItems}
          fixedItems={fixedItems}
        />, true);
      case 'stock':
        return panelWrapper(<StockPanel flowerItems={flowerItems} fixedItems={fixedItems} />);
      case 'orders':
        return panelWrapper(<OrdersPanel />);
      case 'calendar':
        return panelWrapper(<CalendarPanel />);
      case 'finance':
        return panelWrapper(<FinancePanel />);
      case 'settings':
        return <SettingsPanel
          flowerItems={flowerItems}
          setFlowerItems={handleSetFlowerItems}
          fixedItems={fixedItems}
          setFixedItems={handleSetFixedItems}
          user={user}
        />;
      default:
        return panelWrapper(<DashboardPanel />);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex font-sans">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default ERP;
