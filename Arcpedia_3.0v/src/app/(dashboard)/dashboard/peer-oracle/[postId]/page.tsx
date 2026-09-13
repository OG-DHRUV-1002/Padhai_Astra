"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { MessageSquare, Feather, ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useForum } from "@/hooks/use-forum";
import { ForumReply } from "@/lib/types";

export default function PeerOraclePostPage() {
  const params = useParams<{ postId: string }>();
  const { posts, loading, getReplies } = useForum();
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(true);

  const post = useMemo(
    () => posts.find(p => p.id === params.postId),
    [posts, params.postId],
  );

  // Load replies for this post
  useEffect(() => {
    if (!params.postId || loading) return;
    let cancelled = false;
    const load = async () => {
      setRepliesLoading(true);
      try {
        const data = await getReplies(params.postId);
        if (!cancelled) setReplies(data);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setRepliesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [params.postId, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <p className="text-lg font-medium">Post not found</p>
        <p className="text-sm">This post may have been removed or doesn&apos;t exist.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/peer-oracle"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Peer Oracle</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/peer-oracle"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Peer Oracle</Link>
        </Button>
      </div>
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 text-primary p-3 rounded-full">
              <Feather className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-lg text-foreground font-medium">{post.content}</p>
              <p className="text-sm text-muted-foreground mt-1">
                A whisper from a peer &middot; {format(new Date(post.date), "PPP p")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Echoes ({replies.length})
        </h2>
        {repliesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {replies.map((reply, index) => (
              <div key={reply.id}>
                <div className="flex items-start gap-4">
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-full">
                    <Feather className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="mt-1 text-foreground">{reply.content}</p>
                    <div className="text-sm text-muted-foreground mt-2">
                      <span>Another whisper &middot; </span>
                      <span>{format(new Date(reply.date), "PPP p")}</span>
                    </div>
                  </div>
                </div>
                {index < replies.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
            {replies.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No echoes yet. Share your thoughts.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
