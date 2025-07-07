import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  id: string;
  date: string;
  content: string;
  author?: string;
}

// Dummy data - this would be replaced with actual data from a database
const notes: Note[] = [
  {
    id: "1",
    date: "June 22, 2025",
    content: "The most critical skill in medicine isn't diagnosis or treatment—it's learning to truly listen to your patients.",
    author: "Dr. Atul Gawande"
  },
  {
    id: "2",
    date: "June 20, 2025",
    content: "Today I realized that sometimes the most powerful medicine we can offer is simply being present.",
    author: "Maryam"
  },
  {
    id: "3",
    date: "June 18, 2025",
    content: "If you listen carefully, the patient will tell you the diagnosis.",
    author: "Dr. William Osler"
  },
  {
    id: "4",
    date: "June 15, 2025",
    content: "USMLE Step 1 prep: Focus on high-yield concepts and active recall, not passive reading.",
    author: "Maryam"
  },
  {
    id: "5",
    date: "June 10, 2025",
    content: "Studying medicine is like trying to drink from a fire hydrant. Focus on understanding concepts, not memorizing facts.",
    author: "Dr. Francis Collins"
  },
  {
    id: "6",
    date: "June 5, 2025",
    content: "When you feel like giving up, remember why you started.",
    author: "Anonymous"
  },
  {
    id: "7",
    date: "May 30, 2025",
    content: "Medicine is a science of uncertainty and an art of probability.",
    author: "Sir William Osler"
  },
  {
    id: "8",
    date: "May 25, 2025",
    content: "The key to the Krebs cycle isn't memorizing each step, but understanding why each conversion occurs and the energy captured.",
    author: "Maryam"
  },
  {
    id: "9",
    date: "May 20, 2025",
    content: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "Sir William Osler"
  },
  {
    id: "10",
    date: "May 15, 2025",
    content: "Today's patient reminded me that behind every case is a human being with their own story.",
    author: "Maryam"
  },
];

// Sort notes by date (newest first)
const sortedNotes = [...notes].sort((a, b) => {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
});

// Group notes by month for the timeline
const groupNotesByMonth = (notes: Note[]) => {
  const grouped: Record<string, { month: string; count: number }> = {};
  
  notes.forEach(note => {
    const date = new Date(note.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = { month: monthYear, count: 0 };
    }
    grouped[monthYear].count++;
  });
  
  return Object.values(grouped);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ notes: sortedNotes, timelineData: groupNotesByMonth(sortedNotes) });
};

export default function NotesArchive() {
  const { notes, timelineData } = useLoaderData<typeof loader>();
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Handle scroll to track progress and update active month
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const position = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollPosition(position);
      }
    };

    // Find active month based on scroll position
    const findActiveMonth = () => {
      const monthHeaders = document.querySelectorAll('[data-month-header]');
      let found = false;

      setActiveMonth(null);

      monthHeaders.forEach((header) => {
        if (contentRef.current && !found) {
          const rect = header.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom > 0) {
            setActiveMonth(header.getAttribute('data-month-header'));
            found = true;
          }
        }
      });
    };

    const handleScrollEvents = () => {
      handleScroll();
      findActiveMonth();
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollEvents);
      // Initialize
      handleScrollEvents();
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollEvents);
      }
    };
  }, []);

  // Scroll to month when clicking on timeline
  const scrollToMonth = (month: string) => {
    const monthElement = document.querySelector(`[data-month-header="${month}"]`);
    if (monthElement && contentRef.current) {
      contentRef.current.scrollTo({
        top: (monthElement as HTMLElement).offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  // Group notes by month for display
  const notesByMonth = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const date = new Date(note.date);
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(note);
    return acc;
  }, {});

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
            Archive
          </h1>
        </div>
      </header>

      {/* Main content area with notes timeline and hot-scrollbar */}
      <div className="flex flex-1 relative">
        {/* Timeline section */}
        <div 
          ref={contentRef}
          className="flex-1 py-8 px-6 md:px-10 md:pl-8 overflow-y-auto"
          style={{ height: 'calc(100vh - 80px)' }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Render notes grouped by month */}
            {Object.entries(notesByMonth).map(([month, monthNotes]) => (
              <div key={month} className="mb-16">
                <h2 
                  className="text-xl font-medium mb-6 sticky top-0 pt-2 pb-4 bg-opacity-80 backdrop-blur-sm z-10" 
                  style={{ color: '#1d1b19', backgroundColor: '#fdfaf8' }}
                  data-month-header={month}
                >
                  {month}
                </h2>
                <div className="space-y-10">
                  {monthNotes.map(note => (
                    <motion.div 
                      key={note.id} 
                      className="border-l-2 border-gray-200 pl-6 py-1"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-100px 0px" }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-sm font-normal text-gray-500 mb-2">
                        {note.date}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xl leading-relaxed font-normal" style={{ color: '#1d1b19' }}>
                          {note.content}
                          {note.author && (
                            <span className="block text-base font-normal text-gray-600 mt-2">
                              — {note.author}
                            </span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot-scrollbar timeline */}
        <div 
          className="hidden md:block w-20 py-8 px-2 fixed right-0 top-0 h-full" 
          style={{ backgroundColor: '#fdfaf8' }}
        >
          <div className="h-full flex flex-col items-center justify-center relative">
            {/* Visual timeline track */}
            <div 
              className="absolute w-0.5 bg-gray-200 h-3/4 rounded-full" 
              style={{ top: '12.5%' }}
            ></div>

            {/* Scrollbar indicator */}
            <motion.div 
              className="absolute w-3 h-3 rounded-full bg-gray-800 z-10"
              style={{ 
                top: `calc(12.5% + ${scrollPosition}% * 0.75)`,
                left: 'calc(50% - 6px)'
              }}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />

            {/* Month markers */}
            {timelineData.map((item, index) => {
              // Calculate position along the timeline
              const position = index / (timelineData.length - 1 || 1);
              const topPosition = 12.5 + position * 75;
              
              return (
                <div 
                  key={item.month}
                  className="absolute cursor-pointer flex flex-col items-center"
                  style={{ top: `${topPosition}%`, left: '50%', transform: 'translateX(-50%)' }}
                  onClick={() => scrollToMonth(item.month)}
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeMonth === item.month ? 'scale-150 bg-gray-800' : 'bg-gray-400'}`}
                    style={{ transform: `translateX(-50%)` }}
                  ></div>
                  <span 
                    className={`text-xs whitespace-nowrap transform -rotate-90 origin-left mt-1 transition-all duration-300 ${activeMonth === item.month ? 'text-gray-800 font-medium' : 'text-gray-400'}`}
                    style={{ 
                      position: 'absolute',
                      left: '10px', 
                      width: 'max-content'
                    }}
                  >
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
