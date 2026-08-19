"use client";

import React, { useState } from "react";

interface LazyAnimalImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const LazyAnimalImage: React.FC<LazyAnimalImageProps> = ({
  src,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "relative w-full h-full bg-slate-100 overflow-hidden",
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fallbackSrc = "/placeholder.svg";
  const isValidSrc = src && src.trim() !== "" && !hasError;
  const imageSource = isValidSrc ? src : fallbackSrc;

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse flex items-center justify-center z-0">
          <span className="text-slate-400 text-xs font-semibold select-none">📷</span>
        </div>
      )}

      <img
        src={imageSource}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};