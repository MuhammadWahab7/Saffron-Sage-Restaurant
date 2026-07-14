const isLocalPreview = () =>
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export async function submitNetlifyForm(formName, values) {
  if (isLocalPreview()) {
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    return { mode: "preview" };
  }

  const body = new URLSearchParams({
    "form-name": formName,
    ...values,
  }).toString();

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("The form could not be submitted. Please try again.");
  }

  return { mode: "live" };
}
