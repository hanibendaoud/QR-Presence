import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function JustificationViewer({ student }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex space-x-2">
      {student.justificationFile && (
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-500 hover:underline text-xs"
          onClick={() => window.open(student.justificationFile, "_blank")}
        >
          📄 File
        </Button>
      )}

      {student.justificationText && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-blue-500 hover:underline text-xs">
              Details
            </Button>
          </DialogTrigger>
          <DialogContent className="border border-blue-300 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-blue-700">Justification for {student.full_name}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-700">{student.justificationText}</p>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
