
var RES_RATIO = 8;	
var RES = 4;

var DRAW_DIST = 1;
var DIR_DRAW_DIST = 1;
var LOW_DRAW_DIST = 3;
var LOW_DIR_DRAW_DIST = 2;

var WORLD_SIZE = 16384;
var WORLD_HEIGHT = 64;

var SPEED_INC = .01;
var DEFERRED = false;

// Create the textbox
Declare_Any_Class( "Debug_Screen",
  { 'construct': function( context )
      { this.define_data_members( { shared_scratchpad: context.shared_scratchpad, numCollected: 0, gameState: "start", numFrames: 0, FPS: 0, graphics_state: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
		this.shared_scratchpad.numCollected = 0;
		this.shared_scratchpad.gameState = "start";
		this.startTime = new Date();
		this.endTime = new Date();
      },
    'init_keys': function( controls )
      { 
      },
	  // update the values in string
    'update_strings': function( debug_screen_object )
      { 
		this.numCollected = this.shared_scratchpad.numCollected;
		this.gameState = this.shared_scratchpad.gameState; // start, playing, end
      },
    'display': function( time )
      {
		this.numFrames++;
		if(this.numFrames == 10)
		{
			this.endTime = new Date();
			this.FPS = Number((10/((this.endTime - this.startTime)/1000)).toFixed(3));
			this.startTime = this.endTime;
			this.numFrames = 0;
		}
        shaders_in_use["Default"].activate();

        var font_scale = scale( .02, .04, 1 );
		var model_transform = mat3();
		
		if(this.gameState == "start")
		{
			var start_scale = mult(font_scale, scale(2,2,2));
			model_transform = mult(translation(-0.6,0.3,0), start_scale);
			shapes_in_use.debug_text.set_string("PRESS ENTER TO START");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) ); 
			
			// draw controls
			model_transform = mat3();
			model_transform = mult(translation(0.5, 0.9, 0), font_scale);
			shapes_in_use.debug_text.set_string("CONTROLS");
			shapes_in_use.debug_text.draw(this.graphics_state, model_transform, true, vec4(0,0,0,1));
			
			model_transform = mult(translation(0, -0.08, 0), model_transform);
			shapes_in_use.debug_text.set_string("YAW:      ARROWS");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
			
			model_transform = mult(translation(0, -0.08, 0), model_transform);
			shapes_in_use.debug_text.set_string("PITCH:    ARROWS");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) ); 
			
			model_transform = mult(translation(0, -0.08, 0), model_transform);
			shapes_in_use.debug_text.set_string("ROLL:     G ; H");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
		
			model_transform = mult(translation(0, -0.08, 0), model_transform);
			shapes_in_use.debug_text.set_string("SPEED:    Z-/");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );

			model_transform = mult(translation(0, -0.08, 0), model_transform);
			shapes_in_use.debug_text.set_string("NEW GAME: ENTER");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
		
		}
		
		else if(this.gameState == "playing")
		{
			model_transform = mult( translation( -.95, -.9, 0 ), font_scale );

			// draw the text box
			shapes_in_use.debug_text.set_string("Collected: " + this.numCollected.toString() );
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
			
			shapes_in_use.debug_text.set_string("FPS: " + this.FPS);
			model_transform = mult( translation( 0, .08, 0 ), model_transform );
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
	    }
		else if(this.gameState == "end")
		{
			var end_scale = mult(font_scale, scale(2,2,2));
			model_transform = mult(translation(-0.6,0.3,0), end_scale);
			shapes_in_use.debug_text.set_string("CRASHED INTO THE MAP!");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );

			model_transform = new mat3();
			model_transform = mult(translation(-0.25,-0.3,0), font_scale);
			shapes_in_use.debug_text.set_string("TOTAL COLLECTED: " + this.numCollected.toString());
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
			
			model_transform = new mat3();
			model_transform = mult(translation(-0.25,-0.45,0), font_scale);
			shapes_in_use.debug_text.set_string("PRESS ENTER TO RESTART");
			shapes_in_use.debug_text.draw( this.graphics_state, model_transform, true, vec4(0,0,0,1) );
		}
		
      }
  }, Animation );

// initial camera creation
Declare_Any_Class("Example_Camera", {
    'construct': function(context) {
        context.shared_scratchpad.graphics_state = new Graphics_State(translation(0, -1, -10), perspective(45, canvas.width / canvas.height, .1, 1000), 0);
        this.define_data_members({
            graphics_state: context.shared_scratchpad.graphics_state,
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
		shapes_in_use.grass = new Array();
		shapes_in_use.collection_object = new Array();
		
		//Test Grass
		shapes_in_use.grassyGnoll = new Imported_Object("Grass.obj",0,0,-100,0,1,0);
		
		// add grass
		shapes_in_use.grass.push(new Imported_Object("Grass.obj",0,0,-100,0,1,1)); 
		
		// declare any number of objects
		shapes_in_use.collection_object.push(new Collection_Object("Gate.obj", 50, 50, -150));
		shapes_in_use.collection_object.push(new Collection_Object("Gate_twirl.obj", 50, 50, -150));
		
		shapes_in_use.collection_object.push(new Collection_Object("Gate.obj", -50, 50, -150));
		shapes_in_use.collection_object.push(new Collection_Object("Gate_twirl.obj", -50, 50, -150));
		
		shapes_in_use.collection_object.push(new Collection_Object("Gate.obj", 50, 50, -100));
		shapes_in_use.collection_object.push(new Collection_Object("Gate_twirl.obj", 50, 50, -100));
		
		shapes_in_use.collection_object.push(new Collection_Object("Gate.obj", -50, 50, -100));
		shapes_in_use.collection_object.push(new Collection_Object("Gate_twirl.obj", -50, 50, -100));

		// create plane
		shapes_in_use.plane = new Imported_Object("ThreePlane.obj",0,0,0,0,0,0);

		
		shapes_in_use.square = new Square();
		shapes_in_use.skybox = new Cube();
		this.GBuffer = new FBO(canvas.width,canvas.height,5,false);
		
		//World setup
		shapes_in_use.terrain = new Terrain();	
		this.t_loop_count = 0;
		
		
        this.shared_scratchpad.speed = 0;
		
		this.shared_scratchpad.pitch_change = 0; // how much to change pitch
		this.shared_scratchpad.heading_change = 0; // how much to change heading
		this.shared_scratchpad.roll_change = 0;
		this.shared_scratchpad.extra_roll = 1;
		
		this.shared_scratchpad.orientation = mat4(1); // create identity matrix as orientation
		this.shared_scratchpad.position = vec3(0,32,0);
		this.shared_scratchpad.position[2] = -5;
		
		this.shared_scratchpad.camera_extra_pitch = 0;
		this.shared_scratchpad.camera_extra_heading = 0;
    },
    'init_keys': function(controls) {
		controls.add("enter", this, function() {
			if(this.shared_scratchpad.gameState == "start")
			{
				this.shared_scratchpad.gameState = "playing";
				this.shared_scratchpad.speed = 0.1;
			}
			else
			{
				this.shared_scratchpad.gameState = "start";
				
				this.shared_scratchpad.speed = 0;
			
				this.shared_scratchpad.pitch_change = 0; // how much to change pitch
				this.shared_scratchpad.heading_change = 0; // how much to change heading
				this.shared_scratchpad.roll_change = 0;
				this.shared_scratchpad.extra_roll = 1;
				
				this.shared_scratchpad.orientation = mat4(1); // create identity matrix as orientation
				this.shared_scratchpad.position = vec3(0,0,0);
				this.shared_scratchpad.position[2] = -5;
				
				this.shared_scratchpad.camera_extra_pitch = 0;
				this.shared_scratchpad.camera_extra_heading = 0;
				
				for(var i = 0; i < shapes_in_use.collection_object.length; i++)
				{
					shapes_in_use.collection_object[i].collected = false;
					shapes_in_use.collection_object[i].touched = false;
				}
				this.shared_scratchpad.numCollected = 0;
			}
		});
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
            this.shared_scratchpad.heading_change = 0.55;
        });
		controls.add( "3", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("4", this, function() {
            this.shared_scratchpad.heading_change = 0.3;
        });
		controls.add( "4", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("5", this, function() {
            this.shared_scratchpad.heading_change = 0.1;
        });
		controls.add( "5", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("6", this, function() {
            this.shared_scratchpad.heading_change = -0.1;
        });
		controls.add( "6", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("7", this, function() {
            this.shared_scratchpad.heading_change = -0.3;
        });
		controls.add( "7", this, function() { 
			this.shared_scratchpad.heading_change =  0; }, {'type':'keyup'} 
		);
		controls.add("8", this, function() {
            this.shared_scratchpad.heading_change = -0.55;
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
            this.shared_scratchpad.pitch_change = 0.55;
        });
		controls.add( "e", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("r", this, function() {
            this.shared_scratchpad.pitch_change = 0.3;
        });
		controls.add( "r", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("t", this, function() {
            this.shared_scratchpad.pitch_change = 0.1;
        });
		controls.add( "t", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("y", this, function() {
            this.shared_scratchpad.pitch_change = -0.1;
        });
		controls.add( "y", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("u", this, function() {
            this.shared_scratchpad.pitch_change = -0.3;
        });
		controls.add( "u", this, function() { 
			this.shared_scratchpad.pitch_change =  0; }, {'type':'keyup'} 
		);
		controls.add("i", this, function() {
            this.shared_scratchpad.pitch_change = -0.55;
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
		
		// set speed
		controls.add("/", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.9;
        });
		controls.add(".", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.8;
        });
		controls.add(",", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.7;
        });
		controls.add("m", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.6;
        });
		controls.add("n", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.5;
        });
		controls.add("b", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.4;
        });
		controls.add("v", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.3;
        });
		controls.add("c", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.2;
        });
		controls.add("x", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.1;
        });
		controls.add("z", this, function() {
			if(this.shared_scratchpad.gameState == "playing")
				this.shared_scratchpad.speed = 0.0;
        });
		
		// Shading DEBUG Toggle
		controls.add("a", this, function(){
			DEFERRED = !DEFERRED;
			console.log("Swapped to DEFERRED = ", DEFERRED);
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
			////bind GBuffer and disable transparency
			gl.disable(gl.BLEND);
			this.GBuffer.activate();
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.GBuffer.rb);

			gl.disable(gl.BLEND);
			shaders_in_use["G_buf_gen_phong"].activate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			shapes_in_use.skybox.draw(this.shared_scratchpad.graphics_state,mat4(), skyMat);
			gl.clear(gl.DEPTH_BUFFER_BIT);
			this.renderOpaque(time);
			this.renderTransparent(time);
			this.GBuffer.deactivate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			for (var i =0; i<this.GBuffer.layers;i++){
				gl.activeTexture(texAddrs[i]);
				gl.bindTexture(gl.TEXTURE_2D, this.GBuffer.tx[i]);
			}
			shaders_in_use["G_buf_light_phong"].activate();
			
			//Render to screen
			shapes_in_use.square.draw(this.shared_scratchpad.graphics_state,new mat4(),aMaterial );

			//cleanup
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.enable(gl.BLEND);
			//Render transparency. Using alpha test to avoid sorting
			//this.renderTransparent(time);
			
			

		}
		else{
			shaders_in_use["Default"].activate();
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			this.renderOpaque(time);
			//this.renderTransparent(time);
		}
		
    },
	
	'draw_terrain': function(graphics_state, collectableMaterial){
	
		var landMaterialYellow = new Material(Color(0.25, 0.4, 0.0, 1.0), 0.6, 0.8, 0.2, 5);	//Just a placeholder for now

		var prevShader = active_shader;
		if(DEFERRED){
		shaders_in_use["G_buf_gen_terrain"].activate();	
		}
		gl.activeTexture(texAddrs[0]);
		gl.bindTexture(gl.TEXTURE_2D, textures_in_use["ZTEX.png"].id);
		gl.activeTexture(texAddrs[1]);
		gl.bindTexture(gl.TEXTURE_2D, textures_in_use["YTEX.png"].id);
		gl.activeTexture(texAddrs[2]);
		gl.bindTexture(gl.TEXTURE_2D, textures_in_use["ZTEX.png"].id);
		// var landMaterial = new Material(Color(0.4, 0.4, .4, 1), .6, .8, .4, 4,"FAKE.CHICKEN");	//Just a placeholder for now
		var landMaterial = new Material(Color(0.0, 0.0, 0.0, 1), .1, .2, .1, 80);	//Just a placeholder for now
		


		if(this.t_loop_count == 0)
		{
			//On each larger loop, first get a new to_check list	
			shapes_in_use.terrain.choose_to_check(this.shared_scratchpad.position, this.shared_scratchpad.orientation);
			//Next, check all of them
			shapes_in_use.terrain.check_all();
			//Now, purge old, unused geometry:
			var counter = 0;
			while(shapes_in_use.terrain.all_geom.length >= 500)	//Want that value as small as possible without causing issues
			{
				if(shapes_in_use.terrain.all_geom[0].checked == 5)
				{
					shapes_in_use.terrain.all_geom.shift();
				}
				else
				{
					shapes_in_use.terrain.all_geom.push(shapes_in_use.terrain.all_geom[0]);
					shapes_in_use.terrain.all_geom.shift();
				}
				counter++;
				if(counter >= 500)
				{
					break;	//So we don't get stuck in an infinite loop
					console.log("Need more old geometry saved");	//Also a good indicator that the number needs to increase
				}
			}
			
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
					for(var i = 0; i < shapes_in_use.terrain.to_draw_new.length; i++)
					{
						shapes_in_use.terrain.all_geom.push(shapes_in_use.terrain.to_draw_new[i]);
						shapes_in_use.terrain.to_draw_new[i].checked = 5;
					}
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
		//And send water over
		shapes_in_use.terrain.water_shape.copy_onto_graphics_card();
		shapes_in_use.terrain.water_shape.sent_to_GPU = true;
		model_transform = mat4();		
		shapes_in_use.terrain.draw(graphics_state, model_transform, landMaterial);
		this.t_loop_count++;
		//Check for plane collision with ground:
		//if(sign_density(add(this.shared_scratchpad.position, vec3()
		var plane_col = [add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0,0,-0.5,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(-0.5,0,0,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0.5,0,0,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(-0.5,0,0.3,0))),
						add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 0), mult_vec(this.shared_scratchpad.orientation, vec4(0.5,0,0.3,0)))];
		var col_count = 0;
		for(var i = 0; i < 5; i++)
		{
			if(sign_density(plane_col[i]))
			{
				col_count++;
				if(col_count >= 2)
				{
					//We crashed!
					this.shared_scratchpad.gameState = "end";
					this.shared_scratchpad.speed = 0;	
				}
			}
		}	
		col_count = 0;

		//Put this somewhere else later
		//graphics_state.lights.push(new Light(add(vec4(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 1), mult_vec(this.shared_scratchpad.orientation, vec4(-0.5,0,0.3,0))), Color(0.8, 0.8, 0.8, 1), 1000));
		
		

		
		//cleanup
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, null);
		prevShader.activate();	
	},	
	
	'renderTransparent': function(time){
		var graphics_state = this.shared_scratchpad.graphics_state;
	},
	'renderOpaque': function(time){
		var graphics_state = this.shared_scratchpad.graphics_state;
            model_transform = mat4();
        graphics_state.lights = [];

        var t = graphics_state.animation_time / 1000,
            light_orbit = [Math.cos(t), Math.sin(t)];
        graphics_state.lights.push(new Light(vec4(-10, 10, 0, 1), Color(1, 1, 1, 1), 100000));
		
        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var collectableMaterial = new Material(Color(1, 0, 1, 1), .4, .4, .8, 40); // Omit the final (string) parameter if you want no texture
        var tetraMaterial = new Material(Color(0, 1, 1, 1), .4, .4, .4, 40); // Omit the final (string) parameter if you want no texture
		var landMaterial = new Material(Color(0.4, 0.5, 0, 1), .6, .8, .4, 4);	//Just a placeholder for now
        var grassMat = new Material(Color(0.0,0.0,0.0, 1), .3, .6, .3, 80,"Grass.png"); 
		var water_material = new Material(Color(0.0, 0.3, 1.0, 1), .5, .2, .1, 80);	//Add texture later

		var current_orientation = this.shared_scratchpad.orientation;
		// draw plane
		var planeLocation = this.drawPlane(graphics_state, tetraMaterial);
		
		// make camera follow the plane
		this.drawCamera(graphics_state, current_orientation);
	
		this.draw_terrain(graphics_state, current_orientation);
		
		// draw collectable
		this.drawCollectables(graphics_state, collectableMaterial); 

		// draw grass
		this.drawGrass(graphics_state, grassMat);
		
		shapes_in_use.terrain.water_shape.draw(graphics_state, model_transform, water_material);


	
		//Hacky skyboxes, do properly later
		this.sbtrans = new mat4();
		var invRot = mat4();
		invRot = mult(rotation(10,1,0,0),invRot);
		invRot = mult(rotation(this.shared_scratchpad.heading, 0, -1, 0),invRot);
		invRot = mult(rotation(this.shared_scratchpad.pitch, -1, 0, 0),invRot);
		this.sbtrans = mult(inverse(this.shared_scratchpad.graphics_state.camera_transform),invRot);
		
	},
	// pass in array of positions and normals
	'addGrass': function(positions, normals) {
		for(var i = 0; i < positions.length; i++)
		{
			shapes_in_use.grass.push(new Imported_Object("Grass.obj",positions[i][0], positions[i][1], positions[i][2], normals[i][0], normals[i][1], normals[i][2]));
		}
	},
	// draws all grass in shapes_in_use.grass
	'drawGrass': function(graphics_state, material) {
		for(var i = 0; i < shapes_in_use.grass.length; i++)
		{
			var cur_grass = shapes_in_use.grass[i];
			
			var orientation = new mat4(1);
			// calculate pitch, yaw, and roll change based on normal
			var yaw_change = 0;
			var normal = normalize(vec3(cur_grass.normal_x, cur_grass.normal_y, cur_grass.normal_z));
			var vertical = vec3(0,1,0);
			var crossed = cross(normal, vertical);
			var angle = degrees(Math.asin(magnitude(crossed)));
			
			var transition = new mat4();
			transition = mult(transition, translation(cur_grass.x, cur_grass.y, cur_grass.z));
			if(angle != 0)
				transition = mult(transition, rotation(angle, crossed));
			
			cur_grass.draw(graphics_state, transition, material);
		}
	},
	'drawCollectables': function(graphics_state, collectableMaterial){
		// DRAW COLLECTION_OBJECT
		// create collection objects and check if it exists
		for(var i = 0; i < shapes_in_use.collection_object.length; i++)
		{
			var cur_collection = shapes_in_use.collection_object[i];
			if(cur_collection.collected == false)
			{
				if(cur_collection.touched == false && this.checkCollision(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 1, cur_collection.x, cur_collection.y, cur_collection.z, 0.5))
				{
					cur_collection.touched = true;
				}
				else if(cur_collection.touched == true && !this.checkCollision(this.shared_scratchpad.position[0], this.shared_scratchpad.position[1], this.shared_scratchpad.position[2], 1, cur_collection.x, cur_collection.y, cur_collection.z, 0.5))
				{
					cur_collection.collected = true;
					if(i % 2 == 0)
						this.shared_scratchpad.numCollected += 1;
				}
				else
				{
					var model_transform = mat4();
					model_transform = mult(model_transform, translation(cur_collection.x, cur_collection.y, cur_collection.z));
					if(i % 2 == 1)
					{
						cur_collection.rotation += 1;
						model_transform = mult(model_transform, rotation(cur_collection.rotation, 0, 0, 1));
					}
					model_transform = mult(model_transform, rotation(90,1,0,0));
					cur_collection.draw(graphics_state, model_transform, collectableMaterial);
				}
			}
		}
	},
	'drawPlane': function(graphics_state, material){
		// draw plane
		// change roll based on if yaw is changing
		var max_roll = 50;
		var frame_change = 2;
		
		var roll_amount = 0;
		if(this.shared_scratchpad.heading_change > 0 && this.shared_scratchpad.extra_roll < max_roll)
		{
			this.shared_scratchpad.extra_roll += frame_change;
			roll_amount += frame_change;
		}
		else if(this.shared_scratchpad.heading_change < 0 && this.shared_scratchpad.extra_roll > -1*max_roll)
		{
			this.shared_scratchpad.extra_roll -= frame_change;
			roll_amount -= frame_change;
		}
		else if(this.shared_scratchpad.heading_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.extra_roll > 0)
			{
				this.shared_scratchpad.extra_roll -= frame_change;
				roll_amount -= frame_change;
			}
			if(this.shared_scratchpad.extra_roll < 0)
			{
				this.shared_scratchpad.extra_roll += frame_change;
				roll_amount += frame_change;
			}
		}
		
		var orientation = this.shared_scratchpad.orientation;
		var pitch = new vec3(orientation[0][0], orientation[1][0], orientation[2][0]); // right
		pitch = mult_vec_scalar(pitch, this.shared_scratchpad.pitch_change);
		var yaw = new vec3(orientation[0][1], orientation[1][1], orientation[2][1]); // up
		yaw = mult_vec_scalar(yaw, this.shared_scratchpad.heading_change);
		var roll = new vec3(-1*orientation[0][2], -1*orientation[1][2], -1*orientation[2][2]); //forward
		var direction = roll;
		roll = mult_vec_scalar(roll, this.shared_scratchpad.roll_change-roll_amount);
		
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
		transition = mult(transition, scale(1.5, 1.5, 1.5));
		
		shapes_in_use.plane.draw(graphics_state, transition, material);
		
		return transition;
		
	},
	'drawCamera': function(graphics_state, current_orientation){
		// get pitch, yaw, and roll of plane. If heading or pitch is changing, exaggerage camera
		var max_change = 1.3;
		var frame_change_growing = 0.01;
		var frame_change_shrinking = 0.02;
		var orientation = current_orientation;
		
		if(this.shared_scratchpad.pitch_change > 0 && this.shared_scratchpad.camera_extra_pitch < max_change)
		{
			this.shared_scratchpad.camera_extra_pitch += frame_change_growing;
		}
		else if(this.shared_scratchpad.pitch_change < 0 && this.shared_scratchpad.camera_extra_pitch > -1*max_change)
		{
			this.shared_scratchpad.camera_extra_pitch -= frame_change_growing;
		}
		else if(this.shared_scratchpad.pitch_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.camera_extra_pitch > 0)
			{
				this.shared_scratchpad.camera_extra_pitch -= frame_change_shrinking;
			}
			if(this.shared_scratchpad.camera_extra_pitch < 0)
			{
				this.shared_scratchpad.camera_extra_pitch += frame_change_shrinking;
			}
		}
		
		if(this.shared_scratchpad.heading_change > 0 && this.shared_scratchpad.camera_extra_heading < max_change)
		{
			this.shared_scratchpad.camera_extra_heading += frame_change_growing;
		}
		else if(this.shared_scratchpad.heading_change < 0 && this.shared_scratchpad.camera_extra_heading > -1*max_change)
		{
			this.shared_scratchpad.camera_extra_heading -= frame_change_growing;
		}
		else if(this.shared_scratchpad.heading_change == 0)
		{
			// bring back to center
			if(this.shared_scratchpad.camera_extra_heading > 0)
			{
				this.shared_scratchpad.camera_extra_heading -= frame_change_shrinking;
			}
			if(this.shared_scratchpad.camera_extra_heading < 0)
			{
				this.shared_scratchpad.camera_extra_heading += frame_change_shrinking;
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
