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
      <svg
        className="section-eyebrow-ray"
        width="24"
        height="14"
        viewBox="0 0 28 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M2 14 14 2M8 14 20 2M14 14 26 2" />
      </svg>
    </p>
  );
}
