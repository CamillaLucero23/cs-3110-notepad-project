//GET
const refreshNotes = () => {
	const authHeader = sessionStorage.getItem("authHeader")
	console.log("Auth header from sessionStorage: ", authHeader)

	fetch('/api', {
		method: 'GET',
		headers: {
			"Authorization": authHeader
		}
	})
	.then(body => body.json())
	.then(note => {
		
		const notesContainer = document.getElementById('noteContainer');
		notesContainer.innerHTML = ''; // Clear any existing notes
		
		note.forEach((n) => {
			
			//Create a section for our note
			const noteSection = document.createElement('div');
			//Define its id
			noteSection.id = note.indexOf(n);

			noteSection.innerHTML = n;
			
			// Create the delete button
			const deleteButton = document.createElement('button');
			deleteButton.textContent = 'Delete';
			deleteButton.id = note.indexOf(n).toString() + '_delete'
			 deleteButton.onclick = () => {
				// Remove the note section
				noteSection.remove();
				// Send AJAX request to delete the note from the server
				deleteNote(note.indexOf(n))}
			
			// Create the edit button
			const editButton = document.createElement('button');
			editButton.textContent = 'Edit';
			editButton.id = note.indexOf(n).toString() + '_edit'
			editButton.onclick = () => {
				// Edit the note (you can add more advanced editing functionality here)
				const newNote = prompt('Edit your note:', n);
				if (newNote !== null && newNote !== n) {
					noteSection.innerHTML = newNote;
				// Send AJAX request to update the note on the server
				editNote(note.indexOf(n), newNote)}
			}
        
  
			//append to our buttons
			noteSection.appendChild(deleteButton);
			noteSection.appendChild(editButton);
	
			//Append our section to section in our document
			notesContainer.appendChild(noteSection);

		})
	})
}

refreshNotes()

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
  
//PUT
const editNote = (noteIndex, newNote) => {
	const authHeader = sessionStorage.getItem("authHeader");
	console.log("Auth header from sessionStorage:", authHeader);
	
    fetch(`/api?noteIndex=${noteIndex}`, {
        method: 'PUT',
		headers: {
		"Authorization": authHeader,
		"Content-Type": "application/json"
		},
		body: JSON.stringify({ noteIndex, newNote }),
		
    }
	
	)
    .then(refreshNotes)
	.catch(error => console.error('Error edititng note:', error))
}
