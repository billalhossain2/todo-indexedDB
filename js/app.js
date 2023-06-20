//Check if indexedDb is supported by current browser or not
(function(){
  if(!indexedDB){
    console.log('Your browser does not support indexedDB!');
    return;
  }
})

//create a new database for todo app
const request = indexedDB.open('todosDB', 1);
const getElementById = id => document.getElementById(id);
const addBtn = getElementById('add-btn');
let editableTodo = null;
let toggableTodo = null;

//Toggle background color
getElementById('mode').addEventListener('click', function(){
  if(!getElementById('todo').classList.contains('mode-toggle')){
    getElementById('todo').classList.add('mode-toggle');
    getElementById('mode').innerHTML = "<i class='fa-solid fa-toggle-on'></i>";
  }else{
    getElementById('todo').classList.remove('mode-toggle')
    getElementById('mode').innerHTML = "<i class='fa-solid fa-toggle-off'></i>";
  }
})
//==============*****Database Operation*******================

const insertTodo = (db, todo) => {
  //create a transaction
  const txn = db.transaction(['Todos'], 'readwrite');
  //get the store
  const store = txn.objectStore('Todos');

  //run query 
  const query = store.add(todo);

  //handle success case
  query.addEventListener('success', function(event){
    console.log('New todo is successfully created')
  })

   //handle error case
   query.addEventListener('error', function(event){
    console.error('New todo could not be created! ', event.target.error)
   })

   //close db transaction
}

const getAllTodos = db => {
  //create a transaction
  const txn = db.transaction('Todos', 'readonly');

  //get the store
  const store = txn.objectStore('Todos');
  
  //handle success case
  const todosArr = []
  store.openCursor().addEventListener('success', function(event){
    const cursor = event.target.result;
    if(cursor){
      todosArr.push(cursor.value)
      cursor.continue();
    }else{
      displayTodos(todosArr)
    }
  })

   //handle error case
   store.openCursor().addEventListener('error', function(event){
    console.error('All todos could not be found! ', event.target.errorCode)
   })
}

const deleteTodo = (db, id) => {
  //create a transaction
  const txn = db.transaction('Todos', 'readwrite');

  //get the store
  const store = txn.objectStore('Todos');

  //run query 
  const query = store.delete(id);

  //handle success case
  query.addEventListener('success', function(event){
    console.log('successfully deleted the todo')
  })

   //handle error case
   query.addEventListener('error', function(event){
    console.error('Todo could not be deleted! ', event.target.errorCode)
   })

   //close db transaction
}

const updateTodo = (db, todo) => {
  //create a transaction
  const txn = db.transaction('Todos', 'readwrite');

  //get the store
  const store = txn.objectStore('Todos');

  //run query 
  const query = store.put(todo);

  //handle success case
  query.addEventListener('success', function(event){
    console.log('New todo is successfully updated')
  })

   //handle error case
   query.addEventListener('error', function(event){
    console.error('New todo could not be updated! ', event.target.errorCode)
   })

   //close db transaction
}

const getTodoById = (db, id, toggle) => {
  //create a transaction
  const txn = db.transaction('Todos', 'readonly');

  //get the store
  const store = txn.objectStore('Todos');

  //run query 
  const query = store.get(id);

  //handle success case
  query.addEventListener('success', function(event){
    const foundTodoById = event.target.result;
    if(toggle){
      editableTodo = null;
    }else{
      editableTodo = foundTodoById;
    }
    
    toggableTodo = foundTodoById;
  })

   //handle error case
   query.addEventListener('error', function(event){
    console.error('No todo found with this id! ', foundTodoById)
   })

   //close db transaction
}

const clearAllBtn = getElementById('clear-all-btn');

let db;
//Reusable function for getElementById

const removeTodo = id => {
  const isDelete = confirm('Are you sure to delete this todo ?');
  if(isDelete){
    deleteTodo(db, id)
    getAllTodos(db)
  }
}

const editTodo = id => {
  addBtn.innerHTML = '<img width="40px" height="40px" src="img/update-icon.png" alt="update icon"/>'
 getTodoById(db, id);
 setTimeout(()=> getElementById('input-field').value = editableTodo.title, 10)
}

const toggleTodo = id => {
  getTodoById(db, id, "toggle");
  setTimeout(()=>updateTodo(db, {...toggableTodo, completed: !toggableTodo.completed}), 5)
  setTimeout(()=>getAllTodos(db), 10);
}

const tableBody = getElementById("table-body");
const filterTodos = getElementById('filter');

//Sort todos by alphabets order acendinng and decending
const sortTodos = getElementById('sort');
let sortStatus = null;
sortTodos.addEventListener('change', function(ev){
  sortStatus = ev.target.value;
  getAllTodos(db);
})


//Filter todos by title
let filterStatus = null;
filterTodos.addEventListener('change', function(ev){
  filterStatus = ev.target.value;
  getAllTodos(db);
})

const displayTodos = todos => {
  tableBody.innerHTML = "";
  todos.length === 0 ? tableBody.innerHTML = '<h3>No Todos Found!</h3>' : '';
  todos.length >= 5 ? clearAllBtn.style.display = '' : clearAllBtn.style.display = 'none';

  todos.sort((a, b) => {
    if(sortStatus === "Sort A - Z"){
      return a.title.localeCompare(b.title);
    }else if(sortStatus === "Sort Z - A"){
      return  b.title.localeCompare(a.title);
    }
  }).filter(todo => {
    switch (filterStatus) {
      case "Completed":{
        return todo.completed;
      }

      case "Incompleted":{
        return !todo.completed
      }

      default:{
        return todo;
      }
    }
  }).forEach(todo => {
    tableBody.innerHTML += `
  <tr class='todo-row'>
  <td class="box-title">
      <div id="complete-btn" class="toggle-box btn" onclick = "toggleTodo('${todo.id}')">${todo.completed ? '<i class="fa-regular fa-square-check"></i>' : '<i class="fa-regular fa-square"></i>'}</div>
      <span style = ${todo.completed ? "text-decoration:line-through" : "" } class="todo-title">${todo.title}</span>
  </td>
  <td>
  <span onclick="removeTodo('${todo.id}')" class="delete-btn btn"><i class="fa-regular fa-trash-can"></i></span>
  <span onclick="editTodo('${todo.id}')" class="edit-btn btn"><i class="fa-regular fa-pen-to-square"></i></span>
  </td>
</tr>
  `;
  })
}

//Implement search feature
const searchField = getElementById("search-field");
searchField.addEventListener('keyup', function(ev){
  ev.preventDefault();
  const todosTitle = document.querySelectorAll("tr span");
  todosTitle.forEach(title => {
    if(title.innerText.toLowerCase().indexOf(ev.target.value.toLowerCase()) > -1){
      title.parentElement.parentElement.style.display = '';
    }else{
      title.parentElement.parentElement.style.display = 'none';
    }
  })
})

//Generate very unique id for each todo object
const getUid = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

//handle success case
request.onsuccess = function(event){
  db = event.target.result;
  getAllTodos(db);

    //Add button event listener
    addBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const inputField = getElementById('input-field');
      const todoTitle = inputField.value;
      if(!todoTitle) return alert("Field should not be empty!")

      if(editableTodo){
        updateTodo(db, {...editableTodo, title: todoTitle});
        editableTodo = null;
        addBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i>';
        inputField.value = "";
      }else{
        const todo = {
          id: getUid(),
          title: todoTitle,
          completed: false
        }
        insertTodo(db, todo);
        inputField.value = "";
      }
      getAllTodos(db);
    })

    //Clear the object store
    clearAllBtn.addEventListener('click', function(){
      const isClearAll = confirm("Are you really want to delete all todos ?");
      if(!isClearAll) return;
      const transaction = db.transaction('Todos', 'readwrite');
      const store = transaction.objectStore('Todos');
      store.clear();
      getAllTodos(db);
    })
}

//Cancel Update=================================================================************************* 
getElementById("cancel-btn").addEventListener('click', function(ev){
  ev.preventDefault();
  getElementById('input-field').value = "";
  editableTodo = null;
  addBtn.innerHTML = '<i class="fa-solid fa-circle-plus"></i>';
})

//handle error case
request.addEventListener('error', function(event){
  console.error("Something went wrong! ", event.target.errorCode);
})

//triggers after successfully created the db
request.onupgradeneeded = function(event){
  console.log('onupgraded called!')
  const db = event.target.result;

  //create a new object store
  const store = db.createObjectStore('Todos', {keyPath: 'id', autoIncrement: true});

  //create index
  const index = store.createIndex('id', 'id', {unique: true})
}