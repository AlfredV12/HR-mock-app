// src/App.tsx
import {
  createBrowserRouter,
  NavLink, // Use NavLink for active styling
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { JobDetailPage } from "./features/jobs/JobDetailPage";

// Import all the page components
import { JobsBoard } from "./features/jobs/JobsBoard";
import { CandidateList } from './features/candidates/CandidateList';
import { CandidateKanbanBoard } from './features/candidates/CandidateKanbanBoard';
import { AssessmentBuilder } from './features/assessments/AssessmentBuilder';

// A shared layout component with a sidebar navigation
function RootLayout() {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <h1>HR Portal</h1>
        <nav>
          {/* NavLink automatically adds an 'active' class */}
          <NavLink to="/">💼 Jobs Board</NavLink>
          <NavLink to="/candidates">👥 Candidates</NavLink>
          <NavLink to="/kanban">📋 Kanban Board</NavLink>
          <NavLink to="/assessment-builder">📝 Assessments</NavLink>
        </nav>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <JobsBoard /> },
      { path: "jobs/:jobId", element: <JobDetailPage /> },
      { path: "candidates", element: <CandidateList /> },
      { path: "kanban", element: <CandidateKanbanBoard /> },
      { path: "assessment-builder", element: <AssessmentBuilder /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;