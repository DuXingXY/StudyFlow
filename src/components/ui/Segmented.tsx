import { cx } from './primitives';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  count?: number;
  /** 数量大于 0 时以信号红显示（例如逾期） */
  alert?: boolean;
}

/** 下划线式分段筛选；窄屏横向滚动而不折行。 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (key: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'sf-scroll-x flex overflow-x-auto shadow-[inset_0_-1px_0_var(--color-line)]',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        const alert = opt.alert && (opt.count ?? 0) > 0;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.key)}
            className={cx(
              'shrink-0 h-11 px-3 sm:px-4 first:pl-0 flex items-center gap-1.5 text-sm whitespace-nowrap border-b-2 cursor-pointer transition-colors',
              active
                ? 'border-ink text-ink font-bold'
                : 'border-transparent text-muted hover:text-ink'
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cx(
                  'tabular-nums text-xs',
                  alert ? 'text-accent font-bold' : active ? 'text-ink' : 'text-muted'
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
