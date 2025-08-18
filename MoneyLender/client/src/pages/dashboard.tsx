import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Plus,
  ClipboardList,
  BarChart3,
  PiggyBank,
  Banknote
} from "lucide-react";
import AddCustomerModal from "@/components/modals/add-customer-modal";
import { formatCurrency, getCurrentDate, getDayName, getCurrentCollectionLine, getCollectionLineDisplay } from "@/lib/date-utils";

export default function Dashboard() {
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const currentDate = getCurrentDate();
  const currentDay = getDayName(currentDate);
  const currentLine = getCurrentCollectionLine();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const dashboardStats = stats as {
    activeLoans: number;
    todayTarget: number;
    amountCollected: number;
    collectionRate: number;
    newLoansProfit: number;
    todayCollectionProfit: number;
    totalProfit: number;
    todayExpenses: number;
  } || {
    activeLoans: 0,
    todayTarget: 0,
    amountCollected: 0,
    collectionRate: 0,
    newLoansProfit: 0,
    todayCollectionProfit: 0,
    totalProfit: 0,
    todayExpenses: 0
  };

  const quickActions = [
    {
      title: "Add New Customer",
      description: "Register a new loan customer",
      icon: Plus,
      onClick: () => setShowAddCustomerModal(true),
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Daily Entry", 
      description: "Record today's collections",
      icon: ClipboardList,
      onClick: () => window.location.href = "/collections",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "View Reports",
      description: "Collection performance analysis", 
      icon: BarChart3,
      onClick: () => window.location.href = "/reports",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

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
          Today: {currentDay} - {getCollectionLineDisplay(currentLine)} Line
        </p>
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Collection Target</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardStats.todayTarget)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardStats.collectionRate}%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Profit (All Time)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardStats.totalProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">From loans + collections</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <PiggyBank className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit from New Loans</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(dashboardStats.newLoansProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Interest + document charges</p>
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
                  <p className="text-sm font-medium text-gray-600">Today's Collection Profit</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dashboardStats.todayCollectionProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Collections - expenses</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Collection Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Collection Schedule</CardTitle>
            <p className="text-sm text-gray-500">
              {currentDay} - {getCollectionLineDisplay(currentLine)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{getCollectionLineDisplay(currentLine)}</h4>
                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Target Amount:</span>
                  <span className="text-sm font-medium">{formatCurrency(dashboardStats.todayTarget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Collected:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(dashboardStats.amountCollected)}
                  </span>
                </div>
                <Button className="w-full mt-4" onClick={() => window.location.href = "/collections"}>
                  Start Collection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6" onClick={action.onClick}>
                  <div className="flex items-center">
                    <div className={`p-3 ${action.bgColor} rounded-full mr-4`}>
                      <Icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <AddCustomerModal 
        open={showAddCustomerModal} 
        onOpenChange={setShowAddCustomerModal} 
      />
    </div>
  );
}
