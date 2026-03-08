import { useStudentData } from "@/hooks/useStudentData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap } from "lucide-react";

export default function StudentProfilePage() {
  const { student, school, loading } = useStudentData();

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!student) return <div className="text-center py-20 text-muted-foreground">No student record found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo & Basic */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center space-y-4">
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={student.photo_url} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">{student.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.admission_number}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">{student.classes?.name}</Badge>
              {student.sections?.name && <Badge variant="outline">Section {student.sections.name}</Badge>}
              <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
            </div>
            {school && <p className="text-xs text-muted-foreground">{school.name}</p>}
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Admission No" value={student.admission_number} />
            <Field label="Name" value={student.name} />
            <Field label="Gender" value={student.gender} />
            <Field label="Date of Birth" value={student.date_of_birth} />
            <Field label="Blood Group" value={student.blood_group} />
            <Field label="Phone" value={student.phone} />
            <Field label="Class" value={student.classes?.name} />
            <Field label="Section" value={student.sections?.name} />
            <Field label="Roll Number" value={student.roll_number} />
            <Field label="Academic Year" value={student.academic_years?.name} />
            <Field label="Admission Date" value={student.admission_date} />
            <Field label="PEN Number" value={student.pen_number} />
          </CardContent>
        </Card>

        {/* Guardian Info */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Guardian Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <Field label="Father's Name" value={student.father_name} />
            <Field label="Father's Phone" value={student.father_phone} />
            <Field label="Father's Occupation" value={student.father_occupation} />
            <Field label="Mother's Name" value={student.mother_name} />
            <Field label="Mother's Occupation" value={student.mother_occupation} />
            <Field label="Guardian Name" value={student.guardian_name} />
            <Field label="Guardian Phone" value={student.guardian_phone} />
            <Field label="Guardian Relation" value={student.guardian_relation} />
            <Field label="Parent Email" value={student.parent_email} />
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Address</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <Field label="Address" value={student.address} />
            <Field label="City" value={student.city} />
            <Field label="State" value={student.state} />
            <Field label="Pincode" value={student.pincode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
