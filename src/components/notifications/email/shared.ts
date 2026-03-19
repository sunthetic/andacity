import type {
  NotificationRenderItemSummary,
  NotificationRenderModel,
  NotificationRenderedEmail,
} from "~/types/notifications";

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatItem = (item: NotificationRenderItemSummary) => {
  return [
    item.title,
    item.subtitle,
    item.when,
    item.where,
    item.status ? `Status: ${item.status}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" - ");
};

export const renderBaseNotificationEmail = (
  model: NotificationRenderModel,
): NotificationRenderedEmail => {
  const greeting = model.greetingName
    ? `Hi ${model.greetingName},`
    : "Hi there,";
  const itemLines = model.itemSummaries.map((item) => formatItem(item));
  const secondaryCta = model.secondaryCtaHref && model.secondaryCtaLabel;

  const textLines = [
    greeting,
    "",
    model.headline,
    model.intro,
    "",
    `${model.referenceLabel}: ${model.referenceValue}`,
    "",
    itemLines.length ? "Booked items:" : null,
    ...itemLines.map((line) => `- ${line}`),
    "",
    `${model.primaryCtaLabel}: ${model.primaryCtaHref}`,
    secondaryCta ? `${model.secondaryCtaLabel}: ${model.secondaryCtaHref}` : null,
  ].filter((line): line is string => Boolean(line));

  const itemHtml = itemLines.length
    ? `<ul>${itemLines
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("")}</ul>`
    : "";

  return {
    subject: model.subject,
    text: textLines.join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <p>${escapeHtml(greeting)}</p>
        <p><strong>${escapeHtml(model.headline)}</strong></p>
        <p>${escapeHtml(model.intro)}</p>
        <p><strong>${escapeHtml(model.referenceLabel)}:</strong> ${escapeHtml(model.referenceValue)}</p>
        ${itemHtml}
        <p>
          <a href="${escapeHtml(model.primaryCtaHref)}" style="display:inline-block;padding:10px 14px;background:#0f766e;color:white;text-decoration:none;border-radius:8px;">
            ${escapeHtml(model.primaryCtaLabel)}
          </a>
        </p>
        ${
          secondaryCta
            ? `<p><a href="${escapeHtml(model.secondaryCtaHref || "")}">${escapeHtml(model.secondaryCtaLabel || "")}</a></p>`
            : ""
        }
      </div>
    `.trim(),
  };
};
