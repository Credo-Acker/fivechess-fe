window.onload = function() {
    let canvas = document.querySelector('#canvas'),
        chess = [],   // 记录棋子在哪些地方已经下过
        bw = true,  // 默认黑棋先行
        go = false,
        online = document.querySelector('#online'),
        ai = document.querySelector('#ai'),
        cover = document.querySelector('.cover'),
        menu = document.querySelector('.menu'),
        tips = document.querySelector('.tips'),
        confirm = document.querySelector('.confirm'),
        win = document.querySelector('.win'),
        who = document.querySelector('.who'),
        again = document.querySelector('.again'),
        role = null,
        socket = null;

    for (let i = 0; i < 21; i++) {    // 记录棋盘上位置的棋子
        chess[i] = [];
        for (let j = 0; j < 21; j++) {
            chess[i][j] = 0;
        }
    }

    drawChessLine();    // 初始化棋盘

    online.addEventListener('click', () => {
        socket = io.connect('ws://www.credog.top/fivechessbe');
        // socket = io.connect('wss://localhost:8001');

        // websocket时间
        socket.on('connect', data => {
            console.log(data);
        });

        // 客户端为黑方
        socket.on('black', data => {
            console.log(data);
            menu.className = 'menuNone';
            tips.innerHTML += `<p>白方已进入，${data.msg}</p>`;
            role = data.role;
            confirm.className = "confirm confirmIn";

        });

        // 客户端为白方
        socket.on('white', data => {
            console.log(data);
            role = data.role;
            menu.className = 'menuNone';
            tips.innerHTML += `<p>黑方已进入，${data.msg}</p>`;
            confirm.className = "confirm confirmIn";
        });

        // 客户端为黑方，等待白方进入游戏
        socket.on('blackWait', data => {
            console.log(data);
            role = data.role;
            menu.className = 'menuNone';
            tips.innerHTML += `<p>${data.msg}</p>`;
            confirm.className = "confirm confirmIn";
        });

        // 客户端为白方，等待黑方进入游戏
        socket.on('whiteWait', data => {
            console.log(data);
            menu.className = 'menuNone';
            tips.innerHTML += `<p>${data.msg}</p>`;
            role = data.role;
            confirm.className = "confirm confirmIn";
        });

        // 等待双方确认
        socket.on('waitConfirm', data => {
            console.log(data);
            if (role == 'white') {
                tips.innerHTML += `<p>黑方已进入</p>`;
                tips.innerHTML += `<p>${data.msg}</p>`;
            } else if (role == 'black') {
                tips.innerHTML += `<p>白方已进入</p>`;
                tips.innerHTML += `<p>${data.msg}</p>`;
            }

        });

        socket.on('oneConfirm', data => {
            console.log(data);
            tips.innerHTML += `<p>${data.msg}</p>`;
        });

        // 客户端为观众
        socket.on('audience', data => {
            console.log(data);
            menu.className = 'menuNone';
            tips.innerHTML += `<p>${data.msg}</p>`;
            role = data.role;
            for (let i = 0; i < 21; i++) {
                for (let j = 0; j < 21; j++) {
                    if (data.chessBoard[i][j] == 1) {
                        cover.className = "cover coverNone";
                        drawChess(i, j, true);
                    } else if (data.chessBoard[i][j] == 2) {
                        cover.className = "cover coverNone";
                        drawChess(i, j, false);
                    }
                }
            }
            chess = data.chessBoard;
        });

        // 有观众进入
        socket.on('audienceEnter', data => {
            tips.innerHTML += `<p>${data.msg}</p>`;
        });

        // 游戏开始
        socket.on('startGame', data => {
            console.log(data);
            tips.innerHTML += `<p>${data.msg}</p>`;
            if (role == 'black') {
                go = true;
            }
            cover.className = "cover coverNone";
            confirm.className = "confirm";
        });

        // 下棋进行时
        socket.on('blackGo', data => {
            console.log(data);
            drawChess(data.i, data.j, true);
            go = false;
        });

        socket.on('whiteGo', data => {
            console.log(data);
            drawChess(data.i, data.j, false);
            go = false;
        });

        socket.on('oneGo', data => {
            console.log(data);
            if (role == 'audience') {
                drawChess(data.i, data.j, data.bw);
            } else if (data.bw && role == 'white') {
                drawChess(data.i, data.j, data.bw);
                go = true;
            } else if (!data.bw && role == 'black') {
                drawChess(data.i, data.j, data.bw);
                go = true;
            }
        });

        socket.on('win', data => {
            again = document.querySelector('.again');
            win.className = 'win notNone';

            if (data.win == 'white') {
                go = false;
                drawChess(data.i, data.j, false);
                setTimeout(() => {
                    cover.className = "cover";
                    who.innerHTML = "白方胜";
                }, 10);
            } else if (data.win == 'black') {
                go = false;
                drawChess(data.i, data.j, true);
                setTimeout(() => {
                    cover.className = "cover";
                    who.innerHTML = "黑方胜";
                }, 10);
            }

            if (role == 'audience') {
                again.className = 'again agianNone'
            }

            again.addEventListener('click', e => {
                socket.emit('again', {
                    msg: '重新开始'
                });
            });
        });

        // 黑方重新开始游戏
        socket.on('againBlack', data => {
            win.className = 'win';
            drawChessLine();
            tips.innerHTML += `<p>${data.msg}</p>`;
            cover.className = "cover";
            confirm.className = "confirm confirmIn";
        });

        // 白方重新开始游戏
        socket.on('againWhite', data => {
            win.className = 'win';
            drawChessLine();
            tips.innerHTML += `<p>${data.msg}</p>`;
            cover.className = "cover";
            confirm.className = "confirm confirmIn";
        });

        // 真正重新开始
        socket.on('againGame', data => {
            drawChessLine();
            if (role == 'audience') {
                cover.className = "cover";
                tips.innerHTML += `<p>${data.msg}</p>`;
                win.className = 'win';
            }
        });

        // 黑方断开连接
        socket.on('black disconnected', data => {
            console.log(data);
            tips.innerHTML += `<p>${data.msg}</p>`;
            cover.className = "cover";
        });

        // 白方断开连接
        socket.on('white disconnected', data => {
            console.log(data);
            tips.innerHTML += `<p>${data.msg}</p>`;
            cover.className = "cover";
        });

        // 有观众断开连接
        socket.on('audience disconnected', data => {
            console.log(data);
            tips.innerHTML += `<p>${data.msg}</p>`;
        });

        confirm.addEventListener('click', () => {
            if (role == 'black') {
                socket.emit('blackConfirm', {
                    msg: '黑方确认开始'
                });
            } else if (role == 'white') {
                socket.emit('whiteConfirm', {
                    msg: '白方确认开始'
                });
            }
        });

        canvas.addEventListener('click', (e) => {
            let i = Math.floor(e.offsetX / 30),
                j = Math.floor(e.offsetY / 30);
            if (go) {
                if (chess[i][j] == 0 && role == 'black') {
                    socket.emit('blackStep', {
                        msg: '黑方落子',
                        step: [i, j],
                        role: 'black'
                    });
                    go = false;
                } else if (chess[i][j] == 0 && role == 'white') {
                    socket.emit('whiteStep', {
                        msg: '白方落子',
                        step: [i, j],
                        role: 'white'
                    });
                    go = false;
                } else {
                    alert("换个地方走？");
                    return false;
                }
            } else {
                if (role == 'black') {
                    alert("等待白方下棋");
                } else if (role == 'white') {
                    alert("等待黑方下棋");
                }
                return false;
            }
        });
    });

    ai.onclick = function() {
        cover.style.display = 'none';
        menu.style.display = 'none';
        go = true;
        canvas.addEventListener('click', (e) => {
            let i = Math.floor(e.offsetX / 30),
                j = Math.floor(e.offsetY / 30);
            if (bw && go) {
                if (chess[i][j] !== 0) {
                    alert("换个地方走？");
                    return false;
                }
                drawChess(i, j, bw);
                isWin2(i, j, bw);
                bw = !bw;
                if (!bw) {
                    console.log("走的坐标:", i, j);
                    comGo(i, j, bw);
                    bw = !bw;
                }
            } else if (!bw) {
                alert("别……别点啊，不该你出棋");
                return false;
                if (!bw) {
                    comGo(i, j, bw);
                    bw = !bw;
                }
            } else if (!go) {
                alert("游戏已经结束了大哥。。。不点了行吗，接着玩你刷新页面啊");
                return false;
            }
        });
    }

    // 各函数
    // 画棋盘的函数
    function drawChessLine() {
        let canvas = document.querySelector('#canvas'),
            ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 630, 630);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        for (let i = 0; i < 21; i++) {
            ctx.beginPath();
            ctx.moveTo(15 + (30 * i), 15);
            ctx.lineTo(15 + (30 * i), 615);
            ctx.stroke();
            ctx.moveTo(15, 15 + (30 * i));
            ctx.lineTo(615, 15 + (30 * i));
            ctx.stroke();
            ctx.closePath();
        }
    }

    function drawChess(x, y, bw) {    //下棋子的函数
        let canvas = document.querySelector('#canvas'),
            ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(15 + 30 * x, 15 + 30 * y, 12, 0, 2 * Math.PI, false);
        ctx.closePath();

        if (chess[x][y] == 0) {
            if (bw) {
                let gradient = ctx.createRadialGradient(15 + 30 * x + 2, 15 + 30 * y - 2, 10, 15 + 30 * x + 2, 15 + 30 * y - 2, 0);
                gradient.addColorStop(0, "#060606");
                gradient.addColorStop(1, "#555962");
                ctx.fillStyle = gradient;
                ctx.fill();
                chess[x][y] = 1;
            } else {
                let gradient = ctx.createRadialGradient(15 + 30 * x + 2, 15 + 30 * y - 2, 10, 15 + 30 * x + 2, 15 + 30 * y - 2, 0);
                gradient.addColorStop(0, "#ccd3d9");
                gradient.addColorStop(1, "#f3f3f3");
                ctx.fillStyle = gradient;
                ctx.fill();
                chess[x][y] = 2;
            }
        }
    }

    //判断输赢的函数（人机对战）
    function isWin2(x, y, bw) {
        let count1 = 0,   //左右
            count2 = 0,   //上下
            count3 = 0,   //斜线
            count4 = 0;   //反斜线
        if (bw) {   //黑胜
            //左右赢法
            for (var i = x + 1; i < 21; i++) {
                if (chess[i][y] !==  1) {
                    break;
                }
                count1++;
            }
            for (var i = x; i >= 0; i--) {
                if (chess[i][y] !==  1) {
                    break;
                }
                count1++;
            }
            //上下赢法
            for (var i = y + 1; i < 21; i++) {
                if (chess[x][i] !==  1) {
                    break;
                }
                count2++;
            }
            for (var i = y; i >= 0; i--) {
                if (chess[x][i] !==  1) {
                    break;
                }
                count2++;
            }
            //斜线赢法（左下右上）
            for (var i = x + 1, j = y - 1; i < 21 && j >= 0; i++, j--) {
                if (chess[i][j] !== 1) {
                    break;
                }
                count3++;
            }
            for (var i = x, j = y; i >= 0 && j < 21; i--, j++) {
                if (chess[i][j] !== 1) {
                    break;
                }
                count3++;
            }
            //反斜线赢法（左上右下)
            for (var i = x + 1, j = y + 1; i < 21 && j < 21; i++, j++) {
                if (chess[i][j] !== 1) {
                    break;
                }
                count4++;
            }
            for (var i = x, j = y; i >= 0 && j >= 0; i--, j--) {
                if (chess[i][j] !== 1) {
                    break;
                }
                count4++;
            }
            if (count1 == 5 || count2 == 5 || count3 == 5 || count4 == 5) {
                alert("你胜了");
                go = false;
                console.log("黑方胜");
            }
        } else {    //白胜
            //左右赢法
            for (var i = x + 1; i < 21; i++) {
                if (chess[i][y] !==  2) {
                    break;
                }
                count1++;
            }
            for (var i = x; i >= 0; i--) {
                if (chess[i][y] !==  2) {
                    break;
                }
                count1++;
            }
            //上下赢法
            for (var i = y + 1; i < 21; i++) {
                if (chess[x][i] !==  2) {
                    break;
                }
                count2++;
            }
            for (var i = y; i >= 0; i--) {
                if (chess[x][i] !==  2) {
                    break;
                }
                count2++;
            }
            //斜线赢法（左下右上）
            for (var i = x + 1, j = y - 1; i < 21 && j >= 0; i++, j--) {
                if (chess[i][j] !== 2) {
                    break;
                }
                count3++;
            }
            for (var i = x, j = y; i >= 0 && j < 21; i--, j++) {
                if (chess[i][j] !== 2) {
                    break;
                }
                count3++;
            }
            //反斜线赢法（左上右下)
            for (var i = x + 1, j = y + 1; i < 21 && j < 21; i++, j++) {
                if (chess[i][j] !== 2) {
                    break;
                }
                count4++;
            }
            for (var i = x, j = y; i >= 0 && j >= 0; i--, j--) {
                if (chess[i][j] !== 2) {
                    break;
                }
                count4++;
            }
            if (count1 == 5 || count2 == 5 || count3 == 5 || count4 == 5) {
                alert("电脑胜");
                go = false;
                console.log("白方胜");
            }
        }
    }

    //弱智电脑的函数
    function comGo(x, y, bw) {
        let mycount1 = 0,
            mycount2 = 0,
            mycount3 = 0,
            mycount4 = 0,
            myScores = 0,
            comScores = 0;
            mx11 = -1, mx21 = -1, mx31 = -1, mx41 = -1;
            mx12 = -1, mx22 = -1, mx32 = -1, mx42 = -1;
            my11 = -1, my21 = -1, my31 = -1, my41 = -1;
            my12 = -1, my22 = -1, my32 = -1, my42 = -1;
            // cx11, cx21, cx31, cx41;
            // cx12, cx22, cx32, cx42;
            // cy11, cy21, cy31, cy41;
            // cy12, cy22, cy32, cy42;

        //左右
        for (var i = x + 1; i < 21; i++) {
            if (chess[i][y] !==  1) {
                if (chess[i][y] == 2) {
                    break;
                }
                mx11 = i;
                my11 = y;
                break;
            }
            mycount1++;
        }
        for (var i = x; i >= 0; i--) {
            if (chess[i][y] !==  1) {
                if (chess[i][y] == 2) {
                    break;
                }
                mx12 = i;
                my12 = y;
                break;
            }
            mycount1++;
        }
        //上下
        for (var i = y + 1; i < 21; i++) {
            if (chess[x][i] !==  1) {
                if (chess[x][i] == 2) {
                    break;
                }
                mx21 = x;
                my21 = i;
                break;
            }
            mycount2++;
        }
        for (var i = y; i >= 0; i--) {
            if (chess[x][i] !==  1) {
                if (chess[x][i]) {
                    break;
                }
                mx22 = x;
                my22 = i;
                break;
            }
            mycount2++;
        }
        //斜线（左下右上）
        for (var i = x + 1, j = y - 1; i < 21, j >= 0; i++, j--) {
            if (chess[i][j] !== 1) {
                if (chess[i][j]) {
                    break;
                }
                mx31 = i;
                my31 = j;
                break;
            }
            mycount3++;
        }
        for (var i = x, j = y; i >= 0, j < 21; i--, j++) {
            if (chess[i][j] !== 1) {
              if (chess[i][j]) {
                  break;
              }
              mx32 = i;
              my32 = j;
              break;
            }
            mycount3++;
        }
        //反斜线（左上右下)
        for (var i = x + 1, j = y + 1; i < 21, j < 21; i++, j++) {
            if (chess[i][j] !== 1) {
              if (chess[i][j]) {
                  break;
              }
              mx41 = i;
              my41 = j;
              break;
            }
            mycount4++;
        }
        for (var i = x, j = y; i >= 0, j >= 0; i--, j--) {
            if (chess[i][j] !== 1) {
              if (chess[i][j]) {
                  break;
              }
              mx42 = i;
              my42 = j;
              break;
            }
            mycount4++;
        }

        let t = Math.max(mycount1, mycount2, mycount3, mycount4);
        switch (t) {
            case 1: myScores = 100;
                    if (mycount1 == 1) {
                        if (mx11 < 0 && my11 < 0) {
                            drawChess(mx12, my12, bw);
                            isWin2(mx12, my12, bw);
                        } else {
                            drawChess(mx11, my11, bw);
                            isWin2(mx11, my11, bw);
                        }
                    } else if (mycount2 == 1) {
                        if (mx21 < 0 && my21 < 0) {
                            drawChess(mx22, my22, bw);
                            isWin2(mx22, my22, bw);
                        } else {
                            drawChess(mx21, my21, bw);
                            isWin2(mx21, my21, bw);
                        }
                    } else if (mycount3 == 1) {
                        if (mx31 < 0 && my31 < 0) {
                            drawChess(mx32, my32, bw);
                            isWin2(mx32, my32, bw);
                        } else {
                            drawChess(mx31, my31, bw);
                            isWin2(mx31, my31, bw);
                        }
                    } else {
                        if (mx41 < 0 && my41 < 0) {
                            drawChess(mx42, my42, bw);
                            isWin2(mx42, my42, bw);
                        } else {
                            drawChess(mx41, my41, bw);
                            isWin2(mx41, my41, bw);
                        }
                    }
                    break;
            case 2: myScores = 200;
                    if (mycount1 == 2) {
                        if (mx11 < 0 && my11 < 0) {
                            drawChess(mx12, my12, bw);
                            isWin2(mx12, my12, bw);
                        } else {
                            drawChess(mx11, my11, bw);
                            isWin2(mx11, my11, bw);
                        }
                    } else if (mycount2 == 2) {
                        if (mx21 < 0 && my21 < 0) {
                            drawChess(mx22, my22, bw);
                            isWin2(mx22, my22, bw);
                        } else {
                            drawChess(mx21, my21, bw);
                            isWin2(mx21, my21, bw);
                        }
                    } else if (mycount3 == 2) {
                        if (mx31 < 0 && my31 < 0) {
                            drawChess(mx32, my32, bw);
                            isWin2(mx32, my32, bw);
                        } else {
                            drawChess(mx31, my31, bw);
                            isWin2(mx31, my31, bw);
                        }
                    } else {
                        if (mx41 < 0 && my41 < 0) {
                            drawChess(mx42, my42, bw);
                            isWin2(mx42, my42, bw);
                        } else {
                            drawChess(mx41, my41, bw);
                            isWin2(mx41, my41, bw);
                        }
                    }
                    break;
            case 3: myScores = 500;
                    if (mycount1 == 3) {
                        if (mx11 < 0 && my11 < 0) {
                            drawChess(mx12, my12, bw);
                            isWin2(mx12, my12, bw);
                        } else {
                            drawChess(mx11, my11, bw);
                            isWin2(mx11, my11, bw);
                        }
                    } else if (mycount2 == 3) {
                        if (mx21 < 0 && my21 < 0) {
                            drawChess(mx22, my22, bw);
                            isWin2(mx22, my22, bw);
                        } else {
                            drawChess(mx21, my21, bw);
                            isWin2(mx21, my21, bw);
                        }
                    } else if (mycount3 == 3) {
                        if (mx31 < 0 && my31 < 0) {
                            drawChess(mx32, my32, bw);
                            isWin2(mx32, my32, bw);
                        } else {
                            drawChess(mx31, my31, bw);
                            isWin2(mx31, my31, bw);
                        }
                    } else {
                        if (mx41 < 0 && my41 < 0) {
                            drawChess(mx42, my42, bw);
                            isWin2(mx42, my42, bw);
                        } else {
                            drawChess(mx41, my41, bw);
                            isWin2(mx41, my41, bw);
                        }
                    }
                    break;
            case 4: myScores = 1000;
                    if (mycount1 == 4) {
                        if (mx11 < 0 && my11 < 0) {
                            drawChess(mx12, my12, bw);
                            isWin2(mx12, my12, bw);
                        } else {
                            drawChess(mx11, my11, bw);
                            isWin2(mx11, my11, bw);
                        }
                    } else if (mycount2 == 4) {
                        if (mx21 < 0 && my21 < 0) {
                            drawChess(mx22, my22, bw);
                            isWin2(mx22, my22, bw);
                        } else {
                            drawChess(mx21, my21, bw);
                            isWin2(mx21, my21, bw);
                        }
                    } else if (mycount3 == 4) {
                        if (mx31 < 0 && my31 < 0) {
                            drawChess(mx32, my32, bw);
                            isWin2(mx32, my32, bw);
                        } else {
                            drawChess(mx31, my31, bw);
                            isWin2(mx31, my31, bw);
                        }
                    } else {
                        if (mx41 < 0 && my41 < 0) {
                            drawChess(mx42, my42, bw);
                            isWin2(mx42, my42, bw);
                        } else {
                            drawChess(mx41, my41, bw);
                            isWin2(mx41, my41, bw);
                        }
                    }
                    break;
            default: break;
        }
    }
};
