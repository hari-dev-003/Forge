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
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />

            <Route element={<ProtectedRoute roles={[ROLES.USER]} />}>
              <Route path="submit" element={<SubmitMeetingPage />} />
              <Route path="meetings" element={<MyMeetingsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.MANAGER, ROLES.ADMIN]} />}>
              <Route path="review" element={<ReviewQueuePage />} />
              <Route path="team" element={<TeamPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route path="config" element={<PointsConfigPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
