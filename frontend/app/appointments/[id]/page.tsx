"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Loader2,
  User,
  Clock,
  ArrowLeft,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentDetails {
  id: string;
  advocate: {
    id: string;
    name: string;
    image?: string;
    email?: string;
    phone?: string;
    specializations?: string[];
    location?: string;
  };
  user: {
    id: string;
    name: string;
    image?: string;
    email?: string;
    phone?: string;
  };
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  notes?: string;
}

export default function AppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if the current user is the advocate
  const isAdvocate = user?.type === "advocate" || user?.userType === "advocate";

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await API.Appointment.getAppointmentById(id as string);
        setAppointment(res.data);
      } catch (err: any) {
        let message = "Failed to fetch appointment details";
        if (err?.response?.data?.error) message = err.response.data.error;
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  // Handle cancellation of appointment
  const handleCancel = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await API.Appointment.cancel(appointment.id);

      // Update the appointment status
      setAppointment({
        ...appointment,
        status: "cancelled",
      });

      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
      setShowCancelDialog(false);
    } catch (err: any) {
      let message = "Failed to cancel appointment";
      if (err?.response?.data?.error) message = err.response.data.error;
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle confirmation of appointment (advocate only)
  const handleConfirm = async () => {
    if (!appointment) return;

    setActionLoading(true);
    try {
      await API.Appointment.confirm(appointment.id);

      // Update the appointment status
      setAppointment({
        ...appointment,
        status: "confirmed",
      });

      toast({
        title: "Appointment Confirmed",
        description: "The appointment has been confirmed successfully.",
      });
      setShowConfirmDialog(false);
    } catch (err: any) {
      let message = "Failed to confirm appointment";
      if (err?.response?.data?.error) message = err.response.data.error;
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({
    status,
  }: {
    status: AppointmentDetails["status"];
  }) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Confirmed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelled
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16 my-8">
            <h3 className="text-2xl font-semibold mb-3 text-red-600">Error</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {error || "Could not find the requested appointment"}
            </p>
            <Button onClick={() => router.push("/appointments")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Appointments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format dates
  const formattedStartTime = format(
    parseISO(appointment.startTime),
    "EEEE, MMMM d, yyyy 'at' h:mm a"
  );
  const formattedEndTime = format(parseISO(appointment.endTime), "h:mm a");
  const formattedCreatedAt = format(
    parseISO(appointment.createdAt),
    "MMMM d, yyyy"
  );
  const isPastAppointment = new Date(appointment.endTime) < new Date();
  const isAppointmentCancellable =
    ["pending", "confirmed"].includes(appointment.status) && !isPastAppointment;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/appointments")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">Appointment Details</h1>
            <p className="text-muted-foreground">
              Booked on {formattedCreatedAt}
            </p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>
                    {formattedStartTime} - {formattedEndTime}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium">Reason for Appointment</h4>
                  <p className="text-muted-foreground">{appointment.reason}</p>
                </div>

                {appointment.notes && (
                  <div className="space-y-1">
                    <h4 className="font-medium">Additional Notes</h4>
                    <p className="text-muted-foreground">{appointment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {isAppointmentCancellable && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Appointment
                </Button>
              )}

              {isAdvocate && appointment.status === "pending" && (
                <Button onClick={() => setShowConfirmDialog(true)}>
                  Confirm Appointment
                </Button>
              )}

              {/* Chat or messaging button could go here if that feature exists */}
              <Button variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>

              {/* Add to calendar button */}
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Add to Calendar
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Advocate/User details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isAdvocate ? "Client" : "Advocate"} Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        isAdvocate
                          ? appointment.user.image
                          : appointment.advocate.image
                      }
                      alt={
                        isAdvocate
                          ? appointment.user.name
                          : appointment.advocate.name
                      }
                    />
                    <AvatarFallback>
                      {isAdvocate
                        ? appointment.user.name.charAt(0)
                        : appointment.advocate.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {isAdvocate
                        ? appointment.user.name
                        : appointment.advocate.name}
                    </h3>
                    {!isAdvocate && appointment.advocate.specializations && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.advocate.specializations
                          .slice(0, 2)
                          .join(", ")}
                        {appointment.advocate.specializations.length > 2 &&
                          "..."}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact details */}
                <div className="space-y-2">
                  {(isAdvocate
                    ? appointment.user.email
                    : appointment.advocate.email) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {isAdvocate
                          ? appointment.user.email
                          : appointment.advocate.email}
                      </span>
                    </div>
                  )}

                  {(isAdvocate
                    ? appointment.user.phone
                    : appointment.advocate.phone) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {isAdvocate
                          ? appointment.user.phone
                          : appointment.advocate.phone}
                      </span>
                    </div>
                  )}

                  {!isAdvocate && appointment.advocate.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.advocate.location}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* View profile button */}
                {!isAdvocate && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      router.push(`/advocates/${appointment.advocate.id}`)
                    }
                  >
                    View Advocate Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={actionLoading}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Appointment Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Confirm this appointment request from {appointment.user.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
