"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProfileSidebar from "@/components/ProfileSidebar";
import AIQuerySection from "@/components/AIQuerySection";
import FeedContent from "@/components/FeedContent";
import NewsThread from "@/components/NewsThread";
import CreatePostSection from "@/components/CreatePostSection";
import ProblemQuery from "@/components/ProblemQuery";

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSearch = (query: string) => {
    // Handle search functionality here
    console.log("Searching for:", query);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Map user to required ProfileSidebar props
  const profileUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.image || "/placeholder-user.jpg",
    type: (user.type === "client" ? "user" : user.type) || (user.userType === "client" ? "user" : user.userType) || "user",
    location: (user as any).location || "",
    bio: (user as any).bio || "",
    total_ratings: (user as any).total_ratings,
    average_rating: (user as any).average_rating,
    feedback: (user as any).feedback,
    image:(user as any).image || "/placeholder-user.jpg",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search Box */}
      <ProblemQuery onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile (Red section in reference) */}
          <div className="lg:col-span-3">
            <ProfileSidebar user={profileUser} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6">
            {/* AI Query Section for Users (Green section in reference) */}
            {user.type === "client" && <AIQuerySection />}

            {/* Create Post Section for Advocates */}
            {user.type === "advocate" && <CreatePostSection />}

            {/* Feed Content */}
            <FeedContent />
          </div>

          {/* Right Sidebar - News Thread (Yellow section in reference) */}
          {/* <div className="lg:col-span-3">
            <NewsThread />
          </div> */}
        </div>
      </div>
    </div>
  );
}
