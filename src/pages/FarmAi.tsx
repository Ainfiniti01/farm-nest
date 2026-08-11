"use client";

import React from "react";
import { Sparkles, Info, HelpCircle } from "lucide-react";

export const FarmAi: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Welcome AI Banner */}
      <div className="text-center p-8 bg-emerald-950 text-white rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-600/30 rounded-full blur-2xl" />
        
        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 border border-white/20 animate-pulse">
          🤖
        </div>
        
        <h2 className="text-xl font-black tracking-tight">🤖 Farm AI — Intelligent Paddock Assistant</h2>
        <p className="text-emerald-200 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
          FarmNest AI is preparing to deliver context-aware veterinary analysis, growth charting recommendations, and mating heat-cycle calendars automatically parsed from your farm registry.
        </p>

        <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-amber-950 text-[10px] font-black rounded-full uppercase tracking-wider">
          <Sparkles size={10} />
          AI Engine Integration — Coming Soon
        </div>
      </div>

      {/* Future Context Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Info size={14} className="text-emerald-600" />
          Planned AI Operations & Context Trees
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          When activated, the dialogue parser uses the current animal context, parent-kid lineage files, and veterinary observation logs to assist with daily management query runs.
        </p>

        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Example Conversation Draft</p>
          
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <span className="font-black text-slate-900 text-[10px] uppercase block text-emerald-800">You</span>
              <p className="bg-emerald-50 text-emerald-950 p-2.5 rounded-xl inline-block max-w-xs leading-relaxed">
                "Has Aisha (GOAT-0024) been sick before? Is her feed bag level safe?"
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-black text-slate-900 text-[10px] uppercase block text-purple-800">FarmNest AI</span>
              <p className="bg-purple-50 text-purple-950 p-2.5 rounded-xl inline-block max-w-xs leading-relaxed">
                "Aisha was diagnosed with hoof decay on Feb 18. Treatment is complete. Paddock Maize Feed bags currently stand at 12 sacks, which is safe."
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => alert("FarmNest AI is currently being structured under v2 context frameworks!")}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition text-center block border"
        >
          Learn More About Architecture
        </button>
      </div>

    </div>
  );
};