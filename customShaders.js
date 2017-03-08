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
			
            vec4 ospos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * ospos;
            fTexCoord = vTexCoord;
			fNormal = vNormal;
			pos = ospos;
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
		
		uniform sampler2D texture;
		uniform bool USE_TEXTURE;
		
		void main()
		{
		float x_com = abs(dot(fNormal,vec3(1,0,0)));
		float y_com = abs(dot(fNormal,vec3(0,1,0)));
		float z_com = abs(dot(fNormal,vec3(0,0,1)));
		//gl_FragColor = vec4(x_com,y_com,z_com,1.0);
		//gl_FragData[0] = vec4(pos.x,pos.y,pos.z,1.0);
		gl_FragData[0] = vec4(x_com,y_com,z_com,1.0);
		gl_FragData[1] = vec4(int(fNormal.x),int(fNormal.y),int(fNormal.z),1.0);
		if(USE_TEXTURE)
			gl_FragData[0] = texture2D(texture,fTexCoord);
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
			gl_FragColor = vec4(p.x,p.y,p.z,1.0);
			//gl_FragColor = vec4(x_com,y_com,z_com,1.0);
			//gl_FragColor = vec4(1.0,0.0,1.0,1.0);
			//gl_FragColor = err;
		}
	  `;
      }
  }, Shader );
  
    Declare_Any_Class( "G_buf_light_Phong",
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

        if( g_state.gouraud === undefined ) { g_state.gouraud = g_state.color_normals = false; }    // Keep the flags seen by the shader program
        gl.uniform1i( g_addrs.GOURAUD_loc,         g_state.gouraud      );                          // up-to-date and make sure they are declared.
        gl.uniform1i( g_addrs.COLOR_NORMALS_loc,   g_state.color_normals);

        gl.uniform4fv( g_addrs.shapeColor_loc,     material.color       );    // Send a desired shape-wide color to the graphics card
        gl.uniform1f ( g_addrs.ambient_loc,        material.ambient     );
        gl.uniform1f ( g_addrs.diffusivity_loc,    material.diffusivity );
        gl.uniform1f ( g_addrs.shininess_loc,      material.shininess   );
        gl.uniform1f ( g_addrs.smoothness_loc,     material.smoothness  );
        gl.uniform1f ( g_addrs.animation_time_loc, g_state.animation_time / 1000 );

        if( !g_state.lights.length )  return;
        var lightPositions_flattened = [], lightColors_flattened = []; lightAttenuations_flattened = [];
        for( var i = 0; i < 4 * g_state.lights.length; i++ )
          { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
            lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
            lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
          }
        gl.uniform4fv( g_addrs.lightPosition_loc,       lightPositions_flattened );
        gl.uniform4fv( g_addrs.lightColor_loc,          lightColors_flattened );
        gl.uniform1fv( g_addrs.attenuation_factor_loc,  lightAttenuations_flattened );
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
			vec4 tex_color = texture2D( texture, fTexCoord );
            gl_FragColor = tex_color * ( USE_TEXTURE ? ambient : 0.0 ) + vec4( shapeColor.xyz * ambient, USE_TEXTURE ? shapeColor.w * tex_color.w : shapeColor.w ) ;
            for( int i = 0; i < N_LIGHTS; i++ )
            {
              float attenuation_multiplier = 1.0 / (1.0 + attenuation_factor[i] * (dist[i] * dist[i]));
              float diffuse  = max(dot(L[i], N), 0.0);
              float specular = pow(max(dot(N, H[i]), 0.0), shininess);

              gl_FragColor.xyz += attenuation_multiplier * (shapeColor.xyz * diffusivity * diffuse  + lightColor[i].xyz * shininess * specular );
            }
		}
	  `;
      }
  }, Shader );