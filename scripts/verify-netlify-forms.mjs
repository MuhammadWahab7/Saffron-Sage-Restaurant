import { readFile } from "node:fs/promises";

const outputPath = new URL("../dist/netlify-forms.html", import.meta.url);
const html = await readFile(outputPath, "utf8");

const expectedForms = {
  "restaurant-booking": [
    "form-name",
    "bot-field",
    "submissionType",
    "userId",
    "bookingId",
    "bookingStatus",
    "authMode",
    "name",
    "email",
    "phone",
    "date",
    "time",
    "guests",
    "occasion",
    "preferredDish",
    "seatingPreference",
    "specialRequests",
  ],
  contact: [
    "form-name",
    "bot-field",
    "submissionType",
    "name",
    "email",
    "phone",
    "topic",
    "message",
  ],
};

for (const [formName, fields] of Object.entries(expectedForms)) {
  const formPattern = new RegExp(
    `<form\\b[^>]*\\bname=["']${formName}["'][^>]*>([\\s\\S]*?)<\\/form>`,
    "i",
  );
  const match = html.match(formPattern);

  if (!match) {
    throw new Error(`Netlify form blueprint "${formName}" is missing from the build output.`);
  }

  const openingTag = match[0].slice(0, match[0].indexOf(">") + 1);
  if (!/\bdata-netlify=["']true["']/i.test(openingTag)) {
    throw new Error(`Netlify form blueprint "${formName}" is missing data-netlify="true".`);
  }

  for (const field of fields) {
    const fieldPattern = new RegExp(`\\bname=["']${field}["']`, "i");
    if (!fieldPattern.test(match[1])) {
      throw new Error(`Field "${field}" is missing from the "${formName}" blueprint.`);
    }
  }
}

console.log("Verified Netlify form blueprints: restaurant-booking, contact");
