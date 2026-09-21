import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DemoBar } from './components/layout/DemoBar';
import { ThemeManager } from './components/layout/ThemeToggle';
import { Toaster } from './components/ui/Toast';
import { RoleGate } from './routes/RoleGate';
import { NotFound, Placeholder } from './pages/system/Placeholder';

import MemberDashboard from './pages/member/Dashboard';
import MemberSchedule from './pages/member/Schedule';
import MemberSessionDetail from './pages/member/SessionDetail';
import MyBookings from './pages/member/MyBookings';
import CheckIn from './pages/member/CheckIn';
import Leaderboard from './pages/member/Leaderboard';
import Records, { RecordDetail } from './pages/member/Records';
import Results from './pages/member/Results';
import WodLibrary from './pages/member/WodLibrary';
import Shop, { ArticleDetail, Cart, Checkout, Orders } from './pages/member/Shop';
import Membership, { Invoices } from './pages/member/Membership';
import { Help, News, NewsDetail, Notifications, Profile, Settings } from './pages/member/Account';
import {
  CoachAthleteDetail,
  CoachAthletes,
  CoachDashboard,
  CoachSchedule,
  CoachSessionDetail,
} from './pages/coach/CoachPages';
import AdminDashboard from './pages/admin/AdminDashboard';
import { AdminCourseTypeEdit, AdminCourseTypes, AdminExceptions, AdminSchedule } from './pages/admin/AdminSchedule';
import { AdminAttendance, AdminLeads, AdminMemberDetail, AdminMembers } from './pages/admin/AdminMembers';
import {
  AdminCoaches,
  AdminContracts,
  AdminInvoices,
  AdminLeaderboard,
  AdminOrders,
  AdminPlans,
  AdminShop,
} from './pages/admin/AdminBusiness';
import { AdminNews, AdminNewsEdit, AdminRequests } from './pages/admin/AdminContent';
import AdminStats from './pages/admin/AdminStats';
import AdminSettings from './pages/admin/AdminSettings';
import { TvDaySchedule, TvLauncher, TvLeaderboard, TvSession, TvTimer } from './pages/tv/TvViews';
import Kiosk from './pages/tv/Kiosk';

export default function App() {
  return (
    <HashRouter>
      <ThemeManager />
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Mitglieder */}
        <Route element={<RoleGate allow={['member', 'coach', 'box-admin', 'super-admin']} />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<MemberDashboard />} />
            <Route path="kursplan" element={<MemberSchedule />} />
            <Route path="kurs/:sessionId" element={<MemberSessionDetail />} />
            <Route path="buchungen" element={<MyBookings />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="wods" element={<WodLibrary />} />
            <Route path="ergebnisse" element={<Results />} />
            <Route path="rekorde" element={<Records />} />
            <Route path="rekorde/:liftId" element={<RecordDetail />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="mitgliedschaft" element={<Membership />} />
            <Route path="rechnungen" element={<Invoices />} />
            <Route path="shop" element={<Shop />} />
            <Route path="shop/:articleId" element={<ArticleDetail />} />
            <Route path="warenkorb" element={<Cart />} />
            <Route path="kasse" element={<Checkout />} />
            <Route path="bestellungen" element={<Orders />} />
            <Route path="news" element={<News />} />
            <Route path="news/:newsId" element={<NewsDetail />} />
            <Route path="benachrichtigungen" element={<Notifications />} />
            <Route path="profil" element={<Profile />} />
            <Route path="einstellungen" element={<Settings />} />
            <Route path="hilfe" element={<Help />} />
          </Route>
        </Route>

        {/* Trainer */}
        <Route element={<RoleGate allow={['coach', 'box-admin', 'super-admin']} />}>
          <Route path="/coach" element={<AppShell />}>
            <Route index element={<CoachDashboard />} />
            <Route path="kursplan" element={<CoachSchedule />} />
            <Route path="kurs/:sessionId" element={<CoachSessionDetail />} />
            <Route path="wods" element={<WodLibrary />} />
            <Route path="athleten" element={<CoachAthletes />} />
            <Route path="athleten/:athleteId" element={<CoachAthleteDetail />} />
            <Route path="benachrichtigungen" element={<Notifications />} />
            <Route path="einstellungen" element={<Settings />} />
          </Route>
        </Route>

        {/* Box-Admin */}
        <Route element={<RoleGate allow={['box-admin', 'super-admin']} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<AdminDashboard />} />
            <Route path="kursplan" element={<AdminSchedule />} />
            <Route path="kurs/:sessionId" element={<CoachSessionDetail basePath="/admin" />} />
            <Route path="kursarten" element={<AdminCourseTypes />} />
            <Route path="kursarten/:templateId" element={<AdminCourseTypeEdit />} />
            <Route path="ausnahmen" element={<AdminExceptions />} />
            <Route path="mitglieder" element={<AdminMembers />} />
            <Route path="mitglieder/:memberId" element={<AdminMemberDetail />} />
            <Route path="interessenten" element={<AdminLeads />} />
            <Route path="anwesenheit" element={<AdminAttendance />} />
            <Route path="vertraege" element={<AdminContracts />} />
            <Route path="tarife" element={<AdminPlans />} />
            <Route path="rechnungen" element={<AdminInvoices />} />
            <Route path="wods" element={<WodLibrary />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="trainer" element={<AdminCoaches />} />
            <Route path="athleten/:athleteId" element={<CoachAthleteDetail basePath="/admin" />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="news/:newsId" element={<AdminNewsEdit />} />
            <Route path="anfragen" element={<AdminRequests />} />
            <Route path="shop" element={<AdminShop />} />
            <Route path="bestellungen" element={<AdminOrders />} />
            <Route path="statistiken" element={<AdminStats />} />
            <Route path="einstellungen" element={<AdminSettings />} />
            <Route path="benachrichtigungen" element={<Notifications />} />
          </Route>
        </Route>

        {/* Plattform */}
        <Route element={<RoleGate allow={['super-admin']} />}>
          <Route path="/platform" element={<AppShell />}>
            <Route index element={<Placeholder title="Plattform-Dashboard" />} />
            <Route path="mandanten" element={<Placeholder title="Mandanten" />} />
            <Route path="abrechnung" element={<Placeholder title="Abrechnung" />} />
            <Route path="tarife" element={<Placeholder title="Plattform-Tarife" />} />
            <Route path="statistiken" element={<Placeholder title="Statistiken" />} />
            <Route path="support" element={<Placeholder title="Support" />} />
            <Route path="features" element={<Placeholder title="Features" />} />
            <Route path="einstellungen" element={<Placeholder title="Einstellungen" />} />
            <Route path="benachrichtigungen" element={<Placeholder title="Benachrichtigungen" />} />
          </Route>
        </Route>

        {/* Beamer und Kiosk – ohne Anmeldung, ohne App-Navigation */}
        <Route path="/tv" element={<TvLauncher />} />
        <Route path="/tv/kurs/:sessionId" element={<TvSession />} />
        <Route path="/tv/timer" element={<TvTimer />} />
        <Route path="/tv/leaderboard" element={<TvLeaderboard />} />
        <Route path="/tv/kursplan" element={<TvDaySchedule />} />
        <Route path="/kiosk" element={<Kiosk />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

      <DemoBar />
      <Toaster />
    </HashRouter>
  );
}
