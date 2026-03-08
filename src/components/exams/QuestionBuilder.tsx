import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, GripVertical, ImagePlus } from "lucide-react";

interface Props {
  exam: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuestionOption {
  id?: string;
  option_text: string;
  option_image: string;
  is_correct: boolean;
}

interface Question {
  id?: string;
  question_text: string;
  image_url: string;
  marks: number;
  order_number: number;
  options: QuestionOption[];
}

const emptyOption = (): QuestionOption => ({ option_text: "", option_image: "", is_correct: false });
const emptyQuestion = (order: number): Question => ({
  question_text: "", image_url: "", marks: 1, order_number: order,
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

export default function QuestionBuilder({ exam, open, onOpenChange }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && exam) loadQuestions();
  }, [open, exam]);

  const loadQuestions = async () => {
    setLoading(true);
    const { data: qData } = await supabase
      .from("exam_questions" as any)
      .select("*, exam_options(*)")
      .eq("exam_id", exam.id)
      .order("order_number");
    
    if (qData && (qData as any[]).length > 0) {
      setQuestions((qData as any[]).map((q: any) => ({
        id: q.id, question_text: q.question_text, image_url: q.image_url || "",
        marks: q.marks, order_number: q.order_number,
        options: (q.exam_options || []).map((o: any) => ({
          id: o.id, option_text: o.option_text, option_image: o.option_image || "", is_correct: o.is_correct,
        })),
      })));
    } else {
      setQuestions([emptyQuestion(1)]);
    }
    setLoading(false);
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_number: i + 1 })));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, qi) => qi === qIdx ? {
      ...q, options: q.options.map((o, oi) => {
        if (oi === oIdx) {
          if (field === "is_correct" && value === true) {
            // Only one correct answer for MCQ
            return { ...o, is_correct: true };
          }
          return { ...o, [field]: value };
        }
        if (field === "is_correct" && value === true) {
          return { ...o, is_correct: false };
        }
        return o;
      }),
    } : q));
  };

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, emptyOption()] } : q));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== oIdx) } : q));
  };

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) { toast.error(`Question ${i + 1} text is required`); return; }
      if (q.options.length < 2) { toast.error(`Question ${i + 1} needs at least 2 options`); return; }
      const hasCorrect = q.options.some(o => o.is_correct);
      if (!hasCorrect) { toast.error(`Question ${i + 1} needs a correct answer`); return; }
      const emptyOpts = q.options.filter(o => !o.option_text.trim());
      if (emptyOpts.length > 0) { toast.error(`Question ${i + 1} has empty options`); return; }
    }

    setSaving(true);
    try {
      // Delete existing questions (cascade deletes options)
      await supabase.from("exam_questions" as any).delete().eq("exam_id", exam.id);

      // Insert new questions
      for (const q of questions) {
        const { data: qData, error: qErr } = await supabase.from("exam_questions" as any).insert({
          exam_id: exam.id, question_text: q.question_text, question_type: "mcq",
          image_url: q.image_url || null, marks: q.marks, order_number: q.order_number,
        } as any).select("id").single();
        if (qErr) throw qErr;

        const questionId = (qData as any).id;
        const optionsToInsert = q.options.map(o => ({
          question_id: questionId, option_text: o.option_text,
          option_image: o.option_image || null, is_correct: o.is_correct,
        }));
        const { error: oErr } = await supabase.from("exam_options" as any).insert(optionsToInsert as any);
        if (oErr) throw oErr;
      }

      // Update exam total marks
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      await supabase.from("exams").update({ total_marks: totalMarks } as any).eq("id", exam.id);

      toast.success(`${questions.length} questions saved`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save questions");
    }
    setSaving(false);
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Question Builder — {exam?.name}</span>
            <Badge variant="secondary">{questions.length} Questions · {totalMarks} Marks</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      Q{qIdx + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Marks:</Label>
                        <Input type="number" className="w-16 h-7 text-xs" value={q.marks}
                          onChange={e => updateQuestion(qIdx, "marks", parseFloat(e.target.value) || 0)} />
                      </div>
                      {questions.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeQuestion(qIdx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea placeholder="Enter question text..." value={q.question_text}
                    onChange={e => updateQuestion(qIdx, "question_text", e.target.value)} rows={2} />
                  
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <ImagePlus className="h-3 w-3" /> Question Image URL (optional)
                    </Label>
                    <Input placeholder="https://..." value={q.image_url} className="h-8 text-xs"
                      onChange={e => updateQuestion(qIdx, "image_url", e.target.value)} />
                  </div>

                  {q.image_url && (
                    <img src={q.image_url} alt="Question" className="max-h-32 rounded border object-contain" />
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Options (select correct answer)</Label>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <Checkbox checked={opt.is_correct}
                          onCheckedChange={checked => updateOption(qIdx, oIdx, "is_correct", checked)} />
                        <span className="text-xs font-mono text-muted-foreground w-5">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <Input placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt.option_text} className="h-8 text-sm flex-1"
                          onChange={e => updateOption(qIdx, oIdx, "option_text", e.target.value)} />
                        <Input placeholder="Image URL" value={opt.option_image} className="h-8 text-xs w-40"
                          onChange={e => updateOption(qIdx, oIdx, "option_image", e.target.value)} />
                        {q.options.length > 2 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOption(qIdx, oIdx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 6 && (
                      <Button variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addQuestion} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save All Questions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
