import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Star, Zap, BookOpen, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const levelColors = {
  beginner: "bg-slate-100 text-slate-600",
  learner: "bg-blue-100 text-blue-700",
  contributor: "bg-emerald-100 text-emerald-700",
  expert: "bg-violet-100 text-violet-700",
  master: "bg-amber-100 text-amber-700",
};

const topColors = [
  "from-amber-400 to-yellow-500",
  "from-slate-300 to-slate-400",
  "from-orange-300 to-orange-400",
];

export default function Leaderboard() {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => base44.entities.UserProfile.list("-total_points", 50),
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ["allQuizResults"],
    queryFn: () => base44.entities.QuizResult.list("-score", 10),
  });

  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Leaderboard</h1>
        <p className="text-slate-500 mt-1">Top learners in the community</p>
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 0, 2].map((pos) => {
            const profile = top3[pos];
            if (!profile) return <div key={pos} />;
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pos * 0.15 }}
                className={pos === 0 ? "sm:-mt-4" : ""}
              >
                <Card className="text-center overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${topColors[pos] || topColors[2]}`} />
                  <CardContent className="pt-6 pb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${topColors[pos]} flex items-center justify-center text-white text-xl font-bold mb-3`}>
                      {profile.display_name?.[0] || "?"}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {pos === 0 && <Trophy className="w-5 h-5 text-amber-500" />}
                      {pos === 1 && <Medal className="w-5 h-5 text-slate-400" />}
                      {pos === 2 && <Medal className="w-5 h-5 text-orange-400" />}
                      <span className="text-sm font-bold text-slate-500">#{pos + 1}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{profile.display_name}</h3>
                    <Badge className={`mt-2 ${levelColors[profile.level] || levelColors.beginner}`}>
                      {profile.level || "beginner"}
                    </Badge>
                    <div className="mt-4 flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-2xl font-bold text-slate-900">{profile.total_points || 0}</span>
                      <span className="text-sm text-slate-400">pts</span>
                    </div>
                    <div className="mt-3 flex justify-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {profile.rooms_joined || 0} rooms</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {profile.quizzes_taken || 0} quizzes</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Learners</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No profiles yet. Start learning to appear here!
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile, i) => (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="text-sm font-bold text-slate-400 w-8 text-center">#{i + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                    {profile.display_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{profile.display_name}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${levelColors[profile.level] || levelColors.beginner}`}>
                        {profile.level || "beginner"}
                      </Badge>
                      <span className="text-xs text-slate-400">{profile.quizzes_taken || 0} quizzes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-900">{profile.total_points || 0}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Top Scores */}
      {quizResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> Recent Top Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quizResults.map((result, i) => (
                <div key={result.id} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {result.user_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{result.user_name || "Anonymous"}</p>
                    <p className="text-xs text-slate-400">{result.room_title}</p>
                  </div>
                  <Badge className={result.score >= 80 ? "bg-emerald-100 text-emerald-700" : result.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}>
                    {result.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}