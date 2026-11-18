type BrandMarkProps = {
  className?: string;
  decorative?: boolean;
};

/** The factory A: a red stencil, an eye in the horn, and a bass cabinet. */
export function BrandMark({ className, decorative = true }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Altzavod / Altfactory — колонка с глазом"}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <path d="m155 31 27 14 48 161h-23Z" fill="var(--brand-secondary, #d4d4d8)" opacity=".4" />
      <path d="m155 31 52 175H75Z" fill="var(--page-bg, #09090b)" />
      <path d="m159 45 44 153H88l26-57h70m-70-14 32-70h10l21 70Z" stroke="var(--brand-secondary, #d4d4d8)" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M4 206 90 31h30L34 206ZM81 129l44-89h27l-44 89Zm-7 15h27l-30 62H44Z" fill="var(--brand-primary, #dc2626)" />
      <path d="m153 50 2 9m-16-3 4 8m-19 2 7 6m-17 7 9 3m-14 10 10 1m48-37-3 8m17 2-6 7m15 7-9 3m12 11-9-1" stroke="var(--text-primary, #f4f4f5)" strokeWidth="3" strokeLinecap="square" />
      <path d="M122 96q24-28 49 0-25 24-49 0Z" fill="var(--text-primary, #f4f4f5)" />
      <path d="m123 96 16 1m17-2 14-2" stroke="var(--page-bg, #09090b)" strokeWidth="2" />
      <circle cx="147" cy="95" r="10" fill="var(--page-bg, #09090b)" />
      <circle cx="150" cy="92" r="2.5" fill="var(--text-primary, #f4f4f5)" />
      <path d="m129 113-5 6m18-5-1 7m15-9 3 7m7-9 6 5" stroke="var(--text-primary, #f4f4f5)" strokeWidth="2.5" />
      <circle cx="145" cy="164" r="30" fill="var(--brand-secondary, #d4d4d8)" opacity=".45" />
      <circle cx="145" cy="164" r="25" fill="var(--page-bg, #09090b)" />
      <path d="M122 166q23 25 46 0a25 25 0 0 1-46 0Z" fill="var(--brand-secondary, #d4d4d8)" opacity=".65" />
      <circle cx="145" cy="164" r="10" fill="var(--brand-secondary, #d4d4d8)" />
      <path d="m181 53 38 128-12-12ZM93 190h8m83 0h8" stroke="var(--text-primary, #f4f4f5)" strokeOpacity=".28" strokeWidth="2" />
      <path d="m69 124 11-2m17-54 6-1m-49 99 8-1" stroke="var(--page-bg, #09090b)" strokeWidth="2" />
    </svg>
  );
}
