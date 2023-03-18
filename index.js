const express = require('express');
const neo4j = require('neo4j-driver');

const app = express();
const port = 3000;

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'C@det687')
);

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
    res.json(result.records.map(record => record.get('t').properties));
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  } finally {
    await session.close();
  }
});

app.post('/', async (req, res) => {
  const session = driver.session()
  const query = `
    CREATE (t:Todo {title: $title, description: $description, completed: $completed})
    RETURN t
  `
  const params = {
    title: req.body.title,
    description: req.body.description,
    completed: false 
  }

  try {
    const result = await session.run(query, params)
    console.log(result)
    res.json(result.records.map(record => record.get('t').properties))
  } catch (error) {
    console.error(error)
    res.status(500).send('Error')
  } finally {
    await session.close()
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
