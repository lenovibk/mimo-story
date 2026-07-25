import logoImg from "@/assets/images/logo.png";

interface LogoProps {
  size?: "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const heightClass = size === "lg" ? "h-16 sm:h-20" : "h-9 sm:h-11";
  return (
    <img
      src={logoImg}
      alt="MimoKids"
      draggable={false}
      className={`no-select w-auto object-contain drop-shadow-sm ${heightClass} ${className}`}
    />
  );
}
