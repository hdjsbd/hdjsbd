// --- 9 种颜色定义 ---
const COLORS = [
    '#E53935',  // 1. 红色
    '#1E88E5',  // 2. 蓝色
    '#43A047',  // 3. 绿色
    '#FDD835',  // 4. 黄色
    '#FB8C00',  // 5. 橙色
    '#8E24AA',  // 6. 紫色
    '#D81B60',  // 7. 粉红色
    '#00ACC1',  // 8. 青色
    '#5D4037'   // 9. 棕色
];

// --- 全局状态变量 ---
let blockImages = [null, null, null, null, null, null, null, null, null];
let backgroundImage = null;

let gameAreaWidth = 600;
let gameAreaHeight = 900;
let blockSize;
let gameArea;
let currentBlock;
let placedBlocks = [];
let score = 0;
let gameStarted = false;
let gameRunning = false;
let currentBlockColors = [];
let currentColorIndex = 0;
let currentX = 0;
let currentY = 0;
let dropSpeed = 0.5;
let dropInterval;
let difficulty = 'beginner';
let cols = 3;

/**
 * 初始化游戏入口
 */
function initGame() {
    gameArea = document.getElementById('game-area');
    generateBlockImageInputs('block-image-inputs');
    setupEventListeners();
    updateGameAreaSize();
}

/**
 * 生成 9 个方块颜色位置预览（带颜色编号）
 */
function generateBlockImageInputs(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'block-image-input';
        wrap.dataset.index = i;
        wrap.style.backgroundColor = COLORS[i];
        wrap.textContent = (i + 1).toString();

        if (blockImages[i]) {
            const img = document.createElement('img');
            img.src = blockImages[i];
            wrap.innerHTML = '';
            wrap.appendChild(img);
        }

        container.appendChild(wrap);
    }
}

/**
 * 绑定所有交互事件
 */
function setupEventListeners() {
    const sizeSlider = document.getElementById('size-slider');
    const sizeInput = document.getElementById('size-input');
    const startBtn = document.getElementById('start-btn');
    const startSettingBtn = document.getElementById('start-setting-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsPanel = document.getElementById('settings-panel');

    // --- 画布宽度调整：滑块和输入框双向同步 ---
    sizeSlider.addEventListener('input', (e) => {
        gameAreaWidth = parseInt(e.target.value);
        sizeInput.value = gameAreaWidth;
        updateGameAreaSize();
    });

    sizeInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) return;
        if (val < 300) val = 300;
        if (val > 1000) val = 1000;
        gameAreaWidth = val;
        sizeSlider.value = val;
        updateGameAreaSize();
    });

    // --- 设置面板：打开 ---
    startSettingBtn.addEventListener('click', () => {
        settingsPanel.classList.add('active');
    });

    // --- 设置面板：关闭 ---
    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });

    // --- 开始游戏 ---
    startBtn.addEventListener('click', startGame);

    // --- 方块图片：一次性选择 9 张 ---
    const blockImagesInput = document.getElementById('block-images-input');
    if (blockImagesInput) {
        blockImagesInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // 按文件名排序，用户可通过命名控制顺序
            files.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));

            let loaded = 0;
            const newImages = [...blockImages];

            files.slice(0, 9).forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    newImages[idx] = evt.target.result;
                    loaded++;
                    if (loaded === Math.min(files.length, 9)) {
                        blockImages = newImages;
                        generateBlockImageInputs('block-image-inputs');
                    }
                };
                reader.readAsDataURL(file);
            });

            // 如果少于 9 张，剩余位置保持原样
            if (files.length < 9) {
                setTimeout(() => {
                    blockImages = newImages;
                    generateBlockImageInputs('block-image-inputs');
                }, 500);
            }
        });
    }

    // --- 背景图片选择 ---
    const bgInput = document.getElementById('bg-image-input');
    if (bgInput) {
        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                backgroundImage = evt.target.result;
                const status = document.getElementById('bg-image-status');
                if (status) status.textContent = file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name;
                updateGameAreaSize();
            };
            reader.readAsDataURL(file);
        });
    }

    // --- 清除方块图片 ---
    const clearBtn = document.getElementById('clear-block-images');
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            blockImages = [null, null, null, null, null, null, null, null, null];
            generateBlockImageInputs('block-image-inputs');
        });
    }

    // --- 清除背景 ---
    const clearBgBtn = document.getElementById('clear-bg-image');
    if (clearBgBtn) {
        clearBgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            backgroundImage = null;
            const status = document.getElementById('bg-image-status');
            if (status) status.textContent = '选择背景图片';
            updateGameAreaSize();
        });
    }

    // --- 键盘控制 ---
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * 根据 gameAreaWidth 动态调整画布大小和方块尺寸
 * 高度 = 宽度 × 1.5
 */
function updateGameAreaSize() {
    gameAreaHeight = Math.round(gameAreaWidth * 9 / 6);
    blockSize = Math.round(gameAreaWidth / 3);
    cols = 3;

    gameArea.style.width = gameAreaWidth + 'px';
    gameArea.style.height = gameAreaHeight + 'px';

    if (backgroundImage) {
        gameArea.style.backgroundImage = `url(${backgroundImage})`;
    } else {
        gameArea.style.backgroundImage = '';
    }
}

/**
 * 开始游戏：重置状态并生成第一个方块
 */
function startGame() {
    // 关闭设置面板
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) settingsPanel.classList.remove('active');

    // 隐藏开始屏幕
    const startScreen = document.getElementById('start-screen');
    startScreen.style.display = 'none';

    // 读取当前选择的难度
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    if (selectedDifficulty) {
        difficulty = selectedDifficulty.value;
    }

    gameStarted = true;
    gameRunning = true;
    score = 0;
    dropSpeed = 0.5;
    placedBlocks = [];

    document.getElementById('score').textContent = score;
    document.getElementById('speed').textContent = dropSpeed.toFixed(1);

    createNewBlock();
    startDrop();
}

/**
 * 键盘按键处理：
 * A → 左移，D → 右移，空格 → 切换颜色，S → 加速下落
 */
function handleKeyDown(e) {
    if (!gameRunning || !currentBlock) return;

    switch (e.key.toLowerCase()) {
        case 'a':
            moveLeft();
            break;
        case 'd':
            moveRight();
            break;
        case ' ':
            e.preventDefault();
            changeColor();
            break;
        case 's':
            speedUp();
            break;
    }
}

/**
 * 创建一个新下落方块：随机选择 3 种候选颜色，定位到顶部中央
 */
function createNewBlock() {
    if (currentBlock && currentBlock.parentNode) {
        currentBlock.parentNode.removeChild(currentBlock);
    }

    currentBlock = document.createElement('div');
    currentBlock.className = 'current-block';

    // 从 9 种颜色中随机取 3 种作为该方块的可选颜色
    const shuffled = [...Array(9).keys()].sort(() => Math.random() - 0.5);
    currentBlockColors = shuffled.slice(0, 3);
    currentColorIndex = 0;

    // 菜鸟模式：显示数字编号
    if (difficulty === 'beginner') {
        const numberSpan = document.createElement('span');
        numberSpan.className = 'block-number';
        currentBlock.appendChild(numberSpan);
    }

    // 定位：中央列，顶部上方（刚进入视野）
    currentX = Math.floor(cols / 2) * blockSize;
    currentY = -blockSize;

    updateCurrentBlock();
    gameArea.appendChild(currentBlock);

    checkGameOver();
}

/**
 * 更新当前下落方块的视觉状态：颜色、数字、位置、尺寸
 */
function updateCurrentBlock() {
    if (!currentBlock) return;

    currentBlock.style.width = blockSize + 'px';
    currentBlock.style.height = blockSize + 'px';

    const colorIdx = currentBlockColors[currentColorIndex];
    if (blockImages[colorIdx]) {
        currentBlock.style.backgroundColor = '';
        currentBlock.style.backgroundImage = `url(${blockImages[colorIdx]})`;
    } else {
        currentBlock.style.backgroundColor = COLORS[colorIdx];
        currentBlock.style.backgroundImage = '';
    }

    currentBlock.style.left = currentX + 'px';
    currentBlock.style.top = currentY + 'px';

    if (difficulty === 'beginner') {
        const numberSpan = currentBlock.querySelector('.block-number');
        if (numberSpan) {
            numberSpan.textContent = (colorIdx + 1).toString();
            numberSpan.style.fontSize = Math.round(blockSize * 0.4) + 'px';
        }
    }
}

/**
 * 在 3 个候选颜色中循环切换
 */
function changeColor() {
    currentColorIndex = (currentColorIndex + 1) % currentBlockColors.length;

    const colorIdx = currentBlockColors[currentColorIndex];
    if (blockImages[colorIdx]) {
        currentBlock.style.backgroundColor = '';
        currentBlock.style.backgroundImage = `url(${blockImages[colorIdx]})`;
    } else {
        currentBlock.style.backgroundColor = COLORS[colorIdx];
        currentBlock.style.backgroundImage = '';
    }

    if (difficulty === 'beginner') {
        const numberSpan = currentBlock.querySelector('.block-number');
        if (numberSpan) {
            numberSpan.textContent = (colorIdx + 1).toString();
        }
    }
}

/**
 * 左移一列
 */
function moveLeft() {
    const newX = currentX - blockSize;
    if (newX >= 0) {
        currentX = newX;
        currentBlock.style.left = currentX + 'px';
    }
}

/**
 * 右移一列
 */
function moveRight() {
    const newX = currentX + blockSize;
    if (newX + blockSize <= gameAreaWidth) {
        currentX = newX;
        currentBlock.style.left = currentX + 'px';
    }
}

/**
 * 加速下落：直接下移一整块，触底或碰撞则放置
 */
function speedUp() {
    currentY += blockSize;

    if (currentY + blockSize >= gameAreaHeight) {
        currentY = gameAreaHeight - blockSize;
        placeBlock();
    } else {
        const collisionBlock = getCollisionBlock(currentX, currentY);
        if (collisionBlock) {
            currentY = collisionBlock.y - blockSize;
            placeBlock();
        } else {
            currentBlock.style.top = currentY + 'px';
        }
    }
}

/**
 * 启动定时器驱动方块自然下落
 */
function startDrop() {
    dropInterval = setInterval(() => {
        if (!gameRunning) return;

        currentY += dropSpeed;

        if (currentY + blockSize >= gameAreaHeight) {
            currentY = gameAreaHeight - blockSize;
            placeBlock();
        } else {
            const collisionBlock = getCollisionBlock(currentX, currentY);
            if (collisionBlock) {
                currentY = collisionBlock.y - blockSize;
                placeBlock();
            } else {
                currentBlock.style.top = currentY + 'px';
            }
        }
    }, 50);
}

/**
 * 检测给定位置是否与已放置方块发生碰撞
 * 返回发生碰撞的方块对象，否则返回 undefined
 */
function getCollisionBlock(x, y) {
    return placedBlocks.find(block => {
        return x === block.x && y + blockSize > block.y && y < block.y + blockSize;
    });
}

function checkCollision(x, y) {
    return placedBlocks.some(block => {
        return x === block.x && y + blockSize > block.y && y < block.y + blockSize;
    });
}

/**
 * 放置方块：将当前下落方块转换为固定方块，然后创建下一个
 */
function placeBlock() {
    currentBlock.style.top = currentY + 'px';

    const colorIdx = currentBlockColors[currentColorIndex];
    createPlacedBlock(currentX, currentY, colorIdx);

    // 短暂延迟后检测消除
    setTimeout(() => {
        checkMatches();
    }, 100);

    createNewBlock();
}

/**
 * 创建一个已放置方块的 DOM 元素并加入数组
 */
function createPlacedBlock(x, y, colorIdx) {
    const block = document.createElement('div');
    block.className = 'placed-block';
    block.style.width = blockSize + 'px';
    block.style.height = blockSize + 'px';

    if (blockImages[colorIdx]) {
        block.style.backgroundColor = '';
        block.style.backgroundImage = `url(${blockImages[colorIdx]})`;
    } else {
        block.style.backgroundColor = COLORS[colorIdx];
        block.style.backgroundImage = '';
    }

    block.style.left = x + 'px';
    block.style.top = y + 'px';

    if (difficulty === 'beginner') {
        const numberSpan = document.createElement('span');
        numberSpan.className = 'block-number';
        numberSpan.textContent = (colorIdx + 1).toString();
        numberSpan.style.fontSize = Math.round(blockSize * 0.4) + 'px';
        block.appendChild(numberSpan);
    }

    gameArea.appendChild(block);

    placedBlocks.push({
        x,
        y,
        colorIdx,
        element: block
    });
}

/**
 * 检测并消除相连的相同颜色方块（≥ 3 个）
 * 使用 BFS 找出每个方块的连通区域
 */
function checkMatches() {
    const matches = new Set();

    placedBlocks.forEach(block => {
        const connected = findConnectedBlocks(block);
        if (connected.length >= 3) {
            connected.forEach(b => matches.add(b));
        }
    });

    if (matches.size > 0) {
        removeBlocks(matches);
        score += matches.size * 10;
        updateScore();

        // 让上方悬空的方块下落后再检测一次消除
        setTimeout(() => {
            dropFloatingBlocks();
        }, 300);
    }
}

/**
 * BFS：从起始方块出发，找到所有相连的同色方块
 */
function findConnectedBlocks(startBlock) {
    const connected = [];
    const visited = new Set();
    const queue = [startBlock];

    visited.add(startBlock);

    while (queue.length > 0) {
        const current = queue.shift();
        connected.push(current);

        const neighbors = getNeighbors(current);
        neighbors.forEach(neighbor => {
            if (!visited.has(neighbor) && neighbor.colorIdx === startBlock.colorIdx) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        });
    }

    return connected;
}

/**
 * 获取某个方块在上下左右四个方向上的相邻方块
 */
function getNeighbors(block) {
    const neighbors = [];
    const directions = [
        { dx: -blockSize, dy: 0 },
        { dx: blockSize, dy: 0 },
        { dx: 0, dy: -blockSize },
        { dx: 0, dy: blockSize }
    ];

    directions.forEach(dir => {
        const neighbor = placedBlocks.find(b =>
            b.x === block.x + dir.dx && b.y === block.y + dir.dy
        );
        if (neighbor) {
            neighbors.push(neighbor);
        }
    });

    return neighbors;
}

/**
 * 动画消除一批方块，并从数组中移除
 */
function removeBlocks(blocks) {
    blocks.forEach(block => {
        block.element.style.animation = 'disappear 0.3s ease forwards';
        setTimeout(() => {
            if (block.element.parentNode) {
                block.element.parentNode.removeChild(block.element);
            }
        }, 300);
    });

    placedBlocks = placedBlocks.filter(b => !blocks.has(b));
}

/**
 * 让悬空的方块自动下落到底部或其他方块顶部
 * 循环多次直到稳定（避免多列同时变化时漏判）
 */
function dropFloatingBlocks() {
    let dropped = true;
    let iterations = 0;

    while (dropped && iterations < 100) {
        dropped = false;
        iterations++;

        // 从底部向上处理，确保逻辑正确
        const sortedBlocks = [...placedBlocks].sort((a, b) => b.y - a.y);

        sortedBlocks.forEach(block => {
            if (!hasBlockBelow(block)) {
                block.y += blockSize;
                block.element.style.top = block.y + 'px';
                dropped = true;
            }
        });
    }

    // 连锁消除
    setTimeout(() => {
        checkMatches();
    }, 200);
}

/**
 * 判断方块下方是否被阻挡（底部或其他方块）
 */
function hasBlockBelow(block) {
    if (block.y + blockSize >= gameAreaHeight) {
        return true;
    }

    return placedBlocks.some(b =>
        b.x === block.x && b.y === block.y + blockSize
    );
}

/**
 * 检查游戏是否结束：新方块位置与已有方块重叠
 */
function checkGameOver() {
    const isOverlapping = placedBlocks.some(block => {
        return block.x === currentX &&
               (currentY + blockSize > block.y && currentY < block.y + blockSize);
    });

    if (isOverlapping || (placedBlocks.length > 0 && currentY >= placedBlocks[0].y)) {
        endGame();
    }
}

/**
 * 游戏结束：停止下落，显示结束面板
 */
function endGame() {
    gameRunning = false;
    clearInterval(dropInterval);

    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>游戏结束!</h2>
        <p>最终得分: ${score}</p>
        <div class="button-row">
            <button class="restart-btn">🔄 重新开始</button>
            <button class="setting-btn" id="restart-setting-btn">⚙️ 设置</button>
            <a href="../../index.html" class="home-link">🏠 返回首页</a>
        </div>
    `;

    gameArea.appendChild(gameOverDiv);

    // 重新开始按钮
    gameOverDiv.querySelector('.restart-btn').addEventListener('click', () => {
        restartGame();
    });

    // 游戏结束面板中的设置按钮：复用同一个设置面板
    gameOverDiv.querySelector('#restart-setting-btn').addEventListener('click', () => {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) settingsPanel.classList.add('active');
    });
}

/**
 * 重新开始：清除画布中的方块，重建分数/速度显示
 */
function restartGame() {
    // 移除结束面板
    const gameOverDiv = gameArea.querySelector('.game-over');
    if (gameOverDiv) {
        gameArea.removeChild(gameOverDiv);
    }

    // 清除所有已放置的方块
    const placedBlockElements = gameArea.querySelectorAll('.placed-block');
    placedBlockElements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
    });

    // 清除当前下落方块
    if (currentBlock && currentBlock.parentNode) {
        currentBlock.parentNode.removeChild(currentBlock);
        currentBlock = null;
    }

    // 重建速度/得分显示
    let speedDisplay = document.getElementById('speed-display');
    if (!speedDisplay) {
        speedDisplay = document.createElement('div');
        speedDisplay.className = 'speed-display';
        speedDisplay.id = 'speed-display';
        gameArea.appendChild(speedDisplay);
    }
    speedDisplay.innerHTML = '速度: <span id="speed">0.5</span>';

    let scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
        scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.id = 'score-display';
        gameArea.appendChild(scoreDisplay);
    }
    scoreDisplay.innerHTML = '得分: <span id="score">0</span>';

    // 重置游戏状态
    placedBlocks = [];
    score = 0;
    gameRunning = true;
    dropSpeed = 0.5;

    document.getElementById('score').textContent = score;
    document.getElementById('speed').textContent = dropSpeed.toFixed(1);

    createNewBlock();
    startDrop();
}

/**
 * 更新分数显示并调整速度等级（每 120 分增加 0.2 速度，封顶 8）
 */
function updateScore() {
    document.getElementById('score').textContent = score;

    const speedLevel = Math.floor(score / 120);
    dropSpeed = Math.min(0.5 + speedLevel * 0.2, 8);

    const speedElement = document.getElementById('speed');
    if (speedElement) {
        speedElement.textContent = dropSpeed.toFixed(1);
    }
}

// --- 页面加载完成后初始化游戏 ---
window.addEventListener('load', initGame);
