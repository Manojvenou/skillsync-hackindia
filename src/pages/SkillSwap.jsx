import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Search, Loader2, Check, Sparkles, Send, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { motion } from "framer-motion";
import SkillSwapRequests from "@/components/skillswap/SkillSwapRequests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SkillSwap() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestTarget, setRequestTarget] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [form, setForm] = useState({
    skills_to_teach: "",
    skills_to_learn: "",
    bio: "",
    availability: "flexible",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: swaps = [], isLoading } = useQuery({
    queryKey: ["swaps"],
    queryFn: () => base44.entities.SkillSwap.list("-created_date", 100),
  });

  const mySwap = swaps.find(s => s.user_email === user?.email);
  const otherSwaps = swaps.filter(s => s.user_email !== user?.email && s.status === "active");

  // Find matches
  const matches = otherSwaps.filter(swap => {
    if (!mySwap) return false;
    const iCanTeachTheyNeed = mySwap.skills_to_teach?.some(s =>
      swap.skills_to_learn?.some(l => l.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(l.toLowerCase()))
    );
    const theyCanTeachINeed = swap.skills_to_teach?.some(s =>
      mySwap.skills_to_learn?.some(l => l.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(l.toLowerCase()))
    );
    return iCanTeachTheyNeed || theyCanTeachINeed;
  });

  const filtered = search
    ? otherSwaps.filter(s =>
        s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.skills_to_teach?.some(sk => sk.toLowerCase().includes(search.toLowerCase())) ||
        s.skills_to_learn?.some(sk => sk.toLowerCase().includes(search.toLowerCase()))
      )
    : otherSwaps;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      user_email: user.email,
      user_name: user.full_name || "Anonymous",
      skills_to_teach: form.skills_to_teach.split(",").map(s => s.trim()).filter(Boolean),
      skills_to_learn: form.skills_to_learn.split(",").map(s => s.trim()).filter(Boolean),
      bio: form.bio,
      availability: form.availability,
      status: "active",
    };
    if (mySwap) {
      await base44.entities.SkillSwap.update(mySwap.id, data);
    } else {
      await base44.entities.SkillSwap.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["swaps"] });
    setSaving(false);
    setShowCreate(false);
  };

  const openEdit = () => {
    if (mySwap) {
      setForm({
        skills_to_teach: mySwap.skills_to_teach?.join(", ") || "",
        skills_to_learn: mySwap.skills_to_learn?.join(", ") || "",
        bio: mySwap.bio || "",
        availability: mySwap.availability || "flexible",
      });
    }
    setShowCreate(true);
  };

  const handleSendRequest = async () => {
    if (!requestTarget) return;
    setSendingRequest(true);
    await base44.entities.SkillSwapRequest.create({
      from_email: user.email,
      from_name: user.full_name || "Anonymous",
      to_email: requestTarget.user_email,
      to_name: requestTarget.user_name,
      message: requestMessage,
      status: "pending",
    });
    setSendingRequest(false);
    setRequestTarget(null);
    setRequestMessage("");
    queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Skill Swap</h1>
          <p className="text-slate-500 mt-1">Exchange skills with fellow learners</p>
        </div>
        <Button onClick={openEdit} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          {mySwap ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {mySwap ? "Edit My Skills" : "Add My Skills"}
        </Button>
      </div>

      {/* My Profile Card */}
      {mySwap && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold">
                {mySwap.user_name?.[0] || "?"}
              </div>
              <div>
                <p className="font-medium text-slate-900">{mySwap.user_name}</p>
                <p className="text-xs text-slate-500">Your skill profile</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-700 mb-1.5">Can teach</p>
                <div className="flex flex-wrap gap-1.5">
                  {mySwap.skills_to_teach?.map((s, i) => (
                    <Badge key={i} className="bg-emerald-100 text-emerald-700 border-0">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1.5">Wants to learn</p>
                <div className="flex flex-wrap gap-1.5">
                  {mySwap.skills_to_learn?.map((s, i) => (
                    <Badge key={i} className="bg-blue-100 text-blue-700 border-0">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Your Matches ({matches.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((swap, i) => (
              <SwapCard key={swap.id} swap={swap} index={i} isMatch />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse" className="gap-2">
            <Search className="w-4 h-4" /> Browse
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Inbox className="w-4 h-4" /> Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search skills or people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* All Swaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((swap, i) => (
              <SwapCard key={swap.id} swap={swap} index={i} onRequest={() => setRequestTarget(swap)} />
            ))}
          </div>
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-400">
              {search ? "No matching skill profiles found" : "No skill profiles yet. Be the first!"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <SkillSwapRequests userEmail={user?.email} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mySwap ? "Edit" : "Add"} Your Skills</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Skills I Can Teach (comma separated)</Label>
              <Input placeholder="e.g. Python, Data Science, SQL" value={form.skills_to_teach} onChange={(e) => setForm({ ...form, skills_to_teach: e.target.value })} required />
            </div>
            <div>
              <Label>Skills I Want to Learn (comma separated)</Label>
              <Input placeholder="e.g. React, UI Design, TypeScript" value={form.skills_to_learn} onChange={(e) => setForm({ ...form, skills_to_learn: e.target.value })} required />
            </div>
            <div>
              <Label>Short Bio</Label>
              <Textarea placeholder="Tell others about yourself..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div>
              <Label>Availability</Label>
              <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="weekends">Weekends</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Request Modal */}
      <Dialog open={!!requestTarget} onOpenChange={() => setRequestTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Skill Swap Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {requestTarget?.user_name?.[0] || "?"}
              </div>
              <div>
                <p className="font-medium text-slate-900">{requestTarget?.user_name}</p>
                <p className="text-xs text-slate-400">{requestTarget?.user_email}</p>
              </div>
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I'd love to learn from you and share my skills..."
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRequestTarget(null)}>Cancel</Button>
              <Button onClick={handleSendRequest} disabled={sendingRequest} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                {sendingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SwapCard({ swap, index, isMatch, onRequest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={isMatch ? "border-amber-200 bg-amber-50/30" : ""}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
              {swap.user_name?.[0] || "?"}
            </div>
            <div>
              <p className="font-medium text-slate-900">{swap.user_name}</p>
              <p className="text-xs text-slate-400">{swap.availability} availability</p>
            </div>
            {isMatch && <Badge className="ml-auto bg-amber-100 text-amber-700 border-0">Match!</Badge>}
          </div>
          {swap.bio && <p className="text-sm text-slate-500 mb-3">{swap.bio}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-emerald-700 mb-1">Can teach</p>
              <div className="flex flex-wrap gap-1">
                {swap.skills_to_teach?.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700 mb-1">Wants to learn</p>
              <div className="flex flex-wrap gap-1">
                {swap.skills_to_learn?.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Button onClick={onRequest} size="sm" variant="outline" className="w-full gap-2">
              <Send className="w-3 h-3" /> Send Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}