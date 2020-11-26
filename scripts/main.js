const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({
    size: 10,//default 10
    path: false,
    obstacle: 'empty',
    slowdown: 0,
    start: false,
    end: false,
    level: 0,
    fscore: Number.MAX_SAFE_INTEGER,
    gscore: 0,
    hscore: 0,
    openSet: false,
    closedSet: false,
    parent: undefined
})
const Grid = Honeycomb.defineGrid(Hex)
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
corners = Hex().corners()
// an SVG symbol can be reused
const hexStart = getColourHex('green')
const hexEnd = getColourHex('green')
const hexWalk = getColourHex('green')

const hexWall = getColourHex('black')

const hexEmpty = getColourHex('#ffffff')
const hexEmptyOpen = getColourHex('#808080')
const hexEmptyClosed = getColourHex('#bfbfbf')
const hexEmptyPath = getColourHex('#bfbfbf', 'red', 1)

const hexSand = getColourHex('#ff8c1a')
const hexSandOpen = getColourHex('#804000')
const hexSandClosed = getColourHex('#ffbf80')
const hexSandPath = getColourHex('#ffbf80', 'red', 1)

const hexWater = getColourHex(' #0066ff')
const hexWaterOpen = getColourHex('#003380')
const hexWaterClosed = getColourHex('#80b3ff')
const hexWaterPath = getColourHex('#80b3ff', 'red', 1)

const hexEnemy = getColourHex('#ff0000')
const hexEnemyOpen = getColourHex('#800000')
const hexEnemyClosed = getColourHex('#ff8080')
const hexEnemyPath = getColourHex('#ff8080', 'red', 1)

//Width 2 causes problem when clearing the search

function getColourHex(fill, border = '#999', width = 1) {
    return draw.symbol()
        .polygon(corners.map(({ x, y }) => `${x},${y}`))
        .fill(fill)
        .stroke({ width: width, color: border })
}

gridsize = 50

// grid = gridsize x gridsize
grid = Grid.rectangle({ width: gridsize, height: gridsize })


grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    draw.use(hexEmpty).translate(x, y)
})

//Start and End Hexes
hex_start = grid.get([0, 0])
hex_end = grid.get([gridsize - 1, gridsize - 1])
hex_start.start = true
hex_start.searched = true
hex_end.end = true
var { x, y } = hex_start.toPoint()
draw.use(hexStart).translate(x, y)
var { x, y } = hex_end.toPoint()
draw.use(hexEnd).translate(x, y)

var mousedown = false
var type = 'none'
var neighbours = []
var level = 0

//astar
var openSet = []
var closedSet = []
var path = []

document.getElementById("btnSearch").addEventListener("click", function () {
    //Astar
    openSet.push(hex_start)
    hex_start.openSet = true
    window.requestAnimationFrame(a_star)


    //Dijkstra
    //Start at hex_start and search for hex_end
    //neighbours = [hex_start]
    //level = 1
    //nextN = []
    //window.requestAnimationFrame(dijkstra)
});

var follow_path = function () {
    hex = path[path.length - 1]
    //Restart search if enemy is found
    if (hex.obstacle == 'enemy') {
        hex.obstacle = 'wall'
        for (var i = 0; i < openSet.length; i++) {
            resetHex(openSet[i])
            drawHex(openSet[i])
        }
        openSet = []
        openSet.push(hex.parent)
        hex.parent.openSet = true
        for (var i = 0; i < closedSet.length; i++) {
            resetHex(closedSet[i])
            drawHex(closedSet[i])
        }
        closedSet = []
        path = []
        window.requestAnimationFrame(a_star)
    } else {
        hex.walk = true
        path.pop()
        drawHex(hex)
        if (path.length > 0) {
            requestAnimationFrame(follow_path);
        }
    }
};

var a_star = function () {
    var minIndex = 0
    for (var i = 0; i < openSet.length; i++) {
        if (openSet[i].fscore < openSet[minIndex].fscore) {
            minIndex = i
        }
    }
    var current = openSet[minIndex]
    if (current === hex_end) {
        //shortest path found
        path = []
        path.push(current)
        current.path = true
        drawHex(current)
        while (current.parent) {
            path.push(current.parent)
            current = current.parent
            current.path = true
            drawHex(current)
        }
        //Actually traverse the path
        requestAnimationFrame(follow_path);
        return
    }

    closedSet.push(current)
    current.closedSet = true
    current.openSet = false
    openSet = openSet.filter(function (h) {
        if (h == current) {
            return false
        } else {
            return true
        }
    });
    drawHex(current)

    var neighbors = grid.neighborsOf(current)
    //Only empty hexes (no walls), no undefined hexes (out of bounds)
    neighbors = neighbors.filter(function (h) {
        if (typeof h == 'undefined') {
            return false
        } else if (h.closedSet) {
            return false
        } else if (h.obstacle == 'wall') {
            return false
        } else {
            return true
        }
    });



    for (var i = 0; i < neighbors.length; i++) {
        var gscore = current.gscore + 1 + neighbors[i].slowdown
        //Better g value?
        if (openSet.includes(neighbors[i])) {
            if (gscore <= neighbors.gscore) {
                neighbors[i].gscore = gscore
                neighbors[i].parent = current
                neighbors[i].hscore = heuristic(neighbors[i], hex_end)
                neighbors[i].fscore = neighbors[i].gscore + neighbors[i].hscore
            }
        } else {
            neighbors[i].gscore = gscore
            neighbors[i].parent = current
            neighbors[i].hscore = heuristic(neighbors[i], hex_end)
            neighbors[i].fscore = neighbors[i].gscore + neighbors[i].hscore
            openSet.push(neighbors[i])
            neighbors[i].openSet = true
            drawHex(neighbors[i])
        }

    }

    
    if (openSet.length > 0) {
        window.requestAnimationFrame(a_star)
    } else {
        alert('No path found')
    }

};

function heuristic(hex1, hex2) {
    //manhattan distance
    return Math.abs(hex1.x - hex2.x) + Math.abs(hex1.y - hex2.y)
}

function resetHex(hex, obstacles = false) {
    hex.path = false
    hex.fscore = Number.MAX_SAFE_INTEGER
    hex.gscore = 0
    hex.hscore = 0
    hex.openSet = false
    hex.closedSet = false
    hex.parent = undefined
    if (obstacles) {
        hex.obstacle = 'empty'
        slowdown = 0
    }
}

document.getElementById("btnClearSearch").addEventListener("click", function () {
    for (var i = 0; i < openSet.length; i++) {
        resetHex(openSet[i])
        drawHex(openSet[i])
    }
    openSet = []
    for (var i = 0; i < closedSet.length; i++) {
        resetHex(closedSet[i])
        drawHex(closedSet[i])
    }
    closedSet = []
});

document.getElementById("btnClearObstacles").addEventListener("click", function () {
    openSet = []
    closedSet = []

    grid.forEach(hex => {
        resetHex(hex, true)
        drawHex(hex)
    })
});

document.getElementById("btnRandomWalls").addEventListener("click", function () {
    grid.forEach(hex => {
        if (Math.random() > 0.7) {
            hex.obstacle = "wall"
            drawHex(hex)
        }
    })
});

var currentObstacle = 'wall'
var currentSlowdown = 0

var clickObstacleType = function (clicked_id) {
    currentObstacle = document.getElementById(clicked_id).value;
    if (currentObstacle == 'sand') {
        currentSlowdown = 1
    } else if (currentObstacle == 'water') {
        currentSlowdown = 3
    } else {
        currentSlowdown = 0
    }
};



var nextN = []
var dijkstra = function () {
    var n = nextN
    nextN = []
    var found = false
    //Get all neighbours
    for (var i = 0; i < neighbours.length; i++) {
        n = n.concat(grid.neighborsOf(neighbours[i]))
    }
    //Only unique neighbours
    n = n.filter((value, index, a) => a.indexOf(value) === index);
    //Only empty hexes (no walls), no undefined hexes (out of bounds)
    n = n.filter(function (h) {
        if (typeof h == 'undefined') {
            return false
        } else if (h.searched) {
            return false
        } else if (h.obstacle == 'wall') {
            return false
        } else if (h.slowdown > 0) {
            h.slowdown--;
            nextN = nextN.concat(h)
            return false
        } else {
            return true
        }
    });
    //Update neighbours
    for (var i = 0; i < n.length; i++) {
        if (n[i].end) {
            found = true
        } else {
            n[i].searched = true
            n[i].level = level
            console.log(n[i])
            drawHex(n[i])
        }
    }
    //Repeat
    if (!found) {
        neighbours = n
        level++
        window.requestAnimationFrame(dijkstra)
    } else {
        //Start at hex_end and work back to hex_start
        neighbours = [hex_end]
        window.requestAnimationFrame(retraceRoute)
    }
};



var retraceRoute = function () {
    //Get all neighbours
    var n = grid.neighborsOf(neighbours[0])
    n = n.filter((value, index, a) => a.indexOf(value) === index);
    //Only empty hexes (no walls), no undefined hexes (out of bounds)
    n = n.filter(function (h) {
        if (typeof h !== 'undefined') {
            return h.searched
        } else {
            return false
        }
    });
    var found = false
    var minValue = Number.POSITIVE_INFINITY
    var minHex
    var temp
    for (var i = 0; i < n.length; i++) {
        temp = n[i]
        if (temp.start) {
            found = true
        }
        if (temp.level < minValue) {
            minValue = temp.level
            minHex = temp
        }
    }
    if (!found) {
        minHex.path = true
        drawHex(minHex)
        neighbours = [minHex]
        window.requestAnimationFrame(retraceRoute)
    }
};

//Get the svg grid element to add event listeners to it
var svg = document.querySelectorAll("svg")[0];

svg.addEventListener('mousedown', ({ offsetX, offsetY }) => {

    mousedown = true
    const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
    mousedown_hex = grid.get(hexCoordinates)
    if (mousedown_hex.start) {
        type = 'start'
    } else if (mousedown_hex.end) {
        type = 'end'
    } else {
        type = currentObstacle
        mousedown_hex.obstacle = currentObstacle
        drawHex(mousedown_hex)
    }
})

svg.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    mousedown = false
    type = 'none'
    mousedown_hex = null
})

svg.addEventListener('mouseover', ({ offsetX, offsetY }) => {
    if (mousedown) {
        // convert point to hex (coordinates)
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        // get the actual hex from the grid
        hex = grid.get(hexCoordinates)
        if (hex != mousedown_hex) {
            var { x, y } = hex.toPoint()
            if (type == 'start') {
                //new start
                hex.start = true
                drawHex(hex)
                //remove old start
                mousedown_hex.start = false
                drawHex(mousedown_hex)
                //keep track of new start
                mousedown_hex = hex
                hex_start = hex
            } else if (type == 'end') {
                //new start
                hex.end = true
                drawHex(hex)
                //remove old start
                mousedown_hex.end = false
                drawHex(mousedown_hex)
                //keep track of new end
                mousedown_hex = hex
                hex_end = hex
            } else if (type != 'none') {
                hex.obstacle = currentObstacle
                hex.slowdown = currentSlowdown
                drawHex(hex)
            }
        }
    }
})

function drawHex(hex) {
    const { x, y } = hex.toPoint()
    if (hex.start) {
        draw.use(hexStart).translate(x, y)
    } else if (hex.end) {
        draw.use(hexEnd).translate(x, y)
    } else if (hex.walk) {
        draw.use(hexWalk).translate(x, y)
    } else if (hex.path) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSandPath).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexWaterPath).translate(x, y)
        } else if (hex.obstacle == 'enemy') {
            draw.use(hexEnemyPath).translate(x, y)
        } else {
            draw.use(hexEmptyPath).translate(x, y)
        }
    } else if (hex.openSet) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSandOpen).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexWaterOpen).translate(x, y)
        } else if (hex.obstacle == 'enemy') {
            draw.use(hexEnemyOpen).translate(x, y)
        } else {
            draw.use(hexEmptyOpen).translate(x, y)
        }
    } else if (hex.closedSet) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSandClosed).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexWaterClosed).translate(x, y)
        } else if (hex.obstacle == 'enemy') {
            draw.use(hexEnemyClosed).translate(x, y)
        } else {
            draw.use(hexEmptyClosed).translate(x, y)
        }
    } else if (hex.obstacle == 'wall') {
        draw.use(hexWall).translate(x, y)
    } else if (hex.obstacle == 'sand') {
        draw.use(hexSand).translate(x, y)
    } else if (hex.obstacle == 'water') {
        draw.use(hexWater).translate(x, y)
    } else if (hex.obstacle == 'enemy') {
        draw.use(hexEnemy).translate(x, y)
    } else if (hex.obstacle == 'empty') {
        draw.use(hexEmpty).translate(x, y)
    }

}


