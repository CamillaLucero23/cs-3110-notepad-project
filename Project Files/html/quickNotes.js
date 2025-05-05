document.addEventListener("DOMContentLoaded", () => {
    const authHeader = sessionStorage.getItem("authHeader");

    // If authHeader doesn't exist, redirect to login page
    if (!authHeader) {
        console.log("No authHeader found, redirecting to login...");
        window.location.href = "page_login.html";  // Redirect to login page if not logged in
    }

    // If logged in, proceed to display quick notes
    console.log("Logged in as: " + sessionStorage.getItem("username"));
    refreshQuickNotes();  // Call your function to refresh/display quick notes

});

// Your code for refreshing/displaying quick notes goes here
const refreshQuickNotes = () => {
    const authHeader = sessionStorage.getItem("authHeader");
    console.log("Auth header from sessionStorage: ", authHeader);

    fetch('/api', {
        method: 'GET',
        headers: {
            "Authorization": authHeader
        }
    })
    .then(body => body.json())
    .then(quickNote => {
		console.log(quickNote);
		const quickNotesContainer = document.getElementById('quickNoteContainer');
		quickNotesContainer.innerHTML = ""; // Clear the previous notes

		quickNote.forEach((n) => {
			
			if (n.title == 'quickNote'){
				const quickNoteSection = document.createElement('div');
				quickNoteSection.id = n.id;
				quickNoteSection.classList.add('quickNote'); // Add a class for styling

				quickNoteSection.innerHTML = `
					<h3>Quick Note</h3>
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
					quickNoteSection.remove();
					deleteQuickNote(n.id);
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
				quickNoteSection.appendChild(buttonContainer);
				quickNotesContainer.appendChild(quickNoteSection);
				quickNotesContainer.appendChild(docBreak);
		}});
	});
}

//DEL
const deleteQuickNote = (noteIndex) => {
	const authHeader = sessionStorage.getItem("authHeader");
	console.log("Auth header from sessionStorage:", authHeader);
	fetch(`/api?noteIndex=${noteIndex}`, {
	  method: 'DELETE',
	  headers: {
		"Authorization": authHeader,
	  }
	})
	.then(refreshQuickNotes)
	.catch(error => console.error('Error deleting quick note:', error));
  }

refreshQuickNotes();  // Call the function to refresh the notes
