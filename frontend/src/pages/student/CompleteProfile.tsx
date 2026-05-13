import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

import { userApi } from "@/api/services";
import type { CompleteProfilePayload, StudentDepartment } from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const departments: StudentDepartment[] = ["AI&DS", "COMP", "IT", "EXTC"];

const completeProfileSchema = z.object({
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  department: z.enum(["AI&DS", "COMP", "IT", "EXTC"]),
  semester: z.coerce.number().int().min(1).max(8),
  linkedInUrl: z.string().trim().optional().refine((value) => !value || /^https?:\/\/.+/i.test(value), "Enter a valid URL"),
  githubUrl: z.string().trim().optional().refine((value) => !value || /^https?:\/\/.+/i.test(value), "Enter a valid URL"),
});

type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      rollNumber: "",
      department: undefined,
      semester: 1,
      linkedInUrl: "",
      githubUrl: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CompleteProfileFormValues) => {
      const payload: CompleteProfilePayload = {
        rollNumber: values.rollNumber.trim(),
        department: values.department,
        semester: values.semester,
        linkedInUrl: values.linkedInUrl?.trim() ? values.linkedInUrl.trim() : null,
        githubUrl: values.githubUrl?.trim() ? values.githubUrl.trim() : null,
      };
      return userApi.updateProfile(payload, "/complete-profile");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile completed");
      navigate("/student/dashboard", { replace: true });
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to save profile");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-5">
              <FormField
                control={form.control}
                name="rollNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. TCET1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => (
                            <SelectItem key={semester} value={String(semester)}>
                              Semester {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="linkedInUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.linkedin.com/in/your-profile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/your-username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
