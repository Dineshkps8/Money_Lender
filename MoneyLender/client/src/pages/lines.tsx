import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/date-utils";
import type { Customer } from "@shared/schema";

const collectionLines = [
  { 
    day: "Monday", 
    times: [
      { name: "Morning Line", time: "9:00 AM - 12:00 PM", key: "monday-morning" },
      { name: "Evening Line", time: "4:00 PM - 7:00 PM", key: "monday-evening" }
    ]
  },
  { 
    day: "Tuesday", 
    times: [
      { name: "Morning Line", time: "9:00 AM - 12:00 PM", key: "tuesday-morning" }
    ]
  },
  { 
    day: "Wednesday", 
    times: [
      { name: "Morning Line", time: "9:00 AM - 12:00 PM", key: "wednesday-morning" },
      { name: "Evening Line", time: "4:00 PM - 7:00 PM", key: "wednesday-evening" }
    ]
  },
  { 
    day: "Thursday", 
    times: [
      { name: "Morning Line", time: "9:00 AM - 12:00 PM", key: "thursday-morning" }
    ]
  }
];

export default function Lines() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const getLineStats = (lineKey: string) => {
    const lineCustomers = customers.filter(c => c.collectionLine === lineKey && c.status === "active");
    const totalTarget = lineCustomers.reduce((sum, customer) => {
      const weeklyAmount = parseFloat(customer.totalAmount) / 10; // 10 weeks
      return sum + weeklyAmount;
    }, 0);

    return {
      customers: lineCustomers.length,
      target: totalTarget
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Collection Lines Management</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of all collection schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {collectionLines.map((day) => (
          <Card key={day.day}>
            <CardHeader>
              <CardTitle>{day.day}</CardTitle>
              <p className="text-sm text-gray-500">
                {day.times.length === 1 ? "Morning Collection Only" : "Morning & Evening Collections"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {day.times.map((time) => {
                  const stats = getLineStats(time.key);
                  
                  return (
                    <div key={time.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{time.name}</h4>
                        <span className="text-sm text-gray-500">{time.time}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Customers: <span className="font-medium">{stats.customers}</span>
                        </span>
                        <span className="text-gray-600">
                          Target: <span className="font-medium">{formatCurrency(stats.target)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{customers.filter(c => c.status === "active").length}</p>
              <p className="text-sm text-gray-600">Total Active Customers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(customers.reduce((sum, customer) => {
                  if (customer.status === "active") {
                    return sum + (parseFloat(customer.totalAmount) / 10);
                  }
                  return sum;
                }, 0))}
              </p>
              <p className="text-sm text-gray-600">Weekly Collection Target</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">6</p>
              <p className="text-sm text-gray-600">Collection Lines</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
