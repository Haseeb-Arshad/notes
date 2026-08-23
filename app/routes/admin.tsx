import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { commitSession, getSession, getUserFromSession, type SessionUser } from "~/lib/session.server";
import { isGoogleConfigured } from "~/lib/auth.server";
import { createNote, deleteNote, listNotes, type Note } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin - The Whiteboard" },
    { name: "description", content: "Private writing space for notes." },
  ];
};

type ActionData = {
  error?: string;
  success?: boolean;
  message?: string;
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Google sign-in failed. Please try again.",
  not_authorized:
    "That Google account isn't authorized for this dashboard. Add your email to the ADMIN_EMAILS environment variable.",
};

export const loader = async ({ request }: { request: Request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const user = getUserFromSession(session);
  const url = new URL(request.url);
  const authError = url.searchParams.get("error") ?? null;
  const googleEnabled = isGoogleConfigured();
  const passwordEnabled = Boolean(process.env.ADMIN_PASSWORD);

  if (!user) {
    return json({
      authenticated: false,
      user: null as SessionUser | null,
      notes: [] as Note[],
      googleEnabled,
      passwordEnabled,
      authError,
    });
  }

  return json({
    authenticated: true,
    user,
    notes: listNotes(),
    googleEnabled,
    passwordEnabled,
    authError,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "login") {
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return json(
        { error: "Password sign-in is disabled. Sign in with Google instead." },
        { status: 400 }
      );
    }

    const password = formData.get("password");
    if (password === expectedPassword) {
      const session = await getSession(request.headers.get("Cookie"));
      session.set("user", { email: "owner", name: "Owner" });
      return redirect("/admin", {
        headers: { "Set-Cookie": await commitSession(session) },
      });
    }
    return json({ error: "Invalid password" }, { status: 401 });
  }

  // Everything below requires an authenticated session.
  const session = await getSession(request.headers.get("Cookie"));
  const user = getUserFromSession(session);
  if (!user) {
    return json({ error: "Not authorized" }, { status: 401 });
  }

  if (action === "create") {
    const content = formData.get("content") as string;
    const author = formData.get("author") as string;

    if (!content || !content.trim()) {
      return json({ error: "Content is required" }, { status: 400 });
    }

    createNote({ content, author: author || undefined });
    return json({ success: true, message: "Note created successfully!" });
  }

  if (action === "delete") {
    const noteId = formData.get("noteId") as string;
    deleteNote(noteId);
    return json({ success: true, message: "Note deleted successfully!" });
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LoginForm({
  googleEnabled,
  passwordEnabled,
  authError,
}: {
  googleEnabled: boolean;
  passwordEnabled: boolean;
  authError: string | null;
}) {
  const actionData = useActionData() as ActionData | undefined;
  const errorMessage =
    (authError && AUTH_ERROR_MESSAGES[authError]) || actionData?.error;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F9F7' }}>
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            The Author's Sanctum
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Sign in to access the writing space.
          </p>

          {errorMessage && (
            <div className="mb-6 p-3 text-red-800 bg-red-50 rounded-md">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {!googleEnabled && !passwordEnabled && (
            <div className="mb-6 p-3 text-amber-800 bg-amber-50 rounded-md">
              <p className="text-sm">
                No sign-in method is configured. Set GOOGLE_CLIENT_ID and
                GOOGLE_CLIENT_SECRET, or ADMIN_PASSWORD, to enable access.
              </p>
            </div>
          )}

          {googleEnabled && (
            <>
              <a
                href="/auth/google"
                className="w-full inline-flex justify-center items-center bg-gray-900 text-white py-2.5 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                <GoogleIcon />
                Sign in with Google
              </a>
              {passwordEnabled && (
                <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="px-4 text-xs uppercase tracking-wide text-gray-400">
                    or
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
              )}
            </>
          )}

          {passwordEnabled && (
            <Form method="post" className={googleEnabled ? "" : ""}>
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
                className={`w-full ${googleEnabled ? "mt-4" : ""} bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200`}
              >
                Enter
              </button>
            </Form>
          )}
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

function NoteDashboard({ notes }: { notes: Note[] }) {
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

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
  const data = useLoaderData<typeof loader>();

  if (!data.authenticated) {
    return (
      <LoginForm
        googleEnabled={data.googleEnabled}
        passwordEnabled={data.passwordEnabled}
        authError={data.authError}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-auto" style={{ backgroundColor: '#F9F9F7' }}>
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">The Author's Sanctum</h1>
            <p className="text-gray-600">Your private space for creating and managing notes.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
            {data.user && <span>Signed in as {data.user.email}</span>}
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full text-gray-700 hover:border-gray-400 transition-colors duration-200"
              >
                Log out
              </button>
            </Form>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <NoteEditor />
          <NoteDashboard notes={data.notes} />
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
