import React, { useState } from "react";
import { API } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "@/hooks/use-toast";

const CASE_TYPES = [
  "CRIMINAL", "CIVIL", "CORPORATE", "FAMILY", "CYBER", "INTELLECTUAL_PROPERTY", "TAXATION", "LABOR", "ENVIRONMENT", "HUMAN_RIGHTS", "OTHER"
];
const ROLES = [
  "PETITIONER", "RESPONDENT", "DEFENDANT", "PROSECUTOR", "LEGAL_ADVISOR", "OTHER"
];
const OUTCOMES = [
  "WON", "LOST", "PENDING", "SETTLED", "DISMISSED"
];

export default function EditCaseForm({
  initialData,
  caseId,
  onSuccess,
  onCancel
}: {
  initialData: any;
  caseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({ ...initialData });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.Advocate.updateCase(caseId, form);
      toast({ title: "Case updated successfully" });
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Failed to update case",
        description: err?.response?.data?.error || err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 w-full md:max-w-3xl mx-auto" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Case Type</label>
            <Select value={form.case_type} onValueChange={(v) => handleSelect("case_type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {CASE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select value={form.role} onValueChange={(v) => handleSelect("role", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <Input name="year" type="number" min={1900} max={new Date().getFullYear()} value={form.year} onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Outcome</label>
            <Select value={form.outcome} onValueChange={(v) => handleSelect("outcome", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((outcome) => (
                  <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the case (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Court Name</label>
            <Input name="court_name" value={form.court_name} onChange={handleChange} placeholder="Court name (optional)" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (months)</label>
            <Input name="duration_months" type="number" min={0} value={form.duration_months ?? ""} onChange={handleChange} placeholder="e.g. 12" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Case"}
        </Button>
      </div>
    </form>
  );
}
