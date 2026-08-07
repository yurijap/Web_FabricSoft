import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  INITIAL_STORE,
  type FabricStore,
  type SlotStatus,
  type MetricaPublica,
  type Lead,
  type LeadStatus,
  type OfficeHoursSlot,
} from './fabricStore';




interface FabricContextValue {
  store: FabricStore;

  // Capacidad
  cycleSlot: (index: number) => void;
  setAdmissionOpen: (open: boolean) => void;

  // Métricas
  updateMetrica: (id: string, field: keyof MetricaPublica, value: number | boolean | string) => void;

  // Leads
  updateLeadStatus: (id: string, status: LeadStatus, autor?: string) => void;
  updateLeadNotas: (id: string, notas: string) => void;
  addLead: (lead: Lead) => void;

  // Office Hours
  reservarSlot: (id: string, nombre: string, empresa: string, email: string) => void;
  confirmarSlot: (id: string) => void;
  liberarSlot: (id: string) => void;
}

// ─── CONTEXTO ────────────────────────────────────────────────────────────────

const FabricContext = createContext<FabricContextValue | null>(null);

export function FabricProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<FabricStore>(INITIAL_STORE);

  // ── Capacidad ──────────────────────────────────────────────────────────────

  const cycleSlot = (index: number) => {
    setStore(prev => {
      const order: SlotStatus[] = ['activo', 'reservado', 'libre'];
      const next = [...prev.capacidad.slots];
      next[index] = order[(order.indexOf(next[index]) + 1) % 3];

      // Sincroniza la métrica de proyectos activos automáticamente
      const activos = next.filter(s => s === 'activo').length;
      const metricas = prev.metricas.map(m =>
        m.id === 'slots'
          ? { ...m, value: activos, publicLabel: `${activos} proyectos activos`, version: m.version + 1 }
          : m,
      );

      return {
        ...prev,
        capacidad: { ...prev.capacidad, slots: next },
        metricas,
      };
    });
  };

  const setAdmissionOpen = (open: boolean) => {
    setStore(prev => ({
      ...prev,
      capacidad: { ...prev.capacidad, admissionOpen: open },
    }));
  };

  // ── Métricas ───────────────────────────────────────────────────────────────

  const updateMetrica = (id: string, field: keyof MetricaPublica, value: number | boolean | string) => {
    setStore(prev => ({
      ...prev,
      metricas: prev.metricas.map(m =>
        m.id === id ? { ...m, [field]: value, version: field !== 'visible' ? m.version + 1 : m.version } : m,
      ),
    }));
  };

  // ── Leads ──────────────────────────────────────────────────────────────────

  const updateLeadStatus = (id: string, status: LeadStatus, autor = 'Julio Alvarez') => {
    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    setStore(prev => {
      const leads = prev.leads.map(l =>
        l.id === id
          ? { ...l, status, historial: [...l.historial, { fecha, estado: status, autor }] }
          : l,
      );

      // Actualiza contador waitlist en métricas
      const enWaitList = leads.filter(l => l.status === 'WaitList').length;
      const metricas = prev.metricas.map(m =>
        m.id === 'waitlist'
          ? { ...m, value: enWaitList, publicLabel: `${enWaitList} organizaciones en espera`, version: m.version + 1 }
          : m,
      );

      return { ...prev, leads, metricas };
    });
  };

  const updateLeadNotas = (id: string, notas: string) => {
    setStore(prev => ({
      ...prev,
      leads: prev.leads.map(l => l.id === id ? { ...l, notas } : l),
    }));
  };

  const addLead = (lead: Lead) => {
    setStore(prev => ({ ...prev, leads: [lead, ...prev.leads] }));
  };

  // ── Office Hours ───────────────────────────────────────────────────────────

  const reservarSlot = (id: string, nombre: string, empresa: string, email: string) => {
    setStore(prev => ({
      ...prev,
      officeHours: prev.officeHours.map((s: OfficeHoursSlot) =>
        s.id === id
          ? { ...s, disponible: false, reservadoPor: nombre, empresa, email, confirmado: false }
          : s,
      ),
    }));
  };

  const confirmarSlot = (id: string) => {
    setStore(prev => ({
      ...prev,
      officeHours: prev.officeHours.map((s: OfficeHoursSlot) =>
        s.id === id ? { ...s, confirmado: true } : s,
      ),
    }));
  };

  const liberarSlot = (id: string) => {
    setStore(prev => ({
      ...prev,
      officeHours: prev.officeHours.map((s: OfficeHoursSlot) =>
        s.id === id
          ? { ...s, disponible: true, reservadoPor: undefined, empresa: undefined, email: undefined, confirmado: false }
          : s,
      ),
    }));
  };

  return (
    <FabricContext.Provider value={{
      store,
      cycleSlot,
      setAdmissionOpen,
      updateMetrica,
      updateLeadStatus,
      updateLeadNotas,
      addLead,
      reservarSlot,
      confirmarSlot,
      liberarSlot,
    }}>
      {children}
    </FabricContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useFabric() {
  const ctx = useContext(FabricContext);
  if (!ctx) throw new Error('useFabric debe usarse dentro de <FabricProvider>');
  return ctx;
}

/** Acceso directo a métricas por id — útil en secciones del home */
export function useMetrica(id: string) {
  const { store } = useFabric();
  return store.metricas.find(m => m.id === id);
}

/** Acceso directo al estado de capacidad */
export function useCapacidad() {
  const { store, cycleSlot, setAdmissionOpen } = useFabric();
  return { ...store.capacidad, cycleSlot, setAdmissionOpen };
}
