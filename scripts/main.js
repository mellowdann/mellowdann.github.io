const draw = SVG().addTo('body').size('100%', '100%')

var algorithm = "select"
var animation = true
var searched = false
var currentObstacle = 'wall'
var currentSlowdown = 0
const testUrl = 'https://raw.githubusercontent.com/mellowdann/mellowdann.github.io/master/test-configurations.txt'
var testList = null
var testIndex = -1

//get the gridWidth and gridSize from the saved grid
if (localStorage.getItem("load") == "true") {
    var numHexes = localStorage.getItem("grid").length
    gridWidth = Math.sqrt(numHexes)
} else {
    gridWidth = 40
}
//gridSize: 10 or 20 hexes = size20; 30 hexes = size15; 40 or 50 hexes = size10;
gridSize = gridWidth < 30 ? 20 : gridWidth == 30 ? 15 : 10

const Hex = Honeycomb.extendHex({
    size: gridSize,//default 10
    path: false,
    obstacle: 'empty',
    slowdown: 0,
    start: false,
    end: false,
    level: 0,
    f: Infinity,
    g: 0,
    rhs: 0,
    k1: 0,
    k2: 0,
    h: 0,
    robot: undefined,
    openSet: false,
    closedSet: false,
    parent: undefined,
    unit: undefined,
    tag: undefined,
    b: undefined
});

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

const hexKnownHostile = getColourHex('#ff0000')
const hexUnknownHostile = getColourHex('#ff8080')

const hexKnownFriendly = getColourHex('#00ff00')
const hexUnknownFriendly = getColourHex('#80ff80')

const hexEnemyClosed = getColourHex('#ff8080')
const hexEnemyPath = getColourHex('#ff8080', 'red', 1)

//Width 2 causes problem when clearing the search

function getColourHex(fill, border = '#999', width = 1) {
    return draw.symbol()
        .polygon(corners.map(({ x, y }) => `${x},${y}`))
        .fill(fill)
        .stroke({ width: width, color: border })
}





// grid = gridWidth x gridWidth
grid = Grid.rectangle({ width: gridWidth, height: gridWidth })


grid.forEach(hex => {
    const { x, y } = hex.toPoint()
    // use hexSymbol and set its position for each hex
    draw.use(hexEmpty).translate(x, y)
})

readListOfTests()

//Start and End Hexes
hex_start = grid.get([0, 0])
hex_end = grid.get([gridWidth - 1, gridWidth - 1])
hex_start.start = true
hex_start.searched = true
hex_end.end = true
var { x, y } = hex_start.toPoint()
draw.use(hexStart).translate(x, y)
var { x, y } = hex_end.toPoint()
draw.use(hexEnd).translate(x, y)

var mousedown = false
var type = 'none'
var level = 0

//astar
var openSet = []
var closedSet = []
var path = []
var walk = []
//unknown and known hostile and friendly
var knownHostile = []
var knownHostileAdded = 0
var knownFriendly = []
var knownFriendlyAdded = 0
var originallyUnknown = []

var time0 = 0
var pathlength = 0

if (localStorage.getItem("load") == "true") {
    loadState(localStorage.getItem("grid"))
}
if (localStorage.getItem("loadOptions") == "true") {
    console.log("Algorithm: ", localStorage.getItem("algorithm"))
    console.log("obstacle: ", localStorage.getItem("obstacle"))
    console.log("animation: ", localStorage.getItem("animation"))
    loadOptions(localStorage.getItem("algorithm"),
        localStorage.getItem("obstacle"),
        localStorage.getItem("animation"))
} else {
    localStorage.setItem("loadOptions", "true")
}

grid.forEach(hex => {
    resetHex(hex)
    hex.tag = 'NEW'
})


function loadOptions(alg, obs, ani) {
    document.getElementById("ddAlgorithm").value = alg
    algorithm = alg
    var obstacleID = "rdo" + obs.charAt(0).toUpperCase() + obs.slice(1)
    document.getElementById(obstacleID).checked = true
    assignCurrentObstacle(obs)
    if (ani == "true") {
        document.getElementById("rdoAnimation").checked = true
        animation = true
    } else {
        document.getElementById("rdoNoAnimation").checked = true
        animation = false
    }
}


function saveState() {
    var hexList = ""
    var obstacle = ""
    var num_hexes = grid.length
    for (var i = 0; i < num_hexes; i++) {
        if (grid[i] == hex_start) {
            hexList += "8"
        } else if (grid[i] == hex_end) {
            hexList += "9"
        } else {
            obstacle = grid[i].obstacle
            if (obstacle == 'empty') {
                hexList += "0"
            } else if (obstacle == 'wall') {
                hexList += "1"
            } else if (obstacle == 'sand') {
                hexList += "2"
            } else if (obstacle == 'water') {
                hexList += "3"
            } else if (obstacle == 'unknownHostile') {
                hexList += "4"
            } else if (obstacle == 'knownHostile') {
                hexList += "5"
            } else if (obstacle == 'unknownFriendly') {
                hexList += "6"
            } else if (obstacle == 'knownFriendly') {
                hexList += "7"
            }
        }
    }
    localStorage.setItem("grid", hexList)
    localStorage.setItem("load", "true")
    console.log(hexList)
}

function loadState(hexList) {
    var hexArray = hexList.split("").map(x => +x)
    var num_hexes = hexList.length
    for (var i = 0; i < num_hexes; i++) {
        resetHex(grid[i])
        if (hexArray[i] == "8") {
            hex_start.start = false
            drawHex(hex_start)
            grid[i].start = true
            hex_start = grid[i]
        } else if (hexArray[i] == "9") {
            hex_end.end = false
            drawHex(hex_end)
            grid[i].end = true
            hex_end = grid[i]
        } else if (hexArray[i] == "0") {
            grid[i].obstacle = 'empty'
        } else if (hexArray[i] == "1") {
            grid[i].obstacle = 'wall'
            grid[i].slowdown = 10000
        } else if (hexArray[i] == "2") {
            grid[i].obstacle = 'sand'
            grid[i].slowdown = 1
        } else if (hexArray[i] == "3") {
            grid[i].obstacle = 'water'
            grid[i].slowdown = 3
        } else if (hexArray[i] == "4") {
            grid[i].obstacle = 'unknownHostile'
        } else if (hexArray[i] == "5") {
            grid[i].obstacle = 'knownHostile'
            grid[i].slowdown = 10000
        } else if (hexArray[i] == "6") {
            grid[i].obstacle = 'unknownFriendly'
        } else if (hexArray[i] == "7") {
            grid[i].obstacle = 'knownFriendly'
        }
        drawHex(grid[i])
    }
}

document.getElementById("btnSearch").addEventListener("click", function () {
    if (!searched) {
        saveState()
        searched = true
        time0 = new Date().getTime()
        pathlength = 0
        hex_end.obstacle = 'empty'
        hex_start.obstacle = 'empty'
        if (algorithm == 'a*') {
            //Astar
            openSet.push(hex_start)
            hex_start.openSet = true
            if (animation) {
                window.requestAnimationFrame(a_star)
            } else {
                a_star()
            }
        } else if (algorithm == 'dijkstra') {
            //Dijkstra
            openSet.push(hex_start)
            hex_start.openSet = true
            if (animation) {
                window.requestAnimationFrame(a_star) // the heuristic is removed
            } else {
                a_star()
            }
        } else if (algorithm == "lpa*") {
            //Initialize
            //all vertices g and rhs are = infinity from earlier loop
            hex_start.rhs = 0
            calculateKey(hex_start)
            calculateKey(hex_end)
            addVertexToQueue(openSet, hex_start)
            //End of initialize
            if (animation) {
                window.requestAnimationFrame(computeShortestPath)
            } else {
                computeShortestPath()
            }

        } else if (algorithm == 'd*') {
            S = hex_start
            G = hex_end
            //all vertices start with tag = 'NEW'
            d_current = 0
            r_current = hex_start
            d_star_insert(G, 0)
            //process state
            if (animation) {
                window.requestAnimationFrame(d_star_process_state)
            } else {
                d_star_process_state()
            }
        } else if (algorithm == 'd*lite') {
            S = hex_start
            G = hex_end
            k_m = 0
            last_S = S
            //all vertices start with rhs = g = infinity
            G.rhs = 0
            d_lite_calculateKey(S)
            d_lite_calculateKey(G)
            addVertexToQueue(openSet, G)
            //End of initialize
            path.push(S)
            walk.push(S)
            if (animation) {
                window.requestAnimationFrame(d_lite_computeShortestPath)
            } else {
                d_lite_computeShortestPath()
            }
        }
    }
});

var k_m = 0
var last_S = S
var vertexExpansions = 0

function d_lite_calculateKey(vertex) {
    vertex.k2 = Math.min(vertex.g, vertex.rhs)
    vertex.k1 = vertex.k2 + heuristic(S, vertex) + k_m
}

var d_lite_computeShortestPath = function () {
    if (d_lite_checkLoopConstraints()) {
        var vertex = openSet.shift() // Get index 0 from the priority queue
        vertex.openSet = false
        vertex.closedSet = true
        var k_old = [vertex.k1, vertex.k2]
        d_lite_calculateKey(vertex)
        var k_new = [vertex.k1, vertex.k2]
        if (d_star_less(k_old, k_new)) {
            //update vertex in queue
            addVertexToQueue(openSet, vertex) //using k_new
        } else if (vertex.g > vertex.rhs) {
            vertexExpansions++
            vertex.g = vertex.rhs
            //update all predecessors
            var neighbours = filter_neighbours(vertex)
            for (var i = 0; i < neighbours.length; i++) {
                if (neighbours[i] != G)
                    neighbours[i].rhs = Math.min(neighbours[i].rhs, neighbours[i].slowdown + 1 + vertex.g)
                d_lite_updateVertex(neighbours[i])
            }
        } else {
            vertexExpansions++
            var g_old = vertex.g
            vertex.g = Infinity
            var neighbours = filter_neighbours(vertex)
            neighbours.push(vertex)
            for (var i = 0; i < neighbours.length; i++) {
                if (neighbours[i].rhs == neighbours[i].slowdown + 1 + g_old) {
                    if (neighbours[i] != G) {
                        var min_rhs = Infinity
                        //get all neighbours of neighbour i
                        var neigh = filter_neighbours(neighbours[i])
                        for (var x = 0; x < neigh.length; x++) {
                            if (neighbours[i].slowdown + 1 + neigh[x].g < min_rhs)
                                min_rhs = neighbours[i].slowdown + 1 + neigh[x].g
                        }
                        neighbours[i].rhs = min_rhs
                    }
                    d_lite_updateVertex(vertex)
                }
            }
        }
        drawHex(vertex)
        if (animation) {
            window.requestAnimationFrame(d_lite_computeShortestPath)
        } else {
            d_lite_computeShortestPath()
        }
    }
    else {
        if (animation) {
            window.requestAnimationFrame(d_lite_main)
        } else {
            d_lite_main()
        }
    }
}

var d_lite_main = function () {
    var changes = []
    if (S != G) {
        if (S.x == 3 && S.y == 2) {
            var stop = true
        }
        var neighbours = filter_neighbours(S)
        for (var i = 0; i < neighbours.length; i++) {
            if (neighbours[i].obstacle == 'unknownHostile') {
                changes.push(neighbours[i])
            }
        }
        if (changes.length > 0) {
            path = []
            path.push(S)
            k_m = k_m + heuristic(last_S, S)
            last_S = S
            for (var i = 0; i < changes.length; i++) {
                changes[i].obstacle = 'knownHostile'
                changes[i].slowdown = 10000
                var neigh = filter_neighbours(changes[i])
                var min_rhs = Infinity
                for (var x = 0; x < neigh.length; x++) {
                    if (min_rhs > changes[i].slowdown + 1 + neigh[x].g) {
                        min_rhs = changes[i].slowdown + 1 + neigh[x].g
                    }
                }
                changes[i].rhs = min_rhs
                d_lite_updateVertex(changes[i])
                drawHex(changes[i])
                log('changed', changes[i])
            }
            if (animation) {
                window.requestAnimationFrame(d_lite_computeShortestPath)
            } else {
                d_lite_computeShortestPath()
            }
        } else {
            var min_g = Infinity
            var new_S = null
            for (var i = 0; i < neighbours.length; i++) {
                if (min_g > neighbours[i].g && !path.includes(neighbours[i])) {
                    min_g = neighbours[i].g
                    new_S = neighbours[i]
                }
            }
            S = new_S
            S.walk = true
            walk.push(S)
            path.push(S)
            drawHex(S)
            if (animation) {
                window.requestAnimationFrame(d_lite_main)
            } else {
                d_lite_main()
            }
        }
    } else if (S.rhs == Infinity) {
        console.log('NO-PATH!')
    } else {
        //Done
        var time1 = new Date().getTime()
        console.log("Time taken: ", time1 - time0)
        console.log("Path length: ", walk.length)
        console.log(walk)
    }
}

function d_lite_checkLoopConstraints() {
    d_lite_calculateKey(S)
    if (openSet.length > 0) {
        if (((openSet[0].k1 < S.k1) || ((openSet[0].k1 == S.k1) && (openSet[0].k2 < S.k2))) || (S.rhs > S.g)) {
            return true
        }
    }
    return false
}

function d_lite_updateVertex(vertex) {
    if (vertex.openSet)
        removeFromQueue(openSet, vertex)
    if (vertex.g != vertex.rhs) {
        d_lite_calculateKey(vertex)
        addVertexToQueue(openSet, vertex)
    }
    drawHex(vertex)
}


var r_current = hex_start // robot position
var d_current = 0

var movecount = 0
var S;
var R;
var G;

var d_star_move = function () {
    if (R != G) {
        var neighbours = filter_neighbours(R)
        var changes = []
        for (var i = 0; i < neighbours.length; i++) {
            var Y = neighbours[i]
            if (Y.obstacle == 'unknownHostile')
                changes.push(Y)
        }
        if (r_current != R) {
            d_current = d_current + d_star_gval(R, r_current)
            r_current = R
        }
        if (changes.length > 0) {
            for (var i = 0; i < changes.length; i++)
                val = d_star_modify_cost(changes[i], R, 10000)
            if (animation) {
                window.requestAnimationFrame(d_star_process_state)
            } else {
                d_star_process_state()
            }
        } else {
            R.walk = true
            walk.push(R)
            drawHex(R)
            R = R.b
            if (animation) {
                window.requestAnimationFrame(d_star_move)
            } else {
                d_star_move()
            }
        }
    } else {
        R.walk = true
        walk.push(R)
        drawHex(R)
        //Done
        var time1 = new Date().getTime()
        console.log("Time taken: ", time1 - time0)
        console.log("Path length: ", walk.length)
        console.log(walk)
    }
}

function d_star_modify_cost(X, Y, cval) {
    //c(X,Y) = cval
    X.obstacle = 'knownHostile'
    X.slowdown = cval
    if (X.tag == 'CLOSED')
        d_star_insert(X, X.h)
    return d_star_min_val()
}

var update_list = []
var countRepeats = 0
var count = 0;
var moving = false

var d_star_process_state = function () {
    var X = d_star_min_state()
    if (X == null)
        return null
    update_list.push(X)
    var val = [X.f, X.k1]
    var kval = X.k1
    d_star_delete_vertex(X)
    var neighbours = filter_neighbours(X)
    if (kval < X.h) {
        for (var i = 0; i < neighbours.length; i++) {
            var Y = neighbours[i]
            if (Y.tag != 'NEW' && d_star_lessq(d_star_cost(Y), val) && X.h > Y.h + Y.slowdown + 1) {
                X.b = Y
                X.h = Y.h + Y.slowdown + 1
            }
        }
    }
    if (kval == X.h) {
        for (var i = 0; i < neighbours.length; i++) {
            var Y = neighbours[i]
            if (Y.tag == 'NEW' ||
                (Y.b == X && Y.h != X.h + X.slowdown + 1) ||
                (Y.b != X && Y.h > X.h + X.slowdown + 1)) {
                Y.b = X
                d_star_insert(Y, X.h + X.slowdown + 1)
            }
        }
    } else {
        for (var i = 0; i < neighbours.length; i++) {
            var Y = neighbours[i]
            if (Y.tag == 'NEW' ||
                (Y.b == X && Y.h != X.h + X.slowdown + 1)) {
                Y.b = X
                d_star_insert(Y, X.h + X.slowdown + 1)
            } else if (Y.b != X && Y.h > X.h + X.slowdown + 1 && X.tag == 'CLOSED') {
                Y.b = X
                d_star_insert(Y, X.h + X.slowdown + 1)
                d_star_insert(X, X.h)
            } else if (Y.b != X && X.h > Y.h + Y.slowdown + 1 && Y.tag == 'CLOSED' && d_star_less(val, d_star_cost(Y))) {
                d_star_insert(Y, Y.h)
            }
        }
    }
    count++
    var val = d_star_min_val()
    if (moving) {//recalculating path
        if (val != null && d_star_less(val, d_star_cost(R))) {
            if (animation) {
                window.requestAnimationFrame(d_star_process_state)
            } else {
                d_star_process_state()
            }
        } else {
            R.walk = true
            walk.push(R)
            drawHex(R)
            R = R.b
            if (animation) {
                window.requestAnimationFrame(d_star_move)
            } else {
                d_star_move()
            }
        }
    } else {//initial path finding
        if (S.tag != 'CLOSED' && val != null) {
            if (animation) {
                window.requestAnimationFrame(d_star_process_state)
            } else {
                d_star_process_state()
            }
        } else if (S.tag == 'NEW') {
            console.log('NO-PATH!')
        } else {
            R = S
            moving = true
            if (animation) {
                window.requestAnimationFrame(d_star_move)
            } else {
                d_star_move()
            }
        }
    }
}

function d_star_gval(X, Y) {
    return heuristic(X, Y)
}

function d_star_min_val() {
    var X = d_star_min_state()
    if (X == null)
        return null
    else
        return [X.f, X.k1]
}

function d_star_min_state() {
    var X = d_star_get_state()
    while (X != null) {
        if (X.robot != r_current) {
            var h_new = X.h
            X.h = X.k1
            d_star_delete_vertex(X)
            d_star_insert(X, h_new)
        } else
            return X
        X = d_star_get_state()
    }
    return null
}

function d_star_insert(X, h_new) {
    if (X.tag == 'NEW') {
        X.k1 = h_new
    } else {
        if (X.tag == 'OPEN') {
            X.k1 = Math.min(X.k1, h_new)
            d_star_delete_vertex(X)
        } else {
            X.k1 = Math.min(X.k1, h_new)
        }
    }
    X.h = h_new
    X.robot = r_current
    X.f = X.k1 + d_star_gval(X, r_current)
    X.fb = X.f + d_current
    d_star_delete_vertex(X)
    d_star_put_vertex(X)
}

function d_star_cost(X) {
    var f = X.h + d_star_gval(X, r_current)
    return [f, X.h]
}

function d_star_lessq(a, b) {
    if (a[0] < b[0])
        return true
    else if (a[0] == b[0])
        if (a[1] <= b[1])
            return true
    return false
}

function d_star_less(a, b) {
    if (a[0] < b[0])
        return true
    else if (a[0] == b[0])
        if (a[1] < b[1])
            return true
    return false
}

function d_star_get_state() {
    return openSet[0]
}

//d* - remove vertex from open list and set vertex.tag = closed
function d_star_delete_vertex(vertex) {
    vertex.tag = "CLOSED"
    vertex.openSet = false
    vertex.closedSet = true
    var len = openSet.length;
    //remove vertex from the queue, if it exists
    for (var i = len - 1; i >= 0; i--) {
        if (openSet[i].x == vertex.x) {
            if (openSet[i].y == vertex.y) {
                openSet.splice(i, 1);
            }
        }
    }
    drawHex(vertex)
}

//d* - set vertex.tag = Open and insert vertex on open list according to the key
function d_star_put_vertex(vertex) {
    len = openSet.length;
    for (let i = 0; i < len; i++) {
        if ((vertex.fb < openSet[i].fb) || (vertex.fb == openSet[i].fb && vertex.f < openSet[i].f) ||
            (vertex.fb == openSet[i].fb && vertex.f == openSet[i].f && vertex.k1 < openSet[i].k1)) {
            openSet.splice(i, 0, vertex)
            vertex.openSet = true
            vertex.closedSet = false
            vertex.newSet = false
            drawHex(vertex)
            return
        }
    }
    //if length == 0 or the vertex is not better than any of the previous vertices
    openSet.push(vertex)
    vertex.tag = 'OPEN'
    vertex.openSet = true
    vertex.closedSet = false
    vertex.newSet = false
    drawHex(vertex)
}

function print_grid(name) {
    grid.forEach(hex => {
        log(name, hex)
    });
}

function log(name, vertex) {
    if (vertex.b != null)
        console.log('...' + name, "(" + vertex.x + ',' + vertex.y + ")", 'g:', vertex.g, 'rhs:', vertex.rhs)
    else
        console.log('...' + name, "(" + vertex.x + ',' + vertex.y + ")", 'g:', vertex.g, 'rhs:', vertex.rhs)
}

function log_openSet(set) {
    for (var i = 0; i < set.length; i++) {
        log('openSet:', openSet[i])
    }
}



var backtrack_goal = hex_start
//lpa*
var backtrack_path = function () {
    path = []
    var current = hex_end
    path.push(current)
    while (current != backtrack_goal) {
        var neighbours = filter_neighbours(current)
        var min_g = Infinity
        for (var i = 0; i < neighbours.length; i++) {
            if (neighbours[i].g < min_g) {
                min_g = neighbours[i].g
                current = neighbours[i]
            }
        }
        path.push(current)
        current.path = true
        drawHex(current)
    }
    if (animation) {
        window.requestAnimationFrame(follow_path)
    } else {
        follow_path()
    }
}


//lpa*
function calculateKey(vertex) {
    vertex.k2 = Math.min(vertex.g, vertex.rhs)
    vertex.k1 = vertex.k2 + vertex.h
}

//lpa*
function updateVertex(vertex) {
    if (vertex != hex_start && vertex != backtrack_goal) {
        var neighbours = filter_neighbours(vertex)
        var min_rhs = Infinity
        var temp_rhs = Infinity
        for (var i = 0; i < neighbours.length; i++) {
            // distance to neighbour + cost to move to current vertex
            temp_rhs = neighbours[i].g + vertex.slowdown + 1
            if (temp_rhs < min_rhs) {
                min_rhs = temp_rhs
            }
        }
        vertex.rhs = min_rhs
    }
    //remove from priority queue
    removeFromQueue(openSet, vertex)
    if (vertex.g != vertex.rhs) {
        calculateKey(vertex)
        //add to priprity queue
        addVertexToQueue(openSet, vertex)
    } else {
        vertex.closedSet = true
    }
    drawHex(vertex)
}

function filter_neighbours(vertex) {
    var neighbours = grid.neighborsOf(vertex)
    //Only empty hexes (no walls), no undefined hexes (out of bounds)
    neighbours = neighbours.filter(function (h) {
        if (typeof h == 'undefined') {
            return false
        } else if (h.closedSet && (algorithm == 'a*' || algorithm == 'dijkstra')) {
            return false
        } else if (h.obstacle == 'wall') {
            return false
        } else if (h.obstacle == 'knownHostile' && algorithm != 'd*') {
            return false
        } else {
            return true
        }
    });
    return neighbours
}

var count = 0;
//lpa*
var computeShortestPath = function () {
    if (checkLoopConstraints()) {
        var vertex = openSet.shift() // Get index 0 from the priority queue
        vertex.openSet = false
        if (vertex.g > vertex.rhs) {
            vertex.g = vertex.rhs
            //update all predecessors
            var neighbours = filter_neighbours(vertex)
            for (var i = 0; i < neighbours.length; i++) {
                updateVertex(neighbours[i])
            }
        } else {
            vertex.g = Infinity
            //update all predecessors
            var neighbours = filter_neighbours(vertex)
            for (var i = 0; i < neighbours.length; i++) {
                updateVertex(neighbours[i])
            }
            //update self
            updateVertex(vertex)
        }
        if (animation) {
            window.requestAnimationFrame(computeShortestPath)
        } else {
            computeShortestPath()
        }
    }
    else {
        if (animation) {
            window.requestAnimationFrame(backtrack_path)
        } else {
            backtrack_path()
        }
    }
}

//lpa* - used in compute Shortest Path
function checkLoopConstraints() {
    calculateKey(hex_end)
    if (openSet.length > 0) {
        if (((openSet[0].k1 < hex_end.k1) || ((openSet[0].k1 == hex_end.k1) && (openSet[0].k2 < hex_end.k2)))
            || (hex_end.g != hex_end.rhs)) {
            return true
        }
    }
    return false
}

//lpa* - add to priority queue
function addVertexToQueue(queue, vertex) {
    var len = queue.length;
    for (let i = 0; i < len; i++) {
        if ((vertex.k1 < queue[i].k1) || ((vertex.k1 == queue[i].k1) && (vertex.k2 < queue[i].k2))) {
            queue.splice(i, 0, vertex)
            vertex.openSet = true
            vertex.closedSet = false
            return
        }
    }
    //if length == 0 or the vertex is not better than any of the previous vertices
    queue.push(vertex)
    vertex.openSet = true
    vertex.closedSet = false
}

//lpa* - remove from priority queue
function removeFromQueue(queue, vertex) {
    for (var i = queue.length - 1; i >= 0; i--) {
        if (queue[i].x == vertex.x) {
            if (queue[i].y == vertex.y) {
                queue.splice(i, 1);
                vertex.openSet = false
                vertex.closedSet = true
            }
        }
    }
}

var follow_path = function () {
    //print_grid('follow - start')
    hex = path.pop()
    //Restart search if enemy is found
    if (hex.obstacle == 'unknownHostile') {
        hex.obstacle = 'knownHostile'
        hex.closedSet = false
        hex.openSet = false
        knownHostile.push(hex)
        knownHostileAdded++
        originallyUnknown.push(hex)
        //Adjust walk so last hex is not duplicated
        walk.pop()
        pathlength--
        drawHex(hex)
        if (algorithm == 'a*' || algorithm == 'dijkstra') {
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
            if (animation) {
                window.requestAnimationFrame(a_star)
            } else {
                a_star()
            }
        } else if (algorithm == 'lpa*') {
            //edge cost changed = true
            path = []
            hex.path = false
            hex.rhs = Infinity
            hex.g = Infinity
            var neighbours = filter_neighbours(hex)
            for (var i = 0; i < neighbours.length; i++) {
                updateVertex(neighbours[i])
            }
            var previous_hex = hex.parent
            previous_hex.rhs = 0
            previous_hex.g = 0
            neighbours = filter_neighbours(previous_hex)
            for (var i = 0; i < neighbours.length; i++) {
                updateVertex(neighbours[i])
            }
            if (animation) {
                window.requestAnimationFrame(computeShortestPath)
            } else {
                computeShortestPath()
            }
        } else if (algorithm == 'd*') {
            console.log('before')
            log_openSet(openSet)
            print_grid('before')
            path = []
            modify_cost(hex, 10000)
            var neighbours = filter_neighbours(hex)
            for (var i = 0; i < neighbours.length; i++) {
                neighbours[i].tag = "OPEN"
                insert(neighbours[i], neighbours[i].h)
            }
            console.log('after insert')
            log_openSet(openSet)
            print_grid('after')
            if (animation) {
                window.requestAnimationFrame(process_state)
            } else {
                process_state()
            }
        }
    } else {
        backtrack_goal = hex
        if (hex.obstacle == 'unknownFriendly') {
            hex.obstacle = 'knownFriendly'
            knownFriendly.push(hex)
            knownFriendlyAdded++
            originallyUnknown.push(hex)
        }
        hex.walk = true
        pathlength++
        walk.push(hex)
        drawHex(hex)
        if (path.length > 0) {
            path[path.length - 1].parent = hex
            if (animation) {
                window.requestAnimationFrame(follow_path)
            } else {
                follow_path()
            }
        } else {
            //Done
            var time1 = new Date().getTime()
            console.log("Time taken: ", time1 - time0)
            console.log("Path length: ", pathlength)
            console.log(walk)
        }
    }
};

var a_star = function () {
    var minIndex = 0
    for (var i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[minIndex].f) {
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
        if (animation) {
            window.requestAnimationFrame(follow_path)
        } else {
            follow_path()
        }
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

    var neighbours = filter_neighbours(current)

    for (var i = 0; i < neighbours.length; i++) {
        var g = current.g + 1 + neighbours[i].slowdown
        //Better g value?
        if (openSet.includes(neighbours[i])) {
            if (g <= neighbours[i].g) {
                neighbours[i].g = g
                neighbours[i].parent = current
                if (algorithm == 'a*') {
                    neighbours[i].h = heuristic(neighbours[i], hex_end)
                } else { // dijkstra
                    neighbours[i].h = 0
                }
                neighbours[i].f = neighbours[i].g + neighbours[i].h
            }
        } else {
            neighbours[i].g = g
            neighbours[i].parent = current
            //heuristic value in h is already set
            //in dijkstra h = 0
            //in a* h = heuristic(hex, goal)
            neighbours[i].f = neighbours[i].g + neighbours[i].h
            openSet.push(neighbours[i])
            neighbours[i].openSet = true
            drawHex(neighbours[i])
        }

    }


    if (openSet.length > 0) {
        if (animation) {
            window.requestAnimationFrame(a_star)
        } else {
            a_star()
        }
    } else {
        alert('No path found')
    }

};

function heuristic(hex1, hex2) {
    var p1 = hex1.cube()
    var p2 = hex2.cube()
    return Math.max(Math.abs(p1.q - p2.q), Math.abs(p1.r - p2.r), Math.abs(p1.s - p2.s))
}

function resetHex(hex, obstacles = false, walk = false) {
    hex.path = false
    hex.openSet = false
    hex.closedSet = false
    hex.parent = undefined
    if (obstacles) {
        hex.obstacle = 'empty'
        slowdown = 0
    }
    if (walk) {
        hex.walk = false
    }
    resetStats(hex)
}

function resetStats(hex) {
    hex.f = Infinity
    hex.rhs = Infinity
    if (algorithm == "a*") {
        hex.g = 0
        hex.h = heuristic(hex, hex_end)
    } else if (algorithm == "lpa*") {
        hex.g = Infinity
        hex.h = heuristic(hex, hex_end)
    } else if (algorithm == 'dijkstra') {
        hex.h = 0
    } else if (algorithm == 'd*' || algorithm == 'd*lite') {
        hex.g = Infinity
    }
}

document.getElementById("btnClearSearch").addEventListener("click", function () {
    if (!searched) {
        saveState()
    }
    location.reload()
});

document.getElementById("btnClearObstacles").addEventListener("click", function () {
    localStorage.setItem("load", "false")
    location.reload()
});

document.getElementById("btnRandomWalls").addEventListener("click", function () {
    grid.forEach(hex => {
        if (Math.random() > 0.7) {
            hex.obstacle = "wall"
            drawHex(hex)
        }
    })
});

function clickObstacleType(clicked_id) {
    assignCurrentObstacle(document.getElementById(clicked_id).value)
    localStorage.setItem("obstacle", currentObstacle)
};

function assignCurrentObstacle(obstacle) {
    currentObstacle = obstacle
    if (currentObstacle == 'sand') {
        currentSlowdown = 1
    } else if (currentObstacle == 'water') {
        currentSlowdown = 3
    } else if (currentObstacle == 'wall' || currentObstacle == 'knownHostile') {
        currentSlowdown = 10000
    } else {
        currentSlowdown = 0
    }
}

function clickAnimation(clicked_id) {
    clicked = document.getElementById(clicked_id).value;
    animation = clicked == 'animation' ? true : false;
    localStorage.setItem("animation", animation)
};


//Get the svg grid element to add event listeners to it
var svg = document.querySelectorAll("svg")[0];



svg.addEventListener('mousedown', ({ offsetX, offsetY }) => {
    if (!searched) {
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        mousedown_hex = grid.get(hexCoordinates)
        if (mousedown_hex != undefined) {
            mousedown = true
            if (mousedown_hex.start) {
                type = 'start'
            } else if (mousedown_hex.end) {
                type = 'end'
            } else {
                type = currentObstacle
                mousedown_hex.obstacle = currentObstacle
                mousedown_hex.slowdown = currentSlowdown
                drawHex(mousedown_hex)
            }
        }
    }
})

svg.addEventListener('mouseup', ({ offsetX, offsetY }) => {
    mousedown = false
    type = 'none'
    // mousedown_hex = null
})

svg.addEventListener('mouseover', ({ offsetX, offsetY }) => {
    if (mousedown) {
        // convert point to hex (coordinates)
        const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
        // get the actual hex from the grid
        hex = grid.get(hexCoordinates)
        if (hex != mousedown_hex && hex != undefined) {
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
        } else if (hex.obstacle == 'knownHostile') {
            draw.use(hexKnownHostile).translate(x, y)
        } else {
            draw.use(hexEmptyPath).translate(x, y)
        }
    } else if (hex.openSet) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSandOpen).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexWaterOpen).translate(x, y)
        } else if (hex.obstacle == 'knownHostile') {
            draw.use(hexKnownHostile).translate(x, y)
        } else {
            draw.use(hexEmptyOpen).translate(x, y)
        }
    } else if (hex.closedSet) {
        if (hex.obstacle == 'sand') {
            draw.use(hexSandClosed).translate(x, y)
        } else if (hex.obstacle == 'water') {
            draw.use(hexWaterClosed).translate(x, y)
        } else if (hex.obstacle == 'knownHostile') {
            draw.use(hexKnownHostile).translate(x, y)
        } else if (hex.obstacle == 'unknownHostile') {
            draw.use(hexUnknownHostile).translate(x, y)
        } else {
            draw.use(hexEmptyClosed).translate(x, y)
        }
    } else if (hex.obstacle == 'wall') {
        draw.use(hexWall).translate(x, y)
    } else if (hex.obstacle == 'sand') {
        draw.use(hexSand).translate(x, y)
    } else if (hex.obstacle == 'water') {
        draw.use(hexWater).translate(x, y)
    } else if (hex.obstacle == 'knownHostile') {
        draw.use(hexKnownHostile).translate(x, y)
    } else if (hex.obstacle == 'unknownHostile') {
        draw.use(hexUnknownHostile).translate(x, y)
    } else if (hex.obstacle == 'knownFriendly') {
        draw.use(hexKnownFriendly).translate(x, y)
    } else if (hex.obstacle == 'unknownFriendly') {
        draw.use(hexUnknownFriendly).translate(x, y)
    } else if (hex.obstacle == 'empty') {
        draw.use(hexEmpty).translate(x, y)
    }



}

//Drop down list
function algorithmChange(object) {
    algorithm = object.value
    localStorage.setItem("algorithm", algorithm)
    grid.forEach(hex => {
        resetStats(hex)
    })
}

function testChange(object) {
    testIndex = object.value
}

function loadClicked() {
    if (testIndex != -1) {
        localStorage.setItem("load", "true")
        localStorage.setItem("grid", testList[testIndex])
        location.reload()
    } else {
        alert('Please select a test from the drop down list')
    }

}

async function readListOfTests() {
    try {
        const response = await fetch(testUrl);
        const data = await response.text();
        testList = data.match(/[^\r\n]+/g);
        console.log('readListOfTests', testList);
    } catch (error) {
        console.error(error);
    }
}

