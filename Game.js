const math = require('mathjs');


const OPERATIONS = [
	'+5',
	'-5',
	'*2',
	'/2',
	'^2',
	'!',
	'*0',
	'*-1',
	'e',
	'+e',
	'+i'
];

const FUNCTIONS = [
    'sqrt(x)', 
    'ln(x)', 
    'log10(x)', 
    'Re(z)', 
    'Im(z)', 
    'abs(x)',
    'exp(x)',
    'sin(x)',
    'cos(x)',
    'tan(x)',
    'asin(x)',
    'acos(x)',
    'atan(x)',
    'sinh(x)',
    'cosh(x)',
    'tanh(x)',
    'asinh(x)',
    'acosh(x)',
    'atanh(x)',
    'log2(x)',
    'cbrt(x)',
    'sign(x)',
    'ceil(x)',
    'floor(x)',
    'round(x)'
];



const ALLCARDS = OPERATIONS.concat(FUNCTIONS);



class Room {
	constructor(_id){
		this.id = _id;
		this.deck = new Deck();

		this.players = [];
		this.playerTurn = 0;
	}
}

class Card {
	constructor(value){
		this.value = value;
	}
	get cardType(){
		if (OPERATIONS.includes(this.value)){
			return 'operations';
		}else{
			return 'functions';
		}
	}
	toJSON() {
		return {
			value: this.value,
			cardType: this.cardType
		};
	}
}

class Deck {
	constructor(){
		this.cards = [];
	}

	get numberOfCards(){
		return this.cards.length;
	}

	shuffle(){
		for (let i = this.numberOfCards - 1; i >= 0; i--) {
			const newIndex = Math.floor(Math.random() * (i +1));
			const oldValue = this.cards[newIndex];
			this.cards[newIndex] = this.cards[i];
			this.cards[i] = oldValue;
		}
	}

	drawCard(){
		this.shuffle();
		const card = this.cards.pop();
		return card;
	}

	returnCards(_returnedCards){
		_returnedCards.forEach(card => {
			this.cards.push(new Card(card.value));
		});
	}

	freshDeck(){
		const newDeck = [];
		for (let i = 0; i < 4; i++){
			for (let j = 0; j < OPERATIONS.length; j++) {
				newDeck.push(new Card(OPERATIONS[j]));
			}
		}
		for (let i = 0; i < FUNCTIONS.length; i++) {
			newDeck.push(new Card(FUNCTIONS[i]));
		}
		this.cards = newDeck;
	}
}

function countOccurrences(array) {
	const counts = {};
	array.forEach(item => {
		counts[item] = (counts[item] || 0) + 1;
	});
	return counts;
}

function removeCards(a1, a2) {
	const a1Counts = countOccurrences(a1);
	const result = [];

	a2.forEach(item => {
		if (a1Counts[item]) {
			a1Counts[item] -= 1;
			if (a1Counts[item] <= 0) {
				delete a1Counts[item];
			}
		} else {
			result.push(item);
		}
	});

	return result;
}


function areAllElementsPresent(a1, a2) {
	const a1Counts = countOccurrences(a1);
	const a2Counts = countOccurrences(a2);

	for (const element in a1Counts) {
		if (!a2Counts[element] || a2Counts[element] < a1Counts[element]) {
			return false;
		}
	}
	return true;
}

function stringArrayToCards(stringArray){
	let cardArray = [];
	stringArray.forEach(value => {
		cardArray.push(new Card(value));
	});
	return cardArray;
}

class Player {
	constructor(ws, id, name){
		this.ws = ws;
		this.id = id;
		this.name = name;
		this.value = '100';
		this.timeLeft = 300;
		this.ready = true;
		this.cards = [];
	}

	drawCards(deck, n){
		for (var i = 0; i < n; i++) {
			this.cards.push(deck.drawCard());
		}
	}

	playCards(deck, _fusionCards, _attackCards, _defenseCards){
		const _playedCardsStringArray = _fusionCards.concat(_attackCards, _defenseCards);
		const _playedCards = stringArrayToCards(_playedCardsStringArray);


		if(areAllElementsPresent(_playedCards, this.cards)){
			deck.returnCards(_playedCards);
			deck.shuffle();
			this.cards = removeCards(_playedCards, this.cards);
			return true;
		}
		return false;
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			value: this.value,
			timeLeft: this.timeLeft,
			cards: this.cards
		};
	}
}


function handleSpecial(value, special){
	const functionMap = {
		'sqrt(x)': (value) => math.sqrt(math.evaluate(value)),
		'ln(x)': (value) => math.log(math.evaluate(value)),
		'log10(x)': (value) => math.log10(math.evaluate(value)),
		'Re(z)': (value) => math.re(math.evaluate(value)),
		'Im(z)': (value) => math.im(math.evaluate(value)),
		'abs(x)': (value) => math.abs(math.evaluate(value)),
		'exp(x)': (value) => math.exp(math.evaluate(value)),
		'sin(x)': (value) => math.sin(math.evaluate(value)),
		'cos(x)': (value) => math.cos(math.evaluate(value)),
		'tan(x)': (value) => math.tan(math.evaluate(value)),
		'asin(x)': (value) => math.asin(math.evaluate(value)),
		'acos(x)': (value) => math.acos(math.evaluate(value)),
		'atan(x)': (value) => math.atan(math.evaluate(value)),
		'sinh(x)': (value) => math.sinh(math.evaluate(value)),
		'cosh(x)': (value) => math.cosh(math.evaluate(value)),
		'tanh(x)': (value) => math.tanh(math.evaluate(value)),
		'asinh(x)': (value) => math.asinh(math.evaluate(value)),
		'acosh(x)': (value) => math.acosh(math.evaluate(value)),
		'atanh(x)': (value) => math.atanh(math.evaluate(value)),
		'log2(x)': (value) => math.log2(math.evaluate(value)),
		'cbrt(x)': (value) => math.cbrt(math.evaluate(value)),
		'sign(x)': (value) => math.sign(math.evaluate(value)),
		'ceil(x)': (value) => math.ceil(math.evaluate(value)),
		'floor(x)': (value) => math.floor(math.evaluate(value)),
		'round(x)': (value) => math.round(math.evaluate(value))
	};
	try{
		const func = functionMap[special];
        if (func) {
            return func(value);
        } else {
            console.log('Unknown function: ' + special);
            return value;
        }
	}catch(e){
		console.log('Returning value:'+value);
		return value;
	}
}


function evaluateCards(value, cards){
	let result;
	if(cards.length === 1 && FUNCTIONS.includes(cards[0])){
		result = math.format(handleSpecial(value, cards[0]));
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


module.exports = {Room, Deck, Card, Player, evaluateCards};
