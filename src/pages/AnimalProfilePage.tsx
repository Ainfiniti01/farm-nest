"use client";

import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFarm, Animal, HealthRecord, Treatment, WeightRecord, BreedingRecord } from "@/context/FarmContext";
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  Plus, 
  Calendar, 
  Activity, 
  Heart, 
  Camera, 
  FileText, 
  TrendingUp, 
  Clipboard, 
  Users, 
  Clock, 
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Download,
  Check,
  HelpCircle
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export const AnimalProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    animals,
    healthRecords,
    treatments,
    weightRecords,
    breedingRecords,
    reminders,
    activityLogs,
    farmProfile,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    addHealthRecord,
    addTreatment,
    updateTreatmentStatus,
    addWeightRecord,
    addBreedingRecord,
  } = useFarm();

  const animal = animals.find(a => a.id === id || a.animal_code === id);

  // Modal / Confirm state machine
  const [activeTab, setActiveTab] = useState<"overview" | "health" | "breeding" | "photos" | "notes" | "activity">("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddBreeding, setShowAddBreeding] = useState(false);
  const [showAddOffspring, setShowAddOffspring] = useState(false);

  // CONFIRMATION POPUP STATES
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Full Screen Photo State
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  // Edit Animal form state
  const [editForm, setEditForm] = useState({
    name: animal ? animal.name : "",
    breed: animal ? animal.breed : "",
    sex: animal ? animal.sex : "Female" as Animal["sex"],
    dob: animal ? animal.dob : "",
    purchaseDate: animal?.purchaseDate || "",
    source: animal ? animal.source : "Born on farm" as Animal["source"],
    status: animal ? animal.status : "Healthy" as Animal["status"],
    notes: animal ? animal.notes : "",
    primaryPhoto: animal ? animal.primaryPhoto : "",
  });

  if (!animal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={48} className="text-amber-600 mb-2" />
        <h2 className="text-xl font-black text-slate-900">Livestock Record Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-xs">
          The animal profile with ID "{id}" does not exist or was deleted from the secure database records.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Action modals states
  const [newHealth, setNewHealth] = useState({
    type: "Observation" as HealthRecord["type"],
    details: "",
    medication: "",
    recordedBy: farmProfile.ownerName || "Abdul",
    date: new Date().toISOString().split("T")[0],
  });

  const [newTreatment, setNewTreatment] = useState({
    condition: "",
    medication: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [newWeight, setNewWeight] = useState({
    weight: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [newBreeding, setNewBreeding] = useState({
    partnerId: "",
    date: new Date().toISOString().split("T")[0],
    status: "Bred" as BreedingRecord["status"],
    notes: "",
  });

  const [newOffspring, setNewOffspring] = useState({
    name: "",
    species: animal.species,
    breed: animal.breed,
    sex: "Female" as Animal["sex"],
    dob: new Date().toISOString().split("T")[0],
    notes: "",
    primaryPhoto: "",
  });

  // Handle Photo additions
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const updatedPhotos = [...(animal.photos || []), reader.result];
          updateAnimal(animal.id, { photos: updatedPhotos });
          showSuccess("New photograph added to gallery!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const setPhotoAsPrimary = (photoUrl: string) => {
    setPendingConfirm({
      title: "Set Primary Portrait?",
      message: "Are you sure you want to designate this photo as the main ID card face?",
      onConfirm: () => {
        updateAnimal(animal.id, { primaryPhoto: photoUrl });
        setPendingConfirm(null);
        showSuccess("Primary identification portrait updated!");
      }
    });
  };

  const deletePhoto = (photoUrl: string) => {
    if (animal.photos.length <= 1) {
      showError("At least one profile identifier portrait must remain.");
      return;
    }
    setPendingConfirm({
      title: "Delete Photo?",
      message: "Are you sure you want to permanently remove this photograph from the pedigree album?",
      onConfirm: () => {
        const updated = animal.photos.filter(p => p !== photoUrl);
        const updates: Partial<Animal> = { photos: updated };
        if (animal.primaryPhoto === photoUrl) {
          updates.primaryPhoto = updated[0];
        }
        updateAnimal(animal.id, updates);
        setPendingConfirm(null);
        showSuccess("Photograph removed successfully.");
      }
    });
  };

  // PDF passport helper
  const handlePdfSingleReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showSuccess("Allow popups to trigger passport generation.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Passport: ${animal.animal_code}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #1a202c; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #047857; pb: 10px; }
            .badge { padding: 4px 10px; border-radius: 9999px; font-weight: bold; background: #e6fffa; color: #047857; font-size: 14px; }
            .photo { width: 100%; max-height: 350px; object-fit: cover; border-radius: 12px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
            th { background: #f7fafc; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>FarmNest Passport Card</h1>
              <p>Livestock Registry: <strong>${animal.animal_code}</strong></p>
            </div>
            <span class="badge">${animal.status}</span>
          </div>
          <img class="photo" src="${animal.primaryPhoto}" />
          <table>
            <tr><th>Attribute</th><td>Details</td></tr>
            <tr><th>Identifier Name</th><td>${animal.name || "Unnamed"}</td></tr>
            <tr><th>Species Class</th><td>${animal.species}</td></tr>
            <tr><th>Breed</th><td>${animal.breed}</td></tr>
            <tr><th>Sex Type</th><td>${animal.sex}</td></tr>
            <tr><th>Birth date</th><td>${animal.dob}</td></tr>
            <tr><th>Source</th><td>${animal.source}</td></tr>
            <tr><th>Vitals History Count</th><td>${animalHealth.length} items logged</td></tr>
            <tr><th>Current notes</th><td>${animal.notes || "No extra bio."}</td></tr>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    showSuccess("Printed Individual Animal Report!");
  };

  const MOCK_IMAGES = {
    goat1: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=500&auto=format&fit=crop&q=80",
    ram: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=500&auto=format&fit=crop&q=80",
    chicken: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&auto=format&fit=crop&q=80",
  };

  // Derived arrays
  const animalReminders = reminders.filter(r => r.animal_id === animal.id && !r.completed);
  const animalHealth = healthRecords.filter(h => h.animal_id === animal.id);
  const animalTreatments = treatments.filter(t => t.animal_id === animal.id);
  const animalWeights = weightRecords.filter(w => w.animal_id === animal.id);
  const animalBreeding = breedingRecords.filter(b => b.female_id === animal.id || b.male_id === animal.id);
  const animalLogs = activityLogs.filter(l => l.targetId === animal.id);

  const mother = animals.find(a => a.id === animal.parents?.motherId);
  const father = animals.find(a => a.id === animal.parents?.fatherId);
  const offspringList = animals.filter(a => a.parents?.motherId === animal.id || a.parents?.fatherId === animal.id);

  const chartData = animalWeights
    .map(w => ({
      date: new Date(w.date).toLocaleDateString([], { month: "short", day: "numeric" }),
      weight: w.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Submit methods under safe confirmations
  const triggerEditConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Save Profile Changes?",
      message: "Verify information parameters before overwriting database logs.",
      onConfirm: () => {
        updateAnimal(animal.id, {
          name: editForm.name,
          breed: editForm.breed,
          sex: editForm.sex,
          dob: editForm.dob,
          purchaseDate: editForm.purchaseDate || undefined,
          source: editForm.source,
          status: editForm.status,
          notes: editForm.notes,
          primaryPhoto: editForm.primaryPhoto,
        });
        setShowEditModal(false);
        setPendingConfirm(null);
      }
    });
  };

  const triggerHealthConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Submit Clinical Event?",
      message: "Are you sure you want to write this observation to the animal's permanent health timeline?",
      onConfirm: () => {
        addHealthRecord({
          animal_id: animal.id,
          type: newHealth.type,
          date: newHealth.date,
          details: newHealth.details,
          medication: newHealth.medication || undefined,
          recordedBy: newHealth.recordedBy,
        });
        setShowAddHealth(false);
        setPendingConfirm(null);
        setNewHealth({
          type: "Observation",
          details: "",
          medication: "",
          recordedBy: farmProfile.ownerName || "Abdul",
          date: new Date().toISOString().split("T")[0],
        });
      }
    });
  };

  const triggerTreatmentConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Activate Medical Treatment?",
      message: "This records an active prescription, changing status to 'Under Treatment'. Confirm?",
      onConfirm: () => {
        addTreatment({
          animal_id: animal.id,
          condition: newTreatment.condition,
          medication: newTreatment.medication,
          startDate: newTreatment.startDate,
          endDate: newTreatment.endDate,
          status: "Ongoing",
          notes: newTreatment.notes,
          followUpDate: newTreatment.followUpDate || undefined,
        });
        setShowAddTreatment(false);
        setPendingConfirm(null);
        setNewTreatment({
          condition: "",
          medication: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "",
          followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
      }
    });
  };

  const triggerWeightConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight.weight || isNaN(Number(newWeight.weight))) {
      showError("Please enter a valid numeric weight.");
      return;
    }
    setPendingConfirm({
      title: "Commit New Mass?",
      message: `Log ${newWeight.weight} kg on ${newWeight.date} for growth progression metrics?`,
      onConfirm: () => {
        addWeightRecord({
          animal_id: animal.id,
          weight: Number(newWeight.weight),
          date: newWeight.date,
          notes: newWeight.notes || undefined,
        });
        setShowAddWeight(false);
        setPendingConfirm(null);
        setNewWeight({
          weight: "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    });
  };

  const triggerBreedingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Record Breeding Cross?",
      message: "Link stud mating relationship into permanent history maps?",
      onConfirm: () => {
        addBreedingRecord({
          female_id: animal.sex === "Female" ? animal.id : newBreeding.partnerId,
          male_id: animal.sex === "Male" ? animal.id : newBreeding.partnerId,
          date: newBreeding.date,
          status: newBreeding.status,
          notes: newBreeding.notes,
        });
        setShowAddBreeding(false);
        setPendingConfirm(null);
        setNewBreeding({
          partnerId: "",
          date: new Date().toISOString().split("T")[0],
          status: "Bred",
          notes: "",
        });
      }
    });
  };

  const triggerOffspringConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Register New Born Offspring?",
      message: `This automatically binds ${newOffspring.name || "Unnamed"} to Aisha's pedigree maps. Confirm?`,
      onConfirm: () => {
        addAnimal({
          name: newOffspring.name,
          species: newOffspring.species,
          breed: newOffspring.breed,
          sex: newOffspring.sex,
          dob: newOffspring.dob,
          source: "Born on farm",
          status: "Healthy",
          healthStatus: "Healthy",
          primaryPhoto: newOffspring.primaryPhoto || MOCK_IMAGES.goat1,
          photos: [newOffspring.primaryPhoto || MOCK_IMAGES.goat1],
          notes: newOffspring.notes || "Offspring of parent lineage.",
          parents: {
            motherId: animal.sex === "Female" ? animal.id : undefined,
            fatherId: animal.sex === "Male" ? animal.id : undefined,
          }
        });
        setShowAddOffspring(false);
        setPendingConfirm(null);
        setNewOffspring({
          name: "",
          species: animal.species,
          breed: animal.breed,
          sex: "Female",
          dob: new Date().toISOString().split("T")[0],
          notes: "",
          primaryPhoto: "",
        });
      }
    });
  };

  const handleDownloadFullscreen = () => {
    if (!fullscreenPhoto) return;
    const link = document.createElement("a");
    link.href = fullscreenPhoto;
    link.download = `livestock_portrait_${animal.animal_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Image downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-slate-800 pb-20 md:pb-8">
      
      {/* HEADER NAVIGATION */}
      <div className="bg-white border-b border-emerald-100/60 py-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
          >
            <ArrowLeft size={16} />
            Back to Directory
          </Link>

          <span className="text-[11px] font-black uppercase bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
            Digital Identity Certified
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* DUAL DESKTOP GRID OR SINGLE STACK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN 1: HERO IDENTIFICATION PORTRAIT */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Animal ID Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
              <div 
                className="h-64 bg-slate-100 relative cursor-zoom-in group"
                onClick={() => setFullscreenPhoto(animal.primaryPhoto)}
              >
                <img
                  src={animal.primaryPhoto}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Hover hint */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-black gap-2">
                  <Eye size={18} /> View Portrait Fullscreen
                </div>

                {/* Health State Badge Overlay */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${
                    animal.healthStatus === "Healthy" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    animal.healthStatus === "Under Treatment" ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    ● {animal.status}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    {animal.species} • {animal.breed}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {animal.name || "Unnamed Head"}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">{animal.animal_code}</p>
                </div>

                <div className="pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">GENDER</span>
                    <span className="font-bold text-slate-700">{animal.sex}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">ACQUISITION</span>
                    <span className="font-bold text-slate-700">{animal.source}</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400">
                  <span>Born: {animal.dob || "Unknown"}</span>
                  <span className="block mt-0.5">Added: {new Date(animal.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-100 transition text-center block"
                  >
                    Edit Animal
                  </button>

                  <button
                    onClick={() => {
                      setPendingConfirm({
                        title: `Permanently Delete ${animal.animal_code}?`,
                        message: "This action clears all lineage trees and weight growth trends. There is no undo.",
                        onConfirm: () => {
                          deleteAnimal(animal.id);
                          navigate("/");
                        }
                      });
                    }}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-100 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS SIDE MENU */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registry Shortcuts</h4>
              
              <button
                onClick={() => setShowAddHealth(true)}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700"
              >
                <span>🩺 Add Health Record</span>
                <span className="text-emerald-600 font-extrabold">+</span>
              </button>

              <button
                onClick={() => setShowAddTreatment(true)}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700"
              >
                <span>💊 Start Medical Rx</span>
                <span className="text-emerald-600 font-extrabold">+</span>
              </button>

              <button
                onClick={() => setShowAddWeight(true)}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700"
              >
                <span>⚖️ Record New Weight</span>
                <span className="text-emerald-600 font-extrabold">+</span>
              </button>

              {animal.sex === "Female" && (
                <button
                  onClick={() => setShowAddBreeding(true)}
                  className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700"
                >
                  <span>❤️ Log Breeding Act</span>
                  <span className="text-emerald-600 font-extrabold">+</span>
                </button>
              )}

              <button
                onClick={() => setShowAddOffspring(true)}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-slate-700"
              >
                <span>🐑 Link Offspring</span>
                <span className="text-emerald-600 font-extrabold">+</span>
              </button>

              <button
                onClick={handlePdfSingleReport}
                className="w-full flex items-center justify-between text-left p-2 hover:bg-slate-50 rounded-xl transition text-xs font-bold text-emerald-800"
              >
                <span>📄 Generate Passport PDF</span>
                <span>🖨️</span>
              </button>
            </div>

          </div>

          {/* COLUMN 2 & 3: MAIN TABS AND RECORD VIEWS */}
          <div className="md:col-span-2 space-y-6">
            
            {/* GRID DISPLAY FOR TAB SELECTORS (NO HORIZONTAL SCROLL) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-100 p-2 rounded-2xl">
              {[
                { id: "overview", label: "Overview", icon: "📊" },
                { id: "health", label: "Health", icon: "🩺" },
                { id: "breeding", label: "Breeding", icon: "❤️" },
                { id: "photos", label: "Photos", icon: "📷" },
                { id: "notes", label: "Notes", icon: "📝" },
                { id: "activity", label: "Activity", icon: "⚡" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-black tracking-wide transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-emerald-950 shadow-md border border-emerald-100 scale-102"
                      : "text-slate-600 hover:bg-white/50"
                  }`}
                >
                  <span className="text-lg mb-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Current Ongoing Prescription Action Card */}
                {animalTreatments.filter(t => t.status === "Ongoing").map(tx => (
                  <div key={tx.id} className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-start justify-between shadow-sm animate-in zoom-in-95">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide bg-purple-100 px-2 py-0.5 rounded">
                        Active Medical Treatment
                      </span>
                      <h4 className="font-extrabold text-sm text-purple-950 mt-1">{tx.condition}</h4>
                      <p className="text-xs text-purple-800">
                        Prescription: <strong className="font-black">{tx.medication}</strong>
                      </p>
                      <p className="text-[10px] text-purple-600">
                        Duration: {tx.startDate} to {tx.endDate} (Followup: {tx.followUpDate || "N/A"})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setPendingConfirm({
                          title: "Mark Treatment Complete?",
                          message: "This records treatment end, reverting livestock to 'Healthy' status. Confirm?",
                          onConfirm: () => {
                            updateTreatmentStatus(tx.id, "Completed");
                            setPendingConfirm(null);
                          }
                        });
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    >
                      Mark Complete
                    </button>
                  </div>
                ))}

                {/* Parentage Lineage Hierarchy tree */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users size={14} className="text-emerald-600" />
                    Lineage & Line Tree
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mother */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                        {mother ? (
                          <img src={mother.primaryPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">🤱</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 block">Mother (Dam)</span>
                        {mother ? (
                          <Link to={`/animals/${mother.id}`} className="font-black text-xs text-emerald-800 hover:underline block truncate">
                            {mother.name || "Dam"} ({mother.animal_code})
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold block">Unrecorded</span>
                        )}
                      </div>
                    </div>

                    {/* Father */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                        {father ? (
                          <img src={father.primaryPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"> Stud </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 block">Father (Sire)</span>
                        {father ? (
                          <Link to={`/animals/${father.id}`} className="font-black text-xs text-emerald-800 hover:underline block truncate">
                            {father.name || "Sire"} ({father.animal_code})
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 font-semibold block">Unrecorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progeny / Offspring section */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                      Derived Progeny ({offspringList.length})
                    </h3>
                    <button
                      onClick={() => setShowAddOffspring(true)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Register Kid/Progeny
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {offspringList.map(child => (
                      <Link
                        key={child.id}
                        to={`/animals/${child.id}`}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 transition block text-center"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden mx-auto mb-1.5">
                          <img src={child.primaryPhoto} className="w-full h-full object-cover" />
                        </div>
                        <p className="font-bold text-[11px] text-slate-950 truncate">{child.name || "Unnamed Offspring"}</p>
                        <span className="text-[9px] font-mono text-slate-500">{child.animal_code}</span>
                      </Link>
                    ))}
                    {offspringList.length === 0 && (
                      <p className="col-span-full text-slate-400 text-xs italic text-center py-4">No registered offspring linked in pedigree.</p>
                    )}
                  </div>
                </div>

                {/* Growth and weight charting */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                      Weight Mass Growth Curve
                    </h3>
                    <button
                      onClick={() => setShowAddWeight(true)}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Record Weight
                    </button>
                  </div>

                  {chartData.length >= 2 ? (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="date" fontSize={9} stroke="#94a3b8" />
                          <YAxis fontSize={9} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic">
                      Insufficient records for a growth chart yet. Graph displays once at least 2 historical weighings are captured.
                    </div>
                  )}

                  {/* Previous weighing log items */}
                  <div className="space-y-1.5">
                    {animalWeights.slice(-3).map(w => (
                      <div key={w.id} className="text-xs p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-slate-800">{w.weight} kg</span>
                        <span className="text-[10px] text-slate-400">{w.date} {w.notes && `(${w.notes})`}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated AI context placeholder */}
                <div className="bg-emerald-950 text-white rounded-3xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-800/40 rounded-full blur-xl" />
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h4 className="font-black text-xs uppercase text-emerald-300">Farm AI Passport Stream</h4>
                      <p className="text-[11px] text-emerald-100 mt-1">
                        AI will automatically read {animal.name || "Aisha"}'s complete biography, including PPR vaccinations, medication trials, and lineage relationships to synthesize clinical advice on demand.
                      </p>
                      <span className="inline-block mt-3 text-[9px] font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                        Coming soon in v2.0
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. HEALTH LOGS TAB */}
            {activeTab === "health" && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Chronic Clinical Incident Log</h3>
                  <button
                    onClick={() => setShowAddHealth(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Log Health Record
                  </button>
                </div>

                {/* Health timeline elements */}
                <div className="space-y-3">
                  {animalHealth.map(h => (
                    <div key={h.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-md border">
                          {h.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{h.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{h.details}</p>
                      {h.medication && (
                        <p className="text-[11px] text-purple-700 bg-purple-50 p-1.5 rounded-lg mt-2 font-semibold">
                          Medication Applied: {h.medication}
                        </p>
                      )}
                      <div className="pt-2 border-t mt-2 flex justify-between text-[10px] text-slate-400">
                        <span>Recorded by: {h.recordedBy}</span>
                      </div>
                    </div>
                  ))}
                  {animalHealth.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs">
                      No clinical logs on file. Click "+ Log Health Record" to write diagnostic logs.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 3. BREEDING RECORDS TAB */}
            {activeTab === "breeding" && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Breeding runs & Reproductive History</h3>
                  <button
                    onClick={() => setShowAddBreeding(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Record Breeding
                  </button>
                </div>

                <div className="space-y-3">
                  {animalBreeding.map(b => (
                    <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                          {b.status}
                        </span>
                        <span className="text-[10px] text-slate-400">{b.date}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                        Line cross of Mother <strong>Dam ID: {b.female_id}</strong> & stud Balami <strong>Sire ID: {b.male_id}</strong>
                      </p>
                      {b.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2">Notes: {b.notes}</p>
                      )}
                    </div>
                  ))}
                  {animalBreeding.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs">
                      No breeding cycles logged. Ideal for tracking heat calendars.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 4. PHOTOS GALLERY TAB */}
            {activeTab === "photos" && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Livestock Image Portfolio</h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Upload Photo
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {animal.photos.map((ph, idx) => (
                    <div key={idx} className="bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col group relative">
                      <img 
                        src={ph} 
                        className="h-36 w-full object-cover cursor-zoom-in" 
                        onClick={() => setFullscreenPhoto(ph)}
                      />
                      
                      <div className="p-2 flex gap-1.5 justify-between">
                        <button
                          onClick={() => setPhotoAsPrimary(ph)}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                            animal.primaryPhoto === ph ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 hover:bg-slate-200"
                          }`}
                        >
                          {animal.primaryPhoto === ph ? "Active ID" : "Set Primary"}
                        </button>

                        <button
                          onClick={() => deletePhoto(ph)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* 5. BIO NOTES TAB */}
            {activeTab === "notes" && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Bio & Behavioral Notes</h3>
                  <button
                    onClick={() => {
                      const text = prompt("Write dynamic diary note regarding livestock behavior:");
                      if (text) {
                        setPendingConfirm({
                          title: "Append Diary Note?",
                          message: "Do you want to append this behavioral detail to Aisha's permanent log?",
                          onConfirm: () => {
                            const updated = animal.notes ? `${animal.notes}\n\n[Note]: ${text}` : text;
                            updateAnimal(animal.id, { notes: updated });
                            setPendingConfirm(null);
                            showSuccess("Diary note appended successfully.");
                          }
                        });
                      }
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Append Note
                  </button>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {animal.notes || "No bio diary records set. Click '+ Append Note' to log paddock comments."}
                  </p>
                </div>

              </div>
            )}

            {/* 6. SYSTEM ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                
                <h3 className="font-bold text-slate-900 text-sm">Livestock System Trace</h3>
                
                <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-3 before:w-[1px] before:bg-slate-100">
                  {animalLogs.map(l => (
                    <div key={l.id} className="flex gap-3 text-xs relative pl-6">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] absolute left-0 top-0.5 border">
                        ⚙️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{l.type}</span>
                          <span className="text-[9px] text-slate-400">{new Date(l.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{l.description}</p>
                      </div>
                    </div>
                  ))}
                  {animalLogs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs">
                      No system events generated. Normal audit streams recorded at startup.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* GLOBAL FULLSCREEN PHOTO VIEWER MODAL WITH DOWNLOAD */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition"
          >
            ✕
          </button>

          <div className="max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">
            <img src={fullscreenPhoto} className="w-full h-full object-contain" alt="Enlarged" />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleDownloadFullscreen}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Download size={16} /> Download Photo
            </button>
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL CONFIRMATION DIALOG MODAL */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 border border-slate-100 shadow-2xl">
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

      {/* EDIT MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerEditConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Update Animal Record</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Animal Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breed</label>
                <input
                  type="text"
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Sex</label>
                <select
                  value={editForm.sex}
                  onChange={(e) => setEditForm({ ...editForm, sex: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Source Origin</label>
                <select
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Born on farm">Born on farm</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Vital Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              >
                {["Healthy", "Monitoring", "Sick", "Under Treatment", "Pregnant", "Sold", "Deceased", "Retired"].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Paddock Bio notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow transition"
            >
              Save Record updates
            </button>
          </form>
        </div>
      )}

      {/* ACTION 1: HEALTH RECORD MODAL */}
      {showAddHealth && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerHealthConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Log Health Action</h3>
              <button type="button" onClick={() => setShowAddHealth(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Type</label>
                <select
                  value={newHealth.type}
                  onChange={(e) => setNewHealth({ ...newHealth, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Observation">Observation</option>
                  <option value="Diagnosis">Diagnosis</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Recorded By</label>
                <input
                  type="text"
                  value={newHealth.recordedBy}
                  onChange={(e) => setNewHealth({ ...newHealth, recordedBy: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Symptoms / Diagnostic logs</label>
              <textarea
                value={newHealth.details}
                onChange={(e) => setNewHealth({ ...newHealth, details: e.target.value })}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Commit Health Event
            </button>
          </form>
        </div>
      )}

      {/* ACTION 2: MEDICAL TREATMENT PLAN MODAL */}
      {showAddTreatment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerTreatmentConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Initiate Medical Action plan</h3>
              <button type="button" onClick={() => setShowAddTreatment(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Condition</label>
              <input
                type="text"
                placeholder="e.g. Coughing / Low appetite"
                value={newTreatment.condition}
                onChange={(e) => setNewTreatment({ ...newTreatment, condition: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Medication</label>
              <input
                type="text"
                placeholder="e.g. Copper Sulfate Spray / PPR booster"
                value={newTreatment.medication}
                onChange={(e) => setNewTreatment({ ...newTreatment, medication: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Commence Treatment Route
            </button>
          </form>
        </div>
      )}

      {/* ACTION 3: RECORD WEIGHT MODAL */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerWeightConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Record Paddock Weight Mass</h3>
              <button type="button" onClick={() => setShowAddWeight(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Current Weight (kg)</label>
              <input
                type="text"
                placeholder="e.g. 45.2"
                value={newWeight.weight}
                onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Measurement Date</label>
              <input
                type="date"
                value={newWeight.date}
                onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Commit Weight Mass
            </button>
          </form>
        </div>
      )}

      {/* ACTION 4: BREEDING RECORD MODAL */}
      {showAddBreeding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerBreedingConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Log Heat Breeding run</h3>
              <button type="button" onClick={() => setShowAddBreeding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Select Stud Partner</label>
              <select
                value={newBreeding.partnerId}
                onChange={(e) => setNewBreeding({ ...newBreeding, partnerId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              >
                <option value="">-- Choose Partner --</option>
                {animals
                  .filter(a => a.sex !== animal.sex && a.species === animal.species)
                  .map(a => (
                    <option key={a.id} value={a.id}>{a.animal_code} - {a.name || "Unnamed"}</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breeding Date</label>
                <input
                  type="date"
                  value={newBreeding.date}
                  onChange={(e) => setNewBreeding({ ...newBreeding, date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breeding Status</label>
                <select
                  value={newBreeding.status}
                  onChange={(e) => setNewBreeding({ ...newBreeding, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Bred">Bred</option>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Gave Birth">Gave Birth</option>
                  <option value="Resting">Resting</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Commit Breeding Run
            </button>
          </form>
        </div>
      )}

      {/* ACTION 5: LINK OFFSPRING MODAL */}
      {showAddOffspring && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerOffspringConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Link Born Offspring</h3>
              <button type="button" onClick={() => setShowAddOffspring(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Offspring Identifier Name</label>
              <input
                type="text"
                placeholder="e.g. Baby Aisha"
                value={newOffspring.name}
                onChange={(e) => setNewOffspring({ ...newOffspring, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breed</label>
                <input
                  type="text"
                  value={newOffspring.breed}
                  onChange={(e) => setNewOffspring({ ...newOffspring, breed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Gender</label>
                <select
                  value={newOffspring.sex}
                  onChange={(e) => setNewOffspring({ ...newOffspring, sex: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Birth Date</label>
              <input
                type="date"
                value={newOffspring.dob}
                onChange={(e) => setNewOffspring({ ...newOffspring, dob: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Generate Offspring Passport
            </button>
          </form>
        </div>
      )}

    </div>
  );
};