(() => {
  "use strict";

  const STORAGE_KEY = "stackforge_docker_lab_studio_v4";
  const SESSION_KEY = "stackforge_docker_lab_session_v4";
  const LEGACY_STORAGE_KEYS = ["stackforge_docker_lab_studio_v3"];
  const PROJECT_FORMAT = "stackforge-docker-lab-project";
  const PROJECT_VERSION = 1;
  let autoSaveTimer = null;

  const defaultFiles = {
    "Dockerfile": `# STACKFORGE Docker Lab
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]`,

    "docker-compose.yml": `services:
  web:
    build: .
    container_name: stackforge-web
    ports:
      - "8080:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://student:practice123@database:5432/stackforge
    depends_on:
      - database
    networks:
      - stackforge-net

  database:
    image: postgres:16-alpine
    container_name: stackforge-db
    environment:
      POSTGRES_DB: stackforge
      POSTGRES_USER: student
      POSTGRES_PASSWORD: practice123
    volumes:
      - stackforge-data:/var/lib/postgresql/data
    networks:
      - stackforge-net

volumes:
  stackforge-data:

networks:
  stackforge-net:
    driver: bridge`,

    "app.js": `const http = require("http");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(` + "`" + `
    <!doctype html>
    <html>
      <head><title>STACKFORGE Container</title></head>
      <body>
        <h1>STACKFORGE Docker Lab</h1>
        <p>Your Node.js container is running successfully.</p>
      </body>
    </html>
  ` + "`" + `);
});

server.listen(port, "0.0.0.0", () => {
  console.log(\`Server listening on port \${port}\`);
});`,

    "package.json": `{
  "name": "stackforge-docker-lab",
  "version": "1.0.0",
  "private": true,
  "description": "STACKFORGE Docker classroom practice application",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  }
}`,

    ".dockerignore": `node_modules
npm-debug.log
.git
.gitignore
README.md
*.log`,

    "README.md": `# STACKFORGE Docker Lab

This browser workspace is used for Docker practice in IT 211 Platform Technologies.

## Practice workflow

1. Check Docker.
2. Pull a base image.
3. Build an image from the Dockerfile.
4. Run and inspect containers.
5. Work with volumes and networks.
6. Validate and run Docker Compose.

> This is a safe browser simulator. Commands do not access a real Docker daemon.`
  };

  const challenges = [
    {
      id: "task-001",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Workspace Path",
      heading: "Locate the Docker lab workspace",
      difficulty: "BEGINNER",
      description: "Confirm your current working directory before running Docker commands.",
      objective: "Identify and display the directory where the Docker lab project is currently located.",
      command: "pwd",
      concept: "A predictable working directory helps you understand build contexts, relative paths, and where Dockerfile assets are located.",
      hint: "Think of the standard Linux command whose name means “print working directory.” It is only three letters long.",
      check: (ctx) => ctx.commandRan("pwd")
    },
    {
      id: "task-002",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "List Workspace Files",
      heading: "Inspect the project workspace",
      difficulty: "BEGINNER",
      description: "List all files, including hidden configuration files.",
      objective: "Display the complete project directory listing, including hidden files and detailed metadata.",
      command: "ls -la",
      concept: "Docker projects commonly rely on hidden files such as .dockerignore, so learning to inspect the whole build context is important.",
      hint: "Start with the Linux list command. Combine the option for hidden entries with the option for a long/detailed listing.",
      check: (ctx) => ctx.commandRan("ls -la")
    },
    {
      id: "task-003",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Read Project Guide",
      heading: "Review the lab documentation",
      difficulty: "BEGINNER",
      description: "Open the project README from the terminal.",
      objective: "Display the contents of README.md directly in the terminal.",
      command: "cat README.md",
      concept: "Reading repository documentation first reduces configuration mistakes and clarifies expected commands and project structure.",
      hint: "Use the common Unix command for printing a text file to standard output, then provide README.md as its argument.",
      check: (ctx) => ctx.commandRan("cat README.md")
    },
    {
      id: "task-004",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Read Dockerfile",
      heading: "Inspect the image recipe",
      difficulty: "BEGINNER",
      description: "Review the current Dockerfile before building anything.",
      objective: "Display the current Dockerfile in the terminal so you can review the image recipe.",
      command: "cat Dockerfile",
      concept: "A Dockerfile is an ordered build recipe. Reviewing it helps you predict the base image, working directory, copied files, installed dependencies, exposed ports, and startup command.",
      hint: "Use the same file-printing command you used for the README, but target the Dockerfile this time.",
      check: (ctx) => ctx.commandRan("cat Dockerfile")
    },
    {
      id: "task-005",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Read Compose File",
      heading: "Inspect multi-service configuration",
      difficulty: "BEGINNER",
      description: "Review the Compose YAML before launching services.",
      objective: "Display the Docker Compose YAML configuration in the terminal.",
      command: "cat docker-compose.yml",
      concept: "Compose files declare services, networks, volumes, ports, dependencies, and environment configuration for repeatable multi-container environments.",
      hint: "Use a terminal file-reading command and pass the Compose filename shown in the Explorer.",
      check: (ctx) => ctx.commandRan("cat docker-compose.yml")
    },
    {
      id: "task-006",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Verify Docker CLI",
      heading: "Check Docker availability",
      difficulty: "BEGINNER",
      description: "Confirm that the Docker CLI is available in the practice environment.",
      objective: "Ask the Docker CLI to report its installed version.",
      command: "docker --version",
      concept: "The Docker CLI is the client interface used to communicate with the Docker Engine API.",
      hint: "Docker supports global options that begin with two hyphens. Use the one that reports version information.",
      check: (ctx) => ctx.commandRan("docker --version")
    },
    {
      id: "task-007",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Inspect Docker Engine",
      heading: "Review daemon information",
      difficulty: "BEGINNER",
      description: "Inspect simulated Docker Engine configuration and resource counts.",
      objective: "Display Docker Engine information such as runtime, image, container, and system details.",
      command: "docker info",
      concept: "docker info is a high-value diagnostic command for checking engine version, storage driver, container counts, image counts, architecture, and runtime details.",
      hint: "Docker has a top-level diagnostic subcommand commonly used after checking the CLI version. Its name means general information.",
      check: (ctx) => ctx.commandRan("docker info")
    },
    {
      id: "task-008",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Open Docker Help",
      heading: "Explore CLI help",
      difficulty: "BEGINNER",
      description: "Use Docker built-in help to discover command groups.",
      objective: "Open Docker’s built-in command reference from the terminal.",
      command: "docker --help",
      concept: "Strong CLI users rely on built-in help instead of memorizing every option. It exposes command groups and syntax directly from the installed Docker version.",
      hint: "Most command-line programs expose help through a global option beginning with two hyphens. Apply that pattern to Docker.",
      check: (ctx) => ctx.commandRan("docker --help")
    },
    {
      id: "task-009",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Verify Compose",
      heading: "Check Compose plugin",
      difficulty: "BEGINNER",
      description: "Confirm that Docker Compose is available.",
      objective: "Confirm that the Docker Compose plugin is available and display its version.",
      command: "docker compose version",
      concept: "Modern Docker installations provide Compose as a Docker CLI plugin, enabling declarative multi-container workflows.",
      hint: "Compose is invoked as a Docker subcommand in modern installations. After entering the Compose command group, request its version.",
      check: (ctx) => ctx.commandRan("docker compose version")
    },
    {
      id: "task-010",
      module: "MODULE 1 \u00b7 CLI & ENVIRONMENT",
      short: "Inspect Host Kernel",
      heading: "Recognize the Linux runtime",
      difficulty: "BEGINNER",
      description: "Inspect the simulated host kernel and architecture.",
      objective: "Display the simulated Linux kernel and architecture information.",
      command: "uname -a",
      concept: "Containers share the host kernel, so understanding the host operating system and architecture helps explain image compatibility and runtime behavior.",
      hint: "Use the Linux system-name utility, then add the option that requests all available information.",
      check: (ctx) => ctx.commandRan("uname -a")
    },
    {
      id: "task-011",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Pull Node Image",
      heading: "Download a Node.js image",
      difficulty: "BEGINNER",
      description: "Add node:20-alpine to the local image cache.",
      objective: "Download the required Node.js Alpine image into the local image cache.",
      command: "docker pull node:20-alpine",
      concept: "Pulling fetches immutable image layers from a registry. Tags identify a particular image variant or release channel.",
      hint: "Use Docker’s image-download subcommand. Supply the requested image using repository:tag notation.",
      check: (ctx) => ctx.hasImage("node:20-alpine")
    },
    {
      id: "task-012",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Pull Nginx Image",
      heading: "Download a web server image",
      difficulty: "BEGINNER",
      description: "Add nginx:alpine to the local image cache.",
      objective: "Download the required Nginx Alpine image into the local image cache.",
      command: "docker pull nginx:alpine",
      concept: "Official images provide curated starting points for common services and reduce the amount of software you need to package manually.",
      hint: "Use the same image-download pattern as the previous task, but substitute the Nginx repository and Alpine tag named in the task.",
      check: (ctx) => ctx.hasImage("nginx:alpine")
    },
    {
      id: "task-013",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Pull PostgreSQL Image",
      heading: "Download a database image",
      difficulty: "BEGINNER",
      description: "Add postgres:16-alpine to the local image cache.",
      objective: "Download the specified PostgreSQL Alpine image into the local image cache.",
      command: "docker pull postgres:16-alpine",
      concept: "Database containers are frequently used in development stacks, where a fixed image tag improves environment consistency.",
      hint: "Use Docker’s pull workflow and preserve both the repository name and the versioned Alpine tag shown in the task.",
      check: (ctx) => ctx.hasImage("postgres:16-alpine")
    },
    {
      id: "task-014",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Pull Redis Image",
      heading: "Download a cache image",
      difficulty: "BEGINNER",
      description: "Add redis:7-alpine to the local image cache.",
      objective: "Download the specified Redis Alpine image into the local image cache.",
      command: "docker pull redis:7-alpine",
      concept: "Using explicit major-version tags makes dependencies more reproducible than relying only on latest.",
      hint: "Use Docker’s registry download subcommand with the Redis repository and requested tag.",
      check: (ctx) => ctx.hasImage("redis:7-alpine")
    },
    {
      id: "task-015",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "List Local Images",
      heading: "Review image inventory",
      difficulty: "BEGINNER",
      description: "Inspect every image currently stored locally.",
      objective: "Display the locally cached Docker images after completing the pulls.",
      command: "docker images",
      concept: "Image listings show repositories, tags, IDs, age, and size, which are important for inventory and cleanup decisions.",
      hint: "Docker provides a classic top-level command for listing local images. Use the plural form of the resource name.",
      check: (ctx) => ctx.commandRan("docker images") && ["node:20-alpine","nginx:alpine","postgres:16-alpine","redis:7-alpine"].every((name) => ctx.hasImage(name))
    },
    {
      id: "task-016",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Use Image Command Group",
      heading: "Practice modern image syntax",
      difficulty: "BEGINNER",
      description: "List images through the docker image command group.",
      objective: "List local images using Docker’s structured image command group.",
      command: "docker image ls",
      concept: "Docker provides both legacy convenience commands and structured command groups. Knowing both improves fluency across documentation and environments.",
      hint: "Start with Docker’s singular image command group, then use its listing subcommand.",
      check: (ctx) => ctx.commandRan("docker image ls")
    },
    {
      id: "task-017",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Inspect Node Metadata",
      heading: "Read image metadata",
      difficulty: "BEGINNER",
      description: "Inspect architecture, config, exposed ports, and image identity.",
      objective: "Inspect the metadata of the Node.js image stored in the local cache.",
      command: "docker image inspect node:20-alpine",
      concept: "Image inspection exposes low-level metadata used for troubleshooting configuration, entrypoints, architecture, labels, and runtime defaults.",
      hint: "Enter the image command group, choose the metadata-inspection action, then provide the full image reference.",
      check: (ctx) => ctx.commandRan("docker image inspect node:20-alpine")
    },
    {
      id: "task-018",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Inspect Nginx Metadata",
      heading: "Compare image metadata",
      difficulty: "BEGINNER",
      description: "Inspect a second image to reinforce metadata analysis.",
      objective: "Inspect the metadata of the Nginx Alpine image.",
      command: "docker image inspect nginx:alpine",
      concept: "Comparing image metadata helps students recognize that images can expose different ports, commands, layers, and configuration defaults.",
      hint: "Use the same image-inspection workflow as the previous task, replacing only the target image reference.",
      check: (ctx) => ctx.commandRan("docker image inspect nginx:alpine")
    },
    {
      id: "task-019",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Tag Node Image",
      heading: "Create a local alias",
      difficulty: "BEGINNER",
      description: "Create a new repository/tag reference without duplicating image layers.",
      objective: "Create the requested local tag that points to the existing Node.js image.",
      command: "docker tag node:20-alpine stackforge-node:20",
      concept: "Tags are lightweight references to image IDs. Multiple tags can point to the same underlying image content.",
      hint: "Docker tagging uses two image references in order: SOURCE first, TARGET second. Choose the subcommand used to assign an additional tag.",
      check: (ctx) => ctx.hasImage("stackforge-node:20")
    },
    {
      id: "task-020",
      module: "MODULE 2 \u00b7 IMAGES & REGISTRIES",
      short: "Inspect Tagged Image",
      heading: "Verify the alias",
      difficulty: "BEGINNER",
      description: "Confirm that the new image tag resolves correctly.",
      objective: "Inspect the newly created STACKFORGE Node image tag.",
      command: "docker image inspect stackforge-node:20",
      concept: "Inspecting a newly tagged image demonstrates that tagging changes the reference name, not the underlying filesystem layers.",
      hint: "Use Docker’s image metadata inspection workflow and target the alias you created in the previous task.",
      check: (ctx) => ctx.commandRan("docker image inspect stackforge-node:20")
    },
    {
      id: "task-021",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Read Dockerignore",
      heading: "Review build exclusions",
      difficulty: "INTERMEDIATE",
      description: "Inspect files excluded from the Docker build context.",
      objective: "Display the .dockerignore file to review which files are excluded from build context.",
      command: "cat .dockerignore",
      concept: "A good .dockerignore reduces build context size, protects secrets, speeds builds, and avoids unnecessary cache invalidation.",
      hint: "Hidden files can be printed like ordinary files. Use the same file-reading command from the first module and include the leading dot in the filename.",
      check: (ctx) => ctx.commandRan("cat .dockerignore")
    },
    {
      id: "task-022",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Read Package Manifest",
      heading: "Inspect application dependencies",
      difficulty: "INTERMEDIATE",
      description: "Review package.json before building the application image.",
      objective: "Display package.json to review the Node.js application metadata and scripts.",
      command: "cat package.json",
      concept: "Application manifests influence dependency installation and Docker layer caching, especially when COPY and RUN steps are ordered carefully.",
      hint: "Use the terminal file-printing utility and pass the package manifest filename shown in Explorer.",
      check: (ctx) => ctx.commandRan("cat package.json")
    },
    {
      id: "task-023",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Build Web Image v1",
      heading: "Create the first app image",
      difficulty: "INTERMEDIATE",
      description: "Build the current project with a versioned tag.",
      objective: "Build the first versioned STACKFORGE web image from the current project directory.",
      command: "docker build -t stackforge-web:v1 .",
      concept: "Versioned tags make image promotion, rollback, and testing safer than overwriting one ambiguous tag.",
      hint: "Use Docker’s build action. Add the tag option with the requested repository:tag, and remember that the final argument identifies the build context.",
      check: (ctx) => ctx.hasImage("stackforge-web:v1")
    },
    {
      id: "task-024",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Inspect Build v1",
      heading: "Validate build output",
      difficulty: "INTERMEDIATE",
      description: "Inspect the image created from your Dockerfile.",
      objective: "Inspect the metadata of the first STACKFORGE web image build.",
      command: "docker image inspect stackforge-web:v1",
      concept: "Inspecting a fresh build verifies its runtime configuration before you create containers from it.",
      hint: "Use the image inspection workflow and target the versioned image produced by the previous task.",
      check: (ctx) => ctx.commandRan("docker image inspect stackforge-web:v1")
    },
    {
      id: "task-025",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Build Web Image v2",
      heading: "Create a second release",
      difficulty: "INTERMEDIATE",
      description: "Build a second version of the application image.",
      objective: "Build a second version of the STACKFORGE web image from the current project directory.",
      command: "docker build -t stackforge-web:v2 .",
      concept: "Multiple tags let teams test changes side by side and keep rollback points during development and deployment.",
      hint: "Repeat the build workflow, but assign the requested v2 tag with Docker’s tagging option during the build.",
      check: (ctx) => ctx.hasImage("stackforge-web:v2")
    },
    {
      id: "task-026",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Promote Stable Tag",
      heading: "Create a release alias",
      difficulty: "INTERMEDIATE",
      description: "Point a stable release tag at the v2 image.",
      objective: "Create a stable alias for the second web image without rebuilding it.",
      command: "docker tag stackforge-web:v2 stackforge-web:stable",
      concept: "Promotion tags such as stable, staging, or production can represent deployment channels while immutable version tags preserve traceability.",
      hint: "Use Docker’s tag operation. The existing v2 image is the source; the stable image reference is the target.",
      check: (ctx) => ctx.hasImage("stackforge-web:stable")
    },
    {
      id: "task-027",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Inspect Stable Image",
      heading: "Verify release promotion",
      difficulty: "INTERMEDIATE",
      description: "Inspect the promoted stable image reference.",
      objective: "Inspect the stable image alias to verify that it exists.",
      command: "docker image inspect stackforge-web:stable",
      concept: "Verification after tagging reduces mistakes before deployment and confirms the expected image reference exists locally.",
      hint: "Use the image metadata inspection command group and point it at the stable tag created in the prior task.",
      check: (ctx) => ctx.commandRan("docker image inspect stackforge-web:stable")
    },
    {
      id: "task-028",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Build Worker Image",
      heading: "Practice another build tag",
      difficulty: "INTERMEDIATE",
      description: "Create a temporary worker image from the same lab build context.",
      objective: "Build the requested worker image from the same current project directory.",
      command: "docker build -t stackforge-worker:v1 .",
      concept: "Building under different tags reinforces that image naming is independent of the Dockerfile file name and build context.",
      hint: "Reuse the build pattern: build action, tag option, requested repository:tag, then the current directory as context.",
      check: (ctx) => ctx.hasImage("stackforge-worker:v1")
    },
    {
      id: "task-029",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Inspect Worker Image",
      heading: "Audit temporary build",
      difficulty: "INTERMEDIATE",
      description: "Inspect the worker image before cleanup.",
      objective: "Inspect the worker image metadata after the build succeeds.",
      command: "docker image inspect stackforge-worker:v1",
      concept: "Inspect-before-delete is a disciplined operations habit when verifying what a resource contains or whether it is the intended target.",
      hint: "Use Docker’s image command group and its metadata inspection action, followed by the worker image reference.",
      check: (ctx) => ctx.commandRan("docker image inspect stackforge-worker:v1")
    },
    {
      id: "task-030",
      module: "MODULE 3 \u00b7 DOCKERFILE & BUILDS",
      short: "Remove Worker Image",
      heading: "Clean an unused image",
      difficulty: "INTERMEDIATE",
      description: "Remove the temporary worker image while preserving the web releases.",
      objective: "Remove the temporary worker image from the local image cache.",
      command: "docker rmi stackforge-worker:v1",
      concept: "Removing unused images frees disk space. Docker prevents removal when a referenced image is still required by containers.",
      hint: "Docker has a short top-level command specifically for removing images. Supply the complete repository:tag of the worker image.",
      check: (ctx) => ctx.commandRan("docker rmi stackforge-worker:v1") && !ctx.hasImage("stackforge-worker:v1")
    },
    {
      id: "task-031",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Run Primary Web",
      heading: "Create a named container",
      difficulty: "INTERMEDIATE",
      description: "Start stackforge-web:v1 detached and publish host port 8080 to container port 3000.",
      objective: "Launch the primary web container in the background with the required name and host-to-container port mapping.",
      command: "docker run -d -p 8080:3000 --name web-primary stackforge-web:v1",
      concept: "A container is a runtime instance of an image. Naming and published ports make it easier to operate and reach the service.",
      hint: "Use Docker’s container launch action. Combine detached mode, a port mapping in HOST:CONTAINER form, a container name, and the requested image reference.",
      check: (ctx) => ctx.hasContainer("web-primary", true)
    },
    {
      id: "task-032",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "List Running Containers",
      heading: "Verify runtime state",
      difficulty: "INTERMEDIATE",
      description: "Confirm that web-primary is active.",
      objective: "Display only containers that are currently running.",
      command: "docker ps",
      concept: "Container listings are the fastest way to verify state, image, published ports, and names.",
      hint: "Docker’s process-status command lists active containers by default; no all-containers flag is needed.",
      check: (ctx) => ctx.commandRan("docker ps") && ctx.hasContainer("web-primary", true)
    },
    {
      id: "task-033",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Read Web Logs",
      heading: "Observe application output",
      difficulty: "INTERMEDIATE",
      description: "Inspect stdout and stderr from web-primary.",
      objective: "Display the application logs produced by the primary web container.",
      command: "docker logs web-primary",
      concept: "Logs are a primary troubleshooting surface for application startup failures, exceptions, and runtime messages.",
      hint: "Use Docker’s log-reading subcommand and identify the target by its container name.",
      check: (ctx) => ctx.commandRan("docker logs web-primary")
    },
    {
      id: "task-034",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Inspect Web Container",
      heading: "Read low-level container data",
      difficulty: "INTERMEDIATE",
      description: "Inspect configuration and runtime metadata for web-primary.",
      objective: "Display detailed runtime metadata for the primary web container.",
      command: "docker inspect web-primary",
      concept: "Container inspection reveals image references, state, ports, networking, mounts, environment data, and host configuration.",
      hint: "Use Docker’s general inspection subcommand. It accepts a container name or container ID as the target.",
      check: (ctx) => ctx.commandRan("docker inspect web-primary")
    },
    {
      id: "task-035",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Inspect Port Mapping",
      heading: "Verify published ports",
      difficulty: "INTERMEDIATE",
      description: "Confirm which host port exposes the application.",
      objective: "Display the published port mapping for the primary web container.",
      command: "docker port web-primary",
      concept: "Published ports bridge host networking to a container port and are essential for making services reachable outside the container network.",
      hint: "Docker has a subcommand dedicated to showing a container’s port bindings. Pass the container name as the target.",
      check: (ctx) => ctx.commandRan("docker port web-primary")
    },
    {
      id: "task-036",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Inspect Processes",
      heading: "View container processes",
      difficulty: "INTERMEDIATE",
      description: "List the processes running inside web-primary.",
      objective: "Display the processes currently running inside the primary web container.",
      command: "docker top web-primary",
      concept: "Process inspection helps confirm the intended main process is actually running inside a container.",
      hint: "Use Docker’s process-listing subcommand for containers, then identify the primary container by name.",
      check: (ctx) => ctx.commandRan("docker top web-primary")
    },
    {
      id: "task-037",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Measure Container Usage",
      heading: "Read live resource metrics",
      difficulty: "INTERMEDIATE",
      description: "Inspect CPU and memory usage for web-primary.",
      objective: "Display live resource statistics for the primary web container.",
      command: "docker stats web-primary",
      concept: "Resource metrics help identify runaway CPU, memory pressure, and capacity issues during operations.",
      hint: "Use Docker’s runtime statistics subcommand and limit it to the named primary container.",
      check: (ctx) => ctx.commandRan("docker stats web-primary")
    },
    {
      id: "task-038",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Exec Working Directory",
      heading: "Run an internal diagnostic",
      difficulty: "INTERMEDIATE",
      description: "Execute pwd inside the running container.",
      objective: "Execute a command inside the running primary container to display its working directory.",
      command: "docker exec web-primary pwd",
      concept: "docker exec starts an additional process inside an existing container, making it useful for non-destructive diagnostics.",
      hint: "Use the Docker subcommand for executing a process inside an existing container. The general pattern is: Docker + exec action + CONTAINER + COMMAND.",
      check: (ctx) => ctx.commandRan("docker exec web-primary pwd")
    },
    {
      id: "task-039",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Exec File Listing",
      heading: "Inspect container filesystem",
      difficulty: "INTERMEDIATE",
      description: "List application files from inside web-primary.",
      objective: "Execute a command inside the primary container to list its files.",
      command: "docker exec web-primary ls",
      concept: "Inspecting the runtime filesystem can verify whether expected application artifacts were copied into the image.",
      hint: "Reuse the exec pattern from the previous task, but change the command that runs inside the container to the standard directory-listing utility.",
      check: (ctx) => ctx.commandRan("docker exec web-primary ls")
    },
    {
      id: "task-040",
      module: "MODULE 4 \u00b7 CONTAINER BASICS",
      short: "Check Runtime Version",
      heading: "Verify software inside container",
      difficulty: "INTERMEDIATE",
      description: "Confirm the Node.js runtime version used by the application.",
      objective: "Execute Node.js inside the primary container and display its runtime version.",
      command: "docker exec web-primary node --version",
      concept: "Runtime verification is useful when debugging version differences between local development and containerized execution.",
      hint: "Use Docker exec against the primary container. The inner command should invoke Node with its version-reporting option.",
      check: (ctx) => ctx.commandRan("docker exec web-primary node --version")
    },
    {
      id: "task-041",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Inspect Environment",
      heading: "Read container environment",
      difficulty: "INTERMEDIATE",
      description: "Display environment variables from web-primary.",
      objective: "Display the environment variables available inside the primary container.",
      command: "docker exec web-primary env",
      concept: "Environment variables are a common mechanism for injecting runtime configuration without rebuilding images.",
      hint: "Use Docker exec and run the standard Linux utility that prints the current process environment.",
      check: (ctx) => ctx.commandRan("docker exec web-primary env")
    },
    {
      id: "task-042",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Check Container User",
      heading: "Identify runtime user",
      difficulty: "INTERMEDIATE",
      description: "Determine which user executes commands inside web-primary.",
      objective: "Determine which user account the process runs as inside the primary container.",
      command: "docker exec web-primary whoami",
      concept: "Container user identity is important for least-privilege security and file permission troubleshooting.",
      hint: "Use Docker exec and run the common Linux command that prints the current username.",
      check: (ctx) => ctx.commandRan("docker exec web-primary whoami")
    },
    {
      id: "task-043",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Run Diagnostic Echo",
      heading: "Practice safe exec",
      difficulty: "INTERMEDIATE",
      description: "Execute a harmless diagnostic command inside web-primary.",
      objective: "Run a simple diagnostic echo inside the primary container using the required message.",
      command: "docker exec web-primary echo STACKFORGE-OK",
      concept: "Small diagnostics are useful for confirming exec connectivity without changing container state.",
      hint: "Use Docker exec. After the container name, run the shell utility that prints text and provide the message specified by the task.",
      check: (ctx) => ctx.commandRan("docker exec web-primary echo STACKFORGE-OK")
    },
    {
      id: "task-044",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Stop Primary Container",
      heading: "Gracefully stop a service",
      difficulty: "INTERMEDIATE",
      description: "Stop web-primary without deleting it.",
      objective: "Stop the primary web container without deleting it.",
      command: "docker stop web-primary",
      concept: "Stopping preserves container metadata and writable-layer state while ending the running process.",
      hint: "Choose the Docker lifecycle subcommand that changes a running container to a stopped state while preserving it for later reuse.",
      check: (ctx) => ctx.containerStatus("web-primary") === "stopped"
    },
    {
      id: "task-045",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "List All Containers",
      heading: "Find stopped resources",
      difficulty: "INTERMEDIATE",
      description: "Display both running and stopped containers.",
      objective: "Display both running and stopped containers in one list.",
      command: "docker ps -a",
      concept: "docker ps -a is essential when a container seems to disappear after exiting or being stopped.",
      hint: "Start from Docker’s normal process-status command and add the flag meaning “all.”",
      check: (ctx) => ctx.commandRan("docker ps -a") && ctx.containerStatus("web-primary") === "stopped"
    },
    {
      id: "task-046",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Start Existing Container",
      heading: "Resume a stopped service",
      difficulty: "INTERMEDIATE",
      description: "Start web-primary again without creating a replacement.",
      objective: "Start the previously stopped primary container without creating a new container.",
      command: "docker start web-primary",
      concept: "docker start reuses the existing container, whereas docker run creates a new container from an image.",
      hint: "Use the lifecycle action for an existing stopped container. Do not use the command that creates a new container.",
      check: (ctx) => ctx.hasContainer("web-primary", true)
    },
    {
      id: "task-047",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Restart Primary Container",
      heading: "Cycle the service",
      difficulty: "INTERMEDIATE",
      description: "Restart web-primary in one command.",
      objective: "Restart the primary container in a single lifecycle operation.",
      command: "docker restart web-primary",
      concept: "Restart combines stop and start and is useful after configuration changes that do not require rebuilding the image.",
      hint: "Docker has a dedicated lifecycle action that performs stop and start as one operation. Target the primary container by name.",
      check: (ctx) => ctx.commandRan("docker restart web-primary") && ctx.hasContainer("web-primary", true)
    },
    {
      id: "task-048",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Run Secondary Web",
      heading: "Create a second instance",
      difficulty: "INTERMEDIATE",
      description: "Run a second app container on host port 8081 using the stable tag.",
      objective: "Launch a second web container from the stable image using a unique name and the required alternate host port.",
      command: "docker run -d -p 8081:3000 --name web-secondary stackforge-web:stable",
      concept: "Multiple containers can run from the same image when names and published host ports do not conflict.",
      hint: "Reuse the detached container-launch pattern. Keep the application’s internal port the same, but publish it on the different host port specified by the task.",
      check: (ctx) => ctx.hasContainer("web-secondary", true)
    },
    {
      id: "task-049",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Verify Two Instances",
      heading: "Observe horizontal instances",
      difficulty: "INTERMEDIATE",
      description: "Confirm both web-primary and web-secondary are running.",
      objective: "Verify that both web container instances are currently running.",
      command: "docker ps",
      concept: "Running multiple instances illustrates the separation between immutable images and independent container runtime state.",
      hint: "Use Docker’s default running-container listing and confirm that both expected names appear in the result.",
      check: (ctx) => ctx.commandRan("docker ps") && ctx.hasContainer("web-primary", true) && ctx.hasContainer("web-secondary", true)
    },
    {
      id: "task-050",
      module: "MODULE 5 \u00b7 CONTAINER LIFECYCLE",
      short: "Stop Secondary Web",
      heading: "Prepare a container for removal",
      difficulty: "INTERMEDIATE",
      description: "Stop web-secondary before deleting it.",
      objective: "Stop the secondary web container while leaving the primary instance running.",
      command: "docker stop web-secondary",
      concept: "Graceful stopping is preferred before deletion when you want the main process to receive a termination signal and exit cleanly.",
      hint: "Use the container stop lifecycle action and target only the secondary container name.",
      check: (ctx) => ctx.containerStatus("web-secondary") === "stopped"
    },
    {
      id: "task-051",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Remove Secondary Web",
      heading: "Delete a stopped container",
      difficulty: "INTERMEDIATE",
      description: "Remove web-secondary after it has been stopped.",
      objective: "Remove the stopped secondary web container from Docker’s container inventory.",
      command: "docker rm web-secondary",
      concept: "Deleting a container does not automatically delete the image it was created from.",
      hint: "Removal is separate from stopping. Use Docker’s container-removal action after the target is no longer running.",
      check: (ctx) => ctx.commandRan("docker rm web-secondary") && !ctx.hasContainer("web-secondary")
    },
    {
      id: "task-052",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Run Temporary Worker",
      heading: "Create an ephemeral workload",
      difficulty: "INTERMEDIATE",
      description: "Start a temporary worker-style container from the stable image.",
      objective: "Launch the temporary worker container in detached mode without publishing a host port.",
      command: "docker run -d --name worker-temp stackforge-web:stable",
      concept: "Not every container exposes a network port; background workers and scheduled jobs can run without host port mappings.",
      hint: "Use the normal detached container-launch pattern with a name and image, but omit the port-publication option because this worker does not expose a service.",
      check: (ctx) => ctx.hasContainer("worker-temp", true)
    },
    {
      id: "task-053",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Stop Temporary Worker",
      heading: "End the temporary workload",
      difficulty: "INTERMEDIATE",
      description: "Stop worker-temp cleanly.",
      objective: "Stop the temporary worker container.",
      command: "docker stop worker-temp",
      concept: "Separating stop from remove helps students understand lifecycle state versus resource deletion.",
      hint: "Use the same stop lifecycle action practiced earlier, but target the worker container name.",
      check: (ctx) => ctx.containerStatus("worker-temp") === "stopped"
    },
    {
      id: "task-054",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Remove Temporary Worker",
      heading: "Delete the temporary resource",
      difficulty: "INTERMEDIATE",
      description: "Remove worker-temp after it stops.",
      objective: "Remove the stopped temporary worker container.",
      command: "docker rm worker-temp",
      concept: "Regular cleanup prevents accumulation of exited containers and keeps operational views easier to interpret.",
      hint: "Use Docker’s container-removal action and provide the worker container name.",
      check: (ctx) => ctx.commandRan("docker rm worker-temp") && !ctx.hasContainer("worker-temp")
    },
    {
      id: "task-055",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Use Container Command Group",
      heading: "Practice structured CLI syntax",
      difficulty: "INTERMEDIATE",
      description: "List active containers through the container command group.",
      objective: "List running containers using Docker’s structured container command group.",
      command: "docker container ls",
      concept: "Structured command groups make Docker CLI organization more discoverable and align related subcommands under one resource type.",
      hint: "Instead of the classic process-status alias, start with Docker’s singular container command group and then choose its list action.",
      check: (ctx) => ctx.commandRan("docker container ls") && ctx.hasContainer("web-primary", true)
    },
    {
      id: "task-056",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "List All via Command Group",
      heading: "Inspect all lifecycle states",
      difficulty: "INTERMEDIATE",
      description: "Use the structured container command group to include stopped containers.",
      objective: "List both running and stopped containers using the structured container command group.",
      command: "docker container ls -a",
      concept: "Equivalent command forms are common in Docker documentation; recognizing them improves command-line literacy.",
      hint: "Extend the structured container listing from the previous task with the option that includes all container states.",
      check: (ctx) => ctx.commandRan("docker container ls -a")
    },
    {
      id: "task-057",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "View Aggregate Stats",
      heading: "Observe all running workloads",
      difficulty: "INTERMEDIATE",
      description: "Display resource usage for every active container.",
      objective: "Display aggregate live resource statistics for all running containers.",
      command: "docker stats",
      concept: "Aggregate resource views are useful for comparing workloads and spotting resource outliers.",
      hint: "Use Docker’s statistics command without specifying a container name so the simulator reports every running container.",
      check: (ctx) => ctx.commandRan("docker stats")
    },
    {
      id: "task-058",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Inspect Docker Disk Usage",
      heading: "Review storage consumption",
      difficulty: "INTERMEDIATE",
      description: "Display image, container, and volume disk usage.",
      objective: "Display Docker’s image, container, volume, and build-cache disk usage summary.",
      command: "docker system df",
      concept: "docker system df helps identify which Docker resource categories consume disk before cleanup.",
      hint: "Use Docker’s system-level command group and choose the familiar Unix abbreviation for disk-free/usage reporting.",
      check: (ctx) => ctx.commandRan("docker system df")
    },
    {
      id: "task-059",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Stop Primary Before Cleanup",
      heading: "Prepare final standalone cleanup",
      difficulty: "INTERMEDIATE",
      description: "Stop web-primary before deleting it.",
      objective: "Stop the primary web container so it can be safely removed.",
      command: "docker stop web-primary",
      concept: "A controlled cleanup sequence is stop, verify, remove, then optionally remove unused images.",
      hint: "Use the lifecycle stop action on the remaining primary container before attempting deletion.",
      check: (ctx) => ctx.containerStatus("web-primary") === "stopped"
    },
    {
      id: "task-060",
      module: "MODULE 6 \u00b7 OPERATIONS & CLEANUP",
      short: "Remove Primary Container",
      heading: "Finish standalone cleanup",
      difficulty: "INTERMEDIATE",
      description: "Delete web-primary while keeping the reusable images.",
      objective: "Remove the stopped primary web container from the local container inventory.",
      command: "docker rm web-primary",
      concept: "Containers are disposable runtime objects; images should remain reusable until they are no longer needed.",
      hint: "Once the container is stopped, use Docker’s removal action and target it by name.",
      check: (ctx) => ctx.commandRan("docker rm web-primary") && !ctx.hasContainer("web-primary")
    },
    {
      id: "task-061",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "List Volumes",
      heading: "Inspect persistent resources",
      difficulty: "ADVANCED",
      description: "List Docker-managed volumes currently available.",
      objective: "Display the current Docker volume inventory.",
      command: "docker volume ls",
      concept: "Volumes persist data independently from a container writable layer and are the preferred mechanism for durable container data.",
      hint: "Enter Docker’s volume command group and choose its list subcommand.",
      check: (ctx) => ctx.commandRan("docker volume ls")
    },
    {
      id: "task-062",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Create App Data Volume",
      heading: "Provision persistent storage",
      difficulty: "ADVANCED",
      description: "Create the main application data volume.",
      objective: "Create a named volume for STACKFORGE application data.",
      command: "docker volume create stackforge-data",
      concept: "Named volumes can be attached to replacement containers without tying data to a specific container lifecycle.",
      hint: "Use Docker’s volume command group followed by the action that creates a resource, then provide the requested volume name.",
      check: (ctx) => ctx.hasVolume("stackforge-data")
    },
    {
      id: "task-063",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Inspect App Data Volume",
      heading: "Read volume metadata",
      difficulty: "ADVANCED",
      description: "Inspect the mountpoint, driver, and scope of stackforge-data.",
      objective: "Inspect the metadata of the STACKFORGE application data volume.",
      command: "docker volume inspect stackforge-data",
      concept: "Volume inspection helps trace where Docker manages persistent data and which driver is responsible for it.",
      hint: "Within Docker’s volume command group, choose the metadata-inspection action and target the named volume.",
      check: (ctx) => ctx.commandRan("docker volume inspect stackforge-data")
    },
    {
      id: "task-064",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Create Database Volume",
      heading: "Separate database persistence",
      difficulty: "ADVANCED",
      description: "Create a dedicated volume for database data.",
      objective: "Create the requested named volume for database persistence.",
      command: "docker volume create database-data",
      concept: "Separating data domains into distinct volumes improves backup, migration, and lifecycle management.",
      hint: "Use the same volume-creation pattern as the previous creation task, substituting the database volume name.",
      check: (ctx) => ctx.hasVolume("database-data")
    },
    {
      id: "task-065",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Inspect Database Volume",
      heading: "Audit persistent storage",
      difficulty: "ADVANCED",
      description: "Inspect database-data.",
      objective: "Inspect the database persistence volume after creating it.",
      command: "docker volume inspect database-data",
      concept: "Inspecting each storage resource reinforces identification by name and helps verify it exists before use.",
      hint: "Use the volume inspection workflow and target the database volume by its exact name.",
      check: (ctx) => ctx.commandRan("docker volume inspect database-data")
    },
    {
      id: "task-066",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Create Uploads Volume",
      heading: "Provision temporary practice storage",
      difficulty: "ADVANCED",
      description: "Create a volume named uploads-data.",
      objective: "Create the requested named volume for uploaded files.",
      command: "docker volume create uploads-data",
      concept: "Application uploads often need persistence outside a container so that redeployments do not erase user data.",
      hint: "Repeat the named-volume creation workflow with the uploads volume name specified in the task.",
      check: (ctx) => ctx.hasVolume("uploads-data")
    },
    {
      id: "task-067",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Inspect Uploads Volume",
      heading: "Verify uploads storage",
      difficulty: "ADVANCED",
      description: "Inspect uploads-data before removing it.",
      objective: "Inspect the uploads volume before removing it.",
      command: "docker volume inspect uploads-data",
      concept: "A verify-before-delete workflow reduces the risk of removing the wrong persistent resource.",
      hint: "Use the volume metadata-inspection action so you verify the resource before cleanup.",
      check: (ctx) => ctx.commandRan("docker volume inspect uploads-data")
    },
    {
      id: "task-068",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Remove Uploads Volume",
      heading: "Practice volume cleanup",
      difficulty: "ADVANCED",
      description: "Delete the unused uploads-data volume.",
      objective: "Remove the uploads volume from Docker’s volume inventory.",
      command: "docker volume rm uploads-data",
      concept: "Deleting a volume is destructive in real Docker environments, so operators should confirm it is unused and backed up when necessary.",
      hint: "Within the volume command group, choose the resource-removal action and provide the uploads volume name.",
      check: (ctx) => ctx.commandRan("docker volume rm uploads-data") && !ctx.hasVolume("uploads-data")
    },
    {
      id: "task-069",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Create Backup Volume",
      heading: "Prepare a backup target",
      difficulty: "ADVANCED",
      description: "Create backup-data as another persistent storage resource.",
      objective: "Create the requested named volume for backup data.",
      command: "docker volume create backup-data",
      concept: "Backup workflows often use separate storage targets so operational and backup data can be managed independently.",
      hint: "Use the same named-volume creation pattern and supply the backup volume name from the task.",
      check: (ctx) => ctx.hasVolume("backup-data")
    },
    {
      id: "task-070",
      module: "MODULE 7 \u00b7 VOLUMES & PERSISTENCE",
      short: "Audit Volume Inventory",
      heading: "Verify persistence layout",
      difficulty: "ADVANCED",
      description: "List volumes and confirm the three intended persistent resources remain.",
      objective: "Audit the volume inventory and confirm the required persistent volumes remain.",
      command: "docker volume ls",
      concept: "Periodic resource inventory is part of sound Docker administration and capacity planning.",
      hint: "Use the volume listing operation and verify the application, database, and backup volumes are present.",
      check: (ctx) => ctx.commandRan("docker volume ls") && ["stackforge-data","database-data","backup-data"].every((name) => ctx.hasVolume(name)) && !ctx.hasVolume("uploads-data")
    },
    {
      id: "task-071",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "List Networks",
      heading: "Inspect available networks",
      difficulty: "ADVANCED",
      description: "List Docker networks and identify the default bridge.",
      objective: "Display Docker’s current network inventory.",
      command: "docker network ls",
      concept: "Docker networks isolate traffic and provide communication paths between containers and services.",
      hint: "Enter Docker’s network command group and choose its list action.",
      check: (ctx) => ctx.commandRan("docker network ls")
    },
    {
      id: "task-072",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Create Frontend Network",
      heading: "Provision an app network",
      difficulty: "ADVANCED",
      description: "Create a user-defined bridge network for frontend services.",
      objective: "Create the requested custom frontend network.",
      command: "docker network create frontend-net",
      concept: "User-defined bridge networks provide better isolation and automatic DNS-based name resolution between attached containers.",
      hint: "Use Docker’s network command group followed by the create action, then provide the requested network name.",
      check: (ctx) => ctx.hasNetwork("frontend-net")
    },
    {
      id: "task-073",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Inspect Frontend Network",
      heading: "Read network metadata",
      difficulty: "ADVANCED",
      description: "Inspect subnet, gateway, scope, and driver information.",
      objective: "Inspect the frontend network metadata.",
      command: "docker network inspect frontend-net",
      concept: "Network inspection is important for diagnosing IP allocation, driver selection, and service connectivity.",
      hint: "Within the network command group, use the metadata-inspection action and target the frontend network.",
      check: (ctx) => ctx.commandRan("docker network inspect frontend-net")
    },
    {
      id: "task-074",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Create Backend Network",
      heading: "Separate service tiers",
      difficulty: "ADVANCED",
      description: "Create backend-net for internal application services.",
      objective: "Create a second custom network for backend communication.",
      command: "docker network create backend-net",
      concept: "Separating frontend and backend traffic is a common segmentation pattern that reduces unnecessary service exposure.",
      hint: "Repeat the custom-network creation workflow with the backend network name specified by the task.",
      check: (ctx) => ctx.hasNetwork("backend-net")
    },
    {
      id: "task-075",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Inspect Backend Network",
      heading: "Audit internal network",
      difficulty: "ADVANCED",
      description: "Inspect backend-net.",
      objective: "Inspect the backend network metadata.",
      command: "docker network inspect backend-net",
      concept: "Repeated network inspection builds fluency in reading Docker network topology and addressing information.",
      hint: "Use the network inspection workflow and target the backend network you just created.",
      check: (ctx) => ctx.commandRan("docker network inspect backend-net")
    },
    {
      id: "task-076",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Create Observability Network",
      heading: "Provision monitoring connectivity",
      difficulty: "ADVANCED",
      description: "Create observability-net for monitoring practice.",
      objective: "Create the custom network intended for monitoring and observability services.",
      command: "docker network create observability-net",
      concept: "Dedicated monitoring networks can isolate observability traffic from application and database communication.",
      hint: "Use the network creation pattern again and supply the observability network name from the task.",
      check: (ctx) => ctx.hasNetwork("observability-net")
    },
    {
      id: "task-077",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Inspect Observability Network",
      heading: "Verify monitoring network",
      difficulty: "ADVANCED",
      description: "Inspect observability-net before cleanup.",
      objective: "Inspect the observability network metadata.",
      command: "docker network inspect observability-net",
      concept: "Verification ensures the intended network resource exists before services are attached to it.",
      hint: "Use Docker’s network inspection action to review the network created in the previous task.",
      check: (ctx) => ctx.commandRan("docker network inspect observability-net")
    },
    {
      id: "task-078",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Remove Observability Network",
      heading: "Clean unused network",
      difficulty: "ADVANCED",
      description: "Delete observability-net.",
      objective: "Remove the observability network from the custom network inventory.",
      command: "docker network rm observability-net",
      concept: "Unused custom networks should be removed to keep environments understandable and reduce stale configuration.",
      hint: "Within the network command group, choose the removal action and supply the observability network name.",
      check: (ctx) => ctx.commandRan("docker network rm observability-net") && !ctx.hasNetwork("observability-net")
    },
    {
      id: "task-079",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Remove Backend Network",
      heading: "Practice network lifecycle",
      difficulty: "ADVANCED",
      description: "Delete backend-net while preserving frontend-net.",
      objective: "Remove the backend network while preserving the frontend network.",
      command: "docker network rm backend-net",
      concept: "Network lifecycle management includes deliberate creation, inspection, use, and cleanup.",
      hint: "Use the same network removal action, targeting only the backend network by name.",
      check: (ctx) => ctx.commandRan("docker network rm backend-net") && !ctx.hasNetwork("backend-net")
    },
    {
      id: "task-080",
      module: "MODULE 8 \u00b7 DOCKER NETWORKING",
      short: "Audit Network Inventory",
      heading: "Verify final topology",
      difficulty: "ADVANCED",
      description: "List networks and confirm frontend-net remains while temporary networks are gone.",
      objective: "Audit Docker’s network inventory after cleanup.",
      command: "docker network ls",
      concept: "A final network inventory is a useful validation step before deployment or handoff.",
      hint: "Use the network listing operation and confirm the expected custom network remains alongside Docker’s defaults.",
      check: (ctx) => ctx.commandRan("docker network ls") && ctx.hasNetwork("frontend-net") && !ctx.hasNetwork("backend-net") && !ctx.hasNetwork("observability-net")
    },
    {
      id: "task-081",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Validate Compose Model",
      heading: "Check YAML configuration",
      difficulty: "ADVANCED",
      description: "Validate and render the effective Compose application model.",
      objective: "Validate and render the Docker Compose model before starting any services.",
      command: "docker compose config",
      concept: "Configuration validation catches structural problems before Compose creates runtime resources.",
      hint: "Start with Docker’s Compose command group and use the subcommand that parses, resolves, and prints the effective configuration.",
      check: (ctx) => ctx.commandRan("docker compose config") && ctx.composeValid
    },
    {
      id: "task-082",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Start Compose Stack",
      heading: "Launch multi-container services",
      difficulty: "ADVANCED",
      description: "Start the application and database services in detached mode.",
      objective: "Start the Compose application stack in detached/background mode.",
      command: "docker compose up -d",
      concept: "Compose turns declarative service definitions into repeatable networks, volumes, images, and containers.",
      hint: "Use the Compose action that creates and starts services, then add the option that keeps them running in the background.",
      check: (ctx) => ctx.composeRunning
    },
    {
      id: "task-083",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "List Compose Services",
      heading: "Inspect stack state",
      difficulty: "ADVANCED",
      description: "Display services created by the Compose project.",
      objective: "Display the service/container status for the current Compose project.",
      command: "docker compose ps",
      concept: "Compose-aware process listings map containers back to declared services, making stack-level operations easier.",
      hint: "Within the Compose command group, use the process-status subcommand that lists project services.",
      check: (ctx) => ctx.commandRan("docker compose ps") && ctx.composeRunning
    },
    {
      id: "task-084",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Read Compose Logs",
      heading: "Troubleshoot service startup",
      difficulty: "ADVANCED",
      description: "Read combined logs from the application and database services.",
      objective: "Display logs produced by services in the current Compose project.",
      command: "docker compose logs",
      concept: "Aggregated logs help trace dependencies and startup order across multiple services in one application stack.",
      hint: "Use the Compose subcommand dedicated to aggregating service logs.",
      check: (ctx) => ctx.commandRan("docker compose logs") && ctx.composeRunning
    },
    {
      id: "task-085",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Inspect Compose Web",
      heading: "Audit generated web container",
      difficulty: "ADVANCED",
      description: "Inspect the web container created by Compose.",
      objective: "Inspect the runtime metadata of the Compose-created web container.",
      command: "docker inspect stackforge-web",
      concept: "Inspecting Compose-generated containers connects declarative YAML settings to actual runtime configuration.",
      hint: "Leave the Compose command group and use Docker’s general container inspection action on the web container name created by the project.",
      check: (ctx) => ctx.commandRan("docker inspect stackforge-web") && ctx.hasContainer("stackforge-web")
    },
    {
      id: "task-086",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Inspect Compose Database",
      heading: "Audit generated database container",
      difficulty: "ADVANCED",
      description: "Inspect the database container created by Compose.",
      objective: "Inspect the runtime metadata of the Compose-created database container.",
      command: "docker inspect stackforge-db",
      concept: "Database inspection reinforces how service images, networks, and runtime state are materialized by Compose.",
      hint: "Use Docker’s general inspection action again, this time targeting the database container created by Compose.",
      check: (ctx) => ctx.commandRan("docker inspect stackforge-db") && ctx.hasContainer("stackforge-db")
    },
    {
      id: "task-087",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Measure Compose Web",
      heading: "Check service resource usage",
      difficulty: "ADVANCED",
      description: "Display runtime metrics for the Compose web service container.",
      objective: "Display live resource statistics for the Compose web container.",
      command: "docker stats stackforge-web",
      concept: "Operational monitoring applies equally to containers created manually and containers created by Compose.",
      hint: "Use Docker’s statistics action and provide the Compose web container name as the target.",
      check: (ctx) => ctx.commandRan("docker stats stackforge-web") && ctx.composeRunning
    },
    {
      id: "task-088",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Stop Compose Services",
      heading: "Pause the stack without deleting it",
      difficulty: "ADVANCED",
      description: "Stop Compose services while keeping their containers available for restart.",
      objective: "Stop the Compose services without deleting their project containers.",
      command: "docker compose stop",
      concept: "compose stop halts services but preserves containers and project resources, making restart fast.",
      hint: "Within the Compose command group, choose the lifecycle action that stops services but preserves the project resources for later restart.",
      check: (ctx) => ctx.commandRan("docker compose stop") && !ctx.composeRunning && ctx.containerStatus("stackforge-web") === "stopped" && ctx.containerStatus("stackforge-db") === "stopped"
    },
    {
      id: "task-089",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Restart Compose Services",
      heading: "Resume the existing stack",
      difficulty: "ADVANCED",
      description: "Start the previously stopped Compose containers.",
      objective: "Start the existing stopped Compose services again without recreating the stack.",
      command: "docker compose start",
      concept: "compose start resumes existing service containers without recreating the project.",
      hint: "Use the Compose lifecycle action designed to start previously stopped project containers.",
      check: (ctx) => ctx.commandRan("docker compose start") && ctx.composeRunning
    },
    {
      id: "task-090",
      module: "MODULE 9 \u00b7 DOCKER COMPOSE",
      short: "Remove Compose Stack",
      heading: "Cleanly tear down services",
      difficulty: "ADVANCED",
      description: "Stop and remove Compose containers and project networking.",
      objective: "Shut down the Compose application and remove the project runtime resources.",
      command: "docker compose down",
      concept: "docker compose down removes project containers and default networks while named volumes remain unless explicitly requested for deletion.",
      hint: "Use the Compose action intended for tearing down a project rather than merely stopping it.",
      check: (ctx) => ctx.commandRan("docker compose down") && !ctx.composeRunning && !ctx.hasContainer("stackforge-web") && !ctx.hasContainer("stackforge-db")
    },
    {
      id: "task-091",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Build Capstone Image",
      heading: "Create a release candidate",
      difficulty: "EXPERT",
      description: "Build a final application image for the capstone workflow.",
      objective: "Build the versioned capstone application image from the current project directory.",
      command: "docker build -t capstone-app:v1 .",
      concept: "A capstone build should use the same repeatable Dockerfile workflow practiced earlier, with an explicit version identifier.",
      hint: "Use the same Docker build pattern practiced earlier: tag option, requested repository:tag, then the current directory as build context.",
      check: (ctx) => ctx.hasImage("capstone-app:v1")
    },
    {
      id: "task-092",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Tag Release Candidate",
      heading: "Promote the capstone image",
      difficulty: "EXPERT",
      description: "Create a release-oriented repository/tag alias for the capstone image.",
      objective: "Create the requested release alias for the capstone image without rebuilding it.",
      command: "docker tag capstone-app:v1 stackforge/capstone:release",
      concept: "Release aliases model how teams promote tested images to deployment-ready references while retaining immutable version tags.",
      hint: "Use Docker’s image tagging operation with the existing capstone image as SOURCE and the release reference as TARGET.",
      check: (ctx) => ctx.hasImage("stackforge/capstone:release")
    },
    {
      id: "task-093",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Inspect Release Image",
      heading: "Verify the final image",
      difficulty: "EXPERT",
      description: "Inspect the promoted capstone release before deployment.",
      objective: "Inspect the promoted capstone release image metadata.",
      command: "docker image inspect stackforge/capstone:release",
      concept: "Pre-deployment inspection verifies that the intended release reference exists and points to a valid image.",
      hint: "Use Docker’s image inspection workflow and target the release image reference created in the previous task.",
      check: (ctx) => ctx.commandRan("docker image inspect stackforge/capstone:release")
    },
    {
      id: "task-094",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Create Capstone Volume",
      heading: "Provision persistent application data",
      difficulty: "EXPERT",
      description: "Create dedicated storage for the capstone deployment.",
      objective: "Create the named volume required by the capstone deployment.",
      command: "docker volume create capstone-data",
      concept: "A production-minded deployment separates persistent data from disposable containers.",
      hint: "Use the volume command group and its creation action, supplying the capstone data volume name.",
      check: (ctx) => ctx.hasVolume("capstone-data")
    },
    {
      id: "task-095",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Create Capstone Network",
      heading: "Provision isolated connectivity",
      difficulty: "EXPERT",
      description: "Create a dedicated network for the capstone deployment.",
      objective: "Create the custom network required by the capstone deployment.",
      command: "docker network create capstone-net",
      concept: "Dedicated application networks improve isolation and make service topology explicit.",
      hint: "Use the network command group and its creation action, supplying the capstone network name.",
      check: (ctx) => ctx.hasNetwork("capstone-net")
    },
    {
      id: "task-096",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Deploy Capstone Container",
      heading: "Run the release container",
      difficulty: "EXPERT",
      description: "Start the capstone release on host port 9090.",
      objective: "Deploy the capstone web container in detached mode with the required name, release image, and host port mapping.",
      command: "docker run -d -p 9090:3000 --name capstone-web stackforge/capstone:release",
      concept: "This task combines image promotion, container naming, detached execution, and port publishing into one deployment operation.",
      hint: "Combine the Docker run pattern you practiced earlier: detached mode, HOST:CONTAINER port publication, explicit container name, then the release image reference.",
      check: (ctx) => ctx.hasContainer("capstone-web", true)
    },
    {
      id: "task-097",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Read Capstone Logs",
      heading: "Verify application startup",
      difficulty: "EXPERT",
      description: "Inspect runtime output from the deployed capstone container.",
      objective: "Display the startup logs from the capstone web container.",
      command: "docker logs capstone-web",
      concept: "Deployment verification should include application logs so failures are detected before users rely on the service.",
      hint: "Use Docker’s container log-reading action and target the capstone container by name.",
      check: (ctx) => ctx.commandRan("docker logs capstone-web") && ctx.hasContainer("capstone-web", true)
    },
    {
      id: "task-098",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Inspect Capstone Runtime",
      heading: "Audit deployed configuration",
      difficulty: "EXPERT",
      description: "Inspect the deployed container metadata and runtime state.",
      objective: "Inspect the capstone container’s runtime metadata.",
      command: "docker inspect capstone-web",
      concept: "A complete deployment audit verifies image identity, state, ports, networking, and host configuration.",
      hint: "Use Docker’s general inspection action and provide the capstone container name.",
      check: (ctx) => ctx.commandRan("docker inspect capstone-web") && ctx.hasContainer("capstone-web", true)
    },
    {
      id: "task-099",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Stop Capstone Service",
      heading: "Perform controlled shutdown",
      difficulty: "EXPERT",
      description: "Gracefully stop the capstone service before cleanup.",
      objective: "Stop the capstone web service without deleting the container.",
      command: "docker stop capstone-web",
      concept: "Controlled shutdown is preferable to abrupt removal because it gives the main process an opportunity to terminate cleanly.",
      hint: "Use Docker’s stop lifecycle action on the capstone container so it remains available for inspection or cleanup.",
      check: (ctx) => ctx.containerStatus("capstone-web") === "stopped"
    },
    {
      id: "task-100",
      module: "MODULE 10 \u00b7 CAPSTONE MASTERY",
      short: "Prune Stopped Containers",
      heading: "Complete the mastery cleanup",
      difficulty: "EXPERT",
      description: "Use Docker system cleanup to remove stopped containers and finish the 100-task path.",
      objective: "Prune unused stopped-container resources using the simulator’s non-interactive confirmation option.",
      command: "docker system prune -f",
      concept: "Pruning removes unused runtime resources. In real environments, cleanup commands should be reviewed carefully because they can delete resources you may still need.",
      hint: "Use Docker’s system cleanup command group. Choose the prune action and add the force/confirmation flag so the command does not prompt interactively.",
      check: (ctx) => ctx.commandRan("docker system prune -f") && !ctx.hasContainer("capstone-web") && ctx.hasImage("stackforge/capstone:release") && ctx.hasVolume("capstone-data") && ctx.hasNetwork("capstone-net")
    }
  ];

  const state = {
    files: structuredCloneSafe(defaultFiles),
    currentFile: "Dockerfile",
    openFiles: ["Dockerfile", "docker-compose.yml", "app.js"],
    dirtyFiles: new Set(),
    images: [],
    containers: [],
    volumes: [
      { name: "local-cache", driver: "local", scope: "local", created: "classroom default" }
    ],
    networks: [
      { name: "bridge", id: randomHex(12), driver: "bridge", scope: "local", created: "Docker default" }
    ],
    composeRunning: false,
    composeValid: true,
    commandHistory: [],
    historyIndex: 0,
    executedCommands: [],
    completed: new Set(),
    activeTask: 0,
    xp: 0,
    sessionStartedAt: Date.now(),
    activeResourceTab: "containers",
    outputEvents: [],
    sideView: "explorer",
    bottomView: "terminal",
    started: false,
    completionShown: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const el = {};

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function randomHex(length = 12) {
    let text = "";
    const chars = "0123456789abcdef";
    for (let i = 0; i < length; i += 1) text += chars[Math.floor(Math.random() * chars.length)];
    return text;
  }

  function shortId() {
    return randomHex(12);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeCommand(command) {
    return command.trim().replace(/\s+/g, " ");
  }

  function nowStamp() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(total / 60).toString().padStart(2, "0");
    const secs = (total % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function fileLanguage(file) {
    if (file === "Dockerfile") return "Dockerfile";
    if (file.endsWith(".yml") || file.endsWith(".yaml")) return "YAML";
    if (file.endsWith(".js")) return "JavaScript";
    if (file.endsWith(".json")) return "JSON";
    if (file.endsWith(".md")) return "Markdown";
    if (file.startsWith(".")) return "Plain Text";
    return "Text";
  }

  function fileIconClass(file) {
    if (file.endsWith(".yml") || file.endsWith(".yaml")) return "yaml";
    if (file.endsWith(".js")) return "js";
    if (file.endsWith(".md")) return "md";
    return "";
  }

  function fileIcon(file) {
    if (file === "Dockerfile" || file === ".dockerignore") return "⬡";
    if (file.endsWith(".yml") || file.endsWith(".yaml")) return "Y";
    if (file.endsWith(".js")) return "JS";
    if (file.endsWith(".json")) return "{}";
    if (file.endsWith(".md")) return "M";
    return "•";
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 2300);
  }

  function logOutput(message, type = "INFO") {
    const entry = `[${nowStamp()}] ${type.padEnd(7)} ${message}`;
    state.outputEvents.push(entry);
    if (state.outputEvents.length > 150) state.outputEvents.shift();
    renderOutput();
  }

  function writeTerminal(text = "", type = "") {
    const line = document.createElement("div");
    line.className = `terminal-line ${type}`.trim();
    line.textContent = text;
    el.terminalOutput.appendChild(line);
    el.terminalOutput.scrollTop = el.terminalOutput.scrollHeight;
  }

  function writeTerminalTable(headers, rows, widths) {
    const line = (values) => values.map((value, index) => String(value).padEnd(widths[index])).join("  ").trimEnd();
    writeTerminal(line(headers), "muted");
    rows.forEach((row) => writeTerminal(line(row)));
  }

  function promptCommand(command) {
    writeTerminal(`student@stackforge:~/docker-lab$ ${command}`, "command");
  }

  function bootTerminal() {
    el.terminalOutput.innerHTML = "";
    writeTerminal("STACKFORGE Docker Lab Studio 2.0", "info");
    writeTerminal("Browser Docker Engine simulator • Linux/amd64", "muted");
    writeTerminal("Type 'help' for supported commands or begin the guided lab.", "muted");
    writeTerminal("");
  }

  function cacheElements() {
    Object.assign(el, {
      codeEditor: $("#codeEditor"),
      lineNumbers: $("#lineNumbers"),
      terminalOutput: $("#terminalOutput"),
      terminalInput: $("#terminalInput"),
      terminalForm: $("#terminalForm"),
      editorTabs: $("#editorTabs"),
      treeFiles: $("#treeFiles"),
      breadcrumbs: $("#breadcrumbs"),
      currentLanguage: $("#currentLanguage"),
      cursorPosition: $("#cursorPosition"),
      saveIndicator: $("#saveIndicator"),
      challengeList: $("#challengeList"),
      taskBadge: $("#taskBadge"),
      sideProgressText: $("#sideProgressText"),
      sideProgressPercent: $("#sideProgressPercent"),
      sideProgressBar: $("#sideProgressBar"),
      scoreRing: $("#scoreRing"),
      scorePercent: $("#scorePercent"),
      challengeScoreText: $("#challengeScoreText"),
      levelPill: $("#levelPill"),
      currentTaskTitle: $("#currentTaskTitle"),
      taskIcon: $("#taskIcon"),
      taskDifficulty: $("#taskDifficulty"),
      taskHeading: $("#taskHeading"),
      taskDescription: $("#taskDescription"),
      taskObjective: $("#taskObjective"),
      taskConcept: $("#taskConcept"),
      taskFeedback: $("#taskFeedback"),
      resourceList: $("#resourceList"),
      workspaceImageCount: $("#workspaceImageCount"),
      workspaceContainerCount: $("#workspaceContainerCount"),
      workspaceVolumeCount: $("#workspaceVolumeCount"),
      workspaceNetworkCount: $("#workspaceNetworkCount"),
      problemCount: $("#problemCount"),
      problemsView: $("#problemsView"),
      outputLog: $("#outputLog"),
      previewContent: $("#previewContent"),
      previewUrl: $("#previewUrl"),
      sessionScore: $("#sessionScore"),
      sessionTimer: $("#sessionTimer"),
      toast: $("#toast"),
      sidePanel: $("#sidePanel"),
      inspectorPanel: $("#inspectorPanel"),
      bottomPanel: $("#bottomPanel"),
      commandPalette: $("#commandPalette"),
      paletteInput: $("#paletteInput"),
      paletteResults: $("#paletteResults"),
      newFileModal: $("#newFileModal"),
      newFileName: $("#newFileName"),
      completionModal: $("#completionModal"),
      completionScore: $("#completionScore"),
      completionTime: $("#completionTime"),
      completionTasks: $("#completionTasks"),
      mobileNavToggle: $("#mobileNavToggle"),
      courseLinks: $("#courseLinks"),
      projectFileInput: $("#projectFileInput")
    });
  }

  function buildSavePayload() {
    syncCurrentEditor();
    return {
      format: PROJECT_FORMAT,
      version: PROJECT_VERSION,
      savedAt: new Date().toISOString(),
      files: structuredCloneSafe(state.files),
      currentFile: state.currentFile,
      openFiles: [...state.openFiles],
      images: structuredCloneSafe(state.images),
      containers: structuredCloneSafe(state.containers),
      volumes: structuredCloneSafe(state.volumes),
      networks: structuredCloneSafe(state.networks),
      composeRunning: state.composeRunning,
      composeValid: state.composeValid,
      commandHistory: state.commandHistory.slice(-100),
      executedCommands: state.executedCommands.slice(-120),
      completed: [...state.completed],
      activeTask: state.activeTask,
      xp: state.xp,
      activeResourceTab: state.activeResourceTab,
      outputEvents: state.outputEvents.slice(-100),
      sideView: state.sideView,
      bottomView: state.bottomView,
      started: state.started,
      sessionStartedAt: state.sessionStartedAt
    };
  }

  function applySavedState(saved) {
    if (!saved || typeof saved !== "object") throw new Error("Invalid project data.");
    state.files = { ...structuredCloneSafe(defaultFiles), ...(saved.files || {}) };
    state.currentFile = state.files[saved.currentFile] !== undefined ? saved.currentFile : "Dockerfile";
    state.openFiles = Array.isArray(saved.openFiles) ? saved.openFiles.filter((f) => state.files[f] !== undefined) : ["Dockerfile"];
    if (!state.openFiles.length) state.openFiles = [state.currentFile];
    if (!state.openFiles.includes(state.currentFile)) state.openFiles.push(state.currentFile);
    state.images = Array.isArray(saved.images) ? saved.images : [];
    state.containers = Array.isArray(saved.containers) ? saved.containers : [];
    state.volumes = Array.isArray(saved.volumes) && saved.volumes.length ? saved.volumes : [{ name: "local-cache", driver: "local", scope: "local", created: "classroom default" }];
    state.networks = Array.isArray(saved.networks) && saved.networks.length ? saved.networks : [{ name: "bridge", id: randomHex(12), driver: "bridge", scope: "local", created: "Docker default" }];
    state.composeRunning = Boolean(saved.composeRunning);
    state.composeValid = saved.composeValid !== false;
    state.commandHistory = Array.isArray(saved.commandHistory) ? saved.commandHistory.slice(-100) : [];
    state.historyIndex = state.commandHistory.length;
    state.executedCommands = Array.isArray(saved.executedCommands) ? saved.executedCommands : [];
    const validChallengeIds = new Set(challenges.map((task) => task.id));
    state.completed = new Set((Array.isArray(saved.completed) ? saved.completed : []).filter((id) => validChallengeIds.has(id)));
    state.activeTask = Number.isInteger(saved.activeTask) ? Math.max(0, Math.min(saved.activeTask, challenges.length - 1)) : 0;
    state.xp = state.completed.size * 100;
    state.activeResourceTab = saved.activeResourceTab || "containers";
    state.outputEvents = Array.isArray(saved.outputEvents) ? saved.outputEvents : [];
    state.sideView = saved.sideView || "explorer";
    state.bottomView = saved.bottomView || "terminal";
    state.started = Boolean(saved.started);
    state.sessionStartedAt = Number(saved.sessionStartedAt) || Date.now();
    state.dirtyFiles = new Set();
  }

  function saveState({ toast = false, auto = false } = {}) {
    const payload = buildSavePayload();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    state.dirtyFiles.clear();
    renderFiles();
    updateSaveIndicator(auto ? "autosaved" : "saved");
    if (toast) showToast("Progress saved. You can close this page and continue later on this browser.");
    return payload;
  }

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveState({ auto: true }), 900);
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      let migrated = false;
      if (!raw) {
        for (const key of LEGACY_STORAGE_KEYS) {
          raw = localStorage.getItem(key);
          if (raw) { migrated = true; break; }
        }
      }
      if (!raw) return false;
      applySavedState(JSON.parse(raw));
      if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSavePayload()));
      return true;
    } catch (error) {
      console.warn("Unable to load saved Docker lab state", error);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }

  function exportProject() {
    const payload = saveState();
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stackforge-docker-lab-${stamp}.dockerlab`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Project file saved. Keep it so you can open and continue on another device.");
  }

  function openProjectPicker() {
    el.projectFileInput.value = "";
    el.projectFileInput.click();
  }

  async function importProjectFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const saved = JSON.parse(text);
      if (saved.format && saved.format !== PROJECT_FORMAT) throw new Error("This is not a STACKFORGE Docker Lab project file.");
      applySavedState(saved);
      el.codeEditor.value = state.files[state.currentFile];
      bootTerminal();
      updateAll();
      saveState();
      writeTerminal(`Project restored from ${file.name}`, "success");
      showToast(`Project opened. Restored ${state.completed.size}/100 completed tasks.`);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Unable to open this project file.");
    }
  }

  function clearSavedState() {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(SESSION_KEY);
  }

  function syncCurrentEditor() {
    if (!el.codeEditor || !state.currentFile) return;
    state.files[state.currentFile] = el.codeEditor.value;
  }

  function markDirty() {
    state.files[state.currentFile] = el.codeEditor.value;
    state.dirtyFiles.add(state.currentFile);
    updateSaveIndicator();
    renderFiles();
    renderEditorTabs();
    validateWorkspace();
    scheduleAutoSave();
  }

  function updateSaveIndicator(mode = "saved") {
    if (state.dirtyFiles.size) {
      el.saveIndicator.innerHTML = "<i style=\"background:#f5b942\"></i> Unsaved";
    } else if (mode === "autosaved") {
      el.saveIndicator.innerHTML = "<i></i> Autosaved";
    } else {
      el.saveIndicator.innerHTML = "<i></i> Saved";
    }
  }

  function renderFiles() {
    const names = Object.keys(state.files);
    el.treeFiles.innerHTML = names.map((file) => {
      const active = file === state.currentFile ? " active" : "";
      const dirty = state.dirtyFiles.has(file) ? '<span class="file-modified" title="Unsaved changes"></span>' : "";
      return `<button class="file-row${active}" type="button" data-file="${escapeHtml(file)}">
        <span class="file-icon ${fileIconClass(file)}">${escapeHtml(fileIcon(file))}</span>
        <span>${escapeHtml(file)}</span>
        ${dirty}
      </button>`;
    }).join("");
  }

  function renderEditorTabs() {
    el.editorTabs.innerHTML = state.openFiles.map((file) => {
      const active = file === state.currentFile ? " active" : "";
      const dirty = state.dirtyFiles.has(file) ? " •" : "";
      return `<button class="editor-tab${active}" type="button" data-file="${escapeHtml(file)}">
        <span class="file-icon ${fileIconClass(file)}">${escapeHtml(fileIcon(file))}</span>
        <span>${escapeHtml(file)}${dirty}</span>
        <span class="tab-close" data-close-file="${escapeHtml(file)}" title="Close">×</span>
      </button>`;
    }).join("");
  }

  function openFile(file) {
    if (!(file in state.files)) return;
    syncCurrentEditor();
    if (!state.openFiles.includes(file)) state.openFiles.push(file);
    state.currentFile = file;
    el.codeEditor.value = state.files[file];
    renderFiles();
    renderEditorTabs();
    updateEditorMeta();
    updateLineNumbers();
    updateCursor();
    el.codeEditor.focus();
  }

  function closeFile(file) {
    if (state.openFiles.length === 1) return showToast("Keep at least one editor tab open.");
    const index = state.openFiles.indexOf(file);
    if (index < 0) return;
    state.openFiles.splice(index, 1);
    if (state.currentFile === file) {
      const next = state.openFiles[Math.max(0, index - 1)] || state.openFiles[0];
      openFile(next);
    } else {
      renderEditorTabs();
    }
  }

  function updateEditorMeta() {
    const language = fileLanguage(state.currentFile);
    el.currentLanguage.textContent = language;
    el.breadcrumbs.innerHTML = `<span>docker-lab</span><b>›</b><strong>${escapeHtml(state.currentFile)}</strong>`;
  }

  function updateLineNumbers() {
    const count = Math.max(1, el.codeEditor.value.split("\n").length);
    el.lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
  }

  function updateCursor() {
    const before = el.codeEditor.value.slice(0, el.codeEditor.selectionStart);
    const lines = before.split("\n");
    el.cursorPosition.textContent = `Ln ${lines.length}, Col ${lines.at(-1).length + 1}`;
  }

  function renderChallengeList() {
    let lastModule = "";
    el.challengeList.innerHTML = challenges.map((task, index) => {
      const moduleHeader = task.module !== lastModule
        ? `<li class="challenge-module"><span>${escapeHtml(task.module)}</span><strong>${challenges.filter((item) => item.module === task.module && state.completed.has(item.id)).length}/10</strong></li>`
        : "";
      lastModule = task.module;
      const active = index === state.activeTask ? " active" : "";
      const complete = state.completed.has(task.id) ? " completed" : "";
      return `${moduleHeader}<li class="challenge-item${active}${complete}" data-task-index="${index}">
        <button type="button">
          <span class="challenge-number">${state.completed.has(task.id) ? "✓" : String(index + 1).padStart(3, "0")}</span>
          <span class="challenge-copy"><strong>${escapeHtml(task.short)}</strong><small>${escapeHtml(task.difficulty.toLowerCase())}</small></span>
          <span class="challenge-check">${state.completed.has(task.id) ? "✓" : "○"}</span>
        </button>
      </li>`;
    }).join("");
  }

  function renderActiveTask() {
    const task = challenges[state.activeTask] || challenges[0];
    const number = String(state.activeTask + 1).padStart(3, "0");
    el.currentTaskTitle.textContent = `${number} • ${task.short}`;
    el.taskIcon.textContent = state.completed.has(task.id) ? "✓" : number;
    el.taskDifficulty.textContent = task.difficulty;
    el.taskHeading.textContent = task.heading;
    el.taskDescription.textContent = task.description;
    el.taskObjective.textContent = task.objective;
    el.taskConcept.textContent = task.concept;
    el.levelPill.textContent = task.difficulty.charAt(0) + task.difficulty.slice(1).toLowerCase();
    el.levelPill.title = task.module;

    if (state.completed.has(task.id)) {
      setTaskFeedback("success", "✓", "Task complete. You can review it again or continue to the next challenge.");
    } else {
      setTaskFeedback("", "⌁", "Work out the command in the terminal, then select Check Task. Use Show Hint only when you need guidance.");
    }
  }

  function renderProgress() {
    const complete = state.completed.size;
    const percent = Math.round((complete / challenges.length) * 100);
    el.taskBadge.textContent = complete;
    el.sideProgressText.textContent = `${complete} of ${challenges.length} tasks`;
    el.sideProgressPercent.textContent = `${percent}%`;
    el.sideProgressBar.style.width = `${percent}%`;
    el.scorePercent.textContent = `${percent}%`;
    el.scoreRing.style.setProperty("--score-angle", `${percent * 3.6}deg`);
    el.challengeScoreText.textContent = `${complete} / ${challenges.length} complete`;
    el.sessionScore.textContent = `${state.xp} XP`;
  }

  function setTaskFeedback(type, icon, text) {
    el.taskFeedback.className = `task-feedback${type ? ` ${type}` : ""}`;
    el.taskFeedback.innerHTML = `<span>${icon}</span><p>${text}</p>`;
  }

  function getContext() {
    return {
      composeRunning: state.composeRunning,
      composeValid: state.composeValid,
      commandRan(command) {
        const wanted = normalizeCommand(command).toLowerCase();
        return state.executedCommands.some((cmd) => normalizeCommand(cmd).toLowerCase() === wanted);
      },
      hasImage(name) {
        return state.images.some((image) => image.repository === name || `${image.repository}:${image.tag}` === name || image.repository.startsWith(name));
      },
      hasContainer(name, runningOnly = false) {
        return state.containers.some((c) => c.name === name && (!runningOnly || c.status === "running"));
      },
      containerStatus(name) {
        const container = state.containers.find((c) => c.name === name);
        return container ? container.status : null;
      },
      hasVolume(name) {
        return state.volumes.some((v) => v.name === name);
      },
      hasNetwork(name) {
        return state.networks.some((n) => n.name === name);
      }
    };
  }

  function checkTask({ silent = false } = {}) {
    const task = challenges[state.activeTask];
    const passed = Boolean(task.check(getContext()));

    if (passed) {
      const wasNew = !state.completed.has(task.id);
      if (wasNew) {
        state.completed.add(task.id);
        state.xp += 100;
        logOutput(`Challenge completed: ${task.short} (+100 XP)`, "SUCCESS");
      }
      setTaskFeedback("success", "✓", wasNew ? "Correct. Challenge completed and 100 XP was added to your session." : "This challenge is already complete.");
      renderChallengeList();
      renderProgress();
      saveState();
      if (wasNew && !silent) showToast(`Challenge complete: ${task.short} • +100 XP`);

      if (state.completed.size === challenges.length) {
        showCompletion();
      } else if (wasNew && !silent) {
        setTimeout(() => {
          const nextIncomplete = challenges.findIndex((item, idx) => idx > state.activeTask && !state.completed.has(item.id));
          if (nextIncomplete >= 0) selectTask(nextIncomplete);
        }, 520);
      }
      return true;
    }

    if (!silent) {
      setTaskFeedback("error", "!", "Not complete yet. Review the objective and your terminal result, or select Show Hint for guidance.");
      showToast("Task not complete yet. Check the command and resource state.");
    }
    return false;
  }

  function autoCheckRelevantTasks() {
    for (let i = 0; i < challenges.length; i += 1) {
      if (state.completed.has(challenges[i].id)) continue;
      if (challenges[i].check(getContext())) {
        const old = state.activeTask;
        state.activeTask = i;
        checkTask({ silent: true });
        state.activeTask = old;
      }
    }
    renderChallengeList();
    renderActiveTask();
  }

  function selectTask(index) {
    state.activeTask = Math.max(0, Math.min(index, challenges.length - 1));
    renderChallengeList();
    renderActiveTask();
    renderProgress();
    saveState();
    if (window.innerWidth <= 1020) document.body.classList.remove("inspector-hidden");
  }

  function renderResources() {
    $$("[data-resource-tab]").forEach((button) => button.classList.toggle("active", button.dataset.resourceTab === state.activeResourceTab));

    if (state.activeResourceTab === "containers") {
      if (!state.containers.length) return resourceEmpty("⬡", "No containers yet", "Build and run an image or start Docker Compose.");
      el.resourceList.innerHTML = state.containers.map((c) => `<article class="resource-card">
        <div class="resource-card-top"><strong>${escapeHtml(c.name)}</strong><span class="resource-state ${c.status !== "running" ? "stopped" : ""}">${escapeHtml(c.status)}</span></div>
        <div class="resource-meta"><span>${escapeHtml(c.image)}</span><span>ID ${escapeHtml(c.id)}</span><span>${escapeHtml(c.ports || "No published ports")}</span></div>
      </article>`).join("");
      return;
    }

    if (state.activeResourceTab === "images") {
      if (!state.images.length) return resourceEmpty("▰", "No local images", "Use docker pull or docker build to add an image.");
      el.resourceList.innerHTML = state.images.map((image) => `<article class="resource-card">
        <div class="resource-card-top"><strong>${escapeHtml(image.repository)}:${escapeHtml(image.tag)}</strong><span class="resource-state">local</span></div>
        <div class="resource-meta"><span>ID ${escapeHtml(image.id)}</span><span>${escapeHtml(image.size)}</span><span>${escapeHtml(image.created)}</span></div>
      </article>`).join("");
      return;
    }

    if (state.activeResourceTab === "volumes") {
      if (!state.volumes.length) return resourceEmpty("◫", "No volumes", "Create persistent storage with docker volume create.");
      el.resourceList.innerHTML = state.volumes.map((v) => `<article class="resource-card">
        <div class="resource-card-top"><strong>${escapeHtml(v.name)}</strong><span class="resource-state">${escapeHtml(v.driver)}</span></div>
        <div class="resource-meta"><span>Scope ${escapeHtml(v.scope)}</span><span>${escapeHtml(v.created || "created now")}</span></div>
      </article>`).join("");
      return;
    }

    if (!state.networks.length) return resourceEmpty("⌁", "No networks", "Create a network with docker network create.");
    el.resourceList.innerHTML = state.networks.map((n) => `<article class="resource-card">
      <div class="resource-card-top"><strong>${escapeHtml(n.name)}</strong><span class="resource-state">${escapeHtml(n.driver)}</span></div>
      <div class="resource-meta"><span>ID ${escapeHtml(n.id)}</span><span>Scope ${escapeHtml(n.scope)}</span></div>
    </article>`).join("");
  }

  function resourceEmpty(icon, title, text) {
    el.resourceList.innerHTML = `<div class="resource-empty"><span>${icon}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`;
  }

  function updateResourceStats() {
    el.workspaceImageCount.textContent = state.images.length;
    el.workspaceContainerCount.textContent = state.containers.length;
    el.workspaceVolumeCount.textContent = state.volumes.length;
    el.workspaceNetworkCount.textContent = state.networks.length;
  }

  function validateWorkspace() {
    syncCurrentEditor();
    const problems = [];
    const dockerfile = state.files.Dockerfile || "";
    const compose = state.files["docker-compose.yml"] || "";
    const app = state.files["app.js"] || "";

    if (!/^FROM\s+\S+/mi.test(dockerfile)) problems.push({ type: "error", file: "Dockerfile", text: "Dockerfile requires a FROM instruction." });
    if (!/^WORKDIR\s+\S+/mi.test(dockerfile)) problems.push({ type: "warning", file: "Dockerfile", text: "Consider setting WORKDIR for predictable relative paths." });
    if (!/^CMD\s+/mi.test(dockerfile) && !/^ENTRYPOINT\s+/mi.test(dockerfile)) problems.push({ type: "warning", file: "Dockerfile", text: "No CMD or ENTRYPOINT was found." });
    if (!/^services\s*:/mi.test(compose)) problems.push({ type: "error", file: "docker-compose.yml", text: "Compose file requires a services: section." });
    if (/\t/.test(compose)) problems.push({ type: "warning", file: "docker-compose.yml", text: "YAML should use spaces instead of tabs." });
    if (!/server\.listen|\.listen\s*\(/.test(app)) problems.push({ type: "warning", file: "app.js", text: "The sample application does not appear to listen on a port." });

    state.composeValid = !problems.some((p) => p.type === "error" && p.file === "docker-compose.yml");
    el.problemCount.textContent = problems.length;

    if (!problems.length) {
      el.problemsView.innerHTML = `<div class="empty-state compact"><span>✓</span><strong>No problems detected</strong><p>Your lab files passed the current simulator checks.</p></div>`;
    } else {
      el.problemsView.innerHTML = problems.map((p) => `<div class="problem-row ${p.type}"><span>${p.type === "error" ? "●" : "▲"}</span><span>${escapeHtml(p.text)}</span><small>${escapeHtml(p.file)}</small></div>`).join("");
    }
    return problems;
  }

  function renderOutput() {
    if (!state.outputEvents.length) {
      el.outputLog.textContent = "STACKFORGE Lab Output\nNo build or challenge events yet.";
      return;
    }
    el.outputLog.textContent = state.outputEvents.join("\n");
    el.outputLog.scrollTop = el.outputLog.scrollHeight;
  }

  function renderPreview() {
    const web = state.containers.find((c) => (c.name === "web" || c.name === "stackforge-web") && c.status === "running");
    const running = Boolean(web || state.composeRunning);
    el.previewUrl.textContent = running ? "http://localhost:8080" : "http://localhost:8080 (offline)";

    if (!running) {
      el.previewContent.innerHTML = `<div class="preview-empty"><span class="docker-whale">⬡</span><h3>No running web service</h3><p>Build and run the application container, or start the Compose stack, to activate this simulated preview.</p></div>`;
      return;
    }

    el.previewContent.innerHTML = `<div class="simulated-app"><div class="simulated-app-card"><div class="simulated-app-logo">⬡</div><h2>STACKFORGE Docker Lab</h2><p>Your Node.js service is running inside the simulated container and is published through host port <strong>8080</strong>.</p><span class="app-health"><i></i> Container healthy</span></div></div>`;
  }

  function renderSideView() {
    $$(".activity-button[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === state.sideView));
    $$(".side-view").forEach((view) => view.classList.toggle("active", view.dataset.sideView === state.sideView));
  }

  function switchSideView(view) {
    state.sideView = view;
    renderSideView();
    if (window.innerWidth <= 820) el.sidePanel.classList.add("mobile-open");
    saveState();
  }

  function switchBottomView(view) {
    state.bottomView = view;
    el.bottomPanel.classList.remove("minimized");
    $$("[data-bottom-tab]").forEach((button) => button.classList.toggle("active", button.dataset.bottomTab === view));
    $$("[data-bottom-view]").forEach((panel) => panel.classList.toggle("active", panel.dataset.bottomView === view));
    if (view === "terminal") setTimeout(() => el.terminalInput.focus(), 0);
    saveState();
  }

  function updateAll() {
    renderFiles();
    renderEditorTabs();
    renderChallengeList();
    renderActiveTask();
    renderProgress();
    renderResources();
    updateResourceStats();
    updateEditorMeta();
    updateLineNumbers();
    updateCursor();
    validateWorkspace();
    renderOutput();
    renderPreview();
    renderSideView();
    switchBottomView(state.bottomView);
    updateSaveIndicator();
  }

  function ensureImage(repository, tag = "latest", size = "128MB") {
    let image = state.images.find((item) => item.repository === repository && item.tag === tag);
    if (!image) {
      image = { repository, tag, id: shortId(), size, created: "less than a minute ago" };
      state.images.unshift(image);
    }
    return image;
  }

  function ensureVolume(name) {
    let volume = state.volumes.find((item) => item.name === name);
    if (!volume) {
      volume = { name, driver: "local", scope: "local", created: "created now" };
      state.volumes.unshift(volume);
    }
    return volume;
  }

  function ensureNetwork(name) {
    let network = state.networks.find((item) => item.name === name);
    if (!network) {
      network = { name, id: shortId(), driver: "bridge", scope: "local", created: "created now" };
      state.networks.unshift(network);
    }
    return network;
  }

  function addContainer({ name, image, ports = "", command = "", compose = false }) {
    const existing = state.containers.find((c) => c.name === name);
    if (existing) return { existing, created: false };
    const container = {
      id: shortId(),
      name,
      image,
      ports,
      command,
      status: "running",
      created: "just now",
      compose
    };
    state.containers.unshift(container);
    return { existing: container, created: true };
  }

  function findContainer(identifier) {
    return state.containers.find((c) => c.name === identifier || c.id.startsWith(identifier));
  }

  function removeContainer(container) {
    state.containers = state.containers.filter((c) => c !== container);
  }

  function runCommand(rawCommand) {
    const command = normalizeCommand(rawCommand);
    if (!command) return;

    state.commandHistory.push(command);
    state.historyIndex = state.commandHistory.length;
    state.executedCommands.push(command);
    if (state.executedCommands.length > 200) state.executedCommands.shift();
    promptCommand(command);

    const lower = command.toLowerCase();
    const args = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

    if (lower === "clear" || lower === "cls") {
      el.terminalOutput.innerHTML = "";
      return postCommand(command);
    }

    if (lower === "help" || lower === "docker help" || lower === "docker --help") {
      showHelp();
      return postCommand(command);
    }

    if (lower === "history") {
      if (!state.commandHistory.length) writeTerminal("No command history.", "muted");
      state.commandHistory.forEach((item, i) => writeTerminal(`${String(i + 1).padStart(3)}  ${item}`));
      return postCommand(command);
    }

    if (lower === "pwd") {
      writeTerminal("/home/student/docker-lab");
      return postCommand(command);
    }

    if (lower === "ls" || lower === "ls -la" || lower === "dir") {
      Object.keys(state.files).forEach((file) => writeTerminal(file));
      return postCommand(command);
    }

    if (lower.startsWith("cat ")) {
      const name = command.slice(4).trim().replace(/^['"]|['"]$/g, "");
      if (state.files[name] !== undefined) writeTerminal(state.files[name]);
      else writeTerminal(`cat: ${name}: No such file or directory`, "error");
      return postCommand(command);
    }

    if (lower === "docker --version" || lower === "docker -v") {
      writeTerminal("Docker version 27.2.0, build 3ab4256", "success");
      return postCommand(command);
    }

    if (lower === "docker info") {
      showDockerInfo();
      return postCommand(command);
    }

    if (lower.startsWith("docker pull ")) {
      const imageRef = args[2] || "";
      if (!imageRef) writeTerminal('"docker pull" requires exactly 1 argument.', "error");
      else pullImage(imageRef);
      return postCommand(command);
    }

    if (lower.startsWith("docker build ")) {
      buildImage(command, args);
      return postCommand(command);
    }

    if (lower === "docker images" || lower === "docker image ls") {
      listImages();
      return postCommand(command);
    }

    if (lower.startsWith("docker image inspect ")) {
      const name = args.at(-1);
      inspectImage(name);
      return postCommand(command);
    }

    if (lower.startsWith("docker rmi ") || lower.startsWith("docker image rm ")) {
      removeImage(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker tag ")) {
      tagImage(args.at(-2), args.at(-1));
      return postCommand(command);
    }

    if (lower === "docker ps" || lower === "docker container ls") {
      listContainers(false);
      return postCommand(command);
    }

    if (lower === "docker ps -a" || lower === "docker ps --all" || lower === "docker container ls -a") {
      listContainers(true);
      return postCommand(command);
    }

    if (lower.startsWith("docker run ")) {
      runContainer(command, args);
      return postCommand(command);
    }

    if (lower.startsWith("docker stop ")) {
      stopContainer(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker start ")) {
      startContainer(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker restart ")) {
      restartContainer(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker rm ")) {
      removeContainerCommand(command, args);
      return postCommand(command);
    }

    if (lower.startsWith("docker logs ")) {
      showLogs(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker inspect ")) {
      inspectContainer(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker exec ")) {
      execContainer(args);
      return postCommand(command);
    }

    if (lower.startsWith("docker port ")) {
      showPort(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker top ")) {
      showTop(args.at(-1));
      return postCommand(command);
    }

    if (lower === "docker stats" || lower.startsWith("docker stats ")) {
      showStats(args.length > 2 ? args.at(-1) : null);
      return postCommand(command);
    }

    if (lower === "docker volume ls") {
      listVolumes();
      return postCommand(command);
    }

    if (lower.startsWith("docker volume create ")) {
      const name = args.at(-1);
      ensureVolume(name);
      writeTerminal(name, "success");
      logOutput(`Created volume ${name}`, "DOCKER");
      return postCommand(command);
    }

    if (lower.startsWith("docker volume inspect ")) {
      inspectVolume(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker volume rm ")) {
      removeVolume(args.at(-1));
      return postCommand(command);
    }

    if (lower === "docker network ls") {
      listNetworks();
      return postCommand(command);
    }

    if (lower.startsWith("docker network create ")) {
      const name = args.at(-1);
      ensureNetwork(name);
      writeTerminal(shortId(), "success");
      logOutput(`Created network ${name}`, "DOCKER");
      return postCommand(command);
    }

    if (lower.startsWith("docker network inspect ")) {
      inspectNetwork(args.at(-1));
      return postCommand(command);
    }

    if (lower.startsWith("docker network rm ")) {
      removeNetwork(args.at(-1));
      return postCommand(command);
    }

    if (lower === "docker compose version" || lower === "docker-compose --version") {
      writeTerminal("Docker Compose version v2.29.2", "success");
      return postCommand(command);
    }

    if (lower === "docker compose config") {
      composeConfig();
      return postCommand(command);
    }

    if (lower.startsWith("docker compose up")) {
      composeUp(command);
      return postCommand(command);
    }

    if (lower === "docker compose down" || lower === "docker compose down --remove-orphans") {
      composeDown();
      return postCommand(command);
    }

    if (lower === "docker compose ps") {
      composePs();
      return postCommand(command);
    }

    if (lower === "docker compose logs" || lower.startsWith("docker compose logs ")) {
      composeLogs();
      return postCommand(command);
    }

    if (lower === "docker compose stop") {
      state.containers.filter((c) => c.compose).forEach((c) => { c.status = "stopped"; });
      state.composeRunning = false;
      writeTerminal("[+] Stopping 2/2", "success");
      writeTerminal(" ✔ Container stackforge-web  Stopped");
      writeTerminal(" ✔ Container stackforge-db   Stopped");
      return postCommand(command);
    }

    if (lower === "docker compose start") {
      state.containers.filter((c) => c.compose).forEach((c) => { c.status = "running"; });
      state.composeRunning = state.containers.some((c) => c.compose);
      writeTerminal("[+] Running 2/2", "success");
      return postCommand(command);
    }

    if (lower === "docker system df") {
      writeTerminal("TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE", "muted");
      writeTerminal(`Images          ${String(state.images.length).padEnd(9)} ${String(activeImageCount()).padEnd(9)} ${(state.images.length * 128) + "MB"}`);
      writeTerminal(`Containers      ${String(state.containers.length).padEnd(9)} ${String(state.containers.filter((c) => c.status === "running").length).padEnd(9)} ${state.containers.length * 4}MB`);
      writeTerminal(`Local Volumes   ${String(state.volumes.length).padEnd(9)} 0         ${state.volumes.length * 12}MB`);
      return postCommand(command);
    }

    if (lower === "docker system prune" || lower === "docker system prune -f") {
      const stopped = state.containers.filter((c) => c.status !== "running").length;
      state.containers = state.containers.filter((c) => c.status === "running");
      writeTerminal(`Deleted Containers: ${stopped}`, "success");
      writeTerminal("Total reclaimed space: 8.4MB", "success");
      return postCommand(command);
    }

    if (lower === "whoami") {
      writeTerminal("student");
      return postCommand(command);
    }

    if (lower === "uname -a") {
      writeTerminal("Linux stackforge-lab 6.8.0-browser #1 SMP x86_64 GNU/Linux");
      return postCommand(command);
    }

    writeTerminal(`bash: ${command}: command not found or not supported by this classroom simulator`, "error");
    writeTerminal("Type 'help' to see supported Docker practice commands.", "muted");
    postCommand(command);
  }

  function postCommand(command) {
    logOutput(`Command executed: ${command}`, "TERMINAL");
    updateResourceStats();
    renderResources();
    renderPreview();
    validateWorkspace();
    autoCheckRelevantTasks();
    saveState();
  }

  function showHelp() {
    const rows = [
      ["docker --version", "Show Docker version"],
      ["docker info", "Show engine information"],
      ["docker pull IMAGE", "Pull an image"],
      ["docker build -t NAME .", "Build an image"],
      ["docker images", "List images"],
      ["docker run ... IMAGE", "Run a container"],
      ["docker ps [-a]", "List containers"],
      ["docker logs NAME", "Read container logs"],
      ["docker exec NAME CMD", "Execute in container"],
      ["docker inspect NAME", "Inspect container JSON"],
      ["docker stop/start NAME", "Change container state"],
      ["docker rm [-f] NAME", "Remove container"],
      ["docker volume ls/create/rm", "Manage volumes"],
      ["docker network ls/create/rm", "Manage networks"],
      ["docker compose config", "Validate Compose YAML"],
      ["docker compose up -d", "Start Compose stack"],
      ["docker compose ps", "List Compose services"],
      ["docker compose down", "Remove Compose stack"],
      ["docker stats", "Show resource usage"],
      ["docker system df", "Show Docker disk usage"],
      ["ls / cat FILE / pwd", "Basic lab shell commands"],
      ["history / clear", "Terminal utilities"]
    ];
    writeTerminal("Supported STACKFORGE practice commands:", "info");
    rows.forEach(([cmd, desc]) => writeTerminal(`  ${cmd.padEnd(32)} ${desc}`));
  }

  function showDockerInfo() {
    writeTerminal("Client: Docker Engine - Community", "info");
    writeTerminal(" Version:    27.2.0");
    writeTerminal(" Context:    stackforge-classroom");
    writeTerminal(" Debug Mode: false");
    writeTerminal("Server:", "info");
    writeTerminal(` Containers: ${state.containers.length}`);
    writeTerminal(`  Running: ${state.containers.filter((c) => c.status === "running").length}`);
    writeTerminal(`  Stopped: ${state.containers.filter((c) => c.status !== "running").length}`);
    writeTerminal(` Images: ${state.images.length}`);
    writeTerminal(" Server Version: 27.2.0");
    writeTerminal(" Storage Driver: overlay2");
    writeTerminal(" Operating System: STACKFORGE Browser Linux Simulator");
    writeTerminal(" Architecture: x86_64");
  }

  function pullImage(imageRef) {
    const [repository, ...tagParts] = imageRef.split(":");
    const tag = tagParts.join(":") || "latest";
    writeTerminal(`Using default tag: ${tag}`, "muted");
    writeTerminal(`${tag}: Pulling from library/${repository}`);
    ["3f4d90098f5b", "2c5f89f4c1b6", "96e2d4fdb73b"].forEach((layer, i) => {
      writeTerminal(`${layer}: ${i === 2 ? "Pull complete" : "Download complete"}`);
    });
    const image = ensureImage(repository, tag, imageRef.includes("alpine") ? "127MB" : "212MB");
    writeTerminal(`Digest: sha256:${randomHex(64)}`, "muted");
    writeTerminal(`Status: Downloaded newer image for ${repository}:${tag}`, "success");
    writeTerminal(`docker.io/library/${repository}:${tag}`);
    logOutput(`Pulled image ${repository}:${tag} (${image.id})`, "DOCKER");
  }

  function buildImage(command, args) {
    syncCurrentEditor();
    const problems = validateWorkspace();
    const dockerErrors = problems.filter((p) => p.type === "error" && p.file === "Dockerfile");
    if (dockerErrors.length) {
      writeTerminal("[+] Building 0.1s (1/1) FINISHED", "error");
      writeTerminal("ERROR: failed to solve: Dockerfile validation failed", "error");
      dockerErrors.forEach((p) => writeTerminal(`  ${p.text}`, "error"));
      return;
    }

    let tag = "stackforge-web";
    const tagIndex = args.findIndex((a) => a === "-t" || a === "--tag");
    if (tagIndex >= 0 && args[tagIndex + 1]) tag = args[tagIndex + 1];
    const [repository, imageTag = "latest"] = tag.split(":");

    writeTerminal("[+] Building 2.8s (9/9) FINISHED", "info");
    writeTerminal(" => [internal] load build definition from Dockerfile                         0.0s");
    writeTerminal(" => [internal] load metadata for docker.io/library/node:20-alpine           0.4s");
    writeTerminal(" => [internal] load .dockerignore                                             0.0s");
    writeTerminal(" => [1/4] FROM docker.io/library/node:20-alpine                              0.0s");
    writeTerminal(" => [2/4] WORKDIR /app                                                        0.1s");
    writeTerminal(" => [3/4] COPY . .                                                            0.1s");
    writeTerminal(" => [4/4] RUN npm install --production                                      1.8s");
    writeTerminal(" => exporting to image                                                       0.2s");
    const image = ensureImage(repository, imageTag, "132MB");
    writeTerminal(` => => naming to docker.io/library/${repository}:${imageTag}`, "success");
    writeTerminal(`Successfully built ${image.id}`, "success");
    writeTerminal(`Successfully tagged ${repository}:${imageTag}`, "success");
    logOutput(`Built image ${repository}:${imageTag}`, "BUILD");
  }

  function listImages() {
    if (!state.images.length) {
      writeTerminal("REPOSITORY   TAG       IMAGE ID   CREATED   SIZE", "muted");
      return;
    }
    writeTerminalTable(
      ["REPOSITORY", "TAG", "IMAGE ID", "CREATED", "SIZE"],
      state.images.map((i) => [i.repository, i.tag, i.id, i.created, i.size]),
      [22, 14, 14, 22, 10]
    );
  }

  function inspectImage(name) {
    const image = state.images.find((i) => i.repository === name || `${i.repository}:${i.tag}` === name || i.id.startsWith(name));
    if (!image) return writeTerminal(`Error: No such image: ${name}`, "error");
    writeTerminal(JSON.stringify([{
      Id: `sha256:${image.id}${randomHex(52)}`,
      RepoTags: [`${image.repository}:${image.tag}`],
      Created: new Date().toISOString(),
      Architecture: "amd64",
      Os: "linux",
      Size: image.size,
      Config: { WorkingDir: "/app", ExposedPorts: { "3000/tcp": {} }, Cmd: ["node", "app.js"] }
    }], null, 2));
  }

  function removeImage(name) {
    const image = state.images.find((i) => i.repository === name || `${i.repository}:${i.tag}` === name || i.id.startsWith(name));
    if (!image) return writeTerminal(`Error response from daemon: No such image: ${name}`, "error");
    if (state.containers.some((c) => c.image.startsWith(image.repository))) return writeTerminal(`Error response from daemon: conflict: image is being used by a container`, "error");
    state.images = state.images.filter((i) => i !== image);
    writeTerminal(`Untagged: ${image.repository}:${image.tag}`, "success");
    writeTerminal(`Deleted: sha256:${image.id}`);
  }

  function tagImage(source, target) {
    const image = state.images.find((i) => i.repository === source || `${i.repository}:${i.tag}` === source || i.id.startsWith(source));
    if (!image) return writeTerminal(`Error response from daemon: No such image: ${source}`, "error");
    const [repository, tag = "latest"] = target.split(":");
    if (!state.images.some((i) => i.repository === repository && i.tag === tag)) {
      state.images.unshift({ ...image, repository, tag, id: image.id });
    }
    writeTerminal(`${target}`, "success");
  }

  function runContainer(command, args) {
    let imageRef = args.at(-1);
    if (!imageRef || imageRef.startsWith("-")) return writeTerminal('"docker run" requires at least 1 argument.', "error");
    const image = state.images.find((i) => i.repository === imageRef || `${i.repository}:${i.tag}` === imageRef || i.id.startsWith(imageRef));
    if (!image) return writeTerminal(`Unable to find image '${imageRef}' locally\ndocker: Error response from daemon: pull access denied for ${imageRef}.`, "error");

    let name = `optimistic_${randomHex(5)}`;
    const nameIndex = args.indexOf("--name");
    if (nameIndex >= 0 && args[nameIndex + 1]) name = args[nameIndex + 1];

    let ports = "";
    const pIndex = args.findIndex((a) => a === "-p" || a === "--publish");
    if (pIndex >= 0 && args[pIndex + 1]) {
      const mapping = args[pIndex + 1];
      const [host, container] = mapping.split(":");
      ports = `0.0.0.0:${host}->${container}/tcp`;
    }

    const result = addContainer({ name, image: `${image.repository}:${image.tag}`, ports, command: '"node app.js"' });
    if (!result.created) return writeTerminal(`docker: Error response from daemon: Conflict. The container name "/${name}" is already in use.`, "error");
    writeTerminal(result.existing.id + randomHex(52), "success");
    logOutput(`Started container ${name} from ${image.repository}:${image.tag}`, "DOCKER");
  }

  function listContainers(all) {
    const containers = all ? state.containers : state.containers.filter((c) => c.status === "running");
    writeTerminalTable(
      ["CONTAINER ID", "IMAGE", "COMMAND", "CREATED", "STATUS", "PORTS", "NAMES"],
      containers.map((c) => [c.id, c.image, c.command || '"node app.js"', c.created, c.status === "running" ? "Up 1 minute" : "Exited (0)", c.ports || "", c.name]),
      [15, 24, 18, 14, 14, 27, 18]
    );
  }

  function stopContainer(name) {
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    container.status = "stopped";
    if (container.compose) state.composeRunning = state.containers.some((c) => c.compose && c.status === "running");
    writeTerminal(container.name, "success");
    logOutput(`Stopped container ${container.name}`, "DOCKER");
  }

  function startContainer(name) {
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    container.status = "running";
    if (container.compose) state.composeRunning = true;
    writeTerminal(container.name, "success");
    logOutput(`Started container ${container.name}`, "DOCKER");
  }

  function restartContainer(name) {
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    writeTerminal(container.name, "success");
    container.status = "running";
    if (container.compose) state.composeRunning = true;
    logOutput(`Restarted container ${container.name}`, "DOCKER");
  }

  function removeContainerCommand(command, args) {
    const name = args.at(-1);
    const force = command.includes(" -f ") || command.includes(" --force ") || args.includes("-f") || args.includes("--force");
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    if (container.status === "running" && !force) return writeTerminal(`Error response from daemon: cannot remove running container ${name}. Stop the container before attempting removal or force remove.`, "error");
    removeContainer(container);
    state.composeRunning = state.containers.some((c) => c.compose && c.status === "running");
    writeTerminal(container.name, "success");
    logOutput(`Removed container ${container.name}`, "DOCKER");
  }

  function showLogs(name) {
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    if (container.name.includes("db")) {
      writeTerminal("PostgreSQL init process complete; ready for start up.", "success");
      writeTerminal("database system is ready to accept connections");
    } else {
      writeTerminal("Server listening on port 3000", "success");
      writeTerminal("GET / 200 4ms");
      writeTerminal("Health check: OK");
    }
  }

  function inspectContainer(name) {
    const c = findContainer(name);
    if (!c) return writeTerminal(`[]\nError: No such object: ${name}`, "error");
    writeTerminal(JSON.stringify([{
      Id: c.id + randomHex(52),
      Name: `/${c.name}`,
      Image: `sha256:${randomHex(64)}`,
      State: { Status: c.status, Running: c.status === "running", ExitCode: 0 },
      Config: { Image: c.image, WorkingDir: "/app", Cmd: ["node", "app.js"] },
      HostConfig: { NetworkMode: c.compose ? "stackforge-net" : "default", PortBindings: { "3000/tcp": [{ HostPort: c.ports.includes("8080") ? "8080" : "" }] } },
      NetworkSettings: { IPAddress: "172.18.0.2", Ports: { "3000/tcp": c.ports ? [{ HostIp: "0.0.0.0", HostPort: "8080" }] : null } }
    }], null, 2));
  }

  function execContainer(args) {
    if (args.length < 4) return writeTerminal('"docker exec" requires at least 2 arguments.', "error");
    const name = args[2];
    const container = findContainer(name);
    if (!container) return writeTerminal(`Error response from daemon: No such container: ${name}`, "error");
    if (container.status !== "running") return writeTerminal(`Error response from daemon: Container ${name} is not running`, "error");
    const inner = args.slice(3).join(" ");
    if (inner === "pwd") writeTerminal("/app");
    else if (inner === "ls" || inner === "ls -la") writeTerminal("app.js\npackage.json\nnode_modules");
    else if (inner === "node --version" || inner === "node -v") writeTerminal("v20.17.0");
    else if (inner === "whoami") writeTerminal("root");
    else if (inner.startsWith("echo ")) writeTerminal(inner.slice(5));
    else if (inner === "env") writeTerminal("NODE_ENV=production\nPORT=3000\nHOSTNAME=" + container.id);
    else writeTerminal(`Executed '${inner}' inside ${container.name}`, "success");
  }

  function showPort(name) {
    const c = findContainer(name);
    if (!c) return writeTerminal(`Error: No such container: ${name}`, "error");
    if (!c.ports) return writeTerminal("");
    writeTerminal("3000/tcp -> 0.0.0.0:8080");
  }

  function showTop(name) {
    const c = findContainer(name);
    if (!c) return writeTerminal(`Error: No such container: ${name}`, "error");
    if (c.status !== "running") return writeTerminal(`Error response from daemon: Container ${name} is not running`, "error");
    writeTerminal("UID      PID   PPID  C  STIME  TTY  TIME      CMD", "muted");
    writeTerminal("root     214   190   0  09:20  ?    00:00:00  node app.js");
  }

  function showStats(name) {
    const list = name ? state.containers.filter((c) => c.name === name) : state.containers.filter((c) => c.status === "running");
    writeTerminal("CONTAINER ID   NAME              CPU %    MEM USAGE / LIMIT     MEM %    NET I/O", "muted");
    list.forEach((c, i) => writeTerminal(`${c.id.padEnd(14)} ${c.name.padEnd(17)} ${(0.18 + i * .07).toFixed(2).padStart(5)}%   ${(18 + i * 7)}MiB / 512MiB        ${((18 + i * 7) / 512 * 100).toFixed(2)}%    2.1kB / 1.4kB`));
  }

  function listVolumes() {
    writeTerminal("DRIVER    VOLUME NAME", "muted");
    state.volumes.forEach((v) => writeTerminal(`${v.driver.padEnd(10)}${v.name}`));
  }

  function inspectVolume(name) {
    const v = state.volumes.find((item) => item.name === name);
    if (!v) return writeTerminal(`[]\nError: No such volume: ${name}`, "error");
    writeTerminal(JSON.stringify([{ CreatedAt: new Date().toISOString(), Driver: v.driver, Labels: {}, Mountpoint: `/var/lib/docker/volumes/${v.name}/_data`, Name: v.name, Options: {}, Scope: v.scope }], null, 2));
  }

  function removeVolume(name) {
    const v = state.volumes.find((item) => item.name === name);
    if (!v) return writeTerminal(`Error response from daemon: get ${name}: no such volume`, "error");
    state.volumes = state.volumes.filter((item) => item !== v);
    writeTerminal(name, "success");
  }

  function listNetworks() {
    writeTerminal("NETWORK ID     NAME             DRIVER    SCOPE", "muted");
    state.networks.forEach((n) => writeTerminal(`${n.id.padEnd(15)}${n.name.padEnd(17)}${n.driver.padEnd(10)}${n.scope}`));
  }

  function inspectNetwork(name) {
    const n = state.networks.find((item) => item.name === name || item.id.startsWith(name));
    if (!n) return writeTerminal(`[]\nError response from daemon: network ${name} not found`, "error");
    writeTerminal(JSON.stringify([{ Name: n.name, Id: n.id + randomHex(52), Created: new Date().toISOString(), Scope: n.scope, Driver: n.driver, EnableIPv6: false, IPAM: { Driver: "default", Config: [{ Subnet: "172.18.0.0/16", Gateway: "172.18.0.1" }] } }], null, 2));
  }

  function removeNetwork(name) {
    const n = state.networks.find((item) => item.name === name || item.id.startsWith(name));
    if (!n) return writeTerminal(`Error response from daemon: network ${name} not found`, "error");
    if (n.name === "bridge") return writeTerminal("Error response from daemon: bridge is a pre-defined network and cannot be removed", "error");
    state.networks = state.networks.filter((item) => item !== n);
    writeTerminal(n.name, "success");
  }

  function composeConfig() {
    const problems = validateWorkspace();
    if (!state.composeValid) {
      writeTerminal("validating docker-compose.yml: configuration error", "error");
      problems.filter((p) => p.file === "docker-compose.yml").forEach((p) => writeTerminal(p.text, p.type));
      return;
    }
    writeTerminal("name: docker-lab", "info");
    writeTerminal("services:");
    writeTerminal("  database:");
    writeTerminal("    image: postgres:16-alpine");
    writeTerminal("    networks:\n      stackforge-net: null");
    writeTerminal("  web:");
    writeTerminal("    build:\n      context: /home/student/docker-lab");
    writeTerminal("    ports:\n      - mode: ingress\n        target: 3000\n        published: \"8080\"\n        protocol: tcp");
    writeTerminal("networks:\n  stackforge-net:\n    name: docker-lab_stackforge-net");
    writeTerminal("volumes:\n  stackforge-data:\n    name: docker-lab_stackforge-data");
    writeTerminal("Configuration is valid.", "success");
  }

  function composeUp(command) {
    if (!state.composeValid) return writeTerminal("failed to parse docker-compose.yml: configuration is invalid", "error");
    ensureImage("postgres", "16-alpine", "241MB");
    ensureImage("stackforge-web", "latest", "132MB");
    ensureVolume("stackforge-data");
    ensureNetwork("stackforge-net");

    state.containers = state.containers.filter((c) => !c.compose);
    const web = addContainer({ name: "stackforge-web", image: "stackforge-web:latest", ports: "0.0.0.0:8080->3000/tcp", command: '"node app.js"', compose: true }).existing;
    const db = addContainer({ name: "stackforge-db", image: "postgres:16-alpine", ports: "5432/tcp", command: '"docker-entrypoint"', compose: true }).existing;
    web.status = "running";
    db.status = "running";
    state.composeRunning = true;

    writeTerminal("[+] Running 4/4", "info");
    writeTerminal(" ✔ Network stackforge-net     Created", "success");
    writeTerminal(" ✔ Volume stackforge-data     Created", "success");
    writeTerminal(" ✔ Container stackforge-db    Started", "success");
    writeTerminal(" ✔ Container stackforge-web   Started", "success");
    if (!command.includes("-d")) {
      writeTerminal("stackforge-db   | database system is ready to accept connections");
      writeTerminal("stackforge-web  | Server listening on port 3000");
    }
    logOutput("Docker Compose application started", "COMPOSE");
  }

  function composeDown() {
    const composeContainers = state.containers.filter((c) => c.compose);
    if (!composeContainers.length && !state.composeRunning) {
      writeTerminal("[+] Running 0/0", "muted");
      writeTerminal("No Compose resources are currently running.");
    } else {
      writeTerminal("[+] Running 3/3", "info");
      composeContainers.forEach((c) => writeTerminal(` ✔ Container ${c.name.padEnd(18)} Removed`, "success"));
      writeTerminal(" ✔ Network stackforge-net      Removed", "success");
      state.containers = state.containers.filter((c) => !c.compose);
    }
    state.composeRunning = false;
    logOutput("Docker Compose application stopped", "COMPOSE");
  }

  function composePs() {
    const list = state.containers.filter((c) => c.compose);
    writeTerminal("NAME              IMAGE                    COMMAND              SERVICE    CREATED       STATUS       PORTS", "muted");
    list.forEach((c) => writeTerminal(`${c.name.padEnd(18)}${c.image.padEnd(25)}${(c.command || "").padEnd(21)}${(c.name.includes("db") ? "database" : "web").padEnd(11)}just now     ${(c.status === "running" ? "Up" : "Exited").padEnd(13)}${c.ports}`));
  }

  function composeLogs() {
    const list = state.containers.filter((c) => c.compose);
    if (!list.length) return writeTerminal("no such service: no Compose containers exist", "error");
    writeTerminal("stackforge-db   | PostgreSQL init process complete; ready for start up.");
    writeTerminal("stackforge-db   | database system is ready to accept connections");
    writeTerminal("stackforge-web  | Server listening on port 3000", "success");
    writeTerminal("stackforge-web  | Connected to database service");
  }

  function activeImageCount() {
    return new Set(state.containers.map((c) => c.image.split(":")[0])).size;
  }

  function formatCurrentFile() {
    syncCurrentEditor();
    let text = el.codeEditor.value.replace(/\t/g, "  ").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
    if ((state.currentFile.endsWith(".json"))) {
      try { text = JSON.stringify(JSON.parse(text), null, 2); } catch { showToast("JSON formatting skipped because the file is not valid JSON."); }
    }
    el.codeEditor.value = text;
    markDirty();
    updateLineNumbers();
    showToast(`${state.currentFile} formatted.`);
  }

  async function copyEditor() {
    try {
      await navigator.clipboard.writeText(el.codeEditor.value);
      showToast(`${state.currentFile} copied to clipboard.`);
    } catch {
      el.codeEditor.select();
      document.execCommand("copy");
      updateCursor();
      showToast(`${state.currentFile} copied to clipboard.`);
    }
  }

  function focusPracticeTerminal() {
    switchBottomView("terminal");
    el.terminalInput.focus();
    showToast("Terminal ready. Enter the command you think solves the current task.");
  }

  function startLab() {
    state.started = true;
    state.sessionStartedAt = Date.now();
    state.activeTask = challenges.findIndex((task) => !state.completed.has(task.id));
    if (state.activeTask < 0) state.activeTask = 0;
    switchSideView("challenges");
    document.body.classList.remove("inspector-hidden");
    renderActiveTask();
    renderChallengeList();
    showToast("Guided Docker lab started. Follow the current challenge.");
    logOutput("Guided lab session started", "SESSION");
    saveState();
  }

  function resetLab() {
    if (!window.confirm("Reset the complete Docker Lab Studio workspace and erase saved browser progress?")) return;
    clearSavedState();
    state.files = structuredCloneSafe(defaultFiles);
    state.currentFile = "Dockerfile";
    state.openFiles = ["Dockerfile", "docker-compose.yml", "app.js"];
    state.dirtyFiles = new Set();
    state.images = [];
    state.containers = [];
    state.volumes = [{ name: "local-cache", driver: "local", scope: "local", created: "classroom default" }];
    state.networks = [{ name: "bridge", id: randomHex(12), driver: "bridge", scope: "local", created: "Docker default" }];
    state.composeRunning = false;
    state.commandHistory = [];
    state.historyIndex = 0;
    state.executedCommands = [];
    state.completed = new Set();
    state.activeTask = 0;
    state.xp = 0;
    state.outputEvents = [];
    state.started = false;
    state.completionShown = false;
    state.sessionStartedAt = Date.now();
    el.codeEditor.value = state.files[state.currentFile];
    bootTerminal();
    updateAll();
    saveState();
    showToast("Docker Lab Studio reset to its classroom defaults.");
  }

  function showCompletion() {
    if (state.completionShown) return;
    state.completionShown = true;
    el.completionScore.textContent = state.xp;
    el.completionTime.textContent = formatDuration(Date.now() - state.sessionStartedAt);
    el.completionTasks.textContent = `${challenges.length}/${challenges.length}`;
    el.completionModal.hidden = false;
    logOutput("All Docker challenges completed", "SUCCESS");
  }

  function createFile() {
    const name = el.newFileName.value.trim();
    if (!name) return showToast("Enter a file name first.");
    if (/[\\/:*?"<>|]/.test(name)) return showToast("Use a simple file name without reserved characters.");
    if (state.files[name] !== undefined) return showToast("A file with that name already exists.");
    state.files[name] = "";
    state.openFiles.push(name);
    state.dirtyFiles.add(name);
    el.newFileModal.hidden = true;
    el.newFileName.value = "";
    openFile(name);
    saveState();
    showToast(`${name} created in this browser workspace.`);
  }

  const paletteCommands = [
    { icon: ">_", title: "Focus practice terminal", detail: "Open the terminal without revealing the answer", keyword: "terminal practice task", action: focusPracticeTerminal },
    { icon: "✓", title: "Check current challenge", detail: "Validate the current task", keyword: "check validate task", action: () => checkTask() },
    { icon: "⌁", title: "Save workspace", detail: "Persist files and lab state in this browser", keyword: "save files", action: () => saveState({ toast: true }) },
    { icon: "⇩", title: "Save project file", detail: "Download a portable project backup", keyword: "save export backup download", action: exportProject },
    { icon: "⇧", title: "Open project file", detail: "Restore a previously saved Docker Lab project", keyword: "open import restore project", action: openProjectPicker },
    { icon: "＋", title: "Create new file", detail: "Add a practice file to the Explorer", keyword: "new file", action: () => { closePalette(); el.newFileModal.hidden = false; setTimeout(() => el.newFileName.focus(), 0); } },
    { icon: "⬡", title: "Docker: list containers", detail: "docker ps", keyword: "docker ps containers", code: "docker ps", action: () => runCommandFromPalette("docker ps") },
    { icon: "▰", title: "Docker: list images", detail: "docker images", keyword: "docker images", code: "docker images", action: () => runCommandFromPalette("docker images") },
    { icon: "◫", title: "Docker: list volumes", detail: "docker volume ls", keyword: "docker volume", code: "docker volume ls", action: () => runCommandFromPalette("docker volume ls") },
    { icon: "⌁", title: "Docker: list networks", detail: "docker network ls", keyword: "docker network", code: "docker network ls", action: () => runCommandFromPalette("docker network ls") },
    { icon: "Y", title: "Compose: validate configuration", detail: "docker compose config", keyword: "compose config validate yaml", code: "docker compose config", action: () => runCommandFromPalette("docker compose config") },
    { icon: "▶", title: "Compose: start services", detail: "docker compose up -d", keyword: "compose up start", code: "docker compose up -d", action: () => runCommandFromPalette("docker compose up -d") },
    { icon: "■", title: "Compose: stop services", detail: "docker compose down", keyword: "compose down stop", code: "docker compose down", action: () => runCommandFromPalette("docker compose down") },
    { icon: "?", title: "Terminal command help", detail: "Show all supported simulator commands", keyword: "help terminal commands", action: () => runCommandFromPalette("help") },
    { icon: "↻", title: "Reset Docker lab", detail: "Restore all classroom defaults", keyword: "reset restart", action: () => { closePalette(); resetLab(); } }
  ];

  function openPalette() {
    el.commandPalette.hidden = false;
    el.paletteInput.value = "";
    renderPalette("");
    setTimeout(() => el.paletteInput.focus(), 0);
  }

  function closePalette() {
    el.commandPalette.hidden = true;
  }

  function renderPalette(query) {
    const q = query.trim().toLowerCase();
    const results = paletteCommands.filter((item) => !q || `${item.title} ${item.detail} ${item.keyword}`.toLowerCase().includes(q));
    el.paletteResults.innerHTML = results.length ? results.map((item, i) => `<button class="palette-item${i === 0 ? " active" : ""}" type="button" data-palette-index="${paletteCommands.indexOf(item)}"><span class="palette-item-icon">${item.icon}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span>${item.code ? `<code>${escapeHtml(item.code)}</code>` : ""}</button>`).join("") : `<div class="resource-empty"><span>⌕</span><strong>No matching command</strong><p>Try searching for Docker, Compose, file, save, or reset.</p></div>`;
  }

  function runCommandFromPalette(command) {
    closePalette();
    switchBottomView("terminal");
    runCommand(command);
    el.terminalInput.focus();
  }

  function cycleHistory(direction) {
    if (!state.commandHistory.length) return;
    state.historyIndex = Math.max(0, Math.min(state.commandHistory.length, state.historyIndex + direction));
    el.terminalInput.value = state.historyIndex === state.commandHistory.length ? "" : state.commandHistory[state.historyIndex];
    requestAnimationFrame(() => el.terminalInput.setSelectionRange(el.terminalInput.value.length, el.terminalInput.value.length));
  }

  function bindEvents() {
    $("#startLabBtn").addEventListener("click", startLab);
    $("#resetLabBtn").addEventListener("click", resetLab);
    $("#saveAllBtn").addEventListener("click", () => saveState({ toast: true }));
    $("#saveProjectBtn").addEventListener("click", exportProject);
    $("#openProjectBtn").addEventListener("click", openProjectPicker);
    $("#saveProjectSideBtn").addEventListener("click", exportProject);
    $("#openProjectSideBtn").addEventListener("click", openProjectPicker);
    el.projectFileInput.addEventListener("change", () => importProjectFile(el.projectFileInput.files?.[0]));
    $("#formatBtn").addEventListener("click", formatCurrentFile);
    $("#copyEditorBtn").addEventListener("click", copyEditor);
    $("#focusTerminalBtn").addEventListener("click", focusPracticeTerminal);
    $("#checkTaskBtn").addEventListener("click", () => checkTask());
    $("#showHintBtn").addEventListener("click", () => {
      const task = challenges[state.activeTask];
      setTaskFeedback("hint", "?", `Hint: ${task.hint}`);
      showToast("Hint shown. The exact command is still yours to work out.");
    });
    $("#closeInspectorBtn").addEventListener("click", () => document.body.classList.add("inspector-hidden"));
    $("#themeBtn").addEventListener("click", () => {
      document.body.classList.toggle("compact-ui");
      showToast(document.body.classList.contains("compact-ui") ? "Compact interface enabled." : "Comfortable interface enabled.");
    });

    $("#fullscreenBtn").addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch { showToast("Fullscreen is not available in this browser context."); }
    });

    el.mobileNavToggle.addEventListener("click", () => {
      const open = el.courseLinks.classList.toggle("open");
      el.mobileNavToggle.setAttribute("aria-expanded", String(open));
    });

    $$(".activity-button[data-view]").forEach((button) => button.addEventListener("click", () => switchSideView(button.dataset.view)));

    el.treeFiles.addEventListener("click", (event) => {
      const row = event.target.closest("[data-file]");
      if (row) openFile(row.dataset.file);
    });

    el.editorTabs.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-close-file]");
      if (closer) {
        event.stopPropagation();
        return closeFile(closer.dataset.closeFile);
      }
      const tab = event.target.closest("[data-file]");
      if (tab) openFile(tab.dataset.file);
    });

    el.challengeList.addEventListener("click", (event) => {
      const item = event.target.closest("[data-task-index]");
      if (item) selectTask(Number(item.dataset.taskIndex));
    });

    $$("[data-resource-tab]").forEach((button) => button.addEventListener("click", () => {
      state.activeResourceTab = button.dataset.resourceTab;
      renderResources();
      saveState();
    }));

    $$("[data-bottom-tab]").forEach((button) => button.addEventListener("click", () => switchBottomView(button.dataset.bottomTab)));

    $("#togglePanelBtn").addEventListener("click", () => el.bottomPanel.classList.toggle("minimized"));
    $("#clearTerminalBtn").addEventListener("click", () => { el.terminalOutput.innerHTML = ""; el.terminalInput.focus(); });
    $("#newTerminalBtn").addEventListener("click", () => { bootTerminal(); el.terminalInput.focus(); showToast("Fresh terminal session created."); });
    $("#terminalHelpBtn").addEventListener("click", () => runCommand("help"));
    $("#historyBtn").addEventListener("click", () => runCommand("history"));
    $("#refreshPreviewBtn").addEventListener("click", () => { renderPreview(); showToast("Application preview refreshed."); });

    el.terminalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const command = el.terminalInput.value;
      el.terminalInput.value = "";
      runCommand(command);
    });

    el.terminalInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp") { event.preventDefault(); cycleHistory(-1); }
      if (event.key === "ArrowDown") { event.preventDefault(); cycleHistory(1); }
      if (event.key === "Tab") {
        event.preventDefault();
        showToast("Command autocomplete is disabled in Assessment Mode. Use Show Hint if you need guidance.");
      }
    });

    el.codeEditor.addEventListener("input", () => { markDirty(); updateLineNumbers(); updateCursor(); });
    el.codeEditor.addEventListener("click", updateCursor);
    el.codeEditor.addEventListener("keyup", updateCursor);
    el.codeEditor.addEventListener("scroll", () => { el.lineNumbers.scrollTop = el.codeEditor.scrollTop; });
    el.codeEditor.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        const start = el.codeEditor.selectionStart;
        const end = el.codeEditor.selectionEnd;
        el.codeEditor.setRangeText("  ", start, end, "end");
        markDirty();
        updateLineNumbers();
      }
    });

    $("#newFileBtn").addEventListener("click", () => { el.newFileModal.hidden = false; setTimeout(() => el.newFileName.focus(), 0); });
    $("#cancelNewFileBtn").addEventListener("click", () => { el.newFileModal.hidden = true; el.newFileName.value = ""; });
    $("#createNewFileBtn").addEventListener("click", createFile);
    el.newFileName.addEventListener("keydown", (event) => { if (event.key === "Enter") createFile(); });

    $("#commandPaletteBtn").addEventListener("click", openPalette);
    el.paletteInput.addEventListener("input", () => renderPalette(el.paletteInput.value));
    el.paletteResults.addEventListener("click", (event) => {
      const item = event.target.closest("[data-palette-index]");
      if (item) paletteCommands[Number(item.dataset.paletteIndex)].action();
    });

    el.commandPalette.addEventListener("mousedown", (event) => { if (event.target === el.commandPalette) closePalette(); });
    el.newFileModal.addEventListener("mousedown", (event) => { if (event.target === el.newFileModal) el.newFileModal.hidden = true; });
    el.completionModal.addEventListener("mousedown", (event) => { if (event.target === el.completionModal) el.completionModal.hidden = true; });
    $("#closeCompletionBtn").addEventListener("click", () => { el.completionModal.hidden = true; });
    $("#restartCompletionBtn").addEventListener("click", () => { el.completionModal.hidden = true; resetLab(); });

    $$(".side-section-title").forEach((button) => button.addEventListener("click", () => {
      const content = button.nextElementSibling;
      const isHidden = content.hidden;
      content.hidden = !isHidden;
      button.classList.toggle("expanded", isHidden);
      $("span", button).textContent = isHidden ? "⌄" : "›";
    }));

    $("#treeRootBtn").addEventListener("click", () => {
      const files = el.treeFiles;
      const hidden = files.hidden;
      files.hidden = !hidden;
      $("#treeRootBtn span").textContent = hidden ? "⌄" : "›";
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveState({ toast: true });
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && document.activeElement !== el.terminalInput) {
        event.preventDefault();
        focusPracticeTerminal();
      }
      if (event.key === "Escape") {
        if (!el.commandPalette.hidden) closePalette();
        if (!el.newFileModal.hidden) el.newFileModal.hidden = true;
      }
    });

    window.addEventListener("beforeunload", () => saveState());
    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) el.sidePanel.classList.remove("mobile-open");
      if (window.innerWidth > 820) el.courseLinks.classList.remove("open");
    });
  }

  function startTimer() {
    setInterval(() => {
      el.sessionTimer.textContent = formatDuration(Date.now() - state.sessionStartedAt);
    }, 1000);
  }

  function initialize() {
    cacheElements();
    const restored = loadState();
    el.codeEditor.value = state.files[state.currentFile];
    bootTerminal();
    bindEvents();
    updateAll();
    startTimer();
    logOutput("Docker Lab Studio loaded successfully", "SYSTEM");
    if (restored) {
      setTimeout(() => showToast(`Welcome back. Restored ${state.completed.size}/100 completed tasks and your saved files.`), 350);
    }
    setTimeout(() => el.terminalInput.focus(), 150);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
