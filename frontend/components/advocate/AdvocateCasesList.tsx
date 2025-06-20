import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Calendar, FileText, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import EditCaseForm from "./EditCaseForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle } from "../ui/dialog";
import { API } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import CaseDetailsView from "./CaseDetailsView";
import { Dialog as ViewDialog, DialogContent as ViewDialogContent, DialogHeader as ViewDialogHeader, DialogTitle as ViewDialogTitle } from "../ui/dialog";

export default function AdvocateCasesList({ cases, loading, advocateId, onCaseUpdated }: { cases: any[]; loading: boolean; advocateId?: string; onCaseUpdated?: () => void }) {
  const { user } = useAuth() as { user: any };
  const [editCaseId, setEditCaseId] = useState<string | null>(null);
  const [editCaseData, setEditCaseData] = useState<any>(null);
  const [deleteCaseId, setDeleteCaseId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewCaseId, setViewCaseId] = useState<string | null>(null);
  const [viewCaseData, setViewCaseData] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleEditClick = (c: any) => {
    setEditCaseId(c.id || c.case_id);
    setEditCaseData(c);
  };
  const handleEditClose = () => {
    setEditCaseId(null);
    setEditCaseData(null);
  };
  const handleEditSuccess = () => {
    handleEditClose();
    onCaseUpdated?.();
  };

  const handleDeleteClick = (c: any) => {
    setDeleteCaseId(c.id || c.case_id);
  };
  const handleDeleteClose = () => {
    setDeleteCaseId(null);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteCaseId) return;
    setDeleteLoading(true);
    try {
      await API.Advocate.deleteCase(deleteCaseId);
      toast({ title: "Case deleted successfully" });
      setDeleteCaseId(null);
      onCaseUpdated?.();
    } catch (err: any) {
      toast({
        title: "Failed to delete case",
        description: err?.response?.data?.error || err.message || String(err),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewClick = async (c: any) => {
    setViewCaseId(c.id || c.case_id);
    setViewCaseData(null);
    setViewLoading(true);
    try {
      const res = await API.Advocate.getCaseById(c.id || c.case_id);
      setViewCaseData(res.data);
    } catch (err) {
      setViewCaseData(null);
    } finally {
      setViewLoading(false);
    }
  };
  const handleViewClose = () => {
    setViewCaseId(null);
    setViewCaseData(null);
    setViewLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden border shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle>
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (!cases || cases.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No cases found.</div>;
  }
  return (
    <div className="space-y-4">
      {cases.map((c, idx) => {
        // Fix: Use advocateId prop as the source of truth for the current profile's advocate_id
        // and compare it to the case's advocate_id (or fallback to advocateId if not present on the case)
        // user.advocate_id should match advocateId for own profile
        const canEdit = user && user.type === "advocate" && advocateId && (user.advocate_id === advocateId);
        const isOwnCase = c.advocate_id === advocateId || (c.advocate_id && c.advocate_id === user?.advocate_id);
        console.log("user:", advocateId, "case:", c.advocate_id, "own:", isOwnCase, "canEdit:", canEdit);
        return (
          <Card key={c.id || c.case_id || idx} className="overflow-hidden border shadow-md">
            <CardHeader className="bg-muted/30 flex flex-row items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                {c.case_type?.replace(/_/g, " ") || "Case"} <span className="text-xs text-muted-foreground">({c.year})</span>
                <Button size="sm" variant="secondary" className="ml-2 text-sm rounded-full" onClick={() => handleViewClick(c)}>
                    View Details
                  </Button>
              </CardTitle>
              <Badge variant="secondary" className="ml-auto">{c.outcome}</Badge>
              {isOwnCase && (
                <>
                  <Button size="sm" className=" bg-transparent" onClick={() => handleEditClick(c)}>
                    <Pencil className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button size="sm" className="bg-transparent" onClick={() => handleDeleteClick(c)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                  
                </>
              )}
              
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <div className="flex flex-wrap gap-4 text-sm">
                <span><b>Role:</b> {c.role?.replace(/_/g, " ")}</span>
                {c.court_name && <span><b>Court:</b> {c.court_name}</span>}
                {c.duration_months && <span><b>Duration:</b> {c.duration_months} months</span>}
              </div>
              {c.description && <div className="text-muted-foreground text-sm">{c.description}</div>}
            </CardContent>
            {/* Edit Case Modal */}
            {isOwnCase && editCaseId === (c.id || c.case_id) && (
              <Dialog open={true} onOpenChange={handleEditClose}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Case</DialogTitle>
                  </DialogHeader>
                  <EditCaseForm
                    initialData={editCaseData}
                    caseId={editCaseId || ""}
                    onSuccess={handleEditSuccess}
                    onCancel={handleEditClose}
                  />
                </DialogContent>
              </Dialog>
            )}
            {/* Delete Case Confirmation Modal */}
            {isOwnCase && deleteCaseId === (c.id || c.case_id) && (
              <ConfirmDialog open={true} onOpenChange={handleDeleteClose}>
                <ConfirmDialogContent className="max-w-sm">
                  <ConfirmDialogHeader>
                    <ConfirmDialogTitle>Delete Case</ConfirmDialogTitle>
                  </ConfirmDialogHeader>
                  <div className="py-2">Are you sure you want to delete this case? This action cannot be undone.</div>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={handleDeleteClose} disabled={deleteLoading}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </ConfirmDialogContent>
              </ConfirmDialog>
            )}
            {/* View Case Details Modal */}
            {viewCaseId === (c.id || c.case_id) && (
              <ViewDialog open={true} onOpenChange={handleViewClose}>
                <ViewDialogContent className="max-w-lg">
                  <ViewDialogHeader>
                    <ViewDialogTitle>Case Details</ViewDialogTitle>
                  </ViewDialogHeader>
                  {viewLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading...</div>
                  ) : (
                    <CaseDetailsView caseData={viewCaseData} />
                  )}
                </ViewDialogContent>
              </ViewDialog>
            )}
          </Card>
        );
      })}
    </div>
  );
}
