import React from 'react';

interface PageBannerProps {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  breadcrumb,
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="bg-[#091527] text-white border-b border-[#132742] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium tracking-wide">
              <span>{breadcrumb}</span>
              {badge && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {badge}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>

            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
