"use client";

import React, { useState } from "react";
import PageHeader from "@/components/arcpedia/dashboard/page-header";
import { useLostFound, LostFoundItem } from "@/hooks/use-lost-found";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Calendar, Camera, Plus, Inbox, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function LostAndFoundPage() {
    const { items, lostItems, foundItems, resolvedItems, loading, reportItem, claimItem } = useLostFound();
    const [searchQuery, setSearchQuery] = useState("");
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [tab, setTab] = useState("lost");

    const filteredItems = (itemsList: LostFoundItem[]) => 
        itemsList.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleReportSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        reportItem({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            category: formData.get("category") as any,
            status: formData.get("status") as any,
            location: formData.get("location") as string,
            date: new Date().toISOString(),
            reporterId: "current_user",
            contactInfo: formData.get("contactInfo") as string,
            imageUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=2070" // Mock generic image
        });

        setIsReportModalOpen(false);
    };

    return (
        <div className="flex flex-col h-full space-y-6 pb-20 no-scrollbar overflow-y-auto w-full pr-4">
            <PageHeader 
                title="Lost & Found" 
                description="Report lost items or help return found items to their rightful owners."
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search items..." 
                        className="pl-9 glass bg-black/40 border-white/10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-campus-primary hover:bg-campus-primary/90 text-white shadow-lg shadow-campus-primary/20">
                            <Plus className="h-4 w-4 mr-2" />
                            Report Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass bg-black/60 border-white/10 sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Report an Item</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleReportSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Item Status</Label>
                                    <Select name="status" defaultValue="lost">
                                        <SelectTrigger className="bg-black/40 border-white/10">
                                            <SelectValue placeholder="Lost or Found?" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lost">I Lost Something</SelectItem>
                                            <SelectItem value="found">I Found Something</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select name="category" defaultValue="Electronics">
                                        <SelectTrigger className="bg-black/40 border-white/10">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Electronics">Electronics</SelectItem>
                                            <SelectItem value="Clothing">Clothing</SelectItem>
                                            <SelectItem value="IDs/Wallets">IDs/Wallets</SelectItem>
                                            <SelectItem value="Books/Stationery">Books/Stationery</SelectItem>
                                            <SelectItem value="Keys">Keys</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Item Name</Label>
                                <Input name="title" required placeholder="e.g. Apple Pencil 2" className="bg-black/40 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <Label>Location (Last seen / Found at)</Label>
                                <Input name="location" required placeholder="e.g. Main Library 2nd Floor" className="bg-black/40 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <Label>Description & Identifying Features</Label>
                                <Textarea name="description" required placeholder="Provide details to help identify the item..." className="bg-black/40 border-white/10 resize-none h-24" />
                            </div>

                            <div className="space-y-2">
                                <Label>Contact Info (Optional)</Label>
                                <Input name="contactInfo" placeholder="Phone number or alternate email" className="bg-black/40 border-white/10" />
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-campus-primary hover:bg-campus-primary/90 text-white">Submit Report</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="lost" className="w-full" onValueChange={setTab}>
                <TabsList className="glass bg-black/40 border border-white/10 w-full justify-start p-1 h-auto">
                    <TabsTrigger value="lost" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 py-2">
                        Lost Items ({lostItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="found" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-2">
                        Found Items ({foundItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-2">
                        Resolved ({resolvedItems.length})
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TabsContent value="lost" className="m-0 border-0 p-0">
                                <ItemGrid items={filteredItems(lostItems)} emptyMessage="No lost items reported. Phew!" onClaim={claimItem} />
                            </TabsContent>
                            <TabsContent value="found" className="m-0 border-0 p-0">
                                <ItemGrid items={filteredItems(foundItems)} emptyMessage="No found items reported right now." onClaim={claimItem} />
                            </TabsContent>
                            <TabsContent value="resolved" className="m-0 border-0 p-0">
                                <ItemGrid items={filteredItems(resolvedItems)} emptyMessage="No resolved items yet." onClaim={claimItem} isResolved />
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </Tabs>
        </div>
    );
}

function ItemGrid({ items, emptyMessage, onClaim, isResolved = false }: { items: LostFoundItem[], emptyMessage: string, onClaim: (id: string) => void, isResolved?: boolean }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center glass bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">{emptyMessage}</h3>
                <p className="text-muted-foreground max-w-sm">
                    Items reported will appear here. Try adjusting your search filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <Card key={item.id} className="glass bg-black/40 border-white/10 overflow-hidden hover:bg-black/60 transition-colors group flex flex-col h-full">
                    <div className="relative h-48 w-full bg-black/50 overflow-hidden">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Camera className="h-8 w-8 text-white/20" />
                            </div>
                        )}
                        <div className="absolute top-3 left-3">
                            <Badge className={cn(
                                "backdrop-blur-md shadow-lg",
                                item.status === "lost" ? "bg-red-500/80 text-white" : 
                                item.status === "found" ? "bg-emerald-500/80 text-white" : 
                                "bg-blue-500/80 text-white"
                            )}>
                                {item.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/20 text-white">
                                {item.category}
                            </Badge>
                        </div>
                    </div>
                    
                    <CardContent className="p-4 flex flex-col flex-1">
                        <h3 className="font-semibold text-lg text-white mb-2 line-clamp-1">{item.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1">{item.description}</p>
                        
                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center text-xs text-gray-300">
                                <MapPin className="h-3.5 w-3.5 mr-2 text-campus-primary" />
                                <span className="truncate">{item.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-300">
                                <div className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-2 text-campus-primary" />
                                    <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                    <span className="text-gray-500">{format(new Date(item.date), "h:mm a")}</span>
                                </div>
                            </div>
                            
                            {item.contactInfo && (
                                <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-center">
                                    <span className="text-gray-400 block mb-1">Contact / Details</span>
                                    <span className="text-white font-medium">{item.contactInfo}</span>
                                </div>
                            )}

                            {!isResolved && (
                                <Button 
                                    variant={item.status === "lost" ? "outline" : "default"} 
                                    className={cn(
                                        "w-full mt-4 transition-all duration-300",
                                        item.status === "found" && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 hover:text-emerald-300 border-emerald-500/20"
                                    )}
                                    onClick={() => onClaim(item.id)}
                                >
                                    {item.status === "lost" ? (
                                        <>I found this!</>
                                    ) : (
                                        <>Claim this item</>
                                    )}
                                </Button>
                            )}
                            
                            {isResolved && (
                                <div className="w-full mt-4 flex items-center justify-center py-2 text-sm text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {item.status === "returned" ? "Returned to owner" : "Claimed"}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
