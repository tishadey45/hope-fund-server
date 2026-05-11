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
    const donationCollection = db.collection("donations");

    // create a donation
    app.post("/donation", async (req, res) => {
      const donation = req.body;
      const result = await donationCollection.insertOne(donation);
      res.send(result);
    }); 
    
   //get all donation
   app.get("/donations", async (req,res)=>{
    const result = await donationCollection.find().toArray();
    res.send(result);
   })

   //get single donation
   app.get("/donation/:id", async (req,res)=>{
    const id = req.params.id;
    console.log(id);
    const query = {_id: new ObjectId(id)};
    // console.log(query);
    const result = await donationCollection.findOne(query);
    res.send(result);
   })
    
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
