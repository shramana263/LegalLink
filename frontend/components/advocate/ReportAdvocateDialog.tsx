import React, { useState } from "react";
import { API } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Violation categories
const VIOLATION_CATEGORIES = [
  "FRAUD",
  "MISCONDUCT",
  "UNPROFESSIONAL_BEHAVIOR",
  "FALSE_ADVERTISING",
  "MALPRACTICE",
  "OTHER",
];

interface ReportAdvocateDialogProps {
  advocateId: string;
  advocateName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function ReportAdvocateDialog({
  advocateId,
  advocateName,
  trigger,
  onSuccess,
}: ReportAdvocateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    reason: "",
    details: "",
  });
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.reason.trim()) {
      toast({
        title: "Required Fields Missing",
        description:
          "Please select a category and provide a reason for the report.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await API.Advocate.reportAdvocate({
        advocate_id: advocateId,
        category: formData.category,
        reason: formData.reason,
        details: formData.details,
      });

      toast({
        title: "Report Submitted",
        description: "Your report has been submitted for review.",
        variant: "default",
      });

      // Reset form and close dialog
      setFormData({ category: "", reason: "", details: "" });
      setOpen(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Failed to Submit Report",
        description:
          error?.response?.data?.message ||
          "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] form-modal-bg">
        <DialogHeader>
          <DialogTitle className="text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Report Advocate
          </DialogTitle>
          <DialogDescription>
            Report {advocateName} for a violation of platform policies or
            professional misconduct.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category">Violation Category *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select violation category" />
              </SelectTrigger>
              <SelectContent>
                {VIOLATION_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report *</Label>
            <Input
              id="reason"
              name="reason"
              placeholder="Brief reason for this report"
              value={formData.reason}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details *</Label>
            <Textarea
              id="details"
              name="details"
              placeholder="Please provide any additional details or context about the issue"
              value={formData.details}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.category || !formData.reason.trim()
              }
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
