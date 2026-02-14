import Link from "next/link";
import { BOX_OPTIONS } from "@/lib/products";
import { getDefaultPrice, getWhatsAppNumber, getWhatsAppContactUrl } from "@/lib/settings";
import type { ProductType } from "@/lib/settings";
import BoxImage from "@/components/BoxImage";

function productTypeFromPieces(pieces: number): ProductType {
  return pieces === 35 ? "BOX_35" : pieces === 50 ? "BOX_50" : "BOX_70";
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function HomePage() {
  const whatsappNumber = getWhatsAppNumber();
  const contactHref = getWhatsAppContactUrl(whatsappNumber, "שלום אמא במשרד, אשמח לפרטים");

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
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-colors"
            title="צור קשר בוואטסאפ"
          >
            <WhatsAppIcon className="w-6 h-6 shrink-0" />
            צור קשר
          </a>
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
