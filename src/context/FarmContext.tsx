import React, { createContext, useContext, useState, useEffect } from "react";
import { showSuccess, showError } from "@/utils/toast";

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

  // Hoist utility functions to the top of the provider body so they are immediately available
  const saveState = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const logActivity = (type: string, description: string, actor: string, targetId?: string) => {
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
  };

  const setOnboardingCompleted = (val: boolean) => {
    setOnboardingCompletedState(val);
    saveState("farm_onboarding_completed", val);
  };

  // Load state and mock session from local storage on startup
  useEffect(() => {
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
    const storedAi = localStorage.getItem("farm_ai_usage");
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
    if (storedAi) setAiUsage(JSON.parse(storedAi));
    if (storedSession) setSession(JSON.parse(storedSession));
    if (storedOnboarding) setOnboardingCompletedState(JSON.parse(storedOnboarding));

    // Seed defaults if totally brand new
    if (!storedAnimals) {
      seedSampleData();
    }
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
      },
      {
        id: "a4",
        animal_code: "GOAT-0026",
        name: "Toto",
        species: "Goat",
        breed: "West African Dwarf Cross",
        sex: "Male",
        dob: "2025-01-10",
        source: "Born on farm",
        status: "Healthy",
        healthStatus: "Healthy",
        primaryPhoto: "https://images.unsplash.com/photo-1533048324814-79b0a3173db9?w=500&auto=format&fit=crop&q=80",
        photos: ["https://images.unsplash.com/photo-1533048324814-79b0a3173db9?w=500&auto=format&fit=crop&q=80"],
        parents: { motherId: "a1", fatherId: "a2" },
        notes: "Strong kid growing exceptionally well.",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "a5",
        animal_code: "CHICK-0001",
        name: "Layer flock B",
        species: "Chicken",
        breed: "Noiler",
        sex: "Female",
        dob: "2024-09-10",
        source: "Purchased",
        status: "Monitoring",
        healthStatus: "Monitoring",
        primaryPhoto: MOCK_IMAGES.chicken,
        photos: [MOCK_IMAGES.chicken],
        notes: "Group observation.",
        created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    const initialHealth: HealthRecord[] = [
      {
        id: "h1",
        animal_id: "a3",
        type: "Diagnosis",
        date: "2025-02-18",
        details: "Hoof rot suspected due to wet pasture bedding.",
        medication: "Copper Sulphate Wash & Penicillin spray",
        recordedBy: "Abdulazeez Adam",
      },
      {
        id: "h2",
        animal_id: "a1",
        type: "Vaccination",
        date: "2024-12-05",
        details: "PPR vaccine booster administered successfully.",
        medication: "PPR vaccine",
        recordedBy: "Y",
      }
    ];

    const initialTreatments: Treatment[] = [
      {
        id: "t1",
        animal_id: "a3",
        condition: "Hoof decay",
        medication: "Antiseptic spray",
        startDate: "2025-02-18",
        endDate: "2025-02-28",
        status: "Ongoing",
        notes: "Isolate in clean dry pen.",
        followUpDate: "2025-02-25",
      }
    ];

    const initialWeights: WeightRecord[] = [
      { id: "w1", animal_id: "a1", weight: 18.5, date: "2024-10-01" },
      { id: "w2", animal_id: "a1", weight: 22.1, date: "2025-01-10" },
      { id: "w3", animal_id: "a2", weight: 65.0, date: "2024-12-01" },
      { id: "w4", animal_id: "a2", weight: 70.2, date: "2025-02-05" }
    ];

    const initialBreeding: BreedingRecord[] = [
      {
        id: "b1",
        female_id: "a1",
        male_id: "a2",
        date: "2024-08-12",
        status: "Gave Birth",
        notes: "Produced healthy male kid GOAT-0026.",
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
      },
      {
        id: "i3",
        name: "Gravity Chicken Feeder",
        category: "Equipment",
        quantity: 8,
        unit: "Units",
        minStock: 2,
        notes: "Standard poultry yard feeders.",
      }
    ];

    const initialInvTx: InventoryTransaction[] = [
      {
        id: "tx1",
        item_id: "i1",
        quantity: 15,
        type: "add",
        date: "2025-02-10",
        notes: "Feed supply restock",
        recordedBy: "Y",
      }
    ];

    const initialContacts: Contact[] = [
      {
        id: "c1",
        name: "Dr. Ibrahim Bello",
        role: "Veterinarian",
        phone: "+234 803 111 2222",
        whatsapp: "+234 803 111 2222",
        email: "bellovet@gmail.com",
        address: "Zaria Road, Kano",
        notes: "Chief livestock consultant.",
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
      },
      {
        id: "r2",
        title: "PPR vaccine booster - Toto",
        type: "Vaccination",
        dueDate: "2025-03-10",
        animal_id: "a4",
        completed: false,
      }
    ];

    const initialLogs: ActivityLog[] = [
      {
        id: "l1",
        type: "Animal Added",
        description: "Registered Toto (GOAT-0026) offspring of Aisha.",
        date: "2025-01-10T08:30:00Z",
        actor: "Y",
        targetId: "a4",
      }
    ];

    setAnimals(initialAnimals);
    setHealthRecords(initialHealth);
    setTreatments(initialTreatments);
    setWeightRecords(initialWeights);
    setBreedingRecords(initialBreeding);
    setInventory(initialInventory);
    setInventoryTransactions(initialInvTx);
    setContacts(initialContacts);
    setReminders(initialReminders);
    setActivityLogs(initialLogs);

    saveState("farm_animals", initialAnimals);
    saveState("farm_health", initialHealth);
    saveState("farm_treatments", initialTreatments);
    saveState("farm_weights", initialWeights);
    saveState("farm_breeding", initialBreeding);
    saveState("farm_inventory", initialInventory);
    saveState("farm_inventory_tx", initialInvTx);
    saveState("farm_contacts", initialContacts);
    saveState("farm_reminders", initialReminders);
    saveState("farm_logs", initialLogs);
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

  const addAnimal = (animalData: Omit<Animal, "id" | "animal_code" | "created_at">) => {
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

    // Establish lineage relationships
    if (animalData.parents?.motherId) {
      setAnimals(prev => {
        const revised = prev.map(a => {
          if (a.id === animalData.parents?.motherId) {
            return {
              ...a,
              offspring: [...(a.offspring || []), newAnimal.id],
            };
          }
          return a;
        });
        saveState("farm_animals", revised);
        return revised;
      });
    }
    if (animalData.parents?.fatherId) {
      setAnimals(prev => {
        const revised = prev.map(a => {
          if (a.id === animalData.parents?.fatherId) {
            return {
              ...a,
              offspring: [...(a.offspring || []), newAnimal.id],
            };
          }
          return a;
        });
        saveState("farm_animals", revised);
        return revised;
      });
    }

    logActivity("Animal Registered", `Registered ${animalData.species} named ${animalData.name || generatedCode}`, farmProfile.ownerName, newAnimal.id);
  };

  const updateAnimal = (id: string, updates: Partial<Animal>) => {
    const updated = animals.map(a => (a.id === id ? { ...a, ...updates } : a));
    setAnimals(updated);
    saveState("farm_animals", updated);
    logActivity("Animal Updated", `Updated details of ${animals.find(a => a.id === id)?.animal_code}`, farmProfile.ownerName, id);
    showSuccess("Animal updated");
  };

  const deleteAnimal = (id: string) => {
    const animal = animals.find(a => a.id === id);
    if (!animal) return;
    const updated = animals.filter(a => a.id !== id);
    setAnimals(updated);
    saveState("farm_animals", updated);
    logActivity("Animal Removed", `Removed ${animal.animal_code}`, farmProfile.ownerName);
    showSuccess("Animal removed successfully");
  };

  const addHealthRecord = (record: Omit<HealthRecord, "id">) => {
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
  };

  const addTreatment = (treatmentData: Omit<Treatment, "id">) => {
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
  };

  const updateTreatmentStatus = (id: string, status: "Ongoing" | "Completed" | "Stopped") => {
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
  };

  const addWeightRecord = (record: Omit<WeightRecord, "id">) => {
    const newWeight: WeightRecord = { ...record, id: "w_" + Date.now() };
    const updated = [...weightRecords, newWeight];
    setWeightRecords(updated);
    saveState("farm_weights", updated);
    showSuccess("Weight logged");
  };

  const addBreedingRecord = (record: Omit<BreedingRecord, "id">) => {
    const newB: BreedingRecord = { ...record, id: "b_" + Date.now() };
    const updated = [newB, ...breedingRecords];
    setBreedingRecords(updated);
    saveState("farm_breeding", updated);
    showSuccess("Breeding registered");
  };

  const addInventoryItem = (item: Omit<InventoryItem, "id">) => {
    const newItem: InventoryItem = { ...item, id: "i_" + Date.now() };
    const updated = [...inventory, newItem];
    setInventory(updated);
    saveState("farm_inventory", updated);
    showSuccess("Inventory item created");
  };

  const updateInventoryStock = (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => {
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

    const newTx: InventoryTransaction = {
      id: "tx_" + Date.now(),
      item_id: itemId,
      quantity: qtyChange,
      type,
      date: new Date().toISOString().split("T")[0],
      notes,
      recordedBy,
    };
    const nextTx = [newTx, ...inventoryTransactions];
    setInventoryTransactions(nextTx);
    saveState("farm_inventory_tx", nextTx);

    showSuccess("Storage stock adjusted");
  };

  const addContact = (contact: Omit<Contact, "id">) => {
    const newC: Contact = { ...contact, id: "c_" + Date.now() };
    const updated = [...contacts, newC];
    setContacts(updated);
    saveState("farm_contacts", updated);
    showSuccess("Contact saved");
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map(c => (c.id === id ? { ...c, ...updates } : c));
    setContacts(updated);
    saveState("farm_contacts", updated);
  };

  const deleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    saveState("farm_contacts", updated);
    showSuccess("Contact removed");
  };

  const addReminder = (reminder: Omit<Reminder, "id" | "completed">) => {
    const newR: Reminder = { ...reminder, id: "r_" + Date.now(), completed: false };
    const updated = [newR, ...reminders];
    setReminders(updated);
    saveState("farm_reminders", updated);
    showSuccess("Reminder set");
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => (r.id === id ? { ...r, completed: !r.completed } : r));
    setReminders(updated);
    saveState("farm_reminders", updated);
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