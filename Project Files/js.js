let notes = []; // We store all our notes in this

const noteInput = document.getElementById("noteInput");
const saveButton = document.getElementById("saveNoteButton");
const deleteButton = document.getElementById("deleteNoteButton");

// Event Listener for Saving Notes 
saveButton.addEventListener("click", function () {
    let noteText = noteInput.value.trim(); // Gets the note
     
    // Check if the user is not pressing save with no input
    if (noteText === "") {
        alert("Please enter a note!");
        return;
    }

    notes.push(noteText);
    displayNotesArray(); // Update displayed notes
    noteInput.value = ""; // Clear input field
});

// Function to Display notes on the page
function displayNotesArray() {
    noteContainer.innerHTML = ""; // Clear old notes (if not cleared it will keep adding old ones)

    notes.forEach((note, index) => {
        let noteElement = document.createElement("p");
        noteElement.textContent = `> ${note}`;
        noteElement.classList.add("noteItem");

        // Individual note deletion when clicked on
        noteElement.addEventListener("click", function (event) {
            event.stopPropagation(); //  The reason why this is needed is because we want to stop the cick event from bubbleing up and trigiring any parent elements. so if we add a click event to a parent element it could trigger it as well and cause issues.
            notes.splice(index, 1); // Remove from array
            displayNotesArray();
        });

        noteContainer.appendChild(noteElement);
    });
}

// Event Listener to Clear All Notes
deleteButton.addEventListener("click", function () {
    notes = []; // Clear array
    noteContainer.innerHTML = ""; // Clear displayed notes
});
