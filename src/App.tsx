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
            <Route path="buchungen" element={<Placeholder title="Meine Buchungen" />} />
            <Route path="checkin" element={<Placeholder title="Check-in" />} />
            <Route path="wods" element={<Placeholder title="WODs" />} />
            <Route path="ergebnisse" element={<Placeholder title="Meine Ergebnisse" />} />
            <Route path="rekorde" element={<Placeholder title="Persönliche Rekorde" />} />
            <Route path="leaderboard" element={<Placeholder title="Leaderboard" />} />
            <Route path="mitgliedschaft" element={<Placeholder title="Mitgliedschaft" />} />
            <Route path="rechnungen" element={<Placeholder title="Rechnungen" />} />
            <Route path="shop" element={<Placeholder title="Shop" />} />
            <Route path="bestellungen" element={<Placeholder title="Bestellungen" />} />
            <Route path="news" element={<Placeholder title="News" />} />
            <Route path="benachrichtigungen" element={<Placeholder title="Benachrichtigungen" />} />
            <Route path="profil" element={<Placeholder title="Profil" />} />
            <Route path="einstellungen" element={<Placeholder title="Einstellungen" />} />
            <Route path="hilfe" element={<Placeholder title="Hilfe" />} />
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

        <Route path="*" element={<NotFound />} />
      </Routes>

      <DemoBar />
      <Toaster />
    </HashRouter>
  );
}
