import React from 'react';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ---------- 按钮 ---------- */

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white border border-ink hover:bg-accent hover:border-accent',
  accent: 'bg-accent text-white border border-accent hover:bg-ink hover:border-ink',
  outline: 'bg-white text-ink border border-ink hover:bg-ink hover:text-white',
  ghost: 'bg-transparent text-ink border border-transparent hover:border-line-strong',
  danger:
    'bg-white text-accent border border-line-strong hover:bg-accent hover:border-accent hover:text-white',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md'
): string {
  return cx(
    'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
    buttonVariants[variant],
    buttonSizes[size]
  );
}

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
> = ({ variant = 'primary', size = 'md', className, type = 'button', ...rest }) => (
  <button type={type} className={cx(buttonClass(variant, size), className)} {...rest} />
);

const iconButtonBase =
  'inline-flex items-center justify-center w-10 h-10 shrink-0 border transition-colors cursor-pointer';

export const iconButtonClass = cx(iconButtonBase, 'text-ink border-line hover:border-ink');

export const iconButtonDangerClass = cx(
  iconButtonBase,
  'text-ink border-line hover:border-accent hover:bg-accent hover:text-white'
);

export const textLinkClass =
  'inline-flex items-center gap-1 text-sm font-semibold underline decoration-1 underline-offset-4 decoration-line-strong hover:text-accent hover:decoration-accent transition-colors';

/* ---------- 表单 ---------- */

const fieldBase =
  'bg-white text-ink border border-line-strong placeholder:text-muted/60 hover:border-ink focus:border-ink focus:shadow-[inset_0_0_0_1px_var(--color-ink)] focus:outline-none transition-colors';

export const inputClass = cx(fieldBase, 'w-full h-11 px-3 text-sm');
export const textareaClass = cx(fieldBase, 'block w-full px-3 py-2.5 text-sm leading-relaxed resize-y');
export const selectClass = cx(fieldBase, 'sf-select w-full h-11 pl-3 text-sm cursor-pointer');
/** 行内小号下拉框，不设宽度，由调用处决定 */
export const selectSmClass = cx(fieldBase, 'sf-select h-9 pl-2.5 text-xs cursor-pointer');

export const Field: React.FC<{
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, hint, className, children }) => (
  <div className={className}>
    <label
      htmlFor={htmlFor}
      className="flex items-baseline justify-between gap-2 mb-1.5 text-xs font-semibold text-ink"
    >
      <span>
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      {hint && <span className="font-normal text-muted">{hint}</span>}
    </label>
    {children}
  </div>
);

export const FormError: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div
      role="alert"
      className="border-l-2 border-accent bg-accent-soft px-3 py-2.5 text-sm text-ink"
    >
      {message}
    </div>
  ) : null;

/* ---------- 标签与进度 ---------- */

export type TagTone = 'default' | 'ink' | 'accent' | 'outline';

const tagTones: Record<TagTone, string> = {
  default: 'bg-canvas text-ink',
  ink: 'bg-ink text-white',
  accent: 'bg-accent text-white',
  outline: 'border border-line-strong text-ink',
};

export const Tag: React.FC<React.HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }> = ({
  tone = 'default',
  className,
  ...rest
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 h-6 px-2 text-[11px] font-semibold whitespace-nowrap',
      tagTones[tone],
      className
    )}
    {...rest}
  />
);

export const ProgressBar: React.FC<{
  value: number | null;
  tone?: 'ink' | 'accent';
  label?: string;
  className?: string;
}> = ({ value, tone = 'ink', label, className }) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={value ?? undefined}
    aria-label={label}
    className={cx('h-1 w-full bg-line', className)}
  >
    <div
      className={cx(
        'h-full transition-[width] duration-300',
        tone === 'accent' ? 'bg-accent' : 'bg-ink'
      )}
      style={{ width: `${value ?? 0}%` }}
    />
  </div>
);
