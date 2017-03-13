/*
Declare_Any_Class( "G_buf_gen_NormalSpray_hf",
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
		uniform mat4 camera_model_transform;
		
		void main()
		{
			
            vec4 ospos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * ospos;
            fTexCoord = vTexCoord;
			fNormal = vNormal;
			pos = ( camera_model_transform * ospos );
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require
		
		precision mediump float;
		
		void float16toRG(in float v, out vec2 ret)
		{
			v = v+65504.0;
			
			ret = vec2(floor(v/512.0),fract(v/512.0)*512.0);
		}
		void RGtofloat16 ( in vec2 rg, out float ret )
		{
		  ret = dot( rg, vec2(512.0,1.0) )-65504.0;
		}
	  
		
	
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
			// vec3 biasedNorm = (fNormal+1.0)*.5;
			// gl_FragData[2] = vec4(biasedNorm,1.0);
			// gl_FragData[0] = shapeColor;
			// gl_FragData[1] = vec4(ambient,diffusivity,shininess,smoothness);
			// gl_FragData[3] = vec4(float16toRG(pos.x),float16toRG(pos.z));

			}
	  `;
      }
  }, Shader );
  
  Declare_Any_Class( "G_buf_light_NormalSpray_hf",
  { 'update_uniforms'          : function( g_state, model_transform, material )     // Send javascrpt's variables to the GPU to update its overall state.
      {
		
		gl.uniform1i(g_addrs.tex1_loc, 0);
		gl.uniform1i(g_addrs.tex2_loc, 1);
		gl.uniform1i(g_addrs.tex3_loc, 2);
		gl.uniform1i(g_addrs.tex4_loc, 3);
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
		uniform sampler2D tex3;
		uniform sampler2D tex4;
		
		void main()
		{
			vec3 fNormal = texture2D(tex2,fTexCoord).xyz;
			fNormal = 2.0*fNormal-1.0;
			// vec4 p = texture2D(tex1,fTexCoord);
			float x_com = abs(dot(fNormal,vec3(1,0,0)));
			float y_com = abs(dot(fNormal,vec3(0,1,0)));
			float z_com = abs(dot(fNormal,vec3(0,0,1)));
			
			// vec4 err = vec4(x_com,y_com,z_com,0.0);
			// err = p-err;
			//gl_FragColor = vec4(p.x,p.y,p.z,1.0);
			//gl_FragColor = vec4(x_com,y_com,z_com,1.0);
			vec4 pos = texture2D(tex3,fTexCoord);
			gl_FragColor = vec4(abs(pos.z),abs(pos.z),abs(pos.z),1.0);
			//gl_FragColor = vec4(1.0,0.0,1.0,1.0);
			//gl_FragColor = err;
		}
	  `;
      }
  }, Shader );
  

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
		//gl.activeTexture(gl.TEXTURE0);
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
		
		uniform sampler2D texture;
		//uniform sampler2D tex2;
		
		void main()
		{
			//vec3 fNormal = texture2D(tex2,fTexCoord).xyz;
			//vec4 p = texture2D(tex1,fTexCoord);
			//float x_com = abs(dot(fNormal,vec3(1,0,0)));
			//float y_com = abs(dot(fNormal,vec3(0,1,0)));
			//float z_com = abs(dot(fNormal,vec3(0,0,1)));
			//vec4 err = vec4(x_com,y_com,z_com,0.0);
			//err = p-err;

			//gl_FragColor = vec4(p.x,p.y,p.z,1.0);

			//gl_FragColor = vec4(x_com,y_com,z_com,1.0);
			//gl_FragColor = vec4(1.0,0.0,1.0,1.0);
			gl_FragColor = texture2D(texture,fTexCoord);
		}
	  `;
      }
  }, Shader );

 */ 
 Declare_Any_Class( "G_buf_gen_terrain",
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
		
        gl.uniform4fv( g_addrs.shapeColor_loc,     material.color       );    // Send a desired shape-wide color to the graphics card
        gl.uniform1f ( g_addrs.ambient_loc,        material.ambient     );
        gl.uniform1f ( g_addrs.diffusivity_loc,    material.diffusivity );
        gl.uniform1f ( g_addrs.shininess_loc,      material.shininess   );
        gl.uniform1f ( g_addrs.smoothness_loc,     material.smoothness  );

		gl.uniform1i(g_addrs.xTex_loc, 0);
		gl.uniform1i(g_addrs.yTex_loc,1);
		gl.uniform1i(g_addrs.zTex_loc, 2);
		
		
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		precision mediump float;
	  
        uniform mat4 projection_camera_model_transform,camera_model_transform;
		uniform mat3 camera_model_transform_normal;
		  
		uniform float ambient, diffusivity, shininess, smoothness;

        attribute vec3 vPosition, vNormal;
        attribute vec2 vTexCoord;
        varying vec3 fTexCoord;
		varying vec3 fNormal;
		varying vec3 colNorm;
		varying vec4 pos;
		
		void main()
		{
			
            vec4 ospos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * ospos;
            fTexCoord = vPosition.xyz;
			fNormal = normalize( camera_model_transform_normal * vNormal );
			colNorm = vNormal;
			//fNormal = vNormal; //Pass-Through for debug
			pos = camera_model_transform*ospos;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require

		precision mediump float;
	
		const float fc = 100.0;
		const float div = fc/128.0;
	
		void float16toRG(in float v, out vec2 ret)
		{
			v = v+fc;
			
			ret = vec2(floor(v/div),fract(v/div));
			ret.x *= 1.0/256.0;
		}
		void RGtofloat16 ( in vec2 rg, out float ret )
		{
			rg *= 256.0;
			ret = dot( rg, vec2(div,div/256.0) )-fc;
		}
	  
	
		varying vec3 fNormal;
		varying vec3 fTexCoord;
		varying vec4 pos;
		varying vec3 colNorm;
		
		uniform float ambient, diffusivity, shininess, smoothness;
		uniform vec4 shapeColor;
		
		uniform sampler2D xTex;
		uniform sampler2D yTex;
		uniform sampler2D zTex;
		uniform bool USE_TEXTURE;
		
		void main()
		{
			vec3 biasedNorm = normalize(fNormal);
			biasedNorm = .5*biasedNorm+.5;
			gl_FragData[1] = vec4(biasedNorm,1.0);
			gl_FragData[0] = shapeColor;
			gl_FragData[2] = vec4(smoothness/255.0,diffusivity,shininess,1.0);
			vec2 posZ;
			vec2 posX;
			vec2 posY;
			float16toRG(pos.x,posX);
			float16toRG(pos.z,posZ);
			float16toRG(pos.y,posY);
			gl_FragData[3] = vec4(posX,posY.r,1.0);
			gl_FragData[4] = vec4(posZ, posY.g,1.0);
			
			vec4 xCol = texture2D(xTex,vec2(fTexCoord.z/10.0,fTexCoord.y/5.0));
			vec4 yCol = texture2D(yTex,fTexCoord.xz/30.0);
			vec4 zCol = texture2D(zTex,vec2(fTexCoord.x/10.0,fTexCoord.y/5.0));
			vec3 cVec = abs(colNorm);
			gl_FragData[0] = vec4(xCol*cVec.x+yCol*cVec.y+zCol*cVec.z);
			gl_FragData[0].a = 1.0;
			//gl_FragData[0] = vec4(0.0,0.0,0.0,1.0);
			
		}
			
	  `;
      }
  }, Shader );
  
Declare_Any_Class( "G_buf_gen_phong",
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
		
        gl.uniform4fv( g_addrs.shapeColor_loc,     material.color       );    // Send a desired shape-wide color to the graphics card
        gl.uniform1f ( g_addrs.ambient_loc,        material.ambient     );
        gl.uniform1f ( g_addrs.diffusivity_loc,    material.diffusivity );
        gl.uniform1f ( g_addrs.shininess_loc,      material.shininess   );
        gl.uniform1f ( g_addrs.smoothness_loc,     material.smoothness  );

        // if( !g_state.lights.length )  return;
        // var lightPositions_flattened = [], lightColors_flattened = []; lightAttenuations_flattened = [];
        // for( var i = 0; i < 4 * g_state.lights.length; i++ )
          // { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
            // lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
            // lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
          // }
        // gl.uniform4fv( g_addrs.lightPosition_loc,       lightPositions_flattened );
        // gl.uniform4fv( g_addrs.lightColor_loc,          lightColors_flattened );
        // gl.uniform1fv( g_addrs.attenuation_factor_loc,  lightAttenuations_flattened );
		
		
		
      },
    'vertex_glsl_code_string'  : function()           // ********* VERTEX SHADER *********
      { return `
	  
		precision mediump float;
	  
        uniform mat4 projection_camera_model_transform,camera_model_transform;
		uniform mat3 camera_model_transform_normal;
		  
		uniform float ambient, diffusivity, shininess, smoothness;

        attribute vec3 vPosition, vNormal;
        attribute vec2 vTexCoord;
        varying vec2 fTexCoord;
		varying vec3 fNormal;
		varying vec4 pos;

		
		void main()
		{
			
            vec4 ospos = vec4(vPosition, 1.0);
            gl_Position = projection_camera_model_transform * ospos;
            fTexCoord = vTexCoord;

			fNormal = normalize( camera_model_transform_normal * vNormal );
			//fNormal = vNormal; //Pass-Through for debug
			pos = camera_model_transform*ospos;
		}
	  `;
      },
    'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  #extension GL_EXT_draw_buffers : require

		precision mediump float;
	
		const float fc = 100.0;
		const float div = fc/128.0;
	
		void float16toRG(in float v, out vec2 ret)
		{
			v = v+fc;
			
			ret = vec2(floor(v/div),fract(v/div));
			ret.x *= 1.0/256.0;
		}
		void RGtofloat16 ( in vec2 rg, out float ret )
		{
			rg *= 256.0;
			ret = dot( rg, vec2(div,div/256.0) )-fc;
		}
	  
	
		varying vec3 fNormal;
		varying vec2 fTexCoord;
		varying vec4 pos;
		
		uniform float ambient, diffusivity, shininess, smoothness;
		uniform vec4 shapeColor;
		
		uniform sampler2D texture;
		uniform bool USE_TEXTURE;
		
		void main()
		{
			vec3 biasedNorm = normalize(fNormal);
			biasedNorm = .5*biasedNorm+.5;
			//biasedNorm = abs(biasedNorm);
			gl_FragData[1] = vec4(biasedNorm,1.0);
			gl_FragData[0] = shapeColor;
			gl_FragData[2] = vec4(smoothness/255.0,diffusivity,shininess,1.0);
			vec2 posZ;
			vec2 posX;
			vec2 posY;
			float16toRG(pos.x,posX);
			float16toRG(pos.z,posZ);
			float16toRG(pos.y,posY);
			gl_FragData[3] = vec4(posX,posY.r,1.0);
			gl_FragData[4] = vec4(posZ, posY.g,1.0);
			//gl_FragData[3] = vec4(1.0,0.0,1.0,1.0);
			//gl_FragData[4] = vec4(0.0,1.0,0.0,1.0);
			if(USE_TEXTURE)
				gl_FragData[0] = texture2D(texture,fTexCoord);
			if(gl_FragData[0].a < 0.5)
				discard;
		}
			
	  `;
      }
  }, Shader );
  
   Declare_Any_Class( "G_buf_light_phong",
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
        gl.uniform1f ( g_addrs.amb_loc,        		material.ambient     );
        gl.uniform1f ( g_addrs.diffusivity_loc,    material.diffusivity );
        gl.uniform1f ( g_addrs.shininess_loc,      material.shininess   );
        gl.uniform1f ( g_addrs.smoothness_loc,     material.smoothness  );
        gl.uniform1f ( g_addrs.animation_time_loc, g_state.animation_time / 1000 );

		var lightPositions_flattened = [], lightColors_flattened = []; lightAttenuations_flattened = [];
        if( g_state.lights.length ){
			for( var i = 0; i < 4 * g_state.lights.length; i++ )
			  { lightPositions_flattened                  .push( g_state.lights[ Math.floor(i/4) ].position[i%4] );
				lightColors_flattened                     .push( g_state.lights[ Math.floor(i/4) ].color[i%4] );
				lightAttenuations_flattened[ Math.floor(i/4) ] = g_state.lights[ Math.floor(i/4) ].attenuation;
			  }
			gl.uniform4fv( g_addrs.lightPosition_loc,       lightPositions_flattened );
			gl.uniform4fv( g_addrs.lightColor_loc,          lightColors_flattened );
			gl.uniform1fv( g_addrs.attenuation_factor_loc,  lightAttenuations_flattened );
			
			gl.uniform1i(g_addrs.NUM_LIGHTS_loc,g_state.lights.length);
		}
		gl.uniform1i(g_addrs.col_loc, 0);
		gl.uniform1i(g_addrs.norm_loc,1);
		gl.uniform1i(g_addrs.matl_loc, 2);
		gl.uniform1i(g_addrs.posxy_loc, 3);
		gl.uniform1i(g_addrs.posz_loc, 4);
		//gl.uniform1i(g_addrs.TESTER_loc, 5);
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
	
		const float fc = 100.0;
		const float div = fc/128.0;
	
		void float16toRG(in float v, out vec2 ret)
		{
			v = v+fc;
			
			ret = vec2(floor(v/div),fract(v/div));
			ret.x *= 1.0/256.0;
		}
		void RGtofloat16 ( in vec2 rg, out float ret )
		{
			rg *= 256.0;
			ret = dot( rg, vec2(div,div/256.0) )-fc;
		}
	
		const int MAX_LIGHTS = 50;
		const vec4 fogCol = vec4(.5,.5,.5,1.0);
		varying vec2 fTexCoord;
		uniform int NUM_LIGHTS;
		uniform float amb;
		
		uniform vec4 lightPosition[MAX_LIGHTS], lightColor[MAX_LIGHTS];
		uniform float attenuation_factor[MAX_LIGHTS];
		
		uniform mat4 camera_transform, camera_model_transform, projection_camera_model_transform;
        uniform mat3 camera_model_transform_normal;
		
		uniform sampler2D posxy;
		uniform sampler2D norm;
		uniform sampler2D col;
		uniform sampler2D matl;
		uniform sampler2D posz;
		//uniform sampler2D TESTER;
		
		void main()
		{
			vec4 tex_color = texture2D( col, fTexCoord );
			// vec4 N = texture2D(norm,fTexCoord);
			vec4 fMatl = texture2D( matl, fTexCoord );
			vec4 inPosxy = texture2D(posxy,fTexCoord);
			vec4 inPosz = texture2D(posz, fTexCoord);
			vec3 N = texture2D(norm, fTexCoord).xyz;
			N = (N-.5)*2.0;
			N = normalize(N);
			//N.a = 1.0;
			
			float xx,yy,zz;
			RGtofloat16(inPosxy.rg,xx);
			RGtofloat16(vec2(inPosxy.b,inPosz.b),yy);
			RGtofloat16(inPosz.rg,zz);
			vec4 fPos = vec4(xx,yy,zz,1.0);
			vec3 pos = fPos.xyz;
			float ambient = .15;
			float diffusivity = fMatl.g;
			float shininess = fMatl.b;
			float smoothness = fMatl.r*255.0;
			gl_FragColor = vec4(tex_color.rgb * ambient,tex_color.a);
			vec3 lum = vec3(0.0,0.0,0.0);
			vec3 E = normalize( -pos );
			float dist;
             for( int i = 0; i < MAX_LIGHTS; i++ )
             {
				vec3 L = normalize( ( camera_transform * lightPosition[i] ).xyz - lightPosition[i].w * pos );   // Use w = 0 for a directional light -- a vector instead of a point.
				vec3 H = normalize( L + E );
				dist = lightPosition[i].w > 0.0 ? distance((camera_transform * lightPosition[i]).xyz, pos): 10.0;
				float atFac = attenuation_factor[i] > 0.0 ? attenuation_factor[i] : 0.0;
				float attenuation_multiplier = 1.0 / (1.0 + atFac * (dist * dist));
               float diffuse  = max(dot(L, N), 0.0001);
               float specular = pow(max(dot(N, H), 0.0001), smoothness);

               lum += float(i<=NUM_LIGHTS)*attenuation_multiplier * (tex_color.xyz * diffusivity * diffuse*lightColor[i].xyz  + lightColor[i].xyz * shininess * specular );
			}
			//lum = min(lum,1.0-gl_FragColor.xyz);
			gl_FragColor = vec4(lum+gl_FragColor.xyz,tex_color.a);
			//Do Fog Attenuation
			// float fogw=min(1.0,(dot(pos,pos)/40000.0));
			// gl_FragColor.xyz = (1.0-fogw)*gl_FragColor.rgb+fogw*fogCol.rgb;
			// if(gl_FragColor.a<.5)
				// discard;
			//gl_FragColor = texture2D(TESTER,fTexCoord);
			//gl_FragColor = tex_color;
			//gl_FragColor = vec4(abs(xx/10.0),abs(yy/10.0),abs(zz/10.0),1.0);
			//gl_FragColor = vec4(0.0,0.0,fPos.x/10.0,1.0);
			//gl_FragColor = vec4(abs(N),1.0);
			//gl_FragColor = fMatl;
			//gl_FragColor = vec4(vec3(length(fPos)/2550.0),1.0);
			
		}
	  `;
      }
  }, Shader );
  
  