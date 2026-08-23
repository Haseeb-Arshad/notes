import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

// All storage lives behind this module so the backing store can be swapped
// (e.g. Postgres/Turso) without touching route code.

export interface Note {
  id: string;
  /** Display date, e.g. "June 22, 2025" */
  date: string;
  content: string;
  author?: string;
}

interface NoteRow {
  id: number;
  content: string;
  author: string | null;
  /** ISO date, YYYY-MM-DD */
  date: string;
}

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "notes.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    author TEXT,
    date TEXT NOT NULL
  );
`);

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toDisplayDate(iso: string): string {
  // Parse manually and format in UTC so the displayed day never shifts
  // across server timezones.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function toNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    date: toDisplayDate(row.date),
    content: row.content,
    ...(row.author ? { author: row.author } : {}),
  };
}

const SEED_NOTES: Array<{ date: string; content: string; author?: string }> = [
  {
    date: "2025-06-22",
    content:
      "The most critical skill in medicine isn't diagnosis or treatment—it's learning to truly listen to your patients.",
    author: "Dr. Atul Gawande",
  },
  {
    date: "2025-06-20",
    content:
      "If you listen carefully, the patient will tell you the diagnosis.",
    author: "Dr. William Osler",
  },
  {
    date: "2025-06-15",
    content:
      "USMLE Step 1 prep: Focus on high-yield concepts and active recall, not passive reading.",
  },
  {
    date: "2025-06-10",
    content:
      "Today I realized that sometimes the most powerful medicine we can offer is simply being present.",
  },
  {
    date: "2025-05-25",
    content:
      "The key to the Krebs cycle isn't memorizing each step, but understanding why each conversion occurs and the energy captured.",
  },
  {
    date: "2025-05-20",
    content:
      "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "Sir William Osler",
  },
  {
    date: "2025-05-15",
    content:
      "Studying medicine is like trying to drink from a fire hydrant. Focus on understanding concepts, not memorizing facts.",
  },
  {
    date: "2025-05-10",
    content:
      "Medicine is a science of uncertainty and an art of probability.",
    author: "Sir William Osler",
  },
  {
    date: "2025-04-30",
    content: "When you feel like giving up, remember why you started.",
  },
  {
    date: "2025-04-18",
    content:
      "Today's patient reminded me that behind every case is a human being with their own story.",
  },
];

const noteCount = () =>
  (db.prepare("SELECT COUNT(*) AS count FROM notes").get() as { count: number }).count;

if (noteCount() === 0) {
  const insert = db.prepare(
    "INSERT INTO notes (content, author, date) VALUES (?, ?, ?)"
  );
  const seed = db.transaction(() => {
    for (const note of SEED_NOTES) {
      insert.run(note.content, note.author ?? null, note.date);
    }
  });
  seed();
}

export function listNotes(): Note[] {
  const rows = db
    .prepare("SELECT * FROM notes ORDER BY date DESC, id DESC")
    .all() as NoteRow[];
  return rows.map(toNote);
}

export function getNote(id: string): Note | undefined {
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as
    | NoteRow
    | undefined;
  return row ? toNote(row) : undefined;
}

export function createNote(input: { content: string; author?: string }): Note {
  const result = db
    .prepare("INSERT INTO notes (content, author, date) VALUES (?, ?, ?)")
    .run(input.content.trim(), input.author?.trim() || null, toIsoDate(new Date()));
  return getNote(String(result.lastInsertRowid))!;
}

export function deleteNote(id: string): boolean {
  const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return result.changes > 0;
}
