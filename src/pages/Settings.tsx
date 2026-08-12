"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { DiagnosticsPanel } from "@/components/DiagnosticsPanel";
import { 
  User, 
  Phone, 
  FileText, 
  HelpCircle, 
  ChevronRight,
  Shield,
  Bell,
  Trash2
} from "lucide-react";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { logout, resetDatabase, loadAccount } = useFarm();

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const hubItems = [
    {
      title: "Farm Profile",
      desc: "Change farm image, geographic coordinates and owner names.",
      path: "/settings/farm-profile",
      icon: <User className="text-emerald-700" size={20} />,
      bg: "bg-emerald-50"
    },
    {
      title: "Contacts Directory",
      desc: "Record veterinary specialists, paddock team leads and feed merchants.",
      path: "/settings/contacts",
      icon: <Phone className="text-blue-700" size={20} />,
      bg: "bg-blue-50"
    },
    {
      title: "Reports & Exports",
      desc: "Generate master PDF registers or Excel inventory sheet exports.",
      path: "/settings/reports",
      icon: <FileText className="text-purple-700" size={20} />,
      bg: "bg-purple-50"
    }
  ];

  const handleLogout = () => {
    setPendingConfirm({
      title: "Sign Out Operator?",
      message: "Are you sure you want to terminate this operational session?",
      onConfirm: async () => {
        await logout();
        setPendingConfirm(null);
        navigate("/login");
      }
    });
  };

  const handleResetData = () => {
    setPendingConfirm({
      title: "Wipe All Local Data?",
      message: "This will immediately clear all local cached livestock animals, logs, inventories, and diagnostic traces. There is no undo.",
      onConfirm: () => {
        resetDatabase();
        setPendingConfirm(null);
        navigate("/");
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Diagnostics Panel helper */}
      <DiagnosticsPanel />

      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900">Farm Settings</h2>
        <p className="text-xs text-slate-500">Configure your farm landscape attributes, view reports, or log specialists.</p>
      </div>

      {/* Grid of central hubs */}
      <div className="space-y-3">
        {hubItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="bg-white hover:bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                {item.icon}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-800 transition">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition" />
          </Link>
        ))}
      </div>

      {/* Account Settings Placeholder */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
          Core Preferences & Maintenance
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-slate-400" />
              <span>Breeding Heat Alerts</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded">AUTO</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-slate-400" />
              <span>Biosecurity Passkey</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded">ENABLED</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleResetData}
            type="button"
            className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            Wipe Local Cache
          </button>

          <button
            onClick={handleLogout}
            type="button"
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition text-center"
          >
            Sign Out Session
          </button>
        </div>
      </div>

      {/* CONFIRMATION OVERLAY */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <HelpCircle size={22} />
              </div>
              <h3 className="font-black text-sm text-slate-900">{pendingConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{pendingConfirm.message}</p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setPendingConfirm(null)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border"
              >
                Cancel
              </button>
              <button
                onClick={pendingConfirm.onConfirm}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow"
              >
                Confirm Act
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};