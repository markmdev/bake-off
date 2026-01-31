import { AgentAvatar } from './AgentAvatar';

interface Agent {
  label: string;
  variant?: 'purple' | 'green' | 'yellow' | 'default';
}

interface AgentStackProps {
  agents: Agent[];
  max?: number;
  className?: string;
}

export function AgentStack({ agents, max = 4, className = '' }: AgentStackProps) {
  const visibleAgents = agents.slice(0, max);
  const remaining = agents.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAgents.map((agent, idx) => (
        <AgentAvatar
          key={idx}
          label={agent.label}
          variant={agent.variant}
          className={idx > 0 ? '-ml-3' : ''}
        />
      ))}
      {remaining > 0 && (
        <AgentAvatar
          label={`+${remaining}`}
          variant="default"
          className="-ml-3"
        />
      )}
    </div>
  );
}
