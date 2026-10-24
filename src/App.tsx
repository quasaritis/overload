import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CalendarDays, Dumbbell, LineChart, ListChecks, UserRound, Utensils } from 'lucide-react';
import { Suspense, lazy, useEffect } from 'react';
import { useApp } from './lib/app';
import { configured } from './lib/supabase';
import { Brandmark, Loading } from './components/ui';
import AuthPage, { NewPassword } from './pages/Auth';
import Welcome from './pages/Welcome';
import Today from './pages/Today';

// Everything past the landing page loads on first visit, so the app opens faster.
const Workout = lazy(() => import('./pages/Workout'));
const Food = lazy(() => import('./pages/Food'));
const Plans = lazy(() => import('./pages/Plans'));
const PlanEdit = lazy(() => import('./pages/PlanEdit'));
const Library = lazy(() => import('./pages/Library'));
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail'));
const Progress = lazy(() => import('./pages/Progress'));
const SessionDetail = lazy(() => import('./pages/SessionDetail'));
const ProfilePage = lazy(() => import('./pages/Profile'));

function Shell({ children, wide, focus }: { children: React.ReactNode; wide?: boolean; focus?: boolean }) {
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <Brandmark className="brand" />
        <NavLink to="/" end>
          <CalendarDays aria-hidden /> Today
        </NavLink>
        <NavLink to="/food">
          <Utensils aria-hidden /> Food
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
      <main className={`main${wide ? ' wide' : ''}`}>
        {!focus && <header className="appbar"><Brandmark /></header>}
        {children}
      </main>
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
    <Shell wide={loc.pathname.startsWith('/progress')} focus={loc.pathname.startsWith('/workout')}>
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/food" element={<Food />} />
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
      </Suspense>
    </Shell>
  );
}
