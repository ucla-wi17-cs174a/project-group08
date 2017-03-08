Declare_Any_Class( "G_buf_gen_NormalSpray",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
		
          let [ P, C, M ]  = [ g_state.projection_transform, g_state.camera_transform, model_transform ],   // PCM will mean Projection * Camera * Model
          CM             = mult( C,  M ),
          PCM            = mult( P, CM ),                               // Send the current matrices to the shader.  Go ahead and pre-compute the products
          inv_trans_CM   = toMat3( transpose( inverse( CM ) ) );        // we'll need of the of the three special matrices and just send those, since these
                                                                        // will be the same throughout this draw call & across each instance of the vertex shader.
        gl.uniformMatrix4fv( g_addrs.camera_transform_loc,                  false, flatten(  C  ) );
        gl.uniformMatrix4fv( g_addrs.camera_model_transform_loc,            false, flatten(  CM ) );
        gl.uniformMatrix4fv( g_addrs.projection_camera_model_transform_loc, false, flatten( PCM ) );
        gl.uniformMatrix3fv( g_addrs.camera_model_transform_normal_loc,     false, flatten( inv_trans_CM ) );

      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		
		
        attribute vec3 vPosition, vNormal;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
		varying vec3 fNormal;
		varying vec4 pos;
		
		uniform mat4 projection_camera_model_transform;
		
		void main()
		{
			
            vec4 object_space_pos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * object_space_pos;
            fTexCoord = vTexCoord;
			fNormal = vNormal;
			pos = gl_Position;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require

		precision mediump float;
	
		varying vec3 fNormal;
		varying vec2 fTexCoord;
		varying vec4 pos;
		void main()
		{
		float x_com = abs(dot(fNormal,vec3(1,0,0)));
		float y_com = abs(dot(fNormal,vec3(0,1,0)));
		float z_com = abs(dot(fNormal,vec3(0,0,1)));
		//gl_FragColor = vec4(x_com,y_com,z_com,1.0);
		//gl_FragData[0] = vec4(pos.x,pos.y,pos.z,1.0);
		gl_FragData[0] = vec4(x_com,y_com,z_com,1.0);
		gl_FragData[1] = vec4(int(fNormal.x),int(fNormal.y),int(fNormal.z),1.0);
		}
	  `;
      }
  }, Shader );
  
  Declare_Any_Class( "G_buf_light_NormalSpray",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
		
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		
		
        attribute vec3 vPosition;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
		
		void main()
		{
			
            gl_Position = vec4(vPosition, 1.0);
            fTexCoord = vTexCoord;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
		precision mediump float;
	
		varying vec2 fTexCoord;
		
		uniform sampler2D tex1;
		uniform sampler2D tex2;
		
		void main()
		{
			vec3 fNormal = texture2D(tex2,fTexCoord).xyz;
			vec4 p = texture2D(tex1,fTexCoord);
			float x_com = abs(dot(fNormal,vec3(1,0,0)));
			float y_com = abs(dot(fNormal,vec3(0,1,0)));
			float z_com = abs(dot(fNormal,vec3(0,0,1)));
			//vec4 err = vec4(x_com,y_com,z_com,0.0);
			//err = p-err;
			//gl_FragColor = vec4(p.x,p.y,p.z,1.0);
			gl_FragColor = vec4(x_com,y_com,z_com,1.0);
			//gl_FragColor = vec4(1.0,0.0,1.0,1.0);
			//gl_FragColor = err;
		}
	  `;
      }
  }, Shader );
  