"use client";

import { FormFieldError } from "@/components/common/FormFieldError";
import { postContact } from "@/lib/catering-api";
import { zodFieldErrors } from "@/lib/validation/auth-forms";
import { contactFormSchema } from "@/lib/validation/contact-form";
import {
  CaretRight,
  ChatsCircle,
  Envelope,
  PaperPlaneTilt,
  Phone,
  User,
} from "@phosphor-icons/react";
import { publicSiteConfig } from "@/lib/site-config";
import Link from "next/link";
import { useId, useState } from "react";
import { toast } from "react-toastify";

type FieldKey = "name" | "email" | "phone" | "subject" | "message";
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function ContactPage() {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const subjectId = useId();
  const messageId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function clearError(field: FieldKey) {
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactFormSchema.safeParse({
      name,
      email,
      phone,
      subject,
      message,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error) as FieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const data = parsed.data;
      await postContact({
        name: data.name.trim(),
        email: data.email.trim(),
        ...(data.phone.trim() ? { phone: data.phone.trim() } : {}),
        subject: data.subject.trim(),
        message: data.message.trim(),
      });
      toast.success("Thanks — your message was sent.");
      setSent(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldWrap =
    "group relative rounded-2xl border bg-white/80 shadow-[0_1px_2px_rgba(28,28,28,0.04)] transition-all duration-200";
  const fieldWrapOk =
    "border-gray-200/90 focus-within:border-brand-red/35 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(229,57,53,0.08),0_4px_24px_-8px_rgba(28,28,28,0.12)]";
  const fieldWrapErr =
    "border-red-300 bg-red-50/30 shadow-[0_0_0_4px_rgba(239,68,68,0.08)]";
  const inputInner =
    "w-full rounded-2xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-[15px] font-medium tracking-tight text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0";
  const textAreaInner =
    "min-h-[140px] w-full resize-y rounded-2xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-[15px] font-medium leading-relaxed tracking-tight text-brand-dark outline-none ring-0 placeholder:text-gray-400 focus:ring-0";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section className="relative overflow-hidden bg-brand-dark px-6 py-12 sm:py-14">
        <div
          className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:18px_18px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl">
          <nav className="text-sm font-medium text-white/55">
            <Link href="/" className="transition hover:text-brand-yellow">
              Home
            </Link>
            <span className="mx-2 text-white/35" aria-hidden>
              /
            </span>
            <span className="text-white/90">Contact</span>
          </nav>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow">
                Sales &amp; support
              </p>
              <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Contact us
              </h1>
              <p className="mt-3 max-w-xl text-base text-white/75">
                Questions about listings, partnerships, or press? Send a note — we typically reply within one
                business day.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
              <PaperPlaneTilt className="text-xl text-brand-yellow" weight="duotone" aria-hidden />
              <span className="font-semibold">{publicSiteConfig.contactEmail}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14 lg:py-16">
        <div className="relative">
          <div className="pointer-events-none absolute -left-24 top-20 h-48 w-48 rounded-full bg-brand-red/[0.06] blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-10 h-40 w-40 rounded-full bg-brand-yellow/[0.08] blur-3xl" aria-hidden />

          <div className="relative overflow-hidden rounded-[1.35rem] border border-gray-100/80 bg-white shadow-[0_32px_64px_-28px_rgba(28,28,28,0.14),0_0_0_1px_rgba(28,28,28,0.04)]">
            <div className="h-1 w-full bg-gradient-to-r from-brand-red via-amber-400 to-brand-red" aria-hidden />
            <div className="p-7 sm:p-9">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-red/15 bg-brand-red/[0.06] px-3 py-1.5">
                  <ChatsCircle className="text-lg text-brand-red" weight="duotone" aria-hidden />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red">
                    Message the team
                  </span>
                </div>
                <h2 className="font-heading mt-4 text-xl font-extrabold text-brand-dark">Send us a message</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Fields marked Required help us route your enquiry faster.
                </p>
              </div>

              {sent ? (
                <div className="rounded-2xl border border-brand-green/25 bg-brand-green/5 px-5 py-10 text-center">
                  <p className="font-heading text-lg font-bold text-brand-dark">Message received</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Thanks for reaching out. If you need anything else, send us another note.
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-brand-dark transition hover:border-brand-red/30"
                    onClick={() => setSent(false)}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
              <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor={nameId} className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-brand-dark">Your name</span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        Required
                      </span>
                    </label>
                    <div className={`${fieldWrap} ${errors.name ? fieldWrapErr : fieldWrapOk}`}>
                      <User
                        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                        size={22}
                        aria-hidden
                      />
                      <input
                        id={nameId}
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearError("name");
                        }}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                        className={inputInner}
                      />
                    </div>
                    <FormFieldError id="contact-name-error" message={errors.name} />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={emailId} className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-brand-dark">Email</span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        Required
                      </span>
                    </label>
                    <div className={`${fieldWrap} ${errors.email ? fieldWrapErr : fieldWrapOk}`}>
                      <Envelope
                        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                        size={22}
                        aria-hidden
                      />
                      <input
                        id={emailId}
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearError("email");
                        }}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                        className={inputInner}
                      />
                    </div>
                    <FormFieldError id="contact-email-error" message={errors.email} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor={phoneId} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Phone</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Optional
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.phone ? fieldWrapErr : fieldWrapOk}`}>
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red"
                      size={22}
                      aria-hidden
                    />
                    <input
                      id={phoneId}
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 …"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearError("phone");
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      className={inputInner}
                    />
                  </div>
                  <FormFieldError id="contact-phone-error" message={errors.phone} />
                </div>

                <div className="space-y-2">
                  <label htmlFor={subjectId} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Subject</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Required
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.subject ? fieldWrapErr : fieldWrapOk}`}>
                    <span className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand-red">
                      <PaperPlaneTilt size={22} aria-hidden />
                    </span>
                    <input
                      id={subjectId}
                      name="subject"
                      type="text"
                      placeholder="What is this about?"
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        clearError("subject");
                      }}
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                      className={inputInner}
                    />
                  </div>
                  <FormFieldError id="contact-subject-error" message={errors.subject} />
                </div>

                <div className="space-y-2">
                  <label htmlFor={messageId} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-brand-dark">Message</span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                      Required
                    </span>
                  </label>
                  <div className={`${fieldWrap} ${errors.message ? fieldWrapErr : fieldWrapOk}`}>
                    <ChatsCircle
                      className="pointer-events-none absolute left-3.5 top-4 z-[1] text-gray-400 transition-colors group-focus-within:text-brand-red"
                      size={22}
                      aria-hidden
                    />
                    <textarea
                      id={messageId}
                      name="message"
                      rows={6}
                      placeholder="Tell us how we can help…"
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        clearError("message");
                      }}
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      className={textAreaInner}
                    />
                  </div>
                  <FormFieldError id="contact-message-error" message={errors.message} />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-red text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(229,57,53,0.55)] transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_14px_36px_-8px_rgba(229,57,53,0.45)] active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-55 disabled:shadow-none"
                >
                  <span>{submitting ? "Sending…" : "Send message"}</span>
                  {!submitting ? (
                    <CaretRight
                      className="pointer-events-none text-xl transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </form>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-heading text-lg font-extrabold text-brand-dark">Prefer email?</h3>
            <p className="mt-2 text-sm text-gray-600">
              For urgent catering quotes, browse{" "}
              <Link href="/caterers" className="font-bold text-brand-red underline-offset-2 hover:underline">
                caterers near you
              </Link>{" "}
              and use each profile&apos;s enquiry options.
            </p>
          </div>
          <div className="rounded-2xl border border-brand-red/20 bg-gradient-to-br from-brand-red/5 to-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-red">Office</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              123 Catering Hub, Food Street,
              <br />
              Mumbai, Maharashtra 400001
            </p>
            <p className="mt-4 text-sm font-semibold text-brand-dark">+91 0123456789</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
