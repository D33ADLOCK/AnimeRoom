import { serve } from "inngest/next";
import { inngest } from "~/inngest/client";
import { generateVideo } from "~/inngest/functions";

const handler = serve({
  client: inngest,
  functions: [generateVideo],
});

export { handler as GET, handler as POST, handler as PUT };
