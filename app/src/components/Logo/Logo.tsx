const LETTER_COLORS = ["#FF92C2", "#FFD54A", "#5CC8FF", "#8EE28E", "#FF92C2", "#5CC8FF", "#FFD54A"];

interface LogoProps {
  size?: "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const textSize = size === "lg" ? "text-5xl sm:text-6xl" : "text-2xl sm:text-3xl";
  return (
    <div className="no-select flex items-center gap-2">
      <span className={size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl"}>🌈</span>
      <span className={`font-heading font-extrabold tracking-tight ${textSize}`}>
        {"MimoKids".split("").map((letter, i) => (
          <span key={i} style={{ color: LETTER_COLORS[i % LETTER_COLORS.length] }}>
            {letter}
          </span>
        ))}
      </span>
    </div>
  );
}
