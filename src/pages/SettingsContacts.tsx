"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFarm, Contact } from "@/context/FarmContext";
import { ArrowLeft, Trash2, HelpCircle, Phone, Plus } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const SettingsContacts: React.FC = () => {
  const { contacts, addContact, deleteContact, loadContacts } = useFarm();

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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

  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">Farm Contacts Directory</h2>
            <p className="text-xs text-slate-500">Record veterinary specialists, paddock manager lines, suppliers or emergency contacts.</p>
          </div>
          <button
            onClick={() => setShowAddContact(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((c) => (
          <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{c.role}</span>
                <h4 className="font-black text-sm text-slate-900 mt-0.5">{c.name}</h4>
                <p className="text-xs text-slate-600 font-bold mt-1">📞 {c.phone}</p>
                {c.email && <p className="text-xs text-slate-500 mt-0.5">✉️ {c.email}</p>}
              </div>

              <div className="flex gap-1.5">
                <a
                  href={`tel:${c.phone}`}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-100 border rounded-xl flex items-center justify-center text-sm shadow-sm"
                >
                  📞
                </a>
                <button
                  onClick={() => {
                    setPendingConfirm({
                      title: "Delete Specialist Contact?",
                      message: `Confirm removal of ${c.name} from the farm's contact directory.`,
                      onConfirm: () => {
                        deleteContact(c.id);
                        setPendingConfirm(null);
                      }
                    });
                  }}
                  className="w-8 h-8 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl flex items-center justify-center text-sm shadow-sm"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {c.notes && (
              <p className="text-[11px] text-slate-500 mt-3 italic bg-slate-50 p-2 rounded-xl border border-slate-100">{c.notes}</p>
            )}
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-xs">
            No contacts recorded. Register veterinarians or feed suppliers above!
          </div>
        )}
      </div>

      {/* ADD CONTACT DIALOG */}
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
                  onChange={(e) => setNewContact({ ...newContact, role: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Farm Owner">Farm owner</option>
                  <option value="Veterinarian">Veterinarian 🩺</option>
                  <option value="Farm Manager">Farm Manager 👨🏽‍🌾</option>
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

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Specialist Notes (Optional)</label>
              <input
                type="text"
                placeholder="Chief livestock consult..."
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Add Contact Specialist
            </button>
          </form>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl">
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