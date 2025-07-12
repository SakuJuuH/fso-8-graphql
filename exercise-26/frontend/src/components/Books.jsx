import { useQuery } from "@apollo/client";
import { ALL_GENRES } from "../queries";
import { useState } from "react";
import BookList from "./BookList";

const Books = (props) => {
	const [genre, setGenre] = useState("all");

	const { loading, data } = useQuery(ALL_GENRES);

	if (loading) {
		return <div>loading...</div>;
	}

	let allGenres = data ? data.allGenres : [];

	allGenres = ["all", ...allGenres];

	if (!props.show) {
		return null;
	}

	return (
		<div>
			<h2>books</h2>
			{genre && (
				<p>
					in genre <strong>{genre}</strong>
				</p>
			)}
			<div>
				{allGenres.map((g) => (
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
			<BookList genre={genre !== "all" ? genre : null} show={true} />
		</div>
	);
};

export default Books;
