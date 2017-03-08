var RES_RATIO = 16;	

// Create the textbox
Declare_Any_Class( "Debug_Screen",
  { 'construct': function( context )
      { this.define_data_members( { shared_scratchpad: context.shared_scratchpad, numCollected: 0, graphicsState: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
		this.shared_scratchpad.numCollected = 0;
      },
    'init_keys': function( controls )
      { 
      },
	  // update the values in string
    'update_strings': function( debug_screen_object )
      { 
		this.numCollected = this.shared_scratchpad.numCollected;
      },
    'display': function( time )
      {
        shaders_in_use["Default"].activate();
        gl.uniform4fv( g_addrs.shapeColor_loc, Color( .8, .8, .8, 1 ) );

        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale );

	
		// draw the text box
		shapes_in_use.debug_text.set_string("Collected: " + this.numCollected.toString() );
		shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
		model_transform = mult( translation( 0, .08, 0 ), model_transform );
      }
  }, Animation );

// initial camera creation
Declare_Any_Class("Example_Camera", {
    'construct': function(context) {
        context.shared_scratchpad.graphics_state = new Graphics_State(translation(0, -1, -10), perspective(45, canvas.width / canvas.height, .1, 1000), 0);
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

// main animation program
Declare_Any_Class("Example_Animation", {
    'construct': function(context) {
        this.shared_scratchpad = context.shared_scratchpad;

		// declare all variables
		// creating collection objects
		shapes_in_use.collection_object = new Array();
		// declare any number of objects
		shapes_in_use.collection_object.push(new Collection_Object(4, 50, 0, -150));
		shapes_in_use.collection_object.push(new Collection_Object(4, -50, 0, -150));
		shapes_in_use.collection_object.push(new Collection_Object(4, 50, 0, -100));
		shapes_in_use.collection_object.push(new Collection_Object(4, -50, 0, -100));

		// create imported plane
		shapes_in_use.plane = Imported_Object.prototype.auto_flat_shaded_version();;


		// declare heightmap variables
		shapes_in_use.heightmap = new Heightmap;
		shapes_in_use.terrain1 = new Terrain(vec3(0, -32, -32), 32);
		shapes_in_use.terrain2 = new Terrain(vec3(0, -32, -64), 32);
		// shapes_in_use.terrain3 = new Terrain(vec3(0, -32, -96), 32);
		
		var world_size = 2048;
		shapes_in_use.terrain = new Terrain();
		var world_tree = new Node(vec3(-world_size/2, -world_size/2, -world_size/2), world_size, null);
		var test_node = Node_add(vec3(0,0,0), 32, world_tree);			
		shapes_in_use.terrain.to_draw[0] = test_node;
		shapes_in_use.terrain.populate(vec3(0,0,0), 32);
		
		
		
		
		
		// declare heading, pitch, xyz, and speed of the plane
        this.shared_scratchpad.heading = 0;
        this.shared_scratchpad.pitch = 0;
		this.shared_scratchpad.roll = 0;

        this.shared_scratchpad.x = 0;
        this.shared_scratchpad.y = 0;
        this.shared_scratchpad.z = 0;
        this.shared_scratchpad.speed = 0.1;
		
		this.shared_scratchpad.speed_change = 0; // 0: no change; -1: slow down; +1: speed up;
		this.shared_scratchpad.pitch_change = 0; // how much to change pitch
		this.shared_scratchpad.heading_change = 0; // how much to change heading
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
		
		// reset
		controls.add("ctrl+r", this, function() {
			this.shared_scratchpad.heading = 0;
			this.shared_scratchpad.pitch = 0;
			this.shared_scratchpad.roll = 0;

			this.shared_scratchpad.x = 0;
			this.shared_scratchpad.y = 0;
			this.shared_scratchpad.z = 0;
			this.shared_scratchpad.speed = 0.1;
			
			this.shared_scratchpad.speed_change = 0; // 0: no change; -1: slow down; +1: speed up;
			this.shared_scratchpad.pitch_change = 0; // how much to change pitch
			this.shared_scratchpad.heading_change = 0; // how much to change heading

		});

    },
	// check collision between two spheres
	'checkCollision' : function(x1, y1, z1, r1, x2, y2, z2, r2) {
		// Exit if separated along an axis
		if ( (x1+r1) < (x2-r2) || (x1-r1) > (x2+r2) ) return false;
		if ( (y1+r1) < (y2-r2) || (y1-r1) > (y2+r2) ) return false;
		if ( (z1+r1) < (z2-r2) || (z1-r1) > (z2+r2) ) return false;
		// Overlapping on all axes means there is an intersection
		return true;// Exit if separated along an axis
	},
    'display': function(time) {
		//bind GBuffer
		
		shaders_in_use["Default"].activate();
        this.generate_G_Buffer(time);
		//Bind Screen FBO
		//Setup Attribs and Uniforms
		//activate appropo shaders
		//Render to screen
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
        var collectableMaterial = new Material(Color(1, 0, 1, 1), .4, .4, .8, 40); // Omit the final (string) parameter if you want no texture
        var tetraMaterial = new Material(Color(0, 1, 1, 1), .4, .4, .4, 40); // Omit the final (string) parameter if you want no texture
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now

		// Draw map
        model_transform = mult(model_transform, translation(0, 0, -100));
		shapes_in_use.terrain.to_draw[0].contents.copy_onto_graphics_card();
		shapes_in_use.terrain.to_draw[0].contents.draw(graphics_state, model_transform, landMaterial);
        model_transform = mult(model_transform, translation(0, 0, 100));

		
		// DRAW PLANE This is rather verbose and should get fixed
        // create tetrahedron for temp plane
		// modify speed based on key input
		var speed_change = 0.01;
		if(this.shared_scratchpad.speed_change < 0 && this.shared_scratchpad.speed > 0) // slowing down. Min speed is 0
		{
			this.shared_scratchpad.speed -= speed_change;
			if(this.shared_scratchpad.speed < 0)
				this.shared_scratchpad.speed = 0;
		}
		else if(this.shared_scratchpad.speed_change > 0 && this.shared_scratchpad.speed < 1) // speeding up. Max speed is 1
		{
			this.shared_scratchpad.speed += speed_change;
		}
		
		// modify heading and pitch based on key input
		if(this.shared_scratchpad.pitch <= 90 && this.shared_scratchpad.pitch >= -90)
		{
			this.shared_scratchpad.pitch += this.shared_scratchpad.pitch_change;
			if(this.shared_scratchpad.pitch > 90)
			{
				this.shared_scratchpad.pitch = 90;
			}
			else if(this.shared_scratchpad.pitch < -90)
			{
				this.shared_scratchpad.pitch = -90;
			}
		}
		this.shared_scratchpad.heading += this.shared_scratchpad.heading_change;
		if(this.shared_scratchpad.heading > 360)
			this.shared_scratchpad.heading -= 360;
		else if(this.shared_scratchpad.heading < 360)
			this.shared_scratchpad.heading += 360;
		
        // move forward based on current pitch and heading
        var forward_speed = this.shared_scratchpad.speed;
		var pitch = this.shared_scratchpad.pitch;
		var heading = this.shared_scratchpad.heading;

		var pitch_x = Math.round(Math.cos(radians(heading))*100)/100;
		var pitch_z = -1 * Math.round(Math.sin(radians(heading))*100)/100;

		
		
        var y_change = Math.sin(radians(this.shared_scratchpad.pitch)) * forward_speed;
        var xz_change = Math.cos(radians(this.shared_scratchpad.pitch)) * forward_speed;
        var x_change = -1 * Math.sin(radians(this.shared_scratchpad.heading)) * xz_change;
        var z_change = -1 * Math.cos(radians(this.shared_scratchpad.heading)) * xz_change;
				
		// add to the current position
        this.shared_scratchpad.x += x_change;
        this.shared_scratchpad.y += y_change;
        this.shared_scratchpad.z += z_change;
		
		// calculate roll
		if(this.shared_scratchpad.roll < this.shared_scratchpad.heading_change * 50)
		{
			this.shared_scratchpad.roll += 1;
		}
		else if(this.shared_scratchpad.roll > this.shared_scratchpad.heading_change * 50)
		{
			this.shared_scratchpad.roll -= 1;
		}


		// draw plane
		model_transform = mult(model_transform, translation(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z)); //position
		model_transform = mult(model_transform, rotation(this.shared_scratchpad.pitch, pitch_x, 0, pitch_z));
		model_transform = mult(model_transform, rotation(this.shared_scratchpad.heading, 0, 1, 0));
		model_transform = mult(model_transform, rotation(this.shared_scratchpad.roll, 0, 0, 1));
        model_transform = mult(model_transform, rotation(90, 0, 1, 0)); // current model is 90 degrees off
        shapes_in_use.plane.draw(graphics_state, model_transform, tetraMaterial);


		// DRAW COLLECTION_OBJECT
		// create collection objects and check if it exists
		for(var i = 0; i < shapes_in_use.collection_object.length; i++)
		{
			var cur_collection = shapes_in_use.collection_object[i];
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
					cur_collection.draw(graphics_state, model_transform, collectableMaterial);
				}
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
