"use client";

import { VacantRoomsView } from "@/components/nexus/vacant-rooms-view";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed, Users, Clock } from "lucide-react";

export default function VacantPlacesPage() {
  const canteens = [
    { name: "Main Canteen", capacity: 150, current: 120, status: "High Traffic", waitTime: "15 min", type: "Lunch & Snacks" },
    { name: "Maggi Point", capacity: 50, current: 10, status: "Available", waitTime: "3 min", type: "Quick Bites" },
    { name: "Library Cafe", capacity: 30, current: 28, status: "Full", waitTime: "10 min", type: "Beverages" }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-red-400" />
            Canteen Crowd Monitor
          </h2>
          <p className="text-gray-400 text-sm">Live tracking of campus dining availability</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canteens.map((canteen, idx) => (
            <Card key={idx} className="border-white/10 bg-neutral-900/60 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">{canteen.name}</CardTitle>
                  <Badge variant={canteen.status === "Available" ? "default" : canteen.status === "High Traffic" ? "secondary" : "destructive"} 
                         className={canteen.status === "Available" ? "bg-emerald-500/20 text-emerald-400" : canteen.status === "High Traffic" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}>
                    {canteen.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{canteen.type}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>{canteen.current} / {canteen.capacity} Occupied</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock className="h-4 w-4" />
                    <span>Est. Wait: {canteen.waitTime}</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${canteen.status === "Available" ? "bg-emerald-500" : canteen.status === "High Traffic" ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${(canteen.current / canteen.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="pt-8 border-t border-white/10">
        <VacantRoomsView />
      </div>
    </div>
  );
}
