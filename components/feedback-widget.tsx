"use client";

import { Suspense, useState, type FormEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/provider";

const MAX_LEN = 200;

function FeedbackWidgetInner() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = message.trim().slice(0, MAX_LEN);
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          path: pathname,
          tool: searchParams.get("tool"),
          locale,
        }),
      });

      if (res.status === 429) {
        toast.error(t.feedback.tooMany);
        return;
      }
      if (!res.ok) {
        toast.error(t.feedback.error);
        return;
      }

      setMessage("");
      setOpen(false);
      toast.success(t.feedback.thanks);
    } catch {
      toast.error(t.feedback.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <form
          onSubmit={onSubmit}
          className="pointer-events-auto w-[min(100vw-2rem,18rem)] rounded-xl border border-border bg-card p-3 text-card-foreground shadow-lg"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{t.feedback.title}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t.feedback.close}
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            rows={4}
            placeholder={t.feedback.placeholder}
            className="min-h-20 resize-none text-sm"
            disabled={sending}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {message.length}/{MAX_LEN}
            </span>
            <Button type="submit" size="sm" disabled={sending || message.trim().length === 0}>
              {sending ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t.feedback.sending}
                </>
              ) : (
                t.feedback.send
              )}
            </Button>
          </div>
        </form>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="pointer-events-auto shadow-md"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MessageSquare />
        {t.feedback.open}
      </Button>
    </div>
  );
}

export function FeedbackWidget() {
  return (
    <Suspense fallback={null}>
      <FeedbackWidgetInner />
    </Suspense>
  );
}
