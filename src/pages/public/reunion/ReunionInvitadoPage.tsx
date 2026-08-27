import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Volume2, VolumeX, 
  FileText, PhoneOff, Send, MessageSquare, Users, 
  ShieldCheck, ArrowLeft, Copy, CheckCircle2, Sparkles,
  Info, UserCheck, LogIn, LogOut, Check, Key, Lock, Monitor, Circle
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  role: 'host' | 'client' | 'system';
  text: string;
  time: string;
}

interface ActivityEvent {
  id: string;
  type: 'join' | 'leave' | 'system';
  name: string;
  role: string;
  time: string;
}

interface PeerParticipant {
  peerId: string;
  name: string;
  role: string;
  avatar: string;
  isLocal: boolean;
  isVideoOn: boolean;
  isAudioOn: boolean;
  color: string;
  isScreenSharing?: boolean;
  frameData?: string | null;
  screenFrameData?: string | null;
  stream?: MediaStream | null;
}

const PRESET_PROFILES = [
  { id: '1', name: 'Lic. Roberto Mendoza', role: 'CTO / Director de Tecnología', avatar: 'RM', color: '#C9A96E' },
  { id: '2', name: 'Ing. Sofía Valenzuela', role: 'Gerente de Infraestructura Cloud', avatar: 'SV', color: '#38BDF8' },
  { id: '3', name: 'Mtro. Carlos Benítez', role: 'Líder de Ciberseguridad & SOC', avatar: 'CB', color: '#4ADE80' },
  { id: '4', name: 'Dra. Elena Rostova', role: 'Arquitecto de Base de Datos Oracle', avatar: 'ER', color: '#F43F5E' },
  { id: '5', name: 'Lic. Miguel Ángel Torres', role: 'Operador de Finanzas & Conciliación', avatar: 'MT', color: '#A855F7' },
];

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

function VideoPlayer({ stream, isLocal }: { stream: MediaStream | null; isLocal?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`w-full h-full object-cover ${isLocal ? 'transform -scale-x-100' : ''}`}
    />
  );
}

export default function ReunionInvitadoPage() {
  const navigate = useNavigate();
  const { roomId: urlParamRoomId } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();

  // ID de la Sala
  const [inputRoomId, setInputRoomId] = useState<string>(() => {
    return (urlParamRoomId || searchParams.get('room') || 'MEET-8821').toUpperCase();
  });
  const [roomId, setRoomId] = useState<string>(() => {
    return (urlParamRoomId || searchParams.get('room') || 'MEET-8821').toUpperCase();
  });

  useEffect(() => {
    if (urlParamRoomId) {
      const clean = urlParamRoomId.toUpperCase();
      setInputRoomId(clean);
      setRoomId(clean);
    }
  }, [urlParamRoomId]);

  // Peer ID único para esta pestaña
  const [localPeerId] = useState<string>(() => `guest_${Math.random().toString(36).substring(2, 8)}`);

  // Paso de Identificación y Verificación de PIN
  const [isIdentified, setIsIdentified] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Información del cliente agendado desde MongoDB
  const [registeredClientInfo, setRegisteredClientInfo] = useState<{
    nombre: string;
    cargo: string;
    empresa: string;
  }>({
    nombre: 'Cargando cliente...',
    cargo: 'Ejecutivo',
    empresa: ''
  });

  // Cargar automáticamente el nombre completo del cliente asignado a este enlace
  useEffect(() => {
    const targetRoom = (urlParamRoomId || inputRoomId || 'MEET-8821').toUpperCase();
    const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:4000' : '';
    fetch(`${API_BASE}/api/office-hours/room-info?roomId=${encodeURIComponent(targetRoom)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.nombre) {
          setRegisteredClientInfo({
            nombre: data.nombre,
            cargo: data.cargo || 'Ejecutivo',
            empresa: data.empresa || ''
          });
          setGuestNameInput(data.nombre);
        }
      })
      .catch(() => {
        setRegisteredClientInfo({
          nombre: 'Cliente Registrado',
          cargo: 'Ejecutivo',
          empresa: ''
        });
      });
  }, [urlParamRoomId, inputRoomId]);

  // Identidad confirmada del usuario
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  // Estados de control local
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [volume, setVolume] = useState(85);
  const [isMutedVolume, setIsMutedVolume] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');

  // Reloj de la sesión
  const [callDuration, setCallDuration] = useState(0);

  // ── ESTADOS Y FUNCIONES DE COMPARTIR PANTALLA ──
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = screenStream;
      setLocalStream(screenStream);
      setIsScreenSharing(true);

      if (screenStream.getVideoTracks()[0]) {
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      }
    } catch (err) {
      console.warn('Compartir pantalla cancelado por el invitado:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((camStream) => setLocalStream(camStream))
      .catch(() => {});
  };

  const screenFrameRef = useRef<string | null>(null);
  const [remoteScreenFrame, setRemoteScreenFrame] = useState<string | null>(null);

  // Captura periódica de cuadros de pantalla si el invitado comparte pantalla
  useEffect(() => {
    if (!isScreenSharing || !screenStreamRef.current) {
      screenFrameRef.current = null;
      return;
    }

    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = true;
    videoEl.srcObject = screenStreamRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      if (ctx && videoEl.readyState >= 2) {
        try {
          ctx.drawImage(videoEl, 0, 0, 960, 540);
          screenFrameRef.current = canvas.toDataURL('image/jpeg', 0.45);
        } catch {}
      }
    }, 100);

    return () => {
      clearInterval(interval);
      videoEl.srcObject = null;
    };
  }, [isScreenSharing]);

  // Stream de video local y remoto
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Captura de frames base64 para streaming respaldado por servidor
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const localFrameRef = useRef<string | null>(null);
  const [remotePeerFrames, setRemotePeerFrames] = useState<Record<string, string>>({});

  // Referencia PeerConnection para WebRTC nativo P2P
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const processedSignalIds = useRef<Set<string>>(new Set());

  // Lista de participantes remotos del servidor
  const [remotePeers, setRemotePeers] = useState<PeerParticipant[]>([]);

  // Historial de eventos de entrada y salida
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Timer de duración
  useEffect(() => {
    if (!isIdentified) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isIdentified]);

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── VERIFICAR Y CONFIRMAR PIN E IDENTIDAD ──
  const handleConfirmIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const cleanRoom = (inputRoomId.trim() || urlParamRoomId || 'FABRIC-MEET-8821').toUpperCase();
    const cleanPin = pinInput.trim();
    const cleanName = guestNameInput.trim();

    if (!cleanName) {
      setPinError('Por favor ingresa tu nombre completo registrado.');
      return;
    }

    if (!cleanPin) {
      setPinError('Por favor ingresa el PIN de acceso asignado a tu reunión.');
      return;
    }

    setVerifyingPin(true);

    try {
      const res = await fetch(`${API_BASE}/api/office-hours/verify-pin?roomId=${encodeURIComponent(cleanRoom)}&pin=${encodeURIComponent(cleanPin)}`);
      const data = await res.json();

      if (res.ok && data.success && data.valid) {
        const finalName = cleanName || data.nombre || 'Cliente Invitado';
        const finalRole = data.cargo || 'Invitado Confirmado';
        const avatar = finalName.slice(0, 2).toUpperCase();

        setRoomId(cleanRoom);
        setUserName(finalName);
        setUserRole(finalRole);
        setUserAvatar(avatar);
        setIsIdentified(true);
      } else {
        setPinError(data.error || 'PIN o contraseña de acceso incorrecta. Verifica el código único de esta sala.');
      }
    } catch {
      setPinError('Error de conexión al verificar la contraseña de la sala.');
    } finally {
      setVerifyingPin(false);
    }
  };

  // ── 1. INICIALIZAR CÁMARA LOCAL TRAS IDENTIFICACIÓN ──
  useEffect(() => {
    if (!isIdentified) return;

    let isMounted = true;

    async function initMedia() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true,
        });

        if (!isMounted) return;

        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Webcam real no disponible o denegada:', err);
      }
    }

    if (cameraActive) {
      initMedia();
    } else {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
      }
      localFrameRef.current = null;
    }

    return () => {
      isMounted = false;
    };
  }, [isIdentified, cameraActive]);

  // Asignar stream al video oculto de captura
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Alternar audio y video en localStream
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = cameraActive));
      localStream.getAudioTracks().forEach((t) => (t.enabled = micActive));
    }
  }, [cameraActive, micActive, localStream]);

  // Captura periódica de frames para streaming de respaldo
  useEffect(() => {
    if (!isIdentified || !cameraActive || !localStream) return;

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    hiddenCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    const frameInterval = setInterval(() => {
      if (localVideoRef.current && ctx && localVideoRef.current.readyState >= 2) {
        try {
          ctx.drawImage(localVideoRef.current, 0, 0, 320, 240);
          localFrameRef.current = canvas.toDataURL('image/jpeg', 0.35);
        } catch {}
      }
    }, 120);

    return () => clearInterval(frameInterval);
  }, [isIdentified, cameraActive, localStream]);

  // ── 2. WEBRTC P2P SIGNALING CON SEÑALIZACIÓN CONTINUA ──
  useEffect(() => {
    if (!isIdentified) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try { pc.addTrack(track, localStream); } catch {}
        });
      }

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`${API_BASE}/api/room/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              from: localPeerId,
              to: 'all',
              signal: { type: 'candidate', candidate: event.candidate },
            }),
          }).catch(() => {});
        }
      };

      const signalInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/room/signal?roomId=${roomId}&peerId=${localPeerId}`);
          if (!res.ok) return;
          const data = await res.json();
          
          if (data.signals) {
            for (const item of data.signals) {
              const sigId = `${item.from}_${JSON.stringify(item.signal).slice(0, 30)}`;
              if (processedSignalIds.current.has(sigId)) continue;
              processedSignalIds.current.add(sigId);

              const { signal } = item;
              if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await fetch(`${API_BASE}/api/room/signal`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roomId,
                    from: localPeerId,
                    to: item.from,
                    signal: { type: 'answer', sdp: answer },
                  }),
                });
              } else if (signal.type === 'answer') {
                if (pc.signalingState !== 'stable') {
                  await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                }
              } else if (signal.type === 'candidate') {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch {}
              }
            }
          }
        } catch {}
      }, 800);

      return () => {
        clearInterval(signalInterval);
        try { pc.close(); } catch {}
        pcRef.current = null;
      };
    } catch (err) {
      console.warn('WebRTC peer connection non-fatal setup warning:', err);
    }
  }, [isIdentified, localStream, roomId, localPeerId]);

  // ── 3. SINCRONIZACIÓN DE RED CON EL BACKEND EXPRESS (/api/room/sync) ──
  useEffect(() => {
    if (!isIdentified) return;

    let isMounted = true;

    async function syncWithServer() {
      try {
        const res = await fetch(`${API_BASE}/api/room/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            peerId: localPeerId,
            name: userName,
            role: userRole,
            isVideoOn: cameraActive,
            isAudioOn: micActive,
            isScreenSharing,
            frameData: cameraActive ? localFrameRef.current : null,
            screenFrameData: isScreenSharing ? screenFrameRef.current : null,
          }),
        });

        if (!res.ok || !isMounted) return;

        const data = await res.json();
        if (data.peers) {
          const remotes: PeerParticipant[] = data.peers
            .filter((p: any) => p.peerId !== localPeerId)
            .map((p: any) => ({
              peerId: p.peerId,
              name: p.name,
              role: p.role,
              avatar: (p.name || 'IN').slice(0, 2).toUpperCase(),
              isLocal: false,
              isVideoOn: p.isVideoOn,
              isAudioOn: p.isAudioOn,
              isScreenSharing: p.isScreenSharing,
              frameData: p.frameData || null,
              screenFrameData: p.screenFrameData || null,
              color: '#38BDF8',
            }));
          
          setRemotePeers(remotes);

          const screenSharingPeer = remotes.find((r) => r.isScreenSharing || r.screenFrameData);
          if (screenSharingPeer && screenSharingPeer.screenFrameData) {
            setRemoteScreenFrame(screenSharingPeer.screenFrameData);
          } else {
            setRemoteScreenFrame(null);
          }

          const newFrames: Record<string, string> = {};
          remotes.forEach((r) => {
            if (r.frameData) {
              newFrames[r.peerId] = r.frameData;
            }
          });
          if (Object.keys(newFrames).length > 0) {
            setRemotePeerFrames((prev) => ({ ...prev, ...newFrames }));
          }
        }

        if (data.messages && data.messages.length > 0) setChatMessages(data.messages);
        if (data.activityLogs && data.activityLogs.length > 0) setActivityLogs(data.activityLogs);
      } catch (err) {
        console.warn('Error syncing guest room:', err);
      }
    }

    syncWithServer();
    const interval = setInterval(syncWithServer, 1000);

    const handleUnload = () => {
      navigator.sendBeacon(`${API_BASE}/api/room/leave`, JSON.stringify({ roomId, peerId: localPeerId }));
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isIdentified, roomId, localPeerId, userName, userRole, cameraActive, micActive]);

  // Scroll automático en el chat y auditoría
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activityLogs]);

  // Enviar mensaje en el chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      await fetch(`${API_BASE}/api/room/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          sender: userName,
          role: 'client',
          text: textToSend,
        }),
      });
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  const handleCopyLink = () => {
    try {
      const shareUrl = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  const handleLeaveCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    try {
      await fetch(`${API_BASE}/api/room/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, peerId: localPeerId }),
      });
    } catch {}
    navigate('/');
  };

  // SIEMPRE INCLUIMOS AL INVITADO LOCAL + HASTA 4 REMOTOS (LÍDER U OTROS INVITADOS)
  const allActiveParticipants: PeerParticipant[] = [
    {
      peerId: localPeerId,
      name: userName,
      role: userRole,
      avatar: userAvatar,
      isLocal: true,
      isVideoOn: cameraActive,
      isAudioOn: micActive,
      color: '#C9A96E',
      stream: localStream,
    },
    ...remotePeers.map((p, idx) => ({
      ...p,
      stream: idx === 0 ? remoteStream : null,
    })),
  ].slice(0, 5);

  const visibleParticipants = allActiveParticipants;

  // Cálculo de clases CSS para la cuadrícula de hasta 5 cámaras
  const getGridClasses = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1 grid-rows-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2 grid-rows-1';
      case 3:
        return 'grid-cols-1 md:grid-cols-3 grid-rows-1';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      case 5:
      default:
        return 'grid-cols-2 md:grid-cols-3 grid-rows-2';
    }
  };

  // ── SI EL USUARIO NO SE HA IDENTIFICADO: MOSTRAR MODAL CHECK-IN ──
  if (!isIdentified) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-y-auto">
        <div className="w-full max-w-xl bg-[#060D1A]/95 border border-[#1E3A5F] rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl space-y-6">
          
          {/* Header del Modal */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#081528] border-2 border-[#C9A96E] flex items-center justify-center text-[#C9A96E] mx-auto shadow-lg">
              <UserCheck size={32} />
            </div>
            <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
              Ingreso Seguro de Invitado
            </h2>
            <p className="font-mono text-xs text-[#94A3B8] max-w-md mx-auto">
              Ingresa tu nombre completo registrado y el PIN de acceso provisto para validar tu sesión.
            </p>
          </div>

          <form onSubmit={handleConfirmIdentity} className="space-y-5">
            
            {/* Input ID de la Sala (Fijo y Protegido - No Modificable) */}
            <div className="space-y-1.5 bg-[#081528] p-4 rounded-2xl border border-[#1E3A5F]">
              <label className="block font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key size={14} /> ID de la Sala:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">🔒 Protegido</span>
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={inputRoomId || urlParamRoomId || 'MEET-8821'}
                className="w-full bg-[#030712]/70 border border-[#1E3A5F] text-[#C9A96E] font-mono font-bold text-sm px-4 py-2.5 rounded-xl outline-none tracking-widest text-center cursor-not-allowed opacity-85 select-none"
              />
            </div>

            {/* Nombre Completo Registrado (Traído de la Base de Datos) */}
            <div className="bg-[#081528] p-4.5 rounded-2xl border border-[#C9A96E]/40 text-center space-y-1 shadow-inner">
              <span className="text-[#C9A96E] font-mono text-[10px] font-bold uppercase tracking-widest block flex items-center justify-center gap-1.5">
                <UserCheck size={13} /> Cliente Registrado de la Reunión
              </span>
              <h3 className="font-serif font-bold text-xl text-white tracking-tight">
                {registeredClientInfo.nombre || guestNameInput || 'Cliente Agendado Corporativo'}
              </h3>
              {registeredClientInfo.cargo && (
                <p className="font-mono text-xs text-[#94A3B8]">
                  {registeredClientInfo.cargo} {registeredClientInfo.empresa ? `· ${registeredClientInfo.empresa}` : ''}
                </p>
              )}
            </div>

            {/* Input PIN de Acceso */}
            <div className="space-y-1.5 bg-[#081528] p-4 rounded-2xl border border-[#1E3A5F]">
              <label className="block font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} /> PIN de Acceso a la Reunión:
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.toUpperCase());
                  setPinError('');
                }}
                placeholder="Ingresa la Contraseña de la Sala (ej. 8K2P9X)"
                className="w-full bg-[#030712] border border-[#1E3A5F] text-[#C9A96E] font-mono font-bold text-center text-lg px-4 py-3 rounded-xl outline-none focus:border-[#C9A96E] transition tracking-[0.2em] uppercase"
              />
            </div>

            {pinError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs text-center">
                {pinError}
              </div>
            )}

            {/* Botón de ingreso */}
            <button
              type="submit"
              disabled={verifyingPin}
              className="w-full py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#e2c799] text-[#030712] font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>{verifyingPin ? 'Verificando PIN...' : `Unirse a la Sala [${inputRoomId || 'MEET-8821'}]`}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── SINTESIS DE SALA ACTIVA TRAS IDENTIFICACIÓN ──
  return (
    <div className="h-screen bg-[#030712] text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* Elemento de video oculto usado para captura de frames de respaldo */}
      <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />

      {/* ── BARRA SUPERIOR (HEADER) ── */}
      <header className="h-16 bg-[#060D1A] border-b border-[#1E3A5F]/70 px-6 flex items-center justify-between shrink-0 backdrop-blur-xl relative z-30 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLeaveCall}
            className="p-2 rounded-xl bg-[#09182E] border border-[#1E3A5F] text-[#94A3B8] hover:text-[#C9A96E] hover:border-[#C9A96E]/50 transition-all cursor-pointer"
            title="Salir de la Sala"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                VERIFICADO
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#94A3B8] hidden sm:block">
              Sala: <span className="text-[#C9A96E] font-bold">{roomId}</span> | Identidad: <span className="text-white">{userName}</span> ({userRole})
            </p>
          </div>
        </div>

        {/* Info central / Reloj */}
        <div className="hidden md:flex items-center gap-3 bg-[#081528] border border-[#1E3A5F] px-5 py-2 rounded-full font-mono text-xs shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
          <span className="text-[#94A3B8] uppercase tracking-wider text-[10px]">Tiempo en Sala:</span>
          <span className="font-bold text-[#C9A96E] tracking-widest text-sm">{formatDuration(callDuration)}</span>
        </div>

        {/* Acciones de la sala */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#09182E] border border-[#1E3A5F] hover:border-[#C9A96E] text-[#94A3B8] hover:text-white font-mono text-xs transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={15} className="text-[#C9A96E]" />
                <span>Copiar Enlace ({roomId})</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 bg-[#081528] border border-[#1E3A5F] px-3.5 py-2 rounded-xl font-mono text-[11px] text-[#94A3B8]">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="hidden lg:inline">Cámara HD Multi-Red</span>
          </div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL: VIDEO (IZQ) + CHAT/REGISTRO AUDITORÍA (DER) ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-4 pb-16 overflow-hidden relative max-h-[calc(100vh-85px)]">
        
        {/* 👈 IZQUIERDA: ESCENARIO PRINCIPAL DE VIDEO (MÁS COMPACTO Y ESTILIZADO) */}
        <div className="lg:col-span-8 h-full flex flex-col justify-center items-center relative overflow-hidden max-h-[72vh]">
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,95,0.25),transparent_70%)] pointer-events-none" />

          {(isScreenSharing || remoteScreenFrame || remotePeers.some((p) => p.isScreenSharing || p.screenFrameData)) ? (
            /* 🖥️ MODO PANTALLA COMPARTIDA */
            <div className="w-full h-full flex flex-col gap-2.5 relative z-10">
              
              {/* CUADRO PRINCIPAL EN GRANDE DE PANTALLA COMPARTIDA */}
              <div className="flex-1 bg-[#060E1B] border border-emerald-500/50 rounded-2xl overflow-hidden relative shadow-[0_0_35px_rgba(16,185,129,0.2)] flex items-center justify-center min-h-[260px]">
                {screenStreamRef.current ? (
                  <VideoPlayer stream={screenStreamRef.current} isLocal={false} />
                ) : remoteStream ? (
                  <VideoPlayer stream={remoteStream} isLocal={false} />
                ) : remoteScreenFrame ? (
                  <img src={remoteScreenFrame} alt="Pantalla Compartida" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <p className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                      Sintonizando Transmisión de Pantalla...
                    </p>
                  </div>
                )}

                {/* Badge Superior Transmitiendo Pantalla */}
                <div className="absolute top-3 left-3 bg-[#030712]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/50 flex items-center gap-2 shadow-xl z-20 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Monitor size={14} />
                  <span>TRANSMITIENDO PANTALLA</span>
                </div>
              </div>

              {/* TIRA INFERIOR DE CÁMARAS EN CHIQUITO (THUMBNAILS) */}
              <div className="h-24 bg-[#081528] border border-[#1E3A5F] rounded-xl p-1.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-md select-none">
                {visibleParticipants.map((p) => (
                  <div
                    key={p.peerId}
                    className="w-36 h-full rounded-lg bg-[#030712] border border-[#1E3A5F] relative overflow-hidden shrink-0 flex flex-col items-center justify-center shadow-sm"
                  >
                    {p.isVideoOn ? (
                      p.stream ? (
                        <VideoPlayer stream={p.stream} isLocal={p.isLocal} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0E2747] border border-[#C9A96E] text-white font-serif font-bold text-xs flex items-center justify-center shadow-sm">
                          {p.avatar}
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <VideoOff size={15} className="text-rose-400" />
                        <span className="font-mono text-[8px] text-slate-400">Pausa</span>
                      </div>
                    )}

                    {/* Mini Badge Nombre */}
                    <div className="absolute bottom-1 left-1 bg-[#030712]/90 px-1.5 py-0.5 rounded border border-[#1E3A5F] text-[8px] font-mono text-slate-200 font-bold truncate max-w-[120px] shadow-sm">
                      {p.name} {p.isLocal ? '(Tú)' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 🎥 MODO CUADRÍCULA MULTI-CÁMARA ESTÁNDAR */
            <div className={`w-full h-full rounded-2xl bg-[#060E1B] border border-[#1E3A5F]/80 shadow-[0_15px_45px_rgba(0,0,0,0.8)] p-2.5 md:p-3 grid gap-2.5 ${getGridClasses(visibleParticipants.length)} pointer-events-none select-none relative overflow-hidden`}>
              {visibleParticipants.map((p, index) => {
                const remoteFrame = p.isLocal ? null : (remotePeerFrames[p.peerId] || null);

                return (
                  <div
                    key={p.peerId || `peer-${index}`}
                    className="w-full h-full rounded-xl bg-[#081628] border border-[#1E3A5F]/80 shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[170px] md:min-h-[200px]"
                  >
                    {/* SI TIENE CÁMARA ENCENDIDA */}
                    {p.isVideoOn ? (
                      p.stream ? (
                        <VideoPlayer stream={p.stream} isLocal={p.isLocal} />
                      ) : remoteFrame ? (
                        <img src={remoteFrame} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#0A1A30] via-[#071325] to-[#040A14] overflow-hidden p-4">
                          <div className="absolute w-28 h-28 rounded-full border border-[#C9A96E]/20 animate-ping pointer-events-none" />
                          <div className="absolute w-22 h-22 rounded-full border border-[#38BDF8]/30 animate-pulse pointer-events-none" />

                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#C9A96E] bg-[#0E2747] flex items-center justify-center text-white font-serif font-bold text-xl md:text-2xl shadow-xl relative z-10">
                            {p.avatar}
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5 bg-[#030712]/80 backdrop-blur-md border border-emerald-500/40 px-2.5 py-0.5 rounded-full relative z-10 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                              HD 1080p
                            </span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-[#050B14] w-full h-full">
                        <div className="w-14 h-14 rounded-full bg-[#081628] border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-sm">
                          <VideoOff size={24} />
                        </div>
                        <div>
                          <p className="font-serif font-bold text-xs text-white">{p.name}</p>
                          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5">En Pausa</span>
                        </div>
                      </div>
                    )}

                    {/* Badge Overlay Superior Izquierdo */}
                    <div className="absolute top-2.5 left-2.5 bg-[#030712]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E3A5F] flex items-center gap-1.5 shadow-md z-20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-[10px] font-bold text-white tracking-wider">
                        {p.name} {p.isLocal ? '(Tú)' : ''}
                      </span>
                    </div>

                    {/* Badge Overlay Inferior Izquierdo */}
                    <div className="absolute bottom-2.5 left-2.5 bg-[#030712]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E3A5F] shadow-md z-20">
                      <p className="font-mono text-[9px] text-[#C9A96E] uppercase tracking-wider font-semibold">
                        {p.role}
                      </p>
                    </div>

                    {/* Badge Overlay Inferior Derecho (Micrófono) */}
                    <div className="absolute bottom-2.5 right-2.5 bg-[#030712]/90 backdrop-blur-md p-1.5 rounded-lg border border-[#1E3A5F] shadow-md z-20">
                      {p.isAudioOn ? (
                        <Mic size={13} className="text-emerald-400" />
                      ) : (
                        <MicOff size={13} className="text-rose-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 👉 DERECHA: PANEL DE CHAT Y REGISTRO DE AUDITORÍA (COMPACTO) */}
        <div className="lg:col-span-4 h-full overflow-hidden max-h-[72vh]">
          <div className="bg-[#060D1A]/95 border border-[#1E3A5F]/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl backdrop-blur-xl">
            
            {/* Pestañas Chat y Participantes (Solo estas 2 para el invitado) */}
            <div className="p-1.5 bg-[#081528] border-b border-[#1E3A5F]/70 grid grid-cols-2 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-1.5 px-2 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                    : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                }`}
              >
                <MessageSquare size={12} />
                <span>Chat ({chatMessages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className={`py-1.5 px-2 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'participants'
                    ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                    : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                }`}
              >
                <Users size={12} />
                <span>Participantes ({visibleParticipants.length})</span>
              </button>
            </div>

            {/* CONTENIDO PESTAÑA: CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans">
                  {chatMessages.map((msg) => {
                    const isSystem = msg.role === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="p-3 rounded-2xl bg-[#081528]/80 border border-[#1E3A5F]/50 text-center">
                          <p className="font-mono text-[11px] text-[#C9A96E] leading-relaxed flex items-center justify-center gap-1.5 font-semibold">
                            <Info size={13} /> {msg.text}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className="flex flex-col items-start"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-[#94A3B8]">{msg.sender}</span>
                          <span className="font-mono text-[10px] text-slate-500">{msg.time}</span>
                        </div>

                        <div className="p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed bg-[#081528] text-slate-200 border border-[#1E3A5F]/80 rounded-tl-none shadow-md">
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-[#081528] border-t border-[#1E3A5F]/70 flex items-center gap-2.5 shrink-0">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-[#030712] border border-[#1E3A5F] text-white px-4 py-3 rounded-2xl outline-none focus:border-[#C9A96E] font-sans text-xs placeholder-slate-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-3 rounded-2xl bg-[#C9A96E] hover:bg-[#e2c799] text-[#030712] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: PARTICIPANTES ACTIVOS */}
            {activeTab === 'participants' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} /> Participantes Activos ({visibleParticipants.length})
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> En vivo
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 bg-[#030712] p-3 rounded-xl border border-[#1E3A5F]/70">
                  {visibleParticipants.map((p) => (
                    <div 
                      key={p.peerId}
                      className="p-2.5 rounded-xl bg-[#081528] border border-[#1E3A5F]/80 flex items-center justify-between transition hover:border-[#C9A96E]/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-[#0E2747] border border-[#C9A96E] flex items-center justify-center text-white font-serif font-bold text-xs shadow-md">
                            {p.avatar}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#030712]" />
                        </div>
                        <div>
                          <p className="font-serif font-bold text-xs text-white flex items-center gap-1.5">
                            {p.name} {p.isLocal ? <span className="font-mono text-[9px] text-[#C9A96E] font-normal">(Tú)</span> : ''}
                          </p>
                          <p className="font-mono text-[9px] text-slate-400">{p.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {p.isVideoOn ? (
                          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Cámara Encendida">
                            <Video size={12} />
                          </span>
                        ) : (
                          <span className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Cámara Apagada">
                            <VideoOff size={12} />
                          </span>
                        )}

                        {p.isAudioOn ? (
                          <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Micrófono Encendido">
                            <Mic size={12} />
                          </span>
                        ) : (
                          <span className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30" title="Micrófono Apagado">
                            <MicOff size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── BARRA DE CONTROLES INFERIOR (90% ANCHO SLIM & ALARGADO APPLE IPHONE LIQUID GLASS DOCK) ── */}
      <footer className="fixed bottom-3 left-0 right-0 z-50 px-2 md:px-4 pointer-events-none">
        <div className="w-[92%] max-w-[95%] mx-auto pointer-events-auto bg-[#071325]/50 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-between gap-2 transition-all duration-300 relative overflow-hidden">
          
          {/* Top Specular Light Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

          {/* Lado Izquierdo: Info de participantes */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-[#C9A96E]">
              <Users size={14} />
            </div>
            <div>
              <p className="font-bold text-[11px] text-white tracking-wide flex items-center gap-1 font-mono">
                {visibleParticipants.length} P. <span className="text-[#C9A96E] text-[10px]">[{roomId}]</span>
              </p>
            </div>
          </div>

          {/* Centro: BOTONES PRINCIPALES DE CONTROL CON ICONOS Y TEXTOS REFINADOS */}
          <div className="flex items-center justify-center gap-1 md:gap-1.5 mx-auto lg:mx-0">
            
            {/* 1. BOTÓN CÁMARA */}
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${
                cameraActive
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                  : 'bg-rose-500/30 border-rose-500/60 text-rose-200 backdrop-blur-md'
              }`}
              title={cameraActive ? 'Desactivar Cámara' : 'Activar Cámara'}
            >
              {cameraActive ? <Video size={13} className="text-[#C9A96E]" /> : <VideoOff size={13} />}
              <span className="hidden md:inline">{cameraActive ? 'Cámara' : 'Cámara Off'}</span>
            </button>

            {/* 2. BOTÓN MICRÓFONO */}
            <button
              onClick={() => setMicActive(!micActive)}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${
                micActive
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md'
                  : 'bg-rose-500/30 border-rose-500/60 text-rose-200 backdrop-blur-md'
              }`}
              title={micActive ? 'Desactivar Micrófono' : 'Activar Micrófono'}
            >
              {micActive ? <Mic size={13} className="text-[#C9A96E]" /> : <MicOff size={13} />}
              <span className="hidden md:inline">{micActive ? 'Micrófono' : 'Mic Off'}</span>
            </button>

            {/* 2.5 BOTÓN COMPARTIR PANTALLA */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${
                isScreenSharing
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 border-emerald-400 text-white animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 backdrop-blur-md'
              }`}
              title={isScreenSharing ? 'Detener Compartir Pantalla' : 'Compartir Pantalla'}
            >
              <Monitor size={13} className={isScreenSharing ? 'text-white' : 'text-[#38BDF8]'} />
              <span className="hidden md:inline">{isScreenSharing ? 'Compartiendo' : 'Pantalla'}</span>
            </button>

            {/* 3. BOTÓN Y SLIDER DE VOLUMEN */}
            <div className="flex items-center gap-1 bg-black/40 border border-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <button
                onClick={() => setIsMutedVolume(!isMutedVolume)}
                className="text-[#C9A96E] hover:text-white transition cursor-pointer"
                title="Ajustar Volumen"
              >
                {isMutedVolume || volume === 0 ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} />}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={isMutedVolume ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMutedVolume) setIsMutedVolume(false);
                }}
                className="w-10 md:w-16 accent-[#C9A96E] cursor-pointer h-1 bg-white/20 rounded-lg"
              />
            </div>

            {/* 4. BOTÓN SALIR DE LA SALA */}
            <button
              onClick={handleLeaveCall}
              className="py-1 px-3 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 border border-rose-400/40 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              title="Salir de la sala"
            >
              <PhoneOff size={13} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>

          {/* Lado Derecho: Estado de Conexión */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] text-slate-300/90 bg-white/5 border border-white/15 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Servidor Invitados Activo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
