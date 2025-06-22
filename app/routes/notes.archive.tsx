import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

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
  
  // Calculate scroll position for the hot-scrollbar
  const [scrollPosition, setScrollPosition] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const position = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollPosition(position);
      }
    };
    
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Handle clicking on timeline month
  const scrollToMonth = (month: string) => {
    setActiveMonth(month);
    const monthElement = document.getElementById(`month-${month.replace(/\s+/g, '-')}`);
    if (monthElement && contentRef.current) {
      contentRef.current.scrollTo({
        top: monthElement.offsetTop - 20,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-[#F9F9F7] text-gray-900 flex flex-col">
      <div className="flex-grow flex relative">
        {/* Back to notes link */}
        <div className="absolute top-6 left-6 z-10">
          <Link to="/notes" className="text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to notes
          </Link>
        </div>
        
        {/* Main content - Timeline of notes */}
        <div 
          ref={contentRef}
          className="flex-grow overflow-y-auto py-20 px-4 sm:px-0"
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl mb-8 font-normal">All Notes</h1>
            
            <div className="space-y-12">
              {timelineData.map((group) => (
                <div 
                  key={group.month} 
                  id={`month-${group.month.replace(/\s+/g, '-')}`}
                  className="border-l-2 border-gray-200 pl-6 relative"
                >
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-gray-200"></div>
                  <h2 className="text-lg text-gray-600 mb-4 font-normal">{group.month}</h2>
                  
                  <div className="space-y-8">
                    {notes
                      .filter(note => {
                        const date = new Date(note.date);
                        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
                        return monthYear === group.month;
                      })
                      .map(note => (
                        <motion.div 
                          key={note.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white p-6 rounded-md shadow-sm"
                        >
                          <div className="text-gray-500 text-sm mb-2">{note.date}</div>
                          <p className="text-xl font-normal mb-4">{note.content}</p>
                          {note.author && (
                            <div className="text-gray-500 text-sm">— {note.author}</div>
                          )}
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Hot-scrollbar timeline */}
        <div className="w-16 md:w-24 bg-white border-l border-gray-100 hidden sm:block">
          <div className="sticky top-0 p-4 h-screen flex flex-col">
            <div className="text-xs text-gray-400 mb-4 text-center">Timeline</div>
            
            <div className="flex-grow relative">
              {/* Timeline track */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2"></div>
              
              {/* Timeline nodes */}
              <div className="h-full relative">
                {timelineData.map((group, index) => {
                  const position = (index / (timelineData.length - 1)) * 100;
                  const isActive = group.month === activeMonth;
                  
                  return (
                    <button
                      key={group.month}
                      onClick={() => scrollToMonth(group.month)}
                      className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center transition-all
                        ${isActive ? 'scale-110' : 'scale-100'}`}
                      style={{ top: `${position}%` }}
                      title={`${group.month} (${group.count} notes)`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 w-3 h-3' : 'bg-gray-400'}`}></span>
                    </button>
                  );
                })}
                
                {/* Scroll indicator */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md z-10 transition-all duration-200"
                  style={{ top: `${scrollPosition}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed footer */}
      <footer className="bg-white border-t border-gray-100 py-4 px-6 text-center text-gray-400 text-sm fixed bottom-0 w-full">
        The Whiteboard — Medical student notes by Maryam
      </footer>
    </div>
  );
}
