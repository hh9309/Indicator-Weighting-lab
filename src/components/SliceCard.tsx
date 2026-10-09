import React from 'react';

interface SliceCardProps {
  sliceNumber?: string | number;
  title: string;
  subtitle?: string;
  formulaBadge?: string;
  badgeColor?: 'teal' | 'stone' | 'amber' | 'blue' | 'purple';
  children: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export const SliceCard: React.FC<SliceCardProps> = ({
  sliceNumber,
  title,
  subtitle,
  formulaBadge,
  badgeColor = 'teal',
  children,
  action,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const badgeBg = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  }[badgeColor];

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xs transition-all duration-200 overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {sliceNumber !== undefined && (
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-800 text-xs font-semibold text-stone-100 font-mono shadow-2xs">
              {sliceNumber}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-stone-900 tracking-tight">{title}</h3>
              {formulaBadge && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${badgeBg}`}
                >
                  {formulaBadge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded bg-stone-100/80 transition-colors"
            >
              {isExpanded ? '收起切片' : '展开切片'}
            </button>
          )}
        </div>
      </div>

      {(!collapsible || isExpanded) && <div className="p-5">{children}</div>}
    </div>
  );
};
