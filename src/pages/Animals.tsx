"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  useFarm, 
  Animal, 
  SPECIES_OPTIONS, 
  LifecycleStatus, 
  HealthStatus, 
  ReproductiveStatus 
} from "@/context/FarmContext";
import { uploadOrCompressImage } from "@/utils/imageCompressor";
import { LazyAnimalImage } from "@/components/LazyAnimalImage";
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Camera, 
  Upload, 
  HelpCircle, 
  Download, 
  X, 
  Lock 
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const Animals: React.FC = () => {
  const navigate = useNavigate();
  const { animals, addAnimal, loadAnimals, session } = useFarm();

  useEffect(() => {
    loadAnimals();
  }, [loadAnimals]);

  // Restore scroll position after returning to animals directory
  useEffect(() => {
    const savedPos = sessionStorage.getItem("animals_scroll_y");
    if (savedPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPos, 10));
      }, 50);
    }
  }, []);

  const handleOpenAnimal = (animalId: string) => {
    sessionStorage.setItem("animals_scroll_y", String(window.scrollY));
    navigate(`/animals/${animalId}`);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [lifecycleFilter, setLifecycleFilter] = useState<string>("All");
  const [healthFilter, setHealthFilter] = useState<string>("All");
  const [reproFilter, setReproFilter] = useState<string>("All");

  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const [selectedSpeciesOption, setSelectedSpeciesOption] = useState<string>("Goat");
  const [customSpecies, setCustomSpecies] = useState<string>("");

  const [newAnimal, setNewAnimal] = useState({
    name: "",
    breed: "",
    sex: "Female" as Animal["sex"],
    dob: new Date().toISOString().split("T")[0],
    purchaseDate: "",
    purchasePrice: "",
    source: "Born on farm" as Animal["source"],
    status: "Active" as LifecycleStatus,
    healthStatus: "Healthy" as HealthStatus,
    reproductiveStatus: "None" as ReproductiveStatus,
    notes: "",
    primaryPhoto: "",
    photos: [] as string[],
    motherId: "",
    fatherId: "",
  });

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const fileList = Array.from(files);
        const uploadedList = await Promise.all(
          fileList.map(file => uploadOrCompressImage(file, session.userId, supabase))
        );
        setNewAnimal(prev => {
          const allPhotos = [...prev.photos, ...uploadedList];
          return {
            ...prev,
            primaryPhoto: prev.primaryPhoto || allPhotos[0] || "",
            photos: allPhotos
          };
        });
        showSuccess(`${uploadedList.length} photo${uploadedList.length > 1 ? "s" : ""} attached!`);
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
      title: "Add New Animal Record?",
      message: `Verify details for registering this new ${finalSpecies} in the main pedigree registry.`,
      onConfirm: () => {
        const defaultPhoto = "/placeholder.svg";
        const finalPhotos = newAnimal.photos.length > 0 ? newAnimal.photos : [defaultPhoto];
        const finalPrimary = newAnimal.primaryPhoto || finalPhotos[0];
        const parsedPrice = newAnimal.source === "Purchased" && newAnimal.purchasePrice && !isNaN(Number(newAnimal.purchasePrice))
          ? parseFloat(newAnimal.purchasePrice)
          : undefined;

        addAnimal({
          name: newAnimal.name,
          species: finalSpecies,
          breed: newAnimal.breed || "Local Breed",
          sex: newAnimal.sex,
          dob: newAnimal.dob,
          purchaseDate: newAnimal.source === "Purchased" ? (newAnimal.purchaseDate || undefined) : undefined,
          purchasePrice: parsedPrice,
          source: newAnimal.source,
          status: newAnimal.status || "Active",
          healthStatus: newAnimal.healthStatus || "Healthy",
          reproductiveStatus: newAnimal.reproductiveStatus || "None",
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
          purchaseDate: "",
          purchasePrice: "",
          source: "Born on farm",
          status: "Active",
          healthStatus: "Healthy",
          reproductiveStatus: "None",
          notes: "",
          primaryPhoto: "",
          photos: [],
          motherId: "",
          fatherId: "",
        });
      }
    });
  };

  const filteredAnimals = animals.filter(animal => {
    const codeMatch = animal.animal_code.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = animal.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const breedMatch = animal.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const speciesMatchText = animal.species.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = codeMatch || nameMatch || breedMatch || speciesMatchText;

    const speciesMatchFilter = speciesFilter === "All" || animal.species === speciesFilter;
    const lifecycleMatch = lifecycleFilter === "All" || animal.status === lifecycleFilter;
    const healthMatch = healthFilter === "All" || animal.healthStatus === healthFilter;
    const reproMatch = reproFilter === "All" || animal.reproductiveStatus === reproFilter;

    return queryMatch && speciesMatchFilter && lifecycleMatch && healthMatch && reproMatch;
  });

  const handleDownloadFullscreen = () => {
    if (!fullscreenPhoto) return;
    const link = document.createElement("a");
    link.href = fullscreenPhoto;
    link.download = "livestock_roster_snapshot.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Image downloaded successfully!");
  };

  return (
    <div className="space-y-4">
      
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Livestock Directory</h2>
          <p className="text-xs text-slate-500">Search codes, names, or filter by species, health and reproduction.</p>
        </div>
        <button
          onClick={() => setShowAddAnimal(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus size={14} />
          Register Animal
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search tags, breeds, species, names (e.g. ADG001, Cow)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition"
        />
      </div>

      {/* Filters Hub */}
      <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        {/* Species Filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSpeciesFilter("All")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              speciesFilter === "All"
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {species}
            </button>
          ))}
        </div>

        {/* Multi-Dimensional Status Filter Rows */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Lifecycle Filter */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[75px]">Lifecycle:</span>
            {["All", "Active", "Sold", "Deceased", "Retired"].map((st) => (
              <button
                key={st}
                onClick={() => setLifecycleFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  lifecycleFilter === st
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[75px]">Health:</span>
            {["All", "Healthy", "Monitoring", "Sick", "Under Treatment"].map((h) => (
              <button
                key={h}
                onClick={() => setHealthFilter(h)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  healthFilter === h
                    ? "bg-emerald-700 border-emerald-700 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Reproductive Filter */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[75px]">Reproduction:</span>
            {["All", "Pregnant", "Breeding", "Lactating", "None"].map((r) => (
              <button
                key={r}
                onClick={() => setReproFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  reproFilter === r
                    ? "bg-rose-600 border-rose-600 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {r === "None" ? "Normal / None" : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Cards List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        {filteredAnimals.map((animal) => {
          const hasCustomName = Boolean(animal.name && animal.name.trim().length > 0);
          const displayName = hasCustomName ? animal.name : animal.animal_code;
          const isDeceased = animal.status === "Deceased";
          const isPregnant = animal.reproductiveStatus === "Pregnant";
          const isSickOrTx = animal.healthStatus === "Sick" || animal.healthStatus === "Under Treatment";

          return (
            <div
              key={animal.id}
              className={`bg-white rounded-2xl overflow-hidden border shadow-sm transition flex flex-col group ${
                isDeceased ? 'border-red-100 bg-slate-50/50' : 'border-slate-100 hover:border-emerald-300'
              }`}
            >
              <div className="relative h-32 bg-slate-100">
                <LazyAnimalImage
                  src={animal.primaryPhoto}
                  alt={displayName}
                  onClick={() => setFullscreenPhoto(animal.primaryPhoto || "/placeholder.svg")}
                  className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-zoom-in ${
                    isDeceased ? 'grayscale' : ''
                  }`}
                  containerClassName="w-full h-full"
                />
                
                {/* Badges Stack */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none flex flex-col items-end gap-1">
                  {isDeceased ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full shadow bg-red-200 text-red-900 border border-red-300">
                      🕊️ Deceased
                    </span>
                  ) : (
                    <>
                      {animal.status !== "Active" && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full shadow bg-slate-200 text-slate-700">
                          {animal.status}
                        </span>
                      )}

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shadow ${
                        animal.healthStatus === "Healthy" ? "bg-emerald-100 text-emerald-800" :
                        animal.healthStatus === "Under Treatment" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        ● {animal.healthStatus}
                      </span>

                      {isPregnant && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full shadow bg-rose-100 text-rose-800 border border-rose-200">
                          🤰 Pregnant
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div 
                onClick={() => handleOpenAnimal(animal.id)}
                className="p-3 flex-1 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">{animal.species}</span>
                    <span className="text-[10px] text-slate-500">{animal.sex === "Female" ? "♀️" : "♂️"}</span>
                  </div>
                  
                  {/* Main Title Name Display */}
                  <h4 className="font-extrabold text-xs text-slate-900 mt-0.5 truncate">
                    {displayName}
                  </h4>

                  {/* Secondary Code Display when custom name exists */}
                  {hasCustomName && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                      {animal.animal_code}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-50 flex items-center justify-between mt-2">
                  <span className="text-[9px] text-slate-400">{animal.breed}</span>
                  {isDeceased ? (
                    <Lock size={12} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={12} className="text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredAnimals.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">
            No matching livestock records found. Click "Register Animal" to begin!
          </div>
        )}
      </div>

      {/* FULLSCREEN PREVIEW WITH DOWNLOAD */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition"
          >
            ✕
          </button>
          <div className="max-w-3xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
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

      {/* ADD ANIMAL DIALOG */}
      {showAddAnimal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerCreateAnimal}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Register New Livestock</h3>
              <button type="button" onClick={() => setShowAddAnimal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Animal Portraits (Select Multiple)</label>
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

              {/* Thumbnails list */}
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
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  {SPECIES_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Gender</label>
                <select
                  value={newAnimal.sex}
                  onChange={(e) => setNewAnimal({ ...newAnimal, sex: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            {/* Conditional Custom Species Input */}
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

            {/* Separated Status Configuration */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
              <div>
                <label className="text-[9px] font-bold text-slate-500 block">Lifecycle</label>
                <select
                  value={newAnimal.status}
                  onChange={(e) => setNewAnimal({ ...newAnimal, status: e.target.value as LifecycleStatus })}
                  className="w-full p-2 bg-white border rounded-xl text-xs mt-1 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Sold">Sold</option>
                  <option value="Deceased">Deceased</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 block">Health</label>
                <select
                  value={newAnimal.healthStatus}
                  onChange={(e) => setNewAnimal({ ...newAnimal, healthStatus: e.target.value as HealthStatus })}
                  className="w-full p-2 bg-white border rounded-xl text-xs mt-1 font-semibold"
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Sick">Sick</option>
                  <option value="Under Treatment">Under Tx</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 block">Reproduction</label>
                <select
                  value={newAnimal.reproductiveStatus}
                  onChange={(e) => setNewAnimal({ ...newAnimal, reproductiveStatus: e.target.value as ReproductiveStatus })}
                  className="w-full p-2 bg-white border rounded-xl text-xs mt-1 font-semibold"
                >
                  <option value="None">None/Normal</option>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Breeding">Breeding</option>
                  <option value="Lactating">Lactating</option>
                  <option value="Not applicable">N/A</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Acquisition Source</label>
                <select
                  value={newAnimal.source}
                  onChange={(e) => setNewAnimal({ ...newAnimal, source: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs mt-1 font-semibold"
                >
                  <option value="Born on farm">Born on farm</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Date of Birth</label>
                <input
                  type="date"
                  value={newAnimal.dob}
                  onChange={(e) => setNewAnimal({ ...newAnimal, dob: e.target.value })}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs mt-1"
                />
              </div>
            </div>

            {newAnimal.source === "Purchased" && (
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 block">Date of Purchase</label>
                  <input
                    type="date"
                    value={newAnimal.purchaseDate}
                    onChange={(e) => setNewAnimal({ ...newAnimal, purchaseDate: e.target.value })}
                    className="w-full p-2 bg-white border rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 block">Purchase Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 85000"
                    value={newAnimal.purchasePrice}
                    onChange={(e) => setNewAnimal({ ...newAnimal, purchasePrice: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Breed Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Breed"
                  value={newAnimal.breed}
                  onChange={(e) => setNewAnimal({ ...newAnimal, breed: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
               <div>
                <label className="text-[10px] font-bold text-slate-500 block">Animal Custom Name (Optional)</label>
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
            >
              Add Digital Identity
            </button>
          </form>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
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