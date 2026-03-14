import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Trophy, ArrowLeftRight, Zap, Plus, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/dashboard/StatCard";
import RoomCard from "@/components/dashboard/RoomCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => base44.entities.LearningRoom.list("-created_date", 50),
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ["quizResults"],
    queryFn: () => base44.entities.QuizResult.list("-created_date", 50),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const myProfile = profile?.[0];
  const upcomingRooms = rooms.filter(r => r.status === "upcoming").slice(0, 3);
  const myQuizzes = quizResults.filter(r => r.user_email === user?.email);
  const avgScore = myQuizzes.length > 0
    ? Math.round(myQuizzes.reduce((acc, q) => acc + (q.score || 0), 0) / myQuizzes.length)
    : 0;

  // Build activity from recent data
  const activities = [
    ...rooms.slice(0, 3).map(r => ({
      type: "room",
      message: `Room "${r.title}" created by ${r.host_name || "someone"}`,
      date: r.created_date,
    })),
    ...quizResults.slice(0, 3).map(q => ({
      type: "quiz",
      message: `${q.user_name || "Someone"} scored ${q.score}% in "${q.room_title || "a quiz"}"`,
      date: q.created_date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening in your learning community</p>
        </div>
        <div className="flex gap-3">
          <Link to={createPageUrl("AIAssistant")}>
            <Button variant="outline" className="gap-2">
              <Brain className="w-4 h-4" /> AI Assistant
            </Button>
          </Link>
          <Link to={createPageUrl("LearningRooms")}>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> New Room
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Points"
          value={myProfile?.total_points || 0}
          subtitle={myProfile?.level ? `Level: ${myProfile.level}` : "Start learning!"}
          icon={Zap}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          delay={0}
        />
        <StatCard
          title="Rooms Joined"
          value={myProfile?.rooms_joined || 0}
          subtitle={`${upcomingRooms.length} upcoming`}
          icon={BookOpen}
          gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
          delay={0.1}
        />
        <StatCard
          title="Quizzes Taken"
          value={myQuizzes.length}
          subtitle={avgScore > 0 ? `Avg: ${avgScore}%` : "Take your first quiz"}
          icon={Trophy}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
          delay={0.2}
        />
        <StatCard
          title="Skills"
          value={myProfile?.skills?.length || 0}
          icon={ArrowLeftRight}
          subtitle="Ready to swap"
          gradient="bg-gradient-to-br from-violet-400 to-purple-500"
          delay={0.3}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Rooms */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming Rooms</h2>
            <Link to={createPageUrl("LearningRooms")} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all →
            </Link>
          </div>
          {upcomingRooms.length > 0 ? (
            <div className="grid gap-4">
              {upcomingRooms.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming rooms yet.</p>
              <Link to={createPageUrl("LearningRooms")}>
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" /> Create one
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}