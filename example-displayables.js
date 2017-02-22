Declare_Any_Class( "Example_Camera",     
  { 'construct': function( context )     
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State( translation(0, 0,-25), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, origin: vec3( 0, 5, 0 ), looking: false } );

      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { 
	//controls.add( "Space", this, function() { this.thrust[1] = -1; } );     controls.add( "Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
      },

  }, Animation );

Declare_Any_Class( "Example_Animation", 
  { 'construct': function( context )
      { this.shared_scratchpad = context.shared_scratchpad;
      
        shapes_in_use.tetrahedron = new Tetrahedron();
      },
    'init_keys': function( controls )
      {
        //controls.add( "ALT+g", this, function() { this.shared_scratchpad.graphics_state.gouraud ^= 1; } );
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
        var purplePlastic = new Material( Color( .9,.5,.9,1 ), .4, .4, .8, 40 ); // Omit the final (string) parameter if you want no texture


        model_transform = mult( model_transform, translation( 0, -2, 0 ) );
        shapes_in_use.tetrahedron    .draw( graphics_state, model_transform, purplePlastic );
        
      }
  }, Animation );
