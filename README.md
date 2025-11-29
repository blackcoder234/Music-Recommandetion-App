<div align="center">

# 🎵 Music Recommendation App

_A modern, full‑stack music streaming and recommendation platform._

</div>

---

## 1. 📌 Project Overview

**Music Recommendation App** is a **full‑stack web application** that allows users to:

- Stream music directly in the browser
- Explore curated **categories and genres**
- Search for songs quickly and intuitively
- Create and manage **playlists and favorites**
- (Future) Receive **personalized music recommendations** powered by AI/ML

The project is being developed in two clear phases:

- **Phase‑1 (Current):**
  - Focus on the complete **full‑stack application** (Frontend + Backend)
  - Implement music streaming UI, playlists, favorites, search, and authentication
  - Expose clean, RESTful backend APIs for all core features

- **Phase‑2 (Planned):**
  - Integrate a **Python‑based AI/ML model** for smart, personalized recommendations
  - Add an ML microservice and connect it to the Node.js backend
  - Provide endpoints for "Because you listened to…" and dynamic recommendation feeds

The aim is to create a production‑style architecture where users spend less time searching and more time enjoying **music tailored to their tastes**.

---

## 2. ✨ Key Features

Beautifully organized feature set for developers and users:

- 🎵 **Music Player**  
  Play, pause, skip next/previous, see progress and duration, and control volume – all within a smooth, web‑based player.

- 📂 **Categories & Genres**  
  Browse songs via curated **genres** (pop, rock, lo‑fi, hip‑hop, etc.) and **moods** (chill, focus, workout, party), as well as editor’s picks.

- 🔍 **Search Functionality**  
  Quickly search for songs (and optionally artists/albums/playlists) through a global search bar.

- ❤️ **Playlists & Favorites**  
  Create custom playlists, add/remove tracks, mark favorites, and manage listening collections per user.

- 🔐 **User Authentication**  
  Secure registration and login (JWT‑based), protected routes, and safe handling of passwords/tokens.

- 📱 **Responsive UI using Tailwind CSS**  
  Modern, responsive interface built with **Tailwind CSS**, optimized for desktop, tablet, and mobile.

- 🤖 **Future AI/ML Recommendation Engine**  
  Planned integration of a Python ML model to generate personalized music recommendations.

- 🔗 **API Integration between Backend and ML Model**  
  The backend will call a separate ML REST API, send user song/listening data, and receive ranked recommendations.

---

## 3. 🧰 Technology Stack

### 🖥️ Frontend

| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| **HTML**         | Base structure of the web pages              |
| **CSS**          | Core styling and layout                      |
| **Tailwind CSS** | Utility‑first styling and rapid UI building  |
| **JavaScript**   | Client‑side logic, API calls, player control |

### ⚙️ Backend

| Technology     | Purpose                              |
|----------------|--------------------------------------|
| **Node.js**    | JavaScript runtime for the server    |
| **Express.js** | HTTP server and REST API framework   |

### 🗄️ Database

| Technology  | Purpose                                  |
|-------------|------------------------------------------|
| **MongoDB** | Store users, playlists, songs, and usage |

Supports both **MongoDB Atlas (cloud)** and **local MongoDB** instances.

### 🔧 Other Tools

| Tool / Service               | Purpose                                         |
|------------------------------|-------------------------------------------------|
| **GitHub**                   | Version control and collaboration               |
| **Vercel / Render/ Other Hosting Platforms**          | Frontend and/or backend deployment              |
| **Postman**                  | API testing and collection management           |
| **Cloudinary**        | Media storage and CDN for images/audio files    |
| **Python‑based ML Model**    | Future recommendation engine (TensorFlow/PyTorch)|

---

## 4. 🚀 Installation & Setup

This section is intentionally detailed to make onboarding **as smooth as possible**, even for beginners.

> 🧭 Tip: Commands below use generic paths; adjust if your local folders are named `Frontend/` and `Backend/` (capitalized) instead of `frontend/` and `backend/`.

---

### 🔹 Step 1: Clone the Repository

```bash
git clone https://github.com/blackcoder234/Music-Recommandetion-App.git
cd Music-Recommandetion-App
```


---

### 🔹 Step 2: Frontend Setup (HTML + CSS + Tailwind CSS)

The frontend uses **HTML, CSS, Tailwind CSS, and JavaScript**. There are two common ways to work with Tailwind:

#### Option A — Tailwind via CDN (Quick & Simple)

If your `index.html` file includes a script like:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

then Tailwind is being loaded directly from a CDN.

In this case:

1. Navigate to the frontend folder:

   ```bash
   cd Frontend
   ```

2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, etc.).

   - No `npm install` is strictly required just to view the static UI.
   - This is ideal for **quick previews or static demos**.

#### Option B — Local Tailwind Build (Recommended for Real Projects)

For production‑ready, customizable setups, Tailwind is usually compiled locally.

1. Navigate into the frontend project:

   ```bash
   cd Frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This installs Tailwind CSS and any build tooling (e.g., PostCSS, Autoprefixer, etc.) specified in `package.json`.

3. Initialize Tailwind CSS:

   ```bash
   npx tailwindcss init
   ```

   This generates a `tailwind.config.js` file where you configure:
   - `content` paths (which files Tailwind should scan for class names)
   - theme extensions (colors, fonts, spacing, etc.)
   - plugins, if any

4. Start Tailwind in **watch mode** to generate CSS:

   ```bash
   npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
   ```

   Explanation:

   - `-i ./src/input.css` → **Input file** which contains Tailwind directives such as:

     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```

   - `-o ./dist/output.css` → **Output file** with all compiled Tailwind styles.
   - `--watch` → Automatically rebuilds the CSS whenever you change your HTML/JS.

5. Reference the generated CSS in your HTML (e.g., `index.html`):

   ```html
   <link rel="stylesheet" href="./dist/output.css" />
   ```

6. Serve or open the frontend:

   - For a quick local preview, you can open `index.html` directly in the browser, or
   - Use a simple static server (recommended for relative routes), for example:

   ```bash
   npx serve .
   ```

> ✅ Summary for Tailwind:
> - `input.css` → includes Tailwind directives and any custom styles.
> - `output.css` → compiled CSS used by your HTML.
> - `tailwind.config.js` → tells Tailwind where to look and how to theme your app.

---

### 🔹 Step 3: Backend Setup (Node + Express + MongoDB)

The backend uses **Node.js**, **Express.js**, and **MongoDB**. It exposes REST APIs for songs, playlists, authentication, and recommendations.

1. From the project root, navigate to the backend directory:

   ```bash
   cd Backend
   ```

2. Install backend dependencies:

   ```bash
   npm install
   ```

   - **What this does:**
     - Reads your `package.json` file.
     - Installs all required libraries (e.g., `express`, `mongoose`, `cors`, `jsonwebtoken`, etc.).

3. Start the backend server in development mode:

   ```bash
   npm run dev
   ```

   - **What this typically does:**
     - Runs a script (often using `nodemon`) to start the Express server.
     - Watches for code changes and restarts automatically.
     - Exposes APIs on a port such as `http://localhost:5000` (configurable via `PORT`).

> ℹ️ If `npm run dev` doesn’t work, open `Backend/package.json` and check the actual script name (e.g., `npm start` or `node server.js`).

---

### 🔹 Step 4: Environment Variables Setup (`.env` Example)

Create a file named `.env` inside the `Backend` directory. This file should **never** be committed to Git.

**Example `.env` configuration:**

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/musicapp
JWT_SECRET=your_jwt_secret_key

# Optional Cloudinary config (if used)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ML API Endpoint (future)
ML_MODEL_API_URL=http://localhost:8000/predict
```

Make sure the backend loads this file (for example, by using `dotenv`):

```js
require('dotenv').config();
```

#### 🔎 Environment Variable Reference Table

| Variable                 | Description                                                                                       |
|--------------------------|---------------------------------------------------------------------------------------------------|
| `PORT`                   | Port on which the Express server runs (e.g., `5000`).                                            |
| `MONGO_URI`              | MongoDB connection string (Atlas cluster URI or local MongoDB).                                  |
| `JWT_SECRET`             | Secret used to sign and verify JWT tokens for user authentication.                               |
| `CLOUDINARY_CLOUD_NAME`  | Cloud name for Cloudinary (only needed if storing images/media there).                          |
| `CLOUDINARY_API_KEY`     | Public API key from your Cloudinary account.                                                     |
| `CLOUDINARY_API_SECRET`  | Secret API key from Cloudinary (keep this private).                                              |
| `ML_MODEL_API_URL`       | URL of the future ML recommendation API (Python server), e.g., `http://localhost:8000/predict`. |

> 🔐 **Security Note:**
> - Add `.env` to `.gitignore`.
> - Do not share real secrets in screenshots or public repos.

---

## 5. 🔗 Backend API + ML Model Integration (Basic Explanation)

The backend provides REST APIs that power the frontend and, in Phase‑2, integrates with a separate **Python ML model server**.

### 🧱 Backend & API Communication (High Level)

The backend exposes a set of **RESTful APIs** that the frontend uses for:

- Authenticating users
- Fetching and managing songs, playlists, and favorites
- Requesting recommendation data (in Phase‑2)

At this stage, the **exact API routes and paths are not finalized**, but the architecture assumes:

- A clear separation between **public** and **authenticated** operations
- JSON‑based request/response bodies for all client–server communication
- Versionable endpoints (for example, under an `/api` namespace) to keep future changes manageable

### 🤖 Future ML Model Integration

In Phase‑2, the recommendation logic is handled by a **separate ML microservice** built with Python (e.g., **TensorFlow** or **PyTorch**).

High‑level flow:

1. The user listens to songs, likes tracks, or adds them to playlists.
2. The Node.js backend records relevant data (user ID, song IDs, play counts, skips, favorites, etc.).
3. When recommendations are needed, the backend sends an **HTTP request** to the ML service at `ML_MODEL_API_URL`, including relevant user listening data and/or song features in a JSON payload.

4. The ML server runs the model and responds with one or more **recommended song identifiers or scores**.

5. The backend translates these identifiers into full song objects from MongoDB and returns them to the frontend through its own APIs.

This design clearly states that the backend will **communicate with the model via APIs**, without locking in specific endpoint names before the implementation is finalized.

---

## 6. 🤝 Contributing Guidelines

Contributions are welcome! To maintain quality and consistency, please follow these guidelines.

### 🌱 How to Contribute

1. **Fork** the repository (if external contributor) or create a new branch (if within the team).
2. Create a feature branch from `main` (or `develop`, if used).
3. Implement your changes with clear, readable code.
4. Test your changes locally (frontend and/or backend as relevant).
5. Open a **Pull Request (PR)** with a descriptive title and summary.

### 🌿 Branching Rules

Use descriptive, kebab‑case branch names:

- `feature/home-page-ui`
- `feature/playlist-crud`
- `feature/authentication-flow`
- `fix/login-token-expiry`
- `chore/update-dependencies`

### 🌳 Pull Request Guidelines

- Keep PRs **focused** (one major concern per PR).
- Clearly describe **what** changed and **why**.
- Reference any related issues (e.g., `Closes #12`).
- Attach screenshots/GIFs for UI‑related changes where helpful.
- Ensure linting/tests (if configured) pass before requesting review.

### 🧑‍💻 Coding Standards

- Use **modern JavaScript (ES6+)**: `const`/`let`, arrow functions, async/await.
- Prefer **small, focused functions** and **modular components**.
- Follow **DRY** (Don’t Repeat Yourself) and **SRP** (Single Responsibility Principle).
- For backend:
  - Keep routes, controllers, and services separated.
  - Use proper HTTP status codes and structured JSON responses.
  - Validate input and handle errors gracefully.
- For frontend:
  - Use Tailwind utility classes consistently.
  - Keep markup semantic and accessible.

### 📝 Commit Message Rules

Use clear, conventional commit messages, for example:

- `feat: add playlist creation endpoint`
- `fix: handle expired jwt tokens`
- `chore: update mongodb driver`
- `refactor: simplify song controller`
- `docs: improve installation instructions`

This keeps the git history easy to read and maintain.

---

## 7. 📄 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](./LICENSE) file in this repository for the full text.

---

## 8. 📬 Contact Information

For questions, suggestions, or collaboration, feel free to reach out:

- 👥 **Team:** Snippet.co
- 🧑‍💼 **Maintainer:** Amarnath Bera
- 📧 **Email:** beraamarnath5@gmail.com
- 🧑‍💻 **GitHub:** https://github.com/blackcoder234/Music-Recommandetion-App.git

You can also **open an issue** or **start a discussion** in this repository to report bugs, propose features, or share ideas.

