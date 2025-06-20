"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import ReportAdvocateDialog from "@/components/advocate/ReportAdvocateDialog";

import AdvocateCasesList from "@/components/advocate/AdvocateCasesList";
import AdvocatePostsFeed from "@/components/AdvocatePostsFeed";

export default function AdvocateProfilePage() {
  const { id } = useParams() as { id: string };
  const [advocate, setAdvocate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any>(null);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const { user } = useAuth(); // Get user from auth context

  // States for rating functionality
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // For debugging
  console.log("Current user:", user);
  console.log("User type:", user?.type || user?.userType);

  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch advocate details
    setLoading(true);
    API.Advocate.getAdvocateById(id as string)
      .then((res) => setAdvocate(res.data))
      .catch((err) => {
        toast({
          title: "Failed to load advocate details",
          description: err?.response?.data?.error || err.message || String(err),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));

    // Fetch advocate ratings separately with improved error handling
    setLoadingRatings(true);
    API.Advocate.getAdvocateRatings(id as string)
      .then((res) => {
        console.log("Ratings data received:", res.data);
        // Handle both camelCase and snake_case field names
        const ratingsData = {
          average_rating:
            res.data.average_rating || res.data.averageRating || 0,
          total_ratings: res.data.total_ratings || res.data.totalRatings || 0,
          feedback:
            res.data.feedback ||
            (res.data.ratings && res.data.ratings.length > 0
              ? res.data.ratings
                  .map((r: { feedback: string }) => r.feedback)
                  .filter(Boolean)
              : []),
        };
        setRatings(ratingsData);
      })
      .catch((err) => {
        console.error("Failed to load advocate ratings:", err);
        setRatings({ average_rating: 0, total_ratings: 0, feedback: [] });
      })
      .finally(() => {
        setLoadingRatings(false);
      });
  }, [id]);

  // Function to handle rating submission
  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setSubmittingRating(true);
    try {
      await API.Advocate.addRating(id as string, {
        stars: selectedRating,
        feedback: feedback.trim() || undefined,
      });

      toast({
        title: "Rating submitted",
        description: "Thank you for rating this advocate!",
      });

      // Reset form and close dialog
      setSelectedRating(0);
      setFeedback("");
      setRatingOpen(false);
    } catch (error: any) {
      toast({
        title: "Failed to submit rating",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(false);
    }

    // After successful rating submission, refresh ratings
    API.Advocate.getAdvocateRatings(id as string)
      .then((res) => setRatings(res.data))
      .catch((err) => console.error("Failed to refresh ratings:", err));
  };

  // Determine if user can rate (handle multiple possible user type structures)
  const canRate =
    user &&
    (user.type === "client" ||
      user.type === "user" ||
      user.userType === "client");

  // Fetch advocate cases
  const fetchCases = async (advocateId: string) => {
    setCasesLoading(true);
    try {
      const res = await API.Advocate.getCases(advocateId);
      setCases(res.data);
    } catch (err) {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCases(id as string);
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <Card className="mb-8 overflow-hidden border shadow-lg rounded-lg">
            <div className="h-40 bg-gradient-to-r from-blue-600/90 via-blue-500/80 to-purple-600/80 relative" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                <div className="flex-1 space-y-3 pt-4 md:pt-0">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : advocate ? (
          <Card className="mb-8 overflow-hidden border shadow-lg rounded-lg">
            <div className="h-40 bg-gradient-to-r from-blue-600/90 via-blue-500/80 to-purple-600/80 relative">
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]"></div>
            </div>
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                  <AvatarImage
                    src={advocate.user?.image || "/placeholder.svg"}
                    alt={advocate.name}
                    onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {advocate.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3 pt-4 md:pt-0">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold tracking-tight">
                        {advocate.name}
                      </h1>
                      <Badge className="bg-primary/90 hover:bg-primary">
                        Advocate
                      </Badge>
                      {advocate.is_verified && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2">
                      {advocate.location_city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary/70" />
                          <span className="text-sm">
                            {advocate.location_city}
                          </span>
                        </div>
                      )}
                      {advocate.contact_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-primary/70" />
                          <span className="text-sm">
                            {advocate.contact_email}
                          </span>
                        </div>
                      )}
                      {advocate.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-primary/70" />
                          <span className="text-sm">
                            {advocate.phone_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons section */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge
                      variant="secondary"
                      className={
                        advocate.availability_status
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }
                    >
                      {advocate.availability_status
                        ? "Available for Consultation"
                        : "Currently Unavailable"}
                    </Badge>

                    {/* Add Report Button */}
                    {user && user.id !== advocate.advocate_id && (
                      <ReportAdvocateDialog
                        advocateId={advocate.advocate_id}
                        advocateName={
                          advocate.name ||
                          advocate.user?.name ||
                          "this advocate"
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Rating section at bottom of the card */}
            <div className="border-t border-border px-6 py-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {loadingRatings ? (
                    <>
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(ratings?.average_rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">
                        {ratings?.average_rating || ratings?.averageRating
                          ? `${parseFloat(
                              String(
                                ratings?.average_rating ||
                                  ratings?.averageRating
                              )
                            ).toFixed(1)} / 5`
                          : "No ratings yet"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({ratings?.total_ratings || ratings?.totalRatings || 0}{" "}
                        {(ratings?.total_ratings || ratings?.totalRatings) === 1
                          ? "rating"
                          : "ratings"}
                        )
                      </span>
                    </div>
                  )}
                </div>

                {canRate && (
                  <Button
                    onClick={() => setRatingOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 dark:border-yellow-900 dark:hover:bg-yellow-950"
                  >
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    Rate This Advocate
                  </Button>
                )}
              </div>

              {/* Display feedback if available */}
              {ratings?.feedback && ratings.feedback.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium">Recent Feedback</h4>
                  <div className="bg-background/50 border border-border/50 rounded-md p-4 text-sm">
                    <p className="italic">"{ratings.feedback[0]}"</p>
                    {ratings.feedback.length > 1 && (
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        +{ratings.feedback.length - 1} more feedback
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <CardHeader className="bg-muted/30 border-t border-border">
              <CardTitle className="text-xl">Advocate Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-background border border-border/60 p-4 rounded-lg">
                  <h4 className="font-medium text-black dark:text-white text-primary-foreground mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h.01" />
                      <path d="M17 7h.01" />
                      <path d="M7 17h.01" />
                      <path d="M17 17h.01" />
                    </svg>
                    Registration Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-border/30">
                      <span className="text-muted-foreground">
                        Registration Number:
                      </span>
                      <span className="font-medium">
                        {advocate.registration_number || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/30">
                      <span className="text-muted-foreground">
                        Reference Number:
                      </span>
                      <span className="font-medium">
                        {advocate.reference_number || "Not provided"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">
                        Verification Status:
                      </span>
                      <span
                        className={
                          advocate.is_verified
                            ? "text-emerald-600 font-medium dark:text-emerald-400"
                            : "text-amber-600 font-medium dark:text-amber-400"
                        }
                      >
                        {advocate.is_verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-background border border-border/60 p-4 rounded-lg">
                  <h4 className="font-medium text-black dark:text-white text-primary-foreground mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 py-1 border-b border-border/30">
                      <Mail className="h-4 w-4 text-primary/70" />
                      <span>
                        {advocate.contact_email || advocate.user?.email || "-"}
                      </span>
                    </div>
                    {advocate.phone_number && (
                      <div className="flex items-center gap-2 py-1">
                        <Phone className="h-4 w-4 text-primary/70" />
                        <span>{advocate.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(advocate.location_city ||
                (advocate.jurisdiction_states &&
                  advocate.jurisdiction_states.length > 0)) && (
                <div className="bg-background border border-border/60 p-4 rounded-lg">
                  <h4 className="font-medium text-primary-foreground mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Location & Jurisdiction
                  </h4>
                  <div className="flex flex-col gap-4">
                    {advocate.location_city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary/70" />
                        <span className="font-medium">
                          {advocate.location_city}
                        </span>
                      </div>
                    )}
                    {advocate.jurisdiction_states &&
                      advocate.jurisdiction_states.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-2">
                            Jurisdiction:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {advocate.jurisdiction_states.map(
                              (state: string, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-muted/30"
                                >
                                  {state}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
              {advocate.language_preferences &&
                advocate.language_preferences.length > 0 && (
                  <div className="bg-background border border-border/60 p-4 rounded-lg">
                    <h4 className="font-medium text-primary-foreground mb-3 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 text-primary"
                      >
                        <path d="m5 8 6 6"></path>
                        <path d="m4 14 6-6 2-3"></path>
                        <path d="M2 5h12"></path>
                        <path d="M7 2h1"></path>
                        <path d="m22 22-5-10-5 10"></path>
                        <path d="M14 18h6"></path>
                      </svg>
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {advocate.language_preferences.map(
                        (lang: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {lang}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              {advocate.fee_structure && (
                <div className="bg-background border border-border/60 p-4 rounded-lg">
                  <h4 className="font-medium text-primary-foreground mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 text-primary"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 8h-6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H6"></path>
                      <path d="M12 18v2"></path>
                      <path d="M12 6v2"></path>
                    </svg>
                    Fee Structure
                  </h4>
                  <div className="bg-muted/10 p-4 rounded-lg text-sm">
                    {typeof advocate.fee_structure === "string" ? (
                      advocate.fee_structure
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(
                          typeof advocate.fee_structure === "object"
                            ? advocate.fee_structure
                            : JSON.parse(advocate.fee_structure)
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0"
                          >
                            <span className="font-medium">{key}:</span>
                            <span className="font-mono bg-muted/30 py-0.5 px-2 rounded">
                              ₹{String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            {/* Advocate Cases List */}
            <div className="mt-8 p-4">
              <h3 className="font-semibold mb-2 text-lg">Cases Handled</h3>
              <AdvocateCasesList cases={cases} loading={casesLoading} />
            </div>
          </Card>
        ) : (
          <div className="text-center text-muted-foreground py-16 bg-muted/10 border border-dashed border-border rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-muted-foreground/50"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="font-medium">No details found</p>
            <p className="text-sm mt-1">
              The advocate profile couldn't be loaded
            </p>
          </div>
        )}

        {/* Posts by this Advocate
        {advocate && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Posts by this Advocate</h2>
            <AdvocatePostsFeed advocateId={advocate.advocate_id} />
          </div>
        )} */}
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" /> Rate this Advocate
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Star Rating </Label> <Label className="text-red-600">*</Label>
              <div className="flex gap-2 justify-center py-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= selectedRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium">
                {selectedRating > 0
                  ? `${selectedRating}/5 Stars`
                  : "Select a rating"}
              </p>
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Your Feedback </Label> <Label className="text-red-600">*</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience with this advocate..."
                className="resize-none min-h-[100px]"
                rows={4}
              />
              <p className="text-xs text-red-600 text-muted-foreground">
                * Fields are mandatory. Please provide a rating and feedback.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setRatingOpen(false)}
              disabled={submittingRating}
              className="border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating || selectedRating === 0}
              className={
                selectedRating > 0 ? "bg-primary hover:bg-primary/90" : ""
              }
            >
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
