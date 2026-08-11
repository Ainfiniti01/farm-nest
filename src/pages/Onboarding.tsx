"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "@/context/FarmContext";

const ONBOARDING_SLIDES = [
  {
    title: "Secure Livestock Records",
    subtitle: "Record digital ID tags, monitor active veterinary treatments, and trace dam/sire parentage lineages efficiently.",
    emoji: "🐐"
  },
  {
    title: "Smarter Feed Management",
    subtitle: "Automate dry stock feed logs, and receive low-inventory alerts before feed sack items run completely dry.",
    emoji: "📦"
  },
  {
    title: "Better Breeding Traceability",
    subtitle: "Chronicle breeding cross schedules, monitor gestations, and bind offspring directly back to maternal bloodlines.",
    emoji: "🌾"
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-800/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full text-center space-y-8 z-10">
        <span className="text-5xl block animate-bounce">{ONBOARDING_SLIDES[slideIndex].emoji}</span>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">{ONBOARDING_SLIDES[slideIndex].title}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{ONBOARDING_SLIDES[slideIndex].subtitle}</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${slideIndex === idx ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-700"}`} 
            />
          ))}
        </div>

        <div className="pt-4">
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition duration-200"
          >
            {slideIndex === ONBOARDING_SLIDES.length - 1 ? "Get Started" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};