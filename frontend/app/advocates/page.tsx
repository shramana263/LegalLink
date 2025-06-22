"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, MapPin, Star, Users, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Update Advocate interface to match backend response
interface Advocate {
  advocate_id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  specializations: string[];
  experience: string; // e.g. "Junior", "MidLevel", "Senior"
  rating: number;
  casesHandled: number;
  consultationFee: number;
  verified: boolean;
  languages: string[];
}

// Specialization options for the Select
const SPECIALIZATION_OPTIONS = [
  { value: "all", label: "All Specializations" },
  { value: "CRIMINAL", label: "Criminal Law" },
  { value: "CIVIL", label: "Civil Law" },
  { value: "CORPORATE", label: "Corporate Law" },
  { value: "FAMILY", label: "Family Law" },
  { value: "CYBER", label: "Cyber Law" },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property" },
  { value: "TAXATION", label: "Taxation" },
  { value: "LABOR", label: "Labor Law" },
  { value: "ENVIRONMENT", label: "Environment Law" },
  { value: "HUMAN_RIGHTS", label: "Human Rights" },
  { value: "OTHER", label: "Other" },
];

export default function AdvocatesPage() {
  const { user } = useAuth();
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(0);
  const [feeType, setFeeType] = useState<string>("Consultation");
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(
    null
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch advocates from backend API
  const fetchAdvocates = async (filters: any = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await API.Advocate.searchAdvocates(filters);
      // Map backend response to Advocate[]
      console.log("hello");
      const data = res.data.map((item: any, idx: number) => ({
        advocate_id: item.advocate_id,
        name: item.name || item.user?.name || "Unknown",
        avatar: item.image || item.user?.image || "/placeholder.svg",
        location: item.location_city || "",
        bio: item.bio || "",
        specializations: item.specializations || [],
        experience: item.experience_years || "",
        rating: item.average_rating || 0,
        casesHandled: item.total_ratings || 0,
        consultationFee: item.fee_structure?.Consultation || 0,
        verified: item.availability_status || false,
        languages: item.language_preferences || [],
      }));
      console.log("data: ", data);
      setAdvocates(data);
    } catch (err: any) {
      let message = "Failed to fetch advocates.";
      if (err?.response?.data?.error) message = err.response.data.error;
      else if (err?.message) message = err.message;
      setError(message);
      setAdvocates([]);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and on filter/search change
  useEffect(() => {
    // Build filters for API
    const filters: any = {};
    if (searchQuery) filters.name = searchQuery;
    if (selectedSpecialization !== "all")
      filters.specialization = selectedSpecialization;
    if (selectedLocation !== "all") filters.location_city = selectedLocation;
    if (minRating > 0) filters.min_rating = minRating;
    if (maxFee > 0) filters.max_fee = maxFee;
    if (feeType) filters.fee_type = feeType;
    if (experienceLevel !== "all") filters.experience_level = experienceLevel;
    if (sortBy) filters.sort_by = sortBy;
    if (sortOrder) filters.sort_order = sortOrder;
    fetchAdvocates(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedSpecialization,
    selectedLocation,
    minRating,
    maxFee,
    feeType,
    experienceLevel,
    sortBy,
    sortOrder,
    searchParams,
  ]);

  // Debounced search for advocates (improved: only triggers after user stops typing for 1000ms)
  useEffect(() => {
    if (searchQuery.length === 0) {
      fetchAdvocates({});
      return;
    }
    if (searchQuery.length < 2) return; // Don't search for single letters
    const handler = setTimeout(() => {
      const urlSearch = searchParams?.get("search");
      if (urlSearch) setSearchQuery(urlSearch);
      // Build filters for API
      const filters: any = {};
      if (searchQuery) filters.name = searchQuery;
      if (selectedSpecialization !== "all")
        filters.specialization = selectedSpecialization;
      if (selectedLocation !== "all") filters.location_city = selectedLocation;
      if (minRating > 0) filters.min_rating = minRating;
      if (maxFee > 0) filters.max_fee = maxFee;
      if (feeType) filters.fee_type = feeType;
      if (experienceLevel !== "all") filters.experience_level = experienceLevel;
      if (sortBy) filters.sort_by = sortBy;
      if (sortOrder) filters.sort_order = sortOrder;
      fetchAdvocates(filters);
    }, 1000); // 1000ms debounce for longer pause
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedSpecialization,
    selectedLocation,
    minRating,
    maxFee,
    feeType,
    experienceLevel,
    sortBy,
    sortOrder,
    searchParams,
  ]);

  // Open modal and fetch slots
  const handleConnectRequest = async (advocateId: string) => {
    const advocate =
      advocates.find((a) => a.advocate_id === advocateId) || null;
    setSelectedAdvocate(advocate);
    setShowAppointmentModal(true);
    setSlots([]);
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    setReason("");
    setBooking(false);
    setBookingSuccess(null);
    setBookingError(null);
    try {
      const res = await API.Appointment.getAdvocateAvailability(advocateId);
      setSlots(res.data || []);
    } catch (err: any) {
      let msg = "Failed to fetch available slots.";
      if (err?.response?.data?.error) msg = err.response.data.error;
      setSlotsError(msg);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Book appointment
  const handleBook = async () => {
    if (!selectedAdvocate || !selectedSlot) return;
    setBooking(true);
    setBookingError(null);
    try {
      const res = await API.Appointment.book({
        advocate_id: selectedAdvocate.advocate_id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reason,
      });
      setBookingSuccess(res.data);
      toast({
        title: "Appointment Booked!",
        description: "Check your email for details.",
        variant: "default",
      });
    } catch (err: any) {
      let msg = "Failed to book appointment.";
      if (err?.response?.data?.error) msg = err.response.data.error;
      setBookingError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="text-center mt-20">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchAdvocates()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Determine if user can rate (must have client/user type)
  const canRate =
    user &&
    (user.type === "client" ||
      user.type === "user" ||
      user.userType === "client");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Find Legal Advocates
          </h1>
          <p className="text-muted-foreground">
            Connect with verified legal professionals for your specific needs
          </p>
        </div>{" "}
        {/* Search and Filters */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5 bg-card p-6 rounded-xl shadow-md border border-border flex-wrap">
            <div className="flex-1 relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, specialization, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full shadow-sm focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>{" "}
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Specialization */}
              <Select
                value={selectedSpecialization}
                onValueChange={setSelectedSpecialization}
              >
                <SelectTrigger className="w-full min-w-[160px] md:w-[180px] bg-background shadow-sm">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>{" "}
              {/* Location */}
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
              >
                <SelectTrigger className="w-full min-w-[130px] md:w-[150px] bg-background shadow-sm">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                </SelectContent>
              </Select>{" "}
              {/* Experience */}
              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
              >
                <SelectTrigger className="w-full min-w-[130px] md:w-[150px] bg-background shadow-sm">
                  <SelectValue placeholder="Experience Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Experience</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="MidLevel">MidLevel</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>{" "}
              {/* Fee Type */}
              <Select value={feeType} onValueChange={setFeeType}>
                <SelectTrigger className="w-full min-w-[120px] md:w-[140px] bg-background shadow-sm">
                  <SelectValue placeholder="Fee Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="PreAppearance">PreAppearance</SelectItem>
                  <SelectItem value="FixedCase">FixedCase</SelectItem>
                </SelectContent>
              </Select>{" "}
              {/* Max Fee */}
              <div className="flex flex-col gap-1 w-full min-w-[100px] md:w-[110px]">
                <Input
                  type="number"
                  min={0}
                  value={maxFee === 0 ? "" : maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="bg-background text-foreground shadow-sm text-center"
                  placeholder="Max Fee"
                />
              </div>{" "}
              {/* Min Rating */}
              <div className="flex flex-col gap-1 w-full min-w-[100px] md:w-[110px]">
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={minRating === 0 ? "" : minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  placeholder="Min Rating"
                  className="bg-background text-foreground shadow-sm text-center"
                />
              </div>
              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full min-w-[110px] md:w-[120px] bg-background shadow-sm">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Default</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>{" "}
              {/* Sort Order */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full min-w-[90px] md:w-[100px] bg-background shadow-sm">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {advocates.length} advocate
            {advocates.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Advocates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advocates.map((advocate) => {
            return (
              <Card
                key={advocate.advocate_id}
                className="hover:shadow-lg transition-shadow flex flex-col"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage
                        src={advocate.avatar || "/placeholder.svg"}
                        alt={advocate.name}
                      />
                      <AvatarFallback>{advocate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-base truncate">
                          {advocate.name}
                        </h3>
                        {advocate.verified && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{advocate.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        <span>
                          {advocate.rating
                            ? parseFloat(advocate.rating.toString()).toFixed(1)
                            : "0.0"}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          Experience: {advocate.experience || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-3 pb-4 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {advocate.bio || "No bio available"}
                  </p>

                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-medium mb-2">
                        Specializations
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {advocate.specializations.length > 0 ? (
                          <>
                            {advocate.specializations
                              .slice(0, 2)
                              .map((spec, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {spec}
                                </Badge>
                              ))}
                            {advocate.specializations.length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                              >
                                +{advocate.specializations.length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No specializations listed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span>{advocate.casesHandled} cases</span>
                      </div>
                      <div className="font-medium text-foreground">
                        {advocate.consultationFee
                          ? `₹${advocate.consultationFee}/consultation`
                          : "Fee not provided"}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 mt-4">
                      <Button
                        size="sm"
                        className="col-span-6"
                        onClick={() =>
                          handleConnectRequest(advocate.advocate_id)
                        }
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Book Appointment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="col-span-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      {canRate && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="col-span-4 text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700 dark:hover:bg-yellow-950 dark:hover:text-yellow-400"
                          onClick={() =>
                            router.push(
                              `/advocates/${advocate.advocate_id}#rate`
                            )
                          }
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Rate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          router.push(`/advocates/${advocate.advocate_id}`)
                        }
                        className={canRate ? "col-span-12 mt-1" : "col-span-4"}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {advocates.length === 0 && (
          <div className="text-center py-16 my-8 bg-muted/20 rounded-lg">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-3">No advocates found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search criteria or filters to find advocates in
              your area
            </p>
          </div>
        )}
      </div>
      {/* Appointment Modal */}
      <Dialog
        open={showAppointmentModal}
        onOpenChange={setShowAppointmentModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {selectedAdvocate && (
            <div>
              <div className="mb-2 font-medium">
                Advocate: {selectedAdvocate.name}
              </div>
              {/* Step 1: Show slots */}
              {!selectedSlot && !bookingSuccess && (
                <div>
                  <div className="mb-2">Select an available slot:</div>
                  {slotsLoading ? (
                    <div>Loading slots...</div>
                  ) : slotsError ? (
                    <div className="text-red-500 text-sm mb-2">
                      {slotsError}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-muted-foreground text-sm mb-2">
                      No slots available.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto mb-2">
                      {slots.map((slot, idx) => (
                        <Button
                          key={idx}
                          variant={
                            selectedSlot === slot ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {new Date(slot.start).toLocaleDateString()}{" "}
                          {new Date(slot.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(slot.end).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Step 2: Enter reason and confirm */}{" "}
              {selectedSlot && !bookingSuccess && (
                <div className="space-y-3">
                  <div className="text-sm mb-1">
                    Selected Slot:{" "}
                    <span className="font-medium">
                      {new Date(selectedSlot.start).toLocaleDateString()}{" "}
                      {new Date(selectedSlot.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(selectedSlot.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Reason for appointment (required)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                  {bookingError && (
                    <div className="text-red-500 text-sm">{bookingError}</div>
                  )}
                  <DialogFooter>
                    <Button
                      onClick={handleBook}
                      disabled={booking || !reason.trim()}
                      className="w-full"
                    >
                      {booking ? "Booking..." : "Confirm Appointment"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedSlot(null)}
                      className="w-full mt-2"
                    >
                      Back to Slots
                    </Button>
                  </DialogFooter>
                </div>
              )}
              {/* Step 3: Success and Google Calendar */}
              {bookingSuccess && (
                <div className="space-y-3 text-center">
                  <div className="text-green-600 font-semibold">
                    Appointment booked successfully!
                  </div>
                  {bookingSuccess.googleCalendarLink && (
                    <a
                      href={bookingSuccess.googleCalendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Add to Google Calendar
                    </a>
                  )}
                  <div className="flex flex-col space-y-2 mt-4">
                    <Button
                      onClick={() => router.push("/appointments")}
                      className="w-full"
                    >
                      View My Appointments
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAppointmentModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
