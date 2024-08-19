const http = require('http');
const express = require("express");
const ejs = require("ejs");
const WebSocket = require('ws');

const {Room, Deck, Card, Player, evaluateCards} = require("./Game.js");

const app = express();

let port = process.env.PORT;
if (port == null || port == "") {
	port = 3000;
}



app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/img', express.static(__dirname + 'public/img'));


app.set('views', './views');
app.set('view engine', 'ejs');


app.get('/', (req, res)=>{
	res.render('index.ejs');
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


const rooms = {};



function generateRoomId() {
	let roomId;
	do {
		roomId = Math.random().toString(36).substr(2, 9);
	} while (rooms[roomId]);

	return roomId;
}

function decreasePlayerTime(roomId, intervalId) {
	const room = rooms[roomId];
	const player = room.players.find(p => p.id === room.playerTurn);
	const enemy = room.players.find(p => p.id !== room.playerTurn);

	if (player.timeLeft > 0) {
		player.timeLeft -= 1;
		if (player.timeLeft <= 0){
			clearInterval(intervalId);
			player.ws.send(JSON.stringify({ type: 'lostGame'}));
			enemy.ws.send(JSON.stringify({ type: 'wonGame'}));
			player.ready = false;
			enemy.ready = false;
		}else if (!player.ready || !enemy.ready){
			clearInterval(intervalId);
		}else{
			rooms[roomId].players.forEach(p => {
				p.ws.send(JSON.stringify({
					type: 'updateTime',
					players: rooms[roomId].players,
					turn: rooms[roomId].playerTurn
				}));
			});
		}
	}
}

function startTimer(roomId) {
	const intervalId = setInterval(() => {
		decreasePlayerTime(roomId, intervalId);
	}, 1000);  // 1s
}

wss.on('connection', (ws) => {
	ws.on('message', (message) => {
		const data = JSON.parse(message);
		if (data.type === 'createRoom') {
			const roomId = generateRoomId();
			const newRoom = new Room(roomId);
			const newPlayer = new Player(ws, 0, data.name);
			newRoom.players.push(newPlayer);
			rooms[roomId] = newRoom;
			ws.roomId = roomId;

			ws.send(JSON.stringify({ type: 'roomCreated', roomId , playerId: 0}));
		}
		if (data.type === 'joinRoom') {
			const roomId = data.roomId;
			if (rooms[roomId] && rooms[roomId].players.length < 2) {
				const newPlayer = new Player(ws, 1, data.name);
				rooms[roomId].players.push(newPlayer);
				ws.roomId = roomId;

				ws.send(JSON.stringify({ type: 'registered', roomId , playerId: 1}));

				// Game Start
				rooms[roomId].deck.freshDeck();
				rooms[roomId].deck.shuffle();
				startTimer(roomId);

				// Notify both players
				rooms[roomId].players.forEach(player => {
					player.drawCards(rooms[roomId].deck, 5);
					player.ws.send(JSON.stringify({
						type: 'startGame',
						players: rooms[roomId].players,
						turn: rooms[roomId].playerTurn
					}));
				});
			} else {
				ws.send(JSON.stringify({ type: 'error', message: 'Room is full or doesn’t exist' }));
			}
		}
		if (data.type === 'ready') {
			const roomId = ws.roomId;
			if (rooms[roomId]) {
				const player = rooms[roomId].players.find(p => p.id === data.id);
				const enemy = rooms[roomId].players.find(p => p.id !== data.id);
				player.ready = true;
				
				if (enemy.ready){
					rooms[roomId].deck.freshDeck();
					rooms[roomId].deck.shuffle();
					rooms[roomId].playerTurn = 0;
					
					rooms[roomId].players.forEach(p => {
						p.value = '100';
						p.timeLeft = 300;
						p.cards = [];
					});
					rooms[roomId].players.forEach(p => {
						p.ws.send(JSON.stringify({
							type: 'startGame',
							players: rooms[roomId].players,
							turn: rooms[roomId].playerTurn
						}));
					});
					startTimer(roomId);

				}


			}
		}
		if (data.type === 'playCards') {
			const roomId = ws.roomId;
			if (rooms[roomId]) {
				const player = rooms[roomId].players.find(p => p.id === data.id);
				const enemy = rooms[roomId].players.find(p => p.id !== data.id);

				// Maybe also check for ws
				if(player.id !== rooms[roomId].playerTurn){
					return;
				}

				if(player.playCards(rooms[roomId].deck, data.fusion, data.attack, data.defense)){
					const tempPV =  evaluateCards(player.value, data.defense);
					const tempEV =  evaluateCards(enemy.value, data.attack);
					player.value =  evaluateCards(tempPV, data.fusion);
					enemy.value =  evaluateCards(tempEV, data.fusion);

					// Check for game end
					if(player.value <= 0){
						player.ws.send(JSON.stringify({ type: 'lostGame'}));
						enemy.ws.send(JSON.stringify({ type: 'wonGame'}));
						player.ready = false;
						enemy.ready = false;

					}else{

						const numberCardsPlayed = data.fusion.length + data.attack.length + data.defense.length;

						player.drawCards(rooms[roomId].deck, numberCardsPlayed);


						rooms[roomId].playerTurn = rooms[roomId].playerTurn == 0 ? 1 : 0;
						


						// Broadcast the played card to the other player
						rooms[roomId].players.forEach(player => {
							player.ws.send(JSON.stringify({
								type: 'turnFinished',
								players: rooms[roomId].players,
								turn: rooms[roomId].playerTurn
							}));
						});
					}
				}
			}
		}

	});

	ws.on('close', () => {
		if (ws.roomId && rooms[ws.roomId]) {
			rooms[ws.roomId].players = rooms[ws.roomId].players.filter(player => player !== ws);
			if (rooms[ws.roomId].players.length === 0) {
				delete rooms[ws.roomId];
			}
		}
	});
});



server.listen(port, ()=>{
	console.log("Listening on port "+ port);
});


