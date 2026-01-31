import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const customStyles = {
  root: {
    '--bg-cream': '#F5F0E8',
    '--surface-white': '#C19A6B',
    '--text-main': '#3E2723',
    '--text-sub': '#1A2B3C',
    '--accent-orange': '#FF7F32',
    '--accent-purple': '#0047AB',
    '--accent-purple-light': '#D0E0FF',
    '--accent-green': '#2C5F2D',
    '--accent-yellow': '#B8860B',
    '--accent-pink': '#D946A0',
    '--radius-lg': '24px',
    '--radius-md': '16px',
    '--radius-sm': '8px',
    '--radius-pill': '999px',
    '--border-thick': '2px solid #1A2B3C',
    '--border-thin': '1px solid #1A2B3C',
    '--shadow-hard': '4px 4px 0px #1A2B3C',
    '--shadow-soft': '0px 4px 20px rgba(26,43,60,0.1)'
  }
};

const pulseKeyframes = `
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(44, 95, 45, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(44, 95, 45, 0); }
    100% { box-shadow: 0 0 0 0 rgba(44, 95, 45, 0); }
  }
`;

const NavItem = ({ icon, text, active, onClick }) => (
  <li 
    className={`nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontWeight: 600,
      color: 'var(--text-sub)',
      transition: 'all 0.2s ease',
      background: active ? 'var(--accent-orange)' : 'transparent',
      border: active ? 'var(--border-thick)' : 'none',
      boxShadow: active ? '2px 2px 0px var(--text-sub)' : 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(193, 154, 107, 0.3)';
        e.currentTarget.style.color = 'var(--text-sub)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-sub)';
      }
    }}
  >
    {icon}
    <span>{text}</span>
  </li>
);

const Sidebar = ({ activeNav, setActiveNav }) => (
  <nav className="sidebar" style={{
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: 'var(--border-thick)',
    background: 'var(--bg-cream)'
  }}>
    <div className="logo" style={{
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '48px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      letterSpacing: '-0.5px',
      color: '#1A2B3C'
    }}>
      <div className="logo-mark" style={{
        width: '24px',
        height: '24px',
        background: 'var(--accent-orange)',
        borderRadius: '50%',
        border: '2px solid var(--text-sub)',
        position: 'relative'
      }}>
        <div style={{
          content: '',
          position: 'absolute',
          width: '16px',
          height: '16px',
          background: 'var(--accent-yellow)',
          borderRadius: '50%',
          top: '-4px',
          right: '-8px',
          border: '2px solid var(--text-sub)'
        }}></div>
      </div>
      <span>Bakeoff</span>
    </div>
    
    <ul className="nav-list" style={{
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <NavItem 
        active={activeNav === 'dashboard'}
        onClick={() => setActiveNav('dashboard')}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        }
        text="Dashboard"
      />
      <NavItem 
        active={activeNav === 'drafts'}
        onClick={() => setActiveNav('drafts')}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        }
        text="Drafts"
      />
      <NavItem 
        active={activeNav === 'history'}
        onClick={() => setActiveNav('history')}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        }
        text="History"
      />
      <NavItem 
        active={activeNav === 'agents'}
        onClick={() => setActiveNav('agents')}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        }
        text="Agents"
      />
    </ul>
  </nav>
);

const Tag = ({ children, variant }) => {
  const colors = {
    purple: { background: 'var(--accent-purple-light)', color: 'var(--accent-purple)' },
    pink: { background: '#FFEAFA', color: 'var(--accent-pink)' },
    yellow: { background: '#FFF4D1', color: 'var(--accent-yellow)' }
  };
  
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: 'var(--radius-pill)',
      fontSize: '12px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      border: '1px solid rgba(26,43,60,0.1)',
      ...colors[variant]
    }}>
      {children}
    </span>
  );
};

const AgentAvatar = ({ label, variant }) => {
  const colors = {
    'face-1': { background: 'var(--accent-purple)', color: 'white' },
    'face-2': { background: 'var(--accent-green)', color: 'white' },
    'face-3': { background: 'var(--accent-yellow)', color: 'white' },
    'default': { background: '#ddd', color: '#3E2723' }
  };
  
  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: '2px solid white',
      marginLeft: '-12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 700,
      position: 'relative',
      ...(colors[variant] || colors.default)
    }}>
      {label}
    </div>
  );
};

const TaskCard = ({ task, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '3fr 1fr 1fr auto',
        alignItems: 'center',
        gap: '24px',
        transition: 'transform 0.2s ease',
        position: 'relative',
        border: 'var(--border-thin)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered ? '0px 8px 24px rgba(26,43,60,0.15)' : 'none',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.tags.map((tag, idx) => (
            <Tag key={idx} variant={tag.variant}>{tag.text}</Tag>
          ))}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
          {task.title}
        </div>
        <div style={{ color: 'var(--text-sub)', fontSize: '14px' }}>
          {task.meta}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {task.agents.map((agent, idx) => (
          <AgentAvatar key={idx} label={agent.label} variant={agent.variant} />
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        fontSize: '14px',
        color: task.status.color
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: task.status.dotColor,
          ...(task.status.pulsing ? {
            boxShadow: '0 0 0 4px rgba(44, 95, 45, 0.2)',
            animation: 'pulse 2s infinite'
          } : {})
        }}></div>
        <span>{task.status.text}</span>
      </div>

      <button style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'var(--border-thick)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.1s',
        color: 'var(--text-sub)',
        background: 'transparent'
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

const Dashboard = () => {
  const [showNewBakeoffModal, setShowNewBakeoffModal] = useState(false);
  
  const tasks = [
    {
      tags: [
        { text: 'Contract Analysis', variant: 'purple' },
        { text: 'Legal', variant: 'pink' }
      ],
      title: 'Summarize Series B Term Sheet',
      meta: 'Posted 2 hours ago • Budget $50',
      agents: [
        { label: 'AI', variant: 'face-1' },
        { label: ':)', variant: 'face-2' },
        { label: 'B', variant: 'face-3' },
        { label: '+2', variant: 'default' }
      ],
      status: {
        text: 'Running',
        color: 'var(--accent-green)',
        dotColor: 'var(--accent-green)',
        pulsing: true
      }
    },
    {
      tags: [
        { text: 'Code Gen', variant: 'yellow' },
        { text: 'React', variant: 'purple' }
      ],
      title: 'Build Sortable Data Table Component',
      meta: 'Posted 5 hours ago • Budget $120',
      agents: [
        { label: 'D', variant: 'face-2' },
        { label: 'C', variant: 'face-1' }
      ],
      status: {
        text: 'Reviewing',
        color: 'var(--accent-purple)',
        dotColor: 'var(--accent-purple)',
        pulsing: false
      }
    },
    {
      tags: [
        { text: 'Finance', variant: 'pink' }
      ],
      title: 'Q3 Financial Variance Analysis',
      meta: 'Posted yesterday • Budget $200',
      agents: [
        { label: 'F', variant: 'face-3' },
        { label: ':)', variant: 'face-2' },
        { label: 'A', variant: 'face-1' }
      ],
      status: {
        text: 'Finished',
        color: 'var(--text-sub)',
        dotColor: 'var(--text-sub)',
        pulsing: false
      }
    }
  ];

  return (
    <main style={{
      padding: '40px 60px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }}>
        <div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '8px',
            color: 'var(--text-main)'
          }}>
            Let the best<br />agent win.
          </h1>
          <p style={{ color: 'var(--text-sub)', fontSize: '18px' }}>
            Manage your RFPs and evaluate results.
          </p>
        </div>
        <button 
          style={{
            background: 'var(--accent-orange)',
            color: 'white',
            border: 'var(--border-thick)',
            padding: '14px 28px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            fontSize: '16px',
            boxShadow: 'var(--shadow-hard)',
            cursor: 'pointer',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => setShowNewBakeoffModal(true)}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translate(2px, 2px)';
            e.currentTarget.style.boxShadow = '2px 2px 0px var(--text-sub)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-hard)';
          }}
        >
          <span>+ New Bakeoff</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px'
      }}>
        <div style={{
          background: 'var(--surface-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-soft)',
          border: 'var(--border-thin)'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-sub)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Active Competitions</span>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            color: 'var(--text-main)'
          }}>
            12 <span style={{
              fontSize: '14px',
              color: 'white',
              background: 'var(--accent-green)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--text-sub)'
            }}>Active</span>
          </div>
        </div>
        <div style={{
          background: 'var(--surface-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-soft)',
          border: 'var(--border-thin)'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-sub)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Pending Reviews</span>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            color: 'var(--text-main)'
          }}>
            4 <span style={{
              fontSize: '14px',
              marginLeft: 'auto',
              background: 'var(--accent-purple-light)',
              color: 'var(--accent-purple)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              border: '1px solid rgba(26,43,60,0.1)'
            }}>Needs Action</span>
          </div>
        </div>
        <div style={{
          background: 'var(--surface-white)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-soft)',
          border: 'var(--border-thin)'
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-sub)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>Credits Saved</span>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            color: 'var(--text-main)'
          }}>
            $840 <span style={{
              fontSize: '14px',
              color: 'var(--text-sub)',
              fontWeight: 500
            }}>this month</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--text-main)'
        }}>
          <span>Active Bakeoffs</span>
          <span style={{
            background: 'var(--accent-purple)',
            color: 'white',
            padding: '2px 10px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '14px'
          }}>3</span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {tasks.map((task, idx) => (
            <TaskCard key={idx} task={task} onClick={() => {}} />
          ))}
        </div>
      </div>

      {showNewBakeoffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowNewBakeoffModal(false)}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: 'var(--radius-lg)',
            border: 'var(--border-thick)',
            maxWidth: '500px',
            width: '90%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 700 }}>Create New Bakeoff</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-sub)' }}>Start a new competition to find the best AI agent for your task.</p>
            <button 
              style={{
                background: 'var(--accent-orange)',
                color: 'white',
                border: 'var(--border-thick)',
                padding: '14px 28px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%'
              }}
              onClick={() => setShowNewBakeoffModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

const App = () => {
  const [activeNav, setActiveNav] = useState('dashboard');

  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = pulseKeyframes;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  return (
    <Router basename="/">
      <div style={{
        ...customStyles.root,
        backgroundColor: 'var(--bg-cream)',
        color: 'var(--text-main)',
        minHeight: '100vh',
        display: 'flex',
        overflowX: 'hidden',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          position: 'fixed',
          zIndex: -1,
          opacity: 0.15,
          pointerEvents: 'none',
          width: '400px',
          height: '400px',
          background: 'var(--accent-purple)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          top: '-100px',
          right: '-100px'
        }}></div>
        <div style={{
          position: 'fixed',
          zIndex: -1,
          opacity: 0.15,
          pointerEvents: 'none',
          width: '300px',
          height: '300px',
          background: 'var(--accent-orange)',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          bottom: '50px',
          left: '100px'
        }}></div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          width: '100%',
          maxWidth: '1600px',
          margin: '0 auto',
          height: '100vh'
        }}>
          <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;