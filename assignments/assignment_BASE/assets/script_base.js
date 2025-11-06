
// buttons
const addButton = document.getElementById('add-btn');
const listButton = document.getElementById('list-view-btn');
const cardButton = document.getElementById('card-view-btn');

// elements
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list-container');


// event listeners
// List
listButton.addEventListener('click', () => {
    console.log('List button pressed!');

    taskList.classList.remove('card-view');
    taskList.classList.add('list-view');    // change the class of the list
    
})

// Cards
cardButton.addEventListener('click', () => {
    console.log('Card button pressed!!');

    taskList.classList.remove('list-view');
    taskList.classList.add('card-view');    // change the class of the list
})

// Add
addButton.addEventListener('click', () => {
    console.log("Add button pressed!");

    const inputValue = taskInput.value; // get the value of the input field

    const listElement = document.createElement('li');   // create a new li element

    listElement.innerHTML = inputValue; // set the content of the li element with the input filed value

    taskList.appendChild(listElement);  // append the li element to the ul list

    taskInput.value = '';   // reset (delete) the input filed current text
})
