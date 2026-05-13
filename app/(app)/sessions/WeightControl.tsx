"use client";

interface WeightControlProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  isBodyweight?: boolean;
  disabled?: boolean;
}

export default function WeightControl({
  value,
  onChange,
  step = 5,
  min = 0,
  isBodyweight = false,
  disabled = false,
}: WeightControlProps) {
  if (isBodyweight) {
    return (
      <span className="text-sm font-medium text-content-secondary px-3 py-1 bg-bg-surface rounded-md border border-border-subtle">
        BW
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={disabled || value <= min}
        className="w-7 h-7 flex items-center justify-center rounded-md text-content-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        aria-label={`Decrease by ${step}`}
      >
        −
      </button>
      <span className="min-w-[52px] text-center text-sm font-semibold text-content-primary">
        {value} lbs
      </span>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        disabled={disabled}
        className="w-7 h-7 flex items-center justify-center rounded-md text-content-secondary border border-border-subtle bg-bg-surface hover:bg-bg-hover hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        aria-label={`Increase by ${step}`}
      >
        +
      </button>
    </div>
  );
}
