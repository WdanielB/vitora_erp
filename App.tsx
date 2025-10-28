
import React, { useState, useEffect } from 'react';
import MainPanel from './components/MainPanel';
import SettingsPanel from './components/SettingsPanel';
import CostsPanel from './components/CostsPanel';
import HistoryPanel from './components/HistoryPanel';
import type { FlowerItem, FixedItem, View } from './types';
import * as api from './services/api'; // Import the new API service

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [flowerItems, setFlowerItems] = useState<FlowerItem[]>([]);
  const [fixedItems, setFixedItems] = useState<FixedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [flowers, fixed] = await Promise.all([
          api.fetchFlowerItems(),
          api.fetchFixedItems(),
        ]);
        setFlowerItems(flowers);
        setFixedItems(fixed);
      } catch (err) {
        setError("No se pudieron cargar los datos. Inténtalo de nuevo más tarde.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);
  
  const handleSetFlowerItems = async (newItems: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(flowerItems) : newItems;
    try {
        setFlowerItems(itemsToSave); // Optimistic update
        await api.updateFlowerItems(itemsToSave);
    } catch (e) {
        console.error("Failed to save flower items", e);
        // TODO: Revert state on failure
    }
  };

  const handleSetFixedItems = async (newItems: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => {
    const itemsToSave = typeof newItems === 'function' ? newItems(fixedItems) : newItems;
     try {
        setFixedItems(itemsToSave); // Optimistic update
        await api.updateFixedItems(itemsToSave);
    } catch (e) {
        console.error("Failed to save fixed items", e);
        // TODO: Revert state on failure
    }
  };


  const getCurrentTitle = () => {
    switch(view) {
      case 'main': return 'Panel Principal';
      case 'settings': return 'Panel de Ajustes';
      case 'costs': return 'Gestión de Costos';
      case 'history': return 'Historial de Costos';
      default: return 'Vitora ERP';
    }
  }
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-10 text-lg font-semibold text-gray-400">Cargando datos...</div>;
    }
    if (error) {
      return <div className="text-center p-10 text-red-400">{error}</div>;
    }
    
    switch(view) {
      case 'main':
        return <MainPanel
          flowerItems={flowerItems}
          setFlowerItems={handleSetFlowerItems}
          fixedItems={fixedItems}
          onNavigateToSettings={() => setView('settings')}
        />;
      case 'settings':
        return <SettingsPanel
          flowerItems={flowerItems}
          setFlowerItems={handleSetFlowerItems}
          fixedItems={fixedItems}
          setFixedItems={handleSetFixedItems}
          onNavigateToMain={() => setView('main')}
          onNavigateToCosts={() => setView('costs')}
          onNavigateToHistory={() => setView('history')}
        />;
      case 'costs':
        return <CostsPanel
          flowerItems={flowerItems}
          setFlowerItems={handleSetFlowerItems}
          fixedItems={fixedItems}
          setFixedItems={handleSetFixedItems}
          onNavigateToMain={() => setView('main')}
          onNavigateToSettings={() => setView('settings')}
        />;
      case 'history':
        return <HistoryPanel
          flowerItems={flowerItems}
          fixedItems={fixedItems}
          onNavigateToSettings={() => setView('settings')}
        />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-300 tracking-wider uppercase">
          {getCurrentTitle()}
        </h1>
        <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500 min-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
