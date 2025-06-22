import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

// This file handles dynamic routes like /notes/some-slug
// It just redirects to the main notes page which will then show the correct note

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params;
  return redirect(`/notes`, {
    status: 302,
  });
};

export default function NoteSlugRoute() {
  // This component won't actually render because we're redirecting
  return null;
}
