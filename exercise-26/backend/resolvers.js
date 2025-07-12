const { GraphQLError } = require("graphql");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const resolvers = {
	Query: {
		bookCount: async () => Book.collection.countDocuments(),
		authorCount: async () => Author.collection.countDocuments(),
		allBooks: async (root, args) => {
			let query = {};

			console.log("Querying books with args:", args);

			if (args.author) {
				let author = Author.findOne({ name: args.author });
				if (!author) {
					return [];
				}
				query.author = author._id;
			}
			if (args.genre) {
				console.log("Genre filter applied:", args.genre);
				query.genres = { $in: [args.genre] };
			}

			const books = await Book.find(query).populate("author");

			return books;
		},
		allAuthors: async () => {
			const authors = await Author.aggregate([
				{
					$lookup: {
						from: "books",
						localField: "_id",
						foreignField: "author",
						as: "books",
					},
				},
				{
					$project: {
						name: 1,
						born: 1,
						bookCount: { $size: "$books" },
					},
				},
			]);
			return authors;
		},
		me: (root, args, context) => {
			return context.currentUser;
		},
		allGenres: async () => {
			return await Book.find({}).distinct("genres");
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

			let author = await Author.findOne({ name: args.author });

			if (!author) {
				author = new Author({ name: args.author });
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
			const book = new Book({ ...args, author: author._id });
			try {
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
			const populatedBook = await book.populate("author");

			pubsub.publish("BOOK_ADDED", { bookAdded: populatedBook });

			return populatedBook;
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
			return author;
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
	Subscription: {
		bookAdded: {
			subscribe: (root, args) => {
				return pubsub.asyncIterableIterator("BOOK_ADDED");
			},
		},
	},
};

module.exports = resolvers;
