
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  CheckCircle, 
  Users, 
  TrendingUp,
  PiggyBank,
  Banknote,
  Calendar
} from "lucide-react";
import { formatCurrency, getCurrentDate, getDayName, getCurrentCollectionLine, getCollectionLineDisplay } from "@/lib/date-utils";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [dateRange, setDateRange] = useState("today");
  
  const currentDate = getCurrentDate();
  const currentDay = getDayName(currentDate);
  const currentLine = getCurrentCollectionLine();

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    switch (dateRange) {
      case "today":
        return { start: selectedDate, end: selectedDate };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return { 
          start: weekStart.toISOString().split('T')[0], 
          end: weekEnd.toISOString().split('T')[0] 
        };
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { 
          start: monthStart.toISOString().split('T')[0], 
          end: monthEnd.toISOString().split('T')[0] 
        };
      default:
        return { start: selectedDate, end: selectedDate };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/consolidated-stats", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/consolidated-stats?startDate=${startDate}&endDate=${endDate}`);
      return response.json();
    },
  });

  const dashboardStats = stats as {
    activeLoans: number;
    amountCollected: number;
    collectionRate: number;
    interestEarnings: number;
    documentCharges: number;
    newLoansProfit: number;
    totalCollectionProfit: number;
    totalProfit: number;
    totalExpenses: number;
    lineAmounts?: { [key: string]: number };
    completedLoans: number;
    totalOutstanding: number;
  } || {
    activeLoans: 0,
    amountCollected: 0,
    collectionRate: 0,
    interestEarnings: 0,
    documentCharges: 0,
    newLoansProfit: 0,
    totalCollectionProfit: 0,
    totalProfit: 0,
    totalExpenses: 0,
    completedLoans: 0,
    totalOutstanding: 0
  };

  

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Consolidated view for {dateRange === "today" ? "selected date" : dateRange}
        </p>
      </div>

      {/* Date and Range Selection */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === "today" && (
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            )}
            <div className="text-sm text-gray-600">
              Showing data from {startDate} to {endDate}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount Collected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardStats.amountCollected)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Loans</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeLoans}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardStats.totalExpenses)}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(dashboardStats.totalOutstanding)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit From Collections</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dashboardStats.totalCollectionProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Collections - expenses</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Interest Earnings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(dashboardStats.interestEarnings || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">From loan interest</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Banknote className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Document Charges</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(dashboardStats.documentCharges || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Processing fees</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        

        {/* Line Amounts Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Amount Given by Collection Line</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Monday Morning</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['monday-morning'] || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Monday Evening</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['monday-evening'] || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Tuesday Morning</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['tuesday-morning'] || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Wednesday Morning</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['wednesday-morning'] || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Wednesday Evening</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['wednesday-evening'] || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Thursday Morning</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(dashboardStats.lineAmounts?.['thursday-morning'] || 0)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      </div>
  );
}
