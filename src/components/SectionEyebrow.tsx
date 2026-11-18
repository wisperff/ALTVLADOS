export function SectionEyebrow({ label }: { label: string }) {
  return (
    <p className="section-eyebrow">
      <svg
        className="section-eyebrow-plus"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 2v12M2 8h12" />
      </svg>
      <span className="section-eyebrow-label">{label}</span>
      <span className="section-eyebrow-line" aria-hidden="true" />
    </p>
  );
}
