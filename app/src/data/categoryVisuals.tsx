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
  IconStar,
  IconTree,
} from "@/components/Icon/Icon";

/**
 * Category color/label/order now come from the admin-managed catalog API;
 * only the icon component itself stays fixed in the app bundle, keyed by the
 * `icon` string each Category record carries (set by admin from this fixed
 * list). Unknown/new keys fall back to IconStar so an admin-created category
 * never renders blank while waiting for a matching app release.
 */
export const categoryIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  paw: IconPaw,
  face: IconFace,
  pulse: IconPulse,
  family: IconFamily,
  "cloud-rain": IconCloudRain,
  tree: IconTree,
  book: IconBook,
  ball: IconBall,
  burger: IconBurger,
  globe: IconGlobe,
};

export function getCategoryIcon(iconKey: string): ComponentType<SVGProps<SVGSVGElement>> {
  return categoryIconMap[iconKey] ?? IconStar;
}
