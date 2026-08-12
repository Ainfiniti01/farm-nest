"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFarm, Reminder, FarmNote } from "@/context/FarmContext";
import { 
  Plus, 
  Calendar, 
  Activity, 
  Boxes, 
  HelpCircle,
  Check,
  FileText,
  X,
  Edit,
  Trash2,
  ArrowRight
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    animals,
    treatments,
    inventory,
    reminders,
    activityLogs,
    farmNotes,
    farmProfile,
    toggleReminder,
    addReminder,
    addFarmNote,
    updateFarmNote,
    deleteFarmNote
  } = useFarm();

  // Confirmation state
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // New Reminder modal states
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState({
    title: "",
    type: "Vaccination" as Reminder["type"],
    dueDate: new Date().toISOString().split("T")[0],
    animalId: "",
    notes: ""
  });

  // Farm Note Modals
  const [showAddFarmNote, setShowAddFarmNote] = useState(false);
  const [selectedFarmNote, setSelectedFarmNote] = useState<FarmNote | null>(null);
  const [isEditingFarmNote, setIsEditingFarmNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // Fallback priority logic
  const farmHeaderImage = farmProfile.image || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80";

  // Filter out Sold and Deceased livestock from active counts
  const activeAnimals = animals.filter(a => a.status !== "Sold" && a.status !== "Deceased");
  const totalAnimals = activeAnimals.length;
  const healthyCount = activeAnimals.filter(a => a.healthStatus === "Healthy" || a.status === "Healthy").length;
  const ongoingTxCount = treatments.filter(t => t.status === "Ongoing").length;
  const attentionCount = activeAnimals.filter(a => a.status === "Sick" || a.status === "Under Treatment" || a.status === "Monitoring").length;
  const lowStockCount = inventory.filter(item => item.quantity <= item.minStock).length;
  const upcomingCount = reminders.filter(r => !r.completed).length;

  const triggerToggleReminderConfirm = (reminderId: string, text: string) => {
    setPendingConfirm({
      title: "Complete Task Procedure?",
      message: `Do you want to check off calendar procedure "${text}"?`,
      onConfirm: () => {
        toggleReminder(reminderId);
        setPendingConfirm(null);
        showSuccess("Reminder marked done!");
      }
    });
  };

  const triggerCreateReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderForm.title) {
      showError("Please check reminder title");
      return;
    }
    setPendingConfirm({
      title: "Set Calendar Reminder Task?",
      message: `Create calendar card task '${newReminderForm.title}' due on ${newReminderForm.dueDate}?`,
      onConfirm: () => {
        addReminder({
          title: newReminderForm.title,
          type: newReminderForm.type,
          dueDate: newReminderForm.dueDate,
          animal_id: newReminderForm.animalId || undefined,
          notes: newReminderForm.notes || undefined
        });
        setShowAddReminder(false);
        setPendingConfirm(null);
        setNewReminderForm({
          title: "",
          type: "Vaccination",
          dueDate: new Date().toISOString().split("T")[0],
          animalId: "",
          notes: ""
        });
      }
    });
  };

  // Farm Note Handlers
  const handleOpenAddNote = () => {
    setNoteTitle("");
    setNoteContent("");
    setShowAddFarmNote(true);
  };

  const handleCreateFarmNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      showError("Note content is required.");
      return;
    }
    await addFarmNote({
      title: noteTitle.trim() || undefined,
      content: noteContent.trim(),
    });
    setShowAddFarmNote(false);
    setNoteTitle("");
    setNoteContent("");
  };

  const handleSelectNote = (note: FarmNote) => {
    setSelectedFarmNote(note);
    setNoteTitle(note.title || "");
    setNoteContent(note.content);
    setIsEditingFarmNote(false);
  };

  const handleUpdateFarmNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmNote || !noteContent.trim()) return;
    await updateFarmNote(selectedFarmNote.id, {
      title: noteTitle.trim() || undefined,
      content: noteContent.trim(),
    });
    setSelectedFarmNote(prev => prev ? { ...prev, title: noteTitle.trim() || undefined, content: noteContent.trim() } : null);
    setIsEditingFarmNote(false);
  };

  const handleDeleteFarmNote = (noteId: string) => {
    setPendingConfirm({
      title: "Delete this note?",
      message: "This action cannot be undone.",
      onConfirm: async () => {
        await deleteFarmNote(noteId);
        setPendingConfirm(null);
        setSelectedFarmNote(null);
      }
    });
  };

  // 3-5 most recent farm notes
  const recentFarmNotes = farmNotes.slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* 1. WELCOME FARM HEADER CARD */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="h-44 bg-slate-200 relative">
          <img 
            src={farmHeaderImage} 
            alt={farmProfile.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent" />
          <div className="absolute bottom-4 left-5 text-white">
            <span className="text-[10px] font-black uppercase bg-emerald-600 text-emerald-100 px-2.5 py-0.5 rounded-full">
              Live Operations Header
            </span>
            <h2 className="text-xl font-black mt-1 leading-tight">Welcome back, {farmProfile.ownerName || "Adam"} 👋</h2>
            <p className="text-emerald-100/90 text-xs mt-0.5 font-bold uppercase tracking-wider">
              {farmProfile.name} • {farmProfile.location || "Kano, Nigeria"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. METRICS OVERVIEW HUB */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          onClick={() => navigate("/animals")} 
          className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/60 cursor-pointer hover:border-emerald-300 transition"
        >
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Active Livestock</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-950">{totalAnimals}</span>
            <span className="text-xs text-emerald-700 font-medium">heads</span>
          </div>
          <p className="text-[10px] text-emerald-700/80 mt-2 font-bold">{healthyCount} verified healthy</p>
        </div>

        <div 
          onClick={() => navigate("/animals")}
          className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100/60 cursor-pointer hover:border-amber-300 transition"
        >
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Alerts & Attention</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-950">{attentionCount}</span>
            <span className="text-xs text-amber-700 font-medium">animals</span>
          </div>
          <p className="text-[10px] text-amber-800 mt-2 font-bold">{ongoingTxCount} active medical runs</p>
        </div>

        <div 
          onClick={() => navigate("/inventory")}
          className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100/60 cursor-pointer hover:border-blue-300 transition"
        >
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Storage Stock</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-blue-950">{inventory.length}</span>
            <span className="text-xs text-blue-700 font-medium">supplies</span>
          </div>
          <p className="text-[10px] text-blue-800 mt-2 font-bold">{lowStockCount} items below threshold</p>
        </div>

        <div 
          onClick={() => navigate("/settings")}
          className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100/60 cursor-pointer hover:border-purple-300 transition"
        >
          <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Reminders Due</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-purple-950">{upcomingCount}</span>
            <span className="text-xs text-purple-700 font-medium">scheduled</span>
          </div>
          <p className="text-[10px] text-purple-800 mt-2 font-bold">Vaccines & matings</p>
        </div>
      </div>

      {/* 3. CALENDAR AND DISPENSARY HUB split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
                          Assigned: {targetAnimal.animal_code} {targetAnimal.name && `(${targetAnimal.name})`}
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
                🎉 All paddock tasks are up to date!
              </div>
            )}
          </div>
        </div>

        {/* Stock Warnings */}
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
                    <p className="text-[10px] text-red-800">Only {item.quantity} {item.unit} left</p>
                  </div>
                  <button 
                    onClick={() => navigate("/inventory")}
                    className="bg-white text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-lg"
                  >
                    Adjust
                  </button>
                </div>
              );
            })}
            {inventory.every(item => item.quantity > item.minStock) && (
              <p className="text-center py-6 text-xs text-emerald-800 bg-emerald-50/20 rounded-xl border border-dashed border-emerald-100">
                👍 Feeding stock and medical dispensaries are currently optimal.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* 4. FARM NOTES DASHBOARD WIDGET */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText size={16} className="text-emerald-600" />
            Farm Notes
          </h3>
          <Link 
            to="/notes" 
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition"
          >
            View all <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-2">
          {recentFarmNotes.map((note) => {
            const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            });

            return (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between cursor-pointer transition border border-slate-100"
              >
                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                  <span className="text-sm shrink-0">📝</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {note.title || note.content}
                    </p>
                    {note.title && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {note.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border shrink-0">
                  {formattedDate} · {note.created_by || "Adam"}
                </div>
              </div>
            );
          })}

          {recentFarmNotes.length === 0 && (
            <div className="text-center p-6 text-slate-400 text-xs">
              No general farm notes recorded yet.
            </div>
          )}
        </div>

        <button
          onClick={handleOpenAddNote}
          className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add Farm Note
        </button>
      </div>

      {/* 5. ACTIVITY STREAMS STREAM */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Activity size={16} className="text-emerald-600" />
          Live Farm Operations Stream
        </h3>
        <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-3 before:w-[1px] before:bg-slate-100">
          {activityLogs.slice(0, 4).map((log) => (
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
                  {new Date(log.date).toLocaleDateString()} at {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STABLE ADD REMINDER MODAL DIALOG */}
      {showAddReminder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={triggerCreateReminderSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Custom Reminder Task</h3>
              <button type="button" onClick={() => setShowAddReminder(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Task / Reminder Title</label>
              <input
                type="text"
                placeholder="e.g. PPR Booster dose - Aisha"
                value={newReminderForm.title}
                onChange={(e) => setNewReminderForm({ ...newReminderForm, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Procedure Type</label>
                <select
                  value={newReminderForm.type}
                  onChange={(e) => setNewReminderForm({ ...newReminderForm, type: e.target.value as Reminder["type"] })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 text-slate-800"
                >
                  <option value="Vaccination">Vaccination 💉</option>
                  <option value="Treatment">Treatment 💊</option>
                  <option value="Breeding">Breeding Run ❤️</option>
                  <option value="Birth">Birth Delivery 👶</option>
                  <option value="Other">Other Paddock Task</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Due Date</label>
                <input
                  type="date"
                  value={newReminderForm.dueDate}
                  onChange={(e) => setNewReminderForm({ ...newReminderForm, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 text-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Assign Livestock (Optional)</label>
              <select
                value={newReminderForm.animalId}
                onChange={(e) => setNewReminderForm({ ...newReminderForm, animalId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1 text-slate-800"
              >
                <option value="">-- Choose Profile --</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.id}>{a.animal_code} {a.name ? `(${a.name})` : `(${a.species})`}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow"
            >
              Add Calendar Task
            </button>
          </form>
        </div>
      )}

      {/* ADD FARM NOTE MODAL */}
      {showAddFarmNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateFarmNote}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Farm Note</h3>
              <button type="button" onClick={() => setShowAddFarmNote(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Changed feeding schedule"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Note Content <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe general farm activities or decisions..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddFarmNote(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Save Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW/EDIT FARM NOTE MODAL */}
      {selectedFarmNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {isEditingFarmNote ? "Edit Farm Note" : "Farm Note"}
              </h3>
              <button type="button" onClick={() => setSelectedFarmNote(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>

            {!isEditingFarmNote ? (
              <div className="space-y-4">
                {selectedFarmNote.title && (
                  <h4 className="font-black text-base text-slate-900">{selectedFarmNote.title}</h4>
                )}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedFarmNote.content}</p>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5 border-t pt-3">
                  <p>Added by <strong className="text-slate-700">{selectedFarmNote.created_by || "Operator"}</strong></p>
                  <p>{new Date(selectedFarmNote.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingFarmNote(true)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFarmNote(selectedFarmNote.id)}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateFarmNote} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Content</label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingFarmNote(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* UNIVERSAL CONFIRMATION DIALOG MODAL */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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