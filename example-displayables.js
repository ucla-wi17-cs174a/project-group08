var RES_RATIO = 16;	

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - An example of a displayable object that our class Canvas_Manager can manage.  Displays a text user interface.
  { 'construct': function( context )
      { this.define_data_members( { shared_scratchpad: context.shared_scratchpad, numCollected: 0, graphicsState: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
		this.shared_scratchpad.numCollected = 0;
      },
    'init_keys': function( controls )
      { 
      },
    'update_strings': function( debug_screen_object )   // Strings that this displayable object (Debug_Screen) contributes to the UI:
      { 
		this.numCollected = this.shared_scratchpad.numCollected;
      },
    'display': function( time )
      {
        shaders_in_use["Default"].activate();
        gl.uniform4fv( g_addrs.shapeColor_loc, Color( .8, .8, .8, 1 ) );

        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale );

	
		shapes_in_use.debug_text.set_string("Collected: " + this.numCollected.toString() );
		shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
		model_transform = mult( translation( 0, .08, 0 ), model_transform );
	

      }
  }, Animation );


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
		shapes_in_use.collection_object1 = new Collection_Object(4, 50, 0, -150);
		shapes_in_use.collection_object2 = new Collection_Object(4, -50, 0, -150);
		shapes_in_use.collection_object3 = new Collection_Object(4, 50, 0, -100);
		shapes_in_use.collection_object4 = new Collection_Object(4, -50, 0, -100);
		
		shapes_in_use.imported = Imported_Object.prototype.auto_flat_shaded_version();;
		shapes_in_use.square = new Square();
		
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
		this.shared_scratchpad.right = 0;
		this.shared_scratchpad.left = 0;
		this.shared_scratchpad.up = 0;
		this.shared_scratchpad.down = 0;
		this.shared_scratchpad.pitch_change = 0;
		this.shared_scratchpad.heading_change = 0;
    },
    'init_keys': function(controls) {
        controls.add("up", this, function() {
            this.shared_scratchpad.pitch_change = 0.6;
        });
		controls.add( "up", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
        controls.add("down", this, function() {
            this.shared_scratchpad.pitch_change = -0.6;
        });
		controls.add( "down", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("left", this, function() {
            this.shared_scratchpad.heading_change = 0.6;
        });
		controls.add( "left", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
        controls.add("right", this, function() {
            this.shared_scratchpad.heading_change = -0.6;
        });
		controls.add( "right", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		
		// left and right: set to 1-5: Left; 6-0: right
        controls.add("1", this, function() {
            this.shared_scratchpad.heading_change = 1;
        });
		controls.add( "1", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("2", this, function() {
            this.shared_scratchpad.heading_change = 0.8;
        });
		controls.add( "2", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("3", this, function() {
            this.shared_scratchpad.heading_change = 0.6;
        });
		controls.add( "3", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("4", this, function() {
            this.shared_scratchpad.heading_change = 0.4;
        });
		controls.add( "4", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("5", this, function() {
            this.shared_scratchpad.heading_change = 0.2;
        });
		controls.add( "5", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("6", this, function() {
            this.shared_scratchpad.heading_change = -0.2;
        });
		controls.add( "6", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("7", this, function() {
            this.shared_scratchpad.heading_change = -0.4;
        });
		controls.add( "7", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("8", this, function() {
            this.shared_scratchpad.heading_change = -0.6;
        });
		controls.add( "8", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("9", this, function() {
            this.shared_scratchpad.heading_change = -0.8;
        });
		controls.add( "9", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("0", this, function() {
            this.shared_scratchpad.heading_change = -1;
        });
		controls.add( "0", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		
		// up and down: set to 'q'-'t': Left; 'y'-'p': right
        controls.add("q", this, function() {
            this.shared_scratchpad.pitch_change = 1;
        });
		controls.add( "q", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("w", this, function() {
            this.shared_scratchpad.pitch_change = 0.8;
        });
		controls.add( "w", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("e", this, function() {
            this.shared_scratchpad.pitch_change = 0.6;
        });
		controls.add( "e", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("r", this, function() {
            this.shared_scratchpad.pitch_change = 0.4;
        });
		controls.add( "r", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("t", this, function() {
            this.shared_scratchpad.pitch_change = 0.2;
        });
		controls.add( "t", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("y", this, function() {
            this.shared_scratchpad.pitch_change = -0.2;
        });
		controls.add( "y", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("u", this, function() {
            this.shared_scratchpad.pitch_change = -0.4;
        });
		controls.add( "u", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("i", this, function() {
            this.shared_scratchpad.pitch_change = -0.6;
        });
		controls.add( "i", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("o", this, function() {
            this.shared_scratchpad.pitch_change = -0.8;
        });
		controls.add( "o", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("p", this, function() {
            this.shared_scratchpad.pitch_change = -1;
        });
		controls.add( "p", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);

        // slow down
        controls.add(",", this, function() {
			this.shared_scratchpad.speed_change = -1;
			}
        );
		controls.add( ",", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);

        // speed up
        controls.add(".", this, function() {
			this.shared_scratchpad.speed_change = 1;
            }
        );
		controls.add( ".", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);

    },
	'checkCollision' : function(x1, y1, z1, r1, x2, y2, z2, r2) {
		// Exit if separated along an axis
		if ( (x1+r1) < (x2-r2) || (x1-r1) > (x2+r2) ) return false;
		if ( (y1+r1) < (y2-r2) || (y1-r1) > (y2+r2) ) return false;
		if ( (z1+r1) < (z2-r2) || (z1-r1) > (z2+r2) ) return false;
		// Overlapping on all axes means there is an intersection
		return true;// Exit if separated along an axis
	},
    'display': function(time) {
		shaders_in_use["Default"].activate();
        this.generate_G_Buffer(time);
    },
	'generate_G_Buffer': function(time){
		var graphics_state = this.shared_scratchpad.graphics_state,
            model_transform = mat4();
        

		//Lights section to be revamped folowing renderer implementation
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



		// Draw map
        model_transform = mult(model_transform, translation(0, 0, -100));;
		shapes_in_use.terrain1.draw(graphics_state, model_transform, landMaterial);
        model_transform = mult(model_transform, translation(0, 0, 100));

		// DRAW PLANE This is rather verbose and should get fixed
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

		this.shared_scratchpad.pitch += this.shared_scratchpad.pitch_change;

		this.shared_scratchpad.heading += this.shared_scratchpad.heading_change;
		
		
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


		// DRAW COLLECTION_OBJECT
		// create collection objects and check if it exists. Solid programming style right here
		var cur_collection = shapes_in_use.collection_object1;
		if(cur_collection.collected == false)
		{
			if(this.checkCollision(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z, 1, cur_collection.x, cur_collection.y, cur_collection.z, 1))
			{
				cur_collection.collected = true;
				this.shared_scratchpad.numCollected += 1;
			}
			else
			{
				model_transform = mat4();
				model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
				cur_collection.draw(graphics_state, model_transform, sphereMaterial);
			}
		}
		var cur_collection = shapes_in_use.collection_object2;
		if(cur_collection.collected == false)
		{
			if(this.checkCollision(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z, 1, cur_collection.x, cur_collection.y, cur_collection.z, 1))
			{
				cur_collection.collected = true;
				this.shared_scratchpad.numCollected += 1;

			}
			else
			{
				model_transform = mat4();
				model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
				cur_collection.draw(graphics_state, model_transform, sphereMaterial);
			}
		}
		var cur_collection = shapes_in_use.collection_object3;
		if(cur_collection.collected == false)
		{
			if(this.checkCollision(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z, 1, cur_collection.x, cur_collection.y, cur_collection.z, 1))
			{
				cur_collection.collected = true;
				this.shared_scratchpad.numCollected += 1;

			}
			else
			{
				model_transform = mat4();
				model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
				cur_collection.draw(graphics_state, model_transform, sphereMaterial);
			}
		}
		var cur_collection = shapes_in_use.collection_object4;
		if(cur_collection.collected == false)
		{
			if(this.checkCollision(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z, 1, cur_collection.x, cur_collection.y, cur_collection.z, 1))
			{
				cur_collection.collected = true;
				this.shared_scratchpad.numCollected += 1;

			}
			else
			{
				model_transform = mat4();
				model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
				model_transform = mult(model_transform, scale(5,5,5));
				shapes_in_use.imported.draw(graphics_state, model_transform, sphereMaterial);
			}
		}

		
		
		// make camera follow the plane
        this.shared_scratchpad.graphics_state.camera_transform = mat4();
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(10, 1, 0, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(0, -5, -10));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.heading, 0, -1, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.pitch, -1, 0, 0));
        this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(-1 * this.shared_scratchpad.x, -1 * this.shared_scratchpad.y, -1 * this.shared_scratchpad.z));
	}
}, Animation);