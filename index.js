require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

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

    // create a add campaign
    app.post("/add-campaign", async (req, res) => {
      const donation = req.body;
      const result = await campaignCollection.insertOne(donation);
      res.send(result);
    });

    //get all campaigns
    app.get("/campaigns", async (req, res) => {
      const result = await campaignCollection.find().toArray();
      res.send(result);
    });

    //get single campaign
    app.get("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      // console.log(query);
      const result = await campaignCollection.findOne(query);
      res.send(result);
    });

    //delete campaign
    app.delete("/campaign/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
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
    app.get("/my-donation/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "donor.email": email };
      const result = await donorCollection.find(query).toArray();
      res.send(result);
    });

    //for get all donations created by a specific user
    app.get("/donation-request/:email", async (req, res) => {
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
