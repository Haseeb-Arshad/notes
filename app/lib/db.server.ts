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
      "The palest ink is better than the best memory. Write it down before the day takes it from you.",
    author: "Chinese proverb",
  },
  {
    date: "2025-06-20",
    content: "How do I know what I think until I see what I say?",
    author: "E. M. Forster",
  },
  {
    date: "2025-06-15",
    content:
      "Keep a notebook. Travel with it, eat with it, sleep with it. It becomes your closest companion.",
  },
  {
    date: "2025-06-10",
    content:
      "Today I realized that writing something down is the first step to understanding it.",
  },
  {
    date: "2025-05-25",
    content:
      "Your mind is for having ideas, not holding them. The moment an idea matters, give it a page.",
    author: "David Allen",
  },
  {
    date: "2025-05-20",
    content: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
  },
  {
    date: "2025-05-15",
    content:
      "A page a day is a book a year. Small, steady notes beat one grand plan that never starts.",
  },
  {
    date: "2025-05-10",
    content:
      "We do not remember days; we remember moments. A note is how you keep the moment.",
    author: "Cesare Pavese",
  },
  {
    date: "2025-04-30",
    content: "When you feel like giving up, remember why you started.",
  },
  {
    date: "2025-04-18",
    content:
      "Rereading an old note today felt like receiving a letter from someone who knew me well.",
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
