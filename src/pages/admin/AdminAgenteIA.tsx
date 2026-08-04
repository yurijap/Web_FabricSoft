import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Flame,
  Layers3,
  Paperclip,
  RotateCcw,
  Save,
  Send,
  SlidersHorizontal,
  TerminalSquare,
  UploadCloud,
  Coins,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '../../config/api';

type ProcessStatus = 'idle' | 'running' | 'done';
type ChatMessage = {
  role: 'agent' | 'user';
  text: string;
  usage?: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};
type KnowledgeFile = {
  name: string;
  mimeType: string;
  size: number;
  content: string;
};

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
  claude: {
    name: 'Claude',
    models: ['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  grok: {
    name: 'Grok',
    models: ['grok-2', 'grok-2-mini', 'grok-1.5', 'grok-1.5-vision'],
  },
};

type ProviderId = keyof typeof PROVIDERS;

type AgenteIAConfig = {
  prompt: string;
  files: string[];
  knowledgeFile?: KnowledgeFile | null;
  llmChain: Array<{
    provider: ProviderId;
    model: string;
  }>;
  temperature: number;
  status?: 'draft' | 'active';
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const defaultPrompt = `Eres el agente publico de FABRIC.
Respondes en la parte publica del sitio.
Tu trabajo es orientar a CFOs, CTOs y ejecutivos con iniciativas Oracle.
Responde claro, breve y con criterio senior.
No prometas resultados sin evaluacion.
Si el caso parece viable, invita a iniciar admision.
Si falta informacion, pregunta industria, revenue, urgencia y sistema actual.`;

export default function AdminAgenteIA() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [prompt, setPrompt] = useState(defaultPrompt);
  const [files, setFiles] = useState<string[]>([]);
  const [knowledgeFile, setKnowledgeFile] = useState<KnowledgeFile | null>(null);
  const [temperature, setTemperature] = useState(32);
  const [llmChain, setLlmChain] = useState<Array<{ provider: ProviderId; model: string }>>([
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'claude', model: 'claude-3.5-sonnet' },
    { provider: 'grok', model: 'grok-2' },
  ]);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [processLog, setProcessLog] = useState([
    'Sistema en espera.',
    'Al guardar, aqui veras la validacion del prompt y despliegue del agente.',
  ]);
  const [testMessage, setTestMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'agent', text: 'Entorno de prueba listo. Escribe un mensaje para evaluar la configuracion actual.' },
  ]);
  const [isTesting, setIsTesting] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [tokenStats, setTokenStats] = useState<{
    summary: { totalPrompt: number; totalCompletion: number; totalTokens: number; count: number };
    byProvider: Array<{ _id: string; promptTokens: number; completionTokens: number; totalTokens: number; count: number }>;
    byType: Array<{ _id: string; totalTokens: number; count: number }>;
    dailyUsage: Array<{ _id: string; totalTokens: number; promptTokens: number; completionTokens: number; count: number }>;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const cargarEstadisticasTokens = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      setIsLoadingStats(true);
      const { data } = await api.get('/agente-ia/tokens/stats', {
        headers: authHeaders(token),
      });
      if (data.success) {
        setTokenStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas de tokens:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const canSave = prompt.trim().length > 10;

  const promptScore = useMemo(() => {
    const checks = [
      /eres|agente|respondes/i.test(prompt),
      /fabric|oracle|cfo|cto/i.test(prompt),
      /no prometas|evaluacion|pregunta/i.test(prompt),
    ];
    return checks.filter(Boolean).length;
  }, [prompt]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTesting]);

  useEffect(() => {
    let mounted = true;

    const cargarAgente = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const { data } = await api.get('/agente-ia', {
          headers: authHeaders(token),
        });
        const agente = data.agente as AgenteIAConfig;
        if (!mounted) return;

        setPrompt(agente.prompt || defaultPrompt);
        setFiles(Array.isArray(agente.files) ? agente.files : []);
        setKnowledgeFile(agente.knowledgeFile || null);
        setTemperature(typeof agente.temperature === 'number' ? agente.temperature : 32);

        if (Array.isArray(agente.llmChain) && agente.llmChain.length === 3) {
          setLlmChain(
            agente.llmChain.map((item) => ({
              provider: item.provider,
              model: item.model,
            })),
          );
        }
      } catch (error: any) {
        toast.error('No se pudo cargar el agente IA', {
          description: error.response?.data?.error || 'Revisa el backend e intenta otra vez.',
        });
      }
    };

    cargarAgente();
    cargarEstadisticasTokens();

    return () => {
      mounted = false;
    };
  }, [getToken]);

  const updateChain = (index: number, field: 'provider' | 'model', value: string) => {
    setLlmChain((current) => {
      const newChain = [...current];

      if (field === 'provider') {
        const provider = value as ProviderId;
        newChain[index] = {
          provider,
          model: PROVIDERS[provider].models[0],
        };
      } else {
        newChain[index] = {
          ...newChain[index],
          model: value,
        };
      }

      return newChain;
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];

    if (!file) return;

    if (fileList && fileList.length > 1) {
      toast.error('Solo se permite un archivo', {
        description: 'Para mantener el agente rapido, sube solo un archivo de conocimiento.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const extensionOk = /\.(txt|md|csv|json|xls|xlsx)$/i.test(file.name);

    if (!allowedTypes.includes(file.type) && !extensionOk) {
      toast.error('Archivo no soportado', {
        description: 'Sube un solo archivo TXT, MD, CSV, JSON, XLS o XLSX.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error('Archivo demasiado grande', {
        description: 'Usa un archivo menor a 2 MB para mantener la carga rapida.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        toast.error('Sesion no disponible', {
          description: 'Vuelve a iniciar sesion para subir el archivo.',
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/agente-ia/upload', formData, {
        headers: {
          ...authHeaders(token),
          'Content-Type': 'multipart/form-data',
        },
      });

      setFiles(data.files || [file.name]);
      setKnowledgeFile(data.knowledgeFile);

      toast.success('Archivo procesado', {
        description: `${file.name} quedo listo para guardar.`,
      });
    } catch (error: any) {
      toast.error('No se pudo procesar el archivo', {
        description: error.response?.data?.error || 'Revisa el formato e intenta otra vez.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.error('Falta el prompt', {
        description: 'Escribe la instruccion del sistema antes de guardar.',
      });
      return;
    }

    if (!canSave) {
      toast.error('Prompt demasiado corto', {
        description: 'El prompt debe tener al menos 10 caracteres.',
      });
      return;
    }

    if (llmChain.some((item) => !item.provider || !item.model)) {
      toast.error('Falta seleccionar IA o modelo', {
        description: 'Configura los 3 niveles de la cadena IA.',
      });
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        toast.error('Sesion no disponible', {
          description: 'Vuelve a iniciar sesion para guardar el agente.',
        });
        return;
      }

      setProcessStatus('running');
      setProcessLog(['Validando configuracion local...']);

      await api.post(
        '/agente-ia',
        {
          prompt,
          files,
          knowledgeFile,
          llmChain,
          temperature,
          status: 'active',
        },
        {
          headers: authHeaders(token),
        },
      );

      const steps = [
        'Instruccion principal validada.',
        'Hook de captacion analizado: intencion, urgencia y perfil.',
        files.length ? `Referenciando ${files.length} archivo(s) opcional(es).` : 'Sin archivos: operando solo con prompt base.',
        `Cadena IA guardada: 1ro ${llmChain[0].model} -> 2do ${llmChain[1].model} -> 3ro ${llmChain[2].model}.`,
        `Temperatura ajustada a ${temperature}%.`,
        'Agente actualizado correctamente en MongoDB.',
      ];

      setProcessLog([]);

      steps.forEach((step, index) => {
        window.setTimeout(() => {
          setProcessLog((current) => [...current, step]);
          if (index === steps.length - 1) setProcessStatus('done');
        }, 260 * (index + 1));
      });

      toast.success('Agente IA guardado', {
        description: 'La configuracion quedo lista para el simulador publico.',
      });
    } catch (error: any) {
      setProcessStatus('idle');
      setProcessLog((current) => [
        ...current,
        error.response?.data?.error || 'Error guardando configuracion del agente.',
      ]);
      toast.error('No se pudo guardar el agente', {
        description: error.response?.data?.error || 'Revisa el backend e intenta otra vez.',
      });
    }
  };

  const runTest = async (event?: FormEvent) => {
    if (event) event.preventDefault();

    if (!testMessage.trim()) {
      toast.error('Falta mensaje de prueba', {
        description: 'Escribe una pregunta para simular al usuario publico.',
      });
      return;
    }

    if (isTesting) return;

    const userText = testMessage.trim();
    setMessages((current) => [...current, { role: 'user', text: userText }]);
    setTestMessage('');
    setIsTesting(true);
    setProcessLog((current) => [...current, `Simulación: Enviando consulta...`]);

    try {
      const token = await getToken();

      if (!token) {
        toast.error('Sesion no disponible', {
          description: 'Vuelve a iniciar sesion para probar el agente.',
        });
        return;
      }

      const recentHistory = messages
        .filter((item) => item.text && !item.text.startsWith('Entorno de prueba'))
        .slice(-8);

      const { data } = await api.post(
        '/agente-ia/test',
        { message: userText, history: recentHistory },
        {
          headers: authHeaders(token),
        },
      );

      const usage = data.usedConfig?.usage;
      const provider = data.usedConfig?.provider;
      const model = data.usedConfig?.model;

      setMessages((current) => [
        ...current,
        {
          role: 'agent',
          text: data.reply,
          usage: usage
            ? {
                provider: provider || '',
                model: model || '',
                promptTokens: usage.promptTokens || 0,
                completionTokens: usage.completionTokens || 0,
                totalTokens: usage.totalTokens || 0,
              }
            : undefined,
        },
      ]);

      if (usage) {
        setProcessLog((current) => [
          ...current,
          `Simulación: Consulta procesada por ${provider} (${model}).`,
          `Tokens consumidos: ${usage.totalTokens} (Prompt: ${usage.promptTokens} | Completion: ${usage.completionTokens})`,
        ]);
      } else {
        setProcessLog((current) => [
          ...current,
          `Simulación: Consulta procesada por ${provider || 'desconocido'} (${model || 'desconocido'}). Sin datos de tokens.`,
        ]);
      }

      cargarEstadisticasTokens();
    } catch (error: any) {
      toast.error('No se pudo probar el agente', {
        description: error.response?.data?.error || 'Revisa la API e intenta otra vez.',
      });
      setMessages((current) => [
        ...current,
        { role: 'agent', text: 'No pude generar respuesta porque la API devolvio un error.' },
      ]);
      const attempts = error.response?.data?.attempts;
      if (attempts && Array.isArray(attempts)) {
        const attemptLogs = attempts.map(
          (att) => `Fallo ${att.provider} (${att.model}): ${att.error}`
        );
        setProcessLog((current) => [
          ...current,
          `Simulación fallida en todos los modelos:`,
          ...attemptLogs,
        ]);
      } else {
        setProcessLog((current) => [
          ...current,
          `Simulación fallida: ${error.response?.data?.error || error.message}`,
        ]);
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#C9A96E]/30 pb-10">
      <header className="shrink-0 border-b border-[#1A1A1A] bg-[#0A0A0A] px-6 py-4 relative flex items-center justify-between">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
        <div className="flex items-center gap-3">
          <Flame size={16} className="text-[#C9A96E]" />
          <h1 className="font-serif text-2xl text-[#F5F5F5] tracking-tight">
            Ingenieria de captacion
          </h1>
          <span className="font-mono text-[9px] border border-[#2A2A2A] px-2 py-0.5 rounded-sm uppercase tracking-widest text-emerald-400 bg-emerald-400/10 ml-2">
            En Linea
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            cargarEstadisticasTokens();
            setShowStatsModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 border border-[#2A2A2A] hover:border-[#C9A96E]/50 bg-[#050505] hover:bg-[#C9A96E]/5 rounded-sm text-[#888] hover:text-[#F5F5F5] transition-all group active:scale-[0.98]"
        >
          <Coins size={14} className="text-[#C9A96E] group-hover:scale-110 transition-transform" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Consumo de Tokens</span>
        </button>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <Panel glow className="flex flex-col">
            <SectionTitle icon={TerminalSquare} eyebrow="Obligatorio" title="Instruccion del Sistema" />

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="mt-4 w-full min-h-[160px] resize-y rounded-sm border border-[#2A2A2A] bg-[#050505] p-4 font-mono text-[11px] leading-[1.6] text-[#A0A0A0] outline-none focus:border-[#C9A96E]/50 focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] scrollbar-thin scrollbar-thumb-[#1A1A1A]"
              placeholder="Define el comportamiento del agente... (Requerido)"
            />

            <div className="mt-3 flex gap-1.5 flex-wrap">
              {[
                ['Rol', promptScore >= 1],
                ['Contexto', promptScore >= 2],
                ['Limites', promptScore >= 3],
              ].map(([label, ok]) => (
                <div
                  key={String(label)}
                  className={`flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-widest ${
                    ok ? 'border-[#C9A96E]/30 text-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#2A2A2A] text-[#555] bg-[#050505]'
                  }`}
                >
                  <CheckCircle2 size={10} className={ok ? 'text-[#C9A96E]' : 'text-[#555]'} />
                  {label}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || processStatus === 'running'}
              className={`mt-5 w-full flex items-center justify-center gap-2 rounded-sm px-6 py-4 transition-all ${
                canSave && processStatus !== 'running'
                  ? 'bg-[#C9A96E] hover:bg-[#D4AF37] shadow-[0_0_20px_rgba(201,169,110,0.25)] text-black active:scale-[0.99]'
                  : 'bg-[#161616] border border-[#2A2A2A] text-[#555] cursor-not-allowed'
              }`}
            >
              {processStatus === 'running' ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.25em]">
                {processStatus === 'running' ? 'Actualizando...' : 'Guardar y Desplegar'}
              </span>
            </button>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel className="flex flex-col">
              <SectionTitle icon={BrainCircuit} eyebrow="Cadena IA" title="Orden de Modelos" />

              <div className="mt-4 flex flex-col gap-2">
                {llmChain.map((slot, index) => (
                  <div key={`${slot.provider}-${index}`} className="flex flex-col border border-[#1A1A1A] bg-[#050505] p-2.5 rounded-sm gap-1.5">
                    <div className="font-mono text-[8px] text-[#C9A96E] uppercase tracking-widest">
                      {index === 0 ? '1ro Principal' : index === 1 ? '2do Respaldo' : '3ro Ultimo recurso'}
                    </div>
                    <div className="flex gap-1.5">
                      <SelectField
                        value={slot.provider}
                        onChange={(value) => updateChain(index, 'provider', value)}
                        options={Object.entries(PROVIDERS).map(([id, provider]) => ({ label: provider.name, value: id }))}
                      />
                      <SelectField
                        value={slot.model}
                        onChange={(value) => updateChain(index, 'model', value)}
                        options={PROVIDERS[slot.provider].models.map((model) => ({ label: model, value: model }))}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-[#1A1A1A] pt-4">
                <SlidersHorizontal size={14} className="text-[#555]" />
                <div className="flex-1 flex items-center gap-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888]">Temp</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    className="flex-1 h-[3px] bg-[#1A1A1A] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#C9A96E] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-[#C9A96E] w-6 text-right">{temperature}%</span>
                </div>
              </div>
            </Panel>

            <Panel className="flex flex-col">
              <SectionTitle icon={UploadCloud} eyebrow="Opcional" title="Conocimiento RAG" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json,.xls,.xlsx,text/plain,text/markdown,application/json,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-sm border border-dashed border-[#2A2A2A] bg-[#050505] hover:bg-[#111] hover:border-[#C9A96E]/50 px-3 py-5 transition-colors group"
              >
                <Paperclip size={16} className="text-[#555] group-hover:text-[#C9A96E]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#888] group-hover:text-[#F5F5F5]">Subir 1 archivo TXT/Excel</span>
              </button>

              <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-[#1A1A1A] max-h-[160px]">
                {files.length === 0 ? (
                  <div className="rounded-sm border border-[#1A1A1A] bg-[#050505] p-4 font-mono text-[9px] uppercase tracking-widest text-[#555] text-center h-full flex items-center justify-center">
                    Maximo 1 archivo menor a 2 MB.
                  </div>
                ) : (
                  files.map((file) => (
                    <div key={file} className="flex justify-between items-center bg-[#050505] border border-[#1A1A1A] px-3 py-2 rounded-sm">
                      <span className="truncate font-mono text-[9px] text-[#888]">{file}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFiles([]);
                          setKnowledgeFile(null);
                        }}
                        className="font-mono text-[9px] text-red-400 hover:text-red-300 ml-2"
                      >
                        X
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </div>

        <div className="flex flex-col gap-6 h-full">
          <Panel glow className="flex flex-col h-[180px] shrink-0">
            <SectionTitle icon={Bot} eyebrow="Terminal" title="Estado del Agente" />
            <div className="mt-3 rounded-sm border border-[#1A1A1A] bg-[#050505] flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-[#1A1A1A] px-4 py-2 bg-[#0A0A0A] shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${processStatus === 'running' ? 'bg-[#C9A96E] animate-pulse' : processStatus === 'done' ? 'bg-emerald-400' : 'bg-[#555]'}`} />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#888]">
                    {processStatus === 'running' ? 'Procesando...' : processStatus === 'done' ? 'Actualizado' : 'Standby'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-[#1A1A1A]">
                {processLog.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="flex gap-2 animate-[fadeIn_0.3s_ease-out]">
                    <span className="font-mono text-[9px] text-[#555] shrink-0 mt-0.5">{'>'}</span>
                    <p className="font-mono text-[10px] text-[#A0A0A0] leading-[1.5]">{entry}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="flex h-[560px] min-h-0 flex-col sm:h-[620px] xl:h-[calc(100vh-270px)] xl:max-h-[700px]">
            <SectionTitle icon={Layers3} eyebrow="Playground" title="Simulador Publico" />
            <div className="mt-3 flex flex-col flex-1 rounded-sm border border-[#1A1A1A] bg-[#050505] min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#1A1A1A]" ref={chatScrollRef}>
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-sm ${message.role === 'user' ? 'bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E]' : 'bg-[#0A0A0A] border border-[#1A1A1A] text-[#888]'}`}>
                      <div className="font-mono text-[8.5px] uppercase tracking-widest mb-1.5 opacity-50">
                        {message.role === 'user' ? 'Usuario' : 'Agente FABRIC'}
                      </div>
                      <p className="font-sans text-[12px] leading-[1.5] whitespace-pre-wrap">{message.text}</p>
                      {message.usage && (
                        <div className="mt-2 pt-1.5 border-t border-[#1C1C1C] flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[8px] text-[#C9A96E] uppercase tracking-widest opacity-80">
                          <span>{message.usage.provider} ({message.usage.model})</span>
                          <span className="text-[#333]">•</span>
                          <span>Tokens: {message.usage.totalTokens} (P: {message.usage.promptTokens} / C: {message.usage.completionTokens})</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTesting && (
                  <div className="flex justify-start">
                    <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-4 py-3 rounded-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#C9A96E] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#C9A96E] rounded-full animate-bounce delay-150" />
                      <span className="w-1.5 h-1.5 bg-[#C9A96E] rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={runTest} className="border-t border-[#1A1A1A] p-3 flex gap-2 bg-[#0A0A0A] shrink-0">
                <input
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  disabled={isTesting || processStatus === 'running'}
                  className="flex-1 bg-[#050505] border border-[#2A2A2A] rounded-sm px-3 py-2.5 font-mono text-[11px] text-[#F5F5F5] outline-none focus:border-[#C9A96E]/50 disabled:opacity-50"
                  placeholder="Escribe para probar la simulacion..."
                />
                <button
                  type="submit"
                  disabled={isTesting || processStatus === 'running' || !testMessage.trim()}
                  className="px-4 bg-[#C9A96E] text-black rounded-sm disabled:bg-[#1A1A1A] disabled:text-[#555] transition-colors"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </Panel>
        </div>
      </main>

      {showStatsModal && createPortal(
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <article className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 sm:pb-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <Coins size={16} className="text-[#C9A96E] shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">Estadísticas de Uso</div>
                  <h2 className="font-serif text-lg sm:text-xl text-[#F5F5F5] truncate">Consumo de Tokens Acumulado</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-1 text-[#555] hover:text-[#F5F5F5] transition-colors rounded-sm hover:bg-[#111] shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 sm:space-y-6 pr-2 scrollbar-thin scrollbar-thumb-[#1A1A1A]">
              {isLoadingStats && !tokenStats ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RotateCcw size={24} className="animate-spin text-[#C9A96E] mb-3" />
                  <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">Cargando métricas...</span>
                </div>
              ) : tokenStats ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 text-[#C9A96E]/5 pointer-events-none hidden sm:block">
                        <Coins size={48} />
                      </div>
                      <span className="font-mono text-[8px] uppercase tracking-widest text-[#888] mb-1">Tokens Totales</span>
                      <span className="font-serif text-xl sm:text-2xl text-[#C9A96E] font-bold tracking-tight">
                        {tokenStats.summary.totalTokens.toLocaleString()}
                      </span>
                      <span className="font-mono text-[9px] text-[#555] mt-1">{tokenStats.summary.count.toLocaleString()} peticiones</span>
                    </div>

                    <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm flex flex-col">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-[#888] mb-1">Tokens de Entrada</span>
                      <span className="font-serif text-xl sm:text-2xl text-[#F5F5F5] font-bold tracking-tight">
                        {tokenStats.summary.totalPrompt.toLocaleString()}
                      </span>
                      <span className="font-mono text-[9px] text-[#555] mt-1">Prompts / Contexto</span>
                    </div>

                    <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm flex flex-col">
                      <span className="font-mono text-[8px] uppercase tracking-widest text-[#888] mb-1">Tokens de Salida</span>
                      <span className="font-serif text-xl sm:text-2xl text-[#F5F5F5] font-bold tracking-tight">
                        {tokenStats.summary.totalCompletion.toLocaleString()}
                      </span>
                      <span className="font-mono text-[9px] text-[#555] mt-1">Completions / Respuestas</span>
                    </div>
                  </div>

                  {/* Provider & Environment Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* By Provider */}
                    <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm">
                      <h3 className="font-serif text-sm text-[#F5F5F5] mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                        Por Proveedor
                      </h3>
                      <div className="space-y-3">
                        {tokenStats.byProvider.length === 0 ? (
                          <div className="text-center font-mono text-[10px] text-[#555] py-4 uppercase">Sin consumo registrado</div>
                        ) : (
                          tokenStats.byProvider.map((prov) => {
                            const pct = tokenStats.summary.totalTokens > 0
                              ? (prov.totalTokens / tokenStats.summary.totalTokens) * 100
                              : 0;
                            return (
                              <div key={prov._id} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="uppercase text-[#A0A0A0]">{prov._id}</span>
                                  <span className="text-[#F5F5F5] font-bold">{prov.totalTokens.toLocaleString()} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="h-[4px] bg-[#111] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#C9A96E]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono text-[#555]">
                                  <span>{prov.count} llamadas</span>
                                  <span>P: {prov.promptTokens.toLocaleString()} / C: {prov.completionTokens.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* By Environment */}
                    <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm">
                      <h3 className="font-serif text-sm text-[#F5F5F5] mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                        Por Entorno
                      </h3>
                      <div className="space-y-3">
                        {tokenStats.byType.length === 0 ? (
                          <div className="text-center font-mono text-[10px] text-[#555] py-4 uppercase">Sin consumo registrado</div>
                        ) : (
                          tokenStats.byType.map((t) => {
                            const pct = tokenStats.summary.totalTokens > 0
                              ? (t.totalTokens / tokenStats.summary.totalTokens) * 100
                              : 0;
                            return (
                              <div key={t._id} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="capitalize text-[#A0A0A0]">
                                    {t._id === 'test' ? 'Simulador (Admin)' : 'Público (Chat Web)'}
                                  </span>
                                  <span className="text-[#F5F5F5] font-bold">{t.totalTokens.toLocaleString()} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="h-[4px] bg-[#111] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${t._id === 'test' ? 'bg-[#A0A0A0]' : 'bg-[#C9A96E]'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono text-[#555]">
                                  <span>{t.count} llamadas</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Daily Usage Last 7 Days */}
                  <div className="border border-[#1A1A1A] bg-[#050505] p-3 sm:p-4 rounded-sm">
                    <h3 className="font-serif text-sm text-[#F5F5F5] mb-3 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                      Historial Diario (Últimos 7 días)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-mono text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1A1A1A] text-[#555]">
                            <th className="py-2 font-mono uppercase font-bold tracking-wider">Fecha</th>
                            <th className="py-2 font-mono uppercase font-bold tracking-wider text-right">Llamadas</th>
                            <th className="py-2 font-mono uppercase font-bold tracking-wider text-right hidden sm:table-cell">Prompt</th>
                            <th className="py-2 font-mono uppercase font-bold tracking-wider text-right hidden sm:table-cell">Completion</th>
                            <th className="py-2 font-mono uppercase font-bold tracking-wider text-right text-[#C9A96E] whitespace-nowrap">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#151515] text-[#A0A0A0]">
                          {tokenStats.dailyUsage.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-[#555] uppercase">Sin historial en los últimos 7 días</td>
                            </tr>
                          ) : (
                            tokenStats.dailyUsage.map((day) => (
                              <tr key={day._id} className="hover:bg-[#111]/30">
                                <td className="py-2">{day._id}</td>
                                <td className="py-2 text-right">{day.count}</td>
                                <td className="py-2 text-right hidden sm:table-cell">{day.promptTokens.toLocaleString()}</td>
                                <td className="py-2 text-right hidden sm:table-cell">{day.completionTokens.toLocaleString()}</td>
                                <td className="py-2 text-right text-[#C9A96E] font-bold">{day.totalTokens.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 font-mono text-[10px] text-[#555] uppercase">No se pudieron cargar las estadísticas</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#1A1A1A] pt-3 sm:pt-4 mt-4 sm:mt-6 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 border border-[#2A2A2A] hover:border-[#C9A96E]/50 bg-[#050505] hover:bg-[#C9A96E]/5 rounded-sm font-mono text-[10px] uppercase tracking-wider text-[#A0A0A0] hover:text-[#F5F5F5] transition-all"
              >
                Cerrar
              </button>
            </div>
          </article>
        </div>,
        document.body
      )}
    </div>
  );
}

function Panel({ children, glow = false, className = '' }: { children: ReactNode; glow?: boolean; className?: string }) {
  return (
    <article className={`relative rounded-sm border border-[#1A1A1A] bg-[#0A0A0A] p-5 shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-colors hover:border-[#2A2A2A] ${className}`}>
      {glow && <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/30 to-transparent" />}
      {children}
    </article>
  );
}

function SectionTitle({ eyebrow, title, icon: Icon }: { eyebrow: string; title: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] mb-1">{eyebrow}</div>
        <h2 className="font-serif text-[18px] text-[#F5F5F5]">{title}</h2>
      </div>
      <Icon size={16} className="text-[#444]" />
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-sm border border-[#2A2A2A] bg-[#050505] py-1.5 pl-2.5 pr-6 font-mono text-[9px] text-[#888] outline-none focus:border-[#C9A96E]/50 focus:text-[#F5F5F5] cursor-pointer truncate"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#555]" />
    </div>
  );
}
