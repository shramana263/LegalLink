import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { FileText, Users, Calendar } from "lucide-react";

export default function CaseDetailsView({ caseData }: { caseData: any }) {
  if (!caseData) return null;
  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="h-6 w-6 text-primary" />
        <span className="text-xl font-semibold">
          {caseData.case_type?.replace(/_/g, " ") || "Case"}
        </span>
        <Badge variant="secondary" className="ml-2">{caseData.outcome}</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{caseData.year}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex items-center gap-3">
          <span className="font-medium text-muted-foreground">Role:</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4 text-primary" /> {caseData.role?.replace(/_/g, " ")}</span>
        </div>
        {caseData.court_name && (
          <div className="flex items-center gap-3">
            <span className="font-medium text-muted-foreground">Court:</span>
            <span className="flex items-center gap-1"><FileText className="h-4 w-4 text-primary" /> {caseData.court_name}</span>
          </div>
        )}
        {caseData.duration_months && (
          <div className="flex items-center gap-3">
            <span className="font-medium text-muted-foreground">Duration:</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> {caseData.duration_months} months</span>
          </div>
        )}
      </div>
      {caseData.description && (
        <div className="mt-6 p-4 rounded bg-muted/40 text-muted-foreground text-sm">
          <span className="font-medium text-primary">Description:</span> {caseData.description}
        </div>
      )}
    </div>
  );
}
