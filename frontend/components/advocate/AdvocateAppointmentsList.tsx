"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { API } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Appointment {
  id: string;
  // Support both formats (our expected format and the actual API format)
  user?: {
    name: string;
    email?: string;
  };
  client?: {
    id: string;
    name: string;
    email?: string;
  };
  startTime?: string;
  endTime?: string;
  appointment_time?: string;
  duration_mins?: number;
  reason?: string;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  is_confirmed?: boolean;
  location?: string;
  meeting_link?: string;
  advocate_id?: string;
  client_id?: string;
  calendar_event_id?: string;
  created_at?: string;
}

interface AdvocateAppointmentsListProps {
  onCalendarConnected?: (connected: boolean) => void;
  advocateId?: string;
  isCalendarConnected?: boolean;
}

export default function AdvocateAppointmentsList({
  onCalendarConnected,
}: AdvocateAppointmentsListProps = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<
    string | null
  >(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(
    null
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true);
      try {
        const response =
          await API.Appointment.getAdvocateCalendarAppointments();
        // Log the response to debug
        console.log("Appointments API response:", response);

        // Ensure appointments data is always an array
        if (Array.isArray(response.data)) {
          setAppointments(response.data);
        } else if (response.data && Array.isArray(response.data.appointments)) {
          setAppointments(response.data.appointments);
        } else if (response.data && typeof response.data === "object") {
          // If response.data is an object with appointments
          const appointmentsData = Object.values(response.data).filter(
            Array.isArray
          )[0];
          setAppointments(
            Array.isArray(appointmentsData) ? appointmentsData : []
          );
        } else {
          // Fallback to empty array
          setAppointments([]);
        }

        setError(null);

        // Notify parent component that calendar is connected
        if (onCalendarConnected) {
          onCalendarConnected(true);
        }
      } catch (err: any) {
        console.error("Failed to fetch appointments:", err);
        setError(err?.response?.data?.message || "Failed to load appointments");
        // toast({
        //   title: "Not Verified or Not Connected To Calendar",
        //   description: "Could not load your appointments. Please Get Verified.",
        //   variant: "default",
        // });

        // Notify parent component that calendar is not connected
        if (onCalendarConnected) {
          onCalendarConnected(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [toast, onCalendarConnected]);

  // Function to get status badge
  const getStatusBadge = (status: string) => {
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

  // Handle appointment confirmation
  const handleConfirm = async () => {
    if (!appointmentToConfirm) return;

    setActionLoading(true);
    try {
      await API.Appointment.confirm(appointmentToConfirm);

      // Update the appointment in the list
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === appointmentToConfirm
            ? { ...appointment, status: "confirmed", is_confirmed: true }
            : appointment
        )
      );

      toast({
        title: "Appointment Confirmed",
        description: "The appointment has been confirmed successfully.",
      });
    } catch (err: any) {
      console.error("Failed to confirm appointment:", err);
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to confirm appointment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowConfirmDialog(false);
      setAppointmentToConfirm(null);
    }
  };

  // Handle appointment cancellation
  const handleCancel = async () => {
    if (!appointmentToCancel) return;

    setActionLoading(true);
    try {
      await API.Appointment.cancel(appointmentToCancel);

      // Update the appointment in the list
      setAppointments(
        appointments.map((appointment) =>
          appointment.id === appointmentToCancel
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
      );

      toast({
        title: "Appointment Cancelled",
        description: "The appointment has been cancelled successfully.",
      });
    } catch (err: any) {
      console.error("Failed to cancel appointment:", err);
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
      setShowCancelDialog(false);
      setAppointmentToCancel(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-muted">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>You don't have any appointments yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {Array.isArray(appointments) &&
        appointments.map((appointment) => {
          try {
            // Get proper time values based on API format
            let startDate, endDate;

            if (appointment.appointment_time && appointment.duration_mins) {
              // Use appointment_time and calculate endTime based on duration
              startDate = parseISO(appointment.appointment_time);
              endDate = new Date(
                startDate.getTime() + appointment.duration_mins * 60000
              );
            } else if (appointment.startTime && appointment.endTime) {
              // Use startTime and endTime directly
              startDate = parseISO(appointment.startTime);
              endDate = parseISO(appointment.endTime);
            } else {
              console.error(
                "Invalid appointment data: missing time information",
                appointment
              );
              return null;
            }

            // Make sure dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.error("Invalid date in appointment:", appointment);
              return null;
            }

            // Get client name from either format
            const clientName =
              appointment.client?.name || appointment.user?.name || "Client";

            // Get status (handle is_confirmed flag)
            const status =
              appointment.status ||
              (appointment.is_confirmed ? "confirmed" : "pending");

            // Determine if appointment actions are allowed
            const isPast = new Date() > (endDate || new Date());
            const canTakeAction =
              !isPast && (status === "pending" || status === "confirmed");

            return (
              <Card
                key={appointment.id || Math.random().toString(36).substr(2, 9)}
                className="border border-muted hover:border-muted-foreground/20 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {format(startDate, "EEEE, MMMM d, yyyy")}
                        </span>
                        {getStatusBadge(status)}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(startDate, "h:mm a")} -{" "}
                          {format(endDate, "h:mm a")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{clientName}</span>
                      </div>

                      {appointment.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{appointment.location}</span>
                        </div>
                      )}

                      {appointment.meeting_link && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-blue-600 hover:underline">
                            <a
                              href={appointment.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Meeting Link
                            </a>
                          </span>
                        </div>
                      )}

                      {appointment.reason && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          <span className="font-medium">Reason:</span>{" "}
                          {appointment.reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">

                      {status === "pending" && canTakeAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (appointment.id) {
                              setAppointmentToConfirm(appointment.id);
                              setShowConfirmDialog(true);
                            }
                          }}
                          className="border-green-200 hover:bg-green-50 hover:text-green-700 text-green-600"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                      )}

                      {canTakeAction && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (appointment.id) {
                              setAppointmentToCancel(appointment.id);
                              setShowCancelDialog(true);
                            }
                          }}
                          className="border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          } catch (error) {
            console.error("Error rendering appointment:", error, appointment);
            return null;
          }
        })}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this appointment? This will
              notify the client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setAppointmentToConfirm(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
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

      {/* Cancellation Dialog */}
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
              onClick={() => {
                setShowCancelDialog(false);
                setAppointmentToCancel(null);
              }}
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
    </div>
  );
}
