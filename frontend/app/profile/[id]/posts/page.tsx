"use client";

import Navbar from "@/components/Navbar";
import AdvocatePostsList from "@/components/AdvocatePostsList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdvocateAllPostsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.userType !== "advocate")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.userType !== "advocate") return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>All My Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvocatePostsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
