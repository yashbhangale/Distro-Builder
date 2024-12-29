import React, { useState } from "react";
import "./App.css";
const App = () => {
  const [osName, setOsName] = useState("");
  const [packages, setPackages] = useState("");
  const [logo, setLogo] = useState(null);
  const [background, setBackground] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isoLink, setIsoLink] = useState("");

  const handleFileUpload = (setter) => (event) => {
    setter(event.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsoLink("");

    const formData = new FormData();
    formData.append("osName", osName);
    formData.append("packages", packages);
    if (logo) formData.append("logo", logo);
    if (background) formData.append("background", background);

    try {
      const response = await fetch("http://localhost:3001/customize", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.isoPath) {
        setIsoLink(data.isoPath);
      } else {
        alert("Failed to build ISO. Please check the backend logs.");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Custom Debian Distro Creator</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>OS Name:</label>
          <input
            type="text"
            value={osName}
            onChange={(e) => setOsName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Custom Packages (comma-separated):</label>
          <input
            type="text"
            value={packages}
            onChange={(e) => setPackages(e.target.value)}
            placeholder="e.g., vim, git, curl"
          />
        </div>

        <div>
          <label>Upload Logo:</label>
          <input type="file" accept="image/*" onChange={handleFileUpload(setLogo)} />
        </div>

        <div>
          <label>Upload Background:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload(setBackground)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Building ISO..." : "Customize and Build"}
        </button>
      </form>

      {isoLink && (
        <div>
          <h2>Build Complete!</h2>
          <a href={`http://localhost:3001/download`} download>
            Download Your ISO
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
