import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "אמא במשרד | מגש מאמא - טעם של הבית",
  description: "הטעם של הבית במשרד. הזמנת מגשי מאפים טריים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
