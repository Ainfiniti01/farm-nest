"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFarm, normalizeFarmName } from "@/context/FarmContext";
import { showError, showSuccess } from "@/utils/toast";
import { KeyRound, HelpCircle, Loader2, ArrowLeft } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useFarm();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetInput, setResetInput] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      showError("Please enter your farm name or email, and password.");
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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetInput.trim()) {
      showError("Please enter your email or Farm Name.");
      return;
    }

    setIsSendingReset(true);
    try {
      const success = await requestPasswordReset(resetInput);
      if (success) {
        setShowForgotModal(false);
        setResetInput("");
      }
    } finally {
      setIsSendingReset(false);
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
            <p className="text-slate-400 text-xs mt-2 italic font-serif">"Connecting to shared farm registry."</p>
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
          <p className="text-slate-400 text-xs">Shared access account for all farm operators.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Farm Name or Email Address
            </label>
            <input
              type="text"
              placeholder="e.g. Adam Farm or operator@farmnest.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
            {identifier && !identifier.includes("@") && (
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                Will match: <strong className="underline">{normalizeFarmName(identifier)}</strong>
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <button
                type="button"
                onClick={() => {
                  setResetInput(identifier);
                  setShowForgotModal(true);
                }}
                className="text-[10px] font-bold text-emerald-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
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
          New farm profile?{" "}
          <Link to="/register" className="text-emerald-400 hover:underline font-bold">
            Create Farm Account
          </Link>
        </p>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleResetSubmit}
            className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl p-6 space-y-4 text-white shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Reset Account Password</h3>
                <p className="text-[10px] text-slate-400">Recovery link will be sent to the farm's account email</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Farm Name or Account Email
              </label>
              <input
                type="text"
                placeholder="e.g. Adam Farm or operator@farmnest.com"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => !isSendingReset && setShowForgotModal(false)}
                disabled={isSendingReset}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingReset}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSendingReset ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send Reset Email"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};