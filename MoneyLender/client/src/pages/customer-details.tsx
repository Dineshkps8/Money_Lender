import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
import { formatCurrency, formatDate, getCollectionLineDisplay } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, DailyCollection } from "@shared/schema";

export default function CustomerDetails() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id;
  const [editingCollection, setEditingCollection] = useState<DailyCollection | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`);
      return response.json();
    },
  });

  const { data: collections = [], isLoading: collectionsLoading } = useQuery<DailyCollection[]>({
    queryKey: ["/api/collections/customer", customerId],
    queryFn: async () => {
      const response = await fetch(`/api/collections/customer/${customerId}`);
      return response.json();
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DailyCollection> }) => {
      const response = await apiRequest("PUT", `/api/collections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/customer", customerId] });
      setEditingCollection(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update payment", variant: "destructive" });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/collections/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/customer", customerId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete payment", variant: "destructive" });
    },
  });

  const handleEditCollection = (collection: DailyCollection) => {
    setEditingCollection(collection);
    setEditAmount(collection.amountPaid || "");
    setEditPaymentMode(collection.paymentMode || "cash");
    setEditPaymentStatus(collection.paymentStatus || "pending");
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
      deleteCollectionMutation.mutate(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCollection) return;

    updateCollectionMutation.mutate({
      id: editingCollection.id,
      data: {
        amountPaid: editAmount,
        paymentMode: editPaymentMode,
        paymentStatus: editPaymentStatus
      }
    });
  };

  if (customerLoading || collectionsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Customer not found</h2>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const weeklyAmount = customer ? parseFloat(customer.totalAmount) / 10 : 0;
  const totalPaid = collections.reduce((sum, collection) => 
    sum + parseFloat(collection.amountPaid || "0"), 0
  );
  const remainingAmount = customer ? parseFloat(customer.totalAmount) - totalPaid : 0;
  const isLoanCompleted = remainingAmount <= 0;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="mr-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500">Customer ID: {customer.customerNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium">{customer.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Area</p>
                <p className="font-medium">{customer.areaName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Collection Line</p>
                <Badge variant="outline">
                  {getCollectionLineDisplay(customer.collectionLine)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge 
                  variant={customer.status === "active" ? "default" : 
                          customer.status === "completed" ? "secondary" : "destructive"}
                >
                  {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount Given:</span>
                <span className="font-medium">{formatCurrency(customer.amountGiven)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interest:</span>
                <span className="font-medium">{formatCurrency(customer.interestAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Document Charge:</span>
                <span className="font-medium">{formatCurrency(customer.documentCharge || 0)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="font-bold">{formatCurrency(customer.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Weekly Amount:</span>
                <span className="font-medium">{formatCurrency(weeklyAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Paid:</span>
                <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(remainingAmount)}
                </span>
                {isLoanCompleted && (
                  <Badge variant="secondary" className="ml-2">LOAN CLOSED</Badge>
                )}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Progress:</span>
                  <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedWeeks} of 10 weeks completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment History ({collections.length} records)</CardTitle>
            </CardHeader>
            <CardContent>
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No payment records found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Line</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {collections.map((collection) => (
                        <tr key={collection.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm">
                            {formatDate(collection.collectionDate)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getCollectionLineDisplay(collection.collectionLine)}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">
                            {formatCurrency(collection.dueAmount)}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-green-600">
                            {formatCurrency(collection.amountPaid || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <Badge variant="outline">
                              {collection.paymentMode === "cash" ? "Cash" :
                               collection.paymentMode === "gpay" ? "GPay" :
                               collection.paymentMode === "bank_transfer" ? "Bank" : 
                               collection.paymentMode}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="icon" onClick={() => handleEditCollection(collection)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleDeleteCollection(collection.id)}>
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <Badge 
                              variant={collection.paymentStatus === "paid" ? "default" : 
                                      collection.paymentStatus === "partial" ? "secondary" : "destructive"}
                            >
                              {collection.paymentStatus.charAt(0).toUpperCase() + collection.paymentStatus.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Collection Dialog */}
      <Dialog open={!!editingCollection} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="editAmount">Amount Paid</label>
              <Input
                id="editAmount"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="editPaymentMode">Payment Mode</label>
              <Select onValueChange={setEditPaymentMode} value={editPaymentMode}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gpay">GPay</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="editPaymentStatus">Payment Status</label>
              <Select onValueChange={setEditPaymentStatus} value={editPaymentStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveEdit} disabled={updateCollectionMutation.isPending}>
              {updateCollectionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}