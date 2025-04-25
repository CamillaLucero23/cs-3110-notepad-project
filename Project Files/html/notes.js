document.addEventListener("DOMContentLoaded", () => {
    const authHeader = sessionStorage.getItem("authHeader");

    // If authHeader doesn't exist, redirect to login page
    if (!authHeader) {
        console.log("No authHeader found, redirecting to login...");
        window.location.href = "page_login.html";  // Redirect to login page if not logged in
    }

    // If logged in, proceed to display notes
    console.log("Logged in as: " + sessionStorage.getItem("username"));
    refreshNotes();  // Call your function to refresh/display notes
});

// Your code for refreshing/displaying notes goes here
const refreshNotes = () => {
    const authHeader = sessionStorage.getItem("authHeader");
    console.log("Auth header from sessionStorage: ", authHeader);

    fetch('/api', {
        method: 'GET',
        headers: {
            "Authorization": authHeader
        }
    })
    .then(body => body.json())
    .then(note => {
		console.log(note);
		const notesContainer = document.getElementById('noteContainer');
		notesContainer.innerHTML = ""; // Clear the previous notes

		note.forEach((n) => {
			const noteSection = document.createElement('div');
			noteSection.id = n.id;
			noteSection.classList.add('note'); // Add a class for styling

			noteSection.innerHTML = `
				<h3>${n.title}</h3>
				<p>${n.created}</p>
				<p>Author - ${n.username}</p>
			`;

			const buttonContainer = document.createElement('div');
			buttonContainer.classList.add('button-container'); // Add a wrapper for buttons

			const deleteButton = document.createElement('button');
			deleteButton.classList.add('button4');
			deleteButton.textContent = 'Delete';
			deleteButton.id = n.id.toString() + '_del';
			deleteButton.onclick = () => {
				noteSection.remove();
				deleteNote(n.id);
			};

			const editButton = document.createElement('button');
			editButton.classList.add('button4');
			editButton.textContent = 'Edit';
			editButton.id = n.id.toString() + '_edit';
			editButton.onclick = () => {
				const redirectURL = `notepad_edit.html?noteIndex=${n.id.toString()}`;
				window.location.href = redirectURL;
			};
			
			const docBreak = document.createElement('p');
			
			buttonContainer.appendChild(editButton);
			buttonContainer.appendChild(deleteButton);
			noteSection.appendChild(buttonContainer);
			notesContainer.appendChild(noteSection);
			notesContainer.appendChild(docBreak);
        });
	});
}

//DEL
const deleteNote = (noteIndex) => {
	const authHeader = sessionStorage.getItem("authHeader");
	console.log("Auth header from sessionStorage:", authHeader);
	fetch(`/api?noteIndex=${noteIndex}`, {
	  method: 'DELETE',
	  headers: {
		"Authorization": authHeader,
	  }
	})
	.then(refreshNotes)
	.catch(error => console.error('Error deleting note:', error));
  }

refreshNotes();  // Call the function to refresh the notes
