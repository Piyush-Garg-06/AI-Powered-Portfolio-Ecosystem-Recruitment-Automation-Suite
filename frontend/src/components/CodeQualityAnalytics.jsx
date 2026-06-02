import React from 'react';
import { RefreshCw, ShieldAlert, Cpu, AlertTriangle, Sparkles } from 'lucide-react';

const CodeQualityAnalytics = ({ auditReport, loading, onRefresh }) => {
  const scores = auditReport?.scores || {};
  const metrics = [
    { label: "Clean Code", value: scores.cleanCode || 0, color: "text-emerald-500" },
    { label: "Security Guard", value: scores.security || 0, color: "text-rose-500" },
    { label: "System Scalability", value: scores.scalability || 0, color: "text-indigo-500" },
    { label: "Error Handling", value: scores.errorHandling || 75, color: "text-amber-500" }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            AI Code Quality Auditor
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Automated repository audits and security evaluation logs.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "Auditing..." : "Re-Audit Code"}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-zinc-500 italic">Analyzing repository design patterns and metrics...</p>
        </div>
      ) : auditReport ? (
        <div className="space-y-6">
          {/* Graphical Score Meters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl flex flex-col items-center text-center space-y-3 relative overflow-hidden"
              >
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
                  {m.label}
                </span>
                
                {/* Circular Indicator */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-zinc-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${m.color} transition-all duration-1000 ease-out`}
                      strokeDasharray={`${m.value}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                      {m.value}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-bold leading-none">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Architectural Summary */}
          {auditReport.architecturalReview && (
            <div className="p-5 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                Architectural Review
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                {auditReport.architecturalReview}
              </p>
            </div>
          )}

          {/* Actionable Suggestions */}
          {auditReport.securityAlerts && auditReport.securityAlerts.length > 0 && (
            <div className="p-5 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Audit Suggestions & Alerts
              </h4>
              
              <ul className="space-y-2.5">
                {auditReport.securityAlerts.map((alert, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                    <span className="text-rose-500 shrink-0 mt-0.5">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-500 dark:text-zinc-400 font-medium">
          No audit reports logged yet. Click the button above to execute code audit.
        </div>
      )}
    </div>
  );
};

export default CodeQualityAnalytics;
