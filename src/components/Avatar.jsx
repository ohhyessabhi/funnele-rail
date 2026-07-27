import { initials } from "../lib/utils";

/** Circular initials badge. `highlight` = accent gradient (else calm gray). */
export function Avatar({ name, highlight = true, className = "" }) {
  return (
    <span className={`avatar ${highlight ? "" : "gray"} ${className}`.trim()}>
      {initials(name)}
    </span>
  );
}
