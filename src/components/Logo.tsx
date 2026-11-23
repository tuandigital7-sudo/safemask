import React from 'react';

export const SafeMaskLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="none"
    className={className}
    aria-label="SafeMask Logo"
  >
    <defs>
      <linearGradient id="smShield" x1="120" y1="64" x2="392" y2="448" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="55%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="smLock" x1="200" y1="180" x2="312" y2="332" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00E676" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="116" fill="#0E141B" />
    <path
      d="M256 66L402 120V248C402 342 338 414 256 446C174 414 110 342 110 248V120L256 66Z"
      fill="url(#smShield)"
    />
    <path
      d="M256 90L380 136V246C380 326 326 388 256 418C186 388 132 326 132 246V136L256 90Z"
      fill="#0C1117"
    />
    <path
      d="M214 236V208C214 184.8 232.8 166 256 166C279.2 166 298 184.8 298 208V236"
      stroke="url(#smLock)"
      strokeWidth="22"
      strokeLinecap="round"
    />
    <rect x="188" y="232" width="136" height="102" rx="24" fill="url(#smLock)" />
    <circle cx="256" cy="274" r="14" fill="#080A0D" />
    <rect x="249" y="280" width="14" height="28" rx="7" fill="#080A0D" />
  </svg>
);

/** Bespoke minimalist Dark-Emerald visual illustrations for Home tool cards */
export const ToolIllustration: React.FC<{
  kind: 'image' | 'text' | 'pdf' | 'ocr' | 'meta' | 'batch';
}> = ({ kind }) => {
  switch (kind) {
    case 'image':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="6" y="8" width="148" height="72" rx="12" fill="#0D1218" stroke="#222C38" />
          <circle cx="38" cy="34" r="12" fill="#1E293B" />
          <path d="M22 68C25 56 32 52 38 52C44 52 51 56 54 68" fill="#1E293B" />
          <rect x="64" y="24" width="76" height="10" rx="4" fill="#10B981" fillOpacity="0.22" stroke="#10B981" strokeWidth="1.2" />
          <rect x="64" y="42" width="60" height="10" rx="4" fill="#050709" stroke="#34D399" strokeWidth="1.2" />
          <rect x="64" y="58" width="44" height="8" rx="4" fill="#1F2937" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="6" y="8" width="148" height="72" rx="12" fill="#0D1218" stroke="#222C38" />
          <rect x="18" y="22" width="44" height="8" rx="4" fill="#334155" />
          <rect x="68" y="20" width="72" height="12" rx="6" fill="#10B981" fillOpacity="0.22" stroke="#10B981" />
          <rect x="18" y="42" width="62" height="12" rx="6" fill="#10B981" fillOpacity="0.22" stroke="#34D399" />
          <rect x="86" y="44" width="54" height="8" rx="4" fill="#334155" />
          <rect x="18" y="62" width="94" height="8" rx="4" fill="#1E293B" />
        </svg>
      );
    case 'pdf':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="34" y="6" width="92" height="76" rx="10" fill="#121821" stroke="#263242" />
          <rect x="46" y="18" width="40" height="7" rx="3.5" fill="#10B981" />
          <rect x="46" y="33" width="68" height="8" rx="3" fill="#050709" stroke="#10B981" strokeWidth="1.2" />
          <rect x="46" y="48" width="54" height="6" rx="3" fill="#334155" />
          <rect x="46" y="60" width="68" height="10" rx="3" fill="#050709" stroke="#34D399" strokeWidth="1.2" />
        </svg>
      );
    case 'ocr':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="6" y="8" width="148" height="72" rx="12" fill="#0D1218" stroke="#222C38" />
          <path d="M26 24H38M26 24V36M134 24H122M134 24V36M26 64H38M26 64V52M134 64H122M134 64V52" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="44" x2="132" y2="44" stroke="#00E676" strokeWidth="2" strokeDasharray="4 3" />
          <rect x="44" y="30" width="72" height="10" rx="4" fill="#10B981" fillOpacity="0.28" />
          <rect x="52" y="49" width="56" height="9" rx="4" fill="#10B981" fillOpacity="0.18" />
        </svg>
      );
    case 'meta':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="6" y="8" width="148" height="72" rx="12" fill="#0D1218" stroke="#222C38" />
          <circle cx="54" cy="42" r="18" fill="#10B981" fillOpacity="0.14" stroke="#10B981" strokeWidth="1.5" />
          <circle cx="54" cy="40" r="5" fill="#34D399" />
          <line x1="40" y1="56" x2="68" y2="28" stroke="#00E676" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="84" y="28" width="52" height="8" rx="4" fill="#334155" />
          <rect x="84" y="42" width="40" height="8" rx="4" fill="#1E293B" />
          <rect x="84" y="56" width="46" height="8" rx="4" fill="#10B981" fillOpacity="0.3" />
        </svg>
      );
    case 'batch':
      return (
        <svg viewBox="0 0 160 88" className="w-full h-20" fill="none">
          <rect x="20" y="18" width="84" height="56" rx="10" fill="#111822" stroke="#233040" />
          <rect x="38" y="12" width="84" height="56" rx="10" fill="#141C27" stroke="#2B3B4E" />
          <rect x="56" y="22" width="84" height="56" rx="10" fill="#0E141C" stroke="#10B981" strokeWidth="1.5" />
          <rect x="70" y="38" width="54" height="10" rx="4" fill="#10B981" fillOpacity="0.28" />
          <rect x="70" y="54" width="38" height="8" rx="4" fill="#1E293B" />
        </svg>
      );
  }
};
