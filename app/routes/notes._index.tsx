import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLoaderData } from "@remix-run/react";
import { listNotes } from "~/lib/db.server";
import { SilentApplause } from "~/components/SilentApplause";

// Simple note type
interface Note {
  id: string;
  date: string;
  content: string;
  author?: string;
  slug: string;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const notes: Note[] = listNotes().map((note) => ({
    ...note,
    slug: note.id,
  }));

  // Find the note matching the slug, defaulting to the most recent one
  const slug = params.slug || notes[0]?.slug;
  let initialIndex = 0;
  if (slug) {
    const foundIndex = notes.findIndex((note) => note.slug === slug);
    if (foundIndex > -1) {
      initialIndex = foundIndex;
    }
  }

  return json({ initialIndex, notes });
};

// Individual Note Component
function Note({ note }: { note: Note }) {
  return (
    <div className="space-y-6">
      {/* Dateline */}
      <div className="flex items-center space-x-1">
        <p className="text-sm font-normal text-gray-500">
          {note.date}
        </p>
      </div>
      
      {/* Main saying/note with limited width and smaller text */}
      <div className="max-w-2xl pl-0">
        <h2 className="text-3xl leading-relaxed font-normal" style={{ color: '#1d1b19', fontSize: '1.75rem', lineHeight: '1.5'  }}>
          {note.content}
          {note.author && (
            <span className="block text-2xl font-normal text-gray-600 mt-4">
              — {note.author}
            </span>
          )}
        </h2>
      </div>
      
      {/* Silent Applause */}
      <div className="flex items-center pt-4">
        <SilentApplause noteId={note.id} />
      </div>
    </div>
  );
}

export default function NotesIndex() {
  const { initialIndex, notes } = useLoaderData<typeof loader>();
  const [currentNoteIndex, setCurrentNoteIndex] = useState(initialIndex);

  const currentNote = notes[currentNoteIndex];

  const goToNextNote = () => {
    setCurrentNoteIndex((prev) => (prev + 1) % notes.length);
  };

  // Effect to update URL when note changes
  useEffect(() => {
    const slug = currentNote.slug;
    window.history.replaceState(null, "", `/notes/${slug}`);
  }, [currentNote]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdfaf8' }}>
      {/* Main content - starts from top left, shifted slightly */}
      <div className="flex-grow p-6 md:p-10 md:pl-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNote.id}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeInOut"
              }
            }}
            exit={{ 
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeInOut"
              }
            }}
          >
            <Note key={currentNote.id} note={currentNote} />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Bottom section: buttons, line, footer */}
      <div className="px-6 md:px-10 md:pl-8 mt-auto pt-8">
        {/* Buttons */}
        <div className="mb-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToNextNote}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full text-gray-900 font-medium hover:border-gray-400 transition-colors duration-200"
            >
              Next thought →
            </button>
            <Link 
              to="/archive/notes"
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full text-gray-900 font-medium hover:border-gray-400 transition-colors duration-200"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Footer line */}
        <div className="border-t border-gray-200 font-['Inter'] mb-4"></div>

        {/* Footer text */}
        <footer className="pb-8 text-left text-gray-400 text-sm">
          A collection of notes and thoughts.
        </footer>
      </div>
    </div>
  );
}
