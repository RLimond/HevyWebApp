import React from "react";

export default function Footer() {
  return (
    <div className="my-footer">
      <footer className="bg-dark">
        <div className="container bg-dark">
          <a href="https://www.linkedin.com/in/rocco-limond/">
            <i className="fab fa-linkedin-in footer-icon" style={{ float: "left" }} aria-hidden="true"></i>
          </a>
          <span className="text-muted" style={{ float: "right" }}>Rocco Limond © 2023</span>
        </div>
      </footer>
    </div>
  );
}