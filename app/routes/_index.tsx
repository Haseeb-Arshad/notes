import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";

// Redirect the homepage to the /notes route
export const loader: LoaderFunction = async () => {
  return redirect("/notes");
};

export default function Index() {
  return null;
}

