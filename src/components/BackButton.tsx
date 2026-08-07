import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Si hay historial previo en la misma app, regresa conservando el scroll/hash
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      className="fabric-back-button"
      onClick={handleBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        minHeight: 28,
        whiteSpace: 'nowrap',
        transition: 'color .2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
    >
      <span style={{ fontSize: 14 }}>←</span>
      Volver
    </button>
  );
}
