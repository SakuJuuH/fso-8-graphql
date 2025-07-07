import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { ALL_AUTHORS, MODIFY_AUTHOR } from "../queries";

const Authors = (props) => {
	const [name, setName] = useState("");
	const [born, setBorn] = useState("");

	const [modifyAuthor] = useMutation(MODIFY_AUTHOR, {
		refetchQueries: [{ query: ALL_AUTHORS }],
		onCompleted: () => {
			setName("");
			setBorn("");
		},
	});

	if (!props.show) {
		return null;
	}

	const result = useQuery(ALL_AUTHORS);

	const authors = result.data ? result.data.allAuthors : [];

	const submit = async (event) => {
		event.preventDefault();

		console.log("name:", name);
		console.log("born:", born);

		modifyAuthor({
			variables: {
				name,
				setBornTo: parseInt(born),
			},
		});
	};

	return (
		<div>
			<h2>authors</h2>
			<table>
				<tbody>
					<tr>
						<th></th>
						<th>born</th>
						<th>books</th>
					</tr>
					{authors.map((a) => (
						<tr key={a.name}>
							<td>{a.name}</td>
							<td>{a.born}</td>
							<td>{a.bookCount}</td>
						</tr>
					))}
				</tbody>
			</table>
			<h3>Set birthyear</h3>
			<form onSubmit={submit}>
				<div>
					name
					<input
						type='text'
						value={name}
						onChange={({ target }) => setName(target.value)}
					/>
				</div>
				<div>
					born
					<input
						type='number'
						value={born}
						onChange={({ target }) => setBorn(target.value)}
					/>
				</div>
				<button type='submit'>update author</button>
			</form>
		</div>
	);
};

export default Authors;
