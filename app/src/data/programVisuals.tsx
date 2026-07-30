import type { ComponentType, SVGProps } from "react";
import { IconBook, IconChat, IconFox, IconHeadphones, IconMusic, IconStar } from "@/components/Icon/Icon";

/**
 * Same pattern as categoryVisuals.tsx: color/label/order come from the admin-managed
 * Program API, only the icon component stays fixed in the app bundle, keyed by the
 * `icon` string each Program record carries. Unknown/new keys fall back to IconStar.
 */
export const programIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  book: IconBook,
  music: IconMusic,
  chat: IconChat,
  headphones: IconHeadphones,
  fox: IconFox,
};

export function getProgramIcon(iconKey: string): ComponentType<SVGProps<SVGSVGElement>> {
  return programIconMap[iconKey] ?? IconStar;
}
