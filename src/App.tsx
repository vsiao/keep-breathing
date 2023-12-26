import React, { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";

const bubbles = new Set<Bubble>();

function App() {
  const [windowDimensions, setWindowDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    const { height, width } = windowDimensions;
    canvas.height = height;
    canvas.width = width;
    let animation: number;
    const animate = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.02) {
        bubbles.add(
          new Bubble(
            Math.random() * canvas.width,
            canvas.height + 2 * Bubble.MAX_SIZE,
          ),
        );
      }
      for (const bubble of bubbles) {
        bubble.move();
        bubble.draw(context);
        if (bubble.y < 0 - 2 * bubble.r) {
          bubbles.delete(bubble);
        }
      }
      animation = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animation);
  }, [windowDimensions]);

  useEffect(() => {
    const onResize = (event: UIEvent) => {
      setWindowDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  return (
    <div className="App">
      <canvas ref={canvasRef} className="App-background"></canvas>
      <Outlet />
    </div>
  );
}

export default App;

class Bubble {
  static MAX_SIZE = 40;

  readonly r = (8 + Math.random() * (Bubble.MAX_SIZE - 8)) / 2;
  readonly dx = -0.5 + Math.random() * -0.5;

  constructor(
    public x: number,
    public y: number,
  ) {}

  draw(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    context.strokeStyle = "#68c3d4";
    context.stroke();
  }

  move() {
    this.y = this.y + this.dx;
  }
}
