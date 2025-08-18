import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateEndDate, getCurrentDate, formatDate } from "@/lib/date-utils";
import type { InsertCustomer } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customerNumber: z.string().min(1, "Customer number is required"),
  areaName: z.string().min(1, "Area name is required"),
  phoneNumber: z.string().min(10, "Phone number must be 10 digits").max(10, "Phone number must be 10 digits"),
  amountGiven: z.string().min(1, "Amount is required"),
  interestAmount: z.string().min(1, "Interest amount is required"),
  documentCharge: z.string().min(1, "Document charge is required"),
  startDate: z.string().min(1, "Start date is required"),
  collectionLine: z.string().min(1, "Collection line is required"),
});

type FormData = z.infer<typeof formSchema>;

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [defaultCustomerNumber] = useState(() => `C${Date.now().toString().slice(-6)}`);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      customerNumber: defaultCustomerNumber,
      areaName: "",
      phoneNumber: "",
      amountGiven: "",
      interestAmount: "",
      documentCharge: "",
      startDate: getCurrentDate(),
      collectionLine: "",
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
    },
  });

  const watchedAmountGiven = form.watch("amountGiven");
  const watchedInterestAmount = form.watch("interestAmount");
  const watchedDocumentCharge = form.watch("documentCharge");
  const watchedStartDate = form.watch("startDate");

  const totalAmount = (Number(watchedAmountGiven) || 0) + (Number(watchedInterestAmount) || 0);
  const endDate = watchedStartDate ? calculateEndDate(watchedStartDate) : "";
  const formattedEndDate = endDate ? formatDate(endDate) : "";

  const onSubmit = (data: FormData) => {
    const customerData = {
      name: data.name,
      customerNumber: data.customerNumber,
      areaName: data.areaName,
      phoneNumber: data.phoneNumber,
      amountGiven: data.amountGiven,
      interestAmount: data.interestAmount,
      documentCharge: data.documentCharge,
      numberOfWeeks: 10,
      startDate: data.startDate,
      collectionLine: data.collectionLine,
      status: "active" as const,
    };
    
    createCustomerMutation.mutate(customerData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., C001, C002" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gandhi Nagar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountGiven"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Given *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Principal amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Amount *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Interest amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Charge *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Document processing charge" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Total Amount</Label>
                <Input value={totalAmount || ""} disabled className="bg-gray-50" />
              </div>

              <div>
                <Label>Number of Weeks</Label>
                <Input value="10" disabled className="bg-gray-50" />
              </div>

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>End Date</Label>
                <Input value={formattedEndDate} disabled className="bg-gray-50" />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="collectionLine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Line *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select collection line" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monday-morning">Monday Morning</SelectItem>
                          <SelectItem value="monday-evening">Monday Evening</SelectItem>
                          <SelectItem value="tuesday-morning">Tuesday Morning</SelectItem>
                          <SelectItem value="wednesday-morning">Wednesday Morning</SelectItem>
                          <SelectItem value="wednesday-evening">Wednesday Evening</SelectItem>
                          <SelectItem value="thursday-morning">Thursday Morning</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
