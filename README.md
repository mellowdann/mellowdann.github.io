How to use: Military Unit Path Finding Simulation Tool\
\
Designed and implemented by Daniel Mundell, 220108104@stu.ukzn.ac.za\
\
Installation:\
	No installation/setup is required.\
	\
To run:\
	Open "index.html" in any modern web browser.\
	Or go to https://mellowdann.github.io/\
\
There are 6 node options:\
	1. Clear - an empty node which can be travelled to for a cost of 1.\
	2. Obstacle - a solid node which blocks all travel.\
	3. Sand - a terrain type node which can be travelled to for a cost of 2.\
	4. Water - a terrain type node which can be travelled to for a cost of 4.\
	5. Unknown Hostile - a node which the algorithms think is empty, but if they attempt to travel to it, it becomes a Known Hostile.\
	6. Known Hostile - a dangerous enemy unit which cannot be travelled to (essentially an obstacle).\
\
Changing node types:\
	Select the node type you want from the first row of radio buttons.\
	Then select the node in the grid that you want to change.\
	You can also click a node and drag your mouse to change multiple at once.\
	The "Random Walls" button can be used to create obstacles in 30% of the grid.\
	The yellow start node and the green goal node can be moved by clicking on them and dragging them to their new locations.\
	\
Searching:\
	Select an algorithm from the drop down list.\
	Click the "Search!" button.\
	If no path is found, an alert will be shown to let you know.\
	If a path is found, the captured performance metrics will be shown.\
\
Clear:\
	The previous search information can be cleared with the "Clerar Search" button.\
	The whole grid layout can be cleared with the "Clear Grid" button.\
	\
Change grid size:\
	Select the desired grid size from the drop down list.\
	Select the "Change Size" button.\
	\
Load a test map configuration:\
	Select the desired test from the drop down list.\
	Select the "Load Test" button.\
	Note: Unfortunately, an internet connection is required to access the test maps.\
	\
Turn animation on/off:\
	Select the desired option on the second row of radio buttons.\
	\
Note:\
	User preferences are saved locally to allow the page to be refreshed without losing the desired map configuration.\
	On the unlikely event that errors occur with the loading procedure, type "localStorage.clear();" in the console, and refresh the page.\
