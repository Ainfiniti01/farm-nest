import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";

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
  addContact: (contact: Omit<Contact, "id">) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, "id" | "completed">) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addFarmNote: (note: { title?: string; content: string }) => Promise<void>;
  updateFarmNote: (id: string, updates: { title?: string; content: string }) => Promise<void>;
  deleteFarmNote: (id: string) => Promise<void>;
  addAnimalNote: (note: { animal_id: string; content: string }) => Promise<void>;
  updateAnimalNote: (id: string, content: string) => Promise<void>;
  deleteAnimalNote: (id: string) => Promise<void>;
  logActivity: (type: string, description: string, actor: string, targetId?: string) => Promise<void>;
  updateFarmProfile: (profile: FarmProfile) => Promise<void>;
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
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Guards against concurrent duplicate fetch streams
  const isFetchingRef = useRef<boolean>(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isLoggingOutRef = useRef<boolean>(false);
  
  const [farmProfile, setFarmProfile] = useState<FarmProfile>({
    name: "My Farm",
    description: "Agricultural production unit.",
    ownerName: "Operator",
    location: "Kano, Nigeria",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80",
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

  // Single consolidated concurrent fetch for accounts profile + all farm tables
  const loadUserProfileAndData = useCallback(async (userId: string, userMetadata?: any) => {
    if (isFetchingRef.current && lastFetchedUserIdRef.current === userId) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchedUserIdRef.current = userId;
    setIsLoadingData(true);

    try {
      const [
        acctRes,
        resAnimals,
        resHealth,
        resTreatments,
        resWeights,
        resBreeding,
        resInventory,
        resContacts,
        resReminders,
        resFarmNotes,
        resAnimalNotes,
        resLogs
      ] = await Promise.all([
        supabase.from("accounts").select("farm_name, operator_name, location").eq("user_id", userId).maybeSingle(),
        supabase.from("animals").select("*"),
        supabase.from("health_records").select("*"),
        supabase.from("treatments").select("*"),
        supabase.from("weight_records").select("*"),
        supabase.from("breeding_records").select("*"),
        supabase.from("inventory").select("*"),
        supabase.from("contacts").select("*"),
        supabase.from("reminders").select("*"),
        supabase.from("farm_notes").select("*").order("created_at", { ascending: false }),
        supabase.from("animal_notes").select("*").order("created_at", { ascending: false }),
        supabase.from("activity_logs").select("*").order("date", { ascending: false }).limit(25)
      ]);

      // 1. Process Farm Account Profile
      if (acctRes.data) {
        setFarmProfile(prev => ({
          ...prev,
          name: acctRes.data.farm_name || prev.name,
          ownerName: acctRes.data.operator_name || prev.ownerName,
          location: acctRes.data.location || prev.location
        }));
      } else if (userMetadata?.farmName) {
        setFarmProfile(prev => ({
          ...prev,
          name: userMetadata.farmName,
          ownerName: userMetadata.name || prev.ownerName,
          location: userMetadata.location || prev.location
        }));
      }

      // 2. Process Table Datasets safely
      if (resAnimals.data) {
        setAnimals(resAnimals.data.map((a: any) => ({
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
          primaryPhoto: a.primary_photo,
          photos: a.photos || [],
          notes: a.notes || "",
          parents: { motherId: a.mother_id, fatherId: a.father_id },
          created_at: a.created_at
        })));
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
        setTreatments(resTreatments.data.map((t: any) => ({
          id: t.id,
          animal_id: t.animal_id,
          condition: t.condition,
          medication: t.medication,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          notes: t.notes,
          followUpDate: t.follow_up_date
        })));
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

      if (resInventory.data) {
        setInventory(resInventory.data.map((i: any) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          minStock: parseFloat(i.min_stock),
          expiryDate: i.expiry_date,
          notes: i.notes
        })));
      }

      if (resContacts.data) {
        setContacts(resContacts.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          phone: c.phone,
          whatsapp: c.whatsapp,
          email: c.email,
          address: c.address,
          notes: c.notes
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

      // Handle Farm Notes gracefully if table exists or is empty
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

      // Handle Animal Notes gracefully if table exists or is empty
      if (resAnimalNotes.data && !resAnimalNotes.error) {
        setAnimalNotes(resAnimalNotes.data.map((an: any) => ({
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

    } catch (err) {
      console.error("[FarmContext] Data reload error from Supabase:", err);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingData(false);
    }
  }, []);

  const reloadFarmData = useCallback(async () => {
    if (session.userId) {
      await loadUserProfileAndData(session.userId);
    }
  }, [loadUserProfileAndData, session.userId]);

  // Fast Authentication Restoration Loop
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
            setSession({
              userId: sbSession.user.id,
              email: sbSession.user.email || "",
              name: sbSession.user.user_metadata?.name || "Operator",
              isAuthenticated: true
            });
            setIsAuthReady(true);
            loadUserProfileAndData(sbSession.user.id, sbSession.user.user_metadata);
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
          setSession({
            userId: sbSession.user.id,
            email: sbSession.user.email || "",
            name: sbSession.user.user_metadata?.name || "Operator",
            isAuthenticated: true
          });
          setIsAuthReady(true);
          loadUserProfileAndData(sbSession.user.id, sbSession.user.user_metadata);
        }
      } else if (event === "SIGNED_OUT") {
        lastFetchedUserIdRef.current = null;
        setSession({
          userId: undefined,
          email: "",
          name: "",
          isAuthenticated: false
        });
        setIsAuthReady(true);
        setIsLoadingData(false);
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
  }, [loadUserProfileAndData]);

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
      let emailToUse = identifier.trim();

      if (!emailToUse.includes("@")) {
        const { data: accountRow } = await supabase
          .from("accounts")
          .select("email, farm_name")
          .ilike("farm_name", emailToUse)
          .maybeSingle();

        if (accountRow?.email) {
          emailToUse = accountRow.email;
        } else {
          showError(`No farm account registered under '${identifier}'.`);
          setIsLoadingData(false);
          return false;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (authError) {
        showError("Incorrect email/farm name or password.");
        setIsLoadingData(false);
        return false;
      }

      if (authData?.user) {
        setSession({
          userId: authData.user.id,
          email: authData.user.email || "",
          name: authData.user.user_metadata?.name || "Operator",
          isAuthenticated: true
        });
        await loadUserProfileAndData(authData.user.id, authData.user.user_metadata);
        showSuccess("Signed in successfully!");
        return true;
      }
    } catch (err: any) {
      showError(err.message || "An error occurred during sign in.");
    } finally {
      setIsLoadingData(false);
    }
    return false;
  };

  const signupAndSetup = async (email: string, password: string, name: string, farmName: string, location: string): Promise<boolean> => {
    setIsLoadingData(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            farmName,
            location
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
          await supabase.from("accounts").insert([{
            user_id: authData.user.id,
            farm_name: farmName,
            operator_name: name,
            email: email,
            location: location
          }]);
        } catch (e) {
          console.warn("[FarmContext] Accounts insert note", e);
        }

        const newProfile = {
          ...farmProfile,
          name: farmName,
          ownerName: name,
          location
        };
        setFarmProfile(newProfile);

        setSession({
          userId: authData.user.id,
          email: authData.user.email || "",
          name: name,
          isAuthenticated: true
        });

        showSuccess(`Farm setup complete for ${farmName}!`);
        return true;
      }
    } catch (err: any) {
      showError(err.message || "Failed to create account.");
    } finally {
      setIsLoadingData(false);
    }
    return false;
  };

  // Safe local sign-out to prevent 403 Forbidden loops on global auth logout
  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.warn("[FarmContext] Local signout warning", e);
    } finally {
      isLoggingOutRef.current = false;
      lastFetchedUserIdRef.current = null;
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

  const addAnimal = async (animalData: Omit<Animal, "id" | "animal_code" | "created_at">) => {
    const prefix = animalData.species.toUpperCase();
    const speciesCount = animals.filter(a => a.species === animalData.species).length + 1;
    const generatedCode = `${prefix}-${speciesCount.toString().padStart(4, "0")}`;
    const newId = "a_" + Date.now();

    const dbPayload = {
      id: newId,
      animal_code: generatedCode,
      name: animalData.name,
      species: animalData.species,
      breed: animalData.breed,
      sex: animalData.sex,
      dob: animalData.dob,
      purchase_date: animalData.purchaseDate,
      source: animalData.source,
      status: animalData.status,
      health_status: animalData.healthStatus,
      primary_photo: animalData.primaryPhoto,
      photos: animalData.photos,
      notes: animalData.notes,
      mother_id: animalData.parents?.motherId,
      father_id: animalData.parents?.fatherId,
      user_id: session.userId || null
    };

    const { error } = await supabase.from("animals").insert([dbPayload]);
    if (error) {
      showError("Failed to save animal to database: " + error.message);
      return;
    }

    await reloadFarmData();
    await logActivity("Animal Registered", `Registered ${animalData.species} (${generatedCode})`, farmProfile.ownerName, newId);
    showSuccess(`Registered ${generatedCode}`);
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.breed !== undefined) payload.breed = updates.breed;
    if (updates.sex !== undefined) payload.sex = updates.sex;
    if (updates.dob !== undefined) payload.dob = updates.dob;
    if (updates.purchaseDate !== undefined) payload.purchase_date = updates.purchaseDate;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.healthStatus !== undefined) payload.health_status = updates.healthStatus;
    if (updates.primaryPhoto !== undefined) payload.primary_photo = updates.primaryPhoto;
    if (updates.photos !== undefined) payload.photos = updates.photos;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.parents?.motherId !== undefined) payload.mother_id = updates.parents.motherId;
    if (updates.parents?.fatherId !== undefined) payload.father_id = updates.parents.fatherId;

    const { error } = await supabase.from("animals").update(payload).eq("id", id);
    if (error) {
      showError("Failed to update animal: " + error.message);
      return;
    }

    await reloadFarmData();
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
    await reloadFarmData();
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

    let newStatus = "Healthy";
    let hStatus = "Healthy";
    if (record.type === "Diagnosis" || record.type === "Observation") {
      newStatus = "Monitoring";
      hStatus = "Monitoring";
    } else if (record.type === "Treatment") {
      newStatus = "Under Treatment";
      hStatus = "Under Treatment";
    }

    await supabase.from("animals").update({ status: newStatus, health_status: hStatus }).eq("id", record.animal_id);
    await reloadFarmData();
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
    await reloadFarmData();
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
    }

    await reloadFarmData();
    await logActivity("Treatment Status", `Marked treatment for ${currentTx?.condition || 'condition'} as ${status}`, farmProfile.ownerName, currentTx?.animal_id);
    showSuccess(`Treatment status: ${status}`);
  };

  const addWeightRecord = async (record: Omit<WeightRecord, "id">) => {
    const { error } = await supabase.from("weight_records").insert([{
      id: "w_" + Date.now(),
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

    await reloadFarmData();
    const animalObj = animals.find(a => a.id === record.animal_id);
    await logActivity("Weight Logged", `Recorded ${record.weight} kg for ${animalObj?.animal_code || 'animal'}`, farmProfile.ownerName, record.animal_id);
    showSuccess("Weight logged");
  };

  const addBreedingRecord = async (record: Omit<BreedingRecord, "id">) => {
    const { error } = await supabase.from("breeding_records").insert([{
      id: "b_" + Date.now(),
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

    await reloadFarmData();
    await logActivity("Breeding Logged", `Logged mating cycle status (${record.status})`, farmProfile.ownerName, record.female_id);
    showSuccess("Breeding event logged");
  };

  const addInventoryItem = async (item: Omit<InventoryItem, "id">) => {
    const { error } = await supabase.from("inventory").insert([{
      id: "i_" + Date.now(),
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

    await reloadFarmData();
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

    await reloadFarmData();
    await logActivity("Stock Adjusted", `Adjusted stock for ${target.name}: now ${newQty} ${target.unit}`, recordedBy || farmProfile.ownerName);
    showSuccess("Stock quantity updated");
  };

  const addContact = async (contact: Omit<Contact, "id">) => {
    const { error } = await supabase.from("contacts").insert([{
      id: "c_" + Date.now(),
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

    await reloadFarmData();
    await logActivity("Contact Added", `Added ${contact.name} (${contact.role}) to contacts`, farmProfile.ownerName);
    showSuccess("Contact added");
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { error } = await supabase.from("contacts").update(updates).eq("id", id);
    if (error) {
      showError("Failed to update contact: " + error.message);
      return;
    }
    await reloadFarmData();
  };

  const deleteContact = async (id: string) => {
    const target = contacts.find(c => c.id === id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      showError("Failed to delete contact: " + error.message);
      return;
    }
    await reloadFarmData();
    await logActivity("Contact Deleted", `Removed contact ${target?.name || ''}`, farmProfile.ownerName);
    showSuccess("Contact removed");
  };

  const addReminder = async (reminder: Omit<Reminder, "id" | "completed">) => {
    const { error } = await supabase.from("reminders").insert([{
      id: "r_" + Date.now(),
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

    await reloadFarmData();
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

    await reloadFarmData();
    await logActivity("Reminder Completed", `Completed task: ${target.title}`, farmProfile.ownerName, target.animal_id);
  };

  // FARM NOTES ACTIONS
  const addFarmNote = async (note: { title?: string; content: string }) => {
    const newId = "fn_" + Date.now();
    const newRecord: FarmNote = {
      id: newId,
      title: note.title?.trim() || undefined,
      content: note.content.trim(),
      created_by: farmProfile.ownerName || "Operator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setFarmNotes(prev => [newRecord, ...prev]);

    try {
      const { error } = await supabase.from("farm_notes").insert([{
        id: newRecord.id,
        title: newRecord.title || null,
        content: newRecord.content,
        created_by: newRecord.created_by,
        user_id: session.userId || null
      }]);
      if (error) {
        console.warn("[FarmContext] farm_notes table insert warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] farm_notes table write exception", e);
    }

    await reloadFarmData();
    await logActivity("Farm Note Added", `Added farm note: "${(note.title || note.content).slice(0, 35)}..."`, farmProfile.ownerName);
    showSuccess("Farm note recorded!");
  };

  const updateFarmNote = async (id: string, updates: { title?: string; content: string }) => {
    const payload = {
      title: updates.title?.trim() || null,
      content: updates.content.trim(),
      updated_at: new Date().toISOString()
    };

    setFarmNotes(prev => prev.map(fn => fn.id === id ? { ...fn, title: updates.title, content: updates.content, updated_at: payload.updated_at } : fn));

    try {
      const { error } = await supabase.from("farm_notes").update(payload).eq("id", id);
      if (error) {
        console.warn("[FarmContext] farm_notes table update warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] farm_notes table update exception", e);
    }

    await reloadFarmData();
    await logActivity("Farm Note Updated", `Edited farm note "${(updates.title || updates.content).slice(0, 30)}..."`, farmProfile.ownerName);
    showSuccess("Farm note updated!");
  };

  const deleteFarmNote = async (id: string) => {
    const target = farmNotes.find(f => f.id === id);
    setFarmNotes(prev => prev.filter(f => f.id !== id));

    try {
      const { error } = await supabase.from("farm_notes").delete().eq("id", id);
      if (error) {
        console.warn("[FarmContext] farm_notes delete warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] farm_notes delete exception", e);
    }

    await reloadFarmData();
    await logActivity("Farm Note Deleted", `Deleted farm note: "${(target?.title || target?.content || '').slice(0, 30)}"`, farmProfile.ownerName);
    showSuccess("Farm note deleted!");
  };

  // ANIMAL NOTES ACTIONS
  const addAnimalNote = async (note: { animal_id: string; content: string }) => {
    const newId = "an_" + Date.now();
    const newRecord: AnimalNote = {
      id: newId,
      animal_id: note.animal_id,
      content: note.content.trim(),
      created_by: farmProfile.ownerName || "Operator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setAnimalNotes(prev => [newRecord, ...prev]);

    try {
      const { error } = await supabase.from("animal_notes").insert([{
        id: newRecord.id,
        animal_id: newRecord.animal_id,
        content: newRecord.content,
        created_by: newRecord.created_by,
        user_id: session.userId || null
      }]);
      if (error) {
        console.warn("[FarmContext] animal_notes table insert warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] animal_notes table write exception", e);
    }

    await reloadFarmData();
    const animalObj = animals.find(a => a.id === note.animal_id);
    await logActivity("Animal Note Added", `Logged note for ${animalObj?.animal_code || 'livestock'}: "${note.content.slice(0, 30)}..."`, farmProfile.ownerName, note.animal_id);
    showSuccess("Animal note recorded!");
  };

  const updateAnimalNote = async (id: string, content: string) => {
    const payload = {
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    setAnimalNotes(prev => prev.map(an => an.id === id ? { ...an, content: content.trim(), updated_at: payload.updated_at } : an));

    try {
      const { error } = await supabase.from("animal_notes").update(payload).eq("id", id);
      if (error) {
        console.warn("[FarmContext] animal_notes table update warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] animal_notes table update exception", e);
    }

    await reloadFarmData();
    await logActivity("Animal Note Updated", `Edited animal note: "${content.slice(0, 30)}..."`, farmProfile.ownerName);
    showSuccess("Animal note updated!");
  };

  const deleteAnimalNote = async (id: string) => {
    const target = animalNotes.find(a => a.id === id);
    setAnimalNotes(prev => prev.filter(a => a.id !== id));

    try {
      const { error } = await supabase.from("animal_notes").delete().eq("id", id);
      if (error) {
        console.warn("[FarmContext] animal_notes delete warn", error);
      }
    } catch (e) {
      console.warn("[FarmContext] animal_notes delete exception", e);
    }

    await reloadFarmData();
    await logActivity("Animal Note Deleted", `Deleted animal note`, farmProfile.ownerName, target?.animal_id);
    showSuccess("Animal note deleted!");
  };

  const updateFarmProfile = async (profile: FarmProfile) => {
    setFarmProfile(profile);
    if (session.userId) {
      await supabase.from("accounts").update({
        farm_name: profile.name,
        operator_name: profile.ownerName,
        location: profile.location
      }).eq("user_id", session.userId);
    }
    await logActivity("Farm Profile Updated", `Updated farm details for ${profile.name}`, profile.ownerName);
    showSuccess("Farm profile updated");
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
        addFarmNote,
        updateFarmNote,
        deleteFarmNote,
        addAnimalNote,
        updateAnimalNote,
        deleteAnimalNote,
        logActivity,
        updateFarmProfile,
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