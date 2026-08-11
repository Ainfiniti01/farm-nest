import React, { useState, useRef, useEffect } from "react";
import { useFarm, Animal, HealthRecord, Treatment, InventoryItem, Contact, Reminder } from "@/context/FarmContext";
import { ReportDownloader } from "@/components/ReportDownloader";
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  Trash2, 
  Calendar, 
  FileText, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Tag, 
  Weight, 
  Camera, 
  Settings as SettingsIcon, 
  ChevronRight, 
  Heart, 
  Phone, 
  MapPin, 
  MessageSquare,
  Package,
  Boxes,
  HelpCircle,
  Eye,
  Check,
  Award,
  Sparkles,
  Info,
  Layers,
  Sparkle,
  LogOut,
  Upload,
  UserPlus,
  Compass,
  Briefcase
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Index = () => {
  const {
    animals,
    healthRecords,
    treatments,
    weightRecords,
    breedingRecords,
    inventory,
    inventoryTransactions,
    contacts,
    reminders,
    activityLogs,
    farmProfile,
    session,
    onboardingCompleted,
    aiUsage,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    addHealthRecord,
    addTreatment,
    updateTreatmentStatus,
    addWeightRecord,
    addBreedingRecord,
    addInventoryItem,
    updateInventoryStock,
    addContact,
    deleteContact,
    addReminder,
    toggleReminder,
    updateFarmProfile,
    login,
    signupAndSetup,
    logout,
    setOnboardingCompleted
  } = useFarm();

  // Bottom Navigation tab: 'dashboard' | 'animals' | 'ai' | 'inventory' | 'settings'
  const [activeTab, setActiveTab] = useState<"dashboard" | "animals" | "ai" | "inventory" | "settings">("dashboard");

  // Selected animal detail modal/drawer
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // Onboarding Active Screen: 0 | 1 | 2 | 3
  const [onboardingIndex, setOnboardingIndex] = useState(0);

  // Authentication screens: 'welcome' | 'login' | 'signup' | 'forgot_password'
  const [authScreen, setAuthScreen] = useState<"welcome" | "login" | "signup" | "forgot_password">("welcome");

  // Authentication credentials forms
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authFarmName, setAuthFarmName] = useState("");
  const [authOperatorName, setAuthOperatorName] = useState("");
  const [authLocation, setAuthLocation] = useState("");

  // Loading Screen simulation state
  const [isInitializingApp, setIsInitializingApp] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Preparing your farm...");

  // New animal form state
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [newAnimal, setNewAnimal] = useState({
    name: "",
    species: "Goat" as Animal["species"],
    breed: "",
    sex: "Female" as Animal["sex"],
    dob: new Date().toISOString().split("T")[0],
    source: "Born on farm" as Animal["source"],
    status: "Healthy" as Animal["status"],
    notes: "",
    primaryPhoto: "",
    motherId: "",
    fatherId: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Health record form state
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [selectedAnimalForHealth, setSelectedAnimalForHealth] = useState("");
  const [newHealth, setNewHealth] = useState({
    type: "Observation" as HealthRecord["type"],
    details: "",
    medication: "",
    recordedBy: farmProfile.ownerName || "Abdulazeez Adam",
    date: new Date().toISOString().split("T")[0],
  });

  // Treatment record form state
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [selectedAnimalForTreatment, setSelectedAnimalForTreatment] = useState("");
  const [newTreatment, setNewTreatment] = useState({
    condition: "",
    medication: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  // Inventory record state
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [newInventory, setNewInventory] = useState({
    name: "",
    category: "Feed" as InventoryItem["category"],
    quantity: 10,
    unit: "Bags",
    minStock: 2,
    notes: "",
  });

  // Inventory Adjustment state
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustNotes, setAdjustNotes] = useState("");

  // Contact State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    role: "Veterinarian" as Contact["role"],
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    notes: "",
  });

  // Roster filters
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Farm Profile Edit State
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...farmProfile });

  // Rotate Loading messages simulating real initial boot
  useEffect(() => {
    if (isInitializingApp) {
      const messages = [
        "Preparing your farm...",
        "Loading your animals...",
        "Gathering your records...",
        "Almost ready..."
      ];
      let msgIdx = 0;
      const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setLoadingMessage(messages[msgIdx]);
      }, 1000);

      const timeout = setTimeout(() => {
        setIsInitializingApp(false);
        clearInterval(interval);
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isInitializingApp]);

  // Handle Photo File selection and Camera capture
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewAnimal(prev => ({ ...prev, primaryPhoto: reader.result as string }));
          showSuccess("Live livestock portrait attached!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset portrait helper
  const handleSimulatePhoto = (type: "goat" | "ram" | "chicken") => {
    let url = "";
    if (type === "goat") url = "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=500&auto=format&fit=crop&q=80";
    if (type === "ram") url = "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=500&auto=format&fit=crop&q=80";
    if (type === "chicken") url = "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&auto=format&fit=crop&q=80";
    setNewAnimal(prev => ({ ...prev, primaryPhoto: url }));
    showSuccess("Preset animal portrait selected!");
  };

  // Auth operations
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showError("Please check your email and password and try again.");
      return;
    }
    
    // Simulate Preparing farm sequence
    setIsInitializingApp(true);
    const success = login(authEmail, authFarmName || farmProfile.name);
    if (success) {
      setAuthEmail("");
      setAuthPassword("");
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authFarmName || !authOperatorName) {
      showError("We couldn't create your account. All fields are required.");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    // Simulate setup loader
    setIsInitializingApp(true);
    signupAndSetup(authEmail, authOperatorName, authFarmName, authLocation || "Kano, Nigeria");
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthFarmName("");
    setAuthOperatorName("");
    setAuthLocation("");
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Password reset link sent securely to your email address!");
    setAuthScreen("login");
  };

  // Submit handlers
  const handleCreateAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    addAnimal({
      name: newAnimal.name,
      species: newAnimal.species,
      breed: newAnimal.breed || "Local Breed",
      sex: newAnimal.sex,
      dob: newAnimal.dob,
      source: newAnimal.source,
      status: newAnimal.status,
      healthStatus: "Healthy",
      primaryPhoto: newAnimal.primaryPhoto || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
      photos: [newAnimal.primaryPhoto || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400"],
      notes: newAnimal.notes,
      parents: {
        motherId: newAnimal.motherId || undefined,
        fatherId: newAnimal.fatherId || undefined
      }
    });
    setShowAddAnimal(false);
    setNewAnimal({
      name: "",
      species: "Goat",
      breed: "",
      sex: "Female",
      dob: new Date().toISOString().split("T")[0],
      source: "Born on farm",
      status: "Healthy",
      notes: "",
      primaryPhoto: "",
      motherId: "",
      fatherId: "",
    });
  };

  const handleCreateHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalForHealth) {
      showError("Please select the target animal.");
      return;
    }
    addHealthRecord({
      animal_id: selectedAnimalForHealth,
      type: newHealth.type,
      date: newHealth.date,
      details: newHealth.details,
      medication: newHealth.medication || undefined,
      recordedBy: newHealth.recordedBy,
    });
    setShowAddHealth(false);
    setNewHealth({
      type: "Observation",
      details: "",
      medication: "",
      recordedBy: farmProfile.ownerName || "Abdul",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleCreateTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalForTreatment) {
      showError("Please pick an animal");
      return;
    }
    addTreatment({
      animal_id: selectedAnimalForTreatment,
      condition: newTreatment.condition,
      medication: newTreatment.medication,
      startDate: newTreatment.startDate,
      endDate: newTreatment.endDate,
      status: "Ongoing",
      notes: newTreatment.notes,
      followUpDate: newTreatment.followUpDate || undefined,
    });
    setShowAddTreatment(false);
    setNewTreatment({
      condition: "",
      medication: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const handleCreateInventory = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({
      name: newInventory.name,
      category: newInventory.category,
      quantity: Number(newInventory.quantity),
      unit: newInventory.unit,
      minStock: Number(newInventory.minStock),
      notes: newInventory.notes,
    });
    setShowAddInventory(false);
    setNewInventory({
      name: "",
      category: "Feed",
      quantity: 10,
      unit: "Bags",
      minStock: 2,
      notes: "",
    });
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    addContact({
      name: newContact.name,
      role: newContact.role,
      phone: newContact.phone,
      whatsapp: newContact.whatsapp || undefined,
      email: newContact.email || undefined,
      address: newContact.address || undefined,
      notes: newContact.notes || undefined,
    });
    setShowAddContact(false);
    setNewContact({
      name: "",
      role: "Veterinarian",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      notes: "",
    });
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    updateInventoryStock(
      adjustingItem.id,
      adjustQty,
      adjustType === "add" ? "add" : "remove",
      adjustNotes || "Manual stock correction",
      farmProfile.ownerName || "Abdul"
    );
    setAdjustingItem(null);
    setAdjustNotes("");
  };

  // Counts & metrics for farm profile
  const totalAnimals = animals.length;
  const goatsCount = animals.filter(a => a.species === "Goat").length;
  const ramsCount = animals.filter(a => a.species === "Ram").length;
  const chickensCount = animals.filter(a => a.species === "Chicken").length;
  const otherCount = animals.filter(a => a.species === "Other").length;
  const activeCount = animals.filter(a => a.status !== "Sold" && a.status !== "Deceased").length;
  const attentionCount = animals.filter(a => a.status === "Sick" || a.status === "Under Treatment" || a.status === "Monitoring").length;

  const filteredAnimals = animals.filter(animal => {
    const codeMatch = animal.animal_code.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = animal.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const breedMatch = animal.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatch = codeMatch || nameMatch || breedMatch;

    const speciesMatch = speciesFilter === "All" || animal.species === speciesFilter;
    const statusMatch = statusFilter === "All" || animal.status === statusFilter;

    return queryMatch && speciesMatch && statusMatch;
  });

  // BACKGROUND IMAGES FOR ONBOARDING / AUTH
  const AUTH_BG_URL = "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1000&auto=format&fit=crop&q=80";

  // GLOBAL INITIALIZING / LOADING SCREEN
  if (isInitializingApp) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center text-white p-6 relative transition-all duration-500"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(4, 47, 31, 0.95), rgba(6, 78, 59, 0.92)), url(${AUTH_BG_URL})` }}
      >
        <div className="text-center space-y-8 max-w-sm">
          {/* Logo Icon */}
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 mx-auto flex items-center justify-center text-4xl shadow-xl animate-bounce">
            🚜
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">FarmNest</h1>
            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Your farm, all in one place.</p>
          </div>

          <div className="space-y-2 bg-black/20 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <div className="flex justify-center items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-sm font-extrabold text-white">{loadingMessage}</span>
            </div>
            <p className="text-[10px] text-emerald-300">Just a moment while we configure database streams.</p>
          </div>

          <div className="pt-8 border-t border-emerald-800/40">
            <p className="text-emerald-100/90 text-xs italic font-medium leading-relaxed">
              "Good records. Healthy animals. Better farming."
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING SCREENS WRAPPER (4 Screens total)
  if (!onboardingCompleted) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex flex-col justify-between text-white p-6 transition-all duration-700 relative"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(6, 78, 59, 0.95)), url(${AUTH_BG_URL})` 
        }}
      >
        {/* Top skip header */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚜</span>
            <span className="font-black text-sm tracking-wide">FarmNest</span>
          </div>
          <button 
            onClick={() => setOnboardingCompleted(true)}
            className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm transition"
          >
            Skip
          </button>
        </div>

        {/* SCREEN 1: WELCOME SCREEN */}
        {onboardingIndex === 0 && (
          <div className="max-w-md mx-auto space-y-6 text-center my-auto z-10 py-12 animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-white">
              FarmNest
            </h1>
            <p className="text-emerald-300 font-extrabold text-sm uppercase tracking-widest">
              Your farm, all in one place.
            </p>
            <p className="text-slate-200 text-xs leading-relaxed max-w-xs mx-auto">
              Manage your animals, records, health history, breeding logs and inventory — all from your pocket.
            </p>

            <button
              onClick={() => setOnboardingIndex(1)}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Get Started
            </button>
          </div>
        )}

        {/* SCREEN 2: ANIMAL IDENTITY */}
        {onboardingIndex === 1 && (
          <div className="max-w-md mx-auto space-y-6 text-center my-auto z-10 py-12 animate-in slide-in-from-right duration-500">
            {/* Visual Preview */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-left max-w-xs mx-auto shadow-xl">
              <div className="relative h-24 bg-slate-100 rounded-xl overflow-hidden">
                <img src={MOCK_IMAGES.goat1} className="w-full h-full object-cover" />
                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                  Healthy
                </span>
              </div>
              <p className="text-[9px] text-emerald-300 font-bold uppercase mt-2">Goat • Female</p>
              <h3 className="font-black text-xs text-white">AISHA</h3>
              <p className="text-[10px] font-mono text-slate-300">GOAT-0024</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black leading-tight">Every animal has a place</h2>
              <p className="text-slate-200 text-xs leading-relaxed max-w-xs mx-auto">
                Give each goat, ram, chicken and other animal its own digital identity, photos and complete pedigree lineage.
              </p>
            </div>

            <button
              onClick={() => setOnboardingIndex(2)}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Next
            </button>
          </div>
        )}

        {/* SCREEN 3: LIVING STORY */}
        {onboardingIndex === 2 && (
          <div className="max-w-md mx-auto space-y-6 text-center my-auto z-10 py-12 animate-in slide-in-from-right duration-500">
            {/* Health timeline preview */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-left max-w-xs mx-auto shadow-xl space-y-3">
              <div className="flex gap-3 text-xs items-center">
                <span className="text-emerald-400">●</span>
                <div>
                  <p className="font-bold">PPR Vaccination booster</p>
                  <p className="text-[9px] text-slate-300">Administered by Uncle • Last month</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs items-center opacity-70">
                <span className="text-amber-400">●</span>
                <div>
                  <p className="font-bold">Minor Hoof decay watch</p>
                  <p className="text-[9px] text-slate-300">Logged by Abdul • 2 months ago</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black leading-tight">Keep their whole story</h2>
              <p className="text-slate-200 text-xs leading-relaxed max-w-xs mx-auto">
                Track health observations, active medical prescriptions, weighings, offspring counts, and audit logs permanently.
              </p>
            </div>

            <button
              onClick={() => setOnboardingIndex(3)}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
            >
              Next
            </button>
          </div>
        )}

        {/* SCREEN 4: COMPLETE THE FARM HOME */}
        {onboardingIndex === 3 && (
          <div className="max-w-md mx-auto space-y-6 text-center my-auto z-10 py-12 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-black leading-tight text-white">Your farm, all together</h2>
            <p className="text-slate-200 text-xs leading-relaxed max-w-xs mx-auto">
              Ready to give your livestock a real source of truth? Create your personal profile and configure your farm parameters in 1 minute.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setOnboardingCompleted(true)}
                className="w-full max-w-xs py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                Create My Farm
              </button>
            </div>
          </div>
        )}

        {/* Footer indicators and Skip controls */}
        <div className="flex justify-between items-center z-10 py-4 max-w-md mx-auto w-full">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <span 
                key={idx}
                onClick={() => setOnboardingIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${onboardingIndex === idx ? "bg-emerald-400 w-6" : "bg-white/30"}`}
              />
            ))}
          </div>
          {onboardingIndex > 0 && (
            <button 
              onClick={() => setOnboardingIndex(prev => prev - 1)}
              className="text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // IF NOT AUTHENTICATED: Present beautiful Welcome/Onboarding portal
  if (!session.isAuthenticated) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4 relative"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7), rgba(4, 47, 31, 0.95)), url(${AUTH_BG_URL})` }}
      >
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6 space-y-6">
          
          {/* Brand header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-2xl shadow border border-white/20">
              🚜
            </div>
            <h1 className="text-2xl font-black text-white mt-2">FarmNest</h1>
            <p className="text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest">Your farm, all in one place.</p>
          </div>

          {/* WELCOME PORTAL */}
          {authScreen === "welcome" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-slate-200 text-xs text-center leading-relaxed">
                Connect your team, map maternal/paternal lineage trees, trace vaccinations chronologically and control inventory levels efficiently.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setAuthScreen("signup")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  Setup New Farm Account
                </button>
                <button
                  onClick={() => setAuthScreen("login")}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-white/20"
                >
                  <Compass size={16} />
                  Login to Existing Farm
                </button>
              </div>
            </div>
          )}

          {/* SIGNUP / SETUP FARM */}
          {authScreen === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-black text-white">Create your FarmNest account</h2>
                <p className="text-[10px] text-emerald-300">Let's set up your farm and operator credentials.</p>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                <div>
                  <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Abdulazeez Adam"
                    value={authOperatorName}
                    onChange={(e) => setAuthOperatorName(e.target.value)}
                    className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Farm Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Adam Farms"
                      value={authFarmName}
                      onChange={(e) => setAuthFarmName(e.target.value)}
                      className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Geographic Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Kano, Nigeria"
                      value={authLocation}
                      onChange={(e) => setAuthLocation(e.target.value)}
                      className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="operator@myfarm.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Confirm</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Create My Farm
                </button>
                <button
                  type="button"
                  onClick={() => setAuthScreen("welcome")}
                  className="w-full py-2 text-slate-300 hover:text-white text-xs font-semibold text-center block"
                >
                  Back to main portal
                </button>
              </div>
            </form>
          )}

          {/* LOGIN PAGE */}
          {authScreen === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-black text-white">Welcome back</h2>
                <p className="text-[11px] text-emerald-300">Log in to your FarmNest dashboard.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Farm Name or Email</label>
                  <input
                    type="text"
                    placeholder="e.g. Adam Farms / operator@myfarm.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-bold text-emerald-200 uppercase block">Password</label>
                    <button 
                      type="button" 
                      onClick={() => setAuthScreen("forgot_password")}
                      className="text-[9px] font-bold text-emerald-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Log In to Farm Session
                </button>
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-300">Don't have an account? </span>
                  <button 
                    type="button" 
                    onClick={() => setAuthScreen("signup")}
                    className="text-xs font-bold text-emerald-400 hover:underline"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {authScreen === "forgot_password" && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-black text-white">Reset your password</h2>
                <p className="text-xs text-slate-300">Enter your email and we'll send you a link to reset.</p>
              </div>

              <div>
                <label className="text-[9px] font-bold text-emerald-200 uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="operator@myfarm.com"
                  className="w-full p-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
              >
                Send Reset Link
              </button>

              <button
                type="button"
                onClick={() => setAuthScreen("login")}
                className="w-full py-2 text-slate-300 hover:text-white text-xs font-semibold text-center block"
              >
                Back to Login
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: Display the responsive Desktop-ready main application UI
  return (
    <div className="min-h-screen bg-[#FBFDF9] text-slate-800 font-sans flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR NAVIGATION PANEL (Visible on MD screens and above) */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-950 text-white shrink-0 justify-between p-6 sticky top-0 h-screen border-r border-emerald-900">
        <div className="space-y-8">
          
          {/* Brand header */}
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

          {/* Navigation Links */}
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

        {/* Operator Profile and Signout */}
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

      {/* MOBILE HEADER (Visible on mobile/tablet) */}
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

        {/* Welcome Banner */}
        <div className="mb-6 p-6 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-3xl relative overflow-hidden shadow-md">
          <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Session Activated</span>
          <h2 className="text-xl md:text-2xl font-black mt-1">Welcome back to {farmProfile.name} 👋</h2>
          <p className="text-emerald-100 text-xs mt-1 max-w-md">
            Active operator session is signed into database. Photograph studs, trace mother lineages, and review veterinary logs securely.
          </p>
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Quick Summary Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/60">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Livestock</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-950">{totalAnimals}</span>
                  <span className="text-xs text-emerald-700 font-medium">heads</span>
                </div>
                <div className="text-[10px] text-emerald-800/80 mt-2 flex flex-wrap gap-x-2">
                  <span>🐐 {goatsCount} G</span>
                  <span>🐏 {ramsCount} R</span>
                  <span>🐔 {chickensCount} C</span>
                </div>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100/60">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Alerts & Attention</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-950">{attentionCount}</span>
                  <span className="text-xs text-amber-700 font-medium">animals</span>
                </div>
                <p className="text-[10px] text-amber-800 mt-2">
                  {treatments.filter(t => t.status === "Ongoing").length} active treatments ongoing.
                </p>
              </div>

              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100/60">
                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Active Inventory</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-blue-950">{inventory.length}</span>
                  <span className="text-xs text-blue-700 font-medium">items</span>
                </div>
                <p className="text-[10px] text-blue-800 mt-2">
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
                <p className="text-[10px] text-purple-800 mt-2">
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
                    onClick={() => {
                      const title = prompt("Enter a brief title for your custom reminder:");
                      if (title) {
                        addReminder({
                          title,
                          type: "Other",
                          dueDate: new Date().toISOString().split("T")[0],
                          notes: "Manually registered reminder"
                        });
                      }
                    }}
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
                        onClick={() => toggleReminder(rem.id)}
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

            {/* Critical Stock Alerts & Recent Activities split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Stock Alerts */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Boxes size={16} className="text-amber-500" />
                  Critical Stock Alerts
                </h3>
                <div className="space-y-2">
                  {inventory.map((item) => {
                    const isLow = item.quantity <= item.minStock;
                    if (!isLow) return null;
                    return (
                      <div key={item.id} className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-red-950">{item.name}</p>
                          <p className="text-[10px] text-red-800">Only {item.quantity} {item.unit} left (Minimum: {item.minStock})</p>
                        </div>
                        <button 
                          onClick={() => {
                            setAdjustingItem(item);
                            setAdjustType("add");
                            setAdjustQty(5);
                          }}
                          className="bg-white text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-lg"
                        >
                          Restock
                        </button>
                      </div>
                    );
                  })}
                  {inventory.every(item => item.quantity > item.minStock) && (
                    <p className="text-center py-4 text-xs text-emerald-800 bg-emerald-50/20 rounded-xl border border-dashed border-emerald-100">
                      👍 Feeding stock and medical dispensaries are currently optimal.
                    </p>
                  )}
                </div>
              </div>

              {/* Operational Log */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" />
                  Live Farm Operations Stream
                </h3>
                <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-3 before:w-[1px] before:bg-slate-100">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex gap-3 text-xs relative pl-6">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] absolute left-0 top-0.5 border border-emerald-200">
                        📝
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800">{log.type}</span>
                          <span className="text-[9px] text-slate-400">by {log.actor}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{log.description}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
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
                  placeholder="Search tag (e.g. GOAT-0024, Aisha)..."
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
                {["All", "Goat", "Ram", "Chicken", "Other"].map((species) => (
                  <button
                    key={species}
                    onClick={() => setSpeciesFilter(species)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      speciesFilter === species
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {species === "All" ? "🌍 All Species" : species}
                  </button>
                ))}
              </div>
            </div>

            {/* Health Filter Row */}
            <div className="flex flex-wrap gap-1">
              {["All", "Healthy", "Monitoring", "Sick", "Under Treatment", "Pregnant"].map((st) => (
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

            {/* Animals Grid List (Scales up to 4 columns on large desktop screens!) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              {filteredAnimals.map((animal) => {
                return (
                  <div
                    key={animal.id}
                    onClick={() => setSelectedAnimal(animal)}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:border-emerald-300 transition cursor-pointer flex flex-col group"
                  >
                    {/* Animal Photo */}
                    <div className="relative h-32 bg-slate-100">
                      <img
                        src={animal.primaryPhoto}
                        alt={animal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full shadow ${
                          animal.healthStatus === "Healthy" ? "bg-emerald-100 text-emerald-800" :
                          animal.healthStatus === "Under Treatment" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {animal.status}
                        </span>
                      </div>
                    </div>

                    {/* Animal Identity text */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">{animal.species}</span>
                          <span className="text-[10px] text-slate-500">{animal.sex === "Female" ? "♀️" : "♂️"}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-0.5">
                          {animal.name || "Unnamed"}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{animal.animal_code}</p>
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

        {/* TAB 3: FARM AI (COMING SOON SIMULATED ARCHITECTURE) */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="text-center p-6 bg-emerald-950 text-white rounded-3xl relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-600/30 rounded-full blur-2xl" />
              
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-2xl mb-3 border border-white/20 animate-bounce">
                🤖
              </div>
              
              <h2 className="text-lg font-black tracking-tight">Farm AI Intelligence</h2>
              <p className="text-emerald-200 text-xs mt-1 max-w-xs mx-auto">
                Context-aware insights for your veterinary, pedigree and feed storage records.
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-amber-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                <Sparkles size={10} />
                Architecture Set / Activation Coming Soon
              </div>
            </div>

            {/* AI Usage Tracker */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                <Info size={14} className="text-emerald-600" />
                Current Allocation Tier (V1 MVP Architecture)
              </h3>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">AI Questions</span>
                  <p className="font-black text-slate-900 text-base mt-0.5">
                    {aiUsage.questionsUsed} / {aiUsage.questionsLimit} <span className="text-[10px] text-slate-400 font-medium">Daily</span>
                  </p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-emerald-600 h-1.5 rounded-full" 
                      style={{ width: `${(aiUsage.questionsUsed / aiUsage.questionsLimit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">AI Image Scan</span>
                  <p className="font-black text-slate-900 text-base mt-0.5">
                    {aiUsage.imageUsed} / {aiUsage.imageLimit} <span className="text-[10px] text-slate-400 font-medium">Daily</span>
                  </p>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full" 
                      style={{ width: `${(aiUsage.imageUsed / aiUsage.imageLimit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-3 text-center">
                Limits refresh daily at midnight. Image uploads are completely free.
              </p>
            </div>

            {/* Predefined prompts / Simulator */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="font-bold text-slate-700 text-xs mb-3">Simulated Veterinary Knowledge Prompts</h3>
              
              <div className="space-y-2">
                <div 
                  onClick={() => showSuccess("Simulating prompt: 'Does Aisha have complete breeding history?' -> AI matched Aisha's profile and confirmed positive pregnancy cross.")}
                  className="p-3 bg-white hover:bg-slate-100 rounded-xl text-xs text-slate-600 border border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <span>📝 Check pregnancy history of Aisha (GOAT-0024)</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>

                <div 
                  onClick={() => showSuccess("Simulating prompt: 'What treatment was given to Nala?' -> AI fetched Hoof Rot Diagnosis record (18 Feb).")}
                  className="p-3 bg-white hover:bg-slate-100 rounded-xl text-xs text-slate-600 border border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <span>📝 Summarize hoof rot treatment on Nala</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>

                <div 
                  onClick={() => showSuccess("Simulating prompt: 'Is my maize stock too low?' -> AI noted Maize Feed is healthy, but Penicillin has dipped below 3 threshold.")}
                  className="p-3 bg-white hover:bg-slate-100 rounded-xl text-xs text-slate-600 border border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <span>📦 Is our medication storage stock depleted?</span>
                  <ChevronRight size={14} className="text-slate-400" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: INVENTORY */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Farm Storage & Stock</h2>
                <p className="text-xs text-slate-500">Track and log stock movements for feed and veterinary medicine.</p>
              </div>
              <button
                onClick={() => setShowAddInventory(true)}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            {/* Inventory Roster Grid List (Adapts on big screens) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        item.category === "Feed" ? "bg-amber-100 text-amber-800" :
                        item.category === "Medication" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {item.category === "Feed" ? "🌾" : item.category === "Medication" ? "💊" : "🔧"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{item.name}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1.5 py-0.5 bg-slate-50 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Current Stock: <span className="font-black text-slate-800">{item.quantity}</span> {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                      {isLow && (
                        <span className="text-[9px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-1">
                          Low Stock
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustQty(1);
                        }}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            
            {/* Reports Block */}
            <ReportDownloader />

            {/* Contact Directory */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Phone size={16} className="text-emerald-600" />
                  Farm Contact Directory ({contacts.length})
                </h3>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  + Add Contact
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{c.role}</span>
                        <h4 className="font-black text-xs text-slate-800">{c.name}</h4>
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`tel:${c.phone}`}
                          className="w-7 h-7 bg-white hover:bg-slate-100 border rounded-lg flex items-center justify-center text-slate-600 shadow-sm"
                        >
                          📞
                        </a>
                        <button
                          onClick={() => deleteContact(c.id)}
                          className="w-7 h-7 bg-white hover:bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-500 shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {c.notes && (
                      <p className="text-[10px] text-slate-500 mt-2 italic bg-white p-1.5 rounded border border-slate-100">{c.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Farm Profile Configuration */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">Farm Profile Card</h3>
                <button
                  onClick={() => {
                    setEditProfile(!editProfile);
                    setProfileForm({ ...farmProfile });
                  }}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  {editProfile ? "Cancel" : "Edit Details"}
                </button>
              </div>

              {editProfile ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateFarmProfile(profileForm);
                    setEditProfile(false);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Farm Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-2 border rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Owner / Operator</label>
                    <input
                      type="text"
                      value={profileForm.ownerName}
                      onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                      className="w-full p-2 border rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Geographic Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      className="w-full p-2 border rounded-xl text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white font-bold text-xs py-2 rounded-xl"
                  >
                    Save Farm Profile
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="h-32 rounded-xl overflow-hidden bg-slate-100">
                    <img src={farmProfile.image} alt="Farm Landscape" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Description</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{farmProfile.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only Logout button helper */}
            <div className="md:hidden">
              <button
                onClick={logout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2"
              >
                <LogOut size={14} />
                Sign Out Operator Session
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ANIMAL DETAIL MODAL / DIGITAL ANIMAL ID CARD */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Animal Hero ID Card */}
            <div className="relative h-48 bg-slate-100 shrink-0">
              <img
                src={selectedAnimal.primaryPhoto}
                alt={selectedAnimal.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedAnimal(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg transition"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-xl">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300">
                  {selectedAnimal.species} • {selectedAnimal.breed}
                </span>
                <h3 className="text-lg font-black leading-tight mt-0.5">
                  {selectedAnimal.name || "Unnamed"}
                </h3>
                <p className="text-xs font-mono text-slate-300">{selectedAnimal.animal_code}</p>
              </div>
            </div>

            {/* Scrollable details wrapper */}
            <div className="p-4 overflow-y-auto space-y-4">
              
              {/* Dynamic Health Badge state & Weight logs */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Current Vital Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full mt-1 ${
                    selectedAnimal.healthStatus === "Healthy" ? "bg-emerald-100 text-emerald-800" :
                    selectedAnimal.healthStatus === "Under Treatment" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    ⬤ {selectedAnimal.status}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Recorded Mass</span>
                  <span className="text-xs font-black text-slate-800 block mt-1">
                    ⚖️ {weightRecords.filter(w => w.animal_id === selectedAnimal.id).slice(-1)[0]?.weight || "N/A"} kg
                  </span>
                </div>
              </div>

              {/* Breeding & Offspring timeline info */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 border-b pb-1">Lineage & Kin</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Mother (Dam)</span>
                    <span className="font-bold text-slate-700">
                      {selectedAnimal.parents?.motherId 
                        ? animals.find(a => a.id === selectedAnimal.parents?.motherId)?.animal_code || "Unknown"
                        : "Born wild / Unrecorded"}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 block">Father (Sire)</span>
                    <span className="font-bold text-slate-700">
                      {selectedAnimal.parents?.fatherId 
                        ? animals.find(a => a.id === selectedAnimal.parents?.fatherId)?.animal_code || "Unknown"
                        : "Unrecorded"}
                    </span>
                  </div>
                </div>

                {selectedAnimal.offspring && selectedAnimal.offspring.length > 0 && (
                  <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/40 text-xs">
                    <span className="text-[9px] text-emerald-800 font-bold block">Registered Progeny ({selectedAnimal.offspring.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedAnimal.offspring.map((offId) => {
                        const kid = animals.find(a => a.id === offId);
                        return kid ? (
                          <span 
                            key={offId}
                            onClick={() => {
                              setSelectedAnimal(kid);
                            }}
                            className="bg-white border text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-50"
                          >
                            🐐 {kid.animal_code} ({kid.name || "Kid"})
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Health Records & Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-900 border-b pb-1">Medical & Observation Log</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {healthRecords.filter(h => h.animal_id === selectedAnimal.id).map((rec) => (
                    <div key={rec.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{rec.type}</span>
                        <span className="text-[9px] text-slate-400">{rec.date}</span>
                      </div>
                      <p className="text-slate-600">{rec.details}</p>
                      {rec.medication && (
                        <p className="text-[10px] text-purple-700 font-semibold bg-purple-50 p-1 rounded">Rx: {rec.medication}</p>
                      )}
                    </div>
                  ))}
                  {healthRecords.filter(h => h.animal_id === selectedAnimal.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-4">No logged veterinary incidents. Animal exhibits standard wellness.</p>
                  )}
                </div>
              </div>

              {/* Status Update & Destructive Actions */}
              <div className="pt-2 border-t flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Update Status</span>
                  <select
                    value={selectedAnimal.status}
                    onChange={(e) => {
                      updateAnimal(selectedAnimal.id, { status: e.target.value as Animal["status"] });
                      setSelectedAnimal(prev => prev ? { ...prev, status: e.target.value as Animal["status"] } : null);
                    }}
                    className="p-1.5 bg-slate-50 border rounded-lg text-xs"
                  >
                    {["Healthy", "Monitoring", "Sick", "Under Treatment", "Pregnant", "Sold", "Deceased", "Retired"].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Are you absolutely sure you want to remove ${selectedAnimal.animal_code} from database?`)) {
                      deleteAnimal(selectedAnimal.id);
                      setSelectedAnimal(null);
                    }
                  }}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Delete Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DIALOG 1: REGISTER ANIMAL & PORTRAIT FILE INTAKE */}
      {showAddAnimal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={handleCreateAnimal}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Register New Livestock</h3>
              <button type="button" onClick={() => setShowAddAnimal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Photo upload + Portrait file selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Take/Upload Animal Portrait</label>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 transition"
                >
                  <Camera size={14} className="text-slate-600" />
                  Use Device Camera / Files
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

              {/* Or use quick preset portraits */}
              <div className="flex gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleSimulatePhoto("goat")}
                  className="px-2 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded-lg"
                >
                  Preset Goat
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePhoto("ram")}
                  className="px-2 py-1 bg-blue-50 text-blue-800 text-[10px] font-extrabold rounded-lg"
                >
                  Preset Ram
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePhoto("chicken")}
                  className="px-2 py-1 bg-purple-50 text-purple-800 text-[10px] font-extrabold rounded-lg"
                >
                  Preset Hen
                </button>
              </div>

              {newAnimal.primaryPhoto && (
                <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-emerald-100 mt-2">
                  <img src={newAnimal.primaryPhoto} alt="Snapshot preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                    Portrait Ready
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Species</label>
                <select
                  value={newAnimal.species}
                  onChange={(e) => setNewAnimal({ ...newAnimal, species: e.target.value as Animal["species"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Goat">Goat 🐐</option>
                  <option value="Ram">Ram 🐏</option>
                  <option value="Chicken">Chicken 🐔</option>
                  <option value="Other">Other Species</option>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Date of Birth</label>
                <input
                  type="date"
                  value={newAnimal.dob}
                  onChange={(e) => setNewAnimal({ ...newAnimal, dob: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Source Origin</label>
                <select
                  value={newAnimal.source}
                  onChange={(e) => setNewAnimal({ ...newAnimal, source: e.target.value as Animal["source"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Born on farm">Born on farm</option>
                  <option value="Purchased">Purchased</option>
                  <option value="Other">Other Origin</option>
                </select>
              </div>
            </div>

            {/* Lineage parentage selection */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-dashed">
              <div>
                <label className="text-[9px] font-bold text-slate-500 block">Mother (Optional)</label>
                <select
                  value={newAnimal.motherId}
                  onChange={(e) => setNewAnimal({ ...newAnimal, motherId: e.target.value })}
                  className="w-full p-1.5 bg-white border rounded text-[10px]"
                >
                  <option value="">-- No Record --</option>
                  {animals.filter(a => a.sex === "Female").map(a => (
                    <option key={a.id} value={a.id}>{a.animal_code} {a.name && `(${a.name})`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 block">Father (Optional)</label>
                <select
                  value={newAnimal.fatherId}
                  onChange={(e) => setNewAnimal({ ...newAnimal, fatherId: e.target.value })}
                  className="w-full p-1.5 bg-white border rounded text-[10px]"
                >
                  <option value="">-- No Record --</option>
                  {animals.filter(a => a.sex === "Male").map(a => (
                    <option key={a.id} value={a.id}>{a.animal_code} {a.name && `(${a.name})`}</option>
                  ))}
                </select>
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

      {/* DIALOG 2: LOG HEALTH RECORD */}
      {showAddHealth && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateHealth}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Log Health Event</h3>
              <button type="button" onClick={() => setShowAddHealth(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Pick Animal Profile</label>
              <select
                value={selectedAnimalForHealth}
                onChange={(e) => setSelectedAnimalForHealth(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              >
                <option value="">-- Select Animal --</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.animal_code} {a.name ? `(${a.name})` : `(${a.species})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Record Type</label>
                <select
                  value={newHealth.type}
                  onChange={(e) => setNewHealth({ ...newHealth, type: e.target.value as HealthRecord["type"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Observation">Observation</option>
                  <option value="Diagnosis">Diagnosis</option>
                  <option value="Vaccination">Vaccination</option>
                  <option value="Treatment">Treatment Plan</option>
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
              <label className="text-[10px] font-bold text-slate-500 block">Detailed Symptoms / Diagnosis notes</label>
              <textarea
                rows={3}
                placeholder="Reduced feed consumption, clear nasal discharge noticed in afternoon."
                value={newHealth.details}
                onChange={(e) => setNewHealth({ ...newHealth, details: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Medication Applied (Optional)</label>
              <input
                type="text"
                placeholder="Dewormer / Penicillin spray"
                value={newHealth.medication}
                onChange={(e) => setNewHealth({ ...newHealth, medication: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Commit Health Log to Timeline
            </button>
          </form>
        </div>
      )}

      {/* DIALOG 3: LOG TREATMENT */}
      {showAddTreatment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateTreatment}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Initiate Medical Plan</h3>
              <button type="button" onClick={() => setShowAddTreatment(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Choose Sick Animal</label>
              <select
                value={selectedAnimalForTreatment}
                onChange={(e) => setSelectedAnimalForTreatment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              >
                <option value="">-- Pick Profile --</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>{a.animal_code} {a.name ? `(${a.name})` : `(${a.species})`}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Condition / Disease</label>
                <input
                  type="text"
                  placeholder="e.g. Hoof Rot"
                  value={newTreatment.condition}
                  onChange={(e) => setNewTreatment({ ...newTreatment, condition: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Prescribed Drug</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin spray"
                  value={newTreatment.medication}
                  onChange={(e) => setNewTreatment({ ...newTreatment, medication: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Authorize Rx Treatment & Start Watch
            </button>
          </form>
        </div>
      )}

      {/* DIALOG 4: ADD STORAGE INVENTORY ITEM */}
      {showAddInventory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateInventory}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Inventory Storage</h3>
              <button type="button" onClick={() => setShowAddInventory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Item Name / Brand</label>
              <input
                type="text"
                placeholder="e.g. Maize feed sacks 50kg"
                value={newInventory.name}
                onChange={(e) => setNewInventory({ ...newInventory, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Category</label>
                <select
                  value={newInventory.category}
                  onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value as InventoryItem["category"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Feed">Feed 🌾</option>
                  <option value="Medication">Medication 💊</option>
                  <option value="Equipment">Equipment 🔧</option>
                  <option value="Other">Other Supply</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Measuring Unit</label>
                <input
                  type="text"
                  placeholder="e.g. Bags / Bottles"
                  value={newInventory.unit}
                  onChange={(e) => setNewInventory({ ...newInventory, unit: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Opening Quantity</label>
                <input
                  type="number"
                  value={newInventory.quantity}
                  onChange={(e) => setNewInventory({ ...newInventory, quantity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Low Stock Alert Level</label>
                <input
                  type="number"
                  value={newInventory.minStock}
                  onChange={(e) => setNewInventory({ ...newInventory, minStock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Add Item to Storage
            </button>
          </form>
        </div>
      )}

      {/* DIALOG 5: STOCK ADJUSTMENT FORM */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleAdjustStockSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Adjust stock: {adjustingItem.name}</h3>
              <button type="button" onClick={() => setAdjustingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Adjustment Action</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as "add" | "remove")}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Disburse Stock (-)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Quantity Change ({adjustingItem.unit})</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Purpose / Reason</label>
              <input
                type="text"
                placeholder="Weekly feeding schedule..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Commit Stock Adjustment
            </button>
          </form>
        </div>
      )}

      {/* DIALOG 6: ADD CONTACT */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateContact}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add New Contact</h3>
              <button type="button" onClick={() => setShowAddContact(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Full Name</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Role</label>
                <select
                  value={newContact.role}
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value as Contact["role"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Veterinarian">Veterinarian 🩺</option>
                  <option value="Farm Manager">Farm Manager 🌾</option>
                  <option value="Worker">Worker</option>
                  <option value="Feed Supplier">Feed Supplier</option>
                  <option value="Medication Supplier">Drug Supplier</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Phone Number</label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Add Contact
            </button>
          </form>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (MAX 5 ITEMS ONLY, visible on small screens only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
              activeTab === "dashboard" ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
            }`}
          >
            <Home size={18} />
            <span className="text-[10px] mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("animals")}
            className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
              activeTab === "animals" ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
            }`}
          >
            <span className="text-sm">🐐</span>
            <span className="text-[10px] mt-0.5">Animals</span>
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
              activeTab === "ai" ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
            }`}
          >
            <span className="text-sm">🤖</span>
            <span className="text-[10px] mt-0.5">Farm AI</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
              activeTab === "inventory" ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
            }`}
          >
            <Package size={18} />
            <span className="text-[10px] mt-1">Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center py-1.5 flex-1 transition-all ${
              activeTab === "settings" ? "text-emerald-600 font-extrabold scale-105" : "text-slate-400"
            }`}
          >
            <SettingsIcon size={18} />
            <span className="text-[10px] mt-1">Settings</span>
          </button>
        </div>
      </nav>

    </div>
  );
};

export default Index;