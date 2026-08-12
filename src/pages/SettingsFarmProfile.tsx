"use client";

import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFarm, normalizeFarmName } from "@/context/FarmContext";
import { ArrowLeft, Camera, HelpCircle, Lock, Mail, ShieldAlert, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const SettingsFarmProfile: React.FC = () => {
  const navigate = useNavigate();
  const { farmProfile, session, updateFarmProfile, changeAccountPassword, loadAccount } = useFarm();

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formState, setFormState] = useState({
    name: farmProfile.name,
    ownerName: farmProfile.ownerName,
    location: farmProfile.location,
    description: farmProfile.description || "Agricultural production unit.",
    image: farmProfile.image || "",
    email: farmProfile.email || session.email || ""
  });

  // Password Change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state if farmProfile updates from account loader
  useEffect(() => {
    setFormState({
      name: farmProfile.name,
      ownerName: farmProfile.ownerName,
      location: farmProfile.location,
      description: farmProfile.description || "Agricultural production unit.",
      image: farmProfile.image || "",
      email: farmProfile.email || session.email || ""
    });
  }, [farmProfile, session.email]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Confirmation overlay state
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const normalizedFarmNamePreview = normalizeFarmName(formState.name);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFormState(prev => ({ ...prev, image: reader.result as string }));
          showSuccess("Uploaded new farm image!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormState(prev => ({ ...prev, image: "" }));
    showSuccess("Farm image cleared. Returning to default.");
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const nameChanged = normalizeFarmName(formState.name) !== farmProfile.name;
    const emailChanged = formState.email.trim().toLowerCase() !== (farmProfile.email || session.email).trim().toLowerCase();

    let confirmMsg = "Confirm saving updates to the farm account profile?";
    if (nameChanged && emailChanged) {
      confirmMsg = `You are updating the Farm Name to "${normalizedFarmNamePreview}" and changing the login email to "${formState.email}". Confirm?`;
    } else if (nameChanged) {
      confirmMsg = `The Farm Name will change to "${normalizedFarmNamePreview}". All future logins will use this name. Confirm?`;
    } else if (emailChanged) {
      confirmMsg = `The account email will change to "${formState.email}". Confirm authentication update?`;
    }

    setPendingConfirm({
      title: "Save Profile Changes?",
      message: confirmMsg,
      onConfirm: async () => {
        setIsSavingProfile(true);
        try {
          const ok = await updateFarmProfile({
            name: formState.name,
            ownerName: formState.ownerName,
            location: formState.location,
            description: formState.description,
            image: formState.image,
            email: formState.email
          });
          if (ok) {
            setPendingConfirm(null);
            navigate("/settings");
          }
        } finally {
          setIsSavingProfile(false);
        }
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setPendingConfirm({
      title: "Confirm Password Change?",
      message: "Are you sure you want to change the shared login password for this farm account?",
      onConfirm: async () => {
        setIsChangingPassword(true);
        try {
          const ok = await changeAccountPassword(newPassword);
          if (ok) {
            setNewPassword("");
            setConfirmPassword("");
            setPendingConfirm(null);
          }
        } finally {
          setIsChangingPassword(false);
        }
      }
    });
  };

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
        <h2 className="text-xl font-black text-slate-900 mt-2">Manage Farm Account Profile</h2>
        <p className="text-xs text-slate-500">
          Shared farm account details, login identifier, and email configuration.
        </p>
      </div>

      <form onSubmit={handleSubmitProfile} className="space-y-6">
        
        {/* Landscape Image Cropper/Upload container */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
            Farm Header Photo
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
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Farm Name (Login Identifier)
            </label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
            <p className="text-[10px] text-emerald-700 font-bold mt-1">
              Saved Identifier: <span className="underline">{normalizedFarmNamePreview}</span>
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Account Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full p-3 pl-9 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                required
              />
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={14} />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Changing this email updates your Supabase authentication account email.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Primary Operator / Manager Name
            </label>
            <input
              type="text"
              value={formState.ownerName}
              onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Geographic Location
            </label>
            <input
              type="text"
              value={formState.location}
              onChange={(e) => setFormState({ ...formState, location: e.target.value })}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Farm Bio Description
            </label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              rows={3}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                "Save Farm Profile"
              )}
            </button>
          </div>
        </div>

      </form>

      {/* CHANGE PASSWORD SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Change Shared Account Password</h3>
            <p className="text-[11px] text-slate-400">Update access credentials for all farm team members.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
          >
            {isChangingPassword ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              "Update Account Password"
            )}
          </button>
        </form>
      </div>

      {/* CONFIRMATION OVERLAY */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <HelpCircle size={22} />
              </div>
              <h3 className="font-black text-sm text-slate-900">{pendingConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{pendingConfirm.message}</p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => !isSavingProfile && !isChangingPassword && setPendingConfirm(null)}
                disabled={isSavingProfile || isChangingPassword}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={pendingConfirm.onConfirm}
                disabled={isSavingProfile || isChangingPassword}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSavingProfile || isChangingPassword ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Confirm Update"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};