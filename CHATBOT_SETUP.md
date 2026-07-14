# Sage Concierge Setup

Sage answers common restaurant questions locally and sends broader food or dining questions to Gemini through a Netlify Function.

```text
Visitor → React chatbot → /api/chat → Netlify Function → Gemini API
```

## 1. Create a Gemini API key

Create an API key in Google AI Studio and store it in a password manager. Do not paste the key into React code, `.env.example`, GitHub, screenshots, logs, or support messages.

## 2. Configure Netlify

Open **Project configuration → Environment variables** and add:

```text
Key: GEMINI_API_KEY
Value: your private Gemini API key
```

Give the variable Functions access. Do not use `VITE_GEMINI_API_KEY` or `NEXT_PUBLIC_GEMINI_API_KEY`, because either name would expose the key in the browser bundle.

The default model is:

```text
gemini-3.1-flash-lite
```

To override it, add:

```text
GEMINI_MODEL=another-compatible-model
```

Redeploy after changing either variable.

## 3. Local testing

`npm run dev` starts only Vite, so local rule-based answers work without Gemini. To exercise `/api/chat` locally, run the project with Netlify Dev and provide `GEMINI_API_KEY` through its local environment handling.

Never commit a local `.env` file. The repository's `.gitignore` excludes environment files while preserving `.env.example` as documentation.

## 4. Acceptance checks

Test both local and model-backed paths:

```text
What are your opening hours?
What is in the Garden Herb Pasta?
Recommend two dishes from your menu.
Suggest a light gluten-aware meal.
How do I reserve a table?
Who won the latest football match?
```

Expected behaviour:

- known restaurant facts return immediately from the browser rules
- food and dining questions outside the local rules receive a concise Gemini response
- unrelated questions receive a formal scope refusal
- booking questions direct guests to the authenticated reservation flow
- the chatbot never claims live availability or confirms a booking itself

## Troubleshooting

### Sage is not connected

Confirm `GEMINI_API_KEY` exists in Netlify, is available to Functions, and was followed by a new deploy.

### Local answers work but broader questions fail on localhost

Vite does not run Netlify Functions. Use Netlify Dev or test the deployed site.

### Rate limit response

Check the Gemini project's current limits and usage, then retry after the provider's reset window.

### Function failure

Review **Netlify → Logs → Functions → chat**. The function logs status details but must never log the API key.
