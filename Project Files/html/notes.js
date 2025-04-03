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
	.then(body =>body.json())
	.then(note => {
		
		console.log(note)
		const notesContainer = document.getElementById('noteContainer');
		notesContainer.innerHTML = "" // make sure the html block is clear
		note.forEach((n) => {
			
			//Create a section for our note
			const noteSection = document.createElement('div');
			//Define its id
			noteSection.id = n.id;
			noteSection.innerHTML=`
				<h3>${n.title}</h3>
				<p><strong>Created:</strong> ${n.created}</p>
				<p>${n.note}</p>
			`
			
			// Create the delete button
			const deleteButton = document.createElement('button');
			deleteButton.textContent = 'Delete';
			deleteButton.id = n.id.toString() + '_delete'
			 deleteButton.onclick = () => {
				// Remove the note section
				noteSection.remove();
				// Send AJAX request to delete the note from the server
				deleteNote(n.id)}
			
			// Create the edit button
			const editButton = document.createElement('button');
			editButton.textContent = 'Edit';
			editButton.id = n.id.toString() + '_edit'
			editButton.onclick = () => {
				
				const redirectURL = `notepad_edit.html?noteIndex=${n.id.toString()}`;
				window.location.href = redirectURL;
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


