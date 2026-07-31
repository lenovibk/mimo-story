import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Ad } from "@/types";

interface AdBannerProps {
  placement?: string;
  /** Active child's age, used server-side to filter out age-targeted ads that don't fit. */
  age?: number;
}

const SLIDE_INTERVAL_MS = 5000;

/** Renders nothing until at least one active ad for this placement/age loads. With more
 * than one, auto-advances through them like a slideshow - no manual controls, since this
 * is a passive banner, not content the child is expected to interact with. */
export function AdBanner({ placement = "home_banner", age }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getActiveAds(placement, age)
      .then((res) => {
        if (cancelled) return;
        setAds(res);
        setIndex(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placement, age]);

  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const ad = ads[index % ads.length];
  const handleClick = () => {
    if (ad.linkUrl) window.open(ad.linkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="safe-px mt-6 mb-8 w-full"
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[24px] border-[3px] border-white shadow-md">
        {/* A fixed aspect ratio on this wrapper (ad art is a consistent 2:1) means every slide
            can be absolutely stacked inset-0 and cross-fade/slide over each other - both the
            incoming and outgoing slide animate at the same time, so there's never a blank frame
            between ads the way `mode="wait"` produced when the outgoing one had to fully finish
            exiting before the next started entering. */}
        <AnimatePresence initial={false}>
          <motion.button
            key={ad.id}
            type="button"
            onClick={handleClick}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 block h-full w-full"
            aria-label={ad.title}
          >
            <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
          </motion.button>
        </AnimatePresence>

        {ads.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {ads.map((a, i) => (
              <span
                key={a.id}
                className={`h-1.5 rounded-full shadow-sm transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
