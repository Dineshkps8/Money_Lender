
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, CheckCircle, Calendar } from "lucide-react";
import { formatCurrency, formatDate, getCollectionLineDisplay, getCurrentDate } from "@/lib/date-utils";
import type { DailyEntry, Customer } from "@shared/schema";

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getCurrentDate());
  const [selectedLine, setSelectedLine] = useState("all-lines");

  const { data: entries = [], isLoading: entriesLoading } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/entries?startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Filter entries by selected line
  const filteredEntries = selectedLine === "all-lines" 
    ? entries 
    : entries.filter(entry => entry.collectionLine === selectedLine);

  // Calculate statistics
  const activeLoans = customers.filter(c => c.status === "active").length;
  const completedLoans = customers.filter(c => c.status === "completed").length;
  const totalOutstanding = customers
    .filter(c => c.status === "active")
    .reduce((sum, customer) => sum + parseFloat(customer.totalAmount), 0);

  const periodCollected = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.totalCollected || "0"), 0);
  const periodTarget = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.targetAmount || "0"), 0);
  const periodRate = periodTarget > 0 ? Math.round((periodCollected / periodTarget) * 100) : 0;
  const periodExpenses = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.expenses || "0"), 0);

  const newLoansInPeriod = filteredEntries.reduce((sum, entry) => sum + (entry.newLoansGiven || 0), 0);

  if (entriesLoading || customersLoading) {
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">Collection performance and insights</p>
      </div>

      <div className="space-y-6">
        {/* Report Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Line</label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-lines">All Lines</SelectItem>
                    <SelectItem value="monday-morning">Monday Morning</SelectItem>
                    <SelectItem value="monday-evening">Monday Evening</SelectItem>
                    <SelectItem value="tuesday-morning">Tuesday Morning</SelectItem>
                    <SelectItem value="wednesday-morning">Wednesday Morning</SelectItem>
                    <SelectItem value="wednesday-evening">Wednesday Evening</SelectItem>
                    <SelectItem value="thursday-morning">Thursday Morning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                <div className="text-sm text-gray-600 pt-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {filteredEntries.length} records found
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Period Collection Rate</p>
                  <p className="text-2xl font-bold text-green-600">{periodRate}%</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(periodCollected)} / {formatCurrency(periodTarget)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                  <p className="text-xs text-gray-500 mt-1">{activeLoans} active loans</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New Loans (Period)</p>
                  <p className="text-2xl font-bold text-blue-600">{newLoansInPeriod}</p>
                  <p className="text-xs text-gray-500 mt-1">In selected period</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Period Expenses</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(periodExpenses)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total expenses</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Detailed Collection Report 
              {selectedLine !== "all-lines" && ` - ${getCollectionLineDisplay(selectedLine)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No collection data available for the selected period and filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collected</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Loans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEntries.map((entry) => {
                      const collectionRate = parseFloat(entry.targetAmount || "0") > 0 
                        ? Math.round((parseFloat(entry.totalCollected || "0") / parseFloat(entry.targetAmount || "0")) * 100) 
                        : 0;
                      const netAmount = parseFloat(entry.totalCollected || "0") - parseFloat(entry.expenses || "0");

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatDate(entry.entryDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getCollectionLineDisplay(entry.collectionLine)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(entry.targetAmount || "0")}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">
                            {formatCurrency(entry.totalCollected || "0")}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge 
                              variant={collectionRate >= 80 ? "default" : collectionRate >= 60 ? "secondary" : "destructive"}
                            >
                              {collectionRate}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            {formatCurrency(entry.expenses || "0")}
                          </td>
                          <td className="px-6 py-4 text-sm text-blue-600">
                            {entry.newLoansGiven || 0}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(netAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
