//GET
const refreshNotes = () => {
	fetch('/api', {method: 'GET'})
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
			deleteButton.id = n + '_delete'
			 deleteButton.onclick = () => {
				// Remove the note section
				noteSection.remove();
				// Send AJAX request to delete the note from the server
				deleteNote(note.indexOf(n))}
			
			// Create the edit button
			const editButton = document.createElement('button');
			editButton.textContent = 'Edit';
			editButton.id = n + '_edit'
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
	
			/*//Show our button
			document.getElementById('deleteNote').style.display = "block";*/
		})
	})
}

refreshNotes()

//DEL
const deleteNote = (noteIndex) => {
    fetch('/api', {
        method: 'DELETE',
        body: JSON.stringify({ noteIndex })
    })
    .then(refreshNotes);
}

//PUT
const editNote = (noteIndex, newNote) => {
    fetch('/api', {
        method: 'PUT',
		body: JSON.stringify({ noteIndex, newNote })
    })
    .then(refreshNotes);
}
