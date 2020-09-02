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

// render 10,000 hexes
grid = Grid.rectangle({ width: 50, height: 50 })

grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    if(hex.custom == 'empty'){
        draw.use(hexEmpty).translate(x, y)
    } else if(hex.custom == 'wall'){
        draw.use(hexWall).translate(x, y)
    }
    
})

var clicked = false

document.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    clicked = true
})

document.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    clicked = false
})

document.addEventListener('mouseover', ({ offsetX, offsetY }) => {
    if(clicked){
        // convert point to hex (coordinates)
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        // get the actual hex from the grid
        hex = grid.get(hexCoordinates)
        const { x, y } = hex.toPoint()
        if(hex.custom == 'empty'){
            hex.custom = 'wall'
            draw.use(hexWall).translate(x, y)
        } else if(hex.custom == 'wall'){
            hex.custom = 'empty'
            draw.use(hexEmpty).translate(x, y)
        }
        
        console.log(hex)
    }
})




