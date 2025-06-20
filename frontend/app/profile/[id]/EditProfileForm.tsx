"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function EditProfileForm({ profile, onSuccess }: { profile: any; onSuccess: (updatedProfile: any) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || "",
    image: profile?.avatar || "",
    district: profile?.district || "",
    state: profile?.state || "",
    location: profile?.location || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle file input change for image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await API.Upload.uploadFile(file);
      if (res.data?.url) {
        setForm((prev) => ({ ...prev, image: res.data.url }));
        toast({ title: "Image Uploaded", description: "Image uploaded successfully." });
      } else {
        toast({ title: "Upload Failed", description: "No URL returned.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err?.response?.data?.error || "Upload failed.", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await API.Auth.updateUser(form);
      if (res.data.status) {
        toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
        onSuccess({ ...form });
      } else {
        setErrorMessage("Update failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Update failed. Please try again.");
      toast({
        title: "Update Failed",
        description: err?.response?.data?.message || "Update failed. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={form.name} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image-upload">Profile Image</Label>
        <Input id="image-upload" name="image-upload" type="file" accept="image/*,application/pdf" onChange={handleImageUpload} disabled={uploading} />
        {uploading && <div className="text-xs text-blue-500">Uploading...</div>}
        {form.image && (
          <div className="mt-2">
            <img src={form.image} alt="Profile Preview" className="h-20 w-20 object-cover rounded-full border" />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="district">District</Label>
        <Input id="district" name="district" value={form.district} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" name="state" value={form.state} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" value={form.location} onChange={handleChange} />
      </div>
      {errorMessage && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2 animate-fade-in">
          {errorMessage}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
