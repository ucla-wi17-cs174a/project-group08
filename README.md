DESCRIPTION
Flight simulator developed on WebGL. The plane can be controlled using either the keyboard or joystick. The main goal of the game is to fly through all gates 
without crashing into the map. The map is autogenerating using a height map and the collectable objects are generated to be near the physical map. When you fly
through a gate, the gate changes color from red to green. To make the flying more realistic, we incorporated a detatched camera that responds to change in pitch
and heading. In addition, the plane rolls when turning.

CONTROLS
- Controls for keyboard use:
	Heading and pitch: 	Arrow Keys
	Roll: 				g,h
	Speed: 				characters 'z' to '/' (bottom row of keyboard)

- Controls for joystick:
	Heading: 			q to p (top row of keyboard)
	Pitch: 				1 to 0 (number keys)
	Roll: 				g to j (middle 4 keys of middle row of keyboard)
	Speed: 				z to . (bottom row of keyboard)

ADVANCED TOPICS
- Collision Detection:
	Detects any collision to the map by comparing 5 points of the plane with the height map
	Detects any collision to a collectable and marks as collected when the models' hit boxes collide
- Object Importation:
	Python script reinterpret .obj file to an easily reable format
	Reads vertex coordinates, normals, textures, and indices from .obj file and sends them to the graphics card
- Deffered Shading:
- Volumentic Rendering:

TEXTURING
- Skybox:
- 

OTHER
- 3D Modeling:
- Deffered Rendering: