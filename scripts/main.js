const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({
    size: 10,
    custom: 'empty',
    start: false,
    end: false,
    level: 0
})
const Grid = Honeycomb.defineGrid(Hex)
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
corners = Hex().corners()
// an SVG symbol can be reused
const hexEmpty = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('white')
    .stroke({ width: 1, color: '#999' })
const hexWall = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('black')
    .stroke({ width: 1, color: '#999' })
const hexStart = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('blue')
    .stroke({ width: 1, color: '#999' })
const hexEnd = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('green')
    .stroke({ width: 1, color: '#999' })
const hexSearched = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('purple')
    .stroke({ width: 1, color: '#999' })
const hexPath = draw.symbol()
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('yellow')
    .stroke({ width: 1, color: '#999' })

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
    window.requestAnimationFrame(searchNeighbours)
});

var searchNeighbours = function () {
    var n = []
    var found = false
    //Get all neighbours
    for (var i = 0; i < neighbours.length; i++) {
        n = n.concat(grid.neighborsOf(neighbours[i]))
    }
    //Only unique neighbours
    n = n.filter((value, index, a) => a.indexOf(value) === index);
    //Only empty hexes (no walls), no undefined hexes (out of bounds)
    n = n.filter(function (h) {
        if (typeof h !== 'undefined') {
            return h.custom == 'empty'
        } else {
            return false
        }
    });
    //Update neighbours
    for (var i = 0; i < n.length; i++) {
        if (n[i].end) {
            found = true
        } else {
            n[i].custom = 'searched'
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
            return h.custom == 'searched'
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
        minHex.custom = 'path'
        drawHex(minHex)
        neighbours = [minHex]
        window.requestAnimationFrame(retraceRoute)
    }
};


document.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    mousedown = true
    const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
    mousedown_hex = grid.get(hexCoordinates)
    if (mousedown_hex.start) {
        type = 'start'
    } else if (mousedown_hex.end) {
        type = 'end'
    } else if (mousedown_hex.custom == 'wall') {
        type = 'empty'
        mousedown_hex.custom = 'empty'
        drawHex(mousedown_hex)
    } else if (mousedown_hex.custom == 'empty') {
        type = 'wall'
        mousedown_hex.custom = 'wall'
        drawHex(mousedown_hex)
    }
})

document.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    mousedown = false
    type = 'none'
    mousedown_hex = null
})

document.addEventListener('mouseover', ({ offsetX, offsetY }) => {
    if (mousedown) {
        // convert point to hex (coordinates)
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        // get the actual hex from the grid
        hex = grid.get(hexCoordinates)
        if (hex != mousedown_hex) {
            var { x, y } = hex.toPoint()
            if (type == 'wall') {
                hex.custom = 'wall'
                drawHex(hex)
            } else if (type == 'empty') {
                hex.custom = 'empty'
                drawHex(hex)
            } else if (type == 'start') {
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
    } else if (hex.custom == 'wall') {
        draw.use(hexWall).translate(x, y)
    } else if (hex.custom == 'empty') {
        draw.use(hexEmpty).translate(x, y)
    } else if (hex.custom == 'searched') {
        draw.use(hexSearched).translate(x, y)
    } else if (hex.custom == 'path') {
        draw.use(hexPath).translate(x, y)
    }
}


