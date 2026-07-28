import type { ComponentType, SVGProps } from "react";
import {
  IconBall,
  IconBook,
  IconBurger,
  IconCloudRain,
  IconFace,
  IconFamily,
  IconGlobe,
  IconPaw,
  IconPulse,
  IconTree,
} from "@/components/Icon/Icon";
import type { StoryCategory } from "@/types";

export interface CategoryVisual {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Pastel circle background behind the icon, matched to the icon's accent. */
  bg: string;
  /** Same accent as `bg`, as a raw hex - for spots that need it inline (dynamic ring/background colors). */
  hex: string;
}

export const categoryVisuals: Record<StoryCategory, CategoryVisual> = {
  animals: { icon: IconPaw, bg: "bg-[#FF92C2]", hex: "#FF92C2" },
  emotions: { icon: IconFace, bg: "bg-[#FFD54A]", hex: "#FFD54A" },
  body: { icon: IconPulse, bg: "bg-[#FF7A7A]", hex: "#FF7A7A" },
  family: { icon: IconFamily, bg: "bg-[#5CC8FF]", hex: "#5CC8FF" },
  weather: { icon: IconCloudRain, bg: "bg-[#8FDBFF]", hex: "#8FDBFF" },
  holidays: { icon: IconTree, bg: "bg-[#8EE28E]", hex: "#8EE28E" },
  school: { icon: IconBook, bg: "bg-[#B79CFF]", hex: "#B79CFF" },
  activities: { icon: IconBall, bg: "bg-[#FFB25C]", hex: "#FFB25C" },
  food: { icon: IconBurger, bg: "bg-[#FFC7A0]", hex: "#FFC7A0" },
  world: { icon: IconGlobe, bg: "bg-[#6FE0C8]", hex: "#6FE0C8" },
};
