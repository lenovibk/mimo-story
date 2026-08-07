import { motion } from "framer-motion";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

/** A small pill on/off switch for settings rows - the app has no equivalent in Button.tsx yet
 * (PillButton/CircleButton's `active` styling is built for toggle *buttons*, not this iOS-style track). */
export function ToggleSwitch({ checked, onChange, ariaLabel, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`no-select relative h-8 w-14 shrink-0 rounded-full transition-colors ${
        checked ? "bg-[#5CC8FF]" : "bg-slate-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
        style={{ left: checked ? "calc(100% - 1.75rem)" : "0.25rem" }}
      />
    </button>
  );
}
