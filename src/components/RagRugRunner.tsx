import { useId } from "react";

type RagRugRunnerProps = { className?: string; orientation?: "vertical" | "horizontal" };

// Muted scraps of cloth rather than the medallions of the ticket-window rug.
const yarn = [
  "#a52b37", "#244794", "#b8683b", "#2b8b89", "#c8ae52",
  "#397651", "#79529b", "#dbc7a2", "#5f2636", "#23232c",
];

const bands = [
  [8, 7], [6, 8], [12, 0], [5, 9], [9, 2], [16, 1], [5, 7],
  [10, 3], [7, 6], [15, 0], [4, 4], [11, 8], [7, 5], [18, 2],
  [5, 9], [8, 7], [13, 1], [6, 3], [10, 6], [16, 8], [5, 4],
  [9, 0], [7, 9], [17, 5], [6, 7], [12, 2], [8, 1], [5, 6],
  [15, 0], [9, 3], [4, 7], [11, 8], [7, 4], [18, 1], [5, 9],
  [9, 2], [12, 6], [6, 7], [14, 0], [8, 5], [5, 8], [11, 3],
  [7, 4], [15, 9], [6, 2], [10, 0], [8, 7], [12, 1], [7, 6],
  [9, 5], [5, 7], [10, 8],
] as const;

function fringePaths(bottom: boolean) {
  const groups = yarn.map(() => "");
  for (let index = 0; index < 64; index += 1) {
    const x = Math.round(240 + index * 30.5) / 10;
    const length = 24 + (index * 17 % 21);
    const lean = index * 7 % 11 - 5;
    const bend = index % 2 ? 3 : -3;
    const direction = bottom ? 1 : -1;
    const start = bottom ? 552 : 48;
    const half = Math.round(length / 2);
    const color = (index * 7 + (bottom ? 3 : 0)) % yarn.length;
    groups[color] += `M${x} ${start}q${bend} ${direction * half} ${lean} ${direction * half}t${-bend} ${direction * (length - half)}`;
  }
  return groups;
}

const topFringe = fringePaths(false);
const bottomFringe = fringePaths(true);
const bandTotal = bands.reduce((sum, [height]) => sum + height, 0);

function weavePaths() {
  const groups = yarn.map(() => ({ cloth: "", slub: "" }));
  const joins = ["", ""];
  let nextY = 46;
  bands.forEach(([height, color], index) => {
    const y = Math.round(nextY * 10) / 10;
    const actualHeight = height / bandTotal * 508;
    nextY += actualHeight;
    const bottom = Math.round(nextY * 10) / 10;
    const middle = Math.round((y + actualHeight / 2) * 10) / 10;
    const slant = index % 3 - 1;
    groups[color].cloth += `M18 ${y}q51 ${slant} 102 0t102 ${-slant}V${bottom + 1}q-51 ${slant} -102 0t-102 ${-slant}Z`;
    groups[(color + 3) % yarn.length].slub += `M20 ${y + 1}q48 ${slant} 97 0t103 ${-slant}`;
    joins[index % 2] += `M${28 + index * 13 % 70} ${middle}h${12 + index * 3 % 36}m${14 + index % 11} 0h${16 + index % 19}`;
  });
  return { groups, joins };
}

const woven = weavePaths();

/** A small, handwoven rag runner; all variation is fixed for stable SSR. */
export function RagRugRunner({ className = "", orientation = "vertical" }: RagRugRunnerProps) {
  const id = `rag-rug-${useId()}`;
  const horizontal = orientation === "horizontal";
  const rotation = horizontal ? "translate(600 0) rotate(90)" : undefined;

  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      viewBox={horizontal ? "0 0 600 240" : "0 0 240 600"}
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {yarn.map((color, index) => (
          <path key={color} id={`${id}-yarn-${index}`} d={topFringe[index] + bottomFringe[index]} />
        ))}
        <clipPath id={`${id}-cloth`}>
          <path d="M24 47 43 46 68 47 91 45 118 47 141 46 168 47 190 45 215 47 217 74 216 103 218 131 217 158 218 186 216 214 218 242 217 271 218 298 216 326 217 355 215 383 217 412 216 440 217 468 215 497 216 525 215 553 193 554 169 553 144 555 119 553 97 554 72 553 24 554 23 527 25 499 23 470 24 442 23 414 25 385 23 357 24 329 23 301 25 273 23 245 24 217 23 189 25 161 24 133 25 104 23 75Z" />
        </clipPath>
        <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M.5 0v4M2.5 0v4" stroke="#171719" strokeOpacity=".22" strokeWidth=".7" />
          <path d="M0 1h2m0 2h2" stroke="#eadac0" strokeOpacity=".25" strokeWidth=".6" />
          <path d="M0 2h2m0 2h2" stroke="#19191c" strokeOpacity=".25" strokeWidth=".55" />
        </pattern>
        <pattern id={`${id}-melange`} width="48" height="31" patternUnits="userSpaceOnUse">
          <path d="M2 3h5m9 1h8m11 6h10M8 15h9m8-2h4m-27 12h10m16 3h13" stroke="#e4d1ad" strokeOpacity=".2" strokeWidth=".8" />
          <path d="M4 8h9m9-6h4m8 14h9M1 20h6m11 2h11m10 8h7" stroke="#16151a" strokeOpacity=".28" strokeWidth="1.1" />
          <path d="m13 8 1 4m18 7 1 3M5 28l1 2" stroke="#ebd7ba" strokeOpacity=".18" strokeWidth=".7" />
        </pattern>
        <pattern id={`${id}-selvedge`} width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="m1 0 4 4-4 4m4-8 2 4-2 4" stroke="#d5c4a4" strokeOpacity=".35" strokeWidth=".85" />
        </pattern>
        <linearGradient id={`${id}-fold`} x1="20" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#121013" stopOpacity=".3" />
          <stop offset=".12" stopColor="#f1ddba" stopOpacity=".035" />
          <stop offset=".48" stopColor="#f1ddba" stopOpacity=".07" />
          <stop offset=".88" stopColor="#121013" stopOpacity=".04" />
          <stop offset="1" stopColor="#121013" stopOpacity=".26" />
        </linearGradient>
      </defs>

      <g transform={rotation} strokeWidth="2.25" strokeLinecap="round">
        {yarn.map((color, index) => (
          <use key={color} href={`#${id}-yarn-${index}`} stroke={color} />
        ))}
        <g stroke="#e0c9a7" strokeOpacity=".38" strokeWidth=".7" strokeDasharray="1.2 3.6">
          {yarn.map((color, index) => <use key={color} href={`#${id}-yarn-${index}`} />)}
        </g>
      </g>

      <g transform={rotation} clipPath={`url(#${id}-cloth)`}>
        <path d="M18 42h204v516H18Z" fill="#432d35" />
        {woven.groups.map(({ cloth }, index) => <path key={yarn[index]} d={cloth} fill={yarn[index]} />)}
        <g strokeOpacity=".6" strokeWidth="1.2">
          {woven.groups.map(({ slub }, index) => <path key={yarn[index]} d={slub} stroke={yarn[index]} />)}
        </g>
        <g strokeOpacity=".23" strokeWidth=".9">
          <path d={woven.joins[0]} stroke="#252329" />
          <path d={woven.joins[1]} stroke="#d5c4a4" />
        </g>
        <path d="M18 42h204v516H18Z" fill={`url(#${id}-melange)`} />
        <path d="M18 42h204v516H18Z" fill={`url(#${id}-weave)`} />
        <path d="M22 44h5v512h-5Zm191 0h5v512h-5Z" fill={`url(#${id}-selvedge)`} />
        <path d="M18 42h204v516H18Z" fill={`url(#${id}-fold)`} />
        <path d="M22 48q6 118 1 251t1 252m192-503q-5 121 0 254t-1 249" stroke="#1d1920" strokeOpacity=".33" strokeWidth="1.5" />
        <path d="M23 49q96-2 193 0M23 551q95 2 191 0" stroke="#d0b99a" strokeOpacity=".65" strokeWidth="2" strokeDasharray="1 2" />
      </g>
    </svg>
  );
}
