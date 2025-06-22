import React, { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface AdvocateAvailabilitySlotsProps {
  advocateId: string;
  onCalendarConnected: (connected: boolean) => void;
}

export default function AdvocateAvailabilitySlots({
  advocateId,
  onCalendarConnected,
}: AdvocateAvailabilitySlotsProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSlot, setBookingSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingReason, setBookingReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!advocateId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await API.Appointment.getAdvocateAvailability(
          advocateId
        );
        setSlots(response.data.slots || []);
        onCalendarConnected(true);
      } catch (err: any) {
        console.error("Failed to fetch availability slots:", err);
        setError(
          err?.response?.data?.message || "Failed to fetch availability slots"
        );
        onCalendarConnected(false);
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [advocateId]);

  const handleBookAppointment = async () => {
    if (!bookingSlot || !user || !advocateId) return;

    setIsBooking(true);
    try {
      await API.Appointment.book({
        advocate_id: advocateId,
        startTime: bookingSlot.start,
        endTime: bookingSlot.end,
        reason: bookingReason,
      });

      toast({
        title: "Appointment Booked Successfully",
        description: `Your appointment has been booked for ${format(
          parseISO(bookingSlot.start),
          "MMMM dd, yyyy hh:mm a"
        )}`,
      });

      // Remove the booked slot from available slots
      setSlots(
        slots.filter(
          (slot) =>
            slot.start !== bookingSlot.start && slot.end !== bookingSlot.end
        )
      );

      // Close dialog
      setBookingSlot(null);
      setBookingReason("");
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description:
          err?.response?.data?.message ||
          "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "MMMM dd, yyyy");
  };

  const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "hh:mm a");
  };

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No availability slots found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slots.map((slot, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{formatDate(slot.start)}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setBookingSlot(slot)}
            disabled={!user}
          >
            Book
          </Button>
        </div>
      ))}

      {!user && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to book an appointment
        </div>
      )}

      <Dialog
        open={!!bookingSlot}
        onOpenChange={(open) => !open && setBookingSlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Please provide details for your appointment on{" "}
              {bookingSlot && formatDate(bookingSlot.start)} at{" "}
              {bookingSlot && formatTime(bookingSlot.start)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Appointment</Label>
              <Input
                id="reason"
                placeholder="Brief description of your legal matter"
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingSlot(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookAppointment}
              disabled={isBooking || !bookingReason.trim()}
            >
              {isBooking ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
