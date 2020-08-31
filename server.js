const credentials = require("./credentials");
const express = require("express");
const app = express();
const reload = require("reload");
let broadcaster;
let server;
let port;
if (credentials.key && credentials.cert) {
  const https = require("https");
  server = https.createServer(credentials, app);
  port = 443;
} else {
  const http = require("http");
  server = http.createServer(app);
  port = 80;
}
const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));
io.sockets.on("error", (e) => console.log(e));
io.sockets.on("connection", function (socket) {
  socket.on("broadcaster", function () {
    broadcaster = socket.id;
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", function () {
    broadcaster && socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("offer", function (id /* of the watcher */, message) {
    socket.to(id).emit("offer", socket.id /* of the broadcaster */, message);
  });
  socket.on("answer", function (id /* of the broadcaster */, message) {
    socket.to(id).emit("answer", socket.id /* of the watcher */, message);
  });
  socket.on("candidate", function (id, message) {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", function () {
    broadcaster && socket.to(broadcaster).emit("bye", socket.id);
  });
});
reload(app)
  .then(function (reloadReturned) {
    // reloadReturned is documented in the returns API in the README

    // Reload started, start web server
    server.listen(port, () => console.log(`Server is running on port ${port}`));
  })
  .catch(function (err) {
    console.error(
      "Reload could not start, could not start server/sample app",
      err
    );
  });
