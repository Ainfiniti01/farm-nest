"use client";

import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { 
  Home, 
  Package, 
  Settings as SettingsIcon, 
  LogOut,
  Sparkles
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { farmProfile, logout } = useFarm();

  const currentPath = location.pathname;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Home size={18} />, emoji: "🏠" },
    { label: "Animals", path: "/animals", icon: <span className="text-sm">🐐</span>, emoji: "🐐" },
    { label: "Farm AI", path: "/farm-ai", icon: <span className="text-sm">🤖</span>, emoji: "🤖" },
    { label: "Inventory", path: "/inventory", icon: <Package size={18} />, emoji: "📦" },
    { label: "Settings", path: "/settings", icon: <SettingsIcon size={18} />, emoji: "⚙️" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR NAVIGATION PANEL (Visible on MD screens and above) */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-950 text-white shrink-0 justify-between p-6 sticky top-0 h-screen border-r border-emerald-900">
        <div className="space-y-8">
          
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow border border-white/20">
              🌾
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-none text-white tracking-wide">FarmNest</h2>
              <p className="text-[10px] text-emerald-300 font-bold uppercase mt-1 tracking-wider">
                {farmProfile.name || "My Farm"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest px-2 mb-2">Main Menu</p>
            
            {navItems.map((item) => {
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>

        </div>

        {/* Operator Profile and Signout */}
        <div className="pt-4 border-t border-emerald-900/60 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black">
              {(farmProfile.ownerName || "O").charAt(0)}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{farmProfile.ownerName || "Operator"}</span>
              <span className="text-[9px] text-emerald-300 block">Operator Account</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-emerald-900/40 hover:bg-emerald-950 text-emerald-300 hover:text-white rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={12} />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER (Visible on mobile/tablet) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              👨🏽‍🌾
            </div>
            <div>
              <h1 className="font-extrabold text-emerald-950 text-sm leading-none">FarmNest</h1>
              <p className="text-[10px] text-emerald-700 font-semibold uppercase">{farmProfile.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
              Live OS
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT PORT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full pb-28 md:pb-8">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Exactly 5 destinations only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
                  isActive ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
                }`}
              >
                {item.icon}
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
};