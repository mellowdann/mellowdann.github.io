const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({ 
    size: 10,
    custom: 'empty' })
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

// render 10,000 hexes
grid = Grid.rectangle({ width: 50, height: 50 })

grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    draw.use(hexEmpty).translate(x, y)
})

//Start and End Hexes
hex = grid.get([3,45])
hex.custom = 'start'
var { x, y } = hex.toPoint()
draw.use(hexStart).translate(x, y)
hex = grid.get([45,3])
hex.custom = 'end'
var { x, y } = hex.toPoint()
draw.use(hexEnd).translate(x, y)

var mousedown = false
var type = 'none'


document.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    mousedown = true
    const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
    mousedown_hex = grid.get(hexCoordinates)
    const { x, y } = mousedown_hex.toPoint()
    if(mousedown_hex.custom == 'wall'){
        type = 'empty'
        draw.use(hexEmpty).translate(x, y)
    }else if(mousedown_hex.custom == 'empty'){
        type = 'wall'
        draw.use(hexWall).translate(x, y)
    }else if(mousedown_hex.custom == 'start'){
        type = 'start'
    }else if(mousedown_hex.custom == 'end'){
        type = 'end'
    }
    console.log("Mousedown", hexCoordinates)
})

document.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    mousedown = false
    type = 'none'
    mousedown_hex = null
})

document.addEventListener('mouseover', ({ offsetX, offsetY }) => {
    if(mousedown){
        // convert point to hex (coordinates)
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        // get the actual hex from the grid
        hex = grid.get(hexCoordinates)
        if(hex != mousedown_hex){
            var { x, y } = hex.toPoint()
            if(type == 'wall'){
                hex.custom = 'wall'
                draw.use(hexWall).translate(x, y)
            }else if(type == 'empty'){
                hex.custom = 'empty'
                draw.use(hexEmpty).translate(x, y)
            }else if(type == 'start'){
                //new start
                hex.custom = 'start'
                draw.use(hexStart).translate(x, y)
                //remove old start
                var { x, y } = mousedown_hex.toPoint()
                mousedown_hex.custom = 'empty'
                draw.use(hexEmpty).translate(x, y)
                //set old = new
                mousedown_hex = hex
            }else if(type == 'end'){
                //new end
                hex.custom = 'end'
                draw.use(hexEnd).translate(x, y)
                //remove old end
                var { x, y } = mousedown_hex.toPoint()
                mousedown_hex.custom = 'empty'
                draw.use(hexEmpty).translate(x, y)
                //set old = new
                mousedown_hex = hex
            }
            
            console.log(hex)
        }
    }
})




