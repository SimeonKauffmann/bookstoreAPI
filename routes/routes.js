const sql = require('mssql')
const express = require('express')
const router = express.Router()


router.get('/:isbn', async (req, res) => {
  try {
    const connection = await sql.connect(process.env.ConnectionString)
    const book = await connection.request()
      .input('isbn', sql.NVarChar, req.params.isbn)
      .query(`
      select 
        books.title as Title, 
        Genre.Name as Genre, 
        books.Language, 
        books.Pages, 
        string_agg((authors.FirstName + ' ' + authors.LastName) , ', ') as Author, 
        books.Price, 
        books.ISBN  
      from 
        Books
      join 
        AuthorsBooks on books.ISBN = AuthorsBooks.ISBN
      join 
        Authors on AuthorsBooks.authorsID = authors.ID
      join 
        Genre on Genre.GenreID = books.GenreId
      group by 
        books.Title , books.Price, books.ISBN, Genre.Name, books.Language, books.Pages
      having 
        books.isbn = @isbn
      `)
    const stores = await connection.request()
      .input('isbn', sql.NVarChar, req.params.isbn)
      .query(`
        select 
          shops.Name as Store, 
          stockbalance.Amount as [Stock Balance] from  StockBalance
        join 
          Shops on StockBalance.StoreID = shops.ID
        group by 
          shops.Name, stockbalance.Amount, StockBalance.isbn
        having 
          StockBalance.isbn = @isbn
      `)
    res.status(200).render('book.pug', { book: book.recordset[0], stores: stores.recordset })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

router.get('/:isbn/edit', async (req, res) => {
  try {
    const connection = await sql.connect(process.env.ConnectionString)
    const book = await connection.request()
      .input('isbn', sql.NVarChar, req.params.isbn)
      .query(`select * from Books where books.isbn = @isbn`)
    const authors = await connection.request()
      .query(`
      select * from Authors
      `)
    const bookAuthors = await connection.request()
      .input('isbn', sql.NVarChar, req.params.isbn)
      .query(`
      select * from AuthorsBooks 
      where isbn = @isbn
      `)
    res.status(200).render('edit.pug', { book: book.recordset[0], authors: authors.recordset, bookAuthors: bookAuthors.recordset })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})


router.post('/', async (req, res) => {
  try {

    const connection = await sql.connect(process.env.ConnectionString)
    connection.request()
      .input('title', sql.NVarChar, req.body.title)
      .input('language', sql.NVarChar, req.body.language)
      .input('pages', sql.Int, req.body.pages)
      .input('price', sql.Money, req.body.price)
      .input('isbn', sql.NVarChar, req.body.isbn)
      .query(`
        update 
          Books 
        set
          title = @title, language = @language, pages = @pages, price = @price 
        where 
          isbn = @isbn
        `)
    connection.request()
      .input('isbn', sql.NVarChar, req.body.isbn)
      .query(`
        delete 
          AuthorsBooks
        where 
          isbn = @isbn
        `)

    if (req.body.author[0]) {
      for (i = 0; i < req.body.author.length; i++) {
        connection.request()
          .input('isbn', sql.NVarChar, req.body.isbn)
          .input('author', sql.Int, parseInt(req.body.author[i]))
          .query(`
        insert into  
          AuthorsBooks (isbn, authorsID)
        values
          (@isbn, @author)
        `)
      }
    } else {
      connection.request()
        .input('isbn', sql.NVarChar, req.body.isbn)
        .input('author', sql.Int, parseInt(req.body.author))
        .query(`
        insert into  
          AuthorsBooks (isbn, authorsID)
        values
          (@isbn, @author)
        `)
    }
    res.redirect(302, `/book/${req.body.isbn}`)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

router.get('*', (req, res) => {
  res.status(404).send('Page not found')
})

module.exports = router