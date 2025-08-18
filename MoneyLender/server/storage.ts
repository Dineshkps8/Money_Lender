import { type Customer, type InsertCustomer, type DailyCollection, type InsertDailyCollection, type DailyEntry, type InsertDailyEntry } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByNumber(customerNumber: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  getCustomersByLine(collectionLine: string): Promise<Customer[]>;
  
  // Daily collection operations
  getDailyCollection(id: string): Promise<DailyCollection | undefined>;
  createDailyCollection(collection: InsertDailyCollection): Promise<DailyCollection>;
  updateDailyCollection(id: string, collection: Partial<DailyCollection>): Promise<DailyCollection | undefined>;
  getDailyCollectionsByDate(date: string, line: string): Promise<DailyCollection[]>;
  getDailyCollectionsByCustomer(customerId: string): Promise<DailyCollection[]>;
  
  // Daily entry operations
  getDailyEntry(id: string): Promise<DailyEntry | undefined>;
  createDailyEntry(entry: InsertDailyEntry): Promise<DailyEntry>;
  updateDailyEntry(id: string, entry: Partial<DailyEntry>): Promise<DailyEntry | undefined>;
  getDailyEntryByDateAndLine(date: string, line: string): Promise<DailyEntry | undefined>;
  getDailyEntries(startDate?: string, endDate?: string): Promise<DailyEntry[]>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private dailyCollections: Map<string, DailyCollection>;
  private dailyEntries: Map<string, DailyEntry>;

  constructor() {
    this.customers = new Map();
    this.dailyCollections = new Map();
    this.dailyEntries = new Map();
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByNumber(customerNumber: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.customerNumber === customerNumber,
    );
  }

  async createCustomer(insertCustomer: any): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      amountGiven: insertCustomer.amountGiven.toString(),
      interestAmount: insertCustomer.interestAmount.toString(),
      totalAmount: insertCustomer.totalAmount.toString(),
      documentCharge: insertCustomer.documentCharge.toString(),
      status: insertCustomer.status || "active",
      createdAt: new Date()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomersByLine(collectionLine: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(
      (customer) => customer.collectionLine === collectionLine && customer.status === "active"
    );
  }

  // Daily collection operations
  async getDailyCollection(id: string): Promise<DailyCollection | undefined> {
    return this.dailyCollections.get(id);
  }

  async createDailyCollection(insertCollection: InsertDailyCollection): Promise<DailyCollection> {
    const id = randomUUID();
    const collection: DailyCollection = { 
      ...insertCollection, 
      id,
      dueAmount: insertCollection.dueAmount.toString(),
      amountPaid: insertCollection.amountPaid.toString(),
      paymentStatus: insertCollection.paymentStatus || "pending",
      createdAt: new Date()
    };
    this.dailyCollections.set(id, collection);
    return collection;
  }

  async updateDailyCollection(id: string, updates: Partial<DailyCollection>): Promise<DailyCollection | undefined> {
    const collection = this.dailyCollections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection = { ...collection, ...updates };
    this.dailyCollections.set(id, updatedCollection);
    return updatedCollection;
  }

  async getDailyCollectionsByDate(date: string, line: string): Promise<DailyCollection[]> {
    return Array.from(this.dailyCollections.values()).filter(
      (collection) => collection.collectionDate === date && collection.collectionLine === line
    );
  }

  async getDailyCollectionsByCustomer(customerId: string): Promise<DailyCollection[]> {
    return Array.from(this.dailyCollections.values()).filter(
      (collection) => collection.customerId === customerId
    );
  }

  // Daily entry operations
  async getDailyEntry(id: string): Promise<DailyEntry | undefined> {
    return this.dailyEntries.get(id);
  }

  async createDailyEntry(insertEntry: InsertDailyEntry): Promise<DailyEntry> {
    const id = randomUUID();
    const entry: DailyEntry = { 
      ...insertEntry, 
      id,
      targetAmount: insertEntry.targetAmount.toString(),
      totalCollected: insertEntry.totalCollected.toString(),
      expenses: insertEntry.expenses.toString(),
      newLoansAmount: insertEntry.newLoansAmount.toString(),
      documentCharges: insertEntry.documentCharges.toString(),
      newLoansGiven: insertEntry.newLoansGiven || 0,
      completedLoans: insertEntry.completedLoans || 0,
      createdAt: new Date()
    };
    this.dailyEntries.set(id, entry);
    return entry;
  }

  async updateDailyEntry(id: string, updates: Partial<DailyEntry>): Promise<DailyEntry | undefined> {
    const entry = this.dailyEntries.get(id);
    if (!entry) return undefined;
    
    const updatedEntry = { ...entry, ...updates };
    this.dailyEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async getDailyEntryByDateAndLine(date: string, line: string): Promise<DailyEntry | undefined> {
    return Array.from(this.dailyEntries.values()).find(
      (entry) => entry.entryDate === date && entry.collectionLine === line
    );
  }

  async getDailyEntries(startDate?: string, endDate?: string): Promise<DailyEntry[]> {
    let entries = Array.from(this.dailyEntries.values());
    
    if (startDate) {
      entries = entries.filter(entry => entry.entryDate >= startDate);
    }
    
    if (endDate) {
      entries = entries.filter(entry => entry.entryDate <= endDate);
    }
    
    return entries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }
}

export const storage = new MemStorage();
