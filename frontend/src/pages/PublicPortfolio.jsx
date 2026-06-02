import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { 
  Terminal, BookOpen, Star, ExternalLink, Award, Sparkles, 
  Sun, Moon, ShieldAlert 
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

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-200 font-sans selection:bg-indigo-600 selection:text-white pb-20 transition-colors duration-300">
      
      {/* Visual Ambient Backdrops */}
      <div className="absolute top-0 left-0 w-full h-[550px] bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent dark:from-indigo-900/10 pointer-events-none"></div>
      <div className="absolute top-[10%] right-[10%] w-[380px] h-[380px] bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[20%] left-[5%] w-[380px] h-[380px] bg-slate-500/5 dark:bg-zinc-700/5 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Navigation Header */}
      <header className="relative max-w-4xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 group cursor-default">
          <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-black tracking-widest text-slate-700 dark:text-zinc-300 uppercase">DEVSCALE SPACE</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition cursor-pointer shadow-sm"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <Link
            to="/auth"
            className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 px-3.5 py-2 rounded-xl transition shadow-sm bg-slate-50/50 dark:bg-zinc-900/40"
          >
            Create Yours ⚡
          </Link>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-3xl mx-auto px-6 mt-12 space-y-16 relative z-10">
        
        {/* Profile Card Hero */}
        <section className="flex flex-col items-center md:items-start text-center md:text-left gap-6 pb-12 border-b border-slate-200 dark:border-zinc-900">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-[32px] blur opacity-20 group-hover:opacity-45 transition duration-1000"></div>
            <img
              src={data.avatar}
              alt={data.name}
              className="relative w-24 h-24 md:w-28 md:h-28 rounded-[28px] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 object-cover shadow-xl"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {data.name}
              </h1>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest font-mono uppercase">@{data.username}</p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-xl leading-relaxed text-center md:text-left font-normal">
              {data.bio || "Full-stack developer building robust technical solutions. This profile biography remains updated from GitHub details."}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <a
                href={`https://github.com/${data.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-4.5 py-2.5 rounded-xl font-bold transition shadow-md cursor-pointer"
              >
                <GithubIcon className="w-4 h-4" />
                View GitHub Profile
              </a>
              <div className="flex items-center gap-1.5 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-2.5 rounded-xl font-bold">
                <Award className="w-4 h-4 text-indigo-550 dark:text-indigo-400 animate-pulse" />
                <span>Verified Sync</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects Grid */}
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-slate-500 dark:text-zinc-550 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Featured Repositories ({data.projects?.length || 0})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {data.projects && data.projects.length > 0 ? (
              data.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-900 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-sm hover:shadow-md hover:border-indigo-550/20 dark:hover:border-zinc-800/80"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-805 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate max-w-[70%] text-left">
                        {proj.title}
                      </h3>
                      <span className="text-[8px] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-zinc-400 font-bold shrink-0">
                        {proj.language}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs leading-relaxed text-left font-normal line-clamp-3">
                      {proj.description || "No project description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-4 mt-4">
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-yellow-500 transition">
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
              <div className="col-span-2 text-center py-10 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-900 rounded-2xl">
                <p className="text-xs text-slate-500 dark:text-zinc-500 font-semibold">No repositories synced yet.</p>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Floating Chatbot */}
      <AIChatbot username={data.username} ownerName={data.name} />
    </div>
  );
}
