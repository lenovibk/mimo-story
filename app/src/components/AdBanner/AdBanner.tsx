import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Ad } from "@/types";

interface AdBannerProps {
  placement?: string;
  /** Active child's age, used server-side to filter out age-targeted ads that don't fit. */
  age?: number;
}

/** Renders nothing until an active ad for this placement/age loads - and nothing if there isn't one. */
export function AdBanner({ placement = "home_banner", age }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getActiveAds(placement, age)
      .then((ads) => {
        if (!cancelled) setAd(ads[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placement, age]);

  if (!ad) return null;

  const handleClick = () => {
    if (ad.linkUrl) window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="safe-px mt-4 block w-full"
      aria-label={ad.title}
    >
      <img src={ad.imageUrl} alt={ad.title} className="h-auto w-full rounded-[24px] object-cover shadow-md" />
    </motion.button>
  );
}
