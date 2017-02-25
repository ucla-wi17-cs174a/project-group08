// *********** TETRAHEDRON ***********
Declare_Any_Class( "Tetrahedron",
  { 'populate': function() 
      {
        var a = 1/Math.sqrt(3);

        this.positions.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );
        this.positions.push( vec3(0,0,0), vec3(1,0,0), vec3(0,0,1) );
        this.positions.push( vec3(0,0,0), vec3(0,1,0), vec3(0,0,1) );
        this.positions.push( vec3(0,0,1), vec3(1,0,0), vec3(0,1,0) );

        this.normals.push( vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1) );
        this.normals.push( vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0) );
        this.normals.push( vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) );
        this.normals.push( vec3( a,a,a), vec3( a,a,a), vec3( a,a,a) );

        this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );
        this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );
        this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );
        this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );

        this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 ); 
        
      }
  }, Shape )


  //
  // Generate fun terrain:
  //
  
  Declare_Any_Class( "Heightmap",
  { 'populate': function() 
      {
        function xzheight(x, z)		//This is where we add the noise - remember the perlin noise goes from -0.5 to 0.5
		{
			var y = -20 + 
			96*perlin(x*.0151, 11.091, z*.0051) + 	//The y value can basically be used as the seed
			32*perlin(x*.0311, 0.091, z*.0221) + 	//Also, putting different x and z frequencies is fun
			16*perlin(x*.0491, 0.091, z*.0491) + 
			8*perlin(x*.0991, 0.091, z*.0991) + 
			4*perlin(x*.1891, 0.091, z*.1891) + 
			2*perlin(x*.3591, 0.091, z*.3591) + 
			1*perlin(x*.7091, 0.091, z*.7091) + 
			0.5*perlin(x*1.401, -5, z*1.401);	//Don't perfectly double the frequency to avoid weird things
			return y;
		}
		//Having too many of the middle-ish noise octaves looks a bit funny, just took one out.
		
	
		//Try to generate some (Perlin) noise
		var perm = [151,160,137,91,90,15,              
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
		var perm_d = [];
		for(var i = 0; i < 512; i++)
			perm_d[i] = perm[i%256];
		
		function fade(t){	//Function so it's not straight linear
			return t * t * t * (t * (t * 6 - 15) + 10);}
			
		function lerp(a, b, x){		//Linearly interpolate
			return a + x * (b - a);}
		
		function grad(hash, x, y, z)	//Choose a vector
		{
			switch(hash & 0xF)
			{
				case 0x0: return  x + y;
				case 0x1: return -x + y;
				case 0x2: return  x - y;
				case 0x3: return -x - y;
				case 0x4: return  x + z;
				case 0x5: return -x + z;
				case 0x6: return  x - z;
				case 0x7: return -x - z;
				case 0x8: return  y + z;
				case 0x9: return -y + z;
				case 0xA: return  y - z;
				case 0xB: return -y - z;
				case 0xC: return  y + x;
				case 0xD: return -y + z;
				case 0xE: return  y - x;
				case 0xF: return -y - z;
				default: return 0; // never happens
			}
		}
		
		function perlin(x, y, z)
		{		
			var xi = Math.floor(x) % 256;
			var yi = Math.floor(y) % 256;
			var zi = Math.floor(z) % 256;	
		
			var xf = x % 1.0;
			var yf = y % 1.0;
			var zf = z % 1.0;
			
			var u = fade(xf);
			var v = fade(yf);
			var w = fade(zf);
			
			var aaa, aba, aab, abb, baa, bba, bab, bbb;
			aaa = perm_d[perm_d[perm_d[    xi ]+    yi ]+    zi ];
			aba = perm_d[perm_d[perm_d[    xi ]+ yi + 1]+    zi ];
			aab = perm_d[perm_d[perm_d[    xi ]+    yi ]+ zi + 1];
			abb = perm_d[perm_d[perm_d[    xi ]+ yi + 1]+ zi + 1];
			baa = perm_d[perm_d[perm_d[ xi + 1]+    yi ]+    zi ];
			bba = perm_d[perm_d[perm_d[ xi + 1]+ yi + 1]+    zi ];
			bab = perm_d[perm_d[perm_d[ xi + 1]+    yi ]+ zi + 1];
			bbb = perm_d[perm_d[perm_d[ xi + 1]+ yi + 1]+ zi + 1];
						
			var x1, x2, y1, y2;
			x1 = lerp(    grad (aaa, xf  , yf  , zf),           // The gradient function calculates the dot product between a pseudorandom
						grad (baa, xf-1, yf  , zf),             // gradient vector and the vector from the input coordinate to the 8
						u);                                     // surrounding points in its unit cube.
			x2 = lerp(    grad (aba, xf  , yf-1, zf),           // This is all then lerped together as a sort of weighted average based on the faded (u,v,w)
						grad (bba, xf-1, yf-1, zf),             // values we made earlier.
						  u);
			y1 = lerp(x1, x2, v);

			x1 = lerp(    grad (aab, xf  , yf  , zf-1),
						grad (bab, xf-1, yf  , zf-1),
						u);
			x2 = lerp(    grad (abb, xf  , yf-1, zf-1),
						  grad (bbb, xf-1, yf-1, zf-1),
						  u);
			y2 = lerp (x1, x2, v);
			
			return (lerp (y1, y2, w)+1)/2 - 0.5; 	//Output from -0.5 to 0.5; change this to change that range
		}
	
	
		
		dims = [200, 500];	//Change the size of the generated land here
		
		var norm_a, norm_b, norm_c, norm_d;	//For use in generating normals
		
		for(var i = 0; i < dims[0]; i++)
			for(var j = 0; j < dims[1]; j++)
			{
				this.positions.push(vec3(i - dims[0]/2 + 0.5, xzheight(i,j), j - dims[1]/2 + 0.5));
				if(i != 0 && j != 0)
				{
					this.indices.push((j-1 + (i-1)*dims[1]), (j + (i-1)*dims[1]), (j-1 + i*dims[1]), (j + (i-1)*dims[1]), (j-1 + i*dims[1]), (j + i*dims[1]));
				
					//this.normals.push(cross(subtract(this.positions[(i-1)*dims[0] + j], this.positions[(i-1)*dims[0] + (j-1)]), subtract(this.positions[i*dims[0] + (j-1)], this.positions[(i-1)*dims[0] + j])));
					//this.normals.push(cross(subtract(this.positions[i*dims[0] + j], this.positions[(i-1)*dims[0] + j]), subtract(this.positions[i*dims[0] + (j-1)], this.positions[i*dims[0] + j])));
					//this.normals.push(vec3(0,1,0), vec3(0,1,0));
															
				}
			}
			
		//Now that it's all there, go through again and generate normals
		for(var i = 0; i < dims[0]; i++)
			for(var j = 0; j < dims[1]; j++)
			{
				if(i != 0 && i != (dims[0]-1) && j != 0 && j != (dims[1]-1))
					{
						//Average over the normals of the 4 adjacent triangles
						norm_a = cross(subtract(this.positions[(i)*dims[1] + j], this.positions[(i-1)*dims[1] + (j)]), subtract(this.positions[i*dims[1] + (j-1)], this.positions[(i)*dims[1] + j]));
						norm_b = cross(subtract(this.positions[(i)*dims[1] + j], this.positions[(i)*dims[1] + (j-1)]), subtract(this.positions[i*dims[1] + (j+1)], this.positions[(i)*dims[1] + j]));
						norm_c = cross(subtract(this.positions[(i)*dims[1] + (j+1)], this.positions[(i-1)*dims[1] + (j)]), subtract(this.positions[i*dims[1] + (j)], this.positions[(i)*dims[1] + (j+1)]));
						norm_d = cross(subtract(this.positions[(i)*dims[1] + (j+1)], this.positions[(i)*dims[1] + (j)]), subtract(this.positions[(i+1)*dims[1] + (j)], this.positions[(i)*dims[1] + (j+1)]));
						this.normals.push(normalize(add(add(norm_a, norm_b), add(norm_c, norm_d))));
					}	
					else
					{
						this.normals.push(vec3(0,1,0));	//At the edge - this should always be out of sight
					}
			}
        
      }
  }, Shape )
  
  
  