  
  Declare_Any_Class("c_Density_Shader",
  {
	  'update_uniforms'          : function( g_state, model_transform, material )
	  {
		  	
		gl.uniform4fv( g_addrs.coords_loc,     material.color       ); 
		/*
		var perlin_array_flattened = [151,160,137,91,90,15,              
			131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,  
			190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
			88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
			77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
			102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
			135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
			5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
			223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
			129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
			251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
			49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
			138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
			151,160,137,91,90,15,              
			131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,  
			190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
			88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
			77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
			102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
			135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
			5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
			223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
			129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
			251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
			49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
			138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
		*/
		//gl.uniform1fv( g_addrs.perlin_array_loc,  perlin_array_flattened );
		 
	  },
	  'vertex_glsl_code_string': function()           // ********* VERTEX SHADER *********
      { return `	
	    precision mediump float;
	   
	    attribute vec3 vPosition;				
		//uniform vec4 coords;	//4th value means nothing	  	  
	  
	  void main()
	  {
		vec4 object_space_pos = vec4(vPosition, 1.0);
		gl_Position = object_space_pos;
	  }	  	  
	  
	  `},
	  'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
		#extension GL_EXT_draw_buffers : require
		precision mediump float;
		
		uniform vec4 coords;
		//uniform int perlin_array[512];
		
		void perm(in vec4 x, out vec4 ret){ret = mod(((x * 34.0) + 1.0) * x, 289.0);}
		/*	 	 										
		void fade(in float t, out float ret) {ret = t*t*t*(t*(t*6.0-15.0)+10.0);}		
		void lerp(in float a, in float b, in float x, out float ret){ret = a + x * (b - a);}
		void grad(in int hash, in float x, in float y, in float z, out float ret)	//Choose a vector
		{
			int check = int(mod(float(hash),16.0));
			if(check == 0) ret =  x + y;
			if(check == 1) ret = -x + y; 
			if(check == 2) ret =  x - y;
			if(check == 3) ret = -x - y;
			if(check == 4) ret =  x + z;
			if(check == 5) ret = -x + z;
			if(check == 6) ret =  x - z;
			if(check == 7) ret = -x - z;
			if(check == 8) ret =  y + z;
			if(check == 9) ret = -y + z;
			if(check == 10) ret =  y - z;
			if(check == 11) ret = -y - z;
			if(check == 12) ret =  y + x;
			if(check == 13) ret = -y + z;
			if(check == 14) ret =  y - x;
			if(check == 15) ret = -y - z;			
		}
		
		void perlin(in float x, in float y, in float z, out float ret)
		{	
			x += 1048576.0;	//Makes it positive
			y += 1048576.0;
			z += 1048576.0;

			int xi = int(mod(floor(x), 256.0));
			int yi = int(mod(floor(y), 256.0));
			int zi = int(mod(floor(z), 256.0));	

			float xf = mod(x, 1.0);
			float yf = mod(y, 1.0);
			float zf = mod(z, 1.0);
			
			float u;
			fade(xf, u);
			float v; 
			fade(yf, v);
			float w; 
			fade(zf, z);
			
			int aaa, aba, aab, abb, baa, bba, bab, bbb;
			aaa = perlin_array[perlin_array[perlin_array[    xi ]+    yi ]+    zi ];
			aba = perlin_array[perlin_array[perlin_array[    xi ]+ yi + 1]+    zi ];
			aab = perlin_array[perlin_array[perlin_array[    xi ]+    yi ]+ zi + 1];
			abb = perlin_array[perlin_array[perlin_array[    xi ]+ yi + 1]+ zi + 1];
			baa = perlin_array[perlin_array[perlin_array[ xi + 1]+    yi ]+    zi ];
			bba = perlin_array[perlin_array[perlin_array[ xi + 1]+ yi + 1]+    zi ];
			bab = perlin_array[perlin_array[perlin_array[ xi + 1]+    yi ]+ zi + 1];
			bbb = perlin_array[perlin_array[perlin_array[ xi + 1]+ yi + 1]+ zi + 1];
						
			float x1, x2, y1, y2;
			float temp1, temp2;
			
			grad (aaa, xf  , yf  , zf, temp1);
			grad (baa, xf-1.0, yf  , zf, temp2);
			lerp(temp1, temp2, u, x1);  									
				
			grad(aba, xf  , yf-1.0, zf, temp1);	
			grad(bba, xf-1.0, yf-1.0, zf, temp2);
			lerp(temp1, temp2, u, x2);
						  
			lerp(x1, x2, v, y1);
						
			grad (aab, xf  , yf  , zf-1.0, temp1);
			grad (bab, xf-1.0, yf  , zf-1.0, temp2);
			lerp(temp1, temp2, u, x1);	
	
			grad (abb, xf  , yf-1.0, zf-1.0, temp1);
			grad (bbb, xf-1.0, yf-1.0, zf-1.0, temp2);
			lerp(temp1, temp2, u, x2);
						
			lerp (x1, x2, v, y2);
					
			lerp (y1+1.0, y2+1.0, w+1.0, temp1);				
			
			ret = (temp1)/2.0 - 0.5; 	//Output from -0.5 to 0.5; change this to change that range
		}		
		//End perlin noise
		*/
		
		//And, because those arrays aren't working, using this instead:
		void noise(in vec3 p, out float ret){
			vec3 a = floor(p);
			vec3 d = p - a;
			d = d * d * (3.0 - 2.0 * d);

			vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
			vec4 k1;
			perm(b.xyxy, k1);
			vec4 k2; 
			perm(k1.xyxy + b.zzww, k2);

			vec4 c = k2 + a.zzzz;
			vec4 k3;
			perm(c, k3);
			vec4 k4;
			perm(c + 1.0, k4);

			vec4 o1 = fract(k3 * (1.0 / 41.0));
			vec4 o2 = fract(k4 * (1.0 / 41.0));

			vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
			vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

			ret = o4.y * d.y + o4.x * (1.0 - d.y);
		}
		
		void f_density(in vec3 ws, out float ret)	//Positive corresponds to ground
		{
			ret = -1.0*ws[1] - 5.0;
			float add_dens;		
			vec3 freq0 = vec3(0.046, 0.026, 0.026);
			vec3 freq1 = vec3(0.066, 0.046, 0.056);
			vec3 freq2 = vec3(0.091, 0.111, 0.091);
			vec3 freq3 = vec3(0.191, 0.291, 0.191);
			vec3 freq4 = vec3(0.391, 0.391, 0.391);
			float ampl0 = 32.0;
			float ampl1 = 16.0;
			float ampl2 = 8.0;
			float ampl3 = 4.0;
			float ampl4 = 2.0;
			
			noise(vec3(ws[0]*freq0.x, ws[1]*freq0.y, ws[2]*freq0.z), add_dens);			ret += add_dens*ampl0;			
			noise(vec3(ws[0]*freq1.x, ws[1]*freq1.y, ws[2]*freq1.z), add_dens);			ret += add_dens*ampl1;
			noise(vec3(ws[0]*freq2.x, ws[1]*freq2.y, ws[2]*freq2.z), add_dens);			ret += add_dens*ampl2;
			noise(vec3(ws[0]*freq3.x, ws[1]*freq3.y, ws[2]*freq3.z), add_dens);			ret += add_dens*ampl3;
			noise(vec3(ws[0]*freq4.x, ws[1]*freq4.y, ws[2]*freq4.z), add_dens);			ret += add_dens*ampl4;
		}
	
	  void main()
	  {	 	  
		float density; 
		vec3 mod_coords = vec3(coords[0]+mod(gl_FragCoord.x-0.5,33.0), coords[1]+gl_FragCoord.y-0.5, coords[2]+floor((gl_FragCoord.x-0.5)/33.0));
		f_density(mod_coords, density);	
		
		vec4 dens_pack = vec4( density/abs(density), abs(density/65536.0), mod(abs(density/256.0), 256.0), mod(abs(density), 1.0)); 	//First value is 0 if it's negative

		//gl_FragData[0] = dens_pack;
		gl_FragData[0] = vec4(0.5, 0.5, 0.5, 0.7);
		float x_grad_dens;
		float y_grad_dens;
		float z_grad_dens;
		f_density(mod_coords + vec3(0.1, 0, 0), x_grad_dens);
		f_density(mod_coords + vec3(0, 0.1, 0), y_grad_dens);
		f_density(mod_coords + vec3(0, 0, 0.1), z_grad_dens);
		
		float x_grad = density - x_grad_dens;
		float y_grad = density - y_grad_dens;
		float z_grad = density - z_grad_dens;
		vec3 norm_grad = normalize(vec3(x_grad, y_grad, z_grad));
		
		vec2 blah = vec2(gl_FragCoord);
		
		//Eh, 8 bit precision for normals should be enough (instead of 10 bit)
		//gl_FragData[1] = vec4(norm_grad.x, norm_grad.y, norm_grad.z, 0.0);	
		gl_FragData[1] = vec4(int(128), int(128), int(0), int(1));
		
	  }
	  `},
	  
  },Shader);
  /*
   Declare_Any_Class("c_Almanac_Shader",
  {
	  'update_uniforms'          : function( g_state, model_transform, material ){
		  
	  },
	  'vertex_glsl_code_string': function()           // ********* VERTEX SHADER *********
      { return `
	  
	  `},
	  'fragment_glsl_code_string': function()           // ********* FRAGMENT SHADER *********
      { return `
	  
	  `},
	  
  },Shader);
*/