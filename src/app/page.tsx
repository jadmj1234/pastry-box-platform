import Link from "next/link";
import { BOX_OPTIONS } from "@/lib/products";
import { getDefaultPrice } from "@/lib/settings";
import type { ProductType } from "@/lib/settings";
import BoxImage from "@/components/BoxImage";

function productTypeFromPieces(pieces: number): ProductType {
  return pieces === 35 ? "BOX_35" : pieces === 50 ? "BOX_50" : "BOX_70";
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="py-6 px-4"
        style={{ backgroundColor: "#2e5c2a", color: "#f5f0e8" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold">אמא במשרד</h1>
          <p className="mt-1 text-xl" style={{ color: "#e8dcc8" }}>הטעם של הבית במשרד</p>
        </div>
      </header>

      {/* Delivery info - visible before choosing a box */}
      <section className="bg-pastry-warm/50 py-4 px-4">
        <div className="max-w-4xl mx-auto text-center text-pastry-brown text-xl">
          <p className="font-medium">אזורי חלוקה: חדרה • נתניה • השרון • תל אביב • חיפה • יקנעם</p>
          <p className="mt-1">אספקה: 11:00–14:00</p>
          <p className="mt-1 font-bold">הזמנה מראש: לפחות 3 ימים</p>
          <p className="mt-1 font-bold">אמצעי תשלום - bit</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-6 text-center">
        <h2 className="text-2xl md:text-4xl text-pastry-brown font-bold mb-3">
          מגש מאמא – טעם של הבית
        </h2>
        <p className="text-lg md:text-xl text-pastry-brown font-semibold">
          טעמי הבית עד המשרד. בחרו מגש והזמינו בהקדם.
        </p>
      </section>

      {/* Box options - Menu */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h3 className="text-lg font-semibold text-pastry-deep mb-4 text-center">
          בחרו גודל מגש
        </h3>
        <div className="grid gap-6 sm:grid-cols-3">
          {BOX_OPTIONS.map((box) => (
            <article
              key={box.pieces}
              className="bg-white rounded-2xl shadow-lg border border-pastry-warm overflow-hidden hover:shadow-xl transition-shadow"
            >
              <BoxImage price={box.price as 280 | 350 | 450} />
              <div className="p-6">
                <div className="text-2xl font-bold text-pastry-gold mb-1">
                  {box.label}
                </div>
                <p className="text-sm text-pastry-brown/80 mb-3">
                  מתאים ל־{box.serves}
                </p>
                <p className="text-2xl font-bold text-pastry-deep mb-4">
                  ₪{getDefaultPrice(productTypeFromPieces(box.pieces))}
                </p>
                <Link
                  href={`/checkout?box=${box.pieces}`}
                  className="block w-full py-3 px-4 bg-pastry-gold hover:bg-pastry-brown text-white font-bold rounded-xl text-center transition-colors"
                >
                  להזמנה
                </Link>
                <ul className="mt-4 list-disc list-inside text-lg text-pastry-brown/90 space-y-1">
                  {box.contents.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="py-6 px-4" />
    </div>
  );
}
