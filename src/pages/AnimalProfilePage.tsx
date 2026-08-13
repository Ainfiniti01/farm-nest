"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFarm, Animal, HealthRecord, Treatment, WeightRecord, BreedingRecord, AnimalNote, DEFAULT_ANIMAL_PHOTO } from "@/context/FarmContext";
import { compressImage } from "@/utils/imageCompressor";
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  Eye,
  AlertCircle,
  HelpCircle,
  X,
  Edit,
  Plus,
  FileText,
  Loader2,
  Calendar,
  Heart,
  Baby,
  UserCheck,
  Building,
  Camera,
  Upload
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Utility to calculate human-readable age from birth date string
export const calculateAge = (dobString?: string): string => {
  if (!dobString) return "Age unknown";
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return "Age unknown";

  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) {
    return `${years} yr${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mo${months > 1 ? "s" : ""}` : ""}`;
  }
  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  
  const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  if (totalDays <= 0) return "Newborn (Today)";
  return `${totalDays} day${totalDays > 1 ? "s" : ""} old`;
};

// Utility to calculate gestation countdown from mating date
// Goats and sheep typically have a ~150 day gestation period (approx 5 months)
export const calculateGestation = (matingDateString: string, gestationDays = 150) => {
  const matingDate = new Date(matingDateString);
  if (isNaN(matingDate.getTime())) return null;

  const dueDate = new Date(matingDate.getTime() + gestationDays * 24 * 60 * 60 * 1000);
  const today = new Date();
  
  // Set both to midnight for exact day diff
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = dueMidnight.getTime() - todayMidnight.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    matingDate: matingDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    dueDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    dueDateIso: dueDate.toISOString().split("T")[0],
    daysRemaining,
    isOverdue: daysRemaining < 0,
    isToday: daysRemaining === 0,
  };
};

export const AnimalProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offspringFileInputRef = useRef<HTMLInputElement>(null);
  const offspringCameraInputRef = useRef<HTMLInputElement>(null);

  const {
    animals,
    healthRecords,
    treatments,
    weightRecords,
    breedingRecords,
    animalNotes,
    activityLogs,
    farmProfile,
    loadAnimalProfile,
    updateAnimal,
    deleteAnimal,
    addHealthRecord,
    addTreatment,
    updateTreatmentStatus,
    addWeightRecord,
    addBreedingRecord,
    addAnimalNote,
    updateAnimalNote,
    deleteAnimalNote,
    addAnimal
  } = useFarm();

  useEffect(() => {
    if (id) {
      loadAnimalProfile(id);
    }
  }, [id, loadAnimalProfile]);

  const animal = animals.find(a => a.id === id || a.animal_code === id);

  const [activeTab, setActiveTab] = useState<"overview" | "health" | "breeding" | "photos" | "notes" | "activity">("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showLinkParentsModal, setShowLinkParentsModal] = useState(false);
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddBreeding, setShowAddBreeding] = useState(false);
  const [showAddOffspring, setShowAddOffspring] = useState(false);
  
  const [showAddAnimalNoteModal, setShowAddAnimalNoteModal] = useState(false);
  const [selectedAnimalNote, setSelectedAnimalNote] = useState<AnimalNote | null>(null);
  const [isEditingAnimalNote, setIsEditingAnimalNote] = useState(false);
  const [noteContentText, setNoteContentText] = useState("");

  const [isSubmittingAnimalNote, setIsSubmittingAnimalNote] = useState(false);
  const [isSavingAnimalNoteEdit, setIsSavingAnimalNoteEdit] = useState(false);
  const [isDeletingAnimalNote, setIsDeletingAnimalNote] = useState(false);

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: animal ? animal.name : "",
    breed: animal ? animal.breed : "",
    sex: animal ? animal.sex : ("Female" as Animal["sex"]),
    dob: animal ? animal.dob : "",
    purchaseDate: animal?.purchaseDate || "",
    source: animal ? animal.source : ("Born on farm" as Animal["source"]),
    status: animal ? animal.status : ("Healthy" as Animal["status"]),
    notes: animal ? animal.notes : "",
    primaryPhoto: animal ? animal.primaryPhoto : "",
    motherId: animal?.parents?.motherId || "",
    fatherId: animal?.parents?.fatherId || "",
  });

  const [parentsForm, setParentsForm] = useState({
    motherId: animal?.parents?.motherId || "",
    fatherId: animal?.parents?.fatherId || ""
  });

  const [ownershipForm, setOwnershipForm] = useState({
    type: (animal?.ownershipType || "Farm Owned") as "Farm Owned" | "Client Owned",
    ownerName: animal?.ownerName || "",
    custodian: animal?.custodian || "",
    agreement: animal?.agreement || ""
  });

  const [newHealth, setNewHealth] = useState({
    type: "Observation" as HealthRecord["type"],
    details: "",
    medication: "",
    recordedBy: farmProfile.ownerName || "Operator",
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
    species: animal ? animal.species : ("Goat" as Animal["species"]),
    breed: animal ? animal.breed : "",
    sex: "Female" as Animal["sex"],
    dob: new Date().toISOString().split("T")[0],
    notes: "",
    primaryPhoto: "",
    photos: [] as string[],
  });

  useEffect(() => {
    if (animal) {
      setEditForm({
        name: animal.name,
        breed: animal.breed,
        sex: animal.sex,
        dob: animal.dob || "",
        purchaseDate: animal.purchaseDate || "",
        source: animal.source,
        status: animal.status,
        notes: animal.notes,
        primaryPhoto: animal.primaryPhoto,
        motherId: animal.parents?.motherId || "",
        fatherId: animal.parents?.fatherId || "",
      });

      setParentsForm({
        motherId: animal.parents?.motherId || "",
        fatherId: animal.parents?.fatherId || ""
      });

      setOwnershipForm({
        type: animal.ownershipType || "Farm Owned",
        ownerName: animal.ownerName || "",
        custodian: animal.custodian || "",
        agreement: animal.agreement || ""
      });

      setNewOffspring(prev => ({
        ...prev,
        species: animal.species,
        breed: animal.breed
      }));
    }
  }, [animal]);

  if (!animal) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle size={48} className="text-amber-600 mb-2" />
        <h2 className="text-xl font-black text-slate-900">Livestock Record Not Found</h2>
        <p className="text-slate-500 text-xs mt-1 max-w-xs">
          The animal profile with ID "{id}" does not exist or was deleted.
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

  const hasCustomName = Boolean(animal.name && animal.name.trim().length > 0);
  const displayName = hasCustomName ? animal.name : animal.animal_code;
  const currentAge = calculateAge(animal.dob);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const fileList = Array.from(files);
        const compressedList = await Promise.all(
          fileList.map(file => compressImage(file, 600, 600, 0.7))
        );
        const updatedPhotos = [...(animal.photos || []), ...compressedList];
        const primary = animal.primaryPhoto || compressedList[0];
        await updateAnimal(animal.id, { photos: updatedPhotos, primaryPhoto: primary });
        showSuccess(`${compressedList.length} photo${compressedList.length > 1 ? "s" : ""} added!`);
      } catch (err) {
        showError("Failed to process images.");
      }
    }
  };

  const handleOffspringPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        const fileList = Array.from(files);
        const compressedList = await Promise.all(
          fileList.map(file => compressImage(file, 600, 600, 0.7))
        );
        setNewOffspring(prev => {
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

  const removeOffspringPhoto = (index: number) => {
    setNewOffspring(prev => {
      const updatedPhotos = prev.photos.filter((_, idx) => idx !== index);
      return {
        ...prev,
        photos: updatedPhotos,
        primaryPhoto: prev.primaryPhoto === prev.photos[index] ? (updatedPhotos[0] || "") : prev.primaryPhoto
      };
    });
  };

  const setPhotoAsPrimary = (photoUrl: string) => {
    setPendingConfirm({
      title: "Set Primary Portrait?",
      message: "Set this photo as the primary portrait?",
      onConfirm: () => {
        updateAnimal(animal.id, { primaryPhoto: photoUrl });
        setPendingConfirm(null);
        showSuccess("Primary portrait updated!");
      }
    });
  };

  const deletePhoto = (photoUrl: string) => {
    if (animal.photos.length <= 1) {
      showError("At least one profile photo must remain.");
      return;
    }
    setPendingConfirm({
      title: "Delete Photo?",
      message: "Permanently remove this photo?",
      onConfirm: () => {
        const updated = animal.photos.filter(p => p !== photoUrl);
        const updates: Partial<Animal> = { photos: updated };
        if (animal.primaryPhoto === photoUrl) {
          updates.primaryPhoto = updated[0];
        }
        updateAnimal(animal.id, updates);
        setPendingConfirm(null);
        showSuccess("Photo removed.");
      }
    });
  };

  const handlePdfSingleReport = () => {
    const html = `
      <html>
        <head>
          <title>Passport: ${animal.animal_code}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 30px; color: #1a202c; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #047857; padding-bottom: 10px; }
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
            <tr><th>Identifier Name</th><td>${displayName}</td></tr>
            <tr><th>Code</th><td>${animal.animal_code}</td></tr>
            <tr><th>Species Class</th><td>${animal.species}</td></tr>
            <tr><th>Breed</th><td>${animal.breed}</td></tr>
            <tr><th>Sex Type</th><td>${animal.sex}</td></tr>
            <tr><th>Ownership</th><td>${animal.ownershipType || "Farm Owned"}${animal.ownerName ? ` (${animal.ownerName})` : ''}</td></tr>
            <tr><th>Birth date</th><td>${animal.dob || "Unrecorded"} (${currentAge})</td></tr>
            <tr><th>Source</th><td>${animal.source}</td></tr>
            <tr><th>Current notes</th><td>${animal.notes || "No extra bio."}</td></tr>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
        showSuccess("Print passport opened!");
      }, 500);
    }
  };

  const animalHealth = healthRecords.filter(h => h.animal_id === animal.id);
  const animalTreatments = treatments.filter(t => t.animal_id === animal.id);
  const animalWeights = weightRecords.filter(w => w.animal_id === animal.id);
  const animalBreeding = breedingRecords.filter(b => b.female_id === animal.id || b.male_id === animal.id);
  const currentAnimalNotes = animalNotes.filter(an => an.animal_id === animal.id);
  const animalLogs = activityLogs.filter(l => l.targetId === animal.id);

  const mother = animals.find(a => a.id === animal.parents?.motherId);
  const father = animals.find(a => a.id === animal.parents?.fatherId);
  const offspringList = animals.filter(a => a.parents?.motherId === animal.id || a.parents?.fatherId === animal.id);

  // Female breeding & gestation countdown:
  const femaleBreedingRecords = breedingRecords
    .filter(b => b.female_id === animal.id && b.status !== "Failed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestBreeding = femaleBreedingRecords[0];
  const gestationCountdown = animal.sex === "Female" && latestBreeding ? calculateGestation(latestBreeding.date) : null;

  const chartData = animalWeights
    .map(w => ({
      date: new Date(w.date).toLocaleDateString([], { month: "short", day: "numeric" }),
      weight: w.weight,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleOpenAddNoteModal = () => {
    setNoteContentText("");
    setShowAddAnimalNoteModal(true);
  };

  const handleCreateAnimalNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContentText.trim()) return;

    setIsSubmittingAnimalNote(true);
    try {
      const success = await addAnimalNote({
        animal_id: animal.id,
        content: noteContentText.trim()
      });

      if (success) {
        setShowAddAnimalNoteModal(false);
        setNoteContentText("");
      }
    } finally {
      setIsSubmittingAnimalNote(false);
    }
  };

  const handleSelectAnimalNote = (note: AnimalNote) => {
    setSelectedAnimalNote(note);
    setNoteContentText(note.content);
    setIsEditingAnimalNote(false);
  };

  const handleUpdateAnimalNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalNote || !noteContentText.trim()) return;

    setIsSavingAnimalNoteEdit(true);
    try {
      const success = await updateAnimalNote(selectedAnimalNote.id, noteContentText.trim());
      if (success) {
        setSelectedAnimalNote(null);
        setIsEditingAnimalNote(false);
        setNoteContentText("");
      }
    } finally {
      setIsSavingAnimalNoteEdit(false);
    }
  };

  const handleDeleteAnimalNoteTrigger = (noteId: string) => {
    setPendingConfirm({
      title: "Delete this note?",
      message: "This action cannot be undone.",
      onConfirm: async () => {
        setIsDeletingAnimalNote(true);
        try {
          const success = await deleteAnimalNote(noteId);
          if (success) {
            setPendingConfirm(null);
            setSelectedAnimalNote(null);
          }
        } finally {
          setIsDeletingAnimalNote(false);
        }
      }
    });
  };

  const triggerEditConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Save Profile Changes?",
      message: "Save changes to this animal profile?",
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
          parents: {
            motherId: editForm.motherId || undefined,
            fatherId: editForm.fatherId || undefined
          }
        });
        setShowEditModal(false);
        setPendingConfirm(null);
      }
    });
  };

  const triggerSaveParentsConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Link Parents?",
      message: "Update Mother (Dam) and Father (Sire) pedigree lineage for this animal?",
      onConfirm: () => {
        updateAnimal(animal.id, {
          parents: {
            motherId: parentsForm.motherId || undefined,
            fatherId: parentsForm.fatherId || undefined
          }
        });
        setShowLinkParentsModal(false);
        setPendingConfirm(null);
      }
    });
  };

  const handleOwnershipTypeChange = (type: "Farm Owned" | "Client Owned") => {
    if (type === "Farm Owned") {
      setOwnershipForm({
        type: "Farm Owned",
        ownerName: "",
        custodian: "",
        agreement: ""
      });
    } else {
      setOwnershipForm(prev => ({
        ...prev,
        type: "Client Owned"
      }));
    }
  };

  const triggerOwnershipConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Update Ownership?",
      message: ownershipForm.type === "Farm Owned" 
        ? "Changing to Farm Owned will clear client owner, custodian, and agreement details. Confirm?"
        : `Set ownership to Client Owned for '${ownershipForm.ownerName || 'Client'}'?`,
      onConfirm: () => {
        updateAnimal(animal.id, {
          ownershipType: ownershipForm.type,
          ownerName: ownershipForm.type === "Farm Owned" ? undefined : ownershipForm.ownerName,
          custodian: ownershipForm.type === "Farm Owned" ? undefined : ownershipForm.custodian,
          agreement: ownershipForm.type === "Farm Owned" ? undefined : ownershipForm.agreement,
        });
        setShowOwnershipModal(false);
        setPendingConfirm(null);
      }
    });
  };

  const triggerHealthConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Submit Clinical Event?",
      message: "Add this health record?",
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
          recordedBy: farmProfile.ownerName || "Operator",
          date: new Date().toISOString().split("T")[0],
        });
      }
    });
  };

  const triggerTreatmentConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Activate Medical Treatment?",
      message: "Record active prescription treatment?",
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
      }
    });
  };

  const triggerWeightConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight.weight || isNaN(Number(newWeight.weight))) return;
    setPendingConfirm({
      title: "Log Weight?",
      message: `Log ${newWeight.weight} kg for growth metrics?`,
      onConfirm: () => {
        addWeightRecord({
          animal_id: animal.id,
          weight: Number(newWeight.weight),
          date: newWeight.date,
          notes: newWeight.notes || undefined,
        });
        setShowAddWeight(false);
        setPendingConfirm(null);
      }
    });
  };

  const triggerBreedingConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Record Breeding?",
      message: "Log breeding event? This will automatically initiate/update the delivery countdown.",
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
      }
    });
  };

  const triggerOffspringConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingConfirm({
      title: "Register Offspring?",
      message: `Register offspring and link to ${displayName}?`,
      onConfirm: () => {
        const defaultPhoto = DEFAULT_ANIMAL_PHOTO;
        const finalPhotos = newOffspring.photos.length > 0 ? newOffspring.photos : [defaultPhoto];
        const finalPrimary = newOffspring.primaryPhoto || finalPhotos[0];

        addAnimal({
          name: newOffspring.name,
          species: newOffspring.species,
          breed: newOffspring.breed,
          sex: newOffspring.sex,
          dob: newOffspring.dob,
          source: "Born on farm",
          status: "Healthy",
          healthStatus: "Healthy",
          primaryPhoto: finalPrimary,
          photos: finalPhotos,
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
          photos: [],
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
    showSuccess("Image downloaded!");
  };

  const currentOwnershipType = animal.ownershipType || "Farm Owned";

  // Eligible females and males for linking parents
  const eligibleMothers = animals.filter(a => a.id !== animal.id && a.sex === "Female" && a.species === animal.species);
  const eligibleFathers = animals.filter(a => a.id !== animal.id && a.sex === "Male" && a.species === animal.species);

  // Helper to format animal tag for display without showing database IDs
  const formatAnimalDisplayTag = (anim?: Animal | null): string => {
    if (!anim) return "";
    return anim.name ? `${anim.animal_code} (${anim.name})` : anim.animal_code;
  };

  return (
    <div className="min-h-screen bg-[#FBFDF9] text-slate-800 pb-20 md:pb-8">
      
      {/* HEADER NAVIGATION */}
      <div className="bg-white border-b border-emerald-100/60 py-4 px-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/animals"
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN 1: HERO PORTRAIT & OWNERSHIP CARD */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Animal ID Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
              <div 
                className="h-64 bg-slate-100 relative cursor-zoom-in group"
                onClick={() => setFullscreenPhoto(animal.primaryPhoto)}
              >
                <img
                  src={animal.primaryPhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-black gap-2">
                  <Eye size={18} /> View Portrait Fullscreen
                </div>

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
                    {displayName}
                  </h2>
                  {hasCustomName && (
                    <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">{animal.animal_code}</p>
                  )}
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

                {/* Editable Date of Birth and Age display */}
                <div className="pt-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase">DATE OF BIRTH</span>
                    <button 
                      onClick={() => setShowEditModal(true)} 
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Edit size={11} /> Edit DOB
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{animal.dob || "Unrecorded"}</span>
                    <span className="font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {currentAge}
                    </span>
                  </div>
                  {animal.purchaseDate && (
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      Acquired on: <strong className="text-slate-600">{animal.purchaseDate}</strong>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[10px] text-slate-400">
                  <span>Added to registry: {new Date(animal.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-100 transition text-center block"
                  >
                    Edit Profile & Dates
                  </button>

                  <button
                    onClick={() => {
                      setPendingConfirm({
                        title: `Permanently Delete ${animal.animal_code}?`,
                        message: "This action clears all lineage trees and weight growth trends. There is no undo.",
                        onConfirm: () => {
                          deleteAnimal(animal.id);
                          navigate("/animals");
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

            {/* OWNERSHIP CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentOwnershipType === "Farm Owned" ? (
                    <Building size={16} className="text-emerald-600" />
                  ) : (
                    <UserCheck size={16} className="text-blue-600" />
                  )}
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    Ownership Details
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setOwnershipForm({
                      type: animal.ownershipType || "Farm Owned",
                      ownerName: animal.ownerName || "",
                      custodian: animal.custodian || "",
                      agreement: animal.agreement || ""
                    });
                    setShowOwnershipModal(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
                >
                  <Edit size={13} /> Edit
                </button>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Ownership Type</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    currentOwnershipType === "Farm Owned" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {currentOwnershipType}
                  </span>
                </div>

                {currentOwnershipType === "Client Owned" ? (
                  <>
                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Owner Name</span>
                      <span className="font-bold text-slate-800 block">{animal.ownerName || "Not specified"}</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Custodian</span>
                      <span className="font-bold text-slate-800 block">{animal.custodian || "Not specified"}</span>
                    </div>

                    {animal.agreement && (
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Agreement Details</span>
                        <span className="text-slate-700 text-[11px] block">{animal.agreement}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 italic px-1">
                    This animal is directly owned and managed by {farmProfile.name}.
                  </p>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
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

                {/* FEMALE PREGNANCY / DELIVERY COUNTDOWN BANNER */}
                {animal.sex === "Female" && gestationCountdown && (
                  <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-3">
                    <div className="absolute -right-6 -bottom-6 w-32 h-36 bg-white/10 rounded-full blur-xl" />
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                          🤰
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm tracking-wide">Pregnancy & Delivery Countdown</h4>
                          <p className="text-[10px] text-rose-100">Calculated ~5 months (150 days) from latest breeding run</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-white text-rose-800 px-2.5 py-0.5 rounded-full shadow-sm">
                        {latestBreeding.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20">
                        <span className="text-[9px] uppercase font-bold text-rose-100 block">Mating Date</span>
                        <span className="text-xs font-black block mt-0.5">{gestationCountdown.matingDate}</span>
                      </div>

                      <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20">
                        <span className="text-[9px] uppercase font-bold text-rose-100 block">Expected Due</span>
                        <span className="text-xs font-black block mt-0.5">{gestationCountdown.dueDate}</span>
                      </div>

                      <div className="bg-white text-slate-900 p-2.5 rounded-2xl border border-white/30 shadow-md">
                        <span className="text-[9px] uppercase font-extrabold text-rose-600 block">Countdown</span>
                        <span className="text-sm font-black text-rose-600 block mt-0.5">
                          {gestationCountdown.isToday ? (
                            "Due Today! 👶"
                          ) : gestationCountdown.isOverdue ? (
                            `${Math.abs(gestationCountdown.daysRemaining)} days overdue!`
                          ) : (
                            `${gestationCountdown.daysRemaining} days left`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                    </div>

                    <button
                      onClick={() => {
                        setPendingConfirm({
                          title: "Mark Treatment Complete?",
                          message: "Revert livestock to 'Healthy' status?",
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

                {/* LINEAGE & LINE TREE CARD */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="text-emerald-600 text-base">🧬</span>
                      Lineage & Line Tree
                    </h3>
                    <button
                      onClick={() => {
                        setParentsForm({
                          motherId: animal.parents?.motherId || "",
                          fatherId: animal.parents?.fatherId || ""
                        });
                        setShowLinkParentsModal(true);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
                    >
                      <Edit size={13} /> Edit Parents
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mother Card */}
                    <div 
                      onClick={() => {
                        if (mother) {
                          navigate(`/animals/${mother.id}`);
                        } else {
                          setParentsForm({
                            motherId: animal.parents?.motherId || "",
                            fatherId: animal.parents?.fatherId || ""
                          });
                          setShowLinkParentsModal(true);
                        }
                      }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-2xl border border-slate-100 transition cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {mother ? (
                          <img src={mother.primaryPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🤱</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Mother (Dam)</span>
                        {mother ? (
                          <span className="font-black text-xs text-emerald-900 group-hover:underline block truncate">
                            {formatAnimalDisplayTag(mother)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 block">
                            + Link Mother (Dam)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Father Card */}
                    <div 
                      onClick={() => {
                        if (father) {
                          navigate(`/animals/${father.id}`);
                        } else {
                          setParentsForm({
                            motherId: animal.parents?.motherId || "",
                            fatherId: animal.parents?.fatherId || ""
                          });
                          setShowLinkParentsModal(true);
                        }
                      }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-2xl border border-slate-100 transition cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {father ? (
                          <img src={father.primaryPhoto} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">♂️</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Father (Sire)</span>
                        {father ? (
                          <span className="font-black text-xs text-emerald-900 group-hover:underline block truncate">
                            {formatAnimalDisplayTag(father)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 block">
                            + Link Father (Sire)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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
                        <p className="font-bold text-[11px] text-slate-950 truncate">{child.name || child.animal_code}</p>
                        <span className="text-[9px] font-mono text-slate-500">{child.animal_code}</span>
                      </Link>
                    ))}
                    {offspringList.length === 0 && (
                      <p className="col-span-full text-slate-400 text-xs italic text-center py-4">No registered offspring linked in pedigree.</p>
                    )}
                  </div>
                </div>

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
                      Insufficient records for a growth chart yet.
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {animalWeights.slice(-3).map(w => (
                      <div key={w.id} className="text-xs p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-slate-800">{w.weight} kg</span>
                        <span className="text-[10px] text-slate-400">{w.date} {w.notes && `(${w.notes})`}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. HEALTH LOGS TAB */}
            {activeTab === "health" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Clinical Incident Log</h3>
                  <button
                    onClick={() => setShowAddHealth(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Log Health Record
                  </button>
                </div>

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
                          Medication: {h.medication}
                        </p>
                      )}
                    </div>
                  ))}
                  {animalHealth.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs">
                      No clinical health logs recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. BREEDING RECORDS TAB */}
            {activeTab === "breeding" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Breeding History</h3>
                  <button
                    onClick={() => setShowAddBreeding(true)}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Record Breeding
                  </button>
                </div>

                <div className="space-y-3">
                  {animalBreeding.map(b => {
                    const damObj = animals.find(a => a.id === b.female_id);
                    const sireObj = animals.find(a => a.id === b.male_id);

                    const damTag = damObj ? formatAnimalDisplayTag(damObj) : "Unrecorded Dam";
                    const sireTag = sireObj ? formatAnimalDisplayTag(sireObj) : "Unrecorded Sire";

                    return (
                      <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                            {b.status}
                          </span>
                          <span className="text-[10px] text-slate-400">{b.date}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                          Line cross of Dam: <strong>{damTag}</strong> & Sire: <strong>{sireTag}</strong>
                        </p>
                        {b.notes && (
                          <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {b.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {animalBreeding.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs">
                      No breeding cycles logged.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. PHOTOS GALLERY TAB */}
            {activeTab === "photos" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Photos</h3>
                    <p className="text-[10px] text-slate-400">Select multiple files to upload at once</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                  >
                    + Upload Photos
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
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
                          className="p-1 hover:bg-red-50 text-red-500 rounded text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. ANIMAL NOTES TAB */}
            {activeTab === "notes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Animal Notes</h3>
                    <p className="text-[10px] text-slate-400">Specific notes for {displayName}</p>
                  </div>
                  <button
                    onClick={handleOpenAddNoteModal}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow transition"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                </div>

                <div className="space-y-2.5">
                  {currentAnimalNotes.map((note) => (
                    <div 
                      key={note.id}
                      onClick={() => handleSelectAnimalNote(note)}
                      className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 transition cursor-pointer group"
                    >
                      <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50 text-[10px] text-slate-400">
                        <span>{new Date(note.created_at).toLocaleDateString()} · {note.created_by || "Operator"}</span>
                        <span className="text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition">View details →</span>
                      </div>
                    </div>
                  ))}

                  {currentAnimalNotes.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs space-y-1">
                      <FileText size={28} className="mx-auto text-slate-300" />
                      <p className="font-semibold">No animal notes on record.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. SYSTEM ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-900 text-sm">System Trace</h3>
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
                      No system events recorded for this animal.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* EDIT PARENTS MODAL */}
      {showLinkParentsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={triggerSaveParentsConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Link Lineage & Parents</h3>
              <button 
                type="button" 
                onClick={() => setShowLinkParentsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Mother (Dam)
              </label>
              <select
                value={parentsForm.motherId}
                onChange={(e) => setParentsForm({ ...parentsForm, motherId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- No Mother Linked (Unrecorded) --</option>
                {eligibleMothers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.animal_code} {m.name ? `(${m.name})` : ''} - {m.breed}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Select Father (Sire)
              </label>
              <select
                value={parentsForm.fatherId}
                onChange={(e) => setParentsForm({ ...parentsForm, fatherId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">-- No Father Linked (Unrecorded) --</option>
                {eligibleFathers.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.animal_code} {f.name ? `(${f.name})` : ''} - {f.breed}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkParentsModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Save Lineage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT OWNERSHIP MODAL */}
      {showOwnershipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={triggerOwnershipConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Edit Livestock Ownership</h3>
              <button 
                type="button" 
                onClick={() => setShowOwnershipModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Ownership Type
              </label>
              <select
                value={ownershipForm.type}
                onChange={(e) => handleOwnershipTypeChange(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="Farm Owned">Farm Owned</option>
                <option value="Client Owned">Client Owned</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Owner Name
              </label>
              <input
                type="text"
                placeholder="Client or Partner Name"
                value={ownershipForm.ownerName}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, ownerName: e.target.value })}
                disabled={ownershipForm.type === "Farm Owned"}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:bg-slate-100"
                required={ownershipForm.type === "Client Owned"}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Current Custodian
              </label>
              <input
                type="text"
                placeholder="Who currently looks after the animal"
                value={ownershipForm.custodian}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, custodian: e.target.value })}
                disabled={ownershipForm.type === "Farm Owned"}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Agreement Details (Optional)
              </label>
              <textarea
                placeholder="e.g. Boarding fee paid monthly..."
                value={ownershipForm.agreement}
                onChange={(e) => setOwnershipForm({ ...ownershipForm, agreement: e.target.value })}
                disabled={ownershipForm.type === "Farm Owned"}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 disabled:bg-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOwnershipModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Save Ownership
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE ANIMAL NOTE MODAL */}
      {showAddAnimalNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={handleCreateAnimalNoteSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Animal Note</h3>
              <button 
                type="button" 
                onClick={() => !isSubmittingAnimalNote && setShowAddAnimalNoteModal(false)} 
                disabled={isSubmittingAnimalNote}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Note <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="e.g. Behavior observation..."
                value={noteContentText}
                onChange={(e) => setNoteContentText(e.target.value)}
                disabled={isSubmittingAnimalNote}
                rows={4}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAnimalNoteModal(false)}
                disabled={isSubmittingAnimalNote}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAnimalNote}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSubmittingAnimalNote ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Note"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW/EDIT ANIMAL NOTE MODAL */}
      {selectedAnimalNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {isEditingAnimalNote ? "Edit Animal Note" : "Animal Note"}
              </h3>
              <button 
                type="button" 
                onClick={() => !isSavingAnimalNoteEdit && setSelectedAnimalNote(null)} 
                disabled={isSavingAnimalNoteEdit}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {!isEditingAnimalNote ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedAnimalNote.content}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAnimalNote(true)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAnimalNoteTrigger(selectedAnimalNote.id)}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateAnimalNoteSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Note Content</label>
                  <textarea
                    value={noteContentText}
                    onChange={(e) => setNoteContentText(e.target.value)}
                    disabled={isSavingAnimalNoteEdit}
                    rows={4}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAnimalNote(false)}
                    disabled={isSavingAnimalNoteEdit}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAnimalNoteEdit}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {isSavingAnimalNoteEdit ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO VIEWER */}
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
                onClick={() => !isDeletingAnimalNote && setPendingConfirm(null)}
                disabled={isDeletingAnimalNote}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={pendingConfirm.onConfirm}
                disabled={isDeletingAnimalNote}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isDeletingAnimalNote ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Confirm Act"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ANIMAL MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerEditConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Update Animal Record & Dates</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Animal Name</label>
              <input
                type="text"
                placeholder="e.g. Aisha"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Editable Dates Grid */}
            <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
              <div>
                <label className="text-[10px] font-extrabold text-emerald-900 uppercase block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full p-2 bg-white border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-emerald-900 uppercase block mb-1">Acquisition Date</label>
                <input
                  type="date"
                  value={editForm.purchaseDate}
                  onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                  className="w-full p-2 bg-white border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
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
                <label className="text-[10px] font-bold text-slate-500 block">Mother (Dam)</label>
                <select
                  value={editForm.motherId}
                  onChange={(e) => setEditForm({ ...editForm, motherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="">Unrecorded</option>
                  {eligibleMothers.map(m => (
                    <option key={m.id} value={m.id}>{m.animal_code} {m.name && `(${m.name})`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Father (Sire)</label>
                <select
                  value={editForm.fatherId}
                  onChange={(e) => setEditForm({ ...editForm, fatherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="">Unrecorded</option>
                  {eligibleFathers.map(f => (
                    <option key={f.id} value={f.id}>{f.animal_code} {f.name && `(${f.name})`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Status</label>
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

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow transition"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* HEALTH MODAL */}
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

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Diagnostic logs</label>
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

      {/* TREATMENT MODAL */}
      {showAddTreatment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerTreatmentConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Initiate Medical Action</h3>
              <button type="button" onClick={() => setShowAddTreatment(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Condition</label>
              <input
                type="text"
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
              Commence Treatment
            </button>
          </form>
        </div>
      )}

      {/* WEIGHT MODAL */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerWeightConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Record Weight Mass</h3>
              <button type="button" onClick={() => setShowAddWeight(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Weight (kg)</label>
              <input
                type="text"
                placeholder="e.g. 45.2"
                value={newWeight.weight}
                onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Save Weight
            </button>
          </form>
        </div>
      )}

      {/* BREEDING MODAL */}
      {showAddBreeding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerBreedingConfirm}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Log Breeding Run</h3>
              <button type="button" onClick={() => setShowAddBreeding(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Mating Date</label>
              <input
                type="date"
                value={newBreeding.date}
                onChange={(e) => setNewBreeding({ ...newBreeding, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Select Stud Partner (Sire)</label>
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
                    <option key={a.id} value={a.id}>{a.animal_code} - {a.name || a.animal_code}</option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Save Breeding Run & Start Gestation
            </button>
          </form>
        </div>
      )}

      {/* OFFSPRING MODAL (With Camera and Upload Buttons) */}
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

            {/* Photo Upload & Camera Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Offspring Portraits (Multiple Allowed)</label>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => offspringCameraInputRef.current?.click()}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition"
                >
                  <Camera size={14} className="text-emerald-700" /> Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => offspringFileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <Upload size={14} className="text-slate-600" /> Upload Photos
                </button>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={offspringCameraInputRef}
                  onChange={handleOffspringPhotoUpload}
                  className="hidden"
                />

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={offspringFileInputRef}
                  onChange={handleOffspringPhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Thumbnails preview */}
              {newOffspring.photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {newOffspring.photos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setNewOffspring(prev => ({ ...prev, primaryPhoto: photo }))}
                      className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer group ${
                        newOffspring.primaryPhoto === photo ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200"
                      }`}
                    >
                      <img src={photo} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOffspringPhoto(idx);
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-0.5 rounded-full text-[10px] transition"
                      >
                        <X size={12} />
                      </button>
                      {newOffspring.primaryPhoto === photo && (
                        <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-black text-center py-0.5">
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Offspring Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Baby Aisha"
                value={newOffspring.name}
                onChange={(e) => setNewOffspring({ ...newOffspring, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
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
              <label className="text-[10px] font-bold text-slate-500 block">Date of Birth</label>
              <input
                type="date"
                value={newOffspring.dob}
                onChange={(e) => setNewOffspring({ ...newOffspring, dob: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Generate Offspring Record
            </button>
          </form>
        </div>
      )}

    </div>
  );
};