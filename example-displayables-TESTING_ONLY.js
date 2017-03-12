
var RES_RATIO = 16;	
var RES = 2;
var DRAW_DIST = 3;
var DIR_DRAW_DIST = 2;
var WORLD_SIZE = 16384;
var WORLD_HEIGHT = 256;
var SPEED_INC = .01;
var DEFERRED = false;

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
		
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now
		shapes_in_use.square = new Square();
		this.GBuffer = new FBO(canvas.width,canvas.height,4);
		
		//World setup
		shapes_in_use.terrain = new Terrain();	
		this.t_loop_count = 0;		
		
		//Testing stuff
		// this.test_node = Node_add(vec3(0,32,0), 32, this.world_tree);			
		// shapes_in_use.terrain.to_draw[0] = this.test_node;
		//End testing things
		
		

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
		
		this.shared_scratchpad.orientation = mat4(1); // create identity matrix as orientation
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
			this.GBuffer.activate();
			shaders_in_use["G_buf_gen_NormalSpray"].activate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			shapes_in_use.skybox.draw(this.shared_scratchpad.graphics_state,this.sbtrans, skyMat);
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
			// gl.activeTexture(gl.TEXTURE1);
			// gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[1]);
			// gl.activeTexture(gl.TEXTURE2);
			// gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[2]);
			// gl.activeTexture(gl.TEXTURE3);
			// gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[3]);
			// gl.activeTexture(gl.TEXTURE4);
			// gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[4]);
			shaders_in_use["G_buf_light_NormalSpray"].activate();

			//Render to screen
			shapes_in_use.square.draw(this.shared_scratchpad.graphics_state,new mat4(),aMaterial );
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		else{
			shaders_in_use["Default"].activate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			this.generate_G_Buffer(time);
		}
		
    },
	
	'draw_terrain': function(graphics_state, collectableMaterial){
			
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now

		
		if(this.t_loop_count == 0)
		{
			console.log(this.shared_scratchpad.orientation);
			//On each larger loop, first get a new to_check list
			shapes_in_use.terrain.choose_to_check(this.shared_scratchpad.position, this.shared_scratchpad.orientation);
			
			//Next, check all of them
			shapes_in_use.terrain.check_all();
		}
		else
		{
			var draw_ct = 1;	//How many blocks to draw per loop
			//On loop 1 and subsequent loops, gradually create terrain
			for(var i = this.t_loop_count*draw_ct - draw_ct; i < this.t_loop_count*draw_ct; i++)	//4 per loop
			{
				if(shapes_in_use.terrain.to_create[i])	//If the node exists, i.e. if we aren't done drawing all the geometry yet
					shapes_in_use.terrain.populate_CPU(shapes_in_use.terrain.to_create[i]);	//Generate that block's terrain
				else
				{
					//All the new geometry is drawn, yay!
					shapes_in_use.terrain.to_draw = shapes_in_use.terrain.to_draw_new;	//Now we draw the new geometry
					shapes_in_use.terrain.to_draw_new = [];	//Reset it for the next loop
					shapes_in_use.terrain.to_create = [];
					this.t_loop_count = -1;	//Because we increment it later
					break;
				}
			}
		}
		//Draw everything, as usual
		for(var i = 0; i < shapes_in_use.terrain.to_draw.length; i++)
		{
			shapes_in_use.terrain.copy_onto_graphics_card();
		}	
		model_transform = mat4();		
		shapes_in_use.terrain.draw(graphics_state, model_transform, landMaterial);
		this.t_loop_count++;
		
		//Check for plane collision with ground:
		//if(sign_density(add(this.shared_scratchpad.position, vec3()
		var plane_col = [add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0,0,-0.5,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(-0.5,0,0,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0.5,0,0,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0,0,0.3,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0,0,0.3,0)))];
		for(var i = 0; i < 5; i++)
		{
			if(sign_density(plane_col[i]))
			{
				//We crashed!
				console.log("Crashed into ground!");
				this.shared_scratchpad.speed = 0.01;	//Not 0 so we can still get out for debugging purposes
				//Also, do something more interesting eventually?
			}
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

		// draw collectable
		this.drawCollectables(graphics_state, collectableMaterial); //HACK FIX. <- make collectables a class and/or interface for object oriented happiness :D

		// make camera follow the plane
		this.drawCamera(graphics_state, current_orientation);
		
		this.draw_terrain(graphics_state, current_orientation);
	
	
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
		
		var orientation = this.shared_scratchpad.orientation;
		var pitch = new vec3(orientation[0][0], orientation[1][0], orientation[2][0]); // right
		pitch = mult_vec_scalar(pitch, this.shared_scratchpad.pitch_change);
		var yaw = new vec3(orientation[0][1], orientation[1][1], orientation[2][1]); // up
		yaw = mult_vec_scalar(yaw, this.shared_scratchpad.heading_change);
		var roll = new vec3(-1*orientation[0][2], -1*orientation[1][2], -1*orientation[2][2]); //forward
		var direction = roll;
		roll = mult_vec_scalar(roll, this.shared_scratchpad.roll_change);
		
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
		transition = mult(transition, this.shared_scratchpad.orientation)
		
		shapes_in_use.plane.draw(graphics_state, transition, material);
		
		return transition;
		
	},
	'drawCamera': function(graphics_state, current_orientation){
		// get pitch, yaw, and roll of plane. If heading or pitch is changing, exaggerage camera
		var max_change = 20;
	
		var orientation = current_orientation;

		if(this.shared_scratchpad.pitch_change > 0 && this.shared_scratchpad.camera_extra_pitch < max_change)
			this.shared_scratchpad.camera_extra_pitch += 1;
		else if(this.shared_scratchpad.pitch_change < 0 && this.shared_scratchpad.camera_extra_pitch > -1*max_change)
			this.shared_scratchpad.camera_extra_pitch -= 1;
		else
		{
			// bring back to center
			if(this.shared_scratchpad.camera_extra_pitch > 0)
				this.shared_scratchpad.camera_extra_pitch -= 1;
			if(this.shared_scratchpad.camera_extra_pitch < 0)
				this.shared_scratchpad.camera_extra_pitch += 1;
		}
		var pitch = new vec3(orientation[0][0], orientation[1][0], orientation[2][0]); // right
		pitch = mult_vec_scalar(pitch, this.shared_scratchpad.pitch_change);
		
		var yaw = new vec3(orientation[0][1], orientation[1][1], orientation[2][1]); // up
		yaw = mult_vec_scalar(yaw, this.shared_scratchpad.heading_change);

		var roll = new vec3(-1*orientation[0][2], -1*orientation[1][2], -1*orientation[2][2]); //forward
		var direction = roll;
		roll = mult_vec_scalar(roll, this.shared_scratchpad.roll_change);
		
		var orientationChange = add(add(pitch, yaw), roll);
		var angularChange = magnitude(orientationChange); // scalar
		
		var overallChange = mat4(1);
		if(angularChange != 0) {
			var rotationAxis = normalize(orientationChange); // vector
			overallChange = rotation(angularChange, rotationAxis);
		}
		
		var cameraRotation = mult(this.shared_scratchpad.orientation, overallChange);
		this.shared_scratchpad.position = add(this.shared_scratchpad.position, mult_vec_scalar(normalize(direction), this.shared_scratchpad.speed));
		
		var transition = new mat4();
		transition = mult(transition, translation(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2]));
		transition = mult(transition, cameraRotation);
		transition = mult(transition, translation(0,1,5));
        graphics_state.camera_transform = inverse(transition);

	}
}, Animation);
