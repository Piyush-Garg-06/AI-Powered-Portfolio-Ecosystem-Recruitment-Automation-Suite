import { useState, useEffect } from "react";
import axios from "axios";
import {
  Share2, Copy, Check, ExternalLink, Star, LogOut, Terminal,
  BookOpen, Award, Sparkles, Eye, RefreshCw, Sun, Moon, Save,
  UserCheck, Search, ArrowLeft, Globe, Menu, X, MessageSquare,
  Mic, ShieldAlert, Briefcase, User, TrendingUp, Map
} from "lucide-react";
import AIChatbot from "../components/AIChatbot";
import CandidateOverview from "../components/CandidateOverview";
import MockInterviewArena from "../components/MockInterviewArena";
import CodeQualityAnalytics from "../components/CodeQualityAnalytics";
import AtsJobFitAnalyzer from "../components/AtsJobFitAnalyzer";
import HiringIntentAnalytics from "../components/HiringIntentAnalytics";
import TechStackRoadmap from "../components/TechStackRoadmap";
import { API_BASE_URL } from "../config";
import { io } from "socket.io-client";
import { Bell } from "lucide-react";

export default function Dashboard({ user, onLogout, theme, toggleTheme }) {
  const [portfolioData, setPortfolioData] = useState(null); // Logged-in user's profile
  const [searchResultData, setSearchResultData] = useState(null); // Searched user's profile
  const [activeTab, setActiveTab] = useState(user?.role === "recruiter" ? "candidate-overview" : "my-profile");

  // Edit Form Fields
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  // Search Fields
  const [searchQuery, setSearchQuery] = useState("");

  // Status states
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // AI Mock Interview Arena & Kit States
  const [interviewData, setInterviewData] = useState(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // AI Code Auditor States
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // AI ATS Job Fit Analyzer States
  const [jobDescription, setJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  // AI Hiring Intent Analytics States
  const [intentData, setIntentData] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);

  // AI Tech-Stack Roadmap Generator States
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Real-Time Notifications States
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    if (user && user.role === "developer" && user.username) {
      const socketUrl = API_BASE_URL.includes('/api') ? API_BASE_URL.split('/api')[0] : API_BASE_URL;
      const socket = io(socketUrl, { transports: ["websocket", "polling"] });

      socket.on("connect", () => {
        console.log("🔌 Connected to socket server");
        socket.emit("join-developer-room", user.username);
      });

      socket.on("recruiter-activity", (payload) => {
        console.log("🔔 Recruiter activity received:", payload);
        setNotifications((prev) => [payload, ...prev]);
        setUnreadNotificationsCount((prev) => prev + 1);
        setActiveToast(payload);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  useEffect(() => {
    if (user && user.username && user.role !== "recruiter") {
      fetchExistingProfile(user.username);
    }
  }, [user]);

  // Autofill forms on data retrieve
  useEffect(() => {
    if (portfolioData) {
      setEditName(portfolioData.name || "");
      setEditBio(portfolioData.bio || "");
    }
  }, [portfolioData]);

  // Trigger fetches on tab change
  useEffect(() => {
    const targetUser = user?.role === "recruiter" ? searchResultData?.username : user?.username;

    if (activeTab === "hiring-intent" && user?.role === "developer") {
      if (!intentData) {
        fetchHiringIntent();
      }
    }

    if (!targetUser) return;

    if (activeTab === "interview-arena" || activeTab === "interview-kit") {
      if (!interviewData) {
        fetchMockInterview(targetUser);
      }
    }
    if (activeTab === "code-quality" || activeTab === "code-audit") {
      if (!auditData) {
        fetchCodeAudit(targetUser);
      }
    }
  }, [activeTab, searchResultData, user, intentData]);

  const fetchExistingProfile = async (uname) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/portfolio/${uname}`);
      setPortfolioData(res.data);
    } catch (err) {
      console.log("No profile found. Please trigger sync.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromGithub = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/portfolio/${user.username}?forceSync=true`);
      setPortfolioData(res.data);
      alert("GitHub details successfully synchronized! 🔄");
    } catch (err) {
      alert("GitHub data fetch failed! Check connection. ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return alert("Bhai, name empty nahi reh sakti! ⚠️");
    setSaving(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/portfolio/${user.username}`, {
        name: editName,
        bio: editBio
      });
      setPortfolioData(res.data);
      alert("Profile updated successfully! 🎉");
    } catch (err) {
      alert("Profile update failed! ❌");
    } finally {
      setSaving(false);
    }
  };

  const fetchMockInterview = async (targetUser) => {
    setInterviewLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/interview/generate`,
        { targetUsername: targetUser },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setInterviewData(res.data.questions || res.data);
    } catch (err) {
      console.error(err);
      alert("Mock interview questions fetch failed! ❌");
    } finally {
      setInterviewLoading(false);
    }
  };

  const fetchCodeAudit = async (targetUser) => {
    setAuditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/code-audit`,
        { targetUsername: targetUser },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setAuditData(res.data.auditReport || res.data);
    } catch (err) {
      console.error(err);
      alert("Code audit report fetch failed! ❌");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAtsMatch = async (targetUser) => {
    if (!jobDescription.trim()) return alert("Bhai, write Job Description first! 📝");
    setAtsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/ai/ats-match`,
        { targetUsername: targetUser, jobDescription },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setAtsResult(res.data.atsResult);
    } catch (err) {
      console.error(err);
      alert("ATS match analysis failed! ❌");
    } finally {
      setAtsLoading(false);
    }
  };

  const handleSearchDev = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return alert("Bhai, write username to search! 🔍");
    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/portfolio/${searchQuery}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      setSearchResultData(res.data);
      // Reset recruiter analysis states for the new candidate!
      setInterviewData(null);
      setAuditData(null);
      setAtsResult(null);
      setJobDescription("");
      setActiveTab("candidate-overview"); // Reset to candidate overview tab
    } catch (err) {
      alert("User not found or connection failed! ❌");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchHiringIntent = async () => {
    setIntentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/developer/hiring-intent`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      setIntentData(res.data);
    } catch (err) {
      console.error("Error fetching hiring intent analytics:", err.message);
    } finally {
      setIntentLoading(false);
    }
  };

  const fetchRoadmap = async (targetGoal) => {
    setRoadmapLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/api/developer/roadmap`,
        { targetGoal },
        { headers: { Authorization: token ? `Bearer ${token}` : "" } }
      );
      setRoadmapData(res.data);
    } catch (err) {
      console.error("Error generating tech-stack roadmap:", err.message);
      alert("AI roadmap generation failed! ❌");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleCopyLink = (usernameToCopy) => {
    const portfolioUrl = `${window.location.origin}/portfolio/${usernameToCopy}`;
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewData = searchResultData || portfolioData;

  const devTabs = [
    { id: "my-profile", label: "Profile Setup & Sync", icon: User },
    { id: "self-mentor", label: "Self-Improvement Bot", icon: MessageSquare },
    { id: "interview-arena", label: "Mock Interview Arena", icon: Mic },
    { id: "code-quality", label: "Code Quality Analytics", icon: ShieldAlert },
    { id: "hiring-intent", label: "Hiring Intent Analytics", icon: TrendingUp },
    { id: "roadmap", label: "AI Tech-Stack Roadmap", icon: Map }
  ];

  const recruiterTabs = [
    { id: "candidate-overview", label: "Candidate Overview", icon: UserCheck },
    { id: "eval-assistant", label: "Evaluation Assistant", icon: MessageSquare },
    { id: "ats-analyzer", label: "ATS Job Fit Analyzer", icon: Briefcase },
    { id: "code-audit", label: "Code Audit Report", icon: ShieldAlert }
  ];

  const renderMyProfileTab = () => {
    const totalRepos = portfolioData?.projects?.length || 0;
    const totalStars = portfolioData?.projects?.reduce((acc, p) => acc + (p.stars || 0), 0) || 0;
    const primaryTech = portfolioData?.projects?.[0]?.language || "None";
    const syncStatus = portfolioData ? "Verified" : "Not Synced";

    return (
      <div className="space-y-6">

        {/* Onboarding Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">YOUR WORKSPACE</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Welcome back, {portfolioData?.name || user.username} 👋
            </h2>
            <p className="text-xs text-slate-300 dark:text-zinc-400 font-medium">
              Complete your onboarding journey by syncing your GitHub projects to generate an AI portfolio.
            </p>
          </div>
          {portfolioData && (
            <button
              onClick={() => handleCopyLink(user.username)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-md cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Portfolio
            </button>
          )}
        </div>

        {/* Stats Grid Card Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Synced Repos</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalRepos} Projects</p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">Synced from GitHub</p>
            <BookOpen className="w-8 h-8 text-indigo-500/10 absolute right-4 top-4" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Stars Earned</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalStars}</p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">Across all projects</p>
            <Star className="w-8 h-8 text-amber-500/10 absolute right-4 top-4" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Primary Tech</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 truncate pr-6">{primaryTech}</p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">Top language</p>
            <Terminal className="w-8 h-8 text-emerald-500/10 absolute right-4 top-4" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-left">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider">Sync Status</span>
              <p className={`text-xl font-black mt-1.5 ${portfolioData ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {syncStatus}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-medium">Verified connection</p>
            <UserCheck className="w-8 h-8 text-indigo-500/10 absolute right-4 top-4" />
          </div>
        </div>

        {/* Two-Column Settings & Overview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm space-y-5 text-left">
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Customize Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Edit details or trigger GitHub re-sync updates.</p>
            </div>

            <button
              onClick={handleSyncFromGithub}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-950 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Syncing Workspace..." : "Sync from GitHub"}
            </button>

            <div className="border-t border-slate-100 dark:border-zinc-800/50 my-2"></div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="E.g. Piyush Garg"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Biography</label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="E.g. Full-stack developer specializing in Node.js and React..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 transition leading-relaxed resize-none font-normal"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm text-left">
            {portfolioData ? (
              <CandidateOverview data={portfolioData} />
            ) : (
              <div className="text-center p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Please click "Sync from GitHub" above to initialize your developer workspace.
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  const renderSelfMentorTab = () => {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm h-[580px] flex flex-col">
        <div className="p-4 bg-slate-900 dark:bg-zinc-950 text-white flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl animate-pulse">🧠</span>
            <div className="text-left">
              <h3 className="text-xs sm:text-sm font-bold leading-none text-white">Self-Improvement Bot</h3>
              <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Your personal technical career mentor</span>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <AIChatbot username={user.username} ownerName={portfolioData?.name} isInline={true} />
        </div>
      </div>
    );
  };

  const renderInterviewArenaTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
        <MockInterviewArena
          questions={interviewData}
          loading={interviewLoading}
          onRefresh={() => fetchMockInterview(user.username)}
        />
      </div>
    );
  };

  const renderCodeQualityTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
        <CodeQualityAnalytics
          auditReport={auditData}
          loading={auditLoading}
          onRefresh={() => fetchCodeAudit(user.username)}
        />
      </div>
    );
  };

  const renderHiringIntentTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
        <HiringIntentAnalytics
          data={intentData}
          loading={intentLoading}
          onRefresh={fetchHiringIntent}
        />
      </div>
    );
  };

  const renderRoadmapTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm">
        <TechStackRoadmap
          data={roadmapData}
          loading={roadmapLoading}
          onGenerate={fetchRoadmap}
          portfolioData={portfolioData}
        />
      </div>
    );
  };

  const renderCandidateOverviewTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm space-y-6 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Candidate Profile Overview</span>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-950/80 p-1 border border-slate-200 dark:border-zinc-800 rounded-xl max-w-full overflow-hidden">
            <span className="text-[9px] text-slate-600 dark:text-zinc-400 font-medium px-2 truncate max-w-[180px] sm:max-w-[280px]">
              {window.location.origin}/portfolio/{searchResultData?.username}
            </span>
            <button
              onClick={() => handleCopyLink(searchResultData?.username)}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg transition text-slate-500 dark:text-zinc-400 cursor-pointer flex items-center justify-center shrink-0"
              title="Copy public link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-550" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <CandidateOverview data={searchResultData} />
      </div>
    );
  };

  const renderEvalAssistantTab = () => {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm h-[580px] flex flex-col">
        <div className="p-4 bg-slate-900 dark:bg-zinc-950 text-white flex items-center justify-between border-b border-slate-800 dark:border-zinc-800 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl animate-pulse">🤖</span>
            <div className="text-left">
              <h3 className="text-xs sm:text-sm font-bold leading-none text-white">Evaluation Assistant</h3>
              <span className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">Evaluating {searchResultData?.name || searchResultData?.username}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <AIChatbot username={searchResultData?.username} ownerName={searchResultData?.name} isInline={true} />
        </div>
      </div>
    );
  };

  const renderAtsAnalyzerTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <AtsJobFitAnalyzer
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          atsResult={atsResult}
          loading={atsLoading}
          onSubmit={() => handleAtsMatch(searchResultData?.username)}
          onReset={() => setAtsResult(null)}
        />
      </div>
    );
  };

  const renderInterviewKitTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <MockInterviewArena
          questions={interviewData}
          loading={interviewLoading}
          onRefresh={() => fetchMockInterview(searchResultData?.username)}
        />
      </div>
    );
  };

  const renderCodeAuditTab = () => {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <CodeQualityAnalytics
          auditReport={auditData}
          loading={auditLoading}
          onRefresh={() => fetchCodeAudit(searchResultData?.username)}
        />
      </div>
    );
  };

  const renderNotificationBell = () => {
    if (user.role !== "developer") return null;

    return (
      <div className="relative">
        <button
          onClick={() => {
            setShowNotificationsDropdown(!showNotificationsDropdown);
            setUnreadNotificationsCount(0); // Clear badge count
          }}
          className="relative p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-600 dark:text-zinc-450 transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[8px] animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {showNotificationsDropdown && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-950/40 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Recruiter Activity</span>
              {notifications.length > 0 && (
                <button
                  onClick={() => {
                    setNotifications([]);
                    setUnreadNotificationsCount(0);
                  }}
                  className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-150 dark:divide-zinc-800/40">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-zinc-500">
                  <p className="text-xs font-bold">No notifications yet</p>
                  <p className="text-[10px] mt-1">Real-time updates will appear when recruiters view or audit your profile.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const getActionIcon = (actionType) => {
                    switch (actionType) {
                      case 'VIEW_PROFILE':
                        return <Eye className="w-3.5 h-3.5 text-sky-500" />;
                      case 'CHAT_QUERY':
                        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
                      case 'ATS_MATCH':
                        return <Briefcase className="w-3.5 h-3.5 text-indigo-500" />;
                      case 'MOCK_INTERVIEW':
                        return <UserCheck className="w-3.5 h-3.5 text-violet-500" />;
                      case 'CODE_AUDIT':
                        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
                      default:
                        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
                    }
                  };

                  return (
                    <div key={notif.id} className="p-3 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-zinc-850/20 transition text-left">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-950 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-zinc-800 mt-0.5">
                        {getActionIcon(notif.actionType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-snug">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[8px] text-slate-400 dark:text-zinc-550 font-bold font-mono">
                          <span className="uppercase">{notif.company}</span>
                          <span>•</span>
                          <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 flex flex-col md:flex-row transition-colors duration-300 font-sans">

      {/* 1. MOBILE HEADER BAR */}
      <header className="flex md:hidden items-center justify-between bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800/80 px-6 py-4 sticky top-0 z-30 w-full shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">DevScale Hub</span>
        </div>
        <div className="flex items-center gap-2">
          {renderNotificationBell()}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-600 dark:text-zinc-400 transition"
          >
            {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
          </button>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-700 dark:text-zinc-300"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. SIDEBAR OVERLAY FOR MOBILE SCREEN */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* 3. PERSISTENT SIDEBAR PANEL */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800/80 flex flex-col transform transition-all duration-350 ${mobileSidebarOpen
          ? "translate-x-0 w-64 opacity-100"
          : "-translate-x-full md:translate-x-0 md:w-64 md:opacity-100"
          } md:sticky md:h-screen shrink-0`}
      >
        {/* Sidebar Header Branding */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800/50 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">DevScale Hub</h1>
              <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-left">Platform Core</p>
            </div>
          </div>

          {/* User Profile Card widget */}
          <div className="p-3 bg-slate-50/50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/60 rounded-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user.username.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate leading-tight">{user.username}</p>
              <span className="text-[8px] bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 px-1 py-0.5 rounded font-mono uppercase font-semibold">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Recruiter Lookup Spotlight Bar inside sidebar */}
        {user.role === "recruiter" && (
          <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800/50 space-y-2">
            <span className="text-[9px] text-slate-500 dark:text-zinc-500 font-extrabold uppercase tracking-wider block text-left">
              Candidate search
            </span>
            <form onSubmit={handleSearchDev} className="flex gap-1.5 bg-slate-50 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800 rounded-xl">
              <input
                type="text"
                placeholder="GitHub Username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-2.5 py-1 text-xs focus:outline-none placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-200 min-w-0 font-normal"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 p-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {searchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </form>
            {searchResultData && (
              <button
                onClick={() => {
                  setSearchResultData(null);
                  setSearchQuery("");
                  setActiveTab("candidate-overview");
                }}
                className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[9px] font-bold transition cursor-pointer"
              >
                Clear Selected Candidate
              </button>
            )}
          </div>
        )}
        {/* Navigation Sidebar List */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 text-left">
          {user.role === "recruiter" && !searchResultData ? (
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic px-2">
              Please search a candidate username above to start evaluation.
            </p>
          ) : (
            (user.role === "recruiter" ? recruiterTabs : devTabs).map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15 border border-indigo-500/10"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/40 hover:text-slate-900 dark:hover:text-zinc-200 cursor-pointer"
                    }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800/50 flex items-center justify-between gap-2 bg-slate-50/40 dark:bg-zinc-950/30">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-650 dark:text-zinc-400 transition cursor-pointer"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500 animate-pulse" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* 4. MAIN WORKSPACE AREA */}
      <main className="flex-1 min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 p-6 md:p-10 relative overflow-y-auto">
        {/* Background visual light bubbles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-slate-500/5 dark:bg-zinc-700/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full space-y-6 relative z-10">

          {/* Desktop breadcrumb Header */}
          <div className="hidden md:flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-4 px-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-left">
                <h2 className="text-xs font-extrabold tracking-widest text-slate-700 dark:text-zinc-300 uppercase">
                  Workspace / {activeTab.replace("-", " ")}
                </h2>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                  Platform Core Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {searchResultData && user.role === "recruiter" && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 border border-slate-200 dark:border-zinc-800/80 rounded-xl">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">Auditing candidate:</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">@{searchResultData.username}</span>
                </div>
              )}
              {renderNotificationBell()}
            </div>
          </div>

          {/* Active Workspace View Panel */}
          <div className="w-full">
            {user.role === "recruiter" && !searchResultData ? (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-3xl animate-bounce">
                  🔍
                </div>
                <h2 className="text-lg font-black text-slate-800 dark:text-zinc-200">
                  Candidate Evaluation Hub
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed font-normal">
                  Enter a developer's GitHub username in the sidebar input to load profile details, projects, run code quality checks, evaluate job description match, or generate mock interview kits.
                </p>
              </div>
            ) : (
              <div className="w-full text-left">
                {activeTab === "my-profile" && renderMyProfileTab()}
                {activeTab === "self-mentor" && renderSelfMentorTab()}
                {activeTab === "interview-arena" && renderInterviewArenaTab()}
                {activeTab === "code-quality" && renderCodeQualityTab()}
                {activeTab === "hiring-intent" && renderHiringIntentTab()}
                {activeTab === "roadmap" && renderRoadmapTab()}

                {activeTab === "candidate-overview" && renderCandidateOverviewTab()}
                {activeTab === "eval-assistant" && renderEvalAssistantTab()}
                {activeTab === "ats-analyzer" && renderAtsAnalyzerTab()}
                {activeTab === "interview-kit" && renderInterviewKitTab()}
                {activeTab === "code-audit" && renderCodeAuditTab()}
              </div>
            )}
          </div>

        </div>

        {/* Floating AI recruiter chatbot */}
        {activeTab !== "self-mentor" && activeTab !== "eval-assistant" && (user.role !== "recruiter" || previewData) && (
          <AIChatbot username={previewData?.username || user.username} ownerName={previewData?.name} />
        )}
      </main>

      {/* Real-time Recruiter Action Toast Popup */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white/95 dark:bg-zinc-900/95 border border-indigo-500/20 dark:border-indigo-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 flex items-start gap-3.5">
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">
                LIVE INTERACTION
              </span>
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 dark:text-zinc-500 hover:text-slate-650 dark:hover:text-zinc-300 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-snug mt-1.5 text-left">
              {activeToast.message}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-500 dark:text-zinc-400 font-bold font-mono">
              <span className="text-indigo-600 dark:text-indigo-400">@{activeToast.recruiterUsername}</span>
              <span>from</span>
              <span className="uppercase text-slate-650 dark:text-zinc-350">{activeToast.company}</span>
            </div>
          </div>
          
          {/* Toast Progress Indicator Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-zinc-800 rounded-b-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600" 
              style={{ animation: 'shrink 5s linear forwards' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
