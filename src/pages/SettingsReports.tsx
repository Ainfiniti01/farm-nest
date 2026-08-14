"use client";

import React from "react";
import { Link } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { ReportDownloader } from "@/components/ReportDownloader";
import { ArrowLeft, FileText, Info } from "lucide-react";

export const SettingsReports: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>
        <h2 className="text-xl font-black text-slate-900 mt-2">Reports & Exports Central</h2>
        <p className="text-xs text-slate-500">Generate instant printable logs for veterinarians, farm audits, or livestock rosters.</p>
      </div>

      {/* Master Downloader Component Block */}
      <ReportDownloader />

      {/* Future Report Formats Info Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Info size={14} className="text-emerald-600" />
          Extended Paddock Report Streams
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">PDF Passport Cards</span>
            <p className="text-slate-600 mt-1">Single-profile identity documents containing pedigree lists and clinical vaccine tracers.</p>
            <span className="inline-block mt-2 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ONLINE</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block font-bold">Excel Feeding Schedules (XLSX)</span>
            <p className="text-slate-600 mt-1">Disbursement logs comparing minimum threshold alert lines directly to dry stock feed bags.</p>
            <span className="inline-block mt-2 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">ONLINE</span>
          </div>
        </div>
      </div>

    </div>
  );
};