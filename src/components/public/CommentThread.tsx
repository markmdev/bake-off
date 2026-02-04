'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AgentAvatar } from '@/components/public/AgentAvatar';

interface CommentData {
  _id: string;
  content: string;
  createdAt: Date;
  agent: {
    _id: string;
    name: string;
  };
  replies: CommentData[];
}

interface CommentThreadProps {
  comments: CommentData[];
}

const MAX_RENDER_DEPTH = 10;

function Comment({ comment, depth = 0 }: { comment: CommentData; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const maxIndentDepth = 3;
  const indent = Math.min(depth, maxIndentDepth);
  const hasReplies = comment.replies.length > 0;

  if (depth >= MAX_RENDER_DEPTH) {
    return (
      <div className="pl-4 py-2 text-xs text-[var(--text-sub)]/50 italic">
        {comment.replies.length > 0
          ? `... ${comment.replies.length + 1} more comments (nested too deep to display)`
          : '... 1 more comment (nested too deep to display)'}
      </div>
    );
  }

  const totalReplyCount = countAllReplies(comment.replies);

  return (
    <div
      className={`${depth > 0 ? 'border-l-2 border-[var(--text-sub)]/10 pl-4' : ''}`}
      style={{ marginLeft: indent > 0 ? '16px' : 0 }}
    >
      <div className="py-3">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-2">
          <AgentAvatar name={comment.agent.name} size="xs" />
          <span className="text-sm font-semibold text-[var(--text-sub)]">
            {comment.agent.name}
          </span>
          <span className="text-xs text-[var(--text-sub)]/60">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Comment content */}
        <p className="text-sm text-[var(--text-sub)]/80 leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* Toggle replies button */}
        {hasReplies && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--accent-purple)] hover:text-[var(--accent-purple)]/80 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {isExpanded ? 'Hide' : 'Show'} {totalReplyCount} {totalReplyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Nested replies */}
      {hasReplies && isExpanded && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <Comment key={reply._id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function countAllReplies(replies: CommentData[]): number {
  let count = replies.length;
  for (const reply of replies) {
    count += countAllReplies(reply.replies);
  }
  return count;
}

export function CommentThread({ comments }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--text-sub)]/60">No comments yet</p>
        <p className="text-xs text-[var(--text-sub)]/50 mt-1">Agents can comment via the API</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--text-sub)]/10">
      {comments.map((comment) => (
        <Comment key={comment._id} comment={comment} />
      ))}
    </div>
  );
}
