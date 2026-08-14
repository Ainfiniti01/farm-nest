"use client";

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm, Animal, HealthRecord, Reminder, SPECIES_OPTIONS } from "@/context/FarmContext";
import { compressImage } from "@/utils/imageCompressor";
import { 
  Home, 
  Search, 
  Plus, 
  Calendar, 
  Camera, 
  Upload,
  Settings as SettingsIcon, 
  ChevronRight, 
  Package,
  HelpCircle,
  Check,
  LogOut,
  X
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Index = () => {
  const {
    animals,
    treatments,
    inventory,
    reminders,
    farmProfile,
    addAnimal,
    addHealthRecord,
    addTreatment,
    addReminder,
    toggleReminder,
    logout
  } = useFarm();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"dashboard" | "animals" | "ai" | "inventory" | "settings">("dashboard");

  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [selectedSpeciesOption, setSelectedSpeciesOption] = useState<string>("Goat");
  const [customSpecies, setCustomSpecies] = useState<string>("");

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    breed: "",
    sex: "Female" as Animal["sex"],
    dob: new Date().toISOString().split("T")[0],
    source: "Born on farm" as Animal["source"],
    status: "Healthy" as Animal["status"],
    notes: "",
    primaryPhoto: "",
    photos: [] as string[],
    motherId: "",
    fatherId: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showAddHealth, setShowAddHealth] = useState(false);
  const [newHealth, setNewHealth] = useState({
    type: "Observation" as HealthRecord["type"],
    details: "",
    medication: "",
    recordedBy: farmProfile.ownerName || "Operator",
    date: new Date().toISOString().split("T")[0],
  });

  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    condition: "",
    medication: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState({
    title: "",
    type: "Vaccination" as Reminder["type"],
    dueDate: new Date().toISOString().split("T")[0],
    animalId: "",
    notes: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const fileList = Array.from(files);
        const compressedList = await Promise.all(
          fileList.map(file => compressImage(file, 600, 600, 0.7))
        );
        setNewAnimal(prev => {
          const allPhotos = [...prev.photos, ...compressedList];
          return {
            ...prev,
            primaryPhoto: prev.primaryPhoto || allPhotos[0] || "",
            photos: allPhotos
          };
        });
        showSuccess(`${compressedList.length} photo${compressedList.length > 1 ? "s" : ""} attached!`);
      } catch (err) {
        showError("Failed to process images.");
      }
    }
  };

  const removeNewAnimalPhoto = (index: number) => {
    setNewAnimal(prev => {
      const updatedPhotos = prev.photos.filter((_, idx) => idx !== index);
      return {
        ...prev,
        photos: updatedPhotos,
        primaryPhoto: prev.primaryPhoto === prev.photos[index] ? (updatedPhotos[0] || "") : prev.primaryPhoto
      };
    });
  };

  const finalSpecies = selectedSpeciesOption === "Other" 
    ? (customSpecies.trim() || "Other") 
    : selectedSpeciesOption;

  const triggerCreateAnimal = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSpeciesOption === "Other" && !customSpecies.trim()) {
      showError("Please enter a custom species name.");
      return;
    }

    setPendingConfirm({
      title: "Register New Livestock?",
      message: `Confirm addition of ${finalSpecies} to pasture paddock registry database.`,
      onConfirm: () => {
        const defaultPhoto = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400";
        const finalPhotos = newAnimal.photos.length > 0 ? newAnimal.photos : [defaultPhoto];
        const finalPrimary = newAnimal.primaryPhoto || finalPhotos[0];

        addAnimal({
          name: newAnimal.name,
          species: finalSpecies,
          breed: newAnimal.breed || "Local Breed",
          sex: newAnimal.sex,
          dob: newAnimal.dob,
          source: newAnimal.source,
          status: newAnimal.status,
          healthStatus: "Healthy",
          primaryPhoto: finalPrimary,
          photos: finalPhotos,
          notes: newAnimal.notes,
          parents: {
            motherId: newAnimal.motherId || undefined,
            fatherId: newAnimal.fatherId || undefined
          }
        });
        setShowAddAnimal(false);
        setPendingConfirm(null);
        setSelectedSpeciesOption("Goat");
        setCustomSpecies("");
        setNewAnimal({
          name: "",
          breed: "",
          sex: "Female",
          dob: new Date().toISOString().split("T")[0],
          source: "Born on farm",
          status: "Healthy",
          notes: "",
          primaryPhoto: "",
          photos: [],
          motherId: "",
          fatherId: "",
        });
      }
    });
  };

  const triggerToggleReminderConfirm = (reminderId: string, text: string) => {
    setPendingConfirm({
      title: "Complete Reminder Procedure?",
      message: `Verify execution task status of procedure: "${text}"?`,
      onConfirm: () => {
        toggleReminder(reminderId);
        setPendingConfirm(null);
        showSuccess("Reminder status toggled successfully!");
      }
    });
  };

  const activeAnimals = animals.filter(a => a.status !== "Sold" && a.status !== "Deceased");
  const totalAnimals = activeAnimals.length;
  const attentionCount = activeAnimals.filter(a => a.status === "Sick" || a.status === "Under Treatment" || a.status === "Monitoring").length;

  const filteredAnimals = animals.filter(animal => {
    const codeMatch = animal.animal_code.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = animal.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const breedMatch = animal.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const speciesTextMatch = animal.species.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = codeMatch || nameMatch || breedMatch || speciesTextMatch;

    const speciesMatchFilter = speciesFilter === "All" || animal.species === speciesFilter;
    const statusMatchFilter = statusFilter === "All" || animal.status === statusFilter;

    return queryMatch && speciesMatchFilter && statusMatchFilter;
  });

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR NAVIGATION PANEL */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-950 text-white shrink-0 justify-between p-6 sticky top-0 h-screen border-r border-emerald-900">
        <div className="space-y-8">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow border border-white/20">
              🚜
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-none text-white tracking-wide">{farmProfile.name}</h2>
              <p className="text-[10px] text-emerald-300 font-bold uppercase mt-1 tracking-wider">
                {farmProfile.location}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest px-2 mb-2">Main Menu</p>
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dashboard" ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Home size={16} />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("animals")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "animals" ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs">🐐</span>
              Animals Directory
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "ai" ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs">🤖</span>
              Farm AI
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "inventory" ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Package size={16} />
              Feed & Inventory
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings" ? "bg-emerald-600 text-white shadow-md scale-102" : "text-emerald-100/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <SettingsIcon size={16} />
              Farm Settings
            </button>
          </div>

        </div>

        <div className="pt-4 border-t border-emerald-900/60 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black">
              {farmProfile.ownerName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{farmProfile.ownerName}</span>
              <span className="text-[9px] text-emerald-300 block">Operator Account</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 bg-emerald-900/40 hover:bg-emerald-950 text-emerald-300 hover:text-white rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1.5"
          >
            <LogOut size={12} />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              🚜
            </div>
            <div>
              <h1 className="font-extrabold text-emerald-950 text-sm leading-none">{farmProfile.name}</h1>
              <p className="text-[10px] text-emerald-700 font-semibold uppercase">{farmProfile.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
              Live OS
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full pb-28 md:pb-8">

        {activeTab === "dashboard" && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-3xl relative overflow-hidden shadow-md">
            <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Session Activated</span>
            <h2 className="text-xl md:text-2xl font-black mt-1">Welcome back to {farmProfile.name} 👋</h2>
            <p className="text-emerald-100 text-xs mt-1 max-w-md">
              Active operator session is signed into database. Photograph studs, trace mother lineages, and review veterinary logs securely.
            </p>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/60">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Active Livestock</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-950">{totalAnimals}</span>
                  <span className="text-xs text-emerald-700 font-medium">heads</span>
                </div>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100/60">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Alerts & Attention</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-950">{attentionCount}</span>
                  <span className="text-xs text-amber-700 font-medium">animals</span>
                </div>
                <p className="text-[10px] text-amber-800 mt-2 font-bold">
                  {treatments.filter(t => t.status === "Ongoing").length} active treatments ongoing.
                </p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100/60">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Active Inventory</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-blue-950">{inventory.length}</span>
                  <span className="text-xs text-blue-700 font-medium">items</span>
                </div>
                <p className="text-[10px] text-blue-800 mt-2 font-bold">
                  {inventory.filter(i => i.quantity <= i.minStock).length} low stock alerts.
                </p>
              </div>

              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100/60">
                <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Upcoming Tasks</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-purple-950">
                    {reminders.filter(r => !r.completed).length}
                  </span>
                  <span className="text-xs text-purple-700 font-medium">reminders</span>
                </div>
                <p className="text-[10px] text-purple-800 mt-2 font-bold">
                  Vax & breeding followups.
                </p>
              </div>
            </div>

            {/* Quick Action Hub & Reminders dual columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Plus size={16} className="text-emerald-600" />
                  Quick Actions Farm Hand
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <button 
                    onClick={() => setShowAddAnimal(true)}
                    className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-2xl text-center border border-emerald-100/40 transition"
                  >
                    <span className="block text-2xl mb-1">🐐</span>
                    <span className="text-[11px] font-bold text-emerald-900 block leading-tight">Add Animal</span>
                  </button>
                  <button 
                    onClick={() => setShowAddHealth(true)}
                    className="p-4 bg-blue-50/70 hover:bg-blue-100/70 rounded-2xl text-center border border-blue-100/40 transition"
                  >
                    <span className="block text-2xl mb-1">🩺</span>
                    <span className="text-[11px] font-bold text-blue-900 block leading-tight">Log Health</span>
                  </button>
                  <button 
                    onClick={() => setShowAddTreatment(true)}
                    className="p-4 bg-purple-50/70 hover:bg-purple-100/70 rounded-2xl text-center border border-purple-100/40 transition"
                  >
                    <span className="block text-2xl mb-1">💊</span>
                    <span className="text-[11px] font-bold text-purple-900 block leading-tight">Add Rx</span>
                  </button>
                </div>
              </div>

              {/* Due Reminders Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-600" />
                    Due Today / Soon ({reminders.filter(r => !r.completed).length})
                  </h3>
                  <button 
                    onClick={() => setShowAddReminder(true)}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    + Add Reminder
                  </button>
                </div>

                <div className="space-y-2">
                  {reminders.filter(r => !r.completed).map((rem) => {
                    const targetAnimal = animals.find(a => a.id === rem.animal_id);
                    return (
                      <div 
                        key={rem.id}
                        onClick={() => triggerToggleReminderConfirm(rem.id, rem.title)}
                        className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition border border-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            rem.type === "Treatment" ? "bg-purple-500" :
                            rem.type === "Vaccination" ? "bg-emerald-500" : "bg-blue-500"
                          }`} />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{rem.title}</p>
                            {targetAnimal && (
                              <p className="text-[10px] text-slate-500 font-semibold">
                                Assigned to: {targetAnimal.animal_code} {targetAnimal.name && `(${targetAnimal.name})`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border">
                            {rem.dueDate}
                          </span>
                          <div className="w-5 h-5 border rounded-md flex items-center justify-center text-slate-400 bg-white">
                            <Check size={12} className="opacity-20 hover:opacity-100 transition" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {reminders.filter(r => !r.completed).length === 0 && (
                    <div className="text-center p-6 text-slate-400 text-xs">
                      🎉 Excellent! All scheduled livestock procedures and reminders completed.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: ANIMALS ROSTER */}
        {activeTab === "animals" && (
          <div className="space-y-4">
            
            {/* Header + Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Livestock Directory</h2>
                <p className="text-xs text-slate-500">Search codes, names, or filter by species health status.</p>
              </div>
              <button
                onClick={() => setShowAddAnimal(true)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition"
              >
                <Plus size={14} />
                Register Animal
              </button>
            </div>

            {/* Roster Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search tag (e.g. ADG001, Aisha, Cow)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Category Filter</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSpeciesFilter("All")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    speciesFilter === "All"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🌍 All Species
                </button>

                {SPECIES_OPTIONS.map((species) => (
                  <button
                    key={species}
                    onClick={() => setSpeciesFilter(species)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      speciesFilter === species
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {species}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Filter Row */}
            <div className="flex flex-wrap gap-1">
              {["All", "Healthy", "Monitoring", "Sick", "Under Treatment", "Pregnant", "Sold", "Deceased"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                    statusFilter === st
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Animals Grid List */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {filteredAnimals.map((animal) => {
                const hasCustomName = Boolean(animal.name && animal.name.trim().length > 0);
                const displayName = hasCustomName ? animal.name : animal.animal_code;

                return (
                  <div
                    key={animal.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:border-emerald-300 transition flex flex-col group animate-in fade-in"
                  >
                    {/* Animal Photo */}
                    <div className="relative h-32 bg-slate-100">
                      <img
                        src={animal.primaryPhoto}
                        alt={displayName}
                        onClick={() => setFullscreenPhoto(animal.primaryPhoto)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-zoom-in"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full shadow ${
                          animal.status === "Sold" ? "bg-slate-200 text-slate-700" :
                          animal.status === "Deceased" ? "bg-red-200 text-red-800" :
                          animal.healthStatus === "Healthy" ? "bg-emerald-100 text-emerald-800" :
                          animal.healthStatus === "Under Treatment" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {animal.status}
                        </span>
                      </div>
                    </div>

                    {/* Animal Identity */}
                    <div 
                      onClick={() => navigate(`/animals/${animal.id}`)}
                      className="p-3 flex-1 flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">{animal.species}</span>
                          <span className="text-[10px] text-slate-500">{animal.sex === "Female" ? "♀️" : "♂️"}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-0.5 truncate">
                          {displayName}
                        </h4>
                        {hasCustomName && (
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                            {animal.animal_code}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between mt-2">
                        <span className="text-[9px] text-slate-400">{animal.breed}</span>
                        <ChevronRight size={12} className="text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredAnimals.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400 text-xs">
                  No matching livestock registered. Register a new animal to build records!
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: FARM AI */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <div className="text-center p-6 bg-emerald-950 text-white rounded-3xl relative overflow-hidden shadow-xl">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 border border-white/20">
                🤖
              </div>
              <h2 className="text-lg font-black tracking-tight">Farm AI Intelligence</h2>
              <p className="text-emerald-200 text-xs mt-1 max-w-xs mx-auto">
                Context-aware insights for your veterinary, pedigree and feed storage records.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* DIALOG 1: REGISTER ANIMAL */}
      {showAddAnimal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={triggerCreateAnimal}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Register New Livestock</h3>
              <button type="button" onClick={() => setShowAddAnimal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Photo upload + Portrait file selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Take/Upload Animal Portraits (Multiple Allowed)</label>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition"
                >
                  <Camera size={14} className="text-emerald-700" /> Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <Upload size={14} className="text-slate-600" /> Upload Photos
                </button>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Preview thumbnails */}
              {newAnimal.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {newAnimal.photos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setNewAnimal(prev => ({ ...prev, primaryPhoto: photo }))}
                      className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer group ${
                        newAnimal.primaryPhoto === photo ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200"
                      }`}
                    >
                      <img src={photo} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNewAnimalPhoto(idx);
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-0.5 rounded-full text-[10px] transition"
                      >
                        <X size={12} />
                      </button>
                      {newAnimal.primaryPhoto === photo && (
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-black text-center py-0.5">
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Species</label>
                <select
                  value={selectedSpeciesOption}
                  onChange={(e) => setSelectedSpeciesOption(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  {SPECIES_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Sex</label>
                <select
                  value={newAnimal.sex}
                  onChange={(e) => setNewAnimal({ ...newAnimal, sex: e.target.value as Animal["sex"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Female">Female (Dam/Ewe/Hen)</option>
                  <option value="Male">Male (Sire/Ram/Rooster)</option>
                </select>
              </div>
            </div>

            {/* Custom Species Text Input when Other is selected */}
            {selectedSpeciesOption === "Other" && (
              <div className="animate-in fade-in">
                <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                  Specify Custom Species Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pigeon, Ostrich, Alpacas..."
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  className="w-full p-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breed</label>
                <input
                  type="text"
                  placeholder="e.g. West African Dwarf"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Aisha"
                  value={newAnimal.name}
                  onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition"
            >
              Generate Digital ID & Save Animal
            </button>
          </form>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
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

    </div>
  );
};

export default Index;