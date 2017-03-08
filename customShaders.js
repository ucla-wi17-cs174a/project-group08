Declare_Any_Class( "G_buf_gen",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
		
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		
		
        attribute vec3 vPosition, vNormal;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
		varying vec3 fNormal;
		varying vec4 pos;
		void
		main()
		{
			
            vec4 object_space_pos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * object_space_pos;
            fTexCoord = vTexCoord;
			fNormal = vNormal;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require

		precision mediump float;
	
		varying vec3 fNormal;
		varying vec2 fTexCoord;
		void
		main()
		{
		float x_com = abs(dot(fNormal,vec3(1,0,0)));
		float y_com = abs(dot(fNormal,vec3(0,1,0)));
		float z_com = abs(dot(fNormal,vec3(0,0,1)));
		gl_FragData[0] = vec4(x_com,y_com,z_com,1.0);
		gl_FragData[1] = vec4(1.0,1.0,0.0,1.0);
		}
	  `;
      }
  }, Shader );
  
  Declare_Any_Class( "G_buf_phong",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
		
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		
		
        attribute vec3 vPosition, vNormal;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
		varying vec3 fNormal;
		varying vec4 pos;
		void
		main()
		{
			
            vec4 object_space_pos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * object_space_pos;
            fTexCoord = vTexCoord;
			fNormal = vNormal;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require

		precision mediump float;
	
		varying vec3 fNormal;
		varying vec2 fTexCoord;
		void
		main()
		{
		float x_com = abs(dot(fNormal,vec3(1,0,0)));
		float y_com = abs(dot(fNormal,vec3(0,1,0)));
		float z_com = abs(dot(fNormal,vec3(0,0,1)));
		gl_FragData[0] = vec4(x_com,y_com,z_com,1.0);
		gl_FragData[1] = vec4(1.0,1.0,0.0,1.0);
		}
	  `;
      }
  }, Shader );
  