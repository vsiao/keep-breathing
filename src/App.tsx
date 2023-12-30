import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import "./App.css";

const bubbles = new Set<Bubble>();

function App() {
  const [canvasDimensions, setCanvasDimensions] = useState({
    height: document.body.clientHeight,
    width: document.body.clientWidth,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    const { height, width } = canvasDimensions;
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
  }, [canvasDimensions]);

  useEffect(() => {
    if (appRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize, inlineSize } = entry.borderBoxSize[0];
          setCanvasDimensions({
            width: inlineSize,
            height: blockSize,
          });
        }
      });
      observer.observe(appRef.current);
      return () => observer.disconnect();
    }
  }, [setCanvasDimensions]);

  return (
    <div ref={appRef} className="App">
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
    context.strokeStyle = "rgba(255,255,255,.2)"; //"rgba(104, 195, 212, .2)";
    context.stroke();
  }

  move() {
    this.y = this.y + this.dx;
  }
}
