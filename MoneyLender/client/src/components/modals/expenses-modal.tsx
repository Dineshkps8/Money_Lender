
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  collectionLine: string;
}

interface ExpenseEntry {
  category: string;
  amount: string;
  description: string;
}

export default function ExpensesModal({ open, onOpenChange, date, collectionLine }: ExpensesModalProps) {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    { category: "fuel", amount: "", description: "" }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      onOpenChange(false);
      setExpenses([{ category: "fuel", amount: "", description: "" }]);
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
    setExpenses([...expenses, { category: "fuel", amount: "", description: "" }]);
  };

  const removeExpenseRow = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof ExpenseEntry, value: string) => {
    const updated = expenses.map((expense, i) => 
      i === index ? { ...expense, [field]: value } : expense
    );
    setExpenses(updated);
  };

  const handleSave = () => {
    const validExpenses = expenses.filter(e => e.amount && parseFloat(e.amount) > 0);
    
    if (validExpenses.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one expense with a valid amount",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = validExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    saveExpensesMutation.mutate({
      date,
      collectionLine,
      expenses: validExpenses,
      totalAmount
    });
  };

  const totalAmount = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Daily Expenses</DialogTitle>
          <p className="text-sm text-gray-500">
            Date: {date} | Line: {collectionLine}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {expenses.map((expense, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <Label>Category</Label>
                <Select 
                  value={expense.category} 
                  onValueChange={(value) => updateExpense(index, "category", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="supplies">Office Supplies</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={expense.amount}
                  onChange={(e) => updateExpense(index, "amount", e.target.value)}
                />
              </div>
              
              <div className="col-span-5">
                <Label>Description</Label>
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
            <Button variant="outline" onClick={addExpenseRow}>
              Add Another Expense
            </Button>
            <div className="text-lg font-medium">
              Total: ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveExpensesMutation.isPending}>
            {saveExpensesMutation.isPending ? "Saving..." : "Save Expenses"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
