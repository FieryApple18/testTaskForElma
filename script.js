function getHtmlBacklog(){
	let htmlBacklog = '';
	tasks.forEach(function(task,i,tasks){	
		if(task.executor === null){
console.log(task.description);
			htmlBacklog += "<div id='" + task.id + "' class='backlogCell' style='position: static;' title='description: " + task.description + ", creationDate: " + task.creationDate + "' onmousedown='dragAndDrop(this,this.getBoundingClientRect().x, this.getBoundingClientRect().y)')'><a>" + task.subject + "</a></div>";
		}
	});
	document.querySelector(".contentContainer").innerHTML = htmlBacklog;
}

function getHtmlUserTasksTable(userId, tasks) {
    let cell = "";
    tasks.forEach((task) => {
        if (task.executor === userId)	cell += "<div class='tasks'>" + task.subject + "</div>";
    });
    return cell;
}

function getHtmlUserRowTable(user) {
    let htmlUserRowTable = '<tr><td id=' + user.id +  "' class='users'>" + user.firstName + '</td>';
    for (let i = 0; i < week.length; i++) {
        const currentTasks = tasks.filter((task) => week[i] >= task.planStartDate && week[i] <= task.planEndDate);	
        if (currentTasks.length)	htmlUserRowTable += "<td id='" + user.id + "_" + i +"' class='cell'>" + getHtmlUserTasksTable(user.id, currentTasks) + "</td>";
		else						htmlUserRowTable += "<td id='" + user.id + "_" + i +"' class='cell'></td>";	
    }
    return htmlUserRowTable + '</tr>';
}

function getWeekDay(num) {
    let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[num];
}

function getHtmlHeadTable() {
    let htmlHeadTable = "<tr><th></th>";
    for (let i = 0; i < week.length; i++) {
        htmlHeadTable += "<th>" + getWeekDay(i) + "<br>" + week[i] + "</th>";
    }
    return htmlHeadTable + '</tr>';
}

function getHtmlTable() {
	let table = document.createElement('table');
	table.insertAdjacentHTML('beforeEnd', getHtmlHeadTable());	
	users.forEach(function (user, i, users) {
		table.insertAdjacentHTML('beforeEnd', getHtmlUserRowTable(user));
	});
	document.querySelector('.tableContainer').appendChild(table);
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function moveCalendar(flag) {
    let date = new Date();
    if (flag === 0) {
        for (let i = 0, j = week.length; i < week.length; i++ , j++) {
            if (j === week.length) date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + j);
            week[i] = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + j));
        }
    }
    else {
        for (let i = 0, j = week.length; i < week.length; i++ , j--) {
            if (j === week.length) date = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - j);
            week[i] = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - j));
        }
    }	
    currentDate = date;
	document.querySelector('.tableContainer').lastChild.remove();
	getHtmlTable();
}

function search(){
	let input = document.getElementById('search');
	let filter = input.value.toUpperCase();
	let contentContainer = document.getElementById("contentContainer");
    let backlogCell = contentContainer.getElementsByTagName('div');
	for (let i = 0; i < backlogCell.length; i++) {
        let a = backlogCell[i].getElementsByTagName('a')[0];
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1)		backlogCell[i].style.display = "";
        else													backlogCell[i].style.display = "none";
    }
}

function clearSearch(){
	let input = document.getElementById('search');
	input.value = '';
	let contentContainer = document.getElementById("contentContainer");
    let backlogCell = contentContainer.getElementsByTagName('div');
	for (let i = 0; i < backlogCell.length; i++)	backlogCell[i].style.display = "";
}

function parseDate(stringDate){
	let parts = stringDate.split('-');
	return new Date(parts[0], parts[1] - 1, parts[2]); 
}

function getDifferenceInDays(startDate,endDate){
	return Math.floor(((endDate - startDate)/1000)/86400); // 86400 = 24 hours * 60 minutes * 60 seconds per day
}

function reloadBacklog(draggableTask,startX,startY){
	draggableTask.style.position = 'static';
	draggableTask.style.left = startX + 'px';
	draggableTask.style.top = startY + 'px';
	document.getElementById("contentContainer").appendChild(draggableTask);
}

function dragAndDrop(draggableTask,startX,startY) {
		let currentDroppable = null;
		let shiftX = event.clientX - draggableTask.getBoundingClientRect().left;
		let shiftY = event.clientY - draggableTask.getBoundingClientRect().top;

		draggableTask.style.position = 'absolute';
		draggableTask.style.zIndex = 1000;
		document.body.append(draggableTask);

		moveAt(event.pageX, event.pageY);

		function moveAt(pageX, pageY) {
			draggableTask.style.left = pageX - shiftX + 'px';
			draggableTask.style.top = pageY - shiftY + 'px';
		}

		function onMouseMove(event) {
			moveAt(event.pageX, event.pageY);

			draggableTask.hidden = true;
			let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
			draggableTask.hidden = false;

			if (!elemBelow) return;

			let droppableBelow = elemBelow.closest('.cell');
			if (currentDroppable != droppableBelow) {
				if (currentDroppable)//null если мы были не над droppable до этого события(например, над пустым пространством)
					currentDroppable.style.background = '';
				currentDroppable = droppableBelow;
				if (currentDroppable)//null если мы не над droppable сейчас, во время этого события(например, только что покинули droppable)
					currentDroppable.style.background = 'pink';
			}
		}

		document.addEventListener('mousemove', onMouseMove);

		draggableTask.onmouseup = function() {
			document.removeEventListener('mousemove', onMouseMove);
			draggableTask.onmouseup = null;
			if(currentDroppable){
				if(confirm("Хотите добавить задачу?")){
					let id = currentDroppable.id.split("_");
					const someIndex = tasks.findIndex((task) => task.id === draggableTask.id);				
					if (someIndex !== -1){					
						let days = getDifferenceInDays(parseDate(tasks[someIndex].planStartDate),parseDate(tasks[someIndex].planEndDate));
						console.log(tasks[someIndex]);console.log(days);
						let newPlanEndDate = parseDate(week[id[1]]);console.log(newPlanEndDate.getDate());
						newPlanEndDate.setDate(newPlanEndDate.getDate() + days);console.log(newPlanEndDate.getDate());
						tasks[someIndex] = { ...tasks[someIndex], executor: parseInt(id[0], 10), planStartDate: week[id[1]], planEndDate: formatDate(newPlanEndDate) };		
					}
					document.getElementById(draggableTask.id).remove();
					document.querySelector('.tableContainer').lastChild.remove();
					getHtmlTable();
					getHtmlBacklog();
				}			
				else{
					reloadBacklog(draggableTask,startX,startY);
					currentDroppable.style.background = '';					
				}
			}		
			else	reloadBacklog(draggableTask,startX,startY);
			if(document.getElementById('search').value !== '')	clearSearch();
		};
    };

let currentDate = new Date();

let week = [...new Array(7)];
for (let i = 0; i < week.length; i++)
    week[i] = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + i));

let users = [{"id":1,"username":"user1","surname":"Петров","firstName":"Иван","secondName":""},{"id":2,"username":"user2","surname":"Иванов","firstName":"Пётр","secondName":""},{"id":3,"username":"user3","surname":"Васильев","firstName":"Артём","secondName":""},{"id":4,"username":"user4","surname":"Кузнецов","firstName":"Сергей","secondName":""},{"id":5,"username":"user5","surname":"Некрасов","firstName":"Артём","secondName":""}];
let tasks = [{"id":"f27f1bde-8aef-4196-a51a-0dffb08b7acc","subject":"Анализ","description":"","creationAuthor":1,"executor":1,"creationDate":"2021-09-13","planStartDate":"2021-09-13","planEndDate":"2021-09-15","endDate":"2021-09-13","status":1,"order":1},{"id":"59411784-84ba-4fa5-9458-76eca54f3ffe","subject":"Планирование","description":"","creationAuthor":1,"executor":1,"creationDate":"2021-09-13","planStartDate":"2021-09-14","planEndDate":"2021-09-15","endDate":"2021-09-13","status":1,"order":1},{"id":"49dea4fe-e224-4c69-8229-8c52185fe3b2","subject":"Проектирование","description":"","creationAuthor":1,"executor":2,"creationDate":"2021-09-13","planStartDate":"2021-09-15","planEndDate":"2021-09-16","endDate":"2021-09-13","status":1,"order":1},{"id":"cabc6a63-2edb-4402-8ba7-8600b76ec0da","subject":"Разработка","description":"","creationAuthor":1,"executor":3,"creationDate":"2021-09-13","planStartDate":"2021-09-15","planEndDate":"2021-09-20","endDate":"2021-09-13","status":1,"order":1},{"id":"a0123fb7-6bcd-4813-9e22-9dadbf78040f","subject":"Тестирование","description":"123","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-17","planEndDate":"2021-09-20","endDate":"2021-09-13","status":1,"order":1}];
//let tasks = [{"id":"f27f1bde-8aef-4196-a51a-0dffb08b7acc","subject":"Анализ","description":"","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-13","planEndDate":"2021-09-15","endDate":"2021-09-13","status":1,"order":1},{"id":"59411784-84ba-4fa5-9458-76eca54f3ffe","subject":"Планирование","description":"","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-14","planEndDate":"2021-09-15","endDate":"2021-09-13","status":1,"order":1},{"id":"49dea4fe-e224-4c69-8229-8c52185fe3b2","subject":"Проектирование","description":"","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-15","planEndDate":"2021-09-16","endDate":"2021-09-13","status":1,"order":1},{"id":"cabc6a63-2edb-4402-8ba7-8600b76ec0da","subject":"Разработка","description":"","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-15","planEndDate":"2021-09-20","endDate":"2021-09-13","status":1,"order":1},{"id":"a0123fb7-6bcd-4813-9e22-9dadbf78040f","subject":"Тестирование","description":"123","creationAuthor":1,"executor":null,"creationDate":"2021-09-13","planStartDate":"2021-09-17","planEndDate":"2021-09-20","endDate":"2021-09-13","status":1,"order":1}];


getHtmlTable();
getHtmlBacklog();
