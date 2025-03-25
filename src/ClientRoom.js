import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ClientRoom = ({ userNo, socket, setUsers, setUserNo, user }) => {
  const imgRef = useRef(null);
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("whiteboardUser"));
    if (storedUser && storedUser.roomId === user.roomId) {
      setLocalUser(storedUser);
    } else {
      toast.error("Session expired! Please log in again.");
      navigate("/");
    }
  }, [user.roomId, navigate]);

  useEffect(() => {
    socket.on("message", (data) => {
      toast.info(data.message);
    });
  }, []);

  useEffect(() => {
    socket.on("users", (data) => {
      setUsers(data);
      setUserNo(data.length);
    });
  }, []);

  useEffect(() => {
    socket.on("canvasImage", (data) => {
      imgRef.current.src = data;
    });
  }, []);

  // **New Feature: Real-time whiteboard updates using "canvasState"**
  useEffect(() => {
    socket.on("canvasState", (data) => {
      if (data.roomId === user.roomId) {
        imgRef.current.src = data.image;
      }
    });
  }, [socket, user.roomId]);

  const handleLogout = () => {
    localStorage.removeItem("whiteboardUser");
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/"; // Forces a full page reload and redirects to home
    }, 500);
  };

  return (
    <div className="container-fluid">
      <div className="row pb-2">
        <h1 className="text-3xl font-bold text-green-600 text-center mt-4">
          Welcome to Whiteboard - {user.roomId}
        </h1>
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Logout
        </button>
      </div>
      <div className="row mt-5">
        <div
          className="col-md-8 overflow-hidden border border-dark px-0 mx-auto mt-3"
          style={{ height: "500px" }}
        >
          <img className="w-100 h-100" ref={imgRef} src="" alt="Whiteboard" />
        </div>
      </div>
    </div>
  );
};

export default ClientRoom;
