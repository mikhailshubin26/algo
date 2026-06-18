import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import CreateProblemPage from "./pages/CreateProblemPage";
import CreateRoadmapPage from "./pages/CreateRoadmapPage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import ProblemsPage from "./pages/ProblemsPage";
import RegisterPage from "./pages/RegisterPage";
import RoadmapDetailPage from "./pages/RoadmapDetailPage";
import RoadmapsPage from "./pages/RoadmapsPage";
import TournamentsPage from "./pages/TournamentsPage";

const App = () => (
  <>
    <Navbar />
    <main className="container">
      <Routes>
        <Route path="/" element={<ProblemsPage />} />
        <Route path="/problems/new" element={<CreateProblemPage />} />
        <Route path="/problems/:id" element={<ProblemDetailPage />} />
        <Route path="/roadmaps" element={<RoadmapsPage />} />
        <Route path="/roadmaps/new" element={<CreateRoadmapPage />} />
        <Route path="/roadmaps/:id" element={<RoadmapDetailPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </main>
  </>
);

export default App;
