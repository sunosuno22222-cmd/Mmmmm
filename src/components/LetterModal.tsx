import React, { useState, useEffect } from "react";
import { doc, onSnapshot, runTransaction, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { letterData } from "../letterData";
import { Heart, ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import CommentsSection from "./CommentsSection";

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReactionData {
  likes: number;
  dislikes: number;
}

export default function LetterModal({ isOpen, onClose }: LetterModalProps) {
  const [reactions, setReactions] = useState<ReactionData>({ likes: 0, dislikes: 0 });
  const [localReaction, setLocalReaction] = useState<"like" | "dislike" | null>(null);

  // Load local reaction state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("letter_reaction_status") as "like" | "dislike" | null;
    if (saved === "like" || saved === "dislike") {
      setLocalReaction(saved);
    }
  }, []);

  // Listen to Firestore real-time updates for reactions
  useEffect(() => {
    if (!isOpen) return;

    const reactionDocRef = doc(db, "reactions", "letter_reactions");
    const unsubscribe = onSnapshot(reactionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ReactionData;
        setReactions({
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
        });
      } else {
        // Document does not exist yet, initialize it
        setDoc(reactionDocRef, { likes: 0, dislikes: 0 }).catch((e) =>
          console.error("Erro ao inicializar as reações:", e)
        );
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  // Atomic transactions to handle reactions reliably
  const handleReactionClick = async (type: "like" | "dislike") => {
    const reactionDocRef = doc(db, "reactions", "letter_reactions");
    const previousReaction = localReaction;

    // optimistic UI update
    let newLikes = reactions.likes;
    let newDislikes = reactions.dislikes;

    if (type === "like") {
      if (previousReaction === "like") {
        newLikes = Math.max(0, newLikes - 1);
        setLocalReaction(null);
        localStorage.removeItem("letter_reaction_status");
      } else if (previousReaction === "dislike") {
        newLikes = newLikes + 1;
        newDislikes = Math.max(0, newDislikes - 1);
        setLocalReaction("like");
        localStorage.setItem("letter_reaction_status", "like");
      } else {
        newLikes = newLikes + 1;
        setLocalReaction("like");
        localStorage.setItem("letter_reaction_status", "like");
      }
    } else {
      if (previousReaction === "dislike") {
        newDislikes = Math.max(0, newDislikes - 1);
        setLocalReaction(null);
        localStorage.removeItem("letter_reaction_status");
      } else if (previousReaction === "like") {
        newDislikes = newDislikes + 1;
        newLikes = Math.max(0, newLikes - 1);
        setLocalReaction("dislike");
        localStorage.setItem("letter_reaction_status", "dislike");
      } else {
        newDislikes = newDislikes + 1;
        setLocalReaction("dislike");
        localStorage.setItem("letter_reaction_status", "dislike");
      }
    }

    setReactions({ likes: newLikes, dislikes: newDislikes });

    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(reactionDocRef);
        let currentLikes = 0;
        let currentDislikes = 0;

        if (sfDoc.exists()) {
          const sfData = sfDoc.data() as ReactionData;
          currentLikes = sfData.likes || 0;
          currentDislikes = sfData.dislikes || 0;
        }

        let updatedLikes = currentLikes;
        let updatedDislikes = currentDislikes;

        if (type === "like") {
          if (previousReaction === "like") {
            updatedLikes = Math.max(0, updatedLikes - 1);
          } else if (previousReaction === "dislike") {
            updatedLikes = updatedLikes + 1;
            updatedDislikes = Math.max(0, updatedDislikes - 1);
          } else {
            updatedLikes = updatedLikes + 1;
          }
        } else {
          if (previousReaction === "dislike") {
            updatedDislikes = Math.max(0, updatedDislikes - 1);
          } else if (previousReaction === "like") {
            updatedDislikes = updatedDislikes + 1;
            updatedLikes = Math.max(0, updatedLikes - 1);
          } else {
            updatedDislikes = updatedDislikes + 1;
          }
        }

        transaction.set(reactionDocRef, {
          likes: updatedLikes,
          dislikes: updatedDislikes,
        });
      });
    } catch (e) {
      console.error("Erro ao sincronizar reações com o banco:", e);
      // Revert if error occurs
      setLocalReaction(previousReaction);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#fcfaf2] overflow-y-auto flex flex-col"
    >
      {/* Sticky elegant header bar */}
      <div className="sticky top-0 z-30 w-full bg-[#fcfaf2]/90 backdrop-blur-md border-b border-stone-200/60 py-4 px-6 flex items-center justify-between shadow-sm">
        <button
          onClick={onClose}
          className="group flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-full transition-all font-sans font-medium text-sm cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Capa
        </button>
        <span className="text-[11px] uppercase tracking-wider text-stone-500 font-sans font-bold">
          Modo Leitura
        </span>
      </div>

      {/* Full screen Notebook Paper Text Area */}
      <div className="w-full flex-1 notebook-paper py-12 px-6 sm:px-12 md:px-16 text-stone-800 font-serif relative">
        <div className="max-w-3xl mx-auto">
          
          {/* Header metadata on notebook lines */}
          <div className="mb-10 text-stone-500 text-sm font-sans flex flex-col gap-1 pl-12 border-b border-stone-200/50 pb-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-600">De: {letterData.author}</span>
              <span className="text-xs">Início: {letterData.dateStart}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-600">Para: Ana</span>
              <span className="text-xs text-stone-400">Carta de Amizade</span>
            </div>
          </div>

          {/* Letter Title */}
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-stone-900 text-center mb-10 tracking-tight pl-12 leading-tight">
            {letterData.title}
          </h1>

          {/* Paragraphs */}
          <div className="space-y-4 pl-12 text-stone-800 text-base sm:text-lg leading-[2.25rem] tracking-wide">
            {letterData.paragraphs.map((p, index) => {
              const isHeading = p === "Lembra da Ana Beatriz?" || p === "Por que eu ainda consigo ser tão infantil?" || p === "Eu posso ser inconveniente." || p === "Eu não quero me tornar alguém possessivo.";
              const isSignature = p === "Benjamim";
              
              if (isHeading) {
                return (
                  <h2
                    key={index}
                    className="font-serif font-bold text-stone-950 mt-8 pt-4 block border-t border-stone-200/30"
                  >
                    {p}
                  </h2>
                );
              }

              if (isSignature) {
                return (
                  <div key={index} className="text-right pt-12 font-serif italic font-bold text-stone-900 text-xl">
                    — {p}
                  </div>
                );
              }

              return (
                <p
                  key={index}
                  className="indent-8 text-justify leading-[2.25rem]"
                >
                  {p}
                </p>
              );
            })}
          </div>

          {/* Footer date */}
          <div className="mt-16 text-right text-stone-400 text-xs font-sans pl-12 border-t border-stone-200/50 pt-6">
            Fim da carta: {letterData.dateEnd}
          </div>

          {/* Quick Action Area at bottom of notebook paper */}
          <div className="mt-16 border-t-2 border-stone-300/40 pt-10 pb-20">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-200/60">
              {/* Confirm / Close Button */}
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                Entendi (Ok)
              </button>

              {/* Reaction Buttons */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
                
                {/* Like */}
                <button
                  onClick={() => handleReactionClick("like")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    localReaction === "like"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${localReaction === "like" ? "fill-emerald-500" : ""}`} />
                  <span className="px-2 py-0.5 rounded-md bg-stone-200/40 text-stone-700 text-xs font-mono">
                    {reactions.likes}
                  </span>
                </button>

                {/* Dislike */}
                <button
                  onClick={() => handleReactionClick("dislike")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                    localReaction === "dislike"
                      ? "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                      : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <ThumbsDown className={`w-4 h-4 ${localReaction === "dislike" ? "fill-rose-500" : ""}`} />
                  <span className="px-2 py-0.5 rounded-md bg-stone-200/40 text-stone-700 text-xs font-mono">
                    {reactions.dislikes}
                  </span>
                </button>

              </div>
            </div>

            {/* Comments thread inside scroll layout */}
            <div className="mt-8">
              <CommentsSection />
            </div>

          </div>

        </div>
      </div>
    </motion.div>
  );
}
