import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin - The Whiteboard" },
    { name: "description", content: "Private writing space for notes." },
  ];
};

// Simple session management (in production, this should be in environment variables)
const ADMIN_PASSWORD = "admin2025"; // In production, use environment variables

type ActionData = {
  error?: string;
  success?: boolean;
  message?: string;
};

interface AdminNote {
  id: string;
  date: string;
  content: string;
  author?: string;
}

// In a real app, this would be stored in a database
// For demo purposes, we'll simulate with a simple array that gets reset on server restart
let adminNotes: AdminNote[] = [
  {
    id: "1",
    date: "June 22, 2025",
    content: "The art of medicine consists of amusing the patient while nature cures the disease.",
    author: "Voltaire"
  },
  {
    id: "2", 
    date: "June 21, 2025",
    content: "Every patient teaches you something new. Today I learned that sometimes healing begins with simply being heard."
  },
  {
    id: "3",
    date: "June 20, 2025", 
    content: "The heart has four chambers, but it takes just one moment of compassion to fill them all."
  },
  {
    id: "4",
    date: "June 19, 2025",
    content: "Medicine is not only a science; it is also an art. It does not consist of compounding pills and plasters; it deals with the very processes of life.",
    author: "Paracelsus"
  },
  {
    id: "5",
    date: "June 18, 2025",
    content: "In the ICU tonight, I witnessed the profound silence that exists between life and death. It taught me more than any textbook ever could."
  }
];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const authenticated = url.searchParams.get("authenticated") === "true";
  
  if (!authenticated) {
    return json({ authenticated: false, notes: [] });
  }
  
  return json({ authenticated: true, notes: adminNotes });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");
  
  if (action === "login") {
    const password = formData.get("password");
    if (password === ADMIN_PASSWORD) {
      return redirect("/admin?authenticated=true");
    }
    return json({ error: "Invalid password" }, { status: 401 });
  }
  
  if (action === "create") {
    const content = formData.get("content") as string;
    const author = formData.get("author") as string;
    
    if (!content) {
      return json({ error: "Content is required" }, { status: 400 });
    }
    
    const newNote: AdminNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      content,
      author: author || undefined
    };
    
    adminNotes.unshift(newNote);
    return json({ success: true, message: "Note created successfully!" });
  }
  
  if (action === "delete") {
    const noteId = formData.get("noteId") as string;
    adminNotes = adminNotes.filter(note => note.id !== noteId);
    return json({ success: true, message: "Note deleted successfully!" });
  }
  
  return json({ error: "Invalid action" }, { status: 400 });
};

function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F9F7' }}>
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            The Author's Sanctum
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Enter your password to access the writing space.
          </p>
          
          <Form method="post" className="space-y-4">
            <input type="hidden" name="_action" value="login" />
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200"
            >
              Enter
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}

function NoteEditor() {
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const navigation = useNavigation();
  const actionData = useActionData() as ActionData | undefined;
  
  const isSubmitting = navigation.state === "submitting";
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = () => {
    setContent("");
    setAuthor("");
    setCharCount(0);
  };

  return (
    <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Status messages */}
      {actionData?.error && (
        <div className="mb-6 p-3 text-red-800 bg-red-50 rounded-md transition-all duration-300">
          <p className="text-sm">{actionData.error}</p>
        </div>
      )}
      
      {actionData?.success && (
        <div className="mb-6 p-3 text-green-800 bg-green-50 rounded-md transition-all duration-300">
          <p className="text-sm">{actionData.message}</p>
        </div>
      )}
      
      <Form method="post" onSubmit={handleSubmit} className="space-y-8">
        <input type="hidden" name="_action" value="create" />
        
        {/* Main content area */}
        <div className="relative">
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={handleContentChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={10}
            required
            className={`w-full p-0 text-xl leading-relaxed font-sans text-gray-900 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none placeholder-gray-300 transition-all duration-200 ${
              isFocused ? 'opacity-100' : 'opacity-90 hover:opacity-100'
            }`}
            placeholder="What's on your mind..."
            style={{ minHeight: '300px' }}
          />
          
          {/* Subtle bottom border that animates on focus */}
          <div className={`h-px bg-gray-200 transition-all duration-300 ${
            isFocused ? 'bg-gray-900 scale-x-100' : 'scale-x-90 origin-left'
          }`}></div>
          
          {/* Character count */}
          <div className="mt-2 text-right">
            <span className={`text-xs font-mono transition-opacity duration-200 ${
              charCount > 0 ? 'opacity-60' : 'opacity-0'
            }`}>
              {charCount} characters
            </span>
          </div>
        </div>
        
        {/* Author input - optional */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <input
            type="text"
            id="author"
            name="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-transparent focus:border-gray-300 focus:outline-none focus:ring-0 font-sans text-gray-600 placeholder-gray-400 transition-colors duration-200"
            placeholder="— Author (optional)"
          />
        </div>
        
        {/* Submit button - subtle and minimal */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className={`px-6 py-2 text-sm font-sans tracking-wide uppercase transition-all duration-200 ${
              content.trim() 
                ? 'text-gray-900 hover:text-white hover:bg-gray-900' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </Form>
    </div>
  );
}

function NoteDashboard({ notes }: { notes: AdminNote[] }) {
  const navigation = useNavigation();
  const actionData = useActionData() as ActionData | undefined;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Notes</h2>
        <span className="text-sm text-gray-500">{notes.length} notes published</span>
      </div>
      
      {actionData?.success && actionData?.message?.includes("deleted") && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">{actionData.message}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-end items-center mb-2">
              <span className="text-xs text-gray-500">{note.date}</span>
            </div>
            
            <p className="text-gray-900 mb-2 leading-relaxed">
              {note.content}
              {note.author && (
                <span className="block text-gray-600 mt-1 italic">
                  — {note.author}
                </span>
              )}
            </p>
            
            <div className="flex justify-end">
              <Form method="post" className="inline">
                <input type="hidden" name="_action" value="delete" />
                <input type="hidden" name="noteId" value={note.id} />
                <button
                  type="submit"
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={(e) => {
                    if (!confirm("Are you sure you want to delete this note?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
        ))}
        
        {notes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Create your first one above!
          </div>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const { authenticated, notes } = useLoaderData<{ authenticated: boolean; notes: AdminNote[] }>();
  const actionData = useActionData();
  
  if (!authenticated) {
    return <LoginForm />;
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F9F7' }}>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">The Author's Sanctum</h1>
          <p className="text-gray-600">Your private space for creating and managing notes.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NoteEditor />
          <NoteDashboard notes={notes} />
        </div>
        
        <div className="mt-8 text-center">
          <a
            href="/notes"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full text-gray-900 font-medium hover:border-gray-400 transition-colors duration-200"
          >
            ← View Published Notes
          </a>
        </div>
      </div>
    </div>
  );
}
