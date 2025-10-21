import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for Clerk user events
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const { type, data } = payload;

      console.log("Clerk webhook received:", type);

      switch (type) {
        case "user.created":
        case "user.updated": {
          // Extract user data from Clerk payload
          const phoneNumber =
            data.phone_numbers?.[0]?.phone_number || 
            data.primary_phone_number_id || 
            "";
          
          const firstName = data.first_name || "";
          const lastName = data.last_name || "";
          const name = `${firstName} ${lastName}`.trim() || "User";

          await ctx.runMutation(internal.users.upsertFromClerk, {
            clerkId: data.id,
            phoneNumber,
            name,
            profilePicUrl: data.image_url,
          });
          break;
        }

        case "user.deleted": {
          // Handle user deletion if needed
          console.log("User deleted:", data.id);
          break;
        }

        default:
          console.log("Unhandled webhook type:", type);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
