import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CalendarDays, Dumbbell, LineChart, ListChecks, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useApp } from './lib/app';
import { configured } from './lib/supabase';
import { Loading } from './components/ui';
import AuthPage, { NewPassword } from './pages/Auth';
import Welcome from './pages/Welcome';
import Today from './pages/Today';
import Workout from './pages/Workout';
import Plans from './pages/Plans';
import PlanEdit from './pages/PlanEdit';
import Library from './pages/Library';
import ExerciseDetail from './pages/ExerciseDetail';
import Progress from './pages/Progress';
import SessionDetail from './pages/SessionDetail';
import ProfilePage from './pages/Profile';

function Mark() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden>
      <rect x="2" y="30" width="60" height="4" rx="1" fill="var(--chalk-2)" />
      <rect x="12" y="12" width="8" height="40" rx="2" fill="var(--plate-25)" />
      <rect x="21" y="17" width="6" height="30" rx="2" fill="var(--plate-20)" />
      <rect x="44" y="12" width="8" height="40" rx="2" fill="var(--plate-25)" />
      <rect x="37" y="17" width="6" height="30" rx="2" fill="var(--plate-20)" />
    </svg>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <NavLink to="/" className="brand" end>
          <Mark /> Overload
        </NavLink>
        <NavLink to="/" end>
          <CalendarDays aria-hidden /> Today
        </NavLink>
        <NavLink to="/plans">
          <ListChecks aria-hidden /> Plans
        </NavLink>
        <NavLink to="/exercises">
          <Dumbbell aria-hidden /> Exercises
        </NavLink>
        <NavLink to="/progress">
          <LineChart aria-hidden /> Progress
        </NavLink>
        <NavLink to="/profile">
          <UserRound aria-hidden /> Profile
        </NavLink>
      </nav>
      <main className={`main${wide ? ' wide' : ''}`}>{children}</main>
    </div>
  );
}

export default function App() {
  const { user, profile, ready, recovering } = useApp();
  const loc = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  if (!configured) {
    return (
      <div className="main">
        <h1 className="t-title">Setup needed</h1>
        <p className="muted" style={{ marginTop: 12 }}>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.</p>
      </div>
    );
  }
  if (!ready) return <div className="main"><Loading /></div>;
  if (recovering && user) return <NewPassword />;
  if (!user) return <AuthPage />;
  if (!profile) return <div className="main"><Loading label="Setting up your profile" /></div>;
  if (!profile.onboarded) return <Welcome />;

  return (
    <Shell wide={loc.pathname.startsWith('/progress')}>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/workout/:id" element={<Workout />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/plans/:id" element={<PlanEdit />} />
        <Route path="/exercises" element={<Library />} />
        <Route path="/exercises/:id" element={<ExerciseDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/history/:id" element={<SessionDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
