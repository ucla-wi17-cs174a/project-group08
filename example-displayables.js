
var RES_RATIO = 32;	
var SPEED_INC = .01;
var DEFERRED = false;

// Create the textbox
Declare_Any_Class( "Debug_Screen",
  { 'construct': function( context )
      { this.define_data_members( { shared_scratchpad: context.shared_scratchpad, numCollected: 0, graphics_state: new Graphics_State() } );
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
		shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
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
		this.sbtrans = mat4();

		// declare all variables
		// creating collection objects
		shapes_in_use.collection_object = new Array();
		// declare any number of objects
		shapes_in_use.collection_object.push(new Collection_Object(4, 50, 0, -150));
		shapes_in_use.collection_object.push(new Collection_Object(4, -50, 0, -150));
		shapes_in_use.collection_object.push(new Collection_Object(4, 50, 0, -100));
		shapes_in_use.collection_object.push(new Collection_Object(4, -50, 0, -100));

		// create imported plane
		shapes_in_use.plane = Imported_Object.prototype.auto_flat_shaded_version();

		
		shapes_in_use.square = new Square();
		shapes_in_use.skybox = new Cube();
		this.GBuffer = new FBO(canvas.width,canvas.height,5,false);
		
		var world_size = 2048;
		shapes_in_use.terrain = new Terrain();
		var world_tree = new Node(vec3(-world_size/2, -world_size/2, -world_size/2), world_size, null);
		var test_node = Node_add(vec3(0,0,0), 32, world_tree);			
		shapes_in_use.terrain.to_draw[0] = test_node;
		shapes_in_use.terrain.populate(vec3(0,0,0), 32);
		shapes_in_use.terrain.populate_GPU(vec3(32,-32,0), 32, this.shared_scratchpad.graphics_state);
		
		

        this.shared_scratchpad.x = 0;
        this.shared_scratchpad.y = 0;
        this.shared_scratchpad.z = 0;
        this.shared_scratchpad.speed = 0.1;
		
		this.shared_scratchpad.heading = 0;
		this.shared_scratchpad.pitch = 0;
		this.shared_scratchpad.speed_change = 0; // 0: no change; -1: slow down; +1: speed up;
		this.shared_scratchpad.pitch_change = 0; // how much to change pitch
		this.shared_scratchpad.heading_change = 0; // how much to change heading
		this.shared_scratchpad.roll_change = 0;
		this.shared_scratchpad.extra_roll = 1;
		
		this.shared_scratchpad.orientation = mat4(1); // create identity matrix as orientation
		this.shared_scratchpad.orientation_no_extra = mat4(1); // create identity matrix as orientation
		this.shared_scratchpad.position = vec3(0,0,0);
		
		this.shared_scratchpad.camera_extra_pitch = 0;
		this.shared_scratchpad.camera_extra_heading = 0;
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

		// roll left and right: set to 'f'-'g': Left; 'h'-'j': right
        controls.add("f", this, function() {
            this.shared_scratchpad.roll_change = -1;
        });
		controls.add( "f", this, function() { 
			this.shared_scratchpad.roll_change =  0; }, {'type':'keyup'} 
		);
		controls.add("g", this, function() {
            this.shared_scratchpad.roll_change = -0.5;
        });
		controls.add( "g", this, function() { 
			this.shared_scratchpad.roll_change =  0; }, {'type':'keyup'} 
		);
		controls.add("h", this, function() {
            this.shared_scratchpad.roll_change = 1;
        });
		controls.add( "h", this, function() { 
			this.shared_scratchpad.roll_change =  0; }, {'type':'keyup'} 
		);
		controls.add("j", this, function() {
            this.shared_scratchpad.roll_change = 0.5;
        });
		controls.add( "j", this, function() { 
			this.shared_scratchpad.roll_change =  0; }, {'type':'keyup'} 
		);
		
        // slow down
        controls.add(",", this, function() {
			this.shared_scratchpad.speed_change = -SPEED_INC;
			}
        );
		controls.add( ",", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);

        // speed up
        controls.add(".", this, function() {
			this.shared_scratchpad.speed_change = SPEED_INC;
            }
        );
		controls.add( ".", this, function() { 
			this.shared_scratchpad.speed_change =  0; }, {'type':'keyup'} 
		);
		// Shading DEBUG Toggle
		controls.add("x", this, function(){
			DEFERRED = !DEFERRED;
			console.log("Swapped to DEFERRED = ", DEFERRED);
		});
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
		
		var aMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4,"FAKE.CHICKEN");	//Just a placeholder for now
		var skyMat = new Material(Color(1.0,1.0,1.0,1.0), 1.0, 1.0, 0.0, 0.0, "LameBox.png");
		
		if(DEFERRED){
			////bind GBuffer
			gl.disable(gl.BLEND);
			this.GBuffer.activate();
			gl.disable(gl.BLEND);
			shaders_in_use["G_buf_gen_phong"].activate();
			//console.log(gl.getParameter(gl.BLEND_COLOR));
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			shapes_in_use.skybox.draw(this.shared_scratchpad.graphics_state,mat4(), skyMat);
			gl.clear(gl.DEPTH_BUFFER_BIT);
		   this.generate_G_Buffer(time);
			//Bind Screen FBO
			this.GBuffer.deactivate();
			//Setup Attribs and Uniforms
			//Implicit?
			//activate appropo shaders
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[0]);
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[1]);
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[2]);
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[3]);
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[4]);
			gl.activeTexture(gl.TEXTURE5);
			gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[5]);
			shaders_in_use["G_buf_light_phong"].activate();

			//Render to screen
			shapes_in_use.square.draw(this.shared_scratchpad.graphics_state,new mat4(),aMaterial );
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.enable(gl.BLEND);

		}
		else{
			shaders_in_use["Default"].activate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			this.generate_G_Buffer(time);
		}
		
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
        graphics_state.lights.push(new Light(vec4(-10, 10, 0, 1), Color(1, 1, 1, 1), 100000));
        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var collectableMaterial = new Material(Color(1, 0, 1, 1), .4, .4, .8, 40); // Omit the final (string) parameter if you want no texture
        var tetraMaterial = new Material(Color(0, 1, 1, 1), .4, .4, .4, 40); // Omit the final (string) parameter if you want no texture
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now

		var current_orientation = this.shared_scratchpad.orientation;
		// draw plane
		var planeLocation = this.drawPlane(graphics_state, tetraMaterial);

		// make camera follow the plane
		this.drawCamera(graphics_state, current_orientation);
		
		// draw collectable
		this.drawCollectables(graphics_state, collectableMaterial); //HACK FIX. <- make collectables a class and/or interface for object oriented happiness :D

	
	
		//Hacky skyboxes, do properly later
		this.sbtrans = new mat4();
		var invRot = mat4();
		invRot = mult(rotation(10,1,0,0),invRot);
		invRot = mult(rotation(this.shared_scratchpad.heading, 0, -1, 0),invRot);
		invRot = mult(rotation(this.shared_scratchpad.pitch, -1, 0, 0),invRot);
		this.sbtrans = mult(inverse(this.shared_scratchpad.graphics_state.camera_transform),invRot);
	},
	
	'drawCollectables': function(graphics_state, collectableMaterial){
		// DRAW COLLECTION_OBJECT
		// create collection objects and check if it exists
		for(var i = 0; i < shapes_in_use.collection_object.length; i++)
		{
			var cur_collection = shapes_in_use.collection_object[i];
			if(cur_collection.collected == false)
			{
				if(this.checkCollision(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 1, cur_collection.x, cur_collection.y, cur_collection.z, 1))
				{
					cur_collection.collected = true;
					this.shared_scratchpad.numCollected += 1;
				}
				else
				{
					var model_transform = mat4();
					model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
					cur_collection.draw(graphics_state, model_transform, collectableMaterial);
				}
			}
		}
	},
	'drawPlane': function(graphics_state, material){
		// draw plane
				
		// change speed
		this.shared_scratchpad.speed = Math.min(1,Math.max(0,this.shared_scratchpad.speed + this.shared_scratchpad.speed_change));
		
		// change roll based on if yaw is changing
		var max_roll = 20;
		var frame_roll = 0;
		if(this.shared_scratchpad.heading_change > 0 && this.shared_scratchpad.extra_roll < max_roll)
		{
			this.shared_scratchpad.extra_roll += 1;
			frame_roll += 1;
		}
		else if(this.shared_scratchpad.heading_change < 0 && this.shared_scratchpad.extra_roll > -1*max_roll)
		{
			this.shared_scratchpad.extra_roll -= 1;
			frame_roll -= 1;
		}
		else if(this.shared_scratchpad.heading_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.extra_roll > 0)
			{
				this.shared_scratchpad.extra_roll -= 1;
				frame_roll -= 1;
			}
			if(this.shared_scratchpad.extra_roll < 0)
			{
				this.shared_scratchpad.extra_roll += 1;
				frame_roll += 1;
			}
		}
		
		var orientation = this.shared_scratchpad.orientation;
		var pitch = new vec3(orientation[0][0], orientation[1][0], orientation[2][0]); // right
		pitch = mult_vec_scalar(pitch, this.shared_scratchpad.pitch_change);
		var yaw = new vec3(orientation[0][1], orientation[1][1], orientation[2][1]); // up
		yaw = mult_vec_scalar(yaw, this.shared_scratchpad.heading_change);
		var roll = new vec3(-1*orientation[0][2], -1*orientation[1][2], -1*orientation[2][2]); //forward
		var direction = roll;
		roll = mult_vec_scalar(roll, this.shared_scratchpad.roll_change-frame_roll);
		
		var orientationChange = add(add(pitch, yaw), roll);
		var angularChange = magnitude(orientationChange); // scalar
		
		var overallChange = mat4(1);
		if(angularChange != 0) {
			var rotationAxis = normalize(orientationChange); // vector
			overallChange = rotation(angularChange, rotationAxis);
			
			this.shared_scratchpad.orientation = mult( overallChange, this.shared_scratchpad.orientation);
		}
		
		this.shared_scratchpad.position = add(this.shared_scratchpad.position, mult_vec_scalar(normalize(direction), this.shared_scratchpad.speed));
		
		var transition = new mat4();
		transition = mult(transition, translation(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2]));
		transition = mult(transition, this.shared_scratchpad.orientation);
		
		shapes_in_use.plane.draw(graphics_state, transition, material);
		
		return transition;
		
	},
	'drawCamera': function(graphics_state, current_orientation){
		// get pitch, yaw, and roll of plane. If heading or pitch is changing, exaggerage camera
		var max_change = 1.3;
		var frame_change = 0.01;
		var orientation = current_orientation;
		
		if(this.shared_scratchpad.pitch_change > 0 && this.shared_scratchpad.camera_extra_pitch < max_change)
		{
			this.shared_scratchpad.camera_extra_pitch += frame_change;
		}
		else if(this.shared_scratchpad.pitch_change < 0 && this.shared_scratchpad.camera_extra_pitch > -1*max_change)
		{
			this.shared_scratchpad.camera_extra_pitch -= frame_change;
		}
		else if(this.shared_scratchpad.pitch_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.camera_extra_pitch > 0)
			{
				this.shared_scratchpad.camera_extra_pitch -= frame_change;
			}
			if(this.shared_scratchpad.camera_extra_pitch < 0)
			{
				this.shared_scratchpad.camera_extra_pitch += frame_change;
			}
		}
		
		if(this.shared_scratchpad.heading_change > 0 && this.shared_scratchpad.camera_extra_heading < max_change)
		{
			this.shared_scratchpad.camera_extra_heading += frame_change;
		}
		else if(this.shared_scratchpad.heading_change < 0 && this.shared_scratchpad.camera_extra_heading > -1*max_change)
		{
			this.shared_scratchpad.camera_extra_heading -= frame_change;
		}
		else if(this.shared_scratchpad.heading_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.camera_extra_heading > 0)
			{
				this.shared_scratchpad.camera_extra_heading -= frame_change;
			}
			if(this.shared_scratchpad.camera_extra_heading < 0)
			{
				this.shared_scratchpad.camera_extra_heading += frame_change;
			}
		}
		
		// set eye
		var eye = new Array();
		eye.push(this.shared_scratchpad.position[0]); // x
		eye.push(this.shared_scratchpad.position[1]); // y
		eye.push(this.shared_scratchpad.position[2]); // z

		var x_axis = new vec3(orientation[0][0], orientation[1][0], orientation[2][0]); // x_axis
		x_axis = normalize(x_axis);
		
		var z_axis = new vec3(orientation[0][2], orientation[1][2], orientation[2][2]); // z_axis
		z_axis = normalize(z_axis);
		eye = add(eye, mult_vec_scalar(z_axis,5));
		
		var y_axis = new vec3(orientation[0][1], orientation[1][1], orientation[2][1]); // y_axis
		y_axis = normalize(y_axis);
		eye = add(eye, mult_vec_scalar(y_axis,1));
		
		// set at
		var at = new vec3(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2]);
		at = add(at, mult_vec_scalar(y_axis,this.shared_scratchpad.camera_extra_pitch));
		at = add(at, mult_vec_scalar(x_axis, -1*this.shared_scratchpad.camera_extra_heading));
		
		// set up
		var roll = new vec4(orientation[0][1], orientation[1][1], orientation[2][1], 1); //forward

		if(this.shared_scratchpad.extra_roll != 0)
		{
			roll = mult_vec(rotation(-1*this.shared_scratchpad.extra_roll, z_axis),roll);
		}
		
		var up = new Array();
		up.push(roll[0]);
		up.push(roll[1]);
		up.push(roll[2]);
		
		var transition = mat4();
		transition = mult(transition, lookAt(eye, at, up));
		graphics_state.camera_transform = transition;

	}
}, Animation);
