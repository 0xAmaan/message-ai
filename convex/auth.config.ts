// Convex + Clerk Authentication Configuration
// This file tells Convex how to verify Clerk JWT tokens

export default {
  providers: [
    {
      // Use the JWT issuer domain from environment variable
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex", // Must match the JWT template name in Clerk Dashboard
    },
  ],
};
