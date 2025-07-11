const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
mongoose.set("strictQuery", false);
const Author = require("./models/author");
const Book = require("./models/book");

require("@dotenvx/dotenvx").config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log("connecting to", MONGODB_URI);

mongoose
	.connect(MONGODB_URI)
	.then(() => {
		console.log("connected to MongoDB");
	})
	.catch((error) => {
		console.error("error connecting to MongoDB:", error.message);
	});

const typeDefs = `
  type Query {
	bookCount: Int
	authorCount: Int
    allBooks: [Book!]
	allAuthors: [Author!]
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Author {
	name: String!
	born: Int
	bookCount: Int
  }

  type Mutation {
    addBook(
      title: String!
	  author: String!
	  published: Int!
	  genres: [String!]!
	): Book
	editAuthor(
		name: String!
		setBornTo: Int
	): Author
  }
`;

const resolvers = {
	Query: {
		bookCount: async () => Book.collection.countDocuments(),
		authorCount: async () => Author.collection.countDocuments(),
		allBooks: async () => Book.find({}),
		allAuthors: async () => Author.find({}),
	},
	Mutation: {
		addBook: async (root, args) => {
			const book = new Book({ ...args });
			if (!(await Author.findOne({ name: args.author }))) {
				const author = new Author({
					name: args.author,
					born: null,
				});
				await author.save();
			}
			return book.save();
		},
		editAuthor: async (root, args) => {
			const author = await Author.findOne({ name: args.name });
			if (!author) {
				return null;
			}
			author.born = args.setBornTo;
			return author.save();
		},
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
});

startStandaloneServer(server, {
	listen: { port: 4000 },
}).then(({ url }) => {
	console.log(`Server ready at ${url}`);
});
