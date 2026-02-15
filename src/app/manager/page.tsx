"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { Order, OrderAttachment, AttachmentType } from "@/lib/orders";
import type { ProductType } from "@/lib/settings";

const STATUS_LABELS_EXCEL: Record<Order["status"], string> = {
  new: "חדש",
  confirmed: "אושר",
  delivered: "נמסר",
  cancelled: "בוטל",
};

const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  bit: "צילום bit",
  receipt: "חשבונית",
  other: "אחר",
};

function OrderCard({
  order,
  orderNum,
  statusLabels,
  statusColors,
  updateStatus,
  fileDownloadUrl,
  onFileUpload,
  onRemoveAttachment,
  uploadingFor,
  onUpdatePrice,
  onDelete,
}: {
  order: Order;
  orderNum: number;
  statusLabels: Record<Order["status"], string>;
  statusColors: Record<Order["status"], string>;
  updateStatus: (id: string, status: Order["status"]) => void;
  fileDownloadUrl: (orderId: string, storedAs: string) => string;
  onFileUpload: (orderId: string, file: File, type: AttachmentType) => void;
  onRemoveAttachment: (orderId: string, storedAs: string) => void;
  uploadingFor: string | null;
  onUpdatePrice?: (orderId: string, pricePerBox: number) => void;
  onDelete?: (orderId: string) => void;
}) {
  const [attachType, setAttachType] = useState<AttachmentType>("bit");
  const [statusSelect, setStatusSelect] = useState<Order["status"]>(order.status);
  const [editPrice, setEditPrice] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatusSelect(order.status);
  }, [order.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(order.id, file, attachType);
    e.target.value = "";
  };

  const hasReceipt = order.attachments?.some((a) => a.type === "receipt");
  const hasBit = order.attachments?.some((a) => a.type === "bit");
  const missingFiles = !hasReceipt || !hasBit;

  const productLabel = order.unitsPerBox === 35 ? "35 יח'" : order.unitsPerBox === 50 ? "50 יח'" : "70 יח'";

  const handlePrint = () => {
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <title>אמא במשרד</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; padding: 24px; font-size: 16px; }
    h1 { font-size: 24px; margin-bottom: 16px; }
    p { margin: 8px 0; }
    .label { font-weight: bold; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>אמא במשרד</h1>
  <p><span class="label">מוצר:</span> ${order.unitsPerBox} יח׳</p>
  <p><span class="label">כמות קופסאות:</span> ${order.boxCount}</p>
  <p><span class="label">סה״כ יחידות:</span> ${order.totalUnits}</p>
  <p><span class="label">מחיר לקופסה:</span> ₪${order.pricePerBox}</p>
  <p><span class="label">סה״כ מחיר:</span> ₪${order.totalPrice}</p>
  <p><span class="label">שם:</span> ${order.customerName}</p>
  <p><span class="label">טלפון:</span> ${order.customerPhone}</p>
  ${order.customerEmail ? `<p><span class="label">אימייל (חשבונית):</span> ${order.customerEmail}</p>` : ""}
  <p><span class="label">כתובת למשלוח:</span> ${order.deliveryAddress}</p>
  <p><span class="label">תאריך משלוח:</span> ${order.deliveryDate}</p>
  ${order.notes ? `<p><span class="label">הערות:</span> ${order.notes}</p>` : ""}
</body>
</html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => {
        w.print();
        w.close();
      }, 300);
    }
  };

  return (
    <li className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2">
              {missingFiles ? (
                <span
                  className="shrink-0 w-3 h-3 rounded-full bg-red-500"
                  title="חסר חשבונית או צילום bit"
                  aria-label="חסר קבצים"
                />
              ) : (
                <span
                  className="shrink-0 w-3 h-3 rounded-full bg-green-500"
                  title="חשבונית וצילום bit קיימים"
                  aria-label="כל הקבצים קיימים"
                />
              )}
              <span className="text-3xl font-bold text-black">הזמנה #{orderNum}</span>
            </span>
            {missingFiles && (
              <span className="text-xl text-red-600 mr-5">
                {!hasReceipt && !hasBit
                  ? "חסר: חשבונית, צילום bit"
                  : !hasReceipt
                    ? "חסר: חשבונית"
                    : "חסר: צילום bit"}
              </span>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-base text-gray-700">סטטוס:</label>
            <select
              value={statusSelect}
              className={`border rounded-lg px-3 py-1.5 text-base font-medium text-white ${
                statusSelect === "new"
                  ? "bg-[#ff4c4c] border-[#ff4c4c]"
                  : statusSelect === "confirmed"
                    ? "bg-blue-600 border-blue-600"
                    : statusSelect === "delivered"
                      ? "bg-green-600 border-green-600"
                      : "bg-gray-600 border-gray-600"
              }`}
              onChange={(e) => {
                const newStatus = e.target.value as Order["status"];
                if (newStatus === "delivered" && missingFiles) {
                  const missing =
                    !hasReceipt && !hasBit
                      ? "חסר: חשבונית, צילום bit"
                      : !hasReceipt
                        ? "חסר: חשבונית"
                        : "חסר: צילום bit";
                  window.alert(`לא ניתן לסמן נמסר.\n\n${missing}\n\nיש להעלות את הקבצים החסרים.`);
                  setStatusSelect(order.status);
                  return;
                }
                if (newStatus === "cancelled") {
                  if (!window.confirm("לבטל את ההזמנה?\n\nההזמנה תעבור לרשימת הבוטלים.")) {
                    setStatusSelect(order.status);
                    return;
                  }
                } else if (newStatus === "confirmed" || newStatus === "delivered") {
                  if (newStatus === "confirmed" && missingFiles) {
                    const missing =
                      !hasReceipt && !hasBit
                        ? "חסר: חשבונית, צילום bit"
                        : !hasReceipt
                          ? "חסר: חשבונית"
                          : "חסר: צילום bit";
                    if (
                      !window.confirm(
                        `ההזמנה חסרים קבצים.\n\n${missing}\n\nלהמשיך בשינוי הסטטוס בכל זאת?`
                      )
                    ) {
                      setStatusSelect(order.status);
                      return;
                    }
                  } else if (newStatus === "delivered") {
                    if (!window.confirm("לשנות סטטוס ל־נמסר?\n\nהאם אתה בטוח?")) {
                      setStatusSelect(order.status);
                      return;
                    }
                  } else {
                    if (!window.confirm("לשנות סטטוס ל־אושר?\n\nהאם אתה בטוח?")) {
                      setStatusSelect(order.status);
                      return;
                    }
                  }
                }
                setStatusSelect(newStatus);
                updateStatus(order.id, newStatus);
              }}
            >
              <option value="new">חדש</option>
              <option value="confirmed">אושר</option>
              <option value="delivered">נמסר</option>
              <option value="cancelled">בוטל</option>
            </select>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-base font-medium"
              title="הדפס הזמנה"
            >
              הדפס
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("למחוק את ההזמנה לצמיתות? לא ניתן לשחזר.")) {
                    onDelete(order.id);
                  }
                }}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-base font-medium"
                title="מחק הזמנה"
              >
                מחק
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-2 text-gray-700 text-base">
          <p><strong>מוצר:</strong> {productLabel}</p>
          <p><strong>כמות קופסאות:</strong> {order.boxCount}</p>
          <p><strong>סה״כ יחידות:</strong> {order.totalUnits}</p>
          <p><strong>מחיר לקופסה:</strong> ₪{order.pricePerBox}</p>
          <p><strong>סה״כ מחיר:</strong> ₪{order.totalPrice}</p>
          {onUpdatePrice && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <label className="text-sm text-gray-600">עדכון מחיר לקופסה:</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder={String(order.pricePerBox)}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const v = Number(editPrice);
                  if (!Number.isNaN(v) && v >= 0) {
                    onUpdatePrice(order.id, v);
                    setEditPrice("");
                  }
                }}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                שמור
              </button>
            </div>
          )}
          <p>
            <strong>שם:</strong> {order.customerName}
          </p>
          <p>
            <strong>טלפון:</strong>{" "}
            <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline">
              {order.customerPhone}
            </a>
          </p>
          {order.customerEmail && (
            <p>
              <strong>אימייל (חשבונית):</strong>{" "}
              <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:underline">
                {order.customerEmail}
              </a>
            </p>
          )}
          <p>
            <strong>כתובת:</strong> {order.deliveryAddress}
          </p>
          <p>
            <strong>תאריך משלוח:</strong> {order.deliveryDate}
          </p>
          {order.notes && (
            <p>
              <strong>הערות:</strong> {order.notes}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            נוצר: {new Date(order.createdAt).toLocaleString("he-IL")}
          </p>
        </div>

        {/* Attachments */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-base font-medium text-gray-700 mb-2">קבצים מצורפים</p>
          {order.attachments && order.attachments.length > 0 ? (
            <ul className="space-y-1 mb-3">
              {order.attachments.map((a) => (
                <li key={a.storedAs} className="text-base flex items-center gap-2">
                  <span className="text-gray-500">{ATTACHMENT_TYPE_LABELS[a.type]}:</span>
                  <a
                    href={fileDownloadUrl(order.id, a.storedAs)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {a.filename}
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(order.id, a.storedAs)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-red-600 hover:bg-red-100 text-sm font-bold"
                    title="הסר קובץ"
                    aria-label="הסר קובץ"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-gray-500 mb-3">אין קבצים.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={attachType}
              onChange={(e) => setAttachType(e.target.value as AttachmentType)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-base bg-gray-50 text-gray-800"
            >
              <option value="bit">צילום bit</option>
              <option value="receipt">חשבונית</option>
              <option value="other">אחר</option>
            </select>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={uploadingFor === order.id}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-base disabled:opacity-50"
            >
              {uploadingFor === order.id ? "מעלה..." : "העלאת קובץ"}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function ManagerPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "name" | "location">("date");
  const [showStatus, setShowStatus] = useState<"all" | "new" | "confirmed" | "delivered" | "cancelled">("all");
  const [showCancelled, setShowCancelled] = useState(false);
  const [showProduct, setShowProduct] = useState<"all" | ProductType>("all");
  const [showReports, setShowReports] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrders(data);
      setError("");
    } catch (e) {
      setError("לא ניתן לטעון הזמנות. וודא שהשרת רץ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/check");
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        fetchOrders();
      } else {
        setAuthenticated(false);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const updateStatus = async (id: string, status: Order["status"]) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchOrders();
    } catch {
      setError("שגיאה בעדכון סטטוס");
    }
  };

  const handleUpdatePrice = async (id: string, pricePerBox: number) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pricePerBox }),
      });
      if (res.ok) await fetchOrders();
      else setError("שגיאה בעדכון מחיר");
    } catch {
      setError("שגיאה בעדכון מחיר");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) await fetchOrders();
      else setError("שגיאה במחיקת ההזמנה");
    } catch {
      setError("שגיאה במחיקת ההזמנה");
    }
  };

  const countByStatus = {
    new: orders.filter((o) => o.status === "new").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const byCreatedAsc = (a: Order, b: Order) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  const byName = (a: Order, b: Order) =>
    (a.customerName || "").localeCompare(b.customerName || "", "he");
  const byLocation = (a: Order, b: Order) =>
    (a.deliveryAddress || "").localeCompare(b.deliveryAddress || "", "he");

  const sortFns = { date: byCreatedAsc, name: byName, location: byLocation };
  const sortFn = sortFns[sortBy];

  const sortedChronological = [...orders].sort(byCreatedAsc);
  const orderIdToNum: Record<string, number> = {};
  sortedChronological.forEach((o, i) => {
    orderIdToNum[o.id] = i + 1;
  });

  function deliveryDateKey(order: Order): string {
    const d = order.deliveryDate;
    if (!d) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime()))
      return parsed.toISOString().slice(0, 10);
    return d;
  }

  const dateFilter = (o: Order) => {
    if (!selectedRange) return true;
    const key = deliveryDateKey(o);
    return key >= selectedRange.start && key <= selectedRange.end;
  };

  const datesWithOrders = useMemo(
    () => new Set(orders.map((o) => deliveryDateKey(o)).filter(Boolean)),
    [orders]
  );

  const productFilter = (o: Order) =>
    showProduct === "all" || o.productType === showProduct;

  const reportStats = useMemo(() => {
    const revenueByProduct: Record<ProductType, number> = { BOX_35: 0, BOX_50: 0, BOX_70: 0 };
    const ordersCountByProduct: Record<ProductType, number> = { BOX_35: 0, BOX_50: 0, BOX_70: 0 };
    const unitsByProduct: Record<ProductType, number> = { BOX_35: 0, BOX_50: 0, BOX_70: 0 };
    let totalRevenue = 0;
    const nonCancelled = orders.filter((o) => o.status !== "cancelled");
    for (const o of nonCancelled) {
      const pt = o.productType ?? ("BOX_35" as ProductType);
      revenueByProduct[pt] = (revenueByProduct[pt] ?? 0) + (o.totalPrice ?? 0);
      ordersCountByProduct[pt] = (ordersCountByProduct[pt] ?? 0) + 1;
      unitsByProduct[pt] = (unitsByProduct[pt] ?? 0) + (o.totalUnits ?? 0);
      totalRevenue += o.totalPrice ?? 0;
    }
    const avgRevenuePerOrder = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;
    return { revenueByProduct, ordersCountByProduct, unitsByProduct, totalRevenue, avgRevenuePerOrder };
  }, [orders]);

  const handleExportExcel = () => {
    setExportingExcel(true);
    try {
      const summaryRows = [
        ["דוח סיכום – אמא במשרד"],
        [],
        ["מוצר", "הכנסות (₪)", "מספר הזמנות", "סה״כ יחידות"],
        ["35 יח׳", reportStats.revenueByProduct.BOX_35, reportStats.ordersCountByProduct.BOX_35, reportStats.unitsByProduct.BOX_35],
        ["50 יח׳", reportStats.revenueByProduct.BOX_50, reportStats.ordersCountByProduct.BOX_50, reportStats.unitsByProduct.BOX_50],
        ["70 יח׳", reportStats.revenueByProduct.BOX_70, reportStats.ordersCountByProduct.BOX_70, reportStats.unitsByProduct.BOX_70],
        [],
        ["סה״כ הכנסות", reportStats.totalRevenue],
        ["ממוצע להזמנה", Math.round(reportStats.avgRevenuePerOrder)],
      ];
      const ordersSorted = [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const orderNumMap: Record<string, number> = {};
      ordersSorted.forEach((o, i) => { orderNumMap[o.id] = i + 1; });
      const ordersRows = [
        ["מס׳", "מוצר", "כמות קופסאות", "סה״כ יחידות", "מחיר לקופסה", "סה״כ מחיר", "שם", "טלפון", "אימייל", "כתובת", "תאריך משלוח", "סטטוס"],
        ...ordersSorted.map((o) => [
          orderNumMap[o.id],
          o.unitsPerBox === 35 ? "35 יח׳" : o.unitsPerBox === 50 ? "50 יח׳" : "70 יח׳",
          o.boxCount,
          o.totalUnits,
          o.pricePerBox,
          o.totalPrice,
          o.customerName,
          o.customerPhone,
          o.customerEmail ?? "",
          o.deliveryAddress,
          o.deliveryDate,
          STATUS_LABELS_EXCEL[o.status],
        ]),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      const wsOrders = XLSX.utils.aoa_to_sheet(ordersRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "סיכום");
      XLSX.utils.book_append_sheet(wb, wsOrders, "הזמנות");
      const fileName = `דוח_אמא_במשרד_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (e) {
      setError("שגיאה בייצוא לאקסל");
    } finally {
      setExportingExcel(false);
    }
  };

  const activeOrders = orders
    .filter(dateFilter)
    .filter(productFilter)
    .filter((o) => {
      if (showStatus === "cancelled" || showStatus === "delivered") return false;
      if (showStatus === "all") return o.status !== "delivered" && o.status !== "cancelled";
      return o.status === showStatus;
    })
    .sort(sortFn);
  const historyOrders = orders
    .filter(dateFilter)
    .filter(productFilter)
    .filter((o) => o.status === "delivered")
    .sort(sortFn);
  const cancelledOrders = orders
    .filter(dateFilter)
    .filter(productFilter)
    .filter((o) => o.status === "cancelled")
    .sort(sortFn);

  const handleFileUpload = async (orderId: string, file: File, type: AttachmentType) => {
    if (!file || file.size === 0) return;
    setUploadingFor(orderId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch(`/api/orders/${orderId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) await fetchOrders();
      else setError("שגיאה בהעלאת קובץ");
    } catch {
      setError("שגיאה בהעלאת קובץ");
    } finally {
      setUploadingFor(null);
    }
  };

  const fileDownloadUrl = (orderId: string, storedAs: string) =>
    `/api/orders/${orderId}/files/${storedAs}`;

  const handleRemoveAttachment = async (orderId: string, storedAs: string) => {
    if (!window.confirm("להסיר את הקובץ מההזמנה?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/files/${storedAs}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchOrders();
      else setError("שגיאה בהסרת קובץ");
    } catch {
      setError("שגיאה בהסרת קובץ");
    }
  };

  const statusLabels: Record<Order["status"], string> = {
    new: "חדש",
    confirmed: "אושר",
    delivered: "נמסר",
    cancelled: "בוטל",
  };
  const statusColors: Record<Order["status"], string> = {
    new: "bg-[#ff4c4c] text-white",
    confirmed: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-gray-200 text-gray-700",
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.ok) {
      setAuthenticated(true);
      setLoading(true);
      setPassword("");
      fetchOrders();
    } else {
      setLoginError(data.error || "סיסמה שגויה");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setOrders([]);
  };

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-600">טוען...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-slate-700 text-center mb-2">כניסת מנהל</h1>
          <p className="text-gray-600 text-sm text-center mb-6">אמא במשרד</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="manager-password" className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה
              </label>
              <input
                id="manager-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
                placeholder="הזן סיסמה"
                autoFocus
              />
            </div>
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
            >
              התחבר
            </button>
          </form>
          <Link href="/" className="block text-center text-gray-500 hover:text-gray-700 text-sm mt-4">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  const { year, month } = calendarMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekDays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const toDateStr = (d: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prevMonth = () =>
    setCalendarMonth((m) =>
      m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }
    );
  const nextMonth = () =>
    setCalendarMonth((m) =>
      m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }
    );
  const monthTitle = new Date(year, month).toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

  const handleCalendarDayClick = (dateStr: string) => {
    if (!selectedRange) {
      setSelectedRange({ start: dateStr, end: dateStr });
      return;
    }
    const start = dateStr < selectedRange.start ? dateStr : selectedRange.start;
    const end = dateStr > selectedRange.end ? dateStr : selectedRange.end;
    setSelectedRange({ start, end });
  };

  const isInRange = (dateStr: string) =>
    selectedRange && dateStr >= selectedRange.start && dateStr <= selectedRange.end;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-600 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">אמא במשרד – ניהול הזמנות</h1>
              <p className="text-slate-200 text-base mt-0.5">לוח בקרה</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="text-slate-200 hover:text-white text-base"
              >
                יציאה
              </button>
              <Link
                href="/"
                className="text-slate-200 hover:text-white text-base"
              >
                חזרה לאתר
              </Link>
            </div>
          </div>
          {/* Status dashboard */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-500/50">
            <div className="flex items-center gap-2">
              <span className="text-slate-200 text-base">סטטוס:</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4c4c] text-white text-base font-medium">
                חדש <strong>{countByStatus.new}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-base font-medium">
                אושר <strong>{countByStatus.confirmed}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-base font-medium">
                נמסר <strong>{countByStatus.delivered}</strong>
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-base font-medium">
                בוטל <strong>{countByStatus.cancelled}</strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-5xl mx-auto px-4 py-6 gap-6">
        <main className="flex-1 min-w-0">
        {error && (
          <div className="bg-red-100 text-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Sort & filter */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-base font-medium text-gray-700">מיון לפי:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "name" | "location")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white text-gray-800"
            >
              <option value="date">תאריך (כרונולוגי)</option>
              <option value="name">שם (א״ב)</option>
              <option value="location">כתובת (א״ב)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-base font-medium text-gray-700">הצג לי:</label>
            <select
              value={showStatus}
              onChange={(e) =>
                setShowStatus(e.target.value as "all" | "new" | "confirmed" | "delivered" | "cancelled")
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white text-gray-800"
            >
              <option value="all">הכל</option>
              <option value="new">חדש</option>
              <option value="confirmed">אושר</option>
              <option value="delivered">נמסר</option>
              <option value="cancelled">בוטל</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-base font-medium text-gray-700">מוצר:</label>
            <select
              value={showProduct}
              onChange={(e) => setShowProduct(e.target.value as "all" | ProductType)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-base bg-white text-gray-800"
            >
              <option value="all">הכל</option>
              <option value="BOX_35">35 יח׳</option>
              <option value="BOX_50">50 יח׳</option>
              <option value="BOX_70">70 יח׳</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center py-10">טוען הזמנות...</p>
        ) : (
          <>
            {/* Active orders - new & confirmed only */}
            <section>
              <h2 className="text-lg font-semibold text-slate-700 mb-3">הזמנות פעילות</h2>
              {activeOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">
                  <p>אין הזמנות פעילות.</p>
                  <p className="text-sm mt-2">הזמנות חדשות ואושרו יופיעו כאן.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      orderNum={orderIdToNum[order.id]}
                      statusLabels={statusLabels}
                      statusColors={statusColors}
                      updateStatus={updateStatus}
                      fileDownloadUrl={fileDownloadUrl}
                      onFileUpload={handleFileUpload}
                      onRemoveAttachment={handleRemoveAttachment}
                      uploadingFor={uploadingFor}
                      onUpdatePrice={handleUpdatePrice}
                    />
                  ))}
                </ul>
              )}
            </section>

            {/* History - delivered orders */}
            <section className="mt-10">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-lg font-semibold text-slate-700 hover:text-slate-900"
              >
                {showHistory ? "▼ " : "▶ "}היסטוריה ({historyOrders.length})
              </button>
              {showHistory && historyOrders.length > 0 && (
                <ul className="space-y-4 mt-3">
                  {historyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      orderNum={orderIdToNum[order.id]}
                      statusLabels={statusLabels}
                      statusColors={statusColors}
                      updateStatus={updateStatus}
                      fileDownloadUrl={fileDownloadUrl}
                      onFileUpload={handleFileUpload}
                      onRemoveAttachment={handleRemoveAttachment}
                      uploadingFor={uploadingFor}
                      onUpdatePrice={handleUpdatePrice}
                    />
                  ))}
                </ul>
              )}
              {showHistory && historyOrders.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">אין הזמנות בהיסטוריה.</p>
              )}
            </section>

            {/* Cancelled orders */}
            <section className="mt-10">
              <button
                type="button"
                onClick={() => setShowCancelled(!showCancelled)}
                className="text-lg font-semibold text-slate-700 hover:text-slate-900"
              >
                {showCancelled ? "▼ " : "▶ "}הזמנות שבוטלו ({cancelledOrders.length})
              </button>
              {showCancelled && cancelledOrders.length > 0 && (
                <ul className="space-y-4 mt-3">
                  {cancelledOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      orderNum={orderIdToNum[order.id]}
                      statusLabels={statusLabels}
                      statusColors={statusColors}
                      updateStatus={updateStatus}
                      fileDownloadUrl={fileDownloadUrl}
                      onFileUpload={handleFileUpload}
                      onRemoveAttachment={handleRemoveAttachment}
                      uploadingFor={uploadingFor}
                      onUpdatePrice={handleUpdatePrice}
                      onDelete={handleDeleteOrder}
                    />
                  ))}
                </ul>
              )}
              {showCancelled && cancelledOrders.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">אין הזמנות שבוטלו.</p>
              )}
            </section>

            {/* Reports */}
            <section className="mt-10">
              <button
                type="button"
                onClick={() => setShowReports(!showReports)}
                className="text-lg font-semibold text-slate-700 hover:text-slate-900"
              >
                {showReports ? "▼ " : "▶ "}דוחות
              </button>
              {showReports && (
                <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <h3 className="text-base font-semibold text-slate-700">הכנסות לפי מוצר</h3>
                  <div className="grid gap-2 text-sm">
                    <p><strong>35 יח׳:</strong> ₪{reportStats.revenueByProduct.BOX_35} ({reportStats.ordersCountByProduct.BOX_35} הזמנות)</p>
                    <p><strong>50 יח׳:</strong> ₪{reportStats.revenueByProduct.BOX_50} ({reportStats.ordersCountByProduct.BOX_50} הזמנות)</p>
                    <p><strong>70 יח׳:</strong> ₪{reportStats.revenueByProduct.BOX_70} ({reportStats.ordersCountByProduct.BOX_70} הזמנות)</p>
                  </div>
                  <h3 className="text-base font-semibold text-slate-700">סה״כ יחידות לפי מוצר</h3>
                  <div className="grid gap-2 text-sm">
                    <p><strong>35 יח׳:</strong> {reportStats.unitsByProduct.BOX_35} יחידות</p>
                    <p><strong>50 יח׳:</strong> {reportStats.unitsByProduct.BOX_50} יחידות</p>
                    <p><strong>70 יח׳:</strong> {reportStats.unitsByProduct.BOX_70} יחידות</p>
                  </div>
                  <p className="text-base font-medium text-slate-700">
                    סה״כ הכנסות: ₪{reportStats.totalRevenue} • ממוצע להזמנה: ₪{reportStats.avgRevenuePerOrder.toFixed(0)}
                  </p>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={exportingExcel}
                    className="mt-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm"
                  >
                    {exportingExcel ? "מייצא..." : "ייצוא לאקסל"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}
        </main>

        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <h2 className="text-base font-semibold text-slate-700 mb-2">לוח שנה – הזמנות לפי תאריך משלוח</h2>
            <p className="text-xs text-slate-500 mb-2">לחיצה על יום: בחירת טווח (יום אחד או מספר ימים).</p>
            {selectedRange && (
              <button
                type="button"
                onClick={() => setSelectedRange(null)}
                className="text-sm text-slate-600 hover:text-slate-800 underline mb-3"
              >
                הצג הכל
              </button>
            )}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                aria-label="חודש קודם"
              >
                ‹
              </button>
              <span className="text-sm font-medium text-slate-700">{monthTitle}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                aria-label="חודש הבא"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-slate-500 mb-1">
              {weekDays.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((d, i) => {
                if (d === null) return <div key={`e-${i}`} />;
                const dateStr = toDateStr(d);
                const hasOrders = datesWithOrders.has(dateStr);
                const inRange = isInRange(dateStr);
                const isRangeStart = selectedRange && dateStr === selectedRange.start;
                const isRangeEnd = selectedRange && dateStr === selectedRange.end;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleCalendarDayClick(dateStr)}
                    className={`
                      py-1.5 rounded text-sm
                      ${inRange ? "bg-slate-600 text-white font-medium" : "hover:bg-slate-100 text-slate-800"}
                      ${hasOrders && !inRange ? "ring-1 ring-slate-300" : ""}
                      ${(isRangeStart || isRangeEnd) && inRange ? "ring-2 ring-white ring-offset-1 ring-offset-slate-600" : ""}
                    `}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            {selectedRange && (
              <p className="text-xs text-slate-500 mt-3">
                {selectedRange.start === selectedRange.end
                  ? `מוצגות הזמנות לתאריך ${new Date(selectedRange.start + "T12:00:00").toLocaleDateString("he-IL")}`
                  : `מוצגות הזמנות מתאריך ${new Date(selectedRange.start + "T12:00:00").toLocaleDateString("he-IL")} עד ${new Date(selectedRange.end + "T12:00:00").toLocaleDateString("he-IL")}`}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
