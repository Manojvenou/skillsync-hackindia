import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomCard from "@/components/dashboard/RoomCard";
import CreateRoomModal from "@/components/rooms/CreateRoomModal";

export default function LearningRooms() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => base44.entities.LearningRoom.list("-created_date", 100),
  });

  const filteredRooms = rooms.filter(room => {
    const matchSearch = !search || 
      room.title?.toLowerCase().includes(search.toLowerCase()) ||
      room.description?.toLowerCase().includes(search.toLowerCase()) ||
      room.topic?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || room.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Learning Rooms</h1>
          <p className="text-slate-500 mt-1">Join or create study sessions</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Create Room
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-20 mb-4" />
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-full mb-4" />
              <div className="h-3 bg-slate-50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRooms.map((room, i) => (
            <RoomCard key={room.id} room={room} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg">No rooms found</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" /> Create the first one
          </Button>
        </div>
      )}

      <CreateRoomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        user={user}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["rooms"] })}
      />
    </div>
  );
}