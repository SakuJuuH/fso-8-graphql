const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
mongoose.set("strictQuery", false);
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");
const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");

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
    allBooks(author: String, genre: String): [Book!]
    allAuthors: [Author!]
    me : User
  }

  type Book {
    title: String!
    published: Int
    author: Author!
    id: ID!
    genres: [String!]
  }

  type Author {
	name: String!
	born: Int
	bookCount: Int
  }

  type User {
	username: String!
	favoriteGenre: String!
	id: ID!
  }

  type Token {
    value: String!
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
	createUser(
		username: String!
	): User
	login(
		username: String!
		password: String!
	): Token
  }
`;

const resolvers = {
	Query: {
		bookCount: async () => Book.collection.countDocuments(),
		authorCount: async () => Author.collection.countDocuments(),
		allBooks: (root, args) => {
			if (args.author && args.genre) {
				return Book.find({
					author: args.author,
					genres: { $in: [args.genre] },
				});
			}
			if (args.genre) {
				return Book.find({ genres: { $in: [args.genre] } });
			}
			if (args.author) {
				return Book.find({ author: args.author });
			}
			return Book.find({});
		},
		allAuthors: async () => Author.find({}),
		me: (root, args, context) => {
			return context.currentUser;
		},
	},
	Mutation: {
		addBook: async (root, args, context) => {
			if (!context.currentUser) {
				throw new GraphQLError("Not authenticated", {
					extensions: {
						code: "UNAUTHENTICATED",
					},
				});
			}
			const book = new Book({ ...args });

			try {
				if (!(await Author.findOne({ name: args.author }))) {
					const author = new Author({
						name: args.author,
						born: null,
					});
					try {
						await author.save();
					} catch (error) {
						throw new GraphQLError("Failed to create author", {
							extensions: {
								code: "BAD_USER_INPUT",
								invalidArgs: args.author,
								originalError: error,
							},
						});
					}
				}
				await book.save();
			} catch (error) {
				throw new GraphQLError("Failed to create book", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args,
						originalError: error,
					},
				});
			}
		},
		editAuthor: async (root, args, context) => {
			if (!context.currentUser) {
				throw new GraphQLError("Not authenticated", {
					extensions: {
						code: "UNAUTHENTICATED",
					},
				});
			}
			const author = await Author.findOne({ name: args.name });
			if (!author) {
				return null;
			}
			author.born = args.setBornTo;
			try {
				await author.save();
			} catch (error) {
				throw new GraphQLError("Failed to update author", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args.name,
						originalError: error,
					},
				});
			}
		},
		createUser: async (root, args) => {
			const user = new User({ username: args.username });
			console.log("Creating user", user);

			try {
				await user.save();
			} catch (error) {
				throw new GraphQLError("Failed to create user", {
					extensions: {
						code: "BAD_USER_INPUT",
						invalidArgs: args.username,
						originalError: error,
					},
				});
			}
			return user;
		},
		login: async (root, args) => {
			const user = await User.findOne({ username: args.username });
			if (!user || args.password !== "password") {
				throw new GraphQLError("Invalid username or password", {
					extensions: {
						code: "BAD_USER_INPUT",
					},
				});
			}

			const token = {
				username: user.username,
				id: user._id,
			};

			return { value: jwt.sign(token, process.env.JWT_SECRET) };
		},
	},
};

const server = new ApolloServer({
	typeDefs,
	resolvers,
});

startStandaloneServer(server, {
	listen: { port: 4000 },
	context: async ({ req, res }) => {
		const auth = req ? req.headers.authorization : null;
		if (auth && auth.toLowerCase().startsWith("bearer ")) {
			const decodedToken = jwt.verify(
				auth.substring(7),
				process.env.JWT_SECRET
			);
			const currentUser = await User.findById(decodedToken.id);
			return { currentUser };
		}
		return {};
	},
}).then(({ url }) => {
	console.log(`Server ready at ${url}`);
});
