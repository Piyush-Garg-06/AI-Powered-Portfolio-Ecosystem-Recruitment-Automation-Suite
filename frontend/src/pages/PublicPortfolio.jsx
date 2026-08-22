import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Terminal, BookOpen, Star, ExternalLink, Award, Sparkles,
  Sun, Moon, ShieldAlert, Check, Copy
} from "lucide-react";
import AIChatbot from "../components/AIChatbot";
import { API_BASE_URL } from "../config";

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function PublicPortfolio({ theme, toggleTheme }) {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [suiteTab, setSuiteTab] = useState("intent");

  const [recName, setRecName] = useState(() => localStorage.getItem("recName") || "");
  const [recCompany, setRecCompany] = useState(() => localStorage.getItem("recCompany") || "");
  const [sessionActive, setSessionActive] = useState(() => !!(localStorage.getItem("recName") && localStorage.getItem("recCompany")));

  const [recIntent, setRecIntent] = useState("VIEW_PROFILE");
  const [recMessage, setRecMessage] = useState("");
  const [intentSubmitting, setIntentSubmitting] = useState(false);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);

  const [jdInput, setJdInput] = useState("");
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsData, setAtsData] = useState(null);

  const handleIntentSubmit = async (e) => {
    e.preventDefault();
    if (!recName.trim()) return alert("Please enter your Recruiter Name.");
    setIntentSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/portfolio/${username}/track`, {
        recruiterUsername: recName,
        companyName: recCompany || "Independent Recruiter",
        actionType: recIntent,
        metaData: recMessage
      });
      alert("Hiring interest and activity successfully logged! The developer will see this instantly on their dashboard. 🚀");
      setRecMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to register hiring intent.");
    } finally {
      setIntentSubmitting(false);
    }
  };

  const runPublicCodeAudit = async (force = false) => {
    if (!recName.trim()) {
      alert("Please specify a Recruiter Username to track and run the codebase audit.");
      return;
    }
    setAuditLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/portfolio/${username}/public-audit`, {
        recruiterUsername: recName,
        companyName: recCompany || "Independent Recruiter",
        force: force
      });
      setAuditData(res.data.auditReport || res.data);
      if (force) {
        alert("Bypassed cache and performed fresh code quality audit! 🔄");
      }
    } catch (err) {
      console.error(err);
      alert("Code quality static audit failed to run. Check if AI engine microservice is running.");
    } finally {
      setAuditLoading(false);
    }
  };

  const runPublicAtsMatch = async () => {
    if (!recName.trim()) {
      alert("Please specify a Recruiter Username to track and calculate compatibility.");
      return;
    }
    if (!jdInput.trim()) {
      alert("Please paste a Job Description first.");
      return;
    }
    setAtsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/portfolio/${username}/public-ats`, {
        jobDescription: jdInput,
        recruiterUsername: recName,
        companyName: recCompany || "Independent Recruiter"
      });
      setAtsData(res.data.atsResult || res.data);
    } catch (err) {
      console.error(err);
      alert("ATS match compatibility check failed.");
    } finally {
      setAtsLoading(false);
    }
  };

  const handleRecruiterLogin = (e) => {
    e.preventDefault();
    if (!recName.trim() || !recCompany.trim()) return alert("Please specify both Name and Company.");
    localStorage.setItem("recName", recName.trim());
    localStorage.setItem("recCompany", recCompany.trim());
    setSessionActive(true);
  };

  const handleRecruiterLogout = () => {
    localStorage.removeItem("recName");
    localStorage.removeItem("recCompany");
    setRecName("");
    setRecCompany("");
    setSessionActive(false);
  };

  useEffect(() => {
    if (username) {
      fetchPortfolioData(username);
    }
  }, [username]);

  const fetchPortfolioData = async (uname) => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/portfolio/${uname}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching portfolio: ", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-white flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400 absolute animate-pulse" />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Building Developer Space...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-white flex flex-col items-center justify-center p-6 text-center space-y-4 transition-colors duration-300">
        <div className="p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm shadow-md space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-black text-slate-800 dark:text-zinc-200">Portfolio Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            We couldn't retrieve details for: <span className="font-mono text-indigo-600 dark:text-indigo-400">@{username}</span>. Ensure this user exists and has synchronized via control dashboard.
          </p>
          <Link
            to="/auth"
            className="w-full inline-block py-2.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Create Your AI Portfolio
          </Link>
        </div>
      </div>
    );
  }
  const uniqueLanguages = Array.from(new Set(data.projects?.map(p => p.language).filter(Boolean) || []));

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-200 font-sans selection:bg-indigo-600 selection:text-white pb-20 transition-colors duration-300">

      {/* Ambient Radial Gradient Backdrops */}
      <div className="absolute top-0 left-0 w-full h-[650px] bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none"></div>
      <div className="absolute top-[8%] right-[10%] w-[450px] h-[450px] bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[30%] left-[5%] w-[450px] h-[450px] bg-slate-500/5 dark:bg-zinc-700/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Navigation Header */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 group cursor-default">
          <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-black tracking-widest text-slate-700 dark:text-zinc-300 uppercase">DEVSCALE SPACE</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition cursor-pointer shadow-sm"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            to="/auth"
            className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 px-4 py-2.5 rounded-xl transition shadow-sm bg-slate-50/50 dark:bg-zinc-900/40"
          >
            Create Yours ⚡
          </Link>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Profile Info & Vetting Panel (col-span-5) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Glassmorphic Profile Card */}
            <section className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-850 p-8 rounded-[32px] shadow-xl flex flex-col items-center md:items-start text-center md:text-left gap-6 transition-all">
              <div className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-450 rounded-[32px] blur opacity-25 group-hover:opacity-55 transition duration-500"></div>
                <img
                  src={data.avatar}
                  alt={data.name}
                  className="relative w-28 h-28 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 object-cover shadow-2xl"
                />
              </div>

              <div className="space-y-4 w-full">
                <div className="space-y-2 text-center md:text-left">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {data.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 tracking-wider font-mono">@{data.username}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      🎯 {data.predictedRole || "Full-Stack Developer"}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                      {Math.round((data.roleConfidence || 1.0) * 100)}% Confidence
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-650 dark:text-zinc-400 leading-relaxed font-normal">
                  {data.bio || "Full-stack developer building robust technical solutions. This profile biography remains updated from GitHub details."}
                </p>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100 dark:border-zinc-850 mt-2 w-full justify-center md:justify-start">
                  <a
                    href={`https://github.com/${data.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-150 text-white dark:text-zinc-950 px-5 py-3 rounded-xl font-bold transition shadow-md w-full sm:w-auto cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                    GitHub Profile
                  </a>
                  <div className="flex items-center justify-center gap-1.5 text-xs bg-indigo-500/5 border border-indigo-500/15 text-indigo-600 dark:text-indigo-450 px-4 py-3 rounded-xl font-bold w-full sm:w-auto">
                    <Award className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-450 animate-pulse" />
                    <span>Verified Sync</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recruiter Vetting & Alignment Suite */}
            <section className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-850 p-6 sm:p-8 rounded-[32px] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-850 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-lg">
                    💼
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">Recruiter Vetting</h3>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Perform direct technical audit checks or submit candidate hiring interest.</p>
                  </div>
                </div>

                {sessionActive && (
                  <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-950/60 px-3 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-slate-600 dark:text-zinc-400 font-bold">
                      {recName} @ {recCompany}
                    </span>
                    <button
                      onClick={handleRecruiterLogout}
                      className="text-[9px] text-rose-500 hover:text-rose-650 hover:underline font-extrabold ml-1.5 uppercase cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>

              {/* Tab Content Wrapper */}
              {!sessionActive ? (
                <div className="bg-slate-50/50 dark:bg-zinc-950/60 p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-900/80 space-y-4 text-left shadow-inner">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-indigo-550 dark:text-indigo-400 font-extrabold uppercase tracking-widest font-mono">🔒 UNLOCK VETTING CONTROLS</span>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Enter Recruiter Credentials</h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      We log recruiter actions, code audits, and ATS queries to update the candidate's live dashboard activity stream.
                    </p>
                  </div>

                  <form onSubmit={handleRecruiterLogin} className="space-y-3.5">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Your Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rohini Sen"
                          value={recName}
                          onChange={(e) => setRecName(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-550 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Organization / Company</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. DevScale Corp"
                          value={recCompany}
                          onChange={(e) => setRecCompany(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-555 font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow hover:shadow-indigo-555/10 cursor-pointer"
                    >
                      Activate Recruiter Vetting Session 🔑
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tab Selectors */}
                  <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-zinc-950 rounded-xl">
                    <button
                      onClick={() => setSuiteTab("intent")}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${suiteTab === "intent"
                          ? "bg-white dark:bg-zinc-900 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                        }`}
                    >
                      Intent Form
                    </button>
                    <button
                      onClick={() => setSuiteTab("audit")}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${suiteTab === "audit"
                          ? "bg-white dark:bg-zinc-900 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                        }`}
                    >
                      Code Audit
                    </button>
                    <button
                      onClick={() => setSuiteTab("ats")}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${suiteTab === "ats"
                          ? "bg-white dark:bg-zinc-900 text-indigo-650 dark:text-indigo-400 shadow-sm"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                        }`}
                    >
                      ATS Compatibility
                    </button>
                  </div>

                  {/* Tab 1: Hiring Interest Form */}
                  {suiteTab === "intent" && (
                    <form onSubmit={handleIntentSubmit} className="space-y-4 text-left">
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Hiring Intent Level</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            value={recIntent}
                            onChange={(e) => setRecIntent(e.target.value)}
                          >
                            <option value="VIEW_PROFILE">Warm Bookmarked Lead</option>
                            <option value="ATS_MATCH">ATS Match Query</option>
                            <option value="MOCK_INTERVIEW">Trigger Interview Intent</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Target Role / Message</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Senior Frontend React Engineer"
                            value={recMessage}
                            onChange={(e) => setRecMessage(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={intentSubmitting}
                        className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-indigo-555/15 cursor-pointer"
                      >
                        {intentSubmitting ? "Submitting Interest..." : "Submit Recruitment Intent"}
                      </button>
                    </form>
                  )}

                  {/* Tab 2: Code Quality Snapshot */}
                  {suiteTab === "audit" && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-3 bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200 dark:border-zinc-900 rounded-2xl shadow-inner">
                        <div className="text-left space-y-1">
                          <span className="text-[10px] text-indigo-550 dark:text-indigo-400 font-extrabold uppercase tracking-wider block">Repository Static Code Audit</span>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-normal">
                            Analyze complexity, Radon maintainability, and exception patterns across synchronized repositories.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => runPublicCodeAudit(false)}
                            disabled={auditLoading}
                            className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow cursor-pointer whitespace-nowrap disabled:opacity-50"
                          >
                            {auditLoading ? "Running..." : "Run Audit"}
                          </button>
                          {auditData && (
                            <button
                              onClick={() => runPublicCodeAudit(true)}
                              disabled={auditLoading}
                              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer whitespace-nowrap disabled:opacity-50"
                              title="Bypass cache and run fresh calculation"
                            >
                              Force Refresh
                            </button>
                          )}
                        </div>
                      </div>

                      {auditData ? (
                        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-zinc-850">
                          {/* Visual circular representation of Radon ratings */}
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { label: "Clean Code", value: auditData.scores?.cleanCode || 0, stroke: "#10b981" },
                              { label: "Security Scan", value: auditData.scores?.security || 0, stroke: "#6366f1" },
                              { label: "Complexity", value: auditData.scores?.scalability || 0, stroke: "#8b5cf6" },
                              { label: "Exceptions", value: auditData.scores?.errorHandling || 85, stroke: "#f59e0b" }
                            ].map((card, i) => (
                              <div key={i} className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200/60 dark:border-zinc-900 flex flex-col items-center">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">{card.label}</span>
                                <div className="relative w-14 h-14 flex items-center justify-center mt-2">
                                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.5" className="dark:stroke-zinc-850" />
                                    <circle cx="18" cy="18" r="15.915" fill="none" stroke={card.stroke} strokeWidth="3.5" strokeDasharray={`${card.value}, 100`} strokeLinecap="round" />
                                  </svg>
                                  <span className="absolute text-[10px] font-black text-slate-800 dark:text-zinc-200">{card.value}%</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-zinc-200">
                              <span>Cyclomatic Complexity:</span>
                              <span className="font-mono">{auditData.metrics?.cyclomaticComplexity || 1.8}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-zinc-200">
                              <span>Maintainability Rating:</span>
                              <span className="font-mono">Grade {auditData.metrics?.riskGrade || "A"}</span>
                            </div>
                            <p className="text-xs text-slate-650 dark:text-zinc-350 italic mt-2 border-t border-slate-100 dark:border-zinc-900 pt-2 leading-relaxed">
                              "{auditData.architecturalReview || "The codebase conforms to solid structured architecture conventions with low cyclomatic coupling."}"
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl text-[10px] text-slate-400">
                          Click the button above to run static analysis directly on the synchronized repositories.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: ATS Compatibility check */}
                  {suiteTab === "ats" && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">Paste Job Description (JD)</label>
                        <textarea
                          rows="4"
                          className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-normal"
                          placeholder="Paste details of the role and key required technical stacks..."
                          value={jdInput}
                          onChange={(e) => setJdInput(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={runPublicAtsMatch}
                        disabled={atsLoading || !jdInput.trim()}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        {atsLoading ? "Matching ATS Compatibility..." : "Calculate Job Fit Alignment"}
                      </button>

                      {atsData ? (
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-850">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-indigo-650 dark:text-indigo-400">{atsData.matchPercentage}%</span>
                            <div>
                              <h4 className="text-xs font-bold">Semantic Compatibility Score</h4>
                              <p className="text-[10px] text-slate-400">Calculated using SentenceTransformers alignment.</p>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-805 rounded-xl space-y-2">
                            <span className="text-[10px] text-indigo-550 font-extrabold uppercase tracking-wider block">Recruiter Analysis Summary</span>
                            <p className="text-xs text-slate-705 dark:text-zinc-350 leading-relaxed font-semibold">
                              "{atsData.reasoning}"
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                              <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-wider block">Candidate Strengths</span>
                              <ul className="list-disc list-inside text-xs text-slate-650 dark:text-zinc-400 mt-1 space-y-1">
                                {atsData.strengths?.map((str, i) => <li key={i}>{str}</li>)}
                              </ul>
                            </div>

                            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                              <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider block">Identified Tech Gaps</span>
                              <ul className="list-disc list-inside text-xs text-slate-650 dark:text-zinc-400 mt-1 space-y-1">
                                {atsData.missingTechOrGaps?.map((gap, i) => <li key={i}>{gap}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-slate-50/50 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800/60 rounded-2xl text-[10px] text-slate-400">
                          Paste a Job Description and click match above to trigger technical alignment analysis.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Repositories & Core Tech Skills (col-span-7) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Core Tech Stack Section */}
            {uniqueLanguages.length > 0 && (
              <section className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-850 p-6 sm:p-8 rounded-[32px] shadow-xl text-left space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  Primary Core Technologies
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueLanguages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-black shadow-sm tracking-wide"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Featured Repositories Panel */}
            <section className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-850 p-6 sm:p-8 rounded-[32px] shadow-xl space-y-6">
              <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-405 uppercase tracking-widest flex items-center gap-2 text-left">
                <BookOpen className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Featured Repositories ({data.projects?.length || 0})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {data.projects && data.projects.length > 0 ? (
                  data.projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white/90 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/80 dark:border-zinc-850 rounded-2xl p-5.5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-md hover:border-indigo-550/20 dark:hover:border-zinc-800/85 text-left"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate max-w-[70%] text-left">
                            {proj.title}
                          </h3>
                          <span className="text-[8px] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-zinc-400 font-bold shrink-0">
                            {proj.language}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs leading-relaxed text-left font-normal line-clamp-3">
                          {proj.description || "No project description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-4 mt-4">
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-yellow-500 transition">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-bold">{proj.stars || 0}</span>
                        </div>
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition"
                        >
                          Repository
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200/60 dark:border-zinc-800 rounded-2xl">
                    <p className="text-xs text-slate-500 dark:text-zinc-500 font-bold">No repositories synced yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>
      </main>

      {/* Floating Chatbot */}
      <AIChatbot username={data.username} ownerName={data.name} />
    </div>
  );
}
