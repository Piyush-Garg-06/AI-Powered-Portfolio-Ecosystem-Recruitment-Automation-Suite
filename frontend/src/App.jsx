import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Auth from "./Auth";
import Dashboard from "./pages/Dashboard";
import PublicPortfolio from "./pages/PublicPortfolio";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setLoading(false);
  }, []);

  // Sync theme to HTML document element for class-based dark mode
  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold tracking-wider uppercase">Loading DevScale...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Auth Route */}
      <Route
        path="/auth"
        element={!user ? <Auth onLoginSuccess={(userData) => setUser(userData)} /> : <Navigate to="/dashboard" />}
      />

      {/* 2. Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard
              user={user}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogout={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setUser(null);
              }}
            />
          ) : (
            <Navigate to="/auth" />
          )
        }
      />

      {/* 3. Public Portfolio Route */}
      <Route
        path="/portfolio/:username"
        element={
          <PublicPortfolio
            theme={theme}
            toggleTheme={toggleTheme}
          />
        }
      />

      {/* Default Route */}
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
}