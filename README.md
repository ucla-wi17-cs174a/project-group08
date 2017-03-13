DESCRIPTION
Flight simulator developed on WebGL. The plane can be controlled using either the keyboard or a joystick. The main goal of the game is to fly through gates (collecting points) 
without crashing into the map. The map is autogenerating using an isosurface of a 3D noise function and the collectable objects are generated to be near the physical map. When you fly
through a gate, the gate changes color from red to green. To make the flying more realistic, we incorporated a detached camera that responds to change in pitch
and heading. In addition, the plane rolls when turning to "simulate" real flight dynamics.

CONTROLS
- Controls for keyboard use:
	Heading and pitch: 	Arrow Keys
	Roll: 				g,h
	Speed: 				characters 'z' to '>' (bottom row of keyboard) 'z' is full stop, '>' is full speed.

- Controls for joystick:
	Heading: 			q to p (top row of keyboard)
	Pitch: 				1 to 0 (number keys)
	Roll: 				g to j (middle 4 keys of middle row of keyboard)
	Speed: 				z to . (bottom row of keyboard)

ADVANCED TOPICS
- Collision Detection:
	Detects any collision to the map by comparing 5 points of the plane with the density function directly. 
	Detects any collision to a collectable and marks as collected when the models' hit boxes collide
- Object Importation:
	Python script reinterpret .obj file to an easily readable format (still a vaild .obj file)
	Reads vertex coordinates, normals, textures, and indices from .obj file and sends them to the graphics card
- Deferred Shading:
	The rendering of the scene was split into two and a half passes. The first half pass simply fills in the skybox into the screen's color buffer.
	The depth buffer is then cleared so that everything following is drawn on top. The first full pass binds an offscreen frame buffer, and writes out material properties,
	normals and positions to the framebuffer. The second pass then takes this texture and computes lighting on it. This break between rendering geometry and lighting it 
	allows for more lights to be in the scene for the same speed. This is because the (relatively) slow lighting calculations only need to be computed for pixels that actually
	make it to the screen. The intermediate properties buffer also allows for some other screen space techniques to be implemented (This will happen if time permits). There are some
	small artifacts from the intermediate step due to not being able to write float values to the intermediate texture. For the most part these artifacts are not noticeable when playing the game.
	Note: As it happens, our program is limited by javascript/cpu performance far more than lighting on the GPU.
- Volumentic Rendering:
	Generates a 3D noise function using Perlin noise to generate interesting terrain.
	In order to generate the terrain, an isosurface of the noise function is taken by applying the marching cubes algorithm, which outputs all the geometry.
	The terrain is currently created on the CPU in javascript, but the setup for calculating the noise function using the GPU is present. Basically, the Perlin noise is calculated in the fragment
	shader, and the resulting texture is read in as an array of noise values. The marching cubes algorithm is then applied using those values. While it was mostly functional, it was significantly
	slower than generating the density values in javascript, probably due either to bugs or inefficiency in sending the data between javascript and the GPU.

OTHER
- Assets:
	All models and textures used in this program were created with Blender and GIMP by the team members.