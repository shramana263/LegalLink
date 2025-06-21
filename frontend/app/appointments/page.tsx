"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  Loader2,
  Plus,
  MapPin,
  Calendar as CalendarIcon,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Interfaces to match backend response
interface Appointment {
  id: string;
  advocate: {
    id: string;
    name: string;
    image?: string;
    specializations?: string[];
  };
  user: {
    id: string;
    name: string;
    image?: string;
  };
  startTime: string;
  endTime: string;
  reason: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("user");
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [advocateAppointments, setAdvocateAppointments] = useState<
    Appointment[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Appointment action states
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Add slot dialog state
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  // Determine which tab to show based on user type
  useEffect(() => {
    if (user) {
      if (user.type === "advocate" || user.userType === "advocate") {
        setActiveTab("advocate");
      } else {
        setActiveTab("user");
      }
    }
  }, [user]);

  // Fetch appointments based on active tab
  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === "user") {
          const res = await API.Appointment.getUserAppointments();
          setUserAppointments(res.data || []);
        } else if (activeTab === "advocate") {
          const res = await API.Appointment.getAdvocateAppointments();
          setAdvocateAppointments(res.data || []);
        }
      } catch (err: any) {
        let message = "Failed to fetch appointments";
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

    fetchAppointments();
  }, [user, activeTab]);

  // Handle cancellation of appointment
  const handleCancel = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      await API.Appointment.cancel(selectedAppointment.id);

      // Update the appointment list
      if (activeTab === "user") {
        setUserAppointments(
          userAppointments.map((apt) =>
            apt.id === selectedAppointment.id
              ? { ...apt, status: "cancelled" as const }
              : apt
          )
        );
      } else {
        setAdvocateAppointments(
          advocateAppointments.map((apt) =>
            apt.id === selectedAppointment.id
              ? { ...apt, status: "cancelled" as const }
              : apt
          )
        );
      }

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
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      await API.Appointment.confirm(selectedAppointment.id);

      // Update the appointment list
      setAdvocateAppointments(
        advocateAppointments.map((apt) =>
          apt.id === selectedAppointment.id
            ? { ...apt, status: "confirmed" as const }
            : apt
        )
      );

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

  // Handle adding a new availability slot
  const handleAddSlot = async () => {
    if (!date || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      await API.Appointment.addAvailabilitySlot({
        date: formattedDate,
        startTime,
        endTime,
        isRecurring,
        daysOfWeek: isRecurring ? daysOfWeek : undefined,
      });

      toast({
        title: "Availability Added",
        description: "Your availability slot has been added successfully.",
      });
      setShowAddSlotDialog(false);

      // Reset form
      setDate(new Date());
      setStartTime("");
      setEndTime("");
      setIsRecurring(false);
      setDaysOfWeek([]);
    } catch (err: any) {
      let message = "Failed to add availability slot";
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

  // Render appointment card
  const renderAppointmentCard = (
    appointment: Appointment,
    isAdvocateView: boolean
  ) => {
    const formattedStartTime = format(
      parseISO(appointment.startTime),
      "MMM d, yyyy h:mm a"
    );
    const formattedEndTime = format(parseISO(appointment.endTime), "h:mm a");

    return (
      <Card key={appointment.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    isAdvocateView
                      ? appointment.user.image
                      : appointment.advocate.image
                  }
                  alt={
                    isAdvocateView
                      ? appointment.user.name
                      : appointment.advocate.name
                  }
                />
                <AvatarFallback>
                  {isAdvocateView
                    ? appointment.user.name.charAt(0)
                    : appointment.advocate.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {isAdvocateView
                    ? appointment.user.name
                    : appointment.advocate.name}
                </CardTitle>
                {!isAdvocateView && appointment.advocate.specializations && (
                  <CardDescription>
                    {appointment.advocate.specializations
                      .slice(0, 2)
                      .join(", ")}
                    {appointment.advocate.specializations.length > 2 && "..."}
                  </CardDescription>
                )}
              </div>
            </div>
            <StatusBadge status={appointment.status} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {formattedStartTime} - {formattedEndTime}
              </span>
            </div>

            <div className="text-sm">
              <div className="font-medium mb-1">Reason:</div>
              <div className="text-muted-foreground">{appointment.reason}</div>
            </div>

            <Separator />

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowCancelDialog(true);
                }}
                disabled={
                  appointment.status !== "pending" &&
                  appointment.status !== "confirmed"
                }
              >
                Cancel
              </Button>

              {isAdvocateView && appointment.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setShowConfirmDialog(true);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              )}

              {!isAdvocateView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(`/advocates/${appointment.advocate.id}`)
                  }
                >
                  View Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: Appointment["status"] }) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Confirmed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Cancelled
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Appointments</h1>

          {activeTab === "advocate" && (
            <Button onClick={() => setShowAddSlotDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="user">My Appointments</TabsTrigger>
            <TabsTrigger value="advocate">Advocate Calendar</TabsTrigger>
          </TabsList>

          {/* User Appointments Tab */}
          <TabsContent value="user" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="text-red-500 mb-2">{error}</div>
                <Button onClick={() => setIsLoading(true)}>Retry</Button>
              </div>
            ) : userAppointments.length === 0 ? (
              <div className="text-center py-16 my-8 bg-muted/20 rounded-lg">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  No appointments found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You haven't booked any appointments yet. Browse advocates and
                  schedule a consultation.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => router.push("/advocates")}
                >
                  Find Advocates
                </Button>
              </div>
            ) : (
              <div>
                {/* Appointment groups by status */}
                <div className="space-y-10">
                  {/* Upcoming appointments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Upcoming Appointments
                    </h2>
                    {userAppointments.filter(
                      (apt) =>
                        (apt.status === "confirmed" ||
                          apt.status === "pending") &&
                        new Date(apt.startTime) > new Date()
                    ).length > 0 ? (
                      userAppointments
                        .filter(
                          (apt) =>
                            (apt.status === "confirmed" ||
                              apt.status === "pending") &&
                            new Date(apt.startTime) > new Date()
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() -
                            new Date(b.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, false))
                    ) : (
                      <div className="text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                        No upcoming appointments
                      </div>
                    )}
                  </div>

                  {/* Past appointments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Past Appointments
                    </h2>
                    {userAppointments.filter(
                      (apt) =>
                        apt.status === "completed" ||
                        new Date(apt.endTime) < new Date()
                    ).length > 0 ? (
                      userAppointments
                        .filter(
                          (apt) =>
                            apt.status === "completed" ||
                            new Date(apt.endTime) < new Date()
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.startTime).getTime() -
                            new Date(a.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, false))
                    ) : (
                      <div className="text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                        No past appointments
                      </div>
                    )}
                  </div>

                  {/* Cancelled appointments */}
                  {userAppointments.some(
                    (apt) => apt.status === "cancelled"
                  ) && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        Cancelled Appointments
                      </h2>
                      {userAppointments
                        .filter((apt) => apt.status === "cancelled")
                        .sort(
                          (a, b) =>
                            new Date(b.startTime).getTime() -
                            new Date(a.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, false))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Advocate Calendar Tab */}
          <TabsContent value="advocate" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="text-red-500 mb-2">{error}</div>
                <Button onClick={() => setIsLoading(true)}>Retry</Button>
              </div>
            ) : advocateAppointments.length === 0 ? (
              <div className="text-center py-16 my-8 bg-muted/20 rounded-lg">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  No appointments found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You don't have any appointments yet. Add your availability to
                  let clients book your time.
                </p>
                <Button
                  className="mt-6"
                  onClick={() => setShowAddSlotDialog(true)}
                >
                  Add Availability
                </Button>
              </div>
            ) : (
              <div>
                <div className="space-y-10">
                  {/* Pending appointments for advocate */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Pending Requests
                    </h2>
                    {advocateAppointments.filter(
                      (apt) => apt.status === "pending"
                    ).length > 0 ? (
                      advocateAppointments
                        .filter((apt) => apt.status === "pending")
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() -
                            new Date(b.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, true))
                    ) : (
                      <div className="text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                        No pending appointment requests
                      </div>
                    )}
                  </div>

                  {/* Confirmed upcoming appointments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Upcoming Appointments
                    </h2>
                    {advocateAppointments.filter(
                      (apt) =>
                        apt.status === "confirmed" &&
                        new Date(apt.startTime) > new Date()
                    ).length > 0 ? (
                      advocateAppointments
                        .filter(
                          (apt) =>
                            apt.status === "confirmed" &&
                            new Date(apt.startTime) > new Date()
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() -
                            new Date(b.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, true))
                    ) : (
                      <div className="text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                        No upcoming confirmed appointments
                      </div>
                    )}
                  </div>

                  {/* Past appointments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4">
                      Past Appointments
                    </h2>
                    {advocateAppointments.filter(
                      (apt) =>
                        (apt.status === "completed" ||
                          new Date(apt.endTime) < new Date()) &&
                        apt.status !== "cancelled"
                    ).length > 0 ? (
                      advocateAppointments
                        .filter(
                          (apt) =>
                            (apt.status === "completed" ||
                              new Date(apt.endTime) < new Date()) &&
                            apt.status !== "cancelled"
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.startTime).getTime() -
                            new Date(a.startTime).getTime()
                        )
                        .map((apt) => renderAppointmentCard(apt, true))
                    ) : (
                      <div className="text-muted-foreground text-center py-6 bg-muted/10 rounded-lg">
                        No past appointments
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment?
              {selectedAppointment && (
                <div className="mt-2 font-medium">
                  {format(
                    parseISO(selectedAppointment.startTime),
                    "MMMM d, yyyy h:mm a"
                  )}
                </div>
              )}
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
              Confirm this appointment request from{" "}
              {selectedAppointment?.user.name}?
              {selectedAppointment && (
                <div className="mt-2 font-medium">
                  {format(
                    parseISO(selectedAppointment.startTime),
                    "MMMM d, yyyy h:mm a"
                  )}
                </div>
              )}
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

      {/* Add Availability Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Set your availability for client appointments.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Date picker */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recurring option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={() => setIsRecurring(!isRecurring)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="recurring" className="text-sm font-normal">
                Make this a recurring availability slot
              </Label>
            </div>

            {/* Days of week for recurring */}
            {isRecurring && (
              <div className="grid gap-2">
                <Label>Select days of week</Label>
                <div className="flex flex-wrap gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day, idx) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={
                          daysOfWeek.includes(idx) ? "default" : "outline"
                        }
                        onClick={() => {
                          setDaysOfWeek((prev) =>
                            prev.includes(idx)
                              ? prev.filter((d) => d !== idx)
                              : [...prev, idx]
                          );
                        }}
                        className="flex-1"
                      >
                        {day}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddSlotDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Slot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
