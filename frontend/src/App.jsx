import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMe } from './features/auth/authSlice.js';
import { ROLES } from './constants.js';

import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import Toaster from './components/Toaster.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SubmitMeetingPage from './pages/SubmitMeetingPage.jsx';
import MyMeetingsPage from './pages/MyMeetingsPage.jsx';
import ReviewQueuePage from './pages/ReviewQueuePage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import PointsConfigPage from './pages/PointsConfigPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import ManagerTeamPage from './pages/ManagerTeamPage.jsx';
import SubmissionsPage from './pages/SubmissionsPage.jsx';
import SubmissionDetailPage from './pages/SubmissionDetailPage.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import AnnouncementDetailPage from './pages/AnnouncementDetailPage.jsx';
import AnnouncementAdminPage from './pages/AnnouncementAdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  // Restore session from a stored token on first load.
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="announcements/:id" element={<AnnouncementDetailPage />} />

            <Route element={<ProtectedRoute roles={[ROLES.USER]} />}>
              <Route path="submit" element={<SubmitMeetingPage />} />
              <Route path="meetings" element={<MyMeetingsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.MANAGER, ROLES.ADMIN]} />}>
              <Route path="review" element={<ReviewQueuePage />} />
              <Route path="submissions" element={<SubmissionsPage />} />
              <Route path="submissions/:id" element={<SubmissionDetailPage />} />
              <Route path="team" element={<TeamPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route path="config" element={<PointsConfigPage />} />
              <Route path="audit" element={<AuditLogPage />} />
              <Route path="announcements/manage" element={<AnnouncementAdminPage />} />
              {/* Drill-down into one manager's executives — admin only. */}
              <Route path="team/:managerId" element={<ManagerTeamPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
