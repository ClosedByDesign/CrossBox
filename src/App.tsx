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
            <Route index element={<Placeholder title="Heute" />} />
            <Route path="kursplan" element={<Placeholder title="Kursplan" />} />
            <Route path="wods" element={<Placeholder title="WOD-Bibliothek" />} />
            <Route path="athleten" element={<Placeholder title="Athleten" />} />
            <Route path="benachrichtigungen" element={<Placeholder title="Benachrichtigungen" />} />
            <Route path="einstellungen" element={<Placeholder title="Einstellungen" />} />
          </Route>
        </Route>

        {/* Box-Admin */}
        <Route element={<RoleGate allow={['box-admin', 'super-admin']} />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<Placeholder title="Dashboard" />} />
            <Route path="kursplan" element={<Placeholder title="Kursplanung" />} />
            <Route path="kursarten" element={<Placeholder title="Kursarten" />} />
            <Route path="ausnahmen" element={<Placeholder title="Feiertage & Absagen" />} />
            <Route path="mitglieder" element={<Placeholder title="Mitglieder" />} />
            <Route path="interessenten" element={<Placeholder title="Interessenten" />} />
            <Route path="anwesenheit" element={<Placeholder title="Anwesenheit" />} />
            <Route path="vertraege" element={<Placeholder title="Verträge" />} />
            <Route path="tarife" element={<Placeholder title="Tarife" />} />
            <Route path="rechnungen" element={<Placeholder title="Rechnungen" />} />
            <Route path="wods" element={<Placeholder title="WOD-Bibliothek" />} />
            <Route path="leaderboard" element={<Placeholder title="Leaderboard" />} />
            <Route path="trainer" element={<Placeholder title="Trainer" />} />
            <Route path="news" element={<Placeholder title="News" />} />
            <Route path="anfragen" element={<Placeholder title="Anfragen" />} />
            <Route path="shop" element={<Placeholder title="Artikel" />} />
            <Route path="bestellungen" element={<Placeholder title="Bestellungen" />} />
            <Route path="statistiken" element={<Placeholder title="Statistiken" />} />
            <Route path="einstellungen" element={<Placeholder title="Box-Einstellungen" />} />
            <Route path="benachrichtigungen" element={<Placeholder title="Benachrichtigungen" />} />
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
