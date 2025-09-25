HR Management Platform (Mini-Project)
This is a comprehensive, client-side HR management application built with React. It allows an HR team to manage job postings, track candidates through a hiring pipeline, and build custom assessments for each job. The application is designed to be fully functional without a real backend, simulating all API interactions locally in the browser.

Core Features
Jobs Board: Create, edit, archive, and reorder job postings with server-like pagination, filtering, and optimistic drag-and-drop reordering.

Candidate Kanban: View all candidates in a Kanban board, and drag-and-drop them between hiring stages (applied, screen, tech, etc.).

Virtualized Candidate List: Efficiently display and search a list of 1000+ seeded candidates.

Assessment Builder: A dynamic form builder to create job-specific quizzes with multiple question types, validation rules, and conditional logic.

Live Preview: A live preview pane that renders the assessment form as it's being built.

⚙️ Setup and Installation
Follow these steps to get the project running locally.

Prerequisites

Node.js (v18 or later)

npm or yarn

Clone the Repository

Bash

git clone <your-repository-url>
cd <repository-directory>
Install Dependencies
Install all the necessary packages for the application to run.

Bash

npm install
Key dependencies include react, react-router-dom, @tanstack/react-query, dexie, dnd-kit, react-hook-form, and msw.

Initialize Mock Service Worker (MSW)
This command creates the service worker file in your public directory, which is essential for intercepting network requests.

Bash

npx msw init public/ --save
Run the Development Server
This will start the Vite development server and open the application in your browser.

Bash

npm run dev
The application will automatically seed its local database on the first run.

🏛️ Architecture
This application is built using a local-first architecture. All data is stored and managed within the browser, and a mock API layer handles all data transactions, providing a realistic development experience without a network dependency.

UI Layer (React)

Components (JobsList, KanbanBoard, AssessmentBuilder) are built using React and modern hooks.

React Router is used for page navigation (/, /candidates, etc.).

State Management Layer (TanStack Query)

TanStack Query (formerly React Query) manages all "server state." It handles fetching, caching, and updating data from our mock API.

Its powerful features like useMutation are crucial for implementing optimistic updates and rollbacks, providing a seamless user experience for features like drag-and-drop.

API Layer (Mock Service Worker)

MSW intercepts all fetch requests made by the application at the network level.

Instead of letting requests go to a real server, custom handlers process them, simulating a real REST API. This includes adding artificial latency and random error rates to test loading and error states.

Data Layer (Dexie.js / IndexedDB)

Dexie.js provides a user-friendly wrapper around the browser's built-in IndexedDB.

It acts as our persistent database. The MSW handlers read from and write to the Dexie database, ensuring that application state is preserved across page reloads.

Data Flow Example (Fetching Jobs):
Component Mount → useQuery triggers fetch → fetch('/api/jobs') → MSW intercepts → MSW handler queries Dexie DB → MSW returns mock JSON response → useQuery caches data → Component renders with data.

🧠 Technical Decisions
Why MSW + Dexie.js?
This combination creates a powerful, self-contained development environment. It allowed for the implementation of complex, server-like features (pagination, filtering, simulated network failures) without the overhead of building and deploying a separate backend.

Why TanStack Query?
It is the ideal library for managing asynchronous data in React. Its caching mechanism reduces redundant fetches, and its useMutation hook provides a clean and declarative API for handling optimistic updates and rollbacks, a core requirement of this project.

Why dnd-kit?
dnd-kit was chosen for its modern, lightweight, and accessible approach to drag-and-drop. It provided the flexibility needed for both the sortable list (job reordering) and the more complex Kanban board (moving items between distinct columns).

Why Virtualization?
Rendering a list of 1000+ candidates directly in the DOM would cause significant performance issues. @tanstack/react-virtual was used to ensure a smooth user experience by only rendering the items currently visible in the viewport.

Why react-hook-form?
The assessment runtime required managing a dynamic form with conditional logic and validation. react-hook-form is highly performant and its watch API provides an elegant solution for showing or hiding questions based on a user's previous answers.

⚠️ Known Issues & Limitations
No Real Backend: All data is stored in the browser's IndexedDB. Clearing browser data will reset the application.

No Authentication: The application is designed for a single user and has no login or permission system.

Simplified Features: Some features are implemented as stubs for demonstration purposes:

The @mentions feature in notes only renders the text without providing suggestions.

The file-upload question type in the assessment builder does not actually handle file uploads.

No Real-Time Updates: As there is no server with web sockets, changes made in one browser tab will not be reflected in another without a manual refresh.
