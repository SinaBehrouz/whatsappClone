// imports
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import Cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1204677",
  key: "eaa9a659a4793e1d6573",
  secret: "1d614bcf8cdb9d19f10a",
  cluster: "us3",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(Cors());

// app.use((req, res, next) => {
//   // not to be used in production environemnt, development use only (lack of security)
//   res.setHeader("Access-Control-Allow-Origin", "*"); //Allow for all origin requests
//   res.setHeader("Access-Control-Allow-Headers", "*"); //Allow for all kind of headers
//   next();
// });

// DB config
const connection_url =
  "mongodb+srv://admin_user:WnKY8ck9PK2PADV@cluster0.khb0n.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB Connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("A change occured");
    if (change.operationType == "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  });
});

//??????

// API ROUTES
app.get("/", (req, res) => {
  res.status(200).send("Root Directory");
});

//get all the data from NoSQL DB
app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// app.post("rooms/new", (req, res, next) => {
//   next();
// });

// Listen
app.listen(port, () => {
  console.log("Listening on localhost: ", port);
});
