import { useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';

function ErpTcoInteractiveWidget() {
  const [currentLicenses, setCurrentLicenses] = useState(120000);
  const [currentInfra, setCurrentInfra] = useState(80000);
  const [currentSupport, setCurrentSupport] = useState(60000);
  const [currentConsultants, setCurrentConsultants] = useState(150000);

  const currentAnnualTotal = currentLicenses + currentInfra + currentSupport + currentConsultants;
  const oracleLicenses = Math.round(currentLicenses * 0.7);
  const oracleInfra = 0;
  const oracleSupport = Math.round(oracleLicenses * 0.22);
  const oracleConsultants = Math.round(currentConsultants * 0.35);

  const oracleAnnualTotal = oracleLicenses + oracleInfra + oracleSupport + oracleConsultants;
  const annualSavings = currentAnnualTotal - oracleAnnualTotal;
  const migrationCost = Math.round(currentAnnualTotal * 1.1);
  const savings5Yr = annualSavings * 5 - migrationCost;
  const breakEvenMonth = annualSavings > 0 ? Math.round((migrationCost / (annualSavings / 12))) : 0;

  return (
    <div className="space-y-8 font-mono text-xs">
      <div>
        <span className="fabric-badge-premium mb-2 inline-block">FINANCIAL SIMULATOR</span>
        <h3 className="text-2xl font-serif text-white font-light">ERP TCO Calculator</h3>
        <p className="text-zinc-500 text-xs mt-1">Proyecta los costos de licenciamiento, soporte e infraestructura actual frente a Oracle Fusion Cloud.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="range-licenses" className="text-zinc-400">Licencias Anuales ERP (USD)</label>
              <span className="text-white font-bold">${currentLicenses.toLocaleString('en-US')}</span>
            </div>
            <input
              id="range-licenses"
              aria-label="Licencias Anuales ERP"
              type="range"
              min="20000"
              max="800000"
              step="10000"
              value={currentLicenses}
              onChange={(e) => setCurrentLicenses(Number(e.target.value))}
              className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="range-infra" className="text-zinc-400">Servidores / Cloud / Data Center (USD/año)</label>
              <span className="text-white font-bold">${currentInfra.toLocaleString('en-US')}</span>
            </div>
            <input
              id="range-infra"
              aria-label="Costo de Servidores o Data Center"
              type="range"
              min="10000"
              max="500000"
              step="5000"
              value={currentInfra}
              onChange={(e) => setCurrentInfra(Number(e.target.value))}
              className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="range-support" className="text-zinc-400">Soporte Anual / Mantenimiento Base (USD)</label>
              <span className="text-white font-bold">${currentSupport.toLocaleString('en-US')}</span>
            </div>
            <input
              id="range-support"
              aria-label="Soporte Anual o Mantenimiento"
              type="range"
              min="10000"
              max="300000"
              step="5000"
              value={currentSupport}
              onChange={(e) => setCurrentSupport(Number(e.target.value))}
              className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <label htmlFor="range-consultants" className="text-zinc-400">Consultores Externos / Soporte L3 (USD/año)</label>
              <span className="text-white font-bold">${currentConsultants.toLocaleString('en-US')}</span>
            </div>
            <input
              id="range-consultants"
              aria-label="Costo de Consultores Externos"
              type="range"
              min="20000"
              max="1000000"
              step="10000"
              value={currentConsultants}
              onChange={(e) => setCurrentConsultants(Number(e.target.value))}
              className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
            />
          </div>
        </div>

        <div className="md:col-span-5 space-y-6 font-mono text-xs">
          <div className="border border-[#C9A96E]/20 p-5 bg-[#C9A96E]/5 space-y-4 rounded-lg">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Costo ERP Actual (Anual)</span>
              <span className="text-xl text-zinc-400 font-light">${currentAnnualTotal.toLocaleString('en-US')} USD</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Costo Estimado Oracle SaaS</span>
              <span className="text-xl text-[#C9A96E] font-light">${oracleAnnualTotal.toLocaleString('en-US')} USD</span>
            </div>
            <div className="border-t border-[#C9A96E]/20 pt-3">
              <span className="text-[10px] text-zinc-500 block uppercase">Ahorro Neto Recurrente</span>
              <span className="text-2xl text-emerald-500 font-bold">${annualSavings.toLocaleString('en-US')} USD/año</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-zinc-400">
            <div className="flex justify-between">
              <span>Costo de Migración Est.</span>
              <span className="text-white font-bold">${migrationCost.toLocaleString('en-US')} USD</span>
            </div>
            <div className="flex justify-between">
              <span>Punto de Retorno (ROI)</span>
              <span className="text-emerald-500 font-bold">Mes {breakEvenMonth}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2">
              <span>Ahorro Acumulado 5 Años</span>
              <span className="text-[#C9A96E] font-bold">${savings5Yr.toLocaleString('en-US')} USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Workload {
  id: string;
  name: string;
  provider: 'OCI' | 'AWS' | 'Azure' | 'GCP';
  compute: number;
  storage: number;
  database: number;
  egress: number;
  features: string[];
  notes: string;
}

const DEMO_WORKLOADS: Record<string, Workload> = {
  'OCI-FIN-993': {
    id: 'OCI-FIN-993',
    name: 'Core ERP Financiero (Large-scale)',
    provider: 'OCI',
    compute: 25000,
    storage: 12000,
    database: 35000,
    egress: 1000,
    features: [
      'Exadata Cloud Service nativo habilitado',
      'Soporte de base de datos Oracle RAC (Active-Active clustering)',
      'Conectividad FastConnect dedicada',
      'Latencias de base de datos ultra bajas (< 1ms)',
      '10 TB de transferencia saliente mensual incluida sin costo extra'
    ],
    notes: 'Despliegue de misión crítica que requiere alto rendimiento transaccional y disponibilidad continua para el cierre contable.'
  },
  'AWS-RTL-442': {
    id: 'AWS-RTL-442',
    name: 'Portal de Retail E-Commerce (Medium-High traffic)',
    provider: 'AWS',
    compute: 30000,
    storage: 18000,
    database: 25000,
    egress: 15000,
    features: [
      'Autoscaling EC2 detrás de Application Load Balancer',
      'Amazon Aurora Serverless v2 con réplicas de lectura',
      'Alta dependencia de AWS CloudFront CDN',
      'Egress excesivo debido a descargas de assets de imágenes y APIs',
      'Alta disponibilidad multi-zona (Multi-AZ)'
    ],
    notes: 'Workload con picos de tráfico estacionales. El costo de egress representa un porcentaje desproporcionado del gasto total de red.'
  },
  'AZR-HLT-105': {
    id: 'AZR-HLT-105',
    name: 'Sistema de Salud e Historial Clínico (EMR)',
    provider: 'Azure',
    compute: 18000,
    storage: 22000,
    database: 20000,
    egress: 8000,
    features: [
      'Despliegue en zona de cumplimiento estricto (HIPAA/HITRUST)',
      'Alto volumen de imágenes médicas (PACS) almacenadas en Blob Storage',
      'Base de datos SQL Managed Instance de misión crítica',
      'Conexión ExpressRoute de respaldo a data centers locales',
      'Replicación geo-redundante para desastres (GRS)'
    ],
    notes: 'Entorno highly seguro y enfocado en compliance con gran peso en almacenamiento de archivos binarios grandes.'
  },
  'GCP-DAT-881': {
    id: 'GCP-DAT-881',
    name: 'Framework de Analítica y Big Data',
    provider: 'GCP',
    compute: 40000,
    storage: 35000,
    database: 15000,
    egress: 25000,
    features: [
      'Cientos de nodos de Kubernetes auto-escalables en GKE',
      'BigQuery para consultas masivas de datos semi-estructurados',
      'Transmisión continua (Ingest) con Cloud Pub/Sub',
      'Enorme tráfico de red de salida (Egress) para reportes y APIs externas',
      'Procesamiento distribuido masivo de logs y telemetría'
    ],
    notes: 'Workload analítico enfocado en ingesta de millones de eventos por segundo y exportaciones a sistemas BI externos.'
  }
};

const MULTIPLIERS = {
  OCI: { compute: 1.0, storage: 1.0, database: 1.0, egress: 1.0 },
  AWS: { compute: 1.43, storage: 1.66, database: 2.0, egress: 10.0 },
  Azure: { compute: 1.35, storage: 1.50, database: 1.8, egress: 9.0 },
  GCP: { compute: 1.30, storage: 1.40, database: 1.6, egress: 8.5 }
};

const PROVIDER_TECH_HIGHS: Record<string, string[]> = {
  OCI: [
    'Exadata Database Cloud Service con RAC (Active-Active)',
    'FastConnect privado con egress extremadamente económico (10TB free)',
    'Performance garantizada con SLAs respaldados por contratos'
  ],
  AWS: [
    'Amazon Aurora Serverless con réplicas multizona',
    'Amplio ecosistema de add-ons de terceros en AWS Marketplace',
    'Egress tarificado a $0.09 USD/GB tras primer umbral'
  ],
  Azure: [
    'Azure SQL Managed Instance con compatibilidad nativa SQL Server',
    'Integración directa con Directorio Activo (Entra ID)',
    'ExpressRoute privado para entornos híbridos'
  ],
  GCP: [
    'GKE (Google Kubernetes Engine) para orquestación de contenedores',
    'BigQuery para analítica masiva serverless de alta velocidad',
    'Interconexión de red global de baja latencia'
  ]
};

function CloudCostInteractiveWidget() {
  const [activeTab, setActiveTab] = useState<'general' | 'id'>('general');

  // Tab 1: General Slider States
  const [provider, setProvider] = useState<'AWS' | 'Azure' | 'GCP'>('AWS');
  const [computeCost, setComputeCost] = useState(5000);
  const [storageCost, setStorageCost] = useState(3000);
  const [databaseCost, setDatabaseCost] = useState(6000);
  const [egressCost, setEgressCost] = useState(2500);

  // Tab 2: ID Search States
  const [searchId, setSearchId] = useState('');
  const [matchedWorkload, setMatchedWorkload] = useState<Workload | null>(null);
  const [compareProvider, setCompareProvider] = useState<'OCI' | 'AWS' | 'Azure' | 'GCP' | null>(null);

  // Tab 1 calculations
  const currentMonthlyTotal = computeCost + storageCost + databaseCost + egressCost;
  const ociCompute = Math.round(computeCost * 0.7);
  const ociStorage = Math.round(storageCost * 0.6);
  const ociDatabase = Math.round(databaseCost * 0.5);
  const ociEgress = Math.round(egressCost * 0.1);
  const ociMonthlyTotal = ociCompute + ociStorage + ociDatabase + ociEgress;
  const monthlySavings = currentMonthlyTotal - ociMonthlyTotal;
  const annualSavings = monthlySavings * 12;

  // Handle Search ID input change
  const handleIdSearch = (id: string) => {
    setSearchId(id);
    const cleaned = id.trim().toUpperCase();
    if (DEMO_WORKLOADS[cleaned]) {
      const wk = DEMO_WORKLOADS[cleaned];
      setMatchedWorkload(wk);
      setCompareProvider(wk.provider === 'OCI' ? 'AWS' : 'OCI');
    } else {
      setMatchedWorkload(null);
      setCompareProvider(null);
    }
  };

  // Tab 2 calculations helper
  const calculateEquivalent = (
    value: number,
    category: 'compute' | 'storage' | 'database' | 'egress',
    from: 'OCI' | 'AWS' | 'Azure' | 'GCP',
    to: 'OCI' | 'AWS' | 'Azure' | 'GCP'
  ) => {
    const ociBase = value / MULTIPLIERS[from][category];
    return Math.round(ociBase * MULTIPLIERS[to][category]);
  };

  return (
    <div className="space-y-8 font-mono text-xs">
      {/* Header */}
      <div id="infra-cost-simulator" className="scroll-mt-24 md:scroll-mt-28">
        <span className="fabric-badge-premium mb-2 inline-block">COSTOS DE INFRAESTRUCTURA</span>
        <h3 className="text-2xl font-serif text-white font-light">Cloud Cost Comparator</h3>
        <p className="text-zinc-500 text-xs mt-1">Calcula y compara los costos y arquitecturas de tu infraestructura cloud.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 sm:px-6 py-3 border-b-2 text-center cursor-pointer transition-all duration-300 font-bold uppercase tracking-wider ${
            activeTab === 'general'
              ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          [ DÓNDE ESTAMOS VIENDO ]
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('id')}
          className={`px-4 sm:px-6 py-3 border-b-2 text-center cursor-pointer transition-all duration-300 font-bold uppercase tracking-wider ${
            activeTab === 'id'
              ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/10'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          [ COMPARAR CON ID ]
        </button>
      </div>

      {/* General Tab View */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left panel: sliders */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 block">Proveedor Actual:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['AWS', 'Azure', 'GCP'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`p-2.5 border text-center transition-colors cursor-pointer rounded ${
                      provider === p ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/10 font-bold' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="cloud-compute" className="text-zinc-400">Compute / Instancias Virtuales (USD/mes)</label>
                <span className="text-white font-bold">${computeCost.toLocaleString('en-US')}</span>
              </div>
              <input
                id="cloud-compute"
                type="range"
                min="500"
                max="50000"
                step="500"
                value={computeCost}
                onChange={(e) => setComputeCost(Number(e.target.value))}
                className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="cloud-storage" className="text-zinc-400">Almacenamiento / SSD / Backup (USD/mes)</label>
                <span className="text-white font-bold">${storageCost.toLocaleString('en-US')}</span>
              </div>
              <input
                id="cloud-storage"
                type="range"
                min="300"
                max="30000"
                step="300"
                value={storageCost}
                onChange={(e) => setStorageCost(Number(e.target.value))}
                className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="cloud-db" className="text-zinc-400">Database PaaS (RDS / Managed SQL)</label>
                <span className="text-white font-bold">${databaseCost.toLocaleString('en-US')}</span>
              </div>
              <input
                id="cloud-db"
                type="range"
                min="500"
                max="50000"
                step="500"
                value={databaseCost}
                onChange={(e) => setDatabaseCost(Number(e.target.value))}
                className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="cloud-egress" className="text-zinc-400">Red / Egress / Ancho de Banda Saliente (USD/mes)</label>
                <span className="text-white font-bold">${egressCost.toLocaleString('en-US')}</span>
              </div>
              <input
                id="cloud-egress"
                type="range"
                min="100"
                max="20000"
                step="100"
                value={egressCost}
                onChange={(e) => setEgressCost(Number(e.target.value))}
                className="w-full accent-[#C9A96E] bg-zinc-900 cursor-pointer"
              />
            </div>
          </div>

          {/* Right panel: results */}
          <div className="md:col-span-5 space-y-6">
            <div className="border border-[#C9A96E]/20 p-5 bg-[#C9A96E]/5 space-y-4 rounded-lg">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Costo Mensual {provider}</span>
                <span className="text-xl text-zinc-400 font-light">${currentMonthlyTotal.toLocaleString('en-US')} USD</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Costo Mensual OCI Equiv.</span>
                <span className="text-xl text-[#C9A96E] font-light">${ociMonthlyTotal.toLocaleString('en-US')} USD</span>
              </div>
              <div className="border-t border-[#C9A96E]/20 pt-3">
                <span className="text-[10px] text-zinc-500 block uppercase">Ahorro Mensual Neto</span>
                <span className="text-2xl text-emerald-500 font-bold">${monthlySavings.toLocaleString('en-US')} USD/mes</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-zinc-400">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span>Ahorro Anual Proyectado</span>
                <span className="text-emerald-500 font-bold">${annualSavings.toLocaleString('en-US')} USD</span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Eficiencia OCI Estimada</span>
                <span className="text-[#C9A96E] font-bold">~{Math.round((monthlySavings / currentMonthlyTotal) * 100)}% menos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ID Tab View */}
      {activeTab === 'id' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-black border border-[#C9A96E]/30 p-5 rounded-lg space-y-4 shadow-[0_0_15px_rgba(201,169,110,0.05)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5 flex-1">
                <label className="text-[9px] text-[#C9A96E] font-bold uppercase tracking-wider block">// SIMULATOR DATABASE SEARCH</label>
                <div className="relative">
                  <input
                    aria-label="Buscar base de datos de simulación por ID"
                    type="text"
                    value={searchId}
                    onChange={(e) => handleIdSearch(e.target.value)}
                    placeholder="Ingrese ID (ej. AWS-RTL-442 o OCI-FIN-993)"
                    className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-[#C9A96E] text-white pl-4 pr-4 py-2.5 outline-none font-mono text-xs placeholder:text-zinc-700 rounded transition-all"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg lg:w-[380px] space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] text-[#C9A96E] font-bold uppercase tracking-wide">
                  <span>ℹ IDs Disponibles en Sistema</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                  Utilice uno de los siguientes identificadores preestablecidos para cargar la telemetría correspondiente:
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.keys(DEMO_WORKLOADS).map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleIdSearch(id)}
                      className={`px-2.5 py-1 text-[9px] font-mono border rounded cursor-pointer transition-all duration-300 ${
                        searchId.trim().toUpperCase() === id
                          ? "border-[#C9A96E] bg-[#C9A96E]/20 text-white shadow-[0_0_8px_rgba(201,169,110,0.25)]"
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-transparent"
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result content */}
          {!matchedWorkload ? (
            <div className="border border-dashed border-zinc-800 p-12 text-center text-zinc-600 rounded-lg">
              <p>Esperando ID de nube demo válido para iniciar comparación...</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {Object.keys(DEMO_WORKLOADS).map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleIdSearch(id)}
                    className="px-2.5 py-1 text-[10px] border border-zinc-800 hover:border-[#C9A96E] text-zinc-400 hover:text-[#C9A96E] cursor-pointer transition-colors bg-transparent rounded"
                  >
                    {id} ({DEMO_WORKLOADS[id].provider})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Workload Info */}
              <div className="lg:col-span-4 border border-[#C9A96E]/30 p-5 bg-zinc-950/80 rounded-lg space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[2px] h-full bg-[#C9A96E]" />
                
                <div>
                  <span className="text-[8px] font-mono text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold">
                    REGISTRO DETECTADO
                  </span>
                  <h4 className="text-sm font-bold text-white font-serif mt-2.5">{matchedWorkload.name}</h4>
                  <p className="text-zinc-500 text-[10px] mt-1 font-mono">// ID RESIDENTE: {matchedWorkload.id}</p>
                </div>

                <div className="border-t border-zinc-900/60 pt-3.5 space-y-2.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">PROVEEDOR ORIGINAL:</span>
                    <span className="text-[#C9A96E] font-bold tracking-wide">{matchedWorkload.provider}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">COSTO MENSUAL BASE:</span>
                    <span className="text-white font-bold">${(matchedWorkload.compute + matchedWorkload.storage + matchedWorkload.database + matchedWorkload.egress).toLocaleString('en-US')} USD</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900/60 pt-3.5 space-y-2">
                  <span className="text-[9px] text-[#C9A96E] font-bold uppercase tracking-wider block">// ARQUITECTURA DE ORIGEN:</span>
                  <ul className="space-y-2 text-[10px] text-zinc-400 font-sans">
                    {matchedWorkload.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#C9A96E] shrink-0 font-bold">▪</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Comparative Grid */}
              <div className="lg:col-span-8 space-y-6">
                {/* Select target cloud */}
                <div className="space-y-2.5">
                  <label className="text-[9px] text-[#C9A96E] font-bold uppercase tracking-wider block">// SELECCIONE NUBE PARA COMPARATIVA DE COSTOS</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['OCI', 'AWS', 'Azure', 'GCP'] as const).map(p => {
                      const isDisabled = p === matchedWorkload.provider;
                      const isSelected = compareProvider === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setCompareProvider(p)}
                          className={`p-2.5 border text-center transition-all duration-300 font-bold rounded ${
                            isDisabled
                              ? 'border-zinc-900/30 text-zinc-800 cursor-not-allowed bg-transparent font-light'
                              : isSelected
                              ? 'border-[#C9A96E] text-[#C9A96E] bg-[#C9A96E]/10 cursor-pointer'
                              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 cursor-pointer bg-zinc-950/20'
                          }`}
                        >
                          {p} {isDisabled ? '(ORIGINAL)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {compareProvider && (
                  <div className="space-y-6">
                    {/* Comparative Table */}
                    <div className="border border-[#C9A96E]/30 rounded-lg overflow-hidden bg-black">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#C9A96E]/25 bg-zinc-900/30 font-mono text-[10px] uppercase text-zinc-400">
                              <th className="p-3.5">CONCEPTO</th>
                              <th className="p-3.5 text-right">{matchedWorkload.provider} (ORIGINAL)</th>
                              <th className="p-3.5 text-[#C9A96E] text-right">{compareProvider} (SIMULADO)</th>
                              <th className="p-3.5 text-right">DESVIACIÓN / AHORRO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#C9A96E]/15 font-mono">
                            {(['compute', 'storage', 'database', 'egress'] as const).map(cat => {
                              const origVal = matchedWorkload[cat];
                              const compVal = calculateEquivalent(origVal, cat, matchedWorkload.provider, compareProvider);
                              const diff = compVal - origVal;
                              const diffPct = Math.round((diff / origVal) * 100);
                              return (
                                <tr key={cat} className="hover:bg-zinc-900/10 text-[11px] transition-colors">
                                  <td className="p-3.5 text-zinc-300 font-bold capitalize">{cat === 'compute' ? 'Compute / VMs' : cat === 'storage' ? 'Almacenamiento' : cat === 'database' ? 'Base de Datos' : 'Red / Egress'}</td>
                                  <td className="p-3.5 text-right text-zinc-400">${origVal.toLocaleString('en-US')}</td>
                                  <td className="p-3.5 text-right text-white font-bold">${compVal.toLocaleString('en-US')}</td>
                                  <td className={`p-3.5 text-right font-bold ${diff < 0 ? 'text-emerald-500' : diff > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                                    {diff < 0 ? '-' : diff > 0 ? '+' : ''}${Math.abs(diff).toLocaleString('en-US')} ({diffPct > 0 ? '+' : ''}{diffPct}%)
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* Totals */}
                            {(() => {
                              const origTotal = matchedWorkload.compute + matchedWorkload.storage + matchedWorkload.database + matchedWorkload.egress;
                              const compTotal =
                                calculateEquivalent(matchedWorkload.compute, 'compute', matchedWorkload.provider, compareProvider) +
                                calculateEquivalent(matchedWorkload.storage, 'storage', matchedWorkload.provider, compareProvider) +
                                calculateEquivalent(matchedWorkload.database, 'database', matchedWorkload.provider, compareProvider) +
                                calculateEquivalent(matchedWorkload.egress, 'egress', matchedWorkload.provider, compareProvider);
                              const totalDiff = compTotal - origTotal;
                              const totalDiffPct = Math.round((totalDiff / origTotal) * 100);
                              
                              return (
                                <>
                                  <tr className="border-t-2 border-[#C9A96E]/30 bg-zinc-950 font-bold text-xs">
                                    <td className="p-3.5 text-zinc-200">Costo Mensual Total</td>
                                    <td className="p-3.5 text-right text-zinc-400">${origTotal.toLocaleString('en-US')}</td>
                                    <td className="p-3.5 text-right text-[#C9A96E] font-bold">${compTotal.toLocaleString('en-US')}</td>
                                    <td className={`p-3.5 text-right ${totalDiff < 0 ? 'text-emerald-500 font-extrabold' : totalDiff > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                                      {totalDiff < 0 ? '-' : totalDiff > 0 ? '+' : ''}${Math.abs(totalDiff).toLocaleString('en-US')} ({totalDiffPct > 0 ? '+' : ''}{totalDiffPct}%)
                                    </td>
                                  </tr>
                                  <tr className="bg-zinc-950/60 text-[11px]">
                                    <td className="p-3.5 text-zinc-500">Costo Anual Proyectado</td>
                                    <td className="p-3.5 text-right text-zinc-600">${(origTotal * 12).toLocaleString('en-US')}</td>
                                    <td className="p-3.5 text-right text-zinc-300 font-bold">${(compTotal * 12).toLocaleString('en-US')}</td>
                                    <td className={`p-3.5 text-right font-extrabold ${totalDiff < 0 ? 'text-emerald-500' : totalDiff > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                                      {totalDiff < 0 ? 'Ahorro' : 'Premium'}: ${Math.abs(totalDiff * 12).toLocaleString('en-US')} USD/año
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Technical Comparison Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Original Provider Technical notes */}
                      <div className="border border-zinc-800 p-4 bg-zinc-950/30 rounded-lg">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1 font-mono">
                          ⚠ Consideraciones en {matchedWorkload.provider}
                        </h4>
                        <ul className="space-y-2 text-[10px] text-zinc-400 font-sans">
                          {PROVIDER_TECH_HIGHS[matchedWorkload.provider]?.map((h, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-zinc-600 shrink-0">▪</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Target Provider Technical notes */}
                      <div className="border border-[#C9A96E]/20 p-4 bg-[#C9A96E]/5 rounded-lg">
                        <h4 className="text-[10px] text-[#C9A96E] uppercase font-bold mb-2 flex items-center gap-1 font-mono">
                          ✓ Cambios de Arquitectura en {compareProvider}
                        </h4>
                        <ul className="space-y-2 text-[10px] text-zinc-300 font-sans">
                          {PROVIDER_TECH_HIGHS[compareProvider]?.map((h, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-[#C9A96E] shrink-0">▪</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Analytical Insight */}
                    <div className="p-4 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 leading-relaxed font-sans rounded-lg">
                      <span className="font-bold text-[#C9A96E] block mb-1 font-mono">FABRIC OS INSIGHT:</span>
                      {compareProvider === 'OCI' && (
                        <span>
                          Al migrar esta carga de trabajo de {matchedWorkload.provider} a OCI, la mayor reducción de costos se da en Base de Datos (-50%) debido al uso de Exadata Cloud Service y en Red / Egress (-90%) gracias al esquema de red de Oracle. Esto elimina la penalización por crecimiento de datos típica en otras nubes.
                        </span>
                      )}
                      {compareProvider !== 'OCI' && matchedWorkload.provider === 'OCI' && (
                        <span>
                          Migrar esta carga optimizada de OCI a {compareProvider} representa una prima de costo de aproximadamente el {Math.round((calculateEquivalent(matchedWorkload.database, 'database', 'OCI', compareProvider) - matchedWorkload.database) / matchedWorkload.database * 100)}% en base de datos al perder las eficiencias de Exadata y RAC. Adicionalmente, los costos de egress saliente aumentarán sustancialmente ({compareProvider === 'AWS' ? '10x' : compareProvider === 'Azure' ? '9x' : '8.5x'}).
                        </span>
                      )}
                      {matchedWorkload.provider !== 'OCI' && compareProvider !== 'OCI' && (
                        <span>
                          La comparación entre {matchedWorkload.provider} y {compareProvider} muestra diferencias marginales en compute y storage, pero los modelos de licenciamiento de base de datos y tasas de transferencia saliente siguen siendo las áreas críticas donde el gasto de hosting se desborda en ambos proveedores tradicionales.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditTrailInteractiveWidget() {
  const [activeCase, setActiveCase] = useState<'ape' | 'aplazo'>('ape');
  const [gatedDoc, setGatedDoc] = useState<string | null>(null);
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestCompany, setRequestCompany] = useState('');
  const [requestRole, setRequestRole] = useState('');
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const auditTrails = {
    ape: {
      caseName: "APE Plazas — Remediación de facturación masiva",
      verifier: "Ing. Roberto Valdez",
      verifierRole: "Director de Finanzas y Control",
      verifierCompany: "APE Plazas",
      timeline: [
        {
          date: "06 Abril 2026",
          title: "Go-live ejecutado en producción",
          evidence: "Acta formal de liberación del módulo de facturación masiva de arrendamientos en Oracle Fusion Cloud.",
          docName: "Acta_GoLive_APE_Plazas.pdf"
        },
        {
          date: "15 Abril 2026",
          title: "Cierre quincenal validado y conciliado",
          evidence: "Reporte de latencia y consistencia de base de datos OCI sin inconsistencias en el Libro Auxiliar.",
          docName: "Reporte_Latencia_Cierre_Q1_APE.pdf"
        },
        {
          date: "30 Abril 2026",
          title: "Cierre contable completo sin incidencias",
          evidence: "Acta de estabilización operativa y transición a soporte interno firmada de mutuo acuerdo.",
          docName: "Acta_Transicion_Soporte_APE.pdf"
        }
      ]
    },
    aplazo: {
      caseName: "Aplazo — Estabilización de cobros y conciliación GL",
      verifier: "Lic. Sofía Macías",
      verifierRole: "Subdirectora de Sistemas e Integraciones",
      verifierCompany: "Aplazo",
      timeline: [
        {
          date: "04 Marzo 2026",
          title: "Interfaz de cobros recurrentes operando con SLA < 20ms",
          evidence: "Log auditado de transacciones de cobro recurrentes integradas de pasarela al ERP Oracle.",
          docName: "Log_Performance_Gateway_Aplazo.pdf"
        },
        {
          date: "18 Marzo 2026",
          title: "Cuadratura automática del auxiliar de CXC con GL",
          evidence: "Reporte de validación de asientos contables cruzados en Libro Mayor sin diferencias.",
          docName: "Reporte_Auditoria_Cuadratura_CXC.pdf"
        },
        {
          date: "15 Abril 2026",
          title: "Tiempo de cierre contable reducido de 5 días a 4 horas",
          evidence: "Acta de entrega operativa del cierre de ciclo crítico firmada por el contralor financiero.",
          docName: "Acta_Aceptacion_Cierre_Ciclo_Critico.pdf"
        }
      ]
    }
  };

  const currentTrail = auditTrails[activeCase];

  const handleOpenRequest = (docName: string) => {
    setGatedDoc(docName);
    setRequestSuccess(false);
    setRequestName('');
    setRequestEmail('');
    setRequestCompany('');
    setRequestRole('');
    setNdaAccepted(false);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSuccess(true);
  };

  return (
    <div className="font-mono text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Rules */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative border border-zinc-800 bg-black/40 p-6 md:p-8 space-y-6 rounded">
            <div className="fabric-corner top-left" />
            <div className="fabric-corner top-right" />
            <div className="fabric-corner bottom-left" />
            <div className="fabric-corner bottom-right" />

            <div className="space-y-4">
              <span className="text-[10px] text-[#C9A96E] font-bold uppercase block tracking-wider">── CÓMO FUNCIONA ──</span>

              <div className="space-y-3 font-sans text-xs text-zinc-400 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="text-[#C9A96E] mt-0.5">→</span>
                  <span>Cada hito publicado corresponde a un documento oficial firmado por el cliente.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#C9A96E] mt-0.5">→</span>
                  <span>Puedes solicitar cualquier archivo original. Te enviamos un NDA mutuo a tu correo corporativo.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#C9A96E] mt-0.5">→</span>
                  <span>Una vez firmado, liberamos el documento auditado en menos de 2 horas hábiles.</span>
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-zinc-950 border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">DOCUMENTOS</span>
                  <span className="text-[#C9A96E] font-bold">Firmados</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">ACCESO</span>
                  <span className="text-[#C9A96E] font-bold">Bajo NDA</span>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">ENTREGA</span>
                  <span className="text-emerald-500 font-bold">&lt; 2 horas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/40 p-4 rounded text-zinc-500 font-sans text-xs leading-relaxed">
            <span className="font-mono text-[10px] text-[#C9A96E] font-bold block mb-1">CONFIDENCIALIDAD</span>
            El nombre del verificador y los documentos originales nunca se exponen públicamente. El NDA mutuo protege tanto al cliente ancla como al solicitante.
          </div>
        </div>

        {/* Right Column: Timeline audit viewer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 bg-black border border-zinc-800 rounded-xl relative space-y-6">
            {/* Tab Selector */}
            <div className="flex border-b border-zinc-900 pb-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveCase('ape'); setGatedDoc(null); }}
                className={`px-4 py-2 border transition-all cursor-pointer font-serif text-sm rounded ${
                  activeCase === 'ape'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-white font-light'
                    : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800 text-zinc-500'
                }`}
              >
                APE Plazas
              </button>
              <button
                type="button"
                onClick={() => { setActiveCase('aplazo'); setGatedDoc(null); }}
                className={`px-4 py-2 border transition-all cursor-pointer font-serif text-sm rounded ${
                  activeCase === 'aplazo'
                    ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-white font-light'
                    : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800 text-zinc-500'
                }`}
              >
                Aplazo
              </button>
            </div>

            {/* Case Summary */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Registro público</span>
                  <h3 className="text-base font-serif text-white font-light leading-tight">{currentTrail.caseName}</h3>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-emerald-500 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-1 rounded">
                  <span>✓ Trail auditado</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative border-l border-zinc-800 pl-6 ml-3 py-2 space-y-6">
                {currentTrail.timeline.map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-0.5 h-3.5 w-3.5 bg-black border border-zinc-700 rounded-full flex items-center justify-center group-hover:border-[#C9A96E] group-hover:bg-[#C9A96E]/10 transition-colors">
                      <div className="h-1.5 w-1.5 bg-zinc-700 group-hover:bg-[#C9A96E] rounded-full" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[#C9A96E]">
                        <span className="text-white font-bold">{event.date}</span>
                      </div>
                      <h4 className="text-zinc-300 font-sans text-xs font-semibold">{event.title}</h4>
                      <p className="text-zinc-500 font-sans text-xs leading-relaxed max-w-xl">{event.evidence}</p>

                      <button
                        type="button"
                        onClick={() => handleOpenRequest(event.docName)}
                        className="flex flex-wrap items-center gap-2 text-[#C9A96E] hover:text-white transition-colors text-[10px] cursor-pointer pt-1 font-bold uppercase"
                      >
                        <div className="flex items-center gap-1 bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-2 py-0.5 rounded text-[9px] text-[#C9A96E]">
                          <span>🔒 [ ACCESO ENCRIPTADO BAJO NDA MUTUO ]</span>
                        </div>
                        <span className="underline">Solicitar documento: {event.docName}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verifier block */}
              <div className="border-t border-zinc-900 pt-6 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase tracking-wider">Verificable bajo NDA</span>
                  <span className="text-zinc-300 font-bold">{currentTrail.verifier}</span>
                  <span className="text-zinc-500 text-[10px] font-sans ml-1">({currentTrail.verifierRole}, {currentTrail.verifierCompany})</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenRequest(`contacto-directo-${activeCase}.pdf`)}
                  className="fabric-btn-accent text-[10px] shrink-0"
                >
                  🔒 Solicitar referencia directa [NDA]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {gatedDoc && (
        <div className="fixed inset-0 z-[2500] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#C9A96E] p-6 md:p-8 max-w-md w-full relative space-y-6 rounded-lg">
            <button
              type="button"
              onClick={() => setGatedDoc(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer font-mono text-[10px] border border-zinc-800 px-2.5 py-1 bg-black rounded"
            >
              [CERRAR ✕]
            </button>

            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Solicitud de evidencia bajo NDA</span>
                <h4 className="text-sm text-white font-bold leading-tight mt-1">
                  <span className="font-mono text-[#C9A96E]">{gatedDoc}</span>
                </h4>
              </div>

              {requestSuccess ? (
                <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 text-center space-y-3 rounded">
                  <h5 className="text-white text-xs font-serif font-light">Solicitud recibida</h5>
                  <p className="text-zinc-400 font-sans text-[11px] leading-relaxed">
                    Enviamos el Acuerdo de Confidencialidad Mutuo a tu correo corporativo. Una vez firmado digitalmente, liberamos el documento auditado en menos de 2 horas hábiles.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <p className="text-zinc-500 font-sans text-xs leading-relaxed">
                    Ingresa tus datos corporativos para recibir el NDA. No compartimos tu información con terceros.
                  </p>

                  <div className="space-y-3 font-mono">
                    <div>
                      <label className="text-zinc-500 block mb-1 text-[9px] uppercase tracking-wider">Nombre completo</label>
                      <input
                        type="text"
                        required
                        value={requestName}
                        onChange={(e) => setRequestName(e.target.value)}
                        placeholder="Roberto Martínez"
                        className="w-full bg-black border border-zinc-800 text-white px-3 py-2 outline-none focus:border-[#C9A96E] text-xs rounded"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-500 block mb-1 text-[9px] uppercase tracking-wider">Correo corporativo</label>
                      <input
                        type="email"
                        required
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        placeholder="nombre@empresa.com"
                        className="w-full bg-black border border-zinc-800 text-white px-3 py-2 outline-none focus:border-[#C9A96E] text-xs rounded"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-500 block mb-1 text-[9px] uppercase tracking-wider">Empresa</label>
                      <input
                        type="text"
                        required
                        value={requestCompany}
                        onChange={(e) => setRequestCompany(e.target.value)}
                        placeholder="Empresa S.A."
                        className="w-full bg-black border border-zinc-800 text-white px-3 py-2 outline-none focus:border-[#C9A96E] text-xs rounded"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-500 block mb-1 text-[9px] uppercase tracking-wider">Cargo / Puesto</label>
                      <input
                        type="text"
                        required
                        value={requestRole}
                        onChange={(e) => setRequestRole(e.target.value)}
                        placeholder="CIO / Director de Finanzas"
                        className="w-full bg-black border border-zinc-800 text-white px-3 py-2 outline-none focus:border-[#C9A96E] text-xs rounded"
                      />
                    </div>

                    <label className="flex items-start gap-2 pt-2 cursor-pointer text-zinc-500 hover:text-zinc-400 select-none">
                      <input
                        type="checkbox"
                        checked={ndaAccepted}
                        onChange={(e) => setNdaAccepted(e.target.checked)}
                        className="mt-0.5 accent-[#C9A96E]"
                      />
                      <span className="font-sans text-[10px] leading-snug">
                        Acepto la emisión de un Acuerdo de Confidencialidad mutuo sobre la evidencia técnica solicitada.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="fabric-btn-accent w-full justify-center py-2.5 text-xs font-mono uppercase mt-2"
                  >
                    Enviar solicitud de NDA →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RescueAssessmentInteractiveWidget() {
  const [escenario, setEscenario] = useState<'fusion-fallando' | 'migrando' | 'greenfield' | null>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'quiz' | 'capture' | 'result'>('quiz');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');

  const questions = [
    {
      id: 'q1',
      text: '¿Cuántos días tarda hoy el cierre contable mensual en Fusion?',
      options: [
        { label: '1-5 días', score: 0 },
        { label: '6-10 días', score: 1 },
        { label: '11-20 días', score: 2 },
        { label: 'Más de 20 días', score: 3 },
      ],
    },
    {
      id: 'q2',
      text: '¿Qué parte del cierre sigue ocurriendo fuera de Fusion?',
      options: [
        { label: 'Nada relevante', score: 0 },
        { label: 'Solo conciliaciones menores', score: 1 },
        { label: 'Partidas clave en Excel', score: 2 },
        { label: 'El cierre depende de procesos manuales', score: 3 },
      ],
    },
    {
      id: 'q3',
      text: '¿Cuántos reportes ejecutivos o financieros se generan fuera del ERP?',
      options: [
        { label: 'Ninguno', score: 0 },
        { label: '1-3 reportes', score: 1 },
        { label: '4-10 reportes', score: 2 },
        { label: 'Más de 10 reportes', score: 3 },
      ],
    },
    {
      id: 'q4',
      text: '¿Qué tan críticos son los reportes manuales que siguen activos?',
      options: [
        { label: 'No impactan decisiones', score: 0 },
        { label: 'Apoyan revisiones internas', score: 1 },
        { label: 'Se usan para dirección o auditoría', score: 2 },
        { label: 'La operación depende de ellos', score: 3 },
      ],
    },
    {
      id: 'q5',
      text: '¿Qué porcentaje de usuarios clave usa Fusion como sistema principal?',
      options: [
        { label: 'Más del 80%', score: 0 },
        { label: '60-80%', score: 1 },
        { label: '30-60%', score: 2 },
        { label: 'Menos del 30%', score: 3 },
      ],
    },
    {
      id: 'q6',
      text: '¿Qué tan frecuente es que los usuarios evadan Fusion con Excel, correo o sistemas paralelos?',
      options: [
        { label: 'Casi nunca', score: 0 },
        { label: 'En casos puntuales', score: 1 },
        { label: 'En procesos importantes', score: 2 },
        { label: 'Es la forma normal de operar', score: 3 },
      ],
    },
  ];

  const escenarios = [
    {
      id: 'fusion-fallando' as const,
      label: 'Fusion fallando',
      desc: 'Tienes Oracle Fusion en producción con problemas críticos activos — cierres lentos, incidencias abiertas, usuarios evadiendo el sistema.',
      tag: 'Rescate activo',
    },
    {
      id: 'migrando' as const,
      label: 'Migrando a Oracle',
      desc: 'Estás en proceso de migración o implementación de Oracle ERP y necesitas validar que vas por buen camino.',
      tag: 'Implementación en curso',
    },
    {
      id: 'greenfield' as const,
      label: 'Greenfield',
      desc: 'Estás evaluando Oracle ERP desde cero — sin implementación previa. Buscas evitar los errores comunes antes de comenzar.',
      tag: 'Nueva implementación',
    },
  ];

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const q = questions[current];
  const hasAnswer = q && q.id in answers;
  const isLast = current === questions.length - 1;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getSeverityLevel = (score: number) => {
    if (score <= 4) return { level: 'BAJO', color: 'text-emerald-400', desc: 'Tu implementación muestra señales de estabilidad relativa. Los problemas detectados son gestionables.' };
    if (score <= 9) return { level: 'MODERADO', color: 'text-amber-400', desc: 'Hay fricción operativa visible. Sin atención en las próximas semanas, los problemas actuales pueden bloquear el próximo cierre contable.' };
    if (score <= 13) return { level: 'ALTO', color: 'text-orange-500', desc: 'Tu Fusion presenta patrones clásicos de abandono post go-live. El riesgo operativo es documentable y el costo crece cada semana.' };
    return { level: 'CRÍTICO', color: 'text-red-500', desc: 'Crisis operativa activa. Tu implementación Oracle requiere intervención inmediata de ingenieros senior especializados en rescate.' };
  };

  const handleReset = () => {
    setStep('quiz');
    setStarted(false);
    setEscenario(null);
    setAnswers({});
    setCurrent(0);
    setEmail('');
    setNombre('');
    setEmpresa('');
  };

  return (
    <div className="space-y-8 font-mono text-xs max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <span className="fabric-badge-premium inline-block">Oracle Fusion Rescue Assessment</span>
        <h2 className="text-3xl md:text-5xl font-serif text-white font-light">
          ¿Qué tan grave está <span className="text-[#C9A96E]">tu implementación?</span>
        </h2>

        {!started && (
          <p className="text-zinc-400 text-sm max-w-xl mx-auto font-sans leading-relaxed pt-2">
            6 preguntas claves · 3 minutos · Diagnóstico de severidad inmediato.
          </p>
        )}
      </div>

      {!started && (
        <div className="space-y-8 pt-4">
          <div className="text-center text-xs text-[#C9A96E] font-bold uppercase tracking-wider">
            ¿Cuál es tu situación actual?
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {escenarios.map((esc) => {
              const isSelected = escenario === esc.id;
              return (
                <button
                  key={esc.id}
                  type="button"
                  onClick={() => setEscenario(esc.id)}
                  className={`p-6 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 shadow-[0_0_20px_rgba(201,169,110,0.15)]'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <span className={`text-[9px] uppercase tracking-widest font-bold block ${isSelected ? 'text-[#C9A96E]' : 'text-zinc-500'}`}>
                      {esc.tag}
                    </span>
                    <h3 className="text-xl font-serif text-white font-light">{esc.label}</h3>
                    <p className="text-zinc-400 text-xs font-sans leading-relaxed">{esc.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setStarted(true)}
              disabled={!escenario}
              className={`fabric-btn-accent px-8 py-3.5 text-xs font-bold uppercase ${!escenario ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-600 bg-transparent' : ''}`}
            >
              Iniciar diagnóstico →
            </button>
          </div>
        </div>
      )}

      {started && step === 'quiz' && q && (
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-8">
          <div className="flex justify-between items-center text-xs border-b border-zinc-900 pb-4">
            <span className="text-[#C9A96E] font-bold uppercase tracking-wider">Pregunta {current + 1} de {questions.length}</span>
            <span className="text-zinc-500">{Object.keys(answers).length} respondidas</span>
          </div>

          <h3 className="text-2xl md:text-3xl font-serif text-white font-light leading-snug">{q.text}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {q.options.map((opt) => {
              const isSelected = answers[q.id] === opt.score;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.score }))}
                  className={`p-4 text-left border rounded-lg transition-all font-sans text-xs flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${isSelected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-zinc-700'}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
            {current > 0 ? (
              <button
                type="button"
                onClick={() => setCurrent((c) => c - 1)}
                className="text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-wider"
              >
                ← Anterior
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                if (isLast) setStep('capture');
                else setCurrent((c) => c + 1);
              }}
              disabled={!hasAnswer}
              className={`fabric-btn-accent px-6 py-2.5 text-xs font-bold uppercase ${!hasAnswer ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-600 bg-transparent' : ''}`}
            >
              {isLast ? 'Ver diagnóstico →' : 'Siguiente →'}
            </button>
          </div>
        </div>
      )}

      {step === 'capture' && (
        <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/80 max-w-md mx-auto space-y-6">
          <div>
            <span className="text-[10px] text-[#C9A96E] font-bold uppercase tracking-widest block mb-1">Un paso más</span>
            <h3 className="text-xl font-serif text-white font-light">Ingresa tu correo para ver el resultado</h3>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-black border border-zinc-800 text-white rounded outline-none focus:border-[#C9A96E]"
            />
            <input
              type="text"
              placeholder="Nombre (opcional)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 bg-black border border-zinc-800 text-white rounded outline-none focus:border-[#C9A96E]"
            />
            <input
              type="text"
              placeholder="Empresa (opcional)"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full p-3 bg-black border border-zinc-800 text-white rounded outline-none focus:border-[#C9A96E]"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep('result')}
            disabled={!validEmail}
            className={`fabric-btn-accent w-full py-3 text-xs font-bold uppercase ${!validEmail ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-600 bg-transparent' : ''}`}
          >
            Ver diagnóstico →
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="p-8 rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/5 text-center space-y-6">
          <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Nivel de severidad</span>
          <div className={`text-4xl md:text-5xl font-mono font-bold ${getSeverityLevel(totalScore).color}`}>
            {getSeverityLevel(totalScore).level}
          </div>
          <p className="text-zinc-300 font-sans text-sm leading-relaxed max-w-lg mx-auto">
            {getSeverityLevel(totalScore).desc}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <a href="#office-hours" className="fabric-btn-accent text-xs px-6 py-3 font-bold uppercase">
              Solicitar evaluación detallada →
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="text-zinc-500 hover:text-white text-xs font-mono uppercase underline"
            >
              Reiniciar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ValidacionDirectaInteractiveWidget() {
  const referencesList = [
    {
      id: 'ref-1',
      title: 'CFO de operadora de centros comerciales (LATAM)',
      context: 'Conciliaciones complejas y reportabilidad multimoneda en Fusion Cloud.',
      auditId: 'REF-APE-2026',
      status: 'Validado · Abril 2026',
      type: 'Retail / Inmobiliario'
    },
    {
      id: 'ref-2',
      title: 'CTO de institución financiera (USD 300M+)',
      context: 'Integración de base de datos transaccional con Oracle ERP Cloud.',
      auditId: 'REF-CTO-2026',
      status: 'Validado · Marzo 2026',
      type: 'Servicios Financieros'
    },
    {
      id: 'ref-3',
      title: 'CFO Controller de fintech regulada',
      context: 'Auditoría, reportes normativos y remediación contable de Fusion.',
      auditId: 'REF-FIN-2026',
      status: 'Validado · Febrero 2026',
      type: 'Fintech / Regulatory'
    },
    {
      id: 'ref-4',
      title: 'CISO/CTO de fintech de crédito al consumo',
      context: 'Seguridad transaccional, automatización de cobro e interfaces bancarias.',
      auditId: 'REF-APZ-2026',
      status: 'Validado · Abril 2026',
      type: 'Fintech / Security'
    },
    {
      id: 'ref-5',
      title: 'Director de Consultoría de Oracle ACS',
      context: 'Análisis técnico externo y validación de metodología de remediación.',
      auditId: 'REF-ACS-2026',
      status: 'Validado · Enero 2026',
      type: 'Oracle ACS / Audit'
    }
  ];

  return (
    <div className="font-mono text-xs">
      <div className="max-w-4xl mb-12">
        <span className="fabric-badge-premium mb-3 inline-block">VALIDACIÓN DIRECTA</span>
        <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
          No decidas a ciegas la seguridad de tu core Oracle: <span className="text-[#C9A96E]">Habla directamente con quienes ya operan sin riesgo.</span>
        </h2>
        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed font-sans">
          La decisión de contratar soporte de ingeniería crítica para sistemas core Oracle requiere validación real. Ofrecemos comunicación directa con quienes ya operan con FABRIC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: References list */}
        <div className="lg:col-span-7 space-y-4">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">
            Referencias disponibles (bajo NDA):
          </span>

          <div className="space-y-3">
            {referencesList.map((ref) => (
              <div
                key={ref.id}
                className="p-4 border border-zinc-900 bg-zinc-950/60 rounded-xl flex gap-3 items-start hover:border-zinc-800 transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#C9A96E]/25" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#C9A96E]/25" />

                <div className="mt-0.5 shrink-0 text-[#C9A96E]">
                  <span className="text-sm">🏢</span>
                </div>

                <div className="text-xs flex-1 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-white font-bold">{ref.title}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-500 py-0.5 px-1.5 rounded uppercase tracking-wider font-bold">
                        {ref.auditId}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 rounded-full font-mono shrink-0">
                        ✓ {ref.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-zinc-500 block leading-normal font-sans">{ref.context}</span>
                  <div className="flex items-center gap-1 text-[8px] font-mono text-[#C9A96E] uppercase tracking-wider">
                    <span>🛡️ Documentación de Acreditación Firmada & Verificada</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Premium Access & Call-to-action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 relative bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#C9A96E]/40" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#C9A96E]/40" />

            <div className="flex items-center gap-2 text-[10px] text-[#C9A96E] font-bold uppercase tracking-wider">
              <span>🔒 Disciplina de Acceso Premium</span>
            </div>

            <p className="text-zinc-400 font-sans leading-relaxed text-xs">
              No publicamos nombres de clientes ni marcas de forma abierta. Para proteger su agenda, las llamadas de referencia están reservadas únicamente para prospectos que aprueben la evaluación de admisión.
            </p>

            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>EVALUACIÓN REQUERIDA:</span>
                <span className="text-emerald-500 font-bold">ACTIVA</span>
              </div>
              <p className="text-zinc-500 text-[10px] font-sans">
                Las credenciales se validarán contra dominios corporativos. Aplican firmas de NDA recíprocas.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <a href="#radar-admision" className="fabric-btn-accent w-full justify-center text-center text-xs py-3 font-bold uppercase">
                Iniciar evaluación →
              </a>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/20 p-4 rounded text-zinc-600 font-mono text-[9px] leading-tight select-none">
            {`// SECURITY HASH VALIDATION TRACE
[SUCCESS] Domain status: corporate verified
[PENDING] NDA signature: required
[INFO] Ref slot booking: available post-admission`}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransparenciaInteractiveWidget() {
  const metrics = [
    { label: "Proyectos entregados en primer ciclo crítico", value: "18", unit: "", badge: "CICLO CRÍTICO", progressValue: 0, subtag: "18 PROYECTOS" },
    { label: "Proyectos dentro de presupuesto Fixed-Price", value: "100", unit: "%", badge: "GARANTÍA TCO", progressValue: 100 },
    { label: "NPS clientes activos", value: "96", unit: "", badge: "SATISFACCIÓN", progressValue: 96 },
    { label: "Retención clientes a 24 meses", value: "98", unit: "%", badge: "LEALTAD LTV", progressValue: 98 },
    { label: "Tiempo medio de respuesta crítico", value: "< 15", unit: " min", badge: "SLA MÁXIMO", progressValue: 0, subtag: "LIMIT CUMPLIDO" },
    { label: "Senior consultants en plantilla", value: "100", unit: "%", badge: "TALENTO CORE", progressValue: 100 },
  ];

  return (
    <div className="font-mono text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column - Information */}
        <div className="lg:col-span-5 space-y-6">
          <span className="fabric-badge-premium mb-3 inline-block">TRANSPARENCIA</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white font-light tracking-tight leading-tight">
            ¿Estás aceptando promesas sin garantías? <span className="text-[#C9A96E]">Descubre los indicadores reales que tu proveedor no se atreve a publicar.</span>
          </h2>
          <p className="text-zinc-400 font-sans leading-relaxed text-sm">
            Publicamos de forma proactiva nuestros indicadores clave de éxito. Creemos en la auditoría abierta de procesos y en el respaldo empírico de cada garantía contractual.
          </p>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
              <span>Última actualización:</span>
              <span className="text-zinc-300">Q1 2026</span>
            </div>
          </div>
        </div>

        {/* Right Column - Table/Console of Metrics */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-[#C9A96E]/35 bg-zinc-950/60 rounded-xl overflow-hidden backdrop-blur-sm shadow-[0_0_15px_rgba(201,169,110,0.08)]">
            {/* Header of the table */}
            <div className="grid grid-cols-12 gap-2 bg-zinc-900/40 px-5 py-4 border-b border-[#C9A96E]/20 text-[10px] tracking-wider text-zinc-500 font-mono uppercase">
              <div className="col-span-8 sm:col-span-7">Indicador de Rendimiento</div>
              <div className="col-span-4 sm:col-span-3 text-right">Valor Auditado</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Estado</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#C9A96E]/15">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-zinc-900/20 transition-all duration-200 group relative"
                >
                  <div className="absolute top-0 left-0 w-[2px] h-full bg-[#C9A96E] scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />

                  {/* Column 1: Label & Category Badge */}
                  <div className="col-span-8 sm:col-span-7 space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-[#C9A96E]/80 group-hover:text-[#C9A96E] transition-colors">
                        // {m.badge}
                      </span>
                    </div>
                    <h4 className="text-zinc-300 group-hover:text-white font-sans text-xs leading-normal font-light transition-colors">
                      {m.label}
                    </h4>
                  </div>

                  {/* Column 2: Audited Value & Mini progress indicator */}
                  <div className="col-span-4 sm:col-span-3 text-right space-y-1.5">
                    <div className="flex items-baseline justify-end">
                      <span className="text-[#C9A96E] text-xl font-bold font-mono tracking-tight transition-colors duration-300">
                        {m.value}
                      </span>
                      {m.unit && (
                        <span className="text-[#C9A96E]/60 text-xs font-mono ml-0.5">
                          {m.unit}
                        </span>
                      )}
                    </div>

                    {m.progressValue > 0 ? (
                      <div className="h-[2px] bg-zinc-900 w-20 ml-auto rounded overflow-hidden">
                        <div
                          className="h-full bg-[#C9A96E]/60 group-hover:bg-[#C9A96E] transition-all duration-500 shadow-[0_0_8px_rgba(201,169,110,0.5)]"
                          style={{ width: `${m.progressValue}%` }}
                        />
                      </div>
                    ) : (
                      <div className="text-[8px] font-mono text-[#C9A96E]/70 group-hover:text-[#C9A96E] transition-colors">
                        {m.subtag}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Audit Badge */}
                  <div className="col-span-12 sm:col-span-2 text-right mt-2 sm:mt-0 flex sm:justify-end">
                    <span className="text-[8px] font-mono text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/40 px-1.5 py-0.5 rounded tracking-wider uppercase font-semibold shadow-[0_0_8px_rgba(201,169,110,0.15)]">
                      ✓ AUDITED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal status line at bottom */}
          <div className="p-3 bg-zinc-950 border border-[#C9A96E]/30 text-[9px] text-zinc-500 font-mono flex items-center justify-between rounded shadow-[0_0_8px_rgba(201,169,110,0.05)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse shadow-[0_0_8px_#C9A96E]"></span>
              SYSTEM: INDICATORS SYNCED WITH BLOCKCHAIN AUDIT LOG
            </span>
            <span className="text-zinc-600">v1.0.1_STABLE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvestigacionInteractiveWidget() {
  const papers = [
    {
      num: "Paper 01",
      tag: "Research Note · Mercado",
      title: "Por qué fallan los go-live de Oracle Fusion",
      abstract: "Análisis de 47 implementaciones LATAM. Tres patrones recurrentes de fracaso, causas raíz documentadas, modelo alternativo de entrega.",
      toc: ["El patrón \"abandono post go-live\"", "Los tres síntomas iniciales", "Modelo de entrega FABRIC"],
      meta: [["8-10 pp", "Páginas"], ["PDF · ES", "Formato"], ["15 min", "Lectura"], ["May 2026", "Publicado"]]
    },
    {
      num: "Paper 02",
      tag: "Technical Framework · IA",
      title: "IA aplicada a cierre contable en Fusion Cloud",
      abstract: "Framework FABRIC con cuatro capas operativas. Casos de aplicación por industria. Arquitectura técnica reutilizable.",
      toc: ["Anatomía del cierre contable", "Capa de agentes IA aplicables", "Casos APE Plazas + Aplazo"],
      meta: [["10-12 pp", "Páginas"], ["PDF · ES", "Formato"], ["20 min", "Lectura"], ["May 2026", "Publicado"]]
    },
    {
      num: "Paper 03",
      tag: "Doctrina Operativa · SOW",
      title: "Modelo de entrega en primer ciclo crítico",
      abstract: "La doctrina contractual de FABRIC, en cláusulas modelo. Aplicación práctica para CFO / CIO evaluando un RFP Oracle.",
      toc: ["Las 5 cláusulas doctrinales", "Cómo redactarlas en RFP", "Validación legal y contractual"],
      meta: [["6-8 pp", "Páginas"], ["PDF · ES", "Formato"], ["12 min", "Lectura"], ["May 2026", "Publicado"]]
    }
  ];

  return (
    <div className="font-mono text-xs space-y-12">
      <div className="max-w-4xl">
        <span className="fabric-badge-premium mb-3 inline-block">Investigación</span>
        <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
          Lo que aprendemos en producción.<br /><span className="text-[#C9A96E]">Lo publicamos.</span>
        </h2>
        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed font-sans">
          Papers técnicos descargables. Acceso requiere registro corporativo — no formulario marketing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {papers.map((paper) => (
          <div
            key={paper.num}
            className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#C9A96E]/50 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono text-xs text-[#C9A96E] font-bold">{paper.num}</span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  {paper.tag}
                </span>
              </div>

              <h3 className="text-xl font-serif text-white font-light mb-3 leading-snug">{paper.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6 font-sans">{paper.abstract}</p>

              <div className="border-t border-zinc-900 pt-4 mb-6">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Tabla de contenido</span>
                <ul className="space-y-2 font-mono text-[11px] text-zinc-400">
                  {paper.toc.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#C9A96E]">0{idx + 1}.</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-3 border-t border-dashed border-zinc-800 pt-4 mb-6 text-[10px] text-zinc-500 font-mono">
                {paper.meta.map(([val, label]) => (
                  <div key={label}>
                    <strong className="text-zinc-300 block font-bold">{val}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="fabric-btn-accent w-full text-center justify-center font-mono text-xs py-3 uppercase tracking-wider font-bold"
              >
                Descargar paper →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark Index Banner */}
      <div className="p-8 md:p-10 rounded-xl border border-[#C9A96E]/30 bg-[#C9A96E]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] text-[#C9A96E] font-bold uppercase tracking-widest block font-mono">FABRIC Benchmark Index · Anual</span>
          <h3 className="text-2xl font-serif text-white font-light leading-snug">
            El Estado de las Implementaciones Oracle Fusion en <span className="text-[#C9A96E]">México y LATAM 2026</span>
          </h3>
          <p className="text-zinc-400 text-xs font-sans leading-relaxed">
            Reporte anual. Tasa de fracaso real del mercado, razones más comunes, best practices para CFO/CTO en RFP de Oracle. Lanzamiento Q4 2026: registro abierto para early access.
          </p>
        </div>

        <button
          type="button"
          className="fabric-btn-accent text-xs px-6 py-3 shrink-0 uppercase font-mono font-bold tracking-wider"
        >
          Reservar early access →
        </button>
      </div>
    </div>
  );
}

function EvaluacionProyectosInteractiveWidget() {
  const [filterQuarter, setFilterQuarter] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const projects = [
    {
      id: "proj-1",
      quarter: "Q1 2026",
      industry: "Retail nacional",
      revenue: "Empresa nacional",
      reason: "No existía participación directa de dirección financiera.",
      category: "Gobernanza",
      failedCriteria: "Falta de patrocinio ejecutivo",
      analysis: "El proyecto dependía completamente de gerencias operativas sin participación activa de dirección financiera. En implementaciones ERP de alta criticidad, esto suele retrasar decisiones importantes y afectar la estabilidad del proyecto.",
      recommendation: "Definir un patrocinador ejecutivo con capacidad de decisión y participación activa durante todo el proceso.",
      financialLoss: "USD 1.2M / mes en procesos manuales y reportes paralelos",
    },
    {
      id: "proj-2",
      quarter: "Q1 2026",
      industry: "Manufactura",
      revenue: "Empresa regional",
      reason: "El alcance cambiaba constantemente antes de iniciar.",
      category: "Alcance",
      failedCriteria: "Alcance sin definición clara",
      analysis: "La iniciativa requería una cotización cerrada, pero los requerimientos seguían cambiando continuamente. Esto generaba un alto riesgo de retrasos, retrabajo y desviaciones de presupuesto.",
      recommendation: "Realizar primero una etapa de descubrimiento y definición funcional antes de iniciar el desarrollo.",
      financialLoss: "USD 850K / mes por merma en cadena de suministro y desalineación de inventarios",
    },
    {
      id: "proj-3",
      quarter: "Q2 2026",
      industry: "Fintech",
      revenue: "Holding financiera",
      reason: "El cronograma solicitado no era técnicamente viable.",
      category: "Plazo",
      failedCriteria: "Tiempo insuficiente para estabilización",
      analysis: "El cliente requería un go-live acelerado para un sistema crítico con múltiples integraciones y conciliaciones financieras. El tiempo disponible no permitía ejecutar pruebas completas ni estabilización adecuada.",
      recommendation: "Reducir el alcance inicial o extender el cronograma para asegurar una implementación estable.",
      financialLoss: "USD 2.1M / mes en reprocesamientos de conciliación manual y multas regulatorias",
    },
    {
      id: "proj-4",
      quarter: "Q2 2026",
      industry: "Centros comerciales",
      revenue: "Grupo regional",
      reason: "No existía compromiso interno para capacitación.",
      category: "Capacitación",
      failedCriteria: "Falta de adopción operativa",
      analysis: "La organización no planeaba asignar personal interno para transferencia de conocimiento y operación futura del sistema.",
      recommendation: "Definir key users internos responsables de capacitación, validación y operación posterior.",
      financialLoss: "USD 400K / mes en gastos redundantes de consultoría externa de soporte",
    },
    {
      id: "proj-5",
      quarter: "Q1 2026",
      industry: "Distribución logística",
      revenue: "Empresa mediana",
      reason: "El presupuesto no correspondía a la complejidad requerida.",
      category: "Modelo/Presupuesto",
      failedCriteria: "Presupuesto insuficiente",
      analysis: "El alcance requería perfiles senior especializados, pero el presupuesto contemplaba un esquema incompatible con el nivel técnico necesario.",
      recommendation: "Ajustar el presupuesto o replantear el alcance inicial del proyecto.",
      financialLoss: "USD 600K / mes debido a retrasos en facturación y conciliaciones bancarias",
    },
    {
      id: "proj-6",
      quarter: "Q2 2026",
      industry: "Aseguradora regional",
      revenue: "Grupo financiero",
      reason: "El modelo solicitado estaba enfocado únicamente en horas hombre.",
      category: "Modelo/Presupuesto",
      failedCriteria: "Modelo operativo no alineado",
      analysis: "El cliente buscaba ampliar capacidad operativa sin definir objetivos de negocio, entregables medibles ni responsabilidad sobre resultados.",
      recommendation: "Definir entregables claros, objetivos operativos y métricas de éxito antes de iniciar la implementación.",
      financialLoss: "USD 1.5M / mes en reportes paralelos y costos de retrabajo técnico",
    },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchQ = filterQuarter === "ALL" || p.quarter === filterQuarter;
    const matchC = filterCategory === "ALL" || p.category === filterCategory;
    return matchQ && matchC;
  });

  const categories = ["ALL", "Gobernanza", "Alcance", "Plazo", "Capacitación", "Modelo/Presupuesto"];
  const quarters = ["ALL", "Q1 2026", "Q2 2026"];

  return (
    <div className="font-mono text-xs space-y-12">
      <div className="max-w-4xl">
        <span className="fabric-badge-premium mb-3 inline-block">EVALUACIÓN DE PROYECTOS</span>
        <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
          <span className="text-[#C9A96E]">Por qué podríamos rechazar tu proyecto hoy</span> (y qué necesitas para asegurar ingeniería de nivel crítico).
        </h2>
        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed font-sans">
          No aceptamos todos los proyectos. Para garantizar implementaciones exitosas, trabajamos únicamente con empresas que cuentan con el nivel de compromiso, estructura y alcance necesarios para ejecutar sistemas críticos correctamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Criterios */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative border border-zinc-800 bg-zinc-950/60 p-6 md:p-8 space-y-6 rounded-xl">
            <div className="fabric-corner top-left" />
            <div className="fabric-corner top-right" />
            <div className="fabric-corner bottom-left" />
            <div className="fabric-corner bottom-right" />

            <div className="space-y-4">
              <span className="text-[10px] text-[#C9A96E] font-bold uppercase block tracking-wider">
                ── CRITERIOS DE EVALUACIÓN ──
              </span>

              <div className="space-y-3 font-sans text-xs text-zinc-400 leading-relaxed">
                <p>
                  Antes de iniciar cualquier implementación evaluamos factores clave que impactan directamente en la estabilidad, adopción y continuidad operativa del proyecto.
                </p>
                <p>
                  Esto incluye participación activa de dirección, alcance técnicamente definido, tiempos realistas de ejecución, disponibilidad del equipo interno y presupuesto alineado a la complejidad requerida.
                </p>
                <p>
                  Cuando alguno de estos puntos no está presente, preferimos no avanzar antes que comprometer la calidad o estabilidad de la implementación.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-black border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">ENFOQUE</span>
                  <span className="text-white font-bold">ESTABILIDAD</span>
                </div>
                <div className="p-2 bg-black border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">PRIORIDAD</span>
                  <span className="text-[#C9A96E] font-bold">CALIDAD</span>
                </div>
                <div className="p-2 bg-black border border-zinc-900 rounded">
                  <span className="text-zinc-600 block mb-1">OBJETIVO</span>
                  <span className="text-emerald-500 font-bold">ADOPCIÓN</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-red-950/30 bg-red-950/10 p-4 rounded-xl text-zinc-400 leading-relaxed font-sans text-xs space-y-1">
            <div className="flex gap-2 items-center text-red-400 font-mono text-[10px] uppercase font-bold">
              <span>⚠ Información anonimizada</span>
            </div>
            <p className="text-zinc-500 text-[11px]">
              Todos los ejemplos mostrados fueron anonimizados para proteger la información y privacidad de cada empresa.
            </p>
          </div>
        </div>

        {/* Right Column: Rejected Projects Viewer */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 md:p-8 bg-black border border-zinc-800 rounded-xl relative space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">CASOS EVALUADOS</span>
                <h3 className="text-lg font-serif text-white font-light">Proyectos no iniciados</h3>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded flex items-center gap-4 text-[10px]">
                <div>
                  <span className="text-zinc-500 block">EVALUADOS</span>
                  <span className="text-white font-bold">23 proyectos</span>
                </div>
                <div className="w-[1px] h-6 bg-zinc-900" />
                <div>
                  <span className="text-zinc-500 block">NO INICIADOS</span>
                  <span className="text-[#C9A96E] font-bold">6 proyectos</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-lg space-y-3">
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                FILTRAR RESULTADOS:
              </div>

              <div className="flex flex-wrap gap-4 text-[10px]">
                <div className="space-y-1">
                  <span className="text-zinc-600 block">PERIODO:</span>
                  <div className="flex gap-1">
                    {quarters.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setFilterQuarter(q)}
                        className={`px-2 py-1 border transition-colors cursor-pointer rounded ${
                          filterQuarter === q
                            ? "border-[#C9A96E] bg-[#C9A96E]/10 text-white font-bold"
                            : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-600 block">CATEGORÍA:</span>
                  <div className="flex flex-wrap gap-1">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFilterCategory(c)}
                        className={`px-2 py-1 border transition-colors cursor-pointer rounded ${
                          filterCategory === c
                            ? "border-[#C9A96E] bg-[#C9A96E]/10 text-white font-bold"
                            : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {c.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Project List */}
            <div className="space-y-3">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="group border border-zinc-900 hover:border-red-900/50 bg-zinc-950/40 hover:bg-zinc-950/90 p-4 rounded-lg transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer relative overflow-hidden"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded">
                        {proj.quarter}
                      </span>
                      <span className="text-white font-bold">{proj.industry}</span>
                      <span className="text-zinc-500 text-[10px] font-sans">({proj.revenue})</span>
                    </div>

                    <p className="text-zinc-400 font-sans text-xs leading-normal">
                      <strong className="text-zinc-500 font-mono text-[10px] uppercase mr-1">Resultado:</strong>
                      {proj.reason}
                    </p>

                    {proj.financialLoss && (
                      <div className="font-mono text-[9px] text-red-400 flex items-center gap-1">
                        <span>⚠ PÉRDIDAS ESTIMADAS: {proj.financialLoss}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <span className="text-[9px] border border-red-500/30 bg-red-950/20 text-red-400 px-2 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                      [ {proj.category} ]
                    </span>
                    <span className="text-zinc-600 group-hover:text-red-400 transition-colors">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[2500] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-950/70 p-6 md:p-8 max-w-2xl w-full relative space-y-6 rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 cursor-pointer font-mono text-[10px] border border-zinc-800 hover:border-red-950 px-2.5 py-1 bg-black rounded"
            >
              [CERRAR ✕]
            </button>

            <div className="space-y-4">
              <div className="border-b border-zinc-900 pb-3">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">RESULTADO DE EVALUACIÓN</span>
                <h4 className="text-base text-white font-bold leading-none mt-1">
                  {selectedProject.industry} <span className="font-sans text-xs text-zinc-500 font-normal">({selectedProject.revenue})</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono bg-black p-3 border border-zinc-900 rounded">
                <div>
                  <span className="text-zinc-600 block">PERIODO:</span>
                  <span className="text-zinc-300 font-bold">{selectedProject.quarter}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block">ESTADO EVALUACIÓN:</span>
                  <span className="text-red-500 font-bold uppercase">[ RECHAZADO POR {selectedProject.category.toUpperCase()} ]</span>
                </div>
                {selectedProject.financialLoss && (
                  <div className="col-span-2 pt-2 border-t border-zinc-900 text-red-400">
                    <span className="text-zinc-600 block">IMPACTO ESTIMADO POR FRACASO:</span>
                    <span className="font-bold">{selectedProject.financialLoss}</span>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t border-zinc-900">
                  <span className="text-zinc-600 block">PUNTO CRÍTICO:</span>
                  <span className="text-[#C9A96E] font-bold font-sans text-xs">{selectedProject.failedCriteria}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-zinc-500 text-[10px] font-bold block">POR QUÉ NO AVANZÓ EL PROYECTO:</span>
                <p className="text-zinc-400 font-sans text-xs leading-relaxed bg-zinc-900/50 border border-zinc-800 p-4 rounded text-justify">
                  {selectedProject.analysis}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[#C9A96E] text-[10px] font-bold block">QUÉ TENDRÍA QUE CAMBIAR:</span>
                <div className="border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-4 rounded text-zinc-300 font-sans text-xs leading-relaxed">
                  {selectedProject.recommendation}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FounderManifestoInteractiveWidget() {
  return (
    <div className="font-mono text-xs space-y-12">
      {/* Manifesto Quote */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="fabric-badge-premium mb-3 inline-block">Manifiesto del Fundador</span>
        <blockquote className="text-2xl md:text-4xl font-serif text-white font-light leading-snug">
          No construimos sitios bonitos.<br />
          Construimos <span className="text-[#C9A96E] italic">la firma de Oracle Critical Engineering</span><br />
          más seria de México y LATAM.
        </blockquote>
        <cite className="text-[#C9A96E] font-mono text-xs uppercase tracking-widest block not-italic pt-2">
          — Julio Álvarez
        </cite>
      </div>

      {/* Profile & Credentials */}
      <div className="p-8 md:p-12 rounded-xl border border-zinc-800 bg-zinc-950/80 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Photo Column */}
        <div className="md:col-span-4 space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-zinc-800 group">
            <img
              src="/julio_alvarez.webp"
              alt="Julio Álvarez — Founder FABRIC"
              className="w-full aspect-[4/5] object-cover object-top grayscale contrast-105 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest font-mono border-t border-zinc-900 pt-2">
            <span>Ciudad de México · México</span>
            <span className="text-[#C9A96E]">Founder · 2026</span>
          </div>
        </div>

        {/* Bio & Stats Column */}
        <div className="md:col-span-8 space-y-6">
          <div>
            <span className="text-[10px] text-[#C9A96E] uppercase tracking-widest font-bold block mb-1">
              Founder · FABRIC
            </span>
            <h3 className="text-3xl md:text-5xl font-serif text-white font-light leading-tight">
              Julio<br />Álvarez
            </h3>
          </div>

          <p className="text-zinc-400 font-sans text-sm md:text-base leading-relaxed">
            20+ años en arquitectura Oracle, ERP empresarial y transformación de operaciones críticas. Liderando la firma de Oracle Critical Engineering en México con expansión hacia USA.
          </p>

          <div className="border-l-2 border-[#C9A96E] pl-4 py-1 text-zinc-400 font-sans text-xs italic bg-[#C9A96E]/5 rounded-r">
            Equipo senior bajo NDA hasta el primer engagement. Acceso a equipo directo se otorga tras admisión inicial.
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-4 border-t border-zinc-900 pt-6">
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-serif text-[#C9A96E] font-light block">20+</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Años Oracle</span>
            </div>

            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-serif text-[#C9A96E] font-light block">100%</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">Senior team</span>
            </div>

            <div className="space-y-1">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitlistInteractiveWidget() {
  const admissionQuarters = [
    {
      quarter: 'Q1 2026',
      status: 'closed',
      label: 'Cerrado',
      description: '3 proyectos aceptados',
      deadline: 'Completo'
    },
    {
      quarter: 'Q2 2026',
      status: 'closed',
      label: 'Cerrado',
      description: '2 proyectos aceptados',
      deadline: 'Completo'
    },
    {
      quarter: 'Q3 2026',
      status: 'open',
      label: 'Abierto',
      description: 'Evaluando aplicaciones',
      deadline: 'Plazo · 30 julio'
    },
    {
      quarter: 'Q4 2026',
      status: 'upcoming',
      label: 'Próximo',
      description: 'Aplicaciones desde 01 sept',
      deadline: 'Próximo'
    }
  ];

  return (
    <div className="font-mono text-xs space-y-12">
      {/* Header Countdown Banner */}
      <div className="p-4 rounded-lg border border-[#C9A96E]/40 bg-[#C9A96E]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] animate-pulse shrink-0" />
          <div>
            <span className="text-zinc-400 uppercase text-[10px] block font-mono">Cierre Q3 2026</span>
            <span className="text-white font-bold text-sm tracking-wider font-mono">00d 00h 00m 00s restantes</span>
          </div>
        </div>
        <span className="text-[10px] text-[#C9A96E] font-bold uppercase tracking-wider bg-black/60 border border-[#C9A96E]/30 px-3 py-1 rounded">
          Plazo · 30 julio
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <span className="fabric-badge-premium mb-3 inline-block">Wait List · Q3 2026</span>
          <h2 className="text-3xl md:text-5xl font-serif text-white font-light leading-tight">
            FABRIC opera con un máximo de <span className="text-[#C9A96E]">12 proyectos simultáneos.</span>
          </h2>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed font-sans mt-3">
            Para garantizar entrega en primer ciclo crítico, mantenemos disciplina de capacidad. La selectividad protege la calidad operativa.
          </p>
        </div>

        {/* Live metrics banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-zinc-900 py-6">
          <div className="space-y-1">
            <span className="text-3xl font-serif text-white font-light block">9</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Proyectos activos</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl font-serif text-[#C9A96E] font-light block">Q3 2026</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Próxima ventana</span>
          </div>

          <div className="space-y-1">
            <span className="text-3xl font-serif text-emerald-400 font-light block">7</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">En lista de espera</span>
          </div>
        </div>

        {/* Admission Cycle Table */}
        <div className="space-y-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            Ciclo de Admisión 2026
          </div>

          <div className="border border-zinc-800 bg-zinc-950/80 rounded-xl overflow-hidden divide-y divide-zinc-900">
            {admissionQuarters.map((q) => (
              <div key={q.quarter} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white font-mono w-16">{q.quarter}</span>
                  <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold tracking-wider rounded ${
                    q.status === 'open'
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                      : 'border-zinc-800 text-zinc-500 bg-zinc-900/50'
                  }`}>
                    {q.label}
                  </span>
                </div>

                <span className="text-zinc-400 font-sans text-xs flex-1 sm:text-center">
                  {q.description}
                </span>

                <span className={`text-[10px] font-mono font-bold ${q.status === 'open' ? 'text-[#C9A96E]' : 'text-zinc-600'}`}>
                  {q.status === 'open' ? `✓ ${q.deadline}` : `○ ${q.deadline}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#radar-admision"
            className="fabric-btn-accent w-full sm:w-auto text-center justify-center font-mono text-xs py-3.5 px-8 uppercase font-bold tracking-wider"
          >
            Solicitar lugar en lista →
          </a>
          <span className="text-[10px] text-zinc-500 font-mono">
            🔒 Aplicación bajo NDA
          </span>
        </div>
      </div>
    </div>
  );
}

const insights = [
  {
    id: '01',
    label: 'Go-live',
    title: 'El go-live no prueba estabilidad.',
    short: 'Solo prueba que el sistema encendió.',
    detail:
      'La mayoría celebra la salida a producción, pero el riesgo real aparece después: cierres pesados, reportes manuales, usuarios confundidos e incidencias abiertas.',
  },
  {
    id: '02',
    label: 'Operación',
    title: 'El primer cierre revela la verdad.',
    short: 'Ahí se ve si Oracle realmente opera.',
    detail:
      'FABRIC no mide éxito por pantallas entregadas. Lo mide cuando el primer ciclo crítico corre en producción sin improvisación, dependencia manual ni bloqueos ejecutivos.',
  },
  {
    id: '03',
    label: 'Contrato',
    title: 'La responsabilidad debe quedar escrita.',
    short: 'No como promesa. Como cláusula.',
    detail:
      'Nos quedamos hasta el primer cierre contable operado en producción. Si una falla operativa es atribuible a FABRIC, no la convertimos en una nueva venta.',
  },
];

export default function S02bPuente() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [activeIndex, setActiveIndex] = useState(1);
  const [isOfficeHoursOpen, setIsOfficeHoursOpen] = useState(false);

  const active = insights[activeIndex];

  return (
    <section
      ref={ref}
      id="puente"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 18% 14%, rgba(201,169,110,0.055), transparent 32%), radial-gradient(circle at 84% 72%, rgba(82,161,218,0.09), transparent 34%), var(--bg-base)',
        borderTop: '1px solid rgba(255,255,255,0.075)',
        borderBottom: '1px solid rgba(255,255,255,0.075)',
        padding: 'clamp(88px, 9vw, 132px) 0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '78px 78px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '7%',
          top: '12%',
          width: 260,
          height: 260,
          borderRadius: 999,
          background: 'rgba(201,169,110,0.055)',
          filter: 'blur(58px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 1180,
          marginInline: 'auto',
          paddingInline: 'clamp(22px, 5vw, 56px)',
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'opacity 1000ms ease, transform 1000ms ease',
        }}
      >
        <div className="fabric-puente-grid">
          <div>
            <p className="fabric-puente-kicker">
              <span />
              Por qué FABRIC
            </p>

            <h2 className="fabric-puente-title">
              La mayoría entrega Oracle.
              <br />
              <em>FABRIC se queda cuando empieza el riesgo.</em>
            </h2>

            <p className="fabric-puente-copy">
              Una implementación no fracasa el día del go-live. Fracasa cuando el
              negocio intenta cerrar, reportar y operar sin depender de hojas
              paralelas, tickets urgentes o consultores que ya se fueron.
            </p>

            <div className="fabric-puente-proof">
              <div>
                <strong>90d</strong>
                <span>estabilización post go-live</span>
              </div>
              <div>
                <strong>1er</strong>
                <span>cierre crítico validado</span>
              </div>
              <div>
                <strong>0</strong>
                <span>riesgo sin dueño</span>
              </div>
            </div>
          </div>

          <div className="fabric-puente-panel">
            <div className="fabric-puente-panel-glow" />

            <div className="fabric-puente-tabs">
              {insights.map((item, index) => {
                const selected = activeIndex === index;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={selected ? 'is-active' : ''}
                  >
                    <span>{item.id}</span>
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div key={active.id} className="fabric-puente-reveal">
              <p className="fabric-puente-eyebrow">
                {active.id} · {active.label}
              </p>

              <h3>{active.title}</h3>

              <p className="fabric-puente-short">{active.short}</p>

              <p className="fabric-puente-detail">{active.detail}</p>
            </div>

            <div className="fabric-puente-footer">
              <span>Primer cierre crítico</span>
              <span>Producción real</span>
              <span>Responsabilidad contractual</span>
            </div>
          </div>
        </div>

        {/* RADAR DE ADMISIÓN CRÍTICA & MESA TÉCNICA 1-ON-1 */}
        <div id="radar-admision" style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
          {/* FOMO System Status Alert Banner */}
          <div className="fabric-radar-banner">
            {/* Esquinas consola */}
            <div className="fabric-corner top-left" />
            <div className="fabric-corner top-right" />
            <div className="fabric-corner bottom-left" />
            <div className="fabric-corner bottom-right" />

            {/* Left: Capacity and Blinking Dot */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                  <span className="font-mono text-[9px] text-[#C9A96E] uppercase tracking-widest">[ RADAR DE ADMISIÓN CRÍTICA ]</span>
                  <span className="font-mono text-[9px] text-red-500 font-bold uppercase tracking-wider fabric-animate-blink">¡ADVERTENCIA DE CAPACIDAD!</span>
                </div>
                <h3 className="text-xs md:text-sm font-mono text-white font-bold uppercase tracking-wider">
                  11 de 12 Slots de Ingeniería Ocupados
                </h3>
              </div>
            </div>

            {/* Center: Grid blocks indicating capacity */}
            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-black/60 border border-zinc-900 rounded">
              <div className="flex gap-1">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="w-2 h-3.5 bg-[#C9A96E]/80 border border-[#C9A96E]/20" />
                ))}
                <div className="w-2 h-3.5 bg-zinc-900 border border-zinc-800 animate-pulse" />
              </div>
              <span className="font-mono text-[10px] text-zinc-400 pl-2">1 Libre</span>
            </div>

            {/* Right: Waitlist status & CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-end text-center sm:text-left">
              <div className="font-mono text-[10px] text-zinc-500">
                <div>WAITLIST: <span className="text-white font-bold">7 COMPAÑÍAS</span></div>
                <div>PRÓXIMA APERTURA: <span className="text-[#C9A96E] font-bold">Q4 2026</span></div>
              </div>
              <button 
                type="button"
                onClick={() => setIsOfficeHoursOpen(true)} 
                className="fabric-btn-accent text-[10px] tracking-wider uppercase font-bold py-2 px-4 font-mono w-full sm:w-auto text-center cursor-pointer whitespace-nowrap"
              >
                [ APLICAR A WAITLIST ]
              </button>
            </div>
          </div>

          {/* Mesa Técnica 1-on-1 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mt-10">
            {/* Left Column: Heading and Context */}
            <div className="lg:col-span-7 space-y-6">
              <span className="fabric-badge-premium">MESA TÉCNICA 1-ON-1</span>
              <h3 className="text-2xl md:text-4xl font-serif text-white font-light leading-tight">
                Detén los errores ocultos en tu arquitectura antes de que <span className="text-[#C9A96E]">congelen tu operación hoy mismo.</span>
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Conversa directamente con un Ingeniero Principal de FABRIC. Evaluamos los riesgos reales, cuellos de botella de integraciones y arquitectura de tu proyecto Oracle Fusion. Sin rodeos comerciales, sin presentaciones de ventas corporativas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-zinc-500 pt-4">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div>
                    <h4 className="text-zinc-300 text-xs font-bold uppercase">Disponibilidad Dinámica</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Elige un día y horario en tiempo real de los bloques abiertos por administración.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-[#C9A96E] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div>
                    <h4 className="text-zinc-300 text-xs font-bold uppercase">Sesión Privada de 30 Min</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Análisis técnico preliminar, revisión de NDA y asignación de cola de admisión.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: CTA Block */}
            <div className="lg:col-span-5">
              <div className="p-6 md:p-8 border border-zinc-800 bg-zinc-950/40 rounded-2xl relative space-y-6 text-center shadow-[0_0_20px_rgba(201,169,110,0.02)]">
                {/* Esquinas decorativas consola */}
                <div className="fabric-corner top-left" />
                <div className="fabric-corner top-right" />
                <div className="fabric-corner bottom-left" />
                <div className="fabric-corner bottom-right" />

                <div className="mx-auto w-12 h-12 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-mono text-white font-bold uppercase tracking-wider">Agendar Sesión Técnica</h3>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-normal">
                    Se requiere dirección de correo electrónico corporativo para agendar y bloquear el horario seleccionado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOfficeHoursOpen(true)}
                  className="fabric-btn-accent w-full justify-center gap-2 text-[10px] tracking-wider uppercase font-bold py-2.5 px-4 mt-2 font-mono flex items-center cursor-pointer whitespace-nowrap"
                >
                  [ AGENDAR CITA DE INGENIERÍA ]
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMPARADOR SECTION */}
        <div id="comparadores" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <div className="w-full max-w-4xl mb-12">
            <span className="fabric-badge-premium mb-3 inline-block">COMPARADOR</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4">
              ¿Cuánto dinero estás dejando ir hoy? <span className="text-[#C9A96E]">Descubre tu ahorro real en Oracle.</span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              No creemos en calculadoras genéricas con números ficticios. Diseñamos herramientas para proyectar el costo total de propiedad (TCO) y ahorro de migración con datos de tu propia factura e infraestructura.
            </p>
          </div>

          {/* Herramienta 1: ERP TCO Comparator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-start">
            <div className="p-6 md:p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 h-full">
              <span className="fabric-badge-premium mb-4 inline-block">Costo Total de Propiedad</span>
              <h3 className="text-3xl md:text-4xl font-serif text-[#C9A96E] font-light leading-tight mb-4">
                ERP TCO Comparator
              </h3>
              <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-6">
                Compara los costos actuales de licencias, mantenimiento, infraestructura física y consultores de soporte de tu ERP actual (SAP S/4 HANA, ECC, EBS R12, JD Edwards, Dynamics) frente a la estructura optimizada y consolidada de Oracle Fusion Cloud.
              </p>
              <ul className="space-y-2.5 font-mono text-sm text-zinc-400">
                <li><span className="text-[#C9A96E] mr-2">✓</span> Proyección financiera a 3, 5 y 10 años</li>
                <li><span className="text-[#C9A96E] mr-2">✓</span> Evaluación de costos de base de datos oculta</li>
                <li><span className="text-[#C9A96E] mr-2">✓</span> Estimación de ROI y mes exacto de breakeven</li>
              </ul>
            </div>

            <div className="p-6 md:p-8 rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-x-auto">
              <ErpTcoInteractiveWidget />
            </div>
          </div>

          {/* Header Herramienta 2 */}
          <div className="w-full max-w-4xl my-16 ml-auto text-right">
            <span className="fabric-badge-premium mb-3 inline-block">INFRASTRUCTURE LAYER</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4">
              ¿Tu ERP ya está en la nube y la factura sigue subiendo? <span className="text-[#C9A96E]">Modela el ahorro real en OCI.</span>
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Las licencias son solo una parte del gasto. Compute, almacenamiento, bases de datos gestionadas y egress pueden multiplicar tu costo operativo sin que aparezca en un solo renglón. Esta herramienta proyecta el ahorro de migrar tu capa de infraestructura con los números de tu propio entorno — no benchmarks genéricos.
            </p>
          </div>

          {/* Herramienta 2: Cloud Cost Comparator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="card-premium p-6 md:p-8 overflow-x-auto lg:order-1 order-2">
              <CloudCostInteractiveWidget />
            </div>

            {/* Wrapper sin hover-transform: evita conflictos con position:sticky en el hijo */}
            <div className="lg:order-2 order-1 lg:sticky lg:top-28 lg:z-[5] lg:self-start lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-0.5">
              <div className="card-premium p-6 md:p-8">
                <span className="fabric-badge-premium mb-4 inline-block">Comparador de costos</span>
                <h3 className="text-3xl md:text-4xl font-serif text-[#C9A96E] font-light leading-tight mb-4">
                  Cloud Cost Comparator
                </h3>
                <p className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed mb-6">
                  Si ejecutas workloads y ERPs críticos en AWS, Azure o Google Cloud, calcula cuánto ahorrarías en hosting, red y almacenamiento al migrar la infraestructura base de tus aplicaciones directamente a Oracle Cloud Infrastructure (OCI).
                </p>
                <ul className="space-y-2.5 font-mono text-sm text-zinc-400">
                  <li><span className="text-[#C9A96E] mr-2">✓</span> Mapeo de equivalencia (Compute, S3/EBS, RDS)</li>
                  <li><span className="text-[#C9A96E] mr-2">✓</span> Análisis de costos de transferencia de salida (Egress)</li>
                  <li><span className="text-[#C9A96E] mr-2">✓</span> Proyección de ROI de migración de infraestructura</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* DOCTRINA OPERATIVA SECTION */}
        <div id="doctrina-operativa" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: 5 Non-negotiable Commitments */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <span className="fabric-badge-premium mb-3 inline-block">DOCTRINA OPERATIVA</span>
                <h2 className="text-3xl md:text-5xl font-serif text-white font-light leading-tight">
                  <span className="text-[#C9A96E]">Deja de pagar por PowerPoints y horas muertas</span> mientras tu producción sigue inestable.
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mt-4">
                  Nuestra práctica se basa en 5 compromisos no negociables. No facturamos metodologías ni horas-hombre en powerpoints; facturamos software estabilizado en producción.
                </p>
              </div>

              <div className="space-y-6 font-mono text-zinc-400">
                <div className="flex gap-4 border-b border-[rgba(201,169,110,0.1)] pb-5">
                  <span className="text-[#C9A96E] text-lg font-bold">01</span>
                  <div>
                    <h4 className="text-white text-sm font-bold">Entrega en primer ciclo crítico</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">El proyecto no se entrega en el go-live. Se entrega cuando tu primer cierre contable, primer ciclo operativo o primer ciclo regulatorio crítico opera en producción con estabilidad documentada.</p>
                  </div>
                </div>

                <div className="flex gap-4 border-b border-[rgba(201,169,110,0.1)] pb-5">
                  <span className="text-[#C9A96E] text-lg font-bold">02</span>
                  <div>
                    <h4 className="text-white text-sm font-bold">Solo seniors. Cero juniors facturables.</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Cada consultor de FABRIC tiene mínimo 8 años de experiencia real en Oracle. Sin excepciones.</p>
                  </div>
                </div>

                <div className="flex gap-4 border-b border-[rgba(201,169,110,0.1)] pb-5">
                  <span className="text-[#C9A96E] text-lg font-bold">03</span>
                  <div>
                    <h4 className="text-white text-sm font-bold">Fixed-Price por fase. Cero sorpresas.</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Operamos con presupuestos cerrados. Si nos atrasamos por nuestra causa, no facturamos las semanas adicionales.</p>
                  </div>
                </div>

                <div className="flex gap-4 border-b border-[rgba(201,169,110,0.1)] pb-5">
                  <span className="text-[#C9A96E] text-lg font-bold">04</span>
                  <div>
                    <h4 className="text-white text-sm font-bold">Cero reportes manuales post go-live.</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Al cierre del primer ciclo crítico, ningún reporte ejecutivo, financiero u operativo debe ejecutarse fuera del ERP. Si subsiste un reporte manual paralelo por causa atribuible a FABRIC, se resuelve sin costo adicional hasta su eliminación.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-[#C9A96E] text-lg font-bold">05</span>
                  <div>
                    <h4 className="text-white text-sm font-bold">Transición formal con documentación viva.</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">El cierre del proyecto se documenta con acta formal firmada por todos los stakeholders del cliente. El acta incluye: tablero de KPIs verificado, incidencias resueltas, adopción de usuarios clave medida, plan de soporte post-transición, y entrega de documentación viva (configuraciones, integraciones, runbooks, procedimientos de cierre, matrices de roles) auditable y actualizable por el cliente sin dependencia de FABRIC.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contractual Guarantee Box */}
            <div className="lg:col-span-5 lg:pl-6">
              <div className="lg:sticky lg:top-28 p-6 md:p-8 border-2 border-[#C9A96E] bg-[#C9A96E]/5 rounded-xl space-y-6">
                <span className="fabric-badge-premium mb-4">Garantía Contractual</span>
                <h3 className="text-xl md:text-2xl font-serif text-white font-light italic leading-relaxed">
                  &quot;Si no logramos estabilizar tu primer cierre contable en producción en la fecha acordada por causas de nuestra ingeniería, no facturamos los servicios de estabilización hasta lograrlo.&quot;
                </h3>
                <p className="font-mono text-zinc-500 text-xs">
                  — Cláusula 7.2 del Contrato de Prestación de Servicios FABRIC
                </p>
                <a 
                  href="#doctrina" 
                  className="fabric-btn-accent text-xs w-fit text-left cursor-pointer inline-flex items-center gap-2"
                >
                  Ver doctrina detallada →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CASOS ANCLA SECTION */}
        <div id="casos-ancla" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <div className="w-full max-w-4xl mb-12">
            <span className="fabric-badge-premium mb-3 inline-block">CASOS ANCLA</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
              Evita las fallas catastróficas que otros ya resolvieron: <span className="text-[#C9A96E]">Mira cómo rescatamos sistemas core reales.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              No publicamos logotipos sin contexto corporativo ni casos de éxito vagos. A continuación se presentan dos remediaciones de alta complejidad completadas por nuestro equipo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Caso APE Plazas */}
            <div className="p-6 md:p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full">
              <div>
                <span className="fabric-badge-premium mb-4 inline-block">Inmobiliario / Retail</span>
                <h3 className="text-2xl md:text-3xl font-serif text-white font-light mb-4">Caso APE Plazas</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Implementación integral y remediación post-migración del módulo de facturación masiva de arrendamientos y contabilidad general en Oracle Fusion Cloud para el operador líder de centros comerciales.
                </p>

                <div className="overflow-x-auto w-full mb-6">
                  <table className="w-full text-left border-collapse border border-zinc-800 text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[#C9A96E] bg-zinc-900/40">
                        <th className="p-3 font-bold uppercase tracking-wider">Métrica de Control</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400">
                      <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/20">
                        <td className="p-3">Go-Live Contractual</td>
                        <td className="p-3 text-emerald-500 font-bold">✓ 06 Abril 2026</td>
                      </tr>
                      <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/20">
                        <td className="p-3">Primer Cierre Ejecutado</td>
                        <td className="p-3 text-emerald-500 font-bold">✓ 30 Abril 2026</td>
                      </tr>
                      <tr className="hover:bg-zinc-900/20">
                        <td className="p-3">Incidencias Críticas</td>
                        <td className="p-3 text-emerald-500 font-bold">0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <blockquote className="border-l-2 border-[#C9A96E] pl-4 text-xs text-zinc-400 italic mb-6 leading-relaxed">
                  &quot;El cierre contable de abril se ejecutó sin incidencias con acompañamiento FABRIC en sitio. Ese es el momento en el que consideramos el proyecto realmente entregado.&quot;
                </blockquote>
              </div>

              <a 
                href="#casos"
                className="fabric-btn-accent w-full text-center justify-center font-mono text-xs py-3"
              >
                Ver Paper Técnico
              </a>
            </div>

            {/* Caso Aplazo */}
            <div className="p-6 md:p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full">
              <div>
                <span className="fabric-badge-premium mb-4 inline-block">Fintech</span>
                <h3 className="text-2xl md:text-3xl font-serif text-white font-light mb-4">Caso Aplazo</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  Estabilización de interfaces de cobros recurrentes y conciliación automática del auxiliar de Cuentas por Cobrar con el Libro Mayor (GL) en un plazo récord de 8 semanas.
                </p>

                <div className="overflow-x-auto w-full mb-6">
                  <table className="w-full text-left border-collapse border border-zinc-800 text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[#C9A96E] bg-zinc-900/40">
                        <th className="p-3 font-bold uppercase tracking-wider">Métrica de Control</th>
                        <th className="p-3 font-bold uppercase tracking-wider">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400">
                      <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/20">
                        <td className="p-3">Plazo de Estabilización</td>
                        <td className="p-3 text-emerald-500 font-bold">✓ 8 semanas (Logrado)</td>
                      </tr>
                      <tr className="border-b border-zinc-800/60 hover:bg-zinc-900/20">
                        <td className="p-3">Monto Transaccionado</td>
                        <td className="p-3 text-emerald-500 font-bold">✓ $4.2B MXN / mes</td>
                      </tr>
                      <tr className="hover:bg-zinc-900/20">
                        <td className="p-3">Cierres Paralelos Reducidos</td>
                        <td className="p-3 text-emerald-500 font-bold">De 5 días a 4 horas</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <blockquote className="border-l-2 border-[#C9A96E] pl-4 text-xs text-zinc-400 italic mb-6 leading-relaxed">
                  &quot;La arquitectura de bases de datos diseñada por FABRIC nos permitió cuadrar la contabilidad general de forma automática directamente en el ERP.&quot;
                </blockquote>
              </div>

              <a 
                href="#casos"
                className="fabric-btn-accent w-full text-center justify-center font-mono text-xs py-3"
              >
                Ver Paper Técnico
              </a>
            </div>
          </div>
        </div>

        {/* CASOS DE ÉXITO AUDITABLES SECTION */}
        <div id="audit-trail-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <div className="w-full max-w-4xl mb-12">
            <span className="fabric-badge-premium mb-3 inline-block">CASOS DE ÉXITO AUDITABLES</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
              ¿Tu proveedor actual te oculta sus tiempos de entrega reales? <span className="text-[#C9A96E]">Audita nuestro historial antes de arriesgarte.</span>
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Publicamos el registro exacto de hitos de entrega de cada proyecto: fechas de go-live, cierres contables y actas de estabilización. Si estás en proceso de contratación activa, puedes solicitar los documentos originales bajo un NDA mutuo.
            </p>
          </div>

          <AuditTrailInteractiveWidget />
        </div>

        {/* INDUSTRIAS FOCALES SECTION */}
        <div id="industrias-focales" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <div className="w-full max-w-4xl mb-12">
            <span className="fabric-badge-premium mb-3 inline-block">Industrias Focales</span>
            <h2 className="text-3xl md:text-5xl font-serif text-white font-light mb-4 leading-tight">
              Tres verticales donde el ERP es <em className="text-[#C9A96E] font-serif italic">columna vertebral</em> de la operación crítica.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* 01 / Servicios Financieros */}
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#C9A96E]/50 transition-all duration-300">
              <div>
                <div className="w-12 h-12 border border-[#C9A96E]/30 bg-[#C9A96E]/5 flex items-center justify-center font-serif text-2xl text-[#C9A96E] italic mb-6">
                  S
                </div>
                <div className="font-mono text-[10px] text-[#C9A96E] uppercase tracking-widest mb-2">01 / Industria</div>
                <h3 className="text-2xl font-serif text-white font-light mb-4 leading-tight">
                  Servicios<br />Financieros
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6 font-sans">
                  Bancos, fintech y crédito al consumo. Compliance, continuidad operativa, cierre contable regulatorio.
                </p>

                <ul className="space-y-2.5 font-mono text-xs text-zinc-400 border-t border-zinc-900 pt-5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Compliance CNBV / CONDUSEF / Banxico</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Cierre contable diario regulatorio</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Reportes regulatorios automatizados</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Continuidad operativa · RPO/RTO contractuales</span></li>
                </ul>
              </div>

              <div className="border-t border-dashed border-zinc-800 pt-4 flex justify-between items-center font-mono text-[10px] text-zinc-500 uppercase">
                <span>Cliente típico</span>
                <span className="text-[#C9A96E] font-serif text-base italic font-bold">USD 100M – 500M+</span>
              </div>
            </div>

            {/* 02 / Inmobiliario y Centros Comerciales */}
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#C9A96E]/50 transition-all duration-300">
              <div>
                <div className="w-12 h-12 border border-[#C9A96E]/30 bg-[#C9A96E]/5 flex items-center justify-center font-serif text-2xl text-[#C9A96E] italic mb-6">
                  I
                </div>
                <div className="font-mono text-[10px] text-[#C9A96E] uppercase tracking-widest mb-2">02 / Industria</div>
                <h3 className="text-2xl font-serif text-white font-light mb-4 leading-tight">
                  Inmobiliario y<br />Centros Comerciales
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6 font-sans">
                  Operadores multi-plaza, multi-entidad. Revenue management, gestión de espacios, conciliación de rentas variables.
                </p>

                <ul className="space-y-2.5 font-mono text-xs text-zinc-400 border-t border-zinc-900 pt-5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Multi-entidad · Multi-plaza consolidada</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Revenue management y rentas variables</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Conciliación de tenant billing</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Reportería ejecutiva por plaza / portafolio</span></li>
                </ul>
              </div>

              <div className="border-t border-dashed border-zinc-800 pt-4 flex justify-between items-center font-mono text-[10px] text-zinc-500 uppercase">
                <span>Cliente típico</span>
                <span className="text-[#C9A96E] font-serif text-base italic font-bold">USD 50M – 300M</span>
              </div>
            </div>

            {/* 03 / Logística y Distribución */}
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#C9A96E]/50 transition-all duration-300">
              <div>
                <div className="w-12 h-12 border border-[#C9A96E]/30 bg-[#C9A96E]/5 flex items-center justify-center font-serif text-2xl text-[#C9A96E] italic mb-6">
                  L
                </div>
                <div className="font-mono text-[10px] text-[#C9A96E] uppercase tracking-widest mb-2">03 / Industria</div>
                <h3 className="text-2xl font-serif text-white font-light mb-4 leading-tight">
                  Logística y<br />Distribución
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6 font-sans">
                  Multi-CD, multi-país, multi-modal. Supply chain, trazabilidad fiscal, conciliación de transportes.
                </p>

                <ul className="space-y-2.5 font-mono text-xs text-zinc-400 border-t border-zinc-900 pt-5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Multi-CD · Multi-país · Multi-modal</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Trazabilidad fiscal SAT/CFDI 4.0</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Conciliación de transportes y fletes</span></li>
                  <li className="flex items-start gap-2"><span className="text-[#C9A96E]">—</span><span>Supply chain integrado a Fusion SCM</span></li>
                </ul>
              </div>

              <div className="border-t border-dashed border-zinc-800 pt-4 flex justify-between items-center font-mono text-[10px] text-zinc-500 uppercase">
                <span>Cliente típico</span>
                <span className="text-[#C9A96E] font-serif text-base italic font-bold">USD 80M – 400M</span>
              </div>
            </div>
          </div>
        </div>

        {/* ORACLE FUSION RESCUE ASSESSMENT SECTION */}
        <div id="rescue-assessment-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <RescueAssessmentInteractiveWidget />
        </div>

        {/* VALIDACIÓN DIRECTA SECTION */}
        <div id="referencias" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <ValidacionDirectaInteractiveWidget />
        </div>

        {/* TRANSPARENCIA SECTION */}
        <div id="transparencia" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <TransparenciaInteractiveWidget />
        </div>

        {/* INVESTIGACIÓN SECTION */}
        <div id="investigacion-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <InvestigacionInteractiveWidget />
        </div>

        {/* EVALUACIÓN DE PROYECTOS SECTION */}
        <div id="apply-reverse-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <EvaluacionProyectosInteractiveWidget />
        </div>

        {/* MANIFIESTO DEL FUNDADOR SECTION */}
        <div id="founder-manifesto-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <FounderManifestoInteractiveWidget />
        </div>

        {/* WAITLIST & CICLO DE ADMISIÓN 2026 SECTION */}
        <div id="waitlist-section" style={{ marginTop: 'clamp(64px, 8vw, 110px)', paddingTop: 'clamp(48px, 6vw, 80px)', borderTop: '1px solid rgba(201, 169, 110, 0.15)' }}>
          <WaitlistInteractiveWidget />
        </div>
      </div>

      {/* OFFICE HOURS / MESA TÉCNICA MODAL OVERLAY */}
      {isOfficeHoursOpen && (
        <div className="fixed inset-0 z-[1500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-[#C9A96E]/30 p-6 md:p-8 max-w-4xl w-full relative rounded-xl font-mono text-xs shadow-[0_0_50px_rgba(201,169,110,0.15)] my-8">
            <button
              type="button"
              onClick={() => setIsOfficeHoursOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-[#C9A96E] font-mono text-[10px] border border-zinc-800 px-3 py-1.5 bg-black rounded cursor-pointer transition-colors"
            >
              [ CERRAR X ]
            </button>

            <div className="space-y-6">
              <div>
                <span className="fabric-badge-premium mb-2 inline-block">ENGINEERING DIRECT ACCESS</span>
                <h2 className="text-2xl md:text-3xl font-serif text-white font-light">Office Hours de Ingeniería</h2>
                <p className="text-zinc-400 text-xs mt-1 font-sans">Reserva una sesión técnica privada de 30 minutos con un Ingeniero Principal de FABRIC.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
                {/* Available Days and Slots */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block font-bold">Días Disponibles · Mayo 2026</span>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { day: 'Lun', num: '11', month: 'Mayo' },
                        { day: 'Mié', num: '13', month: 'Mayo' },
                        { day: 'Vie', num: '15', month: 'Mayo' },
                        { day: 'Mar', num: '19', month: 'Mayo' },
                      ].map((d, i) => (
                        <div key={i} className={`p-2.5 border rounded cursor-pointer transition-all ${i === 0 ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                          <span className="text-[9px] text-[#C9A96E] block font-bold uppercase">{d.day}</span>
                          <span className="text-base font-serif font-bold text-white block">{d.num}</span>
                          <span className="text-[8px] text-zinc-500 block">{d.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block font-bold">Horarios Disponibles (CST)</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {['09:00 AM', '11:30 AM', '03:00 PM', '04:30 PM'].map((slot, i) => (
                        <div key={i} className={`p-2.5 border rounded cursor-pointer transition-all ${i === 0 ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E] font-bold' : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}>
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-l-2 border-[#C9A96E] pl-3 py-2 bg-[#C9A96E]/5 text-[11px] text-zinc-400 font-sans italic rounded-r">
                    Todas las sesiones cuentan con compromiso explícito de confidencialidad y revisión bajo NDA.
                  </div>
                </div>

                {/* Form fields */}
                <div className="md:col-span-5 space-y-3 font-mono">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Roberto Martínez"
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded text-xs outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Correo Corporativo *</label>
                    <input
                      type="email"
                      required
                      placeholder="roberto@empresa.com"
                      className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded text-xs outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Empresa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Holding S.A."
                        className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded text-xs outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1">Cargo *</label>
                      <input
                        type="text"
                        required
                        placeholder="CIO / CFO"
                        className="w-full bg-black border border-zinc-800 text-white p-2.5 rounded text-xs outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      alert('¡Solicitud de sesión técnica agendada exitosamente! Recibirás los detalles en tu correo corporativo.');
                      setIsOfficeHoursOpen(false);
                    }}
                    className="fabric-btn-accent w-full justify-center text-center font-mono text-xs py-3 mt-3 uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Confirmar Agenda →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .fabric-puente-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
          gap: clamp(40px, 7vw, 96px);
          align-items: center;
        }

        .fabric-puente-kicker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 30px;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(201,169,110,0.9);
        }

        .fabric-puente-kicker span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #C9A96E;
          box-shadow: 0 0 16px rgba(201,169,110,0.55);
        }

        .fabric-puente-title {
          max-width: 760px;
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(40px, 5.2vw, 78px);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.06em;
          color: #F5F5F5;
        }

        .fabric-puente-title em {
          font-style: normal;
          color: #C9A96E;
          text-shadow: 0 0 26px rgba(201,169,110,0.12);
        }

        .fabric-puente-copy {
          max-width: 650px;
          margin: 30px 0 0;
          font-family: var(--sans);
          font-size: clamp(15px, 1.35vw, 18px);
          line-height: 1.85;
          color: rgba(245,245,245,0.66);
        }

        .fabric-puente-proof {
          margin-top: 36px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border: 1px solid rgba(255,255,255,0.095);
          background: rgba(7,25,47,0.82);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
        }

        .fabric-puente-proof div {
          padding: 18px 16px;
          border-right: 1px solid rgba(255,255,255,0.075);
        }

        .fabric-puente-proof div:last-child {
          border-right: 0;
        }

        .fabric-puente-proof strong {
          display: block;
          font-family: var(--serif);
          font-size: 34px;
          font-weight: 400;
          line-height: 1;
          color: #C9A96E;
        }

        .fabric-puente-proof span {
          display: block;
          margin-top: 10px;
          font-family: var(--mono);
          font-size: 8px;
          line-height: 1.6;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.38);
        }

        .fabric-puente-panel {
          position: relative;
          overflow: hidden;
          min-height: 470px;
          border: 1px solid rgba(201,169,110,0.18);
          background:
            linear-gradient(145deg, rgba(201,169,110,0.06), rgba(14,39,71,0.96) 32%, rgba(7,25,47,0.99)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 72px);
          box-shadow:
            0 34px 90px rgba(3,12,26,0.42),
            inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .fabric-puente-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(circle at 78% 18%, rgba(201,169,110,0.095), transparent 30%),
            linear-gradient(90deg, transparent, rgba(201,169,110,0.045), transparent);
          opacity: 1;
        }

        .fabric-puente-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px solid rgba(255,255,255,0.035);
        }

        .fabric-puente-panel-glow {
          position: absolute;
          top: -130px;
          right: -120px;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          background: rgba(201,169,110,0.08);
          filter: blur(54px);
          pointer-events: none;
        }

        .fabric-puente-tabs {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-bottom: 1px solid rgba(255,255,255,0.075);
          background: rgba(7,25,47,0.36);
        }

        .fabric-puente-tabs button {
          min-height: 86px;
          border: 0;
          border-right: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          cursor: pointer;
          padding: 18px 16px;
          text-align: left;
          font-family: var(--mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.42);
          transition:
            background 260ms ease,
            color 260ms ease,
            transform 260ms ease;
        }

        .fabric-puente-tabs button:last-child {
          border-right: 0;
        }

        .fabric-puente-tabs button:hover {
          color: rgba(245,245,245,0.86);
          background: rgba(255,255,255,0.032);
        }

        .fabric-puente-tabs button.is-active {
          color: #F5F5F5;
          background: linear-gradient(180deg, rgba(201,169,110,0.105), rgba(201,169,110,0.025));
        }

        .fabric-puente-tabs button span {
          display: block;
          margin-bottom: 12px;
          font-family: var(--serif);
          font-size: 28px;
          font-weight: 400;
          line-height: 1;
          color: #C9A96E;
        }

        .fabric-puente-reveal {
          position: relative;
          z-index: 2;
          padding: clamp(30px, 4.6vw, 58px);
          animation: fabricPuenteReveal 420ms cubic-bezier(.16,1,.3,1) both;
        }

        .fabric-puente-eyebrow {
          margin: 0 0 34px;
          font-family: var(--mono);
          font-size: 9px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(201,169,110,0.92);
        }

        .fabric-puente-reveal h3 {
          max-width: 620px;
          margin: 0;
          font-family: var(--serif);
          font-size: clamp(32px, 4vw, 58px);
          font-weight: 400;
          line-height: 1.02;
          letter-spacing: -0.052em;
          color: #F5F5F5;
        }

        .fabric-puente-short {
          margin: 24px 0 0;
          font-family: var(--serif);
          font-size: clamp(21px, 2.4vw, 31px);
          line-height: 1.35;
          color: #C9A96E;
        }

        .fabric-puente-detail {
          max-width: 620px;
          margin: 22px 0 0;
          font-family: var(--sans);
          font-size: clamp(14px, 1.2vw, 17px);
          line-height: 1.85;
          color: rgba(245,245,245,0.62);
        }

        .fabric-puente-footer {
          position: absolute;
          z-index: 2;
          left: clamp(30px, 4.6vw, 58px);
          right: clamp(30px, 4.6vw, 58px);
          bottom: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,0.075);
        }

        .fabric-puente-footer span {
          font-family: var(--mono);
          font-size: 8px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(245,245,245,0.36);
        }

        @keyframes fabricPuenteReveal {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (max-width: 960px) {
          .fabric-puente-grid {
            grid-template-columns: 1fr;
          }

          .fabric-puente-panel {
            min-height: 520px;
          }
        }

        @media (max-width: 640px) {
          .fabric-puente-proof {
            grid-template-columns: 1fr;
          }

          .fabric-puente-proof div {
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,0.075);
          }

          .fabric-puente-proof div:last-child {
            border-bottom: 0;
          }

          .fabric-puente-tabs {
            grid-template-columns: 1fr;
          }

          .fabric-puente-tabs button {
            min-height: 72px;
            border-right: 0;
            border-bottom: 1px solid rgba(255,255,255,0.075);
          }

          .fabric-puente-tabs button:last-child {
            border-bottom: 0;
          }

          .fabric-puente-panel {
            min-height: 620px;
          }

          .fabric-puente-footer {
            position: relative;
            left: auto;
            right: auto;
            bottom: auto;
            margin: 0 clamp(30px, 4.6vw, 58px) 32px;
          }
        }

        .fabric-radar-banner {
          position: relative;
          padding: 1.25rem 1.5rem;
          border: 1px solid rgba(201, 169, 110, 0.25);
          background-color: rgba(9, 9, 11, 0.6);
          border-radius: 0.75rem;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          box-shadow: 0 0 20px rgba(201, 169, 110, 0.04);
        }

        @media (min-width: 1024px) {
          .fabric-radar-banner {
            flex-direction: row;
          }
        }

        .fabric-corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: rgba(201, 169, 110, 0.4);
          pointer-events: none;
        }

        .fabric-corner.top-left { top: 0; left: 0; border-top-width: 1px; border-left-width: 1px; }
        .fabric-corner.top-right { top: 0; right: 0; border-top-width: 1px; border-right-width: 1px; }
        .fabric-corner.bottom-left { bottom: 0; left: 0; border-bottom-width: 1px; border-left-width: 1px; }
        .fabric-corner.bottom-right { bottom: 0; right: 0; border-bottom-width: 1px; border-right-width: 1px; }

        .fabric-animate-blink {
          animation: fabricBlink 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes fabricBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .fabric-badge-premium {
          display: inline-block;
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C9A96E;
          background: rgba(201, 169, 110, 0.1);
          border: 1px solid rgba(201, 169, 110, 0.25);
          padding: 4px 10px;
          border-radius: 4px;
        }

        .fabric-btn-accent {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(201, 169, 110, 0.12);
          border: 1px solid #C9A96E;
          color: #C9A96E;
          padding: 8px 16px;
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 4px;
          transition: all 300ms ease;
          text-decoration: none;
        }

        .fabric-btn-accent:hover {
          background: #C9A96E;
          color: #000;
          box-shadow: 0 0 20px rgba(201, 169, 110, 0.4);
        }
      `}</style>
    </section>
  );
}
