//TODO: Keyboard movement support
//TODO: Sound effects
//TODO: Moving enemies
//TODO: Full-color sprites
//TODO: Scoreboard
//TODO: Improve the game's overall presentation
//TODO: Enemy density (aka 'heavy','light')
//TODO: More houses
//TODO: Potions?

$(document).ready(function() {
	var boardWidth = 10;
	var boardHeight = 10;
	var pieceWidth = 50;
	var pieceHeight = 50;
	var pixelWidth = 1 + (boardWidth * pieceWidth);
	var pixelHeight = 1 + (boardHeight * pieceHeight);
	var eightDirections = false;

	var gameInProgress;

	var ele = document.getElementById('canvas');
	var ctx = ele.getContext("2d");

	var heroPiece;
	var heroColor;
	var goalPiece;
	var goalColor = "rgba(212,175,55,1)";
	var enemyPieces;
	var enemyColor;
	var numEnemies = 7;

	var heroHouse = 'stark';
	var heroAttack;	//TODO: rename attack to defense...?
	var heroMotto = document.getElementById('houseMotto');
	var moveCount;
	var moveCountElem = document.getElementById('moveCount');
	var hpCount;
	var hpCountElem = document.getElementById('hpCount');

	if ($('#gameSpace').css('display') == 'none')
	{
		$('#startCustomGame').click(function(e) {
			e.preventDefault();

			boardWidth = $('#customX').val();
			boardHeight = $('#customY').val();
			pixelWidth = 1 + (boardWidth * pieceWidth);
			pixelHeight = 1 + (boardHeight * pieceHeight);
			heroHouse = $('#customHouse').val();
			numEnemies = $('#customEnemies').val();
			eightDirections = ($('#customMovement').val() == '8') ? true : false;

			initGame(heroHouse);

			$('#configSpace').slideUp('slow', function() {
				$('#gameSpace').slideDown('slow');
			});
		});

		$('#resetGameLink').click(function(e) {
			e.preventDefault();

			$('#gameSpace').slideUp('slow', function() {
				$('#resetGameBox').hide();
				$('#configSpace').slideDown('slow');
			})
		});
	}
	else
	{
		initGame(heroHouse);
	}

	function Cell(row, column)
	{
		this.row = row;
		this.column = column;
	}

	function getCursorPosition(e)
	{
		var x;
		var y;
		if (e.pageX != undefined && e.pageY != undefined)
		{
			x = e.pageX;
			y = e.pageY;
		}
		else
		{
			x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		x -= ele.offsetLeft;
		y -= ele.offsetTop;
		x = Math.min(x, boardWidth * pieceWidth);
		y = Math.min(y, boardHeight * pieceHeight);
		var cell = new Cell(Math.floor(y/pieceHeight), Math.floor(x/pieceWidth));
		return cell;
	}

	// End the game
	function endGame(winner)
	{
		gameInProgress = false;

		if (winner === true)
		{
			$('#gameMessage').html('You Win!!');
		}
		else
		{
			$('#gameMessage').html('You Die!!');
		}
		$('#resetGameBox').slideDown();
	}

	function movePiece(target)
	{
		// Are we stepping on the goal piece - aka the Throne?
		if (target.column == goalPiece.column && target.row == goalPiece.row)
		{
			endGame(true);
		}
		// Are we stepping on a space currently inhabited by an enemy?
		else for (var i = 0; i < numEnemies; i++)
		{
			if (target.column == enemyPieces[i].column && target.row == enemyPieces[i].row)
			{
				// Combat! ... Or whatever.
				if ((hpCount - heroAttack) > 0)
				{
					// We survived...
					setHpCount(hpCount - heroAttack);
					enemyPieces.splice(i,1);
					numEnemies--;
				}
				else
				{
					// We died!
					setHpCount(0);
					heroPiece = new Cell(-1,-1);

					endGame(false);
				}
				break;
			}
		}

		heroPiece = target;
		setMoveCount();
		drawBoard();
	}

	function isAdjacent(subject, target, eightPoints)
	{
		var xAdj;
		var yAdj;
		var xSame;
		var ySame;

		if (target.row == subject.row + 1 || target.row == subject.row - 1)
			xAdj = true;
		else if (target.row == subject.row)
			xSame = true;

		if (target.column == subject.column + 1 || target.column == subject.column - 1)
			yAdj = true;
		else if (target.column == subject.column)
			ySame = true;

		// If eight direction movement is enabled
		if (eightPoints == true)
		{
			if (xAdj == true && yAdj == true)
				return true;
		}
		// Else, four direction movement
		if ((xAdj == true && ySame == true) || (yAdj == true && xSame == true))
			return true;
		else
			return false;
	}

	function onClick(e)
	{
		if (gameInProgress === false)
			return;

		var cell = getCursorPosition(e);

		//console.log(cell);//debug

		if (isAdjacent(heroPiece, cell, eightDirections))
		{
			movePiece(cell);
		}
		// Not sure if this should be kept or not... if moving enemies are implemented, this might be good for "skipping" a turn.
		else if (cell.column == heroPiece.column && cell.row == heroPiece.row)
		{
			alert("This is you!");//debug
			return;
		}
	}

	function drawBoard()
	{
		// Clear the canvas
		ctx.clearRect(0, 0, pixelWidth, pixelHeight);

		ctx.beginPath();

		/* vertical lines */
		for (var x = 0; x <= pixelWidth; x+= pieceWidth)
		{
			ctx.moveTo(0.5 + x, 0);
			ctx.lineTo(0.5 + x, pixelHeight);
		}

		/* horizontal lines */
		for (var y = 0; y <= pixelHeight; y += pieceHeight)
		{
			ctx.moveTo(0, 0.5 + y);
			ctx.lineTo(pixelWidth, 0.5 + y);
		}

		/* draw it! */
		ctx.strokeStyle = '#ccc';
		ctx.stroke();

		// Draw pieces
		drawPiece(heroPiece, heroColor);
		drawPiece(goalPiece, goalColor);
		for (var i = 0; i < numEnemies; i++)
		{
			drawPiece(enemyPieces[i], enemyColor);
		}
	}

	function drawPiece(p, color)
	{
		var column = p.column;
		var row = p.row;
		var x = (column * pieceHeight) + (pieceHeight / 2);
		var y = (row * pieceWidth) + (pieceWidth / 2);
		var radius = (pieceWidth / 2) - (pieceWidth / 10);
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI*2, false);
		ctx.closePath();
			// Hollow circle...
			//ctx.strokeStyle = color;
			//ctx.stroke();
		// Filled circle...
		ctx.fillStyle = color;
		ctx.fill();
	}

	function checkCell(y, x)
	{
		if (heroPiece.column == x && heroPiece.row == y)
			return false;
		if (goalPiece.column == x && goalPiece.row == y)
			return false;
		for (var i = 0; i < enemyPieces.length; i++)
			if (enemyPieces[i].column == x && enemyPieces[i].row == y)
				return false;
		return true;
	}

	function newGame()
	{
		gameInProgress = true;

		// Game pieces...
		//heroPiece = new Cell(0, 0);
		heroPiece = new Cell(Math.floor(Math.random()*boardWidth), Math.floor(Math.random()*boardHeight));
		//goalPiece = new Cell(boardHeight - 1, boardWidth - 1);
		goalPiece = new Cell(Math.floor(Math.random()*boardWidth), Math.floor(Math.random()*boardHeight));
		enemyPieces = new Array();
		for (var i = 0; i < numEnemies; i++)
		{
			isClear = false;
			var newX;
			var newY;
			while (isClear == false)
			{
				newX = Math.floor(Math.random()*boardWidth);
				newY = Math.floor(Math.random()*boardHeight);
				if (checkCell(newY, newX) == true)
					isClear = true;
			}
			enemyPieces.push(new Cell(newY, newX));
		}

		drawBoard();
	}

	function pickCharacter(selection)
	{
		var hp;
		var atk;
		var motto;

		// TODO: Add more houses here
		if (selection == 'stark')
		{
			hp = 100;
			atk = 20;
			motto = "Winter is coming.";
			heroColor = "rgba(200,200,200,1)";
			enemyColor = "rgba(172,20,19,1)";
		}
		else if (selection == 'lannister')
		{
			hp = 50;
			atk = 10;
			motto = "A Lannister always pays his debts.";
			heroColor = "rgba(172,20,19,1)";
			enemyColor = "rgba(200,200,200,1)";
		}

		setHpCount(hp);
		heroAttack = atk;
		heroMotto.innerHTML = motto;
	}

	function setHpCount(value)
	{
		if (value != undefined)
		{
			hpCount = value;
		}
		// TODO: Font color fade animation code goes here...
		hpCountElem.innerHTML = hpCount;
	}

	function setMoveCount(value)
	{
		if (value == undefined)
			moveCount++;
		else
			moveCount = value;

		moveCountElem.innerHTML = moveCount;
	}

	function initGame(house)
	{
		ele.width = pixelWidth;
		ele.height = pixelHeight;

		setMoveCount(0);
		pickCharacter(house);

		ele.addEventListener("click",onClick,false);

		newGame();
	}
});