import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Layers,
  Building2,
  ChevronRight,
  Activity,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  HelpCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Calendar,
  Sparkles,
  Server,
  Database,
  Cpu,
  Lock,
  FileCheck
} from 'lucide-react';

import { api } from '../../../config/api';
import {
  getSourceErpFromUrl,
  parseUTMParameters,
  calculateBantPrequalification,
  trackErpEvent
} from '../../../utils/erpModernizationEngine';
import type {
  SourceErp,
  ErpContactData,
  BantData,
  BantPrequalification
} from '../../../utils/erpModernizationEngine';

const ERP_CONFIGS: Record<SourceErp, { name: string; tag: string; description: string }> = {
  ebs: {
    name: 'Oracle E-Business Suite',
    tag: 'EBS',
    description: 'Modernización de procesos, eliminación de personalizaciones innecesarias, estrategia de datos, integraciones y transición hacia Oracle Fusion Cloud.'
  },
  jde: {
    name: 'JD Edwards',
    tag: 'JDE',
    description: 'Estandarización y modernización progresiva de finanzas, compras, proyectos, manufactura y supply chain.'
  },
  peoplesoft: {
    name: 'PeopleSoft',
    tag: 'PeopleSoft',
    description: 'Evaluación de procesos, datos históricos, integraciones y transición hacia una plataforma SaaS con actualizaciones continuas.'
  },
  sap: {
    name: 'SAP',
    tag: 'SAP (ECC / S4)',
    description: 'Evaluación de Oracle Fusion como alternativa para simplificar la arquitectura, modernizar procesos y reducir la complejidad del entorno actual.'
  },
  general: {
    name: 'ERP Legado',
    tag: 'ERP LEGADO',
    description: 'Estrategia integral de transición hacia Oracle Fusion Cloud para optimizar la arquitectura, elevar el control operativo y acelerar la toma de decisiones.'
  }
};

export const ErpModernizationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ERP Seleccionado
  const [selectedErp, setSelectedErp] = useState<SourceErp>('general');

  // Control de Formulario (Paso 1, Paso 2, Exito)
  const [formStep, setFormStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<{
    leadId: string;
    prequalification: BantPrequalification;
    assignedSdr: 'Ximena' | 'Fabrizio';
  } | null>(null);
  const [meetingBooked, setMeetingBooked] = useState<boolean>(false);
  const [bookingTime, setBookingTime] = useState<string>('Mañana 10:00 AM');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Estado Paso 1: Contacto y Entorno
  const [contactData, setContactData] = useState<ErpContactData>({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    workEmail: '',
    country: 'México',
    phone: '',
    currentErp: 'Oracle E-Business Suite',
    erpVersion: '',
    currentModules: ['Finanzas'],
    privacyAccepted: false
  });

  // Estado Paso 2: Preguntas BANT
  const [bantData, setBantData] = useState<BantData>({
    mainNeed: 'Procesos manuales.',
    businessImpact: 'Impacto financiero o de control.',
    problemDescription: '',
    authorityRole: 'Soy responsable de la decisión.',
    budgetStatus: 'Estamos definiendo el presupuesto.',
    timing: 'Durante los próximos 3–6 meses.'
  });

  const trackedVisitRef = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Parsear URL parameters en montaje y cambio de location
  useEffect(() => {
    const erpParam = getSourceErpFromUrl(location.search);
    setSelectedErp(erpParam);

    if (!trackedVisitRef.current) {
      trackedVisitRef.current = true;
      const utmParams = parseUTMParameters();
      trackErpEvent('erp_modernization_page_view', {
        source_erp: erpParam,
        ...utmParams
      });
      api.post('/erp-modernization/track', {
        event_type: 'erp_modernization_page_view',
        path: '/erp-modernization',
        source_erp: erpParam,
        ...utmParams
      }).catch(() => {});
    }
  }, [location.search]);

  // Handler cambio de ERP
  const handleSelectErpCard = (erp: SourceErp) => {
    setSelectedErp(erp);
    trackErpEvent('erp_source_selected', { source_erp: erp });
    
    // Actualizar select de ERP actual en formulario
    let defaultErpName = 'Oracle E-Business Suite';
    if (erp === 'jde') defaultErpName = 'JD Edwards EnterpriseOne';
    if (erp === 'peoplesoft') defaultErpName = 'PeopleSoft';
    if (erp === 'sap') defaultErpName = 'SAP ECC';

    setContactData((prev) => ({ ...prev, currentErp: defaultErpName }));
  };

  // Scroll smooth hacia formulario
  const scrollToForm = () => {
    trackErpEvent('modernization_cta_click', { cta: 'evaluar_mi_ruta' });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle módulo selección
  const toggleModule = (moduleName: string) => {
    setContactData((prev) => {
      const exists = prev.currentModules.includes(moduleName);
      if (exists) {
        return { ...prev, currentModules: prev.currentModules.filter((m) => m !== moduleName) };
      } else {
        return { ...prev, currentModules: [...prev.currentModules, moduleName] };
      }
    });
  };

  // Paso 1 Validacion & Continuar
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contactData.firstName.trim() || !contactData.lastName.trim() || !contactData.company.trim() || !contactData.jobTitle.trim() || !contactData.workEmail.trim()) {
      setErrorMessage('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    // Validacion basica de correo corporativo
    const emailLower = contactData.workEmail.trim().toLowerCase();
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com'];
    const domain = emailLower.split('@')[1];
    if (domain && publicDomains.includes(domain)) {
      setErrorMessage('Por favor ingresa un correo electrónico corporativo empresarial (no público).');
      return;
    }

    trackErpEvent('modernization_step_1_complete', {
      current_erp: contactData.currentErp,
      company: contactData.company
    });

    setFormStep(2);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Envío Final Formulario BANT
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contactData.privacyAccepted) {
      setErrorMessage('Debes aceptar el Aviso de Privacidad de FABRIC para continuar.');
      return;
    }

    setIsSubmitting(true);
    trackErpEvent('modernization_bant_complete');

    const utmParams = parseUTMParameters();
    const prequalification = calculateBantPrequalification(bantData);

    const payload = {
      ...contactData,
      ...bantData,
      sourceErp: selectedErp,
      ...utmParams
    };

    try {
      const res = await api.post('/erp-modernization/lead', payload);
      const data = res.data;

      if (data.success) {
        setSubmissionResult({
          leadId: data.lead_id,
          prequalification: data.prequalification || prequalification,
          assignedSdr: data.assigned_sdr || 'Ximena'
        });
        setFormStep(3); // Mostrar Agradecimiento
        trackErpEvent('modernization_form_submit', {
          lead_id: data.lead_id,
          prequalification: data.prequalification,
          assigned_sdr: data.assigned_sdr
        });
      } else {
        setErrorMessage(data.error || 'Ocurrió un problema al enviar la información.');
      }
    } catch (err: any) {
      console.error('Error enviando formulario ERP Modernization:', err);
      setErrorMessage(err.response?.data?.error || 'Error de conexión con el servidor. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmación de agendamiento de llamada de validación
  const handleBookCall = async () => {
    if (!submissionResult?.leadId) return;

    try {
      await api.post('/erp-modernization/booking-confirmation', {
        lead_id: submissionResult.leadId,
        booking_time: bookingTime,
        sdr_assigned: submissionResult.assignedSdr
      });
      setMeetingBooked(true);
      trackErpEvent('modernization_validation_call_booked', {
        lead_id: submissionResult.leadId,
        sdr: submissionResult.assignedSdr,
        time: bookingTime
      });
    } catch (err) {
      console.error('Error al agendar llamada:', err);
    }
  };

  const activeErpInfo = ERP_CONFIGS[selectedErp];

  return (
    <div className="w-full min-h-screen font-sans selection:bg-[#C9A96E] selection:text-black pt-28 md:pt-36">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden border-b border-[#C9A96E]/20 w-full">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-[#C9A96E]/15 to-[#8C7243]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0E2747] border border-[#C9A96E]/40 text-[#C9A96E] text-xs font-mono font-bold tracking-widest uppercase mb-8 shadow-inner">
            <Activity className="w-4 h-4 text-[#C9A96E] animate-pulse" />
            <span>FABRIC ERP MODERNIZATION ROADMAP™</span>
          </div>

          {/* Subtítulo Dinámico */}
          <div className="text-xs sm:text-sm font-mono text-[#C9A96E] font-extrabold tracking-widest uppercase mb-4">
            {selectedErp !== 'general' ? activeErpInfo.name : 'EBS · JD Edwards · PeopleSoft · SAP'} → Oracle Fusion Cloud
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 max-w-6xl mx-auto">
            Moderniza {selectedErp !== 'general' ? activeErpInfo.name : 'Oracle EBS, JD Edwards, PeopleSoft o SAP'} hacia Oracle Fusion Cloud
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-5xl mx-auto leading-relaxed mb-10 font-normal">
            Define una ruta de modernización que considere procesos, datos, integraciones, riesgos, continuidad operativa e inversión antes de iniciar el proyecto.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <button
              onClick={scrollToForm}
              className="px-8 py-4 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-xl text-base tracking-wide transition-all shadow-lg hover:shadow-[#C9A96E]/30 flex items-center gap-3 cursor-pointer"
            >
              <span>Evaluar mi ruta hacia Oracle Fusion</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={scrollToForm}
              className="px-8 py-4 bg-[#0E2747] hover:bg-[#123254] text-white font-bold rounded-xl text-base tracking-wide transition-all border border-[#C9A96E]/40 hover:border-[#C9A96E] flex items-center gap-2 cursor-pointer"
            >
              <span>Hablar con un especialista</span>
            </button>
          </div>

          {/* Microcopy */}
          <p className="text-xs font-mono text-slate-400 tracking-wider">
            Diagnóstico inicial · Sin costo · Enfoque ejecutivo y tecnológico
          </p>
        </div>
      </section>

      {/* 2. SECCIÓN: EL PROBLEMA */}
      <section className="py-20 bg-[#0E2747]/90 border-b border-[#C9A96E]/20 w-full">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="text-center max-w-5xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4">
              Tu ERP puede seguir operando y, al mismo tiempo, estar limitando al negocio
            </h2>
            <p className="text-base md:text-lg text-slate-300">
              ¿Identificas alguno de estos 10 síntomas en tu infraestructura actual?
            </p>
          </div>

          {/* Grid 10 Escenarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              'Procesos críticos que dependen de Excel, correos o actividades manuales.',
              'Cierres financieros lentos y conciliaciones complejas.',
              'Exceso de personalizaciones difíciles de mantener.',
              'Integraciones frágiles o poco documentadas.',
              'Información fragmentada entre diferentes aplicaciones.',
              'Reportes que requieren reconstrucción manual.',
              'Costos crecientes de infraestructura, soporte y actualización.',
              'Dependencia de conocimiento concentrado en pocas personas.',
              'Dificultad para incorporar automatización, analítica e inteligencia artificial.',
              'Limitaciones para crecer hacia nuevas empresas, países o modelos de negocio.'
            ].map((scenario, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#123254] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all flex items-start gap-4"
              >
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                  !
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                  {scenario}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={scrollToForm}
              className="px-8 py-3.5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-xl text-sm transition-all flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>Evaluar mi ERP actual</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN POR ERP DE ORIGEN (4 TARJETAS INTERACTIVAS) */}
      <section className="py-20 border-b border-[#C9A96E]/20 w-full">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="text-center max-w-5xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
              RUTAS DE MODERNIZACIÓN POR PLATAFORMA
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">
              Selecciona tu ERP de origen actual
            </h2>
            <p className="text-base text-slate-300">
              Adapta la estrategia de evaluación según las características de tu arquitectura existente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: EBS */}
            <div
              onClick={() => handleSelectErpCard('ebs')}
              className={`p-7 rounded-3xl cursor-pointer transition-all border ${
                selectedErp === 'ebs'
                  ? 'bg-[#0E2747] border-[#C9A96E] shadow-2xl scale-[1.02]'
                  : 'bg-[#0E2747]/60 border-slate-700 hover:border-[#C9A96E]/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-6 font-mono font-bold text-sm">
                EBS
              </div>
              <h3 className="text-xl font-bold mb-3">Oracle E-Business Suite</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Modernización de procesos, eliminación de personalizaciones innecesarias, estrategia de datos, integraciones y transición hacia Oracle Fusion Cloud.
              </p>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${selectedErp === 'ebs' ? 'text-[#C9A96E]' : 'text-slate-400'}`}>
                {selectedErp === 'ebs' ? '✓ Seleccionado' : 'Seleccionar ruta →'}
              </span>
            </div>

            {/* Card 2: JDE */}
            <div
              onClick={() => handleSelectErpCard('jde')}
              className={`p-7 rounded-3xl cursor-pointer transition-all border ${
                selectedErp === 'jde'
                  ? 'bg-[#0E2747] border-[#C9A96E] shadow-2xl scale-[1.02]'
                  : 'bg-[#0E2747]/60 border-slate-700 hover:border-[#C9A96E]/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-6 font-mono font-bold text-sm">
                JDE
              </div>
              <h3 className="text-xl font-bold mb-3">JD Edwards</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Estandarización y modernización progresiva de finanzas, compras, proyectos, manufactura y supply chain.
              </p>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${selectedErp === 'jde' ? 'text-[#C9A96E]' : 'text-slate-400'}`}>
                {selectedErp === 'jde' ? '✓ Seleccionado' : 'Seleccionar ruta →'}
              </span>
            </div>

            {/* Card 3: PeopleSoft */}
            <div
              onClick={() => handleSelectErpCard('peoplesoft')}
              className={`p-7 rounded-3xl cursor-pointer transition-all border ${
                selectedErp === 'peoplesoft'
                  ? 'bg-[#0E2747] border-[#C9A96E] shadow-2xl scale-[1.02]'
                  : 'bg-[#0E2747]/60 border-slate-700 hover:border-[#C9A96E]/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-6 font-mono font-bold text-sm">
                PSFT
              </div>
              <h3 className="text-xl font-bold mb-3">PeopleSoft</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Evaluación de procesos, datos históricos, integraciones y transición hacia una plataforma SaaS con actualizaciones continuas.
              </p>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${selectedErp === 'peoplesoft' ? 'text-[#C9A96E]' : 'text-slate-400'}`}>
                {selectedErp === 'peoplesoft' ? '✓ Seleccionado' : 'Seleccionar ruta →'}
              </span>
            </div>

            {/* Card 4: SAP */}
            <div
              onClick={() => handleSelectErpCard('sap')}
              className={`p-7 rounded-3xl cursor-pointer transition-all border ${
                selectedErp === 'sap'
                  ? 'bg-[#0E2747] border-[#C9A96E] shadow-2xl scale-[1.02]'
                  : 'bg-[#0E2747]/60 border-slate-700 hover:border-[#C9A96E]/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-6 font-mono font-bold text-sm">
                SAP
              </div>
              <h3 className="text-xl font-bold mb-3">SAP (ECC / S4)</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Evaluación de Oracle Fusion como alternativa para simplificar la arquitectura, modernizar procesos y reducir la complejidad del entorno actual.
              </p>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${selectedErp === 'sap' ? 'text-[#C9A96E]' : 'text-slate-400'}`}>
                {selectedErp === 'sap' ? '✓ Seleccionado' : 'Seleccionar ruta →'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN: POR QUÉ ORACLE FUSION CLOUD */}
      <section className="py-20 bg-[#0E2747]/90 border-b border-[#C9A96E]/20 w-full">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="text-center max-w-5xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
              ARQUITECTURA DE SIGUIENTE GENERACIÓN
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">
              Una plataforma empresarial preparada para operar, crecer y evolucionar
            </h2>
            <p className="text-base text-slate-300">
              Criterios técnicos e institucionales de modernización sobre Oracle Fusion Cloud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Plataforma Integrada',
                desc: 'Finanzas, compras, proyectos, supply chain y otras funciones en una plataforma integrada.'
              },
              {
                title: 'Actualizaciones Continuas',
                desc: 'Innovación periódica trimestral sin necesidad de proyectos masivos de upgrade.'
              },
              {
                title: 'Automatización e IA',
                desc: 'Capacidades nativas de inteligencia artificial y automatización de procesos contables y operativos.'
              },
              {
                title: 'Analítica Empresarial',
                desc: 'Información y analítica empresarial integrada en tiempo real sin requerir datawarehouses externos complejos.'
              },
              {
                title: 'Operaciones Multinaiconales',
                desc: 'Soporte nativo para operaciones multiempresa, multimoneda y cumplimiento fiscal regional.'
              },
              {
                title: 'Trazabilidad y Seguridad',
                desc: 'Menor dependencia de infraestructura heredada, con controles y gobierno embebido en el proceso.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-7 rounded-2xl bg-[#123254] border border-[#C9A96E]/30">
                <CheckCircle2 className="w-6 h-6 text-[#C9A96E] mb-4" />
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECCIÓN: CÓMO LO HACEMOS (5 ETAPAS) */}
      <section className="py-20 border-b border-[#C9A96E]/20 w-full">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
              METODOLOGÍA CONTROLADA
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4">
              De la evaluación del ERP actual a una modernización controlada
            </h2>
            <p className="text-base text-slate-300">
              Un enfoque por fases para minimizar riesgos y asegurar la continuidad del negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
            {[
              {
                step: '1',
                title: 'Discover',
                desc: 'Objetivos de negocio, dolores, procesos y restricciones.'
              },
              {
                step: '2',
                title: 'Assess & Roadmap',
                desc: 'Evaluación del ERP, aplicaciones, personalizaciones, datos, integraciones, riesgos y alternativas.'
              },
              {
                step: '3',
                title: 'Design',
                desc: 'Modelo futuro, alcance, arquitectura y estrategia de transición.'
              },
              {
                step: '4',
                title: 'Implement & Migrate',
                desc: 'Configuración de Oracle Fusion, rediseño de procesos, integraciones, migración de datos y gestión del cambio.'
              },
              {
                step: '5',
                title: 'Stabilize & Optimize',
                desc: 'Soporte al Go-Live, estabilización, adopción y mejora continua.'
              }
            ].map((phase, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#0E2747] border border-[#C9A96E]/30 relative">
                <span className="w-8 h-8 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold flex items-center justify-center mb-4">
                  {phase.step}
                </span>
                <h3 className="text-base font-bold mb-2">{phase.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{phase.desc}</p>
              </div>
            ))}
          </div>

          {/* Aclaracion */}
          <div className="p-6 rounded-2xl bg-[#0E2747]/60 border border-slate-700 max-w-4xl mx-auto text-center">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              💡 <strong className="font-semibold">Nota de gobernanza:</strong> No todas las organizaciones necesitan modernizar todo al mismo tiempo. La ruta puede ser integral, progresiva o estructurada por procesos, empresas, unidades de negocio y países.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FORMULARIO Y PRECALIFICACIÓN BANT (EN 2 PASOS / AGRADECIMIENTO) */}
      <section ref={formRef} className="py-20 border-b border-[#C9A96E]/20 w-full">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 max-w-4xl mx-auto">
          
          <div className="bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl">
            
            {/* Header del formulario */}
            <div className="border-b border-[#C9A96E]/20 pb-6 mb-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                  FABRIC ERP MODERNIZATION ROADMAP™
                </span>
                {formStep < 3 && (
                  <span className="text-xs font-mono text-slate-400 font-semibold">
                    PASO {formStep} DE 2
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {formStep === 1 && 'Paso 1: Datos del Contacto y Entorno Actual'}
                {formStep === 2 && 'Paso 2: Evaluación de Iniciativa y BANT'}
                {formStep === 3 && 'Solicitud Recibida'}
              </h2>
            </div>

            {/* Mensajes de error */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-mono text-center">
                {errorMessage}
              </div>
            )}

            {/* PASO 1: DATOS DEL CONTACTO Y ENTORNO */}
            {formStep === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactData.firstName}
                      onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
                      placeholder="Ej. Roberto"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactData.lastName}
                      onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
                      placeholder="Ej. Garza"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactData.company}
                      onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                      placeholder="Ej. FEMSA Comercio"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Cargo *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactData.jobTitle}
                      onChange={(e) => setContactData({ ...contactData, jobTitle: e.target.value })}
                      placeholder="Ej. Director de Sistemas / CFO"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Email Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactData.workEmail}
                      onChange={(e) => setContactData({ ...contactData, workEmail: e.target.value })}
                      placeholder="rgarza@femsa.com"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#C9A96E]" />
                      País *
                    </label>
                    <select
                      value={contactData.country}
                      onChange={(e) => setContactData({ ...contactData, country: e.target.value })}
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                    >
                      <option>México</option>
                      <option>Colombia</option>
                      <option>Chile</option>
                      <option>Perú</option>
                      <option>España</option>
                      <option>Estados Unidos</option>
                      <option>Argentina</option>
                      <option>Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ERP Actual *
                    </label>
                    <select
                      value={contactData.currentErp}
                      onChange={(e) => setContactData({ ...contactData, currentErp: e.target.value })}
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                    >
                      <option>Oracle E-Business Suite</option>
                      <option>JD Edwards EnterpriseOne</option>
                      <option>JD Edwards World</option>
                      <option>PeopleSoft</option>
                      <option>SAP ECC</option>
                      <option>SAP S/4HANA</option>
                      <option>Otro SAP</option>
                      <option>Otro ERP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Versión del ERP (si la conoce)
                    </label>
                    <input
                      type="text"
                      value={contactData.erpVersion}
                      onChange={(e) => setContactData({ ...contactData, erpVersion: e.target.value })}
                      placeholder="Ej. R12.2.9 / 9.2"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                </div>

                {/* Seleccion de Modulos */}
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-2">
                    Módulos principales implementados *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      'Finanzas',
                      'Compras',
                      'Proyectos',
                      'Inventarios / SCM',
                      'Manufactura',
                      'Recursos Humanos',
                      'Ventas / CRM',
                      'Mantenimiento'
                    ].map((mod) => {
                      const isSel = contactData.currentModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => toggleModule(mod)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                            isSel
                              ? 'bg-[#C9A96E] text-[#050203] border-[#C9A96E]'
                              : 'bg-[#07192F] text-slate-200 border-slate-700 hover:border-[#C9A96E]/50'
                          }`}
                        >
                          <span>{mod}</span>
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-[#050203]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campo Opcional Teléfono */}
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C9A96E]" />
                    Teléfono o WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div className="pt-4 border-t border-[#C9A96E]/20 flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-xl text-sm tracking-wide transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Siguiente: Preguntas de Evaluación (Paso 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: PREGUNTAS BANT */}
            {formStep === 2 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                
                {/* NEED */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    NEED · Necesidad & Motivo
                  </label>
                  <p className="text-xs text-slate-300">
                    ¿Cuál es el principal motivo por el que están evaluando una modernización? *
                  </p>
                  <select
                    value={bantData.mainNeed}
                    onChange={(e) => setBantData({ ...bantData, mainNeed: e.target.value })}
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                  >
                    <option>Procesos manuales.</option>
                    <option>Cierre financiero o reporting.</option>
                    <option>Personalizaciones.</option>
                    <option>Integraciones.</option>
                    <option>Datos fragmentados.</option>
                    <option>Infraestructura y soporte.</option>
                    <option>Costos del entorno actual.</option>
                    <option>Escalabilidad.</option>
                    <option>Automatización e inteligencia artificial.</option>
                    <option>Fin de ciclo o estrategia tecnológica.</option>
                    <option>Otro.</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    ¿Qué impacto está generando actualmente? *
                  </p>
                  <select
                    value={bantData.businessImpact}
                    onChange={(e) => setBantData({ ...bantData, businessImpact: e.target.value })}
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                  >
                    <option>Impacto financiero o de control.</option>
                    <option>Retrasos operativos.</option>
                    <option>Riesgos para la continuidad.</option>
                    <option>Costos elevados.</option>
                    <option>Limitaciones para crecer.</option>
                    <option>Baja productividad.</option>
                    <option>Por ahora no existe un impacto crítico.</option>
                    <option>Otro.</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1.5">
                    Cuéntanos brevemente qué está ocurriendo (máximo 1,000 caracteres, opcional)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={bantData.problemDescription}
                    onChange={(e) => setBantData({ ...bantData, problemDescription: e.target.value })}
                    placeholder="Describe los principales cuellos de botella o retos de tu ERP actual..."
                    className="w-full p-4 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E]"
                  />
                  <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                    {bantData.problemDescription?.length || 0} / 1000
                  </div>
                </div>

                {/* AUTHORITY */}
                <div className="space-y-3 pt-4 border-t border-[#C9A96E]/20">
                  <label className="block text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    AUTHORITY · Rol de Decisión
                  </label>
                  <p className="text-xs text-slate-300">
                    ¿Cuál es tu participación en esta iniciativa? *
                  </p>
                  <select
                    value={bantData.authorityRole}
                    onChange={(e) => setBantData({ ...bantData, authorityRole: e.target.value })}
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                  >
                    <option>Soy responsable de la decisión.</option>
                    <option>Formo parte del comité de decisión.</option>
                    <option>Lidero la evaluación técnica o funcional.</option>
                    <option>Estoy construyendo el business case.</option>
                    <option>Estoy recopilando información para otra persona.</option>
                    <option>Por ahora sólo estoy explorando.</option>
                  </select>
                </div>

                {/* BUDGET */}
                <div className="space-y-3 pt-4 border-t border-[#C9A96E]/20">
                  <label className="block text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    BUDGET · Situación de Inversión
                  </label>
                  <p className="text-xs text-slate-300">
                    ¿Cuál es la situación actual de la inversión? *
                  </p>
                  <select
                    value={bantData.budgetStatus}
                    onChange={(e) => setBantData({ ...bantData, budgetStatus: e.target.value })}
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                  >
                    <option>Ya existe presupuesto aprobado.</option>
                    <option>Existe una partida estimada, pendiente de aprobación.</option>
                    <option>Estamos definiendo el presupuesto.</option>
                    <option>Necesitamos construir primero el business case.</option>
                    <option>Todavía no existe presupuesto asignado.</option>
                    <option>No conozco la situación del presupuesto.</option>
                  </select>
                </div>

                {/* TIMING */}
                <div className="space-y-3 pt-4 border-t border-[#C9A96E]/20">
                  <label className="block text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    TIMING · Horizonte de Tiempo
                  </label>
                  <p className="text-xs text-slate-300">
                    ¿Cuándo esperan tomar una decisión o iniciar el proyecto? *
                  </p>
                  <select
                    value={bantData.timing}
                    onChange={(e) => setBantData({ ...bantData, timing: e.target.value })}
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E]"
                  >
                    <option>Ya estamos evaluando proveedores o partners.</option>
                    <option>Durante los próximos 3 meses.</option>
                    <option>Durante los próximos 3–6 meses.</option>
                    <option>Durante los próximos 6–12 meses.</option>
                    <option>En más de 12 meses.</option>
                    <option>Por ahora sólo estamos explorando.</option>
                  </select>
                </div>

                {/* Privacy Checkbox */}
                <div className="pt-4 border-t border-[#C9A96E]/20 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacyCheck"
                    required
                    checked={contactData.privacyAccepted}
                    onChange={(e) => setContactData({ ...contactData, privacyAccepted: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#C9A96E] border-slate-700 bg-[#07192F] rounded cursor-pointer"
                  />
                  <label htmlFor="privacyCheck" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                    Acepto el <a href="/privacidad" target="_blank" className="text-[#C9A96E] underline">Aviso de Privacidad de FABRIC SOFT MÉXICO</a> para recibir la evaluación técnica de mi ERP.
                  </label>
                </div>

                <div className="pt-6 border-t border-[#C9A96E]/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    ← Volver al Paso 1
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !contactData.privacyAccepted}
                    className="px-8 py-3.5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-xl text-sm tracking-wide transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Procesando diagnóstico...' : 'Solicitar diagnóstico de modernización'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 3: AGRADECIMIENTO & LLAMADA DE VALIDACIÓN */}
            {formStep === 3 && (
              <div className="text-center py-6 space-y-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E] text-[#C9A96E] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  ¡Gracias, {contactData.firstName}!
                </h3>

                <p className="text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
                  Recibimos la información sobre tu entorno actual ({contactData.currentErp}) y tus objetivos de modernización.
                </p>

                <p className="text-sm text-slate-300 max-w-xl mx-auto">
                  Un especialista de FABRIC SOFT MÉXICO revisará tu caso y se pondrá en contacto contigo para validar la información y determinar el siguiente paso.
                </p>

                {/* Banner Prioridad Alta */}
                {submissionResult?.prequalification === 'HIGH' && (
                  <div className="mt-8 p-6 rounded-2xl bg-[#123254] border border-[#C9A96E]/50 text-left max-w-xl mx-auto space-y-4">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C9A96E] uppercase">
                      <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                      <span>DIAGNOSTICO PRIORITARIO DISPONIBLE</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      Tu iniciativa parece encontrarse en una etapa adecuada para una conversación de diagnóstico.
                    </p>

                    {meetingBooked ? (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-mono text-center">
                        ✓ Llamada de validación reservada para {bookingTime}.
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs text-slate-300 font-mono">
                          Selecciona un horario conveniente para tu llamada de validación:
                        </label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E]"
                        >
                          <option>Mañana 10:00 AM</option>
                          <option>Mañana 04:00 PM</option>
                          <option>Pasado mañana 11:30 AM</option>
                          <option>Pasado mañana 03:00 PM</option>
                        </select>

                        <button
                          onClick={handleBookCall}
                          className="w-full py-3 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Seleccionar horario para llamada de validación</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="py-12 bg-[#07192F] text-center font-mono text-xs text-slate-300 border-t border-[#C9A96E]/20">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 space-y-3">
          <p className="text-[#C9A96E] font-bold">FABRIC ERP MODERNIZATION ROADMAP™</p>
          <p>Oracle, EBS, JD Edwards, PeopleSoft y Oracle Fusion Cloud son marcas registradas de Oracle Corporation. SAP es marca registrada de SAP SE.</p>
          <p>© {new Date().getFullYear()} FABRIC SOFT MÉXICO. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default ErpModernizationPage;
