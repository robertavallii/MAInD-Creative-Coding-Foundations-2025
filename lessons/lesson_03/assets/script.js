const addButton = document.getElementById('add-btn');
const listButton = document.getElementById('list-view-btn')
const cardButton = document.getElementById('card-view-btn')


const taskInput = document.getElementById('task-input');


listButton.addEventListener('click')
        console.log('List button pressed!')
addButton.addEventListener('click', () => {
    console.log("Add button pressed!!!!!!");

    const inputValue = taskInput.value;
    
    const listElement = document.createElement('li');

    listElement.innerHTML = inputValue;

    document.getElementById('task-list-container').appendChild(listElement);

});