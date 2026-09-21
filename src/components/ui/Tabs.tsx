import { useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface TabDef {
  key: string;
  label: ReactNode;
  count?: number;
}

/** Tabs, deren Zustand in der URL steht – dadurch sind Deep-Links möglich */
export function Tabs({ tabs, param = 'tab' }: { tabs: TabDef[]; param?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get(param) ?? tabs[0]?.key;

  return (
    // Mobil: bis an den Bildschirmrand, damit sichtbar ist, dass die Leiste wischbar ist
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line mobile:-mx-4 mobile:px-4 mobile:[scrollbar-width:none]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={(event) => {
            event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
            const next = new URLSearchParams(searchParams);
            next.set(param, tab.key);
            setSearchParams(next, { replace: true });
          }}
          className={cn(
            '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors',
            active === tab.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[0.65rem]', active === tab.key ? 'bg-brand/20' : 'bg-elevated')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function useActiveTab(tabs: TabDef[], param = 'tab'): string {
  const [searchParams] = useSearchParams();
  const value = searchParams.get(param);
  return value && tabs.some((t) => t.key === value) ? value : tabs[0]?.key ?? '';
}
