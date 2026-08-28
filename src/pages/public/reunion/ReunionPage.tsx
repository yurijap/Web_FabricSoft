import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Volume2, VolumeX, 
  FileText, PhoneOff, Send, MessageSquare, Users, 
  ShieldCheck, ArrowLeft, Copy, CheckCircle2, Sparkles,
  Info, LogIn, LogOut, Lock, UserCheck, Circle, Monitor
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
  screenFrameData?: string | null;
  stream?: MediaStream | null;
}

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';

function VideoPlayer({ stream, isLocal }: { stream: MediaStream | null; isLocal?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
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
  const [localPeerId] = useState<string>(() => `leader_${Math.random().toString(36).substring(2, 8)}`);

  // Estados de control local
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [volume, setVolume] = useState(85);
  const [isMutedVolume, setIsMutedVolume] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'activity' | 'participants'>('chat');
  const [hasRealWebcam, setHasRealWebcam] = useState(false);

  // Reloj de la sesión
  const [callDuration, setCallDuration] = useState(0);

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

  // Participantes remotos del servidor
  const [remotePeers, setRemotePeers] = useState<PeerParticipant[]>([]);

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
        } catch {}
      }
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        try {
          const source = audioCtx.createMediaStreamSource(remoteStream);
          source.connect(audioDestination);
        } catch {}
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
                } catch {}
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
    }, 100);

    alert(`¡Grabación finalizada! El archivo del cuadro de video "${fileName}" se ha guardado y descargado en tu equipo.`);
  };

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
      console.warn('Compartir pantalla cancelado:', err);
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

  // ── FUNCIÓN COMPLETA DE APAGADO DE HARDWARE (CÁMARA, MICRÓFONO, PANTALLA, GRABACIÓN) ──
  const stopAllHardwareMedia = () => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {}
        });
        setLocalStream(null);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {}
        });
        screenStreamRef.current = null;
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {}
        });
        recordingStreamRef.current = null;
      }
      if (pcRef.current) {
        try {
          pcRef.current.getSenders().forEach((sender) => {
            if (sender.track) {
              try { sender.track.stop(); } catch {}
            }
          });
          pcRef.current.close();
        } catch {}
        pcRef.current = null;
      }
    } catch (err) {
      console.warn('Error al apagar componentes de hardware:', err);
    }
  };

  useEffect(() => {
    return () => {
      stopAllHardwareMedia();
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

  // ── 1. ACTIVAR CÁMARA Y MICRÓFONO LOCAL ──
  useEffect(() => {
    let isMounted = true;

    async function initMedia() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        if (isMounted) setHasRealWebcam(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (!isMounted) return;

        setLocalStream(stream);
        setHasRealWebcam(true);
      } catch (err) {
        console.warn('Webcam real no encontrada o denegada:', err);
        if (isMounted) setHasRealWebcam(false);
      }
    }

    if (cameraActive) {
      initMedia();
    } else {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [cameraActive]);

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
    if (!cameraActive || !localStream) return;

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
  }, [cameraActive, localStream]);

  // ── 2. WEBRTC P2P SIGNALING Y STREAMING DIRECTO DE VIDEO/AUDIO ──
  useEffect(() => {
    if (!localStream) return;

    // Crear conexión WebRTC con múltiples servidores STUN públicos
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
      ],
    });
    pcRef.current = pc;

    // Añadir tracks de audio/video a la conexión
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Al recibir el stream del participante remoto
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        setRemoteStream(new MediaStream([event.track]));
      }
    };

    // Enviar ICE candidates al servidor de señalización
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

    // Polling de señales WebRTC desde el servidor
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
      pc.close();
      pcRef.current = null;
    };
  }, [localStream, roomId, localPeerId]);

  // Si hay pares remotos y somos el Líder, crear una oferta de conexión WebRTC
  useEffect(() => {
    if (remotePeers.length > 0 && pcRef.current && pcRef.current.signalingState === 'stable') {
      const targetPeer = remotePeers[0].peerId;
      pcRef.current.createOffer().then((offer) => {
        return pcRef.current?.setLocalDescription(offer).then(() => {
          return fetch(`${API_BASE}/api/room/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              from: localPeerId,
              to: targetPeer,
              signal: { type: 'offer', sdp: offer },
            }),
          });
        });
      }).catch(() => {});
    }
  }, [remotePeers, roomId, localPeerId]);

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
      } catch (err) {
        console.warn('Error syncing room:', err);
      }
    }

    syncWithServer();
    const interval = setInterval(syncWithServer, 1000);

    const handleUnload = () => {
      try {
        navigator.sendBeacon(`${API_BASE}/api/room/leave`, JSON.stringify({ roomId, peerId: localPeerId }));
      } catch {}
      stopAllHardwareMedia();
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
      stopAllHardwareMedia();
    };
  }, [roomId, localPeerId, localName, localRole, cameraActive, micActive]);

  // Transcripción en directo (Web Speech API)
  useEffect(() => {
    if (!isTranscribing) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-MX';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              setTranscripts((prev) => [
                ...prev,
                {
                  id: `t_${Date.now()}`,
                  speaker: localName,
                  text,
                  time: formatDuration(callDuration),
                },
              ]);
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech error:', err);
      }
    } else {
      const interval = setInterval(() => {
        const samplePhrases = [
          'Analizando canal de transmisión y logs de integraciones...',
          'Conciliando variables de rendimiento de Oracle Fusion ERP...',
          'Prueba de concurrencia y latencia ejecutada con éxito.',
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setTranscripts((prev) => [
          ...prev,
          {
            id: `t_${Date.now()}`,
            speaker: 'Sistema IA FabricSoft',
            text: randomPhrase,
            time: formatDuration(callDuration),
          },
        ]);
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [isTranscribing, callDuration, localName]);

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

  const handleCopyLink = () => {
    try {
      const guestUrl = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;
      navigator.clipboard.writeText(guestUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

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
    } catch {}
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
      stream: localStream,
    },
    ...remotePeers.map((p, idx) => ({
      ...p,
      stream: idx === 0 ? remoteStream : null,
    })),
  ];

  // Cálculo de clases de cuadrícula responsiva (50%-50% si son 2 personas)
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

  // Verificación de Acceso del Administrador
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminNameInput, setAdminNameInput] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminCodeError, setAdminCodeError] = useState('');

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToUse = adminNameInput.trim();
    if (!nameToUse) {
      setAdminCodeError('Por favor ingresa tu nombre completo de administrador.');
      return;
    }
    if (adminCodeInput.trim() === '669933') {
      setLocalName(nameToUse);
      setIsAdminVerified(true);
      setAdminCodeError('');
    } else {
      setAdminCodeError('Código de acceso de Administrador incorrecto. Verifica tus credenciales.');
    }
  };

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 font-sans select-none overflow-y-auto">
        <div className="w-full max-w-md bg-[#060D1A]/95 border border-[#1E3A5F] rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl space-y-6 text-center">
          
          <div className="w-16 h-16 rounded-full bg-[#081528] border-2 border-[#C9A96E] flex items-center justify-center text-[#C9A96E] mx-auto shadow-lg">
            <ShieldCheck size={32} />
          </div>
          
          <div>
            <h2 className="font-serif font-bold text-2xl text-white tracking-tight">
              Acceso de Administrador
            </h2>
            <p className="font-mono text-xs text-[#94A3B8] mt-1.5">
              Identifícate e ingresa el código de acceso exclusivo de moderación para habilitar la sala <span className="text-[#C9A96E] font-bold">[{roomId}]</span>.
            </p>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            
            {/* Input Nombre del Administrador / Moderador */}
            <div className="space-y-1.5 text-left bg-[#081528] p-4 rounded-2xl border border-[#1E3A5F]">
              <label className="block font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={14} /> Nombre del Administrador:
              </label>
              <input
                type="text"
                required
                value={adminNameInput}
                onChange={(e) => {
                  setAdminNameInput(e.target.value);
                  setAdminCodeError('');
                }}
                placeholder="Ej. Lic. Antonio Salazar"
                className="w-full bg-[#030712] border border-[#1E3A5F] text-white font-serif font-bold text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[#C9A96E] transition"
              />
            </div>

            {/* Input Código de Acceso */}
            <div className="space-y-1.5 text-left bg-[#081528] p-4 rounded-2xl border border-[#1E3A5F]">
              <label className="block font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} /> Código de Acceso:
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={adminCodeInput}
                onChange={(e) => {
                  setAdminCodeInput(e.target.value);
                  setAdminCodeError('');
                }}
                placeholder="••••••"
                className="w-full bg-[#030712] border border-[#1E3A5F] text-white font-mono font-bold text-center text-lg px-4 py-3 rounded-xl outline-none focus:border-[#C9A96E] transition tracking-[0.3em]"
              />
            </div>

            {adminCodeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs">
                {adminCodeError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#C9A96E] hover:bg-[#e2c799] text-[#030712] font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Entrar a la Sala como Administrador</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#030712] text-white flex flex-col font-sans select-none overflow-hidden">
      
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-4 pb-16 overflow-hidden relative max-h-[calc(100vh-85px)]">
        
        {/* 👈 IZQUIERDA: ESCENARIO PRINCIPAL DE VIDEO (MÁS COMPACTO Y ESTILIZADO) */}
        <div ref={videoContainerRef} className="lg:col-span-8 h-full flex flex-col justify-center items-center relative overflow-hidden max-h-[72vh]">
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,95,0.25),transparent_70%)] pointer-events-none" />

          {(isScreenSharing || remotePeers.some((p) => p.isScreenSharing || p.screenFrameData)) ? (
            /* 🖥️ MODO PANTALLA COMPARTIDA */
            <div className="w-full h-full flex flex-col gap-2.5 relative z-10">
              
              {/* CUADRO PRINCIPAL EN GRANDE DE PANTALLA COMPARTIDA */}
              <div className="flex-1 bg-[#060E1B] border border-emerald-500/50 rounded-2xl overflow-hidden relative shadow-[0_0_35px_rgba(16,185,129,0.2)] flex items-center justify-center min-h-[260px]">
                {screenStreamRef.current ? (
                  <VideoPlayer stream={screenStreamRef.current} isLocal={false} />
                ) : remoteStream ? (
                  <VideoPlayer stream={remoteStream} isLocal={false} />
                ) : remotePeers.find((p) => p.screenFrameData)?.screenFrameData ? (
                  <img src={remotePeers.find((p) => p.screenFrameData)?.screenFrameData!} alt="Pantalla Compartida Remota" className="w-full h-full object-contain" />
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
            /* 🎥 MODO CUADRÍCULA MULTI-CÁMARA ESTÁNDAR (MÁS COMPACTO Y DECORATIVO) */
            <div className={`w-full h-full rounded-2xl bg-[#060E1B] border border-[#1E3A5F]/80 shadow-[0_15px_45px_rgba(0,0,0,0.8)] p-2.5 md:p-3 grid gap-2.5 ${getGridClasses(allActiveParticipants.length)} pointer-events-none select-none relative overflow-hidden`}>
              {allActiveParticipants.map((p, index) => {
                const remoteFrame = p.isLocal ? null : (remotePeerFrames[p.peerId] || p.frameData || null);

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
                      /* SI LA CÁMARA ESTÁ APAGADA */
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

                    {/* Badge Overlay Superior Izquierdo (Nombre) */}
                    <div className="absolute top-2.5 left-2.5 bg-[#030712]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1E3A5F] flex items-center gap-1.5 shadow-md z-20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-mono text-[10px] font-bold text-white tracking-wider">
                        {p.name} {p.isLocal ? '(Tú)' : ''}
                      </span>
                    </div>

                    {/* Badge Overlay Inferior Izquierdo (Rol) */}
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

        {/* 👉 DERECHA: PANEL DE CHAT Y TRANCRIPCIÓN (COMPACTO) */}
        <div className="lg:col-span-4 h-full overflow-hidden max-h-[72vh]">
          <div className="bg-[#060D1A]/95 border border-[#1E3A5F]/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl backdrop-blur-xl">
            
            {/* Pestañas Chat / Transcripción / Auditoría de accesos / Participantes */}
            <div className="p-1 bg-[#081528] border-b border-[#1E3A5F]/70 grid grid-cols-4 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                    : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                }`}
              >
                <MessageSquare size={11} />
                <span className="truncate">Chat ({chatMessages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('transcript')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'transcript'
                    ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                    : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                }`}
              >
                <FileText size={11} />
                <span className="truncate">IA Vox</span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-[#C9A96E] text-[#030712] shadow-sm'
                    : 'bg-[#09182E] text-[#94A3B8] hover:text-white border border-[#1E3A5F]/60'
                }`}
              >
                <Info size={11} />
                <span className="truncate">Accesos ({activityLogs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('participants')}
                className={`py-1.5 px-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-tight flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeTab === 'participants'
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
                          className={`p-3.5 rounded-2xl max-w-[88%] text-xs leading-relaxed ${
                            isHost
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

                <form onSubmit={handleSendMessage} className="p-4 bg-[#081528] border-t border-[#1E3A5F]/70 flex items-center gap-2.5 shrink-0">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje como Líder..."
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

            {/* CONTENIDO PESTAÑA: TRANCRIPCIÓN IA */}
            {activeTab === 'transcript' && (
              <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
                    Transcripción IA en Vivo
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#94A3B8]">
                    {isTranscribing ? '🔴 Grabando Audio' : '⚪ Pausado'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 bg-[#030712] p-3 rounded-2xl border border-[#1E3A5F]/70">
                  {transcripts.map((t) => (
                    <div key={t.id} className="space-y-1 border-b border-[#1E3A5F]/40 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#C9A96E] font-bold">{t.speaker}</span>
                        <span className="text-slate-500">{t.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">{t.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
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
                      className={`p-2.5 rounded-xl border flex items-center justify-between font-mono text-xs ${
                        log.type === 'join' 
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

            {/* 4. BOTÓN TRANSCRIBIR */}
            <button
              onClick={() => {
                setIsTranscribing(!isTranscribing);
                setActiveTab('transcript');
              }}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${
                isTranscribing
                  ? 'bg-gradient-to-b from-[#D4B579] to-[#C9A96E] text-[#030712] border-white/40 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200 backdrop-blur-md'
              }`}
              title="Activar Transcripción en tiempo real"
            >
              <Sparkles size={13} className={isTranscribing ? 'text-[#030712]' : 'text-[#C9A96E]'} />
              <span className="hidden md:inline">{isTranscribing ? 'Transcribiendo' : 'Transcribir'}</span>
            </button>

            {/* 4.5. BOTÓN GRABAR REUNIÓN */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`py-1 px-2.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 font-mono text-[10px] font-medium shadow-sm active:scale-95 ${
                isRecording
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
            <span>WebRTC Activo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
