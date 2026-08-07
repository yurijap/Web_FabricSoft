import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { api } from "../../../config/api";
import "./s03-tco-calculator.css";

type ErpSystem =
  | "SAP S/4 HANA"
  | "SAP ECC"
  | "Oracle EBS R12"
  | "Oracle JD Edwards"
  | "Oracle PeopleSoft"
  | "Microsoft Dynamics 365"
  | "NetSuite"
  | "Otro / Greenfield";

type Industry = "Servicios financieros" | "Inmobiliario / Centros comerciales" | "Logistica / Distribucion / Transporte" | "Otra";

type FormState = {
  erp: ErpSystem;
  users: number;
  annualErpSpend: number;
  industry: Industry;
  company: string;
  role: string;
  email: string;
  ndaAccepted: boolean;
};

type Benchmark = {
  savings: number;
  breakeven: number;
};

type TcoResult = {
  totalAnnualCost: number;
  oracleAnnualCost: number;
  currentTCO1y: number;
  currentTCO3y: number;
  currentTCO5y: number;
  currentTCO10y: number;
  oracleTCO1y: number;
  oracleTCO3y: number;
  oracleTCO5y: number;
  oracleTCO10y: number;
  annualSavings: number;
  savings5y: number;
  savings10y: number;
  migrationInvestment: number;
  breakeven: number;
  percentReduction: number;
  qualificationScore: number;
  market?: {
    rationale?: string;
    savingsRateAdjusted?: number;
    annualCostAssumption?: number;
    costSource?: string;
    isCostAbnormallyLow?: boolean;
    enteredAnnualCost?: number;
    minOperatingCost?: number;
  };
  recommendation?: {
    level: string;
    nextStep: string;
    summary: string;
  };
};

const ERPS: ErpSystem[] = [
  "SAP S/4 HANA",
  "SAP ECC",
  "Oracle EBS R12",
  "Oracle JD Edwards",
  "Oracle PeopleSoft",
  "Microsoft Dynamics 365",
  "NetSuite",
  "Otro / Greenfield",
];

const INDUSTRIES: Industry[] = [
  "Servicios financieros",
  "Inmobiliario / Centros comerciales",
  "Logistica / Distribucion / Transporte",
  "Otra",
];

const BENCHMARKS: Record<ErpSystem, Benchmark> = {
  "SAP S/4 HANA": { savings: 0.3, breakeven: 18 },
  "SAP ECC": { savings: 0.35, breakeven: 16 },
  "Oracle EBS R12": { savings: 0.25, breakeven: 14 },
  "Oracle JD Edwards": { savings: 0.2, breakeven: 12 },
  "Oracle PeopleSoft": { savings: 0.22, breakeven: 14 },
  "Microsoft Dynamics 365": { savings: 0.28, breakeven: 18 },
  "NetSuite": { savings: 0.15, breakeven: 20 },
  "Otro / Greenfield": { savings: 0.3, breakeven: 18 },
};

const MARKET_COST_PER_USER: Record<ErpSystem, number> = {
  "SAP S/4 HANA": 4200,
  "SAP ECC": 3900,
  "Oracle EBS R12": 3400,
  "Oracle JD Edwards": 3000,
  "Oracle PeopleSoft": 3200,
  "Microsoft Dynamics 365": 2800,
  NetSuite: 2200,
  "Otro / Greenfield": 2500,
};

const INDUSTRY_COST_MULTIPLIER: Record<Industry, number> = {
  "Servicios financieros": 1.12,
  "Inmobiliario / Centros comerciales": 1.07,
  "Logistica / Distribucion / Transporte": 1.06,
  Otra: 1,
};

const DEFAULT_FORM: FormState = {
  erp: "SAP S/4 HANA",
  users: 150,
  annualErpSpend: 0,
  industry: "Inmobiliario / Centros comerciales",
  company: "",
  role: "",
  email: "",
  ndaAccepted: false,
};

const FEATURES = [
  { id: "01", title: "ERP actual", text: "SAP, EBS, JDE, PeopleSoft, Dynamics, NetSuite u otro escenario." },
  { id: "02", title: "Usuarios", text: "Escala operativa para estimar costo anual cuando no hay desglose." },
  { id: "03", title: "Industria", text: "Ajuste por complejidad financiera, integraciones y control." },
  { id: "04", title: "Documento", text: "El prospecto deja sus datos para recibir una lectura ejecutiva mas detallada." },
];

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const fmtCompact = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);

const clamp = (value: number, min = 0, max = Number.POSITIVE_INFINITY) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

function getSavingsRange(val: number) {
  const rounded = Math.round(val);
  const low = Math.max(5, Math.floor(rounded / 5) * 5);
  const high = Math.min(95, Math.ceil(rounded / 5) * 5);
  if (low === high) {
    return `${low - 5}% - ${high}%`;
  }
  return `${low}% - ${high}%`;
}

function calculateTCO(data: FormState) {
  const marketAnnualCost = Math.round(
    data.users * MARKET_COST_PER_USER[data.erp] * INDUSTRY_COST_MULTIPLIER[data.industry]
  );
  
  // Lógica de costo mínimo operativo estimado (ej. mínimo $5k o $150 por usuario)
  const minOperatingCost = Math.max(5000, data.users * 150);
  const isCostAbnormallyLow = data.annualErpSpend > 0 && data.annualErpSpend < minOperatingCost;

  const totalAnnualCost = (data.annualErpSpend > 0 && !isCostAbnormallyLow) ? data.annualErpSpend : marketAnnualCost;
  const costSource = (data.annualErpSpend > 0 && !isCostAbnormallyLow) ? "provided" : "market";

  const benchmark = BENCHMARKS[data.erp];
  const scaleBoost = data.users >= 1000 ? 1.12 : data.users >= 250 ? 1.06 : data.users >= 75 ? 1 : 0.94;
  const industryBoost = data.industry === "Servicios financieros" ? 1.08 : data.industry === "Inmobiliario / Centros comerciales" ? 1.06 : data.industry === "Logistica / Distribucion / Transporte" ? 1.05 : 1;
  const adjustedSavings = Math.min(Math.max(benchmark.savings * scaleBoost * industryBoost, 0.08), 0.42);
  const annualSavings = totalAnnualCost * adjustedSavings;
  const oracleAnnualCost = totalAnnualCost - annualSavings;
  const migrationInvestment = Math.max(totalAnnualCost * 0.38, data.users * 950, 70000);
  const breakeven = annualSavings > 0 ? Math.max(6, Math.ceil((migrationInvestment / annualSavings) * 12)) : benchmark.breakeven;
  const costScore = totalAnnualCost >= 1000000 ? 30 : totalAnnualCost >= 500000 ? 24 : totalAnnualCost >= 250000 ? 18 : 10;
  const userScore = data.users >= 1000 ? 24 : data.users >= 250 ? 18 : data.users >= 75 ? 12 : 6;
  const industryScore = data.industry === "Otra" ? 8 : 14;

  return {
    totalAnnualCost,
    oracleAnnualCost,
    currentTCO1y: totalAnnualCost,
    currentTCO3y: totalAnnualCost * 3,
    currentTCO5y: totalAnnualCost * 5,
    currentTCO10y: totalAnnualCost * 10,
    oracleTCO1y: oracleAnnualCost,
    oracleTCO3y: oracleAnnualCost * 3,
    oracleTCO5y: oracleAnnualCost * 5,
    oracleTCO10y: oracleAnnualCost * 10,
    annualSavings,
    savings5y: annualSavings * 5,
    savings10y: annualSavings * 10,
    migrationInvestment,
    breakeven,
    percentReduction: adjustedSavings * 100,
    qualificationScore: Math.min(costScore + userScore + industryScore + 24, 100),
    market: {
      rationale: "Lectura local con referencias por ERP, industria y numero de usuarios.",
      savingsRateAdjusted: adjustedSavings,
      annualCostAssumption: marketAnnualCost,
      costSource,
      isCostAbnormallyLow,
      enteredAnnualCost: data.annualErpSpend,
      minOperatingCost,
    },
    recommendation: {
      level: costSource === "provided" ? "Lectura con dato declarado" : "Lectura con referencia de mercado",
      nextStep: "Para recibir un análisis más preciso, comparte tus datos corporativos y solicita el documento ejecutivo.",
      summary: costSource === "provided"
        ? `Análisis con gasto anual declarado para ${data.users.toLocaleString()} usuarios en ${data.erp}. El rango de ahorro refleja benchmarks de migraciones comparables en el sector.`
        : `Análisis basado en costo de referencia de mercado para ${data.erp} × ${data.users.toLocaleString()} usuarios en el sector "${data.industry}". Al no contar con gasto declarado, se aplica la referencia de industria.`,
    },
  };
}

const toastBase = {
  style: {
    background: "#080706",
    borderRadius: "4px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    padding: "14px 18px",
  },
};

function toastOk(message: string) {
  toast.dismiss();
  toast.success(message, {
    ...toastBase,
    style: { ...toastBase.style, border: "1px solid #C9A96E", color: "#C9A96E" },
    icon: null,
  });
}

function toastErr(message: string) {
  toast.dismiss();
  toast.error(message, {
    ...toastBase,
    style: { ...toastBase.style, border: "1px solid #B85450", color: "#B85450" },
    icon: null,
  });
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function Btn({ children, onClick, disabled = false, className = "" }: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`btn-primary disabled:cursor-not-allowed disabled:opacity-40 ${className}`}>
      {children}
    </button>
  );
}

const inputBase =
  "w-full bg-[#080706] px-4 py-3.5 font-mono text-sm text-[#F5F5F5] outline-none border border-[#2A2A2A] transition-all duration-200 focus:border-[#C9A96E]/60 focus:shadow-[0_0_12px_rgba(201,169,110,0.15)] rounded-sm";

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-[#888]">{children}</span>;
}

function NumberInput({ label, value, onChange, min = 0, max, prefix, suffix, placeholder, emptyWhenZero = false }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  emptyWhenZero?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center border border-[#2A2A2A] bg-[#080706] px-4 py-3.5 transition-all duration-200 focus-within:border-[#C9A96E]/60 focus-within:shadow-[0_0_12px_rgba(201,169,110,0.15)] rounded-sm">
        {prefix && <span className="mr-2 font-mono text-sm text-[#888]">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          value={emptyWhenZero && value === 0 ? "" : value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value === "" ? 0 : clamp(Number(event.target.value), min, max))}
          className="w-full bg-transparent font-mono text-sm text-[#F5F5F5] outline-none placeholder:text-[#444]"
        />
        {suffix && <span className="ml-2 font-mono text-xs text-[#888]">{suffix}</span>}
      </div>
    </label>
  );
}

function SelectInput<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={`${inputBase} cursor-pointer appearance-none`}>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#080706]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputBase} placeholder:text-[#444]`}
      />
    </label>
  );
}

function MetricBox({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${accent ? "border-[#C9A96E]/40 bg-[#C9A96E] text-black" : "border-[#1A1A1A] bg-[#111111] text-[#F5F5F5]"} border p-5 rounded-sm`}>
      <p className={`mb-2 font-mono text-[9px] uppercase tracking-[0.15em] ${accent ? "text-black/70" : "text-[#888]"}`}>{label}</p>
      <p className="font-mono text-lg">{value}</p>
    </div>
  );
}

function EmptySignalPanel() {
  const rows = ["TCO anual", "Ahorro potencial", "Breakeven"];

  return (
    <div className="grid min-h-[460px] place-items-center border border-[#1A1A1A] bg-[#080706] p-8 rounded-sm">
      <div className="w-full max-w-[430px]">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Lectura pendiente</p>
        <p className="font-serif text-3xl leading-tight text-[#F5F5F5]">Tus numeros aparecen despues de calcular.</p>
        <p className="mt-4 font-sans text-sm leading-relaxed text-[#888]">
          Captura 4 datos y revela una lectura ejecutiva: costo anual, rango de ahorro, breakeven y fit para Oracle.
        </p>

        <div className="mt-8 space-y-4">
          {rows.map((row, index) => (
            <div key={row} className="border border-[#1A1A1A] bg-[#060606] p-4 rounded-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#888]">{row}</span>
                <span className="font-mono text-[10px] text-[#C9A96E]">Pendiente</span>
              </div>
              <div className="h-1.5 overflow-hidden bg-[#161616] rounded-full">
                <div className="h-full bg-[#2A2A2A]" style={{ width: `${36 + index * 18}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpportunityMeter({ tco }: { tco: TcoResult }) {
  const score = clamp(Math.round(tco.qualificationScore), 0, 100);

  return (
    <div className="mb-6 grid gap-4 border border-[#1A1A1A] bg-[#080706] p-5 sm:grid-cols-[170px_minmax(0,1fr)] rounded-sm">
      <div
        className="grid h-[150px] w-[150px] place-items-center justify-self-center rounded-full"
        style={{ background: `conic-gradient(#C9A96E ${score * 3.6}deg, #171717 0deg)` }}
        aria-label={`Fit ejecutivo ${score} de 100`}
      >
        <div className="grid h-[118px] w-[118px] place-items-center rounded-full bg-[#080706] text-center">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#888]">Fit</p>
            <p className="font-mono text-3xl text-[#F5F5F5]">{score}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Oportunidad detectada</p>
        <p className="mt-2 font-serif text-2xl leading-tight text-[#F5F5F5]">
          {getSavingsRange(tco.percentReduction)} de reduccion potencial frente al TCO actual.
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#888]">
          El score combina ERP, industria, usuarios y costo anual para priorizar si merece una revision senior.
        </p>
      </div>
    </div>
  );
}

function ComparisonTable({ tco }: { tco: TcoResult }) {
  const rows = [
    { period: "Año 1", current: tco.currentTCO1y, oracle: tco.oracleTCO1y },
    { period: "Año 3", current: tco.currentTCO3y, oracle: tco.oracleTCO3y },
    { period: "Año 5", current: tco.currentTCO5y, oracle: tco.oracleTCO5y },
    { period: "Año 10", current: tco.currentTCO10y, oracle: tco.oracleTCO10y },
  ];

  return (
    <div className="overflow-hidden border border-[#1A1A1A] bg-[#080706] rounded-sm">
      <div className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-[#1A1A1A] bg-[#111111] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#888]">
        <span>Periodo</span>
        <span>Situacion actual</span>
        <span>Oracle Fusion</span>
      </div>
      {rows.map((row) => (
        <div key={row.period} className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-[#1A1A1A] px-4 py-4 last:border-0">
          <span className="font-mono text-xs text-[#888]">{row.period}</span>
          <span className="font-mono text-sm text-[#F5F5F5]">{fmt(row.current)}</span>
          <span className="font-mono text-sm text-[#C9A96E]">{fmt(row.oracle)}</span>
        </div>
      ))}
    </div>
  );
}

function SavingsChart({ currentTCO10y, oracleTCO10y }: { currentTCO10y: number; oracleTCO10y: number }) {
  const max = Math.max(currentTCO10y, oracleTCO10y, 1);
  const bars = [
    { label: "Actual 10 años", value: currentTCO10y, color: "bg-[#444]" },
    { label: "Oracle 10 años", value: oracleTCO10y, color: "bg-[#C9A96E]" },
  ];

  return (
    <div className="border border-[#1A1A1A] bg-[#080706] p-6 rounded-sm">
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Grafico simple de ahorro acumulado</p>
      <div className="space-y-5">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-sans text-xs text-[#888]">{bar.label}</span>
              <span className="font-mono text-sm text-[#F5F5F5]">{fmtCompact(bar.value)}</span>
            </div>
            <div className="h-1.5 w-full bg-[#161616] rounded-full">
              <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${(bar.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakEvenChart({ tco }: { tco: TcoResult }) {
  const isHighBreakeven = tco.breakeven > 48;
  const width = `${clamp(((isHighBreakeven ? 48 : tco.breakeven) / 36) * 100, 12, 100)}%`;

  return (
    <div className="border border-[#1A1A1A] bg-[#080706] p-6 rounded-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Punto de retorno</p>
          <p className="mt-2 font-serif text-2xl text-[#F5F5F5]">
            {isHighBreakeven ? "> 48 meses" : `${tco.breakeven} meses`}
          </p>
        </div>
        <p className="max-w-[190px] text-right font-sans text-xs leading-relaxed text-[#888]">
          {isHighBreakeven 
            ? "Retorno financiero a largo plazo. Se aconseja evaluar beneficios intangibles." 
            : "Lectura rapida para saber si el caso amerita documento ejecutivo."}
        </p>
      </div>
      <div className="h-2 overflow-hidden bg-[#161616] rounded-full">
        <div className={`h-full rounded-full ${isHighBreakeven ? 'bg-[#B85450]' : 'bg-[#C9A96E]'}`} style={{ width }} />
      </div>
      <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#666]">
        <span>0</span>
        <span>18m</span>
        <span>36m+</span>
      </div>
    </div>
  );
}

function LeadPreviewCard({ onOpen }: { onOpen: () => void }) {
  const preview = calculateTCO(DEFAULT_FORM);
  const rows = [
    { label: "ERP actual", value: DEFAULT_FORM.erp },
    { label: "Usuarios", value: String(DEFAULT_FORM.users) },
    { label: "Costo anual mercado", value: fmt(preview.totalAnnualCost) },
    { label: "Rango de reducción", value: getSavingsRange(preview.percentReduction) },
    { label: "Ahorro 5 años", value: fmt(preview.savings5y) },
    { label: "Breakeven", value: `${preview.breakeven} meses` },
  ];

  return (
    <article className="relative w-full max-w-[460px] border border-[#2A2A2A] bg-[#080706] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-shadow duration-500 hover:shadow-[0_25px_60px_rgba(201,169,110,0.1)] md:p-10 rounded-sm">
      <div className="mb-8 border-b border-[#1A1A1A] pb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#C9A96E] animate-pulse rounded-full" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">Lectura ejemplo</p>
        </div>
        <p className="font-serif text-2xl text-[#F5F5F5]">ERP TCO <span className="text-[#C9A96E]">Comparator</span></p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 last:border-0 last:pb-0">
            <span className="font-sans text-[13px] text-[#888]">{row.label}</span>
            <span className="text-right font-mono text-sm text-[#F5F5F5]">{row.value}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="group mt-8 w-full border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-6 text-left transition-all duration-300 hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/10 hover:shadow-[0_0_20px_rgba(201,169,110,0.15)] rounded-sm"
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E] transition-colors duration-300">
          Oportunidad a 10 años
        </p>
        <p className="font-serif text-4xl text-[#F5F5F5] transition-colors duration-300 group-hover:text-[#C9A96E]">
          {fmtCompact(preview.savings10y)}
        </p>
      </button>
    </article>
  );
}

function CalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [tco, setTco] = useState<TcoResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setHasUserEdited(true);
    setHasCalculated(false);
    setTco(null);
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  const calculateBenchmark = useCallback(async () => {
    try {
      setCalculating(true);
      const { data } = await api.post("/erp-tco/calculate", form);
      setTco(data.result);
      setHasCalculated(true);
    } catch {
      setTco(calculateTCO(form));
      setHasCalculated(true);
      toastErr("Backend no respondio. Mostramos una estimacion local.");
    } finally {
      setCalculating(false);
    }
  }, [form]);

  const requestAnalysis = useCallback(async () => {
    const publicEmail = /(gmail|hotmail|outlook|yahoo)\./i.test(form.email);

    if (!hasCalculated) {
      toastErr("Primero calcula tu lectura");
      return;
    }

    if (!form.company.trim() || !form.role.trim() || !form.email.trim()) {
      toastErr("Completa empresa, cargo y email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || publicEmail) {
      toastErr("Usa un email corporativo");
      return;
    }

    if (!form.ndaAccepted) {
      toastErr("Acepta NDA para continuar");
      return;
    }

    try {
      toastOk(`Documento solicitado: ${tco?.recommendation?.level || "lectura ejecutiva lista"}`);
    } catch {
      toastErr("No se pudo solicitar el documento");
    }
  }, [form, hasCalculated, tco]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl">
      <div className="h-full overflow-y-auto overscroll-contain px-4 py-6 md:px-6 md:py-10">
        <div className="relative mx-auto w-full max-w-[1160px] overflow-hidden border border-[#2A2A2A] bg-[#050203]/95 shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_20px_rgba(201,169,110,0.1)] rounded-sm">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center border border-[#2A2A2A] bg-[#080706]/80 text-[#888] transition-all duration-300 hover:border-[#C9A96E] hover:bg-[#C9A96E]/10 hover:text-[#C9A96E] rounded-sm"
            aria-label="Cerrar calculadora"
          >
            <CloseIcon />
          </button>

          <div className="grid lg:grid-cols-[0.95fr_1.15fr]">
            <div className="p-8 md:p-12 lg:border-r lg:border-[#1A1A1A]">
              <div className="mb-8">
                <div className="mb-5 inline-flex border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 rounded-sm">
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C9A96E]">
                    4 datos · lectura privada
                  </span>
                </div>
                <h3 className="font-serif text-3xl text-[#F5F5F5] md:text-4xl">Descubre tu fuga de TCO</h3>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#888]">
                  Usa tus datos reales cuando los tengas. Si todavia no tienes el gasto exacto, FABRIC completa la primera lectura con referencias de mercado por ERP, industria y escala.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectInput label="ERP actual" value={form.erp} options={ERPS} onChange={(value) => update("erp", value)} />
                <NumberInput label="Usuarios totales" value={form.users} min={10} max={5000} onChange={(value) => update("users", value)} />
                <SelectInput label="Industria" value={form.industry} options={INDUSTRIES} onChange={(value) => update("industry", value)} />
                <NumberInput
                  label="Gasto anual conocido"
                  value={form.annualErpSpend}
                  min={0}
                  max={10000000}
                  prefix="$"
                  placeholder="Opcional"
                  emptyWhenZero
                  onChange={(value) => update("annualErpSpend", value)}
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Btn onClick={calculateBenchmark} disabled={calculating} className="w-full sm:w-auto">
                  {calculating ? "Leyendo oportunidad" : hasCalculated ? "Actualizar lectura" : "Ver oportunidad"}
                  <ArrowIcon />
                </Btn>
                <p className="font-sans text-xs leading-relaxed text-[#888]">
                  La lectura aparece despues de pulsar el boton. Asi el prospecto siente que el resultado nace de sus datos.
                </p>
              </div>

              <div className="mt-5 border border-[#2A2A2A] bg-[#080706] p-4 rounded-sm">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#888]">Base usada</p>
                    <p className="font-mono text-sm text-[#F5F5F5]">
                      {hasCalculated && tco ? (tco.market?.costSource === "provided" ? "Dato capturado" : "Referencia mercado") : "Pendiente"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#888]">TCO anual base</p>
                    <p className="font-mono text-sm text-[#C9A96E]">{hasCalculated && tco ? fmt(tco.totalAnnualCost) : "--"}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#888]">Referencia mercado</p>
                    <p className="font-mono text-sm text-[#F5F5F5]">
                      {hasCalculated && tco ? fmt(tco.market?.annualCostAssumption || tco.totalAnnualCost) : "--"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-[#1A1A1A] pt-8">
                <div className="mb-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Recibe el documento ejecutivo</p>
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[#888]">
                    Deja tus datos corporativos para recibir una lectura con mas detalle, supuestos y siguiente paso recomendado.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput label="Empresa" value={form.company} placeholder="Empresa" onChange={(value) => update("company", value)} />
                  <TextInput label="Cargo" value={form.role} placeholder="CFO / CIO / CTO" onChange={(value) => update("role", value)} />
                  <div className="sm:col-span-2">
                    <TextInput label="Email corporativo" type="email" value={form.email} placeholder="nombre@empresa.com" onChange={(value) => update("email", value)} />
                  </div>
                </div>
                <label className="mt-5 flex items-start gap-3 font-sans text-xs leading-relaxed text-[#888]">
                  <input
                    type="checkbox"
                    checked={form.ndaAccepted}
                    onChange={(event) => update("ndaAccepted", event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#C9A96E]"
                  />
                  Acepto que FABRIC use esta informacion para preparar un documento ejecutivo bajo NDA. Si el caso califica, el detalle de facturas, licencias o contratos se solicita en el siguiente paso.
                </label>
                <div className="mt-8">
                  <Btn onClick={requestAnalysis} className="w-full">
                    Recibir documento ejecutivo
                    <ArrowIcon />
                  </Btn>
                </div>
              </div>
            </div>

            <div className="bg-[#080706] p-8 md:p-12">
              <div className="mb-8">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">
                  {calculating ? "Leyendo oportunidad" : hasCalculated ? "Lectura ejecutiva inicial" : "Lectura pendiente"}
                </p>
                <h4 className="font-serif text-2xl text-[#F5F5F5]">
                  {hasCalculated
                    ? `${form.erp}, ${form.users.toLocaleString("en-US")} usuarios`
                    : hasUserEdited
                      ? "Pulsa ver oportunidad para revelar la lectura"
                      : "Completa los datos y revela la oportunidad"}
                </h4>
              </div>

              {hasCalculated && tco ? (
                <>
                  {tco.market?.isCostAbnormallyLow && (
                    <div className="mb-6 border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-4 rounded-sm text-left">
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] mb-1">
                        ⚠️ Gasto anual ajustado
                      </p>
                      <p className="font-sans text-[12px] leading-relaxed text-[#888]">
                        El costo anual conocido ingresado (<strong>USD {fmt(tco.market?.enteredAnnualCost || 0)}</strong>) es inferior al mínimo operativo estimado para {form.users} usuarios. Hemos aplicado el costo de referencia de mercado (<strong>USD {fmt(tco.totalAnnualCost)}</strong>) para asegurar la viabilidad del ahorro y breakeven.
                      </p>
                    </div>
                  )}

                  {tco.breakeven > 48 && (
                    <div className="mb-6 border border-[#B85450]/30 bg-[#B85450]/5 p-4 rounded-sm text-left">
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#B85450] mb-1">
                        ⚠️ Retorno de inversión a largo plazo
                      </p>
                      <p className="font-sans text-[12px] leading-relaxed text-[#888]">
                        Dado que tu gasto actual declarado ya es muy bajo, el periodo de breakeven estimado supera los 4 años. Se aconseja una revisión senior para evaluar beneficios de modernización y soporte, más allá del ahorro inmediato.
                      </p>
                    </div>
                  )}

                  <OpportunityMeter tco={tco} />

                  <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <MetricBox label="Ahorro 5 años" value={fmt(tco.savings5y)} />
                    <MetricBox label="Ahorro 10 años" value={fmtCompact(tco.savings10y)} accent />
                    <MetricBox label="Rango de Reducción" value={getSavingsRange(tco.percentReduction)} />
                    <MetricBox label="Breakeven migracion" value={tco.breakeven > 48 ? "> 48 meses" : `${tco.breakeven} meses`} />
                    <MetricBox label="Fit ejecutivo" value={`${Math.round(tco.qualificationScore)} / 100`} />
                    <MetricBox label="Inversion guia" value={fmtCompact(tco.migrationInvestment)} />
                  </div>

                  <div className="space-y-6">
                    {tco.recommendation && (
                      <div className="border border-[#C9A96E]/25 bg-[#C9A96E]/[0.04] p-5 rounded-sm">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">{tco.recommendation.level}</p>
                        <p className="font-sans text-sm leading-relaxed text-[#F5F5F5]/80">{tco.recommendation.summary}</p>
                        <p className="mt-3 font-sans text-xs leading-relaxed text-[#888]">{tco.recommendation.nextStep}</p>
                      </div>
                    )}
                    <ComparisonTable tco={tco} />
                    <div className="grid gap-6 xl:grid-cols-2">
                      <SavingsChart currentTCO10y={tco.currentTCO10y} oracleTCO10y={tco.oracleTCO10y} />
                      <BreakEvenChart tco={tco} />
                    </div>
                  </div>
                </>
              ) : (
                <EmptySignalPanel />
              )}

              <div className="mt-8 border-t border-[#1A1A1A] pt-6">
                {hasCalculated && tco ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none font-mono text-[9px] uppercase tracking-[0.14em] text-[#444] hover:text-[#888] transition-colors duration-200 select-none">
                      <span className="mr-1 group-open:hidden">▸</span>
                      <span className="mr-1 hidden group-open:inline">▾</span>
                      Supuestos del cálculo
                    </summary>
                    <div className="mt-4 space-y-2 font-sans text-[11px] leading-relaxed text-[#666]">
                      <p><span className="text-[#888]">Base de costo:</span> {tco.market?.costSource === "provided" ? "Gasto anual declarado por el usuario." : `Referencia de mercado: ${form.erp} × ${form.users} usuarios × factor industria.`}</p>
                      <p><span className="text-[#888]">Rango de ahorro:</span> Benchmark de migraciones ERP reales, ajustado por escala de usuarios e industria. Se muestra como rango para evitar falsa precisión.</p>
                      <p><span className="text-[#888]">Breakeven:</span> Inversión estimada de migración ÷ ahorro anual × 12 meses.</p>
                      <p><span className="text-[#888]">FIT ejecutivo:</span> Score 0–100 basado en costo total (30 pts), usuarios (24 pts), industria (14 pts) y base de 24 pts. No reemplaza una evaluación técnica.</p>
                    </div>
                  </details>
                ) : (
                  <p className="font-sans text-xs leading-relaxed text-[#888]">La lectura permanece oculta hasta que el usuario pulse Ver oportunidad.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function S03TcoCalculator() {
  const [open, setOpen] = useState(false);

  return (
    <section id="tco" className="relative overflow-hidden bg-[#050203] px-6 py-24 md:px-12 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 m-auto h-[400px] w-[400px] bg-[#C9A96E] opacity-[0.05] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1300px]">
        <div className="grid gap-16 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
          <div className="relative flex flex-col justify-center">
            <div className="mb-8 inline-flex w-fit items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-4 py-2 rounded-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">
                Documento privado · ERP TCO Comparator
              </span>
            </div>

            <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.04em] text-[#F5F5F5] md:text-[52px] lg:text-[60px]">
              Tu ERP puede estar filtrando presupuesto cada año.
            </h2>

            <p className="mt-8 max-w-2xl font-sans text-base leading-relaxed text-[#888] md:text-lg">
              En menos de un minuto, FABRIC cruza tu ERP, usuarios, industria y gasto anual para detectar si existe una oportunidad real frente a Oracle Fusion.
            </p>

            <div className="mt-12 flex flex-col items-start gap-6">
              <Btn onClick={() => setOpen(true)}>
                Calcular TCO
                <ArrowIcon />
              </Btn>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]/70">
                4 datos · lectura privada · documento ejecutivo
              </p>
            </div>

            <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:hidden">
              {FEATURES.map((feature) => (
                <article key={feature.id} className="border border-[#1A1A1A] bg-[#080706] p-6 rounded-sm">
                  <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">{feature.id}</p>
                  <h3 className="mb-2 font-serif text-lg text-[#F5F5F5]">{feature.title}</h3>
                  <p className="font-sans text-[13px] leading-relaxed text-[#888]">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative hidden flex-col justify-center lg:flex">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[#C9A96E] opacity-[0.03] blur-[100px]" />
            <LeadPreviewCard onOpen={() => setOpen(true)} />
          </div>
        </div>

        <div className="mt-24 hidden grid-cols-1 gap-6 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.id} className="border border-[#1A1A1A] bg-[#080706] p-6 transition-all duration-300 hover:border-[#C9A96E]/40 rounded-sm">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">{feature.id}</p>
              <h3 className="mb-2 font-serif text-lg text-[#F5F5F5]">{feature.title}</h3>
              <p className="font-sans text-[13px] leading-relaxed text-[#888]">{feature.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 flex justify-center lg:hidden">
          <LeadPreviewCard onOpen={() => setOpen(true)} />
        </div>
      </div>

      <CalculatorModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
