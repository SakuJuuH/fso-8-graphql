import { gql, useQuery } from "@apollo/client";

const ALL_BOOKS = gql`
	query {
		allBooks {
			title
			author
			published
		}
	}
`;

const Books = (props) => {
	if (!props.show) {
		return null;
	}

	const result = useQuery(ALL_BOOKS);

	const books = result.data ? result.data.allBooks : [];

	return (
		<div>
			<h2>books</h2>

			<table>
				<tbody>
					<tr>
						<th></th>
						<th>author</th>
						<th>published</th>
					</tr>
					{books.map((a) => (
						<tr key={a.title}>
							<td>{a.title}</td>
							<td>{a.author}</td>
							<td>{a.published}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Books;
