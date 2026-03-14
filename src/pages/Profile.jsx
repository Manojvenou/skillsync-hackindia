import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User, Zap, BookOpen, CheckCircle, Award,
  Pencil, Save, Loader2, Trophy, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const levelThresholds = { beginner: 0, learner: 50, contributor: 150, expert: 400, master: 1000 };
const levelOrder = ["beginner", "learner", "contributor", "expert", "master"];

function getLevel(points) {
  let level = "beginner";
  for (const [l, threshold] of Object.entries(levelThresholds)) {
    if (points >= threshold) level = l;
  }
  return level;
}

function getNextLevel(currentLevel) {
  const idx = levelOrder.indexOf(currentLevel);
  return idx < levelOrder.length - 1 ? levelOrder[idx + 1] : null;
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", skills: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["myProfile", user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ["myQuizzes", user?.email],
    queryFn: () => base44.entities.QuizResult.filter({ user_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  const profile = profiles[0];
  const level = getLevel(profile?.total_points || 0);
  const nextLevel = getNextLevel(level);
  const nextThreshold = nextLevel ? levelThresholds[nextLevel] : null;
  const currentThreshold = levelThresholds[level];
  const progressPct = nextThreshold
    ? Math.min(100, (((profile?.total_points || 0) - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;

  const startEdit = () => {
    setForm({
      display_name: profile?.display_name || user?.full_name || "",
      bio: profile?.bio || "",
      skills: profile?.skills?.join(", ") || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      user_email: user.email,
      display_name: form.display_name || user.full_name || "Anonymous",
      bio: form.bio,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      level,
    };
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
    } else {
      await base44.entities.UserProfile.create({ ...data, total_points: 0, rooms_joined: 0, rooms_hosted: 0, quizzes_taken: 0 });
    }
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Profile</h1>
        {!editing && (
          <Button onClick={startEdit} variant="outline" className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
                {(profile?.display_name || user?.full_name || "?")?.[0]}
              </div>
              <div className="flex-1">
                {editing ? (
                  <Input
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    placeholder="Display name"
                    className="text-lg font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-slate-900">{profile?.display_name || user?.full_name || "Set your name"}</h2>
                )}
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
              <Badge className="bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-0 text-sm px-3 py-1">
                {level}
              </Badge>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Bio</label>
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell the community about yourself..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Skills (comma separated)</label>
                  <Input
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="Python, React, Machine Learning..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {profile?.bio && <p className="text-slate-600 mb-4">{profile.bio}</p>}
                {profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {profile.skills.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-slate-600">{s}</Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Points", value: profile?.total_points || 0, icon: Zap, color: "text-amber-500" },
          { label: "Rooms", value: profile?.rooms_joined || 0, icon: BookOpen, color: "text-blue-500" },
          { label: "Quizzes", value: profile?.quizzes_taken || 0, icon: CheckCircle, color: "text-emerald-500" },
          { label: "Hosted", value: profile?.rooms_hosted || 0, icon: Star, color: "text-violet-500" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-slate-900">Level Progress</span>
            </div>
            {nextLevel && (
              <span className="text-sm text-slate-400">Next: {nextLevel} ({nextThreshold} pts)</span>
            )}
          </div>
          <Progress value={progressPct} className="h-3" />
          <p className="text-sm text-slate-500 mt-2">{profile?.total_points || 0} / {nextThreshold || "∞"} points</p>
        </CardContent>
      </Card>

      {/* Quiz History */}
      {quizResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quiz History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quizResults.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{q.room_title || "Quiz"}</p>
                    <p className="text-xs text-slate-400">{q.correct_answers}/{q.total_questions} correct</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={q.score >= 80 ? "bg-emerald-100 text-emerald-700" : q.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                      {q.score}%
                    </Badge>
                    <span className="text-xs text-amber-600 font-medium">+{q.points_earned} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No profile prompt */}
      {!profile && !editing && (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">Set up your profile to get started!</p>
          <Button onClick={startEdit} className="bg-indigo-600 hover:bg-indigo-700">
            Create Profile
          </Button>
        </div>
      )}
    </div>
  );
}