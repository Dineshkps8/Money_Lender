import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import AddCustomerModal from "@/components/modals/add-customer-modal";
import { formatCurrency, formatDate, getCollectionLineDisplay } from "@/lib/date-utils";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("all");

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Get unique area names for filter
  const uniqueAreas = useMemo(() => {
    const areas = customers.map(customer => customer.areaName);
    return Array.from(new Set(areas)).sort();
  }, [customers]);

  // Filter customers based on selected area
  const filteredCustomers = useMemo(() => {
    if (selectedArea === "all") return customers;
    return customers.filter(customer => customer.areaName === selectedArea);
  }, [customers, selectedArea]);

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
          </p>
        </div>
        <div className="flex items-center gap-4">
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
          <Button onClick={() => setShowAddCustomerModal(true)}>
            Add New Customer
          </Button>
        </div>
      </div>

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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <AddCustomerModal 
        open={showAddCustomerModal} 
        onOpenChange={setShowAddCustomerModal} 
      />
    </div>
  );
}
