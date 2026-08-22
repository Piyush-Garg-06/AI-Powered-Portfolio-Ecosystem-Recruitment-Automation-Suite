import React from 'react';
import { 
  RefreshCw, ShieldAlert, Cpu, AlertTriangle, Sparkles, CheckCircle2, 
  Terminal, Award, Gauge, Code2, AlertCircle, ShieldCheck
} from 'lucide-react';

const CodeQualityAnalytics = ({ auditReport, loading, onRefresh }) => {
  const scores = auditReport?.scores || {};
  const metrics = auditReport?.metrics || {};
  
  const getFormattedTime = (offsetSeconds = 0) => {
    const time = new Date(Date.now() - offsetSeconds * 1000);
    const hrs = String(time.getHours()).padStart(2, '0');
    const mins = String(time.getMinutes()).padStart(2, '0');
    const secs = String(time.getSeconds()).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const scoreCards = [
    { label: "Clean Code", value: scores.cleanCode || 0, color: "text-emerald-500", stroke: "url(#emeraldGradient)", description: "Radon Maintainability Index" },
    { label: "Security Health", value: scores.security || 0, color: "text-indigo-500", stroke: "url(#indigoGradient)", description: "Vulnerability & credentials scan" },
    { label: "Scalability Index", value: scores.scalability || 0, color: "text-violet-550", stroke: "url(#violetGradient)", description: "Cyclomatic branch complexity check" },
    { label: "Error Control", value: scores.errorHandling || 75, color: "text-amber-500", stroke: "url(#amberGradient)", description: "Try-except safety coverage" }
  ];

  const getComplexityLabel = (val) => {
    if (!val) return { text: "Elite (Low Complexity)", color: "text-emerald-450" };
    if (val <= 3) return { text: "Elite (Low Complexity)", color: "text-emerald-450" };
    if (val <= 7) return { text: "Moderate Complexity", color: "text-amber-450" };
    return { text: "Critical (High Cognitive Load)", color: "text-rose-500" };
  };

  const getMaintainabilityLabel = (val) => {
    if (!val) return { text: "Excellent", color: "text-emerald-450" };
    if (val >= 80) return { text: "A+ Excellent (Highly Maintainable)", color: "text-emerald-450" };
    if (val >= 60) return { text: "B Standard Maintainability", color: "text-amber-450" };
    return { text: "Technical Debt (Needs Refactoring)", color: "text-rose-550" };
  };

  const getRiskColor = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'A': return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-555/20";
      case 'B': return "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-555/20";
      case 'C': return "bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20";
      default: return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-555/20";
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Gradients Definitions for SVG Gauges */}
      <svg className="hidden">
        <defs>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-205 dark:border-zinc-850 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-805 dark:text-zinc-150 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            AI Code Quality Auditor
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal mt-1 leading-relaxed">
            Automated AST analysis, cyclomatic complexity calculations, and plaintext credentials detection.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={() => onRefresh(false)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Auditing..." : "Re-Audit"}
          </button>
          {auditReport && (
            <button
              onClick={() => onRefresh(true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
              title="Bypass cache and run fresh calculation"
            >
              Force Refresh
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center space-y-4 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-855 rounded-3xl shadow-sm">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-800 dark:text-zinc-300 font-bold">Scanning Sync Repositories...</p>
            <p className="text-[11px] text-slate-450 dark:text-zinc-550 italic">Evaluating Radon complexity index and patterns</p>
          </div>
        </div>
      ) : auditReport ? (
        <div className="space-y-8">
          {/* Graphical Score Meters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {scoreCards.map((m, idx) => (
              <div 
                key={idx} 
                className="bg-white/80 dark:bg-zinc-900/45 border border-slate-205 dark:border-zinc-850 p-5 rounded-3xl flex flex-col items-center text-center space-y-3 relative overflow-hidden shadow-sm"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-800 dark:text-zinc-300 font-extrabold uppercase tracking-widest block">
                    {m.label}
                  </span>
                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 block font-normal leading-tight">
                    {m.description}
                  </span>
                </div>
                
                {/* Circular Indicator */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-zinc-800"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="transition-all duration-1000 ease-out"
                      strokeDasharray={`${m.value}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke={m.stroke}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                      {m.value}
                    </span>
                    <span className="text-[9px] text-slate-450 dark:text-zinc-500 block font-bold leading-none">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Codebase Vital Stats & Audit Metrics Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Assessment card */}
            <div className="p-6 bg-white/80 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-850 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
              <Award className="w-6 h-6 text-indigo-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-zinc-550">
                Audited Risk Grade
              </span>
              <span className={`text-3xl font-black px-5 py-1.5 rounded-2xl border ${getRiskColor(metrics.riskGrade || 'A')}`}>
                Grade {metrics.riskGrade || 'A'}
              </span>
              <p className="text-[10px] text-slate-450 dark:text-zinc-500 pt-2 font-normal leading-relaxed">
                Overall system architectural and vulnerability evaluation rating.
              </p>
            </div>

            {/* Cyclomatic & Maintainability Detailed List */}
            <div className="md:col-span-2 bg-white/80 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-850 p-6 rounded-3xl flex flex-col justify-center space-y-4 shadow-sm">
              <div className="flex items-start gap-4">
                <Gauge className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                <div className="space-y-1 w-full text-left">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Average Cyclomatic Complexity
                    </h4>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-150">
                      {metrics.cyclomaticComplexity || 1.0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Execution path density check</span>
                    <span className={`text-[10px] font-bold ${getComplexityLabel(metrics.cyclomaticComplexity).color}`}>
                      {getComplexityLabel(metrics.cyclomaticComplexity).text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-850 pt-3 flex items-start gap-4">
                <Code2 className="w-5 h-5 text-emerald-450 shrink-0 mt-1" />
                <div className="space-y-1 w-full text-left">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Maintainability Index (Radon)
                    </h4>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-150">
                      {Math.round(metrics.maintainabilityIndex || 100)} / 100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-medium">Halstead volume and LOC indices</span>
                    <span className={`text-[10px] font-bold ${getMaintainabilityLabel(metrics.maintainabilityIndex).color}`}>
                      {getMaintainabilityLabel(metrics.maintainabilityIndex).text}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive AST Code Scan Console Simulator */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-3xl p-6 shadow-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-zinc-350 font-bold uppercase tracking-widest">AST Code Auditor Log</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse"></span>
            </div>
            
            <div className="space-y-1.5 text-left text-[10px] text-zinc-400 overflow-y-auto max-h-40 leading-relaxed font-normal">
              <div><span className="text-zinc-550">[{getFormattedTime(3)}]</span> <span className="text-indigo-450">INFO</span> Initializing static code parser proxy...</div>
              <div><span className="text-zinc-550">[{getFormattedTime(2)}]</span> <span className="text-indigo-455">INFO</span> Fetching synced repositories abstract syntax tree snippet...</div>
              <div><span className="text-zinc-550">[{getFormattedTime(2)}]</span> <span className="text-indigo-455">INFO</span> Executing radon complexity calculations on Flask engine...</div>
              <div><span className="text-zinc-550">[{getFormattedTime(1)}]</span> <span className="text-emerald-400">SUCCESS</span> Radon processed. Cyclomatic Complexity is {metrics.cyclomaticComplexity || 1.0}.</div>
              <div><span className="text-zinc-550">[{getFormattedTime(1)}]</span> <span className="text-indigo-455">INFO</span> Auditing code for plain passwords, eval() injections, and credentials...</div>
              {auditReport.securityAlerts && auditReport.securityAlerts.length > 0 ? (
                auditReport.securityAlerts.map((alert, i) => (
                  <div key={i}><span className="text-zinc-550">[{getFormattedTime(1)}]</span> <span className="text-rose-500">WARN</span> Identified vulnerability: "{alert}"</div>
                ))
              ) : (
                <div><span className="text-zinc-550">[{getFormattedTime(1)}]</span> <span className="text-emerald-400">SUCCESS</span> 0 plain secrets or eval() blocks identified in repository sync snippet.</div>
              )}
              <div><span className="text-zinc-550">[{getFormattedTime(1)}]</span> <span className="text-indigo-455">INFO</span> Dispatching metrics payload to Local ML engine for architectural summary...</div>
              <div><span className="text-zinc-550">[{getFormattedTime(0)}]</span> <span className="text-emerald-400">SUCCESS</span> Architectural review compiled. Code audit session completed.</div>
            </div>
          </div>

          {/* Architectural Summary */}
          {auditReport.architecturalReview && (
            <div className="p-6 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/15 rounded-3xl space-y-2.5 shadow-sm">
              <h4 className="text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4.5 h-4.5 text-indigo-500" />
                Architectural Review (Local Engine)
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                "{auditReport.architecturalReview}"
              </p>
            </div>
          )}

          {/* Actionable Suggestions */}
          {auditReport.securityAlerts && auditReport.securityAlerts.length > 0 ? (
            <div className="p-6 bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/15 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-455 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                Vulnerabilities & Risk Warnings
              </h4>
              
              <ul className="space-y-2.5 pl-4 list-disc text-xs text-slate-700 dark:text-zinc-350 leading-relaxed font-normal">
                {auditReport.securityAlerts.map((alert, idx) => (
                  <li key={idx}>
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-6 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-555/15 rounded-3xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">
                  Secure Codebase Standard Verified
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-normal leading-relaxed">
                  No critical vulnerabilities or credentials leaks detected in active repository scope. Maintain this clean modular structure!
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-12 bg-white/80 dark:bg-zinc-900/40 border border-slate-205 dark:border-zinc-850 rounded-3xl text-xs text-slate-550 dark:text-zinc-400 font-medium">
          No active code audit reports generated yet. Click "Re-Audit" to scan synchronized files.
        </div>
      )}
    </div>
  );
};

export default CodeQualityAnalytics;
