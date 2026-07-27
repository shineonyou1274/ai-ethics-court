// 공문서 결재선 메타포 스테퍼: 접수 → 작성 → 송고 → 심의 (기획안 §11.2)

const STEPS = ['접수', '작성', '송고', '심의'] as const;

export type StepIndex = 0 | 1 | 2 | 3;

export function Stepper({ current }: { current: StepIndex }) {
  return (
    <div className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 sm:gap-2">
          {i > 0 && <div className={`h-px w-4 sm:w-8 ${i <= current ? 'bg-ink' : 'bg-line'}`} />}
          <div
            className={`flex items-center gap-1 border px-2 py-1 ${
              i === current
                ? 'border-ink bg-ink font-bold text-white'
                : i < current
                  ? 'border-ink/60 bg-paper text-ink'
                  : 'border-line bg-card text-faint'
            }`}
          >
            <span className="font-serif">{label}</span>
            {i < current && <span aria-hidden>✓</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
