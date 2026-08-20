import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { MessageSquare, Send, User, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Timestamp | null;
}

export default function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to real-time comments ordered by createdAt descending (newest first)
    const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments: Comment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          author: data.author || "Anônimo",
          content: data.content || "",
          createdAt: data.createdAt || null,
        });
      });
      setComments(fetchedComments);
    }, (error) => {
      console.error("Erro ao carregar comentários:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "comments"), {
        author: author.trim() ? author.trim() : "Anônimo",
        content: content.trim(),
        createdAt: serverTimestamp(),
      });
      setContent("");
      // Clear keyboard focus on mobile
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCommentDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "Enviando...";
    const date = timestamp.toDate();
    
    // Format hours and minutes
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    
    return `${day}/${month} às ${hours}:${minutes}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-stone-50/80 backdrop-blur-md rounded-2xl border border-stone-200/60 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-semibold text-stone-800">
            Comentários Globais
          </h3>
          <p className="text-xs text-stone-500">
            Deixe sua mensagem para Benjamim ou Ana. Sincronizado em tempo real.
          </p>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              id="commenter-name"
              placeholder="Seu nome"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-sans"
              maxLength={20}
            />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <input
              type="text"
              id="comment-content"
              placeholder="Escreva um comentário..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-4 py-2 bg-white rounded-lg border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-sans"
              required
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-stone-800 hover:bg-amber-800 text-stone-100 font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-stone-800 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <div className="text-center py-12 text-stone-400 font-sans text-sm">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-white rounded-xl border border-stone-200/50 shadow-sm/5 hover:border-amber-500/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <span className="font-medium text-stone-800 text-sm font-sans flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1 font-sans">
                    <Clock className="w-3 h-3" />
                    {formatCommentDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-stone-600 text-sm font-serif leading-relaxed break-words whitespace-pre-wrap pl-3 border-l border-stone-100">
                  {comment.content}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
}
