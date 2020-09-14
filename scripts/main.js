const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({
    size: 10,
    custom: 'empty',
    start: false,
    end: false
})
const Grid = Honeycomb.defineGrid(Hex)
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
corners = Hex().corners()
// an SVG symbol can be reused
const hexEmpty = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('white')
    .stroke({ width: 1, color: '#999' })
const hexWall = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('black')
    .stroke({ width: 1, color: '#999' })
const hexStart = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('blue')
    .stroke({ width: 1, color: '#999' })
const hexEnd = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('green')
    .stroke({ width: 1, color: '#999' })
const hexSearched = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('purple')
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

document.getElementById("btnSearch").addEventListener("click", function () {
    neighbours = [hex_start]
    window.requestAnimationFrame(searchNeighbours)
});

var searchNeighbours = function () {
    var n = []
    var undefined = []
    var found = false
    for (var i = 0; i < neighbours.length; i++) {
        n = n.concat(grid.neighborsOf(neighbours[i]))
    }
    for (var i = 0; i < n.length; i++) {
        if (typeof n[i] !== 'undefined') {
            if (n[i].end) {
                found = true
            } else if (n[i].custom == 'empty') {
                n[i].custom = 'searched'
                drawHex(n[i])
            } else {
                undefined.push(i)
            }
        } else {
            undefined.push(i)
        }
    }
    console.log(n)
    for (var i = undefined.length - 1; i >= 0; i--) {
        n.splice(undefined[i], 1)
    }
    if (!found) {
        neighbours = n
        window.requestAnimationFrame(searchNeighbours)
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
    console.log("Mousedown", hexCoordinates)
    console.log(offsetX, offsetY)
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
            console.log(hex)
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
    }
}


