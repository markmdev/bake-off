import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

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

const Button = ({ children, onClick, className = '', style = {} }) => (
  <button 
    className={className}
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

const CategoryChip = ({ children, active, onClick }) => (
  <div 
    className={`category-chip ${active ? 'active' : ''}`}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    {children}
  </div>
);

const CriteriaItem = ({ label, weight, checked, onChange }) => (
  <div className="criteria-item">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
    <span className={`tag ${checked ? 'purple' : ''}`} style={!checked ? { background: '#eee' } : {}}>
      {weight}
    </span>
  </div>
);

const Sidebar = ({ activeItem }) => (
  <nav className="sidebar">
    <Link to="/" className="logo">
      <div className="logo-mark"></div>
      <span>Bakeoff</span>
    </Link>
    
    <ul className="nav-list">
      <Link to="/" className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Dashboard</span>
      </Link>
      <Link to="/new-bakeoff" className={`nav-item ${activeItem === 'new-bakeoff' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
        <span>New Bakeoff</span>
      </Link>
      <Link to="/history" className={`nav-item ${activeItem === 'history' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>History</span>
      </Link>
      <Link to="/agents" className={`nav-item ${activeItem === 'agents' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
        <span>Agents</span>
      </Link>
    </ul>
  </nav>
);

const NewBakeoffPage = () => {
  const navigate = useNavigate();
  const [taskTitle, setTaskTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [agentLimit, setAgentLimit] = useState('3 Agents (Standard)');
  const [categories, setCategories] = useState({
    Legal: true,
    Coding: false,
    Finance: false,
    Analysis: true,
    Creative: false,
    Translation: false
  });
  const [criteria, setCriteria] = useState({
    accuracy: { checked: true, weight: '40%', label: 'Accuracy & Correctness' },
    speed: { checked: true, weight: '30%', label: 'Speed of Response' },
    creativity: { checked: false, weight: '20%', label: 'Creativity / Uniqueness' }
  });

  const toggleCategory = (category) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleCriteria = (key) => {
    setCriteria(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  const handleLaunch = () => {
    alert('Competition launched successfully!');
  };

  const selectedCategoriesCount = Object.values(categories).filter(Boolean).length;

  return (
    <>
      <div className="doodle-float blob-1"></div>
      <div className="doodle-float blob-2"></div>

      <div className="app-container">
        <Sidebar activeItem="new-bakeoff" />

        <main className="main-content">
          <div className="header-section">
            <div className="page-title">
              <Link to="/" className="back-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to dashboard
              </Link>
              <h1>Create a Bakeoff</h1>
              <p>Set the stage for your AI competition.</p>
            </div>
          </div>

          <div className="creation-grid">
            <div className="form-card">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Audit Smart Contract for Vulnerabilities"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Requirements & Context</label>
                <textarea 
                  className="input-field" 
                  placeholder="Describe what the agents need to do. Include any specific constraints or required outputs..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                ></textarea>
              </div>

              <div className="selection-row">
                <div className="form-group">
                  <label className="form-label">Budget Range (USD)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="$50 - $150"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Agent Limit</label>
                  <select 
                    className="input-field"
                    value={agentLimit}
                    onChange={(e) => setAgentLimit(e.target.value)}
                  >
                    <option>3 Agents (Standard)</option>
                    <option>5 Agents (Premium)</option>
                    <option>8 Agents (Extreme)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Agent Categories</label>
                <div className="category-chip-group">
                  {Object.entries(categories).map(([category, active]) => (
                    <CategoryChip 
                      key={category}
                      active={active}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </CategoryChip>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Evaluation Criteria 
                  <span>Weight</span>
                </label>
                <div className="criteria-list">
                  {Object.entries(criteria).map(([key, { checked, weight, label }]) => (
                    <CriteriaItem
                      key={key}
                      label={label}
                      weight={weight}
                      checked={checked}
                      onChange={() => toggleCriteria(key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="summary-sticky">
              <div className="preview-card">
                <div className="preview-title">Bakeoff Summary</div>
                <div className="preview-item">
                  <span style={{ color: 'rgba(26,43,60,0.6)' }}>Agents</span>
                  <span style={{ fontWeight: 700 }}>{selectedCategoriesCount} Selected</span>
                </div>
                <div className="preview-item">
                  <span style={{ color: 'rgba(26,43,60,0.6)' }}>Max Budget</span>
                  <span style={{ fontWeight: 700 }}>$150.00</span>
                </div>
                <div className="preview-item">
                  <span style={{ color: 'rgba(26,43,60,0.6)' }}>Timeline</span>
                  <span style={{ fontWeight: 700 }}>~ 45 mins</span>
                </div>
                <div className="preview-item" style={{ border: 'none', marginTop: '12px', fontSize: '18px' }}>
                  <span style={{ fontWeight: 700 }}>Total Estimate</span>
                  <span style={{ fontWeight: 900, color: 'var(--accent-orange)' }}>$156.40</span>
                </div>
                <p style={{ fontSize: '11px', marginTop: '8px', color: 'rgba(26,43,60,0.5)' }}>
                  *Includes platform fees and tax
                </p>
              </div>

              <button className="btn-primary" onClick={handleLaunch}>
                <span>Launch Competition</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
              
              <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-sub)', fontWeight: 500 }}>
                Draft saved 2 mins ago
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

const DashboardPage = () => (
  <div className="app-container">
    <Sidebar activeItem="dashboard" />
    <main className="main-content">
      <div className="header-section">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Welcome back to Bakeoff</p>
        </div>
      </div>
    </main>
  </div>
);

const HistoryPage = () => (
  <div className="app-container">
    <Sidebar activeItem="history" />
    <main className="main-content">
      <div className="header-section">
        <div className="page-title">
          <h1>History</h1>
          <p>View your past bakeoffs</p>
        </div>
      </div>
    </main>
  </div>
);

const AgentsPage = () => (
  <div className="app-container">
    <Sidebar activeItem="agents" />
    <main className="main-content">
      <div className="header-section">
        <div className="page-title">
          <h1>Agents</h1>
          <p>Manage your AI agents</p>
        </div>
      </div>
    </main>
  </div>
);

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --bg-cream: #F5F0E8;
        --surface-white: #C19A6B;
        --text-main: #3E2723;
        --text-sub: #1A2B3C;
        --accent-orange: #FF7F32;
        --accent-purple: #0047AB;
        --accent-purple-light: #D0E0FF;
        --accent-green: #2C5F2D;
        --accent-yellow: #B8860B;
        --accent-pink: #D946A0;
        --radius-lg: 24px;
        --radius-md: 16px;
        --radius-sm: 8px;
        --radius-pill: 999px;
        --border-thick: 2px solid #1A2B3C;
        --border-thin: 1px solid #1A2B3C;
        --shadow-hard: 4px 4px 0px #1A2B3C;
        --shadow-soft: 0px 4px 20px rgba(26,43,60,0.1);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Outfit', sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      body {
        background-color: var(--bg-cream);
        color: var(--text-main);
        min-height: 100vh;
        display: flex;
        overflow-x: hidden;
      }

      .app-container {
        display: grid;
        grid-template-columns: 260px 1fr;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
        height: 100vh;
      }

      .sidebar {
        padding: 32px;
        display: flex;
        flex-direction: column;
        border-right: var(--border-thick); 
        background: var(--bg-cream);
      }

      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 48px;
        display: flex;
        align-items: center;
        gap: 8px;
        letter-spacing: -0.5px;
        color: #1A2B3C;
        text-decoration: none;
      }

      .logo-mark {
        width: 24px;
        height: 24px;
        background: var(--accent-orange);
        border-radius: 50%;
        border: 2px solid var(--text-sub);
        position: relative;
      }
      
      .logo-mark::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        background: var(--accent-yellow);
        border-radius: 50%;
        top: -4px;
        right: -8px;
        border: 2px solid var(--text-sub);
      }

      .nav-list {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-weight: 600;
        color: var(--text-sub);
        transition: all 0.2s ease;
        text-decoration: none;
      }

      .nav-item.active {
        background: var(--accent-orange);
        color: white;
        border: var(--border-thick);
        box-shadow: 2px 2px 0px var(--text-sub); 
      }

      .main-content {
        padding: 40px 60px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 40px;
      }

      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .page-title h1 {
        font-size: 42px;
        font-weight: 700;
        line-height: 1.1;
        margin-bottom: 8px;
        color: var(--text-main);
      }

      .page-title p {
        color: var(--text-sub);
        font-size: 18px;
      }

      .creation-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 40px;
        align-items: start;
      }

      .form-card {
        background: white;
        border: var(--border-thick);
        border-radius: var(--radius-lg);
        padding: 40px;
        box-shadow: var(--shadow-hard);
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .form-label {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-main);
        display: flex;
        justify-content: space-between;
      }

      .input-field {
        padding: 16px;
        border-radius: var(--radius-md);
        border: var(--border-thin);
        font-size: 16px;
        outline: none;
        transition: border-color 0.2s;
      }

      .input-field:focus {
        border-color: var(--accent-orange);
        box-shadow: 0 0 0 4px rgba(255, 127, 50, 0.1);
      }

      textarea.input-field {
        min-height: 120px;
        resize: vertical;
      }

      .selection-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .category-chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .category-chip {
        padding: 10px 20px;
        border-radius: var(--radius-pill);
        border: var(--border-thin);
        background: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-chip.active {
        background: var(--accent-purple);
        color: white;
        border-color: var(--accent-purple);
      }

      .criteria-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .criteria-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--bg-cream);
        border-radius: var(--radius-md);
      }

      .summary-sticky {
        position: sticky;
        top: 40px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .preview-card {
        background: var(--accent-yellow);
        border: var(--border-thick);
        border-radius: var(--radius-lg);
        padding: 24px;
        box-shadow: 6px 6px 0px var(--text-sub);
      }

      .preview-title {
        font-weight: 700;
        font-size: 20px;
        margin-bottom: 16px;
        color: var(--text-sub);
      }

      .preview-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px dashed rgba(26,43,60,0.2);
      }

      .preview-item:last-child {
        border-bottom: none;
      }

      .btn-primary {
        background: var(--accent-orange);
        color: white;
        border: var(--border-thick);
        padding: 18px 32px;
        border-radius: var(--radius-pill);
        font-weight: 700;
        font-size: 18px;
        box-shadow: var(--shadow-hard);
        cursor: pointer;
        transition: transform 0.1s ease, box-shadow 0.1s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        width: 100%;
      }

      .btn-primary:active {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0px var(--text-sub);
      }

      .tag {
        padding: 6px 12px;
        border-radius: var(--radius-pill);
        font-size: 12px;
        font-weight: 600;
        border: 1px solid rgba(26,43,60,0.1);
      }
      
      .tag.purple { 
        background: var(--accent-purple-light); 
        color: var(--accent-purple); 
      }

      .doodle-float {
        position: fixed;
        z-index: -1;
        opacity: 0.15;
        pointer-events: none;
      }
      
      .blob-1 {
        width: 400px; 
        height: 400px;
        background: var(--accent-purple);
        border-radius: 40% 60% 70% 30%;
        top: -100px; 
        right: -100px;
      }
      
      .blob-2 {
        width: 300px; 
        height: 300px;
        background: var(--accent-orange);
        border-radius: 60% 40% 30% 70%;
        bottom: 50px; 
        left: 100px;
      }

      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--text-sub);
        font-weight: 600;
        text-decoration: none;
        margin-bottom: 16px;
      }
    `;
    document.head.appendChild(style);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    return () => {
      document.head.removeChild(style);
      document.head.removeChild(fontLink);
    };
  }, []);

  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/new-bakeoff" element={<NewBakeoffPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/agents" element={<AgentsPage />} />
      </Routes>
    </Router>
  );
};

export default App;