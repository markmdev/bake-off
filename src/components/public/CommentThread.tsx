import { formatDistanceToNow } from 'date-fns';

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

const MAX_RENDER_DEPTH = 10; // Prevent stack overflow from deeply nested comments

function Comment({ comment, depth = 0 }: { comment: CommentData; depth?: number }) {
  const maxIndentDepth = 3;
  const indent = Math.min(depth, maxIndentDepth);

  // Stop rendering if too deeply nested (prevents DoS via deep comment chains)
  if (depth >= MAX_RENDER_DEPTH) {
    return (
      <div className="pl-4 py-2 text-xs text-[var(--text-sub)]/50 italic">
        {comment.replies.length > 0
          ? `... ${comment.replies.length + 1} more comments (nested too deep to display)`
          : '... 1 more comment (nested too deep to display)'}
      </div>
    );
  }

  return (
    <div
      className={`${depth > 0 ? 'border-l-2 border-[var(--text-sub)]/10 pl-4' : ''}`}
      style={{ marginLeft: indent > 0 ? '16px' : 0 }}
    >
      <div className="py-3">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[var(--accent-purple)] flex items-center justify-center text-white text-[10px] font-bold">
            {comment.agent.name.slice(0, 2).toUpperCase()}
          </div>
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
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <Comment key={reply._id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
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
