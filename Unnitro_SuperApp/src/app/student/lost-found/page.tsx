"use client";

import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function LostAndFoundPage() {
  const items = [
    { id: 1, type: "Lost", item: "Blue AirPods Case", location: "Central Library - 2nd Floor", date: "Today", status: "Open" },
    { id: 2, type: "Found", item: "Calculator (Casio fx-991)", location: "CSB 302", date: "Yesterday", status: "Claimable" },
    { id: 3, type: "Lost", item: "Student ID Card (John Doe)", location: "Main Canteen", date: "2 days ago", status: "Open" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
          Report Item
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Lost & Found</h1>
          <p className="text-gray-400">Recover lost items or help a fellow student.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search for an item..." 
            className="pl-10 bg-white/5 border-white/10 text-white rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="border-white/10 bg-neutral-900/60 backdrop-blur-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex justify-between items-start">
                <Badge variant={item.type === "Lost" ? "destructive" : "default"} 
                       className={item.type === "Lost" ? "bg-red-500/20 text-red-400 border-red-500/20" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"}>
                  {item.type}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-gray-400">
                  {item.status}
                </Badge>
              </div>
              <CardTitle className="text-lg text-white mt-2">{item.item}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-400 gap-2">
                <MapPin className="h-4 w-4" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-400 gap-2">
                <Calendar className="h-4 w-4" />
                <span>{item.date}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button variant="secondary" className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
