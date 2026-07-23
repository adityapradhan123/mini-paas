
## Day 3 — Feature: Dockerode connection to Docker daemon

**Goal:** Get the Express backend talking to the local Docker daemon
programmatically, as the foundation for automated builds/deploys.

**Approach:**
Used the `dockerode` npm package, which wraps the Docker Engine API. On
Windows with Docker Desktop, it auto-connects via the named pipe
(`npipe:////./pipe/dockerDesktopLinuxEngine`) with zero config needed.

**Problem hit:**
Initial test route returned "Cannot GET /docker/ping" — a 404, not a Docker
error. Turned out to just be a stale server process not picking up the new
route (needed a restart).

**Solution:**
Verified route was defined before `app.listen()`, restarted the dev server
cleanly. `/docker/ping` then returned `{"connected": true, "info": {...}}`
confirming dockerode -> Docker Desktop communication works end to end.

**Reference(s):**
- https://github.com/apocas/dockerode
- Docker Engine API docs: https://docs.docker.com/engine/api/

**What I'd do differently:**
Next time, check "did the server actually restart" before assuming a code bug.

## Day 4 — Feature: Programmatic Docker image build

**Goal:** Trigger a Docker image build from Node.js, not the CLI — the core
"build" step of the platform.

**Approach:**
Used `tar-fs` to package the sample app's folder into a tar stream (Docker's
build API expects a tar archive as context, same as what `docker build .`
does under the hood), then passed it to `dockerode`'s `buildImage()`.
Used `docker.modem.followProgress()` to stream build output live instead of
waiting silently for it to finish.

**Problem hit:** None major — first attempt worked once the Dockerfile was
in place.

**Result:** `docker images` confirms `hello-node-test:latest` exists,
built entirely via API call, not manual CLI.

**Reference(s):**
- https://github.com/apocas/dockerode#docker-build
- Docker build context docs: https://docs.docker.com/build/building/context/

**What I'd do differently:** Nothing yet — will revisit once we add error
handling for bad Dockerfiles.

## Day 5 — Feature: Run container from built image, serve real traffic

**Goal:** Prove the full deploy loop — build an image, run it as a container,
and confirm it serves HTTP traffic, all triggered via API (not manual Docker
CLI commands).

**Approach:**
Used dockerode's `createContainer()` with `ExposedPorts` and `HostConfig.
PortBindings` to map a host port (3001) to the container's internal port
(3000), then `container.start()` to launch it.

**Problem hit:** None — worked on first attempt since the image was already
built and tested.

**Result:** `docker ps` confirmed the container running with correct port
mapping (`0.0.0.0:3001->3000/tcp`). Visiting localhost:3001 in browser
returned "Hello from inside a container!" — served by code inside an
isolated container, launched entirely through our own API.

**Reference(s):**
- https://github.com/apocas/dockerode#docker-run
- Docker port binding docs: https://docs.docker.com/config/containers/container-networking/

**What I'd do differently:** Nothing yet — this was the "hello world" proof
of concept. Real apps will need dynamic port allocation instead of hardcoding
3001/3000.

## Day 6-7 — Feature: Persist deployment metadata in MongoDB

**Goal:** Make deployments queryable/persistent instead of only existing in
Docker's runtime state — this is what will power the dashboard later.

**Approach:**
Created a Deployment model (appName, imageName, containerId, ports, status
enum, timestamps). Updated the run-test route to create a record BEFORE
starting the container (status: "deploying"), then update it with the
container ID and status "live" once successfully running. Added a GET
/deployments route to list all records, sorted newest first.

**Problem hit:** None — straightforward Mongoose schema + CRUD.

**Result:** Verified full flow: POST triggers deploy -> record created ->
container starts -> record updated to "live" -> GET /deployments returns
the persisted record with containerId intact.

**Reference(s):**
- Mongoose docs: https://mongoosejs.com/docs/guide.html

**What I'd do differently:** Right now if the container fails to start, the
deployment record is stuck at "deploying" forever. Need a try/catch that
sets status to "failed" on error — will fix this in Week 2 alongside proper
error handling.

## week 2
## Day 1-2 — Feature: Proper error handling for deploy pipeline

**Goal:** Ensure failed builds/deploys are recorded with a clear reason,
instead of leaving deployment records stuck at "deploying" forever.

**Approach:**
Moved deploy logic out of the route handler into a dedicated
`deploy.controller.js`. Wrapped the build+run steps in try/catch; on success,
status becomes "live". On failure, status becomes "failed" and the actual
error message is saved to a new `errorMessage` field, then re-thrown so the
route can still return a proper HTTP error response.

**Problem hit:** Briefly hit an "Unable to get absolute uri" error from
tar-fs — turned out to be a stale server process, resolved after a clean
restart.

**Result:** Tested by intentionally causing a container name conflict (ran
deploy twice without removing the first container). Confirmed via
GET /deployments that failures are recorded with status "failed" and a
readable Docker error message, while the original success stayed "live".

**Reference(s):**
- Docker Engine API error codes: https://docs.docker.com/engine/api/v1.43/

**What I'd do differently:** Should clean up stopped/conflicting containers
automatically in a future pass, rather than requiring manual docker rm.


## Day 3 — Feature: Dynamic port allocation + unique container naming

**Goal:** Allow multiple deployments to run simultaneously without port or
name collisions, instead of hardcoding port 3001 and a fixed container name.

**Approach:**
Used `get-port` (pinned to v5.1.1 for CommonJS compatibility, since v7+ is
ESM-only) to find a free port in a defined range (3000-3100) at deploy time.
Appended `Date.now()` to the container name to guarantee uniqueness across
deploys.

**Problem hit:** None on implementation. Had a leftover container from
earlier testing with a stale name, but `docker ps -a` confirmed it wasn't
actually blocking anything.

**Result:** Ran the deploy route twice back-to-back with no cleanup in
between. `docker ps` confirmed two containers running concurrently on
different ports (3000 and 3001), each independently reachable.

**Reference(s):**
- get-port docs: https://github.com/sindresorhus/get-port

**What I'd do differently:** Port range (3000-3100) is arbitrary right now —
will need to make this configurable, and eventually track allocated ports in
MongoDB to avoid relying purely on OS-level port availability checks.

## Day 4-5 — Feature: Deploy from GitHub repo URL (not local folder)

**Goal:** Accept a GitHub repo URL via API, clone it server-side, and deploy
it — the actual core promise of a PaaS.

**Approach:**
Used `simple-git` to clone into a temp directory (`backend/tmp/<appName>-
<timestamp>`), then fed that path into the existing `deployApp` controller
from Day 1-2, reusing the build/run/error-handling pipeline already in place.

**Problem hit (the interesting one):**
Requests kept failing with "Connection was reset" / "underlying connection
was closed" — no error, no crash, server logs looked completely clean. Very
confusing at first since it looked like a networking issue.

**How I debugged it:**
Ruled out curl/PowerShell syntax issues first (tried curl.exe, then
Invoke-RestMethod — same failure both ways, which pointed away from a
client-side problem). Server terminal showed no crash, just clean startup
logs. Eventually realized: nodemon watches the whole backend folder for
changes, and git clone was writing files into `backend/tmp/` mid-request —
nodemon saw new files appear and restarted the server, killing the
in-flight request before it could respond.

**Solution:**
Added `nodemon.json` with `{"ignore": ["tmp/*", "tmp/**/*"]}` so nodemon
stops watching the temp clone directory.

**Reference(s):**
- nodemon config docs: https://github.com/remy/nodemon#config-files
- simple-git docs: https://github.com/steveukx/git-js

**Result:**
POST /deploy with a GitHub URL successfully cloned, built, and deployed a
live container with an auto-assigned port — confirmed both via API response
and by visiting the live URL in browser.

**What I'd do differently:**
This class of bug (dev tool interfering with runtime folders) is sneaky
because it produces zero application-level errors. Worth remembering:
"clean logs but connection dies" often means something OUTSIDE your app
code (process manager, proxy, tool) is killing the connection.

## Day 6-7 — Feature: Auto-detect project type + generate Dockerfile

**Goal:** Let users deploy a repo with NO Dockerfile — detect the project
type automatically and generate one, the actual "PaaS magic" feature.

**Approach:**
Created `detect.service.js` — checks for marker files (package.json,
requirements.txt, index.html, or an existing Dockerfile) to determine
project type. If no Dockerfile exists, generates one from a template
per type (Node/Python/static), writing it directly into the cloned repo
folder before the build step runs.

## Week 3, Day 1 — Feature: React dashboard scaffold + live deployment list

**Goal:** Replace curl-based testing with a real UI showing deployment
status/history pulled from the backend.

**Approach:**
Scaffolded with Vite + React (JavaScript, ESLint+Prettier). Created a
centralized api.js using axios pointed at the backend (localhost:5000).
App.jsx fetches GET /deployments on mount and renders each as a list item
with status and a clickable live URL when status is "live".

**Problem hit:** None — straightforward integration since the backend API
was already solid from Week 1-2.

**Result:** Dashboard at localhost:5173 successfully renders real deployment
history from MongoDB, including both live and failed attempts from earlier
testing.

**Observation for later:** Current view shows every deploy attempt as a flat
list, including repeated old attempts of the same app. Will need to
distinguish "current live version per app" vs "deploy history" as a future
UI improvement.

**Reference(s):**
- Vite docs: https://vite.dev/guide/
- Axios docs: https://axios-http.com/docs/instance

## Week 3, Day 2-3 — Feature: Deploy form (UI replaces curl workflow)

**Goal:** Let users trigger a deploy entirely through the dashboard instead
of manually running curl commands with a JSON file.

**Approach:**
Built DeployForm component with controlled inputs (repoUrl, appName) and a
loading/error state. On submit, calls POST /deploy via the existing api.js
axios instance. On success, calls an onDeployed callback passed down from
App.jsx, which triggers a re-fetch of the deployments list — so the UI
updates automatically without a manual page refresh.

Also refactored App.jsx to extract DeploymentList into its own component,
moving both DeployForm and DeploymentList into a components/ folder — proper
project structure instead of one giant App.jsx file.

**Problem hit:** Initial import error ("Failed to resolve import
./DeployForm") — the file simply hadn't been created yet before the import
was added. Also had to remember to update the relative import path (../api
instead of ./api) after moving files into components/.

**Result:** Full end-to-end deploy tested via UI: submitted a GitHub repo
URL and app name, watched the loading state, and got a live, clickable app
URL with zero terminal interaction.

**Reference(s):**
- React docs on lifting state up: https://react.dev/learn/sharing-state-between-components

**What I'd do differently:** The 15-30 second wait during "Deploying..."
gives no feedback about WHAT's happening (cloning? building? running?).
This is exactly what real-time build logs (Day 4) will solve.

## Week 3, Day 4 — Feature: Real-time build logs via Socket.io

**Goal:** Stream live Docker build output to the frontend instead of a
silent spinner during deploy.

**Approach:**
Set up Socket.io on the backend (socket.js: initSocket/getIO pattern),
modified buildImage() to accept an onLog callback instead of only
console.log, and emit each build step as a `build-log` event to a
per-deployment "room" (so multiple simultaneous deploys don't cross-talk).
Frontend uses socket.io-client, joins the room on deploy start, and renders
incoming messages in a live-updating terminal-style panel.

**Problem hit (a real one — multi-hour debug):**
Backend logs confirmed sockets were connecting and correctly joining rooms.
Room names matched exactly between frontend and backend. Yet the frontend
NEVER received any `build-log` events — no errors anywhere, everything
LOOKED correct on both sides.

**How I debugged it:**
Ruled out, one at a time: room name mismatches (confirmed identical),
multiple browser tabs creating duplicate sockets (confirmed single tab),
socket ID mismatches (confirmed same ID on both ends), and whether the
build itself was even running (confirmed deploys were reaching "live"
status in MongoDB). Added a raw `console.log('=== deployApp CALLED ===',
{ hasIo: !!io })` marker at the very top of the function — this revealed
`hasIo: false`. That was the real bug: `io` was undefined every single
time, meaning the `if (io && socketRoom)` guard inside emitLog was
silently skipping every emit call, with zero errors anywhere.

Root cause: there were TWO separate Socket.io setups in the codebase.
`socket.js` (initSocket/getIO) was the one actually running and handling
connections — visible in the "Client connected"/"joined room" logs the
whole time. But deploy.controller.js was trying to retrieve `io` via
`req.app.get('io')`, expecting server.js to have called `app.set('io', io)`
— which it never did. Two independently-correct-looking pieces of code
that were never actually wired together.

**Solution:**
Imported `getIO` from socket.js directly into deploy.controller.js instead
of relying on Express's app.set/app.get pattern, since socket.js already
exposed exactly this via getIO().

**Reference(s):**
- Socket.io rooms docs: https://socket.io/docs/v4/rooms/
- Socket.io server API: https://socket.io/docs/v4/server-api/

**Key lesson (worth remembering for interviews):**
"Silent failures are the hardest bugs" — nothing crashed, nothing errored,
every individual piece looked correct in isolation. The bug only revealed
itself by adding a blunt, unambiguous marker (hasIo: true/false) at the
exact boundary between two systems, rather than trusting that "this looks
right" meant it was connected correctly. Also: when two files both seem to
set up the same infrastructure (two Socket.io instances in this case),
that's a signal to check which one is ACTUALLY being used before assuming
your latest edit is the active code path.

## Week 3, Day 6-7 — Feature: React Router + App Detail Page

**Goal:** Add navigation — clicking a deployment card opens a dedicated
detail page instead of everything living on one screen.

**Approach:**
Set up react-router-dom with BrowserRouter in main.jsx. Restructured
App.jsx to be purely a router (Routes/Route definitions), moved all
dashboard logic into pages/Dashboard.jsx, and created pages/AppDetail.jsx
which fetches deployment data by ID from the URL params and displays full
details (image, container name, port, timestamps, error messages) plus a
live "Visit" button. Made deployment cards in DeploymentList.jsx clickable
via Link, navigating to /apps/:id.

**Problem hit:** Standard "file not created yet" import errors when
setting up new page files — same pattern as earlier component creation
issues, resolved by actually creating the files before importing them.

**Result:** Full navigation flow works — dashboard list -> click card ->
detail page -> back button -> dashboard again, with real deployment data
loading correctly by ID at each step.

**Reference(s):**
- React Router docs: https://reactrouter.com/en/main

**What I'd do differently:** Detail page currently doesn't have
redeploy/delete actions — would need new backend endpoints (DELETE
/deployments/:id, POST /deployments/:id/redeploy) to make those functional.
Worth adding as a stretch goal if time allows.

## Feature: Monorepo/subdirectory deploy support

**Goal:** Allow deploying an app that lives in a subfolder of a repo
(e.g., client/ or server/ in a monorepo), not just repos with a manifest
at the root.

**Approach:** Added optional `subdirectory` field to deploy requests and
the Deployment model. When provided, contextPath is built as
path.join(clonedRepoPath, subdirectory) before detection/build/run,
instead of using the repo root directly. redeployApp reuses the saved
subdirectory automatically.

**Result:** Successfully deployed the `server` subfolder of a real
multi-service repo (team_landing_page) that has no root-level manifest.
Confirmed via the deployment record showing subdirectory: "server" and
repoUrl correctly populated. The deployed app went live, then later
correctly transitioned to "stopped" via the existing reconciliation
system when the underlying app process exited on its own (likely a
missing environment variable or dependency specific to that app -
expected behavior for a real app, not a platform issue).

**Reference(s):** N/A - straightforward path manipulation.

**Lesson:** This also served as a good real-world test of the
reconciliation system - it correctly detected and reported a genuine
container failure automatically, without any manual intervention needed.