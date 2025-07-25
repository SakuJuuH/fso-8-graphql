import { useState } from "react";
import { useMutation } from "@apollo/client";
import { ALL_BOOKS, ALL_AUTHORS, CREATE_BOOK, ALL_GENRES } from "../queries";

const NewBook = (props) => {
	const [title, setTitle] = useState("");
	const [author, setAuthor] = useState("");
	const [published, setPublished] = useState("");
	const [genre, setGenre] = useState("");
	const [genres, setGenres] = useState([]);

	const [createBook] = useMutation(CREATE_BOOK, {
		refetchQueries: [{ query: ALL_AUTHORS }, { query: ALL_GENRES }],
		update: (cache, response) => {
			const addedBook = response.data.addBook;

			// Update the cache for the query with no genre filter
			cache.updateQuery(
				{ query: ALL_BOOKS, variables: { genre: null } },
				(data) => {
					if (data) {
						return {
							allBooks: data.allBooks.concat(addedBook),
						};
					}
				}
			);

			// Update the cache for each genre of the new book
			addedBook.genres.forEach((genre) => {
				cache.updateQuery(
					{ query: ALL_BOOKS, variables: { genre: genre } },
					(data) => {
						if (data) {
							return {
								allBooks: data.allBooks.concat(addedBook),
							};
						}
					}
				);
			});
		},
	});

	if (!props.show) {
		return null;
	}

	const submit = async (event) => {
		event.preventDefault();

		createBook({
			variables: {
				title,
				author,
				published: parseInt(published),
				genres,
			},
		});

		setTitle("");
		setPublished("");
		setAuthor("");
		setGenres([]);
		setGenre("");
	};

	const addGenre = () => {
		setGenres(genres.concat(genre));
		setGenre("");
	};

	return (
		<div>
			<form onSubmit={submit}>
				<div>
					title
					<input
						value={title}
						onChange={({ target }) => setTitle(target.value)}
					/>
				</div>
				<div>
					author
					<input
						value={author}
						onChange={({ target }) => setAuthor(target.value)}
					/>
				</div>
				<div>
					published
					<input
						type='number'
						value={published}
						onChange={({ target }) => setPublished(target.value)}
					/>
				</div>
				<div>
					<input
						value={genre}
						onChange={({ target }) => setGenre(target.value)}
					/>
					<button onClick={addGenre} type='button'>
						add genre
					</button>
				</div>
				<div>genres: [{genres.join(", ")}]</div>
				<button type='submit'>create book</button>
			</form>
		</div>
	);
};

export default NewBook;
