"use client";
import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function PostComments({ postId, showInputOnly = false }: { postId: string, showInputOnly?: boolean }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await API.Social.getComments(postId);
        setComments(res.data || []);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await API.Social.commentOnPost({ post_id: postId, comment });
      setComment("");
      // Refresh comments
      const res = await API.Social.getComments(postId);
      setComments(res.data || []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={showInputOnly ? "" : "mt-4 p-5"}>
      {!showInputOnly && <div className="mb-2 font-semibold">Comments</div>}
      {!showInputOnly && (loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-muted-foreground">No comments yet.</div>
      ) : (
        <div className="space-y-2 mb-2">
          {comments.map((c, i) => (
            <div key={c.id || i} className="text-sm bg-muted/30 rounded p-2">
              <span className="font-medium">{c.user?.name || "User"}:</span> {c.comment}
            </div>
          ))}
        </div>
      ))}
      {user && (
        <div className="flex gap-2 mt-2">
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            placeholder="Write a comment..."
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={submitting || !comment.trim()}>
            {submitting ? "Posting..." : "Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
