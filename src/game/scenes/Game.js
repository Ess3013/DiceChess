import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Game State
        this.board = []; // 8x8 array
        this.piecesGroup = this.add.group();
        this.turn = 'white'; // 'white' or 'black'
        this.diceValue = 0;
        this.movesLeft = 0;
        this.selectedPiece = null;
        this.gameState = 'ROLL'; // 'ROLL', 'MOVE', 'GAMEOVER'
        
        // Logical board setup
        this.initializeBoardData();
        
        // Create graphical objects (initially at 0,0, will be positioned by resize)
        this.graphics = this.add.graphics();
        this.createPieceSprites();
        this.createUI();

        // Input handling
        this.input.on('pointerdown', this.handleInput, this);
        
        // Handle window resize
        this.scale.on('resize', this.handleResize, this);
        
        // Initial layout
        this.handleResize({ width: this.scale.width, height: this.scale.height });
    }

    initializeBoardData() {
        // Initialize logical board array
        this.BOARD_SIZE = 8;
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            this.board[y] = [];
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                this.board[y][x] = null;
            }
        }
    }

    createPieceSprites() {
        const setupRow = (row, color, pieces) => {
            pieces.forEach((type, col) => {
                this.addPiece(col, row, type, color);
            });
        };

        const backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
        const pawnRow = Array(8).fill('P');

        setupRow(0, 'black', backRow);
        setupRow(1, 'black', pawnRow);
        setupRow(6, 'white', pawnRow);
        setupRow(7, 'white', backRow);
    }

    addPiece(x, y, type, color) {
        const symbols = {
            'K': '♚', 'Q': '♛', 'R': '♜', 'B': '♝', 'N': '♞', 'P': '♟'
        };

        const text = this.add.text(0, 0, symbols[type], { 
            font: '64px Arial', 
            color: color === 'white' ? '#FFFFFF' : '#000000',
            stroke: color === 'white' ? '#000000' : '#FFFFFF',
            strokeThickness: 2
        }).setOrigin(0.5);

        const piece = {
            type: type,
            color: color,
            x: x,
            y: y,
            sprite: text,
            hasMoved: false,
            movedThisTurn: false
        };

        this.board[y][x] = piece;
        this.piecesGroup.add(text);
    }

    createUI() {
        // Create UI elements (positions set in resize)
        this.turnText = this.add.text(0, 0, "Turn: White", { font: '32px Arial', color: '#ffffff' });
        this.diceText = this.add.text(0, 0, "Dice: -", { font: '32px Arial', color: '#ffffff' });
        this.movesText = this.add.text(0, 0, "Moves Left: -", { font: '32px Arial', color: '#ffffff' });

        this.rollButton = this.add.text(0, 0, "[ ROLL DICE ]", { font: '32px Arial', color: '#00ff00', backgroundColor: '#333' })
            .setInteractive()
            .on('pointerdown', () => this.rollDice());
        
        this.passButton = this.add.text(0, 0, "[ END TURN ]", { font: '32px Arial', color: '#ff0000', backgroundColor: '#333' })
            .setInteractive()
            .on('pointerdown', () => this.endTurn());

        this.infoText = this.add.text(0, 0, "Roll the dice to start!", { font: '24px Arial', color: '#ffff00' }).setOrigin(0.5);

        // Dice Roll Animation Sprite
        this.diceVisual = this.add.container(0, 0);
        const diceBg = this.add.rectangle(0, 0, 100, 100, 0xffffff).setStrokeStyle(4, 0x000000);
        this.diceValText = this.add.text(0, 0, "?", { font: 'bold 48px Arial', color: '#000000' }).setOrigin(0.5);
        this.diceVisual.add([diceBg, this.diceValText]);
        this.diceVisual.setDepth(1000).setAlpha(0);
    }

    handleResize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        // Determine orientation and layout
        const isLandscape = width > height;

        // Calculate Tile Size
        // We want the board to fit, leaving space for UI
        let availableBoardSize;
        if (isLandscape) {
            availableBoardSize = Math.min(width * 0.6, height * 0.9);
        } else {
            availableBoardSize = Math.min(width * 0.9, height * 0.6);
        }
        
        this.TILE_SIZE = Math.floor(availableBoardSize / this.BOARD_SIZE);
        
        // Calculate Board Offset (Center board in its section)
        if (isLandscape) {
            this.OFFSET_X = (width * 0.6 - (this.TILE_SIZE * this.BOARD_SIZE)) / 2; // Left side
            this.OFFSET_Y = (height - (this.TILE_SIZE * this.BOARD_SIZE)) / 2;
        } else {
            this.OFFSET_X = (width - (this.TILE_SIZE * this.BOARD_SIZE)) / 2;
            this.OFFSET_Y = 50 + (height * 0.6 - (this.TILE_SIZE * this.BOARD_SIZE)) / 2; // Top side
        }

        // Redraw Board
        this.drawBoard();

        // Reposition Pieces
        this.updatePiecePositions();

        // Reposition UI
        this.layoutUI(width, height, isLandscape);

        // Center visual dice on board
        if (this.diceVisual) {
            this.diceVisual.setPosition(
                this.OFFSET_X + (this.BOARD_SIZE * this.TILE_SIZE) / 2,
                this.OFFSET_Y + (this.BOARD_SIZE * this.TILE_SIZE) / 2
            );
        }
    }

    drawBoard() {
        this.graphics.clear();
        this.COLOR_LIGHT = 0xeaddcf;
        this.COLOR_DARK = 0xaf8a6b;
        
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                const color = (x + y) % 2 === 0 ? this.COLOR_LIGHT : this.COLOR_DARK;
                this.graphics.fillStyle(color, 1);
                this.graphics.fillRect(
                    this.OFFSET_X + x * this.TILE_SIZE, 
                    this.OFFSET_Y + y * this.TILE_SIZE, 
                    this.TILE_SIZE, 
                    this.TILE_SIZE
                );
            }
        }
        
        // Re-highlight if selected
        if (this.selectedPiece) {
            this.highlightSelection();
        }
    }

    updatePiecePositions() {
        const fontSize = Math.floor(this.TILE_SIZE * 0.8);
        const font = `${fontSize}px Arial`;

        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                const piece = this.board[y][x];
                if (piece) {
                    piece.sprite.setFont(font);
                    piece.sprite.setPosition(
                        this.OFFSET_X + x * this.TILE_SIZE + this.TILE_SIZE / 2,
                        this.OFFSET_Y + y * this.TILE_SIZE + this.TILE_SIZE / 2
                    );
                }
            }
        }
    }

    layoutUI(width, height, isLandscape) {
        let startX, startY;

        if (isLandscape) {
            startX = width * 0.65;
            startY = height * 0.2;
        } else {
            startX = 20;
            startY = this.OFFSET_Y + (this.BOARD_SIZE * this.TILE_SIZE) + 40;
        }
        
        const spacing = 50;
        
        this.turnText.setPosition(startX, startY);
        this.diceText.setPosition(startX, startY + spacing);
        this.movesText.setPosition(startX, startY + spacing * 2);
        
        this.rollButton.setPosition(startX, startY + spacing * 3.5);
        this.passButton.setPosition(startX, startY + spacing * 4.8);

        // Info text at top center
        this.infoText.setPosition(width / 2, 30);
    }

    // --- Gameplay Logic (Kept mostly same, just updating calls) ---

    rollDice() {
        if (this.gameState !== 'ROLL') return;

        this.gameState = 'ANIMATING'; // Prevent double clicking
        this.rollButton.setAlpha(0.5);
        
        // Start Animation
        this.diceVisual.setAlpha(1).setScale(0.5);
        this.diceVisual.setAngle(0);

        // Roll Animation: Spin and scale up
        this.tweens.add({
            targets: this.diceVisual,
            scale: 1.5,
            angle: 360,
            duration: 800,
            ease: 'Back.easeOut',
            onUpdate: () => {
                // Cycle random numbers
                this.diceValText.setText(Phaser.Math.Between(1, 6));
            },
            onComplete: () => {
                this.time.delayedCall(400, () => {
                    this.diceValue = Phaser.Math.Between(1, 6);
                    this.diceValText.setText(this.diceValue);
                    
                    // Fade out and finish
                    this.tweens.add({
                        targets: this.diceVisual,
                        alpha: 0,
                        scale: 2,
                        duration: 300,
                        onComplete: () => {
                            this.movesLeft = this.diceValue;
                            this.gameState = 'MOVE';
                            this.updateUI();
                            this.infoText.setText(`Rolled a ${this.diceValue}! Select pieces to move.`);
                        }
                    });
                });
            }
        });
    }

    endTurn() {
        if (this.gameState === 'GAMEOVER') return;

        // Reset movement status for all pieces
        for (let y = 0; y < this.BOARD_SIZE; y++) {
            for (let x = 0; x < this.BOARD_SIZE; x++) {
                if (this.board[y][x]) {
                    this.board[y][x].movedThisTurn = false;
                }
            }
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        this.gameState = 'ROLL';
        this.diceValue = 0;
        this.movesLeft = 0;
        this.selectedPiece = null;
        this.drawBoard(); // Clear highlights
        
        this.updateUI();
        this.infoText.setText(`${this.turn.charAt(0).toUpperCase() + this.turn.slice(1)}'s turn. Roll the dice!`);
    }

    updateUI() {
        this.turnText.setText(`Turn: ${this.turn.charAt(0).toUpperCase() + this.turn.slice(1)}`);
        this.diceText.setText(`Dice: ${this.diceValue}`);
        this.movesText.setText(`Moves Left: ${this.movesLeft}`);
        
        this.rollButton.setAlpha(this.gameState === 'ROLL' ? 1 : 0.5);
        this.passButton.setAlpha(this.gameState === 'MOVE' ? 1 : 0.5);
    }

    handleInput(pointer) {
        if (this.gameState !== 'MOVE') return;

        const x = Math.floor((pointer.x - this.OFFSET_X) / this.TILE_SIZE);
        const y = Math.floor((pointer.y - this.OFFSET_Y) / this.TILE_SIZE);

        if (x < 0 || x >= this.BOARD_SIZE || y < 0 || y >= this.BOARD_SIZE) {
            this.deselectPiece();
            return;
        }

        const clickedPiece = this.board[y][x];

        // Only select if it's your turn and the piece hasn't moved yet this turn
        if (clickedPiece && clickedPiece.color === this.turn && !clickedPiece.movedThisTurn) {
            this.selectPiece(x, y);
        }
        else if (this.selectedPiece) {
            this.tryMove(x, y);
        }
    }

    selectPiece(x, y) {
        this.deselectPiece();
        this.selectedPiece = this.board[y][x];
        this.drawBoard(); 
        this.highlightSelection();
        this.showValidMoves(this.selectedPiece);
    }

    highlightSelection() {
        if (!this.selectedPiece) return;
        this.graphics.lineStyle(4, 0xffff00);
        this.graphics.strokeRect(
            this.OFFSET_X + this.selectedPiece.x * this.TILE_SIZE, 
            this.OFFSET_Y + this.selectedPiece.y * this.TILE_SIZE, 
            this.TILE_SIZE, 
            this.TILE_SIZE
        );
    }

    deselectPiece() {
        this.selectedPiece = null;
        this.validMoves = [];
        this.drawBoard(); 
    }

    showValidMoves(piece) {
        this.validMoves = this.calculateValidMoves(piece);

        this.graphics.fillStyle(0x00ff00, 0.5);
        this.validMoves.forEach(move => {
            this.graphics.fillRect(
                this.OFFSET_X + move.x * this.TILE_SIZE,
                this.OFFSET_Y + move.y * this.TILE_SIZE,
                this.TILE_SIZE,
                this.TILE_SIZE
            );
        });
    }

    calculateValidMoves(piece) {
        const moves = [];
        const directions = {
            'P': [],
            'R': [[0, 1], [0, -1], [1, 0], [-1, 0]],
            'B': [[1, 1], [1, -1], [-1, 1], [-1, -1]],
            'N': [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]],
            'Q': [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
            'K': [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        };

        const isWhite = piece.color === 'white';
        const forward = isWhite ? -1 : 1;

        if (piece.type === 'P') {
            if (this.isValidSquare(piece.x, piece.y + forward) && !this.board[piece.y + forward][piece.x]) {
                if (1 <= this.movesLeft) moves.push({x: piece.x, y: piece.y + forward, cost: 1});
                
                const startRank = isWhite ? 6 : 1;
                if (piece.y === startRank && !this.board[piece.y + forward * 2][piece.x]) {
                    if (2 <= this.movesLeft) moves.push({x: piece.x, y: piece.y + forward * 2, cost: 2});
                }
            }
            [[1, forward], [-1, forward]].forEach(dir => {
                const tx = piece.x + dir[0];
                const ty = piece.y + dir[1];
                if (this.isValidSquare(tx, ty)) {
                    const target = this.board[ty][tx];
                    if (target && target.color !== piece.color) {
                         if (1 <= this.movesLeft) moves.push({x: tx, y: ty, cost: 1});
                    }
                }
            });
        } else if (piece.type === 'N') {
             directions['N'].forEach(dir => {
                const tx = piece.x + dir[0];
                const ty = piece.y + dir[1];
                if (this.isValidSquare(tx, ty)) {
                    const target = this.board[ty][tx];
                    if (!target || target.color !== piece.color) {
                        if (3 <= this.movesLeft) moves.push({x: tx, y: ty, cost: 3});
                    }
                }
            });
        } else {
            const dirs = directions[piece.type];
            const isKing = piece.type === 'K';
            
            dirs.forEach(dir => {
                let dist = 1;
                while (true) {
                    const tx = piece.x + dir[0] * dist;
                    const ty = piece.y + dir[1] * dist;
                    
                    if (!this.isValidSquare(tx, ty)) break;
                    
                    const cost = dist;
                    if (cost > this.movesLeft) break;

                    const target = this.board[ty][tx];
                    
                    if (!target) {
                        moves.push({x: tx, y: ty, cost: cost});
                    } else {
                        if (target.color !== piece.color) {
                            moves.push({x: tx, y: ty, cost: cost});
                        }
                        break; 
                    }

                    if (isKing) break; 
                    dist++;
                }
            });
        }

        return moves;
    }

    isValidSquare(x, y) {
        return x >= 0 && x < this.BOARD_SIZE && y >= 0 && y < this.BOARD_SIZE;
    }

    tryMove(tx, ty) {
        const move = this.validMoves.find(m => m.x === tx && m.y === ty);
        if (move) {
            this.executeMove(this.selectedPiece, move);
        }
    }

    executeMove(piece, move) {
        const target = this.board[move.y][move.x];
        
        if (target) {
            target.sprite.destroy();
            if (target.type === 'K') {
                this.gameOver(piece.color);
                return;
            }
        }

        this.board[piece.y][piece.x] = null;
        this.board[move.y][move.x] = piece;

        piece.x = move.x;
        piece.y = move.y;
        piece.hasMoved = true;
        piece.movedThisTurn = true;

        this.tweens.add({
            targets: piece.sprite,
            x: this.OFFSET_X + move.x * this.TILE_SIZE + this.TILE_SIZE / 2,
            y: this.OFFSET_Y + move.y * this.TILE_SIZE + this.TILE_SIZE / 2,
            duration: 200
        });

        this.movesLeft -= move.cost;
        this.updateUI();
        this.deselectPiece();

        if (this.movesLeft === 0) {
            this.infoText.setText("No moves left. Ending turn...");
            this.time.delayedCall(1000, () => this.endTurn());
        }
    }

    gameOver(winner) {
        this.gameState = 'GAMEOVER';
        this.infoText.setText(`GAME OVER! ${winner.toUpperCase()} WINS!`);
        this.infoText.setColor('#ff0000');
        this.infoText.setFontSize(48);
        this.rollButton.destroy();
        this.passButton.destroy();
    }
}
