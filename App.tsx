
import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen.tsx';
import ERP from './components/ERP.tsx';
import type { User } from './types.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check session storage for logged in user
    try {
      const loggedInUser = sessionStorage.getItem('vitoraUser');
      if (loggedInUser) {
        setUser(JSON.parse(loggedInUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('vitoraUser');
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    sessionStorage.setItem('vitoraUser', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vitoraUser');
    setUser(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <ERP user={user} onLogout={handleLogout} />;
};

export default App;