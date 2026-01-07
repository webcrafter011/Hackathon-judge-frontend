import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './components/layouts/AuthLayout';
import MainLayout from './components/layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage
} from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import {
  HackathonsPage,
  HackathonDetailPage,
  HackathonFormPage,
  MyHackathonsPage
} from './pages/hackathons';
import {
  MyTeamsPage,
  TeamDetailPage,
  CreateTeamPage
} from './pages/teams';
import {
  AssignmentManagementPage,
  MyEvaluationsPage,
  JudgeManagementPage
} from './pages/assignments';
import { EvaluationPage, CriteriaManagementPage } from './pages/evaluations';
import {
  MySubmissionsPage,
  SubmissionFormPage,
  SubmissionDetailPage,
  HackathonSubmissionsPage
} from './pages/submissions';
import { LeaderboardPage } from './pages/leaderboard';
import { ProfilePage } from './pages/profile';
import { UserProfilePage } from './pages/users';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Routes with Main Layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Hackathons */}
          <Route path="/hackathons" element={<HackathonsPage />} />
          <Route path="/hackathons/create" element={<HackathonFormPage />} />
          <Route path="/hackathons/:idOrSlug" element={<HackathonDetailPage />} />
          <Route path="/hackathons/:id/edit" element={<HackathonFormPage />} />

          {/* My Hackathons (Organizers) */}
          <Route path="/my/hackathons" element={<MyHackathonsPage />} />

          {/* Teams */}
          <Route path="/teams/create" element={<CreateTeamPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          <Route path="/my/teams" element={<MyTeamsPage />} />

          {/* Assignments */}
          <Route path="/hackathons/:hackathonId/assignments" element={<AssignmentManagementPage />} />
          <Route path="/hackathons/:hackathonId/judges" element={<JudgeManagementPage />} />
          <Route path="/my/evaluations" element={<MyEvaluationsPage />} />

          {/* Evaluations */}
          <Route path="/hackathons/:hackathonId/evaluate" element={<EvaluationPage />} />
          <Route path="/hackathons/:hackathonId/criteria" element={<CriteriaManagementPage />} />

          {/* Leaderboard */}
          <Route path="/hackathons/:hackathonId/leaderboard" element={<LeaderboardPage />} />

          {/* Submissions */}
          <Route path="/my/submissions" element={<MySubmissionsPage />} />
          <Route path="/submissions/:hackathonId/edit" element={<SubmissionFormPage />} />
          <Route path="/submissions/:submissionId" element={<SubmissionDetailPage />} />
          <Route path="/hackathons/:hackathonId/submissions" element={<HackathonSubmissionsPage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Publicly Accessible Routes with Main Layout but NO ProtectedRoute wrapper */}
        <Route element={<MainLayout />}>
          <Route path="/users/:userId" element={<UserProfilePage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
