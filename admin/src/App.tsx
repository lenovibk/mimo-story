import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AdForm } from "@/pages/Ads/Form";
import { AdsList } from "@/pages/Ads/List";
import { CategoriesList } from "@/pages/Categories/List";
import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { ProgramsList } from "@/pages/Programs/List";
import { StoryForm } from "@/pages/Stories/Form";
import { StoriesList } from "@/pages/Stories/List";
import { UserDetailPage } from "@/pages/Users/Detail";
import { UsersList } from "@/pages/Users/List";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stories" element={<StoriesList />} />
          <Route path="/stories/new" element={<StoryForm />} />
          <Route path="/stories/:id" element={<StoryForm />} />
          <Route path="/categories" element={<CategoriesList />} />
          <Route path="/programs" element={<ProgramsList />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/ads" element={<AdsList />} />
          <Route path="/ads/new" element={<AdForm />} />
          <Route path="/ads/:id" element={<AdForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
