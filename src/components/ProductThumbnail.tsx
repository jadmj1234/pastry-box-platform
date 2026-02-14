"use client";

import { useState } from "react";

export default function ProductThumbnail() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="w-full aspect-[4/3] rounded-t-2xl overflow-hidden bg-pastry-warm/30 mb-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ad.png"
        alt=""
        className="object-cover w-full h-full"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
