 # Nerdicard


## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [License](#license)
- [Contact](#contact)

## Overview
Nerdicard is an online game built using Node.js. Players engage in a 1v1 strategic card battle, where they play cards based on operations and functions to outsmart their opponent.

Check it at [Nerdicard](http://nerdicard.onrender.com). 
Wait 50s for cold start ;)

## Features
- Real-time multiplayer game using WebSockets.
- Custom room creation for 1v1 games.
- Turn-based system with player timers.
- Dynamic card types including operations and functions.

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Mafupa/nerdicard.git
cd nerdicard
```

2. Install dependencies:

Ensure that Node.js is installed, then run:

```bash
npm install
```

3. Change client target
To run the project locally change the first two lines of public/js/client.js to:
```js
const ws = new WebSocket('ws://localhost:3000');
//const ws = new WebSocket('wss://nerdicard.onrender.com');
```
Don't forget to put it back before commiting!

4. Run the project:

Start the server with:

```bash
npm start
```

5. Access the application:

Once the server is running, open your browser and go to:

```bash
http://localhost:3000
```


## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.


## Contact
For any questions or feedback, you can reach out to me:

GitHub: Mafupa
Discord: mafupa

