import React, { createContext, useContext, useState, useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface Animal {
  id: string;
  animal_code: string;
  name: string;
  species: "Goat" | "Ram" | "Chicken" | "Other";
  breed: string;
  sex: "Male" | "Female";
  dob: string;
  purchaseDate?: string;
  source: "Born on farm" | "Purchased" | "Other";
  status: "Active" | "Healthy" | "Monitoring" | "Sick" | "Under Treatment" | "Pregnant" | "Sold" | "Deceased" | "Retired";
  healthStatus: "Healthy" | "Monitoring" | "Sick" | "Under Treatment";
  primaryPhoto: string;
  photos: string[];
  parents?: { motherId?: string; fatherId?: string };
  offspring?: string[]; // array of animal IDs
  notes: string;
  created_at: string;
}

export interface HealthRecord {
  id: string;
  animal_id: string;
  type: "Observation" | "Diagnosis" | "Treatment" | "Vaccination" | "Vet Visit";
  date: string;
  details: string;
  medication?: string;
  recordedBy: string;
}

export interface Treatment {
  id: string;
  animal_id: string;
  condition: string;
  medication: string;
  startDate: string;
  endDate: string;
  status: "Ongoing" | "Completed" | "Stopped";
  notes: string;
  followUpDate?: string;
}

export interface WeightRecord {
  id: string;
  animal_id: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface BreedingRecord {
  id: string;
  female_id: string;
  male_id: string;
  date: string;
  status: "Bred" | "Pregnant" | "Gave Birth" | "Resting" | "Failed";
  notes: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Feed" | "Medication" | "Equipment" | "Other";
  quantity: number;
  unit: string;
  minStock: number;
  expiryDate?: string;
  notes?: string;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  quantity: number;
  type: "add" | "remove" | "adjust";
  date: string;
  notes: string;
  recordedBy: string;
}

export interface Contact {
  id: string;
  name: string;
  role: "Veterinarian" | "Farm Manager" | "Worker" | "Feed Supplier" | "Medication Supplier" | "Owner" | "Other";
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: "Vaccination" | "Treatment" | "Breeding" | "Birth" | "Other";
  dueDate: string;
  animal_id?: string;
  completed: boolean;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  date: string;
  actor: string;
  targetId?: string;
}

export interface FarmProfile {
  name: string;
  description: string;
  ownerName: string;
  location: string;
  image: string;
}

export interface UserSession {
  email: string;
  name: string;
  isAuthenticated: boolean;
}

interface FarmContextType {
  animals: Animal[];
  healthRecords: HealthRecord[];
  treatments: Treatment[];
  weightRecords: WeightRecord[];
  breedingRecords: BreedingRecord[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  contacts: Contact[];
  reminders: Reminder[];
  activityLogs: ActivityLog[];
  farmProfile: FarmProfile;
  session: UserSession;
  onboardingCompleted: boolean;
  aiUsage: {
    questionsUsed: number;
    questionsLimit: number;
    imageUsed: number;
    imageLimit: number;
  };
  addAnimal: (animal: Omit<Animal, "id" | "animal_code" | "created_at">) => void;
  updateAnimal: (id: string, updates: Partial<Animal>) => void;
  deleteAnimal: (id: string) => void;
  addHealthRecord: (record: Omit<HealthRecord, "id">) => void;
  addTreatment: (treatment: Omit<Treatment, "id">) => void;
  updateTreatmentStatus: (id: string, status: "Ongoing" | "Completed" | "Stopped") => void;
  addWeightRecord: (record: Omit<WeightRecord, "id">) => void;
  addBreedingRecord: (record: Omit<BreedingRecord, "id">) => void;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => void;
  updateInventoryStock: (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, "id" | "completed">) => void;
  toggleReminder: (id: string) => void;
  logActivity: (type: string, description: string, actor: string, targetId?: string) => void;
  updateFarmProfile: (profile: FarmProfile) => void;
  incrementAiUsage: (type: "text" | "image") => void;
  setOnboardingCompleted: (val: boolean) => void;
  login: (email: string, farmName: string) => boolean;
  signupAndSetup: (email: string, name: string, farmName: string, location: string) => void;
  logout: () => void;
  seedSampleData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const MOCK_IMAGES = {
  goat1: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=500&auto=format&fit=crop&q=80",
  goat2: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80",
  ram: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=500&auto=format&fit=crop&q=80",
  chicken: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&auto=format&fit=crop&q=80",
};

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(false);
  const [farmProfile, setFarmProfile] = useState<FarmProfile>({
    name: "Adam Farms",
    description: "Pedigree multi-species family livestock and feed supply unit.",
    ownerName: "Abdulazeez Adam",
    location: "Kano, Nigeria",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
  });

  const [session, setSession] = useState<UserSession>({
    email: "",
    name: "",
    isAuthenticated: false
  });

  const [aiUsage, setAiUsage] = useState({
    questionsUsed: 3,
    questionsLimit: 10,
    imageUsed: 1,
    imageLimit: 5,
  });

  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const logActivity = async (type: string, description: string, actor: string, targetId?: string) => {
    const log: ActivityLog = {
      id: "l_" + Date.now(),
      type,
      description,
      date: new Date().toISOString(),
      actor,
      targetId,
    };
    setActivityLogs(prev => {
      const next = [log, ...prev].slice(0, 50);
      saveState("farm_logs", next);
      return next;
    });

    if (isSupabaseConfigured()) {
      await supabase.from("activity_logs").insert([{
        id: log.id,
        type: log.type,
        description: log.description,
        date: log.date,
        actor: log.actor,
        target_id: log.targetId
      }]);
    }
  };

  const setOnboardingCompleted = (val: boolean) => {
    setOnboardingCompletedState(val);
    saveState("farm_onboarding_completed", val);
  };

  // Load and sync state on initial load
  useEffect(() => {
    const loadState = async () => {
      // Load local cache as instant fallback
      const storedAnimals = localStorage.getItem("farm_animals");
      const storedHealth = localStorage.getItem("farm_health");
      const storedTreatments = localStorage.getItem("farm_treatments");
      const storedWeight = localStorage.getItem("farm_weights");
      const storedBreeding = localStorage.getItem("farm_breeding");
      const storedInventory = localStorage.getItem("farm_inventory");
      const storedInvTx = localStorage.getItem("farm_inventory_tx");
      const storedContacts = localStorage.getItem("farm_contacts");
      const storedReminders = localStorage.getItem("farm_reminders");
      const storedLogs = localStorage.getItem("farm_logs");
      const storedProfile = localStorage.getItem("farm_profile");
      const storedSession = localStorage.getItem("farm_user_session");
      const storedOnboarding = localStorage.getItem("farm_onboarding_completed");

      if (storedAnimals) setAnimals(JSON.parse(storedAnimals));
      if (storedHealth) setHealthRecords(JSON.parse(storedHealth));
      if (storedTreatments) setTreatments(JSON.parse(storedTreatments));
      if (storedWeight) setWeightRecords(JSON.parse(storedWeight));
      if (storedBreeding) setBreedingRecords(JSON.parse(storedBreeding));
      if (storedInventory) setInventory(JSON.parse(storedInventory));
      if (storedInvTx) setInventoryTransactions(JSON.parse(storedInvTx));
      if (storedContacts) setContacts(JSON.parse(storedContacts));
      if (storedReminders) setReminders(JSON.parse(storedReminders));
      if (storedLogs) setActivityLogs(JSON.parse(storedLogs));
      if (storedProfile) setFarmProfile(JSON.parse(storedProfile));
      if (storedSession) setSession(JSON.parse(storedSession));
      if (storedOnboarding) setOnboardingCompletedState(JSON.parse(storedOnboarding));

      // Attempt to load from Live Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const [
            { data: resAnimals },
            { data: resHealth },
            { data: resTreatments },
            { data: resWeights },
            { data: resBreeding },
            { data: resInventory },
            { data: resContacts },
            { data: resReminders }
          ] = await Promise.all([
            supabase.from("animals").select("*"),
            supabase.from("health_records").select("*"),
            supabase.from("treatments").select("*"),
            supabase.from("weight_records").select("*"),
            supabase.from("breeding_records").select("*"),
            supabase.from("inventory").select("*"),
            supabase.from("contacts").select("*"),
            supabase.from("reminders").select("*")
          ]);

          if (resAnimals) {
            const mapped = resAnimals.map((a: any) => ({
              id: a.id,
              animal_code: a.animal_code,
              name: a.name,
              species: a.species,
              breed: a.breed,
              sex: a.sex,
              dob: a.dob,
              purchaseDate: a.purchase_date,
              source: a.source,
              status: a.status,
              healthStatus: a.health_status,
              primaryPhoto: a.primary_photo,
              photos: a.photos || [],
              notes: a.notes,
              parents: { motherId: a.mother_id, fatherId: a.father_id },
              created_at: a.created_at
            }));
            setAnimals(mapped);
            saveState("farm_animals", mapped);
          }

          if (resHealth) {
            const mapped = resHealth.map((h: any) => ({
              id: h.id,
              animal_id: h.animal_id,
              type: h.type,
              date: h.date,
              details: h.details,
              medication: h.medication,
              recordedBy: h.recorded_by
            }));
            setHealthRecords(mapped);
            saveState("farm_health", mapped);
          }

          if (resTreatments) {
            const mapped = resTreatments.map((t: any) => ({
              id: t.id,
              animal_id: t.animal_id,
              condition: t.condition,
              medication: t.medication,
              startDate: t.start_date,
              endDate: t.end_date,
              status: t.status,
              notes: t.notes,
              followUpDate: t.follow_up_date
            }));
            setTreatments(mapped);
            saveState("farm_treatments", mapped);
          }

          if (resWeights) {
            const mapped = resWeights.map((w: any) => ({
              id: w.id,
              animal_id: w.animal_id,
              weight: parseFloat(w.weight),
              date: w.date,
              notes: w.notes
            }));
            setWeightRecords(mapped);
            saveState("farm_weights", mapped);
          }

          if (resBreeding) {
            const mapped = resBreeding.map((b: any) => ({
              id: b.id,
              female_id: b.female_id,
              male_id: b.male_id,
              date: b.date,
              status: b.status,
              notes: b.notes
            }));
            setBreedingRecords(mapped);
            saveState("farm_breeding", mapped);
          }

          if (resInventory) {
            const mapped = resInventory.map((i: any) => ({
              id: i.id,
              name: i.name,
              category: i.category,
              quantity: parseFloat(i.quantity),
              unit: i.unit,
              minStock: parseFloat(i.min_stock),
              expiryDate: i.expiry_date,
              notes: i.notes
            }));
            setInventory(mapped);
            saveState("farm_inventory", mapped);
          }

          if (resContacts) {
            const mapped = resContacts.map((c: any) => ({
              id: c.id,
              name: c.name,
              role: c.role,
              phone: c.phone,
              whatsapp: c.whatsapp,
              email: c.email,
              address: c.address,
              notes: c.notes
            }));
            setContacts(mapped);
            saveState("farm_contacts", mapped);
          }

          if (resReminders) {
            const mapped = resReminders.map((r: any) => ({
              id: r.id,
              title: r.title,
              type: r.type,
              dueDate: r.due_date,
              animal_id: r.animal_id,
              completed: r.completed,
              notes: r.notes
            }));
            setReminders(mapped);
            saveState("farm_reminders", mapped);
          }

        } catch (err) {
          console.error("Supabase load error, using local fallback state", err);
        }
      } else if (!storedAnimals) {
        seedSampleData();
      }
    };

    loadState();
  }, []);

  const seedSampleData = () => {
    const initialAnimals: Animal[] = [
      {
        id: "a1",
        animal_code: "GOAT-0024",
        name: "Aisha",
        species: "Goat",
        breed: "West African Dwarf",
        sex: "Female",
        dob: "2024-03-12",
        source: "Born on farm",
        status: "Healthy",
        healthStatus: "Healthy",
        primaryPhoto: MOCK_IMAGES.goat1,
        photos: [MOCK_IMAGES.goat1],
        parents: {},
        offspring: ["a4"],
        notes: "Excellent milk yield, highly docile mother.",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a2",
        animal_code: "RAM-0001",
        name: "Sultan",
        species: "Ram",
        breed: "Balami",
        sex: "Male",
        dob: "2023-01-15",
        purchaseDate: "2023-11-20",
        source: "Purchased",
        status: "Active",
        healthStatus: "Healthy",
        primaryPhoto: MOCK_IMAGES.ram,
        photos: [MOCK_IMAGES.ram],
        notes: "Heavyweight stud. Purchased for active ewe breeding runs.",
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a3",
        animal_code: "GOAT-0025",
        name: "Nala",
        species: "Goat",
        breed: "Boer Goat Cross",
        sex: "Female",
        dob: "2024-05-01",
        source: "Born on farm",
        status: "Under Treatment",
        healthStatus: "Under Treatment",
        primaryPhoto: MOCK_IMAGES.goat2,
        photos: [MOCK_IMAGES.goat2],
        notes: "Monitoring response to antiseptic hoof sprays daily.",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    const initialInventory: InventoryItem[] = [
      {
        id: "i1",
        name: "Maize Feed Bags",
        category: "Feed",
        quantity: 12,
        unit: "Bags (50kg)",
        minStock: 5,
        notes: "High quality energy booster feed.",
      },
      {
        id: "i2",
        name: "Broad Spectrum Penicillin",
        category: "Medication",
        quantity: 2,
        unit: "Bottles (100ml)",
        minStock: 3,
        notes: "Keep in cool storage. For veterinary treatment only.",
      }
    ];

    const initialReminders: Reminder[] = [
      {
        id: "r1",
        title: "Hoof rot treatment follow-up",
        type: "Treatment",
        dueDate: "2025-02-25",
        animal_id: "a3",
        completed: false,
        notes: "Inspect hoof moisture levels.",
      }
    ];

    setAnimals(initialAnimals);
    setInventory(initialInventory);
    setReminders(initialReminders);

    saveState("farm_animals", initialAnimals);
    saveState("farm_inventory", initialInventory);
    saveState("farm_reminders", initialReminders);
  };

  const login = (email: string, farmName: string): boolean => {
    const currentProfile = { ...farmProfile, name: farmName || "Adam Farms" };
    setFarmProfile(currentProfile);
    saveState("farm_profile", currentProfile);

    const userSession = {
      email: email,
      name: farmProfile.ownerName,
      isAuthenticated: true
    };
    setSession(userSession);
    saveState("farm_user_session", userSession);
    showSuccess(`Logged into your farm: ${currentProfile.name}`);
    return true;
  };

  const signupAndSetup = (email: string, name: string, farmName: string, location: string) => {
    const updatedProfile: FarmProfile = {
      name: farmName || "Adam Farms",
      description: `Premium agricultural production unit managed by ${name}.`,
      ownerName: name || "Y",
      location: location || "Kano, Nigeria",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
    };
    setFarmProfile(updatedProfile);
    saveState("farm_profile", updatedProfile);

    const userSession = {
      email,
      name,
      isAuthenticated: true
    };
    setSession(userSession);
    saveState("farm_user_session", userSession);

    seedSampleData();
    showSuccess(`Farm setup complete! Welcome to ${farmName}!`);
  };

  const logout = () => {
    const userSession = { email: "", name: "", isAuthenticated: false };
    setSession(userSession);
    saveState("farm_user_session", userSession);
    showSuccess("Logged out of session.");
  };

  const addAnimal = async (animalData: Omit<Animal, "id" | "animal_code" | "created_at">) => {
    const prefix = animalData.species.toUpperCase();
    const speciesAnimals = animals.filter(a => a.species === animalData.species);
    const nextSeq = speciesAnimals.length + 1;
    const padSeq = nextSeq.toString().padStart(4, "0");
    const generatedCode = `${prefix}-${padSeq}`;
    
    const newAnimal: Animal = {
      ...animalData,
      id: "a_" + Date.now(),
      animal_code: generatedCode,
      created_at: new Date().toISOString(),
    };

    const updated = [newAnimal, ...animals];
    setAnimals(updated);
    saveState("farm_animals", updated);

    logActivity("Animal Registered", `Registered ${animalData.species} named ${animalData.name || generatedCode}`, farmProfile.ownerName, newAnimal.id);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("animals").insert([{
          id: newAnimal.id,
          animal_code: newAnimal.animal_code,
          name: newAnimal.name,
          species: newAnimal.species,
          breed: newAnimal.breed,
          sex: newAnimal.sex,
          dob: newAnimal.dob,
          purchase_date: newAnimal.purchaseDate,
          source: newAnimal.source,
          status: newAnimal.status,
          health_status: newAnimal.healthStatus,
          primary_photo: newAnimal.primaryPhoto,
          photos: newAnimal.photos,
          notes: newAnimal.notes,
          mother_id: newAnimal.parents?.motherId,
          father_id: newAnimal.parents?.fatherId
        }]);
      } catch (err) {
        console.error("Supabase insert error", err);
      }
    }
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    const updated = animals.map(a => (a.id === id ? { ...a, ...updates } : a));
    setAnimals(updated);
    saveState("farm_animals", updated);
    logActivity("Animal Updated", `Updated details of ${animals.find(a => a.id === id)?.animal_code}`, farmProfile.ownerName, id);
    showSuccess("Animal updated");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("animals").update({
          name: updates.name,
          breed: updates.breed,
          sex: updates.sex,
          dob: updates.dob,
          purchase_date: updates.purchaseDate,
          source: updates.source,
          status: updates.status,
          health_status: updates.healthStatus,
          primary_photo: updates.primaryPhoto,
          photos: updates.photos,
          notes: updates.notes,
          mother_id: updates.parents?.motherId,
          father_id: updates.parents?.fatherId
        }).eq("id", id);
      } catch (err) {
        console.error("Supabase update error", err);
      }
    }
  };

  const deleteAnimal = async (id: string) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;
    const updated = animals.filter(a => a.id !== id);
    setAnimals(updated);
    saveState("farm_animals", updated);
    logActivity("Animal Removed", `Removed ${animal.animal_code}`, farmProfile.ownerName);
    showSuccess("Animal removed successfully");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("animals").delete().eq("id", id);
      } catch (err) {
        console.error("Supabase delete error", err);
      }
    }
  };

  const addHealthRecord = async (record: Omit<HealthRecord, "id">) => {
    const newRecord: HealthRecord = { ...record, id: "h_" + Date.now() };
    const updated = [newRecord, ...healthRecords];
    setHealthRecords(updated);
    saveState("farm_health", updated);

    let newStatus: Animal["status"] = "Healthy";
    let hStatus: Animal["healthStatus"] = "Healthy";
    if (record.type === "Diagnosis" || record.type === "Observation") {
      newStatus = "Monitoring";
      hStatus = "Monitoring";
    } else if (record.type === "Treatment") {
      newStatus = "Under Treatment";
      hStatus = "Under Treatment";
    }

    setAnimals(prev => {
      const next = prev.map(a => {
        if (a.id === record.animal_id) {
          return { ...a, status: newStatus, healthStatus: hStatus };
        }
        return a;
      });
      saveState("farm_animals", next);
      return next;
    });

    logActivity("Health Logged", `Logged ${record.type} for ${animals.find(a => a.id === record.animal_id)?.animal_code}`, record.recordedBy, record.animal_id);
    showSuccess("Health observation logged");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("health_records").insert([{
          id: newRecord.id,
          animal_id: newRecord.animal_id,
          type: newRecord.type,
          date: newRecord.date,
          details: newRecord.details,
          medication: newRecord.medication,
          recorded_by: newRecord.recordedBy
        }]);
      } catch (err) {
        console.error("Supabase health insert error", err);
      }
    }
  };

  const addTreatment = async (treatmentData: Omit<Treatment, "id">) => {
    const newTx: Treatment = { ...treatmentData, id: "t_" + Date.now() };
    const updated = [newTx, ...treatments];
    setTreatments(updated);
    saveState("farm_treatments", updated);

    setAnimals(prev => {
      const next = prev.map(a => {
        if (a.id === treatmentData.animal_id) {
          return { ...a, status: "Under Treatment", healthStatus: "Under Treatment" };
        }
        return a;
      });
      saveState("farm_animals", next);
      return next;
    });

    logActivity("Treatment Began", `Treatment started for ${treatmentData.condition}`, farmProfile.ownerName, treatmentData.animal_id);
    showSuccess("Treatment registered");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("treatments").insert([{
          id: newTx.id,
          animal_id: newTx.animal_id,
          condition: newTx.condition,
          medication: newTx.medication,
          start_date: newTx.startDate,
          end_date: newTx.endDate,
          status: newTx.status,
          notes: newTx.notes,
          follow_up_date: newTx.followUpDate
        }]);
      } catch (err) {
        console.error("Supabase treatment insert error", err);
      }
    }
  };

  const updateTreatmentStatus = async (id: string, status: "Ongoing" | "Completed" | "Stopped") => {
    const currentTx = treatments.find(t => t.id === id);
    if (!currentTx) return;

    const updated = treatments.map(t => (t.id === id ? { ...t, status } : t));
    setTreatments(updated);
    saveState("farm_treatments", updated);

    if (status === "Completed") {
      setAnimals(prev => {
        const next = prev.map(a => {
          if (a.id === currentTx.animal_id) {
            return { ...a, status: "Healthy", healthStatus: "Healthy" };
          }
          return a;
        });
        saveState("farm_animals", next);
        return next;
      });
    }

    logActivity("Treatment Updated", `Marked treatment as ${status}`, farmProfile.ownerName, currentTx.animal_id);
    showSuccess(`Treatment status: ${status}`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("treatments").update({ status }).eq("id", id);
      } catch (err) {
        console.error("Supabase treatment update error", err);
      }
    }
  };

  const addWeightRecord = async (record: Omit<WeightRecord, "id">) => {
    const newWeight: WeightRecord = { ...record, id: "w_" + Date.now() };
    const updated = [...weightRecords, newWeight];
    setWeightRecords(updated);
    saveState("farm_weights", updated);
    showSuccess("Weight logged");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("weight_records").insert([{
          id: newWeight.id,
          animal_id: newWeight.animal_id,
          weight: newWeight.weight,
          date: newWeight.date,
          notes: newWeight.notes
        }]);
      } catch (err) {
        console.error("Supabase weight insert error", err);
      }
    }
  };

  const addBreedingRecord = async (record: Omit<BreedingRecord, "id">) => {
    const newB: BreedingRecord = { ...record, id: "b_" + Date.now() };
    const updated = [newB, ...breedingRecords];
    setBreedingRecords(updated);
    saveState("farm_breeding", updated);
    showSuccess("Breeding registered");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("breeding_records").insert([{
          id: newB.id,
          female_id: newB.female_id,
          male_id: newB.male_id,
          date: newB.date,
          status: newB.status,
          notes: newB.notes
        }]);
      } catch (err) {
        console.error("Supabase breeding insert error", err);
      }
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    const newItem: InventoryItem = { ...item, id: "i_" + Date.now() };
    const updated = [...inventory, newItem];
    setInventory(updated);
    saveState("farm_inventory", updated);
    showSuccess("Inventory item created");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("inventory").insert([{
          id: newItem.id,
          name: newItem.name,
          category: newItem.category,
          quantity: newItem.quantity,
          unit: newItem.unit,
          min_stock: newItem.minStock,
          notes: newItem.notes
        }]);
      } catch (err) {
        console.error("Supabase inventory insert error", err);
      }
    }
  };

  const updateInventoryStock = async (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    let nextQty = item.quantity;
    if (type === "add") nextQty += qtyChange;
    if (type === "remove") nextQty -= qtyChange;
    if (type === "adjust") nextQty = qtyChange;

    if (nextQty < 0) {
      showError("Stock cannot fall below 0 units");
      return;
    }

    const updated = inventory.map(i => (i.id === itemId ? { ...i, quantity: nextQty } : i));
    setInventory(updated);
    saveState("farm_inventory", updated);
    showSuccess("Storage stock adjusted");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("inventory").update({ quantity: nextQty }).eq("id", itemId);
      } catch (err) {
        console.error("Supabase inventory update error", err);
      }
    }
  };

  const addContact = async (contact: Omit<Contact, "id">) => {
    const newC: Contact = { ...contact, id: "c_" + Date.now() };
    const updated = [...contacts, newC];
    setContacts(updated);
    saveState("farm_contacts", updated);
    showSuccess("Contact saved");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("contacts").insert([{
          id: newC.id,
          name: newC.name,
          role: newC.role,
          phone: newC.phone,
          whatsapp: newC.whatsapp,
          email: newC.email,
          address: newC.address,
          notes: newC.notes
        }]);
      } catch (err) {
        console.error("Supabase contact insert error", err);
      }
    }
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map(c => (c.id === id ? { ...c, ...updates } : c));
    setContacts(updated);
    saveState("farm_contacts", updated);
  };

  const deleteContact = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveState("farm_contacts", updated);
    showSuccess("Contact removed");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("contacts").delete().eq("id", id);
      } catch (err) {
        console.error("Supabase contact delete error", err);
      }
    }
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "completed">) => {
    const newR: Reminder = { ...reminder, id: "r_" + Date.now(), completed: false };
    const updated = [newR, ...reminders];
    setReminders(updated);
    saveState("farm_reminders", updated);
    showSuccess("Reminder set");

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("reminders").insert([{
          id: newR.id,
          title: newR.title,
          type: newR.type,
          due_date: newR.dueDate,
          animal_id: newR.animal_id,
          completed: newR.completed,
          notes: newR.notes
        }]);
      } catch (err) {
        console.error("Supabase reminder insert error", err);
      }
    }
  };

  const toggleReminder = async (id: string) => {
    const rItem = reminders.find(r => r.id === id);
    if (!rItem) return;
    const nextVal = !rItem.completed;

    const updated = reminders.map(r => (r.id === id ? { ...r, completed: nextVal } : r));
    setReminders(updated);
    saveState("farm_reminders", updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from("reminders").update({ completed: nextVal }).eq("id", id);
      } catch (err) {
        console.error("Supabase reminder toggle error", err);
      }
    }
  };

  const updateFarmProfile = (profile: FarmProfile) => {
    setFarmProfile(profile);
    saveState("farm_profile", profile);
    showSuccess("Farm profile updated");
  };

  const incrementAiUsage = (type: "text" | "image") => {
    setAiUsage(prev => {
      const next = { ...prev };
      if (type === "text") {
        next.questionsUsed = Math.min(next.questionsLimit, next.questionsUsed + 1);
      } else {
        next.imageUsed = Math.min(next.imageLimit, next.imageUsed + 1);
      }
      saveState("farm_ai_usage", next);
      return next;
    });
  };

  return (
    <FarmContext.Provider
      value={{
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
        updateContact,
        deleteContact,
        addReminder,
        toggleReminder,
        logActivity,
        updateFarmProfile,
        incrementAiUsage,
        setOnboardingCompleted,
        login,
        signupAndSetup,
        logout,
        seedSampleData,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
};