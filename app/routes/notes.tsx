import type { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "The Whiteboard | Notes & Thoughts" },
    { name: "description", content: "A quiet collection of notes and thoughts" },
  ];
};

export default function NotesLayout() {
  return <Outlet />;

}
