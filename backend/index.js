const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Docker = require("dockerode");
const cors = require("cors"); // Import CORS

// Initialize express app
const app = express();
const upload = multer({ dest: "uploads/" });

// Enable CORS
app.use(cors({ origin: "http://localhost:5173" })); // Allow frontend from Vite's port

// Initialize Docker client
const docker = new Docker();
const containerId = "85353ec65ecb"; // Your container ID

// Ensure the app serves JSON data and handles POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for receiving custom branding data and files
app.post("/customize", upload.fields([{ name: "logo", maxCount: 1 }, { name: "background", maxCount: 1 }]), (req, res) => {
  const { osName, packages } = req.body;
  const logo = req.files.logo ? req.files.logo[0] : null;
  const background = req.files.background ? req.files.background[0] : null;

  console.log("Customization request received:", { osName, packages, logo, background });

  // Define volume path to mount
  const volumePath = "/home/fusion/customize"; // Path inside the container

  // Create a folder in the container to store customized files
  const containerPath = `/home/yash/fusion${volumePath}`;
  if (!fs.existsSync(containerPath)) {
    fs.mkdirSync(containerPath, { recursive: true });
  }

  // Copy files into the container's volume
  if (logo) {
    fs.renameSync(logo.path, path.join(containerPath, "logo.png"));
  }
  if (background) {
    fs.renameSync(background.path, path.join(containerPath, "background.png"));
  }

  // Command to run in the Docker container to configure the build
  const command = `cd /home/fusion && ./build.sh --osName "${osName}" --packages "${packages}"`;

  // Run Docker container and execute command
  docker.getContainer(containerId).exec(
    {
      Cmd: ["bash", "-c", command],
      AttachStdout: true,
      AttachStderr: true,
    },
    (err, exec) => {
      if (err) {
        console.error("Error executing command in container:", err);
        return res.status(500).json({ message: "Build failed" });
      }

      exec.start((err, stream) => {
        if (err) {
          console.error("Error streaming output:", err);
          return res.status(500).json({ message: "Build failed" });
        }

        // Handle output (streaming logs, etc.)
        stream.on("data", (data) => {
          console.log(data.toString());
        });

        // After build is complete, return ISO file path
        stream.on("end", () => {
          const isoPath = `/home/fusion/output/my-custom-distro.iso`;
          res.status(200).json({ isoPath: isoPath });
        });
      });
    }
  );
});

// Endpoint to download ISO
app.get("/download", (req, res) => {
  const isoPath = "/home/fusion/output/my-custom-distro.iso";
  res.download(isoPath, "my-custom-distro.iso", (err) => {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("Error downloading ISO");
    }
  });
});

// Start the backend server
app.listen(3001, () => {
  console.log("Backend server running on http://localhost:3001");
});
