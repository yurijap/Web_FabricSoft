import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import './styles/security.css';

export function SecurityThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  return <button type="button" className="fs-theme-toggle" aria-label={label} title={label}
    onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      toggleTheme({ origin: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } });
    }}>
    {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
  </button>;
}

type SecurityFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  email?: string;
};

export function SecurityFrame({ title, description, children, footer, email }: SecurityFrameProps) {
  return <main className="fs-security">
    <div className="fs-security__topbar">
      <Link to="/" className="fs-security__brand" aria-label="FabricSoft, volver al sitio">
        <img src="/Logo_FabricSoft.webp" alt="FabricSoft" width="168" height="56" />
      </Link>
      <SecurityThemeToggle />
    </div>
    <div className="fs-security__layout">
      <aside className="fs-security__intro">
        <span className="fs-security__eyebrow">Consola FabricSoft</span>
        <h2 className="fs-security__headline">Tu espacio de trabajo.<br /><span>Tu acceso, protegido.</span></h2>
        <p className="fs-security__lead">Un punto de acceso seguro para administrar tu equipo y tu operación.</p>
        <Link to="/" className="fs-security__back"><ArrowLeft size={16} aria-hidden="true" /> Volver al sitio</Link>
      </aside>
      <div className="fs-security__card">
        <div className="fs-security__card-heading">
          <span className="fs-security__icon"><ShieldCheck size={25} aria-hidden="true" /></span>
          <span className="fs-security__badge">Acceso administrativo</span>
        </div>
        <h1 className="fs-security__title">{title}</h1>
        <p className="fs-security__description">{description}</p>
        {email && <div className="fs-security__account"><span className="fs-security__account-dot" aria-hidden="true" /><span>{email}</span></div>}
        <div className="fs-security__body">{children}</div>
        {footer && <div className="fs-security__footer">{footer}</div>}
      </div>
    </div>
    <p className="fs-security__bottom"><ShieldCheck size={14} aria-hidden="true" /> Acceso reservado a personas autorizadas</p>
  </main>;
}

export function SecurityLoading({ message }: { message: string }) {
  return <SecurityFrame title="Preparando tu acceso" description="Estamos comprobando tu sesión y tus permisos.">
    <div className="fs-security__loading" role="status"><LoaderCircle size={22} className="fs-security__spinner" aria-hidden="true" />{message}</div>
  </SecurityFrame>;
}
