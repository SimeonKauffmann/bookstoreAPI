require('dotenv').config()

const express = require('express')
const sql = require('mssql')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()

app.set('view engine', 'pug');
app.locals.pretty = true;
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))



const router = require('./routes/routes')


app.use('/book', router)


app.get('/', async (req, res) => {
  let sortString
  if (['ISBN', 'Author', 'Price'].find(string => string === req.query.sortColumn)) {
    sortString = req.query.sortColumn
  }
  else { sortString = 'Title' }
  try {
    const connection = await sql.connect(process.env.ConnectionString)
    const result = await connection.request()
      .query(`
      select 
        books.Title as Title, 
        string_agg((authors.FirstName + ' ' + authors.LastName) , ', ') as Author, 
        books.Price as Price, 
        books.ISBN as ISBN 
      from 
        Books
      join 
        AuthorsBooks on books.ISBN = AuthorsBooks.ISBN
      join 
        Authors on AuthorsBooks.authorsID = authors.ID
      group by 
        books.Title , books.Price, books.ISBN
      order by ${sortString}
      `)
    res.status(200).render('index.pug', { books: result.recordset, column: sortString })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

app.get('*', (req, res) => {
  res.status(404).send('Page not found')
})

app.listen(3031, () => {
  console.log('Server is running on port 3031')
})


