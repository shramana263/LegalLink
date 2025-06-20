import React from "react";
import { AdvocateDetailsForm } from "./AdvocateDetailsForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

interface AdvocateDetailsModalProps {
  initialValues?: any;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const AdvocateDetailsModal: React.FC<AdvocateDetailsModalProps> = ({ initialValues, trigger, onSuccess }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ? trigger : <Button>Edit Advocate Details</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full h-[80vh] overflow-y-scroll flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Edit Advocate Details</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-6 pb-6 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 scrollbar-track-transparent hide-scrollbar">
          <AdvocateDetailsForm
            initialValues={initialValues}
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add this to your global CSS if not present:
// .hide-scrollbar::-webkit-scrollbar { display: none; }
// .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
