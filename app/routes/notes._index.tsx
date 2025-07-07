import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLoaderData } from "@remix-run/react";

// Simple note type with inferred heading
interface Note {
  id: string;
  date: string;
  heading: string;
  content: string;
  author?: string;
  slug: string;
}

// Sample notes data with headings and slugs
const sampleNotes: Note[] = [
  {
    id: "1",
    date: "June 22, 2025",
    heading: "Patient Care",
    content: "The most critical skill in medicine isn't diagnosis or treatment—it's learning to truly listen to your patients.",
    author: "Dr. Atul Gawande",
    slug: "art-of-listening"
  },
  {
    id: "2",
    date: "May 15, 2025",
    heading: "Reflection",
    content: "Today I realized that sometimes the most powerful medicine we can offer is simply being present.",
    slug: "power-of-presence"
  },
  {
    id: "3",
    date: "April 30, 2025",
    heading: "Wisdom",
    content: "If you listen carefully, the patient will tell you the diagnosis.",
    author: "Dr. William Osler",
    slug: "patient-diagnosis"
  },
  {
    id: "4",
    date: "April 10, 2025",
    heading: "Study",
    content: "USMLE Step 1 prep: Focus on high-yield concepts and active recall, not passive reading.",
    slug: "usmle-prep"
  },
  {
    id: "5",
    date: "March 22, 2025",
    heading: "Perspective",
    content: "Studying medicine is like trying to drink from a fire hydrant. Focus on understanding concepts, not memorizing facts.",
    slug: "conceptual-learning"
  },
  {
    id: "6",
    date: "February 28, 2025",
    heading: "Motivation",
    content: "When you feel like giving up, remember why you started.",
    slug: "remember-why"
  },
];

// Silent Applause / Like Feature 
function SilentApplause({ noteId }: { noteId: string }) {
  const storageKey = `note-like-${noteId}`;
  const [isLiked, setIsLiked] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);

  // Load like state from localStorage on mount
  useEffect(() => {
    const likeState = localStorage.getItem(storageKey);
    if (likeState === "true") {
      setIsLiked(true);
    }
  }, [storageKey]);

  const toggleLike = () => {
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    setAnimateHeart(true);
    
    // Store in localStorage
    localStorage.setItem(storageKey, newLikeState.toString());
    
    // Reset animation state
    setTimeout(() => {
      setAnimateHeart(false);
    }, 600);
  };

  return (
    <button 
      onClick={toggleLike} 
      className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      aria-label={isLiked ? "Unlike this note" : "Like this note"}
    >
      <div className="relative">
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor" 
          strokeWidth={isLiked ? "0" : "2"}
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-5 h-5"
          animate={animateHeart ? {
            scale: [1, 1.2, 1],
            transition: { duration: 0.6, ease: "easeInOut" }
          } : {}}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </motion.svg>
      </div>
      <span className="ml-2 text-sm">
        {isLiked ? "Appreciated" : "Appreciate"}
      </span>
    </button>
  );
}

// Individual Note Component
function Note({ note }: { note: Note }) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

// Helper function to create URL friendly slug
function createSlug(text: string): string {
  if (!text) return '';
  
  // Take first 20 characters 
  const shortened = text.substring(0, 20);
  
  // Replace special chars, convert to lowercase, replace spaces with dashes
  return shortened
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  // Find the note by slug or default to first note
  const slug = params.slug || sampleNotes[0].slug;
  
  let initialIndex = 0;
  if (slug) {
    const foundIndex = sampleNotes.findIndex(note => note.slug === slug);
    if (foundIndex > -1) {
      initialIndex = foundIndex;
    }
  }
  
  return json({ initialIndex, notes: sampleNotes });
};

export default function NotesIndex() {
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
          A collection of notes by Maryam Sumbal.
        </footer>
      </div>
    </div>
  );
}
