import { app } from "./app";

const port = app.get("port");

const server = app.listen(port, onListening);

function onListening() {
  console.log(`Listening on Port ${port}`);
}

export default server;
