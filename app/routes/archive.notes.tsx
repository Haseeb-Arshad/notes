import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

// Import notes from shared data file
import { notes, type Note } from "../data/notes";

// Note data is now imported from ../data/notes

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
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [localNotes, setLocalNotes] = useState(notes);
  const [visibleNotes, setVisibleNotes] = useState<Record<string, boolean>>({});

  const handleLike = (noteId: string) => {
    setLocalNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, liked: !note.liked } : note
      )
    );
  };
  
  // Handler for navigating to note page
  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  // Track when note elements are visible for lazy loading
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const noteId = entry.target.getAttribute('data-note-id');
        if (noteId) {
          if (entry.isIntersecting) {
            setVisibleNotes(prev => ({ ...prev, [noteId]: true }));
          }
        }
      });
    }, observerOptions);

    // Observe all note elements
    const noteElements = document.querySelectorAll('[data-note-id]');
    noteElements.forEach(element => observer.observe(element));

    return () => {
      noteElements.forEach(element => observer.unobserve(element));
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
            className="text-gray-500 hover:text-gray-900 flex items-center w-fit"
          >
            &larr; Back to notes
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
                      data-note-id={note.id}
                      className="border-l-2 border-gray-200 pl-6 py-1 cursor-pointer"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-100px 0px" }}
                      transition={{ duration: 0.5 }}
                      onClick={() => handleNoteClick(note.id)}
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
                  key={item.period}
                  className="absolute cursor-pointer flex flex-col items-center"
                  style={{ top: `${topPosition}%`, left: '50%', transform: 'translateX(-50%)' }}
                  onClick={() => scrollToMonth(item.period)}
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeMonth === item.period ? 'scale-150 bg-gray-800' : 'bg-gray-400'}`}
                    style={{ transform: `translateX(-50%)` }}
                  ></div>
                  <span 
                    className={`text-xs whitespace-nowrap transform -rotate-90 origin-left mt-1 transition-all duration-300 ${activeMonth === item.period ? 'text-gray-800 font-medium' : 'text-gray-400'}`}
                    style={{ 
                      position: 'absolute',
                      left: '10px', 
                      width: 'max-content'
                    }}
                  >
                    {item.period.split(' ')[0]}
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
                  key={item.period}
                  className="absolute cursor-pointer flex flex-col items-center"
                  style={{ top: `${topPosition}%`, left: '50%', transform: 'translateX(-50%)' }}
                  onClick={() => scrollToMonth(item.period)}
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${activeMonth === item.period ? 'scale-150 bg-gray-800' : 'bg-gray-400'}`}
                    style={{ transform: `translateX(-50%)` }}
                  ></div>
                  <span 
                    className={`text-xs whitespace-nowrap transform -rotate-90 origin-left mt-1 transition-all duration-300 ${activeMonth === item.period ? 'text-gray-800 font-medium' : 'text-gray-400'}`}
                    style={{ 
                      position: 'absolute',
                      left: '10px', 
                      width: 'max-content'
                    }}
                  >
                    {item.period.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Note modal has been removed in favor of navigation to full note pages */}
    </div>
  );
}
