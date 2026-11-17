import type { CSSProperties } from 'react';

export type IconName =
  | 'arrowUpRight'
  | 'arrowRight'
  | 'arrowDown'
  | 'close'
  | 'menu'
  | 'pin'
  | 'sound'
  | 'spark'
  | 'people'
  | 'ticket'
  | 'plus'
  | 'mail'
  | 'download';

const paths: Record<IconName, string> = {
  arrowUpRight: 'M5 19 19 5M5 5h14v14',
  arrowRight: 'M4 12h16m-7-7 7 7-7 7',
  arrowDown: 'M12 4v16m-7-7 7 7 7-7',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 7h16M4 17h16',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  sound: 'M3 9v6h4l5 4V5L7 9H3Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',
  spark: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4V5Zm12 0v3m0 3v2m0 3v3',
  plus: 'M12 4v16M4 12h16',
  mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
};

export function Icon({
  name,
  className = '',
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
