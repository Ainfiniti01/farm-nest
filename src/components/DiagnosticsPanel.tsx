"use client";

import React from "react";
import { useFarm } from "@/context/FarmContext";
import { ShieldCheck, Activity, User, Database } from "lucide-react";

export const DiagnosticsPanel: React.FC = () => {
  const { session, farmProfile } = useFarm();

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 border border-slate-800 shadow-lg space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <ShieldCheck size={16} />
          <span>FarmNest Backend Diagnostics</span>
        </div>
        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] uppercase font-bold">
          Live Connected
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 block">Supabase Host:</span>
          <span className="text-slate-200 font-bold">https://prnpvgzlrxwhohnyqlth.supabase.co</span>
        </div>

        <div>
          <span className="text-slate-400 block">Auth Status:</span>
          <span className={session.isAuthenticated ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
            {session.isAuthenticated ? "Authenticated Session" : "Unauthenticated"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block">Auth User Email:</span>
          <span className="text-slate-200 font-bold">{session.email || "Not signed in"}</span>
        </div>

        <div>
          <span className="text-slate-400 block">Active Farm Name:</span>
          <span className="text-slate-200 font-bold">{farmProfile.name}</span>
        </div>
      </div>
    </div>
  );
};