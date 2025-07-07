import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Note {
  id: string;
  date: string;
  content: string;
  author?: string;
  liked?: boolean;
}

// Dummy data - would be replaced with actual data from a database
const notes: Note[] = [
  {
    id: "1",
    date: "June 22, 2025",
    content: "The sheer volume of information in medicine is overwhelming. The key is to build a strong conceptual framework, not just memorize isolated facts. It's about connecting the dots.",
  },
  {
    id: "2",
    date: "June 20, 2025",
    content: "Spent an hour today just listening to a patient's life story. It had nothing to do with their chief complaint, but I think it did more for them than any prescription I could have written.",
  },
  {
    id: "3",
    date: "May 15, 2025",
    content: "Realized today that the Krebs cycle is basically the metabolic engine of the cell. It's not just a diagram to memorize; it's a dynamic process that powers everything.",
  },
  {
    id: "4",
    date: "May 5, 2025",
    content: "The differential diagnosis is a mental muscle. The more you use it, the stronger and faster it gets. Need to practice it constantly.",
  },
  {
    id: "5",
    date: "April 22, 2025",
    content: "Why do we still use pagers in 2025? It feels like carrying a fossil.",
  },
  {
    id: "6",
    date: "March 28, 2025",
    content: "That feeling when you finally understand a complex physiological concept is pure gold. Today it was the renin-angiotensin-aldosterone system.",
  },
  {
    id: "7",
    date: "March 10, 2025",
    content: "The art of medicine is in navigating the gray areas. Textbooks give you the black and white, but patients live in the gray.",
  },
  {
    id: "8",
    date: "February 1, 2025",
    content: "Imposter syndrome is real. Some days you feel like you know nothing. But then you remember how far you've come.",
  },
  {
    id: "9",
    date: "January 15, 2025",
    content: "Coffee is my lifeblood. And maybe a little bit of dark chocolate.",
  },
  {
    id: "10",
    date: "December 25, 2024",
    content: "On call on Christmas Day. The hospital has a strange, quiet magic to it tonight.",
  },
  {
    id: "11",
    date: "November 11, 2024",
    content: "The human body is a masterpiece of engineering. The more I learn, the more I'm in awe.",
  },
  {
    id: "12",
    date: "October 5, 2024",
    content: "Suturing is a skill that requires so much practice. My first few attempts looked like a toddler's art project.",
  },
  {
    id: "13",
    date: "September 1, 2023",
    content: "First day of medical school. I have no idea what I'm doing, but I'm excited.",
  },
];

interface TimelineItem {
  type: 'year' | 'month' | 'half-month' | 'day';
  label: string;
  period: string;
  count: number;
}

// Group notes hierarchically for timeline display
function groupNotesForTimeline(notes: Note[]): TimelineItem[] {
  // First, count notes per month
  const monthCounts: Record<string, { count: number; dates: Date[] }> = {};
  
  notes.forEach(note => {
    const date = new Date(note.date);
    const year = date.getFullYear();
    const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${year}`;
    
    if (!monthCounts[monthYear]) {
      monthCounts[monthYear] = { count: 0, dates: [] };
    }
    
    monthCounts[monthYear].count++;
    monthCounts[monthYear].dates.push(date);
  });
  
  // Create timeline items with appropriate grouping
  const timelineItems: TimelineItem[] = [];
  const ENTRIES_THRESHOLD = 2; // Threshold for splitting a month
  
  // Group by years first
  const years = Array.from(new Set(notes.map(note => new Date(note.date).getFullYear())));
  years.sort((a, b) => b - a); // Sort descending
  
  years.forEach(year => {
    // Add year marker
    timelineItems.push({
      type: 'year',
      label: year.toString(),
      period: year.toString(),
      count: 0 // Will be calculated later
    });
    
    // Get months for this year
    const monthsInYear = Object.entries(monthCounts)
      .filter(([key]) => key.includes(year.toString()))
      .sort((a, b) => {
        const monthA = new Date(a[1].dates[0]).getMonth();
        const monthB = new Date(b[1].dates[0]).getMonth();
        return monthB - monthA; // Sort descending
      });
    
    monthsInYear.forEach(([monthYear, data]) => {
      if (data.count <= ENTRIES_THRESHOLD) {
        // If few entries, just show the month
        timelineItems.push({
          type: 'month',
          label: monthYear.split(' ')[0], // Just the month name
          period: monthYear,
          count: data.count
        });
      } else {
        // Split the month into halves or days
        const monthNum = new Date(data.dates[0]).getMonth();
        const monthName = monthYear.split(' ')[0];
        
        // Group by first/second half of month
        const firstHalf = data.dates.filter(date => date.getDate() <= 15);
        const secondHalf = data.dates.filter(date => date.getDate() > 15);
        
        if (firstHalf.length > 0) {
          timelineItems.push({
            type: 'half-month',
            label: `${monthName} (1-15)`,
            period: `${monthName} 1-15, ${year}`,
            count: firstHalf.length
          });
        }
        
        if (secondHalf.length > 0) {
          timelineItems.push({
            type: 'half-month',
            label: `${monthName} (16-31)`,
            period: `${monthName} 16-31, ${year}`,
            count: secondHalf.length
          });
        }
      }
    });
  });
  
  return timelineItems;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const timelineData = groupNotesForTimeline(notes);
  return json({ notes, timelineData });
};

export default function NotesArchive() {
  const { notes, timelineData } = useLoaderData<typeof loader>();
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [localNotes, setLocalNotes] = useState(notes);

  const handleLike = (noteId: string) => {
    setLocalNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, liked: !note.liked } : note
      )
    );
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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

  // Group notes hierarchically for display
  const notesByPeriod = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const date = new Date(note.date);
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long' });
    const monthYear = `${monthName} ${year}`;
    const day = date.getDate();
    
    // For months with many entries, split by half-month
    const period = timelineData.find(item => 
      (item.type === 'month' && item.period === monthYear) ||
      (item.type === 'half-month' && 
        item.period.includes(monthName) && 
        item.period.includes(year.toString()) &&
        ((item.period.includes('1-15') && day <= 15) ||
         (item.period.includes('16-31') && day > 15)))
    )?.period || monthYear;
    
    if (!acc[period]) {
      acc[period] = [];
    }
    acc[period].push(note);
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
            {/* Render notes grouped by period */}
            {Object.entries(notesByPeriod).map(([period, periodNotes]) => (
              <div key={period} className="mb-16">
                <h2 
                  className="text-xl font-medium mb-6 sticky top-0 pt-2 pb-4 bg-opacity-80 backdrop-blur-sm z-10" 
                  style={{ color: '#1d1b19', backgroundColor: '#fdfaf8' }}
                  data-month-header={period}
                >
                  {period}
                </h2>
                <div className="space-y-10">
                  {periodNotes.map(note => (
                    <motion.div 
                      key={note.id} 
                      className="border-l-2 border-gray-200 pl-6 py-1 cursor-pointer"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-100px 0px" }}
                      transition={{ duration: 0.5 }}
                      onClick={() => setSelectedNote(note)}
                    >
                      <p className="text-sm font-normal text-gray-500 mb-2">
                        {note.date}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xl leading-relaxed font-normal" style={{ color: '#1d1b19' }}>
                          {note.content.substring(0, 100)}...
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
      <AnimatePresence>
        {selectedNote && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedNote(null)}
          >
            <motion.div
              className="bg-white rounded-lg p-8 max-w-lg w-full mx-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <p className="text-sm font-normal text-gray-500 mb-2">
                {selectedNote.date}
              </p>
              <p className="text-xl leading-relaxed font-normal mb-4" style={{ color: '#1d1b19' }}>
                {selectedNote.content}
              </p>
              <div className="flex items-center justify-between">
                  <button
                      onClick={() => handleLike(selectedNote.id)}
                      className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                      <svg
                          className={`w-6 h-6 transition-colors ${
                              localNotes.find(n => n.id === selectedNote.id)?.liked ? 'text-red-500' : 'text-gray-400'
                          }`}
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
                  <button
                      onClick={() => setSelectedNote(null)}
                      className="text-gray-500 hover:text-gray-900"
                  >
                      Close
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
