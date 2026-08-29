"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";
import { ensureStorageUrl, uploadImageToStorage } from "@/utils/imageCompressor";

export const DEFAULT_ANIMAL_PHOTO = "/placeholder.svg";

export type LifecycleStatus = "Active" | "Sold" | "Deceased" | "Retired";
export type HealthStatus = "Healthy" | "Monitoring" | "Sick" | "Under Treatment";
export type ReproductiveStatus = "None" | "Pregnant" | "Breeding" | "Lactating" | "Not applicable";

export const normalizeFarmName = (name: string): string => {
  if (!name) return "";
  let trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  trimmed = trimmed.replace(/(\s+farm)+$/i, "");
  return `${trimmed} Farm`;
};

export const getFarmPrefix = (farmName: string): string => {
  if (!farmName) return "YUS";
  let clean = farmName.trim().replace(/\s*farm$/i, "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (!clean) clean = farmName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (clean.length >= 3) return clean.slice(0, 3);
  if (clean.length === 2) return clean + "F";
  if (clean.length === 1) return clean + "FM";
  return "YUS";
};

export const getSpeciesCode = (species: string): string => {
  switch (species) {
    case "Goat": return "G";
    case "Ram": return "R";
    case "Sheep": return "S";
    case "Chicken": return "C";
    case "Turkey": return "T";
    case "Horse": return "H";
    case "Camel": return "CM";
    case "Duck": return "D";
    case "Cow": return "CW";
    default:
      return species.trim().charAt(0).toUpperCase() || "O";
  }
};

// export const getSpeciesCode = (species: string): string => {
//   switch (species) {
//     case "Goat": return "G";
//     case "Ram": return "R";
//     case "Sheep": return "S";
//     case "Chicken": return "C";
//     case "Turkey": return "T";
//     case "Horse": return "H";
//     case "Camel": return "CM";
//     case "Duck": return "D";
//     case "Cow": return "CW";
//     default: return "O";
//   }
// };

export const SPECIES_OPTIONS = [
  "Goat",
  "Ram",
  "Sheep",
  "Chicken",
  "Turkey",
  "Horse",
  "Camel",
  "Duck",
  "Cow",
  "Other"
] as const;

export interface OwnershipData {
  ownershipType: "Farm Owned" | "Client Owned";
  ownerName?: string;
  custodian?: string;
  agreement?: string;
}

export const parseExtendedDataFromNotes = (rawNotes: string = ""): {
  ownership: OwnershipData;
  reproductiveStatus?: ReproductiveStatus;
  cleanNotes: string;
} => {
  let cleanNotes = rawNotes;
  let ownership: OwnershipData = { ownershipType: "Farm Owned" };
  let reproductiveStatus: ReproductiveStatus | undefined = undefined;

  const ownershipMatch = cleanNotes.match(/\[OWNERSHIP_DATA:(.*?)\]/);
  if (ownershipMatch) {
    try {
      const data = JSON.parse(ownershipMatch[1]);
      ownership = {
        ownershipType: data.ownershipType === "Client Owned" ? "Client Owned" : "Farm Owned",
        ownerName: data.ownerName || undefined,
        custodian: data.custodian || undefined,
        agreement: data.agreement || undefined,
      };
      cleanNotes = cleanNotes.replace(/\[OWNERSHIP_DATA:.*?\]/, "").trim();
    } catch {}
  }

  const reproMatch = cleanNotes.match(/\[REPRO_STATUS:(.*?)\]/);
  if (reproMatch) {
    reproductiveStatus = reproMatch[1] as ReproductiveStatus;
    cleanNotes = cleanNotes.replace(/\[REPRO_STATUS:.*?\]/, "").trim();
  }

  return { ownership, reproductiveStatus, cleanNotes };
};

export const encodeExtendedDataIntoNotes = (
  ownership: OwnershipData,
  reproductiveStatus: ReproductiveStatus = "None",
  cleanNotes: string = ""
): string => {
  let stripped = cleanNotes
    .replace(/\[OWNERSHIP_DATA:.*?\]/g, "")
    .replace(/\[REPRO_STATUS:.*?\]/g, "")
    .trim();

  const tags: string[] = [];

  if (ownership.ownershipType === "Client Owned") {
    const ownerTag = JSON.stringify({
      ownershipType: "Client Owned",
      ownerName: ownership.ownerName || "",
      custodian: ownership.custodian || "",
      agreement: ownership.agreement || ""
    });
    tags.push(`[OWNERSHIP_DATA:${ownerTag}]`);
  } else {
    tags.push(`[OWNERSHIP_DATA:{"ownershipType":"Farm Owned"}]`);
  }

  if (reproductiveStatus && reproductiveStatus !== "None") {
    tags.push(`[REPRO_STATUS:${reproductiveStatus}]`);
  }

  return stripped ? `${stripped}\n${tags.join("\n")}` : tags.join("\n");
};

export const formatDbError = (err: any, fallbackMessage = "An unexpected error occurred."): string => {
  if (!err) return fallbackMessage;
  const msg = typeof err === "string" ? err : err.message || "";
  const details = err.details || "";
  const code = err.code || "";

  if (
    msg.toLowerCase().includes("unique constraint") ||
    msg.toLowerCase().includes("duplicate key") ||
    details.toLowerCase().includes("already exists") ||
    code === "23505"
  ) {
    if (msg.includes("farm_name") || details.includes("farm_name") || msg.includes("accounts")) {
      return "This farm name is already registered. Please choose another name.";
    }
    return "This record already exists. Please choose a different identifier.";
  }

  if (msg.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect farm name, email, or password. Please try again.";
  }

  if (msg.toLowerCase().includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }

  return msg || fallbackMessage;
};

export const normalizeStatuses = (rawStatus: string, rawHealth?: string, rawRepro?: ReproductiveStatus): {
  status: LifecycleStatus;
  healthStatus: HealthStatus;
  reproductiveStatus: ReproductiveStatus;
} => {
  let status: LifecycleStatus = "Active";
  let healthStatus: HealthStatus = (rawHealth as HealthStatus) || "Healthy";
  let reproductiveStatus: ReproductiveStatus = rawRepro || "None";

  const lowerStatus = (rawStatus || "").toLowerCase().trim();
  const lowerHealth = (rawHealth || "").toLowerCase().trim();

  // 1. Resolve Lifecycle Status
  if (lowerStatus === "sold") status = "Sold";
  else if (lowerStatus === "deceased") status = "Deceased";
  else if (lowerStatus === "retired") status = "Retired";
  else status = "Active";

  // 2. Resolve Health Status (Never let pregnancy overwrite health status)
  if (lowerHealth === "sick" || lowerStatus === "sick") {
    healthStatus = "Sick";
  } else if (lowerHealth === "under treatment" || lowerStatus === "under treatment") {
    healthStatus = "Under Treatment";
  } else if (lowerHealth === "monitoring" || lowerStatus === "monitoring") {
    healthStatus = "Monitoring";
  } else if (lowerHealth === "healthy" || (!rawHealth && lowerStatus === "healthy")) {
    healthStatus = "Healthy";
  }

  // 3. Resolve Reproductive Status
  if (rawRepro) {
    reproductiveStatus = rawRepro;
  } else if (lowerStatus === "pregnant") {
    reproductiveStatus = "Pregnant";
  } else if (lowerStatus === "lactating") {
    reproductiveStatus = "Lactating";
  }

  return { status, healthStatus, reproductiveStatus };
};

export interface Animal {
  id: string;
  animal_code: string;
  name: string;
  species: string;
  breed: string;
  sex: "Male" | "Female";
  dob?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  deathDate?: string;
  source: "Born on farm" | "Purchased" | "Other";
  status: LifecycleStatus;
  healthStatus: HealthStatus;
  reproductiveStatus: ReproductiveStatus;
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

export interface FarmGalleryItem {
  id: string;
  title?: string;
  caption?: string;
  category: "General" | "Animals" | "Buildings" | "Equipment" | "Events" | "Other";
  image_url: string;
  created_at: string;
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
  farmGallery: FarmGalleryItem[];
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
  loadFarmGallery: (force?: boolean) => Promise<void>;
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
  addFarmGalleryPhoto: (photo: { title?: string; caption?: string; category: string; file?: File; dataUrl?: string }) => Promise<boolean>;
  deleteFarmGalleryPhoto: (id: string, imageUrl?: string) => Promise<boolean>;
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
  const [farmGallery, setFarmGallery] = useState<FarmGalleryItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [onboardingCompleted, setOnboardingCompletedState] = useState<boolean>(false);
  
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const hasLoadedAccountRef = useRef<boolean>(false);
  const hasLoadedDashboardRef = useRef<boolean>(false);
  const hasLoadedAnimalsRef = useRef<boolean>(false);
  const hasLoadedInventoryRef = useRef<boolean>(false);
  const hasLoadedFarmNotesRef = useRef<boolean>(false);
  const hasLoadedContactsRef = useRef<boolean>(false);
  const hasLoadedGalleryRef = useRef<boolean>(false);

  const fetchingAccountRef = useRef<boolean>(false);
  const fetchingDashboardRef = useRef<boolean>(false);
  const fetchingAnimalsRef = useRef<boolean>(false);
  const fetchingInventoryRef = useRef<boolean>(false);
  const fetchingFarmNotesRef = useRef<boolean>(false);
  const fetchingContactsRef = useRef<boolean>(false);
  const fetchingGalleryRef = useRef<boolean>(false);
  const fetchingAnimalProfileRef = useRef<string | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);
  const isMigratingBase64Ref = useRef<boolean>(false);

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
    hasLoadedGalleryRef.current = false;

    fetchingAccountRef.current = false;
    fetchingDashboardRef.current = false;
    fetchingAnimalsRef.current = false;
    fetchingInventoryRef.current = false;
    fetchingFarmNotesRef.current = false;
    fetchingContactsRef.current = false;
    fetchingGalleryRef.current = false;
    fetchingAnimalProfileRef.current = null;
    isMigratingBase64Ref.current = false;
  }, []);

  const migrateLegacyBase64Animals = useCallback(async (rawAnimalsList: any[], userId: string) => {
    if (isMigratingBase64Ref.current) return;
    const recordsToMigrate = rawAnimalsList.filter(
      (a) =>
        (a.primary_photo && a.primary_photo.startsWith("data:image/")) ||
        (Array.isArray(a.photos) && a.photos.some((p: string) => p && p.startsWith("data:image/")))
    );

    if (recordsToMigrate.length === 0) return;
    isMigratingBase64Ref.current = true;

    try {
      for (const item of recordsToMigrate) {
        let newPrimary = item.primary_photo;
        if (newPrimary && newPrimary.startsWith("data:image/")) {
          newPrimary = await ensureStorageUrl(newPrimary, userId, "animals");
        }

        let newPhotos = item.photos;
        if (Array.isArray(newPhotos) && newPhotos.some((p: string) => p && p.startsWith("data:image/"))) {
          newPhotos = await Promise.all(
            newPhotos.map((p: string) => (p && p.startsWith("data:image/") ? ensureStorageUrl(p, userId, "animals") : p))
          );
        }

        const updatePayload: any = {};
        if (newPrimary !== item.primary_photo) updatePayload.primary_photo = newPrimary;
        if (newPhotos !== item.photos) updatePayload.photos = newPhotos;

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from("animals").update(updatePayload).eq("id", item.id).eq("user_id", userId);
          setAnimals((prev) =>
            prev.map((a) => (a.id === item.id ? { ...a, primaryPhoto: newPrimary, photos: newPhotos || [newPrimary] } : a))
          );
        }
      }
    } catch (e) {
      console.warn("[FarmContext] Base64 migration notice:", e);
    } finally {
      isMigratingBase64Ref.current = false;
    }
  }, []);

  const loadAccount = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedAccountRef.current && !force) return;
    if (fetchingAccountRef.current) return;
    fetchingAccountRef.current = true;

    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, user_id, farm_name, operator_name, email, location, header_image_url")
        .eq("user_id", session.userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setAccountId(data.id);
        setFarmProfile(prev => ({
          ...prev,
          name: data.farm_name || prev.name,
          ownerName: data.operator_name || prev.ownerName,
          location: data.location || prev.location,
          email: data.email || session.email || prev.email,
          image: data.header_image_url || prev.image || "/placeholder.svg"
        }));
        hasLoadedAccountRef.current = true;
      }
    } catch (err) {
      console.error("[FarmContext] Account fetch error:", err);
    } finally {
      fetchingAccountRef.current = false;
    }
  }, [session.isAuthenticated, session.userId, session.email]);

  const loadDashboardData = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedDashboardRef.current && !force) return;
    if (fetchingDashboardRef.current) return;
    fetchingDashboardRef.current = true;

    const currentUserId = session.userId;

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
        supabase.from("accounts").select("id, user_id, farm_name, operator_name, email, location, header_image_url").eq("user_id", currentUserId).limit(1).maybeSingle(),
        supabase.from("animals").select("id, animal_code, name, species, breed, sex, dob, purchase_date, purchase_price, death_date, source, status, health_status, primary_photo, mother_id, father_id, notes, created_at").eq("user_id", currentUserId).order("created_at", { ascending: false }),
        supabase.from("treatments").select("id, animal_id, condition, medication, start_date, end_date, status, follow_up_date").eq("user_id", currentUserId).eq("status", "Ongoing"),
        supabase.from("inventory").select("id, name, category, quantity, unit, min_stock").eq("user_id", currentUserId),
        supabase.from("reminders").select("id, title, type, due_date, animal_id, completed, notes").eq("user_id", currentUserId).eq("completed", false),
        supabase.from("farm_notes").select("id, farm_id, title, content, created_by, created_at, updated_at").eq("user_id", currentUserId).order("created_at", { ascending: false }).limit(5),
        supabase.from("activity_logs").select("id, type, description, date, actor, target_id").eq("user_id", currentUserId).order("date", { ascending: false }).limit(10)
      ]);

      if (acctRes.data) {
        setAccountId(acctRes.data.id);
        setFarmProfile(prev => ({
          ...prev,
          name: acctRes.data.farm_name || prev.name,
          ownerName: acctRes.data.operator_name || prev.ownerName,
          location: acctRes.data.location || prev.location,
          email: acctRes.data.email || session.email || prev.email,
          image: acctRes.data.header_image_url || prev.image || "/placeholder.svg"
        }));
        hasLoadedAccountRef.current = true;
      }

      if (resAnimals.data) {
        setAnimals(resAnimals.data.map((a: any) => {
          const { ownership, reproductiveStatus, cleanNotes } = parseExtendedDataFromNotes(a.notes || "");
          const { status, healthStatus, reproductiveStatus: finalRepro } = normalizeStatuses(a.status, a.health_status, reproductiveStatus);
          const photoUrl = a.primary_photo && a.primary_photo.trim() !== "" ? a.primary_photo : DEFAULT_ANIMAL_PHOTO;

          return {
            id: a.id,
            animal_code: a.animal_code,
            name: a.name || "",
            species: a.species,
            breed: a.breed || "Local Breed",
            sex: a.sex,
            dob: a.dob || "",
            purchaseDate: a.purchase_date,
            purchasePrice: a.purchase_price !== null && a.purchase_price !== undefined ? parseFloat(a.purchase_price) : undefined,
            deathDate: a.death_date || undefined,
            source: a.source || (a.purchase_date ? "Purchased" : "Born on farm"),
            status,
            healthStatus,
            reproductiveStatus: finalRepro,
            primaryPhoto: photoUrl,
            photos: [photoUrl],
            ownershipType: ownership.ownershipType,
            ownerName: ownership.ownerName,
            custodian: ownership.custodian,
            agreement: ownership.agreement,
            notes: cleanNotes,
            parents: { motherId: a.mother_id || undefined, fatherId: a.father_id || undefined },
            created_at: a.created_at || new Date().toISOString()
          };
        }));
        hasLoadedAnimalsRef.current = true;
        migrateLegacyBase64Animals(resAnimals.data, currentUserId);
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
        setInventory(resInventory.data.map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          minStock: parseFloat(i.min_stock)
        })));
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
        setFarmNotes(resFarmNotes.data.map((fn: any) => ({
          id: fn.id,
          farm_id: fn.farm_id,
          title: fn.title,
          content: fn.content,
          created_by: fn.created_by || "Operator",
          created_at: fn.created_at || new Date().toISOString(),
          updated_at: fn.updated_at || new Date().toISOString()
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

      hasLoadedDashboardRef.current = true;
    } catch (err) {
      console.error("[FarmContext] Dashboard load error:", err);
    } finally {
      fetchingDashboardRef.current = false;
    }
  }, [session.isAuthenticated, session.userId, session.email, migrateLegacyBase64Animals]);

  const loadAnimals = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedAnimalsRef.current && !force) return;
    if (fetchingAnimalsRef.current) return;
    fetchingAnimalsRef.current = true;

    try {
      const { data, error } = await supabase
        .from("animals")
        .select("id, animal_code, name, species, breed, sex, dob, purchase_date, purchase_price, death_date, source, status, health_status, primary_photo, mother_id, father_id, notes, created_at")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[FarmContext] Animals query error:", error);
      } else if (data) {
        setAnimals(data.map((a: any) => {
          const { ownership, reproductiveStatus, cleanNotes } = parseExtendedDataFromNotes(a.notes || "");
          const { status, healthStatus, reproductiveStatus: finalRepro } = normalizeStatuses(a.status, a.health_status, reproductiveStatus);
          const photoUrl = a.primary_photo && a.primary_photo.trim() !== "" ? a.primary_photo : DEFAULT_ANIMAL_PHOTO;

          return {
            id: a.id,
            animal_code: a.animal_code,
            name: a.name || "",
            species: a.species,
            breed: a.breed || "Local Breed",
            sex: a.sex,
            dob: a.dob || "",
            purchaseDate: a.purchase_date,
            purchasePrice: a.purchase_price !== null && a.purchase_price !== undefined ? parseFloat(a.purchase_price) : undefined,
            deathDate: a.death_date || undefined,
            source: a.source || "Born on farm",
            status,
            healthStatus,
            reproductiveStatus: finalRepro,
            primaryPhoto: photoUrl,
            photos: [photoUrl],
            ownershipType: ownership.ownershipType,
            ownerName: ownership.ownerName,
            custodian: ownership.custodian,
            agreement: ownership.agreement,
            notes: cleanNotes,
            parents: { motherId: a.mother_id || undefined, fatherId: a.father_id || undefined },
            created_at: a.created_at || new Date().toISOString()
          };
        }));
        hasLoadedAnimalsRef.current = true;
        migrateLegacyBase64Animals(data, session.userId);
      }
    } catch (err) {
      console.error("[FarmContext] Load animals unexpected error:", err);
    } finally {
      fetchingAnimalsRef.current = false;
    }
  }, [session.isAuthenticated, session.userId, migrateLegacyBase64Animals]);

  const loadAnimalProfile = useCallback(async (animalId: string, force = false) => {
    if (!animalId || !session.isAuthenticated || !session.userId) return;
    if (fetchingAnimalProfileRef.current === animalId && !force) return;
    fetchingAnimalProfileRef.current = animalId;

    const currentUserId = session.userId;

    try {
      const [resAnimal, resHealth, resTreatments, resWeights, resBreeding, resNotes, resLogs] = await Promise.all([
        supabase.from("animals").select("*").eq("id", animalId).eq("user_id", currentUserId).maybeSingle(),
        supabase.from("health_records").select("*").eq("animal_id", animalId).eq("user_id", currentUserId).order("date", { ascending: false }),
        supabase.from("treatments").select("*").eq("animal_id", animalId).eq("user_id", currentUserId).order("start_date", { ascending: false }),
        supabase.from("weight_records").select("*").eq("animal_id", animalId).eq("user_id", currentUserId).order("date", { ascending: true }),
        supabase.from("breeding_records").select("*").eq("user_id", currentUserId).or(`female_id.eq.${animalId},male_id.eq.${animalId}`).order("date", { ascending: false }),
        supabase.from("animal_notes").select("*").eq("animal_id", animalId).eq("user_id", currentUserId).order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").eq("target_id", animalId).eq("user_id", currentUserId).order("date", { ascending: false }).limit(20)
      ]);

      if (resAnimal.data) {
        const a = resAnimal.data;
        const { ownership, reproductiveStatus, cleanNotes } = parseExtendedDataFromNotes(a.notes || "");
        const { status, healthStatus, reproductiveStatus: finalRepro } = normalizeStatuses(a.status, a.health_status, reproductiveStatus);
        const photoUrl = a.primary_photo && a.primary_photo.trim() !== "" ? a.primary_photo : DEFAULT_ANIMAL_PHOTO;
        const photosList = (a.photos && Array.isArray(a.photos) && a.photos.length > 0)
          ? a.photos.filter((p: string) => p && p.trim() !== "")
          : [photoUrl];

        const loadedAnimal: Animal = {
          id: a.id,
          animal_code: a.animal_code,
          name: a.name || "",
          species: a.species,
          breed: a.breed,
          sex: a.sex,
          dob: a.dob || "",
          purchaseDate: a.purchase_date,
          purchasePrice: a.purchase_price !== null && a.purchase_price !== undefined ? parseFloat(a.purchase_price) : undefined,
          deathDate: a.death_date || undefined,
          source: a.source,
          status,
          healthStatus,
          reproductiveStatus: finalRepro,
          primaryPhoto: photoUrl,
          photos: photosList.length > 0 ? photosList : [DEFAULT_ANIMAL_PHOTO],
          ownershipType: ownership.ownershipType,
          ownerName: ownership.ownerName,
          custodian: ownership.custodian,
          agreement: ownership.agreement,
          notes: cleanNotes,
          parents: { motherId: a.mother_id || undefined, fatherId: a.father_id || undefined },
          created_at: a.created_at
        };

        setAnimals(prev => {
          const exists = prev.some(item => item.id === animalId);
          if (exists) {
            return prev.map(item => item.id === animalId ? loadedAnimal : item);
          }
          return [...prev, loadedAnimal];
        });

        if (
          (a.primary_photo && a.primary_photo.startsWith("data:image/")) ||
          (Array.isArray(a.photos) && a.photos.some((p: string) => p && p.startsWith("data:image/")))
        ) {
          migrateLegacyBase64Animals([a], currentUserId);
        }
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
  }, [session.isAuthenticated, session.userId, migrateLegacyBase64Animals]);

  const loadInventory = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedInventoryRef.current && !force) return;
    if (fetchingInventoryRef.current) return;
    fetchingInventoryRef.current = true;

    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, category, quantity, unit, min_stock, expiry_date, notes")
        .eq("user_id", session.userId);

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
  }, [session.isAuthenticated, session.userId]);

  const loadFarmNotes = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedFarmNotesRef.current && !force) return;
    if (fetchingFarmNotesRef.current) return;
    fetchingFarmNotesRef.current = true;

    try {
      const { data, error } = await supabase
        .from("farm_notes")
        .select("id, farm_id, title, content, created_by, created_at, updated_at")
        .eq("user_id", session.userId)
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
  }, [session.isAuthenticated, session.userId]);

  const loadContacts = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedContactsRef.current && !force) return;
    if (fetchingContactsRef.current) return;
    fetchingContactsRef.current = true;

    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, role, phone, whatsapp, email, address, notes")
        .eq("user_id", session.userId);

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
  }, [session.isAuthenticated, session.userId]);

  const loadFarmGallery = useCallback(async (force = false) => {
    if (!session.isAuthenticated || !session.userId) return;
    if (hasLoadedGalleryRef.current && !force) return;
    if (fetchingGalleryRef.current) return;
    fetchingGalleryRef.current = true;

    try {
      const { data, error } = await supabase
        .from("farm_gallery")
        .select("id, title, caption, category, image_url, created_at")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setFarmGallery(data.map((item: any) => ({
          id: item.id,
          title: item.title,
          caption: item.caption,
          category: item.category || "General",
          image_url: item.image_url,
          created_at: item.created_at || new Date().toISOString()
        })));
        hasLoadedGalleryRef.current = true;
      }
    } catch (err) {
      console.error("[FarmContext] Farm gallery load error:", err);
    } finally {
      fetchingGalleryRef.current = false;
    }
  }, [session.isAuthenticated, session.userId]);

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
        setFarmGallery([]);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [clearSessionCache]);

  useEffect(() => {
    if (session.isAuthenticated && session.userId) {
      loadAccount();
    }
  }, [session.isAuthenticated, session.userId, loadAccount]);

  const logActivity = async (type: string, description: string, actor: string, targetId?: string) => {
    const newId = "l_" + Date.now();
    const newLog = {
      id: newId,
      type,
      description,
      date: new Date().toISOString(),
      actor,
      targetId
    };

    setActivityLogs(prev => [newLog, ...prev].slice(0, 50));

    if (session.userId) {
      try {
        await supabase.from("activity_logs").insert([{
          id: newId,
          type,
          description,
          date: newLog.date,
          actor,
          target_id: targetId,
          user_id: session.userId
        }]);
      } catch (e) {
        console.error("[FarmContext] Activity log insert error", e);
      }
    }
  };

  const login = async (identifier: string, password: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const cleanInput = identifier.trim();
      let emailToUse = cleanInput;

      if (!cleanInput.includes("@")) {
        const normalizedInput = normalizeFarmName(cleanInput);
        
        const { data: accountRow, error: findErr } = await supabase
          .from("accounts")
          .select("email, farm_name")
          .or(`farm_name.ilike.${cleanInput},farm_name.ilike.${normalizedInput}`)
          .limit(1)
          .maybeSingle();

        if (findErr) {
          showError(formatDbError(findErr, "Database verification failed."));
          setIsLoadingData(false);
          return false;
        }

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
        showError(formatDbError(authError, "Incorrect password or login credentials."));
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
      showError(formatDbError(err, "An error occurred during sign in."));
    } finally {
      setIsLoadingData(false);
    }
    return false;
  };

  const signupAndSetup = async (email: string, password: string, name: string, rawFarmName: string, location: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const normalizedFarmName = normalizeFarmName(rawFarmName);

      const { data: existingFarm } = await supabase
        .from("accounts")
        .select("id")
        .ilike("farm_name", normalizedFarmName)
        .limit(1)
        .maybeSingle();

      if (existingFarm) {
        showError("This farm name is already registered. Please choose another name.");
        setIsLoadingData(false);
        return false;
      }

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
        showError(formatDbError(authError, "Failed to create farm login."));
        setIsLoadingData(false);
        return false;
      }

      if (authData?.user) {
        const { data: newAcct, error: acctErr } = await supabase.from("accounts").insert([{
          user_id: authData.user.id,
          farm_name: normalizedFarmName,
          operator_name: name.trim(),
          email: email.trim(),
          location: location.trim(),
          header_image_url: "/placeholder.svg"
        }]).select("id").single();

        if (acctErr) {
          showError(formatDbError(acctErr, "Failed to register farm account record."));
        } else if (newAcct?.id) {
          setAccountId(newAcct.id);
        }

        const newProfile = {
          ...farmProfile,
          name: normalizedFarmName,
          ownerName: name.trim(),
          location: location.trim(),
          email: email.trim(),
          image: "/placeholder.svg"
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
      showError(formatDbError(err, "Failed to create account."));
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
      setFarmGallery([]);
      showSuccess("Signed out successfully.");
    }
  };

  const updateFarmProfile = async (profile: FarmProfile): Promise<boolean> => {
    if (!session.userId) {
      showError("You must be logged in to update farm details.");
      return false;
    }

    const normalizedFarmName = normalizeFarmName(profile.name);
    const newEmail = (profile.email || session.email).trim();

    try {
      const { data: existingFarm } = await supabase
        .from("accounts")
        .select("id, user_id")
        .ilike("farm_name", normalizedFarmName)
        .neq("user_id", session.userId)
        .limit(1)
        .maybeSingle();

      if (existingFarm) {
        showError("This farm name is already registered. Please choose another name.");
        return false;
      }

      if (newEmail && newEmail.toLowerCase() !== session.email.toLowerCase()) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail });
        if (emailErr) {
          showError(formatDbError(emailErr, "Failed to update account email."));
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
        showError(formatDbError(metaErr, "Failed to update account metadata."));
        return false;
      }

      const accountPayload = {
        user_id: session.userId,
        farm_name: normalizedFarmName,
        operator_name: profile.ownerName,
        email: newEmail,
        location: profile.location,
        header_image_url: profile.image || "/placeholder.svg",
        updated_at: new Date().toISOString()
      };

      const { data: existingUserAccount } = await supabase
        .from("accounts")
        .select("id")
        .eq("user_id", session.userId)
        .limit(1)
        .maybeSingle();

      if (existingUserAccount?.id) {
        const { error: updateErr } = await supabase
          .from("accounts")
          .update(accountPayload)
          .eq("id", existingUserAccount.id)
          .eq("user_id", session.userId);

        if (updateErr) {
          showError(formatDbError(updateErr, "Failed to update database account record."));
          return false;
        }
        setAccountId(existingUserAccount.id);
      } else {
        const { data: newAcct, error: insertErr } = await supabase
          .from("accounts")
          .insert([accountPayload])
          .select("id")
          .single();

        if (insertErr) {
          showError(formatDbError(insertErr, "Failed to save account profile."));
          return false;
        }
        if (newAcct?.id) setAccountId(newAcct.id);
      }

      setFarmProfile({
        ...profile,
        name: normalizedFarmName,
        email: newEmail,
        image: profile.image || "/placeholder.svg"
      });
      setSession(prev => ({ ...prev, email: newEmail, name: profile.ownerName }));

      await logActivity("Farm Profile Updated", `Updated farm profile for ${normalizedFarmName}`, profile.ownerName);
      showSuccess("Farm profile updated successfully!");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Failed to update profile."));
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
        showError(formatDbError(error, "Failed to change password."));
        return false;
      }
      showSuccess("Account password changed successfully!");
      await logActivity("Password Changed", "Updated account access password", farmProfile.ownerName);
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Failed to change password."));
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
        const { data: accountRow, error } = await supabase
          .from("accounts")
          .select("email, farm_name")
          .or(`farm_name.ilike.${clean},farm_name.ilike.${normalized}`)
          .limit(1)
          .maybeSingle();

        if (error || !accountRow?.email) {
          showError(`Could not locate farm account registered under '${clean}'.`);
          return false;
        }
        emailToReset = accountRow.email;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: window.location.origin + "/login"
      });

      if (error) {
        showError(formatDbError(error, "Password reset failed."));
        return false;
      }

      showSuccess(`Password reset instructions sent to ${emailToReset}`);
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Password reset request failed."));
      return false;
    }
  };

  const addAnimal = async (animalData: Omit<Animal, "id" | "animal_code" | "created_at">) => {
    if (!session.userId) {
      showError("You must be logged in to register animals.");
      return;
    }

    const farmPrefix = getFarmPrefix(farmProfile.name || "YUS");
    const speciesCode = getSpeciesCode(animalData.species);
    const codePrefix = `${farmPrefix}${speciesCode}`;

    const { data: existingRows } = await supabase
      .from("animals")
      .select("animal_code")
      .eq("user_id", session.userId)
      .ilike("animal_code", `${codePrefix}%`);

    const dbCodes = (existingRows || []).map((r: any) => r.animal_code);
    const localCodes = animals.map(a => a.animal_code);
    const allCodes = new Set([...dbCodes, ...localCodes]);

    let maxNum = 0;
    allCodes.forEach(code => {
      if (code && typeof code === "string" && code.toUpperCase().startsWith(codePrefix.toUpperCase())) {
        const numPart = code.slice(codePrefix.length);
        const match = numPart.match(/^(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    let countNumber = maxNum + 1;
    let generatedCode = `${codePrefix}${countNumber.toString().padStart(3, "0")}`;

    while (allCodes.has(generatedCode)) {
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

    const encodedNotes = encodeExtendedDataIntoNotes(
      ownershipInfo,
      animalData.reproductiveStatus || "None",
      animalData.notes || ""
    );

    const rawPhotos = (animalData.photos && animalData.photos.length > 0)
      ? animalData.photos
      : [DEFAULT_ANIMAL_PHOTO];
    
    const cleanPhotos = await Promise.all(
      rawPhotos.map(p => ensureStorageUrl(p, session.userId, "animals"))
    );
    const cleanPrimary = animalData.primaryPhoto 
      ? await ensureStorageUrl(animalData.primaryPhoto, session.userId, "animals")
      : (cleanPhotos[0] || DEFAULT_ANIMAL_PHOTO);

    const dbPayload = {
      id: newId,
      animal_code: generatedCode,
      name: animalData.name ? animalData.name.trim() : "",
      species: animalData.species,
      breed: animalData.breed,
      sex: animalData.sex,
      dob: animalData.dob || null,
      purchase_date: animalData.purchaseDate || null,
      purchase_price: animalData.purchasePrice !== undefined && animalData.purchasePrice !== null ? animalData.purchasePrice : null,
      death_date: animalData.deathDate || null,
      source: animalData.source,
      status: animalData.status || "Active",
      health_status: animalData.healthStatus || "Healthy",
      primary_photo: cleanPrimary,
      photos: cleanPhotos,
      notes: encodedNotes,
      mother_id: animalData.parents?.motherId || null,
      father_id: animalData.parents?.fatherId || null,
      user_id: session.userId
    };

    const { error } = await supabase.from("animals").insert([dbPayload]);
    if (error) {
      showError(formatDbError(error, "Failed to save animal to database."));
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
      purchasePrice: animalData.purchasePrice,
      deathDate: animalData.deathDate,
      source: animalData.source,
      status: animalData.status || "Active",
      healthStatus: animalData.healthStatus || "Healthy",
      reproductiveStatus: animalData.reproductiveStatus || "None",
      primaryPhoto: cleanPrimary,
      photos: cleanPhotos,
      ownershipType: ownershipInfo.ownershipType,
      ownerName: ownershipInfo.ownerName,
      custodian: ownershipInfo.custodian,
      agreement: ownershipInfo.agreement,
      notes: animalData.notes || "",
      parents: animalData.parents,
      created_at: new Date().toISOString()
    };

    setAnimals(prev => [createdAnimalObj, ...prev]);

    // AUTOMATIC POST-BIRTH OFFSPRING TRANSITION FOR MOTHER
    // If an offspring is registered and linked to a mother, close pregnancy and transition mother to Lactating
    if (animalData.parents?.motherId) {
      const motherId = animalData.parents.motherId;
      const motherObj = animals.find(a => a.id === motherId);

      if (motherObj) {
        // Transition reproductive status to Lactating while preserving health status
        await updateAnimal(motherId, {
          reproductiveStatus: "Lactating"
        });

        // Find latest active breeding record for the mother and mark it Gave Birth with timing classification
        const motherBreedings = breedingRecords
          .filter(b => b.female_id === motherId && b.status !== "Failed" && b.status !== "Gave Birth")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (motherBreedings.length > 0) {
          const activeBreeding = motherBreedings[0];
          const matingDate = new Date(activeBreeding.date);
          const expectedDueDate = new Date(matingDate.getTime() + 150 * 24 * 60 * 60 * 1000);
          
          const birthDateStr = animalData.dob || new Date().toISOString().split("T")[0];
          const actualBirthDate = new Date(birthDateStr);

          // Calculate timing classification
          const diffTime = actualBirthDate.getTime() - expectedDueDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          let timingTag = "On Time";
          if (diffDays < 0) {
            timingTag = `Early by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
          } else if (diffDays > 0) {
            timingTag = `Late by ${diffDays} day${diffDays === 1 ? '' : 's'}`;
          }

          const updatedNotes = activeBreeding.notes 
            ? `${activeBreeding.notes} • [Birth: ${timingTag} on ${birthDateStr}]`
            : `[Birth: ${timingTag} on ${birthDateStr}]`;

          // Update breeding record status to Gave Birth in DB & local state
          await supabase
            .from("breeding_records")
            .update({
              status: "Gave Birth",
              notes: updatedNotes
            })
            .eq("id", activeBreeding.id)
            .eq("user_id", session.userId);

          setBreedingRecords(prev => prev.map(b => b.id === activeBreeding.id ? {
            ...b,
            status: "Gave Birth",
            notes: updatedNotes
          } : b));
        }
      }
    }

    await logActivity("Animal Registered", `Registered ${animalData.species} (${generatedCode})`, farmProfile.ownerName, newId);
    showSuccess(`Registered ${generatedCode}`);
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    if (!session.userId) return;
    const existing = animals.find(a => a.id === id);
    if (!existing) return;

    if (existing.status === "Deceased" && updates.status && updates.status !== "Active") {
      showError("This animal record is marked as deceased and is read-only.");
      return;
    }
    
    const currentOwnership: OwnershipData = {
      ownershipType: updates.ownershipType !== undefined ? updates.ownershipType : (existing.ownershipType || "Farm Owned"),
      ownerName: updates.ownershipType === "Farm Owned" ? undefined : (updates.ownerName !== undefined ? updates.ownerName : existing.ownerName),
      custodian: updates.ownershipType === "Farm Owned" ? undefined : (updates.custodian !== undefined ? updates.custodian : existing.custodian),
      agreement: updates.ownershipType === "Farm Owned" ? undefined : (updates.agreement !== undefined ? updates.agreement : existing.agreement),
    };

    const currentRepro = updates.reproductiveStatus !== undefined 
      ? updates.reproductiveStatus 
      : (existing.reproductiveStatus || "None");

    const currentHealth = updates.healthStatus !== undefined 
      ? updates.healthStatus 
      : (existing.healthStatus || "Healthy");

    const currentLifecycle = updates.status !== undefined 
      ? updates.status 
      : (existing.status || "Active");

    const baseNotes = updates.notes !== undefined ? updates.notes : (existing.notes || "");
    const encodedNotes = encodeExtendedDataIntoNotes(currentOwnership, currentRepro, baseNotes);

    const payload: any = {};

    if (
      updates.notes !== undefined ||
      updates.ownershipType !== undefined ||
      updates.ownerName !== undefined ||
      updates.custodian !== undefined ||
      updates.agreement !== undefined ||
      updates.reproductiveStatus !== undefined
    ) {
      payload.notes = encodedNotes;
    }

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.species !== undefined) payload.species = updates.species;
    if (updates.breed !== undefined) payload.breed = updates.breed;
    if (updates.sex !== undefined) payload.sex = updates.sex;
    if (updates.dob !== undefined) payload.dob = updates.dob || null;
    if (updates.purchaseDate !== undefined) payload.purchase_date = updates.purchaseDate || null;
    if (updates.purchasePrice !== undefined) payload.purchase_price = updates.purchasePrice !== null ? updates.purchasePrice : null;
    if (updates.deathDate !== undefined) payload.death_date = updates.deathDate || null;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.status !== undefined) payload.status = currentLifecycle;
    if (updates.healthStatus !== undefined) payload.health_status = currentHealth;

    if (updates.primaryPhoto !== undefined) {
      payload.primary_photo = await ensureStorageUrl(updates.primaryPhoto, session.userId, "animals");
    }

    if (updates.photos !== undefined) {
      payload.photos = await Promise.all(
        updates.photos.map(p => ensureStorageUrl(p, session.userId, "animals"))
      );
    }

    if (updates.parents !== undefined) {
      payload.mother_id = updates.parents.motherId || null;
      payload.father_id = updates.parents.fatherId || null;
    }

    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase
      .from("animals")
      .update(payload)
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to update animal."));
      return;
    }

    setAnimals(prev => prev.map(a => {
      if (a.id === id) {
        const newParents = updates.parents !== undefined 
          ? { motherId: updates.parents.motherId, fatherId: updates.parents.fatherId }
          : a.parents;

        return {
          ...a,
          ...updates,
          status: currentLifecycle,
          healthStatus: currentHealth,
          reproductiveStatus: currentRepro,
          primaryPhoto: payload.primary_photo !== undefined ? payload.primary_photo : a.primaryPhoto,
          photos: payload.photos !== undefined ? payload.photos : a.photos,
          parents: newParents,
          ownershipType: currentOwnership.ownershipType,
          ownerName: currentOwnership.ownerName,
          custodian: currentOwnership.custodian,
          agreement: currentOwnership.agreement,
          notes: baseNotes
        };
      }
      return a;
    }));

    await logActivity("Animal Updated", `Updated details for ${existing.animal_code}`, farmProfile.ownerName, id);
    showSuccess("Animal record updated");
  };

  const deleteAnimal = async (id: string) => {
    if (!session.userId) return;
    const target = animals.find(a => a.id === id);
    const { error } = await supabase
      .from("animals")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to delete animal."));
      return;
    }

    setAnimals(prev => prev.filter(a => a.id !== id));
    await logActivity("Animal Removed", `Removed ${target?.animal_code || "livestock"} from registry`, farmProfile.ownerName, id);
    showSuccess("Animal record deleted");
  };

  const addHealthRecord = async (record: Omit<HealthRecord, "id">) => {
    if (!session.userId) return;
    const newId = "h_" + Date.now();
    const { error } = await supabase.from("health_records").insert([{
      id: newId,
      animal_id: record.animal_id,
      type: record.type,
      date: record.date,
      details: record.details,
      medication: record.medication,
      recorded_by: record.recordedBy,
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to log health event."));
      return;
    }

    let hStatus: HealthStatus = "Healthy";
    if (record.type === "Diagnosis" || record.type === "Observation") {
      hStatus = "Monitoring";
    } else if (record.type === "Treatment") {
      hStatus = "Under Treatment";
    }

    await supabase
      .from("animals")
      .update({ health_status: hStatus })
      .eq("id", record.animal_id)
      .eq("user_id", session.userId);
    
    setHealthRecords(prev => [{ id: newId, ...record }, ...prev]);
    setAnimals(prev => prev.map(a => a.id === record.animal_id ? { ...a, healthStatus: hStatus } : a));
    const animalObj = animals.find(a => a.id === record.animal_id);
    await logActivity("Health Logged", `Logged ${record.type} for ${animalObj?.animal_code || 'animal'}: ${record.details.slice(0, 40)}`, record.recordedBy, record.animal_id);
    showSuccess("Health event recorded");
  };

  const addTreatment = async (treatmentData: Omit<Treatment, "id">) => {
    if (!session.userId) return;
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
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to add treatment."));
      return;
    }

    await supabase
      .from("animals")
      .update({ health_status: "Under Treatment" })
      .eq("id", treatmentData.animal_id)
      .eq("user_id", session.userId);
    
    setTreatments(prev => [{ id: newId, ...treatmentData }, ...prev]);
    setAnimals(prev => prev.map(a => a.id === treatmentData.animal_id ? { ...a, healthStatus: "Under Treatment" } : a));
    const animalObj = animals.find(a => a.id === treatmentData.animal_id);
    await logActivity("Treatment Started", `Started Rx (${treatmentData.medication}) for ${animalObj?.animal_code || 'animal'}`, farmProfile.ownerName, treatmentData.animal_id);
    showSuccess("Treatment started");
  };

  const updateTreatmentStatus = async (id: string, status: "Ongoing" | "Completed" | "Stopped") => {
    if (!session.userId) return;
    const { error } = await supabase
      .from("treatments")
      .update({ status })
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to update treatment."));
      return;
    }

    const currentTx = treatments.find(t => t.id === id);
    if (status === "Completed" && currentTx) {
      await supabase
        .from("animals")
        .update({ health_status: "Healthy" })
        .eq("id", currentTx.animal_id)
        .eq("user_id", session.userId);

      setAnimals(prev => prev.map(a => a.id === currentTx.animal_id ? { ...a, healthStatus: "Healthy" } : a));
    }

    setTreatments(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    await logActivity("Treatment Status", `Marked treatment for ${currentTx?.condition || 'condition'} as ${status}`, farmProfile.ownerName, currentTx?.animal_id);
    showSuccess(`Treatment status: ${status}`);
  };

  const addWeightRecord = async (record: Omit<WeightRecord, "id">) => {
    if (!session.userId) return;
    const newId = "w_" + Date.now();
    const { error } = await supabase.from("weight_records").insert([{
      id: newId,
      animal_id: record.animal_id,
      weight: record.weight,
      date: record.date,
      notes: record.notes,
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to log weight."));
      return;
    }

    setWeightRecords(prev => [...prev, { id: newId, ...record }]);
    const animalObj = animals.find(a => a.id === record.animal_id);
    await logActivity("Weight Logged", `Recorded ${record.weight} kg for ${animalObj?.animal_code || 'animal'}`, farmProfile.ownerName, record.animal_id);
    showSuccess("Weight logged");
  };

  const addBreedingRecord = async (record: Omit<BreedingRecord, "id">) => {
    if (!session.userId) return;
    const newId = "b_" + Date.now();
    const { error } = await supabase.from("breeding_records").insert([{
      id: newId,
      female_id: record.female_id,
      male_id: record.male_id,
      date: record.date,
      status: record.status,
      notes: record.notes,
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to log breeding."));
      return;
    }

    // When breeding is logged for female, start/update pregnancy reproductive status while leaving healthStatus untouched
    if (record.female_id && record.status !== "Failed") {
      const femaleAnimal = animals.find(a => a.id === record.female_id);
      if (femaleAnimal) {
        await updateAnimal(femaleAnimal.id, { reproductiveStatus: "Pregnant" });
      }
    }

    setBreedingRecords(prev => [{ id: newId, ...record }, ...prev]);
    await logActivity("Breeding Logged", `Logged mating cycle status (${record.status})`, farmProfile.ownerName, record.female_id);
    showSuccess("Breeding event logged & pregnancy countdown active");
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    if (!session.userId) return;
    const newId = "i_" + Date.now();
    const { error } = await supabase.from("inventory").insert([{
      id: newId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.minStock,
      notes: item.notes,
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to add inventory."));
      return;
    }

    setInventory(prev => [{ id: newId, ...item }, ...prev]);
    await logActivity("Inventory Added", `Added supply item: ${item.name} (${item.quantity} ${item.unit})`, farmProfile.ownerName);
    showSuccess("Supply item added");
  };

  const updateInventoryStock = async (itemId: string, qtyChange: number, type: "add" | "remove" | "adjust", notes: string, recordedBy: string) => {
    if (!session.userId) return;
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

    const { error } = await supabase
      .from("inventory")
      .update({ quantity: newQty })
      .eq("id", itemId)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to update stock."));
      return;
    }

    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
    await logActivity("Stock Adjusted", `Adjusted stock for ${target.name}: now ${newQty} ${target.unit}`, recordedBy || farmProfile.ownerName);
    showSuccess("Stock quantity updated");
  };

  const deleteInventoryItem = async (id: string) => {
    if (!session.userId) return;
    const target = inventory.find(i => i.id === id);
    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to delete inventory item."));
      return;
    }

    setInventory(prev => prev.filter(i => i.id !== id));
    await logActivity("Inventory Deleted", `Deleted supply item: ${target?.name || ''}`, farmProfile.ownerName);
    showSuccess("Inventory item deleted");
  };

  const addContact = async (contact: Omit<Contact, "id">) => {
    if (!session.userId) return;
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
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to add contact."));
      return;
    }

    setContacts(prev => [{ id: newId, ...contact }, ...prev]);
    await logActivity("Contact Added", `Added ${contact.name} (${contact.role}) to contacts`, farmProfile.ownerName);
    showSuccess("Contact added");
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    if (!session.userId) return;
    const { error } = await supabase
      .from("contacts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to update contact."));
      return;
    }
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteContact = async (id: string) => {
    if (!session.userId) return;
    const target = contacts.find(c => c.id === id);
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to delete contact."));
      return;
    }
    setContacts(prev => prev.filter(c => c.id !== id));
    await logActivity("Contact Deleted", `Removed contact ${target?.name || ''}`, farmProfile.ownerName);
    showSuccess("Contact removed");
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "completed">) => {
    if (!session.userId) return;
    const newId = "r_" + Date.now();
    const { error } = await supabase.from("reminders").insert([{
      id: newId,
      title: reminder.title,
      type: reminder.type,
      due_date: reminder.dueDate,
      animal_id: reminder.animal_id,
      completed: false,
      notes: reminder.notes,
      user_id: session.userId
    }]);

    if (error) {
      showError(formatDbError(error, "Failed to create reminder."));
      return;
    }

    setReminders(prev => [{ id: newId, completed: false, ...reminder }, ...prev]);
    await logActivity("Reminder Set", `Created calendar task: ${reminder.title}`, farmProfile.ownerName, reminder.animal_id);
    showSuccess("Reminder created");
  };

  const toggleReminder = async (id: string) => {
    if (!session.userId) return;
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const { error } = await supabase
      .from("reminders")
      .update({ completed: !target.completed })
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      showError(formatDbError(error, "Failed to update reminder."));
      return;
    }

    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    await logActivity("Reminder Completed", `Completed task: ${target.title}`, farmProfile.ownerName, target.animal_id);
  };

  const addFarmNote = async (note: { title?: string; content: string }): Promise<boolean> => {
    if (!session.userId) return false;
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
        user_id: session.userId
      }]);

      if (error) {
        showError(formatDbError(error, "Couldn't save farm note."));
        return false;
      }

      setFarmNotes(prev => [newRecord, ...prev]);
      await logActivity("Farm Note Added", `Added farm note: "${(note.title || note.content).slice(0, 35)}..."`, farmProfile.ownerName);
      showSuccess("Farm note saved");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't save note."));
      return false;
    }
  };

  const updateFarmNote = async (id: string, updates: { title?: string; content: string }): Promise<boolean> => {
    if (!session.userId) return false;
    const payload = {
      title: updates.title?.trim() || null,
      content: updates.content.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from("farm_notes")
        .update(payload)
        .eq("id", id)
        .eq("user_id", session.userId);

      if (error) {
        showError(formatDbError(error, "Couldn't update farm note."));
        return false;
      }

      setFarmNotes(prev => prev.map(fn => fn.id === id ? { ...fn, title: updates.title, content: updates.content, updated_at: payload.updated_at } : fn));
      await logActivity("Farm Note Updated", `Edited farm note "${(updates.title || updates.content).slice(0, 30)}..."`, farmProfile.ownerName);
      showSuccess("Farm note updated");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't update note."));
      return false;
    }
  };

  const deleteFarmNote = async (id: string): Promise<boolean> => {
    if (!session.userId) return false;
    const target = farmNotes.find(f => f.id === id);

    try {
      const { error } = await supabase
        .from("farm_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", session.userId);

      if (error) {
        showError(formatDbError(error, "Couldn't delete note."));
        return false;
      }

      setFarmNotes(prev => prev.filter(f => f.id !== id));
      await logActivity("Farm Note Deleted", `Deleted farm note: "${(target?.title || target?.content || '').slice(0, 30)}"`, farmProfile.ownerName);
      showSuccess("Farm note deleted");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't delete note."));
      return false;
    }
  };

  const addAnimalNote = async (note: { animal_id: string; content: string }): Promise<boolean> => {
    if (!session.userId) return false;
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
        user_id: session.userId
      }]);

      if (error) {
        showError(formatDbError(error, "Couldn't save note."));
        return false;
      }

      setAnimalNotes(prev => [newRecord, ...prev]);
      const animalObj = animals.find(a => a.id === note.animal_id);
      await logActivity("Animal Note Added", `Logged note for ${animalObj?.animal_code || 'livestock'}: "${note.content.slice(0, 30)}..."`, farmProfile.ownerName, note.animal_id);
      showSuccess("Animal note saved");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't save note."));
      return false;
    }
  };

  const updateAnimalNote = async (id: string, content: string): Promise<boolean> => {
    if (!session.userId) return false;
    const payload = {
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from("animal_notes")
        .update(payload)
        .eq("id", id)
        .eq("user_id", session.userId);

      if (error) {
        showError(formatDbError(error, "Couldn't update note."));
        return false;
      }

      setAnimalNotes(prev => prev.map(an => an.id === id ? { ...an, content: content.trim(), updated_at: payload.updated_at } : an));
      await logActivity("Animal Note Updated", `Edited animal note: "${content.slice(0, 30)}..."`, farmProfile.ownerName);
      showSuccess("Animal note updated");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't update note."));
      return false;
    }
  };

  const deleteAnimalNote = async (id: string): Promise<boolean> => {
    if (!session.userId) return false;
    const target = animalNotes.find(a => a.id === id);

    try {
      const { error } = await supabase
        .from("animal_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", session.userId);

      if (error) {
        showError(formatDbError(error, "Couldn't delete note."));
        return false;
      }

      setAnimalNotes(prev => prev.filter(a => a.id !== id));
      await logActivity("Animal Note Deleted", `Deleted animal note`, farmProfile.ownerName, target?.animal_id);
      showSuccess("Animal note deleted");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't delete note."));
      return false;
    }
  };

  const addFarmGalleryPhoto = async (photoData: { title?: string; caption?: string; category: string; file?: File; dataUrl?: string }): Promise<boolean> => {
    if (!session.userId) return false;
    const newId = "fg_" + Date.now();
    let finalImageUrl = photoData.dataUrl || "";

    try {
      if (photoData.file) {
        finalImageUrl = await uploadImageToStorage(photoData.file, session.userId, "farm-gallery");
      } else if (photoData.dataUrl) {
        finalImageUrl = await ensureStorageUrl(photoData.dataUrl, session.userId, "farm-gallery");
      }

      if (!finalImageUrl) {
        showError("Please provide an image file or photo.");
        return false;
      }

      const dbPayload = {
        id: newId,
        title: photoData.title?.trim() || null,
        caption: photoData.caption?.trim() || null,
        category: photoData.category || "General",
        image_url: finalImageUrl,
        user_id: session.userId,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("farm_gallery").insert([dbPayload]);
      if (error) {
        showError(formatDbError(error, "Couldn't save photo record."));
        return false;
      }

      const newItem: FarmGalleryItem = {
        id: newId,
        title: photoData.title?.trim() || undefined,
        caption: photoData.caption?.trim() || undefined,
        category: (photoData.category as any) || "General",
        image_url: finalImageUrl,
        created_at: dbPayload.created_at
      };

      setFarmGallery(prev => [newItem, ...prev]);
      await logActivity("Farm Gallery Photo Added", `Uploaded photo "${photoData.title || photoData.category}" to Farm Gallery`, farmProfile.ownerName);
      showSuccess("Photo added to General Farm Gallery!");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't save photo."));
      return false;
    }
  };

  const deleteFarmGalleryPhoto = async (id: string, imageUrl?: string): Promise<boolean> => {
    if (!session.userId) return false;
    try {
      const { error } = await supabase
        .from("farm_gallery")
        .delete()
        .eq("id", id)
        .eq("user_id", session.userId);

      if (error) {
        showError(formatDbError(error, "Couldn't delete photo."));
        return false;
      }

      if (imageUrl && imageUrl.includes("/farm-gallery/")) {
        const parts = imageUrl.split("/farm-gallery/");
        if (parts[1]) {
          await supabase.storage.from("farm-gallery").remove([parts[1]]);
        }
      }

      setFarmGallery(prev => prev.filter(item => item.id !== id));
      await logActivity("Farm Gallery Photo Deleted", `Deleted photo from General Farm Gallery`, farmProfile.ownerName);
      showSuccess("Photo deleted from gallery.");
      return true;
    } catch (e: any) {
      showError(formatDbError(e, "Couldn't delete photo."));
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
        farmGallery,
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
        loadFarmGallery,
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
        addFarmGalleryPhoto,
        deleteFarmGalleryPhoto,
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