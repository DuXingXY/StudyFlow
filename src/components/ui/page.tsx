import React from 'react';
import { cx } from './primitives';

/**
 * 页面标题：粗黑顶线 + 大号编号 + 标题，12 栏网格中编号占 2 栏，正文从第 3 栏起排。
 */
export const PageHeader: React.FC<{
  index: string;
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ index, title, description, meta, actions }) => (
  <header className="border-t-4 border-ink pt-5 sm:pt-6 pb-8 sm:pb-12 grid grid-cols-12 gap-x-4 sm:gap-x-6 gap-y-4">
    <div className="col-span-12 sm:col-span-2 text-2xl sm:text-5xl font-bold leading-none tracking-tight tabular-nums">
      {index}
    </div>
    <div className="col-span-12 sm:col-span-10 lg:col-span-7 min-w-0">
      <h1 className="text-3xl sm:text-[44px] font-bold leading-[1.1] tracking-tight break-words">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted leading-relaxed">
          {description}
        </p>
      )}
      {meta && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          {meta}
        </div>
      )}
    </div>
    {actions && (
      <div className="col-span-12 sm:col-span-10 sm:col-start-3 lg:col-span-3 lg:col-start-10 flex flex-wrap items-start lg:justify-end gap-2">
        {actions}
      </div>
    )}
  </header>
);

/** 区块：黑色顶线 + 标题行，内容直接排在白底上，不再套边框卡片。 */
export const Section: React.FC<{
  title: string;
  index?: string;
  tag?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ title, index, tag, actions, className, children }) => (
  <section className={cx('border-t-2 border-ink', className)}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 py-3">
      <h2 className="flex items-baseline gap-3 text-base font-bold">
        {index && <span className="tabular-nums text-muted font-semibold">{index}</span>}
        <span>{title}</span>
        {tag && <span className="text-[11px] font-normal text-muted">{tag}</span>}
      </h2>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
    {children}
  </section>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** 紧跟在已有分隔线（如分段筛选条）下方时设为 false */
  rule?: boolean;
  className?: string;
}> = ({ title, description, action, rule = true, className }) => (
  <div className={cx(rule && 'border-t border-line', 'py-10 sm:py-14', className)}>
    <div className="max-w-md">
      <p className="text-lg font-bold">{title}</p>
      {description && <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  </div>
);

/** 大号数字指标；alert 时顶线与数字改为信号红。 */
export const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tag?: string;
  alert?: boolean;
}> = ({ label, value, note, tag, alert }) => (
  <div className={cx('pt-3 pb-6', alert ? 'border-t-2 border-accent' : 'border-t border-ink')}>
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className={alert ? 'text-accent font-semibold' : 'text-ink font-semibold'}>{label}</span>
      {tag && <span className="text-[11px] text-muted">{tag}</span>}
    </div>
    <div
      className={cx(
        'mt-4 text-5xl sm:text-6xl font-bold leading-none tracking-tight tabular-nums',
        alert && 'text-accent'
      )}
    >
      {value}
    </div>
    {note && <div className="mt-3 text-xs text-muted leading-relaxed">{note}</div>}
  </div>
);

export const MetaItem: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <span className="inline-flex items-baseline gap-1.5">
    <span>{label}</span>
    <span className="text-ink font-semibold tabular-nums">{children}</span>
  </span>
);
