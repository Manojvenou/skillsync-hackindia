import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export default function Quiz() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("roomId");
  const topic = urlParams.get("topic") || "general";
  const title = urlParams.get("title") || "Learning Quiz";

  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    generateQuiz();
  }, [topic]);

  const generateQuiz = async () => {
    setLoading(true);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a 5-question multiple choice quiz about "${title}" (topic: ${topic}).
Each question should test understanding of key concepts.
Return the questions in the specified JSON format.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "number" },
                explanation: { type: "string" }
              }
            }
          }
        }
      }
    });

    setQuestions(result.questions || []);
    setLoading(false);
  };

  const handleAnswer = (index) => {
    if (selected !== null) return;
    setSelected(index);
    const isCorrect = index === questions[currentQ].correct_index;
    setAnswers([...answers, { selected: index, correct: isCorrect }]);
  };

  const nextQuestion = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      await saveResult();
    }
  };

  const saveResult = async () => {
    if (!user) return;
    setSaving(true);
    const correctCount = [...answers].filter(a => a.correct).length + (selected === questions[currentQ]?.correct_index ? 1 : 0);
    const totalCount = questions.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const points = Math.round(score / 10);

    await base44.entities.QuizResult.create({
      user_email: user.email,
      user_name: user.full_name || "Anonymous",
      room_id: roomId || "standalone",
      room_title: title,
      topic,
      score,
      total_questions: totalCount,
      correct_answers: correctCount,
      points_earned: points,
    });

    // Update profile points
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      const p = profiles[0];
      await base44.entities.UserProfile.update(p.id, {
        total_points: (p.total_points || 0) + points,
        quizzes_taken: (p.quizzes_taken || 0) + 1,
      });
    }
    setSaving(false);
  };

  const correctCount = answers.filter(a => a.correct).length;
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500">Generating quiz questions...</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center p-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
            <p className="text-slate-500 mb-6">{title}</p>
            <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-2">
              {score}%
            </div>
            <p className="text-slate-500 mb-2">
              {correctCount} of {questions.length} correct
            </p>
            <p className="text-sm text-amber-600 font-medium mb-8">
              +{Math.round(score / 10)} points earned!
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={generateQuiz} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
              <Link to={createPageUrl(roomId ? `RoomDetail?id=${roomId}` : "LearningRooms")}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">Back to Room</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to={createPageUrl(roomId ? `RoomDetail?id=${roomId}` : "LearningRooms")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{title} – Quiz</h1>
        <div className="flex items-center gap-4 mt-3">
          <Progress value={((currentQ + 1) / questions.length) * 100} className="flex-1 h-2" />
          <span className="text-sm text-slate-500 font-medium">{currentQ + 1}/{questions.length}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">{q?.question}</h2>
            <div className="space-y-3">
              {q?.options?.map((opt, i) => {
                const isCorrect = i === q.correct_index;
                const isSelected = i === selected;
                let style = "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50";
                if (selected !== null) {
                  if (isCorrect) style = "bg-emerald-50 border-emerald-300 text-emerald-800";
                  else if (isSelected && !isCorrect) style = "bg-red-50 border-red-300 text-red-800";
                  else style = "bg-slate-50 border-slate-200 text-slate-400";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selected !== null}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${style} flex items-center gap-3`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-medium shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {selected !== null && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {selected !== null && q?.explanation && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl bg-indigo-50 text-sm text-indigo-800">
                <strong>Explanation:</strong> {q.explanation}
              </motion.div>
            )}

            {selected !== null && (
              <div className="flex justify-end mt-6">
                <Button onClick={nextQuestion} className="bg-indigo-600 hover:bg-indigo-700">
                  {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}