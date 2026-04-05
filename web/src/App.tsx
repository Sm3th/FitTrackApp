import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import WorkoutFAB from './components/WorkoutFAB';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import OnboardingGate from './components/OnboardingGate';
import PageTransition from './components/PageTransition';
import { useScrollToTop } from './hooks/useScrollToTop';

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Loading…</p>
    </div>
  </div>
);

// Lazy-loaded pages — each becomes its own JS chunk
const HomePage               = lazy(() => import('./pages/HomePage'));
const LoginPage              = lazy(() => import('./pages/LoginPage'));
const RegisterPage           = lazy(() => import('./pages/RegisterPage'));
const WorkoutPage            = lazy(() => import('./pages/WorkoutPage'));
const WorkoutHistoryPage     = lazy(() => import('./pages/WorkoutHistoryPage'));
const ProfilePage            = lazy(() => import('./pages/ProfilePage'));
const WorkoutPlansPage       = lazy(() => import('./pages/WorkoutPlansPage'));
const PlanDetailPage         = lazy(() => import('./pages/PlanDetailPage'));
const GuidedWorkoutPage      = lazy(() => import('./pages/GuidedWorkoutPage'));
const StatsPage              = lazy(() => import('./pages/StatsPage'));
const AchievementsPage       = lazy(() => import('./pages/AchievementsPage'));
const ProgressPhotosPage     = lazy(() => import('./pages/ProgressPhotosPage'));
const LeaderboardPage        = lazy(() => import('./pages/LeaderboardPage'));
const WorkoutCalendarPage    = lazy(() => import('./pages/WorkoutCalendarPage'));
const BodyMeasurementsPage   = lazy(() => import('./pages/BodyMeasurementsPage'));
const WaterIntakePage        = lazy(() => import('./pages/WaterIntakePage'));
const WorkoutTemplatesPage   = lazy(() => import('./pages/WorkoutTemplatesPage'));
const CalculatorsPage        = lazy(() => import('./pages/CalculatorsPage'));
const DailyChallengesPage    = lazy(() => import('./pages/DailyChallengesPage'));
const ExerciseLibraryPage    = lazy(() => import('./pages/ExerciseLibraryPage'));
const WorkoutTipsPage        = lazy(() => import('./pages/WorkoutTipsPage'));
const WorkoutRemindersPage   = lazy(() => import('./pages/WorkoutRemindersPage'));
const NutritionPage          = lazy(() => import('./pages/NutritionPage'));
const NotFoundPage           = lazy(() => import('./pages/NotFoundPage'));

function AppInner() {
  useScrollToTop();
  return null;
}

function App() {
  return (
    <Router>
      <AppInner />
      {/* Bottom padding on mobile to avoid BottomNav overlap */}
      <div className="pb-16 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <PageTransition>
          <Routes>
            <Route path="/"                    element={<HomePage />} />
            <Route path="/login"               element={<LoginPage />} />
            <Route path="/register"            element={<RegisterPage />} />
            <Route path="/workout"             element={<WorkoutPage />} />
            <Route path="/workout-history"     element={<WorkoutHistoryPage />} />
            <Route path="/profile"             element={<ProfilePage />} />
            <Route path="/workout-plans"       element={<WorkoutPlansPage />} />
            <Route path="/workout-plans/:planId" element={<PlanDetailPage />} />
            <Route path="/guided-workout/:planId" element={<GuidedWorkoutPage />} />
            <Route path="/stats"              element={<StatsPage />} />
            <Route path="/progress-photos"    element={<ProgressPhotosPage />} />
            <Route path="/achievements"       element={<AchievementsPage />} />
            <Route path="/leaderboard"        element={<LeaderboardPage />} />
            <Route path="/calendar"           element={<WorkoutCalendarPage />} />
            <Route path="/measurements"       element={<BodyMeasurementsPage />} />
            <Route path="/water"              element={<WaterIntakePage />} />
            <Route path="/templates"          element={<WorkoutTemplatesPage />} />
            <Route path="/calculators"        element={<CalculatorsPage />} />
            <Route path="/challenges"         element={<DailyChallengesPage />} />
            <Route path="/exercise-library"   element={<ExerciseLibraryPage />} />
            <Route path="/tips"               element={<WorkoutTipsPage />} />
            <Route path="/reminders"          element={<WorkoutRemindersPage />} />
            <Route path="/nutrition"          element={<NutritionPage />} />
            <Route path="*"                   element={<NotFoundPage />} />
          </Routes>
          </PageTransition>
        </Suspense>
      </div>

      {/* Mobile bottom navigation — hidden on desktop */}
      <BottomNav />

      {/* Mobile floating action button */}
      <WorkoutFAB />

      {/* Onboarding wizard — shown once after first login */}
      <OnboardingGate />

      {/* Global PWA & connectivity */}
      <OfflineBanner />
      <InstallPrompt />
    </Router>
  );
}

export default App;
