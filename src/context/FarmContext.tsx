"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";

export const DEFAULT_ANIMAL_PHOTO = "/placeholder.svg";

export const normalizeFarmName = (name: string): string => {
  if (!name) return "";
  let trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  trimmed = trimmed.replace(/(\s+farm)+$/i, "");
  return `${trimmed} Farm`;
};

export interface OwnershipData {
  ownershipType: "Farm Owned" | "Client Owned";
  ownerName?: string;
  custodian?: string;
  agreement?: string;
}

export const parseOwnershipFromNotes = (rawNotes: string = ""): { ownership: OwnershipData; cleanNotes: string } => {
  const tagMatch = rawNotes.match(/\[OWNERSHIP_DATA:(.*?)\]/);
  if (!tagMatch) {
    return {
      ownership: { ownershipType: "Farm Owned" },
      cleanNotes: rawNotes
    };
  }
  try {
    const data = JSON.parse(tagMatch[1]);
    const cleanNotes = rawNotes.replace(/\[OWNERSHIP_DATA:.*?\]/, "").trim();
    return {
      ownership: {
        ownershipType: data.ownershipType === "Client Owned" ? "Client Owned" : "Farm Owned",
        ownerName: data.ownerName || undefined,
        custodian: data.custodian || undefined,
        agreement: data.agreement || undefined,
      },
      cleanNotes
    };
  } catch {
    return {
      ownership: { ownershipType: "Farm Owned" },
      cleanNotes: rawNotes
    };
  }
};

export const encodeOwnershipIntoNotes = (ownership: OwnershipData, cleanNotes: string = ""): string => {
  const strippedNotes = cleanNotes.replace(/\[OWNERSHIP_DATA:.*?\]/, "").trim();
  if (ownership.ownershipType === "Farm Owned") {
    const tag = JSON.stringify({ ownershipType: "Farm Owned" });
    return strippedNotes ? `${strippedNotes}\n[OWNERSHIP_DATA:${tag}]` : `[OWNERSHIP_DATA:${tag}]`;
  }
  const tag = JSON.stringify({
    ownershipType: "Client Owned",
    ownerName: ownership.ownerName || "",
    custodian: ownership.custodian || "",
    agreement: ownership.agreement || ""
  });
  return strippedNotes ? `${strippedNotes}\n[OWNERSHIP_DATA:${tag}]` : `[OWNERSHIP_DATA:${tag}]`;
};

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
  offspring?: string[];
  ownershipType?: "Farm Owned" | "Client Owned";
  ownerName?: string;
  custodian?: string;
  agreement?: string;
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

export interface FarmNote {
  id: string;
  farm_id?: string;
  title?: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnimalNote {
  id: string;
  animal_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
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
  email?: string;
}

export interface UserSession {
  userId?: string;
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
  farmNotes: FarmNote[];
  animalNotes: AnimalNote[];
  activityLogs: ActivityLog[];
  farmProfile: FarmProfile;
  session: UserSession;
  onboardingCompleted: boolean;
  isLoadingData: boolean;
  isAuthReady: boolean;
  aiUsage: {
    questionsUsed: number;
    questionsLimit: number;
    imageUsed: number;
    imageLimit: number;
  };
  loadAccount: (force?: boolean) => Promise<void>;
  loadDashboardData: (force?: boolean) => Promise<void>;
  loadAnimals: (force?: boolean) => Promise<void>;
  loadAnimalProfile: (animalId: string, force?: boolean) => Promise<void>;
  loadInventory: (force?: boolean) => Promise<void>;
  loadFarmNotes: (force?: boolean) => Promise<void>;
  loadContacts: (force?: boolean) => Promise<void>;
  addAnimal: (animal: Omit<Animal, "id" | "animal_code" | "created_at">) => Promise<void>;
  updateAnimal: (id: string, updates: Partial<Animal>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  addHealthRecord: (record: Omit<HealthRecord, "id">) => Promise<void>;
  addTreatment: (treatment: Omit<Treatment, "id">) => Promise<void>;
  updateTreatmentStatus: (id: string, status: "Ongoing" | "Completed" | "Stopped") => Promise<void>;
  addWeightRecord: (record: Omit<WeightRecord, "id">) => Promise<void>;
  addBreedingRecord: (record: Omit<BreedingRecord, "id">) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, "id">) => Promise<void>;
  updateInventoryStock: (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addContact: (contact: Omit<Contact, "id">) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, "id" | "completed">) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addFarmNote: (note: { title?: string; content: string }) => Promise<boolean>;
  updateFarmNote: (id: string, updates: { title?: string; content: string }) => Promise<boolean>;
  deleteFarmNote: (id: string) => Promise<boolean>;
  addAnimalNote: (note: { animal_id: string; content: string }) => Promise<boolean>;
  updateAnimalNote: (id: string, content: string) => Promise<boolean>;
  deleteAnimalNote: (id: string) => Promise<boolean>;
  logActivity: (type: string, description: string, actor: string, targetId?: string) => Promise<void>;
  updateFarmProfile: (profile: FarmProfile) => Promise<boolean>;
  changeAccountPassword: (newPassword: string) => Promise<boolean>;
  requestPasswordReset: (identifierOrEmail: string) => Promise<boolean>;
  incrementAiUsage: (type: "text" | "image") => void;
  setOnboardingCompleted: (val: boolean) => void;
  login: (identifier: string, password: string) => Promise<boolean>;
  signupAndSetup: (email: string, password: string, name: string, farmName: string, location: string) => Promise<boolean>;
  logout: () => Promise<void>;
  seedSampleData: () => void;
  resetDatabase: () => void;
  reloadFarmData: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

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
  const [farmNotes, setFarmNotes] = useState<FarmNote[]>([]);
  const [animalNotes, setAnimalNotes] = useState<AnimalNote[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(false);
  
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // In-memory caching & flight guard refs
  const hasLoadedAccountRef = useRef<boolean>(false);
  const hasLoadedDashboardRef = useRef<boolean>(false);
  const hasLoadedAnimalsRef = useRef<boolean>(false);
  const hasLoadedInventoryRef = useRef<boolean>(false);
  const hasLoadedFarmNotesRef = useRef<boolean>(false);
  const hasLoadedContactsRef = useRef<boolean>(false);

  const fetchingAccountRef = useRef<boolean>(false);
  const fetchingDashboardRef = useRef<boolean>(false);
  const fetchingAnimalsRef = useRef<boolean>(false);
  const fetchingInventoryRef = useRef<boolean>(false);
  const fetchingFarmNotesRef = useRef<boolean>(false);
  const fetchingContactsRef = useRef<boolean>(false);
  const fetchingAnimalProfileRef = useRef<string | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);

  const [accountId, setAccountId] = useState<string | null>(null);
  
  const [farmProfile, setFarmProfile] = useState<FarmProfile>({
    name: "My Farm",
    description: "Agricultural production unit.",
    ownerName: "Operator",
    location: "Kano, Nigeria",
    image: "/placeholder.svg",
    email: "",
  });

  const [session, setSession] = useState<UserSession>({
    userId: undefined,
    email: "",
    name: "",
    isAuthenticated: false
  });

  const [aiUsage, setAiUsage] = useState({
    questionsUsed: 0,
    questionsLimit: 10,
    imageUsed: 0,
    imageLimit: 5,
  });

  const setOnboardingCompleted = (val: boolean) => {
    setOnboardingCompletedState(val);
    localStorage.setItem("farm_v2_onboarding_completed", JSON.stringify(val));
  };

  const clearSessionCache = useCallback(() => {
    hasLoadedAccountRef.current = false;
    hasLoadedDashboardRef.current = false;
    hasLoadedAnimalsRef.current = false;
    hasLoadedInventoryRef.current = false;
    hasLoadedFarmNotesRef.current = false;
    hasLoadedContactsRef.current = false;

    fetchingAccountRef.current = false;
    fetchingDashboardRef.current = false;
    fetchingAnimalsRef.current = false;
    fetchingInventoryRef.current = false;
    fetchingFarmNotesRef.current = false;
    fetchingContactsRef.current = false;
    fetchingAnimalProfileRef.current = null;
  }, []);

  const loadAccount = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedAccountRef.current && !force) return;
    if (fetchingAccountRef.current) return;
    fetchingAccountRef.current = true;

    try {
      const { data } = await supabase
        .from("accounts")
        .select("id, farm_name, operator_name, email, location")
        .limit(1)
        .maybeSingle();

      if (data) {
        setAccountId(data.id);
        setFarmProfile(prev => ({
          ...prev,
          name: data.farm_name || prev.name,
          ownerName: data.operator_name || prev.ownerName,
          location: data.location || prev.location,
          email: data.email || session.email || prev.email
        }));
        hasLoadedAccountRef.current = true;
      }
    } catch (err) {
      console.error("[FarmContext] Account fetch error:", err);
    } finally {
      fetchingAccountRef.current = false;
    }
  }, [session.isAuthenticated, session.email]);

  const loadDashboardData = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedDashboardRef.current && !force) return;
    if (fetchingDashboardRef.current) return;
    fetchingDashboardRef.current = true;

    try {
      const [
        acctRes,
        resAnimals,
        resTreatments,
        resInventory,
        resReminders,
        resFarmNotes,
        resLogs
      ] = await Promise.all([
        supabase.from("accounts").select("id, farm_name, operator_name, email, location").limit(1).maybeSingle(),
        supabase.from("animals").select("id, animal_code, name, species, sex, status, health_status, notes"),
        supabase.from("treatments").select("id, animal_id, condition, medication, start_date, end_date, status, follow_up_date").eq("status", "Ongoing"),
        supabase.from("inventory").select("id, name, category, quantity, unit, min_stock"),
        supabase.from("reminders").select("id, title, type, due_date, animal_id, completed, notes").eq("completed", false),
        supabase.from("farm_notes").select("id, farm_id, title, content, created_by, created_at, updated_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("activity_logs").select("id, type, description, date, actor, target_id").order("date", { ascending: false }).limit(10)
      ]);

      if (acctRes.data) {
        setAccountId(acctRes.data.id);
        setFarmProfile(prev => ({
          ...prev,
          name: acctRes.data.farm_name || prev.name,
          ownerName: acctRes.data.operator_name || prev.ownerName,
          location: acctRes.data.location || prev.location,
          email: acctRes.data.email || session.email || prev.email
        }));
        hasLoadedAccountRef.current = true;
      }

      if (resAnimals.data) {
        setAnimals(prev => {
          if (prev.length > 0) return prev;
          return resAnimals.data.map((a: any) => {
            const { ownership, cleanNotes } = parseOwnershipFromNotes(a.notes || "");
            return {
              id: a.id,
              animal_code: a.animal_code,
              name: a.name || "",
              species: a.species,
              breed: "",
              sex: a.sex,
              dob: "",
              source: "Born on farm",
              status: a.status,
              healthStatus: a.health_status,
              primaryPhoto: DEFAULT_ANIMAL_PHOTO,
              photos: [DEFAULT_ANIMAL_PHOTO],
              ownershipType: ownership.ownershipType,
              ownerName: ownership.ownerName,
              custodian: ownership.custodian,
              agreement: ownership.agreement,
              notes: cleanNotes,
              created_at: new Date().toISOString()
            };
          });
        });
      }

      if (resTreatments.data) {
        setTreatments(resTreatments.data.map((t: any) => ({
          id: t.id,
          animal_id: t.animal_id,
          condition: t.condition,
          medication: t.medication,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          notes: t.notes || "",
          followUpDate: t.follow_up_date
        })));
      }

      if (resInventory.data) {
        setInventory(prev => {
          if (prev.length > 0) return prev;
          return resInventory.data.map((i: any) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            minStock: parseFloat(i.min_stock)
          }));
        });
      }

      if (resReminders.data) {
        setReminders(resReminders.data.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          dueDate: r.due_date,
          animal_id: r.animal_id,
          completed: r.completed,
          notes: r.notes
        })));
      }

      if (resFarmNotes.data && !resFarmNotes.error) {
        setFarmNotes(prev => {
          if (prev.length > 0) return prev;
          return resFarmNotes.data.map((fn: any) => ({
            id: fn.id,
            farm_id: fn.farm_id,
            title: fn.title,
            content: fn.content,
            created_by: fn.created_by || "Operator",
            created_at: fn.created_at || new Date().toISOString(),
            updated_at: fn.updated_at || new Date().toISOString()
          }));
        });
      }

      if (resLogs.data) {
        setActivityLogs(resLogs.data.map((l: any) => ({
          id: l.id,
          type: l.type,
          description: l.description,
          date: l.date,
          actor: l.actor,
          targetId: l.target_id
        })));
      }

      hasLoadedDashboardRef.current = true;
    } catch (err) {
      console.error("[FarmContext] Dashboard load error:", err);
    } finally {
      fetchingDashboardRef.current = false;
    }
  }, [session.isAuthenticated, session.email]);

  const loadAnimals = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedAnimalsRef.current && !force) return;
    if (fetchingAnimalsRef.current) return;
    fetchingAnimalsRef.current = true;

    try {
      let { data, error } = await supabase
        .from("animals")
        .select("id, animal_code, name, species, breed, sex, dob, purchase_date, source, status, health_status, primary_photo, photos, mother_id, father_id, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        const fallbackRes = await supabase
          .from("animals")
          .select("id, animal_code, name, species, breed, sex, dob, purchase_date, source, status, health_status, primary_photo, mother_id, father_id, notes, created_at")
          .order("created_at", { ascending: false });

        data = fallbackRes.data as any;
        error = fallbackRes.error as any;
      }

      if (!error && data) {
        setAnimals(data.map((a: any) => {
          const { ownership, cleanNotes } = parseOwnershipFromNotes(a.notes || "");
          return {
            id: a.id,
            animal_code: a.animal_code,
            name: a.name || "",
            species: a.species,
            breed: a.breed || "Local Breed",
            sex: a.sex,
            dob: a.dob || "",
            purchaseDate: a.purchase_date,
            source: a.source || "Born on farm",
            status: a.status || "Healthy",
            healthStatus: a.health_status || "Healthy",
            primaryPhoto: a.primary_photo || DEFAULT_ANIMAL_PHOTO,
            photos: (a.photos && Array.isArray(a.photos) && a.photos.length > 0) ? a.photos : [a.primary_photo || DEFAULT_ANIMAL_PHOTO],
            ownershipType: ownership.ownershipType,
            ownerName: ownership.ownerName,
            custodian: ownership.custodian,
            agreement: ownership.agreement,
            notes: cleanNotes,
            parents: { motherId: a.mother_id, fatherId: a.father_id },
            created_at: a.created_at || new Date().toISOString()
          };
        }));
        hasLoadedAnimalsRef.current = true;
      }
    } catch (err) {
      console.error("[FarmContext] Load animals unexpected error:", err);
    } finally {
      fetchingAnimalsRef.current = false;
    }
  }, [session.isAuthenticated]);

  const loadAnimalProfile = useCallback(async (animalId: string, force = false) => {
    if (!animalId || !session.isAuthenticated) return;
    if (fetchingAnimalProfileRef.current === animalId && !force) return;
    fetchingAnimalProfileRef.current = animalId;

    try {
      const [resAnimal, resHealth, resTreatments, resWeights, resBreeding, resNotes, resLogs] = await Promise.all([
        supabase.from("animals").select("*").eq("id", animalId).maybeSingle(),
        supabase.from("health_records").select("*").eq("animal_id", animalId).order("date", { ascending: false }),
        supabase.from("treatments").select("*").eq("animal_id", animalId).order("start_date", { ascending: false }),
        supabase.from("weight_records").select("*").eq("animal_id", animalId).order("date", { ascending: true }),
        supabase.from("breeding_records").select("*").or(`female_id.eq.${animalId},male_id.eq.${animalId}`).order("date", { ascending: false }),
        supabase.from("animal_notes").select("*").eq("animal_id", animalId).order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").eq("target_id", animalId).order("date", { ascending: false }).limit(20)
      ]);

      if (resAnimal.data) {
        const a = resAnimal.data;
        const { ownership, cleanNotes } = parseOwnershipFromNotes(a.notes || "");
        const loadedAnimal: Animal = {
          id: a.id,
          animal_code: a.animal_code,
          name: a.name || "",
          species: a.species,
          breed: a.breed,
          sex: a.sex,
          dob: a.dob,
          purchaseDate: a.purchase_date,
          source: a.source,
          status: a.status,
          healthStatus: a.health_status,
          primaryPhoto: a.primary_photo || DEFAULT_ANIMAL_PHOTO,
          photos: (a.photos && a.photos.length > 0) ? a.photos : [DEFAULT_ANIMAL_PHOTO],
          ownershipType: ownership.ownershipType,
          ownerName: ownership.ownerName,
          custodian: ownership.custodian,
          agreement: ownership.agreement,
          notes: cleanNotes,
          parents: { motherId: a.mother_id, fatherId: a.father_id },
          created_at: a.created_at
        };

        setAnimals(prev => {
          const exists = prev.some(item => item.id === animalId);
          if (exists) return prev.map(item => item.id === animalId ? loadedAnimal : item);
          return [...prev, loadedAnimal];
        });
      }

      if (resHealth.data) {
        setHealthRecords(resHealth.data.map((h: any) => ({
          id: h.id,
          animal_id: h.animal_id,
          type: h.type,
          date: h.date,
          details: h.details,
          medication: h.medication,
          recordedBy: h.recorded_by
        })));
      }

      if (resTreatments.data) {
        setTreatments(prev => {
          const other = prev.filter(t => t.animal_id !== animalId);
          const current = resTreatments.data.map((t: any) => ({
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
          return [...other, ...current];
        });
      }

      if (resWeights.data) {
        setWeightRecords(resWeights.data.map((w: any) => ({
          id: w.id,
          animal_id: w.animal_id,
          weight: parseFloat(w.weight),
          date: w.date,
          notes: w.notes
        })));
      }

      if (resBreeding.data) {
        setBreedingRecords(resBreeding.data.map((b: any) => ({
          id: b.id,
          female_id: b.female_id,
          male_id: b.male_id,
          date: b.date,
          status: b.status,
          notes: b.notes
        })));
      }

      if (resNotes.data) {
        setAnimalNotes(resNotes.data.map((an: any) => ({
          id: an.id,
          animal_id: an.animal_id,
          content: an.content,
          created_by: an.created_by || "Operator",
          created_at: an.created_at || new Date().toISOString(),
          updated_at: an.updated_at || new Date().toISOString()
        })));
      }

      if (resLogs.data) {
        setActivityLogs(resLogs.data.map((l: any) => ({
          id: l.id,
          type: l.type,
          description: l.description,
          date: l.date,
          actor: l.actor,
          targetId: l.target_id
        })));
      }
    } finally {
      fetchingAnimalProfileRef.current = null;
    }
  }, [session.isAuthenticated]);

  const loadInventory = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedInventoryRef.current && !force) return;
    if (fetchingInventoryRef.current) return;
    fetchingInventoryRef.current = true;

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, category, quantity, unit, min_stock, expiry_date, notes");

      if (!error && data) {
        setInventory(data.map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          minStock: parseFloat(i.min_stock),
          expiryDate: i.expiry_date,
          notes: i.notes
        })));
        hasLoadedInventoryRef.current = true;
      }
    } finally {
      fetchingInventoryRef.current = false;
    }
  }, [session.isAuthenticated]);

  const loadFarmNotes = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedFarmNotesRef.current && !force) return;
    if (fetchingFarmNotesRef.current) return;
    fetchingFarmNotesRef.current = true;

    try {
      const { data, error } = await supabase
        .from("farm_notes")
        .select("id, farm_id, title, content, created_by, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFarmNotes(data.map((fn: any) => ({
          id: fn.id,
          farm_id: fn.farm_id,
          title: fn.title,
          content: fn.content,
          created_by: fn.created_by || "Operator",
          created_at: fn.created_at || new Date().toISOString(),
          updated_at: fn.updated_at || new Date().toISOString()
        })));
        hasLoadedFarmNotesRef.current = true;
      }
    } finally {
      fetchingFarmNotesRef.current = false;
    }
  }, [session.isAuthenticated]);

  const loadContacts = useCallback(async (force = false) => {
    if (!session.isAuthenticated) return;
    if (hasLoadedContactsRef.current && !force) return;
    if (fetchingContactsRef.current) return;
    fetchingContactsRef.current = true;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, role, phone, whatsapp, email, address, notes");

      if (!error && data) {
        setContacts(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          address: c.address,
          notes: c.notes
        })));
        hasLoadedContactsRef.current = true;
      }
    } finally {
      fetchingContactsRef.current = false;
    }
  }, [session.isAuthenticated]);

  const reloadFarmData = useCallback(async () => {
    if (session.isAuthenticated) {
      await loadDashboardData(true);
    }
  }, [loadDashboardData, session.isAuthenticated]);

  useEffect(() => {
    let isMounted = true;

    const storedOnboarding = localStorage.getItem("farm_v2_onboarding_completed");
    if (storedOnboarding) {
      setOnboardingCompletedState(JSON.parse(storedOnboarding));
    }

    const initAuth = async () => {
      try {
        const { data: { session: sbSession } } = await supabase.auth.getSession();
        if (isMounted) {
          if (sbSession?.user) {
            const rawFarmName = sbSession.user.user_metadata?.farmName || "My Farm";
            const normalized = normalizeFarmName(rawFarmName);
            setSession({
              userId: sbSession.user.id,
              email: sbSession.user.email || "",
              name: sbSession.user.user_metadata?.name || "Operator",
              isAuthenticated: true
            });
            setIsAuthReady(true);
            setFarmProfile(prev => ({
              ...prev,
              name: normalized,
              ownerName: sbSession.user.user_metadata?.name || prev.ownerName,
              location: sbSession.user.user_metadata?.location || prev.location,
              email: sbSession.user.email || prev.email
            }));
          } else {
            setSession({
              userId: undefined,
              email: "",
              name: "",
              isAuthenticated: false
            });
            setIsAuthReady(true);
            setIsLoadingData(false);
          }
        }
      } catch (err) {
        console.error("[FarmContext] Auth restoration error:", err);
        if (isMounted) {
          setIsAuthReady(true);
          setIsLoadingData(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, sbSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (sbSession?.user) {
          const rawFarmName = sbSession.user.user_metadata?.farmName || "My Farm";
          const normalized = normalizeFarmName(rawFarmName);
          setSession({
            userId: sbSession.user.id,
            email: sbSession.user.email || "",
            name: sbSession.user.user_metadata?.name || "Operator",
            isAuthenticated: true
          });
          setFarmProfile(prev => ({
            ...prev,
            name: normalized,
            email: sbSession.user.email || prev.email
          }));
          setIsAuthReady(true);
        }
      } else if (event === "SIGNED_OUT") {
        clearSessionCache();
        setSession({
          userId: undefined,
          email: "",
          name: "",
          isAuthenticated: false
        });
        setIsAuthReady(true);
        setIsLoadingData(false);
        setAccountId(null);
        setAnimals([]);
        setHealthRecords([]);
        setTreatments([]);
        setWeightRecords([]);
        setBreedingRecords([]);
        setInventory([]);
        setContacts([]);
        setReminders([]);
        setFarmNotes([]);
        setAnimalNotes([]);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearSessionCache]);

  useEffect(() => {
    if (session.isAuthenticated) {
      loadAccount();
    }
  }, [session.isAuthenticated, loadAccount]);

  const logActivity = async (type: string, description: string, actor: string, targetId?: string) => {
    const newLog = {
      id: "l_" + Date.now(),
      type,
      description,
      date: new Date().toISOString(),
      actor,
      target_id: targetId
    };

    setActivityLogs(prev => [
      {
        id: newLog.id,
        type: newLog.type,
        description: newLog.description,
        date: newLog.date,
        actor: newLog.actor,
        targetId: newLog.target_id
      },
      ...prev
    ].slice(0, 50));

    try {
      await supabase.from("activity_logs").insert([{
        id: newLog.id,
        type: newLog.type,
        description: newLog.description,
        date: newLog.date,
        actor: newLog.actor,
        target_id: targetId,
        user_id: session.userId || null
      }]);
    } catch (e) {
      console.error("[FarmContext] Activity log insert error", e);
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const cleanInput = identifier.trim();
      let emailToUse = cleanInput;

      if (!cleanInput.includes("@")) {
        const normalizedInput = normalizeFarmName(cleanInput);
        
        const { data: accountRow } = await supabase
          .from("accounts")
          .select("email, farm_name")
          .or(`farm_name.ilike.${cleanInput},farm_name.ilike.${normalizedInput}`)
          .limit(1)
          .maybeSingle();

        if (accountRow?.email) {
          emailToUse = accountRow.email;
        } else {
          showError(`No farm account registered under '${cleanInput}' or '${normalizedInput}'.`);
          setIsLoadingData(false);
          return false;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (authError) {
        showError("Incorrect password or login credentials.");
        setIsLoadingData(false);
        return false;
      }

      if (authData?.user) {
        clearSessionCache();
        const rawFarmName = authData.user.user_metadata?.farmName || "My Farm";
        const normalized = normalizeFarmName(rawFarmName);
        setSession({
          userId: authData.user.id,
          email: authData.user.email || "",
          name: authData.user.user_metadata?.name || "Operator",
          isAuthenticated: true
        });
        setFarmProfile(prev => ({
          ...prev,
          name: normalized,
          email: authData.user.email || prev.email
        }));
        showSuccess(`Signed into ${normalized}!`);
        return true;
      }
    } catch (err: any) {
      showError(err.message || "An error occurred during sign in.");
    } finally {
      setIsLoadingData(false);
    }
    return false;
  };

  const signupAndSetup = async (email: string, password: string, name: string, rawFarmName: string, location: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const normalizedFarmName = normalizeFarmName(rawFarmName);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            farmName: normalizedFarmName,
            location: location.trim()
          }
        }
      });

      if (authError) {
        showError(authError.message);
        setIsLoadingData(false);
        return false;
      }

      if (authData?.user) {
        try {
          const { data: newAcct } = await supabase.from("accounts").insert([{
            user_id: authData.user.id,
            farm_name: normalizedFarmName,
            operator_name: name.trim(),
            email: email.trim(),
            location: location.trim()
          }]).select("id").single();

          if (newAcct?.id) {
            setAccountId(newAcct.id);
          }
        } catch (e) {
          console.warn("[FarmContext] Accounts insert note", e);
        }

        const newProfile = {
          ...farmProfile,
          name: normalizedFarmName,
          ownerName: name.trim(),
          location: location.trim(),
          email: email.trim()
        };
        setFarmProfile(newProfile);

        clearSessionCache();
        setSession({
          userId: authData.user.id,
          email: authData.user.email || "",
          name: name.trim(),
          isAuthenticated: true
        });

        showSuccess(`Farm setup complete for ${normalizedFarmName}!`);
        return true;
      }
    } catch (err: any) {
      showError(err.message || "Failed to create account.");
    } finally {
      setIsLoadingData(false);
    }
    return false;
  };

  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("[FarmContext] Local signout warning", e);
    } finally {
      isLoggingOutRef.current = false;
      clearSessionCache();
      setAccountId(null);
      setSession({ userId: undefined, email: "", name: "", isAuthenticated: false });
      setAnimals([]);
      setHealthRecords([]);
      setTreatments([]);
      setWeightRecords([]);
      setBreedingRecords([]);
      setInventory([]);
      setContacts([]);
      setReminders([]);
      setFarmNotes([]);
      setAnimalNotes([]);
      showSuccess("Signed out successfully.");
    }
  };

  const updateFarmProfile = async (profile: FarmProfile): Promise<boolean> => {
    const normalizedFarmName = normalizeFarmName(profile.name);
    const newEmail = (profile.email || session.email).trim();

    try {
      if (newEmail && newEmail.toLowerCase() !== session.email.toLowerCase()) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail });
        if (emailErr) {
          showError("Failed to update authentication email: " + emailErr.message);
          return false;
        }
        showSuccess("Account email update requested. Check inbox for confirmation if required.");
      }

      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          farmName: normalizedFarmName,
          name: profile.ownerName,
          location: profile.location
        }
      });

      if (metaErr) {
        showError("Failed to update user auth metadata: " + metaErr.message);
        return false;
      }

      let targetAccountId = accountId;
      if (!targetAccountId) {
        const { data: acct } = await supabase.from("accounts").select("id").limit(1).maybeSingle();
        targetAccountId = acct?.id || null;
        if (targetAccountId) setAccountId(targetAccountId);
      }

      if (targetAccountId) {
        const { error } = await supabase.from("accounts").update({
          farm_name: normalizedFarmName,
          operator_name: profile.ownerName,
          email: newEmail,
          location: profile.location,
          updated_at: new Date().toISOString()
        }).eq("id", targetAccountId);

        if (error) {
          showError("Failed to update database account record: " + error.message);
          return false;
        }
      } else {
        const { data: newAcct, error } = await supabase.from("accounts").insert([{
          user_id: session.userId || null,
          farm_name: normalizedFarmName,
          operator_name: profile.ownerName,
          email: newEmail,
          location: profile.location
        }]).select("id").single();

        if (!error && newAcct) {
          setAccountId(newAcct.id);
        }
      }

      setFarmProfile({
        ...profile,
        name: normalizedFarmName,
        email: newEmail
      });
      setSession(prev => ({ ...prev, email: newEmail, name: profile.ownerName }));

      await logActivity("Farm Profile Updated", `Updated farm name to ${normalizedFarmName}`, profile.ownerName);
      showSuccess("Farm profile updated successfully!");
      return true;
    } catch (e: any) {
      showError(e?.message || "Failed to update profile.");
      return false;
    }
  };

  const changeAccountPassword = async (newPassword: string): Promise<boolean> => {
    if (!newPassword || newPassword.length < 6) {
      showError("Password must be at least 6 characters long.");
      return false;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showError("Failed to change password: " + error.message);
        return false;
      }
      showSuccess("Account password changed successfully!");
      await logActivity("Password Changed", "Updated account access password", farmProfile.ownerName);
      return true;
    } catch (e: any) {
      showError(e?.message || "Failed to change password.");
      return false;
    }
  };

  const requestPasswordReset = async (identifierOrEmail: string): Promise<boolean> => {
    const clean = identifierOrEmail.trim();
    if (!clean) {
      showError("Please enter an email address or Farm Name.");
      return false;
    }

    try {
      let emailToReset = clean;

      if (!clean.includes("@")) {
        const normalized = normalizeFarmName(clean);
        const { data: accountRow } = await supabase
          .from("accounts")
          .select("email, farm_name")
          .or(`farm_name.ilike.${clean},farm_name.ilike.${normalized}`)
          .limit(1)
          .maybeSingle();

        if (accountRow?.email) {
          emailToReset = accountRow.email;
        } else {
          showError(`Could not locate farm account registered under '${clean}'.`);
          return false;
        }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: window.location.origin + "/login"
      });

      if (error) {
        showError("Password reset failed: " + error.message);
        return false;
      }

      showSuccess(`Password reset instructions sent to ${emailToReset}`);
      return true;
    } catch (e: any) {
      showError(e?.message || "Password reset request failed.");
      return false;
    }
  };

  const addAnimal = async (animalData: Omit<Animal, "id" | "animal_code" | "created_at">) => {
    const getFarmPrefix = (farmName: string): string => {
      const clean = farmName.replace(/[^a-zA-Z]/g, "").toUpperCase();
      if (clean.length >= 2) return clean.slice(0, 2);
      if (clean.length === 1) return (clean + "F").slice(0, 2);
      return "AD";
    };

    const getSpeciesCode = (species: Animal["species"]): string => {
      switch (species) {
        case "Goat": return "G";
        case "Ram": return "S";
        case "Chicken": return "C";
        default: return "O";
      }
    };

    const farmPrefix = getFarmPrefix(farmProfile.name || "Adam");
    const speciesCode = getSpeciesCode(animalData.species);
    const codePrefix = `${farmPrefix}${speciesCode}`;

    let dbCodesQuery = supabase.from("animals").select("animal_code").ilike("animal_code", `${codePrefix}%`);
    const { data: existingRows } = await dbCodesQuery;
    const dbCodeSet = new Set((existingRows || []).map((r: any) => r.animal_code));
    const localCodeSet = new Set(animals.map(a => a.animal_code));

    let countNumber = 1;
    let generatedCode = `${codePrefix}${countNumber.toString().padStart(3, "0")}`;

    while (dbCodeSet.has(generatedCode) || localCodeSet.has(generatedCode)) {
      countNumber++;
      generatedCode = `${codePrefix}${countNumber.toString().padStart(3, "0")}`;
    }

    const newId = "a_" + Date.now();

    const ownershipInfo: OwnershipData = {
      ownershipType: animalData.ownershipType || "Farm Owned",
      ownerName: animalData.ownershipType === "Client Owned" ? animalData.ownerName : undefined,
      custodian: animalData.ownershipType === "Client Owned" ? animalData.custodian : undefined,
      agreement: animalData.ownershipType === "Client Owned" ? animalData.agreement : undefined
    };

    const encodedNotes = encodeOwnershipIntoNotes(ownershipInfo, animalData.notes || "");

    const dbPayload = {
      id: newId,
      animal_code: generatedCode,
      name: animalData.name ? animalData.name.trim() : "",
      species: animalData.species,
      breed: animalData.breed,
      sex: animalData.sex,
      dob: animalData.dob,
      purchase_date: animalData.purchaseDate,
      source: animalData.source,
      status: animalData.status,
      health_status: animalData.healthStatus,
      primary_photo: animalData.primaryPhoto || DEFAULT_ANIMAL_PHOTO,
      photos: (animalData.photos && animalData.photos.length > 0) ? animalData.photos : [DEFAULT_ANIMAL_PHOTO],
      notes: encodedNotes,
      mother_id: animalData.parents?.motherId,
      father_id: animalData.parents?.fatherId,
      user_id: session.userId || null
    };

    const { error } = await supabase.from("animals").insert([dbPayload]);
    if (error) {
      showError("Failed to save animal to database: " + error.message);
      return;
    }

    const createdAnimalObj: Animal = {
      id: newId,
      animal_code: generatedCode,
      name: animalData.name ? animalData.name.trim() : "",
      species: animalData.species,
      breed: animalData.breed,
      sex: animalData.sex,
      dob: animalData.dob,
      purchaseDate: animalData.purchaseDate,
      source: animalData.source,
      status: animalData.status,
      healthStatus: animalData.healthStatus,
      primaryPhoto: animalData.primaryPhoto || DEFAULT_ANIMAL_PHOTO,
      photos: (animalData.photos && animalData.photos.length > 0) ? animalData.photos : [DEFAULT_ANIMAL_PHOTO],
      ownershipType: ownershipInfo.ownershipType,
      ownerName: ownershipInfo.ownerName,
      custodian: ownershipInfo.custodian,
      agreement: ownershipInfo.agreement,
      notes: animalData.notes || "",
      parents: animalData.parents,
      created_at: new Date().toISOString()
    };

    setAnimals(prev => [createdAnimalObj, ...prev]);
    await logActivity("Animal Registered", `Registered ${animalData.species} (${generatedCode})`, farmProfile.ownerName, newId);
    showSuccess(`Registered ${generatedCode}`);
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    const existing = animals.find(a => a.id === id);
    
    // Determine new ownership properties
    const currentOwnership: OwnershipData = {
      ownershipType: updates.ownershipType !== undefined ? updates.ownershipType : (existing?.ownershipType || "Farm Owned"),
      ownerName: updates.ownershipType === "Farm Owned" ? undefined : (updates.ownerName !== undefined ? updates.ownerName : existing?.ownerName),
      custodian: updates.ownershipType === "Farm Owned" ? undefined : (updates.custodian !== undefined ? updates.custodian : existing?.custodian),
      agreement: updates.ownershipType === "Farm Owned" ? undefined : (updates.agreement !== undefined ? updates.agreement : existing?.agreement),
    };

    const baseNotes = updates.notes !== undefined ? updates.notes : (existing?.notes || "");
    const encodedNotes = encodeOwnershipIntoNotes(currentOwnership, baseNotes);

    const payload: any = {
      notes: encodedNotes
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.breed !== undefined) payload.breed = updates.breed;
    if (updates.sex !== undefined) payload.sex = updates.sex;
    if (updates.dob !== undefined) payload.dob = updates.dob;
    if (updates.purchaseDate !== undefined) payload.purchase_date = updates.purchaseDate;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.healthStatus !== undefined) payload.health_status = updates.healthStatus;
    if (updates.primaryPhoto !== undefined) payload.primary_photo = updates.primaryPhoto;
    if (updates.photos !== undefined) payload.photos = updates.photos;
    if (updates.parents?.motherId !== undefined) payload.mother_id = updates.parents.motherId;
    if (updates.parents?.fatherId !== undefined) payload.father_id = updates.parents.fatherId;

    const { error } = await supabase.from("animals").update(payload).eq("id", id);
    if (error) {
      showError("Failed to update animal: " + error.message);
      return;
    }

    setAnimals(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          ...updates,
          ownershipType: currentOwnership.ownershipType,
          ownerName: currentOwnership.ownerName,
          custodian: currentOwnership.custodian,
          agreement: currentOwnership.agreement,
          notes: baseNotes
        };
      }
      return a;
    }));

    await logActivity("Animal Updated", `Updated details for livestock record`, farmProfile.ownerName, id);
    showSuccess("Animal updated");
  };

  const deleteAnimal = async (id: string) => {
    const target = animals.find(a => a.id === id);
    const { error } = await supabase.from("animals").delete().eq("id", id);
    if (error) {
      showError("Failed to delete animal: " + error.message);
      return;
    }

    setAnimals(prev => prev.filter(a => a.id !== id));
    await logActivity("Animal Removed", `Removed ${target?.animal_code || "livestock"} from registry`, farmProfile.ownerName, id);
    showSuccess("Animal record deleted");
  };

  const addHealthRecord = async (record: Omit<HealthRecord, "id">) => {
    const newId = "h_" + Date.now();
    const { error } = await supabase.from("health_records").insert([{
      id: newId,
      animal_id: record.animal_id,
      type: record.type,
      date: record.date,
      details: record.details,
      medication: record.medication,
      recorded_by: record.recordedBy,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to log health event: " + error.message);
      return;
    }

    let newStatus: Animal["status"] = "Healthy";
    let hStatus: Animal["healthStatus"] = "Healthy";
    if (record.type === "Diagnosis" || record.type === "Observation") {
      newStatus = "Monitoring";
      hStatus = "Monitoring";
    } else if (record.type === "Treatment") {
      newStatus = "Under Treatment";
      hStatus = "Under Treatment";
    }

    await supabase.from("animals").update({ status: newStatus, health_status: hStatus }).eq("id", record.animal_id);
    
    setHealthRecords(prev => [{ id: newId, ...record }, ...prev]);
    setAnimals(prev => prev.map(a => a.id === record.animal_id ? { ...a, status: newStatus, healthStatus: hStatus } : a));
    const animalObj = animals.find(a => a.id === record.animal_id);
    await logActivity("Health Logged", `Logged ${record.type} for ${animalObj?.animal_code || 'animal'}: ${record.details.slice(0, 40)}`, record.recordedBy, record.animal_id);
    showSuccess("Health event recorded");
  };

  const addTreatment = async (treatmentData: Omit<Treatment, "id">) => {
    const newId = "t_" + Date.now();
    const { error } = await supabase.from("treatments").insert([{
      id: newId,
      animal_id: treatmentData.animal_id,
      condition: treatmentData.condition,
      medication: treatmentData.medication,
      start_date: treatmentData.startDate,
      end_date: treatmentData.endDate,
      status: treatmentData.status,
      notes: treatmentData.notes,
      follow_up_date: treatmentData.followUpDate,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to add treatment: " + error.message);
      return;
    }

    await supabase.from("animals").update({ status: "Under Treatment", health_status: "Under Treatment" }).eq("id", treatmentData.animal_id);
    
    setTreatments(prev => [{ id: newId, ...treatmentData }, ...prev]);
    setAnimals(prev => prev.map(a => a.id === treatmentData.animal_id ? { ...a, status: "Under Treatment", healthStatus: "Under Treatment" } : a));
    const animalObj = animals.find(a => a.id === treatmentData.animal_id);
    await logActivity("Treatment Started", `Started Rx (${treatmentData.medication}) for ${animalObj?.animal_code || 'animal'}`, farmProfile.ownerName, treatmentData.animal_id);
    showSuccess("Treatment started");
  };

  const updateTreatmentStatus = async (id: string, status: "Ongoing" | "Completed" | "Stopped") => {
    const { error } = await supabase.from("treatments").update({ status }).eq("id", id);
    if (error) {
      showError("Failed to update treatment: " + error.message);
      return;
    }

    const currentTx = treatments.find(t => t.id === id);
    if (status === "Completed" && currentTx) {
      await supabase.from("animals").update({ status: "Healthy", health_status: "Healthy" }).eq("id", currentTx.animal_id);
      setAnimals(prev => prev.map(a => a.id === currentTx.animal_id ? { ...a, status: "Healthy", healthStatus: "Healthy" } : a));
    }

    setTreatments(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    await logActivity("Treatment Status", `Marked treatment for ${currentTx?.condition || 'condition'} as ${status}`, farmProfile.ownerName, currentTx?.animal_id);
    showSuccess(`Treatment status: ${status}`);
  };

  const addWeightRecord = async (record: Omit<WeightRecord, "id">) => {
    const newId = "w_" + Date.now();
    const { error } = await supabase.from("weight_records").insert([{
      id: newId,
      animal_id: record.animal_id,
      weight: record.weight,
      date: record.date,
      notes: record.notes,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to log weight: " + error.message);
      return;
    }

    setWeightRecords(prev => [...prev, { id: newId, ...record }]);
    const animalObj = animals.find(a => a.id === record.animal_id);
    await logActivity("Weight Logged", `Recorded ${record.weight} kg for ${animalObj?.animal_code || 'animal'}`, farmProfile.ownerName, record.animal_id);
    showSuccess("Weight logged");
  };

  const addBreedingRecord = async (record: Omit<BreedingRecord, "id">) => {
    const newId = "b_" + Date.now();
    const { error } = await supabase.from("breeding_records").insert([{
      id: newId,
      female_id: record.female_id,
      male_id: record.male_id,
      date: record.date,
      status: record.status,
      notes: record.notes,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to log breeding: " + error.message);
      return;
    }

    setBreedingRecords(prev => [{ id: newId, ...record }, ...prev]);
    await logActivity("Breeding Logged", `Logged mating cycle status (${record.status})`, farmProfile.ownerName, record.female_id);
    showSuccess("Breeding event logged");
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    const newId = "i_" + Date.now();
    const { error } = await supabase.from("inventory").insert([{
      id: newId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.minStock,
      notes: item.notes,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to add inventory: " + error.message);
      return;
    }

    setInventory(prev => [{ id: newId, ...item }, ...prev]);
    await logActivity("Inventory Added", `Added supply item: ${item.name} (${item.quantity} ${item.unit})`, farmProfile.ownerName);
    showSuccess("Supply item added");
  };

  const updateInventoryStock = async (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => {
    const target = inventory.find(i => i.id === itemId);
    if (!target) return;

    let newQty = target.quantity;
    if (type === "add") newQty += qtyChange;
    if (type === "remove") newQty -= qtyChange;
    if (type === "adjust") newQty = qtyChange;

    if (newQty < 0) {
      showError("Quantity cannot fall below 0");
      return;
    }

    const { error } = await supabase.from("inventory").update({ quantity: newQty }).eq("id", itemId);
    if (error) {
      showError("Failed to update stock: " + error.message);
      return;
    }

    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
    await logActivity("Stock Adjusted", `Adjusted stock for ${target.name}: now ${newQty} ${target.unit}`, recordedBy || farmProfile.ownerName);
    showSuccess("Stock quantity updated");
  };

  const deleteInventoryItem = async (id: string) => {
    const target = inventory.find(i => i.id === id);
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    if (error) {
      showError("Failed to delete inventory item: " + error.message);
      return;
    }

    setInventory(prev => prev.filter(i => i.id !== id));
    await logActivity("Inventory Deleted", `Deleted supply item: ${target?.name || ''}`, farmProfile.ownerName);
    showSuccess("Inventory item deleted");
  };

  const addContact = async (contact: Omit<Contact, "id">) => {
    const newId = "c_" + Date.now();
    const { error } = await supabase.from("contacts").insert([{
      id: newId,
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      email: contact.email,
      address: contact.address,
      notes: contact.notes,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to add contact: " + error.message);
      return;
    }

    setContacts(prev => [{ id: newId, ...contact }, ...prev]);
    await logActivity("Contact Added", `Added ${contact.name} (${contact.role}) to contacts`, farmProfile.ownerName);
    showSuccess("Contact added");
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase.from("contacts").update(updates).eq("id", id);
    if (error) {
      showError("Failed to update contact: " + error.message);
      return;
    }
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteContact = async (id: string) => {
    const target = contacts.find(c => c.id === id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      showError("Failed to delete contact: " + error.message);
      return;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
    await logActivity("Contact Deleted", `Removed contact ${target?.name || ''}`, farmProfile.ownerName);
    showSuccess("Contact removed");
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "completed">) => {
    const newId = "r_" + Date.now();
    const { error } = await supabase.from("reminders").insert([{
      id: newId,
      title: reminder.title,
      type: reminder.type,
      due_date: reminder.dueDate,
      animal_id: reminder.animal_id,
      completed: false,
      notes: reminder.notes,
      user_id: session.userId || null
    }]);

    if (error) {
      showError("Failed to create reminder: " + error.message);
      return;
    }

    setReminders(prev => [{ id: newId, completed: false, ...reminder }, ...prev]);
    await logActivity("Reminder Set", `Created calendar task: ${reminder.title}`, farmProfile.ownerName, reminder.animal_id);
    showSuccess("Reminder created");
  };

  const toggleReminder = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const { error } = await supabase.from("reminders").update({ completed: !target.completed }).eq("id", id);
    if (error) {
      showError("Failed to update reminder: " + error.message);
      return;
    }

    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    await logActivity("Reminder Completed", `Completed task: ${target.title}`, farmProfile.ownerName, target.animal_id);
  };

  const addFarmNote = async (note: { title?: string; content: string }): Promise<boolean> => {
    const newId = "fn_" + Date.now();
    const newRecord: FarmNote = {
      id: newId,
      title: note.title?.trim() || undefined,
      content: note.content.trim(),
      created_by: farmProfile.ownerName || "Operator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from("farm_notes").insert([{
        id: newRecord.id,
        title: newRecord.title || null,
        content: newRecord.content,
        created_by: newRecord.created_by,
        user_id: session.userId || null
      }]);

      if (error) {
        showError("Couldn't save note: " + error.message);
        return false;
      }

      setFarmNotes(prev => [newRecord, ...prev]);
      await logActivity("Farm Note Added", `Added farm note: "${(note.title || note.content).slice(0, 35)}..."`, farmProfile.ownerName);
      showSuccess("Farm note saved");
      return true;
    } catch (e: any) {
      showError("Couldn't save note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const updateFarmNote = async (id: string, updates: { title?: string; content: string }): Promise<boolean> => {
    const payload = {
      title: updates.title?.trim() || null,
      content: updates.content.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from("farm_notes").update(payload).eq("id", id);

      if (error) {
        showError("Couldn't update note: " + error.message);
        return false;
      }

      setFarmNotes(prev => prev.map(fn => fn.id === id ? { ...fn, title: updates.title, content: updates.content, updated_at: payload.updated_at } : fn));
      await logActivity("Farm Note Updated", `Edited farm note "${(updates.title || updates.content).slice(0, 30)}..."`, farmProfile.ownerName);
      showSuccess("Farm note updated");
      return true;
    } catch (e: any) {
      showError("Couldn't update note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const deleteFarmNote = async (id: string): Promise<boolean> => {
    const target = farmNotes.find(f => f.id === id);

    try {
      const { error } = await supabase.from("farm_notes").delete().eq("id", id);

      if (error) {
        showError("Couldn't delete note: " + error.message);
        return false;
      }

      setFarmNotes(prev => prev.filter(f => f.id !== id));
      await logActivity("Farm Note Deleted", `Deleted farm note: "${(target?.title || target?.content || '').slice(0, 30)}"`, farmProfile.ownerName);
      showSuccess("Farm note deleted");
      return true;
    } catch (e: any) {
      showError("Couldn't delete note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const addAnimalNote = async (note: { animal_id: string; content: string }): Promise<boolean> => {
    const newId = "an_" + Date.now();
    const newRecord: AnimalNote = {
      id: newId,
      animal_id: note.animal_id,
      content: note.content.trim(),
      created_by: farmProfile.ownerName || "Operator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from("animal_notes").insert([{
        id: newRecord.id,
        animal_id: newRecord.animal_id,
        content: newRecord.content,
        created_by: newRecord.created_by,
        user_id: session.userId || null
      }]);

      if (error) {
        showError("Couldn't save note: " + error.message);
        return false;
      }

      setAnimalNotes(prev => [newRecord, ...prev]);
      const animalObj = animals.find(a => a.id === note.animal_id);
      await logActivity("Animal Note Added", `Logged note for ${animalObj?.animal_code || 'livestock'}: "${note.content.slice(0, 30)}..."`, farmProfile.ownerName, note.animal_id);
      showSuccess("Animal note saved");
      return true;
    } catch (e: any) {
      showError("Couldn't save note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const updateAnimalNote = async (id: string, content: string): Promise<boolean> => {
    const payload = {
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from("animal_notes").update(payload).eq("id", id);

      if (error) {
        showError("Couldn't update note: " + error.message);
        return false;
      }

      setAnimalNotes(prev => prev.map(an => an.id === id ? { ...an, content: content.trim(), updated_at: payload.updated_at } : an));
      await logActivity("Animal Note Updated", `Edited animal note: "${content.slice(0, 30)}..."`, farmProfile.ownerName);
      showSuccess("Animal note updated");
      return true;
    } catch (e: any) {
      showError("Couldn't update note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const deleteAnimalNote = async (id: string): Promise<boolean> => {
    const target = animalNotes.find(a => a.id === id);

    try {
      const { error } = await supabase.from("animal_notes").delete().eq("id", id);

      if (error) {
        showError("Couldn't delete note: " + error.message);
        return false;
      }

      setAnimalNotes(prev => prev.filter(a => a.id !== id));
      await logActivity("Animal Note Deleted", `Deleted animal note`, farmProfile.ownerName, target?.animal_id);
      showSuccess("Animal note deleted");
      return true;
    } catch (e: any) {
      showError("Couldn't delete note: " + (e?.message || "Unknown error"));
      return false;
    }
  };

  const incrementAiUsage = (type: "text" | "image") => {
    setAiUsage(prev => ({
      ...prev,
      questionsUsed: type === "text" ? prev.questionsUsed + 1 : prev.questionsUsed,
      imageUsed: type === "image" ? prev.imageUsed + 1 : prev.imageUsed
    }));
  };

  const seedSampleData = () => {};
  const resetDatabase = () => {};

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
        farmNotes,
        animalNotes,
        activityLogs,
        farmProfile,
        session,
        onboardingCompleted,
        isLoadingData,
        isAuthReady,
        aiUsage,
        loadAccount,
        loadDashboardData,
        loadAnimals,
        loadAnimalProfile,
        loadInventory,
        loadFarmNotes,
        loadContacts,
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
        deleteInventoryItem,
        addContact,
        updateContact,
        deleteContact,
        addReminder,
        toggleReminder,
        addFarmNote,
        updateFarmNote,
        deleteFarmNote,
        addAnimalNote,
        updateAnimalNote,
        deleteAnimalNote,
        logActivity,
        updateFarmProfile,
        changeAccountPassword,
        requestPasswordReset,
        incrementAiUsage,
        setOnboardingCompleted,
        login,
        signupAndSetup,
        logout,
        seedSampleData,
        resetDatabase,
        reloadFarmData,
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