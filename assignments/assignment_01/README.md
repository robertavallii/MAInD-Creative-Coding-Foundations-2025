# Assignment 01

## Brief

Starting from the concept of a pinboard, implement a web page that:

- is responsive (properly layout for smartphone, tablet, and desktop)
- allows the user to add and remove elements
- allows the user to customize elements (i.e. colors, size)
- allows the switch between two views (at least)

## Screenshots

![Card view](DOCS/my_watchlist_card_view.png)
![List view](my_watchlist_list_view.png)


## Short project description 

This project is a responsive web pinboard for movies and series. Users can create new pins through a modal window, upload an image, add a title and description, and personalize colors. Pins can be viewed in card or list mode, removed anytime, and the layout adapts to desktop, tablet and mobile.

## Function List

### `openModal()`
- **Arguments:** none  
- **Description:** Opens the “Create Pin” modal and shows the overlay by removing the `hidden` class from both elements.  
- **Returns:** nothing (`void`)

### `closeModal()`
- **Arguments:** none  
- **Description:** Closes the modal and the overlay by adding the `hidden` class and resets the editing state (`editingPin = null`).  
- **Returns:** nothing (`void`)

### `openColorPicker()`
- **Arguments:** none  
- **Description:** Triggers the hidden color input so the user can select a pin color by clicking on the label or preview.  
- **Returns:** nothing (`void`)

### `resetModalFields()`
- **Arguments:** none  
- **Description:** Clears all modal fields (title, description, image), removes the image preview, resets the color to the default `#f8d448`, and clears the editing state.  
- **Returns:** nothing (`void`)

---

### Event Listeners and Interaction Logic

User interactions such as opening and closing the modal, uploading an image, picking a color, adding or editing pins, removing items from the board, and switching between list and card views are handled through **event listeners** attached to the corresponding DOM elements. Each listener updates the interface dynamically without reloading the page, ensuring a smooth and responsive user experience.
