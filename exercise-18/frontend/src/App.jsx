import { useState } from "react";
import { useApolloClient } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { ME } from "./queries";
import LoginForm from "./components/LoginForm";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";

const App = () => {
	const [token, setToken] = useState(() => {
		const token = localStorage.getItem("library-user-token");
		return token ? token : null;
	});
	const [page, setPage] = useState("authors");
	const result = useQuery(ME);
	const client = useApolloClient();

	if (result.loading) {
		return <div>loading...</div>;
	}

	const logout = () => {
		setToken(null);
		localStorage.clear();
		client.resetStore();
		setPage("authors");
	};

	return (
		<div>
			<div>
				<button onClick={() => setPage("authors")}>authors</button>
				<button onClick={() => setPage("books")}>books</button>
				{token ? (
					<>
						<button onClick={() => setPage("add")}>add book</button>
						<button onClick={() => logout()}>logout</button>
					</>
				) : (
					<button onClick={() => setPage("login")}>login</button>
				)}
			</div>

			<Authors show={page === "authors"} />

			<Books show={page === "books"} />

			<NewBook show={page === "add"} />

			<LoginForm
				show={page === "login"}
				setToken={setToken}
				setPage={setPage}
			/>
		</div>
	);
};

export default App;
