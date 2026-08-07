"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Shield, 
  Settings, 
  Database, 
  Calendar, 
  TrendingUp, 
  LogOut, 
  Trash2, 
  Save, 
  Search, 
  Info, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Users,
  Eye,
  RefreshCw,
  Sliders,
  Link as LinkIcon,
  Copy,
  Check,
  Send,
  Zap,
  Play,
  CheckSquare,
  AlertCircle,
  Video,
  Menu,
  X,
  Edit,
  Clock,
  ChevronDown
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { api, useAuthApi } from '../../config/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const adminApi = useAuthApi();

  const [syncedUser, setSyncedUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const [meetModalBooking, setMeetModalBooking] = useState<any | null>(null);
  const [meetModalLink, setMeetModalLink] = useState('');
  const [sendingMeet, setSendingMeet] = useState(false);

  // Automatic Meetings States
  const [showAutoMeetingsModal, setShowAutoMeetingsModal] = useState(false);
  const [autoMeetingsEnabled, setAutoMeetingsEnabled] = useState(false);
  const [autoMeetingsConfig, setAutoMeetingsConfig] = useState<any>({
    dailyCount: '3',
    maxCount: '15',
    slotsCount: '5',
    timeRange: '09:00 AM - 05:00 PM CST'
  });

  // Reschedule States
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleSlot, setRescheduleSlot] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'inicio' | 'clientes' | 'reuniones' | 'referencias' | 'logs'>('inicio');
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  // Data States
  const [stats, setStats] = useState<any>({
    totalLeads: 18,
    totalAssessments: 12,
    totalBookings: 8,
    dailyStats: [
      { label: 'Lun', leads: 4, assessments: 6, bookings: 2, total: 12, dateStr: '2026-08-01' },
      { label: 'Mar', leads: 8, assessments: 12, bookings: 4, total: 24, dateStr: '2026-08-02' },
      { label: 'Mié', leads: 6, assessments: 9, bookings: 3, total: 18, dateStr: '2026-08-03' },
      { label: 'Jue', leads: 11, assessments: 16, bookings: 5, total: 32, dateStr: '2026-08-04' },
      { label: 'Vie', leads: 15, assessments: 22, bookings: 8, total: 45, dateStr: '2026-08-05' },
      { label: 'Sáb', leads: 9, assessments: 14, bookings: 5, total: 28, dateStr: '2026-08-06' },
      { label: 'Dom', leads: 18, assessments: 27, bookings: 9, total: 54, dateStr: '2026-08-07' }
    ]
  });

  const [leads, setLeads] = useState<any[]>([
    { _id: '1', name: 'Ing. Roberto Valdez', company: 'APE Plazas', email: 'r.valdez@apeplazas.com', role: 'CFO', createdAt: '2026-08-01' },
    { _id: '2', name: 'Lic. Sofía Macías', company: 'Aplazo', email: 's.macias@aplazo.mx', role: 'Subdirectora', createdAt: '2026-08-03' },
    { _id: '3', name: 'Carlos Mendoza', company: 'Banorte', email: 'c.mendoza@banorte.com', role: 'CIO', createdAt: '2026-08-05' }
  ]);

  const [assessments, setAssessments] = useState<any[]>([
    { _id: 'a1', name: 'Roberto Valdez', company: 'APE Plazas', email: 'r.valdez@apeplazas.com', score: 85, risk: 'Bajo', createdAt: '2026-08-02' },
    { _id: 'a2', name: 'Sofía Macías', company: 'Aplazo', email: 's.macias@aplazo.mx', score: 62, risk: 'Medio', createdAt: '2026-08-04' }
  ]);

  const [evidenceRequests, setEvidenceRequests] = useState<any[]>([
    { _id: 'e1', name: 'Roberto Valdez', company: 'APE Plazas', email: 'r.valdez@apeplazas.com', docName: 'Acta_GoLive_APE_Plazas.pdf' }
  ]);

  const [bookings, setBookings] = useState<any[]>([
    { _id: 'b1', name: 'Ing. Roberto Valdez', company: 'APE Plazas', role: 'CFO', email: 'r.valdez@apeplazas.com', date: '2026-08-10', timeSlot: '10:00 AM', meetLink: 'https://fabricsoft.com.mx/meet/ape-plazas' },
    { _id: 'b2', name: 'Lic. Sofía Macías', company: 'Aplazo', role: 'Subdirectora', email: 's.macias@aplazo.mx', date: '2026-08-12', timeSlot: '04:30 PM', meetLink: 'https://fabricsoft.com.mx/meet/aplazo-session' }
  ]);

  useEffect(() => {
    setSyncedUser({
      email: user?.primaryEmailAddress?.emailAddress || 'admin@fabricsoft.com.mx',
      name: user?.fullName || 'Operador Principal',
      role: 'admin'
    });

    refreshData();
    setLoading(false);
  }, [user]);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function refreshData() {
    setRefreshing(true);
    try {
      const leadsRes = await adminApi.get('/leads/admin').catch(() => null);
      if (leadsRes?.data?.data && Array.isArray(leadsRes.data.data)) {
        setLeads(leadsRes.data.data);
      }

      const officeRes = await adminApi.get('/office-hours/admin').catch(() => null);
      if (officeRes?.data?.data && Array.isArray(officeRes.data.data)) {
        setBookings(officeRes.data.data);
      }
    } catch (e) {
      // Fallback local activo
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="bg-white text-slate-900 min-h-screen flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
          <span className="text-slate-500 tracking-wider">CARGANDO MESA DE CONTROL...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans text-xs flex flex-col relative overflow-x-hidden bg-white text-slate-900 w-full"
      style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 p-4 border border-slate-200 bg-white shadow-2xl text-xs max-w-sm rounded-2xl">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
          <span className="text-slate-900 font-bold font-mono">{toast.message}</span>
        </div>
      )}

      {/* HEADER NAVBAR (100% BLANCO) */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 border border-slate-200 hover:border-blue-600 text-slate-600 hover:text-blue-600 rounded-xl transition-all cursor-pointer mr-1"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 text-slate-900 font-bold text-lg">
            <img src="/Logo_FabricSoft.webp" alt="FABRIC" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-slate-900 text-base">Consola Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => refreshData()}
            disabled={refreshing}
            className="p-2 border border-slate-200 hover:border-blue-600 text-slate-600 hover:text-blue-600 rounded-xl transition-all duration-350 cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 border border-slate-200 hover:border-blue-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-300 cursor-pointer text-left focus:outline-none"
            >
              <div className="w-6 h-6 rounded-full border border-blue-400 bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold uppercase font-mono">
                {(user?.fullName || 'OP')[0]}
              </div>
              
              <div className="hidden sm:block text-[9px] font-bold leading-tight">
                <div className="text-slate-900 truncate max-w-[120px]">{user?.fullName || 'Operador'}</div>
                <div className="text-slate-500 text-[8px] truncate max-w-[120px] font-mono">{user?.primaryEmailAddress?.emailAddress || 'admin@fabricsoft.com.mx'}</div>
              </div>
              
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-64 border border-slate-200 bg-white rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 text-[10px]">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full border border-blue-400 bg-blue-50 flex items-center justify-center text-xs text-blue-600 font-bold uppercase font-mono">
                    {(user?.fullName || 'OP')[0]}
                  </div>
                  <div className="space-y-0.5 leading-none">
                    <div className="text-slate-900 font-bold text-xs">{user?.fullName || 'Operador'}</div>
                    <div className="text-slate-500 font-mono text-[9px] break-all">{user?.primaryEmailAddress?.emailAddress || 'admin@fabricsoft.com.mx'}</div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE
                  </div>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2 text-[10px] font-bold text-red-600 rounded-xl transition-colors uppercase cursor-pointer font-mono"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Salir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE (100% BLANCO) */}
      <div className="flex-1 flex flex-col md:flex-row z-10">
        <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 space-y-2 md:space-y-4 transition-all duration-300 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 hidden md:block select-none font-mono">Módulos del Sistema</p>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'inicio', label: 'Inicio General', icon: TrendingUp },
              { id: 'clientes', label: 'Leads & Aplicaciones', icon: Users },
              { id: 'reuniones', label: 'Office Hours & Citas', icon: Calendar },
              { id: 'referencias', label: 'Referencias NDA', icon: Shield },
              { id: 'logs', label: 'Logs del Sistema', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-3 w-full text-left shrink-0 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Pane (100% BLANCO) */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-50" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
          {activeTab === 'inicio' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
                <div>
                  <h2 className="text-lg font-serif text-slate-900 font-bold">Panel General de Telemetría</h2>
                  <p className="text-slate-500 text-[10px]">Monitoreo en vivo de admisiones, diagnósticos y reuniones.</p>
                </div>
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono">Consola Central</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { title: "Leads Registrados", val: leads.length, desc: "Formularios de admisión", color: "bg-white border-slate-200 text-slate-900" },
                  { title: "Diagnósticos de Riesgo", val: assessments.length, desc: "Evaluaciones ejecutadas", color: "bg-white border-slate-200 text-slate-900" },
                  { title: "Citas Programadas", val: bookings.length, desc: "Sesiones Office Hours agendadas", color: "bg-white border-slate-200 text-slate-900" }
                ].map((card, idx) => (
                  <div key={idx} className={`border p-5 space-y-2 rounded-2xl shadow-xs ${card.color}`}>
                    <span className="text-slate-500 uppercase block font-bold text-[9px] tracking-wider font-mono">{card.title}</span>
                    <div className="text-3xl font-serif font-bold text-slate-900 flex items-center justify-between">
                      {card.val}
                      <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-500">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Leads y Prospectos Registrados
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 font-mono">Nombre</th>
                      <th className="pb-2 font-mono">Empresa</th>
                      <th className="pb-2 font-mono">Email</th>
                      <th className="pb-2 font-mono">Cargo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((l) => (
                      <tr key={l._id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{l.name}</td>
                        <td className="py-2.5 text-slate-700">{l.company}</td>
                        <td className="py-2.5 text-slate-600 font-mono">{l.email}</td>
                        <td className="py-2.5 text-slate-600">{l.role || 'Ejecutivo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reuniones' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Citas y Sesiones de Office Hours
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 font-mono">Cliente</th>
                      <th className="pb-2 font-mono">Fecha</th>
                      <th className="pb-2 font-mono">Hora</th>
                      <th className="pb-2 font-mono">Google Meet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold text-slate-900">{b.name} <span className="block text-[10px] font-normal text-slate-500">{b.company}</span></td>
                        <td className="py-2.5 text-slate-700 font-mono">{b.date}</td>
                        <td className="py-2.5 text-slate-700 font-mono">{b.timeSlot}</td>
                        <td className="py-2.5 text-blue-600 font-mono underline">{b.meetLink || 'meet.google.com/fabric'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'referencias' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> Solicitudes de Evidencia y Referencias NDA
              </h3>
              <div className="space-y-3">
                {evidenceRequests.map((req) => (
                  <div key={req._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 block">{req.name} — {req.company}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{req.email} · Documento: {req.docName}</span>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold font-mono">Procesado</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" /> Registros de Telemetría del Sistema
              </h3>
              <div className="space-y-2 font-mono text-xs">
                {[
                  { text: 'Conexión a base de datos de telemetría activa', time: '10:32:12' },
                  { text: 'Sesión asignada a Ing. Roberto Valdez', time: '10:28:04' },
                  { text: 'Evidencia NDA enviada a APE Plazas', time: '10:15:44' }
                ].map((log, i) => (
                  <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="text-slate-900">{log.text}</span>
                    <span className="text-slate-400 text-[10px]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
