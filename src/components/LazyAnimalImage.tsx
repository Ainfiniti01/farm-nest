"use client";

import React, { useState } from "react";

interface LazyAnimalImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  onClick?: () => void;
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
  const imageSource = (!src || src.trim() === "" || hasError) ? fallbackSrc : src;

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <span className="text-slate-400 text-xs font-semibold">📷</span>
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