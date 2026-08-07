import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ToastProvider } from "@/components/ui/Toast";
import { AdForm } from "@/pages/Ads/Form";
import { AdsList } from "@/pages/Ads/List";
import { CategoriesList } from "@/pages/Categories/List";
import { Dashboard } from "@/pages/Dashboard";
import { FilesManager } from "@/pages/Files/FilesManager";
import { Login } from "@/pages/Login";
import { MediaMonitor } from "@/pages/Media/Monitor";
import { ProgramsList } from "@/pages/Programs/List";
import { StoryForm } from "@/pages/Stories/Form";
import { StoriesList } from "@/pages/Stories/List";
import { VocabularyManager } from "@/pages/Vocabulary/Manager";
import { UserDetailPage } from "@/pages/Users/Detail";
import { UsersList } from "@/pages/Users/List";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stories" element={<StoriesList />} />
            <Route path="/stories/new" element={<StoryForm />} />
            <Route path="/stories/:id" element={<StoryForm />} />
            <Route path="/stories/:id/vocabulary" element={<VocabularyManager />} />
            <Route path="/categories" element={<CategoriesList />} />
            <Route path="/programs" element={<ProgramsList />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/ads" element={<AdsList />} />
            <Route path="/ads/new" element={<AdForm />} />
            <Route path="/ads/:id" element={<AdForm />} />
            <Route path="/media" element={<MediaMonitor />} />
            <Route path="/files" element={<FilesManager />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
