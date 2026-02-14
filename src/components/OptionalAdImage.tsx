"use client";

import { useState } from "react";

const IMAGE_SOURCES = ["/ad.png?v=1", "/ad.jpg?v=1", "/ad.jpeg?v=1"];

export default function OptionalAdImage() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  const handleError = () => {
    if (sourceIndex + 1 < IMAGE_SOURCES.length) {
      setSourceIndex((i) => i + 1);
    } else {
      setUsePlaceholder(true);
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] min-h-[280px] rounded-xl overflow-hidden bg-pastry-warm/30">
      {usePlaceholder ? (
        <img
          src="/placeholder.svg"
          alt="מגש מאמא - טעם של הבית"
          className="object-contain w-full h-full"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={IMAGE_SOURCES[sourceIndex]}
          src={IMAGE_SOURCES[sourceIndex]}
          alt="מגש מאמא - טעם של הבית"
          className="object-contain w-full h-full"
          onError={handleError}
        />
      )}
    </div>
  );
}
