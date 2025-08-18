import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate, getCollectionLineDisplay } from "@/lib/date-utils";
import type { DailyEntry, Customer } from "@shared/schema";

export default function Reports() {
  const [dateRange, setDateRange] = useState("this-week");
  const [selectedLine, setSelectedLine] = useState("all-lines");
  const [selectedStatus, setSelectedStatus] = useState("all-statuses");

  const { data: entries = [] } = useQuery<DailyEntry[]>({
    queryKey: ["/api/entries"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Calculate statistics
  const activeLoans = customers.filter(c => c.status === "active").length;
  const completedLoans = customers.filter(c => c.status === "completed").length;
  const totalOutstanding = customers
    .filter(c => c.status === "active")
    .reduce((sum, customer) => sum + parseFloat(customer.totalAmount), 0);

  const weeklyCollected = entries.reduce((sum, entry) => sum + parseFloat(entry.totalCollected), 0);
  const weeklyTarget = entries.reduce((sum, entry) => sum + parseFloat(entry.targetAmount), 0);
  const weeklyRate = weeklyTarget > 0 ? Math.round((weeklyCollected / weeklyTarget) * 100) : 0;

  const newLoansThisWeek = entries.reduce((sum, entry) => sum + entry.newLoansGiven, 0);

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="custom-range">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                <Button className="w-full">
                  Generate Report
                </Button>
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
                  <p className="text-sm font-medium text-gray-600">Weekly Collection Rate</p>
                  <p className="text-2xl font-bold text-green-600">{weeklyRate}%</p>
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
                  <p className="text-sm font-medium text-gray-600">New Loans This Week</p>
                  <p className="text-2xl font-bold text-blue-600">{newLoansThisWeek}</p>
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
                  <p className="text-sm font-medium text-gray-600">Completed Loans</p>
                  <p className="text-2xl font-bold text-green-600">{completedLoans}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Collection Report</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No collection data available for the selected period.</p>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry) => {
                      const collectionRate = parseFloat(entry.targetAmount) > 0 
                        ? Math.round((parseFloat(entry.totalCollected) / parseFloat(entry.targetAmount)) * 100) 
                        : 0;
                      const netAmount = parseFloat(entry.totalCollected) - parseFloat(entry.expenses);

                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatDate(entry.entryDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getCollectionLineDisplay(entry.collectionLine)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatCurrency(entry.targetAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-green-600">
                            {formatCurrency(entry.totalCollected)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge 
                              variant={collectionRate >= 80 ? "default" : collectionRate >= 60 ? "secondary" : "destructive"}
                            >
                              {collectionRate}%
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            {formatCurrency(entry.expenses)}
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
