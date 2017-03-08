  
  Declare_Any_Class("c_Density_Shader",
  {
	  'update_uniforms'          : function( g_state, model_transform, material )
	  {
		  	
		 gl.uniform4fv( g_addrs.coords_loc,     material.color       ); 
		 
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
	 
		precision mediump float;
		
		uniform vec4 coords;
			 	 						
		//Simplex noise in GLSL, modified because it didn't work, borrowed from:
		//  Simplex 3D Noise 
		//  by Ian McEwan, Ashima Arts
		//
		void permute(in vec4 x, out vec4 ret){ret = mod(((x*34.0)+1.0)*x, 289.0);}
		void taylorInvSqrt(in vec4 r, out vec4 ret){ret = 1.79284291400159 - 0.85373472095314 * r;}

		void snoise(in vec3 v, out float ret){ 
		  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
		  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

		// First corner
		  vec3 i  = floor(v + dot(v, C.yyy) );
		  vec3 x0 =   v - i + dot(i, C.xxx) ;

		// Other corners
		  vec3 g = step(x0.yzx, x0.xyz);
		  vec3 l = 1.0 - g;
		  vec3 i1 = min( g.xyz, l.zxy );
		  vec3 i2 = max( g.xyz, l.zxy );

		  //  x0 = x0 - 0. + 0.0 * C 
		  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
		  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
		  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

		// Permutations
		  i = mod(i, 289.0 ); 
		  // vec4 p = permute( permute( permute( 
				//   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
				// + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
				// + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
				   
		  vec4 p;
		  permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ), p);	
		  permute( p + i.y + vec4(0.0, i1.y, i2.y, 1.0 ), p);
		  permute( p + i.x + vec4(0.0, i1.x, i2.x, 1.0 ), p);

		// Gradients
		// ( N*N points uniformly over a square, mapped onto an octahedron.)
		  float n_ = 1.0/7.0; // N=7
		  vec3  ns = n_ * D.wyz - D.xzx;

		  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

		  vec4 x_ = floor(j * ns.z);
		  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

		  vec4 x = x_ *ns.x + ns.yyyy;
		  vec4 y = y_ *ns.x + ns.yyyy;
		  vec4 h = 1.0 - abs(x) - abs(y);

		  vec4 b0 = vec4( x.xy, y.xy );
		  vec4 b1 = vec4( x.zw, y.zw );

		  vec4 s0 = floor(b0)*2.0 + 1.0;
		  vec4 s1 = floor(b1)*2.0 + 1.0;
		  vec4 sh = -step(h, vec4(0.0));

		  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
		  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

		  vec3 p0 = vec3(a0.xy,h.x);
		  vec3 p1 = vec3(a0.zw,h.y);
		  vec3 p2 = vec3(a1.xy,h.z);
		  vec3 p3 = vec3(a1.zw,h.w);

		//Normalise gradients
		  vec4 norm;
		  taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)), norm);	
		  //Those two lines above are equiv to norm = fn(stuff)
		  p0 *= norm.x;
		  p1 *= norm.y;
		  p2 *= norm.z;
		  p3 *= norm.w;
		  
		// Mix final noise value
		  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
		  m = m * m;
		  ret = 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
										dot(p2,x2), dot(p3,x3) ) );
		}
		//End simplex noise
		
		
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
			snoise(vec3(ws[0]*freq0.x, ws[1]*freq0.y, ws[2]*freq0.z), add_dens);			ret += add_dens*ampl0;			
			snoise(vec3(ws[0]*freq1.x, ws[1]*freq1.y, ws[2]*freq1.z), add_dens);			ret += add_dens*ampl1;
			snoise(vec3(ws[0]*freq2.x, ws[1]*freq2.y, ws[2]*freq2.z), add_dens);			ret += add_dens*ampl2;
			snoise(vec3(ws[0]*freq3.x, ws[1]*freq3.y, ws[2]*freq3.z), add_dens);			ret += add_dens*ampl3;
			snoise(vec3(ws[0]*freq4.x, ws[1]*freq4.y, ws[2]*freq4.z), add_dens);			ret += add_dens*ampl4;
		}
	
	  void main()
	  {	 	  
		float density; 
		vec3 mod_coords = vec3(coords[0]+mod(gl_FragCoord.x-0.5,33.0), coords[1]+gl_FragCoord.y-0.5, coords[2]+floor((gl_FragCoord.x-0.5)/33.0));
		f_density(mod_coords, density);
		density = floor(density*1048576.0);	//mult by 2^20 for packing purposes - compatible with densities up to 2^11 or so, which should be plenty (we can change this scaling if it's not, doesn't really matter)
		vec4 pack_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0);	
		vec4 pack_mask = vec4( 0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
		vec4 dens_pack = density*pack_shift - floor(density*pack_shift);
		dens_pack -= dens_pack.xxyz*pack_mask;
		gl_FragData[0] = dens_pack;
	
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
		
		//Eh, 8 bit precision for normals should be enough (instead of 10 bit)
		//gl_FragData[1] = vec4(norm_grad[0], norm_grad[1], norm_grad[2], 0.0);	
		
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