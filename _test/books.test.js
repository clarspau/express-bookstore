/** Integration tests for books route */

// Set the NODE_ENV to "test" to use the test database
process.env.NODE_ENV = "test";

// Import the required testing library for making HTTP requests
const request = require("supertest");

// Import the Express app and the test database
const app = require("../app");
const db = require("../db");

// Variable to store the ISBN of a sample book for testing
let book_isbn;

// Setup: Insert a sample book into the test database before each test
beforeEach(async () => {
     let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url, author, language, pages, publisher, title, year)
      VALUES (
        '123432122',
        'https://amazon.com/taco',
        'Elie',
        'English',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);

     book_isbn = result.rows[0].isbn;
});

// Test suite for the "POST /books" endpoint
describe("POST /books", function () {
     // Test case: Creates a new book
     test("Creates a new book", async function () {
          const response = await request(app)
               .post(`/books`)
               .send({
                    isbn: '32794782',
                    amazon_url: "https://taco.com",
                    author: "mctest",
                    language: "english",
                    pages: 1000,
                    publisher: "yeah right",
                    title: "amazing times",
                    year: 2000
               });
          expect(response.statusCode).toBe(201);
          expect(response.body.book).toHaveProperty("isbn");
     });

     // Test case: Prevents creating a book without the required title
     test("Prevents creating a book without a required title", async function () {
          const response = await request(app)
               .post(`/books`)
               .send({ year: 2000 });
          expect(response.statusCode).toBe(400);
     });
});

// Test suite for the "GET /books" endpoint
describe("GET /books", function () {
     // Test case: Gets a list of 1 book
     test("Gets a list of 1 book", async function () {
          const response = await request(app).get(`/books`);
          const books = response.body.books;
          expect(books).toHaveLength(1);
          expect(books[0]).toHaveProperty("isbn");
          expect(books[0]).toHaveProperty("amazon_url");
     });
});

// Test suite for the "GET /books/:isbn" endpoint
describe("GET /books/:isbn", function () {
     // Test case: Gets a single book
     test("Gets a single book", async function () {
          const response = await request(app)
               .get(`/books/${book_isbn}`);
          expect(response.body.book).toHaveProperty("isbn");
          expect(response.body.book.isbn).toBe(book_isbn);
     });

     // Test case: Responds with 404 if the book in question is not found
     test("Responds with 404 if can't find the book in question", async function () {
          const response = await request(app)
               .get(`/books/999`);
          expect(response.statusCode).toBe(404);
     });
});

// Test suite for the "PUT /books/:id" endpoint
describe("PUT /books/:id", function () {
     // Test case: Updates a single book
     test("Updates a single book", async function () {
          const response = await request(app)
               .put(`/books/${book_isbn}`)
               .send({
                    amazon_url: "https://taco.com",
                    author: "mctest",
                    language: "english",
                    pages: 1000,
                    publisher: "yeah right",
                    title: "UPDATED BOOK",
                    year: 2000
               });
          expect(response.body.book).toHaveProperty("isbn");
          expect(response.body.book.title).toBe("UPDATED BOOK");
     });

     // Test case: Prevents a bad book update
     test("Prevents a bad book update", async function () {
          const response = await request(app)
               .put(`/books/${book_isbn}`)
               .send({
                    isbn: "32794782",
                    badField: "DO NOT ADD ME!",
                    amazon_url: "https://taco.com",
                    author: "mctest",
                    language: "english",
                    pages: 1000,
                    publisher: "yeah right",
                    title: "UPDATED BOOK",
                    year: 2000
               });
          expect(response.statusCode).toBe(400);
     });

     // Test case: Responds with 404 if the book in question is not found
     test("Responds with 404 if can't find the book in question", async function () {
          // delete the book first
          await request(app)
               .delete(`/books/${book_isbn}`);
          const response = await request(app).delete(`/books/${book_isbn}`);
          expect(response.statusCode).toBe(404);
     });
});

// Test suite for the "DELETE /books/:id" endpoint
describe("DELETE /books/:id", function () {
     // Test case: Deletes a single book
     test("Deletes a single book", async function () {
          const response = await request(app)
               .delete(`/books/${book_isbn}`);
          expect(response.body).toEqual({ message: "Book deleted" });
     });
});

// Cleanup: Remove all records from the BOOKS table after each test
afterEach(async function () {
     await db.query("DELETE FROM BOOKS");
});

// Cleanup: Close the database connection after all tests
afterAll(async function () {
     await db.end();
});
