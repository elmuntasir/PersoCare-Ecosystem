type PulseLineProps = {
  className?: string;
};

/**
 * The platform's one signature visual motif — a traced ECG-style pulse.
 * Used once in the landing hero, and once more as a quiet section divider.
 * Do not scatter this further; its impact depends on restraint.
 */
export function PulseLine({ className = "" }: PulseLineProps) {
  return (
    <svg
      viewBox="0 0 1200 120"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="pulse-line"
        d="M0,60 L280,60 L320,20 L360,100 L400,40 L440,60 L520,60
           L560,60 L600,10 L640,110 L680,60 L760,60
           L800,60 L840,30 L880,90 L920,60 L1200,60"
      />
    </svg>
  );
}
