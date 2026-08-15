import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Wrench, Users, DollarSign,
  Plus, Trash2, X, Search, Lock, Unlock, AlertTriangle, CheckCircle2,
  Clock, ArrowUpCircle, ArrowDownCircle, Smartphone, Receipt, ChevronRight,
  Minus, Save, TrendingUp, TrendingDown, FileText, Phone, User, Edit2,
} from "lucide-react";
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  collection, getDocs, doc, getDoc, setDoc, writeBatch,
} from "firebase/firestore";
/* ============================================================
   DESIGN TOKENS
   Paleta "device tech": grafite quase-preto + âmbar (LED status)
   + azul elétrico (destaque secundário). Mono para números/códigos.
   ============================================================ */
const STYLES = `
  :root {
    --bg: #0E1013;
    --surface: #16191F;
    --surface-2: #1E2229;
    --surface-3: #262B33;
    --border: #2A2F38;
    --border-soft: #20242C;
    --text: #ECEEF1;
    --text-dim: #9BA1AC;
    --text-faint: #5C6470;
    --amber: #FFB020;
    --amber-dim: #7A5A1E;
    --blue: #4C8DFF;
    --green: #34C77B;
    --red: #FF5C5C;
    --font-display: 'Space Grotesk', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
    html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  height: 100%;
}
  * { box-sizing: border-box; }
  .app-root {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    font-size: 14px;
  }
  ::selection { background: var(--amber); color: #17140B; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 4px; }

  /* ---------- Sidebar ---------- */
  .sidebar {
    width: 232px;
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border-soft);
    display: flex;
    flex-direction: column;
    padding: 20px 12px;
    position: relative;
    transition: width .15s ease;
  }
  .sidebar.collapsed {
    width: 68px;
    padding: 20px 10px;
  }
  .sidebar.collapsed .nav-item {
    justify-content: center;
    padding: 10px;
  }
  .sidebar-collapse-btn {
    position: absolute;
    top: 24px;
    right: -12px;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--surface-3);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text-dim);
    z-index: 10;
  }
  .sidebar-collapse-btn:hover { background: #2E343E; color: var(--text); }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px 22px 10px;
  }
  .brand-mark {
    width: 34px; height: 34px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--amber), #B87616);
    display: flex; align-items: center; justify-content: center;
    color: #17140B;
    flex-shrink: 0;
  }
  .brand-name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 15px;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .brand-sub {
    font-size: 10.5px;
    color: var(--text-faint);
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .nav-group { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 12px;
    border-radius: 7px;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 500;
    border: 1px solid transparent;
    transition: background .12s, color .12s;
    user-select: none;
  }
  .nav-item:hover { background: var(--surface-2); color: var(--text); }
  .nav-item.active {
    background: var(--surface-2);
    color: var(--amber);
    border-color: var(--border);
  }
  .nav-item svg { flex-shrink: 0; }
  .sidebar-footer {
    margin-top: auto;
    padding: 12px 10px 4px 10px;
    border-top: 1px solid var(--border-soft);
    display: flex; align-items: center; gap: 8px;
  }
  .led {
    width: 7px; height: 7px; border-radius: 50%;
    box-shadow: 0 0 6px 1px currentColor;
    flex-shrink: 0;
  }
  .led.on { background: var(--green); color: var(--green); }
  .led.off { background: var(--text-faint); color: var(--text-faint); box-shadow: none; }
  .led.warn { background: var(--amber); color: var(--amber); }
  .led.alert { background: var(--red); color: var(--red); }

  /* ---------- Main ---------- */
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .topbar {
    height: 60px;
    border-bottom: 1px solid var(--border-soft);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px;
    flex-shrink: 0;
  }
  .topbar h1 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0;
  }
  .topbar-sub { font-size: 12px; color: var(--text-faint); margin-top: 2px; }
  .content { padding: 26px 28px 60px 28px; overflow-y: auto; flex: 1; }

  /* ---------- Generic ---------- */
  .grid { display: grid; gap: 16px; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 14px 16px;
  }
  .card-title {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 14px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .stat-card { display: flex; flex-direction: column; gap: 6px; }
  .stat-label { font-size: 12px; color: var(--text-faint); font-weight: 500; }
  .stat-value {
    font-family: var(--font-mono);
    font-size: 26px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .stat-value.amber { color: var(--amber); }
  .stat-value.blue { color: var(--blue); }
  .stat-value.green { color: var(--green); }
  .stat-value.red { color: var(--red); }
  .stat-foot { font-size: 11.5px; color: var(--text-faint); display: flex; align-items: center; gap: 5px; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 9px 15px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    border: 1px solid transparent;
    transition: filter .12s, background .12s;
    white-space: nowrap;
  }
  .btn:active { filter: brightness(0.9); }
  .btn-primary { background: var(--amber); color: #1A1406; }
  .btn-primary:hover { filter: brightness(1.08); }
  .btn-secondary { background: var(--surface-3); color: var(--text); border-color: var(--border); }
  .btn-secondary:hover { background: #2E343E; }
  .btn-danger { background: rgba(255,92,92,0.12); color: var(--red); border-color: rgba(255,92,92,0.25); }
  .btn-danger:hover { background: rgba(255,92,92,0.2); }
  .btn-ghost { background: transparent; color: var(--text-dim); }
  .btn-ghost:hover { background: var(--surface-2); color: var(--text); }
  .btn-sm { padding: 6px 10px; font-size: 12px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .input, select.input, textarea.input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 9px 11px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    outline: none;
  }
  .input::placeholder { color: var(--text-faint); }
  .input:focus { border-color: var(--amber); }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 12px; color: var(--text-dim); font-weight: 500; }
  .field-row { display: grid; gap: 12px; }

  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--text-faint); font-weight: 600; padding: 8px 12px; border-bottom: 1px solid var(--border-soft);
  }
  td { padding: 11px 12px; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface-2); }
  .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 100px;
    font-size: 11px; font-weight: 600;
    font-family: var(--font-mono);
    text-transform: uppercase; letter-spacing: 0.03em;
  }
  .badge.amber { background: rgba(255,176,32,0.12); color: var(--amber); }
  .badge.blue { background: rgba(76,141,255,0.12); color: var(--blue); }
  .badge.green { background: rgba(52,199,123,0.12); color: var(--green); }
  .badge.red { background: rgba(255,92,92,0.12); color: var(--red); }
  .badge.gray { background: var(--surface-3); color: var(--text-dim); }

  .empty-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 50px 20px; color: var(--text-faint); gap: 10px; text-align: center;
  }
  .empty-state svg { opacity: 0.4; }
  .empty-state .t { font-size: 13.5px; color: var(--text-dim); font-weight: 500; }
  .empty-state .s { font-size: 12px; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(6,7,9,0.7);
    display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; width: 100%; max-width: 480px;
    max-height: 88vh; display: flex; flex-direction: column;
  }
  .modal.wide { max-width: 660px; }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid var(--border-soft); flex-shrink: 0;
  }
  .modal-header h3 { margin: 0; font-family: var(--font-display); font-size: 16px; font-weight: 600; }
  .modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
  .modal-footer {
    padding: 16px 20px; border-top: 1px solid var(--border-soft);
    display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
  }

  .search-box { position: relative; }
  .search-box svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-faint); }
  .search-box input { padding-left: 34px; }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .toolbar-left { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 220px; }

  .checklist-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; background: var(--surface-2); border-radius: 8px; border: 1px solid var(--border-soft);
  }
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 100;
    background: var(--surface-3); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 18px; display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }
  .cart-line { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-soft); }
  .qty-btn { width: 22px; height: 22px; border-radius: 5px; background: var(--surface-3); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); }
  .qty-btn:hover { background: #2E343E; }
  .tab-pills { display: flex; gap: 6px; background: var(--surface-2); padding: 4px; border-radius: 9px; width: fit-content; }
  .tab-pill { padding: 6px 13px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; color: var(--text-dim); }
  .tab-pill.active { background: var(--surface-3); color: var(--amber); }

 @media (max-width: 768px) {
    .app-root { flex-direction: column; }

    .sidebar {
      width: 100% !important;
      height: auto;
      flex-direction: row;
      align-items: center;
      padding: 10px 14px;
      overflow-x: auto;
      border-right: none;
      border-bottom: 1px solid var(--border-soft);
    }
    .sidebar.collapsed { width: 100% !important; }
    .sidebar-collapse-btn { display: none; }
    .brand { padding: 0; margin-right: 10px; flex-shrink: 0; }
    .nav-group { flex-direction: row; margin-top: 0; gap: 4px; overflow-x: auto; }
    .nav-item { flex-shrink: 0; padding: 8px 10px; font-size: 12.5px; white-space: nowrap; }
    .sidebar.collapsed .nav-item { justify-content: flex-start; padding: 8px 10px; }
    .sidebar.collapsed .nav-item span,
    .nav-item span { display: inline; }
    .sidebar-footer { display: none; }

    .topbar { padding: 0 14px; height: auto; flex-wrap: wrap; gap: 8px; padding-top: 12px; padding-bottom: 12px; }
    .topbar h1 { font-size: 16px; }
    .content { padding: 16px 14px 40px 14px; }

    .grid[style*="repeat(2"],
    .grid[style*="repeat(3"],
    .grid[style*="repeat(4"],
    .grid[style*="repeat(5"] {
      grid-template-columns: 1fr !important;
    }
    .grid[style*="1.4fr 1fr"],
    .grid[style*="1fr 1fr"],
    .grid[style*="1fr 1.3fr"],
    .grid[style*="1fr 1.6fr"] {
      grid-template-columns: 1fr !important;
    }

    .card { padding: 12px 14px; }
    table { display: block; overflow-x: auto; white-space: nowrap; }
    .modal, .modal.wide { max-width: 96vw; margin: 0 8px; }
    .toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
    .toolbar-left { flex-direction: column; align-items: stretch; }
    .toast { left: 12px; right: 12px; bottom: 12px; }
  }

  @media print {
`;

/* ============================================================
   HELPERS
   ============================================================ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const genOSCode = (existingOrders) => {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (existingOrders.some((o) => o.osCode === code));
  return code;
};
const brl = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const now = () => new Date().toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleDateString("pt-BR");
const fmtDateTime = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const isToday = (iso) => {
  const d = new Date(iso), t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};
const isThisMonth = (iso) => {
  const d = new Date(iso), t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
};
const MONTH_NAME = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

const PAYMENT_LABELS = { dinheiro: "Dinheiro", pix: "Pix", credito: "Cartão Crédito", debito: "Cartão Débito" };
const OS_STATUS = {
  aguardando_peca: { label: "Aguardando peça", color: "amber" },
  em_reparo: { label: "Em reparo", color: "blue" },
  pronto: { label: "Pronto p/ retirada", color: "gray" },
  entregue: { label: "Entregue", color: "green" },
};
const CHECKLIST_ITEMS = [
  { key: "tela", label: "Tela / display" },
  { key: "touch", label: "Touch / digitalizador" },
  { key: "bateria", label: "Bateria" },
  { key: "carcaca", label: "Carcaça / estrutura" },
  { key: "liga", label: "Liga normalmente" },
  { key: "cameras", label: "Câmeras" },
];

/* ============================================================
   STORAGE HOOK
   ============================================================ */
const FIRESTORE_COLLECTIONS = ["products", "customers", "serviceOrders", "cashRegisters", "sales", "financeEntries", "suppliers"];

function useStore() {
  const [data, setData] = useState({
    products: [], customers: [], serviceOrders: [], cashRegisters: [], sales: [], financeEntries: [], suppliers: [],
    storeConfig: { name: "Davi Celulares" },
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const result = {};
      for (const name of FIRESTORE_COLLECTIONS) {
        try {
          const snaps = await getDocs(collection(db, name));
          result[name] = snaps.docs.map((d) => d.data());
        } catch (e) {
          console.error("Erro ao carregar", name, e);
          result[name] = [];
        }
      }
      try {
        const snap = await getDoc(doc(db, "config", "storeConfig"));
        result.storeConfig = snap.exists() ? snap.data().value : { name: "Davi Celulares" };
      } catch (e) {
        result.storeConfig = { name: "Davi Celulares" };
      }
      setData((d) => ({ ...d, ...result }));
      setLoaded(true);
    })();
  }, []);

  const persistCollection = useCallback(async (name, oldArr, newArr) => {
    const oldMap = new Map((oldArr || []).map((i) => [i.id, i]));
    const newMap = new Map((newArr || []).map((i) => [i.id, i]));
    const batch = writeBatch(db);
    let hasOps = false;
    for (const [id, item] of newMap) {
      const old = oldMap.get(id);
      if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
        batch.set(doc(db, name, id), item);
        hasOps = true;
      }
    }
    for (const [id] of oldMap) {
      if (!newMap.has(id)) {
        batch.delete(doc(db, name, id));
        hasOps = true;
      }
    }
    if (hasOps) await batch.commit();
  }, []);

  const update = useCallback((key, updater) => {
    setData((prev) => {
      const oldVal = prev[key];
      const nextVal = typeof updater === "function" ? updater(oldVal) : updater;
      setSaving(true);
      (async () => {
        try {
          if (FIRESTORE_COLLECTIONS.includes(key)) {
            await persistCollection(key, oldVal, nextVal);
          } else {
            await setDoc(doc(db, "config", key), { value: nextVal });
          }
        } catch (e) {
          console.error("Erro ao salvar", key, e);
        }
        setSaving(false);
      })();
      return { ...prev, [key]: nextVal };
    });
  }, [persistCollection]);

  return { data, update, loaded, saving };
}

/* ============================================================
   SHARED UI PIECES
   ============================================================ */
function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (wide ? " wide" : "")}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div className="empty-state">
      {icon}
      <div className="t">{title}</div>
      {sub && <div className="s">{sub}</div>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <CheckCircle2 size={16} color="var(--green)" />
      {message}
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ data, setView }) {
  const [printOpen, setPrintOpen] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);

  const refDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);

  const isRefDay = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth() && d.getDate() === refDate.getDate();
  };

  const dayLabel = dayOffset === 0 ? "Hoje" : refDate.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

  const openCash = data.cashRegisters.find((c) => c.status === "aberto");
  const todaySales = data.sales.filter((s) => isRefDay(s.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayOSRevenue = todaySales.reduce((sum, s) => sum + s.items.filter((i) => i.productId.startsWith("os-")).reduce((s2, i) => s2 + i.lineTotal, 0), 0);
  const todayProductRevenue = todayTotal - todayOSRevenue;
  const todayExpenses = data.financeEntries.filter((f) => f.type === "pagar" && f.status === "pago" && f.paidAt && isRefDay(f.paidAt));
  const todayExpensesTotal = todayExpenses.reduce((sum, f) => sum + f.amount, 0);
  const valorLiquido = todayTotal - todayExpensesTotal;
  const todayReceipts = data.financeEntries.filter((f) => f.type === "receber" && f.status === "pago" && f.paidAt && isRefDay(f.paidAt));
  const todayOS = data.serviceOrders.filter((o) => o.status === "entregue" && isRefDay(o.updatedAt)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const byPaymentToday = { pix: 0, credito: 0, debito: 0, dinheiro: 0 };
  todaySales.forEach((s) => { byPaymentToday[s.paymentMethod] = (byPaymentToday[s.paymentMethod] || 0) + s.total; });

  const PAYMENT_CARDS = [
    { key: "pix", label: "Pix", color: "rice" },
    { key: "credito", label: "Cartão de crédito", color: "rice" },
    { key: "debito", label: "Cartão de débito", color: "rice" },
    { key: "dinheiro", label: "Dinheiro", color: "rice" },
  ];

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setDayOffset((d) => d - 1)}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, textTransform: "capitalize", minWidth: 140, textAlign: "center" }}>
            {dayLabel}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setDayOffset((d) => d + 1)} disabled={dayOffset >= 0}>
            <ChevronRight size={14} />
          </button>
          {dayOffset !== 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setDayOffset(0)}>Voltar para hoje</button>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 14 }}>
        <div className="card stat-card">
          <div className="stat-label">Vendas</div>
          <div className="stat-value green">{brl(todayProductRevenue)}</div>
          <div className="stat-foot"><Receipt size={12} /> {todaySales.length} venda{todaySales.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Status do caixa</div>
          <div className="stat-value" style={{ color: openCash ? "var(--green)" : "var(--text-faint)" }}>
            {openCash ? "Aberto" : "Fechado"}
          </div>
          <div className="stat-foot">{openCash ? `desde ${fmtDateTime(openCash.openedAt)}` : "nenhum caixa aberto"}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Faturamento em OS</div>
          <div className="stat-value blue">{brl(todayOSRevenue)}</div>
          <div className="stat-foot"><Wrench size={12} /> OS pagas hoje no PDV</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Gastos</div>
          <div className="stat-value red">{brl(todayExpensesTotal)}</div>
          <div className="stat-foot"><TrendingDown size={12} /> {todayExpenses.length} pagamento{todayExpenses.length !== 1 ? "s" : ""} realizado{todayExpenses.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="card stat-card">
          <div className="stat-label">Valor líquido do dia</div>
          <div className="stat-value" style={{ color: valorLiquido >= 0 ? "var(--green)" : "var(--red)" }}>{brl(valorLiquido)}</div>
          <div className="stat-foot">vendas + OS − gastos</div>
        </div>
      </div>
      

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        {PAYMENT_CARDS.map((p) => (
          <div className="card stat-card" key={p.key}>
            <div className="stat-label">{p.label}</div>
            <div className={"stat-value " + p.color}>{brl(byPaymentToday[p.key])}</div>
            <div className="stat-foot">
              <Receipt size={12} /> {todaySales.filter((s) => s.paymentMethod === p.key).length} venda{todaySales.filter((s) => s.paymentMethod === p.key).length !== 1 ? "s" : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">
          Últimas vendas
          <span className="btn btn-ghost btn-sm" onClick={() => setView("vendas")}>Ir para PDV <ChevronRight size={13} /></span>
        </div>
        {todaySales.length === 0 ? (
          <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda registrada hoje" />
        ) : (
          <table>
            <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Pagamento</th><th>Cliente</th></tr></thead>
            <tbody>
              {todaySales.map((s) => (
                <React.Fragment key={s.id}>
                  {s.items.map((i, idx) => (
                    <tr key={s.id + "-" + i.productId}>
                      <td>{i.name}</td>
                      <td className="mono">{i.qty}</td>
                      <td className="mono">{brl(i.lineTotal != null ? i.lineTotal : i.price * i.qty)}</td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={s.items.length}><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                          <td rowSpan={s.items.length}>{s.customerName || "—"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Ordens de serviço do dia</div>
        {todayOS.length === 0 ? (
          <EmptyState icon={<Wrench size={26} />} title="Nenhuma OS aberta hoje" />
        ) : (
          <table>
            <thead><tr><th>Código</th><th>Aparelho</th><th>Cliente</th><th>Status</th><th style={{ textAlign: "right" }}>Orçamento</th></tr></thead>
            <tbody>
              {todayOS.map((o) => (
                <tr key={o.id}>
                  <td className="mono" style={{ color: "var(--amber)", fontWeight: 700 }}>{o.osCode}</td>
                  <td>{o.brand ? `${o.brand} — ${o.device}` : o.device}</td>
                  <td>{data.customers.find((c) => c.id === o.customerId)?.name || "—"}</td>
                  <td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(o.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <button className="btn btn-primary" onClick={() => setPrintOpen(true)}><FileText size={15} /> Imprimir relatório do dia</button>
      </div>

      {printOpen && (
        <DayReportModal
          data={data} onClose={() => setPrintOpen(false)}
          todaySales={todaySales} todayProductRevenue={todayProductRevenue} todayOSRevenue={todayOSRevenue}
          todayExpenses={todayExpenses} todayExpensesTotal={todayExpensesTotal}
          todayReceipts={todayReceipts} todayOS={todayOS} openCash={openCash} valorLiquido={valorLiquido}
        />
      )}
    </div>
  );
}

function DayReportModal({ data, onClose, todaySales, todayProductRevenue, todayOSRevenue, todayExpenses, todayExpensesTotal, todayReceipts, todayOS, openCash, valorLiquido }) {
  const todayReceiptsTotal = todayReceipts.reduce((s, f) => s + f.amount, 0);
  const byPayment = {};
  todaySales.forEach((s) => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total; });

  return (
    <Modal title="Relatório do dia" onClose={onClose} wide
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={() => window.print()}><FileText size={14} /> Imprimir</button>
      </>}>
      <div className="printable-report">
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{data.storeConfig.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Relatório do dia — {new Date().toLocaleDateString("pt-BR")}</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Vendas</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--amber)" }}>{brl(todayProductRevenue)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Status do caixa</div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: openCash ? "var(--green)" : "var(--text-faint)" }}>{openCash ? "Aberto" : "Fechado"}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Faturamento em OS</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--blue)" }}>{brl(todayOSRevenue)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Total gasto</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--red)" }}>{brl(todayExpensesTotal)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Valor líquido</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: valorLiquido >= 0 ? "var(--green)" : "var(--red)" }}>{brl(valorLiquido)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Vendas do dia ({todaySales.length})</div>
        {todaySales.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda registrada.</div> : (
          <table>
            <thead><tr><th>Hora</th><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Pagamento</th><th>Cliente</th></tr></thead>
            <tbody>
              {todaySales.flatMap((s) => s.items.map((i, idx) => (
                <tr key={s.id + i.productId}>
                  {idx === 0 && <td rowSpan={s.items.length}>{fmtDateTime(s.createdAt).split(" ")[1]}</td>}
                  <td>{i.name}</td>
                  <td className="mono">{i.qty}</td>
                  <td className="mono">{brl(i.lineTotal != null ? i.lineTotal : i.price * i.qty)}</td>
                  {idx === 0 && <td rowSpan={s.items.length}><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>}
                  {idx === 0 && <td rowSpan={s.items.length}>{data.customers.find((c) => c.id === s.customerId)?.name || "—"}</td>}
                </tr>
              )))}
            </tbody>
          </table>
        )}
        {Object.keys(byPayment).length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
            {Object.entries(byPayment).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>{PAYMENT_LABELS[k]}</span>
                <span className="mono">{brl(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Gastos pagos hoje ({todayExpenses.length})</div>
        {todayExpenses.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum pagamento registrado hoje.</div> : (
          <table>
            <tbody>
              {todayExpenses.map((f) => (
                <tr key={f.id}>
                  <td>{f.description}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {todayReceipts.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Recebimentos confirmados hoje ({todayReceipts.length})</div>
          <table>
            <tbody>
              {todayReceipts.map((f) => (
                <tr key={f.id}>
                  <td>{f.description}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--green)" }}>{brl(f.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Ordens de serviço entregues hoje ({todayOS.length})</div>
        {todayOS.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma OS entregue hoje.</div> : (
          <table>
            <thead><tr><th>Código</th><th>Aparelho</th><th>Cliente</th><th>Status</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
            <tbody>
              {todayOS.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.osCode}</td>
                  <td>{o.brand ? `${o.brand} — ${o.device}` : o.device}</td>
                  <td>{data.customers.find((c) => c.id === o.customerId)?.name || "—"}</td>
                  <td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(o.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   VENDAS / PDV
   ============================================================ */
function VendasPDV({ data, update, notify, storeName }) {
  const openCash = data.cashRegisters.find((c) => c.status === "aberto");
  const [openAmount, setOpenAmount] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("dinheiro");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [extraDiscount, setExtraDiscount] = useState("");
  const [extraSurcharge, setExtraSurcharge] = useState("");
  const [installments, setInstallments] = useState(1);
  const [movModal, setMovModal] = useState(null); // 'sangria' | 'reforco'
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");
  const [closeReport, setCloseReport] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(null);
  const [receiptSale, setReceiptSale] = useState(null);
  const [lastSales, setLastSales] = useState([]);
  const [deleteSaleId, setDeleteSaleId] = useState(null);

  const recentSales = useMemo(
    () => [...data.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    [data.sales]
  );

  const handleDeleteSale = (saleId) => {
    const sale = data.sales.find((s) => s.id === saleId);
    if (!sale) return;
    update("products", (arr) => arr.map((p) => {
      const item = sale.items.find((i) => i.productId === p.id);
      return item ? { ...p, qty: p.qty + item.qty } : p;
    }));
    update("sales", (arr) => arr.filter((s) => s.id !== saleId));
    setDeleteSaleId(null);
    notify("Venda excluída e estoque restaurado");
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return data.products.filter((p) => p.qty > 0 && (p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q))).slice(0, 6);
  }, [search, data.products]);

  const matchedOS = useMemo(() => {
    const q = search.trim();
    if (!/^\d{4}$/.test(q)) return null;
    return data.serviceOrders.find((o) => o.osCode === q && o.status !== "entregue") || null;
  }, [search, data.serviceOrders]);

  const addToCart = (product) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.qty) return c;
        return c.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...c, { productId: product.id, name: product.name, price: product.price, qty: 1, maxQty: product.qty, discountPct: 0 }];
    });
    setSearch("");
  };

  const addOSToCart = (os) => {
    setCart((c) => {
      if (c.some((i) => i.osId === os.id)) return c;
      return [...c, { productId: "os-" + os.id, name: `OS #${os.osCode} — ${os.brand ? os.brand + " " : ""}${os.device}`, price: os.budget, qty: 1, maxQty: 1, discountPct: 0, osId: os.id }];
    });
    setSearch("");
  };

  const changeQty = (productId, delta) => {
    setCart((c) => c.map((i) => {
      if (i.productId !== productId) return i;
      const nq = Math.max(1, Math.min(i.maxQty, i.qty + delta));
      return { ...i, qty: nq };
    }));
  };

  const changeDiscount = (productId, value) => {
    let pct = parseFloat(String(value).replace(",", ".")) || 0;
    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, discountPct: pct } : i)));
  };

  const lineValues = (i) => {
    const subtotal = i.price * i.qty;
    const discountValue = subtotal * ((i.discountPct || 0) / 100);
    return { subtotal, discountValue, total: subtotal - discountValue };
  };

  const removeFromCart = (productId) => setCart((c) => c.filter((i) => i.productId !== productId));
  const cartTotal = cart.reduce((sum, i) => sum + lineValues(i).total, 0);
  const cartDiscountTotal = cart.reduce((sum, i) => sum + lineValues(i).discountValue, 0);

  const extraDiscountPct = parseFloat(String(extraDiscount).replace(",", ".")) || 0;
  const extraSurchargePct = parseFloat(String(extraSurcharge).replace(",", ".")) || 0;
  const extraDiscountValue = cartTotal * (extraDiscountPct / 100);
  const extraSurchargeValue = cartTotal * (extraSurchargePct / 100);
  const finalTotal = Math.max(0, cartTotal - extraDiscountValue + extraSurchargeValue);
  const cashReceivedValue = parseFloat(String(cashReceived).replace(",", ".")) || 0;
  const trocoValue = payment === "dinheiro" ? Math.max(0, cashReceivedValue - finalTotal) : 0;

  const handleOpenCash = () => {
    const amount = parseFloat(openAmount.replace(",", ".")) || 0;
    const reg = { id: uid(), openedAt: now(), closedAt: null, openingAmount: amount, status: "aberto", withdrawals: [], reinforcements: [] };
    update("cashRegisters", (arr) => [...arr, reg]);
    setOpenAmount("");
    notify("Caixa aberto com sucesso");
  };

  const finalizeSale = () => {
    if (!cart.length || !openCash) return;
    if (payment === "dinheiro" && cashReceivedValue < finalTotal) return;
    const sale = {
      id: uid(), cashRegisterId: openCash.id,
      items: cart.map((i) => {
        const v = lineValues(i);
        return { productId: i.productId, name: i.name, qty: i.qty, price: i.price, discountPct: i.discountPct || 0, discountValue: v.discountValue, lineTotal: v.total };
      }),
      total: finalTotal,
      discountTotal: cartDiscountTotal,
      extraDiscount: extraDiscountValue,
      extraSurcharge: extraSurchargeValue,
      paymentMethod: payment,
      installments: payment === "credito" ? installments : null,
      cashReceived: payment === "dinheiro" ? cashReceivedValue : null,
      troco: payment === "dinheiro" ? trocoValue : null,
      customerId: customerId || null,
      customerName: customerName.trim() || null,
      createdAt: now(),
    };
    update("sales", (arr) => [...arr, sale]);
    update("products", (arr) => arr.map((p) => {
      const item = cart.find((i) => i.productId === p.id);
      return item ? { ...p, qty: p.qty - item.qty } : p;
    }));
    const osIds = cart.filter((i) => i.osId).map((i) => i.osId);
    if (osIds.length) {
      update("serviceOrders", (arr) => arr.map((o) => (osIds.includes(o.id) ? { ...o, status: "entregue", updatedAt: now() } : o)));
    }
    setCart([]); setCustomerName(""); setPayment("dinheiro");
    setCashReceived(""); setExtraDiscount(""); setExtraSurcharge(""); setInstallments(1);
    notify("Venda registrada: " + brl(finalTotal));
    setReceiptSale(sale);
  };
  const addMovement = () => {
    const amount = parseFloat(movAmount.replace(",", ".")) || 0;
    if (!amount || !openCash) return;
    const field = movModal === "sangria" ? "withdrawals" : "reinforcements";
    update("cashRegisters", (arr) => arr.map((c) => c.id === openCash.id
      ? { ...c, [field]: [...c[field], { id: uid(), amount, reason: movReason, at: now() }] }
      : c));
    setMovModal(null); setMovAmount(""); setMovReason("");
    notify(movModal === "sangria" ? "Sangria registrada" : "Reforço registrado");
  };

  const buildReport = (reg) => {
    const salesOfReg = data.sales.filter((s) => s.cashRegisterId === reg.id);
    const byPayment = {};
    salesOfReg.forEach((s) => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total; });
    const totalWithdrawals = reg.withdrawals.reduce((s, w) => s + w.amount, 0);
    const totalReinforcements = reg.reinforcements.reduce((s, w) => s + w.amount, 0);
    const totalSales = salesOfReg.reduce((s, v) => s + v.total, 0);
    const cashSales = byPayment["dinheiro"] || 0;
    const expected = reg.openingAmount + cashSales + totalReinforcements - totalWithdrawals;
    return { salesOfReg, byPayment, totalWithdrawals, totalReinforcements, totalSales, expected, ticketMedio: salesOfReg.length ? totalSales / salesOfReg.length : 0 };
  };

  const handleCloseCash = () => {
    const report = buildReport(openCash);
    update("cashRegisters", (arr) => arr.map((c) => c.id === openCash.id ? { ...c, status: "fechado", closedAt: now() } : c));
    setCloseReport({ reg: { ...openCash, closedAt: now() }, report });
    notify("Caixa fechado — relatório gerado");
  };

  const closedRegisters = data.cashRegisters.filter((c) => c.status === "fechado").sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  if (!openCash) {
    return (
      <div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="card">
            <div className="card-title">Abrir caixa</div>
            <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0, marginBottom: 16 }}>
              Informe o valor inicial (fundo de troco) para começar a registrar vendas.
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <Field label="Valor de abertura (R$)">
                <input className="input" placeholder="0,00" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} />
              </Field>
              <button className="btn btn-primary" onClick={handleOpenCash}><Unlock size={15} /> Abrir caixa</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Histórico de caixas</div>
            {closedRegisters.length === 0 ? (
              <EmptyState icon={<Lock size={26} />} title="Nenhum caixa fechado ainda" />
            ) : (
              <table>
                <thead><tr><th>Fechado em</th><th>Vendas</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
                <tbody>
                  {closedRegisters.slice(0, 6).map((c) => {
                    const r = buildReport(c);
                    return (
                      <tr key={c.id}>
                        <td>{fmtDateTime(c.closedAt)}</td>
                        <td className="mono">{r.salesOfReg.length}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{brl(r.totalSales)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setHistoryOpen({ reg: c, report: r })}>Ver relatório</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Últimas compras</div>
          {recentSales.length === 0 ? (
            <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda registrada ainda" />
          ) : (
            <table>
              <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(s.createdAt)}</td>
                    <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                    <td>{data.customers.find((c) => c.id === s.customerId)?.name || "—"}</td>
                    <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteSaleId(s.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {historyOpen && <CashReportModal data={historyOpen} customers={data.customers} onClose={() => setHistoryOpen(null)} />}
        {deleteSaleId && (
          <Modal title="Excluir venda" onClose={() => setDeleteSaleId(null)}
            footer={<>
              <button className="btn btn-secondary" onClick={() => setDeleteSaleId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDeleteSale(deleteSaleId)}>Excluir</button>
            </>}>
            <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Essa venda será removida do histórico e os produtos voltarão para o estoque. Essa ação não pode ser desfeita.</p>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="badge green"><span className="led on" /> Caixa aberto — {fmtDateTime(openCash.openedAt)}</span>
          <span className="badge gray">Abertura: {brl(openCash.openingAmount)}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setMovModal("reforco")}><ArrowUpCircle size={14} /> Reforço</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setMovModal("sangria")}><ArrowDownCircle size={14} /> Sangria</button>
          <button className="btn btn-danger btn-sm" onClick={handleCloseCash}><Lock size={14} /> Fechar caixa</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <div className="card-title">Buscar produto</div>
          <div className="search-box">
            <Search size={15} />
            <input className="input" placeholder="Informar produto ou OS de Serviço" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {matchedOS && (
            <div style={{ marginTop: 10 }}>
              <div className="checklist-item" style={{ cursor: "pointer", borderColor: "var(--amber)" }} onClick={() => addOSToCart(matchedOS)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>OS #{matchedOS.osCode} — {matchedOS.brand ? `${matchedOS.brand} ` : ""}{matchedOS.device}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{matchedOS.defect}</div>
                </div>
                <div className="mono" style={{ color: "var(--amber)", fontWeight: 600 }}>{brl(matchedOS.budget)}</div>
              </div>
            </div>
          )}
          {filteredProducts.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredProducts.map((p) => (
                <div key={p.id} className="checklist-item" style={{ cursor: "pointer" }} onClick={() => addToCart(p)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{p.sku || "sem SKU"} · {p.qty} em estoque</div>
                  </div>
                  <div className="mono" style={{ color: "var(--amber)", fontWeight: 600 }}>{brl(p.price)}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card-title" style={{ marginTop: 20 }}>Carrinho</div>
          {cart.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={26} />} title="Carrinho vazio" sub="Busque um produto acima para adicionar" />
          ) : (
            <div>
              {cart.map((i) => {
                const v = lineValues(i);
                return (
                  <div className="cart-line" key={i.productId} style={{ flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 130 }}>
                      <div style={{ fontWeight: 600 }}>{i.name}</div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>{brl(i.price)} / un.</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div className="qty-btn" onClick={() => changeQty(i.productId, -1)}><Minus size={12} /></div>
                      <span className="mono" style={{ width: 20, textAlign: "center" }}>{i.qty}</span>
                      <div className="qty-btn" onClick={() => changeQty(i.productId, 1)}><Plus size={12} /></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        className="input mono"
                        style={{ width: 54, padding: "5px 6px", textAlign: "right" }}
                        value={i.discountPct || ""}
                        placeholder="0"
                        onChange={(e) => changeDiscount(i.productId, e.target.value)}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>% off</span>
                    </div>
                    <div style={{ width: 90, textAlign: "right" }}>
                      {v.discountValue > 0 && (
                        <div className="mono" style={{ fontSize: 11, color: "var(--red)", textDecoration: "line-through" }}>{brl(v.subtotal)}</div>
                      )}
                      <div className="mono" style={{ fontWeight: 600 }}>{brl(v.total)}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i.productId)}><Trash2 size={13} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

       <div className="card">
          <div className="card-title">Fechar venda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome do cliente (opcional)">
              <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: João da Silva" />
            </Field>
            <Field label="Forma de pagamento">
              <div className="tab-pills" style={{ flexWrap: "wrap" }}>
                {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                  <div key={k} className={"tab-pill" + (payment === k ? " active" : "")} onClick={() => setPayment(k)}>{label}</div>
                ))}
              </div>
            </Field>

            {payment === "dinheiro" && (
              <Field label="Valor recebido (R$)">
                <input className="input" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0,00" />
                {cashReceivedValue > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 4 }}>
                    <span style={{ color: "var(--text-dim)" }}>Troco</span>
                    <span className="mono" style={{ color: "var(--text)" }}>
                      {cashReceivedValue >= finalTotal ? brl(trocoValue) : "valor insuficiente"}
                    </span>
                  </div>
                )}
              </Field>
            )}

            {payment === "credito" && (
              <Field label="Parcelas">
                <select className="input" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x {n > 1 ? `de ${brl(finalTotal / n)}` : "à vista"}</option>
                  ))}
                </select>
              </Field>
            )}

            <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Desconto adicional (%)">
                <input className="input" value={extraDiscount} onChange={(e) => setExtraDiscount(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Acréscimo (%)">
                <input className="input" value={extraSurcharge} onChange={(e) => setExtraSurcharge(e.target.value)} placeholder="0" />
              </Field>
            </div>

            {cartDiscountTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-dim)" }}>Desconto por item</span>
                <span className="mono" style={{ color: "var(--text)" }}>-{brl(cartDiscountTotal)}</span>
              </div>
            )}
            {extraDiscountValue > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-dim)" }}>Desconto adicional ({extraDiscountPct}%)</span>
                <span className="mono" style={{ color: "var(--text)" }}>-{brl(extraDiscountValue)}</span>
              </div>
            )}
            {extraSurchargeValue > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ color: "var(--text-dim)" }}>Acréscimo ({extraSurchargePct}%)</span>
                <span className="mono" style={{ color: "var(--text)" }}>+{brl(extraSurchargeValue)}</span>
              </div>
            )}

            <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Total</span>
              <span className="mono" style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{brl(finalTotal)}</span>
            </div>
            <button className="btn btn-primary" disabled={!cart.length || (payment === "dinheiro" && cashReceivedValue < finalTotal)} onClick={finalizeSale}>
              <Receipt size={15} /> Finalizar venda
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Últimas compras</div>
        {recentSales.length === 0 ? (
          <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda registrada ainda" />
        ) : (
          <table>
            <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id}>
                  <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(s.createdAt)}</td>
                  <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                  <td>{data.customers.find((c) => c.id === s.customerId)?.name || "—"}</td>
                  <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteSaleId(s.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {movModal && (
        <Modal title={movModal === "sangria" ? "Registrar sangria" : "Registrar reforço"} onClose={() => setMovModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setMovModal(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={addMovement}>Confirmar</button>
          </>}>
          <Field label="Valor (R$)"><input className="input" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} placeholder="0,00" /></Field>
          <Field label="Motivo"><input className="input" value={movReason} onChange={(e) => setMovReason(e.target.value)} placeholder="Ex: troco para outro caixa" /></Field>
        </Modal>
      )}

      {deleteSaleId && (
        <Modal title="Excluir venda" onClose={() => setDeleteSaleId(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setDeleteSaleId(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={() => handleDeleteSale(deleteSaleId)}>Excluir</button>
          </>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Essa venda será removida do histórico e os produtos voltarão para o estoque. Essa ação não pode ser desfeita.</p>
        </Modal>
      )}

      {closeReport && <CashReportModal data={closeReport} customers={data.customers} justClosed onClose={() => setCloseReport(null)} />}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          storeName={storeName}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </div>
  );
}

function ReceiptModal({ sale, storeName, onClose }) {
  const dt = new Date(sale.createdAt);
  return (
    <Modal
      title="Comprovante de venda"
      onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={() => window.print()}><FileText size={14} /> Imprimir</button>
        <button className="btn btn-primary" onClick={onClose}>Concluir</button>
      </>}
    >
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", borderRadius: 10, padding: 18 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{storeName}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Comprovante de venda</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)", borderBottom: "1px dashed var(--border)", paddingBottom: 10, marginBottom: 10 }}>
          <span>Data: <span className="mono">{dt.toLocaleDateString("pt-BR")}</span></span>
          <span>Hora: <span className="mono">{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></span>
        </div>
       {sale.customerName && (
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>Cliente: {sale.customerName}</div>
        )}
        <table>
          <thead>
            <tr>
              <th>Produto</th><th style={{ textAlign: "right" }}>Preço</th><th style={{ textAlign: "right" }}>Qtd.</th>
              <th style={{ textAlign: "right" }}>Desc.</th><th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.productId}>
                <td>{i.name}</td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(i.price)}</td>
                <td className="mono" style={{ textAlign: "right" }}>{i.qty}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--text-faint)" }}>
                  {i.discountPct ? `${i.discountPct}%` : "—"}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sale.discountTotal > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 10 }}>
            <span style={{ color: "var(--text-faint)" }}>Desconto por item</span>
            <span className="mono" style={{ color: "var(--text)" }}>-{brl(sale.discountTotal)}</span>
          </div>
        )}
        {sale.extraDiscount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span style={{ color: "var(--text-faint)" }}>Desconto adicional ({sale.extraDiscountPct}%)</span>
            <span className="mono" style={{ color: "var(--text)" }}>-{brl(sale.extraDiscount)}</span>
          </div>
        )}
        {sale.extraSurcharge > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
            <span style={{ color: "var(--text-faint)" }}>Acréscimo ({sale.extraSurchargePct}%)</span>
            <span className="mono" style={{ color: "var(--text)" }}>+{brl(sale.extraSurcharge)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Total pago</span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{brl(sale.total)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-faint)", marginTop: 8 }}>
          <span>Forma de pagamento</span>
          <span>{PAYMENT_LABELS[sale.paymentMethod]}{sale.installments > 1 ? ` (${sale.installments}x)` : ""}</span>
        </div>
        {sale.paymentMethod === "dinheiro" && sale.cashReceived != null && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-faint)", marginTop: 4 }}>
              <span>Valor recebido</span>
              <span className="mono">{brl(sale.cashReceived)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-faint)", marginTop: 4 }}>
              <span>Troco</span>
              <span className="mono">{brl(sale.troco)}</span>
            </div>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--border)", fontSize: 11.5, color: "var(--text-dim)" }}>
          Obrigado pela sua preferência, volte sempre!
        </div>
      </div>
    </Modal>
  );
}

function CashReportModal({ data, customers, onClose, justClosed }) {
  const { reg, report } = data;
  return (
    <Modal title={justClosed ? "Caixa fechado — relatório do dia" : "Relatório do caixa"} onClose={onClose} wide
      footer={<button className="btn btn-primary" onClick={onClose}>Concluir</button>}>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Total vendido</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: "var(--amber)" }}>{brl(report.totalSales)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Nº de vendas</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700 }}>{report.salesOfReg.length}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Ticket médio</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700 }}>{brl(report.ticketMedio)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Por forma de pagamento</div>
        {Object.keys(report.byPayment).length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda registrada.</div> :
          Object.entries(report.byPayment).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span style={{ color: "var(--text-dim)" }}>{PAYMENT_LABELS[k]}</span>
              <span className="mono" style={{ fontWeight: 600 }}>{brl(v)}</span>
            </div>
          ))}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Fechamento de caixa</div>
        {[
          ["Valor de abertura", reg.openingAmount],
          ["Vendas em dinheiro", report.byPayment["dinheiro"] || 0],
          ["Reforços", report.totalReinforcements],
          ["Sangrias", -report.totalWithdrawals],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
            <span style={{ color: "var(--text-dim)" }}>{label}</span>
            <span className="mono">{brl(val)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0 0", marginTop: 6, borderTop: "1px solid var(--border-soft)", fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>Total esperado em caixa</span>
          <span className="mono" style={{ fontWeight: 700, color: "var(--green)" }}>{brl(report.expected)}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Vendas do período</div>
        {report.salesOfReg.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda.</div> : (
          <table>
            <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {report.salesOfReg.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDateTime(s.createdAt).split(" ")[1]}</td>
                  <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                  <td>{customers.find((c) => c.id === s.customerId)?.name || "—"}</td>
                  <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   ESTOQUE
   ============================================================ */
const PRODUCT_CATEGORIES = ["Aparelho", "Acessório", "Peça de reposição", "Película", "Capinha", "Cabos", "Eletrônicos", "Pilhas e baterias"];

function Estoque({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [confirmDel, setConfirmDel] = useState(null);

  const empty = { name: "", category: "Aparelho", sku: "", price: "", cost: "", qty: "", minQty: "2", hasImei: false, imeis: [] };
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setForm({ ...p, imeisText: (p.imeis || []).map((i) => i.imei).join("\n") }); setEditing(p.id); setModalOpen(true); };

  const save = () => {
    if (!form.name.trim()) return;
    const imeis = form.hasImei && form.imeisText
      ? form.imeisText.split("\n").map((s) => s.trim()).filter(Boolean).map((imei) => ({ imei, status: "estoque" }))
      : (form.imeis || []);
    const payload = {
      id: editing || uid(),
      name: form.name, category: form.category, sku: form.sku,
      price: parseFloat(String(form.price).replace(",", ".")) || 0,
      cost: parseFloat(String(form.cost).replace(",", ".")) || 0,
      qty: form.hasImei ? imeis.length : (parseInt(form.qty) || 0),
      minQty: parseInt(form.minQty) || 0,
      hasImei: !!form.hasImei,
      imeis,
    };
    if (editing) {
      update("products", (arr) => arr.map((p) => (p.id === editing ? payload : p)));
      notify("Produto atualizado");
    } else {
      update("products", (arr) => [...arr, payload]);
      notify("Produto cadastrado");
    }
    setModalOpen(false);
  };

  const remove = (id) => {
    update("products", (arr) => arr.filter((p) => p.id !== id));
    setConfirmDel(null);
    notify("Produto removido");
  };

  const filtered = data.products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "todas" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
const categoriesList = PRODUCT_CATEGORIES;

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: 320 }}>
            <Search size={15} />
            <input className="input" placeholder="Buscar por nome, SKU ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ maxWidth: 190 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo produto</button>
      </div>
      
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}>
            <EmptyState icon={<Package size={28} />} title="Nenhum produto cadastrado" sub="Clique em “Novo produto” para começar seu estoque" />
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Produto</th><th>Categoria</th><th>SKU / IMEI</th><th>Custo</th><th>Preço</th><th>Qtd.</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.qty <= p.minQty;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge gray">{p.category}</span></td>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{p.hasImei ? `${p.imeis.length} nº série` : (p.sku || "—")}</td>
                    <td className="mono">{brl(p.cost)}</td>
                    <td className="mono" style={{ color: "var(--amber)" }}>{brl(p.price)}</td>
                    <td>
                      <span className={"badge " + (low ? "red" : "green")}>
                        {low && <AlertTriangle size={11} />} {p.qty} un.
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(p.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Editar produto" : "Novo produto"} onClose={() => setModalOpen(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button>
          </>}>
          <Field label="Nome do produto"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: iPhone 13 128GB" /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Categoria">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="SKU (código interno)"><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Ex: CAP-IP13-01" /></Field>
          </div>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Custo (R$)"><input className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Preço de venda (R$)"><input className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" /></Field>
          </div>
          <div className="checklist-item">
            <span style={{ fontSize: 13 }}>Controlar por IMEI / nº de série (para aparelhos)</span>
            <input type="checkbox" checked={form.hasImei} onChange={(e) => setForm({ ...form, hasImei: e.target.checked })} />
          </div>
          {form.hasImei ? (
            <Field label="IMEIs / números de série (um por linha)">
              <textarea className="input" rows={4} value={form.imeisText || ""} onChange={(e) => setForm({ ...form, imeisText: e.target.value })} placeholder={"351234567891234\n351234567891235"} />
            </Field>
          ) : (
            <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Quantidade em estoque"><input className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" /></Field>
              <Field label="Estoque mínimo (alerta)"><input className="input" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} placeholder="2" /></Field>
            </div>
          )}
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Remover produto" onClose={() => setConfirmDel(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button>
          </>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover este produto do estoque? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   ORDENS DE SERVIÇO
   ============================================================ */
function OrdensServico({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [filter, setFilter] = useState("todas");

  const empty = { customerId: "", device: "", brand: "", defect: "", checklist: {}, budget: "", notes: "", status: "aguardando_peca" };
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setModalOpen(true); };

  const save = () => {
    if (!form.device.trim() || !form.defect.trim()) return;
    const os = {
      id: uid(), osCode: genOSCode(data.serviceOrders), customerId: form.customerId || null, device: form.device, brand: form.brand,
      defect: form.defect, checklist: form.checklist, status: form.status,
      budget: parseFloat(String(form.budget).replace(",", ".")) || 0, notes: form.notes, createdAt: now(), updatedAt: now(),
    };
    update("serviceOrders", (arr) => [os, ...arr]);
    setModalOpen(false);
    notify("OS #" + os.osCode + " criada");
  };
  const setStatus = (id, status) => {
    update("serviceOrders", (arr) => arr.map((o) => (o.id === id ? { ...o, status, updatedAt: now() } : o)));
    notify("Status atualizado");
  };

  const filtered = data.serviceOrders.filter((o) => filter === "todas" || o.status === filter);

  return (
    <div>
      <div className="toolbar">
        <div className="tab-pills">
          <div className={"tab-pill" + (filter === "todas" ? " active" : "")} onClick={() => setFilter("todas")}>Todas</div>
          {Object.entries(OS_STATUS).map(([k, v]) => (
            <div key={k} className={"tab-pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{v.label}</div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Nova ordem de serviço</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<Wrench size={28} />} title="Nenhuma OS encontrada" sub="Cadastre um aparelho para iniciar o acompanhamento" /></div>
        ) : (
          <table>
            <thead><tr><th>Código</th><th>Aparelho</th><th>Defeito relatado</th><th>Cliente</th><th>Status</th><th>Entrada</th><th></th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono" style={{ color: "var(--amber)", fontWeight: 700 }}>{o.osCode}</td>
                  <td style={{ fontWeight: 600 }}>{o.brand ? `${o.brand} — ${o.device}` : o.device}</td>
                  <td style={{ maxWidth: 220, color: "var(--text-dim)" }}>{o.defect}</td>
                  <td>{data.customers.find((c) => c.id === o.customerId)?.name || "—"}</td>
                  <td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td>
                  <td style={{ color: "var(--text-faint)" }}>{fmtDate(o.createdAt)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewing(o)}>Detalhes <ChevronRight size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title="Nova ordem de serviço" onClose={() => setModalOpen(false)} wide
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save}><Save size={14} /> Abrir OS</button>
          </>}>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Marca"><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Samsung" /></Field>
            <Field label="Modelo do aparelho"><input className="input" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} placeholder="Ex: Galaxy S23" /></Field>
          </div>
          <Field label="Cliente">
            <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Selecione um cliente...</option>
              {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Defeito relatado pelo cliente"><textarea className="input" rows={2} value={form.defect} onChange={(e) => setForm({ ...form, defect: e.target.value })} placeholder="Ex: tela quebrada após queda" /></Field>
          <Field label="Status">
            <div className="tab-pills" style={{ flexWrap: "wrap" }}>
              {Object.entries(OS_STATUS).map(([k, v]) => (
                <div key={k} className={"tab-pill" + (form.status === k ? " active" : "")} onClick={() => setForm({ ...form, status: k })}>
                  <span className={"badge " + v.color} style={{ pointerEvents: "none" }}>{v.label}</span>
                </div>
              ))}
            </div>
          </Field>
          <Field label="Checklist de entrada (estado do aparelho)">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item.key} className="checklist-item">
                  <span style={{ fontSize: 12.5 }}>{item.label}</span>
                  <select className="input" style={{ width: 100, padding: "5px 8px" }}
                    value={form.checklist[item.key] || "ok"}
                    onChange={(e) => setForm({ ...form, checklist: { ...form.checklist, [item.key]: e.target.value } })}>
                    <option value="ok">OK</option>
                    <option value="danificado">Danificado</option>
                    <option value="nao_testado">Não testado</option>
                  </select>
                </div>
              ))}
            </div>
          </Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Orçamento estimado (R$)"><input className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Observações"><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" /></Field>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal title={viewing.brand ? `${viewing.brand} — ${viewing.device}` : viewing.device} onClose={() => setViewing(null)}
          footer={<button className="btn btn-secondary" onClick={() => setViewing(null)}>Fechar</button>}>
          <Field label="Código da OS (usar no PDV para fechar a venda)">
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--amber)" }}>{viewing.osCode}</div>
          </Field>
          <Field label="Status atual">
            <select className="input" value={viewing.status} onChange={(e) => { setStatus(viewing.id, e.target.value); setViewing({ ...viewing, status: e.target.value }); }}>
              {Object.entries(OS_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Cliente"><div style={{ fontSize: 13.5 }}>{data.customers.find((c) => c.id === viewing.customerId)?.name || "Não informado"}</div></Field>
          <Field label="Defeito relatado"><div style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{viewing.defect}</div></Field>
          <Field label="Checklist de entrada">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CHECKLIST_ITEMS.map((item) => {
                const val = viewing.checklist[item.key] || "ok";
                const color = val === "danificado" ? "red" : val === "nao_testado" ? "amber" : "green";
                return (
                  <div key={item.key} className="checklist-item">
                    <span style={{ fontSize: 12.5 }}>{item.label}</span>
                    <span className={"badge " + color}>{val === "ok" ? "OK" : val === "danificado" ? "Danificado" : "Não testado"}</span>
                  </div>
                );
              })}
            </div>
          </Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Orçamento"><div className="mono" style={{ fontSize: 15, color: "var(--amber)", fontWeight: 700 }}>{brl(viewing.budget)}</div></Field>
            <Field label="Entrada"><div style={{ fontSize: 13.5 }}>{fmtDateTime(viewing.createdAt)}</div></Field>
          </div>
          {viewing.notes && <Field label="Observações"><div style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{viewing.notes}</div></Field>}
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   CLIENTES
   ============================================================ */
function Clientes({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState("");
  const empty = { name: "", phone: "", cpf: "", notes: "" };
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!form.name.trim()) return;
    update("customers", (arr) => [...arr, { id: uid(), ...form, createdAt: now() }]);
    setForm(empty); setModalOpen(false);
    notify("Cliente cadastrado");
  };

  const filtered = data.customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search));

  const historyFor = (customer) => {
    const purchases = data.sales.filter((s) => s.customerId === customer.id);
    const orders = data.serviceOrders.filter((o) => o.customerId === customer.id);
    return { purchases, orders };
  };

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: 320 }}>
            <Search size={15} />
            <input className="input" placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Novo cliente</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<Users size={28} />} title="Nenhum cliente cadastrado" /></div>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Cadastrado em</th><th></th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="mono" style={{ color: "var(--text-dim)" }}>{c.phone || "—"}</td>
                  <td style={{ color: "var(--text-faint)" }}>{fmtDate(c.createdAt)}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm" onClick={() => setViewing(c)}>Histórico <ChevronRight size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title="Novo cliente" onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome completo"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></Field>
            <Field label="CPF (opcional)"><input className="input" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></Field>
          </div>
          <Field label="Observações"><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" /></Field>
        </Modal>
      )}

      {viewing && (() => {
        const { purchases, orders } = historyFor(viewing);
        return (
          <Modal title={viewing.name} onClose={() => setViewing(null)} wide footer={<button className="btn btn-secondary" onClick={() => setViewing(null)}>Fechar</button>}>
            <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Telefone"><div style={{ fontSize: 13.5 }}>{viewing.phone || "—"}</div></Field>
              <Field label="CPF"><div style={{ fontSize: 13.5 }}>{viewing.cpf || "—"}</div></Field>
            </div>
            <div className="card-title" style={{ marginTop: 6 }}>Compras ({purchases.length})</div>
            {purchases.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma compra registrada.</div> : (
              <table><tbody>
                {purchases.map((s) => (
                  <tr key={s.id}><td>{fmtDate(s.createdAt)}</td><td>{s.items.map((i) => i.name).join(", ")}</td><td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td></tr>
                ))}
              </tbody></table>
            )}
            <div className="card-title" style={{ marginTop: 6 }}>Ordens de serviço ({orders.length})</div>
            {orders.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma OS registrada.</div> : (
              <table><tbody>
                {orders.map((o) => (
                  <tr key={o.id}><td>{fmtDate(o.createdAt)}</td><td>{o.device}</td><td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td></tr>
                ))}
              </tbody></table>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

/* ============================================================
   FORNECEDORES
   ============================================================ */
function Fornecedores({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const empty = { name: "", phone: "", document: "", email: "", category: "", notes: "" };
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (s) => { setForm(s); setEditing(s.id); setModalOpen(true); };

  const save = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editing) {
      update("suppliers", (arr) => arr.map((s) => (s.id === editing ? { ...form, id: editing } : s)));
      notify("Fornecedor atualizado");
    } else {
      update("suppliers", (arr) => [...arr, { id: uid(), ...form, createdAt: now() }]);
      notify("Fornecedor cadastrado");
    }
    setModalOpen(false);
  };

  const remove = (id) => {
    update("suppliers", (arr) => arr.filter((s) => s.id !== id));
    setConfirmDel(null);
    notify("Fornecedor removido");
  };

  const filtered = data.suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone || "").includes(search) || (s.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: 320 }}>
            <Search size={15} />
            <input className="input" placeholder="Buscar por nome, telefone ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo fornecedor</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<Phone size={28} />} title="Nenhum fornecedor cadastrado" sub="Cadastre fornecedores de peças e acessórios para agilizar suas compras" /></div>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Categoria</th><th>E-mail</th><th></th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="mono" style={{ color: "var(--amber)" }}><Phone size={12} style={{ marginRight: 4, verticalAlign: -1 }} />{s.phone}</td>
                  <td>{s.category ? <span className="badge gray">{s.category}</span> : "—"}</td>
                  <td style={{ color: "var(--text-dim)" }}>{s.email || "—"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(s.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Editar fornecedor" : "Novo fornecedor"} onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome / razão social"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Distribuidora TechParts" /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></Field>
            <Field label="CNPJ / CPF (opcional)"><input className="input" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></Field>
          </div>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Categoria"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Peças, Acessórios, Aparelhos" /></Field>
            <Field label="E-mail (opcional)"><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <Field label="Observações"><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" /></Field>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Remover fornecedor" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover este fornecedor? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   FINANCEIRO
   ============================================================ */
function Financeiro({ data, update, notify }) {
  const [tab, setTab] = useState("relatorio");
  const [modalOpen, setModalOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const empty = { type: "receber", description: "", amount: "", dueDate: "" };
  const [form, setForm] = useState(empty);

  const save = () => {
    if (!form.description.trim() || !form.amount) return;
    update("financeEntries", (arr) => [...arr, { id: uid(), ...form, amount: parseFloat(String(form.amount).replace(",", ".")) || 0, status: "pendente", paidAt: null, createdAt: now() }]);
    setForm(empty); setModalOpen(false);
    notify("Lançamento adicionado");
  };

  const markPaid = (id) => {
    update("financeEntries", (arr) => arr.map((f) => (f.id === id ? { ...f, status: "pago", paidAt: now() } : f)));
    notify("Lançamento baixado");
  };

  const remove = (id) => update("financeEntries", (arr) => arr.filter((f) => f.id !== id));

  const monthSales = data.sales.filter((s) => isThisMonth(s.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const monthTotal = monthSales.reduce((s, v) => s + v.total, 0);
  const byPaymentMonth = {};
  monthSales.forEach((s) => { byPaymentMonth[s.paymentMethod] = (byPaymentMonth[s.paymentMethod] || 0) + s.total; });

  const monthExpenses = data.financeEntries.filter((f) => f.type === "pagar" && f.status === "pago" && f.paidAt && isThisMonth(f.paidAt));
  const monthExpensesTotal = monthExpenses.reduce((s, f) => s + f.amount, 0);
  const monthReceipts = data.financeEntries.filter((f) => f.type === "receber" && f.status === "pago" && f.paidAt && isThisMonth(f.paidAt));
  const monthReceiptsTotal = monthReceipts.reduce((s, f) => s + f.amount, 0);
  const monthOS = data.serviceOrders.filter((o) => isThisMonth(o.createdAt));

  const receivables = data.financeEntries.filter((f) => f.type === "receber");
  const payables = data.financeEntries.filter((f) => f.type === "pagar");
  const totalPendingReceber = receivables.filter((f) => f.status === "pendente").reduce((s, f) => s + f.amount, 0);
  const totalPendingPagar = payables.filter((f) => f.status === "pendente").reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <div className="tab-pills" style={{ marginBottom: 18 }}>
        <div className={"tab-pill" + (tab === "relatorio" ? " active" : "")} onClick={() => setTab("relatorio")}>Relatório do mês</div>
        <div className={"tab-pill" + (tab === "contas" ? " active" : "")} onClick={() => setTab("contas")}>Contas a pagar/receber</div>
      </div>

      {tab === "relatorio" ? (
        <div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <div className="card stat-card">
              <div className="stat-label">Faturamento do mês</div>
              <div className="stat-value green">{brl(monthTotal)}</div>
              <div className="stat-foot"><TrendingUp size={12} /> {monthSales.length} venda{monthSales.length !== 1 ? "s" : ""}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Ticket médio</div>
              <div className="stat-value green">{brl(monthSales.length ? monthTotal / monthSales.length : 0)}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Contas pendentes</div>
              <div className="stat-value" style={{ fontSize: 18, display: "flex", gap: 12 }}>
                <span style={{ color: "var(--green)" }}>+{brl(totalPendingReceber)}</span>
                <span style={{ color: "var(--red)" }}>-{brl(totalPendingPagar)}</span>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <div className="card stat-card">
              <div className="stat-label">Gastos pagos no mês</div>
              <div className="stat-value red">{brl(monthExpensesTotal)}</div>
              <div className="stat-foot"><TrendingDown size={12} /> {monthExpenses.length} pagamento{monthExpenses.length !== 1 ? "s" : ""}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Recebido no mês (extra)</div>
              <div className="stat-value green">{brl(monthReceiptsTotal)}</div>
              <div className="stat-foot"><TrendingUp size={12} /> {monthReceipts.length} recebimento{monthReceipts.length !== 1 ? "s" : ""}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Saldo do mês</div>
              <div className="stat-value" style={{ color: (monthTotal + monthReceiptsTotal - monthExpensesTotal) >= 0 ? "var(--green)" : "var(--red)" }}>
                {brl(monthTotal + monthReceiptsTotal - monthExpensesTotal)}
              </div>
              <div className="stat-foot">vendas + recebido − gasto</div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1.3fr" }}>
            <div className="card">
              <div className="card-title">Por forma de pagamento</div>
              {Object.keys(byPaymentMonth).length === 0 ? <EmptyState icon={<DollarSign size={26} />} title="Nenhuma venda este mês ainda" /> : (
                Object.entries(byPaymentMonth).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-soft)", fontSize: 13 }}>
                    <span style={{ color: "var(--text-dim)" }}>{PAYMENT_LABELS[k]}</span>
                    <span className="mono" style={{ fontWeight: 600 }}>{brl(v)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="card-title">Vendas do mês, detalhado</div>
              {monthSales.length === 0 ? <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda registrada este mês" /> : (
                <table>
                  <thead><tr><th>Data</th><th>Itens</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                  <tbody>
                    {monthSales.map((s) => (
                      <tr key={s.id}>
                        <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDate(s.createdAt)}</td>
                        <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                        <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                        <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Gastos pagos no mês</div>
            {monthExpenses.length === 0 ? <EmptyState icon={<TrendingDown size={26} />} title="Nenhum pagamento realizado este mês" /> : (
              <table>
                <thead><tr><th>Data do pagamento</th><th>Descrição</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
                <tbody>
                  {monthExpenses.map((f) => (
                    <tr key={f.id}>
                      <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDate(f.paidAt)}</td>
                      <td>{f.description}</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: 0 }}>
              Relatório referente a {MONTH_NAME}. Atualizado em tempo real conforme vendas e lançamentos são registrados.
            </p>
            <button className="btn btn-primary" onClick={() => setPrintOpen(true)}><FileText size={15} /> Gerar relatório e imprimir</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="toolbar">
            <div />
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Novo lançamento</button>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card" style={{ padding: 0 }}>
              <div className="card-title" style={{ padding: "16px 16px 0 16px" }}><TrendingUp size={14} color="var(--green)" /> A receber</div>
              {receivables.length === 0 ? <div style={{ padding: 24 }}><EmptyState icon={<DollarSign size={24} />} title="Nada a receber" /></div> : (
                <table>
                  <tbody>
                    {receivables.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{f.description}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Vence {fmtDate(f.dueDate)}</div>
                        </td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--green)" }}>{brl(f.amount)}</td>
                        <td><span className={"badge " + (f.status === "pago" ? "gray" : "green")}>{f.status === "pago" ? "Recebido" : "Pendente"}</span></td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {f.status !== "pago" && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(f.id)}><CheckCircle2 size={13} /></button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => remove(f.id)}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div className="card-title" style={{ padding: "16px 16px 0 16px" }}><TrendingDown size={14} color="var(--red)" /> A pagar</div>
              {payables.length === 0 ? <div style={{ padding: 24 }}><EmptyState icon={<DollarSign size={24} />} title="Nada a pagar" /></div> : (
                <table>
                  <tbody>
                    {payables.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{f.description}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Vence {fmtDate(f.dueDate)}</div>
                        </td>
                        <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                        <td><span className={"badge " + (f.status === "pago" ? "gray" : "red")}>{f.status === "pago" ? "Pago" : "Pendente"}</span></td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {f.status !== "pago" && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(f.id)}><CheckCircle2 size={13} /></button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => remove(f.id)}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title="Novo lançamento financeiro" onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Tipo">
            <div className="tab-pills">
              <div className={"tab-pill" + (form.type === "receber" ? " active" : "")} onClick={() => setForm({ ...form, type: "receber" })}>A receber</div>
              <div className={"tab-pill" + (form.type === "pagar" ? " active" : "")} onClick={() => setForm({ ...form, type: "pagar" })}>A pagar</div>
            </div>
          </Field>
          <Field label="Descrição"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Fornecedor de peças" /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Valor (R$)"><input className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Vencimento"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          </div>
        </Modal>
      )}

      {printOpen && (
        <MonthReportModal
          data={data} onClose={() => setPrintOpen(false)}
          monthSales={monthSales} monthTotal={monthTotal} byPaymentMonth={byPaymentMonth}
          monthExpenses={monthExpenses} monthExpensesTotal={monthExpensesTotal}
          monthReceipts={monthReceipts} monthReceiptsTotal={monthReceiptsTotal}
          monthOS={monthOS} payables={payables} receivables={receivables}
          totalPendingPagar={totalPendingPagar} totalPendingReceber={totalPendingReceber}
        />
      )}
    </div>
  );
}

function MonthReportModal({ data, onClose, monthSales, monthTotal, byPaymentMonth, monthExpenses, monthExpensesTotal, monthReceipts, monthReceiptsTotal, monthOS, payables, receivables, totalPendingPagar, totalPendingReceber }) {
  const saldo = monthTotal + monthReceiptsTotal - monthExpensesTotal;
  return (
    <Modal title="Relatório do mês" onClose={onClose} wide
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={() => window.print()}><FileText size={14} /> Imprimir</button>
      </>}>
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{data.storeConfig.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Relatório financeiro — {MONTH_NAME}</div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Faturamento</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--amber)" }}>{brl(monthTotal)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Gastos pagos</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--red)" }}>{brl(monthExpensesTotal)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Recebido extra</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>{brl(monthReceiptsTotal)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Saldo do mês</div>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: saldo >= 0 ? "var(--green)" : "var(--red)" }}>{brl(saldo)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Vendas do mês ({monthSales.length})</div>
        {monthSales.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda registrada.</div> : (
          <table>
            <thead><tr><th>Data</th><th>Itens</th><th>Pagamento</th><th>Cliente</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
            <tbody>
              {monthSales.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{fmtDate(s.createdAt)}</td>
                  <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                  <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                  <td>{data.customers.find((c) => c.id === s.customerId)?.name || "—"}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {Object.keys(byPaymentMonth).length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
            {Object.entries(byPaymentMonth).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "3px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>{PAYMENT_LABELS[k]}</span>
                <span className="mono">{brl(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Gastos pagos no mês ({monthExpenses.length})</div>
        {monthExpenses.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum pagamento registrado.</div> : (
          <table>
            <tbody>
              {monthExpenses.map((f) => (
                <tr key={f.id}>
                  <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDate(f.paidAt)}</td>
                  <td>{f.description}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {monthReceipts.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Recebimentos extras confirmados ({monthReceipts.length})</div>
          <table>
            <tbody>
              {monthReceipts.map((f) => (
                <tr key={f.id}>
                  <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDate(f.paidAt)}</td>
                  <td>{f.description}</td>
                  <td className="mono" style={{ textAlign: "right", color: "var(--green)" }}>{brl(f.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Contas pendentes (todas)</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
          <span style={{ color: "var(--text-dim)" }}>Total a receber</span>
          <span className="mono" style={{ color: "var(--green)" }}>{brl(totalPendingReceber)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
          <span style={{ color: "var(--text-dim)" }}>Total a pagar</span>
          <span className="mono" style={{ color: "var(--red)" }}>{brl(totalPendingPagar)}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Ordens de serviço abertas no mês ({monthOS.length})</div>
        {monthOS.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma OS aberta este mês.</div> : (
          <table>
            <tbody>
              {monthOS.map((o) => (
                <tr key={o.id}>
                  <td>{o.brand ? `${o.brand} — ${o.device}` : o.device}</td>
                  <td>{data.customers.find((c) => c.id === o.customerId)?.name || "—"}</td>
                  <td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================
   CONTAS E DESPESAS
   ============================================================ */
const EXPENSE_CATEGORIES = {
  fornecedor: { label: "Mercadoria", color: "blue" },
  despesa: { label: "Despesa", color: "red" },
  conta: { label: "Outras Contas", color: "amber" },
  
};

function ContasDespesas({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [confirmDel, setConfirmDel] = useState(null);

  const empty = { category: "conta", supplierId: "", description: "", amount: "", dueDate: "" };
  const [form, setForm] = useState(empty);

  const expenses = data.financeEntries.filter((f) => f.type === "pagar");

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (f) => {
    setForm({ category: f.category || "despesa", supplierId: f.supplierId || "", description: f.description, amount: String(f.amount), dueDate: f.dueDate || "" });
    setEditing(f.id); setModalOpen(true);
  };

  const save = () => {
    if (!form.description.trim() || !form.amount) return;
    const payload = {
      type: "pagar",
      category: form.category,
      supplierId: form.supplierId || null,
      description: form.description,
      amount: parseFloat(String(form.amount).replace(",", ".")) || 0,
      dueDate: form.dueDate,
    };
    if (editing) {
      update("financeEntries", (arr) => arr.map((f) => (f.id === editing ? { ...f, ...payload } : f)));
      notify("Lançamento atualizado");
    } else {
      update("financeEntries", (arr) => [...arr, { id: uid(), ...payload, status: "pendente", paidAt: null, createdAt: now() }]);
      notify("Lançamento adicionado");
    }
    setModalOpen(false);
  };

  const markPaid = (id) => {
    update("financeEntries", (arr) => arr.map((f) => (f.id === id ? { ...f, status: "pago", paidAt: now() } : f)));
    notify("Lançamento baixado");
  };

  const remove = (id) => {
    update("financeEntries", (arr) => arr.filter((f) => f.id !== id));
    setConfirmDel(null);
    notify("Lançamento removido");
  };

  const filtered = expenses.filter((f) => {
    const matchesCat = filter === "todas" || (f.category || "despesa") === filter;
    const matchesStatus = statusFilter === "todas" || f.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  const totalPendente = filtered.filter((f) => f.status === "pendente").reduce((s, f) => s + f.amount, 0);
  const totalPago = filtered.filter((f) => f.status === "pago").reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="stat-label">Total pendente</div>
          <div className="stat-value red">{brl(totalPendente)}</div>
          <div className="stat-foot"><Clock size={12} /> {filtered.filter((f) => f.status === "pendente").length} conta{filtered.filter((f) => f.status === "pendente").length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total pago</div>
          <div className="stat-value green">{brl(totalPago)}</div>
          <div className="stat-foot"><CheckCircle2 size={12} /> {filtered.filter((f) => f.status === "pago").length} conta{filtered.filter((f) => f.status === "pago").length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total geral</div>
          <div className="stat-value blue">{brl(totalPendente + totalPago)}</div>
          <div className="stat-foot"><DollarSign size={12} /> {filtered.length} lançamento{filtered.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="tab-pills">
            <div className={"tab-pill" + (filter === "todas" ? " active" : "")} onClick={() => setFilter("todas")}>Todas</div>
            {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
              <div key={k} className={"tab-pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{v.label}</div>
            ))}
          </div>
          <div className="tab-pills">
            <div className={"tab-pill" + (statusFilter === "todas" ? " active" : "")} onClick={() => setStatusFilter("todas")}>Todos</div>
            <div className={"tab-pill" + (statusFilter === "pendente" ? " active" : "")} onClick={() => setStatusFilter("pendente")}>Pendente</div>
            <div className={"tab-pill" + (statusFilter === "pago" ? " active" : "")} onClick={() => setStatusFilter("pago")}>Pago</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo lançamento</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<DollarSign size={28} />} title="Nenhum lançamento encontrado" /></div>
        ) : (
          <table>
            <thead><tr><th>Categoria</th><th>Descrição</th><th>Fornecedor</th><th>Vencimento</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((f) => {
                const cat = EXPENSE_CATEGORIES[f.category || "despesa"];
                const supplier = data.suppliers.find((s) => s.id === f.supplierId);
                return (
                  <tr key={f.id}>
                    <td><span className={"badge " + cat.color}>{cat.label}</span></td>
                    <td style={{ fontWeight: 600 }}>{f.description}</td>
                    <td style={{ color: "var(--text-dim)" }}>{supplier ? supplier.name : "—"}</td>
                    <td style={{ color: "var(--text-faint)" }}>{f.dueDate ? fmtDate(f.dueDate) : "—"}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                    <td><span className={"badge " + (f.status === "pago" ? "gray" : "red")}>{f.status === "pago" ? "Pago" : "Pendente"}</span></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {f.status !== "pago" && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(f.id)}><CheckCircle2 size={13} /></button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(f.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title={editing ? "Editar lançamento" : "Novo lançamento"} onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Categoria">
            <div className="tab-pills">
              {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                <div key={k} className={"tab-pill" + (form.category === k ? " active" : "")} onClick={() => setForm({ ...form, category: k })}>{v.label}</div>
              ))}
            </div>
          </Field>
          {form.category === "fornecedor" && (
            <Field label="Fornecedor">
              <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Selecione um fornecedor...</option>
                {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Descrição"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Compra de peças, aluguel, internet..." /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Valor (R$)"><input className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Vencimento"><input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          </div>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Remover lançamento" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover este lançamento? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   FINANCEIRO MENSAL
   ============================================================ */
function FinanceiroMensal({ data }) {
  const [monthOffset, setMonthOffset] = useState(0);

  const refDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = refDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const isInRefMonth = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth();
  };

  const monthSales = useMemo(
    () => data.sales.filter((s) => isInRefMonth(s.createdAt)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [data.sales, refDate]
  );

  const osRevenue = monthSales.reduce((sum, s) => sum + s.items.filter((i) => i.productId.startsWith("os-")).reduce((s2, i) => s2 + i.lineTotal, 0), 0);
  const productRevenue = monthSales.reduce((sum, s) => sum + s.total, 0) - osRevenue;

  const productCost = monthSales.reduce((sum, s) => {
    return sum + s.items.filter((i) => !i.productId.startsWith("os-")).reduce((s2, i) => {
      const prod = data.products.find((p) => p.id === i.productId);
      return s2 + (prod ? prod.cost * i.qty : 0);
    }, 0);
  }, 0);

  const monthExpenses = data.financeEntries.filter((f) => f.type === "pagar" && isInRefMonth(f.createdAt));
  const monthExpensesTotal = monthExpenses.reduce((s, f) => s + f.amount, 0);

  const lucroEstimado = (productRevenue - productCost) + osRevenue - monthExpensesTotal;

  const byPayment = {};
  monthSales.forEach((s) => { byPayment[s.paymentMethod] = (byPayment[s.paymentMethod] || 0) + s.total; });
  const paymentRanking = Object.entries(byPayment).sort((a, b) => b[1] - a[1]);
  const paymentTotal = paymentRanking.reduce((s, [, v]) => s + v, 0);

  const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate();
  const byDay = Array.from({ length: daysInMonth }, () => 0);
  monthSales.forEach((s) => {
    const day = new Date(s.createdAt).getDate();
    byDay[day - 1] += s.total;
  });
  const maxDay = Math.max(1, ...byDay);

  const productAgg = {};
  monthSales.forEach((s) => {
    s.items.filter((i) => !i.productId.startsWith("os-")).forEach((i) => {
      if (!productAgg[i.productId]) productAgg[i.productId] = { name: i.name, qty: 0, revenue: 0 };
      productAgg[i.productId].qty += i.qty;
      productAgg[i.productId].revenue += i.lineTotal;
    });
  });
  const topProducts = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 3);

  const monthOSDone = data.serviceOrders.filter((o) => o.status === "entregue" && isInRefMonth(o.updatedAt)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const monthOSTotal = monthOSDone.reduce((s, o) => s + o.budget, 0);

  return (
    <div>
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setMonthOffset((m) => m - 1)}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, textTransform: "capitalize", minWidth: 160, textAlign: "center" }}>
            {monthLabel}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setMonthOffset((m) => m + 1)} disabled={monthOffset >= 0}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="stat-label">Faturamento Bruto de vendas</div>
          <div className="stat-value green">{brl(productRevenue)}</div>
          <div className="stat-foot"><Receipt size={12} /> {monthSales.length} venda{monthSales.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Faturamento em OS</div>
          <div className="stat-value blue">{brl(osRevenue)}</div>
          <div className="stat-foot"><Wrench size={12} /> {monthOSDone.length} OS concluída{monthOSDone.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Gastos</div>
          <div className="stat-value red">{brl(monthExpensesTotal)}</div>
          <div className="stat-foot"><TrendingDown size={12} /> {monthExpenses.length} pagamento{monthExpenses.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Lucro estimado</div>
          <div className="stat-value" style={{ color: lucroEstimado >= 0 ? "var(--green)" : "var(--red)" }}>{brl(lucroEstimado)}</div>
          <div className="stat-foot">vendas − custo + OS − gastos</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.6fr" }}>
        <div className="card">
          <div className="card-title">Ranking por forma de pagamento</div>
          {paymentRanking.length === 0 ? (
            <EmptyState icon={<DollarSign size={26} />} title="Nenhuma venda neste mês" />
          ) : (
            paymentRanking.map(([k, v], idx) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="badge gray" style={{ minWidth: 22, justifyContent: "center" }}>{idx + 1}º</span>
                <span style={{ flex: 1, fontSize: 13 }}>{PAYMENT_LABELS[k]}</span>
                <span className="mono" style={{ fontWeight: 600 }}>{brl(v)}</span>
                <span style={{ fontSize: 11, color: "var(--text-faint)", width: 40, textAlign: "right" }}>
                  {paymentTotal ? Math.round((v / paymentTotal) * 100) : 0}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Faturamento por dia</div>
          {monthSales.length === 0 ? (
            <EmptyState icon={<TrendingUp size={26} />} title="Nenhuma venda neste mês" />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140, paddingTop: 10 }}>
              {byDay.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }} title={`Dia ${i + 1}: ${brl(v)}`}>
                  <div style={{
                    width: "100%", maxWidth: 14, borderRadius: "3px 3px 0 0",
                    height: `${(v / maxDay) * 100}%`, minHeight: v > 0 ? 2 : 0,
                    background: v > 0 ? "var(--amber)" : "var(--border-soft)",
                  }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--text-faint)", marginTop: 6 }}>
            <span>Dia 1</span>
            <span>Dia {daysInMonth}</span>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.6fr", marginTop: 16 }}>
        <div className="card">
          <div className="card-title">Top 3 produtos mais vendidos</div>
          {topProducts.length === 0 ? (
            <EmptyState icon={<Package size={26} />} title="Nenhum produto vendido" />
          ) : (
            topProducts.map((p, idx) => (
              <div key={p.name + idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="badge amber" style={{ minWidth: 22, justifyContent: "center" }}>{idx + 1}º</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{p.qty} unidade{p.qty !== 1 ? "s" : ""} vendida{p.qty !== 1 ? "s" : ""}</div>
                </div>
                <span className="mono" style={{ fontWeight: 600 }}>{brl(p.revenue)}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">Ordens de serviço concluídas ({monthOSDone.length}) — {brl(monthOSTotal)}</div>
          {monthOSDone.length === 0 ? (
            <EmptyState icon={<Wrench size={26} />} title="Nenhuma OS concluída neste mês" />
          ) : (
            <table>
              <thead><tr><th>Código</th><th>Aparelho</th><th>Cliente</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
              <tbody>
                {monthOSDone.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.osCode}</td>
                    <td>{o.brand ? `${o.brand} — ${o.device}` : o.device}</td>
                    <td>{data.customers.find((c) => c.id === o.customerId)?.name || "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(o.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Detalhamento de gastos ({monthExpenses.length}) — {brl(monthExpensesTotal)}</div>
        {monthExpenses.length === 0 ? (
          <EmptyState icon={<TrendingDown size={26} />} title="Nenhum gasto registrado neste mês" />
        ) : (
          <table>
            <thead><tr><th>Categoria</th><th>Descrição</th><th>Data</th><th>Status</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
            <tbody>
              {monthExpenses.map((f) => {
                const cat = EXPENSE_CATEGORIES[f.category || "despesa"];
                return (
                  <tr key={f.id}>
                    <td><span className={"badge " + cat.color}>{cat.label}</span></td>
                    <td>{f.description}</td>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDate(f.createdAt)}</td>
                    <td><span className={"badge " + (f.status === "pago" ? "gray" : "red")}>{f.status === "pago" ? "Pago" : "Pendente"}</span></td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN
   ============================================================ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Preencha e-mail e senha"); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin();
    } catch (e) {
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password" || e.code === "auth/user-not-found") {
        setError("E-mail ou senha incorretos");
      } else if (e.code === "auth/invalid-email") {
        setError("E-mail inválido");
      } else if (e.code === "auth/too-many-requests") {
        setError("Muitas tentativas. Aguarde um pouco e tente de novo");
      } else {
        setError("Erro ao entrar. Tente novamente");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", fontFamily: "var(--font-body)", color: "var(--text)",
    }}>
      <style>{STYLES}</style>
      <div className="card" style={{ width: 340, padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <img src="/logo.png" alt="Davi Celulares" style={{ height: 110, width: "auto", objectFit: "contain" }} />
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Gestão de loja
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="E-mail">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <Field label="Senha">
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          {error && (
            <div style={{ fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}
          <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={submit} disabled={loading}>
            <Unlock size={15} /> {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
      <div style={{ marginTop: 18, fontSize: 11, color: "var(--text-faint)" }}>
        © Desenvolvido por Deivid Lima
      </div>
    </div>
  );
}
/* ============================================================
   APP
   ============================================================ */
const NAV = [

  { key: "vendas", label: "Vendas / PDV", icon: ShoppingCart },
  { key: "estoque", label: "Estoque", icon: Package },
  { key: "os", label: "Ordens de Serviço", icon: Wrench },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "fornecedores", label: "Fornecedores", icon: Phone },
  { key: "financeiro", label: "Financeiro", icon: DollarSign },
  { key: "dashboard", label: "Faturamento do dia", icon: LayoutDashboard },
  { key: "financeiro-mensal", label: "Financeiro Mensal", icon: TrendingUp },
  { key: "contas-despesas", label: "Contas e Despesas", icon: TrendingDown },
];

const TITLES = {
  dashboard: ["Faturamento do dia", "Vendas, caixa e movimentações de hoje"],
  vendas: ["Vendas / PDV", "Frente de caixa e controle de caixa"],
  estoque: ["Estoque", "Produtos, acessórios e aparelhos"],
  os: ["Ordens de Serviço", "Assistência técnica e reparos"],
  clientes: ["Clientes", "Cadastro e histórico"],
  fornecedores: ["Fornecedores", "Contatos e cadastro de fornecedores"],
  financeiro: ["Financeiro", "Fluxo de caixa e relatórios"],
  "financeiro-mensal": ["Financeiro Mensal", "Relatório completo do mês"],
  "contas-despesas": ["Contas e Despesas", "Fornecedores, contas e despesas da loja"],
};
export default function App() {
  const { data, update, loaded } = useStore();
  const [view, setView] = useState("vendas");
  const [toast, setToast] = useState(null);
  const notify = (msg) => setToast(msg);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = async () => {
    await signOut(auth);
    setLoggedIn(false);
  };
  const openCash = data.cashRegisters.find((c) => c.status === "aberto");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeNameDraft, setStoreNameDraft] = useState(data.storeConfig.name);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => { setStoreNameDraft(data.storeConfig.name); }, [data.storeConfig.name]);

  const saveStoreName = () => {
    update("storeConfig", { name: storeNameDraft.trim() || "Minha Loja" });
    setSettingsOpen(false);
    notify("Nome da loja atualizado");
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-faint)" }}>
        Carregando...
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  return (
    <div className="app-root">
      <style>{STYLES}</style>

      <aside className={"sidebar" + (sidebarCollapsed ? " collapsed" : "")}>
        <div className="brand" style={{ padding: "6px 4px 22px 4px", overflow: "hidden", height: sidebarCollapsed ? 40 : 60 }}>
          <img
            src="/logo.png"
            alt="Davi Celulares"
            style={{
              height: sidebarCollapsed ? 100 : 150,
              width: "auto",
              maxWidth: "none",
              objectFit: "contain",
              transform: sidebarCollapsed ? "scale(1) translateX(-10px)" : "scale(1)",
            }}
          />
        </div>
        <nav className="nav-group">
          {NAV.map((item) => (
            <div key={item.key} className={"nav-item" + (view === item.key ? " active" : "")} onClick={() => setView(item.key)} title={sidebarCollapsed ? item.label : undefined}>
              <item.icon size={17} />
              {!sidebarCollapsed && item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed((v) => !v)} title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
          <ChevronRight size={15} style={{ transform: sidebarCollapsed ? "none" : "rotate(180deg)" }} />
        </div>
        <div className="sidebar-footer" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={"led " + (openCash ? "on" : "off")} />
            {!sidebarCollapsed && (
              <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                {openCash ? "CAIXA ABERTO" : "CAIXA FECHADO"}
              </span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: sidebarCollapsed ? "center" : "flex-start" }} onClick={handleLogout} title="Sair">
            <Lock size={14} /> {!sidebarCollapsed && "Sair"}
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <h1>{TITLES[view][0]}</h1>
            <div className="topbar-sub">{TITLES[view][1]}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setSettingsOpen(true)}>{data.storeConfig.name}</button>
        </div>
       <div className="content">
          {!loaded ? (
            <div style={{ color: "var(--text-faint)", padding: 40, textAlign: "center" }}>Carregando dados...</div>
          ) : (
            <>
              {view === "dashboard" && <Dashboard data={data} setView={setView} />}
              {view === "vendas" && <VendasPDV data={data} update={update} notify={notify} storeName={data.storeConfig.name} />}
              {view === "estoque" && <Estoque data={data} update={update} notify={notify} />}
              {view === "os" && <OrdensServico data={data} update={update} notify={notify} />}
              {view === "clientes" && <Clientes data={data} update={update} notify={notify} />}
              {view === "fornecedores" && <Fornecedores data={data} update={update} notify={notify} />}
              {view === "financeiro" && <Financeiro data={data} update={update} notify={notify} />}
              {view === "financeiro-mensal" && <FinanceiroMensal data={data} />}
              {view === "contas-despesas" && <ContasDespesas data={data} update={update} notify={notify} />}
            </>
          )}
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-faint)", marginTop: 30, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
            © Desenvolvido por Deivid Lima
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {settingsOpen && (
        <Modal title="Configurações da loja" onClose={() => setSettingsOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setSettingsOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveStoreName}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome da loja (aparece no comprovante de venda)">
            <input className="input" value={storeNameDraft} onChange={(e) => setStoreNameDraft(e.target.value)} placeholder="Ex: TechPhone Celulares" />
          </Field>
        </Modal>
      )}
    </div>
  );
}
