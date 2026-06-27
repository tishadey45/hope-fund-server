require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs-extra");

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://hope-fund-theta.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// cloudinary configuration

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//multer configuration
const upload = multer({
  dest: "uploads/",
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.d2ts7wd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//verify token
function verifyToken(req, res, next) {
  const token = req.cookies?.token;
  // console.log(token);
  if (!token) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ error: true, message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB 🚀",
    );
    const db = client.db("donation-campaign-platform");
    const campaignCollection = db.collection("campaigns");
    const donorCollection = db.collection("donors");

    //jwt
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "None",
        })
        .send({ success: true });
    });

    // create a add campaign
    app.post(
      "/add-campaign",
      upload.single("campaign_photo"),
      async (req, res) => {
        try {
          const campaign_photo = await cloudinary.uploader.upload(
            req.file.path,
            {
              folder: "donation-campaign-platform",
            },
          );
          await fs.remove(req.file.path);
          req.body.campaign_photo = campaign_photo.secure_url;
          req.body.organizer = JSON.parse(req.body.organizer);
          const donation = req.body;
          const result = await campaignCollection.insertOne(donation);
          res.send(result);
        } catch (error) {
          console.error("Error occurred while adding campaign:", error);
          res
            .status(500)
            .send({ error: true, message: "Internal server error" });
        }
      },
    );

    //get all campaigns
    app.get("/campaigns", async (req, res) => {
      const result = await campaignCollection.find().toArray();
      res.send(result);
    });

    //get single campaign
    app.get("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      // console.log(query);
      const result = await campaignCollection.findOne(query);
      res.send(result);
    });

    //delete campaign
    app.delete("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await campaignCollection.deleteOne(query);
      res.send(result);
    });

    //update campaign
    app.put("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const donation = req.body;
      const updatedDonation = {
        $set: {
          campaign_title: donation.campaign_title,
          category: donation.category,
          goal_amount: donation.goal_amount,
          raised_amount: donation.raised_amount,
          donation_amount: donation.donation_amount,
        },
      };
      const options = { upsert: true };
      const result = await campaignCollection.updateOne(
        filter,
        updatedDonation,
        options,
      );
      res.send(result);
    });

    //create a donation
    app.post("/donor", async (req, res) => {
      const order = req.body;
      const result = await donorCollection.insertOne(order);
      res.send(result);
    });

    //get all donors
    app.get("/donors", async (req, res) => {
      const result = await donorCollection.find().toArray();
      res.send(result);
    });

    //get my donation
    app.get("/my-donation/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "donor.email": email };
      const result = await donorCollection.find(query).toArray();
      res.send(result);
    });

    //for get all donations created by a specific user
    app.get("/donation-request/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "organizer.email": email };
      const result = await donorCollection.find(query).toArray();
      res.send(result);
    });

    //donation status
    app.patch("/donation-status/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDonation = {
        $set: {
          status: "approved",
        },
      };
      const options = { upsert: true };
      const result = await donorCollection.updateOne(
        filter,
        updatedDonation,
        options,
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Donation campaign platform server is running ✅");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
