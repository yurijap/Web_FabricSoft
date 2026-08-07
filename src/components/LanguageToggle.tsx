import { useI18n } from '../i18n/I18nProvider';

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const compactTextStyle = compact
    ? { fontSize: '12px', letterSpacing: '0.1em' }
    : undefined;

  const buttonBase =
    `relative group font-mono font-semibold uppercase leading-none bg-transparent border-0 p-0 m-0 cursor-pointer transition-colors duration-300 ${
      compact ? 'text-[6px]' : 'text-[10px] tracking-[0.22em]'
    }`;

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`} aria-label="Selector de idioma">
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`${buttonBase} ${lang === 'en' ? 'text-[#C9A96E]' : 'text-[#F5F5F5]/45 hover:text-[#F5F5F5]'}`}
        style={compactTextStyle}
        aria-pressed={lang === 'en'}
      >
        <span className="relative">
          EN
          <span aria-hidden="true" className={`absolute left-0 -bottom-1 h-px w-full bg-[#C9A96E] origin-right transition-transform duration-300 ease-out ${lang === 'en' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
        </span>
      </button>
      <span
        className={`font-mono leading-none ${compact ? 'text-[#C9A96E]/35' : 'text-[10px] text-[#C9A96E]/50'}`}
        style={compactTextStyle}
      >
        |
      </span>
      <button
        type="button"
        onClick={() => setLang('es')}
        className={`${buttonBase} ${lang === 'es' ? 'text-[#C9A96E]' : 'text-[#F5F5F5]/45 hover:text-[#F5F5F5]'}`}
        style={compactTextStyle}
        aria-pressed={lang === 'es'}
      >
        <span className="relative">
          ES
          <span aria-hidden="true" className={`absolute left-0 -bottom-1 h-px w-full bg-[#C9A96E] origin-right transition-transform duration-300 ease-out ${lang === 'es' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
        </span>
      </button>
    </div>
  );
}
