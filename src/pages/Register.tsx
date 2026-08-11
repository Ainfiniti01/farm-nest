"use client";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { showError } from "@/utils/toast";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signupAndSetup } = useFarm();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [farmName, setFarmName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !farmName || !operatorName) {
      showError("Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const success = await signupAndSetup(email, password, operatorName, farmName, location);
      if (success) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      showError(err.message || "Failed to create secure agricultural profile.");
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
            <h2 className="text-xl font-black text-emerald-400 tracking-tight">Deploying farm registry database...</h2>
            <p className="text-slate-400 text-xs mt-2 italic font-serif">"Setting up cryptographic biosecurity keys."</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-6 py-12 relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-5" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800')" }} />
      
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md p-8 rounded-3xl border border-slate-700/60 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <span className="text-4xl block">🌾</span>
          <h2 className="text-2xl font-black tracking-tight text-white">Setup FarmNest Profile</h2>
          <p className="text-slate-400 text-xs">Create your digital identifier credentials as primary administrator.</p>
        </div>

        <form onSubmit={handleSignupSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operator Name</label>
              <input
                type="text"
                placeholder="e.g. Adam"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full p-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Farm Name</label>
              <input
                type="text"
                placeholder="e.g. Adam Farms"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full p-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="operator@farmnest.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location Address</label>
            <input
              type="text"
              placeholder="e.g. Kano, Nigeria"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 bg-slate-700/60 border border-slate-600 rounded-xl text-xs text-white outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition duration-200"
          >
            Deploy Farm Profile & Setup
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline font-bold">
            Sign In Session
          </Link>
        </p>
      </div>
    </div>
  );
};