import { assetPath } from "@/lib/assetPath";

export function CarpetPattern() {
  return (
    <div
      aria-hidden="true"
      className="carpet-pattern"
      style={{ backgroundImage: `url("${assetPath("/images/carpet-pattern.svg")}")` }}
    />
  );
}
