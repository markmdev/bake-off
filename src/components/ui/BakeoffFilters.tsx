'use client';

import { useState, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Badge } from './Badge';
import { Tag } from './Tag';
import { Card } from './Card';
import { Button } from './Button';
import { TASK_CATEGORIES, type TaskCategory } from '@/lib/constants/categories';

type TaskStatus = 'running' | 'reviewing' | 'finished' | 'draft' | 'cancelled';
type SortOption = 'newest' | 'deadline' | 'bounty_high' | 'bounty_low' | 'trending';
type ViewFilter = 'all' | 'mine';
type StatusFilter = 'all' | 'open' | 'closed' | 'draft';

interface TaskData {
  id: string;
  title: string;
  category?: TaskCategory;
  bounty: number;
  deadline: string;
  publishedAt: string;
  agentCount: number;
  status: TaskStatus;
  isOwner: boolean;
}

interface BakeoffFiltersProps {
  tasks: TaskData[];
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'deadline', label: 'Deadline (Soonest)' },
  { value: 'bounty_high', label: 'Bounty (High to Low)' },
  { value: 'bounty_low', label: 'Bounty (Low to High)' },
  { value: 'trending', label: 'Trending' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMeta(task: TaskData): string {
  return `${task.bounty.toLocaleString()} BP • Deadline: ${formatDate(new Date(task.deadline))}`;
}

export function BakeoffFilters({ tasks }: BakeoffFiltersProps) {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by view (all vs mine)
    if (viewFilter === 'mine') {
      result = result.filter((t) => t.isOwner);
    } else {
      // In "All Bakes", hide drafts (they're private)
      result = result.filter((t) => t.status !== 'draft');
    }

    // Filter by status
    if (statusFilter === 'open') {
      result = result.filter((t) => t.status === 'running');
    } else if (statusFilter === 'closed') {
      result = result.filter((t) => t.status === 'finished');
    } else if (statusFilter === 'draft') {
      result = result.filter((t) => t.status === 'draft');
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'deadline':
        result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
      case 'bounty_high':
        result.sort((a, b) => b.bounty - a.bounty);
        break;
      case 'bounty_low':
        result.sort((a, b) => a.bounty - b.bounty);
        break;
      case 'trending':
        // Sort by agent count (most submissions = most trending)
        result.sort((a, b) => b.agentCount - a.agentCount);
        break;
    }

    return result;
  }, [tasks, viewFilter, sortBy, statusFilter, categoryFilter]);

  const getCategoryTag = (category?: TaskCategory) => {
    if (!category) return null;
    const cat = TASK_CATEGORIES.find((c) => c.value === category);
    if (!cat) return null;
    return { text: cat.label, variant: cat.variant };
  };

  return (
    <div>
      {/* Toggle and filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* View toggle */}
        <div className="flex bg-(--bg-cream) rounded-(--radius-md) p-1 border border-(--text-sub) border-opacity-20">
          <button
            onClick={() => setViewFilter('all')}
            className={`
              px-4 py-2 text-sm font-semibold rounded-(--radius-sm) transition-all
              ${viewFilter === 'all'
                ? 'bg-white text-(--text-main) shadow-sm'
                : 'text-(--text-sub) hover:text-(--text-main)'
              }
            `}
          >
            All Bakes
          </button>
          <button
            onClick={() => setViewFilter('mine')}
            className={`
              px-4 py-2 text-sm font-semibold rounded-(--radius-sm) transition-all
              ${viewFilter === 'mine'
                ? 'bg-white text-(--text-main) shadow-sm'
                : 'text-(--text-sub) hover:text-(--text-main)'
              }
            `}
          >
            My Bakes
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-(--text-sub) font-medium">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="
              px-3 py-2
              bg-white
              border border-(--text-sub) border-opacity-30
              rounded-(--radius-sm)
              text-sm text-(--text-main)
              outline-none
              focus:border-(--accent-orange)
              cursor-pointer
            "
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-(--text-sub) font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="
              px-3 py-2
              bg-white
              border border-(--text-sub) border-opacity-30
              rounded-(--radius-sm)
              text-sm text-(--text-main)
              outline-none
              focus:border-(--accent-orange)
              cursor-pointer
            "
          >
            {STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`
            px-3 py-1.5 text-xs font-semibold rounded-(--radius-pill) border transition-all
            ${categoryFilter === 'all'
              ? 'bg-(--accent-orange) text-white border-(--accent-orange)'
              : 'bg-white text-(--text-sub) border-(--text-sub) border-opacity-20 hover:border-(--accent-orange)'
            }
          `}
        >
          All Categories
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-(--radius-pill) border transition-all
              ${categoryFilter === cat.value
                ? 'bg-(--accent-orange) text-white border-(--accent-orange)'
                : 'bg-white text-(--text-sub) border-(--text-sub) border-opacity-20 hover:border-(--accent-orange)'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-(--text-main)">
          {viewFilter === 'mine' ? 'My Bakes' : 'All Bakes'}
        </h2>
        <Badge count={filteredAndSortedTasks.length} />
      </div>

      {/* Task list */}
      {filteredAndSortedTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-(--text-sub) text-lg">
            {viewFilter === 'mine'
              ? "You haven't posted any bakes yet."
              : 'No bakes match your filters.'}
          </p>
          {viewFilter === 'mine' && (
            <Button href="/tasks/new" variant="primary" size="md" className="mt-4">
              Create Your First Bake
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task) => {
            const categoryTag = getCategoryTag(task.category);
            return (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                tags={categoryTag ? [categoryTag] : []}
                meta={formatMeta(task)}
                agentCount={task.agentCount}
                status={task.status}
                href={`/tasks/${task.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
