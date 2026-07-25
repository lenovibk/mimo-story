import { motion } from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";

interface CameraPreviewProps {
  boundsRef: RefObject<HTMLElement | null>;
}

/** Small draggable self-view so the child can watch themselves speak (shadowing). */
export function CameraPreview({ boundsRef }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.08}
      dragConstraints={boundsRef}
      whileDrag={{ scale: 1.04 }}
      className="pointer-events-auto absolute right-5 bottom-28 z-30 h-28 w-28 cursor-grab overflow-hidden rounded-3xl border-4 border-white/90 bg-slate-800 shadow-xl active:cursor-grabbing sm:right-8 sm:bottom-8 sm:h-36 sm:w-36"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full scale-x-[-1] object-cover"
      />
    </motion.div>
  );
}
