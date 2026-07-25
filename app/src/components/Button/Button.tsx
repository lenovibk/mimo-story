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
        className={`no-select flex min-h-[64px] items-center gap-3 rounded-full py-2 pr-5 pl-3 shadow-lg shadow-black/15 transition-opacity ${
          active ? CIRCLE_COLORS[color] : "bg-slate-300 text-slate-500"
        } ${disabled ? "opacity-50" : ""} ${className}`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-2xl">
          {icon}
        </span>
        <span className="flex flex-col items-start leading-tight font-heading">
          <span className="text-sm font-bold whitespace-nowrap">{label}</span>
          {sublabel && <span className="text-xs font-medium opacity-85">{sublabel}</span>}
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
      className={`no-select flex min-h-[64px] items-center gap-3 rounded-full bg-white/95 py-2 pr-5 pl-2 shadow-lg shadow-black/10 backdrop-blur transition-opacity ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
          active ? CIRCLE_COLORS[color] : "bg-slate-200 text-slate-400"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col items-start leading-tight font-heading text-slate-700">
        <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
        {sublabel && <span className="text-xs font-medium text-slate-400">{sublabel}</span>}
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
