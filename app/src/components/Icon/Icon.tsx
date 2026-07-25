import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (className?: string) => `h-6 w-6 ${className ?? ""}`;

export function IconBack({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <path d="M14.5 6 8.5 12l6 6" />
    </svg>
  );
}

export function IconChevronLeft({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function IconChevronRight({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconPause({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} {...props}>
      <rect x="6" y="4" width="4.5" height="16" rx="2.25" />
      <rect x="13.5" y="4" width="4.5" height="16" rx="2.25" />
    </svg>
  );
}

export function IconPlay({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} {...props}>
      <path d="M7.5 4.8v14.4a1 1 0 0 0 1.53.85l11.4-7.2a1 1 0 0 0 0-1.7l-11.4-7.2A1 1 0 0 0 7.5 4.8Z" />
    </svg>
  );
}

export function IconMic({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M6 11a6 6 0 0 0 12 0" />
      <path d="M12 17v3.5M9 20.5h6" />
    </svg>
  );
}

export function IconHome({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <path d="M4 11.5 12 4.2l8 7.3" />
      <path d="M6 10v8.5a1 1 0 0 0 1 1h3v-5.5h4v5.5h3a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

export function IconSettings({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6 2.7c.4-1 1.8-1 2.2 0l.28.75c.2.53.76.83 1.3.7l.85-.2c1.02-.25 1.87.72 1.5 1.7l-.3.79c-.2.5.02 1.06.48 1.32l.72.42c.9.53.9 1.85 0 2.38l-.72.42c-.46.26-.68.82-.48 1.32l.3.79c.37.98-.48 1.95-1.5 1.7l-.85-.2c-.54-.13-1.1.17-1.3.7l-.28.75c-.4 1-1.8 1-2.2 0l-.28-.75c-.2-.53-.76-.83-1.3-.7l-.85.2c-1.02.25-1.87-.72-1.5-1.7l.3-.79c.2-.5-.02-1.06-.48-1.32l-.72-.42c-.9-.53-.9-1.85 0-2.38l.72-.42c.46-.26.68-.82.48-1.32l-.3-.79c-.37-.98.48-1.95 1.5-1.7l.85.2c.54.13 1.1-.17 1.3-.7l.28-.75Z"
      />
      <circle cx="12" cy="12" r="3.2" fill="white" />
    </svg>
  );
}

export function IconStar({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} {...props}>
      <path d="M12 2.6 14.6 9l6.9.55-5.3 4.5 1.65 6.75L12 17.1l-5.85 3.7L7.8 14 2.5 9.55 9.4 9 12 2.6Z" />
    </svg>
  );
}

export function IconStarOutline({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      className={base(className)}
      {...props}
    >
      <path d="M12 2.6 14.6 9l6.9.55-5.3 4.5 1.65 6.75L12 17.1l-5.85 3.7L7.8 14 2.5 9.55 9.4 9 12 2.6Z" />
    </svg>
  );
}

export function IconHeart({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)} {...props}>
      <path d="M12 21s-7.4-4.6-9.9-9.2C.6 8.3 2.1 4.6 5.7 4.1c2-.3 3.7.6 4.9 2.2 1.2-1.6 2.9-2.5 4.9-2.2 3.6.5 5.1 4.2 3.6 7.7C19.4 16.4 12 21 12 21Z" />
    </svg>
  );
}

export function IconFace({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <circle cx="9" cy="11" r="1.3" fill="#33415C" />
      <circle cx="15" cy="11" r="1.3" fill="#33415C" />
      <path
        d="M8.3 14.3c1 1.2 6.4 1.2 7.4 0"
        stroke="#33415C"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
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
