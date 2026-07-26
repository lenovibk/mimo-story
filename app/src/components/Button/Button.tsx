import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ButtonColor = "primary" | "yellow" | "pink" | "green" | "white" | "night";

const CIRCLE_COLORS: Record<ButtonColor, string> = {
  primary: "bg-[#5CC8FF] text-white",
  yellow: "bg-[#FFD54A] text-white",
  pink: "bg-[#FF92C2] text-white",
  green: "bg-[#8EE28E] text-white",
  white: "bg-white text-[#5CC8FF]",
  night: "bg-[#5B4B9A] text-white",
};

interface BaseProps {
  onClick?: () => void;
  color?: ButtonColor;
  active?: boolean;
  className?: string;
  ariaLabel: string;
  disabled?: boolean;
}

interface CircleButtonProps extends BaseProps {
  icon: ReactNode;
  size?: number;
}

/** A single round, thumb-friendly button (min 72px per PRD accessibility rules). */
export function CircleButton({
  icon,
  onClick,
  color = "primary",
  active = true,
  size = 72,
  className = "",
  ariaLabel,
  disabled,
}: CircleButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.88 }}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      style={{ width: size, height: size }}
      className={`no-select flex shrink-0 items-center justify-center rounded-full shadow-lg shadow-black/10 ring-4 ring-white/70 transition-opacity ${
        active ? CIRCLE_COLORS[color] : "bg-white/70 text-slate-400"
      } ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {icon}
    </motion.button>
  );
}

interface PillButtonProps extends BaseProps {
  icon: ReactNode;
  label: ReactNode;
  sublabel?: ReactNode;
  /** Fill the whole pill with `color` instead of just the icon bubble (e.g. Practice Speaking). */
  solid?: boolean;
  /** Icon is a full-bleed badge (flags) instead of a glyph on a tinted circle. */
  flagIcon?: boolean;
}

/** Floating pill: colored icon bubble + short label, used for the player's side controls. */
export function PillButton({
  icon,
  label,
  sublabel,
  onClick,
  color = "primary",
  active = true,
  solid = false,
  flagIcon = false,
  className = "",
  ariaLabel,
  disabled,
}: PillButtonProps) {
  if (solid) {
    return (
      <motion.button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.94 }}
        whileHover={disabled ? undefined : { scale: 1.03 }}
        className={`no-select flex min-h-[52px] items-center gap-2 rounded-full py-1.5 pr-4 pl-2.5 shadow-lg shadow-black/15 transition-opacity sm:min-h-[64px] sm:gap-3 sm:py-2 sm:pr-5 sm:pl-3 landscape-compact:min-h-[40px] landscape-compact:gap-1.5 landscape-compact:py-1 landscape-compact:pr-3 landscape-compact:pl-2 ${
          active ? CIRCLE_COLORS[color] : "bg-slate-300 text-slate-500"
        } ${disabled ? "opacity-50" : ""} ${className}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 sm:h-10 sm:w-10 landscape-compact:h-7 landscape-compact:w-7">
          {icon}
        </span>
        <span className="flex flex-col items-start leading-tight font-heading">
          <span className="text-xs font-bold whitespace-nowrap sm:text-sm landscape-compact:text-[11px]">
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] font-medium opacity-85 sm:text-xs landscape-compact:hidden">
              {sublabel}
            </span>
          )}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      className={`no-select flex min-h-[52px] items-center gap-2 rounded-full bg-white/95 py-1.5 pr-4 pl-1.5 shadow-lg shadow-black/10 backdrop-blur transition-opacity sm:min-h-[64px] sm:gap-3 sm:py-2 sm:pr-5 sm:pl-2 landscape-compact:min-h-[40px] landscape-compact:gap-1.5 landscape-compact:py-1 landscape-compact:pr-3 landscape-compact:pl-1 ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      {flagIcon ? (
        <span
          className={`h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-black/5 transition-[filter,opacity] sm:h-12 sm:w-12 landscape-compact:h-7 landscape-compact:w-7 ${
            active ? "" : "opacity-45 grayscale"
          }`}
        >
          {icon}
        </span>
      ) : (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 landscape-compact:h-7 landscape-compact:w-7 ${
            active ? CIRCLE_COLORS[color] : "bg-slate-200 text-slate-400"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="flex flex-col items-start leading-tight font-heading text-slate-700">
        <span className="text-xs font-semibold whitespace-nowrap sm:text-sm landscape-compact:text-[11px]">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] font-medium text-slate-400 sm:text-xs landscape-compact:hidden">
            {sublabel}
          </span>
        )}
      </span>
    </motion.button>
  );
}

interface SolidPillButtonProps extends BaseProps {
  icon?: ReactNode;
  label: ReactNode;
}

/** Filled rounded pill, used for header chips like the star counter or Home button. */
export function SolidPillButton({
  icon,
  label,
  onClick,
  color = "white",
  className = "",
  ariaLabel,
  disabled,
}: SolidPillButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      className={`no-select flex items-center gap-2 rounded-full px-5 py-3 font-heading text-base font-semibold shadow-md shadow-black/10 ${CIRCLE_COLORS[color]} ${className}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}
