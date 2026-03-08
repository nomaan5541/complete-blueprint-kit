import { useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, User } from "lucide-react";

export interface StudentFormData {
  admission_number: string; name: string; gender: string; date_of_birth: string;
  blood_group: string; father_name: string; mother_name: string; father_phone: string;
  address: string; city: string; state: string; pincode: string;
  admission_date: string; class_id: string; section_id: string; academic_year_id: string;
  roll_number: string; phone: string; pen_number: string; bio: string;
  medium_of_instruction: string; second_language: string; previous_school: string;
  previous_class_passed: string; tc_number: string; joining_date: string;
  elective_subjects: string; scholarship_category: string; caste_category: string;
  father_occupation: string; mother_occupation: string; guardian_name: string;
  guardian_relation: string; guardian_phone: string; alternate_contact: string;
  family_annual_income: string; parent_email: string; status: string;
}

export const emptyStudentForm: StudentFormData = {
  admission_number: "", name: "", gender: "", date_of_birth: "", blood_group: "",
  father_name: "", mother_name: "", father_phone: "", address: "", city: "",
  state: "", pincode: "", admission_date: "", class_id: "", section_id: "",
  academic_year_id: "", roll_number: "", phone: "", pen_number: "", bio: "",
  medium_of_instruction: "", second_language: "", previous_school: "",
  previous_class_passed: "", tc_number: "", joining_date: "", elective_subjects: "",
  scholarship_category: "", caste_category: "", father_occupation: "",
  mother_occupation: "", guardian_name: "", guardian_relation: "", guardian_phone: "",
  alternate_contact: "", family_annual_income: "", parent_email: "", status: "active",
};

interface Props {
  form: StudentFormData;
  setForm: React.Dispatch<React.SetStateAction<StudentFormData>>;
  classes: any[];
  sections: any[];
  academicYears: any[];
  filteredSections: any[];
  photoFile?: File | null;
  onPhotoChange?: (file: File | null) => void;
  photoPreview?: string | null;
  documentUploads?: Record<string, File | null>;
  onDocumentChange?: (docType: string, file: File | null) => void;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const MEDIUMS = ["English", "Telugu", "Hindi", "Urdu"];
const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Minority"];

const DOC_SECTIONS = [
  {
    title: "Identity & Proof",
    docs: ["Birth Certificate", "Aadhaar Card Copy", "Student Photo", "Parent Photo"],
  },
  {
    title: "Academic Records",
    docs: ["Previous Class Marks Memo", "Transfer Certificate", "Bonafide Certificate", "Study Certificate"],
  },
  {
    title: "Category & Benefits",
    docs: ["Caste Certificate", "Income Certificate", "Minority Certificate", "Disability Certificate", "Scholarship Documents"],
  },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

export default function StudentFormTabs({
  form, setForm, classes, sections, academicYears, filteredSections,
  photoFile, onPhotoChange, photoPreview, documentUploads = {}, onDocumentChange,
}: Props) {
  const photoRef = useRef<HTMLInputElement>(null);
  const docRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const set = (field: keyof StudentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  const setSelect = (field: keyof StudentFormData) => (v: string) =>
    setForm(p => ({ ...p, [field]: v }));

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
        <TabsTrigger value="academic" className="text-xs">Academic</TabsTrigger>
        <TabsTrigger value="guardian" className="text-xs">Guardian</TabsTrigger>
        <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
        <TabsTrigger value="other" className="text-xs">Other</TabsTrigger>
      </TabsList>

      {/* BASIC TAB */}
      <TabsContent value="basic" className="space-y-4 mt-0">
        {/* Photo upload */}
        {onPhotoChange && (
          <div className="flex items-center gap-4 mb-2">
            <div
              className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer overflow-hidden bg-muted hover:border-primary/50 transition-colors"
              onClick={() => photoRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Student" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground/50" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Student Photo <span className="text-destructive">*</span></p>
              <p className="text-xs text-muted-foreground">Click to upload</p>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden"
              onChange={e => onPhotoChange(e.target.files?.[0] || null)} />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class" required>
            <Select value={form.class_id} onValueChange={v => setForm(p => ({ ...p, class_id: v, section_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Roll Number" required>
            <Input value={form.roll_number} onChange={set("roll_number")} placeholder="e.g. 01" />
          </Field>
          <Field label="Full Name" required>
            <Input value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Father Name">
            <Input value={form.father_name} onChange={set("father_name")} />
          </Field>
          <Field label="Mother Name">
            <Input value={form.mother_name} onChange={set("mother_name")} />
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onValueChange={setSelect("gender")}>
              <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>{GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Date of Birth" required>
            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} />
          </Field>
          <Field label="Phone Number" required>
            <Input value={form.phone} onChange={set("phone")} placeholder="Student/Parent phone" />
          </Field>
          <Field label="PEN Number" required>
            <Input value={form.pen_number} onChange={set("pen_number")} placeholder="Permanent Education Number" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bio">
              <Textarea value={form.bio} onChange={set("bio")} rows={2} placeholder="Brief description..." />
            </Field>
          </div>
          <Field label="Admission No" required>
            <Input value={form.admission_number} onChange={set("admission_number")} />
          </Field>
          <Field label="Admission Date" required>
            <Input type="date" value={form.admission_date} onChange={set("admission_date")} />
          </Field>
          <Field label="Blood Group" required>
            <Select value={form.blood_group} onValueChange={setSelect("blood_group")}>
              <SelectTrigger><SelectValue placeholder="Blood Group" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" required>
              <Input value={form.address} onChange={set("address")} />
            </Field>
          </div>
          <Field label="City" required>
            <Input value={form.city} onChange={set("city")} />
          </Field>
          <Field label="State" required>
            <Input value={form.state} onChange={set("state")} />
          </Field>
          <Field label="Pincode" required>
            <Input value={form.pincode} onChange={set("pincode")} />
          </Field>
          <Field label="Status">
            <Select value={form.status || "active"} onValueChange={setSelect("status")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="promoted">Promoted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </TabsContent>

      {/* ACADEMIC TAB */}
      <TabsContent value="academic" className="space-y-4 mt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Medium of Instruction">
            <Select value={form.medium_of_instruction} onValueChange={setSelect("medium_of_instruction")}>
              <SelectTrigger><SelectValue placeholder="Medium" /></SelectTrigger>
              <SelectContent>{MEDIUMS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Second Language">
            <Input value={form.second_language} onChange={set("second_language")} placeholder="e.g. Hindi" />
          </Field>
          <Field label="Previous School">
            <Input value={form.previous_school} onChange={set("previous_school")} />
          </Field>
          <Field label="Previous Class Passed">
            <Input value={form.previous_class_passed} onChange={set("previous_class_passed")} />
          </Field>
          <Field label="TC Number">
            <Input value={form.tc_number} onChange={set("tc_number")} />
          </Field>
          <Field label="Joining Date">
            <Input type="date" value={form.joining_date} onChange={set("joining_date")} />
          </Field>
          <Field label="Section">
            <Select value={form.section_id} onValueChange={setSelect("section_id")}>
              <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
              <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Academic Year">
            <Select value={form.academic_year_id} onValueChange={setSelect("academic_year_id")}>
              <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
              <SelectContent>{academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Elective Subjects">
              <Input value={form.elective_subjects} onChange={set("elective_subjects")} placeholder="Comma-separated subjects" />
            </Field>
          </div>
        </div>
      </TabsContent>

      {/* GUARDIAN TAB */}
      <TabsContent value="guardian" className="space-y-4 mt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Scholarship Category">
            <Input value={form.scholarship_category} onChange={set("scholarship_category")} />
          </Field>
          <Field label="Caste Category">
            <Select value={form.caste_category} onValueChange={setSelect("caste_category")}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{CASTE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Father Occupation">
            <Input value={form.father_occupation} onChange={set("father_occupation")} />
          </Field>
          <Field label="Mother Occupation">
            <Input value={form.mother_occupation} onChange={set("mother_occupation")} />
          </Field>
          <Field label="Guardian Name">
            <Input value={form.guardian_name} onChange={set("guardian_name")} />
          </Field>
          <Field label="Guardian Relation">
            <Input value={form.guardian_relation} onChange={set("guardian_relation")} placeholder="e.g. Uncle" />
          </Field>
          <Field label="Guardian Phone">
            <Input value={form.guardian_phone} onChange={set("guardian_phone")} />
          </Field>
          <Field label="Father Phone">
            <Input value={form.father_phone} onChange={set("father_phone")} />
          </Field>
          <Field label="Alternate Contact">
            <Input value={form.alternate_contact} onChange={set("alternate_contact")} />
          </Field>
          <Field label="Family Annual Income">
            <Input value={form.family_annual_income} onChange={set("family_annual_income")} placeholder="e.g. 500000" />
          </Field>
          <Field label="Parent Email">
            <Input type="email" value={form.parent_email} onChange={set("parent_email")} />
          </Field>
        </div>
      </TabsContent>

      {/* DOCUMENTS TAB */}
      <TabsContent value="documents" className="space-y-6 mt-0">
        {onDocumentChange ? (
          DOC_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{section.title}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.docs.map(doc => (
                  <div key={doc} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{doc}</span>
                    <div className="flex items-center gap-2">
                      {documentUploads[doc] && (
                        <span className="text-xs text-success font-medium">Selected</span>
                      )}
                      <Button
                        type="button" variant="outline" size="sm"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*,.pdf";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0] || null;
                            onDocumentChange(doc, file);
                          };
                          input.click();
                        }}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {documentUploads[doc] ? "Change" : "Upload"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Documents can be uploaded after creating the student record.</p>
        )}
      </TabsContent>

      {/* OTHER TAB */}
      <TabsContent value="other" className="space-y-4 mt-0">
        <p className="text-sm text-muted-foreground mb-2">Additional information and notes.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Father Phone">
            <Input value={form.father_phone} onChange={set("father_phone")} />
          </Field>
          <Field label="Mother Name">
            <Input value={form.mother_name} onChange={set("mother_name")} />
          </Field>
        </div>
      </TabsContent>
    </Tabs>
  );
}
