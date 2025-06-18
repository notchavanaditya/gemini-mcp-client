import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout/Layout';
import Chat from './pages/Chat';
import Extensions from './pages/Extensions';
import FileManager from './pages/FileManager';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <AppProvider>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100 min-h-screen">
          <Router>
            <Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/extensions" element={<Extensions />} />
                <Route path="/files" element={<FileManager />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
              },
            }}
          />
        </div>
      </div>
    </AppProvider>
  );
}

export default App;