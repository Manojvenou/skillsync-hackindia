import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SkillSwapRequests({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sentRequests", userEmail],
    queryFn: () => base44.entities.SkillSwapRequest.filter({ from_email: userEmail }, "-created_date", 20),
    enabled: !!userEmail,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ["receivedRequests", userEmail],
    queryFn: () => base44.entities.SkillSwapRequest.filter({ to_email: userEmail }, "-created_date", 20),
    enabled: !!userEmail,
  });

  const handleAccept = async (request) => {
    await base44.entities.SkillSwapRequest.update(request.id, { status: "accepted" });
    queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
  };

  const handleDecline = async (request) => {
    await base44.entities.SkillSwapRequest.update(request.id, { status: "declined" });
    queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
  };

  const pendingReceived = receivedRequests.filter(r => r.status === "pending");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Received Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-500" />
            Received Requests ({pendingReceived.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receivedRequests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No requests received yet</p>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                        {req.from_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{req.from_name}</p>
                        <p className="text-xs text-slate-400">{req.from_email}</p>
                      </div>
                    </div>
                    <Badge className={
                      req.status === "pending" ? "bg-amber-100 text-amber-700" :
                      req.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                    }>
                      {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {req.status}
                    </Badge>
                  </div>
                  {req.message && <p className="text-sm text-slate-600 mb-3">{req.message}</p>}
                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleAccept(req)} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1">
                        <Check className="w-3 h-3" /> Accept
                      </Button>
                      <Button onClick={() => handleDecline(req)} size="sm" variant="outline" className="flex-1 gap-1">
                        <X className="w-3 h-3" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {sentRequests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No requests sent yet</p>
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold">
                        {req.to_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{req.to_name}</p>
                        <p className="text-xs text-slate-400">{req.to_email}</p>
                      </div>
                    </div>
                    <Badge className={
                      req.status === "pending" ? "bg-amber-100 text-amber-700" :
                      req.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                    }>
                      {req.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                      {req.status}
                    </Badge>
                  </div>
                  {req.message && <p className="text-sm text-slate-600">{req.message}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}