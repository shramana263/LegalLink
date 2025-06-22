"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MessageCircle, Share, MoreHorizontal, ThumbsUp } from "lucide-react";
import { API } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ReactionPopover from "./ReactionPopover";
import PostComments from "./PostComments";

export default function AdvocatePostsList({ limit }: { limit?: number }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deletingPost, setDeletingPost] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<Record<string, string>>({});
  const [reacting, setReacting] = useState<string | null>(null);
  const [reactionsCount, setReactionsCount] = useState<Record<string, any>>({});
  const [commentsCount, setCommentsCount] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get advocate data to get the advocate_id (user id)
        const advData = (await API.Advocate.getAdvocateData()).data;
        if (!advData || !advData.advocate_id) {
          return setError("Advocate data not found.");
        }
        const advocateId = advData.advocate_id;
        // Get posts using the advocate_id
        const response = await API.Social.getMyPosts(advocateId as string);
        const postsData = response.data || [];
        setPosts(postsData);
        setError(null);

        // For each post, fetch comments count, reactions count, and user reaction
        const commentsCountObj: Record<string, number> = {};
        const reactionsCountObj: Record<string, any> = {};
        const postReactionsObj: Record<string, string> = {};
        await Promise.all(
          postsData.map(async (post: any) => {
            // Fetch comments count
            try {
              const commentsRes = await API.Social.getComments(post.id);
              commentsCountObj[post.id] = Array.isArray(commentsRes.data) ? commentsRes.data.length : 0;
            } catch {
              commentsCountObj[post.id] = 0;
            }
            // Fetch reactions count
            try {
              const reactionsRes = await API.Social.getReactionsCountByType(post.id);
              reactionsCountObj[post.id] = reactionsRes.data || {};
            } catch {
              reactionsCountObj[post.id] = {};
            }
            // Fetch user's reaction
            try {
              const userReactionRes = await API.Social.getMyReaction(post.id);
              postReactionsObj[post.id] = userReactionRes.data?.type || "";
            } catch {
              postReactionsObj[post.id] = "";
            }
          })
        );
        setReactionsCount(reactionsCountObj);
        setPostReactions(postReactionsObj);
        setCommentsCount(commentsCountObj);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          setError("You must be a verified advocate to view or create posts.");
        } else {
          setError("Failed to fetch your posts. Please try again later.");
        }
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleEditClick = (post: any) => {
    setEditingPost(post);
    setEditText(post.text);
    setEditImage(null);
  };

  const handleEditSubmit = async () => {
    if (!editingPost) return;
    setEditLoading(true);
    try {
      let imageUrl = editingPost.image_url;
      if (editImage) {
        // Upload new image if changed
        const uploadRes = await API.Upload.uploadFile(editImage);
        imageUrl = uploadRes.data?.url || imageUrl;
      }
      await API.Social.editPost({
        post_id: editingPost.id,
        text: editText,
        image_url: imageUrl,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, text: editText, image_url: imageUrl }
            : p
        )
      );
      toast({ title: "Post updated!" });
      setEditingPost(null);
    } catch (error) {
      toast({ title: "Failed to update post", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (post: any) => {
    setDeletingPost(post);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPost) return;
    setDeleteLoading(true);
    try {
      await API.Social.deletePost(deletingPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== deletingPost.id));
      toast({ title: "Post deleted!" });
      setDeletingPost(null);
    } catch (error) {
      toast({ title: "Failed to delete post", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReact = async (postId: string, type: string) => {
    setReacting(postId + type);
    try {
      await API.Social.reactToPost({ post_id: String(postId), type: String(type) });
      setPostReactions((prev) => ({ ...prev, [postId]: type }));
      toast({ title: `You reacted: ${type}` });
      // Refresh reaction counts after reacting
      const res = await API.Social.getReactionsCountByType(postId);
      setReactionsCount((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      toast({ title: "Failed to react", variant: "destructive" });
    } finally {
      setReacting(null);
    }
  };

  const handleShowReactions = async (postId: string) => {
    try {
      const res = await API.Social.getReactionsCountByType(postId);
      setReactionsCount((prev) => ({ ...prev, [postId]: res.data }));
      setShowReactionsFor(postId);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(limit || 3)].map((_, idx) => (
          <Card key={idx} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>LO</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-4 bg-muted rounded mb-4"></div>
              <div className="h-48 bg-muted rounded"></div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground opacity-0"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    <span className="text-xs">0</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground opacity-0"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="text-xs">0</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground opacity-0"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post, idx) => (
        <Card
          key={post.id || idx}
          className="hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={post.advocate?.user?.image || "/placeholder.svg"}
                    alt={post.advocate?.user?.name || "A"}
                  />
                  <AvatarFallback>
                    {post.advocate?.user?.name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-sm">
                      {post.advocate?.user?.name || "Advocate"}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      Advocate
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(post.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(post)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(post)}
                  color="red"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed mb-4">{post.text}</p>
            {post.image_url && (
              <div className="mb-4">
                <img
                  src={post.image_url}
                  alt="Post attachment"
                  className="rounded-lg max-h-64 object-contain border"
                />
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <ReactionPopover
                  selected={postReactions[post.id]}
                  onReact={async (type) => await handleReact(post.id, type)}
                  loading={reacting?.startsWith(post.id)}
                />
                <span
                  className="ml-2 text-xs text-muted-foreground cursor-pointer underline"
                  onClick={() => handleShowReactions(post.id)}
                >
                  {/* Calculate total reactions safely and render as string */}
                  {(() => {
                    const totalReactions = Object.values(reactionsCount[post.id] || {}).reduce(
                      (a: number, b) => a + Number(b),
                      0
                    );
                    return <span>{totalReactions} reactions</span>;
                  })()}
                </span>
                <Dialog open={showReactionsFor === post.id} onOpenChange={() => setShowReactionsFor(null)}>
                  <DialogContent className="form-modal-bg">
                    <DialogHeader>
                      <DialogTitle>Reactions</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-4 flex-wrap pt-2">
                      {Object.entries(reactionsCount[post.id] || {}).map(([type, count]) => (
                        <span key={type} className="flex items-center gap-1 text-base">
                          {type}
                          <span>{String(count)}</span>
                        </span>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={"text-muted-foreground hover:text-green-600" + (openComments[post.id] ? " font-bold" : "")}
                  onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="text-xs">{commentsCount[post.id] ?? post._count?.comments ?? 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-purple-600"
                  onClick={async () => {
                    const url = `${window.location.origin}/post/${post.id}`;
                    await navigator.clipboard.writeText(url);
                    toast({ title: "Post link copied!", description: url });
                  }}
                >
                  <Share className="h-4 w-4 mr-2" />
                  <span className="text-xs">Share</span>
                </Button>
              </div>
            </div>
            {/* Render comments section if open */}
            {openComments[post.id] && <PostComments postId={post.id} />}
          </CardContent>
        </Card>
      ))}
      {/* Edit Post Modal */}
      <Dialog
        open={!!editingPost}
        onOpenChange={(open) => !open && setEditingPost(null)}
      >
        <DialogContent className="form-modal-bg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setEditImage(e.target.files?.[0] || null)}
            />
            {editingPost?.image_url && !editImage && (
              <img
                src={editingPost.image_url}
                alt="Current"
                className="max-h-40 rounded border"
              />
            )}
            {editImage && (
              <div className="text-xs text-muted-foreground">
                New image selected: {editImage.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingPost(null)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Post Modal */}
      <Dialog
        open={!!deletingPost}
        onOpenChange={(open) => !open && setDeletingPost(null)}
      >
        <DialogContent className="form-modal-bg">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPost(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
