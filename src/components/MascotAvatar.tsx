import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Upload, Check, Sparkles } from 'lucide-react';

interface MascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showHat?: boolean;
  showGlasses?: boolean;
  expression?: 'normal' | 'happy' | 'thinking' | 'correct' | 'wrong';
  animated?: boolean;
  interactive?: boolean;
}

export const MascotAvatar: React.FC<MascotProps> = ({
  size = 'md',
  className = '',
  expression = 'normal',
  animated = true,
  interactive = false,
}) => {
  const [customImage, setCustomImage] = useState<string | null>(() => {
    return localStorage.getItem('app_mascot_image_url') || null;
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleStorage = () => {
      setCustomImage(localStorage.getItem('app_mascot_image_url') || null);
    };
    const handleOpenUpload = () => {
      setShowUploadModal(true);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('mascot-updated', handleStorage);
    window.addEventListener('open-mascot-upload', handleOpenUpload);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('mascot-updated', handleStorage);
      window.removeEventListener('open-mascot-upload', handleOpenUpload);
    };
  }, []);

  const sizeClasses = {
    xs: 'w-7 h-7 min-w-7 min-h-7',
    sm: 'w-9 h-9 min-w-9 min-h-9',
    md: 'w-12 h-12 min-w-12 min-h-12',
    lg: 'w-16 h-16 min-w-16 min-h-16',
    xl: 'w-24 h-24 min-w-24 min-h-24',
    '2xl': 'w-32 h-32 min-w-32 min-h-32',
  }[size];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          localStorage.setItem('app_mascot_image_url', result);
          setCustomImage(result);
          window.dispatchEvent(new Event('mascot-updated'));
          setShowUploadModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('app_mascot_image_url');
    setCustomImage(null);
    window.dispatchEvent(new Event('mascot-updated'));
    setShowUploadModal(false);
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      <div
        className={`${sizeClasses} rounded-2xl bg-white shadow-xs border border-indigo-100 flex items-center justify-center overflow-hidden transition-transform ${
          animated ? 'hover:scale-105 transition-all duration-200' : ''
        } ${interactive ? 'cursor-pointer' : ''}`}
        onClick={interactive ? () => setShowUploadModal(true) : undefined}
        title={interactive ? 'Clique para ver ou trocar a imagem do mascote' : 'Examinador Sênior Mascote'}
      >
        {customImage ? (
          <img
            src={customImage}
            alt="Mascote Examinador"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Soft Glow */}
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EEF2FF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </radialGradient>
            <rect width="200" height="200" rx="40" fill="url(#bgGlow)" />

            {/* Fluffy Tail */}
            <path
              d="M 30 160 C 15 130 25 110 42 125 C 48 135 48 155 30 160 Z"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="2"
            />

            {/* Left Ear */}
            <path
              d="M 46 82 C 34 42 54 28 68 45 C 75 55 78 72 75 85 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2.5"
            />
            <path
              d="M 52 76 C 45 52 56 42 64 53 C 68 60 70 70 68 78 Z"
              fill="#FBCFE8"
              opacity="0.85"
            />

            {/* Right Ear */}
            <path
              d="M 154 82 C 166 42 146 28 132 45 C 125 55 122 72 125 85 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2.5"
            />
            <path
              d="M 148 76 C 155 52 144 42 136 53 C 132 60 130 70 132 78 Z"
              fill="#FBCFE8"
              opacity="0.85"
            />

            {/* Fluffy Head & Cheeks */}
            <ellipse cx="100" cy="112" rx="55" ry="48" fill="#FFFFFF" />
            <path
              d="M 45 115 C 36 122 36 130 48 134 C 40 138 42 146 54 148 C 66 150 82 154 100 154 C 118 154 134 150 146 148 C 158 146 160 138 152 134 C 164 130 164 122 155 115 Z"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />

            {/* Rosy Blush Cheeks */}
            <ellipse cx="62" cy="126" rx="11" ry="6" fill="#FDA4AF" opacity="0.65" />
            <ellipse cx="138" cy="126" rx="11" ry="6" fill="#FDA4AF" opacity="0.65" />

            {/* Snout Area */}
            <ellipse cx="100" cy="128" rx="22" ry="16" fill="#F8FAFC" />

            {/* Big Expressive Puppy Eyes */}
            {expression === 'wrong' ? (
              // Concentrated/surprised eyes
              <>
                <circle cx="75" cy="108" r="11" fill="#1E293B" />
                <circle cx="78" cy="105" r="3.5" fill="#FFFFFF" />
                <circle cx="125" cy="108" r="11" fill="#1E293B" />
                <circle cx="128" cy="105" r="3.5" fill="#FFFFFF" />
              </>
            ) : expression === 'correct' || expression === 'happy' ? (
              // Joyful curved squinting eyes
              <>
                <path
                  d="M 64 110 Q 75 96 86 110"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 114 110 Q 125 96 136 110"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </>
            ) : (
              // Scholarly bright wide puppy eyes
              <>
                <circle cx="75" cy="108" r="13" fill="#1E1B18" />
                <circle cx="72" cy="104" r="5" fill="#FFFFFF" />
                <circle cx="79" cy="112" r="2.5" fill="#FFFFFF" />
                <circle cx="125" cy="108" r="13" fill="#1E1B18" />
                <circle cx="122" cy="104" r="5" fill="#FFFFFF" />
                <circle cx="129" cy="112" r="2.5" fill="#FFFFFF" />
              </>
            )}

            {/* Cute Nose */}
            <path
              d="M 94 121 C 94 118 106 118 106 121 C 106 125 102 128 100 128 C 98 128 94 125 94 121 Z"
              fill="#27272A"
            />
            <ellipse cx="98" cy="120" rx="2" ry="1" fill="#71717A" opacity="0.8" />

            {/* Smiling Mouth */}
            <path
              d="M 95 128 Q 100 133 105 128"
              fill="none"
              stroke="#3F3F46"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {expression === 'happy' || expression === 'correct' ? (
              <path
                d="M 96 130 Q 100 138 104 130 Z"
                fill="#FB7185"
              />
            ) : null}

            {/* Round Glasses (Óculos redondos de examinador) */}
            {/* Left Lens */}
            <circle
              cx="75"
              cy="108"
              r="22"
              fill="#FFFFFF"
              fillOpacity="0.1"
              stroke="#332219"
              strokeWidth="4"
            />
            {/* Right Lens */}
            <circle
              cx="125"
              cy="108"
              r="22"
              fill="#FFFFFF"
              fillOpacity="0.1"
              stroke="#332219"
              strokeWidth="4"
            />
            {/* Glasses Bridge */}
            <path
              d="M 97 106 Q 100 102 103 106"
              fill="none"
              stroke="#332219"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Temple sides */}
            <path
              d="M 53 106 L 38 103"
              fill="none"
              stroke="#332219"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 147 106 L 162 103"
              fill="none"
              stroke="#332219"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Glasses Glass Glare reflection */}
            <path
              d="M 62 94 L 84 116"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 112 94 L 134 116"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* Graduation Cap / Mortarboard (Capelo de Formatura de Concurso) */}
            <g id="graduation-cap">
              {/* Cap base skullcap */}
              <ellipse cx="100" cy="62" rx="26" ry="10" fill="#1E293B" />
              {/* Diamond Top Cap Board */}
              <polygon
                points="100,24 165,48 100,64 35,48"
                fill="#18181B"
                stroke="#27272A"
                strokeWidth="1.5"
              />
              <polygon
                points="100,25 160,48 100,62 40,48"
                fill="#27272A"
              />
              {/* Cap Center Button */}
              <circle cx="100" cy="46" r="4.5" fill="#EAB308" />

              {/* Gold Tassel ribbon string hanging to right */}
              <path
                d="M 100 46 Q 130 52 142 66"
                fill="none"
                stroke="#CA8A04"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Gold Tassel pendant */}
              <rect x="139" y="65" width="6" height="12" rx="2" fill="#EAB308" />
              <path d="M 139 77 L 136 85 L 148 85 L 145 77 Z" fill="#CA8A04" />
            </g>
          </svg>
        )}
      </div>

      {/* Optional Interactive Edit Button Badge */}
      {interactive && (
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xs border border-white transition-transform hover:scale-110"
          title="Alterar imagem do mascote"
        >
          <Camera className="w-2.5 h-2.5" />
        </button>
      )}

      {/* Mascot Settings / Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Mascote Examinador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm border-2 border-indigo-200 bg-white mb-3">
                {customImage ? (
                  <img
                    src={customImage}
                    alt="Mascote Atual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MascotAvatar size="2xl" animated={false} />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-700">
                Examinador Sênior
              </span>
              <span className="text-[11px] text-slate-500 text-center mt-1">
                Especialista em Lei Seca e Pegadinhas Cebraspe, FGV e FCC
              </span>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mascot-file-upload-input"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Carregar Imagem Original (.jpg / .png)</span>
              </label>
              <input
                id="mascot-file-upload-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {customImage && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restaurar Mascote Padrão</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Você pode carregar a imagem original do mascote que criou a qualquer momento. Ela ficará salva localmente e aplicada em todo o sistema.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MascotAvatar;
