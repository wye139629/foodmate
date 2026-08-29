/** Full-screen loading state: the app icon's toast mascot, animated mid-run. */
export default function ToastRunner({ label = "Loading…" }: { label?: string }) {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4"
    >
      <div className="relative h-28 w-32">
        <span
          className="toast-runner-trail absolute top-9 left-0 h-1 w-5 rounded-full bg-foreground/15"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="toast-runner-trail absolute top-14 left-1 h-1 w-4 rounded-full bg-foreground/15"
          style={{ animationDelay: "0.12s" }}
        />
        <span
          className="toast-runner-trail absolute top-[4.5rem] left-0 h-1 w-3 rounded-full bg-foreground/15"
          style={{ animationDelay: "0.24s" }}
        />

        <svg
          viewBox="0 0 100 100"
          className="toast-runner-bob absolute inset-0 size-full"
          aria-hidden="true"
        >
          <g className="toast-runner-leg-a" style={{ transformOrigin: "40px 78px" }}>
            <rect
              x="34"
              y="78"
              width="12"
              height="16"
              rx="5"
              fill="var(--secondary)"
              stroke="var(--border)"
              strokeWidth="2.5"
            />
          </g>
          <g className="toast-runner-leg-b" style={{ transformOrigin: "60px 78px" }}>
            <rect
              x="54"
              y="78"
              width="12"
              height="16"
              rx="5"
              fill="var(--secondary)"
              stroke="var(--border)"
              strokeWidth="2.5"
            />
          </g>

          <path
            d="M22,86 L22,42 C22,18 34,6 50,6 C66,6 78,18 78,42 L78,86 Z"
            fill="var(--accent)"
            stroke="var(--border)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M30,86 L30,44 C30,24 39,14 50,14 C61,14 70,24 70,44 L70,86 Z"
            fill="var(--card)"
          />

          <g className="toast-runner-arm-a" style={{ transformOrigin: "26px 60px" }}>
            <line
              x1="26"
              y1="60"
              x2="14"
              y2="72"
              stroke="var(--border)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
          <g className="toast-runner-arm-b" style={{ transformOrigin: "74px 60px" }}>
            <line
              x1="74"
              y1="60"
              x2="86"
              y2="72"
              stroke="var(--border)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>

          <circle cx="42" cy="46" r="3" fill="var(--border)" />
          <circle cx="58" cy="46" r="3" fill="var(--border)" />
          <path
            d="M42,56 Q50,62 58,56"
            stroke="var(--border)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      <p className="font-heading text-sm tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </main>
  );
}
