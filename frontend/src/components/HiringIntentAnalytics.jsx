import React from 'react';
import { 
  TrendingUp, Building, Mail, RefreshCw, Calendar, 
  Info, Sparkles, Clock, ArrowRight, Eye, MessageSquare, 
  Briefcase, ShieldAlert, UserCheck 
} from 'lucide-react';

const HiringIntentAnalytics = ({ data, loading, onRefresh }) => {
  const overallScore = data?.overallScore || 0;
  const summary = data?.summary || "No analytics parsed yet.";
  const companies = data?.companies || [];
  const recentFeed = data?.recentFeed || [];

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'VIEW_PROFILE':
        return <Eye className="w-4 h-4 text-sky-500" />;
      case 'CHAT_QUERY':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'ATS_MATCH':
        return <Briefcase className="w-4 h-4 text-indigo-500" />;
      case 'MOCK_INTERVIEW':
        return <UserCheck className="w-4 h-4 text-violet-500" />;
      case 'CODE_AUDIT':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'VIEW_PROFILE': return 'Profile View';
      case 'CHAT_QUERY': return 'Chat Inquiry';
      case 'ATS_MATCH': return 'ATS JD Match Check';
      case 'MOCK_INTERVIEW': return 'Interview Kit Generated';
      case 'CODE_AUDIT': return 'Code Quality Audit';
      default: return actionType;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-505 stroke-emerald-500";
    if (score >= 55) return "text-amber-505 stroke-amber-500";
    return "text-indigo-505 stroke-indigo-500";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20";
    if (score >= 55) return "bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/20";
    return "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20";
  };

  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-205 dark:border-zinc-850 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-150 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            Recruiter Hiring Intent Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal mt-1 leading-relaxed">
            AI telemetry dashboard tracks active hiring team interaction triggers, profile audits, and candidate engagement rates.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Analyzing..." : "Refresh Insights"}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-855 rounded-3xl">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-zinc-500 italic">Aggregating recruiter actions and compiling intent metrics...</p>
        </div>
      ) : companies.length > 0 ? (
        <div className="space-y-8">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Attraction Gauge */}
            <div className="bg-white/85 dark:bg-zinc-900/50 border border-slate-205 dark:border-zinc-850 p-6 rounded-3xl flex items-center gap-5 shadow-sm">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.2" className="dark:stroke-zinc-850" />
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke={overallScore >= 80 ? "#10b981" : overallScore >= 55 ? "#f59e0b" : "#6366f1"} 
                    strokeWidth="3.2" 
                    strokeDasharray={`${overallScore}, 100`} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                    {overallScore}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-bold leading-none">%</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest block">
                  Attraction Index
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 block">
                  {overallScore >= 80 ? "Hot Profile 🔥" : overallScore >= 55 ? "Rising Traction 📈" : "Standard Activity 💤"}
                </span>
                <p className="text-[10px] text-slate-450 dark:text-zinc-500 leading-normal font-normal">
                  Recruiter actions weight index.
                </p>
              </div>
            </div>

            {/* AI Core Summary */}
            <div className="md:col-span-2 p-6 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/15 rounded-3xl flex flex-col justify-center space-y-2">
              <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Hiring Intent Summary
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                "{summary}"
              </p>
            </div>
          </div>

          {/* Companies Breakdown */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-left pl-1">
              Interested Companies Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((comp, idx) => (
                <div 
                  key={idx}
                  className="bg-white/80 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-850 rounded-3xl p-6 space-y-4 shadow-sm hover:border-indigo-500/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                        <Building className="w-4.5 h-4.5 text-slate-600 dark:text-zinc-400" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{comp.companyName}</h4>
                        <span className="text-[9px] text-slate-400 font-bold block">{comp.actionsCount} Interactions Registered</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${getScoreBgColor(comp.score)}`}>
                      {comp.score}% Intent
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400 font-normal text-left">
                    <strong className="text-slate-700 dark:text-zinc-300 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Primary Hiring Driver</strong>
                    {comp.reasoning}
                  </div>

                  <div className="p-4 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">
                      <Mail className="w-3.5 h-3.5" /> Actionable Next Step
                    </div>
                    <p className="text-[10px] text-slate-650 dark:text-zinc-300 leading-relaxed font-normal">
                      {comp.nextStep}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest text-left pl-1">
              Live Auditing Timeline
            </h3>

            <div className="bg-white/80 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-850 rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-zinc-850">
                {recentFeed.map((feedItem, index) => (
                  <div key={index} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                      {getActionIcon(feedItem.actionType)}
                    </div>
                    <div className="flex-1 space-y-1 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                          {feedItem.companyName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {formatRelativeTime(feedItem.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-455">{getActionLabel(feedItem.actionType)}</span> • {feedItem.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-855 rounded-3xl space-y-4">
          <Info className="w-8 h-8 text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-550 dark:text-zinc-400 font-bold">No recruiter activities registered yet.</p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-550 font-normal max-w-sm mx-auto leading-relaxed">
            Telemetry triggers from verified hiring teams (such as checking ATS matches, generating custom interview viva sets, or reviewing Radon maintainability indices) populate here.
          </p>
        </div>
      )}
    </div>
  );
};

export default HiringIntentAnalytics;
