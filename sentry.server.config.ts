import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7ae62ac16e8ebe76b82796f9f605ee38@o4511513017122816.ingest.us.sentry.io/4511513028526080",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
