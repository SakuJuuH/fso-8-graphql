import { useQuery } from "@apollo/client";
import { ALL_BOOKS } from "../queries";
import { useState } from "react";

const Books = (props) => {
	const genres = ["all"];
	const [genre, setGenre] = useState("all");
	const result = useQuery(ALL_BOOKS);

	if (result.loading) {
		return <div>loading...</div>;
	}

	const books = result.data ? result.data.allBooks : [];

	if (!props.show) {
		return null;
	}

	if (books !== undefined && books.length > 0) {
		books.forEach((b) => {
			b.genres.forEach((g) => {
				if (!genres.includes(g.toLowerCase())) {
					genres.push(g.toLowerCase());
				}
			});
		});
	}

	return (
		<div>
			<h2>books</h2>
			{genre && (
				<p>
					in genre <strong>{genre}</strong>
				</p>
			)}
			<table>
				<tbody>
					<tr>
						<th></th>
						<th>author</th>
						<th>published</th>
					</tr>
					{genre === "all"
						? books.map((a) => (
								<tr key={a.title}>
									<td>{a.title}</td>
									<td>{a.author.name}</td>
									<td>{a.published}</td>
								</tr>
						  ))
						: books
								.filter((a) => a.genres.includes(genre))
								.map((a) => (
									<tr key={a.title}>
										<td>{a.title}</td>
										<td>{a.author.name}</td>
										<td>{a.published}</td>
									</tr>
								))}
				</tbody>
			</table>
			<div>
				{genres.map((g) => (
					<button
						key={g}
						onClick={() => setGenre(g)}
						style={{
							backgroundColor:
								genre === g ? "lightblue" : "white",
						}}
					>
						{g}
					</button>
				))}
			</div>
		</div>
	);
};

export default Books;
