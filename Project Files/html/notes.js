document.addEventListener("DOMContentLoaded", () => {
    const authHeader = sessionStorage.getItem("authHeader");

    // If authHeader doesn't exist, redirect to login page
    if (!authHeader) {
        console.log("No authHeader found, redirecting to login...");
        window.location.href = "login.html";  // Redirect to login page if not logged in
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
        notesContainer.innerHTML = "";  // Clear the previous notes

        note.forEach((n) => {
            const noteSection = document.createElement('div');
            noteSection.id = n.id;
            noteSection.innerHTML = `
                <h3>${n.title}</h3>
                <p><strong>Author:</strong> ${n.username}</p>
                <p><strong>Created:</strong> ${n.created}</p>
                <p>${n.note}</p>
            `;
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.id = n.id.toString() + '_delete';
            deleteButton.onclick = () => {
                noteSection.remove();
                deleteNote(n.id);
            };

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.id = n.id.toString() + '_edit';
            editButton.onclick = () => {
                const redirectURL = `notepad_edit.html?noteIndex=${n.id.toString()}`;
                window.location.href = redirectURL;
            };

            noteSection.appendChild(deleteButton);
            noteSection.appendChild(editButton);

            notesContainer.appendChild(noteSection);
        });
    });
}

refreshNotes();  // Call the function to refresh the notes
