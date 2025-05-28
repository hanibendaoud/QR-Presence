import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload } from "lucide-react";

export default function JustifyAbsenceDialog({ student, setStudents }) {
  const [open, setOpen] = useState(false);
  const [justificationText, setJustificationText] = useState("");
  const [justificationFile, setJustificationFile] = useState(null);
  const [fileName, setFileName] = useState(""); 
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setJustificationFile(fileUrl);
      setFileName(file.name); 
    }
  };

  const submitJustification = () => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, status: "justified absence", justificationFile, justificationText }
          : s
      )
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-blue-600 hover:bg-blue-100">
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          Justify Absence
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-blue-300 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-700">Justify Absence for {student.full_name}</DialogTitle>
        </DialogHeader>
        
        <Textarea
          placeholder="Enter justification reason..."
          value={justificationText}
          onChange={(e) => setJustificationText(e.target.value)}
          className="border border-blue-300 focus:ring-blue-500"
        />

        <input
          type="file"
          id="fileUpload"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <Button
          variant="outline"
          className="w-full md:w-[50%] mt-2 flex items-center justify-center gap-2 text-blue-700 border-blue-500 hover:bg-blue-500 hover:text-white transition"
          onClick={() => fileInputRef.current.click()}
        >
          <Upload className="h-4 w-4" />
          Upload Justification
        </Button>

        {fileName && (
          <p className="mt-1 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
            Selected file: {fileName}
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={submitJustification}
            disabled={!justificationText && !justificationFile}
            className="bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
