"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  Calendar,
  Star,
  Users,
  Phone,
  Mail,
  CheckCircle,
  FileText,
  Edit,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import AdvocateCasesList from "@/components/advocate/AdvocateCasesList";
import AdvocatePostsList from "@/components/AdvocatePostsList";
import AdvocateAppointmentsList from "@/components/advocate/AdvocateAppointmentsList";
import Link from "next/link";

// const EditProfileForm = dynamic(
//   () => import("./EditProfileForm").then((mod) => mod.default),
//   { ssr: false }
// );
// Use dynamic import for OlaMap to avoid SSR issues
const OlaMap = dynamic(() => import("@/components/OlaMap"), { ssr: false });
import DocumentViewer from "@/components/DocumentViewer";
import AdvocateAvailabilitySlots from "@/components/advocate/AdvocateAvailabilitySlots";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/location";
import { OLA_MAPS_API_KEY } from "@/lib/olamaps.config";
import AddCaseForm from "@/components/advocate/AddCaseForm";

const EditProfileForm = dynamic(
  () => import("./EditProfileForm").then((mod) => mod.default),
  { ssr: false }
);
const AdvocateUpdateForm = dynamic(
  () => import("@/components/AdvocateUpdateForm").then((mod) => mod.default),
  { ssr: false }
);

interface Profile {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  email?: string;
  location?: string;
  bio?: string;
  userType?: string;
  city?: string;
  district?: string;
  state?: string;
  phone?: string;
  specializations?: string[];
  experience?: number;
  casesHandled?: number;
  rating?: number;
  type?: string;
  feedback?: string[]; // Add feedback array
}

interface AdvocateData {
  advocate_id?: string;
  is_verified?: boolean;
  registration_number?: string;
  reference_number?: string;
  contact_email?: string;
  user?: {
    email?: string;
  };
  phone_number?: string;
  location_city?: string;
  jurisdiction_states?: string[];
  language_preferences?: string[];
  fee_structure?: string;
  average_rating?: number;
  total_ratings?: number;
  feedback?: string[]; // Add feedback array
  verification_document_url?: string;
}

export default function ProfilePage() {
  const params = useParams() as { id?: string };
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [advocateEditOpen, setAdvocateEditOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [advocateDataOpen, setAdvocateDataOpen] = useState(false);
  const [addCaseOpen, setAddCaseOpen] = useState(false);
  const [advocateData, setAdvocateData] = useState<AdvocateData | null>(null);
  const [isAdvocateDataLoading, setIsAdvocateDataLoading] = useState(false);
  const [advocateDataError, setAdvocateDataError] = useState<string | null>(
    null
  );
  const [verificationData, setVerificationData] = useState({
    registration_number: "",
    reference_number: "",
    verification_document_url: "",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // State for map location
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [mapLoading, setMapLoading] = useState(true);

  // State for document modal
  const [showDocModal, setShowDocModal] = useState(false);

  // State for advocate ratings
  const [advocateRatings, setAdvocateRatings] = useState<any>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  // State for advocate cases
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // State to track if calendar is connected
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  
  useEffect(() => {
    // Check calendar connection status in a different way if needed
    // For example, you could make an API call here
  }, [advocateData?.advocate_id]);

  useEffect(() => {}, []);

  // Get current location for map
  useEffect(() => {
    getCurrentLocation()
      .then((coords) => setMapCenter(coords))
      .catch(() => setMapCenter([77.61648476788898, 12.931423492103944])) // fallback to default
      .finally(() => setMapLoading(false));
  }, []);

  // Fetch profile, then advocate data, then ratings/cases in order
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      setIsLoading(true);
      setAdvocateData(null);
      setAdvocateRatings(null);
      setCases([]);
      setAdvocateDataError(null);
      try {
        let fetchedProfile: Profile | null = null;
        if (user && params.id === user.id) {
          const response = await API.Auth.getProfile();
          fetchedProfile = response.data;
        } else {
          // fallback: fetch from static data for other users (legacy)
          const response = await fetch("/data/data.json");
          const data = await response.json();
          const allUsers = [...data.users, ...data.advocates];
          fetchedProfile = params?.id
            ? allUsers.find((user: Profile) => user.id === params.id)
            : null;
        }
        if (!isMounted) return;
        setProfile(fetchedProfile);
        // If advocate, fetch advocateData next
        if (
          fetchedProfile &&
          (fetchedProfile.userType === "advocate" ||
            fetchedProfile.type === "advocate")
        ) {
          setIsAdvocateDataLoading(true);
          try {
            const advRes = await API.Advocate.getAdvocateData();
            console.log("advRes: ", advRes.data);
            if (!isMounted) return;
            setAdvocateData(advRes.data);
            // Fetch ratings and cases after advocateData
            if (advRes.data.advocate_id) {
              setIsRatingLoading(true);
              try {
                const ratingsRes = await API.Advocate.getAdvocateRatings(
                  advRes.data.advocate_id
                );
                console.log("ratings: ", ratingsRes.data);
                if (!isMounted) return;
                setAdvocateRatings(ratingsRes.data);
              } catch (error) {
                setAdvocateRatings(null);
              } finally {
                setIsRatingLoading(false);
              }
              setCasesLoading(true);
              try {
                const casesRes = await API.Advocate.getCases(
                  advRes.data.advocate_id
                );
                console.log("cases:", casesRes.data);
                if (!isMounted) return;
                setCases(casesRes.data);
              } catch (err) {
                setCases([]);
              } finally {
                setCasesLoading(false);
              }
            }
          } catch (error: any) {
            setAdvocateDataError(
              error?.response?.data?.message ||
                "Please verify your advocate profile first. Upload your verification documents to the system."
            );
            setAdvocateData(null);
          } finally {
            setIsAdvocateDataLoading(false);
          }
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [params.id, user]);

  // Refetch advocateData, ratings, and cases after advocate update
  const handleAdvocateUpdateSuccess = () => {
    toast({
      title: "Advocate Profile Updated",
      description: "Your advocate profile has been updated successfully.",
    });
    setAdvocateEditOpen(false);
    // Refetch advocateData, ratings, and cases
    if (
      profile &&
      (profile.userType === "advocate" || profile.type === "advocate")
    ) {
      setIsAdvocateDataLoading(true);
      setAdvocateDataError(null);
      API.Advocate.getAdvocateData()
        .then((advRes) => {
          setAdvocateData(advRes.data);
          if (advRes.data.advocate_id) {
            setIsRatingLoading(true);
            API.Advocate.getAdvocateRatings(advRes.data.advocate_id)
              .then((ratingsRes) => setAdvocateRatings(ratingsRes.data))
              .catch(() => setAdvocateRatings(null))
              .finally(() => setIsRatingLoading(false));
            setCasesLoading(true);
            API.Advocate.getCases(advRes.data.advocate_id)
              .then((casesRes) => setCases(casesRes.data))
              .catch(() => setCases([]))
              .finally(() => setCasesLoading(false));
          }
        })
        .catch((error) => {
          setAdvocateDataError(
            error?.response?.data?.message ||
              "Please verify your advocate profile first. Upload your verification documents to the system."
          );
          setAdvocateData(null);
        })
        .finally(() => setIsAdvocateDataLoading(false));
    }
  };

  // Refetch cases after add/update
  const handleCaseChanged = () => {
    if (advocateData && advocateData.advocate_id) {
      setCasesLoading(true);
      API.Advocate.getCases(advocateData.advocate_id)
        .then((res) => setCases(res.data))
        .catch(() => setCases([]))
        .finally(() => setCasesLoading(false));
    }
    setAddCaseOpen(false);
    toast({ title: "Case updated!" });
  };

  // Verification handlers
  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationData({
      ...verificationData,
      [e.target.name]: e.target.value,
    });
  };
  //connect
  const handleConnect = async () => {
    // This is a placeholder as the actual connection happens via the Link/redirect
    // The connection status will be updated when AdvocateAppointmentsList loads appointments
    if (isCalendarConnected) {
      // Already connected, so we don't need to do anything
      toast({
        title: "Already Connected",
        description: "Your Google Calendar is already connected.",
      });
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationLoading(true);

    try {
      await API.Advocate.register(verificationData);
      toast({
        title: "Verification Request Submitted",
        description:
          "Your verification request has been submitted successfully. We'll review it shortly.",
      });
      setVerificationOpen(false);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description:
          error?.response?.data?.message ||
          "Failed to submit verification request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  // Pass a callback to EditProfileForm to update profile state after successful update
  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile((prev) =>
      prev ? { ...prev, ...updatedProfile } : updatedProfile
    );
    setEditOpen(false);
  };

  // Derive isOwnProfile and isAdvocate for rendering
  const isOwnProfile = user && profile && user.id === profile.id;
  const isAdvocate = !!(
    profile &&
    (profile.userType === "advocate" || profile.type === "advocate")
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground">
            The profile you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isVerified = advocateData?.is_verified;
  const hasPendingVerification =
    advocateData?.registration_number && advocateData?.reference_number;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header Card with gradient background */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="h-40 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-700 via-blue-300 to-blue-300 dark:from-indigo-700 dark:via-indigo-950 dark:to-slate-900"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent opacity-150"></div>
            {isOwnProfile && (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-transparent shadow-xl backdrop-blur-none border-none">
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <EditProfileForm
                    profile={profile}
                    onSuccess={handleProfileUpdate}
                  />
                </DialogContent>
              </Dialog>
            )}
            {/* Add Case Button for Advocate */}
            {isOwnProfile && isAdvocate && (
              <Button
                size="sm"
                variant="outline"
                className="absolute top-4 left-4 bg-white/100 hover:bg-slate-300 dark:text-black text-primary border-primary"
                onClick={() => setAddCaseOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" /> Add Case
              </Button>
            )}
            {/* Add Case Modal */}
            <Dialog open={addCaseOpen} onOpenChange={setAddCaseOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add a New Case</DialogTitle>
                </DialogHeader>
                <AddCaseForm onSuccess={handleCaseChanged} />
              </DialogContent>
            </Dialog>
          </div>

          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-14">
              <Avatar className="h-32 w-32 border-4 border-background shadow-md">
                <AvatarImage
                  src={profile.image || "/placeholder.svg"}
                  alt={profile.name}
                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                />

                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    {isAdvocate && (
                      <Badge className="bg-primary/90 hover:bg-primary">
                        Advocate
                      </Badge>
                    )}
                    {isVerified && (
                      <Badge className="bg-green-500/90 hover:bg-green-500">
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="text-muted-foreground flex flex-wrap items-center mt-2 gap-x-4 gap-y-2">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">

                  {isAdvocate && !isOwnProfile && (
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}

                  {/* Advocate Management Buttons */}
                  {isOwnProfile && isAdvocate && (
                    <div className="flex flex-wrap gap-2">
                      {advocateData && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdvocateEditOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Advocate Info
                        </Button>
                      )}

                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdvocateDataOpen(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Advocate Data
                      </Button> */}
                      <Button
                        size="sm"
                        variant={isCalendarConnected ? "default" : "outline"}
                        onClick={() => handleConnect()}
                        asChild
                        className={
                          isCalendarConnected
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }
                      >
                        {isVerified &&
                          (isCalendarConnected ? (
                            <div>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Connected
                            </div>
                          ) : (
                            <Link
                              target="_blank"
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/appointment/advocate/calendar/connect`}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Connect To Google Calendar
                            </Link>
                          ))}
                      </Button>

                      {/* Verification buttons */}
                      {!hasPendingVerification && !isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setVerificationOpen(true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Register for Verification
                        </Button>
                      )}

                      {hasPendingVerification && !isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Pending Verification
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="overflow-hidden border shadow-md">
              <CardHeader className="bg-muted/30">
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  {profile.bio || "No bio provided"}
                </p>

                {/* Advocate Information Display */}
                {isAdvocate && advocateData && (
                  <div className="mt-8 space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <CheckCircle
                        className={`h-5 w-5 ${
                          isVerified ? "text-green-500" : "text-muted"
                        }`}
                      />
                      <h3 className="font-semibold text-lg">
                        Advocate Information
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Registration Details */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          Registration Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Registration Number:
                            </span>
                            <span>
                              {advocateData.registration_number ||
                                "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Reference Number:
                            </span>
                            <span>
                              {advocateData.reference_number || "Not provided"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Verification Status:
                            </span>
                            <span
                              className={
                                isVerified
                                  ? "text-green-600 font-medium"
                                  : "text-amber-600"
                              }
                            >
                              {isVerified ? "Verified" : "Pending"}
                            </span>
                          </div>
                          {/* Verification Document Section */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-b last:border-b-0 py-2 mt-2">
                            {/* <span className="font-semibold min-w-[180px] text-muted-foreground">Verification Document:</span> */}
                            {advocateData.verification_document_url ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="px-3 py-1 text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-900 transition"
                                  onClick={() => setShowDocModal(true)}
                                >
                                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                  <span>Verification Document</span>
                                </Button>
                                <Dialog
                                  open={showDocModal}
                                  onOpenChange={setShowDocModal}
                                >
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Verification Document
                                      </DialogTitle>
                                    </DialogHeader>
                                    <DocumentViewer
                                      url={
                                        advocateData.verification_document_url
                                      }
                                    />
                                  </DialogContent>
                                </Dialog>
                              </>
                            ) : (
                              <span className="italic text-muted-foreground">
                                Not provided
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {advocateData.contact_email ||
                                advocateData.user?.email}
                            </span>
                          </div>
                          {advocateData.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{advocateData.phone_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Location & Jurisdiction */}
                    {(advocateData.location_city ||
                      (advocateData.jurisdiction_states &&
                        advocateData.jurisdiction_states.length > 0)) && (
                      <div>
                        <h4 className="font-medium mb-2">
                          Location & Jurisdiction
                        </h4>
                        <div className="flex flex-col gap-2">
                          {advocateData.location_city && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{advocateData.location_city}</span>
                            </div>
                          )}
                          {advocateData.jurisdiction_states &&
                            advocateData.jurisdiction_states.length > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground block mb-1">
                                  Jurisdiction:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {advocateData.jurisdiction_states.map(
                                    (state: string, index: number) => (
                                      <Badge key={index} variant="outline">
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

                    {/* Languages */}
                    {advocateData.language_preferences &&
                      advocateData.language_preferences.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Languages</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {advocateData.language_preferences.map(
                              (language: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {language}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Fee Structure */}
                    {advocateData.fee_structure && (
                      <div>
                        <h4 className="font-medium mb-2">Fee Structure</h4>
                        <div className="bg-muted/30 p-4 rounded-lg text-sm">
                          {typeof advocateData.fee_structure === "string" ? (
                            advocateData.fee_structure
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(
                                typeof advocateData.fee_structure === "object"
                                  ? advocateData.fee_structure
                                  : JSON.parse(advocateData.fee_structure)
                              ).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium">{key}:</span>
                                  <span>₹{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isAdvocate && isAdvocateDataLoading && (
                  <div className="mt-6 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                )}

                {isAdvocate && advocateDataError && (
                  <div className="mt-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
                    {advocateDataError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specializations Card - Only for advocates */}
            {isAdvocate &&
              profile.specializations &&
              profile.specializations.length > 0 && (
                <Card className="overflow-hidden border shadow-md">
                  <CardHeader className="bg-muted/30">
                    <CardTitle>Specializations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {profile.specializations.map(
                        (spec: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1"
                          >
                            {spec}
                          </Badge>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Professional Experience - Only for advocates */}
            {isAdvocate && (
              <Card className="overflow-hidden border shadow-md">
                <CardHeader className="bg-muted/30">
                  <CardTitle>Professional Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-bold text-xl">
                        {profile.experience || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Years of Practice
                      </div>
                    </div>{" "}
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-bold text-xl">
                        {cases?.length || profile.casesHandled || 0}
                      </div>{" "}
                      <div className="text-sm text-muted-foreground">
                        Cases Handled
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="font-bold text-xl">
                        {advocateRatings?.averageRating
                          ? parseFloat(
                              advocateRatings.averageRating.toString()
                            ).toFixed(1)
                          : advocateData?.average_rating
                          ? parseFloat(
                              advocateData.average_rating.toString()
                            ).toFixed(1)
                          : profile.rating
                          ? parseFloat(profile.rating.toString()).toFixed(1)
                          : "0.0"}
                        /5.0
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client Rating (
                        {advocateRatings?.totalRatings ||
                          advocateData?.total_ratings ||
                          0}
                        )
                      </div>
                    </div>
                  </div>

                  {/* Display feedback if available - prioritize separately fetched ratings */}
                  {advocateRatings?.ratings &&
                    advocateRatings.ratings.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="font-medium mb-3">Client Feedback</h4>
                        <div className="space-y-3">
                          {advocateRatings.ratings
                            .slice(0, 2)
                            .map((rating: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-muted/20 p-3 rounded-lg"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < rating.stars
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                      fill={
                                        i < rating.stars ? "#facc15" : "none"
                                      }
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    by {rating.user_id}
                                  </span>
                                </div>
                                <p className="text-sm italic">
                                  "{rating.feedback}"
                                </p>
                              </div>
                            ))}
                          {advocateRatings.ratings.length > 2 && (
                            <p className="text-xs text-muted-foreground text-right">
                              +{advocateRatings.ratings.length - 2} more
                              feedback
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Advocate Appointments Section - Only for advocates */}
            {isAdvocate && isOwnProfile && (
              <Card className="overflow-hidden border shadow-md mt-8">
                <CardHeader className="bg-muted/30">
                  <CardTitle>My Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  {" "}
                  {/* Add content for appointments */}
                  <AdvocateAppointmentsList
                    // onCalendarConnected={setIsCalendarConnected}
                    onCalendarConnected={() => {}}
                    advocateId={advocateData?.advocate_id}
                    isCalendarConnected={isCalendarConnected}
                  />
                </CardContent>
              </Card>
            )}

            {/* Advocate Cases List for Advocates */}
            {isAdvocate && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 text-lg">Cases Handled</h3>
                {cases.length === 0 && !casesLoading ? (
                  <div className="text-center text-muted-foreground py-4">
                    No case details
                  </div>
                ) : (
                  <AdvocateCasesList
                    advocateId={advocateData?.advocate_id}
                    cases={cases}
                    loading={casesLoading}
                    onCaseUpdated={handleCaseChanged}
                  />
                )}
              </div>
            )}

            {/* Add a section for "My Posts" for advocates */}
            {isOwnProfile && isAdvocate && (
              <Card className="overflow-hidden border shadow-md mt-8">
                <CardHeader className="bg-muted/30">
                  <CardTitle>My Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvocatePostsList limit={1} />
                  <div className="flex justify-end mt-4">
                    <Link href={`/profile/${profile.id}/posts`}>
                      <Button variant="outline" size="sm">
                        View All Posts
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card className="overflow-hidden border shadow-md">
              <CardHeader className="bg-muted/30">
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.city && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">City:</span>
                      <span>{profile.city}</span>
                    </div>
                  )}
                  {profile.district && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">District:</span>
                      <span>{profile.district}</span>
                    </div>
                  )}
                  {profile.state && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">State:</span>
                      <span>{profile.state}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>{" "}
            {/* Contact Card */}
            <Card className="overflow-hidden border shadow-md">
              <CardHeader className="bg-muted/30">
                <CardTitle>Contact</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Advocate Availability Card - Only for advocates and not for own profile */}
            {isAdvocate && !isOwnProfile && advocateData?.advocate_id && (
              <Card className="overflow-hidden border shadow-md">
                <CardHeader className="bg-muted/30 flex flex-row items-center justify-between">
                  <CardTitle>Available Slots</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <AdvocateAvailabilitySlots
                    onCalendarConnected={() => {}}
                    advocateId={advocateData.advocate_id}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Ola Map Section */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Location Map</CardTitle>
          </CardHeader>
          <CardContent>
            {mapLoading ? (
              <Skeleton className="h-64 w-full rounded" />
            ) : mapCenter ? (
              <OlaMap
                apiKey={OLA_MAPS_API_KEY}
                center={mapCenter}
                onLocationSelect={setSelectedLocation}
              />
            ) : (
              <div className="text-center text-muted-foreground">Unable to load map</div>
            )}
            {selectedLocation && (
              <div className="mt-2 text-sm text-muted-foreground">
                Selected Location: <span className="font-mono">{selectedLocation[1]}, {selectedLocation[0]}</span>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Dialog for editing profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm profile={profile} onSuccess={handleProfileUpdate} />
        </DialogContent>
      </Dialog>

      {/* Dialog for editing advocate info */}
      {advocateData && (
        <Dialog open={advocateEditOpen} onOpenChange={setAdvocateEditOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Advocate Profile</DialogTitle>
              <DialogDescription>
                Update your advocate profile information
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 px-1">
              <AdvocateUpdateForm
                initialData={advocateData}
                onSuccess={handleAdvocateUpdateSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog for advocate verification */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advocate Verification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerificationSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input
                id="registration_number"
                name="registration_number"
                placeholder="Enter your bar registration number"
                value={verificationData.registration_number}
                onChange={handleVerificationChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                name="reference_number"
                placeholder="Enter your reference number"
                value={verificationData.reference_number}
                onChange={handleVerificationChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_document_url">
                Verification Document URL
              </Label>
              <Input
                id="verification_document_url"
                name="verification_document_url"
                placeholder="Provide a link to your verification document"
                value={verificationData.verification_document_url}
                onChange={handleVerificationChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload your verification documents to a file sharing service and
                provide the link
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verificationLoading}
            >
              {verificationLoading
                ? "Submitting..."
                : "Submit for Verification"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for viewing advocate data */}
      <Dialog open={advocateDataOpen} onOpenChange={setAdvocateDataOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Advocate Data</DialogTitle>
            <DialogDescription>
              Your advocate profile data from the system
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isAdvocateDataLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : advocateDataError ? (
              <div className="text-center text-red-500 py-4">
                {advocateDataError}
              </div>
            ) : advocateData ? (
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px]">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(advocateData, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setAdvocateDataOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
