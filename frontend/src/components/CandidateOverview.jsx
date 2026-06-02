import React from 'react';
import { Sparkles, BookOpen, Star, ExternalLink } from 'lucide-react';

const CandidateOverview = ({ data }) => {
  if (!data) return null;
  return (
    <div className="space-y-6">
      {/* Profile Header Widget */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <img 
          src={data.avatar} 
          alt="avatar" 
          className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-md"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center justify-center sm:justify-start gap-2">
            {data.name}
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Developer Space</p>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xl italic mt-2 leading-relaxed font-normal">
            "{data.bio || "No profile biography configured."}"
          </p>
        </div>
      </div>

      {/* Indexed Repositories */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          Indexed Repositories ({data.projects?.length || 0})
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.projects?.map((p, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col justify-between hover:border-indigo-500/30 dark:hover:border-zinc-700/80 transition shadow-sm">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-xs text-slate-800 dark:text-zinc-200 truncate">{p.title}</p>
                  <span className="text-[8px] bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-600 dark:text-zinc-500 px-1.5 py-0.5 rounded font-mono">
                    {p.language}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400 text-[10px] line-clamp-2 leading-relaxed">
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
