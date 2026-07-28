import { AnimatePresence, motion } from "framer-motion";
import type { SVGProps } from "react";
import {
  ArrowLeft,
  Book,
  CaretLeft,
  CaretRight,
  Check,
  CloudRain,
  DotsNine,
  Gear,
  Globe,
  Hamburger,
  Heart,
  House,
  Microphone,
  Pause,
  PawPrint,
  Play,
  Pulse,
  Smiley,
  SoccerBall,
  Star,
  Tree,
  UserFocus
} from "@phosphor-icons/react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (className?: string) => `h-6 w-6 ${className ?? ""}`;

export function IconBack({ className, ...props }: IconProps) {
  return <ArrowLeft weight="bold" className={base(className)} {...props} />;
}

export function IconChevronLeft({ className, ...props }: IconProps) {
  return <CaretLeft weight="bold" className={base(className)} {...props} />;
}

export function IconChevronRight({ className, ...props }: IconProps) {
  return <CaretRight weight="bold" className={base(className)} {...props} />;
}

export function IconPause({ className, ...props }: IconProps) {
  return <Pause weight="fill" className={base(className)} {...props} />;
}

export function IconPlay({ className, ...props }: IconProps) {
  return <Play weight="fill" className={base(className)} {...props} />;
}

export function IconMic({ className, ...props }: IconProps) {
  return <Microphone weight="fill" className={base(className)} {...props} />;
}

export function IconHome({ className, ...props }: IconProps) {
  return <House weight="regular" className={base(className)} {...props} />;
}

export function IconSettings({ className, ...props }: IconProps) {
  return <Gear weight="fill" className={base(className)} {...props} />;
}

export function IconStar({ className, ...props }: IconProps) {
  return <Star weight="fill" className={base(className)} {...props} />;
}

export function IconStarOutline({ className, ...props }: IconProps) {
  return <Star weight="regular" className={base(className)} {...props} />;
}

export function IconCheck({ className, ...props }: IconProps) {
  return <Check weight="bold" className={base(className)} {...props} />;
}

export function IconHeart({ className, ...props }: IconProps) {
  return <Heart weight="fill" className={base(className)} {...props} />;
}

export function IconHeartOutline({ className, ...props }: IconProps) {
  return <Heart weight="regular" className={base(className)} {...props} />;
}

/** Heart toggle that pops with a little spring bounce when it switches on/off. */
export function AnimatedHeart({ active, size = "h-6 w-6" }: { active: boolean; size?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={active ? "filled" : "outline"}
        initial={{ scale: 0.4, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 14 }}
        className="inline-flex"
      >
        {active ? <IconHeart className={`${size} text-[#FF7A7A]`} /> : <IconHeartOutline className={size} />}
      </motion.span>
    </AnimatePresence>
  );
}

export function IconFace({ className, ...props }: IconProps) {
  return <Smiley weight="fill" className={base(className)} {...props} />;
}

export function IconPaw({ className, ...props }: IconProps) {
  return <PawPrint weight="fill" className={base(className)} {...props} />;
}

export function IconFamily({ className, ...props }: IconProps) {
  return <UserFocus weight="fill" className={base(className)} {...props} />;
}

export function IconCloudRain({ className, ...props }: IconProps) {
  return <CloudRain weight="fill" className={base(className)} {...props} />;
}

export function IconTree({ className, ...props }: IconProps) {
  return <Tree weight="fill" className={base(className)} {...props} />;
}

export function IconBook({ className, ...props }: IconProps) {
  return <Book weight="fill" className={base(className)} {...props} />;
}

export function IconBall({ className, ...props }: IconProps) {
  return <SoccerBall weight="fill" className={base(className)} {...props} />;
}

export function IconBurger({ className, ...props }: IconProps) {
  return <Hamburger weight="fill" className={base(className)} {...props} />;
}

export function IconGlobe({ className, ...props }: IconProps) {
  return <Globe weight="regular" className={base(className)} {...props} />;
}

export function IconPulse({ className, ...props }: IconProps) {
  return <Pulse weight="fill" className={base(className)} {...props} />;
}

export function IconDots({ className, ...props }: IconProps) {
  return <DotsNine weight="fill" className={base(className)} {...props} />;
}

export function IconFlagEn({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} {...props}>
      <rect width="24" height="24" fill="#1A2A6C" />
      <path d="M0 0 24 24M24 0 0 24" stroke="#FFFFFF" strokeWidth={4.6} />
      <path d="M0 0 24 24M24 0 0 24" stroke="#E4133D" strokeWidth={1.8} />
      <path d="M12 0V24M0 12H24" stroke="#FFFFFF" strokeWidth={7} />
      <path d="M12 0V24M0 12H24" stroke="#E4133D" strokeWidth={3} />
    </svg>
  );
}

export function IconFlagVi({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} {...props}>
      <rect width="24" height="24" fill="#DA251D" />
      <path
        d="M12 4.2 13.9 10h6.1l-4.9 3.6 1.9 5.8L12 15.6l-5 3.8 1.9-5.8L4 10h6.1L12 4.2Z"
        fill="#FFCD00"
      />
    </svg>
  );
}
