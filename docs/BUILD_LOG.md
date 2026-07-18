
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