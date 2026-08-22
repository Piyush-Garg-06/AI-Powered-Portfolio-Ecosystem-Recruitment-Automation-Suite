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
  const getScoreColorClass = (score) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreStrokeColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const score = atsResult?.matchPercentage || 0;

  return (
    <div className="space-y-8 text-left">
      {/* Header Info Panel */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-205 dark:border-zinc-850 p-6 rounded-3xl shadow-sm">
        <h2 className="text-sm font-extrabold text-slate-805 dark:text-zinc-150 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          ATS Job Fit Analyzer
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-normal mt-1 leading-relaxed">
          Evaluate resume suitability and tech stack alignment directly against a target job description using semantic NLP analysis.
        </p>
      </div>

      {!atsResult ? (
        /* Input Form */
        <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200 dark:border-zinc-855 p-8 rounded-3xl shadow-md space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 dark:text-zinc-455 font-extrabold uppercase tracking-widest">
              Paste Target Job Description (JD)
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the key requirements, expectations, and tech stacks required..."
              className="w-full bg-slate-50/50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-805 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-550 focus:ring-1 focus:ring-indigo-550/20 text-slate-855 dark:text-zinc-200 transition leading-relaxed resize-none font-normal"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading || !jobDescription.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-indigo-655/15 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Compatibility...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Calculate Job Fit Alignment
              </>
            )}
          </button>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score card with Circular SVG Progress */}
            <div className="p-6 bg-white/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-850 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-550">
                Compatibility Rating
              </span>
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.2" className="dark:stroke-zinc-850" />
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke={getScoreStrokeColor(score)} 
                    strokeWidth="3.2" 
                    strokeDasharray={`${score}, 100`} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className={`absolute text-lg font-black ${getScoreColorClass(score)}`}>
                  {score}%
                </span>
              </div>
            </div>

            {/* Reasoning Card */}
            <div className="md:col-span-2 bg-white/80 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-855 p-6 rounded-3xl flex flex-col justify-center text-left shadow-sm">
              <h4 className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-widest mb-2">
                ATS Alignment Summary
              </h4>
              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                "{atsResult.reasoning}"
              </p>
            </div>
          </div>

          {/* Strengths and Gaps Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 bg-emerald-500/5 border border-emerald-555/15 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-455 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                Matching Strengths
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsResult.strengths?.map((str, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl font-bold tracking-wide"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Gaps */}
            <div className="p-6 bg-rose-500/5 border border-rose-555/15 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-455 uppercase tracking-widest flex items-center gap-1.5">
                <XCircle className="w-4.5 h-4.5 text-rose-500" />
                Missing Technologies / Gaps
              </h4>
              <div className="flex flex-wrap gap-2">
                {atsResult.missingTechOrGaps?.map((gap, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] bg-white dark:bg-zinc-950 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 py-1 rounded-xl font-bold tracking-wide"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
          >
            Check Another Job Description
          </button>
        </div>
      )}
    </div>
  );
};

export default AtsJobFitAnalyzer;
