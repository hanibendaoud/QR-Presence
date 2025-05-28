import { MoreHorizontal, Clipboard, Check, X, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import JustifyAbsenceDialog from "../components/justifyAbsence";
import JustificationViewer from "../components/justificationViewer"; 
export const columns = (setStudents, sd) => {
  
  const baseColumns = [
    {
      accessorKey: "id",
      header: "Student ID",
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("id")}</span>,
    },
    {
      accessorKey: "full_name",
      header: "Full Name",
      cell: ({ row }) => <span className="text-sm">{row.getValue("full_name")}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-sm">{row.getValue("email")}</span>,
    },
    /* {
      accessorKey: "group",
      header: "Group",
      cell: ({ row }) => <span className="text-sm">{row.getValue("group")}</span>,
    }, */
    {
      accessorKey: "status",
      header: `${sd ? "Status" : "Attendance Rate"} `,
      cell: ({ row }) => {
        const student = row.original;
        const statusStyles = {
          present: "bg-green-100 text-green-700",
          absent: "bg-red-100 text-red-700",
          late: "bg-yellow-100 text-yellow-700",
          "justified absence": "bg-blue-100 text-blue-700",
        };
        
        if (sd) {
          return (
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium uppercase ${
                  statusStyles[student.status.toLowerCase()] || ""
                }`}
              >
                {student.status}
              </span>
              {(student.justificationFile || student.justificationText) && (
                <JustificationViewer student={student} />
              )}
            </div>
          );
        } else {
          const attendanceRate = student.totalSessions > 0 
            ? Math.round((student.presentSessions / student.totalSessions) * 100) 
            : 0;
          
          const getProgressColor = (rate) => {
            if (rate >= 90) return "bg-green-500";
            if (rate >= 75) return "bg-green-400";
            if (rate >= 60) return "bg-yellow-400"; 
            if (rate >= 40) return "bg-orange-400";
            if (rate >= 20) return "bg-orange-500";
            return "bg-red-500";
          };

          const getTextColor = (rate) => {
            if (rate >= 90) return "text-green-700";
            if (rate >= 75) return "text-green-600";
            if (rate >= 60) return "text-yellow-700"; 
            if (rate >= 40) return "text-orange-700";
            if (rate >= 20) return "text-orange-800";
            return "text-red-700";
          };
            
          return (
            <div className="w-full space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className={getTextColor(attendanceRate)}>{attendanceRate}%</span>
                <span className="text-gray-500">{student.presentSessions}/{student.totalSessions} sessions</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getProgressColor(attendanceRate)}`}
                  style={{ width: `${attendanceRate}%` }}
                  aria-label={`${attendanceRate}% attendance rate`}
                />
              </div>
            </div>
          );
        }
      },
    },
  ];
  
  if (sd) {
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;

        const updateStudentStatus = (status) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === student.id
                ? { ...s, status, justificationFile: null, justificationText: "" }
                : s
            )
          );
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(student.id)}>
                <Clipboard className="mr-2 h-4 w-4" />
                Copy Student ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(student.email)}>
                <Mail className="mr-2 h-4 w-4" />
                Copy Student Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => updateStudentStatus("present")}>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Mark as Present
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStudentStatus("absent")}>
                <X className="mr-2 h-4 w-4 text-red-600" />
                Mark as Absent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStudentStatus("late")}>
                <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                Mark as Late
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <JustifyAbsenceDialog student={student} setStudents={setStudents} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return baseColumns;
};