import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link as RemixLink,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="overflow-hidden">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: '#fdfaf8' }}
    >
      <div className="max-w-md text-center">
        <p className="text-sm font-normal text-gray-500 mb-2">
          {isNotFound ? "404" : "Something went wrong"}
        </p>
        <h1 className="text-3xl font-normal mb-4" style={{ color: '#1d1b19' }}>
          {isNotFound ? "Page not found" : "An unexpected error occurred"}
        </h1>
        <p className="text-gray-600 mb-8">
          {isNotFound
            ? "The page you're looking for doesn't exist or has moved."
            : "Please try again in a moment."}
        </p>
        <RemixLink
          to="/notes"
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-full text-gray-900 font-medium hover:border-gray-400 transition-colors duration-200"
        >
          ← Back to notes
        </RemixLink>
      </div>
    </div>
  );
}
