"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { BOX_OPTIONS, getBoxByPieces } from "@/lib/products";
import { getDefaultPrice, getUnitsPerBox } from "@/lib/settings";
import type { ProductType } from "@/lib/settings";

const PRODUCT_TYPE_OPTIONS: { value: ProductType; label: string; pieces: 35 | 50 | 70 }[] = [
  { value: "BOX_35", label: "מגש 35 יח'", pieces: 35 },
  { value: "BOX_50", label: "מגש 50 יח'", pieces: 50 },
  { value: "BOX_70", label: "מגש 70 יח'", pieces: 70 },
];

function productTypeFromPieces(pieces: number): ProductType {
  return pieces === 35 ? "BOX_35" : pieces === 50 ? "BOX_50" : "BOX_70";
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const boxParam = searchParams.get("box");
  const initialPieces = [35, 50, 70].includes(Number(boxParam)) ? Number(boxParam) as 35 | 50 | 70 : 35;
  const initialProductType = productTypeFromPieces(initialPieces);

  const [productType, setProductType] = useState<ProductType>(initialProductType);
  const [boxCount, setBoxCount] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const unitsPerBox = getUnitsPerBox(productType);
  const pricePerBox = getDefaultPrice(productType);
  const totalUnits = unitsPerBox * boxCount;
  const totalPrice = boxCount * pricePerBox;
  const box = getBoxByPieces(unitsPerBox as 35 | 50 | 70);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          boxCount,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          deliveryAddress,
          deliveryDate,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "שגיאה בשליחת ההזמנה");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMessage("שגיאת רשת. נסו שוב.");
      setStatus("error");
    }
  };

  if (!box) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-pastry-brown mb-4">גודל מגש לא תקין.</p>
        <Link href="/" className="text-pastry-gold hover:underline">
          חזרה לתפריט
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="bg-green-100 text-green-800 rounded-xl p-6 mb-4">
          <p className="font-semibold text-lg">ההזמנה נשלחה בהצלחה!</p>
          <p className="mt-2 text-sm">
            נחזור אליכם בהקדם לאישור. תודה.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block py-2 px-4 bg-pastry-gold text-white rounded-lg hover:bg-pastry-brown"
        >
          חזרה לתפריט
        </Link>
      </div>
    );
  }

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/" className="text-pastry-brown/80 hover:text-pastry-brown text-sm mb-6 inline-block">
        ← חזרה לתפריט
      </Link>

      <div className="bg-white rounded-2xl shadow-lg border border-pastry-warm p-6 mb-6">
        <h2 className="text-xl font-bold text-pastry-deep mb-2">השלמת הזמנה</h2>
        <div className="space-y-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-pastry-deep">מוצר</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream mt-1"
            >
              {PRODUCT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-pastry-deep">כמות קופסאות</label>
            <input
              type="number"
              min={1}
              value={boxCount}
              onChange={(e) => setBoxCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream mt-1"
            />
          </div>
        </div>
        <p className="text-pastry-brown">
          {box.label} – מתאים ל־{box.serves} • ₪{pricePerBox} לקופסה
        </p>
        <p className="text-sm text-pastry-brown/80 mt-1">
          סה״כ יחידות: {totalUnits} • מחיר לקופסה: ₪{pricePerBox}
        </p>
        <p className="text-lg font-semibold text-pastry-gold mt-2">
          סה״כ: ₪{totalPrice} ({boxCount} קופסה/ות)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-pastry-deep mb-1">
            שם מלא *
          </label>
          <input
            id="name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
            placeholder="שם מלא"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-pastry-deep mb-1">
            טלפון *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
            placeholder="05X-XXXXXXX"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-pastry-deep mb-1">
            אימייל לקבלת חשבונית
          </label>
          <input
            id="email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
            placeholder="example@email.com"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-pastry-deep mb-1">
            כתובת משרד למשלוח/ שם משרד *
          </label>
          <textarea
            id="address"
            required
            rows={2}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
            placeholder="כתובת משרד או שם המשרד"
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-pastry-deep mb-1">
            תאריך משלוח רצוי * (לפחות 3 ימים מראש)
          </label>
          <input
            id="date"
            type="date"
            required
            min={minDate}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-pastry-deep mb-1">
            הערות
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-pastry-warm rounded-lg px-3 py-2 bg-pastry-cream"
            placeholder="הערות להזמנה"
          />
        </div>
        {status === "error" && (
          <p className="text-red-600 text-sm">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full py-3 px-4 bg-pastry-gold hover:bg-pastry-brown disabled:opacity-60 text-white font-medium rounded-xl transition-colors"
        >
          {status === "sending" ? "שולח..." : "שליחת הזמנה"}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-10 text-center">טוען...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
