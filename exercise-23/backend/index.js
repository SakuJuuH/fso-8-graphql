const mongoose = require("mongoose");
const { ApolloServer } = require("@apollo/server");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const { expressMiddleware } = require("@apollo/server/express4");
const {
	ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const cors = require("cors");
const http = require("http");

const User = require("./models/user");
const jwt = require("jsonwebtoken");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

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

const start = async () => {
	const app = express();
	const httpServer = http.createServer(app);

	const wsServer = new WebSocketServer({
		server: httpServer,
		path: "/",
	});

	const schema = makeExecutableSchema({
		typeDefs,
		resolvers,
	});

	const serverCleanup = useServer({ schema }, wsServer);

	const server = new ApolloServer({
		schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose();
							await mongoose.connection.close();
						},
					};
				},
			},
		],
	});
	await server.start();

	app.use(
		"/",
		cors(),
		express.json(),
		expressMiddleware(server, {
			context: async ({ req }) => {
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
		})
	);

	const PORT = process.env.PORT || 4000;

	httpServer.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
};

start();
