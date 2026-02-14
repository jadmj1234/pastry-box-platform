export const PRICE_PER_PIECE = 8; // NIS

export const BOX_OPTIONS = [
  {
    pieces: 35 as const,
    label: "35 יח'",
    serves: "6-10 אנשים",
    price: 280,
    contents: ["גבינה", "זעתר", "תרד", "בשר", "פיצה"],
  },
  {
    pieces: 50 as const,
    label: "50 יח'",
    serves: "10-15 אנשים",
    price: 350,
    contents: ["גבינה", "זעתר", "תרד", "בשר", "פיצה", "מסאחן"],
  },
  {
    pieces: 70 as const,
    label: "70 יח'",
    serves: "15-20 אנשים",
    price: 450,
    contents: ["גבינה", "זעתר", "תרד", "בשר", "פיצה", "מסאחן", "נקנקניות"],
  },
] as const;

export function getBoxByPieces(pieces: 35 | 50 | 70) {
  return BOX_OPTIONS.find((b) => b.pieces === pieces);
}
