"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useFarm, FarmGalleryItem } from "@/context/FarmContext";
import { compressImage } from "@/utils/imageCompressor";
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  Camera, 
  Trash2, 
  Eye, 
  Download, 
  X, 
  Image as ImageIcon,
  Loader2,
  Calendar,
  Filter,
  HelpCircle
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const CATEGORIES = ["All", "General", "Animals", "Buildings", "Equipment", "Events", "Other"] as const;

export const FarmGalleryPage: React.FC = () => {
  const { farmGallery, loadFarmGallery, addFarmGalleryPhoto, deleteFarmGalleryPhoto } = useFarm();

  useEffect(() => {
    loadFarmGallery();
  }, [loadFarmGallery]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<FarmGalleryItem | null>(null);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Confirm delete state
  const [deletingPhoto, setDeletingPhoto] = useState<FarmGalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const preview = await compressImage(file, 800, 800, 0.7);
        setImagePreview(preview);
      } catch (err) {
        showError("Error processing image file");
      }
    }
  };

  const handleOpenUploadModal = () => {
    setTitle("");
    setCaption("");
    setCategory("General");
    setSelectedFile(null);
    setImagePreview("");
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !imagePreview) {
      showError("Please select or capture a photo first.");
      return;
    }

    setIsUploading(true);
    try {
      const success = await addFarmGalleryPhoto({
        title: title.trim() || undefined,
        caption: caption.trim() || undefined,
        category,
        file: selectedFile || undefined,
        dataUrl: imagePreview || undefined,
      });

      if (success) {
        setShowUploadModal(false);
        setTitle("");
        setCaption("");
        setSelectedFile(null);
        setImagePreview("");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPhoto) return;
    setIsDeleting(true);
    try {
      const success = await deleteFarmGalleryPhoto(deletingPhoto.id, deletingPhoto.image_url);
      if (success) {
        setDeletingPhoto(null);
        if (fullscreenPhoto?.id === deletingPhoto.id) {
          setFullscreenPhoto(null);
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPhotos = farmGallery.filter(item => {
    if (selectedCategory === "All") return true;
    return item.category === selectedCategory;
  });

  const handleDownload = (imageUrl: string, photoTitle?: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${photoTitle || "farm_photo"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
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
            <h2 className="text-xl font-black text-slate-900">General Farm Gallery</h2>
            <p className="text-xs text-slate-500">
              Store, organize, and view general farm photos, facilities, equipment, and events separately from individual animal cards.
            </p>
          </div>
          <button
            onClick={handleOpenUploadModal}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <Plus size={15} />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Filter Categories Pills */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          <Filter size={12} className="text-emerald-600" />
          Filter by Category
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat === "All" ? "🖼️ All Photos" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredPhotos.map((item) => {
          const formattedDate = new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:border-emerald-300 transition flex flex-col group relative"
            >
              <div 
                className="relative h-40 bg-slate-100 cursor-pointer overflow-hidden"
                onClick={() => setFullscreenPhoto(item)}
              >
                <img
                  src={item.image_url}
                  alt={item.title || "Farm photo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-900/80 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {item.category}
                  </span>
                </div>

                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition text-xs font-black gap-1.5">
                  <Eye size={16} /> View Photo
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                    {item.title || "Untitled Farm Photo"}
                  </h4>
                  {item.caption && (
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                      {item.caption}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-50 flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formattedDate}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingPhoto(item);
                    }}
                    className="text-slate-400 hover:text-red-600 p-1 transition"
                    title="Delete photo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPhotos.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
            <ImageIcon size={36} className="mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No photos in {selectedCategory === "All" ? "gallery" : `"${selectedCategory}" category`}.</p>
            <p className="text-[11px] text-slate-400">Click "Upload Photo" to save farm facility photos, events, or equipment images.</p>
          </div>
        )}
      </div>

      {/* UPLOAD PHOTO MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={handleUploadSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Upload to Farm Gallery</h3>
              <button 
                type="button" 
                onClick={() => !isUploading && setShowUploadModal(false)} 
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo Selection Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Select Photo <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition disabled:opacity-50"
                >
                  <Camera size={14} className="text-emerald-700" /> Snap Photo
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 transition disabled:opacity-50"
                >
                  <Upload size={14} className="text-slate-600" /> Upload File
                </button>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Image Preview Card */}
              {imagePreview && (
                <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview("");
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full text-xs transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isUploading}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                >
                  <option value="General">General</option>
                  <option value="Animals">Animals</option>
                  <option value="Buildings">Buildings</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Events">Events</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Barn Wing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Optional Caption / Notes
              </label>
              <textarea
                placeholder="Add optional notes about this photo..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isUploading}
                rows={3}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Photo"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FULLSCREEN PHOTO VIEW MODAL */}
      {fullscreenPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xl transition"
          >
            ✕
          </button>

          <div className="max-w-3xl max-h-[75vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl relative">
            <img 
              src={fullscreenPhoto.image_url} 
              className="w-full h-full object-contain" 
              alt={fullscreenPhoto.title || "Farm photo"} 
            />
          </div>

          <div className="mt-4 text-center text-white max-w-md space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 px-2.5 py-0.5 rounded-full inline-block">
              {fullscreenPhoto.category}
            </span>
            <h3 className="text-base font-extrabold">
              {fullscreenPhoto.title || "Untitled Farm Photo"}
            </h3>
            {fullscreenPhoto.caption && (
              <p className="text-xs text-slate-300 leading-relaxed">
                {fullscreenPhoto.caption}
              </p>
            )}
            <p className="text-[10px] text-slate-400 pt-1">
              Uploaded on {new Date(fullscreenPhoto.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleDownload(fullscreenPhoto.image_url, fullscreenPhoto.title)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Download size={15} /> Download
            </button>

            <button
              onClick={() => setDeletingPhoto(fullscreenPhoto)}
              className="px-5 py-2.5 bg-red-600/80 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2"
            >
              <Trash2 size={15} /> Delete
            </button>

            <button
              onClick={() => setFullscreenPhoto(null)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingPhoto && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-600">
                <HelpCircle size={22} />
              </div>
              <h3 className="font-black text-sm text-slate-900">Delete Gallery Photo?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{deletingPhoto.title || "this photo"}</strong> from the General Farm Gallery? This action cannot be undone.
            </p>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => !isDeleting && setDeletingPhoto(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition shadow disabled:opacity-60 flex items-center justify-center gap-1.5"
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