const enabled = (value: string | undefined) => value === "true";

export const featureFlags = {
  feedV2Enabled: enabled(process.env.FEATURE_FEED_V2_ENABLED),
  privacyV2Enabled: true, // Temporarily enabled for testing
  messageRequestsEnabled: enabled(process.env.FEATURE_MESSAGE_REQUESTS_ENABLED),
  opportunityApplicationsV2Enabled: enabled(process.env.FEATURE_OPPORTUNITY_APPLICATIONS_V2_ENABLED),
  clubVerificationV2Enabled: enabled(process.env.FEATURE_CLUB_VERIFICATION_V2_ENABLED),
  adminConsoleEnabled: enabled(process.env.FEATURE_ADMIN_CONSOLE_ENABLED),
};
