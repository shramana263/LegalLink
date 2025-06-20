import React, { useState, useEffect } from "react";
import { API } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AdvocateDetailsFormProps {
  initialValues?: Partial<{
    name: string;
    contact_email: string;
    phone_number: string;
    qualification: string;
    experience_years: number;
    profile_photo_url: string;
    availability_status: boolean;
    language_preferences: string[];
    location_city: string;
    jurisdiction_states: string[];
    fee_structure: Record<string, any>;
    verification_document_url: string;
  }>;
  onSuccess?: () => void;
}

export const AdvocateDetailsForm: React.FC<AdvocateDetailsFormProps> = ({
  initialValues = {},
  onSuccess,
}) => {
  const [form, setForm] = useState({
    name: initialValues.name || "",
    contact_email: initialValues.contact_email || "",
    phone_number: initialValues.phone_number || "",
    qualification: initialValues.qualification || "",
    experience_years: initialValues.experience_years || 0,
    profile_photo_url: initialValues.profile_photo_url || "",
    availability_status: initialValues.availability_status || false,
    language_preferences: initialValues.language_preferences || [],
    location_city: initialValues.location_city || "",
    jurisdiction_states: initialValues.jurisdiction_states || [],
    fee_structure: initialValues.fee_structure || {},
    verification_document_url: initialValues.verification_document_url || "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // If no initialValues, fetch advocate data from API
    if (!initialValues || Object.keys(initialValues).length === 0) {
      (async () => {
        try {
          const res = await API.Advocate.getAdvocateData();
          const data = res.data || {};
          setForm((prev) => ({
            ...prev,
            name: data.name || "",
            contact_email: data.contact_email || "",
            phone_number: data.phone_number || "",
            qualification: data.qualification || "",
            experience_years: data.experience_years || 0,
            profile_photo_url: data.profile_photo_url || "",
            availability_status: data.availability_status || false,
            language_preferences: data.language_preferences || [],
            location_city: data.location_city || "",
            jurisdiction_states: data.jurisdiction_states || [],
            fee_structure: data.fee_structure || {},
            verification_document_url: data.verification_document_url || "",
          }));
        } catch (err) {
          toast({ title: "Failed to load advocate data", description: String(err), variant: "destructive" });
        }
      })();
    }
  }, [initialValues, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === "number") {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value.split(",").map((v) => v.trim()).filter(Boolean),
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await API.Upload.uploadFile(file);
      setForm((prev) => ({
        ...prev,
        verification_document_url: res.data.url,
      }));
      toast({ title: "Document uploaded successfully" });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.Advocate.updateAdvocateDetails(form);
      toast({ title: "Advocate details updated successfully" });
      onSuccess?.();
    } catch (err: any) {
      let description = "Update failed";
      if (err?.response?.data?.error) {
        description = err.response.data.error;
      } else if (err?.response?.data?.message) {
        description = err.response.data.message;
      } else if (err?.message) {
        description = err.message;
      }
      toast({ title: "Update failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col h-full overflow-y-auto space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium">Name</label>
      <Input name="name" value={form.name} onChange={handleChange} required placeholder="Enter your name" />
      <label className="block text-sm font-medium">Contact Email</label>
      <Input name="contact_email" value={form.contact_email} onChange={handleChange} type="email" placeholder="Enter your contact email" />
      <label className="block text-sm font-medium">Phone Number</label>
      <Input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Enter your phone number" />
      <label className="block text-sm font-medium">Qualification</label>
      <Input name="qualification" value={form.qualification} onChange={handleChange} placeholder="Enter your qualification" />
      <label className="block text-sm font-medium">Experience (years)</label>
      <Input name="experience_years" value={form.experience_years} onChange={handleChange} type="number" min={0} placeholder="Years of experience" />
      <label className="block text-sm font-medium">Profile Photo URL</label>
      <Input name="profile_photo_url" value={form.profile_photo_url} onChange={handleChange} placeholder="Profile photo URL" />
      <label className="block text-sm font-medium">Availability Status</label>
      <input type="checkbox" name="availability_status" checked={form.availability_status} onChange={handleChange} />
      <label className="block text-sm font-medium">Language Preferences (comma separated)</label>
      <Input
        name="language_preferences"
        value={form.language_preferences.join(", ")}
        onChange={(e) => handleArrayChange("language_preferences", e.target.value)}
        placeholder="e.g. English, Hindi"
      />
      <label className="block text-sm font-medium">Location City</label>
      <Input name="location_city" value={form.location_city} onChange={handleChange} placeholder="Enter your city" />
      <label className="block text-sm font-medium">Jurisdiction States (comma separated)</label>
      <Input
        name="jurisdiction_states"
        value={form.jurisdiction_states.join(", ")}
        onChange={(e) => handleArrayChange("jurisdiction_states", e.target.value)}
        placeholder="e.g. Maharashtra, Karnataka"
      />
      <label className="block text-sm font-medium">Fee Structure (JSON)</label>
      <Textarea
        name="fee_structure"
        value={JSON.stringify(form.fee_structure)}
        onChange={(e) => {
          try {
            setForm((prev) => ({ ...prev, fee_structure: JSON.parse(e.target.value || '{}') }));
          } catch {
            // ignore parse error
          }
        }}
        placeholder={'e.g. {"consultation": 500, "court": 2000}'}
      />
      <label className="block text-sm font-medium">Verification Document</label>
      <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
      {form.verification_document_url && (
        <a href={form.verification_document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">View Uploaded Document</a>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Updating..." : "Update Details"}
      </Button>
    </form>
  );
};
