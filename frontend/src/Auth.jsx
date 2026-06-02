import { useState } from "react";
import axios from "axios";
import { Mail, Lock, User, Sparkles, ArrowRight, Briefcase } from "lucide-react";
import { API_BASE_URL } from "./config";

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("developer");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || (!isLogin && !username) || (!isLogin && role === "recruiter" && !companyName)) {
      return alert("Bhai saari fields bharna zaroori hai! ⚠️");
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login API Call
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
        // Signup API Call
        const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { 
          email, 
          password, 
          username, 
          role, 
          companyName: role === "recruiter" ? companyName : "" 
        });
        alert(res.data.message);
        setIsLogin(true);
        setUsername("");
        setCompanyName("");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Koi gadbad ho gayi bhai! ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-200 flex items-center justify-center p-4 overflow-hidden font-sans transition-colors duration-300">
      {/* Background Cosmic Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/5 dark:bg-zinc-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Main Glass Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl space-y-8 z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3 bg-slate-900 dark:bg-zinc-800 text-white rounded-2xl shadow-sm">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            DevScale
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isLogin ? "Welcome back, developer! Let's get syncing. 🚀" : "Build a beautiful automated AI portfolio in seconds. 🔥"}
          </p>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="relative flex p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 z-10 cursor-pointer ${
              isLogin ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-700" : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 z-10 cursor-pointer ${
              !isLogin ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-700" : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              {/* Role Selection */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Select Role</label>
                <div className="flex gap-6 py-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="developer"
                      checked={role === "developer"}
                      onChange={() => setRole("developer")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                    />
                    Developer 💻
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={role === "recruiter"}
                      onChange={() => setRole("recruiter")}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                    />
                    Recruiter 💼
                  </label>
                </div>
              </div>
              {/* Username field */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  {role === "developer" ? "GitHub Username" : "Recruiter Username"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={role === "developer" ? "e.g. gaearon" : "e.g. hiring_manager"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 transition"
                  />
                </div>
              </div>

              {/* Recruiter-specific Company Name field */}
              {role === "recruiter" && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Google"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 transition"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="dev@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 transition"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-150 dark:text-zinc-950 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                {isLogin ? "Sign In" : "Register"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center border-t border-slate-200/50 dark:border-zinc-800 pt-4">
          <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">
            Protected by DevScale End-to-End Encryption. 🔒
          </p>
        </div>
      </div>
    </div>
  );
}