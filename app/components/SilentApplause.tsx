import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Silent Applause / Like Feature — persists per-note in localStorage.
export function SilentApplause({ noteId }: { noteId: string }) {
  const storageKey = `note-like-${noteId}`;
  const [isLiked, setIsLiked] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);

  // Load like state from localStorage on mount
  useEffect(() => {
    const likeState = localStorage.getItem(storageKey);
    if (likeState === "true") {
      setIsLiked(true);
    }
  }, [storageKey]);

  const toggleLike = () => {
    const newLikeState = !isLiked;
    setIsLiked(newLikeState);
    setAnimateHeart(true);

    localStorage.setItem(storageKey, newLikeState.toString());

    setTimeout(() => {
      setAnimateHeart(false);
    }, 600);
  };

  return (
    <button
      onClick={toggleLike}
      className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      aria-label={isLiked ? "Unlike this note" : "Like this note"}
    >
      <div className="relative">
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={isLiked ? "0" : "2"}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          animate={animateHeart ? {
            scale: [1, 1.2, 1],
            transition: { duration: 0.6, ease: "easeInOut" }
          } : {}}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </motion.svg>
      </div>
      <span className="ml-2 text-sm">
        {isLiked ? "Appreciated" : "Appreciate"}
      </span>
    </button>
  );
}
