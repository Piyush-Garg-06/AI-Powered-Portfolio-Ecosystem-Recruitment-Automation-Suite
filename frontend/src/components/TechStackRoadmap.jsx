import React, { useState, useEffect } from 'react';
import { 
  Map, Compass, Sparkles, BookOpen, CheckSquare, Square,
  Clock, ArrowRight, Play, RefreshCw, Layers, Award,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const TechStackRoadmap = ({ data, loading, onGenerate, portfolioData }) => {
  const [targetGoal, setTargetGoal] = useState("");
  const [checkedTopics, setCheckedTopics] = useState({});
  const [progress, setProgress] = useState(0);

  const presets = [
    "DevOps & AWS Cloud",
    "System Design & Scalability",
    "Cloud Native Microservices",
    "Machine Learning & GenAI",
    "Web3 & Smart Contracts"
  ];

  // Calculate progress when checkedTopics changes
  useEffect(() => {
    if (!data?.weeklyPlan) return;
    let total = 0;
    let checked = 0;
    data.weeklyPlan.forEach(week => {
      if (week.topics) {
        week.topics.forEach(topic => {
          total += 1;
          if (checkedTopics[topic]) {
            checked += 1;
          }
        });
      }
    });
    setProgress(total > 0 ? Math.round((checked / total) * 100) : 0);
  }, [checkedTopics, data]);

  // Reset checkboxes when new roadmap is generated
  useEffect(() => {
    setCheckedTopics({});
    setProgress(0);
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetGoal.trim()) return alert("Bhai, target goal dalo pehle! 🎯");
    onGenerate(targetGoal);
  };

  const handleToggleTopic = (topicName) => {
    setCheckedTopics(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  };

  const hasSyncedProjects = portfolioData?.projects && portfolioData.projects.length > 0;

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-spin-slow" />
            AI Tech-Stack Roadmap Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Bridge your current tech-stack skills and design a custom 45-day up-skilling week-by-week plan.
          </p>
        </div>
      </div>

      {!hasSyncedProjects ? (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400">No Synced GitHub Projects Found</h4>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed font-normal">
              Bhai, pehle <strong>Profile Setup & Sync</strong> tab par jaakar apne GitHub repos sync karo taaki AI ko tumhare current projects aur stack (jaise MERN/JavaScript) ka pata chal sake. Tabhi ek strictly personalized roadmap generate ho payega!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-5 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-widest block">
                  Your Upskilling Goal
                </label>
                <textarea
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  placeholder="e.g. Learn DevOps, Docker, Kubernetes and set up AWS deployment pipelines..."
                  className="w-full min-h-[100px] p-3 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-200"
                  disabled={loading}
                />
              </div>

              {/* Preset suggestion pill buttons */}
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-650 uppercase tracking-wider block text-left">
                  Popular Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTargetGoal(preset)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      disabled={loading}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !targetGoal.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analyzing Current Stack & Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Generate 45-Day Roadmap
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results/Roadmap Panel */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-2xl h-80 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 dark:text-zinc-500 italic">Synthesizing weekly tasks and mapping transition checkpoints...</p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Upper Deduction / Progress overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 p-4 rounded-xl space-y-1.5 text-left">
                    <h4 className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AI Current Stack Deduction
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                      {data.currentStackDeduction}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/85 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                        Program Duration
                      </h4>
                      <span className="text-lg font-black text-slate-800 dark:text-white block">
                        45 Days Training
                      </span>
                    </div>

                    <div className="space-y-1 text-right">
                      <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                        Milestones
                      </h4>
                      <span className="text-xs font-bold bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-2.5 py-1 rounded-lg inline-block">
                        6 Weekly Plan Checkpoints
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline weeks plan */}
                <div className="space-y-5 relative pl-4 border-l-2 border-slate-100 dark:border-zinc-800/60 ml-2">
                  {data.weeklyPlan?.map((weekPlan, wIdx) => (
                    <div key={wIdx} className="relative space-y-3">
                      {/* Chronological node marker */}
                      <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center"></div>
                      
                      <div className="bg-white dark:bg-zinc-900/30 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-5 space-y-3 shadow-sm hover:border-indigo-500/10 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                              {weekPlan.week}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
                              {weekPlan.focus}
                            </h4>
                          </div>
                        </div>

                        {/* Topics badges */}
                        <div className="space-y-2 text-left">
                          <span className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                            Key Learning Topics
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {weekPlan.topics?.map((topic, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action items task */}
                        <div className="p-3 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-1 text-left">
                          <span className="text-[9px] font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Milestone Implementation Action
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                            {weekPlan.actionItem}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-12 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-3">
                <Map className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-bold">Your up-skilling path will render here.</p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-550 font-normal max-w-sm mx-auto leading-relaxed">
                  Enter your target career goal in the left panel and click generate. AI will build a custom week-by-week program tailored to your synced repository projects.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStackRoadmap;
