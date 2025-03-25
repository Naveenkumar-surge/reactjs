import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Canvas from "./Canvas";
import { useNavigate } from "react-router-dom";
import { FaUndo, FaRedo, FaEraser, FaPencilAlt, FaDownload, FaTrash } from "react-icons/fa";
const Room = ({ userNo,user, socket, setUsers, setUserNo }) => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");
  const [lineWidth, setLineWidth] = useState(3);
  const [showShapesDropdown, setShowShapesDropdown] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");
  const [drawing, setDrawing] = useState(false);
  const ctxRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });
  }, []);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("whiteboardUser"));
    if (!storedUser || storedUser.roomId !== user.roomId) {
      toast.error("Session expired! Please log in again.");
      setTimeout(() => {
        window.location.href = "/"; // Forces a full page reload and redirects to home
      }, 500);
    }
  }, [navigate, user.roomId]);
  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("whiteboardUser");
    toast.success("Logged out successfully!");
    navigate("/");
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setElements([]);
  };

  const undo = () => {
    if (elements.length === 0) return; // Prevent adding undefined to history
    setHistory((prevHistory) => [...prevHistory, elements[elements.length - 1]]);
    setElements((prevElements) => prevElements.slice(0, -1));
  };
  
  const redo = () => {
    if (history.length === 0) return; // Prevent errors when history is empty
    const lastElement = history[history.length - 1];
    setElements((prevElements) => [...prevElements, lastElement]);
    setHistory((prevHistory) => prevHistory.slice(0, -1));
  };
  
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);
  const drawShape = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = ctxRef.current;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    if (selectedTool === "square") {
      ctx.strokeRect(offsetX, offsetY, 100, 100);
    } else if (selectedTool === "rectangle") {
      ctx.strokeRect(offsetX, offsetY, 150, 100);
    } else if (selectedTool === "circle") {
      ctx.arc(offsetX, offsetY, 50, 0, Math.PI * 2);
    } else if (selectedTool === "triangle") {
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + 50, offsetY + 100);
      ctx.lineTo(offsetX - 50, offsetY + 100);
      ctx.closePath();
    }
    ctx.stroke();
  };
  const downloadCanvas = () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // Create a temporary canvas to draw the background
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill with white background
    tempCtx.fillStyle = "#ffffff"; 
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas on top of the white background
    tempCtx.drawImage(canvas, 0, 0);

    // Convert to JPEG
    const image = tempCanvas.toDataURL("image/jpeg", 1.0);

    // Create a link to download the image
    const link = document.createElement("a");
    link.href = image;
    link.download = "canvas-drawing.jpg";
    link.click();
};
const startDrawing = (e) => {
  if (selectedTool === "eraser") {
    ctxRef.current.globalCompositeOperation = "destination-out";
  } else {
    ctxRef.current.globalCompositeOperation = "source-over";
  }
  ctxRef.current.lineWidth = lineWidth;
  setDrawing(true);
  ctxRef.current.beginPath();
  ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
};
const draw = (e) => {
  if (!drawing || selectedTool !== "pencil") return;
  ctxRef.current.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  ctxRef.current.stroke();
};

const stopDrawing = () => {
  setDrawing(false);
  ctxRef.current.closePath();
};
  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center p-4">
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4">Real-time Whiteboard</h1>
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 px-3 py-1 md:px-4 md:py-2 bg-red-600 text-white rounded-lg text-sm md:text-base"
    >
      Logout
    </button>
    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 w-full max-w-5xl mb-4 px-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-700 text-sm md:text-base">Color:</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="border rounded-lg p-1 w-10 h-10" />
      </div>
      <div className="flex items-center gap-2">
        <FaPencilAlt className="text-gray-600" />
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="px-3 py-1 md:px-4 md:py-2 rounded-lg border bg-white text-gry-500 text-sm md:text-base"
        >
          {['pencil','line', 'rect', 'circle', 'triangle'].map((item) => (
            <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={undo} className="px-3 py-1 md:px-4 md:py-2 bg-yellow-500 text-white rounded-lg text-sm md:text-base">
          <FaUndo /> Undo
        </button>
        <button onClick={redo} className="px-3 py-1 md:px-4 md:py-2 bg-green-500 text-white rounded-lg text-sm md:text-base">
          <FaRedo /> Redo
        </button>
        <button onClick={clearCanvas} className="px-3 py-1 md:px-4 md:py-2 bg-red-500 text-white rounded-lg text-sm md:text-base">
          <FaTrash /> Clear
        </button>
        <button onClick={downloadCanvas} className="px-3 py-1 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg text-sm md:text-base">
          <FaDownload /> Download
        </button>
      </div>
    </div>
    <div className="w-full flex justify-center">
      <Canvas
        canvasRef={canvasRef}
        ctx={ctxRef}
        color={color}
        setElements={setElements}
        elements={elements}
        tool={tool}
        socket={socket}
        user={user}
      />
    </div>
  </div>
);
};

export default Room;
