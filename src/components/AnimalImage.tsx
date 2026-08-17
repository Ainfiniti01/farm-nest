"use client";

import React, { useState } from "react";
import { DEFAULT_ANIMAL_PHOTO } from "@/context/FarmContext";

interface AnimalImageProps {
  src?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  isZoomable?: boolean;
  grayscale?: boolean;
}

export const AnimalImage: React.FC<AnimalImageProps> = ({
  src,
  alt,
  className = "",
  onClick,
  isZoomable = false,
  grayscale = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = (!src || hasError || src.trim() === "") ? DEFAULT_ANIMAL_PHOTO : src;

  return (
    <div className={`relative overflow-hidden w-full h-full bg-slate-100 ${className}`}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-xl opacity-30">🐐</span>
        </div>
      )}

      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        onClick={onClick}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${grayscale ? "grayscale" : ""} ${
          isZoomable ? "cursor-zoom-in group-hover:scale-105 transition-transform duration-300" : ""
        }`}
      />
    </div>
  );
};