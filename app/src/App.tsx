import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireChild } from "@/components/RequireChild/RequireChild";
import { useTranslation } from "@/i18n/useTranslation";
import { Dashboard } from "@/pages/Dashboard/Dashboard";
import { Home } from "@/pages/Home/Home";
import { Onboarding } from "@/pages/Onboarding/Onboarding";
import { Player } from "@/pages/Player/Player";
import { Profile } from "@/pages/Profile/Profile";
import { ProgramExplore } from "@/pages/ProgramExplore/ProgramExplore";
import { SelectChild } from "@/pages/SelectChild/SelectChild";
import { Settings } from "@/pages/Settings/Settings";
import { Splash } from "@/pages/Splash/Splash";
import { Upgrade } from "@/pages/Upgrade/Upgrade";
import { UpdateToast } from "@/components/UpdateToast/UpdateToast";

/** Keeps `<html lang>` in sync with the resolved UI language (per-profile, see useTranslation) -
 * index.html's `lang="vi"` is just the pre-hydration default. */
function LanguageSync() {
  const { language } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}

function App() {
  return (
    <HashRouter>
      <LanguageSync />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/select-child" element={<SelectChild />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route element={<RequireChild />}>
          <Route path="/home" element={<Home />} />
          <Route path="/program/:programId" element={<ProgramExplore />} />
          <Route path="/story/:id" element={<Player />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdateToast />
    </HashRouter>
  );
}

export default App;
