//const ws = new WebSocket('ws://localhost:8080');
const ws = new WebSocket('ws://nerdicard.onrender.com:8080');

const playareas = document.querySelectorAll('.cardslot');
const menuPopup = document.querySelector('#blackpopup');
const startMenu = document.querySelector('#startmenu');
const createMenu = document.querySelector('#createroom');
const joinMenu = document.querySelector('#joinroom');
const roomIdMenu = document.querySelector('#roomdisplay');
const endGameMenu = document.querySelector('#endgame');

const playerName = document.querySelector('#playername');
const enemyName = document.querySelector('#enemyname');
const playerValue = document.querySelector('#playervalue');
const enemyValue = document.querySelector('#enemyvalue');

const cardHand = document.querySelector('#cardhand');
const fusionArea = document.querySelector('#fusearea');
const attackArea = document.querySelector('#attackarea');
const defenceArea = document.querySelector('#defencearea');
const finishButton = document.querySelector('#finishturn');

let playerId;
let cardCount = 1;


function openStartMenu(){
	endGameMenu.style.display = 'none';
	menuPopup.style.display = 'flex';
	startMenu.style.display = 'block';
}
function openCreateRoomMenu(){
	startMenu.style.display = 'none';
	roomIdMenu.style.display = 'none';
	createMenu.style.display = 'block';
}
function openJoinRoomMenu(){
	startMenu.style.display = 'none';
	roomIdMenu.style.display = 'none';
	joinMenu.style.display = 'block';
}
function openStartMenu(){
	joinMenu.style.display = 'none';
	createMenu.style.display = 'none';
	roomIdMenu.style.display = 'none';
	startMenu.style.display = 'block';
	endGameMenu.style.display = 'none';
}
function openRoomCreatedMenu(){
	startMenu.style.display = 'none';
	joinMenu.style.display = 'none';
	createMenu.style.display = 'none';
	roomIdMenu.style.display = 'block';
}
function closeMenu(){
	menuPopup.style.display = 'none';
	startMenu.style.display = 'none';
	joinMenu.style.display = 'none';
	createMenu.style.display = 'none';
	roomIdMenu.style.display = 'none';
}
function openEndGameMenu(){
	endGameMenu.querySelector('#replayButton').replace('inactive', 'active');;
	menuPopup.style.display = 'flex';
	endGameMenu.style.display = 'block';
}
function copyText() {
	let copyText = document.getElementById("nonEditableTextBox");
	copyText.select();
	copyText.setSelectionRange(0, 99999);  // for mobile
	document.execCommand("copy");
}


function createRoom(){
	let playerName = document.querySelector("#nameinputcreate").value;
	ws.send(JSON.stringify({ type: 'createRoom',  name: playerName }));
}
function joinRoom(){
	let playerName = document.querySelector("#nameinputjoin").value;
	let roomId = document.querySelector("#roominput").value;
	ws.send(JSON.stringify({ type: 'joinRoom',  name: playerName, roomId: roomId }));
}
function replayGame(){
	ws.send(JSON.stringify({ type: 'ready', id: playerId }));
	endGameMenu.querySelector('#endtext').innerText = 'Waiting for opponent...';
	endGameMenu.querySelector('#replayButton').replace('active', 'inactive');;
}

ws.addEventListener('open', (event) => {
	console.log('Connected to WebSocket server');
});

ws.addEventListener('message', (event) => {
	const data = JSON.parse(event.data);

	if (data.type === 'roomCreated') {
		document.querySelector('#roomIdDisplay').value = data.roomId;
		playerId = data.playerId;
		openRoomCreatedMenu();
	}
	if (data.type === 'registered') {
		playerId = data.playerId;
	}
	if (data.type === 'wonGame') {
		openEndGameMenu();
		endGameMenu.querySelector('#endtext').innerText = 'You won!';
	}
	if (data.type === 'lostGame') {
		openEndGameMenu();
		endGameMenu.querySelector('#endtext').innerText = 'You lost...';
	}
	if (data.type === 'updateTime') {
		const playerInfo = data.players.find(p => p.id === playerId);
		const enemyInfo = data.players.find(p => p.id !== playerId);

		if(playerInfo.id === data.turn){
			playerName.innerText = playerInfo.name +' ⌛'+ playerInfo.timeLeft + ' ♟️';
			enemyName.innerText = enemyInfo.name +' ⌛'+ enemyInfo.timeLeft ;
			finishButton.classList.replace('inactive', 'active');
		}else{
			playerName.innerText = playerInfo.name +' ⌛'+ playerInfo.timeLeft ;
			enemyName.innerText = enemyInfo.name +' ⌛'+ enemyInfo.timeLeft  + ' ♟️';
			finishButton.classList.replace('active', 'inactive');
		}
	}
	if (data.type === 'startGame' || data.type === 'turnFinished') {
		closeMenu();
		const playerInfo = data.players.find(p => p.id === playerId);
		const enemyInfo = data.players.find(p => p.id !== playerId);
		if(playerInfo.id === data.turn){
			playerName.innerText = playerInfo.name +' '+ playerInfo.timeLeft + ' |W|';
			enemyName.innerText = enemyInfo.name +' '+ enemyInfo.timeLeft ;
			finishButton.classList.replace('inactive', 'active');
		}else{
			playerName.innerText = playerInfo.name +' '+ playerInfo.timeLeft ;
			enemyName.innerText = enemyInfo.name +' '+ enemyInfo.timeLeft  + ' |W|';
			finishButton.classList.replace('active', 'inactive');
		}
		playerValue.innerText = playerInfo.value;
		enemyValue.innerText = enemyInfo.value;

		cardHand.innerHTML = '';
		fusionArea.innerHTML = '';
		attackArea.innerHTML = '';
		defenceArea.innerHTML = '';

		playerInfo.cards.forEach(card => {
			const cardDiv = document.createElement('div');
			cardDiv.classList.add('card');
			if (card.cardType === 'functions') {
				cardDiv.classList.add('special');
			}
			cardDiv.textContent = card.value;
			cardDiv.id = 'card'+cardCount;
			cardCount++;
			cardDiv.draggable = true;
			cardDiv.addEventListener('dragstart', (event) => {
				event.dataTransfer.setData("card", event.target.id);

				const dragImage = cardDiv.cloneNode(true);
				dragImage.style.position = 'absolute';
				dragImage.style.top = '-9999px';
				document.body.appendChild(dragImage);
				event.dataTransfer.setDragImage(dragImage, 75, 100);
			});

			cardHand.appendChild(cardDiv);
		})

		updateEstimation();
	}
});


ws.addEventListener('error', (event) => {
	console.error('WebSocket error:', event);
});

ws.addEventListener('close', (event) => {
	console.log('Disconnected from WebSocket server');
});











updateEstimation();


playareas.forEach(area => {
	area.addEventListener('dragover', (event) => {
		event.preventDefault();
	});

	area.addEventListener('drop', (event) => {
		event.preventDefault();

		if(event.target.classList.contains("cardslot")){
			let data = event.dataTransfer.getData("card");
			let draggedElement = document.getElementById(data);
			if (event.target.hasChildNodes()){
				if (event.target.id !== "cardhand" && (draggedElement.classList.contains("special") || event.target.firstChild.classList.contains("special"))){
					while(event.target.firstChild){
						document.querySelector('#cardhand').appendChild(event.target.firstChild);
					}
				}
			}
			event.target.appendChild(draggedElement);
			updateEstimation();
		}
	});
});

function updateEstimation(){
	const fusionCards = document.querySelectorAll('#fusearea .card');
	const attackCards = document.querySelectorAll('#attackarea .card');
	const defenceCards = document.querySelectorAll('#defencearea .card');

	const estimatedFusion = document.querySelector('#estimatedfusion');
	const estimatedAttack = document.querySelector('#estimatedattack');
	const estimatedDefence = document.querySelector('#estimateddefence');
	
	const fusionCardValues = Array.from(fusionCards).map(card => card.textContent.trim());
	const attackCardValues = Array.from(attackCards).map(card => card.textContent.trim());
	const defenceCardValues = Array.from(defenceCards).map(card => card.textContent.trim());


	let tempPV =  evaluateCards(playerValue.innerText, defenceCardValues);
	let tempEV =  evaluateCards(enemyValue.innerText, attackCardValues);
	tempPV =  evaluateCards(tempPV, fusionCardValues);
	tempEV =  evaluateCards(tempEV, fusionCardValues);
	estimatedDefence.innerText = playerValue.innerText +' → '+ tempPV;
	estimatedAttack.innerText = enemyValue.innerText +' → ' + tempEV;
	try{
		estimatedFusion.innerText = math.evaluate(tempPV+'-'+tempEV);
	}catch(e){
		estimatedFusion.innerText = "No advantage";
	}
}

function handleSpecial(value, special){
	if(special === 'log10(x)'){
		return math.log10(value);
	}else if(special === 'Re(z)'){
		return math.re(value);
	}else if(special === 'ln(x)'){
		return math.log(value);
	}else if(special === 'sqrt(x)'){
		return math.sqrt(value);
	}else if(special === 'Im(z)'){
		return math.im(value);
	}
}


function evaluateCards(value, cards){
	let result;
	const FUNCTIONS = ['sqrt(x)', 'ln(x)', 'log10(x)', 'Re(z)', 'Im(z)'];
	if(cards.length === 1 && FUNCTIONS.includes(cards[0])){
		result = handleSpecial(value, cards[0]);
	}else{
		let expression = value;
		cards.forEach(card => {
			expression += card;
		});
		try{
			result = math.format(math.evaluate(expression));
		}catch(e){
			result = value;
		}
	}
	if (result === 'undefined'){
		return 0;
	}
	return result;
}





function finishTurn(){
	const fusionCards = document.querySelectorAll('#fusearea .card');
	const attackCards = document.querySelectorAll('#attackarea .card');
	const defenceCards = document.querySelectorAll('#defencearea .card');

	const fusionCardValues = Array.from(fusionCards).map(card => card.textContent.trim());
	const attackCardValues = Array.from(attackCards).map(card => card.textContent.trim());
	const defenceCardValues = Array.from(defenceCards).map(card => card.textContent.trim());

	ws.send(JSON.stringify({
		type: 'playCards', 
		id: playerId,
		fusion: fusionCardValues,
		attack: attackCardValues,
		defense: defenceCardValues
	}));
}

