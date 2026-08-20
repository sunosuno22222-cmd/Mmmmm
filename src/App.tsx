import React, { useState } from "react";
import { letterData } from "./letterData";
import LetterModal from "./components/LetterModal";
import { Mail, Calendar, User, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col justify-between selection:bg-amber-100 select-none">
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e1d3_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Simple Square Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm bg-white rounded-2xl border border-stone-200/80 shadow-lg overflow-hidden transition-all duration-300"
          id="main-letter-card"
        >
          {/* Square Envelope Container */}
          <div className="aspect-square w-full relative flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-50 border-b border-stone-100 p-8">
            <div className="w-24 h-24 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-center shadow-inner">
              <Mail className="w-10 h-10 text-stone-600" />
            </div>
          </div>

          {/* Card Info Section */}
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-serif font-bold text-stone-800 text-center leading-tight">
              {letterData.title}
            </h2>

            {/* Metadata Fields */}
            <div className="space-y-2 text-stone-500 text-xs font-sans border-t border-stone-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-400">
                  <User className="w-3.5 h-3.5" />
                  Autor:
                </span>
                <span className="font-semibold text-stone-700">{letterData.author}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-400">
                  <Calendar className="w-3.5 h-3.5" />
                  Data:
                </span>
                <span className="font-semibold text-stone-700">18/07</span>
              </div>
            </div>

            {/* Explicit Button to open */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-stone-100 font-sans font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              <BookOpen className="w-4 h-4" />
              Ler Carta
            </button>
          </div>
        </motion.div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="w-full text-center py-6 text-[10px] uppercase tracking-wider text-stone-400 font-sans relative z-10 border-t border-stone-200/30">
        &copy; {new Date().getFullYear()} Correspondência
      </footer>

      {/* Letter Reading View (Notebook Modal overlay) */}
      <AnimatePresence>
        {isModalOpen && (
          <LetterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
