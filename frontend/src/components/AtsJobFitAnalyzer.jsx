import React from 'react';
import { Briefcase, CheckCircle2, XCircle, Sparkles, RefreshCw } from 'lucide-react';

const AtsJobFitAnalyzer = ({ 
  jobDescription, 
  setJobDescription, 
  atsResult, 
  loading, 
  onSubmit, 
  onReset 
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 50) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-rose-500 border-rose-500/20 bg-rose-500/5";
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  const score = atsResult?.matchPercentage || 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header Info Panel */}
      <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl">
        <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          ATS Job Fit Analyzer
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-1">
          Evaluate candidate suitability against a target job description.
        </p>
      </div>

      {!atsResult ? (
        /* Input Form */
        <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
              Paste Target Job Description (JD)
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the requirements, role description, and expected technologies..."
              className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-slate-800 dark:focus:border-zinc-500 text-slate-800 dark:text-zinc-200 transition leading-relaxed resize-none font-normal"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading || !jobDescription.trim()}
            className="w-full flex items-center justify-center gap-1.5 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Fit...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Run ATS Analysis
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score card */}
            <div className={`p-6 border rounded-2xl flex flex-col items-center justify-center text-center space-y-2 ${getScoreColor(score)}`}>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                Match Percentage
              </span>
              <span className="text-4xl font-black tracking-tight">{score}%</span>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(score)}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>

            {/* Reasoning Card */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-center text-left">
              <h4 className="text-[10px] text-slate-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider mb-2">
                AI Reasoning Summary
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">
                {atsResult.reasoning}
              </p>
            </div>
          </div>

          {/* Strengths and Gaps Comparison Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-5 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Matching Strengths
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {atsResult.strengths?.map((str, idx) => (
                  <span 
                    key={idx} 
                    className="text-[9px] bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-mono font-semibold"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Gaps */}
            <div className="p-5 bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                Missing Technologies / Gaps
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {atsResult.missingTechOrGaps?.map((gap, idx) => (
                  <span 
                    key={idx} 
                    className="text-[9px] bg-rose-500/10 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-lg font-mono font-semibold"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full py-2.5 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Check Another JD
          </button>
        </div>
      )}
    </div>
  );
};

export default AtsJobFitAnalyzer;
