// Dummy data for notes - would be replaced with actual data from a database
export interface Note {
  id: string;
  date: string;
  content: string;
  author?: string;
  liked?: boolean;
}

export const notes: Note[] = [
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
