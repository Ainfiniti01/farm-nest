"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFarm, FarmNote } from "@/context/FarmContext";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit, 
  HelpCircle,
  Calendar,
  User,
  X,
  Loader2
} from "lucide-react";
import { showError } from "@/utils/toast";

export const FarmNotesPage: React.FC = () => {
  const { farmNotes, addFarmNote, updateFarmNote, deleteFarmNote, loadFarmNotes } = useFarm();

  useEffect(() => {
    loadFarmNotes();
  }, [loadFarmNotes]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<FarmNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states for creation / editing
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirmation dialog state
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleOpenAddModal = () => {
    setTitle("");
    setContent("");
    setShowAddModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showError("Note content is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addFarmNote({
        title: title.trim() || undefined,
        content: content.trim(),
      });

      if (success) {
        setShowAddModal(false);
        setTitle("");
        setContent("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenNoteModal = (note: FarmNote) => {
    setSelectedNote(note);
    setTitle(note.title || "");
    setContent(note.content);
    setIsEditing(false);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote) return;
    if (!content.trim()) {
      showError("Note content cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const success = await updateFarmNote(selectedNote.id, {
        title: title.trim() || undefined,
        content: content.trim(),
      });

      if (success) {
        setSelectedNote(null);
        setIsEditing(false);
        setTitle("");
        setContent("");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTrigger = (noteId: string) => {
    setPendingConfirm({
      title: "Delete this note?",
      message: "This action cannot be undone.",
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const success = await deleteFarmNote(noteId);
          if (success) {
            setPendingConfirm(null);
            setSelectedNote(null);
          }
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const filteredNotes = farmNotes.filter(note => {
    const titleMatch = note.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition mb-2"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Farm Notes</h2>
            <p className="text-xs text-slate-500">
              Keep track of important changes, decisions, events and observations across your farm.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <Plus size={15} />
            Add Note
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search farm notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-xs"
        />
      </div>

      {/* Farm Notes List (Newest First) */}
      <div className="space-y-3">
        {filteredNotes.map((note) => {
          const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });

          return (
            <div
              key={note.id}
              onClick={() => handleOpenNoteModal(note)}
              className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 transition cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-800 transition truncate">
                      📝 {note.title}
                    </h4>
                  )}
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {!note.title && "📝 "}
                    {note.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formattedDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User size={11} /> {note.created_by || "Operator"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed text-slate-400 text-xs space-y-2">
            <FileText size={32} className="mx-auto text-slate-300" />
            <p className="font-semibold">No farm notes found.</p>
            <p className="text-[11px] text-slate-400">Record general farm schedule changes, feeding updates, or veterinarian visits above.</p>
          </div>
        )}
      </div>

      {/* CREATE FARM NOTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={handleCreateSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Farm Note</h3>
              <button 
                type="button" 
                onClick={() => !isSubmitting && setShowAddModal(false)} 
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Started adding salt to feed"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Note Content <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe general farm activities, schedule shifts, or feed adjustments..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
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

      {/* FULL-TEXT NOTE VIEW & EDIT MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {isEditing ? "Edit Farm Note" : "Farm Note"}
              </h3>
              <button 
                type="button" 
                onClick={() => !isSavingEdit && setSelectedNote(null)} 
                disabled={isSavingEdit}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                {selectedNote.title && (
                  <h4 className="font-black text-base text-slate-900">
                    {selectedNote.title}
                  </h4>
                )}
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 border-t pt-3">
                  <p>Added by <strong className="text-slate-700">{selectedNote.created_by || "Operator"}</strong></p>
                  <p>{new Date(selectedNote.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })} at {new Date(selectedNote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrigger(selectedNote.id)}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSavingEdit}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSavingEdit}
                    rows={4}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSavingEdit}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {isSavingEdit ? (
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

      {/* CONFIRMATION OVERLAY */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                <HelpCircle size={22} />
              </div>
              <h3 className="font-black text-sm text-slate-900">{pendingConfirm.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{pendingConfirm.message}</p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => !isDeleting && setPendingConfirm(null)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={pendingConfirm.onConfirm}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition shadow disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};