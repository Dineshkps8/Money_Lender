import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Calendar, 
  BarChart3 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Collection Manager</h2>
        <p className="text-sm text-gray-500 mt-1">Weekly Lending System</p>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={cn(
                    "w-full flex items-center px-4 py-3 text-left rounded-lg font-medium transition-colors",
                    isActive
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}