import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Calendar, Clock, Users, ArrowLeft, UserPlus,
  Brain, Play, FileText, Loader2, Trash2, Copy, Check, MessageCircle, Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import MaterialsManager from "@/components/rooms/MaterialsManager";
import RoomChat from "@/components/rooms/RoomChat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RoomDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("id");
  const joinCode = urlParams.get("code");
  const [user, setUser] = useState(null);
  const [joining, setJoining] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const rooms = await base44.entities.LearningRoom.filter({ id: roomId });
      return rooms[0];
    },
    enabled: !!roomId,
  });

  // Auto-join if valid code
  useEffect(() => {
    if (room && user && joinCode === room.team_code && !room.participants?.includes(user.email)) {
      handleJoin();
    }
  }, [room, user, joinCode]);

  const isParticipant = room?.participants?.includes(user?.email);
  const isHost = room?.host_email === user?.email;
  const isFull = (room?.participants?.length || 0) >= (room?.max_participants || 10);

  const handleJoin = async () => {
    if (!room || isParticipant || isFull) return;
    setJoining(true);
    const updated = [...(room.participants || []), user.email];
    await base44.entities.LearningRoom.update(room.id, { participants: updated });
    
    // Update profile
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, {
        rooms_joined: (profiles[0].rooms_joined || 0) + 1,
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!room || !isParticipant || isHost) return;
    const updated = room.participants.filter(e => e !== user.email);
    await base44.entities.LearningRoom.update(room.id, { participants: updated });
    queryClient.invalidateQueries({ queryKey: ["room", roomId] });
  };

  const handleDelete = async () => {
    setDeleting(true);
    await base44.entities.LearningRoom.delete(room.id);
    navigate(createPageUrl("LearningRooms"));
  };

  const copyTeamCode = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?id=${room.id}&code=${room.team_code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Room not found</p>
        <Link to={createPageUrl("LearningRooms")}>
          <Button className="mt-4" variant="outline">Back to Rooms</Button>
        </Link>
      </div>
    );
  }

  const topicGradients = {
    programming: "from-blue-500 to-indigo-600",
    data_science: "from-emerald-500 to-teal-600",
    design: "from-pink-500 to-rose-600",
    math: "from-amber-500 to-orange-600",
    language: "from-violet-500 to-purple-600",
    science: "from-cyan-500 to-blue-600",
    business: "from-orange-500 to-red-600",
    other: "from-slate-500 to-slate-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={createPageUrl("LearningRooms")} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition">
          <ArrowLeft className="w-4 h-4" /> Back to rooms
        </Link>
        {isHost && (
          <Button onClick={() => setShowDelete(true)} variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete Room
          </Button>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Hero */}
        <div className={`bg-gradient-to-br ${topicGradients[room.topic] || topicGradients.other} rounded-2xl p-8 text-white`}>
          <Badge className="bg-white/20 text-white border-0 mb-4">{room.topic?.replace(/_/g, " ")}</Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{room.title}</h1>
          {room.description && <p className="text-white/80 max-w-2xl">{room.description}</p>}
          <div className="flex flex-wrap gap-6 mt-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {room.session_date ? format(new Date(room.session_date), "EEEE, MMMM d 'at' h:mm a") : "TBD"}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {room.duration_minutes || 60} minutes
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {room.participants?.length || 0} / {room.max_participants || 10} participants
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {!isParticipant && !isFull && (
              <Button onClick={handleJoin} disabled={joining} className="bg-white text-indigo-700 hover:bg-white/90 gap-2">
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Join Room
              </Button>
            )}
            {isParticipant && !isHost && (
              <Button onClick={handleLeave} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Leave Room
              </Button>
            )}
            {isParticipant && (
              <Link to={createPageUrl(`Quiz?roomId=${room.id}&topic=${room.topic}&title=${encodeURIComponent(room.title)}`)}>
                <Button className="bg-white/20 text-white hover:bg-white/30 gap-2">
                  <Play className="w-4 h-4" /> Take Quiz
                </Button>
              </Link>
            )}
            {isParticipant && (
              <Link to={createPageUrl("AIAssistant")}>
                <Button className="bg-white/20 text-white hover:bg-white/30 gap-2">
                  <Brain className="w-4 h-4" /> AI Help
                </Button>
              </Link>
            )}
            {room.team_code && (
              <Button onClick={copyTeamCode} className="bg-white/20 text-white hover:bg-white/30 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Invite Link"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Tabs defaultValue="materials">
                <CardHeader className="pb-3">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="materials" className="gap-2">
                      <FileText className="w-4 h-4" /> Materials
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageCircle className="w-4 h-4" /> Chat
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="materials" className="mt-0">
                    {isHost ? (
                      <MaterialsManager room={room} onUpdate={() => queryClient.invalidateQueries({ queryKey: ["room", roomId] })} />
                    ) : (
                      <div className="space-y-3">
                        {room.materials?.length > 0 ? (
                          room.materials.map((mat, i) => (
                            <a
                              key={i}
                              href={mat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                            >
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-700">{mat.name}</p>
                                <p className="text-xs text-slate-400">{mat.type}</p>
                              </div>
                            </a>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-8">No materials added yet.</p>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="chat" className="mt-0">
                    {isParticipant ? (
                      <RoomChat roomId={roomId} user={user} />
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        Join the room to access group chat
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Tags */}
            {room.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-slate-500">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Host</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold">
                    {room.host_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{room.host_name || "Anonymous"}</p>
                    <p className="text-xs text-slate-400">{room.host_email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {room.team_code && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-500" /> Team Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600 tracking-wider">{room.team_code}</p>
                  </div>
                  <Button onClick={copyTeamCode} variant="outline" size="sm" className="w-full mt-3 gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Invite Link"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participants ({room.participants?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {room.participants?.map((email, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {email[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-slate-600 truncate">{email}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All room data, messages, and materials will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}