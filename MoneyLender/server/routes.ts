import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertDailyCollectionSchema, insertDailyEntrySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Generate customer number if not provided
      if (!validatedData.customerNumber) {
        const count = (await storage.getCustomers()).length;
        validatedData.customerNumber = `C${String(count + 1).padStart(4, '0')}`;
      }
      
      // Calculate total amount (amountGiven + interestAmount)
      const totalAmount = validatedData.amountGiven + validatedData.interestAmount;
      
      // Calculate end date (start date + 10 weeks)
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (10 * 7)); // 10 weeks = 70 days
      
      const customerData = {
        ...validatedData,
        totalAmount,
        endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      };
      
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.get("/api/customers/line/:line", async (req, res) => {
    try {
      const customers = await storage.getCustomersByLine(req.params.line);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers by line" });
    }
  });

  // Daily collection routes
  app.get("/api/collections", async (req, res) => {
    try {
      const { date, line } = req.query;
      if (!date || !line) {
        return res.status(400).json({ message: "Date and line parameters are required" });
      }
      
      const collections = await storage.getDailyCollectionsByDate(date as string, line as string);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily collections" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const validatedData = insertDailyCollectionSchema.parse(req.body);
      const collection = await storage.createDailyCollection(validatedData);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create daily collection" });
    }
  });

  app.put("/api/collections/:id", async (req, res) => {
    try {
      const collection = await storage.updateDailyCollection(req.params.id, req.body);
      if (!collection) {
        return res.status(404).json({ message: "Daily collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to update daily collection" });
    }
  });

  app.get("/api/collections/customer/:customerId", async (req, res) => {
    try {
      const collections = await storage.getDailyCollectionsByCustomer(req.params.customerId);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer collections" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDailyCollection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json({ message: "Collection deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Daily entry routes
  app.get("/api/entries", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const entries = await storage.getDailyEntries(startDate as string, endDate as string);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily entries" });
    }
  });

  app.get("/api/entries/:date/:line", async (req, res) => {
    try {
      const entry = await storage.getDailyEntryByDateAndLine(req.params.date, req.params.line);
      if (!entry) {
        return res.status(404).json({ message: "Daily entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily entry" });
    }
  });

  app.post("/api/entries", async (req, res) => {
    try {
      const validatedData = insertDailyEntrySchema.parse(req.body);
      const entry = await storage.createDailyEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create daily entry" });
    }
  });

  app.put("/api/entries/:id", async (req, res) => {
    try {
      const entry = await storage.updateDailyEntry(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ message: "Daily entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update daily entry" });
    }
  });

  // Dashboard statistics route
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const activeCustomers = customers.filter(c => c.status === "active");
      
      const today = new Date().toISOString().split('T')[0];
      const entries = await storage.getDailyEntries(today, today);
      
      const todayCollected = entries.reduce((sum, entry) => sum + parseFloat(entry.totalCollected), 0);
      
      // Calculate proper target based on active customers weekly amounts
      const todayTarget = activeCustomers.reduce((sum, customer) => {
        const weeklyAmount = parseFloat(customer.totalAmount) / 10;
        return sum + weeklyAmount;
      }, 0);
      
      const todayExpenses = entries.reduce((sum, entry) => sum + parseFloat(entry.expenses), 0);
      
      // Calculate profit from new loans (interest + document charges)
      const newLoansProfit = customers.reduce((sum, customer) => {
        const interestProfit = parseFloat(customer.interestAmount);
        const documentChargeProfit = parseFloat(customer.documentCharge);
        return sum + interestProfit + documentChargeProfit;
      }, 0);
      
      // Calculate profit from collections (collections - expenses)
      const todayCollectionProfit = todayCollected - todayExpenses;
      
      // Calculate total profit 
      const totalProfit = newLoansProfit + todayCollectionProfit;
      
      // Calculate total amount given per line
      const lineAmounts = {
        "monday-morning": 0,
        "monday-evening": 0,
        "tuesday-morning": 0,
        "wednesday-morning": 0,
        "wednesday-evening": 0,
        "thursday-morning": 0
      };
      
      activeCustomers.forEach(customer => {
        const amountGiven = parseFloat(customer.amountGiven || "0");
        if (lineAmounts.hasOwnProperty(customer.collectionLine)) {
          lineAmounts[customer.collectionLine] += amountGiven;
        }
      });
      
      const stats = {
        activeLoans: activeCustomers.length,
        todayTarget: todayTarget,
        amountCollected: todayCollected,
        collectionRate: todayTarget > 0 ? Math.round((todayCollected / todayTarget) * 100) : 0,
        newLoansProfit: newLoansProfit,
        todayCollectionProfit: todayCollectionProfit,
        totalProfit: totalProfit,
        todayExpenses: todayExpenses,
        lineAmounts: lineAmounts
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Consolidated dashboard statistics route
  app.get("/api/dashboard/consolidated-stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const customers = await storage.getCustomers();
      const activeCustomers = customers.filter(c => c.status === "active");
      const completedCustomers = customers.filter(c => c.status === "completed");
      
      // Get collections data for the date range
      const collections = await storage.getDailyCollections();
      const filteredCollections = collections.filter(c => 
        c.collectionDate >= startDate && c.collectionDate <= endDate
      );
      
      const totalCollected = filteredCollections.reduce((sum, collection) => 
        sum + parseFloat(collection.amountPaid || "0"), 0
      );
      
      const entries = await storage.getDailyEntries(startDate as string, endDate as string);
      const totalExpenses = entries.reduce((sum, entry) => sum + parseFloat(entry.expenses), 0);
      
      // Calculate separate interest and document charges
      const interestEarnings = customers.reduce((sum, customer) => {
        return sum + parseFloat(customer.interestAmount);
      }, 0);
      
      const documentCharges = customers.reduce((sum, customer) => {
        return sum + parseFloat(customer.documentCharge);
      }, 0);
      
      // Calculate profit from new loans (interest + document charges)
      const newLoansProfit = interestEarnings + documentCharges;
      
      // Calculate profit from collections (collections - expenses)
      const totalCollectionProfit = totalCollected - totalExpenses;
      
      // Calculate total profit 
      const totalProfit = newLoansProfit + totalCollectionProfit;
      
      // Calculate total outstanding amount
      const totalOutstanding = activeCustomers.reduce((sum, customer) => {
        return sum + parseFloat(customer.totalAmount);
      }, 0);
      
      // Calculate total amount given per line
      const lineAmounts = {
        "monday-morning": 0,
        "monday-evening": 0,
        "tuesday-morning": 0,
        "wednesday-morning": 0,
        "wednesday-evening": 0,
        "thursday-morning": 0
      };
      
      activeCustomers.forEach(customer => {
        const amountGiven = parseFloat(customer.amountGiven || "0");
        if (lineAmounts.hasOwnProperty(customer.collectionLine)) {
          lineAmounts[customer.collectionLine] += amountGiven;
        }
      });
      
      const stats = {
        activeLoans: activeCustomers.length,
        completedLoans: completedCustomers.length,
        amountCollected: totalCollected,
        interestEarnings: interestEarnings,
        documentCharges: documentCharges,
        totalCollectionProfit: totalCollectionProfit,
        totalExpenses: totalExpenses,
        totalOutstanding: totalOutstanding,
        lineAmounts: lineAmounts
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consolidated dashboard statistics" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const { date, collectionLine } = req.query;
      const expenses = await storage.getExpenses(date as string, collectionLine as string);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const { date, collectionLine, expenses, totalAmount } = req.body;
      
      // Save each expense entry
      for (const expense of expenses) {
        await storage.createExpense({
          date,
          collectionLine,
          category: expense.category,
          amount: parseFloat(expense.amount),
          description: expense.description || ""
        });
      }
      
      res.status(201).json({ message: "Expenses saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save expenses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
