"use client";

import Lottie from "lottie-react";
import heroAnimation from "../animations/hero.json";

export default function Home() {
  return (
    <main style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

      {/* Background Animation */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          zIndex: -2
        }}
      >
        <Lottie
          animationData={heroAnimation}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Dark Overlay (reduces brightness) */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          background: "rgba(0,0,0,0.7)",   // 0.7 = 70% darker
          zIndex: -1
        }}
      ></div>

      {/* Content */}
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center"
        }}
      >
        <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
          Kanban Task Manager
        </h1>

        <p style={{ maxWidth: "500px", marginBottom: "20px" }}>
          Organize your work using a simple Kanban board with Todo,
          In Progress, and Done stages.
        </p>

        <button
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            background: "#2563eb",
            border: "none",
            borderRadius: "6px",
            color: "white",
            cursor: "pointer"
          }}
        >
          Get Started
        </button>
      </div>

    </main>
  );
}