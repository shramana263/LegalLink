"use client";

import { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Indian states list for jurisdiction selection
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// Common Indian languages
const LANGUAGES = [
  "Hindi",
  "English",
  "Bengali",
  "Marathi",
  "Telugu",
  "Tamil",
  "Gujarati",
  "Urdu",
  "Kannada",
  "Odia",
  "Malayalam",
  "Punjabi",
  "Assamese",
  "Maithili",
];

// Experience level options
const EXPERIENCE_LEVELS = [
  "Junior",
  "Mid-level",
  "Senior",
  "Expert",
  "Principal",
];

// Common legal specializations
const LEGAL_SPECIALIZATIONS = [
  "CRIMINAL",
  "CIVIL",
  "FAMILY",
  "CORPORATE",
  "INTELLECTUAL_PROPERTY",
  "REAL_ESTATE",
  "IMMIGRATION",
  "TAX",
  "LABOR",
  "CONSTITUTIONAL",
];

interface AdvocateUpdateFormProps {
  initialData?: {
    name?: string;
    contact_email?: string;
    phone_number?: string;
    qualification?: string;
    experience_years?: string;
    profile_photo_url?: string;
    availability_status?: boolean;
    language_preferences?: string[];
    location_city?: string;
    jurisdiction_states?: string[];
    fee_structure?: Record<string, any> | string;
  };
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export default function AdvocateUpdateForm({
  initialData = {},
  onSuccess,
  onError,
}: AdvocateUpdateFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [specializations, setSpecializations] = useState<
    Array<string | { specialization: string }>
  >([]);
  const [isSpecializationLoading, setIsSpecializationLoading] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [isAddingSpecialization, setIsAddingSpecialization] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    contact_email: initialData.contact_email || "",
    phone_number: initialData.phone_number || "",
    qualification: initialData.qualification || "",
    experience_years: initialData.experience_years || "Junior",
    profile_photo_url: initialData.profile_photo_url || "",
    availability_status:
      initialData.availability_status !== undefined
        ? initialData.availability_status
        : true,
    language_preferences: initialData.language_preferences || [],
    location_city: initialData.location_city || "",
    jurisdiction_states: initialData.jurisdiction_states || [],
    fee_structure: {
      Consultation: 0,
      PreAppearance: 0,
      FixedCase: 0,
    },
  });

  // Initialize fee structure based on initialData
  useEffect(() => {
    if (initialData.fee_structure) {
      let feeStructure = {
        Consultation: 0,
        PreAppearance: 0,
        FixedCase: 0,
      };

      // If fee_structure is a string, try to parse it
      if (typeof initialData.fee_structure === "string") {
        try {
          const parsed = JSON.parse(initialData.fee_structure);
          feeStructure = {
            ...feeStructure,
            ...(parsed && typeof parsed === "object" ? parsed : {}),
          };
        } catch (e) {
          console.error("Error parsing fee structure:", e);
        }
      } else if (typeof initialData.fee_structure === "object") {
        feeStructure = {
          ...feeStructure,
          ...initialData.fee_structure,
        };
      }

      setFormData((prev) => ({
        ...prev,
        fee_structure: feeStructure,
      }));
    }
  }, [initialData.fee_structure]);

  // Fetch specializations on component mount
  useEffect(() => {
    const fetchSpecializations = async () => {
      setIsSpecializationLoading(true);
      try {
        const response = await API.Advocate.getSpecializations();
        setSpecializations(response.data || []);
      } catch (error) {
        console.error("Error fetching specializations:", error);
      } finally {
        setIsSpecializationLoading(false);
      }
    };

    fetchSpecializations();
  }, []);

  // Handler for input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for fee structure changes
  const handleFeeChange = (field: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      fee_structure: {
        ...prev.fee_structure,
        [field]: numValue,
      },
    }));
  };

  // Handler for switch toggle
  const handleToggleChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availability_status: checked,
    }));
  };

  // Handle adding/removing languages
  const toggleLanguage = (language: string) => {
    setFormData((prev) => {
      if (prev.language_preferences.includes(language)) {
        return {
          ...prev,
          language_preferences: prev.language_preferences.filter(
            (lang) => lang !== language
          ),
        };
      } else {
        return {
          ...prev,
          language_preferences: [...prev.language_preferences, language],
        };
      }
    });
  };

  // Handle adding/removing jurisdiction states
  const toggleJurisdictionState = (state: string) => {
    setFormData((prev) => {
      if (prev.jurisdiction_states.includes(state)) {
        return {
          ...prev,
          jurisdiction_states: prev.jurisdiction_states.filter(
            (s) => s !== state
          ),
        };
      } else {
        return {
          ...prev,
          jurisdiction_states: [...prev.jurisdiction_states, state],
        };
      }
    });
  };

  // Handle adding a new specialization
  const handleAddSpecialization = async () => {
    if (!newSpecialization) return;

    setIsAddingSpecialization(true);
    try {
      await API.Advocate.addSpecialization({
        specialization: newSpecialization,
      });
      // Add new specialization to the local state
      setSpecializations((prev) => [
        ...prev,
        { specialization: newSpecialization },
      ]);
      setNewSpecialization("");
      toast({
        title: "Specialization Added",
        description: `${newSpecialization} has been added to your specializations.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Add Specialization",
        description:
          error?.response?.data?.message ||
          "An error occurred while adding the specialization.",
        variant: "destructive",
      });
    } finally {
      setIsAddingSpecialization(false);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await API.Advocate.updateAdvocateInfo(formData);

      toast({
        title: "Profile Updated",
        description: "Your advocate profile has been updated successfully.",
        variant: "default",
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error: any) {
      console.error("Error updating advocate profile:", error);

      toast({
        title: "Update Failed",
        description:
          error?.response?.data?.message ||
          "Failed to update profile. Please try again.",
        variant: "destructive",
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={handleChange}
            placeholder="contact@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+91 9876543210"
          />
        </div>
      </div>

      {/* Professional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input
            id="qualification"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            placeholder="e.g., LLB, LLM"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience_years">Experience Level</Label>
          <Select
            value={formData.experience_years}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, experience_years: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profile Photo URL */}
      <div className="space-y-2">
        <Label htmlFor="profile_photo_url">Profile Photo URL</Label>
        <Input
          id="profile_photo_url"
          name="profile_photo_url"
          value={formData.profile_photo_url}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      {/* Availability Status */}
      <div className="flex items-center justify-between">
        <Label htmlFor="availability_status">Available for New Cases</Label>
        <Switch
          id="availability_status"
          checked={formData.availability_status}
          onCheckedChange={handleToggleChange}
        />
      </div>

      {/* Location City */}
      <div className="space-y-2">
        <Label htmlFor="location_city">City</Label>
        <Input
          id="location_city"
          name="location_city"
          value={formData.location_city}
          onChange={handleChange}
          placeholder="Your city"
        />
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label>Language Preferences</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
          {LANGUAGES.map((language) => (
            <div
              key={language}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center justify-between cursor-pointer ${
                formData.language_preferences.includes(language)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
              onClick={() => toggleLanguage(language)}
            >
              {language}
              {formData.language_preferences.includes(language) && (
                <Check className="h-3 w-3 ml-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Jurisdiction States */}
      <div className="space-y-2">
        <Label>Jurisdiction (States)</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.jurisdiction_states.map((state) => (
            <Badge
              key={state}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              {state}
              <button
                type="button"
                onClick={() => toggleJurisdictionState(state)}
                className="h-4 w-4 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center"
              >
                <X className="h-2 w-2" />
              </button>
            </Badge>
          ))}
        </div>
        <Select
          onValueChange={(value) => {
            if (value && !formData.jurisdiction_states.includes(value)) {
              toggleJurisdictionState(value);
            }
          }}
          value=""
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Add jurisdiction state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.filter(
              (state) => !formData.jurisdiction_states.includes(state)
            ).map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fee Structure */}
      <div className="space-y-2">
        <Label>Fee Structure</Label>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Set Your Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="consultation_fee">Consultation Fee (₹)</Label>
                <Input
                  id="consultation_fee"
                  type="number"
                  min="0"
                  value={formData.fee_structure.Consultation}
                  onChange={(e) =>
                    handleFeeChange("Consultation", e.target.value)
                  }
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="pre_appearance_fee">
                  Pre-Appearance Fee (₹)
                </Label>
                <Input
                  id="pre_appearance_fee"
                  type="number"
                  min="0"
                  value={formData.fee_structure.PreAppearance}
                  onChange={(e) =>
                    handleFeeChange("PreAppearance", e.target.value)
                  }
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="fixed_case_fee">Fixed Case Fee (₹)</Label>
                <Input
                  id="fixed_case_fee"
                  type="number"
                  min="0"
                  value={formData.fee_structure.FixedCase}
                  onChange={(e) => handleFeeChange("FixedCase", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Specializations Section */}
      <div className="space-y-2">
        <Label>Specializations</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {isSpecializationLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading specializations...
            </div>
          ) : specializations.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No specializations added yet
            </div>
          ) : (
            specializations.map((spec, index) => (
              <Badge key={index} variant="secondary">
                {typeof spec === "object" && spec !== null
                  ? spec.specialization
                  : spec}
              </Badge>
            ))
          )}
        </div>

        <div className="flex space-x-2 mt-3">
          <Select
            value={newSpecialization}
            onValueChange={setNewSpecialization}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add specialization" />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_SPECIALIZATIONS.filter(
                (spec) =>
                  !specializations.some((existingSpec) =>
                    typeof existingSpec === "object"
                      ? existingSpec.specialization === spec
                      : existingSpec === spec
                  )
              ).map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={handleAddSpecialization}
            disabled={isAddingSpecialization || !newSpecialization}
          >
            {isAddingSpecialization ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Update Advocate Profile"
        )}
      </Button>
    </form>
  );
}
