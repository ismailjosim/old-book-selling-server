require('dotenv').config();
require('colors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express()
const port = process.env.PORT || 5000;

// TODO: Middleware
app.use(cors());
app.use(express.json())


// section: URI & Create Client
const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASSWORD }@cluster0.s9x13go.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// section: Database connect Function
const dbConnect = async () => {
    try {
        await client.connect();
        console.log("Database Connected!");
    } catch (error) {
        console.log(error.name, error.message);
    }
}
dbConnect()

// TODO: Database Collection
const CategoriesCollection = client.db('oldBookCenter').collection('categories');
const CategoryCollection = client.db('oldBookCenter').collection('category');
const usersCollection = client.db('oldBookCenter').collection('users');



// TODO - 00 : General server Checking
app.get('/', (req, res) => {
    res.send(`<div>old Book Server Connected 🎉</div>`)
})


// TODO: 01: Get all categories

app.get('/categories', async (req, res) => {
    try {
        const query = {}
        const categories = await CategoriesCollection.find(query).toArray();

        res.send({
            success: true,
            categories: categories

        })

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


// TODO: 02: send single data according to categories data.
app.get('/category/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { categories_id: parseInt(id) }
        const books = await CategoryCollection.find(query).toArray()

        res.send({
            success: true,
            books: books
        })


    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


// Link : 04: Save User info to database
app.post('/users', async (req, res) => {
    try {
        const user = req.body;
        // console.log(user);
        const users = await usersCollection.insertOne(user);
        res.send({
            success: true,
            users: users
        })

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})



















// listen app
app.listen(port, () => console.log(`Server Running on Port ${ port }`.random.bold))
