import type { MetaFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "The Whiteboard | Medical Student Notes" },
    { name: "description", content: "A collection of medical student notes and thoughts" },
  ];
};

export default function NotesLayout() {
  return <Outlet />;

}
