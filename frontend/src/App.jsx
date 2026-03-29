import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import Home from './pages/Home';

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
  };

  return token ? (
    <Home token={token} onLogout={handleLogout} />
  ) : (
    <Auth onLogin={handleLogin} />
  );
}
