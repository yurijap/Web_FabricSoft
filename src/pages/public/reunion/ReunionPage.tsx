import React, { useState, useEffect, useRef } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Volume2, VolumeX,
  FileText, PhoneOff, Send, MessageSquare, Users,
  ShieldCheck, ArrowLeft, Copy, CheckCircle2, Sparkles,
  Info, LogIn, LogOut, Circle, Monitor, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, LayoutGrid, Trash2,
  Power
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

interface TranscriptItem {
  id: string;
  speaker: string;
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

const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname, port } = window.location;
  if (port === '5173' || port === '3000' || port === '4173') {
    return ''; // Usa el proxy de Vite en lugar de ir directo
  }
  return window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
};

const API_BASE = getApiBase();

function VideoPlayer({
  stream,
  isLocal,
  isScreenShare,
}: {
  stream: MediaStream | null;
  isLocal?: boolean;
  isScreenShare?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    const playVideo = () => {
      if (el && el.srcObject) {
        el.play().catch(() => { });
      }
    };
    playVideo();

    el.addEventListener('loadedmetadata', playVideo);
    el.addEventListener('canplay', playVideo);

    stream.getVideoTracks().forEach((track) => {
      track.onunmute = playVideo;
    });

    return () => {
      el.removeEventListener('loadedmetadata', playVideo);
      el.removeEventListener('canplay', playVideo);
      stream.getVideoTracks().forEach((track) => {
        if (track.onunmute === playVideo) track.onunmute = null;
      });
    };
  }, [stream]);

  if (!stream) return null;

  const shouldMirror = isLocal && !isScreenShare;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={true}
      disablePictureInPicture
      className={`w-full h-full object-cover ${shouldMirror ? 'transform -scale-x-100' : ''}`}
    />
  );
}

function RemoteAudio({
  stream,
  volume,
  muted,
}: {
  stream: MediaStream | null;
  volume: number;
  muted: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !stream) return;

    // El audio remoto SIEMPRE sale por este elemento dedicado.
    // El <video> está muteado para evitar doble reproducción.
    el.autoplay = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.srcObject = stream;
    el.volume = muted ? 0 : Math.max(0, Math.min(1, volume / 100));
    el.muted = muted;

    const tryPlay = () => {
      if (el.muted || el.volume === 0) return;
      void el.play().catch(() => {
        // Chrome/Edge/Safari pueden bloquear autoplay hasta una interacción.
      });
    };

    // Los tracks remotos pueden llegar después de montar el <audio>.
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
      track.onunmute = tryPlay;
    });

    el.addEventListener('loadedmetadata', tryPlay);
    el.addEventListener('canplay', tryPlay);
    el.addEventListener('canplaythrough', tryPlay);

    // Intento inmediato y otro al siguiente ciclo del navegador.
    tryPlay();
    const timer = window.setTimeout(tryPlay, 100);

    const unlockAudio = () => {
      tryPlay();
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      el.removeEventListener('loadedmetadata', tryPlay);
      el.removeEventListener('canplay', tryPlay);
      el.removeEventListener('canplaythrough', tryPlay);
      stream.getAudioTracks().forEach((track) => {
        if (track.onunmute === tryPlay) track.onunmute = null;
      });
      el.pause();
      el.srcObject = null;
    };
  }, [stream, volume, muted]);

  return (
    <audio
      ref={audioRef}
      data-remote-audio="true"
      autoPlay
      playsInline
      aria-hidden="true"
    />
  );
}

export default function ReunionPage() {
  const navigate = useNavigate();
  const { roomId: urlParamRoomId } = useParams<{ roomId?: string }>();
  const [searchParams] = useSearchParams();

  // ID de la Sala
  const [roomId] = useState<string>(() => {
    return (urlParamRoomId || searchParams.get('room') || 'FABRIC-MEET-8821').toUpperCase();
  });

  const [localName, setLocalName] = useState<string>('Anfitrión de la Sala');
  const localRole = 'Anfitrión de la Sala';
  const [localPeerId] = useState<string>(() => {
    const existing = sessionStorage.getItem('fabric_meet_leader_peer_id');
    if (existing) return existing;
    const newId = `leader_${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem('fabric_meet_leader_peer_id', newId);
    return newId;
  });

  // Estados de control local
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [volume, setVolume] = useState(85);
  const [isMutedVolume, setIsMutedVolume] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('Conectando...');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isTranscribingRef = useRef(false);
  const [interimText, setInterimText] = useState('');
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const [manualTranscriptInput, setManualTranscriptInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'activity' | 'participants'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);

  // Reloj de la sesión
  const [callDuration, setCallDuration] = useState(0);

  // Stream de video local y remoto
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const remoteStreamsRef = useRef<Record<string, MediaStream>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localDisplayStream, setLocalDisplayStream] = useState<MediaStream | null>(null);
  const localFrameRef = useRef<string | null>(null);
  const screenFrameRef = useRef<string | null>(null);
  const [localFrameData, setLocalFrameData] = useState<string | null>(null);
  const [localScreenFrameData, setLocalScreenFrameData] = useState<string | null>(null);
  const [remotePeerFrames, setRemotePeerFrames] = useState<Record<string, string>>({});
  const [remoteScreenFrame, setRemoteScreenFrame] = useState<string | null>(null);

  // Captura de frames base64 para streaming respaldado por servidor
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Referencia PeerConnection para WebRTC nativo P2P
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const processedSignalIds = useRef<Set<string>>(new Set());
  const offeredPeersRef = useRef<Set<string>>(new Set());
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [remotePeers, setRemotePeers] = useState<PeerParticipant[]>([]);

  const toggleCamera = () => {
    const nextState = !cameraActive;
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    if (!nextState) {
      localFrameRef.current = null;
    }
    setCameraActive(nextState);
  };

  const toggleMic = () => {
    const nextState = !micActive;
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextState;
      });
    }
    setMicActive(nextState);
  };

  // Historial de eventos de auditoría y chat
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([
    {
      id: '1',
      type: 'join',
      name: localName,
      role: localRole,
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Transcripciones
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const recognitionRef = useRef<any>(null);

  // ── ESTADOS Y FUNCIONES DE GRABACIÓN EXCLUSIVA DEL CUADRO DE VIDEO ──
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const startRecording = () => {
    try {
      recordedChunksRef.current = [];

      // 1. Crear Canvas HD interno (Sin diálogos ni pedir compartir pantalla)
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      // 2. Mezclador de Audio de la reunión
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioDestination = audioCtx.createMediaStreamDestination();

      if (localStream && localStream.getAudioTracks().length > 0) {
        try {
          const source = audioCtx.createMediaStreamSource(localStream);
          source.connect(audioDestination);
        } catch { }
      }
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        try {
          const source = audioCtx.createMediaStreamSource(remoteStream);
          source.connect(audioDestination);
        } catch { }
      }

      // 3. Bucle de dibujo a 30 FPS del marco de video de la llamada
      const drawLoop = () => {
        if (ctx) {
          ctx.fillStyle = '#060E1B';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (videoContainerRef.current) {
            const videoElements = videoContainerRef.current.querySelectorAll('video');
            if (videoElements && videoElements.length > 0) {
              const count = videoElements.length;
              const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
              const rows = count <= 2 ? 1 : 2;
              const w = canvas.width / cols;
              const h = canvas.height / rows;

              videoElements.forEach((video, idx) => {
                const c = idx % cols;
                const r = Math.floor(idx / cols);
                try {
                  if (video.readyState >= 2) {
                    ctx.drawImage(video, c * w + 6, r * h + 6, w - 12, h - 12);
                  }
                } catch { }
              });
            } else {
              ctx.fillStyle = '#081528';
              ctx.font = 'bold 22px monospace';
              ctx.fillStyle = '#C9A96E';
              ctx.textAlign = 'center';
              ctx.fillText(`Grabando Cuadro de Video · Sala [${roomId}]`, canvas.width / 2, canvas.height / 2);
            }
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(drawLoop);
      };

      drawLoop();

      // 4. Captura directa de la transmisión del Canvas a 30 FPS
      const stream = canvas.captureStream(30);

      const audioTracks = audioDestination.stream.getAudioTracks();
      if (audioTracks && audioTracks.length > 0) {
        stream.addTrack(audioTracks[0]);
      }

      recordingStreamRef.current = stream;

      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? { mimeType: 'video/webm;codecs=vp9,opus' }
        : MediaRecorder.isTypeSupported('video/webm')
          ? { mimeType: 'video/webm' }
          : undefined;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        downloadRecording();
      };

      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.warn('Error en la grabación directa del cuadro de video:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const downloadRecording = () => {
    if (!recordedChunksRef.current || recordedChunksRef.current.length === 0) return;
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `Grabacion_Cuadro_Video_${roomId}_${dateStr}.webm`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    alert(`¡Grabación finalizada! El archivo del cuadro de video "${fileName}" se ha guardado y descargado en tu equipo.`);
  };

  // ── ESTADOS Y FUNCIONES DE COMPARTIR PANTALLA ──
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 } },
        audio: true,
      });
      const screenTrack = screenStream.getVideoTracks()[0];
      if (!screenTrack) return;
      try { screenTrack.contentHint = 'detail'; } catch { }

      screenStreamRef.current = screenStream;
      setLocalDisplayStream(screenStream);
      setIsScreenSharing(true);

      for (const pc of peerConnectionsRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          try { await sender.replaceTrack(screenTrack); } catch (e) { console.warn('No se pudo cambiar a pantalla:', e); }
        }
      }

      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.warn('Compartir pantalla cancelado:', err);
    }
  };

  const stopScreenShare = async () => {
    const cameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
    for (const pc of peerConnectionsRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraTrack) {
        try { await sender.replaceTrack(cameraTrack); } catch (e) { console.warn('No se pudo restaurar la cámara:', e); }
      }
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { }
      });
      screenStreamRef.current = null;
    }
    setLocalDisplayStream(cameraStreamRef.current || localStream);
    setIsScreenSharing(false);
  };

  // Captura periódica de cuadros de pantalla compartida a base64
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
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      if (ctx && videoEl.readyState >= 2) {
        try {
          ctx.drawImage(videoEl, 0, 0, 480, 270);
          screenFrameRef.current = canvas.toDataURL('image/jpeg', 0.25);
        } catch { }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      videoEl.srcObject = null;
    };
  }, [isScreenSharing]);

  // ── FUNCIÓN COMPLETA DE APAGADO DE HARDWARE (CÁMARA, MICRÓFONO, PANTALLA, GRABACIÓN) ──
  const stopAllHardwareMedia = () => {
    try {
      screenStreamRef.current?.getTracks().forEach((track) => { try { track.stop(); } catch { } });
      screenStreamRef.current = null;

      recordingStreamRef.current?.getTracks().forEach((track) => { try { track.stop(); } catch { } });
      recordingStreamRef.current = null;

      for (const pc of peerConnectionsRef.current.values()) {
        try { pc.ontrack = null; pc.onicecandidate = null; pc.close(); } catch { }
      }
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
      offeredPeersRef.current.clear();
      processedSignalIds.current.clear();
      pcRef.current = null;

      cameraStreamRef.current?.getTracks().forEach((track) => { try { track.stop(); } catch { } });
      cameraStreamRef.current = null;
      localStreamRef.current = null;
      remoteStreamsRef.current = {};
    } catch (err) {
      console.warn('Error al apagar componentes multimedia:', err);
    }
  };

  useEffect(() => {
    return () => {
    };
  }, []);

  // Timer de duración
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Captura periódica de fotogramas de la cámara para envío inmediato al servidor
  useEffect(() => {
    if (!cameraActive || !localStream) {
      localFrameRef.current = null;
      return;
    }

    const videoEl = document.createElement('video');
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    videoEl.muted = true;
    videoEl.srcObject = localStream;
    videoEl.play().catch(() => { });

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d');

    const interval = setInterval(() => {
      if (ctx && videoEl.readyState >= 2) {
        try {
          ctx.drawImage(videoEl, 0, 0, 480, 270);
          localFrameRef.current = canvas.toDataURL('image/jpeg', 0.35);
        } catch { }
      }
    }, 150);

    return () => {
      clearInterval(interval);
      videoEl.pause();
      videoEl.srcObject = null;
    };
  }, [cameraActive, localStream]);

  // ── 1. ACTIVAR CÁMARA Y MICRÓFONO LOCAL DE FORMA INDEPENDIENTE ──
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      if (localStream) return;
      if (!navigator?.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', frameRate: { ideal: 30, max: 30 } },
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
            });
          }
        }

        if (!isMounted) return;

        cameraStreamRef.current = stream;
        stream.getVideoTracks().forEach((track) => { try { track.contentHint = 'motion'; } catch { } });
        stream.getAudioTracks().forEach((track) => { try { track.contentHint = 'speech'; } catch { } });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setLocalDisplayStream(stream);
      } catch (err) {
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
          });
          if (!isMounted) return;
          cameraStreamRef.current = videoOnlyStream;
          videoOnlyStream.getVideoTracks().forEach((track) => { try { track.contentHint = 'motion'; } catch { } });
          localStreamRef.current = videoOnlyStream;
          setLocalStream(videoOnlyStream);
          setLocalDisplayStream(videoOnlyStream);
        } catch (vErr) {
          console.warn('Webcam real no encontrada o denegada:', vErr);
        }
      }
    }

    initMedia();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localDisplayStream || localStream;
    }
  }, [localStream, localDisplayStream]);

  // Alternar audio y video en localStream de forma independiente
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = cameraActive));
    }
  }, [cameraActive, localStream, localDisplayStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = micActive));
    }
  }, [micActive, localStream]);

  // Fallback visual ligero: WebRTC sigue siendo el transporte principal.
  // Si la señalización tarda o falla, el usuario todavía puede ver una vista previa
  // pequeña mientras se recupera la conexión P2P.
  useEffect(() => {
    let cancelled = false;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const capture = () => {
      if (cancelled) return;
      const video = localVideoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        try {
          ctx.drawImage(video, 0, 0, 320, 180);
          setLocalFrameData(canvas.toDataURL('image/jpeg', 0.35));
        } catch { }
      }
    };

    const timer = window.setInterval(capture, 1000);
    capture();
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [localStream]);

  // ── 2. WEBRTC P2P: UNA CONEXIÓN POR PARTICIPANTE ──
  const sendSignal = async (peerId: string, signal: any) => {
    try {
      await fetch(`${API_BASE}/api/room/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, from: localPeerId, to: peerId, signal }),
        keepalive: signal?.type === 'candidate',
      });
    } catch (e) {
      console.warn('No se pudo enviar señal WebRTC:', e);
    }
  };

  const applySenderQuality = async (pc: RTCPeerConnection) => {
    const senders = pc.getSenders();
    for (const sender of senders) {
      if (!sender.track) continue;
      try {
        const params = sender.getParameters();
        if (!params.encodings?.length) params.encodings = [{}];

        if (sender.track.kind === 'video') {
          params.encodings[0].maxBitrate = 1_800_000;
          params.encodings[0].maxFramerate = 30;
          params.degradationPreference = 'maintain-framerate';
        } else if (sender.track.kind === 'audio') {
          params.encodings[0].maxBitrate = 64_000;
        }
        await sender.setParameters(params);
      } catch { }
    }
  };

  const createPeerConnection = (peerId: string) => {
    if (!localStream || peerId === localPeerId) return null;

    const existing = peerConnectionsRef.current.get(peerId);
    if (existing && existing.connectionState !== 'closed') return existing;

    const turnUrl = (import.meta as any).env?.VITE_TURN_URL;
    const turnUsername = (import.meta as any).env?.VITE_TURN_USERNAME;
    const turnCredential = (import.meta as any).env?.VITE_TURN_CREDENTIAL;

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    if (turnUrl && turnUsername && turnCredential) {
      iceServers.push({ urls: turnUrl, username: turnUsername, credential: turnCredential });
    }

    const pc = new RTCPeerConnection({
      iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    localStream.getTracks().forEach((track) => {
      try { pc.addTrack(track, localStream); } catch (e) { console.warn('No se pudo agregar track:', e); }
    });

    applySenderQuality(pc).catch(() => { });

    pc.ontrack = (event) => {
      // IMPORTANTE: audio y video pueden llegar en eventos separados.
      // Creamos un único MediaStream estable por participante.
      let stream = remoteStreamsRef.current[peerId];

      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current[peerId] = stream;
      }

      // Agregar SIEMPRE el track recibido al stream del participante.
      if (!stream.getTracks().some((track) => track.id === event.track.id)) {
        try {
          stream.addTrack(event.track);
        } catch (err) {
          console.warn('No se pudo agregar track remoto:', err);
        }
      }

      // También conservar todos los tracks del stream que entregue el navegador.
      const incomingStream = event.streams?.[0];
      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          if (!stream!.getTracks().some((existing) => existing.id === track.id)) {
            try {
              stream!.addTrack(track);
            } catch { }
          }
        });
      }

      // MUY IMPORTANTE para audio: el track remoto debe quedar habilitado.
      if (event.track.kind === 'audio') {
        event.track.enabled = true;
        console.log(`[WebRTC] Audio remoto recibido de ${peerId}`, {
          trackId: event.track.id,
          readyState: event.track.readyState,
          muted: event.track.muted,
        });

        event.track.onunmute = () => {
          document.querySelectorAll<HTMLAudioElement>(
            'audio[data-remote-audio="true"]'
          ).forEach((audio) => {
            audio.muted = false;
            audio.volume = isMutedVolume ? 0 : Math.max(0, Math.min(1, volume / 100));
            void audio.play().catch(() => { });
          });
        };
      }

      const freshStream = new MediaStream(stream.getTracks());
      remoteStreamsRef.current[peerId] = freshStream;
      setRemoteStreams((prev) => ({ ...prev, [peerId]: freshStream }));
      setRemoteStream(freshStream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal(peerId, { type: 'candidate', candidate: event.candidate });
    };

    pc.onicecandidateerror = (event) => {
      console.warn('ICE candidate error:', event.errorCode, event.errorText);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') setConnectionQuality('Conectado');
      else if (state === 'connecting') setConnectionQuality('Conectando...');
      else if (state === 'disconnected') setConnectionQuality('Red inestable');
      else if (state === 'failed') setConnectionQuality('Conexión fallida');

      if (state === 'failed') {
        try { pc.restartIce(); } catch { }
      }

      if (state === 'closed') {
        peerConnectionsRef.current.delete(peerId);
        remoteStreamsRef.current[peerId] && delete remoteStreamsRef.current[peerId];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try { pc.restartIce(); } catch { }
      }
    };

    peerConnectionsRef.current.set(peerId, pc);
    if (!pcRef.current) pcRef.current = pc;
    return pc;
  };

  const sendOfferToPeer = async (peerId: string) => {
    if (!localStream || peerId === localPeerId) return;
    if (offeredPeersRef.current.has(peerId)) return;

    const pc = createPeerConnection(peerId);
    if (!pc || pc.signalingState !== 'stable') return;

    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      await sendSignal(peerId, { type: 'offer', sdp: pc.localDescription });
      offeredPeersRef.current.add(peerId);
    } catch (e) {
      offeredPeersRef.current.delete(peerId);
      console.warn('Error creando oferta WebRTC:', e);
    }
  };
  useEffect(() => {
    remotePeers.forEach((peer) => {
      createPeerConnection(peer.peerId);
      sendOfferToPeer(peer.peerId);
    });
  }, [remotePeers, localStream]);

  useEffect(() => {
    if (!localStream) return;
    let active = true;
    let polling = false;

    const processSignals = async () => {
      if (!active || polling) return;
      polling = true;
      try {
        const res = await fetch(`${API_BASE}/api/room/signal?roomId=${encodeURIComponent(roomId)}&peerId=${encodeURIComponent(localPeerId)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.signals)) return;

        for (const item of data.signals) {
          const sig = item?.signal;
          const from = item?.from;
          if (!from || from === localPeerId || !sig) continue;

          const signalKey = item.id || `${from}_${sig.type}_${sig.candidate?.candidate || sig.sdp?.sdp || ''}`;
          if (processedSignalIds.current.has(signalKey)) continue;
          processedSignalIds.current.add(signalKey);

          const pc = createPeerConnection(from);
          if (!pc) continue;

          try {
            if (sig.type === 'offer' && sig.sdp) {
              // El peer con ID mayor acepta la oferta del menor.
              if (pc.signalingState !== 'stable') {
                try { await pc.setLocalDescription({ type: 'rollback' }); } catch { }
              }

              await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
              const queued = pendingCandidatesRef.current.get(from) || [];
              for (const candidate of queued) {
                try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { }
              }
              pendingCandidatesRef.current.delete(from);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal(from, { type: 'answer', sdp: pc.localDescription });
              await applySenderQuality(pc);
            } else if (sig.type === 'answer' && sig.sdp) {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
                const queued = pendingCandidatesRef.current.get(from) || [];
                for (const candidate of queued) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { }
                }
                pendingCandidatesRef.current.delete(from);
                await applySenderQuality(pc);
              }
            } else if (sig.type === 'candidate' && sig.candidate) {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
              } else {
                const queued = pendingCandidatesRef.current.get(from) || [];
                queued.push(sig.candidate);
                pendingCandidatesRef.current.set(from, queued);
              }
            }
          } catch (e) {
            console.warn(`Error procesando señal de ${from}:`, e);
          }
        }
      } catch (e) {
        console.warn('Error leyendo señalización:', e);
      } finally {
        polling = false;
      }
    };

    processSignals();
    const signalInterval = setInterval(processSignals, 700);
    return () => {
      active = false;
      clearInterval(signalInterval);
    };
  }, [localStream, roomId, localPeerId]);

  useEffect(() => {
    if (!localStream) return;
    for (const pc of peerConnectionsRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      const videoTrack = (isScreenSharing ? screenStreamRef.current?.getVideoTracks()[0] : cameraStreamRef.current?.getVideoTracks()[0]);
      if (sender && videoTrack && sender.track?.id !== videoTrack.id) {
        sender.replaceTrack(videoTrack).catch(() => { });
      }
    }
  }, [isScreenSharing, localStream]);

  useEffect(() => {
    return () => {
      for (const pc of peerConnectionsRef.current.values()) { try { pc.close(); } catch { } }
      peerConnectionsRef.current.clear();
    };
  }, []);

  // Monitor ligero de WebRTC: detecta si la conexión realmente está recibiendo video/audio.
  useEffect(() => {
    if (!localStream) return;
    let cancelled = false;

    const collectStats = async () => {
      const pcs = Array.from(peerConnectionsRef.current.entries());
      if (!pcs.length) {
        setConnectionQuality('Esperando participante');
        return;
      }

      let connected = 0;
      let inboundVideo = 0;
      let inboundAudio = 0;
      for (const [, pc] of pcs) {
        if (pc.connectionState === 'connected') connected++;
        try {
          const stats = await pc.getStats();
          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && !report.isRemote) {
              if (report.kind === 'video' || report.mediaType === 'video') inboundVideo += report.bytesReceived || 0;
              if (report.kind === 'audio' || report.mediaType === 'audio') inboundAudio += report.bytesReceived || 0;
            }
          });
        } catch { }
      }

      if (!cancelled && connected > 0) {
        if (inboundVideo > 0 && inboundAudio > 0) setConnectionQuality('Conexión estable');
        else if (inboundVideo > 0) setConnectionQuality('Video conectado · Audio pendiente');
        else setConnectionQuality('Conectado · Recibiendo...');
      }
    };

    collectStats();
    statsTimerRef.current = setInterval(collectStats, 3000);
    return () => {
      cancelled = true;
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    };
  }, [localStream]);

  // ── 3. SINCRONIZACIÓN CON EL BACKEND EXPRESS DE SALA ──
  useEffect(() => {
    let isMounted = true;

    async function syncWithServer() {
      try {
        const res = await fetch(`${API_BASE}/api/room/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            peerId: localPeerId,
            name: localName,
            role: localRole,
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
        if (data.transcripts && Array.isArray(data.transcripts)) {
          setTranscripts((prev) => {
            const map = new Map<string, TranscriptItem>();
            prev.forEach((t) => map.set(t.id, t));
            data.transcripts.forEach((t: TranscriptItem) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Error syncing room:', err);
      }
    }

    syncWithServer();
    const interval = setInterval(syncWithServer, 1000);

    const handleUnload = () => {
      try {
        navigator.sendBeacon(`${API_BASE}/api/room/leave`, JSON.stringify({ roomId, peerId: localPeerId }));
      } catch { }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [roomId, localPeerId, localName, localRole, cameraActive, micActive, isScreenSharing]);

  // Función para enviar y persistir transcripción en la sala
  const sendTranscript = async (text: string, speakerName?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const speaker = speakerName || localName || 'Anfitrión';
    const currentTime = formatDuration(callDuration);
    const tempId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newItem: TranscriptItem = {
      id: tempId,
      speaker,
      text: trimmed,
      time: currentTime,
    };

    setTranscripts((prev) => {
      const isDupe = prev.slice(-3).some(
        (p) => p.speaker === speaker && p.text.toLowerCase() === trimmed.toLowerCase()
      );
      return isDupe ? prev : [...prev, newItem];
    });

    setInterimText('');

    try {
      await fetch(`${API_BASE}/api/room/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          speaker,
          text: trimmed,
          time: currentTime,
        }),
      });
    } catch (err) {
      console.warn('Error enviando transcripción a la sala:', err);
    }
  };

  const handleSendManualTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTranscriptInput.trim()) return;
    const text = manualTranscriptInput.trim();
    setManualTranscriptInput('');
    await sendTranscript(text, `${localName} (Nota)`);
  };

  const handleCopyTranscript = () => {
    if (transcripts.length === 0) return;
    const formatted = transcripts
      .map((t) => `[${t.time}] ${t.speaker}:\n${t.text}\n`)
      .join('\n');
    navigator.clipboard.writeText(formatted);
    setTranscriptCopied(true);
    setTimeout(() => setTranscriptCopied(false), 2500);
  };

  const handleClearTranscripts = async () => {
    setTranscripts([]);
    setInterimText('');
    try {
      await fetch(`${API_BASE}/api/room/transcript`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
    } catch (err) {
      console.warn('Error limpiando transcripciones:', err);
    }
  };

  // Transcripción en directo robusta (Web Speech API) con auto-reinicio continuo
  useEffect(() => {
    isTranscribingRef.current = isTranscribing;

    if (!isTranscribing) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { }
        recognitionRef.current = null;
      }
      setInterimText('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      let recognition: any = null;
      let restartTimer: any = null;
      let isMounted = true;

      const initRecognition = () => {
        if (!isMounted || !isTranscribingRef.current) return;

        try {
          if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch { }
          }

          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'es-MX';
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let currentInterim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const res = event.results[i];
              const chunk = res[0]?.transcript || '';
              if (res.isFinal) {
                const text = chunk.trim();
                if (text) {
                  sendTranscript(text, localName);
                }
              } else {
                currentInterim += chunk;
              }
            }
            if (currentInterim) {
              setInterimText(currentInterim);
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              console.warn('SpeechRecognition error:', event.error);
            }
          };

          recognition.onend = () => {
            // El navegador finaliza automáticamente la sesión tras silencios breves.
            // Si la transcripción sigue activa, reiniciamos sin interrupción.
            if (isMounted && isTranscribingRef.current) {
              clearTimeout(restartTimer);
              restartTimer = setTimeout(() => {
                if (isMounted && isTranscribingRef.current) {
                  initRecognition();
                }
              }, 200);
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('No se pudo inicializar SpeechRecognition:', err);
        }
      };

      initRecognition();

      return () => {
        isMounted = false;
        clearTimeout(restartTimer);
        if (recognition) {
          try { recognition.stop(); } catch { }
        }
        recognitionRef.current = null;
      };
    } else {
      // Si el navegador no soporta Web Speech API nativa, simular notas periódicas
      const interval = setInterval(() => {
        const samplePhrases = [
          'Analizando canal de transmisión y logs de integraciones...',
          'Conciliando variables de rendimiento de Oracle Fusion ERP...',
          'Prueba de concurrencia y latencia ejecutada con éxito.',
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        sendTranscript(randomPhrase, 'Asistente IA FabricSoft');
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [isTranscribing, localName, roomId, callDuration]);

  // Transcripción continua por IA Groq Whisper V3 Turbo mediante segmentos limpios y VAD
  useEffect(() => {
    if (!isTranscribing || !micActive || !localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) return;

    let isMounted = true;
    let currentRecorder: MediaRecorder | null = null;
    let sliceTimeout: any = null;

    // Conectar Analizador de Audio para detectar si hay voz en el micrófono
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let micSource: MediaStreamAudioSourceNode | null = null;
    let hasSpokenInChunk = false;
    let checkEnergyInterval: any = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const tempStream = new MediaStream([audioTrack]);
        micSource = audioCtx.createMediaStreamSource(tempStream);
        micSource.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        checkEnergyInterval = setInterval(() => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Si el promedio de energía de audio supera el umbral de voz
          if (avg > 10) {
            hasSpokenInChunk = true;
          }
        }, 120);
      }
    } catch { }

    const recordNextSegment = () => {
      if (!isMounted) return;

      try {
        const audioStream = new MediaStream([audioTrack]);
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : undefined;

        const chunks: Blob[] = [];
        hasSpokenInChunk = false;

        const recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
        currentRecorder = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (!isMounted) return;
          const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
          
          // Enviamos a Groq Whisper si se detectó energía de voz o si el audio tiene tamaño representativo
          if (blob.size > 3500 && hasSpokenInChunk) {
            try {
              const formData = new FormData();
              formData.append('audio', blob, 'speech.webm');
              formData.append('roomId', roomId);
              formData.append('speaker', localName);
              formData.append('time', formatDuration(callDuration));

              const res = await fetch(`${API_BASE}/api/room/transcribe-audio`, {
                method: 'POST',
                body: formData,
              });
              if (res.ok) {
                const data = await res.json();
                if (data.item) {
                  setTranscripts((prev) => {
                    const isDupe = prev.slice(-3).some(
                      (p) => p.speaker === data.item.speaker && p.text.toLowerCase() === data.item.text.toLowerCase()
                    );
                    return isDupe ? prev : [...prev, data.item];
                  });
                }
              }
            } catch (err) {
              console.warn('Error enviando trozo de audio a Groq Whisper:', err);
            }
          }

          if (isMounted) {
            recordNextSegment();
          }
        };

        recorder.start();

        // Cerrar el bloque a los 3.5 segundos para generar archivo WebM completo con cabeceras
        sliceTimeout = setTimeout(() => {
          if (recorder.state === 'recording') {
            try { recorder.stop(); } catch { }
          }
        }, 3500);

      } catch (err) {
        console.warn('Error iniciando segmento para Groq AI:', err);
        if (isMounted) {
          sliceTimeout = setTimeout(recordNextSegment, 2500);
        }
      }
    };

    recordNextSegment();

    return () => {
      isMounted = false;
      clearTimeout(sliceTimeout);
      clearInterval(checkEnergyInterval);
      if (currentRecorder && currentRecorder.state !== 'inactive') {
        try { currentRecorder.stop(); } catch { }
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        try { audioCtx.close(); } catch { }
      }
    };
  }, [isTranscribing, micActive, localStream, roomId, localName, callDuration]);

  // Scroll automático del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, transcripts, activityLogs]);

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
          sender: localName,
          role: 'host',
          text: textToSend,
        }),
      });
    } catch (err) {
      console.warn('Error sending message:', err);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('No se pudo cambiar el modo pantalla completa:', err);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const ensureLocalMedia = async (wantAudio = true, wantVideo = true) => {
    if (!navigator.mediaDevices?.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo ? { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } } : false,
        audio: wantAudio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } : false,
      });
      if (wantVideo && stream.getVideoTracks()[0]) cameraStreamRef.current = stream;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalDisplayStream(stream);
      stream.getVideoTracks().forEach(t => { try { t.contentHint = 'motion'; } catch { } });
      stream.getAudioTracks().forEach(t => { try { t.contentHint = 'speech'; } catch { } });
      return stream;
    } catch (err) {
      console.warn('No se pudieron obtener permisos de cámara/micrófono:', err);
      return null;
    }
  };

  const handleCopyLink = () => {
    try {
      const guestUrl = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;
      navigator.clipboard.writeText(guestUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch { }
  };

  const unlockRemoteAudio = async () => {
    // Esta función se ejecuta desde un CLICK del usuario, por lo que
    // el navegador permite iniciar la reproducción del audio remoto.
    const audioElements = Array.from(
      document.querySelectorAll<HTMLAudioElement>('audio[data-remote-audio="true"]')
    );

    setIsMutedVolume(false);
    setAudioUnlocked(true);

    // Si todavía no existe un audio remoto, el estado queda desbloqueado
    // y el siguiente participante podrá reproducirse al llegar.
    if (audioElements.length === 0) {
      console.log('[WebRTC] Audio desbloqueado; esperando participante remoto.');
      return;
    }

    for (const audio of audioElements) {
      audio.muted = false;
      audio.volume = Math.max(0, Math.min(1, volume / 100));

      try {
        await audio.play();
        console.log('[WebRTC] Reproducción de audio remoto iniciada.');
      } catch (error) {
        console.warn('[WebRTC] El navegador todavía bloquea el audio:', error);
      }
    }
  };

  // Cualquier interacción real con la página puede desbloquear el audio.
  // Esto evita depender exclusivamente del botón "Activar Audio".
  useEffect(() => {
    const unlockFromInteraction = () => {
      const audioElements = Array.from(
        document.querySelectorAll<HTMLAudioElement>('audio[data-remote-audio="true"]')
      );

      if (audioElements.length === 0) return;

      let started = false;
      audioElements.forEach((audio) => {
        audio.muted = false;
        audio.volume = isMutedVolume ? 0 : Math.max(0, Math.min(1, volume / 100));
        void audio.play()
          .then(() => { started = true; })
          .catch(() => { });
      });

      if (started) setAudioUnlocked(true);
    };

    document.addEventListener('click', unlockFromInteraction, { passive: true });
    document.addEventListener('pointerdown', unlockFromInteraction, { passive: true });
    document.addEventListener('keydown', unlockFromInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', unlockFromInteraction);
      document.removeEventListener('pointerdown', unlockFromInteraction);
      document.removeEventListener('keydown', unlockFromInteraction);
    };
  }, [volume, isMutedVolume]);

  const handleLeaveCall = async () => {
    if (isRecording || (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive')) {
      stopRecording();
    }
    stopAllHardwareMedia();
    try {
      await fetch(`${API_BASE}/api/room/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, peerId: localPeerId }),
      });
    } catch { }
    navigate('/');
  };

  // Consolidamos todos los participantes activos a desplegar en la cuadrícula dividida
  const allActiveParticipants: PeerParticipant[] = [
    {
      peerId: localPeerId,
      name: localName,
      role: localRole,
      avatar: 'AS',
      isLocal: true,
      isVideoOn: cameraActive,
      isAudioOn: micActive,
      color: '#C9A96E',
      stream: localDisplayStream || localStream,
    },
    ...remotePeers.map((p) => ({
      ...p,
      stream: remoteStreams[p.peerId] || null,
    })),
  ];

  // Verificación de Acceso del Administrador
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminCodeError, setAdminCodeError] = useState('');

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = adminNameInput.trim() || 'Administrador de la Sala';
    const code = adminCodeInput.trim();

    if (code === '669933') {
      setLocalName(nameToUse);
      setIsAdminVerified(true);
      setAdminCodeError('');

      // Solicitar permisos directamente al hacer clic para garantizar diálogo del navegador
      if (!localStream && navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        })
          .then((stream) => {
            cameraStreamRef.current = stream;
            localStreamRef.current = stream;
            setLocalStream(stream);
            setLocalDisplayStream(stream);
          })
          .catch(() => {
            navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } },
            })
              .then((vStream) => {
                cameraStreamRef.current = vStream;
                vStream.getVideoTracks().forEach((track) => { try { track.contentHint = 'motion'; } catch { } });
                localStreamRef.current = vStream;
                setLocalStream(vStream);
                setLocalDisplayStream(vStream);
              })
              .catch((e) => console.warn('Cámara no permitida o denegada:', e));
          });
      }
    } else {
      setAdminCodeError('Código de acceso de Administrador incorrecto. Usa 669933.');
    }
  };

  /* Se ingresa directamente a la sala sin detener la vista en el modal */

  return (
    <div className="h-screen bg-[#030712] text-white flex flex-col font-sans select-none overflow-hidden">

      {/* Elemento de video oculto para captura de fotogramas */}
      <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none -z-50" />
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <RemoteAudio
          key={`audio-${peerId}`}
          stream={stream}
          volume={volume}
          muted={isMutedVolume}
        />
      ))}

      {/* ── BARRA SUPERIOR (HEADER) ── */}
      <header className="h-16 bg-[#060D1A] border-b border-[#1E3A5F]/70 px-6 flex items-center justify-between shrink-0 backdrop-blur-xl relative z-30 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 rounded-xl bg-[#09182E] border border-[#1E3A5F] text-[#94A3B8] hover:text-[#C9A96E] hover:border-[#C9A96E]/50 transition-all cursor-pointer"
            title="Volver a Inicio"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ANFITRIÓN DE LA SALA
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#94A3B8]">
              <span>ID de Sala:</span>
              <span className="text-[#C9A96E] font-bold bg-[#081528] px-2 py-0.5 rounded border border-[#1E3A5F] tracking-wider">
                {roomId}
              </span>
            </div>
          </div>
        </div>

        {/* Info central / Reloj */}
        <div className="hidden md:flex items-center gap-3 bg-[#081528] border border-[#1E3A5F] px-5 py-2 rounded-full font-mono text-xs shadow-inner">
          <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
          <span className="text-[#94A3B8] uppercase tracking-wider text-[10px]">Duración:</span>
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
            <span className="hidden lg:inline">WebRTC P2P Nativo</span>
          </div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL: VIDEO NATIVO (IZQ) + CHAT/TRANSCRIPCIÓN/ACCESOS (DER) ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 md:p-4 pb-24 md:pb-28 overflow-hidden relative min-h-0">

        {/* 👈 IZQUIERDA: ESCENARIO PRINCIPAL DE VIDEO (MÁS COMPACTO Y ESTILIZADO) */}
        <div ref={videoContainerRef} className={`${isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'} h-full min-h-0 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300`}>

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,95,0.25),transparent_70%)] pointer-events-none" />

          {(isScreenSharing || remotePeers.some((p) => p.isScreenSharing || p.screenFrameData)) ? (
            /* 🖥️ MODO PANTALLA COMPARTIDA */
            <div className="w-full h-full flex flex-col gap-2.5 relative z-10">

              {/* CUADRO PRINCIPAL EN GRANDE DE PANTALLA COMPARTIDA */}
              <div className="flex-1 bg-[#060E1B] border border-emerald-500/50 rounded-2xl overflow-hidden relative shadow-[0_0_35px_rgba(16,185,129,0.2)] flex items-center justify-center min-h-[260px]">
                {screenStreamRef.current ? (
                  <VideoPlayer stream={screenStreamRef.current} isLocal={true} isScreenShare={true} />
                ) : remoteStream ? (
                  <VideoPlayer stream={remoteStream} isLocal={false} isScreenShare={true} />
                ) : (remotePeers.find((p) => p.isScreenSharing && remoteStreams[p.peerId])?.stream || remoteStream) ? (
                  <VideoPlayer stream={remotePeers.find((p) => p.isScreenSharing && remoteStreams[p.peerId])?.stream || remoteStream} isLocal={false} isScreenShare={true} />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <p className="font-mono text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                      Transmisión de Pantalla en Vivo
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
                {allActiveParticipants.map((p) => (
                  <div
                    key={p.peerId}
                    className="w-36 h-full rounded-lg bg-[#030712] border border-[#1E3A5F] relative overflow-hidden shrink-0 flex flex-col items-center justify-center shadow-sm"
                  >
                    {p.isVideoOn ? (
                      (p.isLocal && localStream) ? (
                        <VideoPlayer stream={localStream} isLocal={true} />
                      ) : p.isLocal ? (
                        <div className="w-8 h-8 rounded-full bg-[#0E2747] border border-[#C9A96E] text-white font-serif font-bold text-xs flex items-center justify-center shadow-sm">
                          {p.avatar}
                        </div>
                      ) : (remotePeerFrames[p.peerId] || p.frameData) ? (
                        <img src={remotePeerFrames[p.peerId] || p.frameData!} alt={p.name} className="w-full h-full object-cover" />
                      ) : p.stream ? (
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
            /* 🎥 MODO CUADRÍCULA ADAPTATIVA (1 A 4 EN PANTALLA PRINCIPAL, 5+ EN TIRA INFERIOR) */
            (() => {
              // Ordenar para mostrar primero los que tienen cámara activa o son participantes remotos
              const sortedParticipants = [...allActiveParticipants].sort((a, b) => {
                if (a.isVideoOn && !b.isVideoOn) return -1;
                if (!a.isVideoOn && b.isVideoOn) return 1;
                if (!a.isLocal && b.isLocal) return -1;
                if (a.isLocal && !b.isLocal) return 1;
                return 0;
              });

              const mainParticipants = sortedParticipants.slice(0, 4);
              const overflowParticipants = sortedParticipants.slice(4);

              const getAdaptiveGridClass = (count: number) => {
                switch (count) {
                  case 1:
                    return 'grid-cols-1 grid-rows-1';
                  case 2:
                    return 'grid-cols-1 md:grid-cols-2 grid-rows-1';
                  case 3:
                    return 'grid-cols-1 md:grid-cols-3 grid-rows-1';
                  case 4:
                  default:
                    return 'grid-cols-2 grid-rows-2';
                }
              };

              return (
                <div className="w-full h-full flex flex-col gap-2.5 relative z-10 select-none overflow-hidden">
                  {/* CUADRÍCULA PRINCIPAL (HASTA 4 PERSONAS ACOMODADAS PERFECTAMENTE) */}
                  <div className={`flex-1 w-full rounded-2xl bg-[#060E1B] border border-[#1E3A5F]/80 shadow-[0_15px_45px_rgba(0,0,0,0.8)] p-2.5 md:p-3 grid gap-2.5 ${getAdaptiveGridClass(mainParticipants.length)} relative overflow-hidden min-h-[260px]`}>
                    {mainParticipants.map((p, index) => {

                      return (
                        <div
                          key={p.peerId || `peer-${index}`}
                          className={`w-full h-full rounded-xl bg-[#081628] border ${p.isVideoOn ? 'border-[#C9A96E]/50 shadow-[0_0_15px_rgba(201,169,110,0.15)]' : 'border-[#1E3A5F]/80'} shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[170px]`}
                        >
                          {/* CÁMARA ENCENDIDA O APAGADA */}
                          {p.isVideoOn ? (
                            (p.isLocal && (localDisplayStream || localStream)) ? (
                              <VideoPlayer stream={localDisplayStream || localStream} isLocal={true} />
                            ) : (p.stream && p.stream.getVideoTracks().length > 0) ? (
                              <VideoPlayer stream={p.stream} isLocal={p.isLocal} />
                            ) : (remotePeerFrames[p.peerId] || p.frameData) ? (
                              <img src={remotePeerFrames[p.peerId] || p.frameData!} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#0A1A30] via-[#071325] to-[#040A14] overflow-hidden p-4">
                                <div className="absolute w-24 h-24 rounded-full border border-[#C9A96E]/20 animate-ping pointer-events-none" />
                                <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E] bg-[#0E2747] flex items-center justify-center text-white font-serif font-bold text-xl shadow-xl z-10">
                                  {p.avatar}
                                </div>
                                <p className="font-mono text-[10px] text-[#C9A96E] mt-2 font-bold uppercase tracking-wider z-10">
                                  Conectando Video...
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-[#050B14] w-full h-full">
                              <div className="w-14 h-14 rounded-full bg-[#081628] border border-[#C9A96E]/40 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                                {p.avatar}
                              </div>
                              <div>
                                <p className="font-serif font-bold text-xs text-white">{p.name} {p.isLocal ? '(Tú)' : ''}</p>
                                <span className="font-mono text-[9px] text-[#C9A96E] uppercase tracking-wider block mt-0.5">{p.role}</span>
                              </div>
                            </div>
                          )}

                          {/* Overlay Nombre */}
                          <div className="absolute top-2.5 left-2.5 bg-[#030712]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E3A5F] flex items-center gap-1.5 shadow-md z-20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-mono text-[10px] font-bold text-white tracking-wider">
                              {selectedPeerId === p.peerId && <LayoutGrid size={10} className="inline mr-1 text-[#C9A96E]" />}
                              {p.name} {p.isLocal ? '(Tú)' : ''}
                            </span>
                          </div>

                          {/* Overlay Rol */}
                          <div className="absolute bottom-2.5 left-2.5 bg-[#030712]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E3A5F] shadow-md z-20">
                            <p className="font-mono text-[9px] text-[#C9A96E] uppercase tracking-wider font-semibold">
                              {p.role}
                            </p>
                          </div>

                          {/* Overlay Micrófono */}
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

                  {/* 👥 TIRA INFERIOR SI HAY MÁS DE 4 PARTICIPANTES */}
                  {overflowParticipants.length > 0 && (
                    <div className="h-24 bg-[#081528] border border-[#1E3A5F] rounded-xl p-1.5 flex items-center gap-2 overflow-x-auto shrink-0 shadow-md">
                      {overflowParticipants.map((p) => {
                        return (
                          <div
                            key={p.peerId}
                            className="w-36 h-full rounded-lg bg-[#030712] border border-[#1E3A5F] relative overflow-hidden shrink-0 flex flex-col items-center justify-center shadow-sm"
                          >
                            {p.isVideoOn ? (
                              (p.isLocal && (localDisplayStream || localStream)) ? (
                                <VideoPlayer stream={localDisplayStream || localStream} isLocal={true} />
                              ) : (p.stream && p.stream.getVideoTracks().length > 0) ? (
                                <VideoPlayer stream={p.stream} isLocal={p.isLocal} />
                              ) : p.frameData ? (
                                <img src={p.frameData} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#0E2747] border border-[#C9A96E] text-white font-serif font-bold text-xs flex items-center justify-center shadow-sm">
                                  {p.avatar}
                                </div>
                              )
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-8 h-8 rounded-full bg-[#0E2747] border border-[#1E3A5F] text-slate-300 font-serif font-bold text-xs flex items-center justify-center">
                                  {p.avatar}
                                </div>
                              </div>
                            )}

                            <div className="absolute bottom-1 left-1 bg-[#030712]/90 px-1.5 py-0.5 rounded border border-[#1E3A5F] text-[8px] font-mono text-slate-200 font-bold truncate max-w-[120px] flex items-center gap-1">
                              {!p.isAudioOn && <MicOff size={9} className="text-rose-400" />}
                              <span>{p.name} {p.isLocal ? '(Tú)' : ''}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>

        {/* 👉 DERECHA: PANEL DE CHAT Y TRANCRIPCIÓN (COMPACTO) */}
        <div className={`${isSidebarOpen ? 'lg:col-span-4' : 'hidden'} h-full min-h-0 overflow-hidden transition-all duration-300`}>
          <div className="bg-[#060D1A]/95 border border-[#1E3A5F]/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl backdrop-blur-xl">

            {/* Pestañas Chat / Transcripción / Auditoría de accesos / Participantes */}
            <div className="p-1 bg-[#081528] border-b border-[#1E3A5F]/70 grid grid-cols-4 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${activeTab === 'chat'
                  ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                  : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                  }`}
              >
                <MessageSquare size={11} />
                <span className="truncate">Chat ({chatMessages.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('transcript');
                  if (!isSidebarOpen) setIsSidebarOpen(true);
                }}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${activeTab === 'transcript'
                  ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                  : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                  }`}
              >
                <Sparkles size={11} className={isTranscribing ? (activeTab === 'transcript' ? 'text-[#030712] animate-pulse' : 'text-emerald-400 animate-pulse') : 'text-[#C9A96E]'} />
                <span className="truncate">IA Box {isTranscribing && '●'}</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${activeTab === 'activity'
                  ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                  : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                  }`}
              >
                <Info size={11} />
                <span className="truncate">Accesos ({activityLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${activeTab === 'participants'
                  ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                  : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                  }`}
              >
                <Users size={11} />
                <span className="truncate">Part. ({allActiveParticipants.length})</span>
              </button>
            </div>

            {/* CONTENIDO PESTAÑA: CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <MessageSquare size={30} className="text-[#C9A96E]/50 mb-3" />
                      <p className="text-sm font-semibold text-slate-300">Chat de la reunión</p>
                      <p className="text-xs text-slate-500 mt-1">Los mensajes enviados aparecerán aquí.</p>
                    </div>
                  )}
                  {chatMessages.map((msg) => {
                    const isHost = msg.role === 'host';
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
                        className={`flex flex-col ${isHost ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-[#94A3B8]">{msg.sender}</span>
                          <span className="font-mono text-[10px] text-slate-500">{msg.time}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed ${isHost
                            ? 'bg-[#1E3A5F] text-white border border-[#C9A96E]/40 rounded-tr-none shadow-md'
                            : 'bg-[#081528] text-slate-200 border border-[#1E3A5F]/80 rounded-tl-none shadow-md'
                            }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-2.5 md:p-3 bg-[#081528] border-t border-[#1E3A5F]/70 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje como Líder..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 bg-[#030712] border border-[#1E3A5F] text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#C9A96E] font-sans text-xs placeholder-slate-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#e2c799] text-[#030712] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: TRANCRIPCIÓN IA (IA BOX) */}
            {activeTab === 'transcript' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header de la IA Box */}
                <div className="p-3 bg-[#081528] border-b border-[#1E3A5F]/70 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className={isTranscribing ? 'text-[#C9A96E] animate-pulse' : 'text-slate-500'} />
                    <div>
                      <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider block leading-tight">
                        IA BOX
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 block">
                        {isTranscribing ? 'En Vivo · Escuchando' : 'Desactivada · En Pausa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Activar / Apagar función IA Box */}
                    <button
                      onClick={() => setIsTranscribing(!isTranscribing)}
                      className={`px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${isTranscribing
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                        }`}
                      title={isTranscribing ? 'Apagar función IA Box' : 'Activar función IA Box'}
                    >
                      <Power size={11} className={isTranscribing ? 'text-emerald-400' : 'text-rose-400'} />
                      <span>{isTranscribing ? 'Apagar' : 'Activar'}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isTranscribing ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'}`} />
                    </button>

                    {/* Botón Copiar Minuta */}
                    <button
                      onClick={handleCopyTranscript}
                      disabled={transcripts.length === 0}
                      className="p-1.5 rounded-lg bg-[#09182E] border border-[#1E3A5F] text-[#94A3B8] hover:text-[#C9A96E] hover:border-[#C9A96E]/50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Copiar toda la transcripción al portapapeles"
                    >
                      {transcriptCopied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>

                    {/* Botón Limpiar */}
                    <button
                      onClick={handleClearTranscripts}
                      disabled={transcripts.length === 0 && !interimText}
                      className="p-1.5 rounded-lg bg-[#09182E] border border-[#1E3A5F] text-[#94A3B8] hover:text-rose-400 hover:border-rose-400/50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Limpiar transcripciones"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Feed de transcripciones */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans bg-[#030712]">
                  {/* Banner discreto de estado cuando IA Box está apagada con contenido previo */}
                  {!isTranscribing && (transcripts.length > 0 || interimText) && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Power size={13} className="text-amber-400 shrink-0" />
                        <span className="font-mono text-[10px]">IA Box pausada (no está transcribiendo en vivo)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTranscribing(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#030712] font-mono text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0 flex items-center gap-1 shadow"
                      >
                        <Power size={10} />
                        <span>Activar</span>
                      </button>
                    </div>
                  )}

                  {transcripts.length === 0 && !interimText && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 shadow-lg transition-all ${isTranscribing ? 'bg-[#09182E] border-[#C9A96E]/40 text-[#C9A96E]' : 'bg-[#09182E]/60 border-slate-700 text-slate-500'}`}>
                        <Sparkles size={24} className={isTranscribing ? 'animate-pulse text-[#C9A96E]' : 'text-slate-500'} />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {isTranscribing ? 'IA Box lista para transcribir' : 'IA Box actualmente apagada'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                        {isTranscribing
                          ? 'Comienza a hablar en tu micrófono o escucha a los participantes. Lo que digan las personas se transcribirá aquí automáticamente en tiempo real.'
                          : 'La transcripción inteligente en tiempo real está desactivada. Puedes activarla usando el botón de arriba o el botón inferior.'}
                      </p>
                      {!isTranscribing && (
                        <button
                          type="button"
                          onClick={() => setIsTranscribing(true)}
                          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#e2c799] text-[#030712] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:shadow-lg transition cursor-pointer shadow-md"
                        >
                          <Power size={13} />
                          <span>Activar IA Box</span>
                        </button>
                      )}
                    </div>
                  )}

                  {transcripts.map((t) => {
                    const isLocalSpeaker = t.speaker === localName || t.speaker.includes(localName);
                    const isSystem = t.speaker.includes('Sistema') || t.speaker.includes('Asistente');

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border transition-all ${isSystem
                          ? 'bg-[#061528]/80 border-cyan-500/40'
                          : isLocalSpeaker
                            ? 'bg-[#08162B] border-[#C9A96E]/40'
                            : 'bg-[#091C35] border-[#1E3A5F]'
                          }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                          <span className={`font-bold flex items-center gap-1.5 ${isSystem
                            ? 'text-cyan-400'
                            : isLocalSpeaker
                              ? 'text-[#C9A96E]'
                              : 'text-sky-300'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLocalSpeaker ? 'bg-[#C9A96E]' : 'bg-sky-400'}`} />
                            {t.speaker} {isLocalSpeaker && '(Tú)'}
                          </span>
                          <span className="text-slate-500">{t.time}</span>
                        </div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed">
                          {t.text}
                        </p>
                      </div>
                    );
                  })}

                  {/* Globo de texto en vivo (Interim/Hablando en este momento) */}
                  {interimText && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#0E2747] to-[#0A1A30] border border-[#C9A96E] shadow-xl space-y-1 animate-pulse">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#C9A96E] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-ping" />
                          {localName} (Hablando en directo...)
                        </span>
                        <span className="text-emerald-400 text-[9px] uppercase tracking-wider font-bold">● Transcribiendo</span>
                      </div>
                      <p className="text-xs text-white italic font-sans leading-relaxed">
                        "{interimText}"
                      </p>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input manual / Dictado de notas para IA Box */}
                <form onSubmit={handleSendManualTranscript} className="p-2.5 bg-[#081528] border-t border-[#1E3A5F]/70 flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Escribir o dictar nota al IA Box..."
                    value={manualTranscriptInput}
                    onChange={(e) => setManualTranscriptInput(e.target.value)}
                    className="flex-1 bg-[#030712] border border-[#1E3A5F] text-white px-3 py-2 rounded-xl outline-none focus:border-[#C9A96E] font-sans text-xs placeholder-slate-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!manualTranscriptInput.trim()}
                    className="p-2 rounded-xl bg-[#C9A96E] hover:bg-[#e2c799] text-[#030712] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                    title="Añadir nota a la transcripción"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: AUDITORÍA DE ACCESOS */}
            {activeTab === 'activity' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    Bitácora de Entradas / Salidas
                  </span>
                  <span className="font-mono text-[10px] text-[#94A3B8]">
                    Sala [{roomId}]
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 bg-[#030712] p-3 rounded-2xl border border-[#1E3A5F]/70">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${log.type === 'join'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {log.type === 'join' ? <LogIn size={14} /> : <LogOut size={14} />}
                        <div>
                          <p className="font-bold">{log.name}</p>
                          <p className="text-[9px] opacity-80">{log.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] opacity-75 font-semibold">{log.time}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: PARTICIPANTES ACTIVOS */}
            {activeTab === 'participants' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} /> Participantes Activos ({allActiveParticipants.length})
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> En vivo
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 bg-[#030712] p-3 rounded-xl border border-[#1E3A5F]/70">
                  {allActiveParticipants.map((p) => (
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
                {allActiveParticipants.length} P. <span className="text-[#C9A96E] text-[10px]">[{roomId}]</span>
              </p>
            </div>
          </div>

          {/* Centro: BOTONES PRINCIPALES DE CONTROL CON ICONOS Y TEXTOS REFINADOS */}
          <div className="flex items-center justify-center gap-1 md:gap-1.5 mx-auto lg:mx-0">

            {/* 1. BOTÓN CÁMARA */}
            <button
              onClick={toggleCamera}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${cameraActive
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
              onClick={toggleMic}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${micActive
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
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${isScreenSharing
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

            <button
              onClick={unlockRemoteAudio}
              className={`py-1 px-2.5 rounded-full border transition-all cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium ${audioUnlocked ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : 'bg-rose-500/20 border-rose-400/50 text-rose-200'}`}
              title="Activar audio de participantes"
            >
              <Volume2 size={13} />
              <span className="hidden md:inline">{audioUnlocked ? 'Audio OK' : 'Activar Audio'}</span>
            </button>

            {/* 4. BOTÓN TRANSCRIBIR (IA BOX) */}
            <button
              onClick={() => {
                const nextState = !isTranscribing;
                setIsTranscribing(nextState);
                if (nextState) {
                  setActiveTab('transcript');
                  setIsSidebarOpen(true);
                }
              }}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${isTranscribing
                ? 'bg-gradient-to-b from-[#D4B579] to-[#C9A96E] text-[#030712] border-white/40 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 backdrop-blur-md'
                }`}
              title="Activar / Desactivar IA Box (Transcripción en tiempo real)"
            >
              <Sparkles size={13} className={isTranscribing ? 'text-[#030712]' : 'text-[#C9A96E]'} />
              <span className="hidden md:inline">{isTranscribing ? 'IA Box Activo' : 'IA Box'}</span>
            </button>

            {/* 4.5. BOTÓN GRABAR REUNIÓN */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${isRecording
                ? 'bg-gradient-to-r from-rose-600 to-red-500 border-rose-400 text-white animate-pulse'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 backdrop-blur-md'
                }`}
              title={isRecording ? 'Detener y Guardar Grabación' : 'Grabar Reunión'}
            >
              <Circle size={12} className={isRecording ? 'text-white fill-white' : 'text-rose-500 fill-rose-500'} />
              <span className="hidden md:inline">{isRecording ? 'REC' : 'Grabar'}</span>
            </button>

            {/* 5. BOTÓN SALIR DE LA REUNIÓN */}
            <button
              onClick={handleLeaveCall}
              className="py-1 px-3 rounded-full bg-gradient-to-b from-rose-500 to-rose-700 hover:from-rose-400 hover:to-rose-600 border border-rose-400/40 text-white font-mono text-[10px] font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              title="Salir de la reunión"
            >
              <PhoneOff size={13} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>

          {/* Lado Derecho: Estado de Conexión */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] text-slate-300/90 bg-white/5 border border-white/15 px-3 py-1 rounded-full backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>{connectionQuality} · WebRTC</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
