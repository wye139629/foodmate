"use client";

import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-auth";
import { cn } from "@/lib/utils";

const QUESTION_COUNT = 5;
const CARD_STEP = 5;

const STORY_OPTIONS = [
  "Korea",
  "Italy",
  "Mexico",
  "Japan",
  "India",
  "Middle East",
  "US South",
  "France",
  "Taiwan",
  "Global",
] as const;

const HOME_OPTIONS = [
  "Kimchi jjigae",
  "Fresh Pasta",
  "Warm Tacos",
  "Chicken Soup",
  "Curry & Rice",
  "Roast Chicken",
  "Dim Sum",
  "Grilled Fish",
] as const;

const SPECIALTY_OPTIONS = [
  "Korean sauces",
  "Sourdough",
  "Spices",
  "Baking",
  "Pickles",
  "Tea blends",
  "Fermentation",
  "BBQ",
] as const;

const CURIOSITY_OPTIONS = [
  "Taiwanese breakfast",
  "Sichuan spice",
  "French pastries",
  "Vegan cheese",
  "Handmade pasta",
  "Street tacos",
] as const;

const MAX_PICKS = 3;

function isListed<T extends string>(
  options: readonly T[],
  value: string,
): value is T {
  return (options as readonly string[]).includes(value);
}

function BackIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M8 13l-3 8 7-3 7 3-3-8" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ChoiceChip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2 font-sans text-[14px] leading-[1.4] font-medium text-foreground transition-colors hover:bg-accent active:bg-accent",
        selected && "border-2 bg-accent hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function OptionRow({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border border-border bg-card px-4 py-3 text-left font-sans text-[15px] leading-[1.5] font-medium transition-colors hover:bg-accent active:bg-accent",
        selected && "border-2 bg-accent hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function CustomAnswerField({
  id,
  value,
  disabled,
  onChange,
  onSubmit,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}) {
  return (
    <div className={cn("mt-8", disabled && "opacity-40")}>
      <input
        id={id}
        type="text"
        value={value}
        disabled={disabled}
        placeholder="Or type your own..."
        aria-label="Or type your own"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.currentTarget.value.trim()) {
            event.preventDefault();
            onSubmit(event.currentTarget.value);
          }
        }}
        className="w-full max-w-[240px] border-0 border-b border-foreground bg-transparent pb-2 font-sans text-[15px] leading-[1.5] text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}

function CardRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 text-foreground/80">{icon}</div>
      <div>
        <div className="font-heading mb-0.5 text-[12px] leading-[1.4] font-bold tracking-widest text-foreground/50 uppercase">
          {label}
        </div>
        <div className="font-sans text-[15px] leading-[1.5] font-medium">
          {value}
        </div>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [story, setStory] = useState("");
  const [home, setHome] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyDraft, setSpecialtyDraft] = useState("");
  const [curiosity, setCuriosity] = useState<string[]>([]);
  const [curiosityDraft, setCuriosityDraft] = useState("");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [idSubmitted, setIdSubmitted] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) {
        window.clearTimeout(advanceTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.user_metadata?.onboarded === true) {
        const nextPath = searchParams.get("redirectedFrom");
        router.replace(
          nextPath && nextPath !== "/onboarding" ? nextPath : "/map",
        );
      }
    });
  }, [router, searchParams]);

  function handleBack() {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (step > 0) {
      setStep((current) => current - 1);
      return;
    }
    router.push("/login");
  }

  function handleNext() {
    setStep((current) => Math.min(current + 1, CARD_STEP));
  }

  function toggleSpecialty(item: string) {
    setSpecialties((prev) => {
      if (prev.includes(item)) return prev.filter((entry) => entry !== item);
      if (prev.length >= MAX_PICKS) return prev;
      const next = [...prev, item];
      if (next.length >= MAX_PICKS) setSpecialtyDraft("");
      return next;
    });
  }

  function addCustomSpecialty(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setSpecialties((prev) => {
      if (prev.includes(value) || prev.length >= MAX_PICKS) return prev;
      return [...prev, value];
    });
    setSpecialtyDraft("");
  }

  function toggleCuriosity(item: string) {
    setCuriosity((prev) => {
      if (prev.includes(item)) return prev.filter((entry) => entry !== item);
      if (prev.length >= MAX_PICKS) return prev;
      const next = [...prev, item];
      if (next.length >= MAX_PICKS) setCuriosityDraft("");
      return next;
    });
  }

  function addCustomCuriosity(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setCuriosity((prev) => {
      if (prev.includes(value) || prev.length >= MAX_PICKS) return prev;
      return [...prev, value];
    });
    setCuriosityDraft("");
  }

  function handleAutoAdvance(apply: () => void) {
    apply();
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
    }
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setStep((current) => Math.min(current + 1, CARD_STEP));
    }, 400);
  }

  function handleIdPhotoChange(file: File | null) {
    setIdPhoto(file);
    setIdPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleIdStepNext() {
    if (!idPhoto) {
      handleNext();
      return;
    }

    setError(null);
    setUploadingId(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const ext = idPhoto.name.split(".").pop() || "jpg";
      const path = `${user.id}/id-card.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("student-ids")
        .upload(path, idPhoto, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ verification_status: "pending", verification_photo_path: path })
        .eq("id", user.id);
      if (profileError) throw profileError;

      setIdSubmitted(true);
      handleNext();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload your ID — try again",
      );
    } finally {
      setUploadingId(false);
    }
  }

  async function handleEnter() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          foodIdentity: {
            roots: story || "Global",
            home,
            specialties,
            curious: curiosity,
          },
        },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      const nextPath = searchParams.get("redirectedFrom");
      router.push(nextPath && nextPath !== "/onboarding" ? nextPath : "/map");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const showChrome = step < CARD_STEP;
  const specialtiesFull = specialties.length >= MAX_PICKS;
  const curiosityFull = curiosity.length >= MAX_PICKS;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background px-4 pt-3 pb-6">
      {showChrome && (
        <>
          <div className="relative z-10 flex items-center justify-between pb-4">
            <button
              type="button"
              onClick={handleBack}
              className="-ml-1 p-1 text-foreground"
              aria-label="Go back"
            >
              <BackIcon />
            </button>
            <span className="font-heading text-[13px] leading-[1.4] font-medium tracking-wide">
              {step + 1} / {QUESTION_COUNT}
            </span>
            <div className="w-6" />
          </div>

          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-lg bg-muted">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / QUESTION_COUNT) * 100}%` }}
            />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        {step === 0 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-[24px] leading-[1.2] font-bold text-foreground">
              Food Passport
            </h1>
            <p className="font-sans mt-2 mb-6 text-[15px] leading-[1.5] font-medium text-foreground/70">
              Where does your food story come from?
            </p>

            <div className="flex flex-wrap gap-2">
              {STORY_OPTIONS.map((opt) => (
                <ChoiceChip
                  key={opt}
                  selected={story === opt}
                  onClick={() => handleAutoAdvance(() => setStory(opt))}
                >
                  {opt}
                </ChoiceChip>
              ))}
            </div>

            <CustomAnswerField
              id="story-custom"
              value={isListed(STORY_OPTIONS, story) ? "" : story}
              onChange={setStory}
              onSubmit={(value) => handleAutoAdvance(() => setStory(value))}
            />
          </div>
        ) : step === 1 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-[24px] leading-[1.2] font-bold text-foreground">
              Taste of Home
            </h1>
            <p className="font-sans mt-2 mb-6 text-[15px] leading-[1.5] font-medium text-foreground/70">
              What food feels like home?
            </p>

            <div className="flex flex-col gap-2">
              {HOME_OPTIONS.map((opt) => (
                <OptionRow
                  key={opt}
                  selected={home === opt}
                  onClick={() => handleAutoAdvance(() => setHome(opt))}
                >
                  {opt}
                </OptionRow>
              ))}
            </div>

            <CustomAnswerField
              id="home-custom"
              value={isListed(HOME_OPTIONS, home) ? "" : home}
              onChange={setHome}
              onSubmit={(value) => handleAutoAdvance(() => setHome(value))}
            />
          </div>
        ) : step === 2 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-[24px] leading-[1.2] font-bold text-foreground">
              Your Specialty
            </h1>
            <p className="font-sans mt-2 mb-6 text-[15px] leading-[1.5] font-medium text-foreground/70">
              What could you introduce someone to? (Pick up to 3)
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                ...SPECIALTY_OPTIONS,
                ...specialties.filter((item) => !isListed(SPECIALTY_OPTIONS, item)),
              ].map((opt) => (
                <ChoiceChip
                  key={opt}
                  selected={specialties.includes(opt)}
                  onClick={() => toggleSpecialty(opt)}
                >
                  {opt}
                </ChoiceChip>
              ))}
            </div>

            <CustomAnswerField
              id="specialty-custom"
              value={specialtyDraft}
              disabled={specialtiesFull}
              onChange={setSpecialtyDraft}
              onSubmit={addCustomSpecialty}
            />

            <div className="mt-auto pt-6">
              <Button
                type="button"
                onClick={handleNext}
                disabled={specialties.length === 0}
                className="h-11 w-full text-[15px] font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-[24px] leading-[1.2] font-bold text-foreground">
              Curiosity Pick
            </h1>
            <p className="font-sans mt-2 mb-6 text-[15px] leading-[1.5] font-medium text-foreground/70">
              What are you curious to try? (Pick up to 3)
            </p>

            <div className="flex flex-col gap-2">
              {[
                ...CURIOSITY_OPTIONS,
                ...curiosity.filter((item) => !isListed(CURIOSITY_OPTIONS, item)),
              ].map((opt) => (
                <OptionRow
                  key={opt}
                  selected={curiosity.includes(opt)}
                  onClick={() => toggleCuriosity(opt)}
                >
                  {opt}
                </OptionRow>
              ))}
            </div>

            <CustomAnswerField
              id="curiosity-custom"
              value={curiosityDraft}
              disabled={curiosityFull}
              onChange={setCuriosityDraft}
              onSubmit={addCustomCuriosity}
            />

            <div className="mt-auto pt-6">
              <Button
                type="button"
                onClick={handleNext}
                disabled={curiosity.length === 0}
                className="h-11 w-full text-[15px] font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        ) : step === 4 ? (
          <div className="flex flex-1 flex-col">
            <h1 className="font-heading text-[24px] leading-[1.2] font-bold text-foreground">
              Verify Your Student ID
            </h1>
            <p className="font-sans mt-2 mb-6 text-[15px] leading-[1.5] font-medium text-foreground/70">
              Upload a photo of your student ID so we can confirm you&apos;re
              a student. It&apos;s reviewed by hand, never blocks you from
              using FoodMate, and you can do this later from your profile.
            </p>

            <label
              htmlFor="id-photo"
              className="mx-auto flex aspect-[4/3] w-full max-w-[320px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-[#8A8A8A] bg-card text-center"
            >
              {idPhotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static import
                <img
                  src={idPhotoPreview}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <>
                  <IconShield />
                  <span className="px-4 text-[14px] font-semibold">
                    Tap to add a photo of your student ID
                  </span>
                </>
              )}
              <input
                id="id-photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) =>
                  handleIdPhotoChange(event.target.files?.[0] ?? null)
                }
              />
            </label>

            {error && (
              <p role="alert" className="pt-4 text-[14px] text-destructive">
                {error}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-6">
              <Button
                type="button"
                onClick={handleIdStepNext}
                disabled={uploadingId}
                className="h-11 w-full text-[15px] font-semibold"
              >
                {uploadingId
                  ? "Uploading…"
                  : idPhoto
                    ? "Submit for review"
                    : "Skip for now"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col pt-4">
            <h1 className="font-heading mb-6 text-center text-[24px] leading-[1.2] font-bold text-foreground">
              Your food card is ready
            </h1>

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <span className="font-heading text-[16px] leading-[1.3] font-bold tracking-tight">
                  FOOD IDENTITY
                </span>
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full border border-border bg-accent" />
                  <div className="size-2.5 rounded-full border border-border bg-secondary" />
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <CardRow
                  icon={<IconGlobe />}
                  label="Roots"
                  value={story || "Global"}
                />
                <CardRow
                  icon={<IconHome />}
                  label="Taste of Home"
                  value={home || "Not set"}
                />
                <CardRow
                  icon={<IconBadge />}
                  label="Specialties"
                  value={specialties.join(", ") || "Not set"}
                />
                <CardRow
                  icon={<IconEye />}
                  label="Curious About"
                  value={curiosity.join(", ") || "Not set"}
                />
              </div>

              <div className="flex items-start gap-4 border-t border-border bg-accent/50 px-5 py-4">
                <div className="mt-0.5 text-foreground">
                  <IconShield />
                </div>
                <div>
                  <div className="font-heading mb-0.5 text-[12px] leading-[1.4] font-bold tracking-widest text-foreground/60 uppercase">
                    Verification
                  </div>
                  <div className="font-sans text-[15px] leading-[1.5] font-semibold">
                    {idSubmitted
                      ? "Student ID submitted — pending review"
                      : "Not verified yet"}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="pt-4 text-[14px] text-destructive">
                {error}
              </p>
            )}

            <p className="font-sans mt-6 text-center text-[14px] leading-[1.5] font-medium text-foreground/70">
              By entering, you agree to meet in public and follow community
              rules.
            </p>

            <div className="mt-auto pt-6">
              <Button
                type="button"
                onClick={handleEnter}
                disabled={loading}
                className="h-11 w-full text-[15px] font-semibold"
              >
                {loading ? "Entering…" : "Enter FoodMate"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-4 py-6">
          Loading…
        </main>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
