"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { API } from "@/lib/api";

export default function AdvocatePostsFeed({ advocateId }: { advocateId: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!advocateId) return;
    setIsLoading(true);
    API.Social.getPostsByAdvocate(advocateId)
      .then((res) => setPosts(res.data || []))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, [advocateId]);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return <div className="text-center text-muted-foreground py-8">No posts found.</div>;
  }

  return (
    <div className="space-y-6">
      {posts.map((post, idx) => (
        <Card key={post.id || idx} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.advocate?.user?.image || "/placeholder.svg"} alt={post.advocate?.user?.name || "A"} />
                <AvatarFallback>{post.advocate?.user?.name?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm">{post.advocate?.user?.name || "Advocate"}</h4>
                  <Badge variant="secondary" className="text-xs">Advocate</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed mb-4">{post.text}</p>
            {post.image_url && (
              <div className="mb-4">
                <img src={post.image_url} alt="Post attachment" className="rounded-lg max-h-64 object-contain border" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
