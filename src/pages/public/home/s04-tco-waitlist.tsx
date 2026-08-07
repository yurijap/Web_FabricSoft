import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../../../config/api";
import { getInteractionTracking } from "../../../utils/tracking";

type CloudProvider = "AWS" | "Google Cloud (GCP)" | "Microsoft Azure" | "OCI" | "Otro / On-premise";
type AnalysisPeriod = "Último mes" | "Últimos 3 meses" | "Últimos 12 meses";
type CriticalApplication =
  | "SAP S/4 HANA"
  | "SAP ECC"
  | "Microsoft Dynamics"
  | "NetSuite"
  | "Oracle EBS"
  | "Oracle JD Edwards"
  | "Oracle PeopleSoft"
  | "Apps custom / legacy"
  | "Otro";
type AnalysisObjective =
  | "Reducir costos"
  | "Comparar OCI"
  | "Preparar business case"
  | "Migrar desde AWS/GCP/Azure"
  | "Validar si pagamos de más";

type CloudForm = {
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  cloudProvider: CloudProvider;
  monthlySpend: number;
  analysisPeriod: AnalysisPeriod;
  criticalApplication: CriticalApplication;
  objective: AnalysisObjective;
  workload: string;
  hasBreakdown: boolean;
  computeSpend: number;
  storageSpend: number;
  databaseSpend: number;
  networkingSpend: number;
  otherSpend: number;
  ndaAccepted: boolean;
};

const DEFAULT_FORM: CloudForm = {
  name: "",
  company: "",
  role: "",
  email: "",
  phone: "",
  cloudProvider: "AWS",
  monthlySpend: 28500,
  analysisPeriod: "Últimos 12 meses",
  criticalApplication: "SAP S/4 HANA",
  objective: "Validar si pagamos de más",
  workload: "",
  hasBreakdown: false,
  computeSpend: 12400,
  storageSpend: 5800,
  databaseSpend: 7200,
  networkingSpend: 2100,
  otherSpend: 1000,
  ndaAccepted: false,
};

const CLOUD_PROVIDERS: CloudProvider[] = ["AWS", "Google Cloud (GCP)", "Microsoft Azure", "OCI", "Otro / On-premise"];
const PERIODS: AnalysisPeriod[] = ["Último mes", "Últimos 3 meses", "Últimos 12 meses"];
const CRITICAL_APPS: CriticalApplication[] = [
  "SAP S/4 HANA",
  "SAP ECC",
  "Microsoft Dynamics",
  "NetSuite",
  "Oracle EBS",
  "Oracle JD Edwards",
  "Oracle PeopleSoft",
  "Apps custom / legacy",
  "Otro",
];
const OBJECTIVES: AnalysisObjective[] = [
  "Validar si pagamos de más",
  "Reducir costos",
  "Comparar OCI",
  "Preparar business case",
  "Migrar desde AWS/GCP/Azure",
];

const bullets = [
  "Revisión ejecutiva de gasto cloud actual",
  "Comparativo estimado contra Oracle Cloud Infrastructure",
  "ROI, breakeven y rango de oportunidad",
  "Riesgos principales antes de hablar de migración",
];

const fmt = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const clamp = (value: number, min = 0) => {
  if (Number.isNaN(value)) return min;
  return Math.max(value, min);
};

function estimateCloudComparison(form: CloudForm) {
  const monthlySpend = form.monthlySpend || 0;
  const savingsRate = form.cloudProvider === "Otro / On-premise" ? 0.18 : form.cloudProvider === "OCI" ? 0.08 : 0.26;
  const ociMonthly = monthlySpend * (1 - savingsRate);
  const monthlySavings = monthlySpend - ociMonthly;
  const annualSavings = monthlySavings * 12;
  const estimatedMigration = Math.max(monthlySpend * 5.5, 90000);
  const breakeven = annualSavings > 0 ? Math.ceil((estimatedMigration / annualSavings) * 12) : 0;

  return {
    monthlySpend,
    annualSpend: monthlySpend * 12,
    ociMonthly,
    monthlySavings,
    annualSavings,
    savingsRate,
    estimatedMigration,
    breakeven,
    savings5y: annualSavings * 5,
  };
}

function isPublicEmail(email: string) {
  return /(gmail|hotmail|outlook|yahoo|icloud|live|msn|proton)\./i.test(email);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">{children}</span>;
}

const inputClass =
  "w-full border border-[#2A2A2A] bg-[#111] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-all duration-300 placeholder:text-[#F5F5F5]/25 focus:border-[#C9A96E] focus:bg-black rounded-sm";

function getSubmitErrorMessage(error: any) {
  if (!error?.response) {
    return "No hay conexión con el backend. Inicia o reinicia el servidor en http://localhost:4000 y vuelve a intentar.";
  }

  if (error.response.status === 404) {
    return "El backend activo no tiene la ruta de Cloud Comparator. Reinicia el servidor para cargar los cambios.";
  }

  return error.response?.data?.error || error.response?.data?.message || "No se pudo guardar la solicitud. Intenta de nuevo.";
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  required = true,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center border border-[#2A2A2A] bg-[#111] px-4 py-3 transition-all duration-300 focus-within:border-[#C9A96E] focus-within:bg-black rounded-sm">
        <span className="mr-2 font-mono text-sm text-[#F5F5F5]/45">$</span>
        <input
          required={required}
          type="number"
          min={0}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
          className="w-full bg-transparent font-mono text-sm text-[#F5F5F5] outline-none"
        />
      </div>
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={`${inputClass} cursor-pointer appearance-none`}>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#080706]">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ submitting }: { submitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className={[
        "group relative flex w-full items-center justify-center gap-3 overflow-hidden border border-[#C9A96E] px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 sm:w-auto rounded-sm",
        submitting
          ? "cursor-wait bg-[#C9A96E] text-black shadow-[0_0_40px_-10px_rgba(201,169,110,0.9)]"
          : "bg-[#C9A96E]/10 text-[#C9A96E] hover:bg-[#C9A96E] hover:text-black hover:shadow-[0_0_35px_-5px_rgba(201,169,110,0.7)]",
      ].join(" ")}
    >
      {submitting && (
        <span className="absolute inset-y-0 left-0 w-1/3 animate-[sendSweep_900ms_ease-in-out_infinite] bg-white/25" />
      )}
      <span className="relative">{submitting ? "Enviando aplicación" : "Aplicar a revisión"}</span>
      {submitting ? (
        <span className="relative h-4 w-4 animate-spin border border-black/30 border-t-black rounded-full" />
      ) : (
        <svg className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H19M13 6L19 12L13 18" />
        </svg>
      )}
    </button>
  );
}

function ReportPreview({ form }: { form: CloudForm }) {
  const estimate = estimateCloudComparison(form);
  const rows = [
    { label: "Cloud actual", value: form.cloudProvider },
    { label: "Periodo", value: form.analysisPeriod },
    { label: "Gasto mensual", value: fmt(estimate.monthlySpend) },
    { label: "Gasto anual", value: fmt(estimate.annualSpend) },
    { label: "Aplicación crítica", value: form.criticalApplication },
    { label: "Objetivo", value: form.objective },
    { label: "Equivalente OCI mensual", value: fmt(estimate.ociMonthly), accent: true },
  ];

  return (
    <div className="relative border border-[#2A2A2A] bg-[#080706] p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-500 hover:border-[#C9A96E]/40 md:p-8 rounded-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent opacity-50" />

      <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A]/60 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">Muestra ejecutiva</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F5F5]/40">Estimado inicial</span>
      </div>

      <div className="border border-[#2A2A2A]/60 bg-[#111] p-6 rounded-sm">
        <div className="space-y-4">
          {rows.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 border-b border-[#2A2A2A]/40 pb-3 last:border-b-0 last:pb-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/60">{item.label}</span>
              <span className={`text-right font-mono text-[11px] font-bold uppercase tracking-[0.1em] ${item.accent ? "text-[#C9A96E]" : "text-[#F5F5F5]/80"}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 border-t border-[#2A2A2A] pt-6 sm:grid-cols-2">
          <div className="border border-[#C9A96E]/10 bg-[#C9A96E]/[0.02] p-5 text-center rounded-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]/80">Ahorro anual estimado</p>
            <p className="mt-2 font-serif text-3xl tracking-tight text-[#C9A96E]">{fmt(estimate.annualSavings)}</p>
          </div>
          <div className="border border-[#2A2A2A]/60 bg-[#080706] p-5 text-center rounded-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/45">Breakeven</p>
            <p className="mt-2 font-serif text-3xl tracking-tight text-[#F5F5F5]">{estimate.breakeven} meses</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloudComparatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CloudForm>(DEFAULT_FORM);
  const [step, setStep] = useState(0);
  const estimate = useMemo(() => estimateCloudComparison(form), [form]);
  const steps = [
    { label: "Perfil", title: "Quién solicita la revisión" },
    { label: "Gasto", title: "Cloud, gasto y aplicación crítica" },
    { label: "Caso", title: "Workload y autorización NDA" },
  ];

  if (!isOpen) return null;

  const update = <K extends keyof CloudForm>(key: K, value: CloudForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateStep = (targetStep = step) => {
    if (targetStep === 0) {
      if (!form.name.trim() || !form.company.trim() || !form.role.trim()) {
        setError("Completa nombre, empresa y cargo.");
        return false;
      }

      if (isPublicEmail(form.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("Usa un correo corporativo para aplicar a la revisión.");
        return false;
      }
    }

    if (targetStep === 1) {
      if (!form.cloudProvider || form.monthlySpend <= 0 || !form.criticalApplication || !form.objective) {
        setError("Completa cloud actual, gasto mensual, aplicación crítica y objetivo.");
        return false;
      }
    }

    if (targetStep === 2) {
      if (!form.workload.trim() || form.workload.trim().length < 10) {
        setError("Describe brevemente el workload principal.");
        return false;
      }

      if (!form.ndaAccepted) {
        setError("Acepta la revisión bajo NDA para continuar.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const previousStep = () => {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;

    try {
      setSubmitting(true);
      await api.post("/cloud-comparator/submit", {
        nombre: form.name,
        empresa: form.company,
        cargo: form.role,
        email: form.email,
        telefono: form.phone,
        cloudProvider: form.cloudProvider,
        monthlySpend: form.monthlySpend,
        analysisPeriod: form.analysisPeriod,
        criticalApplication: form.criticalApplication,
        objective: form.objective,
        workload: form.workload,
        ndaAccepted: form.ndaAccepted,
        breakdown: form.hasBreakdown
          ? {
              compute: form.computeSpend,
              storage: form.storageSpend,
              database: form.databaseSpend,
              networking: form.networkingSpend,
              other: form.otherSpend,
            }
          : {},
        tracking: getInteractionTracking("cloud-tco", "cloud-comparator-submit"),
      });

      setSubmitted(true);
    } catch (requestError: any) {
      setError(getSubmitErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/90 px-4 py-6 backdrop-blur-md">
      <style>{`
        @keyframes sendSweep {
          0% { transform: translateX(-120%); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(360%); opacity: 0; }
        }
        @keyframes modalRise {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes successPulse {
          0%, 100% { opacity: 0.28; transform: scale(0.96); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="relative w-full max-w-[980px] overflow-hidden border border-[#2A2A2A] bg-[#080706] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-[modalRise_220ms_ease-out] rounded-sm">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center border border-[#2A2A2A] bg-[#111] text-[#F5F5F5]/60 transition-all duration-300 hover:border-[#C9A96E]/50 hover:text-[#C9A96E] rounded-sm"
          aria-label="Cerrar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="grid border-b border-[#2A2A2A] lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 p-5 sm:p-8">
                <div className="pr-10">
                  <span className="mb-3 inline-flex border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-sm">
                    Aplicación privada
                  </span>
                  <h3 className="font-serif text-3xl tracking-tight text-[#F5F5F5] md:text-4xl">Cloud Cost Comparator</h3>
                  <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-[#F5F5F5]/60">
                    Tres pasos. Solo pedimos lo necesario para decidir si tu caso merece revisión senior.
                  </p>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[#F5F5F5]/40">
                    <span>{steps[step].label}</span>
                    <span>{step + 1}/{steps.length}</span>
                  </div>
                  <div className="h-1 overflow-hidden bg-[#1A1A1A]">
                    <div className="h-full bg-[#C9A96E] transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
                  </div>
                </div>

                <div className="mt-8 min-h-[360px] animate-[stepIn_220ms_ease-out]" key={step}>
                  <h4 className="font-serif text-2xl text-[#F5F5F5]">{steps[step].title}</h4>

                  {step === 0 && (
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextInput label="Nombre" value={form.name} onChange={(value) => update("name", value)} />
                      <TextInput label="Empresa" value={form.company} onChange={(value) => update("company", value)} />
                      <TextInput label="Cargo" value={form.role} placeholder="CFO / CIO / CTO" onChange={(value) => update("role", value)} />
                      <TextInput label="Email corporativo" type="email" value={form.email} onChange={(value) => update("email", value)} />
                      <TextInput label="Teléfono opcional" type="tel" value={form.phone} placeholder="+52" required={false} onChange={(value) => update("phone", value)} />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <SelectInput label="Cloud actual" value={form.cloudProvider} options={CLOUD_PROVIDERS} onChange={(value) => update("cloudProvider", value)} />
                      <NumberInput label="Gasto mensual aproximado" value={form.monthlySpend} onChange={(value) => update("monthlySpend", value)} />
                      <SelectInput label="Periodo analizado" value={form.analysisPeriod} options={PERIODS} onChange={(value) => update("analysisPeriod", value)} />
                      <SelectInput label="Aplicación crítica" value={form.criticalApplication} options={CRITICAL_APPS} onChange={(value) => update("criticalApplication", value)} />
                      <SelectInput label="Objetivo principal" value={form.objective} options={OBJECTIVES} onChange={(value) => update("objective", value)} />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="mt-5 space-y-5">
                      <label className="block">
                        <FieldLabel>Workload principal</FieldLabel>
                        <textarea
                          required
                          value={form.workload}
                          placeholder="Ejemplo: ERP financiero, data warehouse, integraciones, analytics o aplicaciones internas."
                          onChange={(event) => update("workload", event.target.value)}
                          className={`${inputClass} min-h-[118px] resize-y`}
                        />
                      </label>

                      <label className="flex items-start gap-3 border border-[#2A2A2A] bg-[#111] p-4 font-sans text-xs leading-relaxed text-[#F5F5F5]/60 rounded-sm">
                        <input
                          type="checkbox"
                          checked={form.hasBreakdown}
                          onChange={(event) => update("hasBreakdown", event.target.checked)}
                          className="mt-1 h-4 w-4 accent-[#C9A96E]"
                        />
                        Tengo desglose mensual por compute, storage, database, networking y otros.
                      </label>

                      {form.hasBreakdown && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <NumberInput label="Compute" value={form.computeSpend} onChange={(value) => update("computeSpend", value)} required={false} />
                          <NumberInput label="Storage" value={form.storageSpend} onChange={(value) => update("storageSpend", value)} required={false} />
                          <NumberInput label="Database" value={form.databaseSpend} onChange={(value) => update("databaseSpend", value)} required={false} />
                          <NumberInput label="Networking" value={form.networkingSpend} onChange={(value) => update("networkingSpend", value)} required={false} />
                          <NumberInput label="Otros" value={form.otherSpend} onChange={(value) => update("otherSpend", value)} required={false} />
                        </div>
                      )}

                      <label className="flex items-start gap-3 border border-[#2A2A2A] bg-[#111] p-4 font-sans text-xs leading-relaxed text-[#F5F5F5]/60 rounded-sm">
                        <input
                          required
                          type="checkbox"
                          checked={form.ndaAccepted}
                          onChange={(event) => update("ndaAccepted", event.target.checked)}
                          className="mt-1 h-4 w-4 accent-[#C9A96E]"
                        />
                        Acepto que FABRIC revise esta información bajo NDA. No se pide acceso operativo ni instrucciones técnicas de migración.
                      </label>
                    </div>
                  )}

                  {error && (
                    <div className="mt-5 border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200 rounded-sm">
                      {error}
                    </div>
                  )}
                </div>
              </div>

              <aside className="border-t border-[#2A2A2A] bg-[#060606] p-5 lg:border-l lg:border-t-0 sm:p-6">
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">Vista previa</p>
                <div className="space-y-4">
                  <div className="flex justify-between gap-4 border-b border-[#2A2A2A]/50 pb-3">
                    <span className="font-sans text-sm text-[#F5F5F5]/55">Costo mensual</span>
                    <span className="font-mono text-sm text-[#F5F5F5]">{fmt(estimate.monthlySpend)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#2A2A2A]/50 pb-3">
                    <span className="font-sans text-sm text-[#F5F5F5]/55">OCI estimado</span>
                    <span className="font-mono text-sm text-[#C9A96E]">{fmt(estimate.ociMonthly)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#2A2A2A]/50 pb-3">
                    <span className="font-sans text-sm text-[#F5F5F5]/55">Ahorro anual</span>
                    <span className="font-mono text-sm text-[#C9A96E]">{fmt(estimate.annualSavings)}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-[#2A2A2A]/50 pb-3">
                    <span className="font-sans text-sm text-[#F5F5F5]/55">Breakeven</span>
                    <span className="font-mono text-sm text-[#F5F5F5]">{estimate.breakeven} meses</span>
                  </div>
                </div>
                <p className="mt-6 font-sans text-xs leading-relaxed text-[#F5F5F5]/45">
                  Estimación preliminar. El análisis final depende de validación senior y supuestos financieros.
                </p>
              </aside>
            </div>

            <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 0 || submitting}
                className="h-11 border border-[#2A2A2A] px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/45 transition hover:border-[#F5F5F5]/30 hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-30 rounded-sm"
              >
                Regresar
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="h-11 border border-[#C9A96E] bg-[#C9A96E]/10 px-6 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9A96E] transition hover:bg-[#C9A96E] hover:text-black rounded-sm"
                >
                  Continuar
                </button>
              ) : (
                <SubmitButton submitting={submitting} />
              )}
            </div>
          </form>
        ) : (
          <div className="mx-auto flex max-w-[560px] flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center border border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E] rounded-sm">
              <span className="absolute inset-0 animate-[successPulse_1400ms_ease-in-out_infinite] border border-[#C9A96E]/40 rounded-sm" />
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-3xl text-[#F5F5F5] md:text-4xl">Aplicación recibida</h3>
            <p className="mt-4 font-sans text-base leading-relaxed text-[#F5F5F5]/60">
              FABRIC revisará si tu caso califica para el Cloud Cost Comparator. Si hay encaje, prepararemos el análisis inicial en 5-7 días.
            </p>
            <button onClick={onClose} className="mt-10 border-b border-[#C9A96E]/50 pb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#C9A96E] transition-colors duration-300 hover:border-[#F5F5F5] hover:text-[#F5F5F5]">
              Cerrar ventana
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function S04TcoWaitlist() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const preview = estimateCloudComparison(DEFAULT_FORM);

  return (
    <section id="cloud-tco" className="relative w-full overflow-hidden bg-[#050203] py-24 text-[#F5F5F5] md:py-32">
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -z-10 m-auto h-[600px] w-[600px] -translate-y-1/2 bg-[#C9A96E] opacity-[0.03] blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-12">
        <div className="mx-auto mb-16 max-w-[840px] text-center">
          <div className="mb-6 inline-flex items-center gap-3 border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-4 py-1.5 backdrop-blur-sm rounded-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">Private Lead Magnet - Cloud Cost Comparator</span>
          </div>

          <h2 className="font-serif text-[clamp(36px,5vw,64px)] leading-[1.05] tracking-tight text-[#F5F5F5]">
            ¿Cuánto pagas <span className="text-[#C9A96E]">realmente</span> en AWS, GCP o Azure?
          </h2>
          <p className="mx-auto mt-6 max-w-[680px] font-sans text-lg leading-relaxed text-[#F5F5F5]/60">
            Aplica a una revisión ejecutiva sin costo. FABRIC compara tu gasto cloud actual contra OCI y define si existe un caso financiero serio antes de hablar de migración.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:items-start">
          <ReportPreview form={DEFAULT_FORM} />

          <div className="flex flex-col justify-center">
            <div className="space-y-5">
              {bullets.map((item) => (
                <div key={item} className="flex items-start gap-4 border-b border-[#2A2A2A]/40 pb-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-[#C9A96E]/30 bg-[#C9A96E]/10 text-[#C9A96E] rounded-sm">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-sans text-[15px] leading-relaxed text-[#F5F5F5]/70">{item}</p>
                </div>
              ))}
            </div>

            <div className="my-10">
              <h3 className="mb-3 font-serif text-[26px] leading-tight text-[#F5F5F5]">
                No todos los casos califican para revisión.
              </h3>
              <p className="mb-8 font-sans text-[15px] leading-relaxed text-[#F5F5F5]/60">
                Si el gasto, workload y aplicación crítica tienen suficiente peso, FABRIC prepara un comparativo inicial en 5-7 días. Sin acceso operativo. Sin auditoría pesada.
              </p>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex w-full items-center justify-center gap-3 bg-[#C9A96E] px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black shadow-[0_0_20px_-5px_rgba(201,169,110,0.4)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_-5px_rgba(201,169,110,0.7)] active:scale-[0.98] sm:w-auto rounded-sm"
              >
                Aplicar a revisión
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H19M13 6L19 12L13 18" />
                </svg>
              </button>
            </div>

            <div className="border-t border-[#2A2A2A]/60 pt-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F5F5]/40">Ejemplo gasto mensual</p>
                  <p className="font-mono text-[14px] font-bold tracking-[0.1em] text-[#F5F5F5]">{fmt(preview.monthlySpend)}</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F5F5]/40">Ahorro anual estimado</p>
                  <p className="font-mono text-[14px] font-bold tracking-[0.1em] text-[#C9A96E]">{fmt(preview.annualSavings)}</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F5F5]/40">Entrega si califica</p>
                  <p className="font-mono text-[14px] font-bold tracking-[0.1em] text-[#C9A96E]">5-7 días</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CloudComparatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
