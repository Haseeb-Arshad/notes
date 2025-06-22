import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLoaderData, useParams } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "The Whiteboard - Maryam's Notes" },
    { name: "description", content: "A collection of thoughts, observations, and reflections from medical school." },
  ];
};

// Simple note type with inferred heading
type Note = {
  id: string;
  date: string;
  heading: string; // Small heading/category
  content: string;
  author?: string;
  slug: string; // URL slug
};

// Sample notes data with headings and slugs
const sampleNotes: Note[] = [
  {
    id: "1",
    date: "June 22, 2025",
    heading: "Medical Philosophy",
    content: "The art of medicine consists of amusing the patient while nature cures the disease.",
    author: "Voltaire",
    slug: "art-of-medicine"
  },
  {
    id: "2", 
    date: "June 21, 2025",
    heading: "Clinical Reflection",
    content: "Every patient teaches you something new. Today I learned that sometimes healing begins with simply being heard.",
    slug: "healing-begins"
  },
  {
    id: "3",
    date: "June 20, 2025", 
    heading: "Cardiology Note",
    content: "The heart has four chambers, but it takes just one moment of compassion to fill them all.",
    slug: "heart-chambers"
  },
  {
    id: "4",
    date: "June 19, 2025",
    heading: "Medical History",
    content: "Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters; it deals with the very processes of life.",
    author: "Paracelsus",
    slug: "medicine-science-art"
  },
  {
    id: "5",
    date: "June 18, 2025",
    heading: "ICU Experience",
    content: "In the ICU tonight, I witnessed the profound silence that exists between life and death. It taught me more than any textbook ever could.",
    slug: "icu-silence"
  }
];



// Removed CopyButton function as requested

function SilentApplause({ noteId }: { noteId: string }) {
  const [isLiked, setIsLiked] = useState(() => {
    // Initialize from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`note-like-${noteId}`);
      return saved === 'true';
    }
    return false;
  });

  // Update localStorage when like state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`note-like-${noteId}`, isLiked.toString());
    }
  }, [isLiked, noteId]);

  return (
    <button
      onClick={() => setIsLiked(!isLiked)}
      className="text-gray-400 hover:text-red-500 transition-all duration-300"
      aria-label={isLiked ? "Unlike" : "Like"}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
        animate={{
          scale: isLiked ? [1, 1.3, 1] : 1,
          rotate: isLiked ? [0, 15, -15, 0] : 0
        }}
        transition={{
          duration: 0.4,
          ease: "easeInOut"
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </motion.svg>
    </button>
  );
}

function Note({ note }: { note: Note }) {
  return (
    <div className="space-y-5">

      {/* Dateline with short text/context */}
      <div className="flex items-center space-x-1">
        <p className="text-sm font-normal text-gray-500">
          {note.date}
        </p>
        <span className="text-sm font-normal text-gray-500">
          , {note.heading}
        </span>
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
      
      {/* No footer here - it will be fixed at the bottom */}
    </div>
  );
}

// Helper function to create URL friendly slug
function createSlug(text: string): string {
  // Convert to lowercase, replace spaces with hyphens, remove special chars
  const slug = text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 20); // Limit to 20 chars
  
  return slug;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // If a slug is provided in the URL, find the note with that slug
  const { slug } = params;
  let initialIndex = 0;
  
  if (slug) {
    const foundIndex = sampleNotes.findIndex(note => note.slug === slug);
    if (foundIndex !== -1) {
      initialIndex = foundIndex;
    }
  }
  
  return json({ initialIndex, notes: sampleNotes });
};

export default function Notes() {
  const { initialIndex, notes } = useLoaderData<typeof loader>();
  const [currentNoteIndex, setCurrentNoteIndex] = useState(initialIndex);

  const currentNote = notes[currentNoteIndex];

  const goToNextNote = () => {
    setCurrentNoteIndex((prev) => (prev + 1) % sampleNotes.length);
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
              to="/notes/archive"
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
          A collection of notes by Maryam Sumbal.
        </footer>
      </div>
    </div>
  );
}
