
import React, { useState } from 'react';
import MainPanel from './components/MainPanel';
import SettingsPanel from './components/SettingsPanel';
import CostsPanel from './components/CostsPanel';
import HistoryPanel from './components/HistoryPanel';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { FlowerItem, FixedItem, View } from './types';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  
  const [flowerItems, setFlowerItems] = useLocalStorage<FlowerItem[]>('flowerItems', DEFAULT_FLOWER_ITEMS);
  const [fixedItems, setFixedItems] = useLocalStorage<FixedItem[]>('fixedItems', DEFAULT_FIXED_ITEMS);
  
  const getCurrentTitle = () => {
    switch(view) {
      case 'main': return 'Panel Principal';
      case 'settings': return 'Panel de Ajustes';
      case 'costs': return 'Gestión de Costos';
      case 'history': return 'Historial de Costos';
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-300 tracking-wider uppercase">
          {getCurrentTitle()}
        </h1>
        <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-6 md:p-8 transition-all duration-500">
          {view === 'main' && (
            <MainPanel
              flowerItems={flowerItems}
              setFlowerItems={setFlowerItems}
              fixedItems={fixedItems}
              onNavigateToSettings={() => setView('settings')}
            />
          )}
          {view === 'settings' && (
             <SettingsPanel
              flowerItems={flowerItems}
              setFlowerItems={setFlowerItems}
              fixedItems={fixedItems}
              setFixedItems={setFixedItems}
              onNavigateToMain={() => setView('main')}
              onNavigateToCosts={() => setView('costs')}
              onNavigateToHistory={() => setView('history')}
            />
          )}
          {view === 'costs' && (
            <CostsPanel
              flowerItems={flowerItems}
              setFlowerItems={setFlowerItems}
              fixedItems={fixedItems}
              setFixedItems={setFixedItems}
              onNavigateToMain={() => setView('main')}
              onNavigateToSettings={() => setView('settings')}
            />
          )}
           {view === 'history' && (
            <HistoryPanel
              flowerItems={flowerItems}
              fixedItems={fixedItems}
              onNavigateToSettings={() => setView('settings')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
