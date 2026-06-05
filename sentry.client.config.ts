import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7ae62ac16e8ebe76b82796f9f605ee38@o4511513017122816.ingest.us.sentry.io/4511513028526080",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.feedbackIntegration({
      colorScheme: "system",
      // autoInject: true is the default. We let Sentry inject its own floating button.
      isNameRequired: true,
      isEmailRequired: true,
      useSentryUser: {
        email: "email",
        name: "name",
      },
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 100% while in development to ensure all sessions are captured.
  replaysSessionSampleRate: 1.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
