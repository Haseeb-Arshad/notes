import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { completeGoogleSignIn } from "~/lib/auth.server";

// Handles Google's OAuth redirect. Resource route — no UI.
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const result = await completeGoogleSignIn(
    request,
    url.searchParams.get("code"),
    url.searchParams.get("state"),
    url.searchParams.get("error")
  );

  if (result.user) {
    return redirect("/admin");
  }
  return redirect(`/admin?error=${result.error ?? "auth_failed"}`);
}
