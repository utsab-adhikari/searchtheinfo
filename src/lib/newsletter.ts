import crypto from "crypto";
import connectDB from "@/database/connectDB";
import Subscriber from "@/models/subscriberModel";
import NewsletterTemplate from "@/models/newsletterTemplateModel";
import SentNewsletter from "@/models/sentNewsletterModel";
import { sendEmail } from "./email";
import { withDbTiming } from "./monitoring/dbTimer";

export interface SubscribeResult {
  success: boolean;
  status?: "subscribed" | "already-subscribed" | "resubscribed";
  message: string;
}

function validateEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function renderTemplate(
  template: string,
  data: Record<string, string | number | undefined>
): string {
  return Object.entries(data).reduce((acc, [key, value]) => {
    const safeValue = value == null ? "" : String(value);
    return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), safeValue);
  }, template);
}

export async function subscribeToNewsletter(
  email: string,
  name?: string,
  source: "homepage" | "manual" | "import" | "other" = "homepage"
): Promise<SubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    return { success: false, message: "Invalid email address" };
  }

  await connectDB();

  const existing = await withDbTiming("newsletter-subscriber-find", () =>
    Subscriber.findOne({ email: normalizedEmail })
  );

  if (existing) {
    if (existing.status === "subscribed") {
      return {
        success: true,
        status: "already-subscribed",
        message: "You are already subscribed to the newsletter.",
      };
    }

    existing.status = "subscribed";
    existing.unsubscribedAt = undefined;
    existing.name = name || existing.name;
    existing.source = source;

    await withDbTiming("newsletter-subscriber-resubscribe", () =>
      existing.save()
    );

    return {
      success: true,
      status: "resubscribed",
      message: "You have been resubscribed to the newsletter.",
    };
  }

  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  await withDbTiming("newsletter-subscriber-create", () =>
    Subscriber.create({
      email: normalizedEmail,
      name,
      status: "subscribed",
      source,
      unsubscribeToken,
    })
  );

  return {
    success: true,
    status: "subscribed",
    message: "You have been subscribed to the newsletter.",
  };
}

export async function unsubscribeFromNewsletter(token: string) {
  await connectDB();

  const subscriber = await withDbTiming("newsletter-unsubscribe-find", () =>
    Subscriber.findOne({ unsubscribeToken: token })
  );

  if (!subscriber) {
    return { success: false, message: "Invalid or expired unsubscribe link." };
  }

  if (subscriber.status === "unsubscribed") {
    return { success: true, message: "You are already unsubscribed." };
  }

  subscriber.status = "unsubscribed";
  subscriber.unsubscribedAt = new Date();

  await withDbTiming("newsletter-unsubscribe-update", () => subscriber.save());

  return { success: true, message: "You have been unsubscribed." };
}

interface SendArticleNewsletterOptions {
  article: {
    title: string;
    slug: string;
    description?: string;
  };
}

export async function sendArticlePublishedNewsletter(
  options: SendArticleNewsletterOptions
) {
  await connectDB();

  const template = await withDbTiming(
    "newsletter-template-article-published",
    () =>
      NewsletterTemplate.findOne({
        type: "article_published",
        isActive: true,
      })
  );

  if (!template) {
    console.warn(
      "[newsletter] No active 'article_published' template configured, skipping newsletter send."
    );
    return { success: false, skipped: true as const };
  }

  const subscribers = await withDbTiming(
    "newsletter-subscribers-active",
    () => Subscriber.find({ status: "subscribed" }).lean()
  );

  if (!subscribers.length) {
    console.warn("[newsletter] No active subscribers, skipping send.");
    return { success: false, skipped: true as const };
  }

  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/articles/v1/${encodeURIComponent(
    options.article.slug
  )}`;

  const unsubscribeUrlBase = `${baseUrl}/api/newsletter/unsubscribe`;

  const subject = renderTemplate(template.subject, {
    title: options.article.title,
  });

  const htmlBase = renderTemplate(template.html, {
    title: options.article.title,
    summary: options.article.description || "",
    url: articleUrl,
  });

  const textBase = template.text
    ? renderTemplate(template.text, {
        title: options.article.title,
        summary: options.article.description || "",
        url: articleUrl,
      })
    : undefined;

  const sentLog = await withDbTiming("newsletter-sent-create", () =>
    SentNewsletter.create({
      template: template._id,
      subject,
      html: htmlBase,
      text: textBase,
      audienceDescription: `All active subscribers (${subscribers.length})`,
      recipientsCount: subscribers.length,
      status: "sending",
      meta: {
        articleSlug: options.article.slug,
      },
    })
  );

  let successCount = 0;
  let failureCount = 0;

  for (const sub of subscribers) {
    const unsubscribeUrl = `${unsubscribeUrlBase}?token=${encodeURIComponent(
      sub.unsubscribeToken
    )}`;

    const html = `${htmlBase}
<hr style="margin-top:24px;border:none;border-top:1px solid #e5e7eb" />
<p style="font-size:12px;color:#6b7280">You are receiving this email because you subscribed to SearchTheInfo. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;

    const text =
      (textBase || "") +
      `\n\nYou are receiving this email because you subscribed to SearchTheInfo. To unsubscribe, visit: ${unsubscribeUrl}`;

    const result = await sendEmail({
      to: sub.email,
      subject,
      html,
      text,
    });

    if (result.success) {
      successCount += 1;
      await withDbTiming("newsletter-update-last-sent", () =>
        Subscriber.updateOne(
          { _id: sub._id },
          { $set: { lastSentAt: new Date() } }
        )
      );
    } else {
      failureCount += 1;
    }
  }

  sentLog.successCount = successCount;
  sentLog.failureCount = failureCount;
  sentLog.status = failureCount > 0 && successCount === 0 ? "failed" : "sent";

  await withDbTiming("newsletter-sent-finalize", () => sentLog.save());

  return {
    success: true,
    skipped: false as const,
    successCount,
    failureCount,
  };
}
