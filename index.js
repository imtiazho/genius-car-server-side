const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

// Use Middleware
app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const headerAuth = req.headers.authorization;
    if (!headerAuth) {
        return res.status(401).send({ message: 'Unauthorize Access' })
    }
    const token = headerAuth.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded;
        next();
    })

}


app.get('/', (req, res) => {
    res.send('Hello World!')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.y0poo9a.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {
        await client.connect();
        const serviceCollection = client.db("serUser").collection("servicesUser");
        const orderCollection = client.db("serUser").collection("orders");

        // JWT Token
        app.post('/login', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            })
            res.send(token);
        })

        // get all orders
        app.get('/allOrders', verifyJWT, async (req, res) => {
            const headerAuth = req.headers.authorization;
            // console.log(headerAuth)
            const userDecodedEmail = req.decoded.email;
            console.log(userDecodedEmail);

            const userEmail = req.query.email;
            // console.log(userEmail)
            if (userDecodedEmail === userEmail) {
                const query = { userEmail: userEmail };
                const cursor = orderCollection.find(query);
                const allOrders = await cursor.toArray();
                res.send(allOrders);
            }
        })

        // get all user
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        // Get particuler user
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        // Post user
        app.post('/services', async (req, res) => {
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        })

        // Delete Service
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await serviceCollection.deleteOne(filter);
            res.send(result)
        })

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })
    }

    finally {
        // await client.close();
    }
}
run().catch(console.dir)


app.listen(port, () => {
    console.log('Crud server is running')
})