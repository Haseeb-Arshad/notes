import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";

// Dummy data import - would be replaced with actual data from a database
import { notes } from "../data/notes";

interface Note {
  id: string;
  date: string;
  content: string;
  author?: string;
  liked?: boolean;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { slug } = params;
  
  // Find the note with the matching ID
  const note = notes.find(note => note.id === slug);
  
  // If note doesn't exist, redirect to notes page
  if (!note) {
    return redirect('/notes');
  }
  
  return json({ note });
};

export default function NoteSlugRoute() {
  const { note } = useLoaderData<{ note: Note }>();
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdfaf8' }}>
      {/* Header with back navigation */}
      <header className="py-6 px-6 md:px-10 md:pl-8 border-b border-gray-200">
        <div className="max-w-3xl mx-auto w-full">
          <Link 
            to="/archive/notes" 
            className="text-gray-500 hover:text-gray-900 flex items-center"
          >
            ← Back to archive
          </Link>
          <h1 className="text-2xl font-medium mt-2" style={{ color: '#1d1b19' }}>
            Note
          </h1>
        </div>
      </header>
      
      {/* Note content */}
      <div className="flex-1 py-8 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <div className="border-l-2 border-gray-200 pl-6 py-1">
            <p className="text-sm font-normal text-gray-500 mb-4">
              {note.date}
            </p>
            <div className="space-y-4">
              <p className="text-xl leading-relaxed font-normal" style={{ color: '#1d1b19' }}>
                {note.content}
              </p>
            </div>
            <div className="mt-8 flex items-center">
              <button
                className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <svg
                  className={`w-6 h-6 transition-colors ${note.liked ? 'text-red-500' : 'text-gray-400'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Like</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
