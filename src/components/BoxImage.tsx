"use client";

import { useState } from "react";

type Price = 280 | 350 | 450;

const IMG_SRC: Record<Price, string> = {
  280: "/280/img.jpg.jpeg",
  350: "/350/img.jpg.jpeg",
  450: "/450/img.jpg.jpeg",
};

export default function BoxImage({ price }: { price: Price }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="w-full aspect-[4/3] rounded-t-2xl overflow-hidden bg-pastry-warm/30 mb-4 flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${IMG_SRC[price]}?t=2`}
        alt=""
        className="w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
