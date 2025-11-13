const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
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

// Games data array
let games = [
    {
        "_id": 1,
        "title": "GTA: San Andreas",
        "genre": "Action Adventure",
        "price": 19.99,
        "platform": "PS2, PS3, PS4, Xbox 360",
        "img_name": "images/gtasanandreas.jpeg",
        "release_date": "October 26, 2004",
        "description": "Grand Theft Auto: San Andreas puts you in the shoes of Carl 'CJ' Johnson as he returns home to Los Santos in the early '90s, only to be pulled back into gang wars, family struggles, and corrupt law enforcement.",
    },
    {
        "_id": 2,
        "title": "Devil May Cry",
        "genre": "Action/Hack and Slash",
        "price": 29.99,
        "platform": "PS2, PS3, PS4, Xbox One, PC",
        "img_name": "images/devilmaycry.jpeg",
        "release_date": "August 23, 2001",
        "description": "Step into the boots of Dante, a demon hunter with supernatural abilities and an arsenal of powerful weapons. Navigate through gothic environments filled with challenging puzzles and intense combat encounters.",
    },
    {
        "_id": 3,
        "title": "NBA 2K26",
        "genre": "Sports/Basketball Simulation",
        "price": 69.99,
        "platform": "PS5, PS4, Xbox Series X/S, Xbox One, PC",
        "img_name": "images/2k.jpeg",
        "release_date": "September 6, 2025",
        "description": "Experience basketball like never before with NBA 2K26, featuring cutting-edge graphics, realistic player movements, and enhanced AI. Build your MyCareer from rookie to superstar.",
    },
    {
        "_id": 4,
        "title": "Marvel Ultimate Alliance",
        "genre": "Action RPG",
        "price": 39.99,
        "platform": "PC, PS2, PS3, PS4, Xbox One, Xbox 360",
        "img_name": "images/marvel.jpeg",
        "release_date": "October 24, 2006",
        "description": "Assemble your ultimate team of Marvel superheroes and save the universe in this action-packed RPG. Choose from over 20 playable characters including Spider-Man, Wolverine, Captain America, and more.",
    },
    {
        "_id": 5,
        "title": "EA College Football 26",
        "genre": "Sports/Football Simulation",
        "price": 69.99,
        "platform": "PS5, PS4, Xbox Series X/S, Xbox One, PC",
        "img_name": "images/ncaa26.jpeg",
        "release_date": "July 19, 2025",
        "description": "Experience the passion and pageantry of college football with over 134 FBS schools, authentic stadiums, and real college traditions.",
    },
    {
        "_id": 6,
        "title": "Elden Ring Nightreign",
        "genre": "Action RPG/Souls-like",
        "price": 59.99,
        "platform": "PS5, PS4, Xbox Series X/S, Xbox One, PC",
        "img_name": "images/eldenring.jpeg",
        "release_date": "2025",
        "description": "Return to the Lands Between in this standalone cooperative experience set in the world of Elden Ring. Face the encroaching Nightreign in a three-player session-based adventure.",
    },
    {
        "_id": 7,
        "title": "X-Men Legends",
        "genre": "Action RPG",
        "price": 29.99,
        "platform": "PS2, Xbox, GameCube",
        "img_name": "images/xmen.jpg",
        "release_date": "September 21, 2004",
        "description": "Join the X-Men in their first action-RPG adventure. Assemble a team of iconic mutants like Wolverine, Cyclops, Storm, and Jean Grey to combat Magneto's Brotherhood of Mutants.",
    },
    {
        "_id": 8,
        "title": "X-Men Legends 2",
        "genre": "Action RPG",
        "price": 34.99,
        "platform": "PS2, Xbox, GameCube, PC, PSP",
        "img_name": "images/xmen2.jpg",
        "release_date": "September 20, 2005",
        "description": "The X-Men must join forces with Magneto's Brotherhood to stop the rise of the ancient mutant Apocalypse. Featuring over 20 playable characters.",
    }
];

// API endpoint to get all games
app.get("/api/games/", (req, res) => {
    console.log("Fetching all games");
    res.send(games);
});

// API endpoint to get a single game by ID
app.get("/api/games/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const game = games.find(g => g._id === id);
    
    if (game) {
        res.send(game);
    } else {
        res.status(404).send({ error: "Game not found" });
    }
});

app.post("/api/games", upload.single("img"), (req, res) => {
  console.log("in post request");

  const gameToValidate = {
    title: req.body.title,
    genre: req.body.genre,
    price: req.body.price !== undefined ? Number(req.body.price) : req.body.price,
    platform: req.body.platform,
    release_date: req.body.release_date,
    description: req.body.description,
  };

  const { error } = validateGame(gameToValidate);
  if (error) {
    // If multer stored a file and validation fails, consider removing file (optional).
    console.log("Validation error:", error.details[0].message);
    return res.status(400).send({ error: error.details[0].message });
  }

  // construct new game
  const newId = games.length ? Math.max(...games.map(g => g._id)) + 1 : 1;
  const game = {
    _id: newId,
    title: gameToValidate.title,
    genre: gameToValidate.genre,
    price: Number(gameToValidate.price),
    platform: gameToValidate.platform,
    release_date: gameToValidate.release_date,
    description: gameToValidate.description,
  };


  if (req.file && req.file.filename) {
    game.img_name = "images/" + req.file.filename;
  }

  games.push(game);
  return res.status(201).send(game);
});

const validateGame = (g) => {
  const schema = Joi.object({
    title: Joi.string().min(3).required(),
    genre: Joi.string().min(3).required(),
    price: Joi.number().min(0).required(),
    platform: Joi.string().min(1).required(),
    release_date: Joi.string().min(4).required(),
    description: Joi.string().min(10).required(),
  });

  return schema.validate(g, { abortEarly: false });
};

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});