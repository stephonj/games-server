const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
const mongoose = require("mongoose");
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/images/");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });

const upload = multer({ storage: storage });

mongoose
  .connect(
    "mongodb+srv://stephonj_db_user:86tSoR3pdcQRedDK@cluster0.cmobtcd.mongodb.net/gamesdb?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log(" Connected to MongoDB");
  })
  .catch((error) => {
    console.log(" Couldn't connect to MongoDB", error);
  });

// SCHEMA
const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String, required: true },
  price: { type: Number, required: true },
  platform: { type: String, required: true },
  release_date: { type: String, required: true },
  description: { type: String, required: true },
  img_name: { type: String, default: "images/default-game.jpg" }
});

const Game = mongoose.model("Game", gameSchema);

// VALIDATION
const validateGame = (g) => {
  const schema = Joi.object({
    _id: Joi.allow(""), 
    title: Joi.string().min(3).required(),
    genre: Joi.string().min(3).required(),
    price: Joi.number().min(0).required(),
    platform: Joi.string().min(1).required(),
    release_date: Joi.string().min(4).required(),
    description: Joi.string().min(10).required(),
  });

  return schema.validate(g, { abortEarly: false });
};

// GET ALL GAMES
app.get("/api/games", async (req, res) => {
  try {
    const games = await Game.find();
    console.log(`Fetched ${games.length} games from database`);
    res.send(games);
  } catch (err) {
    console.error("Error fetching games:", err);
    res.status(500).send("Error fetching games");
  }
});

// GET ONE GAME
app.get("/api/games/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      console.log(`Game with ID ${req.params.id} not found`);
      return res.status(404).send("Game not found");
    }
    res.send(game);
  } catch (err) {
    console.error("Error fetching game:", err);
    res.status(500).send("Error fetching game");
  }
});

// POST — ADD GAME
app.post("/api/games", upload.single("img"), async (req, res) => {
  console.log("POST request received");
  console.log("Request body:", req.body);

  const gameToValidate = {
    title: req.body.title,
    genre: req.body.genre,
    price: Number(req.body.price),
    platform: req.body.platform,
    release_date: req.body.release_date,
    description: req.body.description,
  };

  const { error } = validateGame(gameToValidate);
  if (error) {
    console.log("Validation error:", error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }

  const game = new Game(gameToValidate);

  if (req.file) {
    game.img_name = "images/" + req.file.filename;
    console.log("Image uploaded:", req.file.filename);
  }

  try {
    const savedGame = await game.save();
    console.log("✅ Game saved to database:", savedGame._id);
    res.status(201).send(savedGame);
  } catch (err) {
    console.error("Error saving game:", err);
    res.status(500).send("Error saving game");
  }
});

// PUT — EDIT GAME
app.put("/api/games/:id", upload.single("img"), async (req, res) => {
  console.log(`PUT request for game ID: ${req.params.id}`);

  const gameToValidate = {
    title: req.body.title,
    genre: req.body.genre,
    price: Number(req.body.price),
    platform: req.body.platform,
    release_date: req.body.release_date,
    description: req.body.description,
  };

  const { error } = validateGame(gameToValidate);
  if (error) {
    console.log("Validation error:", error.details[0].message);
    return res.status(400).send(error.details[0].message);
  }

  const fieldsToUpdate = { ...gameToValidate };

  if (req.file) {
    fieldsToUpdate.img_name = "images/" + req.file.filename;
    console.log("New image uploaded:", req.file.filename);
  }

  try {
    const updatedGame = await Game.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    if (!updatedGame) {
      console.log(`Game with ID ${req.params.id} not found`);
      return res.status(404).send("Game not found");
    }

    console.log("✅ Game updated:", updatedGame._id);
    res.send(updatedGame);
  } catch (err) {
    console.error("Error updating game:", err);
    res.status(500).send("Error updating game");
  }
});

// DELETE — REMOVE GAME
app.delete("/api/games/:id", async (req, res) => {
  console.log(`DELETE request for game ID: ${req.params.id}`);

  try {
    const deletedGame = await Game.findByIdAndDelete(req.params.id);

    if (!deletedGame) {
      console.log(`Game with ID ${req.params.id} not found`);
      return res.status(404).send("Game not found");
    }

    console.log("✅ Game deleted:", deletedGame._id);
    res.send(deletedGame);
  } catch (err) {
    console.error("Error deleting game:", err);
    res.status(500).send("Error deleting game");
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});