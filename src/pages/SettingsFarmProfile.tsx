"use client";

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { ArrowLeft, Camera, HelpCircle, Sparkles } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const SettingsFarmProfile: React.FC = () => {
  const navigate = useNavigate();
  const { farmProfile, updateFarmProfile } = useFarm();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormFormState] = useState({
    name: farmProfile.name,
    ownerName: farmProfile.ownerName,
    location: farmProfile.location,
    description: farmProfile.description || "Agricultural production unit.",
    image: farmProfile.image || ""
  });

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormFormState(prev => ({ ...prev, image: reader.result as string }));
          showSuccess("Snapped/Uploaded new farm landscape image!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormFormState(prev => ({ ...prev, image: "" }));
    showSuccess("Farm custom landscape image cleared! Returning to FarmNest default agricultural fallback.");
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Save Farm Landscape Updates?",
      message: "Are you sure you want to write these landscape updates to the main profile settings?",
      onConfirm: () => {
        updateFarmProfile({
          name: formState.name,
          ownerName: formState.ownerName,
          location: formState.location,
          description: formState.description,
          image: formState.image
        });
        setPendingConfirm(null);
        navigate("/settings");
      }
    });
  };

  // If no image, show custom preview fallback local placeholder
  const farmHeaderPreview = formState.image || "/placeholder.svg";

  return (
    <div className="space-y-6">
      
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>
        <h2 className="text-xl font-black text-slate-900 mt-2">Manage Farm Profile</h2>
        <p className="text-xs text-slate-500">Customize the physical landscape elements representing your farm identity card.</p>
      </div>

      <form onSubmit={handleSubmitProfile} className="space-y-6">
        
        {/* Landscape Image Cropper/Upload container */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            Farm Landscape Card Face
          </h3>

          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border">
            <img 
              src={farmHeaderPreview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Camera size={14} /> Change Photo
              </button>
              
              {formState.image && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                >
                  Remove Photo
                </button>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Upload custom JPG/PNG snapshots, or snap live landscape environments using your mobile camera.
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Farm Name</label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormFormState({ ...formState, name: e.target.value })}
              className="w-full<dyad-write path="src/pages/SettingsFarmProfile.tsx" description="Completing the SettingsFarmProfile page with local placeholder fallbacks and fully functional form inputs.">
"use client";

import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";
import { ArrowLeft, Camera, HelpCircle } from "lucide-react";
import { showSuccess } from "@/utils/toast";

export const SettingsFarmProfile: React.FC = () => {
  const navigate = useNavigate();
  const { farmProfile, updateFarmProfile } = useFarm();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormFormState] = useState({
    name: farmProfile.name,
    ownerName: farmProfile.ownerName,
    location: farmProfile.location,
    description: farmProfile.description || "Agricultural production unit.",
    image: farmProfile.image || ""
  });

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormFormState(prev => ({ ...prev, image: reader.result as string }));
          showSuccess("Snapped/Uploaded new farm landscape image!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormFormState(prev => ({ ...prev, image: "" }));
    showSuccess("Farm custom landscape image cleared! Returning to FarmNest default agricultural fallback.");
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Save Farm Landscape Updates?",
      message: "Are you sure you want to write these landscape updates to the main profile settings?",
      onConfirm: () => {
        updateFarmProfile({
          name: formState.name,
          ownerName: formState.ownerName,
          location: formState.location,
          description: formState.description,
          image: formState.image
        });
        setPendingConfirm(null);
        navigate("/settings");
      }
    });
  };

  // If no image, show custom preview fallback local placeholder
  const farmHeaderPreview = formState.image || "/placeholder.svg";

  return (
    <div className="space-y-6">
      
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>
        <h2 className="text-xl font-black text-slate-900 mt-2">Manage Farm Profile</h2>
        <p className="text-xs text-slate-500">Customize the physical landscape elements representing your farm identity card.</p>
      </div>

      <form onSubmit={handleSubmitProfile} className="space-y-6">
        
        {/* Landscape Image Cropper/Upload container */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            Farm Landscape Card Face
          </h3>

          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 border">
            <img 
              src={farmHeaderPreview} 
              alt="Preview" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Camera size={14} /> Change Photo
              </button>
              
              {formState.image && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                >
                  Remove Photo
                </button>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Upload custom JPG/PNG snapshots, or snap live landscape environments using your mobile camera.
          </p>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Farm Name</label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormFormState({ ...formState, name: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Owner / Operator</label>
            <input
              type="text"
              value={formState.ownerName}
              onChange={(e) => setFormFormState({ ...formState, ownerName: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Geographic Location</label>
            <input
              type="text"
              value={formState.location}
              onChange={(e) => setFormFormState({ ...formState, location: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Paddock Bio Description</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormFormState({ ...formState, description: e.target.value })}
              rows={3}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Save Farm Profile
          </button>
        </div>

      </form>

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