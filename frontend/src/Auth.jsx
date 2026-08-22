import { useState } from "react";
import axios from "axios";
import { Mail, Lock, User, Sparkles, ArrowRight, Briefcase, Terminal, Shield, GitBranch, Zap, Users } from "lucide-react";
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
    
    if (!email || !password || (!isLogin && !username) || (!isLogin && role === "recruiter" && !companyName)) {
      return alert("Bhai saari fields bharna zaroori hai! ⚠️");
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);
      } else {
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
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* LEFT COLUMN: Visual Brand Showcase (Visible on large screens, scrollable on mobile if layout flows) */}
      <div className="hidden lg:flex lg:col-span-7 relative bg-zinc-900 overflow-hidden flex-col justify-between p-12 text-left">
        {/* Deep space cosmic gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight leading-none">DevScale</h2>
            <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest font-mono">Autonomous Portfolio Engine</span>
          </div>
        </div>

        {/* Interactive Features / Copywriting */}
        <div className="space-y-8 relative z-10 max-w-xl my-auto">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Recruitment
            </span>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Decoupled AI & Modular <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">
                Portfolio Auditing.
              </span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              DevScale connects directly to developer GitHub repositories to execute real Radon complexity indexes, SentenceTransformer ATS job alignment matching, and real-time voice-viva interviews with proctoring.
            </p>
          </div>

          {/* Dynamic Interactive HUD stats representation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-450">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider font-mono">Code Auditing</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Radon metrics parsing, cyclomatic path count, and regex security threat detection.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-teal-400">
                <Zap className="w-4 h-4 text-teal-450" />
                <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider font-mono">ATS Semantic Match</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Natural Language Sentence Similarity comparison using all-MiniLM-L6-v2 embeddings.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-violet-400">
                <Users className="w-4 h-4 text-violet-450" />
                <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider font-mono">Voice Viva Proctor</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Speech-to-text voice analysis tracking filler word density, WPM, and eye contact deviation.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shield className="w-4 h-4 text-emerald-450" />
                <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-wider font-mono">Hiring Predictor</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Logistic Regression model predicting recruiter engagement using weighted profile activity.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between text-zinc-550 relative z-10">
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
            System Node: Port 5000 & Flask: Port 8000
          </p>
          <span className="text-[10px] text-zinc-500 font-medium">© 2026 DevScale Ecosystem</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Card Panel */}
      <div className="flex-1 lg:col-span-5 flex items-center justify-center p-8 sm:p-16 relative overflow-hidden">
        {/* Background Blobs for Mobile View */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none lg:hidden animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none lg:hidden animate-pulse"></div>

        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-10 rounded-[32px] shadow-2xl space-y-8 z-10 transition-all duration-300">
          
          {/* Brand Header for Mobile View */}
          <div className="flex flex-col items-center space-y-3 text-center lg:hidden">
            <div className="p-3 bg-slate-900 dark:bg-zinc-855 text-white rounded-2xl shadow-md border border-zinc-800/20">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              DevScale
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {isLogin ? "Welcome back, developer! Let's get syncing. 🚀" : "Build a beautiful automated AI portfolio in seconds. 🔥"}
            </p>
          </div>

          {/* Desktop Brand Subheader */}
          <div className="hidden lg:block text-left space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isLogin ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-xs text-slate-555 dark:text-zinc-400 font-medium leading-relaxed">
              {isLogin ? "Access your developer workspace and telemetry tools." : "Establish your automated portfolio dashboard."}
            </p>
          </div>

          {/* Quick Test Login Credentials (PREMIUM DEMO HELPER) */}
          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 p-3.5 rounded-2xl text-left space-y-2">
            <span className="text-[9px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-extrabold uppercase font-mono tracking-wider">
              DEMO GATEWAY PRESETS
            </span>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setEmail("gargpyush11111@gmail.com");
                  setPassword("123456");
                  setIsLogin(true);
                }}
                className="flex-1 text-[10px] bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 p-2 rounded-xl text-slate-800 dark:text-zinc-200 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💻 Dev Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("testuser");
                  setPassword("password123");
                  setIsLogin(true);
                }}
                className="flex-1 text-[10px] bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 p-2 rounded-xl text-slate-800 dark:text-zinc-200 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💼 Recruiter Profile
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="relative flex p-1 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 z-10 cursor-pointer ${
                isLogin ? "bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800" : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 z-10 cursor-pointer ${
                !isLogin ? "bg-white dark:bg-zinc-850 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800" : "text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Role Switch */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Select Role</label>
                  <div className="flex gap-6 py-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-zinc-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="role"
                        value="developer"
                        checked={role === "developer"}
                        onChange={() => setRole("developer")}
                        className="w-4 h-4 text-indigo-650 border-slate-350 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                      />
                      Developer 💻
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-750 dark:text-zinc-300 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="role"
                        value="recruiter"
                        checked={role === "recruiter"}
                        onChange={() => setRole("recruiter")}
                        className="w-4 h-4 text-indigo-650 border-slate-355 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                      />
                      Recruiter 💼
                    </label>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                    {role === "developer" ? "GitHub Username" : "Recruiter Username"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder={role === "developer" ? "e.g. gaearon" : "e.g. tech_hiring"}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 transition"
                    />
                  </div>
                </div>

                {/* Recruiter-specific Company Name */}
                {role === "recruiter" && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Company Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                        <Briefcase className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Google"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 transition"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="dev@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-650 transition"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Processing Setup...
                </span>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Register Profile"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="text-center border-t border-slate-100 dark:border-zinc-800/80 pt-4">
            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              🛡️ Protected by DevScale End-to-End Encryption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}