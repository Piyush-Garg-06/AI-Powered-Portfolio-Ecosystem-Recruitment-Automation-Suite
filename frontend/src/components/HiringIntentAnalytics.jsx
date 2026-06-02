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
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 55) return "text-amber-500 stroke-amber-500";
    return "text-slate-400 stroke-slate-400";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    if (score >= 55) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            Recruiter Hiring Intent Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            AI-generated analytics based on recruiter behavioral logs and project evaluations.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Analyzing Intent..." : "Refresh Insights"}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-zinc-500 italic">Aggregating recruiter actions and compiling intent metrics...</p>
        </div>
      ) : companies.length > 0 ? (
        <div className="space-y-6">
          {/* Top Level Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Overall Attraction Gauge */}
            <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex items-center gap-5 shadow-sm">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-zinc-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`transition-all duration-1000 ease-out ${getScoreColor(overallScore)}`}
                    strokeDasharray={`${overallScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
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
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold uppercase tracking-wider block">
                  Profile Attraction Score
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                  {overallScore >= 80 ? "Hot Profile 🔥" : overallScore >= 55 ? "Rising Traction 📈" : "Quiet Phase 💤"}
                </span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed font-normal">
                  Calculated from overall recruiter activity and depth of interactions.
                </p>
              </div>
            </div>

            {/* AI Core Summary */}
            <div className="md:col-span-2 p-5 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl flex flex-col justify-center space-y-2">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Hiring Intent Summary
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                {summary}
              </p>
            </div>
          </div>

          {/* Companies Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
              Interested Companies Breakdown
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((comp, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-sm hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{comp.companyName}</h4>
                        <span className="text-[9px] text-slate-400 font-bold block">{comp.actionsCount} interactions</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${getScoreBgColor(comp.score)}`}>
                      {comp.score}% Intent
                    </span>
                  </div>

                  <div className="text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400 font-normal">
                    <strong className="text-slate-700 dark:text-zinc-300 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Hiring Reason</strong>
                    {comp.reasoning}
                  </div>

                  <div className="p-3 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <Mail className="w-3.5 h-3.5" /> Action Plan & Recommended Follow-up
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                      {comp.nextStep}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Logs timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">
              Recent Recruiter Activity Log
            </h3>

            <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {recentFeed.map((feedItem, index) => (
                  <div key={index} className="p-4 flex items-start gap-3.5 hover:bg-slate-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                      {getActionIcon(feedItem.actionType)}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                          {feedItem.companyName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(feedItem.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        {getActionLabel(feedItem.actionType)} • {feedItem.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">No recruiter activities registered yet.</p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal max-w-sm mx-auto leading-relaxed">
            Activities (like profile views, AI chat queries, ATS checks, mock interview generation, or code audits) from authenticated recruiters will populate this dashboard.
          </p>
        </div>
      )}
    </div>
  );
};

export default HiringIntentAnalytics;
