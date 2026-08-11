"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { showError } from "@/utils/toast";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useFarm();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      showError("Please enter your farm name/email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(identifier, password);
      if (success) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      showError(err.message || "Failed to establish operator session.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-center p-6 text-white relative">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-[1px]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800')" }} />
        <div className="z-10 space-y-6 max-w-sm">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="text-xl font-black text-emerald-400 tracking-tight">Authenticating operator credentials...</h2>
            <p className="text-slate-400 text-xs mt-2 italic font-serif">"Connecting to FarmNest database."</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-6 py-12 relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800')" }} />
      
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/60 shadow-2xl z-10 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-4xl block">🌾</span>
          <h2 className="text-2xl font-black tracking-tight text-white">Sign Into FarmNest</h2>
          <p className="text-slate-400 text-xs">Access your livestock logs and active veterinary prescriptions.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address or Farm Name</label>
            <input
              type="text"
              placeholder="e.g. operator@farmnest.com or Adam Farms"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition duration-200 mt-2"
          >
            Start Operator Session
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          New administrator?{" "}
          <Link to="/register" className="text-emerald-400 hover:underline font-bold">
            Create Farm Profile
          </Link>
        </p>
      </div>
    </div>
  );
};
</dyad-file>

<dyad-write path="src/components/DiagnosticsPanel.tsx" description="Creating a development diagnostics panel to inspect current Auth User ID, Email, Farm ID, and Supabase Project Ref in real-time.">
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