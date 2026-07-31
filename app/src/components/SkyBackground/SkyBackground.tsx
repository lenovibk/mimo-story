const STARS = [
  { top: "12%", left: "8%", delay: 0, size: "text-2xl" },
  { top: "22%", left: "88%", delay: 0.4, size: "text-xl" },
  { top: "68%", left: "5%", delay: 0.8, size: "text-lg" },
  { top: "80%", left: "92%", delay: 1.2, size: "text-2xl" },
  { top: "6%", left: "45%", delay: 1.6, size: "text-lg" },
  { top: "40%", left: "95%", delay: 0.6, size: "text-xl" },
];

const CLOUDS = [
  { top: "10%", size: 90, duration: 46, delay: 0, opacity: 0.9 },
  { top: "30%", size: 60, duration: 60, delay: -20, opacity: 0.75 },
  { top: "72%", size: 75, duration: 52, delay: -8, opacity: 0.8 },
];

/**
 * Shared illustrated backdrop for Splash/Home: a placeholder scene (sky, hot air
 * balloon, bird, hills, flowers, fox) plus a few drifting clouds + twinkling stars
 * layered on top for gentle motion.
 *
 * To use your own artwork, replace /public/images/home-bg.png (or .svg) - same
 * filename, any size - it's rendered edge-to-edge behind everything below.
 */
export function SkyBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#5CC8FF]">
      <img
        src="/images/home-bg.svg"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-bottom"
      />
      {CLOUDS.map((cloud, i) => (
        <span
          key={i}
          className="absolute text-white animate-drift"
          style={{
            top: cloud.top,
            fontSize: cloud.size,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        >
          ☁️
        </span>
      ))}
      {STARS.map((star, i) => (
        <span
          key={i}
          className={`absolute animate-twinkle ${star.size}`}
          style={{ top: star.top, left: star.left, animationDelay: `${star.delay}s` }}
        >
          ✨
        </span>
      ))}
    </div>
  );
}
