import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Link as LinkIcon, Upload, Loader2, Trash2 } from "lucide-react";

export default function MaterialsManager({ room, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", type: "link" });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, url: file_url, name: form.name || file.name, type: "pdf" });
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!form.name || !form.url) return;
    const materials = [...(room.materials || []), form];
    await base44.entities.LearningRoom.update(room.id, { materials });
    setForm({ name: "", url: "", type: "link" });
    setAdding(false);
    onUpdate?.();
  };

  const handleDelete = async (index) => {
    const materials = room.materials.filter((_, i) => i !== index);
    await base44.entities.LearningRoom.update(room.id, { materials });
    onUpdate?.();
  };

  return (
    <div className="space-y-3">
      {room.materials?.map((mat, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 group">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            {mat.type === "pdf" ? <FileText className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 hover:text-indigo-600 truncate block">
              {mat.name}
            </a>
            <p className="text-xs text-slate-400">{mat.type}</p>
          </div>
          <button
            onClick={() => handleDelete(i)}
            className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="p-4 rounded-xl bg-slate-50 space-y-3">
          <div>
            <Label>Material Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Course PDF, Tutorial Link"
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Link/URL</SelectItem>
                <SelectItem value="pdf">PDF/File</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.type === "pdf" ? (
            <div>
              <Label>Upload File</Label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={handleFileUpload} disabled={uploading} />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
              </div>
              {form.url && <p className="text-xs text-emerald-600 mt-1">✓ File uploaded</p>}
            </div>
          ) : (
            <div>
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!form.name || !form.url} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Add Material
            </Button>
            <Button onClick={() => { setAdding(false); setForm({ name: "", url: "", type: "link" }); }} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setAdding(true)} variant="outline" size="sm" className="w-full gap-2">
          <Upload className="w-4 h-4" /> Add Study Material
        </Button>
      )}
    </div>
  );
}