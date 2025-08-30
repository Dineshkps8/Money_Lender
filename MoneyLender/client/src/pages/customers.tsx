import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, DollarSign, Receipt } from "lucide-react";
import AddCustomerModal from "@/components/modals/add-customer-modal";
import { formatCurrency, formatDate, getCollectionLineDisplay, getCurrentDate } from "@/lib/date-utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, DailyCollection, InsertDailyCollection } from "@shared/schema";

export default function Customers() {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCollectionLine, setSelectedCollectionLine] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: collections = [] } = useQuery<DailyCollection[]>({
    queryKey: ["/api/collections", selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/collections?date=${selectedDate}&line=all`);
      return response.json();
    },
  });

  // Get unique area names for filter
  const uniqueAreas = useMemo(() => {
    const areas = customers.map(customer => customer.areaName);
    return Array.from(new Set(areas)).sort();
  }, [customers]);

  // Get unique collection lines for filter
  const uniqueCollectionLines = useMemo(() => {
    const lines = customers.map(customer => customer.collectionLine);
    return Array.from(new Set(lines)).sort();
  }, [customers]);

  // Filter customers based on selected area, collection line, and search term
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by area
    if (selectedArea !== "all") {
      filtered = filtered.filter(customer => customer.areaName === selectedArea);
    }

    // Filter by collection line
    if (selectedCollectionLine !== "all") {
      filtered = filtered.filter(customer => customer.collectionLine === selectedCollectionLine);
    }

    // Filter by search term (name, customer number, phone)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.customerNumber.toLowerCase().includes(term) ||
        customer.phoneNumber.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [customers, selectedArea, selectedCollectionLine, searchTerm]);

  const createCollectionMutation = useMutation({
    mutationFn: async (data: InsertDailyCollection) => {
      const response = await apiRequest("POST", "/api/collections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DailyCollection> }) => {
      const response = await apiRequest("PUT", `/api/collections/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const handleSavePayment = (customer: Customer, amountPaid: string, paymentMode: string) => {
    const existingCollection = collections.find(c => 
      c.customerId === customer.id && c.collectionDate === selectedDate
    );

    const weeklyAmount = parseFloat(customer.totalAmount) / 10;
    const paidAmount = parseFloat(amountPaid) || 0;

    // Auto-determine payment status based on amount
    let paymentStatus = "pending";
    if (paidAmount >= weeklyAmount) {
      paymentStatus = "paid";
    } else if (paidAmount > 0) {
      paymentStatus = "partial";
    }

    if (existingCollection) {
      // Update existing collection
      updateCollectionMutation.mutate({
        id: existingCollection.id,
        data: { 
          amountPaid: paidAmount.toString(), 
          paymentMode, 
          paymentStatus 
        }
      });
    } else {
      // Create new collection record
      createCollectionMutation.mutate({
        customerId: customer.id,
        collectionDate: selectedDate,
        collectionLine: customer.collectionLine,
        dueAmount: weeklyAmount.toString(),
        amountPaid: paidAmount.toString(),
        paymentMode,
        paymentStatus
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customer Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredCustomers.length} of {customers.length} customers
            {selectedArea !== "all" && ` in ${selectedArea}`}
            {selectedCollectionLine !== "all" && ` on ${getCollectionLineDisplay(selectedCollectionLine)}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by name, ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {uniqueAreas.map(area => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Collection Line Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedCollectionLine} onValueChange={setSelectedCollectionLine}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by collection line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collection Lines</SelectItem>
                {uniqueCollectionLines.map(line => (
                  <SelectItem key={line} value={line}>{getCollectionLineDisplay(line)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setShowAddCustomerModal(true)}>
            Add New Customer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Customer List</TabsTrigger>
          <TabsTrigger value="collections">Record Collections</TabsTrigger>
          <TabsTrigger value="expenses">Daily Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {customers.length === 0 ? "No customers found" : `No customers in ${selectedArea}`}
                  </h3>
                  <p className="text-gray-500">
                    {customers.length === 0 ? "Get started by adding your first customer." : "Try selecting a different area or add customers to this area."}
                  </p>
                  <Button onClick={() => setShowAddCustomerModal(true)}>
                    Add Customer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Active Customers ({filteredCustomers.length})
                  {selectedArea !== "all" && ` - ${selectedArea}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loan Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Collection Line
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">
                                ID: {customer.customerNumber} | Ph: {customer.phoneNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                Area: {customer.areaName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div>Amount: <span className="font-medium">{formatCurrency(customer.amountGiven)}</span></div>
                              <div>Interest: <span>{formatCurrency(customer.interestAmount)}</span></div>
                              <div>Doc Charge: <span>{formatCurrency(customer.documentCharge || 0)}</span></div>
                              <div className="font-medium">Total: <span>{formatCurrency(customer.totalAmount)}</span></div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">
                              {getCollectionLineDisplay(customer.collectionLine)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={customer.status === "active" ? "default" : 
                                      customer.status === "completed" ? "secondary" : "destructive"}
                            >
                              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div>Start: {formatDate(customer.startDate)}</div>
                              <div>End: {formatDate(customer.endDate)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.location.href = `/customer/${customer.id}`}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Record Daily Collections
                </CardTitle>
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No customers found for collection recording.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer & Area</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => {
                        const existingCollection = collections.find(c => 
                          c.customerId === customer.id && c.collectionDate === selectedDate
                        );
                        const weeklyAmount = parseFloat(customer.totalAmount) / 10;

                        return (
                          <CollectionRow
                            key={customer.id}
                            customer={customer}
                            collection={existingCollection}
                            weeklyAmount={weeklyAmount}
                            onSavePayment={handleSavePayment}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab selectedDate={selectedDate} />
        </TabsContent>
      </Tabs>

      <AddCustomerModal 
        open={showAddCustomerModal} 
        onOpenChange={setShowAddCustomerModal} 
      />
    </div>
  );
}

function ExpensesTab({ selectedDate }: { selectedDate: string }) {
  const [selectedLine, setSelectedLine] = useState("monday-morning");
  const [expenses, setExpenses] = useState([{ category: "", amount: "", description: "" }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedExpenses = [] } = useQuery({
    queryKey: ["/api/expenses", selectedDate, selectedLine],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?date=${selectedDate}&collectionLine=${selectedLine}`);
      return response.json();
    },
  });

  const saveExpensesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expenses saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save expenses",
        variant: "destructive",
      });
    },
  });

  const addExpenseRow = () => {
    setExpenses([...expenses, { category: "", amount: "", description: "" }]);
  };

  const removeExpenseRow = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: string, value: string) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleSaveExpenses = () => {
    const validExpenses = expenses.filter(exp => exp.category && exp.amount);
    if (validExpenses.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid expense",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = validExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    saveExpensesMutation.mutate({
      date: selectedDate,
      collectionLine: selectedLine,
      expenses: validExpenses,
      totalAmount
    });
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Expenses - {selectedDate}</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.map((expense, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <Input
                  placeholder="Category"
                  value={expense.category}
                  onChange={(e) => updateExpense(index, "category", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={expense.amount}
                  onChange={(e) => updateExpense(index, "amount", e.target.value)}
                />
              </div>
              <div className="col-span-4">
                <Input
                  placeholder="Description (optional)"
                  value={expense.description}
                  onChange={(e) => updateExpense(index, "description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                {expenses.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeExpenseRow(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={addExpenseRow}>
                Add Row
              </Button>
              <Button onClick={handleSaveExpenses}>
                Save Expenses
              </Button>
            </div>
            <div className="text-lg font-semibold">
              Total: {formatCurrency(totalAmount)}
            </div>
          </div>

          {savedExpenses.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Saved Expenses</h4>
              <div className="space-y-2">
                {savedExpenses.map((expense: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{expense.category}</span>
                      {expense.description && <span className="text-gray-600"> - {expense.description}</span>}
                    </div>
                    <span className="font-medium">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CollectionRowProps {
  customer: Customer;
  collection?: DailyCollection;
  weeklyAmount: number;
  onSavePayment: (customer: Customer, amountPaid: string, paymentMode: string) => void;
}

function CollectionRow({ customer, collection, weeklyAmount, onSavePayment }: CollectionRowProps) {
  const [amountPaid, setAmountPaid] = useState(collection?.amountPaid || "");
  const [paymentMode, setPaymentMode] = useState(collection?.paymentMode || "cash");

  // Auto-determine status based on amount paid
  const getPaymentStatus = () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paid >= weeklyAmount) return "paid";
    if (paid > 0) return "partial";
    return "pending";
  };

  const handleSave = () => {
    onSavePayment(customer, amountPaid, paymentMode);
  };

  const status = getPaymentStatus();

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
        <Select value={paymentMode} onValueChange={setPaymentMode}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="gpay">GPay</SelectItem>
            <SelectItem value="bank_transfer">Bank</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-4">
        <Badge 
          variant={status === "paid" ? "default" : status === "partial" ? "secondary" : "destructive"}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Button variant="ghost" size="sm" onClick={handleSave}>
          Save
        </Button>
      </td>
    </tr>
  );
}