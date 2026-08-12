"use client";

import React, { useState, useEffect } from "react";
import { useFarm, InventoryItem } from "@/context/FarmContext";
import { Plus, Boxes, Search, Trash2, HelpCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

export const Inventory: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryStock, loadInventory } = useFarm();

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const [showAddInventory, setShowAddInventory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [newInventory, setNewInventory] = useState({
    name: "",
    category: "Feed" as InventoryItem["category"],
    quantity: 10,
    unit: "Bags",
    minStock: 2,
    notes: "",
  });

  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<"add" | "remove">("add");
  const [adjustNotes, setAdjustNotes] = useState("");

  const handleCreateInventory = (e: React.FormEvent) => {
    e.preventDefault();
    addInventoryItem({
      name: newInventory.name,
      category: newInventory.category,
      quantity: Number(newInventory.quantity),
      unit: newInventory.unit,
      minStock: newInventory.minStock,
      notes: newInventory.notes,
    });
    setShowAddInventory(false);
    setNewInventory({
      name: "",
      category: "Feed",
      quantity: 10,
      unit: "Bags",
      minStock: 2,
      notes: "",
    });
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    updateInventoryStock(
      adjustingItem.id,
      adjustQty,
      adjustType === "add" ? "add" : "remove",
      adjustNotes || "Manual stock adjustment",
      "Operator"
    );
    setAdjustingItem(null);
    setAdjustNotes("");
  };

  const filteredInventory = inventory.filter(item => {
    const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = categoryFilter === "All" || item.category === categoryFilter;
    return nameMatch && categoryMatch;
  });

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Farm Storage & Stock</h2>
          <p className="text-xs text-slate-500">Track and log stock movements for feed and veterinary medicine.</p>
        </div>
        <button
          onClick={() => setShowAddInventory(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition"
        >
          <Plus size={14} />
          Add Item
        </button>
      </div>

      {/* Search + Category Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search feed brands, medications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {["All", "Feed", "Medication", "Equipment", "Supplies", "Other"].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                categoryFilter === cat
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInventory.map((item) => {
          const isLow = item.quantity <= item.minStock;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                  item.category === "Feed" ? "bg-amber-100 text-amber-800" :
                  item.category === "Medication" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                }`}>
                  {item.category === "Feed" ? "🌾" : item.category === "Medication" ? "💊" : "🔧"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900">{item.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1.5 py-0.5 bg-slate-50 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Current Stock: <span className="font-black text-slate-800">{item.quantity}</span> {item.unit}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1 items-end">
                {isLow && (
                  <span className="text-[9px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-1">
                    Low Stock
                  </span>
                )}
                <button
                  onClick={() => {
                    setAdjustingItem(item);
                    setAdjustQty(1);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl"
                >
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADJUST QUANTITY DIALOG */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleAdjustStockSubmit}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Adjust stock: {adjustingItem.name}</h3>
              <button type="button" onClick={() => setAdjustingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Adjustment Action</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as "add" | "remove")}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Disburse Stock (-)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Quantity Change ({adjustingItem.unit})</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Purpose / Reason</label>
              <input
                type="text"
                placeholder="Weekly feeding schedule..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Commit Stock Adjustment
            </button>
          </form>
        </div>
      )}

      {/* ADD ITEM DIALOG */}
      {showAddInventory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <form 
            onSubmit={handleCreateInventory}
            className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Add Inventory Storage</h3>
              <button type="button" onClick={() => setShowAddInventory(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 block">Item Name / Brand</label>
              <input
                type="text"
                placeholder="e.g. Maize feed sacks 50kg"
                value={newInventory.name}
                onChange={(e) => setNewInventory({ ...newInventory, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Category</label>
                <select
                  value={newInventory.category}
                  onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                >
                  <option value="Feed">Feed 🌾</option>
                  <option value="Medication">Medication 💊</option>
                  <option value="Equipment">Equipment 🔧</option>
                  <option value="Supplies">Supplies 🔧</option>
                  <option value="Other">Other Supply</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Measuring Unit</label>
                <input
                  type="text"
                  placeholder="e.g. Bags / Bottles"
                  value={newInventory.unit}
                  onChange={(e) => setNewInventory({ ...newInventory, unit: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Opening Quantity</label>
                <input
                  type="number"
                  value={newInventory.quantity}
                  onChange={(e) => setNewInventory({ ...newInventory, quantity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Low Stock Alert Level</label>
                <input
                  type="number"
                  value={newInventory.minStock}
                  onChange={(e) => setNewInventory({ ...newInventory, minStock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs mt-1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl"
            >
              Add Item to Storage
            </button>
          </form>
        </div>
      )}

    </div>
  );
};