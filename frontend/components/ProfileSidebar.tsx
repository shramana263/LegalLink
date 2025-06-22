import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Eye,
  TrendingUp,
  Bookmark,
  Users,
  Calendar,
  MapPin,
  Star,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { API } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  type: "user" | "advocate";
  userType?: "client" | "advocate";
  location: string;
  bio: string;
  image: string;
}

interface AdvocateRatings {
  averageRating: number;
  totalRatings: number;
  ratings?: {
    stars: number;
    feedback: string;
    user_id: string;
  }[];
}

interface ProfileSidebarProps {
  user: User;
}

export default function ProfileSidebar({ user }: ProfileSidebarProps) {
  const [advocateData, setAdvocateData] = useState<any>(null);
  const [advocateRatings, setAdvocateRatings] =
    useState<AdvocateRatings | null>(null);
  const [isLoadingAdvocateData, setIsLoadingAdvocateData] = useState(false);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if the user is an advocate based on type or userType properties
  const isAdvocate = user.type === "advocate" || user.userType === "advocate";

  useEffect(() => {
    // Only fetch advocate data if user is an advocate
    if (!isAdvocate) return;

    // Step 1: Fetch advocate data to get advocate_id
    const fetchAdvocateData = async () => {
      setIsLoadingAdvocateData(true);
      setError(null);
      try {
        const response = await API.Advocate.getAdvocateData();
        setAdvocateData(response.data);

        // Step 2: If advocate_id exists, fetch ratings
        if (response.data && response.data.advocate_id) {
          await fetchAdvocateRatings(response.data.advocate_id);
        }
      } catch (err: any) {
        console.error("Error fetching advocate data:", err);
        setError(
          err?.response?.data?.message || "Failed to load advocate data"
        );
      } finally {
        setIsLoadingAdvocateData(false);
      }
    };

    // Fetch ratings using advocate_id
    const fetchAdvocateRatings = async (advocateId: string) => {
      setIsLoadingRatings(true);
      try {
        const response = await API.Advocate.getAdvocateRatings(advocateId);
        setAdvocateRatings(response.data);
      } catch (err: any) {
        console.error("Error fetching advocate ratings:", err);
        // Don't set error as it's not critical
      } finally {
        setIsLoadingRatings(false);
      }
    };

    fetchAdvocateData();
  }, [isAdvocate]);

  return (
    <div className="space-y-4">
      {/* Main Profile Card */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="h-16  bg-gradient-to-b from-blue-700 via-blue-300 to-blue-300 dark:from-indigo-700 dark:via-indigo-950 dark:to-slate-900 "></div>
        <div className=" inset-0 bg-gradient-to-t from-background via-transparent opacity-150"></div>

        <CardContent className="relative pt-0 pb-4">
          {/* Profile Avatar */}
          <div className="flex justify-center -mt-8 mb-4">
            <Avatar className="h-16 w-16 border-4 border-background">
              <AvatarImage
                src={user.image || "/placeholder.svg"}
                alt={user.name}
              />
              <AvatarFallback className="text-lg">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {user.bio}
            </p>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              {user.location ? user.location : "Location not specified"}
            </div>
            {isAdvocate && (
              <Badge variant="secondary" className="mt-2">
                {advocateData?.is_verified ? "Verified Advocate" : "Advocate"}
              </Badge>
            )}

            {/* Enhanced rating display for advocates with feedback preview */}
            {isAdvocate && (
              <div className="mt-2 space-y-2">
                {isLoadingAdvocateData || isLoadingRatings ? (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-xs text-center text-muted-foreground italic">
                    Not yet verified as an advocate
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-sm">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <=
                              Math.round(advocateRatings?.averageRating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-muted-foreground">
                        {advocateRatings?.averageRating
                          ? `${parseFloat(
                              advocateRatings.averageRating.toString()
                            ).toFixed(1)} / 5.0`
                          : "(No ratings yet)"}
                        {advocateRatings?.totalRatings
                          ? ` (${advocateRatings.totalRatings})`
                          : ""}
                      </span>
                    </div>
                    
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          {/* <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Profile viewers</span>
              </div>
              <span className="font-medium text-primary">127</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Post impressions</span>
              </div>
              <span className="font-medium text-primary">1,234</span>
            </div>
          </div> */}

          {/* View Profile Button */}
          <Link href={`/profile/${user.id}`} className="block mt-4">
            <Button variant="outline" className="w-full">
              View Full Profile
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Link
              href="/advocates"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Find Advocates</span>
            </Link>
            {/* <Link
              href="/saved"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Bookmark className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Saved Items</span>
            </Link>
            <Link
              href="/events"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Legal Events</span>
            </Link> */}
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade Card
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            Upgrade to Premium
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            Get priority access to top advocates and advanced AI features.
          </p>
          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700">
            Try Premium for ₹0
          </Button>
        </CardContent>
      </Card> */}
    </div>
  );
}
