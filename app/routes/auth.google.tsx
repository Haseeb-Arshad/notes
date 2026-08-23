import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { isGoogleConfigured, startGoogleAuth } from "~/lib/auth.server";

// Kicks off the Google OAuth flow. Resource route — no UI.
export async function loader({ request }: LoaderFunctionArgs) {
  if (!isGoogleConfigured()) {
    return redirect("/admin");
  }
  return startGoogleAuth(request);
}
