import React from 'react';
import { Sparkles, BookOpen, Star, ExternalLink } from 'lucide-react';

const CandidateOverview = ({ data }) => {
  if (!data) return null;
  return (
    <div className="space-y-8">
      {/* Profile Header Widget */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-2xl blur opacity-25"></div>
          <img 
            src={data.avatar} 
            alt="avatar" 
            className="relative w-20 h-20 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md object-cover bg-white dark:bg-zinc-900"
          />
        </div>
        <div className="space-y-2 text-center sm:text-left flex-1">
          <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
            {data.name}
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </h3>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-350 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Developer Space</span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 px-2 rounded-full font-bold tracking-wider font-mono">@{data.username}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xl italic mt-3 leading-relaxed font-normal">
            "{data.bio || "No profile biography configured."}"
          </p>
        </div>
      </div>

      {/* Indexed Repositories */}
      <div className="space-y-5 pt-2">
        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
          Indexed Repositories ({data.projects?.length || 0})
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {data.projects?.map((p, idx) => (
            <div key={idx} className="p-5 bg-slate-50/50 dark:bg-zinc-950/60 border border-slate-205 dark:border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 dark:hover:border-zinc-800/80 transition-all duration-300 shadow-sm">
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold text-xs text-slate-800 dark:text-zinc-250 truncate">{p.title}</p>
                  <span className="text-[8px] bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-600 dark:text-zinc-500 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                    {p.language}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-[10px] line-clamp-2 leading-relaxed font-normal">
                  {p.description || "No description loaded."}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-3 mt-3">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-500">
                  <Star className="w-3.5 h-3.5 text-yellow-500/80 fill-current" />
                  <span className="text-[9px] font-bold">{p.stars || 0} stars</span>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-semibold">
                  Source <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateOverview;
