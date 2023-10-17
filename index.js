require('dotenv').config()
require('colors')
const express = require('express')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// JSON Web Token Verification function
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).send('Unauthorized access')
    }

    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.JWT_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({
                message: 'forbidden access',
            })
        }
        req.decoded = decoded
        next()
    })
}

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASSWORD }@cluster0.s9x13go.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
})

const dbConnect = async () => {
    try {
        await client.connect()
        console.log('Database Connected!')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

// Database Collection
const CategoriesCollection = client.db('oldBookCenter').collection('categories')
const ProductsCollection = client.db('oldBookCenter').collection('products')
const UsersCollection = client.db('oldBookCenter').collection('users')
const OrdersCollection = client.db('oldBookCenter').collection('orders')

app.get('/', (_, res) => {
    res.send(`<div>old Book Server Connected 🎉</div>`)
})

// add new products to database
app.post('/products', verifyJWT, async (req, res) => {
    try {
        const product = req.body
        const products = await ProductsCollection.insertOne(product)

        res.send({
            success: true,
            products: products,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// jwt validation
app.get('/jwt', async (req, res) => {
    try {
        const email = req.query.email
        const query = { email: email }
        const user = await UsersCollection.findOne(query)
        if (user) {
            const token = jwt.sign({ email }, process.env.JWT_TOKEN_SECRET, {
                expiresIn: '7d',
            })
            return res.send({
                success: true,
                token: token,
            })
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Get all categories

app.get('/categories', async (_, res) => {
    try {
        const query = {}
        const categories = await CategoriesCollection.find(query).toArray()
        res.send({
            success: true,
            categories: categories,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// get products according to products categories
app.get('/product/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { categories_id: parseInt(id) }
        const books = await ProductsCollection.find(query).toArray()

        res.send({
            success: true,
            books: books,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})
// get all products
app.get('/products', verifyJWT, async (req, res) => {
    try {
        const email = req.query.email
        const decodedEmail = req.decoded.email

        if (email !== decodedEmail) {
            res.status(403).send({ message: 'forbidden access' })
        }

        const query = { email: email }
        const products = await ProductsCollection.find(query).toArray()
        res.send({
            success: true,
            products: products,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Delete Products from database
app.delete('/product/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const product = await ProductsCollection.deleteOne(query)

        res.send({
            success: true,
            product: product,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// add User info to database :
app.post('/users', async (req, res) => {
    try {
        const user = req.body
        const users = await UsersCollection.insertOne(user)
        res.send({
            success: true,
            users: users,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// get all user and show them according to their role
app.get('/users', verifyJWT, async (req, res) => {
    try {
        const query = {}
        const users = await UsersCollection.find(query).toArray()

        res.send({
            success: false,
            users: users,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Delete User from database
app.delete('/user/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const user = await UsersCollection.deleteOne(query)

        res.send({
            success: true,
            user: user,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

//  verify user
app.patch('/users/verify/:id', verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true }
        const updateDoc = {
            $set: {
                status: 'verified',
            },
        }
        const result = await UsersCollection.updateOne(filter, updateDoc, options)

        res.send({
            success: true,
            result: result,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Prevent accessing Admin route via URL
app.get('/users/admin/:email', verifyJWT, async (req, res) => {
    try {
        const email = req.params.email
        const query = { email }
        const user = await UsersCollection.findOne(query)

        res.send({ isAdmin: user?.role === 'admin' })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Prevent accessing seller route via URL
app.get('/users/seller/:email', verifyJWT, async (req, res) => {
    try {
        const email = req.params.email
        const query = { email }
        const user = await UsersCollection.findOne(query)

        res.send({ isSeller: user?.role === 'Seller' })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// Prevent accessing seller route via URL
app.get('/users/buyer/:email', verifyJWT, async (req, res) => {
    try {
        const email = req.params.email
        const query = { email }
        const user = await UsersCollection.findOne(query)

        res.send({ isBuyer: user?.role === 'Buyer' })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// save cart Products to database
app.post('/orders', async (req, res) => {
    try {
        const query = req.body
        const orders = await OrdersCollection.insertOne(query)
        res.send({
            success: true,
            orders: orders,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

// get all products

app.get('/orders', verifyJWT, async (req, res) => {
    try {
        const email = req.query.email
        const query = { email: email }

        const orders = await OrdersCollection.find(query).toArray()

        res.send({
            success: true,
            orders: orders,
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message,
        })
    }
})

app.listen(port, () =>
    console.log(`Server Running on Port ${ port }`.random.bold),
)
