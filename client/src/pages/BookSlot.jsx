import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Lock,
  CheckCircle2,
  ChevronLeft,
  User,
  Phone,
  Loader2,
} from "lucide-react";
import { getAllSlots, submitApplication } from "../services/api";
import {
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatWeekday,
  sessionLabel,
} from "../utils/format";
import { LoadingState, EmptyState } from "../components/States";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Please enter your full name.")
    .max(100, "Name is too long."),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
});

const STEPS = ["date", "session", "form", "summary", "success"];

export default function BookSlot() {
  const location = useLocation();
  const presetDate = location.state?.presetDate;

  const [step, setStep] = useState(presetDate ? "session" : "date");
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(presetDate || null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formValues, setFormValues] = useState({ name: "", mobile: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const loadSlots = () => {
    setLoading(true);
    getAllSlots()
      .then((data) => setDates(data.dates || []))
      .catch(() => toast.error("Could not load available dates. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const selectedDateObj = useMemo(
    () => dates.find((d) => d.date === selectedDate),
    [dates, selectedDate]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: formValues,
  });

  function goTo(nextStep) {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePickDate(date) {
    setSelectedDate(date);
    goTo("session");
  }

  function handlePickSession(session) {
    setSelectedSession(session);
    goTo("form");
  }

  function onFormSubmit(values) {
    setFormValues(values);
    goTo("summary");
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    try {
      const data = await submitApplication({
        name: formValues.name,
        mobile: formValues.mobile,
        date: selectedDate,
        session: selectedSession,
      });
      setResult(data.application);
      toast.success("Application submitted successfully.");
      goTo("success");
    } catch (err) {
      toast.error(err.message);
      // Slot may have just been taken — refresh availability so the user
      // isn't stuck looking at a stale "available" state.
      loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 sm:px-6">
      {step !== "success" && (
        <>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
            Book Your Prasad Slot
          </h1>
          <p className="mt-1.5 text-sm text-amber-200/70">
            Complete a few simple steps to submit your Prasad Seva application.
          </p>

          {/* Progress */}
          <div className="mt-6 flex items-center gap-2">
            {["Date & Session", "Your Details", "Review & Submit"].map((label, i) => {
              const active = i <= (step === "date" ? 0 : step === "session" ? 0 : step === "form" ? 1 : 2);
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      active ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/10"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* STEP: date */}
      {step === "date" && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Select a Date</h2>
          {loading ? (
            <LoadingState label="Loading available dates..." />
          ) : dates.length === 0 ? (
            <EmptyState title="No dates available" description="Please check back later." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {dates.map((d) => {
                const availableCount = ["morning", "evening"].filter(
                  (s) => d[s]?.status === "available"
                ).length;
                const disabled = availableCount === 0;
                return (
                  <button
                    key={d.date}
                    disabled={disabled}
                    onClick={() => handlePickDate(d.date)}
                    className={`min-h-[120px] rounded-2xl border p-4 text-center transition-all duration-300 ${
                      disabled
                        ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                        : "date-card hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(229,193,88,0.2)]"
                    }`}
                  >
                    <p className="text-xs font-semibold tracking-wider text-amber-400">
                      {formatMonthShort(d.date)}
                    </p>
                    <p className="my-1 text-2xl sm:text-3xl font-bold text-white">
                      {formatDayNumber(d.date)}
                    </p>
                    <p className="text-xs text-amber-100/60">{formatWeekday(d.date)}</p>
                    <p
                      className={`mt-2 text-[11px] font-semibold ${
                        disabled ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {disabled ? "Fully Booked" : `${availableCount} Slot${availableCount > 1 ? "s" : ""} Open`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STEP: session */}
      {step === "session" && selectedDateObj && (
        <div className="mt-8">
          <button
            onClick={() => goTo("date")}
            className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-amber-300 hover:text-amber-200 transition"
          >
            <ChevronLeft size={16} /> Change date
          </button>
          <h2 className="mb-1 text-lg font-semibold text-amber-200">Select a Session</h2>
          <p className="mb-5 text-sm text-amber-100/70">{formatDateLong(selectedDate)}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "morning", icon: Sun, label: "Morning" },
              { key: "evening", icon: Moon, label: "Evening" },
            ].map(({ key, icon: Icon, label }) => {
              const status = selectedDateObj[key]?.status || "available";
              const isAvailable = status === "available";
              return (
                <button
                  key={key}
                  disabled={!isAvailable}
                  onClick={() => handlePickSession(key)}
                  className={`flex min-h-[170px] flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center transition-all duration-300 ${
                    isAvailable
                      ? "date-card hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(229,193,88,0.25)]"
                      : "cursor-not-allowed border-white/5 bg-white/5 opacity-50"
                  }`}
                >
                  {isAvailable ? (
                    <Icon size={32} className="text-amber-400 animate-divine-pulse" />
                  ) : (
                    <Lock size={32} className="text-gray-500" />
                  )}
                  <span className="text-lg font-semibold text-white">{label}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isAvailable
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-950/40 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {isAvailable ? "Available" : status === "closed" ? "Closed" : "Already Allotted"}
                  </span>
                  {isAvailable && (
                    <span className="mt-1 rounded-full btn-gold-3d !py-1.5 !px-5 !text-xs">
                      Select Session
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP: form */}
      {step === "form" && (
        <div className="mt-8">
          <button
            onClick={() => goTo("session")}
            className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-amber-300 hover:text-amber-200 transition"
          >
            <ChevronLeft size={16} /> Change session
          </button>
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Your Details</h2>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-amber-200 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                <input
                  id="name"
                  {...register("name")}
                  placeholder="Enter your full name"
                  className="min-h-[52px] w-full rounded-xl border border-amber-400/25 bg-white/5 pl-10 pr-4 text-base text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="mobile" className="mb-1.5 block text-xs font-semibold text-amber-200 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                <input
                  id="mobile"
                  {...register("mobile")}
                  placeholder="Enter 10-digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  className="min-h-[52px] w-full rounded-xl border border-amber-400/25 bg-white/5 pl-10 pr-4 text-base text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition"
                  autoComplete="tel"
                />
              </div>
              {errors.mobile && (
                <p className="mt-1.5 text-sm text-red-400">{errors.mobile.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-gold-3d w-full"
            >
              Review Details →
            </button>
          </form>
        </div>
      )}

      {/* STEP: summary */}
      {step === "summary" && (
        <div className="mt-8">
          <button
            onClick={() => goTo("form")}
            className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-amber-300 hover:text-amber-200 transition"
          >
            <ChevronLeft size={16} /> Edit details
          </button>
          <h2 className="mb-4 text-lg font-semibold text-amber-200">Booking Summary</h2>

          <div className="divide-y divide-white/10 rounded-2xl border border-amber-400/20 bg-gradient-to-b from-maroon-900/60 to-black/80 backdrop-blur-md shadow-2xl">
            <SummaryRow label="Name" value={formValues.name} />
            <SummaryRow label="Mobile" value={formValues.mobile} />
            <SummaryRow label="Date" value={formatDateLong(selectedDate)} />
            <SummaryRow label="Session" value={sessionLabel(selectedSession)} />
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200/90">
            ℹ️ Your application will be reviewed by the temple administrator. The slot
            will be allotted only after verification.
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 btn-gold-3d disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Submitting...
              </>
            ) : (
              "Confirm & Submit Application"
            )}
          </button>
        </div>
      )}

      {/* STEP: success */}
      {step === "success" && result && (
        <div className="mt-6 flex flex-col items-center text-center animate-fadeIn">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <CheckCircle2 size={44} />
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400">
            Application Submitted Successfully
          </h1>
          <p className="mt-2 max-w-sm text-sm text-amber-100/70">
            Your Ganesh Prasad slot application has been submitted for verification.
          </p>

          <div className="mt-6 w-full divide-y divide-white/10 rounded-2xl border border-amber-400/20 bg-gradient-to-b from-maroon-900/60 to-black/80 text-left shadow-2xl">
            <SummaryRow label="Application ID" value={result.applicationId} strong />
            <SummaryRow label="Date" value={formatDateLong(result.date)} />
            <SummaryRow label="Session" value={sessionLabel(result.session)} />
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-amber-100/60">Status</span>
              <span className="rounded-full bg-amber-950/80 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300">
                Pending Verification
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
            <Link
              to="/status"
              state={{ presetApplicationId: result.applicationId }}
              className="btn-saffron-3d flex-1 text-center"
            >
              Check Status
            </Link>
            <Link
              to="/"
              className="btn-gold-3d flex-1 text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm text-amber-100/60">{label}</span>
      <span
        className={`text-sm ${
          strong ? "font-bold text-amber-300 tracking-wide text-base" : "font-medium text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
