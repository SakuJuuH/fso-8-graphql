import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../queries";

const LoginForm = (props) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const [login, result] = useMutation(LOGIN);

	useEffect(() => {
		if (result.data) {
			const token = result.data.login.value;
			props.setToken(token);
			localStorage.setItem("library-user-token", token);
		}
	}, [result.data]); // eslint-disable-line

	if (!props.show) {
		return null;
	}

	const submit = async (event) => {
		event.preventDefault();
		login({ variables: { username, password } });
		props.setPage("authors");
	};

	return (
		<form onSubmit={submit}>
			<div>
				username
				<input
					value={username}
					onChange={({ target }) => setUsername(target.value)}
				/>
			</div>
			<div>
				password
				<input
					type='password'
					value={password}
					onChange={({ target }) => setPassword(target.value)}
				/>
			</div>
			<button type='submit'>login</button>
		</form>
	);
};

export default LoginForm;
