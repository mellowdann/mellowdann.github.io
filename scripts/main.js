const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({
    size: 10,
    path: false,
    searched: false,
    obstacle: 'empty',
    slowdown: 0,
    start: false,
    end: false,
    level: 0
})
const Grid = Honeycomb.defineGrid(Hex)
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
corners = Hex().corners()
// an SVG symbol can be reused
const hexEmpty = getColourHex('white')
const hexWall = getColourHex('black')
const hexSand = getColourHex('BurlyWood')
const hexWater = getColourHex('cadetblue')
const hexStart = getColourHex('green')
const hexEnd = getColourHex('green')
const hexSearched = getColourHex('silver')
const hexSearchedSand = getColourHex('coral')
const hexSearchedWater = getColourHex('steelblue')
const hexPath = getColourHex('silver', 'red', 2)
const hexPathSand = getColourHex('coral', 'red', 2)
const hexPathWater = getColourHex('steelblue', 'red', 2)

//Width 2 causes problem when clearing the search

function getColourHex(fill, border='#999', width=1) {
    return draw.symbol()
        .polygon(corners.map(({ x, y }) => `${x},${y}`))
        .fill(fill)
        .stroke({ width: width, color: border })
}

// render 10,000 hexes
grid = Grid.rectangle({ width: 50, height: 50 })

grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    draw.use(hexEmpty).translate(x, y)
})

//Start and End Hexes
hex_start = grid.get([3, 45])
hex_end = grid.get([45, 3])
hex_start.start = true
hex_end.end = true
var { x, y } = hex_start.toPoint()
draw.use(hexStart).translate(x, y)
var { x, y } = hex_end.toPoint()
draw.use(hexEnd).translate(x, y)

var mousedown = false
var type = 'none'
var neighbours = []
var level = 0

document.getElementById("btnSearch").addEventListener("click", function () {
    //Start at hex_start and search for hex_end
    neighbours = [hex_start]
    level++
    nextN = []
    window.requestAnimationFrame(searchNeighbours)
});

document.getElementById("btnClearSearch").addEventListener("click", function () {
    grid.forEach(hex => {
        if (hex.searched) {
            hex.path = false
            hex.searched = false
            drawHex(hex)
            if (hex.obstacle == 'sand') {
                hex.slowdown = 1
            } else if (hex.obstacle == 'water') {
                hex.slowdown = 3
            }
        }
    })
});

document.getElementById("btnClearObstacles").addEventListener("click", function () {
    grid.forEach(hex => {
        hex.path = false
        hex.searched = false
        hex.obstacle = 'empty'
        hex.slowdown = 0
        drawHex(hex)
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

var searchNeighbours = function () {
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
            drawHex(n[i])
        }
    }
    //Repeat
    if (!found) {
        neighbours = n
        level++
        window.requestAnimationFrame(searchNeighbours)
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
    } else if (hex.path) {
        if (hex.obstacle == 'sand') {
            draw.use(hexPathSand).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexPathWater).translate(x, y)
        } else {
            draw.use(hexPath).translate(x, y)
        }
    } else if (hex.searched) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSearchedSand).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexSearchedWater).translate(x, y)
        } else {
            draw.use(hexSearched).translate(x, y)
        }
    } else if (hex.obstacle == 'wall') {
        draw.use(hexWall).translate(x, y)
    } else if (hex.obstacle == 'sand') {
        draw.use(hexSand).translate(x, y)
    } else if (hex.obstacle == 'water') {
        draw.use(hexWater).translate(x, y)
    } else if (hex.obstacle == 'empty') {
        draw.use(hexEmpty).translate(x, y)
    }

}


