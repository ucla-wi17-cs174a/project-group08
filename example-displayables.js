Declare_Any_Class( "Example_Camera",     
  { 'construct': function( context )     
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State( translation(0, -1,-50), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 5, 0 ), looking: false, change_degree: 1 } );


      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { 
      },

  }, Animation );

Declare_Any_Class( "Example_Animation", 
  { 'construct': function( context )
      { this.shared_scratchpad = context.shared_scratchpad;
      
        shapes_in_use.tetrahedron = new Tetrahedron();
	shapes_in_use.sphere = new Subdivision_Sphere(4);
	this.shared_scratchpad.heading = 0;
	this.shared_scratchpad.pitch = 0;

	this.shared_scratchpad.x = 0;
	this.shared_scratchpad.y = 0;
	this.shared_scratchpad.z = 0;
	this.shared_scratchpad.speed = 0.1;
      },
    'init_keys': function( controls )
      {
	var degree_change = 1;
	controls.add("up", this, function() { this.shared_scratchpad.pitch += degree_change; });
	controls.add("down", this, function() { this.shared_scratchpad.pitch -= degree_change; });
	controls.add("left", this, function() { this.shared_scratchpad.heading += degree_change; });
	controls.add("right", this, function() { this.shared_scratchpad.heading -= degree_change; });
      	controls.add("1", this, function() { this.shared_scratchpad.speed = 0.1; });
      	controls.add("2", this, function() { this.shared_scratchpad.speed = 0.2; });
      	controls.add("3", this, function() { this.shared_scratchpad.speed = 0.3; });
      	controls.add("4", this, function() { this.shared_scratchpad.speed = 0.4; });
      	controls.add("5", this, function() { this.shared_scratchpad.speed = 0.5; });
      	controls.add("6", this, function() { this.shared_scratchpad.speed = 0.6; });
      	controls.add("7", this, function() { this.shared_scratchpad.speed = 0.7; });
      	controls.add("8", this, function() { this.shared_scratchpad.speed = 0.8; });
      	controls.add("9", this, function() { this.shared_scratchpad.speed = 0.9; });
	},
    'display': function(time)
      {
        var graphics_state  = this.shared_scratchpad.graphics_state,
            model_transform = mat4();
        shaders_in_use[ "Default" ].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        // If you want more than two lights, you're going to need to increase a number in the vertex shader file (index.html).  For some reason this won't work in Firefox.
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

        var t = graphics_state.animation_time/1000, light_orbit = [ Math.cos(t), Math.sin(t) ];
	graphics_state.lights.push( new Light( vec4(-10,10,0,1), Color(1,0,0,1),100000));
        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var sphereMaterial = new Material( Color( 1,0,1,1 ), .4, .4, .8, 40 ); // Omit the final (string) parameter if you want no texture
        var tetraMaterial = new Material( Color( 0,1,1,1 ), .4, .4, .8, 40 ); // Omit the final (string) parameter if you want no texture

	// create sphere for frame of reference
	model_transform = mult(model_transform, translation(0,0,-100));
	shapes_in_use.sphere.draw(graphics_state, model_transform, sphereMaterial);
	model_transform = mult(model_transform, translation(0,0,100));
		
	// create tetrahedron for temp plane
	// move forward based on current heading
	var forward_speed = this.shared_scratchpad.speed;

	var y_change = Math.sin(radians(this.shared_scratchpad.pitch)) * forward_speed;
	var xz_change = Math.cos(radians(this.shared_scratchpad.pitch)) * forward_speed;

	var x_change = -1*Math.sin(radians(this.shared_scratchpad.heading))*xz_change;
	var z_change = -1*Math.cos(radians(this.shared_scratchpad.heading))*xz_change;
	
	this.shared_scratchpad.x += x_change;
	this.shared_scratchpad.y += y_change;
	this.shared_scratchpad.z += z_change;

	model_transform = mult(model_transform, translation(this.shared_scratchpad.x, this.shared_scratchpad.y, this.shared_scratchpad.z));
	model_transform = mult(model_transform, rotation(this.shared_scratchpad.heading, 0,1,0));
	model_transform = mult(model_transform, rotation(this.shared_scratchpad.pitch, 1,0,0));
	shapes_in_use.tetrahedron.draw(graphics_state, model_transform, tetraMaterial);

	this.shared_scratchpad.graphics_state.camera_transform = mat4();
	// make camera follow the plane
	this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(10,1,0,0));
	this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(0,-5,-10));
	this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.heading, 0,-1,0));
	this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, rotation(this.shared_scratchpad.pitch, -1,0,0));
	this.shared_scratchpad.graphics_state.camera_transform = mult(this.shared_scratchpad.graphics_state.camera_transform, translation(-1*this.shared_scratchpad.x, -1*this.shared_scratchpad.y, -1*this.shared_scratchpad.z));
      }
  }, Animation );
