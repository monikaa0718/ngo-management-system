import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface StepField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface StepFormProps {
  steps: { title: string; fields: StepField[] }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel?: string;
}

const VerticalStepForm: React.FC<StepFormProps> = ({ steps, onSubmit, submitLabel = "Submit" }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isStepValid = (stepIndex: number) => {
    return steps[stepIndex].fields.every((f) => !f.required || formData[f.name]?.trim());
  };

  const goNext = () => {
    if (isStepValid(currentStep)) {
      setCompleted((prev) => [...new Set([...prev, currentStep])]);
      if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isStepValid(currentStep)) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({});
      setCurrentStep(0);
      setCompleted([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isDone = completed.includes(idx);

        return (
          <div key={idx} className="relative">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "absolute left-5 top-12 w-0.5 h-[calc(100%-24px)]",
                isDone ? "bg-primary" : "bg-border"
              )} />
            )}

            {/* Step Header */}
            <button
              onClick={() => (isDone || idx <= Math.max(...completed, 0) + 1) && setCurrentStep(idx)}
              className={cn(
                "flex items-center gap-3 w-full text-left p-3 rounded-lg transition-all",
                isActive ? "bg-accent" : "hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all",
                isDone ? "gradient-primary text-primary-foreground" :
                isActive ? "border-2 border-primary text-primary" :
                "border-2 border-border text-muted-foreground"
              )}>
                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={cn(
                "font-medium text-sm",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
              <div className="ml-auto">
                {isActive ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Step Content */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pl-16 pr-3 pb-3 space-y-3">
                    {step.fields.map((field) => (
                      <div key={field.name}>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          {field.label} {field.required && <span className="text-destructive">*</span>}
                        </label>
                        {field.type === "textarea" ? (
                          <Textarea
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className="text-sm"
                            rows={3}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={formData[field.name] || ""}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select...</option>
                            {field.options?.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ""}
                            onChange={(e) => updateField(field.name, e.target.value)}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      {currentStep > 0 && (
                        <Button variant="outline" size="sm" onClick={goPrev}>Previous</Button>
                      )}
                      {currentStep < steps.length - 1 ? (
                        <Button size="sm" onClick={goNext} disabled={!isStepValid(currentStep)} className="gradient-primary text-primary-foreground">
                          Next
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleSubmit} disabled={!isStepValid(currentStep) || submitting} className="gradient-primary text-primary-foreground">
                          {submitting ? "Submitting..." : submitLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default VerticalStepForm;
