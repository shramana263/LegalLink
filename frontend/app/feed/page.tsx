"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProfileSidebar from "@/components/ProfileSidebar";
import AIQuerySection from "@/components/AIQuerySection";
import FeedContent from "@/components/FeedContent";
import NewsThread from "@/components/NewsThread";
import CreatePostSection from "@/components/CreatePostSection";
import ProblemQuery from "@/components/ProblemQuery";
import { Menu, X } from "lucide-react";
import { API } from "@/lib/api";

export default function FeedPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSearch = (query: string) => {
    // Handle search functionality here
    console.log("Searching for:", query);
  };

  // Debounced search for feed page (improved: only triggers after user stops typing for 1000ms)
  const [feedSearch, setFeedSearch] = useState("");
  useEffect(() => {
    if (feedSearch.length === 0) return;
    if (feedSearch.length < 2) return; // Don't search for single letters
    const handler = setTimeout(() => {
      handleSearch(feedSearch);
    }, 1000); // 1000ms debounce for longer pause
    return () => clearTimeout(handler);
  }, [feedSearch]);

  // Advocate name suggestions for dropdown
  const [advocateSuggestions, setAdvocateSuggestions] = useState<any[]>([]);
  useEffect(() => {
    if (feedSearch.length < 2) {
      setAdvocateSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        // Try searching by allowed properties: location_city, jurisdiction_states, specialization, etc.
        // If you want to search by name, but the API does not support it, you must update the backend.
        // For now, try searching by location_city as a demonstration.
        const res = await API.Advocate.searchAdvocates({ location_city: feedSearch });
        setAdvocateSuggestions(
          Array.isArray(res.data)
            ? res.data.map((a: any) => ({ name: a.name || a.user?.name, id: a.advocate_id }))
            : []
        );
      } catch {
        setAdvocateSuggestions([]);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [feedSearch]);

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

      {/* Mobile: Sidebar open button */}
      <div className="lg:hidden flex items-center px-4 pt-4">
        <button
          className="p-2 rounded-md border text-sm font-medium flex items-center gap-2"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open profile sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Search Box
      <div className="relative">
        <ProblemQuery 
          onSearch={handleSearch} 
          onChange={setFeedSearch}
          initialQuery={feedSearch} 
          placeholder="Search posts, advocates, or keywords..."
        />
        {advocateSuggestions.length > 0 && feedSearch.length >= 2 && (
          <ul className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
            {advocateSuggestions.map(a => (
              <li key={a.id} className="px-4 py-2 hover:bg-muted cursor-pointer" 
                  onMouseDown={() => {
                    setFeedSearch(a.name);
                    setAdvocateSuggestions([]);
                    router.push(`/advocate/${a.id}`);
                  }}>
                {a.name}
              </li>
            ))}
          </ul>
        )}
      </div> */}
      {/* Removed hidden input for feedSearch */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile (Desktop only) */}
          <div className="hidden lg:block lg:col-span-3">
            <ProfileSidebar user={profileUser} />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6 form-modal-bg">
            {/* AI Query Section for Users (Green section in reference) */}
            {user.type === "client" && <AIQuerySection />}

            {/* Create Post Section for Advocates */}
            {user.type === "advocate" && <CreatePostSection />}

            {/* Feed Content */}
            <FeedContent />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Blurred, darkened overlay on the right */}
          <div className="flex-1 bg-black/20 transition-all duration-300" onClick={() => setSidebarOpen(false)} />
          {/* Sidebar panel with slide-in animation, blurry bg, and blurry right border */}
          <div className="sidebar-bg w-96 pe-14 max-w-full h-full p-4 flex flex-col z-50 transition-transform duration-300 translate-x-0 animate-slide-in-left relative"
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, boxShadow: '', background: '' }}>
            {/* Logo and name at the top */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="LegalLink Logo" className="h-8 w-8" />
                <span className="font-bold text-lg text-zinc-900 dark:text-white">LegalLink</span>
              </div>
              <button
                className="p-2 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close profile sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProfileSidebar user={profileUser} />
            {/* Blurry right border, now covers the dividing line as well */}
            <div className="sidebar-blur-right" style={{ right: '-24px', width: '48px', borderRight: 'none' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// Add this to your global CSS (e.g. globals.css):
/*
@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-left {
  animation: slide-in-left 0.3s cubic-bezier(0.4,0,0.2,1);
}
*/
