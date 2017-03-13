DESCRIPTION
Flight simulator that can be controlled using either the keyboard or joystick. The main goal of the game is to fly through all gates without crashing into the map.

CONTROLS
- Controls for keyboard use:
	Heading and pitch: Arrow Keys
	Roll: g,h
	Speed: characters 'z' to '/' (bottom row of keyboard)

- Controls for joystick:
	Heading: q-p (top row of keyboard)
	Pitch: 1-0 (number keys)
	Roll: g-j (middle 4 keys of middle row of keyboard)
	Speed: z-. (bottom row of keyboard)

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