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
} from "lucide-react";
import { API } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

export default function AdvocateAppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err: any) {
        console.error("Failed to fetch appointments:", err);
        setError(err?.response?.data?.message || "Failed to load appointments");
        toast({
          title: "Error",
          description: "Could not load your appointments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [toast]);

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

            return (
              <Card
                key={appointment.id || Math.random().toString(36).substr(2, 9)}
                className="border border-muted hover:border-muted-foreground/20 transition-colors cursor-pointer"
                onClick={() =>
                  appointment.id &&
                  router.push(`/appointments/${appointment.id}`)
                }
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
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

                    <Button variant="ghost" size="sm" className="gap-1">
                      <span className="text-xs">View</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          } catch (error) {
            console.error("Error rendering appointment:", error, appointment);
            return null;
          }
        })}
    </div>
  );
}
