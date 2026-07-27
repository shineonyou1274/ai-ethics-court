interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
}

/** 게시물 4자리 PIN 입력 (기획안 R16) */
export function PinInput({ value, onChange, disabled, label = 'PIN (4자리 숫자)' }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        disabled={disabled}
        inputMode="numeric"
        placeholder="0000"
        className="w-28 border border-line bg-card px-3 py-2 text-center font-mono text-lg tracking-[0.4em] focus:border-ink focus:outline-none disabled:bg-paper"
      />
      <span className="ml-2 text-xs text-faint">제출 후 수정할 때 필요해요. 꼭 기억하세요.</span>
    </label>
  );
}
