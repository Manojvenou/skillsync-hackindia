import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Clock, Users, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const topicColors = {
  programming: "bg-blue-50 text-blue-700 border-blue-200",
  data_science: "bg-emerald-50 text-emerald-700 border-emerald-200",
  design: "bg-pink-50 text-pink-700 border-pink-200",
  math: "bg-amber-50 text-amber-700 border-amber-200",
  language: "bg-violet-50 text-violet-700 border-violet-200",
  science: "bg-cyan-50 text-cyan-700 border-cyan-200",
  business: "bg-orange-50 text-orange-700 border-orange-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const statusColors = {
  upcoming: "bg-indigo-50 text-indigo-700",
  live: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-500",
};

export default function RoomCard({ room, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={createPageUrl(`RoomDetail?id=${room.id}`)}
        className="block bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100 hover:border-slate-200 transition-all duration-300 group"
      >
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={topicColors[room.topic] || topicColors.other}>
            {room.topic?.replace(/_/g, " ")}
          </Badge>
          <Badge className={statusColors[room.status] || statusColors.upcoming}>
            {room.status === "live" && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />}
            {room.status}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
          {room.title}
        </h3>
        {room.description && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{room.description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {room.session_date ? format(new Date(room.session_date), "MMM d, h:mm a") : "TBD"}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {room.duration_minutes || 60} min
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {room.participants?.length || 0}/{room.max_participants || 10}
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
          View Room <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </Link>
    </motion.div>
  );
}