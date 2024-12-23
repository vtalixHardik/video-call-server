const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = 8000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("user is connected");

  // create a room
  socket.on("create-room", (data) => {
    const { roomID } = data;

    // initialise that for every roomID created we will have an array of users who are present in the room

    // create a room
    // we can use this to prevent users from joining the room
    if (!rooms[roomID]) {
      rooms[roomID] = [];
    }
    console.log("User wants to join room", data);

    // send a response back to the client
    socket.emit("room-created", { roomID });
  });

  // listen to a client wanting to join a room
  socket.on("join-room", (data) => {
    console.log("New User wants to join room", data);
    const { ID, roomID } = data;
    if (rooms[roomID]) {
      rooms[roomID].push(ID);

      // join a room
      socket.join(roomID);

      // we also want to send th elist of users to every user thta joins the room
      socket.emit("get-users", {
        roomID,
        participants: rooms[roomID],
      });
    }

    // client disconnecting from the server
    socket.on("disconnect", () => {
      console.log("user is disconnected");
      // disconnect user from the room after refresh
      rooms[roomID] = rooms[roomID].filter((id) => id !== ID);

      // tell all the users that Peer has left the room
      socket.to(roomID).emit("user-disconnected", ID);
    });
  });

  // we will create a list of room  and for every rom will save the ids of peer that will join, we can use database for this to make sure other users do not join other room
});

server.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
