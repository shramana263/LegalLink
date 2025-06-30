"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Advocate {
  advocate_id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  specializations: string[];
  experience: string;
  rating: number;
  casesHandled: number;
  consultationFee: number;
  verified: boolean;
  languages: string[];
}

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
  { value: "AADHAAR_LAW", label: "Aadhaar Law" },
  { value: "BIRTH_DEATH_MARRIAGE_REGISTRATION", label: "Birth/Death/Marriage Registration" },
  { value: "CONSUMER_PROTECTION", label: "Consumer Protection" },
  { value: "CHILD_LAW", label: "Child Law" },
  { value: "DOWRY_PROHIBITION", label: "Dowry Prohibition" },
  { value: "DRUG_AND_COSMETICS_LAW", label: "Drug and Cosmetics Law" },
  { value: "OTHER", label: "Other" },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "all", label: "All Experience" },
  { value: "Junior", label: "Junior" },
  { value: "MidLevel", label: "MidLevel" },
  { value: "Senior", label: "Senior" },
];

const FEE_TYPE_OPTIONS = [
  { value: "Consultation", label: "Consultation" },
  { value: "PreAppearance", label: "PreAppearance" },
  { value: "FixedCase", label: "FixedCase" },
];

const SORT_BY_OPTIONS = [
  { value: "all", label: "No Sorting" },
  { value: "rating", label: "Rating" },
  { value: "experience", label: "Experience" },
];

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export default function AdvocatesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- SEARCH/FILTER STATE AND LOGIC ---
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
// frontend-translation
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [feeType, setFeeType] = useState("Consultation");
  const [maxFee, setMaxFee] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dialog state for Rate button
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [ratingValue, setRatingValue] = useState(3);
  const [ratingComment, setRatingComment] = useState("");
  const [selectedAdvocateId, setSelectedAdvocateId] = useState<string | null>(null);

  // Debounce search input to reduce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch advocates whenever filters or debounced search changes
  useEffect(() => {
    const filters: any = {};

    if (debouncedSearch.length >= 2) {
      filters.name = debouncedSearch;
    }

    if (selectedSpecialization !== "all") {
      filters.specialization = selectedSpecialization;
    }

    if (selectedLocation !== "all") {
      filters.location_city = selectedLocation;
    }

    if (experienceLevel !== "all") {
      filters.experience_level = experienceLevel;
    }

    if (feeType) {
      filters.fee_type = feeType;
    }

    if (maxFee > 0) {
      filters.max_fee = maxFee;
    }

    if (minRating > 0) {
      filters.min_rating = minRating;
    }

    if (sortBy !== "all") {
      filters.sort_by = sortBy;
      filters.sort_order = sortOrder;
    }

    setIsLoading(true);
    setError(null);

    API.Advocate.searchAdvocates(filters)
      .then((res) => {
        const data = res.data.map((item: any) => ({
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
        setAdvocates(data);
      })
      .catch((err) => {
        const message =
          err?.response?.data?.error || err.message || "Failed to fetch advocates.";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        setAdvocates([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
 // frontend-integration 
// main
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
      console.log("Sending API request with filters:", filters);
      const res = await API.Advocate.searchAdvocates(filters);
      // Map backend response to Advocate[]
      console.log("API Response:", res.data);

      // Check if data exists and is an array
      if (!res.data || !Array.isArray(res.data)) {
        console.error("API returned invalid data format:", res.data);
        setAdvocates([]);
        return;
      }

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
      console.log("Processed data:", data);
      setAdvocates(data);
    } catch (err: any) {
      console.error("API Error:", err);
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
  // Separate effect just for URL search parameter on initial load
  useEffect(() => {
    const urlSearch = searchParams?.get("search");
    if (urlSearch && searchQuery === "") {
      setSearchQuery(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced search effect - only triggers when filters actually change
  useEffect(() => {
    // Don't trigger search on very short queries to avoid frequent API calls
    if (searchQuery.length === 1) {
      return;
    }

    // Create a timeout for debouncing
    const handler = setTimeout(() => {
      console.log("Building filters from:", {
        searchQuery,
        selectedSpecialization,
        selectedLocation,
        minRating,
        maxFee,
        feeType,
        experienceLevel,
        sortBy,
        sortOrder,
      });

      // Build filters for API
      const filters: any = {};

      // Only add filters that have valid values
      if (searchQuery && searchQuery.trim().length > 0) {
        filters.name = searchQuery.trim();
      }

      if (selectedSpecialization && selectedSpecialization !== "all") {
        filters.specialization = selectedSpecialization;
      }

      if (selectedLocation && selectedLocation !== "all") {
        filters.location_city = selectedLocation;
      }

      if (minRating && minRating > 0) {
        filters.min_rating = minRating;
      }

      if (maxFee && maxFee > 0) {
        filters.max_fee = maxFee;
      }

      if (feeType && feeType.length > 0) {
        filters.fee_type = feeType;
      }

      if (experienceLevel && experienceLevel !== "all") {
        filters.experience_level = experienceLevel;
      }

      if (sortBy && sortBy !== "all" && sortBy.length > 0) {
        filters.sort_by = sortBy;
      }

      if (sortOrder && sortOrder.length > 0) {
        filters.sort_order = sortOrder;
      }

      console.log("Applying filters:", filters);
      fetchAdvocates(filters);
    }, 800); // Increased to 800ms for better user experience

    // Cleanup timeout on effect dependency changes
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
// main
  }, [
    debouncedSearch,
    selectedSpecialization,
    selectedLocation,
    experienceLevel,
    feeType,
    maxFee,
    minRating,
    sortBy,
    sortOrder,
  ]);

  // Button handlers
  const handleViewProfile = (advocate_id: string) => {
    router.push(`/advocates/${advocate_id}`);
  };

  const handleBookAppointment = (advocate_id: string) => {
    router.push(`/appointments/book?advocate_id=${advocate_id}`);
  };

  const handleOpenRateDialog = (advocate_id: string) => {
    setSelectedAdvocateId(advocate_id);
    setOpenRateDialog(true);
    setRatingValue(3);
    setRatingComment("");
  };

  const handleSubmitRating = async () => {
    // if (!selectedAdvocateId) return;
    // try {
    //   await API.Advocate.rateAdvocate({
    //     advocate_id: selectedAdvocateId,
    //     rating: ratingValue,
    //     comment: ratingComment,
    //   });
    //   toast({
    //     title: "Thank you!",
    //     description: "Your rating has been submitted.",
    //   });
    //   setOpenRateDialog(false);
    // } catch (err: any) {
    //   toast({
    //     title: "Error",
    //     description: err?.response?.data?.error || "Failed to submit rating.",
    //     variant: "destructive",
    //   });
    // }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Find Legal Advocates</h1>

        {/* Search and Filters */}
        { /*frontend-translation*/}
        <div className="flex flex-col md:flex-row md:items-end gap-5 mb-10 flex-wrap bg-card p-6 rounded-xl shadow-md border border-border">
          {/* Search */}
          <div className="flex-1 relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full shadow-sm focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

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
          </Select>

          {/* Location */}
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
          </Select>

          {/* Experience Level */}
          <Select value={experienceLevel} onValueChange={setExperienceLevel}>
            <SelectTrigger className="w-full min-w-[130px] md:w-[150px] bg-background shadow-sm">
              <SelectValue placeholder="Experience Level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Fee Type */}
          <Select value={feeType} onValueChange={setFeeType}>
            <SelectTrigger className="w-full min-w-[120px] md:w-[140px] bg-background shadow-sm">
              <SelectValue placeholder="Fee Type" />
            </SelectTrigger>
            <SelectContent>
              {FEE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Max Fee */}
          <Input
            type="number"
            min={0}
            placeholder="Max Fee"
            value={maxFee === 0 ? "" : maxFee}
            onChange={(e) => setMaxFee(Number(e.target.value))}
            className="w-full min-w-[100px] md:w-[110px] bg-background text-foreground shadow-sm text-center"
          />

          {/* Min Rating */}
          <Input
            type="number"
            min={0}
            max={5}
            step={0.1}
            placeholder="Min Rating"
            value={minRating === 0 ? "" : minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full min-w-[100px] md:w-[110px] bg-background text-foreground shadow-sm text-center"
          />

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full min-w-[140px] md:w-[160px] bg-background shadow-sm">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORT_BY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            value={sortOrder}
            onValueChange={(value) => {
              if (value === "asc" || value === "desc") {
                setSortOrder(value);
              }
            }}
          >
            <SelectTrigger className="w-full min-w-[100px] md:w-[120px] bg-background shadow-sm">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              {SORT_ORDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rate Dialog */}
        <Dialog open={openRateDialog} onOpenChange={setOpenRateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Advocate</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[ratingValue]}
                onValueChange={([val]) => setRatingValue(val)}
              />
              <span className="text-center text-lg font-medium">
                {ratingValue} <Star className="inline h-5 w-5 text-yellow-500" />
              </span>
              <Textarea
                placeholder="Add a comment (optional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
{ /*frontend-translation*/}
                { /*main*/}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5 bg-card p-6 rounded-xl shadow-md border border-border flex-wrap">
            {" "}
            <div className="flex-1 relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, specialization, or location..."
                value={searchQuery}
                onChange={(e) => {
                  // Update the search query without triggering immediate search
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="pl-10 w-full shadow-sm focus:ring-2 focus:ring-primary/30 transition-all"
{ /*main*/}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSubmitRating}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : advocates.length === 0 ? (
          <p className="text-center text-muted-foreground">No advocates found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advocates.map((advocate) => (
              <Card key={advocate.advocate_id}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={advocate.avatar} alt={advocate.name} />
                      <AvatarFallback>{advocate.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {advocate.name}
                        {advocate.verified && (
                          <Badge variant="outline" className="ml-2">
                            Verified
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <MapPin className="h-4 w-4" />
                        {advocate.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 text-sm">{advocate.bio}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {advocate.specializations.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>
                      {advocate.rating.toFixed(1)} / 5
                    </span>
                    <Users className="h-4 w-4 ml-4" />
                    <span>{advocate.casesHandled} cases</span>
                  </div>
                  <div className="mb-2 text-sm">
                    <strong>Experience:</strong> {advocate.experience}
                  </div>
                  <div className="mb-2 text-sm">
                    <strong>Consultation Fee:</strong> ₹{advocate.consultationFee}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRateDialog(advocate.advocate_id)}
                    >
                      <Star className="h-4 w-4 mr-1" /> Rate
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewProfile(advocate.advocate_id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBookAppointment(advocate.advocate_id)}
                    >
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
