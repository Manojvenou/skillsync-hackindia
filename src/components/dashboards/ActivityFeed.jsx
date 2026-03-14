import React from "react";
import { format } from "date-fns";
import { BookOpen, Award, ArrowLeftRight, CheckCircle } from "lucide-react";

const iconMap = {
  room: BookOpen,
  quiz: CheckCircle,
  swap: ArrowLeftRight,
  badge: Award,
};

const colorMap = {
  room: "bg-blue-50 text-blue-600",
  quiz: "bg-emerald-50 text-emerald-600",
  swap: "bg-violet-50 text-violet-600",
  badge: "bg-amber-50 text-amber-600",
};

export default function ActivityFeed({ activities }) {
  if (!activities?.length) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No recent activity yet. Join a room to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, i) => {
        const Icon = iconMap[activity.type] || BookOpen;
        const color = colorMap[activity.type] || colorMap.room;
        return (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">{activity.message}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {activity.date ? format(new Date(activity.date), "MMM d, h:mm a") : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}