import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import StudentDashboard from "./pages/student/Dashboard.tsx";
import StudentProblems from "./pages/student/Problems.tsx";
import ProblemDetail from "./pages/student/ProblemDetail.tsx";
import StudentLeaderboard from "./pages/student/Leaderboard.tsx";
import StudentProfile from "./pages/student/Profile.tsx";
import FacultyDashboard from "./pages/faculty/Dashboard.tsx";
import CreateProblem from "./pages/faculty/CreateProblem.tsx";
import ManageProblems from "./pages/faculty/ManageProblems.tsx";
import ProblemDetails from "./pages/faculty/ProblemDetails.tsx";
import EditProblem from "./pages/faculty/EditProblem.tsx";
import FacultySubmissions from "./pages/faculty/Submissions.tsx";
import FacultyLeaderboard from "./pages/faculty/Leaderboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/problems" element={<StudentProblems />} />
            <Route path="/student/problems/:id" element={<ProblemDetail />} />
            <Route path="/student/leaderboard" element={<StudentLeaderboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/create-problem" element={<CreateProblem />} />
            <Route path="/faculty/problems" element={<ManageProblems />} />
            <Route path="/faculty/problems/:id" element={<ProblemDetails />} />
            <Route path="/faculty/problems/:id/edit" element={<EditProblem />} />
            <Route path="/faculty/submissions" element={<FacultySubmissions />} />
            <Route path="/faculty/leaderboard" element={<FacultyLeaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
