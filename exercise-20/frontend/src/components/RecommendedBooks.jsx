import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { ALL_BOOKS, ME } from "../queries";

const RecommendedBooks = (props) => {
	const user = useQuery(ME);

	if (user.loading) {
		return <div>loading...</div>;
	}

	const favoriteGenre = user.data.me.favoriteGenre;

	const books = useQuery(ALL_BOOKS);

	if (books.loading) {
		return <div>loading...</div>;
	}

	const filteredBooks = books.data.allBooks.filter((book) =>
		book.genres.includes(favoriteGenre)
	);

	if (!props.show) {
		return null;
	}

	return (
		<div>
			<h2>Recommended Books</h2>
			<p>
				in your favorite genre <strong>{favoriteGenre}</strong>
			</p>
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Author</th>
						<th>Published</th>
					</tr>
				</thead>
				<tbody>
					{filteredBooks.map((book) => (
						<tr key={book.title}>
							<td>{book.title}</td>
							<td>{book.author.name}</td>
							<td>{book.published}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RecommendedBooks;
