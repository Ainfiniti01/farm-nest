import React, { useState } from "react";
import { useFarm } from "@/context/FarmContext";
import { SUPABASE_URL } from "@/lib/supabaseClient";

export const DiagnosticsPanel: React.FC = () => {
  const { session, farmProfile, animals } = useFarm();
  const [isOpen, setIsOpen] = useState(false);

  // Extract project ref from URL
  const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-emerald-400 font-mono text-[10px] px-2.5 py-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md transition flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          FarmNest Diagnostics
        </button>
      ) : (
        <div className="bg-slate-900/95 text-slate-200 p-4 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md max-w-xs w-80 space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-emerald-400 text-[11px]">🛠️ Diagnostics Panel</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div>
              <span className="text-slate-500 uppercase block font-bold">Supabase Project Ref</span>
              <span className="text-slate-200 font-bold bg-slate-800 px-1.5 py-0.5 rounded">{projectRef}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase block font-bold">Auth Status</span>
              <span className={`font-black px-1.5 py-0.5 rounded ${session.isAuthenticated ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"}`}>
                {session.isAuthenticated ? "Authenticated" : "Unauthenticated"}
              </span>
            </div>

            {session.userId && (
              <div>
                <span className="text-slate-500 uppercase block font-bold">Authenticated User ID</span>
                <span className="text-slate-300 truncate block bg-slate-800 px-1.5 py-0.5 rounded">{session.userId}</span>
              </div>
            )}

            {session.email && (
              <div>
                <span className="text-slate-500 uppercase block font-bold">User Email</span>
                <span className="text-slate-300 truncate block bg-slate-800 px-1.5 py-0.5 rounded">{session.email}</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 uppercase block font-bold">Current Farm</span>
              <span className="text-amber-300 font-bold">{farmProfile.name} ({animals.length} animals)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};