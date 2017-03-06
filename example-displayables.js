var RES_RATIO = 16;	


Declare_Any_Class("Example_Camera", {
    'construct': function(context) { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State(translation(0, -1, -50), perspective(45, canvas.width / canvas.height, .1, 1000), 0);
        this.define_data_members({
            graphics_state: context.shared_scratchpad.graphics_state,
            thrust: vec3(),
            origin: vec3(0, 5, 0),
            looking: false,
            change_degree: 1
        });
    },
    'init_keys': function(controls) // init_keys():  Define any extra keyboard shortcuts here
    {},

}, Animation);

Declare_Any_Class("Example_Animation", {
    'construct': function(context) {
        this.shared_scratchpad = context.shared_scratchpad;

        shapes_in_use.tetrahedron = new Tetrahedron();
        shapes_in_use.sphere = new Subdivision_Sphere(4);
		shapes_in_use.heightmap = new Heightmap;
		shapes_in_use.terrain1 = new Terrain(vec3(0, -32, -32), 32);
		shapes_in_use.terrain2 = new Terrain(vec3(0, -32, -64), 32);
		// shapes_in_use.terrain3 = new Terrain(vec3(0, -32, -96), 32);
		
		var world_size = 2048;
		var world_tree = new Node(vec3(-world_size/2, -world_size/2, -world_size/2), world_size, null);
		// var node = Node_add(vec3(0, -32, -64), 32, tree);
		// var node2 = Node_find(vec3(0, -32, -64), 32, tree, null);
		// shapes_in_use.length++;
		// Node_terrain(node2);
		// console.log(shapes_in_use);
		
		//Arrays to hold important info for terrain (in the form of nodes):
		var to_check = [];	//First, add a bunch of blocks to this list, then check it over subsequent iterations
		var to_create = [];	//After the blocks are checked and need to be drawn, add them to this list
		var to_purge = [];	//Also part of this process, the old low-res geometry should no longer be drawn - use this to update to_draw when it's time
			//Over more iterations, create the geometry for the list above, several blocks per iteration depending on speed
			//After geometry is made, add it to the list of stuff to draw, and purge the lower resolution geometry that is replaced
		var to_draw = []	//All the geometry in here is what gets drawn
		
        this.shared_scratchpad.heading = 0;
        this.shared_scratchpad.pitch = 0;

        this.shared_scratchpad.x = 0;
        this.shared_scratchpad.y = 0;
        this.shared_scratchpad.z = 0;
        this.shared_scratchpad.speed = 0.1;
		
		this.shared_scratchpad.speed_change = 0; // 0: no change; -1: slow down; +1: speed up;
		this.shared_scratchpad.right = false;
		this.shared_scratchpad.left = false;
		this.shared_scratchpad.up = false;
		this.shared_scratchpad.down = false;
    },
    'init_keys': function(controls) {
        controls.add("up", this, function() {
            this.shared_scratchpad.up = true;
        });
		controls.add( "up", this, function() { 
			this.shared_scratchpad.up =  false; }, {'type':'keyup'} 
		);
        controls.add("down", this, function() {
            this.shared_scratchpad.down = true;
        });
		controls.add( "down", this, function() { 
			this.shared_scratchpad.down =  false; }, {'type':'keyup'} 
		);
        controls.add("left", this, function() {
            this.shared_scratchpad.left = true;
        });
		controls.add( "left", this, function() { 
			this.shared_scratchpad.left =  false; }, {'type':'keyup'} 
		);
        controls.add("right", this, function() {
            this.shared_scratchpad.right = true;
        });
		controls.add( "right", this, function() { 
			this.shared_scratchpad.right =  false; }, {'type':'keyup'} 
		);

        // slow down
        controls.add("1", this, function() {
			this.shared_scratchpad.speed_change = -1;
			}
        );
		controls.add( "1", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);

        // speed up
        controls.add("2", this, function() {
			this.shared_scratchpad.speed_change = 1;
            }
        );
				controls.add( "2", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);

    },
    'display': function(time) {
        var graphics_state = this.shared_scratchpad.graphics_state,
            model_transform = mat4();
        shaders_in_use["Default"].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = []; // First clear the light list each frame so we can replace & update lights.

        var t = graphics_state.animation_time / 1000,
            light_orbit = [Math.cos(t), Math.sin(t)];
        graphics_state.lights.push(new Light(vec4(-10, 10, 0, 1), Color(1, 0, 0, 1), 100000));
        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var sphereMaterial = new Material(Color(1, 0, 1, 1), .4, .4, .8, 40); // Omit the final (string) parameter if you want no texture
        var tetraMaterial = new Material(Color(0, 1, 1, 1), .4, .4, .4, 40); // Omit the final (string) parameter if you want no texture
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now

        // create sphere for frame of reference
        model_transform = mult(model_transform, translation(0, 0, -100));
        //shapes_in_use.sphere.draw(graphics_state, model_transform, sphereMaterial);
		//shapes_in_use.heightmap.draw(graphics_state, model_transform, landMaterial);
		//node2.terrain.draw(graphics_state, model_transform, landMaterial);
		shapes_in_use.terrain2.draw(graphics_state, model_transform, landMaterial);
		// shapes_in_use.terrain3.draw(graphics_state, model_transform, landMaterial);
        model_transform = mult(model_transform, translation(0, 0, 100));

        model_transform = mult(model_transform, translation(50, 0, -150));
        shapes_in_use.sphere.draw(graphics_state, model_transform, sphereMaterial);
        model_transform = mult(model_transform, translation(-50, 0, 150));
		
		
		
		
        // create tetrahedron for temp plane
		// modify speed based on key input
		var speed_change = 0.01;
		if(this.shared_scratchpad.speed_change < 0) // slowing down
		{
			if(this.shared_scratchpad.speed > 0)
			{
				this.shared_scratchpad.speed -= speed_change;
				if(this.shared_scratchpad.speed < 0)
					this.shared_scratchpad.speed = 0;
			}
		}
		else if(this.shared_scratchpad.speed_change > 0) // speeding up
		{
			if(this.shared_scratchpad.speed < 1)
			{
				this.shared_scratchpad.speed += speed_change;
			}
		}
		// modify heading and pitch based on key input
		var pitch_change = 0.1;
		var heading_change = 0.1;
		if(this.shared_scratchpad.up)
		{
			this.shared_scratchpad.pitch += pitch_change;
		}
		if(this.shared_scratchpad.down)
		{
			this.shared_scratchpad.pitch -= pitch_change;
		}
			if(this.shared_scratchpad.left)
		{
			this.shared_scratchpad.heading += heading_change;
		}
			if(this.shared_scratchpad.right)
		{
			this.shared_scratchpad.heading -= heading_change;
		}
		
        // move forward based on current heading
        var forward_speed = this.shared_scratchpad.speed;

        var y_change = Math.sin(radians(this.shared_scratchpad.pitch)) * forward_speed;
        var xz_change = Math.cos(radians(this.shared_scratchpad.pitch)) * forward_speed;

        var x_change = -1 * Math.sin(radians(this.shared_scratchpad.heading)) * xz_change;
        var z_change = -1 * Math.cos(radians(this.shared_scratchpad.heading)) * xz_change;

        this.shared_scratchpad.x += x_change;
        this.shared_scratchpad.y += y_change;
        this.shared_scratchpad.z += z_change;

		// draw plane
        model_transform = mult(model_transform, translation(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z));
        model_transform = mult(model_transform, rotation(this.shared_scratchpad.heading, 0, 1, 0));
        model_transform = mult(model_transform, rotation(this.shared_scratchpad.pitch, 1, 0, 0));
        shapes_in_use.tetrahedron.draw(graphics_state, model_transform, tetraMaterial);
		
		// make camera follow the plane
        this.shared_scratchpad.graphics_state.camera_transform = mat4();
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(10, 1, 0, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(0, -5, -10));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.heading, 0, -1, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.pitch, -1, 0, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(-1 * this.shared_scratchpad.x, -1 * this.shared_scratchpad.y, -1 * this.shared_scratchpad.z));
    }
}, Animation);