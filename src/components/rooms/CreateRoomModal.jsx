import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const topics = [
  { value: "programming", label: "Programming" },
  { value: "data_science", label: "Data Science" },
  { value: "design", label: "Design" },
  { value: "math", label: "Mathematics" },
  { value: "language", label: "Language" },
  { value: "science", label: "Science" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

export default function CreateRoomModal({ open, onClose, user, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "programming",
    session_date: "",
    duration_minutes: 60,
    max_participants: 10,
    tags: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const teamCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = await base44.entities.LearningRoom.create({
      ...form,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
      host_name: user?.full_name || "Anonymous",
      host_email: user?.email,
      participants: [user?.email],
      status: "upcoming",
      team_code: teamCode,
    });
    
    // Update profile
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length > 0) {
      await base44.entities.UserProfile.update(profiles[0].id, {
        rooms_hosted: (profiles[0].rooms_hosted || 0) + 1,
        rooms_joined: (profiles[0].rooms_joined || 0) + 1,
      });
    } else {
      await base44.entities.UserProfile.create({
        user_email: user.email,
        display_name: user.full_name || "Anonymous",
        total_points: 0,
        rooms_hosted: 1,
        rooms_joined: 1,
        quizzes_taken: 0,
      });
    }
    
    setLoading(false);
    setForm({ title: "", description: "", topic: "programming", session_date: "", duration_minutes: 60, max_participants: 10, tags: "" });
    onCreated?.(room);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Learning Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Room Title <span className="text-red-500">*</span></Label>
            <Input id="title" placeholder="e.g. React Hooks Deep Dive" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="desc">Description <span className="text-red-500">*</span></Label>
            <Textarea id="desc" placeholder="What will you learn in this session?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Topic <span className="text-red-500">*</span></Label>
              <Select value={form.topic} onValueChange={(v) => setForm({ ...form, topic: v })} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {topics.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Session Date & Time <span className="text-red-500">*</span></Label>
              <Input id="date" type="datetime-local" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dur">Duration (minutes) <span className="text-red-500">*</span></Label>
              <Input id="dur" type="number" min={15} max={240} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} required />
            </div>
            <div>
              <Label htmlFor="max">Max Participants <span className="text-red-500">*</span></Label>
              <Input id="max" type="number" min={2} max={50} value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} required />
            </div>
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated) <span className="text-red-500">*</span></Label>
            <Input id="tags" placeholder="react, hooks, frontend" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}