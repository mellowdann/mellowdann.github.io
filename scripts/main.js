const draw = SVG().addTo('body').size('100%', '100%')

const Hex = Honeycomb.extendHex({ size: 10 })
const Grid = Honeycomb.defineGrid(Hex)
// get the corners of a hex (they're the same for all hexes created with the same Hex factory)
const corners = Hex().corners()
// an SVG symbol can be reused
const hexSymbol = draw.symbol()
    // map the corners' positions to a string and create a polygon
    .polygon(corners.map(({ x, y }) => `${x},${y}`))
    .fill('none')
    .stroke({ width: 1, color: '#999' })

// render 10,000 hexes
grid = Grid.rectangle({ width: 50, height: 50 })

grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    draw.use(hexSymbol).translate(x, y)
})


document.addEventListener('click', ({ offsetX, offsetY }) => {
    // convert point to hex (coordinates)
    const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
    // get the actual hex from the grid
    console.log(grid.get(hexCoordinates))
})