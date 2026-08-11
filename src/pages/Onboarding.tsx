"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";

const ONBOARDING_SLIDES = [
  {
    title: "Secure Livestock Records",
    subtitle: "Give every animal a unique digital ID and keep its health records, treatments, photos, lineage, and important notes in one place.",
    emoji: "🐐",
    bg: "https://images.unsplash.com/photo-1542764343-436008e87145?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dw=1200&auto=format&fit=crop&q=80"
  },
  {
    title: "Smarter Inventory Management",
    subtitle: "Keep track of feed, medication, equipment, and other farm supplies, with alerts when important items are running low.",
    emoji: "📦",
    bg: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1474&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dw=1200&auto=format&fit=crop&q=80"
  },
  {
    title: "Better Breeding Traceability",
    subtitle: "Record breeding events, track parentage, and connect offspring directly to their mother and father for a clearer family history.",
    emoji: "🧬",
    bg: "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=1200&auto=format&fit=crop&q=80"
  },
  {
    title: "Know Your Animals Better",
    subtitle: "Build a complete history for every animal with photos, growth records, observations, treatments, and day-to-day farm notes.",
    emoji: "📸",
    bg: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200&auto=format&fit=crop&q=80"
  },
  {
    title: "Your Farm, All Together",
    subtitle: "Keep your farm's animals, health records, inventory, contacts, reminders, and reports organized in one simple place.",
    emoji: "🌱",
    bg: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80"
  }
];

export const Onboarding: React.FC = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const navigate = useNavigate();
  const { setOnboardingCompleted } = useFarm();

  const handleNext = () => {
    if (slideIndex < ONBOARDING_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      setOnboardingCompleted(true);
      navigate("/register");
    }
  };

  const handleBack = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
    }
  };

  const currentSlide = ONBOARDING_SLIDES[slideIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden transition-all duration-500">
      {/* Background Image with elegant overlay to match auth layouts */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 opacity-0.5 filter blur-[2px] scale-105" 
        style={{ backgroundImage: `url('${currentSlide.bg}')` }} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950 z-0" />

      {/* Main card box container */}
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-slate-800/60 shadow-2xl z-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <span className="text-5xl block animate-bounce drop-shadow-md">{currentSlide.emoji}</span>
        
        <div className="space-y-3">
          <h1 className="text-xl font-black tracking-tight text-white">{currentSlide.title}</h1>
          <p className="text-slate-300 text-xs leading-relaxed min-h-[64px] flex items-center justify-center">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Slide Progress Indicator dots */}
        <div className="flex justify-center gap-2">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${slideIndex === idx ? "w-6 bg-emerald-500" : "w-2 bg-slate-700"}`} 
            />
          ))}
        </div>

        {/* Navigation Buttons Grid */}
        <div className="pt-2 flex gap-3">
          {slideIndex > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition duration-200"
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition duration-200"
          >
            {slideIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};