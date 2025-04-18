import React, { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Network } from "vis-network";
import "chart.js/auto";

const App = () => {
  const [logs, setLogs] = useState("");
  const [errors, setErrors] = useState([]);
  const [solutions, setSolutions] = useState({});
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  const fetchJenkinsLogs = async () => {
    try {
      const response = await fetch("/api/job/sbi-hack/30/consoleText");
      const text = await response.text();
      setLogs(text);

      const extractedErrors = extractErrors(text);
      setErrors(extractedErrors);

      if (extractedErrors.length > 0) {
        fetchSolutions(extractedErrors);
        fetchVulnerabilityGraph(extractedErrors);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs("Failed to load logs.");
    }
  };

  const extractErrors = (logText) => {
    return [
      ...new Set(
        logText
          .split("\n")
          .filter((line) => line.includes("ERROR") || line.includes("error"))
      ),
    ];
  };

  const fetchSolutions = async (errors) => {
    try {
      const response = await fetch("http://localhost:5000/api/get-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errors }),
      });

      const data = await response.json();
      setSolutions(data);
    } catch (error) {
      console.error("Error fetching solutions:", error);
    }
  };

  const fetchVulnerabilityGraph = async (errors) => {
    try {
      const response = await fetch("http://localhost:5000/api/vulnerability-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errors }),
      });

      const graphData = await response.json();

      if (containerRef.current) {
        new Network(containerRef.current, graphData, {
          nodes: { shape: "dot", size: 20 },
          edges: { arrows: "to", color: "#848484" },
          physics: { stabilization: true },
        });
      }
    } catch (error) {
      console.error("Error fetching vulnerability graph:", error);
    }
  };

  useEffect(() => {
    fetchJenkinsLogs();
  }, []);

  const severityData = {
    labels: errors,
    datasets: [
      {
        label: "Error Severity",
        data: errors.map((error) => solutions[error]?.severity || 0),
        backgroundColor: errors.map((error) => {
          const severity = solutions[error]?.severity || 0;
          return severity >= 8 ? "#ff0000" : severity >= 5 ? "#ffcc00" : "#00cc66";
        }),
      },
    ],
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Jenkins Pipeline Logs & Security Insights</h1>

      {/* Log Viewer with View More/Less */}
      <pre className="bg-gray-900 text-white p-4 rounded-lg text-sm overflow-auto max-h-96 border border-gray-700 shadow-md">
        {logs || "Loading logs..."}
      </pre>

      {/* Error Display */}
      {errors.length > 0 && (
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Detected Errors & AI-Powered Remediation</h2>
          {errors.map((error, index) => {
            const severity = solutions[error]?.severity || 0;
            const severityClass =
              severity >= 8 ? styles.severityHigh : severity >= 5 ? styles.severityMedium : styles.severityLow;

            return (
              <div key={index} style={{ ...styles.errorBox, ...severityClass }}>
                <p style={styles.errorText}>{error}</p>
                <p style={styles.severityText}>Severity: {severity}/10</p>
                <p style={styles.solutionText}>{solutions[error]?.solution || "Fetching solution..."}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Vulnerability Graph */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Graph-Based Vulnerability Mapping</h2>
        <div ref={containerRef} style={styles.graphBox} />
      </div>

      {/* Error Severity Chart */}
      {errors.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Error Severity Analysis</h2>
          <Bar data={severityData} />
        </div>
      )}
    </div>
  );
};

// Inline CSS styles
const styles = {
  container: {
    padding: "24px",
    maxWidth: "900px",
    margin: "auto",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  logContainer: {
    backgroundColor: "#333",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "20px",
    color: "white",
  },
  logBox: {
    maxHeight: "150px",
    overflow: "hidden",
    whiteSpace: "pre-wrap",
    fontSize: "12px",
  },
  toggleButton: {
    marginTop: "8px",
    padding: "6px 12px",
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  errorContainer: {
    marginTop: "24px",
  },
  errorTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#d9534f",
    marginBottom: "10px",
  },
  errorBox: {
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  severityHigh: {
    backgroundColor: "#f8d7da",
    borderLeft: "6px solid #dc3545",
  },
  severityMedium: {
    backgroundColor: "#fff3cd",
    borderLeft: "6px solid #ffc107",
  },
  severityLow: {
    backgroundColor: "#d4edda",
    borderLeft: "6px solid #28a745",
  },
  errorText: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#333",
  },
  severityText: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  solutionText: {
    fontSize: "12px",
    marginTop: "8px",
  },
  section: {
    marginTop: "24px",
    padding: "12px",
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  graphBox: {
    height: "400px",
    border: "1px solid #ccc",
    marginTop: "10px",
  },
};

export default App;
