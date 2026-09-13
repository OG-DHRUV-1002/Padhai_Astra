"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog-shadcn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Plus, MapPin, Clock, 
  HelpCircle, CheckCircle2, Image as ImageIcon, Box
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
  id: string;
  type: "Lost" | "Found";
  title: string;
  description: string;
  category: "Electronics" | "Keys" | "Wallet" | "Documents" | "Other";
  date: string;
  location: string;
  status: "Active" | "Resolved";
  reporter: string;
  isFaculty: boolean;
}

const INITIAL_ITEMS: Item[] = [
  {
    id: "item_1", type: "Lost", title: "MacBook Pro Charger", description: "White Apple 61W USB-C power adapter. Lost it near the podium.", category: "Electronics",
    date: "2026-10-12", location: "Auditorium A", status: "Active", reporter: "Dr. Sarah Mitchell", isFaculty: true
  },
  {
    id: "item_2", type: "Found", title: "Student ID Card", description: "Found a student ID card belonging to John Doe (CS batch).", category: "Documents",
    date: "2026-10-13", location: "Faculty Lounge", status: "Active", reporter: "Dr. Sarah Mitchell", isFaculty: true
  },
  {
    id: "item_3", type: "Lost", title: "Blue Water Bottle", description: "Milton blue thermosteel bottle.", category: "Other",
    date: "2026-10-10", location: "Library", status: "Active", reporter: "Alex Johnson", isFaculty: false
  }
];

export default function LostAndFoundPage() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Item>>({
    type: "Lost", title: "", description: "", category: "Other", location: "", date: new Date().toISOString().split('T')[0]
  });

  const handleReport = () => {
    if (!formData.title || !formData.location) return;

    const newItem: Item = {
      ...(formData as Item),
      id: `item_${Date.now()}`,
      status: "Active",
      reporter: "Dr. Sarah Mitchell", // Logged-in Faculty
      isFaculty: true
    };
    
    setItems([newItem, ...items]);
    setIsDialogOpen(false);
    setFormData({ type: "Lost", title: "", description: "", category: "Other", location: "", date: new Date().toISOString().split('T')[0] });
  };

  const resolveItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, status: "Resolved" } : item));
  };

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.location.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Electronics": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Keys": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "Wallet": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Documents": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Box className="h-8 w-8 text-amber-500" /> Lost & Found
            </h1>
            <p className="text-muted-foreground mt-2">
              Report found items or search for things you've lost on campus.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-amber-950 font-semibold gap-2">
                <Plus className="h-4 w-4" /> Report Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-[#12121e] border-white/20 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl">Report Lost or Found Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                
                <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setFormData({...formData, type: "Lost"})}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === "Lost" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-400 hover:text-white"}`}
                  >
                    I Lost Something
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, type: "Found"})}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.type === "Found" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white"}`}
                  >
                    I Found Something
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  <Label>Item Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. Blue Backpack" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v: any) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181825] border-white/10 text-white">
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Keys">Keys</SelectItem>
                        <SelectItem value="Wallet">Wallet</SelectItem>
                        <SelectItem value="Documents">Documents</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-white/5 border-white/10 text-slate-200 [color-scheme:dark]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location {formData.type === 'Lost' ? 'Lost' : 'Found'}</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white/5 border-white/10" placeholder="e.g. Near Cafeteria" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10 min-h-[80px]" placeholder="Add specific details to help identify..." />
                </div>

                <Button onClick={handleReport} disabled={!formData.title || !formData.location} className="w-full bg-amber-600 hover:bg-amber-700 text-amber-950 font-bold mt-4 h-11">
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 bg-white/[0.02] p-2 rounded-xl border border-white/5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search items by name or location..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-sm h-10"
            />
          </div>
        </div>

        {/* Tabs for Filtering */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="lost" className="data-[state=active]:text-red-400">Lost Items</TabsTrigger>
            <TabsTrigger value="found" className="data-[state=active]:text-emerald-400">Found Items</TabsTrigger>
            <TabsTrigger value="my-reports" className="data-[state=active]:text-amber-400">My Reports</TabsTrigger>
          </TabsList>

          {["all", "lost", "found", "my-reports"].map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredItems
                    .filter(i => {
                      if (tab === "lost") return i.type === "Lost";
                      if (tab === "found") return i.type === "Found";
                      if (tab === "my-reports") return i.reporter === "Dr. Sarah Mitchell";
                      return true;
                    })
                    .map(item => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <Card className={`p-5 hover:border-white/20 transition-all flex flex-col h-full relative overflow-hidden ${
                        item.status === 'Resolved' ? 'bg-white/[0.01] border-white/5 opacity-60' : 'bg-white/[0.02] border-white/10'
                      }`}>
                        
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="secondary" className={`${item.type === 'Lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {item.type}
                          </Badge>
                          <Badge variant="secondary" className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                        </div>

                        <h3 className={`font-semibold text-lg leading-tight mb-2 ${item.status === 'Resolved' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.title}
                        </h3>
                        
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="space-y-2 mt-auto pt-4 border-t border-white/5 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" /> {item.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-500" /> {new Date(item.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-3.5 w-3.5 text-slate-500" /> Reported by: 
                            <span className={item.isFaculty ? "text-indigo-400" : "text-slate-300"}>
                              {item.reporter} {item.isFaculty && "(Faculty)"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons if not resolved */}
                        {item.status === 'Active' && (
                          <div className="mt-4 flex gap-2">
                            {item.reporter === "Dr. Sarah Mitchell" ? (
                              <Button onClick={() => resolveItem(item.id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Resolved
                              </Button>
                            ) : (
                              <Button variant="outline" className="w-full h-9 text-xs border-white/10 hover:bg-white/10 text-slate-300">
                                Contact Reporter
                              </Button>
                            )}
                          </div>
                        )}
                        {item.status === 'Resolved' && (
                          <div className="mt-4 text-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 py-2 rounded-lg">
                            Resolved
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center">
                    <Box className="h-12 w-12 mb-4 opacity-50" />
                    <p>No items found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
