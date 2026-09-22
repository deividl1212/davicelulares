import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Wrench, Users, DollarSign,
  Plus, Trash2, X, Search, Lock, Unlock, AlertTriangle, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Receipt, ChevronRight,
  Minus, Save, TrendingDown, TrendingUp, Phone, Edit2, Building2, FileText,
  Wallet, Eye, Share2, Smartphone,
} from "lucide-react";
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  collection, getDocs, doc, getDoc, setDoc, writeBatch,
} from "firebase/firestore";

/* ============================================================
   DESIGN TOKENS — "Sistema de Teste"
   Paleta neutra: fundo branco, texto grafite, único acento
   discreto (azul-ardósia). Sem cores vibrantes.
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
    --accent: #FFB020;
    --accent-dim: #7A5A1E;
    --green: #34C77B;
    --red: #FF5C5C;
    --amber: #FFB020;
    --font-display: 'Space Grotesk', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  html, body { margin: 0; padding: 0; background: var(--bg); height: 100%; }
  * { box-sizing: border-box; }
  .app-root {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    font-size: 14px;
  }
  ::selection { background: var(--surface-3); color: var(--text); }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .sidebar {
    width: 232px; flex-shrink: 0; background: var(--surface);
    border-right: none;
    display: flex; flex-direction: column; padding: 20px 12px;
    position: relative; transition: width .15s ease;
  }
  .sidebar.collapsed { width: 68px; padding: 20px 10px; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 10px; }
  .sidebar-collapse-btn {
    position: absolute; top: 24px; right: -12px; width: 24px; height: 24px;
    border-radius: 50%; background: var(--surface); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    color: var(--text-dim); z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .sidebar-collapse-btn:hover { background: var(--surface-2); color: var(--text); }
  .brand { display: flex; align-items: center; gap: 10px; padding: 6px 10px 22px 10px; }
  .brand-mark {
    width: 34px; height: 34px; border-radius: 8px; background: linear-gradient(135deg, var(--amber), #B87616);
    display: flex; align-items: center; justify-content: center; color: #17140B; flex-shrink: 0;
  }
  .brand-name { font-family: var(--font-display); font-weight: 600; font-size: 15px; line-height: 1.2; }
  .brand-sub { font-size: 10.5px; color: var(--text-faint); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.06em; }
  .nav-group { display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 7px;
    color: var(--text-dim); cursor: pointer; font-size: 13.5px; font-weight: 500;
    border: 1px solid transparent; transition: background .12s, color .12s; user-select: none;
  }
  .nav-item:hover { background: var(--surface-2); color: var(--text); }
  .nav-item.active { background: var(--surface-2); color: var(--accent); border-color: var(--border); font-weight: 600; }
  .nav-item svg { flex-shrink: 0; }
  .sidebar-footer { margin-top: auto; padding: 12px 10px 4px 10px; border-top: 1px solid var(--border-soft); display: flex; align-items: center; gap: 8px; }
  .led { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .led.on { background: var(--green); }
  .led.off { background: var(--text-faint); }

  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .topbar { height: 60px; border-bottom: none; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; flex-shrink: 0; }
  .topbar h1 { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin: 0; }
  .topbar-sub { font-size: 12px; color: var(--text-faint); margin-top: 2px; }
  .content { padding: 26px 28px 60px 28px; overflow-y: auto; flex: 1; }

  .grid { display: grid; gap: 16px; }
  .card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: 12px; padding: 14px 16px; }
  .card-title { font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 14px 0; display: flex; align-items: center; justify-content: space-between; }
  .stat-card { display: flex; flex-direction: column; gap: 4px; }
  .stat-label { font-size: 12px; color: var(--text-faint); font-weight: 500; }
  .stat-value { font-family: var(--font-mono); font-size: 22px; font-weight: 600; color: var(--text); }
  .stat-value.green { color: var(--green); }
  .stat-value.red { color: var(--red); }
  .stat-foot { font-size: 11.5px; color: var(--text-faint); display: flex; align-items: center; gap: 5px; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; padding: 9px 15px; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: var(--font-body); cursor: pointer; border: 1px solid transparent; transition: filter .12s, background .12s; white-space: nowrap; }
  .btn:active { filter: brightness(0.94); }
  .btn-primary { background: var(--accent); color: #1A1406; }
  .btn-primary:hover { filter: brightness(1.08); }
  .btn-secondary { background: var(--surface-2); color: var(--text); border-color: var(--border); }
  .btn-secondary:hover { background: var(--surface-3); }
  .btn-danger { background: #FBEAE6; color: var(--red); border-color: #F0D2CB; }
  .btn-danger:hover { background: #F6DDD5; }
  .btn-ghost { background: transparent; color: var(--text-dim); }
  .btn-ghost:hover { background: var(--surface-2); color: var(--text); }
  .btn-sm { padding: 6px 10px; font-size: 12px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .input, select.input, textarea.input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; padding: 9px 11px; color: var(--text); font-size: 13px; font-family: var(--font-body); outline: none; }
  .input::placeholder { color: var(--text-faint); }
  .input:focus { border-color: var(--accent); }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 12px; color: var(--text-dim); font-weight: 500; }
  .field-row { display: grid; gap: 12px; }

  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); font-weight: 600; padding: 8px 12px; border-bottom: 1px solid var(--border-soft); }
  td { padding: 11px 12px; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface-2); }
  .mono { font-family: var(--font-mono); }

  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 100px; font-size: 11px; font-weight: 600; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.03em; }
  .badge.accent { background: rgba(255,176,32,0.12); color: var(--accent); }
  .badge.green { background: rgba(52,199,123,0.12); color: var(--green); }
  .badge.red { background: rgba(255,92,92,0.12); color: var(--red); }
  .badge.amber { background: rgba(255,176,32,0.12); color: var(--amber); }
  .badge.gray { background: var(--surface-3); color: var(--text-dim); }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 50px 20px; color: var(--text-faint); gap: 10px; text-align: center; }
  .empty-state svg { opacity: 0.35; }
  .empty-state .t { font-size: 13.5px; color: var(--text-dim); font-weight: 500; }
  .empty-state .s { font-size: 12px; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(24,24,27,0.4); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; width: 100%; max-width: 480px; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.12); }
  .modal.wide { max-width: 660px; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--border-soft); flex-shrink: 0; }
  .modal-header h3 { margin: 0; font-family: var(--font-display); font-size: 16px; font-weight: 600; }
  .modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
  .modal-footer { padding: 16px 20px; border-top: 1px solid var(--border-soft); display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; }

  .search-box { position: relative; }
  .search-box svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-faint); }
  .search-box input { padding-left: 34px; }

  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .toolbar-left { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 220px; }

  .checklist-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--surface-2); border-radius: 8px; border: 1px solid var(--border-soft); }
  .toast { position: fixed; bottom: 24px; right: 24px; z-index: 100; background: var(--accent); color: #000000; border-radius: 10px; padding: 12px 18px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
  .cart-line { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--border-soft); }
  .qty-btn { width: 22px; height: 22px; border-radius: 5px; background: var(--surface-2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); }
  .qty-btn:hover { background: var(--surface-3); }
  .tab-pills { display: flex; gap: 6px; background: var(--surface-2); padding: 4px; border-radius: 9px; width: fit-content; }
  .tab-pill { padding: 6px 13px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; color: var(--text-dim); }
  .tab-pill.active { background: var(--surface-3); color: var(--accent); }

  @media (max-width: 768px) {
    .app-root { flex-direction: column; }
    .sidebar { width: 100% !important; height: auto; flex-direction: row; align-items: center; padding: 10px 14px; overflow-x: auto; border-right: none; border-bottom: none; }
    .sidebar-collapse-btn { display: none; }
    .brand { padding: 0; margin-right: 10px; flex-shrink: 0; }
    .nav-group { flex-direction: row; margin-top: 0; gap: 4px; overflow-x: auto; }
    .nav-item { flex-shrink: 0; padding: 8px 10px; font-size: 12.5px; white-space: nowrap; }
    .sidebar-footer { display: none; }
    .topbar { padding: 0 14px; height: auto; flex-wrap: wrap; gap: 8px; padding-top: 12px; padding-bottom: 12px; }
    .content { padding: 16px 14px 40px 14px; }
    .grid[style*="repeat"] { grid-template-columns: 1fr !important; }
    .grid[style*="1fr 1fr"], .grid[style*="1.4fr 1fr"] { grid-template-columns: 1fr !important; }
    table { display: block; overflow-x: auto; white-space: nowrap; }
    .modal, .modal.wide { max-width: 96vw; margin: 0 8px; }
    .toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
    .toolbar-left { flex-direction: column; align-items: stretch; }
  }

  @media print {
    body * { visibility: hidden; }
    .printable-report, .printable-report *,
    .printable-receipt, .printable-receipt * { visibility: visible; }
    .printable-report { position: absolute; left: 0; top: 0; width: 100%; page: report-page; }
    .printable-receipt { position: absolute; left: 0; top: 0; width: 80mm; page: receipt-page; }
    .printable-report, .printable-report *,
    .printable-receipt, .printable-receipt * { color: #000000 !important; background: #ffffff !important; border-color: #cccccc !important; box-shadow: none !important; }

    /* Evita que o limite de altura do modal (rolagem na tela) corte/duplique
       o conteúdo do relatório ao paginar a impressão. */
    .modal, .modal-body, .modal-overlay { max-height: none !important; overflow: visible !important; height: auto !important; }

    .printable-report { font-size: 10px !important; }
    .printable-report .card { padding: 6px 8px !important; border-radius: 4px !important; }
    .printable-report .card-title { font-size: 9px !important; margin: 0 0 4px 0 !important; }
    .printable-report .stat-label { font-size: 8px !important; }
    .printable-report .stat-value { font-size: 11px !important; }
    .printable-report .stat-foot { font-size: 7.5px !important; }
    .printable-report .grid { gap: 6px !important; margin-bottom: 8px !important; }
    .printable-report table th, .printable-report table td { padding: 2px 5px !important; font-size: 8.5px !important; }
    .printable-report table th { font-size: 7.5px !important; }

    .printable-receipt { padding: 0 !important; border: none !important; border-radius: 0 !important; font-size: 10.5px !important; }
    .printable-receipt table th, .printable-receipt table td { padding: 3px 2px !important; font-size: 10px !important; }
  }
  @page report-page { size: A4; margin: 10mm; }
  @page receipt-page { size: 80mm auto; margin: 3mm; }

  @keyframes slideInRight {
    from { transform: translateX(24px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
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
const genProductCode = (existingProducts) => {
  let code;
  do {
    code = "P" + String(Math.floor(1000 + Math.random() * 9000));
  } while (existingProducts.some((p) => p.code === code));
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
const daysUntil = (iso) => {
  const due = new Date(iso);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

const PAYMENT_LABELS = { dinheiro: "Dinheiro", pix: "Pix", credito: "Cartão Crédito", debito: "Cartão Débito", crediario: "Crediário" };
const RECEIVABLE_PAYMENT_METHODS = { pix: "Pix", dinheiro: "Dinheiro", debito: "Cartão Débito", credito: "Cartão Crédito" };
const CREDIARIO_PRAZOS = [15, 30, 45, 60, 90];
const OS_STATUS = {
  aguardando_peca: { label: "Aguardando peça", color: "amber" },
  em_reparo: { label: "Em reparo", color: "accent" },
  entregue: { label: "Entregue", color: "green" },
};
const PRODUCT_CATEGORIES = ["Geral", "Acessório", "Peça de reposição", "Eletrônicos"];

/* ============================================================
   STORAGE HOOK — mesma arquitetura do sistema original
   ============================================================ */
const FIRESTORE_COLLECTIONS = ["products", "customers", "serviceOrders", "cashRegisters", "sales", "financeEntries", "suppliers", "crediarioAccounts", "crediarioPayments", "filmCompat"];

function useStore() {
  const [data, setData] = useState({
    products: [], customers: [], serviceOrders: [], cashRegisters: [], sales: [], financeEntries: [], suppliers: [],
    crediarioAccounts: [], crediarioPayments: [], filmCompat: [],
    storeConfig: { name: "Sistema de Teste" },
    categories: PRODUCT_CATEGORIES,
  });
  const [loaded, setLoaded] = useState(false);

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
        result.storeConfig = snap.exists() ? snap.data().value : { name: "Sistema de Teste" };
      } catch (e) {
        result.storeConfig = { name: "Sistema de Teste" };
      }
      try {
        const snapCat = await getDoc(doc(db, "config", "categories"));
        result.categories = snapCat.exists() && Array.isArray(snapCat.data().value) && snapCat.data().value.length ? snapCat.data().value : PRODUCT_CATEGORIES;
      } catch (e) {
        result.categories = PRODUCT_CATEGORIES;
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
      })();
      return { ...prev, [key]: nextVal };
    });
  }, [persistCollection]);

  return { data, update, loaded };
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
  return <div className="empty-state">{icon}<div className="t">{title}</div>{sub && <div className="s">{sub}</div>}</div>;
}
function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast"><CheckCircle2 size={16} />{message}</div>;
}
function ReportModal({ title, storeName, onClose, children }) {
  return (
    <Modal title={title} onClose={onClose} wide
      footer={<>
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
        <button className="btn btn-primary" onClick={() => window.print()}><FileText size={14} /> Gerar relatório</button>
      </>}>
      <div className="printable-report">
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{storeName}</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{title} — {new Date().toLocaleDateString("pt-BR")}</div>
        </div>
        {children}
      </div>
    </Modal>
  );
}
function ReportButton({ onClick }) {
  return <button className="btn btn-secondary" onClick={onClick}><FileText size={15} /> Gerar relatório</button>;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ data, setView }) {
  const [reportOpen, setReportOpen] = useState(false);
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
  const pendingOS = data.serviceOrders.filter((o) => o.status !== "entregue");
  const todayExpenses = data.financeEntries.filter((f) => f.type === "pagar" && f.status === "pago" && f.paidAt && isRefDay(f.paidAt));
  const todayExpensesTotal = todayExpenses.reduce((sum, f) => sum + f.amount, 0);

  const byPaymentToday = { pix: 0, credito: 0, debito: 0, dinheiro: 0, crediario: 0 };
  todaySales.forEach((s) => { byPaymentToday[s.paymentMethod] = (byPaymentToday[s.paymentMethod] || 0) + s.total; });

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
        <ReportButton onClick={() => setReportOpen(true)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="stat-label">Vendas hoje</div>
          <div className="stat-value">{brl(todayTotal)}</div>
          <div className="stat-foot"><Receipt size={12} /> {todaySales.length} venda{todaySales.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Status do caixa</div>
          <div className="stat-value" style={{ color: openCash ? "var(--green)" : "var(--text-faint)" }}>{openCash ? "Aberto" : "Fechado"}</div>
          <div className="stat-foot">{openCash ? `desde ${fmtDateTime(openCash.openedAt)}` : "nenhum caixa aberto"}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Gastos hoje</div>
          <div className="stat-value red">{brl(todayExpensesTotal)}</div>
          <div className="stat-foot"><TrendingDown size={12} /> {todayExpenses.length} pagamento{todayExpenses.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
        {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
          <div className="card stat-card" key={k}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{brl(byPaymentToday[k])}</div>
            <div className="stat-foot"><Receipt size={12} /> {todaySales.filter((s) => s.paymentMethod === k).length} venda{todaySales.filter((s) => s.paymentMethod === k).length !== 1 ? "s" : ""}</div>
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
                      <td className="mono">{brl(i.lineTotal)}</td>
                      {idx === 0 && (<>
                        <td rowSpan={s.items.length}><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                        <td rowSpan={s.items.length}>{s.customerName || "—"}</td>
                      </>)}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reportOpen && (
        <ReportModal title="Relatório do dia" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Vendas hoje</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(todayTotal)}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Status do caixa</div><div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{openCash ? "Aberto" : "Fechado"}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Gastos hoje</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(todayExpensesTotal)}</div></div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Vendas por forma de pagamento</div>
            <table><tbody>
              {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                <tr key={k}><td>{label}</td><td className="mono" style={{ textAlign: "right" }}>{brl(byPaymentToday[k])}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Vendas do dia ({todaySales.length})</div>
            {todaySales.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda registrada.</div> : (
              <table>
                <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {todaySales.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{fmtDateTime(s.createdAt).split(" ")[1]}</td>
                      <td>{s.items.map((i) => `${i.qty || 1}x ${i.name}`).join(", ")}</td>
                      <td>{s.customerName || "—"}</td>
                      <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                      <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </ReportModal>
      )}
    </div>
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
  const [customerName, setCustomerName] = useState("");
  const [installments, setInstallments] = useState(1);
  const [cashReceived, setCashReceived] = useState("");
  const [entradaCrediario, setEntradaCrediario] = useState("");
  const [prazoCrediario, setPrazoCrediario] = useState(30);
  const [parcelasCrediario, setParcelasCrediario] = useState(1);
  const [movModal, setMovModal] = useState(null);
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);
  const [viewReceiptSale, setViewReceiptSale] = useState(null);
  const [deleteSaleId, setDeleteSaleId] = useState(null);

  const recentSales = useMemo(() => [...data.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8), [data.sales]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return data.products.filter((p) => p.qty > 0 && p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, data.products]);

  const matchedOS = useMemo(() => {
    const q = search.trim();
    if (!/^\d{4}$/.test(q)) return null;
    return data.serviceOrders.find((o) => o.osCode === q) || null;
  }, [search, data.serviceOrders]);

  const addOSToCart = (os) => {
    setCart((c) => {
      if (c.some((i) => i.osId === os.id)) return c;
      return [...c, { productId: "os-" + os.id, name: `OS #${os.osCode} — ${os.device}`, price: os.budget, qty: 1, maxQty: 1, osId: os.id }];
    });
    setSearch("");
  };

  const addToCart = (product) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.qty >= product.qty) return c;
        return c.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...c, { productId: product.id, name: product.name, price: product.price, qty: 1, maxQty: product.qty }];
    });
    setSearch("");
  };
  const changeQty = (productId, delta) => {
    setCart((c) => c.map((i) => i.productId === productId ? { ...i, qty: Math.max(1, Math.min(i.maxQty, i.qty + delta)) } : i));
  };
  const removeFromCart = (productId) => setCart((c) => c.filter((i) => i.productId !== productId));
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cashReceivedValue = parseFloat(String(cashReceived).replace(",", ".")) || 0;
  const trocoValue = payment === "dinheiro" ? Math.max(0, cashReceivedValue - cartTotal) : 0;
  const entradaValue = Math.min(cartTotal, Math.max(0, parseFloat(String(entradaCrediario).replace(",", ".")) || 0));
  const saldoCrediario = Math.max(0, cartTotal - entradaValue);

  const handleOpenCash = () => {
    const amount = parseFloat(openAmount.replace(",", ".")) || 0;
    update("cashRegisters", (arr) => [...arr, { id: uid(), openedAt: now(), closedAt: null, openingAmount: amount, status: "aberto", withdrawals: [], reinforcements: [] }]);
    setOpenAmount("");
    notify("Caixa aberto com sucesso");
  };

  const finalizeSale = () => {
    if (!cart.length || !openCash) return;
    if (payment === "dinheiro" && cashReceivedValue < cartTotal) return;
    const saleId = uid();
    const isCrediario = payment === "crediario";
    const criaPromissoria = isCrediario && saldoCrediario > 0.009;
    const sale = {
      id: saleId, cashRegisterId: openCash.id,
      items: cart.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price, lineTotal: i.price * i.qty })),
      total: isCrediario ? entradaValue : cartTotal,
      paymentMethod: payment,
      installments: payment === "credito" ? installments : null,
      cashReceived: payment === "dinheiro" ? cashReceivedValue : null,
      troco: payment === "dinheiro" ? trocoValue : null,
      crediarioTotal: isCrediario ? cartTotal : null,
      crediarioEntrada: isCrediario ? entradaValue : null,
      crediarioAccountId: null,
      customerName: customerName.trim() || null, createdAt: now(),
    };

    if (criaPromissoria) {
      const accountId = uid();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + prazoCrediario);
      sale.crediarioAccountId = accountId;
      const account = {
        id: accountId, saleId,
        customerId: null, customerNameFree: customerName.trim() || null,
        totalAmount: cartTotal, paidAmount: entradaValue, balance: saldoCrediario,
        status: "Pendente", termDays: prazoCrediario, installments: parcelasCrediario,
        dueDate: dueDate.toISOString(), createdAt: now(),
      };
      update("crediarioAccounts", (arr) => [...arr, account]);
    }

    update("sales", (arr) => [...arr, sale]);
    update("products", (arr) => arr.map((p) => {
      const item = cart.find((i) => i.productId === p.id);
      return item ? { ...p, qty: p.qty - item.qty } : p;
    }));
    const osIds = cart.filter((i) => i.osId).map((i) => i.osId);
    if (osIds.length) {
      update("serviceOrders", (arr) => arr.map((o) => (osIds.includes(o.id) ? { ...o, status: "entregue", updatedAt: now() } : o)));
    }
    setCart([]); setCustomerName(""); setPayment("dinheiro"); setInstallments(1); setCashReceived("");
    setEntradaCrediario(""); setPrazoCrediario(30); setParcelasCrediario(1);
    notify("Venda registrada: " + brl(cartTotal));
    setReceiptSale(sale);
  };

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

  const addMovement = () => {
    const amount = parseFloat(movAmount.replace(",", ".")) || 0;
    if (!amount || !openCash) return;
    const field = movModal === "sangria" ? "withdrawals" : "reinforcements";
    update("cashRegisters", (arr) => arr.map((c) => c.id === openCash.id ? { ...c, [field]: [...c[field], { id: uid(), amount, reason: movReason, at: now() }] } : c));
    setMovModal(null); setMovAmount(""); setMovReason("");
    notify(movModal === "sangria" ? "Sangria registrada" : "Reforço registrado");
  };

  const handleCloseCash = () => {
    update("cashRegisters", (arr) => arr.map((c) => c.id === openCash.id ? { ...c, status: "fechado", closedAt: now() } : c));
    notify("Caixa fechado");
  };

  if (!openCash) {
    return (
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="card-title">Abrir caixa</div>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0, marginBottom: 16 }}>Informe o valor inicial (fundo de troco) para começar a registrar vendas.</p>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <Field label="Valor de abertura (R$)"><input className="input" placeholder="0,00" value={openAmount} onChange={(e) => setOpenAmount(e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={handleOpenCash}><Unlock size={15} /> Abrir caixa</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left"><span className="badge green"><span className="led on" /> Caixa aberto — {fmtDateTime(openCash.openedAt)}</span></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setMovModal("reforco")}><ArrowUpCircle size={14} /> Reforço</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setMovModal("sangria")}><ArrowDownCircle size={14} /> Sangria</button>
          <button className="btn btn-sm" style={{ background: "var(--accent)", color: "#000000" }} onClick={handleCloseCash}><Lock size={14} /> Fechar caixa</button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card">
          <div className="card-title">Buscar produto</div>
          <div className="search-box"><Search size={15} /><input className="input" placeholder="Informar produto ou código da OS" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          {matchedOS && (
            <div style={{ marginTop: 10 }}>
              <div className="checklist-item" style={{ cursor: "pointer", borderColor: "var(--accent)" }} onClick={() => addOSToCart(matchedOS)}>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>OS #{matchedOS.osCode} — {matchedOS.device}</div><div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{matchedOS.defect}</div></div>
                <div className="mono" style={{ fontWeight: 600 }}>{brl(matchedOS.budget)}</div>
              </div>
            </div>
          )}
          {filteredProducts.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredProducts.map((p) => (
                <div key={p.id} className="checklist-item" style={{ cursor: "pointer" }} onClick={() => addToCart(p)}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div><div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{p.qty} em estoque</div></div>
                  <div className="mono" style={{ fontWeight: 600 }}>{brl(p.price)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="card-title" style={{ marginTop: 20 }}>Carrinho</div>
          {cart.length === 0 ? (
            <EmptyState icon={<ShoppingCart size={26} />} title="Carrinho vazio" sub="Busque um produto acima para adicionar" />
          ) : cart.map((i) => (
            <div className="cart-line" key={i.productId}>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{i.name}</div><div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>{brl(i.price)} / un.</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className="qty-btn" onClick={() => changeQty(i.productId, -1)}><Minus size={12} /></div>
                <span className="mono" style={{ width: 20, textAlign: "center" }}>{i.qty}</span>
                <div className="qty-btn" onClick={() => changeQty(i.productId, 1)}><Plus size={12} /></div>
              </div>
              <div className="mono" style={{ width: 80, textAlign: "right", fontWeight: 600 }}>{brl(i.price * i.qty)}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(i.productId)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Fechar venda</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome do cliente (opcional)"><input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: João da Silva" /></Field>
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
                    <span className="mono" style={{ color: "var(--text)" }}>{cashReceivedValue >= cartTotal ? brl(trocoValue) : "valor insuficiente"}</span>
                  </div>
                )}
              </Field>
            )}

            {payment === "credito" && (
              <Field label="Parcelas">
                <select className="input" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x {n > 1 ? `de ${brl(cartTotal / n)}` : "à vista"}</option>
                  ))}
                </select>
              </Field>
            )}

            {payment === "crediario" && (
              <>
                <Field label="Entrada agora (R$)">
                  <input className="input" value={entradaCrediario} onChange={(e) => setEntradaCrediario(e.target.value)} placeholder="0,00" />
                </Field>
                <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Prazo">
                    <select className="input" value={prazoCrediario} onChange={(e) => setPrazoCrediario(parseInt(e.target.value))}>
                      {CREDIARIO_PRAZOS.map((d) => <option key={d} value={d}>{d} dias</option>)}
                    </select>
                  </Field>
                  <Field label="Parcelas">
                    <select className="input" value={parcelasCrediario} onChange={(e) => setParcelasCrediario(parseInt(e.target.value))}>
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ color: "var(--text-dim)" }}>Saldo financiado</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{brl(saldoCrediario)}</span>
                </div>
              </>
            )}

            <div style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Total</span>
              <span className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{brl(cartTotal)}</span>
            </div>
            <button className="btn btn-primary" disabled={!cart.length || (payment === "dinheiro" && cashReceivedValue < cartTotal)} onClick={finalizeSale}><Receipt size={15} /> Finalizar venda</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Últimas compras</div>
        {recentSales.length === 0 ? <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda registrada ainda" /> : (
          <table>
            <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th><th></th></tr></thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s.id}>
                  <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(s.createdAt)}</td>
                  <td>{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                  <td>{s.customerName || "—"}</td>
                  <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewReceiptSale(s)} title="Ver comprovante"><Receipt size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteSaleId(s.id)} title="Excluir venda"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {movModal && (
        <Modal title={movModal === "sangria" ? "Registrar sangria" : "Registrar reforço"} onClose={() => setMovModal(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setMovModal(null)}>Cancelar</button><button className="btn btn-primary" onClick={addMovement}>Confirmar</button></>}>
          <Field label="Valor (R$)"><input className="input" value={movAmount} onChange={(e) => setMovAmount(e.target.value)} placeholder="0,00" /></Field>
          <Field label="Motivo"><input className="input" value={movReason} onChange={(e) => setMovReason(e.target.value)} placeholder="Opcional" /></Field>
        </Modal>
      )}
      {deleteSaleId && (
        <Modal title="Excluir venda" onClose={() => setDeleteSaleId(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setDeleteSaleId(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => handleDeleteSale(deleteSaleId)}>Excluir</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Essa venda será removida do histórico e os produtos voltarão para o estoque. Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
      {receiptSale && <ReceiptModal sale={receiptSale} storeName={storeName} onClose={() => setReceiptSale(null)} />}
      {viewReceiptSale && <ReceiptModal sale={viewReceiptSale} storeName={storeName} onClose={() => setViewReceiptSale(null)} />}
    </div>
  );
}

function ReceiptModal({ sale, storeName, onClose }) {
  const dt = new Date(sale.createdAt);
  return (
    <Modal title="Comprovante de venda" onClose={onClose}
      footer={<><button className="btn btn-secondary" onClick={() => window.print()}>Imprimir</button><button className="btn btn-primary" onClick={onClose}>Concluir</button></>}>
      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", borderRadius: 10, padding: 18 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{storeName}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Comprovante de venda</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)", borderBottom: "1px dashed var(--border)", paddingBottom: 10, marginBottom: 10 }}>
          <span>Data: <span className="mono">{dt.toLocaleDateString("pt-BR")}</span></span>
          <span>Hora: <span className="mono">{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></span>
        </div>
        {sale.customerName && <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>Cliente: {sale.customerName}</div>}
        <table>
          <thead><tr><th>Produto</th><th style={{ textAlign: "right" }}>Preço</th><th style={{ textAlign: "right" }}>Qtd.</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.productId}>
                <td>{i.name}</td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(i.price)}</td>
                <td className="mono" style={{ textAlign: "right" }}>{i.qty}</td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{sale.paymentMethod === "crediario" ? "Total da compra" : "Total pago"}</span>
          <span className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{brl(sale.paymentMethod === "crediario" ? sale.crediarioTotal : sale.total)}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-faint)" }}>
          <div>Forma de pagamento: {PAYMENT_LABELS[sale.paymentMethod]}{sale.installments > 1 ? ` — ${sale.installments}x de ${brl(sale.total / sale.installments)}` : ""}</div>
          {sale.paymentMethod === "dinheiro" && sale.cashReceived != null && (
            <>
              <div style={{ marginTop: 4 }}>Valor recebido: <span className="mono">{brl(sale.cashReceived)}</span></div>
              <div>Troco: <span className="mono">{brl(sale.troco)}</span></div>
            </>
          )}
          {sale.paymentMethod === "crediario" && (
            <>
              <div style={{ marginTop: 4 }}>Entrada paga agora: <span className="mono">{brl(sale.crediarioEntrada)}</span></div>
              <div>Saldo financiado: <span className="mono" style={{ color: sale.crediarioTotal - sale.crediarioEntrada > 0.009 ? "var(--red)" : "var(--green)" }}>{brl(Math.max(0, sale.crediarioTotal - sale.crediarioEntrada))}</span></div>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--border)", fontSize: 11.5, color: "var(--text-dim)" }}>
          Obrigado pela preferência, volte sempre!
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   ESTOQUE
   ============================================================ */
function Estoque({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [confirmDel, setConfirmDel] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const empty = { name: "", category: "Geral", sku: "", price: "", cost: "", qty: "", minQty: "2" };
  const [form, setForm] = useState(empty);

  const categoriesList = data.categories && data.categories.length ? data.categories : PRODUCT_CATEGORIES;

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (p) => { setForm(p); setEditing(p.id); setModalOpen(true); };

  const confirmNewCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!categoriesList.includes(name)) {
      update("categories", () => [...categoriesList, name]);
    }
    setForm({ ...form, category: name });
    setNewCategoryName("");
    setAddingCategory(false);
  };

  const save = () => {
    if (!form.name.trim()) return;
    const payload = {
      id: editing || uid(), code: editing ? form.code : genProductCode(data.products),
      name: form.name, category: form.category, sku: form.sku,
      price: parseFloat(String(form.price).replace(",", ".")) || 0,
      cost: parseFloat(String(form.cost).replace(",", ".")) || 0,
      qty: parseInt(form.qty) || 0, minQty: parseInt(form.minQty) || 0,
    };
    if (editing) { update("products", (arr) => arr.map((p) => (p.id === editing ? payload : p))); notify("Produto atualizado"); }
    else { update("products", (arr) => [...arr, payload]); notify("Produto cadastrado — código " + payload.code); }
    setModalOpen(false);
  };
  const remove = (id) => { update("products", (arr) => arr.filter((p) => p.id !== id)); setConfirmDel(null); notify("Produto removido"); };

  const filtered = data.products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.code || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "todas" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box" style={{ maxWidth: 320 }}><Search size={15} /><input className="input" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="input" style={{ maxWidth: 200 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="todas">Todas as categorias</option>
            {categoriesList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReportButton onClick={() => setReportOpen(true)} />
          <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo produto</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 30 }}><EmptyState icon={<Package size={28} />} title="Nenhum produto cadastrado" /></div> : (
          <table>
            <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Custo</th><th>Preço</th><th>Qtd.</th><th></th></tr></thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.qty <= p.minQty;
                return (
                  <tr key={p.id}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{p.code || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge gray">{p.category}</span></td>
                    <td className="mono">{brl(p.cost)}</td>
                    <td className="mono">{brl(p.price)}</td>
                    <td><span className={"badge " + (low ? "red" : "green")}>{low && <AlertTriangle size={11} />} {p.qty} un.</span></td>
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
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome do produto"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Categoria">
              {!addingCategory ? (
                <select className="input" value={form.category} onChange={(e) => {
                  if (e.target.value === "__add__") { setAddingCategory(true); }
                  else { setForm({ ...form, category: e.target.value }); }
                }}>
                  {categoriesList.map((c) => <option key={c}>{c}</option>)}
                  <option value="__add__">+ Adicionar categoria...</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input className="input" autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da nova categoria" onKeyDown={(e) => e.key === "Enter" && confirmNewCategory()} />
                  <button className="btn btn-secondary btn-sm" onClick={confirmNewCategory}><Plus size={14} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }}><X size={14} /></button>
                </div>
              )}
            </Field>
            <Field label="SKU"><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          </div>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Custo (R$)"><input className="input" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0,00" /></Field>
            <Field label="Preço de venda (R$)"><input className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" /></Field>
          </div>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Quantidade em estoque"><input className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" /></Field>
            <Field label="Estoque mínimo"><input className="input" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} placeholder="2" /></Field>
          </div>
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Remover produto" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover este produto? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
      {reportOpen && (
        <ReportModal title="Relatório de estoque" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          {data.products.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum produto cadastrado.</div> : (
            <table>
              <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th style={{ textAlign: "right" }}>Custo</th><th style={{ textAlign: "right" }}>Preço</th><th style={{ textAlign: "right" }}>Qtd.</th></tr></thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.code || "—"}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(p.cost)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(p.price)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportModal>
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
  const empty = { customerName: "", device: "", defect: "", budget: "", status: "aguardando_peca" };
  const [form, setForm] = useState(empty);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const save = () => {
    if (!form.device.trim() || !form.defect.trim()) return;
    const os = { id: uid(), osCode: genOSCode(data.serviceOrders), ...form, budget: parseFloat(String(form.budget).replace(",", ".")) || 0, createdAt: now(), updatedAt: now() };
    update("serviceOrders", (arr) => [os, ...arr]);
    setModalOpen(false); setForm(empty);
    notify("OS #" + os.osCode + " criada");
  };
  const setStatus = (id, status) => {
    update("serviceOrders", (arr) => arr.map((o) => (o.id === id ? { ...o, status, updatedAt: now() } : o)));
    notify("Status atualizado");
  };
  const remove = (id) => {
    update("serviceOrders", (arr) => arr.filter((o) => o.id !== id));
    setConfirmDel(null);
    setViewing(null);
    notify("Ordem de serviço removida");
  };
  const filtered = data.serviceOrders.filter((o) => filter === "todas" || o.status === filter);

  return (
    <div>
      <div className="toolbar">
        <div className="tab-pills">
          <div className={"tab-pill" + (filter === "todas" ? " active" : "")} onClick={() => setFilter("todas")}>Todas</div>
          {Object.entries(OS_STATUS).map(([k, v]) => <div key={k} className={"tab-pill" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{v.label}</div>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReportButton onClick={() => setReportOpen(true)} />
          <button className="btn btn-primary" onClick={() => { setForm(empty); setModalOpen(true); }}><Plus size={15} /> Nova ordem de serviço</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 30 }}><EmptyState icon={<Wrench size={28} />} title="Nenhuma OS encontrada" /></div> : (
          <table>
            <thead><tr><th>Código</th><th>Aparelho</th><th>Defeito</th><th>Cliente</th><th>Status</th><th>Entrada</th><th></th></tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="mono" style={{ fontWeight: 700 }}>{o.osCode}</td>
                  <td style={{ fontWeight: 600 }}>{o.device}</td>
                  <td style={{ maxWidth: 220, color: "var(--text-dim)" }}>{o.defect}</td>
                  <td>{o.customerName || "—"}</td>
                  <td><span className={"badge " + OS_STATUS[o.status].color}>{OS_STATUS[o.status].label}</span></td>
                  <td style={{ color: "var(--text-faint)" }}>{fmtDate(o.createdAt)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewing(o)}>Detalhes <ChevronRight size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDel(o.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modalOpen && (
        <Modal title="Nova ordem de serviço" onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Abrir OS</button></>}>
          <Field label="Aparelho"><input className="input" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} placeholder="Ex: Notebook Dell G3" /></Field>
          <Field label="Cliente"><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Nome do cliente" /></Field>
          <Field label="Defeito relatado"><textarea className="input" rows={2} value={form.defect} onChange={(e) => setForm({ ...form, defect: e.target.value })} /></Field>
          <Field label="Orçamento estimado (R$)"><input className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0,00" /></Field>
        </Modal>
      )}
      {viewing && (
        <Modal title={viewing.device} onClose={() => setViewing(null)}
          footer={<>
            <button className="btn btn-danger" onClick={() => setConfirmDel(viewing.id)}><Trash2 size={14} /> Excluir</button>
            <button className="btn btn-secondary" onClick={() => setViewing(null)}>Fechar</button>
          </>}>
          <Field label="Código da OS (usar no PDV para fechar a venda)">
            <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{viewing.osCode}</div>
          </Field>
          <Field label="Status atual">
            <select className="input" value={viewing.status} onChange={(e) => { setStatus(viewing.id, e.target.value); setViewing({ ...viewing, status: e.target.value }); }}>
              {Object.entries(OS_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Cliente"><div style={{ fontSize: 13.5 }}>{viewing.customerName || "Não informado"}</div></Field>
          <Field label="Defeito relatado"><div style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{viewing.defect}</div></Field>
          <Field label="Orçamento"><div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{brl(viewing.budget)}</div></Field>
        </Modal>
      )}
      {confirmDel && (
        <Modal title="Remover ordem de serviço" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover esta ordem de serviço? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}
      {reportOpen && (
        <ReportModal title="Relatório de ordens de serviço" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          {data.serviceOrders.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma OS cadastrada.</div> : (
            <table>
              <thead><tr><th>Código</th><th>Aparelho</th><th>Cliente</th><th>Status</th><th>Entrada</th><th style={{ textAlign: "right" }}>Orçamento</th></tr></thead>
              <tbody>
                {data.serviceOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.osCode}</td>
                    <td>{o.device}</td>
                    <td>{o.customerName || "—"}</td>
                    <td>{OS_STATUS[o.status].label}</td>
                    <td className="mono">{fmtDate(o.createdAt)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(o.budget)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportModal>
      )}
    </div>
  );
}

/* ============================================================
   CLIENTES
   ============================================================ */
function Clientes({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const empty = { name: "", phone: "", notes: "" };
  const [form, setForm] = useState(empty);
  const save = () => { if (!form.name.trim()) return; update("customers", (arr) => [...arr, { id: uid(), ...form, createdAt: now() }]); setForm(empty); setModalOpen(false); notify("Cliente cadastrado"); };
  const filtered = data.customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left"><div className="search-box" style={{ maxWidth: 320 }}><Search size={15} /><input className="input" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReportButton onClick={() => setReportOpen(true)} />
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Novo cliente</button>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? <div style={{ padding: 30 }}><EmptyState icon={<Users size={28} />} title="Nenhum cliente cadastrado" /></div> : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Cadastrado em</th></tr></thead>
            <tbody>{filtered.map((c) => (<tr key={c.id}><td style={{ fontWeight: 600 }}>{c.name}</td><td className="mono">{c.phone || "—"}</td><td style={{ color: "var(--text-faint)" }}>{fmtDate(c.createdAt)}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      {modalOpen && (
        <Modal title="Novo cliente" onClose={() => setModalOpen(false)} footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome completo"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" /></Field>
        </Modal>
      )}
      {reportOpen && (
        <ReportModal title="Relatório de clientes" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          {data.customers.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum cliente cadastrado.</div> : (
            <table>
              <thead><tr><th>Nome</th><th>Telefone</th><th>Cadastrado em</th></tr></thead>
              <tbody>
                {data.customers.map((c) => (
                  <tr key={c.id}><td>{c.name}</td><td className="mono">{c.phone || "—"}</td><td className="mono">{fmtDate(c.createdAt)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportModal>
      )}
    </div>
  );
}

/* ============================================================
   FORNECEDORES
   ============================================================ */
function Fornecedores({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const empty = { name: "", phone: "", category: "" };
  const [form, setForm] = useState(empty);
  const save = () => { if (!form.name.trim()) return; update("suppliers", (arr) => [...arr, { id: uid(), ...form, createdAt: now() }]); setForm(empty); setModalOpen(false); notify("Fornecedor cadastrado"); };

  return (
    <div>
      <div className="toolbar"><div /><div style={{ display: "flex", gap: 8 }}><ReportButton onClick={() => setReportOpen(true)} /><button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={15} /> Novo fornecedor</button></div></div>
      <div className="card" style={{ padding: 0 }}>
        {data.suppliers.length === 0 ? <div style={{ padding: 30 }}><EmptyState icon={<Phone size={28} />} title="Nenhum fornecedor cadastrado" /></div> : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Categoria</th></tr></thead>
            <tbody>{data.suppliers.map((s) => (<tr key={s.id}><td style={{ fontWeight: 600 }}>{s.name}</td><td className="mono">{s.phone}</td><td>{s.category ? <span className="badge gray">{s.category}</span> : "—"}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      {modalOpen && (
        <Modal title="Novo fornecedor" onClose={() => setModalOpen(false)} footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Nome"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Telefone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Categoria"><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Peças, Acessórios" /></Field>
        </Modal>
      )}
      {reportOpen && (
        <ReportModal title="Relatório de fornecedores" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          {data.suppliers.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum fornecedor cadastrado.</div> : (
            <table>
              <thead><tr><th>Nome</th><th>Telefone</th><th>Categoria</th></tr></thead>
              <tbody>{data.suppliers.map((s) => (<tr key={s.id}><td>{s.name}</td><td className="mono">{s.phone}</td><td>{s.category || "—"}</td></tr>))}</tbody>
            </table>
          )}
        </ReportModal>
      )}
    </div>
  );
}

/* ============================================================
   FINANCEIRO
   ============================================================ */
/* ============================================================
   FINANCEIRO MENSAL
   ============================================================ */
function FinanceiroMensal({ data, update, notify }) {
  const [detail, setDetail] = useState(null); // 'total' | 'vendas' | 'os' | 'gastos' | null
  const [dayDetail, setDayDetail] = useState(null); // número do dia (1-31) | null
  const [reportOpen, setReportOpen] = useState(false);
  const [lancModalOpen, setLancModalOpen] = useState(false);
  const emptyLanc = { type: "receber", description: "", amount: "", dueDate: "" };
  const [lancForm, setLancForm] = useState(emptyLanc);

  const saveLanc = () => {
    if (!lancForm.description.trim() || !lancForm.amount) return;
    update("financeEntries", (arr) => [...arr, { id: uid(), ...lancForm, amount: parseFloat(String(lancForm.amount).replace(",", ".")) || 0, status: "pendente", paidAt: null, createdAt: now() }]);
    setLancForm(emptyLanc); setLancModalOpen(false); notify("Lançamento adicionado");
  };
  const markPaid = (id) => { update("financeEntries", (arr) => arr.map((f) => (f.id === id ? { ...f, status: "pago", paidAt: now() } : f))); notify("Lançamento baixado"); };
  const receivablesManual = data.financeEntries.filter((f) => f.type === "receber").map((f) => ({ id: f.id, description: f.description, amount: f.amount, isPago: f.status === "pago", isCrediario: false }));
  const receivablesCrediario = (data.crediarioAccounts || []).filter((a) => a.status === "Pendente").map((a) => ({ id: a.id, description: `Promissória — ${a.customerNameFree || "Cliente"}`, amount: a.balance, isPago: false, isCrediario: true }));
  const receivables = [...receivablesManual, ...receivablesCrediario];
  const payables = data.financeEntries.filter((f) => f.type === "pagar");

  const monthSales = useMemo(() => data.sales.filter((s) => isThisMonth(s.createdAt)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [data.sales]);

  const osRevenue = monthSales.reduce((sum, s) => sum + s.items.filter((i) => i.productId.startsWith("os-")).reduce((s2, i) => s2 + i.lineTotal, 0), 0);
  const productRevenue = monthSales.reduce((sum, s) => sum + s.total, 0) - osRevenue;
  const totalRevenue = productRevenue + osRevenue;

  const monthExpenses = useMemo(() => data.financeEntries.filter((f) => f.type === "pagar" && f.status === "pago" && f.paidAt && isThisMonth(f.paidAt)).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)), [data.financeEntries]);
  const monthExpensesTotal = monthExpenses.reduce((s, f) => s + f.amount, 0);

  const byPaymentMonth = { pix: 0, credito: 0, debito: 0, dinheiro: 0 };
  monthSales.forEach((s) => { byPaymentMonth[s.paymentMethod] = (byPaymentMonth[s.paymentMethod] || 0) + s.total; });

  const productLines = useMemo(() => {
    const lines = [];
    monthSales.forEach((s) => {
      s.items.filter((i) => !i.productId.startsWith("os-")).forEach((i) => {
        lines.push({ saleId: s.id, date: s.createdAt, name: i.name, qty: i.qty, total: i.lineTotal, payment: s.paymentMethod, customerName: s.customerName });
      });
    });
    return lines;
  }, [monthSales]);

  const osLines = useMemo(() => {
    const lines = [];
    monthSales.forEach((s) => {
      s.items.filter((i) => i.productId.startsWith("os-")).forEach((i) => {
        lines.push({ saleId: s.id, date: s.createdAt, name: i.name, total: i.lineTotal, payment: s.paymentMethod, customerName: s.customerName });
      });
    });
    return lines;
  }, [monthSales]);

  const productAgg = {};
  monthSales.forEach((s) => {
    s.items.filter((i) => !i.productId.startsWith("os-")).forEach((i) => {
      if (!productAgg[i.productId]) productAgg[i.productId] = { name: i.name, qty: 0, revenue: 0 };
      productAgg[i.productId].qty += i.qty;
      productAgg[i.productId].revenue += i.lineTotal;
    });
  });
  const topProducts = Object.values(productAgg).sort((a, b) => b.qty - a.qty).slice(0, 3);

  const now2 = new Date();
  const daysInMonth = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate();
  const byDay = Array.from({ length: daysInMonth }, () => 0);
  monthSales.forEach((s) => { byDay[new Date(s.createdAt).getDate() - 1] += s.total; });
  const maxDay = Math.max(1, ...byDay);

  const monthLabel = now2.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const daySales = useMemo(() => {
    if (!dayDetail) return [];
    return monthSales.filter((s) => new Date(s.createdAt).getDate() === dayDetail);
  }, [dayDetail, monthSales]);
  const dayTotal = daySales.reduce((s, v) => s + v.total, 0);

  return (
    <div>
      <div className="toolbar">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, textTransform: "capitalize" }}>{monthLabel}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setLancModalOpen(true)}><Plus size={15} /> Novo lançamento</button>
          <ReportButton onClick={() => setReportOpen(true)} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
        <div className="card stat-card" style={{ cursor: "pointer" }} onClick={() => setDetail("total")}>
          <div className="stat-label">Faturamento total</div>
          <div className="stat-value">{brl(totalRevenue)}</div>
          <div className="stat-foot"><Receipt size={12} /> {monthSales.length} venda{monthSales.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card" style={{ cursor: "pointer" }} onClick={() => setDetail("vendas")}>
          <div className="stat-label">Faturamento de vendas</div>
          <div className="stat-value">{brl(productRevenue)}</div>
          <div className="stat-foot"><Package size={12} /> produtos</div>
        </div>
        <div className="card stat-card" style={{ cursor: "pointer" }} onClick={() => setDetail("gastos")}>
          <div className="stat-label">Gastos</div>
          <div className="stat-value red">{brl(monthExpensesTotal)}</div>
          <div className="stat-foot"><TrendingDown size={12} /> {monthExpenses.length} pagamento{monthExpenses.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
          <div className="card stat-card" key={k}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{brl(byPaymentMonth[k])}</div>
            <div className="stat-foot"><Receipt size={12} /> {monthSales.filter((s) => s.paymentMethod === k).length} venda{monthSales.filter((s) => s.paymentMethod === k).length !== 1 ? "s" : ""}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.6fr" }}>
        <div className="card">
          <div className="card-title">Top 3 produtos mais vendidos</div>
          {topProducts.length === 0 ? (
            <EmptyState icon={<Package size={26} />} title="Nenhum produto vendido" />
          ) : (
            topProducts.map((p, idx) => (
              <div key={p.name + idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
                <span className="badge accent" style={{ minWidth: 22, justifyContent: "center" }}>{idx + 1}º</span>
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
          <div className="card-title">Vendas por dia do mês</div>
          {monthSales.length === 0 ? (
            <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda neste mês" />
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 140, paddingTop: 10 }}>
              {byDay.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: v > 0 ? "pointer" : "default" }} title={`Dia ${i + 1}: ${brl(v)}`} onClick={() => v > 0 && setDayDetail(i + 1)}>
                  <div style={{ width: "100%", maxWidth: 14, borderRadius: "3px 3px 0 0", height: `${(v / maxDay) * 100}%`, minHeight: v > 0 ? 2 : 0, background: v > 0 ? "var(--text)" : "var(--border-soft)" }} />
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

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-title" style={{ padding: "16px 16px 0 16px" }}>A receber</div>
          {receivables.length === 0 ? <div style={{ padding: 24 }}><EmptyState icon={<DollarSign size={24} />} title="Nada a receber" /></div> : (
            <table><tbody>{receivables.map((f) => (
              <tr key={f.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{f.description}</div>
                  {f.isCrediario && <span className="badge accent" style={{ marginTop: 3 }}>Crediário</span>}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td>
                <td><span className={"badge " + (f.isPago ? "gray" : "green")}>{f.isPago ? "Recebido" : "Pendente"}</span></td>
                <td style={{ textAlign: "right" }}>{!f.isPago && !f.isCrediario && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(f.id)}><CheckCircle2 size={13} /></button>}</td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-title" style={{ padding: "16px 16px 0 16px" }}>A pagar</div>
          {payables.length === 0 ? <div style={{ padding: 24 }}><EmptyState icon={<DollarSign size={24} />} title="Nada a pagar" /></div> : (
            <table><tbody>{payables.map((f) => (
              <tr key={f.id}>
                <td><div style={{ fontWeight: 600 }}>{f.description}</div></td>
                <td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td>
                <td><span className={"badge " + (f.status === "pago" ? "green" : "red")}>{f.status === "pago" ? "Pago" : "Pendente"}</span></td>
                <td style={{ textAlign: "right" }}>{f.status !== "pago" && <button className="btn btn-ghost btn-sm" onClick={() => markPaid(f.id)}><CheckCircle2 size={13} /></button>}</td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
      </div>

      {lancModalOpen && (
        <Modal title="Novo lançamento" onClose={() => setLancModalOpen(false)} footer={<><button className="btn btn-secondary" onClick={() => setLancModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={saveLanc}><Save size={14} /> Salvar</button></>}>
          <Field label="Tipo">
            <div className="tab-pills">
              <div className={"tab-pill" + (lancForm.type === "receber" ? " active" : "")} onClick={() => setLancForm({ ...lancForm, type: "receber" })}>A receber</div>
              <div className={"tab-pill" + (lancForm.type === "pagar" ? " active" : "")} onClick={() => setLancForm({ ...lancForm, type: "pagar" })}>A pagar</div>
            </div>
          </Field>
          <Field label="Descrição"><input className="input" value={lancForm.description} onChange={(e) => setLancForm({ ...lancForm, description: e.target.value })} /></Field>
          <Field label="Valor (R$)"><input className="input" value={lancForm.amount} onChange={(e) => setLancForm({ ...lancForm, amount: e.target.value })} placeholder="0,00" /></Field>
        </Modal>
      )}

      {detail === "total" && (
        <Modal title={`Faturamento total — ${brl(totalRevenue)}`} onClose={() => setDetail(null)} wide footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Fechar</button>}>
          {monthSales.length === 0 ? <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda neste mês" /> : (
            <table>
              <thead><tr><th>Data</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {monthSales.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(s.createdAt)}</td>
                    <td>{s.items.map((i) => `${i.qty || 1}x ${i.name}`).join(", ")}</td>
                    <td>{s.customerName || "—"}</td>
                    <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {detail === "vendas" && (
        <Modal title={`Faturamento de vendas — ${brl(productRevenue)}`} onClose={() => setDetail(null)} wide footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Fechar</button>}>
          {productLines.length === 0 ? <EmptyState icon={<Package size={26} />} title="Nenhum produto vendido neste mês" /> : (
            <table>
              <thead><tr><th>Data</th><th>Produto</th><th>Cliente</th><th style={{ textAlign: "right" }}>Qtd.</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {productLines.map((l, idx) => (
                  <tr key={l.saleId + "-" + idx}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(l.date)}</td>
                    <td>{l.name}</td>
                    <td>{l.customerName || "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{l.qty}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {detail === "os" && (
        <Modal title={`Faturamento em OS — ${brl(osRevenue)}`} onClose={() => setDetail(null)} wide footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Fechar</button>}>
          {osLines.length === 0 ? <EmptyState icon={<Wrench size={26} />} title="Nenhuma OS vendida neste mês" /> : (
            <table>
              <thead><tr><th>Data</th><th>Ordem de serviço</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {osLines.map((l, idx) => (
                  <tr key={l.saleId + "-" + idx}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(l.date)}</td>
                    <td>{l.name}</td>
                    <td>{l.customerName || "—"}</td>
                    <td><span className="badge gray">{PAYMENT_LABELS[l.payment]}</span></td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {detail === "gastos" && (
        <Modal title={`Gastos do mês — ${brl(monthExpensesTotal)}`} onClose={() => setDetail(null)} wide footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Fechar</button>}>
          {monthExpenses.length === 0 ? <EmptyState icon={<TrendingDown size={26} />} title="Nenhum gasto pago neste mês" /> : (
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
        </Modal>
      )}

      {dayDetail && (
        <Modal title={`Dia ${dayDetail} — ${brl(dayTotal)}`} onClose={() => setDayDetail(null)} wide footer={<button className="btn btn-secondary" onClick={() => setDayDetail(null)}>Fechar</button>}>
          {daySales.length === 0 ? <EmptyState icon={<Receipt size={26} />} title="Nenhuma venda neste dia" /> : (
            <table>
              <thead><tr><th>Hora</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {daySales.map((s) => (
                  <tr key={s.id}>
                    <td className="mono" style={{ color: "var(--text-faint)" }}>{fmtDateTime(s.createdAt).split(" ")[1]}</td>
                    <td>{s.items.map((i) => `${i.qty || 1}x ${i.name}`).join(", ")}</td>
                    <td>{s.customerName || "—"}</td>
                    <td><span className="badge gray">{PAYMENT_LABELS[s.paymentMethod]}</span></td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {reportOpen && (
        <ReportModal title="Relatório financeiro mensal" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Faturamento total</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(totalRevenue)}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Faturamento de vendas</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(productRevenue)}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Gastos</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(monthExpensesTotal)}</div></div>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Vendas por forma de pagamento</div>
            <table><tbody>
              {Object.entries(PAYMENT_LABELS).map(([k, label]) => (
                <tr key={k}><td>{label}</td><td className="mono" style={{ textAlign: "right" }}>{brl(byPaymentMonth[k])}</td></tr>
              ))}
            </tbody></table>
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Top 3 produtos mais vendidos</div>
            {topProducts.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum produto vendido.</div> : (
              <table><tbody>{topProducts.map((p, idx) => (
                <tr key={idx}><td>{idx + 1}º — {p.name}</td><td className="mono" style={{ textAlign: "right" }}>{p.qty} un.</td><td className="mono" style={{ textAlign: "right" }}>{brl(p.revenue)}</td></tr>
              ))}</tbody></table>
            )}
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Todas as vendas do mês ({monthSales.length})</div>
            {monthSales.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma venda neste mês.</div> : (
              <table>
                <thead><tr><th>Data</th><th>Itens</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {monthSales.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{fmtDateTime(s.createdAt)}</td>
                      <td>{s.items.map((i) => `${i.qty || 1}x ${i.name}`).join(", ")}</td>
                      <td>{s.customerName || "—"}</td>
                      <td>{PAYMENT_LABELS[s.paymentMethod]}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{brl(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Ordens de serviço vendidas no mês ({osLines.length})</div>
            {osLines.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma OS vendida neste mês.</div> : (
              <table>
                <thead><tr><th>Data</th><th>Ordem de serviço</th><th>Cliente</th><th>Pagamento</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
                <tbody>
                  {osLines.map((l, idx) => (
                    <tr key={l.saleId + "-" + idx}>
                      <td className="mono">{fmtDateTime(l.date)}</td>
                      <td>{l.name}</td>
                      <td>{l.customerName || "—"}</td>
                      <td>{PAYMENT_LABELS[l.payment]}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{brl(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card" style={{ padding: 14, marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Gastos pagos no mês ({monthExpenses.length})</div>
            {monthExpenses.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum gasto pago neste mês.</div> : (
              <table><tbody>{monthExpenses.map((f) => (
                <tr key={f.id}><td className="mono">{fmtDate(f.paidAt)}</td><td>{f.description}</td><td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td></tr>
              ))}</tbody></table>
            )}
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card" style={{ padding: 14 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>A receber ({receivables.length})</div>
              {receivables.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nada a receber.</div> : (
                <table><tbody>{receivables.map((f) => (<tr key={f.id}><td>{f.description}</td><td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td><td>{f.isPago ? "Recebido" : "Pendente"}</td></tr>))}</tbody></table>
              )}
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>A pagar ({payables.length})</div>
              {payables.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nada a pagar.</div> : (
                <table><tbody>{payables.map((f) => (<tr key={f.id}><td>{f.description}</td><td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td><td>{f.status === "pago" ? "Pago" : "Pendente"}</td></tr>))}</tbody></table>
              )}
            </div>
          </div>
        </ReportModal>
      )}
    </div>
  );
}

/* ============================================================
   CREDIÁRIO / PROMISSÓRIAS
   ============================================================ */
function dueBadge(account) {
  if (account.status === "Paga") return null;
  const d = daysUntil(account.dueDate);
  if (d < 0) return { color: "red", text: `Vencida (${Math.abs(d)}d)` };
  if (d === 0) return { color: "red", text: "Vence hoje" };
  if (d <= 5) return { color: "red", text: `Vence em ${d}d` };
  if (d <= 15) return { color: "amber", text: `Vence em ${d}d` };
  return { color: "green", text: `Vence em ${d}d` };
}

function CrediarioReceiptModal({ receipt, storeName, onClose }) {
  const { account, payment, paidBefore, quitado } = receipt;
  const dtCompra = new Date(account.createdAt);
  const dtPagamento = new Date(payment.paidAt);

  const shareText = `${storeName}
Comprovante de recebimento — Promissória

Cliente: ${account.customerNameFree || "—"}
Data da compra: ${dtCompra.toLocaleDateString("pt-BR")}
Data deste pagamento: ${dtPagamento.toLocaleDateString("pt-BR")} ${dtPagamento.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
Forma de pagamento: ${RECEIVABLE_PAYMENT_METHODS[payment.paymentMethod]}
Prazo combinado: ${account.termDays} dias${account.installments > 1 ? ` em ${account.installments}x` : ""}

Valor da compra: ${brl(account.totalAmount)}
Pago antes: ${brl(paidBefore)}
Pago agora: ${brl(payment.amount)}
Total pago até o momento: ${brl(account.paidAmount)}
${quitado ? "Situação: QUITADO" : `Saldo em aberto: ${brl(account.balance)}`}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Comprovante de recebimento", text: shareText });
      } catch (e) { /* usuário cancelou */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Comprovante copiado! Cole no WhatsApp.");
      } catch (e) {
        alert("Não foi possível copiar automaticamente. Copie manualmente o texto do comprovante.");
      }
    }
  };

  return (
    <Modal title="Comprovante de recebimento" onClose={onClose}
      footer={<>
        <button className="btn btn-secondary" onClick={handleShare}><Share2 size={14} /> Compartilhar</button>
        <button className="btn btn-secondary" onClick={() => window.print()}><FileText size={14} /> Imprimir</button>
        <button className="btn btn-primary" onClick={onClose}>Fechar</button>
      </>}>
      <div className="printable-receipt" style={{ background: "var(--surface-2)", border: "1px solid var(--border-soft)", borderRadius: 10, padding: 18 }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{storeName}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Comprovante de recebimento — Promissória</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px dashed var(--border)", paddingBottom: 10, marginBottom: 10 }}>
          <div>Cliente: <strong>{account.customerNameFree || "—"}</strong></div>
          <div>Data da compra: <span className="mono">{dtCompra.toLocaleDateString("pt-BR")}</span></div>
          <div>Data deste pagamento: <span className="mono">{dtPagamento.toLocaleDateString("pt-BR")} {dtPagamento.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span></div>
          <div>Forma de pagamento: {RECEIVABLE_PAYMENT_METHODS[payment.paymentMethod]}</div>
          <div>Prazo combinado: {account.termDays} dias{account.installments > 1 ? ` em ${account.installments}x` : ""}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Valor da compra</span><span className="mono">{brl(account.totalAmount)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Pago antes deste recebimento</span><span className="mono">{brl(paidBefore)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px dashed var(--border)", borderBottom: "1px dashed var(--border)" }}>
            <span style={{ fontWeight: 700 }}>Pago agora</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{brl(payment.amount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-dim)" }}>Total pago até o momento</span><span className="mono">{brl(account.paidAmount)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{quitado ? "Situação" : "Saldo em aberto"}</span>
            {quitado ? (
              <span className="mono" style={{ fontWeight: 700, color: "var(--green)" }}>Quitado</span>
            ) : (
              <span className="mono" style={{ fontWeight: 700, color: "var(--red)" }}>{brl(account.balance)}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--border)", fontSize: 11.5, color: "var(--text-dim)" }}>
          Obrigado pela preferência, volte sempre!
        </div>
      </div>
    </Modal>
  );
}

function CrediarioDetailModal({ account, payments, onClose, onRegisterPayment, onEditTotal, onDelete, storeName }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("pix");
  const [editing, setEditing] = useState(false);
  const [editTotal, setEditTotal] = useState(String(account.totalAmount));

  const amountValue = Math.min(account.balance, Math.max(0, parseFloat(String(amount).replace(",", ".")) || 0));
  const accPayments = payments.filter((p) => p.accountId === account.id).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

  const submitPayment = () => {
    if (amountValue <= 0) return;
    onRegisterPayment(account, amountValue, method);
    setAmount("");
  };

  const submitEdit = () => {
    const val = parseFloat(String(editTotal).replace(",", ".")) || 0;
    if (val <= 0) return;
    onEditTotal(account, val);
    setEditing(false);
  };

  return (
    <Modal title={account.customerNameFree || "Promissória"} onClose={onClose} wide
      footer={<>
        <button className="btn btn-danger" onClick={() => onDelete(account.id)}><Trash2 size={14} /> Excluir</button>
        <button className="btn btn-secondary" onClick={() => setEditing(true)}><Edit2 size={14} /> Editar valor</button>
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
      </>}>
      <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Field label="Data da compra"><div style={{ fontSize: 13.5 }}>{fmtDateTime(account.createdAt)}</div></Field>
        <Field label="Prazo combinado">
          <div style={{ fontSize: 13.5 }}>{account.termDays} dias{account.installments > 1 ? ` em ${account.installments}x` : ""} — vence {fmtDate(account.dueDate)}</div>
        </Field>
      </div>
      {account.installments > 1 && (
        <Field label="Valor da parcela"><div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{brl(account.totalAmount / account.installments)}</div></Field>
      )}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card stat-card" style={{ padding: 12 }}>
          <div className="stat-label">Total</div>
          <div className="mono" style={{ fontWeight: 700 }}>{brl(account.totalAmount)}</div>
        </div>
        <div className="card stat-card" style={{ padding: 12 }}>
          <div className="stat-label">Saldo devedor</div>
          <div className="mono" style={{ fontWeight: 700, color: account.balance > 0 ? "var(--red)" : "var(--green)" }}>{brl(account.balance)}</div>
        </div>
      </div>

      {editing && (
        <div className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-end" }}>
          <Field label="Novo valor total (R$)"><input className="input" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} /></Field>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={submitEdit}>Salvar</button>
        </div>
      )}

      {account.status === "Pendente" && (
        <div className="card" style={{ padding: 14 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Registrar recebimento</div>
          <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
            <Field label="Valor recebido agora (R$)"><input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></Field>
            <Field label="Forma de pagamento">
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {Object.entries(RECEIVABLE_PAYMENT_METHODS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </Field>
          </div>
          <button className="btn btn-primary" disabled={amountValue <= 0} onClick={submitPayment}><CheckCircle2 size={15} /> Registrar</button>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Histórico de recebimentos ({accPayments.length})</div>
        {accPayments.length === 0 ? (
          <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum recebimento registrado ainda.</div>
        ) : (
          <table>
            <thead><tr><th>Data</th><th>Forma</th><th style={{ textAlign: "right" }}>Valor</th></tr></thead>
            <tbody>
              {accPayments.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{fmtDateTime(p.paidAt)}</td>
                  <td>{RECEIVABLE_PAYMENT_METHODS[p.paymentMethod]}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{brl(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}

function Crediario({ data, update, notify, storeName }) {
  const [search, setSearch] = useState("");
  const [viewingId, setViewingId] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const accounts = data.crediarioAccounts || [];
  const paymentsAll = data.crediarioPayments || [];

  const filtered = accounts.filter((a) => (a.customerNameFree || "").toLowerCase().includes(search.toLowerCase()));
  const pending = accounts.filter((a) => a.status === "Pendente");
  const totalReceivable = pending.reduce((s, a) => s + a.balance, 0);

  const viewing = accounts.find((a) => a.id === viewingId) || null;

  const handleRegisterPayment = (account, amount, method) => {
    const paidBefore = account.paidAmount;
    const newPaid = account.paidAmount + amount;
    const newBalance = Math.max(0, account.totalAmount - newPaid);
    const quitado = newBalance <= 0.009;

    const paymentDoc = { id: uid(), accountId: account.id, amount, paymentMethod: method, paidAt: now() };
    update("crediarioPayments", (arr) => [...arr, paymentDoc]);
    update("crediarioAccounts", (arr) => arr.map((a) => (a.id === account.id ? { ...a, paidAmount: newPaid, balance: newBalance, status: quitado ? "Paga" : "Pendente" } : a)));

    // Registra também como faturamento no dia do recebimento (regime de caixa)
    const syntheticSale = {
      id: uid(),
      cashRegisterId: null,
      items: [{ productId: "crediario-" + account.id, name: `Recebimento crediário — ${account.customerNameFree || "cliente"}`, qty: 1, price: amount, lineTotal: amount }],
      total: amount,
      paymentMethod: method,
      installments: null, cashReceived: null, troco: null,
      customerName: account.customerNameFree || null,
      createdAt: now(),
    };
    update("sales", (arr) => [...arr, syntheticSale]);

    setLastReceipt({ account: { ...account, paidAmount: newPaid, balance: newBalance, status: quitado ? "Paga" : "Pendente" }, payment: paymentDoc, paidBefore, quitado });
    setViewingId(null);
    notify(quitado ? "Promissória quitada!" : "Recebimento registrado");
  };

  const handleEditTotal = (account, newTotal) => {
    const newBalance = Math.max(0, newTotal - account.paidAmount);
    update("crediarioAccounts", (arr) => arr.map((a) => (a.id === account.id ? { ...a, totalAmount: newTotal, balance: newBalance, status: newBalance <= 0.009 ? "Paga" : "Pendente" } : a)));
    notify("Valor atualizado");
  };

  const handleDelete = (id) => {
    try {
      update("crediarioAccounts", (arr) => arr.filter((a) => a.id !== id));
      update("crediarioPayments", (arr) => arr.filter((p) => p.accountId !== id));
      setViewingId(null);
      notify("Promissória removida");
    } catch (e) {
      notify("Não foi possível remover a promissória");
    }
  };

  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", marginBottom: 16 }}>
        <div className="card stat-card">
          <div className="stat-label">Promissórias em aberto</div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-foot"><Wallet size={12} /> pendentes</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Valor a receber</div>
          <div className="stat-value red">{brl(totalReceivable)}</div>
          <div className="stat-foot"><DollarSign size={12} /> saldo em aberto</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left"><div className="search-box" style={{ maxWidth: 320 }}><Search size={15} /><input className="input" placeholder="Buscar por nome do cliente..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <ReportButton onClick={() => setReportOpen(true)} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<Wallet size={28} />} title="Nenhuma promissória encontrada" /></div>
        ) : (
          <table>
            <thead><tr><th>Cliente</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Pago</th><th style={{ textAlign: "right" }}>Saldo</th><th>Vence em</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((a) => {
                const badge = dueBadge(a);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.customerNameFree || "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(a.totalAmount)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(a.paidAmount)}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{brl(a.balance)}</td>
                    <td>{badge ? <span className={"badge " + badge.color}>{badge.text}</span> : "—"}</td>
                    <td><span className={"badge " + (a.status === "Paga" ? "green" : "red")}>{a.status}</span></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {a.status === "Pendente" && <button className="btn btn-primary btn-sm" onClick={() => setViewingId(a.id)}><CheckCircle2 size={13} /> Registrar recebimento</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewingId(a.id)}><Eye size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewingId(a.id)}><Edit2 size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <CrediarioDetailModal
          account={viewing}
          payments={paymentsAll}
          onClose={() => setViewingId(null)}
          onRegisterPayment={handleRegisterPayment}
          onEditTotal={handleEditTotal}
          onDelete={handleDelete}
          storeName={storeName}
        />
      )}

      {lastReceipt && (
        <CrediarioReceiptModal receipt={lastReceipt} storeName={storeName} onClose={() => setLastReceipt(null)} />
      )}

      {reportOpen && (
        <ReportModal title="Relatório de crediário" storeName={storeName} onClose={() => setReportOpen(false)}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)", marginBottom: 16 }}>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Promissórias em aberto</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{pending.length}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Valor a receber</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(totalReceivable)}</div></div>
          </div>
          {accounts.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhuma promissória cadastrada.</div> : (
            <table>
              <thead><tr><th>Cliente</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Pago</th><th style={{ textAlign: "right" }}>Saldo</th><th>Vencimento</th><th>Status</th></tr></thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.customerNameFree || "—"}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(a.totalAmount)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(a.paidAmount)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{brl(a.balance)}</td>
                    <td className="mono">{fmtDate(a.dueDate)}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReportModal>
      )}
    </div>
  );
}

function CrediarioAlerts({ accounts }) {
  const [dismissed, setDismissed] = useState(() => new Set());

  const alerts = (accounts || [])
    .filter((a) => a.status === "Pendente" && !dismissed.has(a.id))
    .map((a) => ({ account: a, days: daysUntil(a.dueDate) }))
    .filter((x) => x.days <= 2)
    .sort((a, b) => a.days - b.days);

  if (alerts.length === 0) return null;

  const dismiss = (id) => setDismissed((prev) => new Set(prev).add(id));

  const label = (days) => {
    if (days < 0) return `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? "s" : ""}`;
    if (days === 0) return "Vence hoje";
    return `Vence em ${days} dia${days !== 1 ? "s" : ""}`;
  };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
      {alerts.map(({ account, days }) => (
        <div key={account.id} className="card" style={{
          padding: 14, borderColor: days < 0 ? "#F0D2CB" : "var(--border)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", animation: "slideInRight .25s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertTriangle size={16} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{account.customerNameFree || "Cliente"}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Saldo: {brl(account.balance)}</div>
                <div style={{ fontSize: 11.5, color: "var(--red)", fontWeight: 600, marginTop: 2 }}>{label(days)}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => dismiss(account.id)}><X size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   COMPATIBILIDADE DE PELÍCULA
   ============================================================ */
function CompatBlock({ block, onEdit, onDelete }) {
  const lines = (block.notes || "").split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{block.title}</div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(block)}><Edit2 size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(block.id)}><Trash2 size={13} /></button>
        </div>
      </div>
      {lines.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>Nenhum modelo compatível adicionado ainda.</div>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
          {lines.map((l, idx) => (
            <li key={idx} style={{ fontSize: 13, color: "var(--text-dim)", display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "var(--text-faint)" }}>•</span> {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Compatibilidade({ data, update, notify }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const empty = { title: "", notes: "" };
  const [form, setForm] = useState(empty);

  const blocks = data.filmCompat || [];

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (block) => { setForm({ title: block.title, notes: block.notes || "" }); setEditing(block.id); setModalOpen(true); };

  const save = () => {
    if (!form.title.trim()) return;
    if (editing) {
      update("filmCompat", (arr) => arr.map((b) => (b.id === editing ? { ...b, title: form.title.trim(), notes: form.notes } : b)));
      notify("Bloco atualizado");
    } else {
      update("filmCompat", (arr) => [...arr, { id: uid(), title: form.title.trim(), notes: form.notes, createdAt: now() }]);
      notify("Bloco criado");
    }
    setModalOpen(false);
  };

  const remove = (id) => {
    update("filmCompat", (arr) => arr.filter((b) => b.id !== id));
    setConfirmDel(null);
    notify("Bloco removido");
  };

  const q = search.toLowerCase();
  const filtered = blocks.filter((b) => b.title.toLowerCase().includes(q) || (b.notes || "").toLowerCase().includes(q));

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar-left"><div className="search-box" style={{ maxWidth: 320 }}><Search size={15} /><input className="input" placeholder="Buscar por modelo..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReportButton onClick={() => setReportOpen(true)} />
          <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo bloco</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<Smartphone size={28} />} title={blocks.length === 0 ? "Nenhum bloco cadastrado" : "Nenhum resultado para essa busca"} sub={blocks.length === 0 ? "Clique em \"Novo bloco\" para começar a organizar suas compatibilidades" : undefined} /></div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {filtered.map((b) => (
            <CompatBlock key={b.id} block={b} onEdit={openEdit} onDelete={(id) => setConfirmDel(id)} />
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? "Editar bloco" : "Novo bloco"} onClose={() => setModalOpen(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}><Save size={14} /> Salvar</button></>}>
          <Field label="Modelo do aparelho"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: iPhone 13" /></Field>
          <Field label="Modelos de película compatíveis (um por linha)">
            <textarea className="input" rows={8} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={"iPhone 13\niPhone 13 Pro\niPhone 14"} />
          </Field>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Remover bloco" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => remove(confirmDel)}>Remover</button></>}>
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13.5 }}>Tem certeza que deseja remover este bloco? Essa ação não pode ser desfeita.</p>
        </Modal>
      )}

      {reportOpen && (
        <ReportModal title="Compatibilidade de película" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          {blocks.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum bloco cadastrado.</div> : (
            blocks.map((b) => {
              const lines = (b.notes || "").split("\n").map((l) => l.trim()).filter(Boolean);
              return (
                <div className="card" style={{ padding: 12, marginBottom: 10 }} key={b.id}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{b.title}</div>
                  {lines.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>—</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {lines.map((l, idx) => <li key={idx} style={{ fontSize: 12 }}>{l}</li>)}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </ReportModal>
      )}
    </div>
  );
}

/* ============================================================
   GASTOS E DESPESAS
   ============================================================ */
const EXPENSE_CATEGORIES = {
  fornecedor: { label: "Mercadoria", color: "blue" },
  conta: { label: "Conta", color: "amber" },
  despesa: { label: "Despesa", color: "red" },
};

function GastosDespesas({ data, update, notify }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [confirmDel, setConfirmDel] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  const empty = { category: "conta", description: "", amount: "", dueDate: "" };
  const [form, setForm] = useState(empty);

  const expenses = data.financeEntries.filter((f) => f.type === "pagar");

  const openNew = () => { setForm(empty); setEditing(null); setModalOpen(true); };
  const openEdit = (f) => {
    setForm({ category: f.category || "despesa", description: f.description, amount: String(f.amount), dueDate: f.dueDate || "" });
    setEditing(f.id); setModalOpen(true);
  };

  const save = () => {
    if (!form.description.trim() || !form.amount) return;
    const payload = {
      type: "pagar",
      category: form.category,
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
          <div className="stat-foot">{filtered.filter((f) => f.status === "pendente").length} lançamento{filtered.filter((f) => f.status === "pendente").length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total pago</div>
          <div className="stat-value green">{brl(totalPago)}</div>
          <div className="stat-foot">{filtered.filter((f) => f.status === "pago").length} lançamento{filtered.filter((f) => f.status === "pago").length !== 1 ? "s" : ""}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total geral</div>
          <div className="stat-value">{brl(totalPendente + totalPago)}</div>
          <div className="stat-foot">{filtered.length} lançamento{filtered.length !== 1 ? "s" : ""}</div>
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
        <div style={{ display: "flex", gap: 8 }}>
          <ReportButton onClick={() => setReportOpen(true)} />
          <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> Novo lançamento</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30 }}><EmptyState icon={<DollarSign size={28} />} title="Nenhum lançamento encontrado" /></div>
        ) : (
          <table>
            <thead><tr><th>Categoria</th><th>Descrição</th><th>Vencimento</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((f) => {
                const cat = EXPENSE_CATEGORIES[f.category || "despesa"];
                return (
                  <tr key={f.id}>
                    <td><span className={"badge " + cat.color}>{cat.label}</span></td>
                    <td style={{ fontWeight: 600 }}>{f.description}</td>
                    <td style={{ color: "var(--text-faint)" }}>{f.dueDate ? fmtDate(f.dueDate) : "—"}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--red)" }}>{brl(f.amount)}</td>
                    <td><span className={"badge " + (f.status === "pago" ? "green" : "red")}>{f.status === "pago" ? "Pago" : "Pendente"}</span></td>
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

      {reportOpen && (
        <ReportModal title="Relatório de gastos e despesas" storeName={data.storeConfig.name} onClose={() => setReportOpen(false)}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 16 }}>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Total pendente</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(totalPendente)}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Total pago</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(totalPago)}</div></div>
            <div className="card stat-card" style={{ padding: 14 }}><div className="stat-label">Total geral</div><div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{brl(totalPendente + totalPago)}</div></div>
          </div>
          {filtered.length === 0 ? <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Nenhum lançamento encontrado.</div> : (
            <table>
              <thead><tr><th>Categoria</th><th>Descrição</th><th>Vencimento</th><th style={{ textAlign: "right" }}>Valor</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((f) => {
                  const cat = EXPENSE_CATEGORIES[f.category || "despesa"];
                  return (
                    <tr key={f.id}>
                      <td>{cat.label}</td>
                      <td>{f.description}</td>
                      <td className="mono">{f.dueDate ? fmtDate(f.dueDate) : "—"}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{brl(f.amount)}</td>
                      <td>{f.status === "pago" ? "Pago" : "Pendente"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </ReportModal>
      )}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg)", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      <style>{STYLES}</style>
      <div className="card" style={{ width: 340, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 22 }}>
          <div style={{ overflow: "hidden", height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src="/logo.png"
              alt="Davi Celulares"
              style={{ height: 230, width: "auto", maxWidth: "none", objectFit: "contain" }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Gestão de negócio</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="E-mail"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></Field>
          <Field label="Senha"><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></Field>
          {error && <div style={{ fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={13} /> {error}</div>}
          <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={submit} disabled={loading}><Unlock size={15} /> {loading ? "Entrando..." : "Entrar"}</button>
        </div>
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
  { key: "compatibilidade", label: "Compatibilidade", icon: Smartphone },
  { key: "crediario", label: "Crediário", icon: Wallet },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "fornecedores", label: "Fornecedores", icon: Phone },
  { key: "gastos", label: "Gastos e Despesas", icon: TrendingDown },
  { key: "financeiro-mensal", label: "Financeiro Mensal", icon: TrendingUp },
  { key: "dashboard", label: "Faturamento do dia", icon: LayoutDashboard },
];
const TITLES = {
  dashboard: ["Faturamento do dia", "Vendas, caixa e movimentações de hoje"],
  vendas: ["Vendas / PDV", "Frente de caixa e controle de caixa"],
  estoque: ["Estoque", "Produtos e controle de quantidade"],
  os: ["Ordens de Serviço", "Acompanhamento de reparos e serviços"],
  compatibilidade: ["Compatibilidade de Película", "Blocos de modelos compatíveis"],
  crediario: ["Crediário", "Promissórias e recebimentos parcelados"],
  clientes: ["Clientes", "Cadastro e histórico"],
  fornecedores: ["Fornecedores", "Contatos e cadastro"],
  gastos: ["Gastos e Despesas", "Contas a pagar categorizadas"],
  "financeiro-mensal": ["Financeiro Mensal", "Relatório completo do mês"],
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
  const handleLogout = async () => { await signOut(auth); setLoggedIn(false); };
  const openCash = data.cashRegisters.find((c) => c.status === "aberto");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text-faint)" }}>
        Carregando...
      </div>
    );
  }
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

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
              <item.icon size={17} />{!sidebarCollapsed && item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed((v) => !v)}><ChevronRight size={15} style={{ transform: sidebarCollapsed ? "none" : "rotate(180deg)" }} /></div>
        <div className="sidebar-footer" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={"led " + (openCash ? "on" : "off")} />
            {!sidebarCollapsed && <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{openCash ? "CAIXA ABERTO" : "CAIXA FECHADO"}</span>}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent: sidebarCollapsed ? "center" : "flex-start" }} onClick={handleLogout}><Lock size={14} /> {!sidebarCollapsed && "Sair"}</button>
        </div>
      </aside>
      <div className="main">
                <div className="topbar">
          <div><h1>{TITLES[view][0]}</h1><div className="topbar-sub">{TITLES[view][1]}</div></div>
        </div>
        <div className="content">
          {!loaded ? <div style={{ color: "var(--text-faint)", padding: 40, textAlign: "center" }}>Carregando dados...</div> : (
            <>
              {view === "dashboard" && <Dashboard data={data} setView={setView} />}
              {view === "vendas" && <VendasPDV data={data} update={update} notify={notify} storeName={data.storeConfig.name} />}
              {view === "estoque" && <Estoque data={data} update={update} notify={notify} />}
              {view === "compatibilidade" && <Compatibilidade data={data} update={update} notify={notify} />}
              {view === "os" && <OrdensServico data={data} update={update} notify={notify} />}
              {view === "crediario" && <Crediario data={data} update={update} notify={notify} storeName={data.storeConfig.name} />}
              {view === "clientes" && <Clientes data={data} update={update} notify={notify} />}
              {view === "fornecedores" && <Fornecedores data={data} update={update} notify={notify} />}
              {view === "gastos" && <GastosDespesas data={data} update={update} notify={notify} />}
              {view === "financeiro-mensal" && <FinanceiroMensal data={data} update={update} notify={notify} />}
            </>
          )}
        </div>
      </div>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <CrediarioAlerts accounts={data.crediarioAccounts} />
    </div>
  );
}