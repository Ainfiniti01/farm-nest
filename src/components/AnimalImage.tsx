"use client";

import React, { useState, useEffect } from "react";
import { DEFAULT_ANIMAL_PHOTO } from "@/context/FarmContext";

interface AnimalImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
}

export const AnimalImage: React.FC<AnimalImageProps> = React.memo(({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-full relative overflow-hidden bg-slate-100",
  onClick
}) => {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_ANIMAL_PHOTO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let validSrc = src && typeof src === "string" && src.trim().length > 0 ? src.trim() : DEFAULT_ANIMAL_PHOTO;
    setImageSrc(validSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (imageSrc !== DEFAULT_ANIMAL_PHOTO) {
      setImageSrc(DEFAULT_ANIMAL_PHOTO);
      setHasError(true);
    }
    setIsLoading(false);
  };

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-xs font-semibold">Loading...</span>
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
});

AnimalImage.displayName = "AnimalImage";