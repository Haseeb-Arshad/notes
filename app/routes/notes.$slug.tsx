import { redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getNote } from "~/lib/db.server";
import { SilentApplause } from "~/components/SilentApplause";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const note = getNote(params.slug ?? "");

  // If note doesn't exist, redirect to notes page
  if (!note) {
    return redirect("/notes");
  }

  return { note };
};

export default function NoteSlugRoute() {
  const { note } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdfaf8' }}>
      {/* Header with back navigation */}
      <header className="py-6 px-6 md:px-10 md:pl-8 border-b border-gray-200">
        <div className="max-w-3xl mx-auto w-full">
          <Link
            to="/notes"
            className="text-gray-500 hover:text-gray-900 flex items-center"
          >
            ← Back to notes
          </Link>
          <h1 className="text-2xl font-medium mt-2" style={{ color: '#1d1b19' }}>
            Note
          </h1>
        </div>
      </header>

      {/* Note content */}
      <div className="flex-1 py-8 px-6 md:px-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="border-l-2 border-gray-200 pl-6 py-1">
            <p className="text-sm font-normal text-gray-500 mb-4">
              {note.date}
            </p>
            <div className="space-y-4">
              <p className="text-xl leading-relaxed font-normal" style={{ color: '#1d1b19' }}>
                {note.content}
                {note.author && (
                  <span className="block text-base font-normal text-gray-600 mt-3">
                    — {note.author}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-8 flex items-center">
              <SilentApplause noteId={note.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
