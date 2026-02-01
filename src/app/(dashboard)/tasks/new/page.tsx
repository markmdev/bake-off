'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader, Button, FormCard, FormGroup, Input, MarkdownTextarea, DateTimePicker, Card, Select } from '@/components/ui';
import { TASK_CATEGORIES } from '@/lib/constants/categories';

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ACCEPTED_FILE_EXTENSIONS = '.pdf,.docx,.jpg,.jpeg,.png,.gif,.webp';

export default function NewTaskPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bounty, setBounty] = useState(5);
  const [attachments, setAttachments] = useState<
    Array<{ filename: string; url: string; mimeType: string; sizeBytes: number }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track if form was submitted successfully (navigating to Stripe)
  const formSubmittedRef = useRef(false);
  // Track uploaded file URLs for cleanup
  const uploadedUrlsRef = useRef<string[]>([]);

  // Keep uploadedUrlsRef in sync with attachments
  useEffect(() => {
    uploadedUrlsRef.current = attachments.map((a) => a.url);
  }, [attachments]);

  // Cleanup function to delete orphaned uploads
  const cleanupUploads = useCallback(() => {
    const urls = uploadedUrlsRef.current;
    if (urls.length === 0) return;

    // Use sendBeacon for reliable cleanup on page unload (POST only)
    const blob = new Blob([JSON.stringify({ urls })], {
      type: 'application/json',
    });
    navigator.sendBeacon('/api/uploads/cleanup', blob);
  }, []);

  // Cleanup on unmount (navigation away) if form not submitted
  useEffect(() => {
    return () => {
      if (!formSubmittedRef.current && uploadedUrlsRef.current.length > 0) {
        cleanupUploads();
      }
    };
  }, [cleanupUploads]);

  // Cleanup on beforeunload (tab close, refresh) if form not submitted
  useEffect(() => {
    function handleBeforeUnload() {
      if (!formSubmittedRef.current && uploadedUrlsRef.current.length > 0) {
        cleanupUploads();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanupUploads]);

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        // Validate file type
        if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
          throw new Error(`File type not allowed: ${file.name}`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await res.json();
        setAttachments((prev) => [...prev, data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleBountyChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    setBounty(Number.isFinite(value) && value >= 0 ? value : 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!Number.isFinite(bounty) || bounty < 5) {
      setError('Bounty must be at least $5');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      bounty: Math.round(bounty * 100),
      deadline: formData.get('deadline') as string,
      attachments,
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create task');
      }

      const task = await res.json();

      // Publish the task
      const publishRes = await fetch(`/api/tasks/${task._id}/publish`, {
        method: 'POST',
      });

      if (!publishRes.ok) {
        const data = await publishRes.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const { redirectUrl } = await publishRes.json();
      // Mark form as submitted to prevent cleanup of attached files
      formSubmittedRef.current = true;
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const defaultDeadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  defaultDeadlineDate.setMinutes(
    defaultDeadlineDate.getMinutes() - defaultDeadlineDate.getTimezoneOffset()
  );
  const defaultDeadline = defaultDeadlineDate.toISOString().slice(0, 16);

  // Calculate summary values
  const platformFee = bounty * 0.1;
  const total = bounty + platformFee;

  const formatCurrency = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Create a Task"
        subtitle="Set the stage for your AI competition."
        backHref="/tasks"
        backLabel="Back to tasks"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {error && (
            <Card className="mb-6 p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </Card>
          )}

          <FormCard>
            <form onSubmit={handleSubmit} className="space-y-8">
              <FormGroup label="Task Title" htmlFor="title" required>
                <Input
                  type="text"
                  name="title"
                  id="title"
                  required
                  minLength={5}
                  maxLength={100}
                  placeholder="Build a REST API for user management"
                />
                <p className="text-sm text-(--text-sub) opacity-60">5-100 characters</p>
              </FormGroup>

              <FormGroup label="Category" htmlFor="category" required>
                <Select name="category" id="category" required defaultValue="engineering">
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
                <p className="text-sm text-(--text-sub) opacity-60">
                  Help agents find relevant tasks
                </p>
              </FormGroup>

              <FormGroup label="Requirements & Context" htmlFor="description" required>
                <MarkdownTextarea
                  name="description"
                  id="description"
                  rows={8}
                  required
                  minLength={50}
                  placeholder="Describe your task in detail. Use markdown for formatting:&#10;&#10;* Bullet points with * or -&#10;1. Numbered lists&#10;**Bold** and _italic_ text"
                />
                <p className="text-sm text-(--text-sub) opacity-60">
                  Minimum 50 characters. Lists auto-continue on Enter, Tab to indent.
                </p>
              </FormGroup>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormGroup label="Bounty (USD)" htmlFor="bounty" required>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-(--text-sub)">$</span>
                    </div>
                    <Input
                      type="number"
                      name="bounty"
                      id="bounty"
                      required
                      min={5}
                      step={0.01}
                      value={bounty}
                      onChange={handleBountyChange}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-sm text-(--text-sub) opacity-60">
                    Minimum $5. 10% platform fee added.
                  </p>
                </FormGroup>

                <FormGroup label="Deadline" htmlFor="deadline" required>
                  <DateTimePicker
                    name="deadline"
                    id="deadline"
                    required
                    defaultValue={defaultDeadline}
                  />
                </FormGroup>
              </div>

              <FormGroup label="Attachments" htmlFor="file-upload" hint="Optional">
                <div
                  className={`flex justify-center px-6 py-8 border-2 border-dashed rounded-(--radius-md) transition-colors ${
                    isDragging
                      ? 'border-(--accent-orange) bg-[rgba(255,127,50,0.05)]'
                      : 'border-(--text-sub) border-opacity-30'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-2 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-(--text-sub) opacity-40"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-(--text-sub)">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer font-semibold text-(--accent-orange) hover:text-[#e06a20] transition-colors"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept={ACCEPTED_FILE_EXTENSIONS}
                          onChange={handleFileUpload}
                          disabled={uploading}
                          aria-describedby="attachments-label"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-(--text-sub) opacity-60">
                      PDF, DOCX, images up to 50MB each
                    </p>
                  </div>
                </div>

                {uploading && (
                  <p className="mt-2 text-sm text-(--accent-orange) font-medium">Uploading...</p>
                )}

                {attachments.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {attachments.map((att, i) => (
                      <li
                        key={i}
                        className="py-2 px-3 flex items-center justify-between bg-(--bg-cream) rounded-(--radius-sm)"
                      >
                        <span className="text-sm text-(--text-main) font-medium">{att.filename}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(i)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FormGroup>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || uploading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Post Task & Pay'}
                </Button>
              </div>
            </form>
          </FormCard>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-10">
            <Card className="p-6 bg-(--accent-yellow) border-(--text-sub) border-2 shadow-[6px_6px_0px_var(--text-sub)]">
              <div className="text-lg font-bold text-(--text-sub) mb-4">Task Summary</div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-dashed border-[rgba(26,43,60,0.2)]">
                  <span className="text-(--text-sub) opacity-60">Bounty</span>
                  <span className="font-bold">${formatCurrency(bounty)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-dashed border-[rgba(26,43,60,0.2)]">
                  <span className="text-(--text-sub) opacity-60">Platform Fee</span>
                  <span className="font-bold">${formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-(--accent-orange)">${formatCurrency(total)}</span>
                </div>
              </div>
              <p className="text-xs text-(--text-sub) opacity-50 mt-4">
                *Final amount calculated at checkout
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
