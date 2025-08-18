import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, getCurrentDate, getCollectionLineDisplay } from "@/lib/date-utils";
import type { Customer, DailyCollection, InsertDailyEntry, InsertDailyCollection } from "@shared/schema";

export default function Collections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedLine, setSelectedLine] = useState("monday-morning");
  const [selectedArea, setSelectedArea] = useState("all-areas");
  const [expenses, setExpenses] = useState("");
  const [docCharges, setDocCharges] = useState("");
  const [newLoansGiven, setNewLoansGiven] = useState("");

  const { data: allCustomers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", "line", selectedLine],
    queryFn: async () => {
      const response = await fetch(`/api/customers/line/${selectedLine}`);
      return response.json();
    },
  });

  // Get unique areas for filtering
  const uniqueAreas = useMemo(() => {
    const areaSet = new Set(allCustomers.map(customer => customer.areaName));
    const areas = Array.from(areaSet);
    return areas.filter(Boolean).sort();
  }, [allCustomers]);

  // Filter customers by selected area
  const customers = useMemo(() => {
    if (!selectedArea || selectedArea === "all-areas") return allCustomers;
    return allCustomers.filter(customer => customer.areaName === selectedArea);
  }, [allCustomers, selectedArea]);

  const { data: collections = [] } = useQuery<DailyCollection[]>({
    queryKey: ["/api/collections", selectedDate, selectedLine],
    queryFn: async () => {
      const response = await fetch(`/api/collections?date=${selectedDate}&line=${selectedLine}`);
      return response.json();
    },
  });

  const saveDailyEntryMutation = useMutation({
    mutationFn: async (data: InsertDailyEntry) => {
      const response = await apiRequest("POST", "/api/entries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily entry saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/entries"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save daily entry",
        variant: "destructive",
      });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: InsertDailyCollection) => {
      const response = await apiRequest("POST", "/api/collections", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections", selectedDate, selectedLine] });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DailyCollection> }) => {
      const response = await apiRequest("PUT", `/api/collections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections", selectedDate, selectedLine] });
    },
  });

  const handleSavePayment = (customer: Customer, amountPaid: string, paymentStatus: string) => {
    const collection = collections.find(c => c.customerId === customer.id);
    
    if (collection) {
      // Update existing collection
      updateCollectionMutation.mutate({
        id: collection.id,
        data: { amountPaid, paymentStatus }
      });
    } else {
      // Create new collection record
      const weeklyAmount = parseFloat(customer.totalAmount) / 10;
      createCollectionMutation.mutate({
        customerId: customer.id,
        collectionDate: selectedDate,
        collectionLine: selectedLine,
        dueAmount: weeklyAmount,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentStatus
      });
    }
  };

  const totalCollected = collections.reduce((sum, collection) => 
    sum + parseFloat(collection.amountPaid || "0"), 0
  );

  const targetAmount = customers.length * 500; // Rough estimate

  const handleSaveDailyEntry = () => {
    const entryData: InsertDailyEntry = {
      entryDate: selectedDate,
      collectionLine: selectedLine,
      targetAmount: targetAmount,
      totalCollected,
      expenses: parseFloat(expenses) || 0,
      newLoansGiven: parseInt(newLoansGiven) || 0,
      newLoansAmount: 0,
      documentCharges: parseFloat(docCharges) || 0,
      completedLoans: 0,
    };

    saveDailyEntryMutation.mutate(entryData);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Daily Collections</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedLine} onValueChange={setSelectedLine}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday-morning">Monday Morning</SelectItem>
              <SelectItem value="monday-evening">Monday Evening</SelectItem>
              <SelectItem value="tuesday-morning">Tuesday Morning</SelectItem>
              <SelectItem value="wednesday-morning">Wednesday Morning</SelectItem>
              <SelectItem value="wednesday-evening">Wednesday Evening</SelectItem>
              <SelectItem value="thursday-morning">Thursday Morning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-areas">All Areas</SelectItem>
              {uniqueAreas.map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Collection Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Target Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(targetAmount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(parseFloat(expenses) || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">New Loans</p>
              <p className="text-xl font-bold text-blue-600">{newLoansGiven || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Doc Charges</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(parseFloat(docCharges) || 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Collection Entry */}
        <Card>
          <CardHeader>
            <CardTitle>
              Record Collections - {getCollectionLineDisplay(selectedLine)}
              {selectedArea && selectedArea !== "all-areas" && ` - ${selectedArea} Area`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No customers found for the selected collection line.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer & Area</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customers.map((customer) => {
                        const collection = collections.find(c => c.customerId === customer.id);
                        const weeklyAmount = parseFloat(customer.totalAmount) / 10; // 10 weeks
                        
                        return (
                          <CollectionRow
                            key={customer.id}
                            customer={customer}
                            collection={collection}
                            weeklyAmount={weeklyAmount}
                            onSavePayment={handleSavePayment}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex space-x-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Day's Expenses</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">Document Charges</Label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={docCharges}
                        onChange={(e) => setDocCharges(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">New Loans Given</Label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={newLoansGiven}
                        onChange={(e) => setNewLoansGiven(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveDailyEntry}
                    disabled={saveDailyEntryMutation.isPending}
                  >
                    {saveDailyEntryMutation.isPending ? "Saving..." : "Save Daily Entry"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface CollectionRowProps {
  customer: Customer;
  collection?: DailyCollection;
  weeklyAmount: number;
  onSavePayment: (customer: Customer, amountPaid: string, paymentStatus: string) => void;
}

function CollectionRow({ customer, collection, weeklyAmount, onSavePayment }: CollectionRowProps) {
  const [amountPaid, setAmountPaid] = useState(collection?.amountPaid || "");
  const [paymentStatus, setPaymentStatus] = useState(collection?.paymentStatus || "pending");

  const handleSave = () => {
    onSavePayment(customer, amountPaid, paymentStatus);
  };

  return (
    <tr>
      <td className="px-4 py-4">
        <div>
          <div className="font-medium text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-500">{customer.customerNumber}</div>
          <div className="text-xs text-gray-400">{customer.areaName}</div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="font-medium">{formatCurrency(weeklyAmount)}</span>
      </td>
      <td className="px-4 py-4">
        <Input 
          type="number" 
          className="w-24" 
          placeholder="0"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
        />
      </td>
      <td className="px-4 py-4">
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleSave}>
          Save
        </Button>
      </td>
    </tr>
  );
}
