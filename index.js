const express = require('express')
const neo4j = require('neo4j-driver')
const { v4: uuidv4 } = require('uuid')
const dotenv = require("dotenv").config()

const app = express();
const port = 3000;

const driver = neo4j.driver(
  process.env.NEO4J_URL,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
)

app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))

app.get('/', async (req, res) => {
  const session = driver.session()
  const query = `
    MATCH (t:Todo)
    RETURN t
  `
  try {
    const result = await session.run(query)
    res.status(200).json(result.records.map(record => record.get('t').properties))
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
})

app.get('/:id', async (req, res) => {
  const session = driver.session()
  const id = req.params.id
  const query = `
    MATCH (t:Todo {id: $id})
    RETURN t
  `
  try {
    const result = await session.run(query, { id })
    res.status(200).json(result.records.map(record => record.get('t').properties))
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
})

app.post('/', async (req, res) => {
  const session = driver.session()
  const query = `
    CREATE (t:Todo {id: $id, title: $title, description: $description, completed: $completed})
    RETURN t
  `
  const params = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    completed: false
  }

  try {
    const result = await session.run(query, params)
    res.json(result.records.map(record => record.get('t').properties))
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
})

app.put('/:id', async (req, res) => {
  const session = driver.session()

  const id = req.params.id;
  const { title, description, completed } = req.body;

  const properties = { id }

  if (title) {
    properties.title = title;
  }
  if (description) {
    properties.description = description;
  }
  if (completed) {
    properties.completed = completed;
  }
  const query = `
    MATCH (t:Todo {id: $id}) SET t += $properties RETURN t
  `

  const params = {
    id,
    properties
  }

  try {
    const result = await session.run(query, params)
    res.json(result.records[0].get('t').properties)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
})

app.delete('/:id', async (req, res) => {
  const { id } = req.params
  const session = driver.session()
  const query = `
    MATCH (t: Todo {id: $id}) DELETE t RETURN count(t)
  `
  try {
    const result = await session.run(query, { id })
    console.log(result)
    res.json(`${result.records[0].get('count(t)')} document(s) deleted`)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
})



app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
