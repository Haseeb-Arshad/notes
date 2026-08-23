import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { destroySession, getSession } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/admin", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export async function loader() {
  return redirect("/admin");
}
