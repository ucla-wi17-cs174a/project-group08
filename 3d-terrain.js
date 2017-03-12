Declare_Any_Class( "Node_contents",
  { 'populate': function() 
      {
        //Just a shape that holds the positions and normals, filled later when we want     
		this.positions = [];
		this.normals = [];
		this.indices = [];
      }
  }, Shape );

 //First we make the density function:
function f_density(ws)	//Positive corresponds to ground
{
	//Warp ws first
	// var warp_ampl = 64;
	// var warp_noise = perlin(ws[0]*0.008, ws[1]*0.002, ws[2]*0.008);
	// var warp_val = mult_vec_scalar(vec3(warp_noise, warp_noise, warp_noise), warp_ampl);
	// ws = vec3(ws[0]+warp_val[0], ws[1]+warp_val[1], ws[2]+warp_val[2]);
	//Trying other warping methods	
	//ws = vec3(ws[0], ws[1]+12*Math.sin(0.03*ws[0]), ws[2]);	//Only works for minimal floating islands
	
	
	// ws = vec3(ws[0]+WORLD_SIZE, ws[1], ws[2]+WORLD_SIZE);
	var dens = -ws[1] - 25;
	
	//For tons of floating islands:
	// var freq0 = vec3(0.022, 0.047, 0.026);
	// var freq1 = vec3(0.046, 0.043, 0.041);
	// var freq2 = vec3(0.066, 0.086, 0.066);
	// var freq3 = vec3(0.096, 0.106, 0.096);
	// var freq4 = vec3(0.151, 0.151, 0.151);
	// var freq5 = vec3(0.211, 0.211, 0.211);
	// var freq6 = vec3(0.291, 0.291, 0.291);
	// var ampl0 = 128;
	// var ampl1 = 64;
	// var ampl2 = 27;
	// var ampl3 = 19;
	// var ampl4 = 13;
	// var ampl5 = 9;
	// var ampl6 = 6;
	// dens += ampl0*perlin(ws[0]*freq0[0], ws[1]*freq0[1], ws[2]*freq0[2]);
	// dens += ampl1*perlin(ws[0]*freq1[0], ws[1]*freq1[1], ws[2]*freq1[2]);
	// dens += ampl2*perlin(ws[0]*freq2[0], ws[1]*freq2[1], ws[2]*freq2[2]);
	// dens += ampl3*perlin(ws[0]*freq3[0], ws[1]*freq3[1], ws[2]*freq3[2]);
	// dens += ampl4*perlin(ws[0]*freq4[0], ws[1]*freq4[1], ws[2]*freq4[2]);
	// dens += ampl5*perlin(ws[0]*freq5[0], ws[1]*freq5[1], ws[2]*freq5[2]);
	// dens += ampl6*perlin(ws[0]*freq6[0], ws[1]*freq6[1], ws[2]*freq6[2]);
	
	//More like canyons, but actual canyons are hard
	var freq0 = vec3(0.016, 0.032, 0.016);
	var freq1 = vec3(0.036, 0.036, 0.041);
	var freq2 = vec3(0.046, 0.026, 0.026);
	var freq3 = vec3(0.066, 0.046, 0.056);
	var freq4 = vec3(0.091, 0.131, 0.111);
	var freq5 = vec3(0.191, 0.291, 0.191);
	var freq6 = vec3(0.291, 0.391, 0.291);
	var ampl0 = 128;
	var ampl1 = 74;
	var ampl2 = 42;
	var ampl3 = 21;
	var ampl4 = 8;
	var ampl5 = 4;
	var ampl6 = 3;
	dens += ampl0*perlin(ws[0]*freq0[0], ws[1]*freq0[1], ws[2]*freq0[2]);
	dens += ampl1*perlin(ws[0]*freq1[0], ws[1]*freq1[1], ws[2]*freq1[2]);
	dens += ampl2*perlin(ws[0]*freq2[0], ws[1]*freq2[1], ws[2]*freq2[2]);
	dens += ampl3*perlin(ws[0]*freq3[0], ws[1]*freq3[1], ws[2]*freq3[2]);
	dens += ampl4*perlin(ws[0]*freq4[0], ws[1]*freq4[1], ws[2]*freq4[2]);
	dens += ampl5*perlin(ws[0]*freq5[0], ws[1]*freq5[1], ws[2]*freq5[2]);
	//dens += ampl6*perlin(ws[0]*freq6[0], ws[1]*freq6[1], ws[2]*freq6[2]);
	
	//Soft floor:
	var soft_floor = -27;
	if(ws[1] < soft_floor)
		dens += (soft_floor - ws[1])*3;
	
	//Hard floor:
	var hard_floor = -1*WORLD_SIZE/2 + 1;
	if(ws[1] < hard_floor)
		dens = 5000;
	
	//Soft ceiling:
	var soft_ceil = 27;
	if(ws[1] > soft_ceil)
		dens += (soft_ceil - ws[1])*3;
	
	//Hard ceiling:
	var hard_ceil = WORLD_SIZE/2 - 1;
	if(ws[1] > hard_ceil)
		dens = -5000;
	
	return dens;
}  
  
Declare_Any_Class( "Terrain",
{ 
	'construct': function( args )
      { this.define_data_members( { positions: [], normals: [], texture_coords: [], indices: [], indexed: true, sent_to_GPU: false } );
        //this.populate.apply( this, arguments ); // Immediately fill in appropriate vertices via polymorphism, calling whichever sub-class's populate().
		//this.density_Pass_FBO = new FBO((RES_RATIO+1)*(RES_RATIO+1), RES_RATIO+1, 2); //One 32bit buffer for density, one for normals
		//this.almanac_Pass_FBO = new FBO(RES_RATIO,RES_RATIO*RES_RATIO,2); // 1/2 Byte for numTris, 7.5 bytes for edges
		
		this.world_tree = new Node(vec3(-WORLD_SIZE/2, -WORLD_SIZE/2, -WORLD_SIZE/2), WORLD_SIZE, null);
		
		//Arrays to hold important info for terrain (in the form of nodes):
		this.to_check = [];	//First, add a bunch of blocks to this list, then check it over subsequent iterations
		this.to_create = [];	//After the blocks are checked and need to be drawn, add them to this list
		this.to_draw_new = [];	//When the geometry is made, replace the old to_draw with this list
		this.to_draw = [];	//All the geometry in here is what gets drawn
		this.all_geom = [];	//So we can get rid of geometry once it's far away enough
      },
	  
	  'copy_onto_graphics_card': function()
	  {
		for(var i = 0; i < this.to_draw.length; i++)
		{
			if( !this.to_draw[i].contents.sent_to_GPU ) 
			{
				this.to_draw[i].contents.copy_onto_graphics_card();
				this.to_draw[i].contents.sent_to_GPU = true;
			}
		}
		  
	  },
	  
	  'draw': function(graphics_state, model_transform, material)
	  {
		for(var i = 0; i < this.to_draw.length; i++)
		{
			this.to_draw[i].contents.draw(graphics_state, model_transform, material);
		}		  
	  },
	  
	  
	  
	// 'initialize': function()
	// {												
	// },

	'populate_GPU': function(coords, c_size, graphics_state){
		
		
			shapes_in_use.screenQuad = new Square();
			var eye = new mat4();
			var mat_coords = new Material(Color(coords[0], coords[1], coords[2], 1.0), 0.0, 0.0, 0.0, 0.0, "perlin_array_test.png");	//UN-HARDCODE THIS LATER
						
			this.density_Pass_FBO.activate();
			shaders_in_use["c_Density_Shader"].activate();
			console.log(textures_in_use["perlin_array.png"]);
			////Set uniforms + attributes
			// var buffer_dens = gl.createBuffer();
			// gl.bindBuffer( gl.ARRAY_BUFFER, buffer_dens );
			// gl.bufferData( gl.ARRAY_BUFFER, flatten(screenQuad.positions), gl.STATIC_DRAW );	
			// var coords_4 = vec4(coords[0], coords[1], coords[2], 0);
			// var coords_4_u = gl.getUniformLocation(graphics_state, "coords_4");
			// gl.uniform4fv(coords_4_u, false, vec4(32.0, 32.0, 32.0, 1.0)); 	//This should be done by material
			// gl.drawArrays( gl.TRIANGLES, 0, 4);
			shapes_in_use.screenQuad.copy_onto_graphics_card();
			shapes_in_use.screenQuad.draw(graphics_state, eye, mat_coords); 
			var densArray = new Uint8Array(4*(RES_RATIO+1)*(RES_RATIO+1)*(RES_RATIO+1)); //May need to setup as var densArray = new Uint8Array(length);
			
			//console.log(this.density_Pass_FBO.fb.width, this.density_Pass_FBO.fb.height);
			var normArray = new Uint8Array(4*(RES_RATIO+1)*(RES_RATIO+1)*(RES_RATIO+1));	//Where length is 4(bytes)*33*33*33			
			gl.bindTexture(gl.TEXTURE_2D,this.density_Pass_FBO.tx[0]);
			gl.readPixels(0,0,this.density_Pass_FBO.fb.width,this.density_Pass_FBO.fb.height,gl.RGBA,gl.UNSIGNED_BYTE,densArray);
			//gl.bindTexture(gl.TEXTURE_2D,this.density_Pass_FBO.tx[1]);
			var stupidDummy = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, stupidDummy);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.density_Pass_FBO.tx[1], 0); 
			//console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER)==gl.FRAMEBUFFER_COMPLETE);
			gl.readPixels(0,0,this.density_Pass_FBO.fb.width,this.density_Pass_FBO.fb.height,gl.RGBA,gl.UNSIGNED_BYTE,normArray);
			console.log(densArray, "After running density shader");
			console.log(normArray, "Norm array from shader");
			this.density_Pass_FBO.deactivate();
			//Now, densArray holds all the densities but needs to be unpacked - do this next:
			var dens_unpacked = [];			
			for(var i = 0; i < 4*(RES_RATIO+1)*(RES_RATIO+1)*(RES_RATIO+1); i+=4)
			{
				var sign = 1;
				if(densArray[i] == 0)
					sign = -1;
				if(densArray[i+1]%4 == 0 && densArray[i+2]/256 > 0.9)	//Deal with values like 0.95 packing badly
					dens_unpacked.push(sign*(densArray[i+1]/4 + densArray[i+2]/256 - 1));
				else if(densArray[i+1]%4 == 3 && densArray[i+2]/256 < 0.1 && densArray[i+1] != 255 )	//Deal with values like 1.05 packing badly
					dens_unpacked.push(sign*(densArray[i+1]/4 + densArray[i+2]/256 + 1));
				else 
					dens_unpacked.push(sign*(Math.floor(densArray[i+1]/4) + densArray[i+2]/256));	//Yep, the 4th value does nothing (as of right now), and it can only read up to +/- 64
				//dens_unpacked[(i/4)%(RES_RATIO+1)][(i/(4*(RES_RATIO+1)))%(RES_RATIO+1)][i/(4*(RES_RATIO+1)*(RES_RATIO+1))] = sign*(densArray[i+1] + densArray[i+2]*256)	//
			}
			//Now, dens_unpacked is an array of each density
			console.log(dens_unpacked);
			//Unpacked as (0,0,0), (1,0,0), ..., (0,0,1), (1,0,1),... (y changes the slowest)
			
			var norm_unpacked = [];		//This should be easier to unpack
			for(var i = 0; i < 4*(RES_RATIO+1)*(RES_RATIO+1)*(RES_RATIO+1); i+=4)
			{
				norm_unpacked.push(vec3((normArray[i]/256-0.5)*2, (normArray[i+1]/256-0.5)*2, (normArray[i+2]/256-0.5)*2));
			}			
			console.log(norm_unpacked);
			
			
			var coord0;
			var coord1;
			var coord2;
			var coord3;
			var coord4;
			var coord5;
			var coord6;
			var coord7;
			var dens0;
			var dens1;
			var dens2;
			var dens3;
			var dens4;
			var dens5;
			var dens6;
			var dens7;
			var ntriang = 0;
			var new_ntriang;
			var res = c_size/RES_RATIO
			for(var i=0; i < RES_RATIO; i++)	//Remember to change these if the c_size isn't all the same
				for(var j=0; j < RES_RATIO; j++)
					for(var k=0; k < RES_RATIO; k++)
					{
						coord0 = vec3(i*res+coords[0],j*res+coords[1],k*res+coords[2]);
						coord1 = vec3(i*res+res+coords[0],j*res+coords[1],k*res+coords[2]);
						coord2 = vec3(i*res+res+coords[0],j*res+coords[1],k*res+res+coords[2]);
						coord3 = vec3(i*res+coords[0],j*res+coords[1],k*res+res+coords[2]);
						coord4 = vec3(i*res+coords[0],j*res+res+coords[1],k*res+coords[2]);
						coord5 = vec3(i*res+res+coords[0],j*res+res+coords[1],k*res+coords[2]);
						coord6 = vec3(i*res+res+coords[0],j*res+res+coords[1],k*res+res+coords[2]);
						coord7 = vec3(i*res+coords[0],j*res+res+coords[1],k*res+res+coords[2]);
						var coordArray = [coord0, coord1, coord2, coord3, coord4, coord5, coord6, coord7];
						dens0 = dens_unpacked[j*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+i];
						dens1 = dens_unpacked[j*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+(i+1)];
						dens2 = dens_unpacked[j*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+(i+1)];
						dens3 = dens_unpacked[j*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+i];
						dens4 = dens_unpacked[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+i];
						dens5 = dens_unpacked[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+(i+1)];
						dens6 = dens_unpacked[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+(i+1)];
						dens7 = dens_unpacked[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+i];
						var densArray = [dens0, dens1, dens2, dens3, dens4, dens5, dens6, dens7];
						
						new_ntriang = march_gpu(coordArray, densArray, norm_unpacked, this.to_draw[0].contents, ntriang, edge_table, tri_table);	//CHANGE THE TO_DRAW LATER
						
						//if new_ntriang is the same as the old one, we didnt generate any geometry and we shouldn't try again - use this info later maybe
						ntriang = new_ntriang;
					}
					this.to_draw[0].checked = 3;
		
			
		/*	
			// Process data between GPU stages if necessary//
			
			almanac_Pass_FBO.activate();
			shaders_in_use["c_Almanac_Shader"].activate();//Use built in template code to correctly bind textures and uniforms etc.
			screenQuad.draw(graphics_state,eye,material);
			var alm1 = []; //May need to setup as var alm1 = new Uint8Array(length);
			var alm2 = [];
			almanac_Pass_FBO.deactivate();
			gl.bindTexture(gl.TEXTURE_2D,almanac_Pass_FBO.tx[0]);
			glReadPixels(0,0,almanac_Pass_FBO.fb.width,almanac_Pass_FBO.fb.height,gl.RGBA,gl.UNSIGNED_BYTE,densArray);
			gl.bindTexture(gl.TEXTURE_2D,almanac_FBO.tx[1]);
			glReadPixels(0,0,almanac_Pass_FBO.fb.width,almanac_Pass_FBO.fb.height,gl.RGBA,gl.UNSIGNED_BYTE,normArray);
			

		*/
	},
	
		
	'populate_CPU': function(node) 
    {
		coords = node.coords;
		c_size = node.size;
		
		//res = c_size/RES_RATIO;
		res = RES;
		//Since we don't actually draw anything with this:
		this.positions = [];
		this.normals = [];
		this.indices = [];

		
					
		//Changed function to work on a box of size c_size at lowest coordinate coords, divisible by c_size
		
		//For each cube, pass in the coordinates and density values
		//First, calculate density at all vertices (+1 to find normals for serious speed up, but might be way too low res - fix if it is)
		var dens_flat = [];
		for(var j = 0; j < RES_RATIO+1; j++)	//Plus 2 because of the above note
			for(var k = 0; k < RES_RATIO+1; k++)	//Y coord goes up slowest
				for(var i = 0; i < RES_RATIO+1; i++)
				{
					dens_flat.push(f_density(vec3(coords[0]+i*res, coords[1]+j*res, coords[2]+k*res)));
				}	
		/*
		//Still need giant array with all the normals at the coords
		var norm_flat = [];
		for(var j = 0; j < RES_RATIO+1; j++)
			for(var i = 0; i < RES_RATIO+1; i++)	//Y coord goes up slowest
				for(var k = 0; k < RES_RATIO+1; k++)
				{
					//At each vertex, add the correct density
					var density = dens_flat[j*(RES_RATIO+2)*(RES_RATIO+2)+k*(RES_RATIO+2)+i];
					// var x_grad_dens = dens_flat[j*(RES_RATIO+2)*(RES_RATIO+2)+k*(RES_RATIO+2)+(i+1)];
					// var y_grad_dens = dens_flat[(j+1)*(RES_RATIO+2)*(RES_RATIO+2)+k*(RES_RATIO+2)+i];
					// var z_grad_dens = dens_flat[j*(RES_RATIO+2)*(RES_RATIO+2)+(k+1)*(RES_RATIO+2)+i];
					// var x_grad_dens = f_density(vec3(coords[0]+i+0.01, coords[1]+j, coords[2]+k))
					// var y_grad_dens = f_density(vec3(coords[0]+i, coords[1]+j+0.01, coords[2]+k))
					// var z_grad_dens = f_density(vec3(coords[0]+i, coords[1]+j, coords[2]+k+0.01))
					
					// var x_grad = density - x_grad_dens;
					// var y_grad = density - y_grad_dens;
					// var z_grad = density - z_grad_dens;
					// norm_flat.push(normalize(vec3(x_grad, y_grad, z_grad)));
					norm_flat.push(find_grad(vec3(coords[0]+i,coords[1]+j,coords[2]+k)));
				}
		*/
		
		var coord0;
		var coord1;
		var coord2;
		var coord3;
		var coord4;
		var coord5;
		var coord6;
		var coord7;
		var coordArray = [];
		var dens0;
		var dens1;
		var dens2;
		var dens3;
		var dens4;
		var dens5;
		var dens6;
		var dens7;
		var densArray = [];
		var ntriang = 0;
		var new_ntriang;
		for(var i=0; i < c_size/res; i++)	//Remember to change these if the c_size isn't all the same
			for(var j=0; j < c_size/res; j++)
				for(var k=0; k < c_size/res; k++)
				{
					coord0 = vec3(i*res+coords[0],j*res+coords[1],k*res+coords[2]);
					coord1 = vec3(i*res+res+coords[0],j*res+coords[1],k*res+coords[2]);
					coord2 = vec3(i*res+res+coords[0],j*res+coords[1],k*res+res+coords[2]);
					coord3 = vec3(i*res+coords[0],j*res+coords[1],k*res+res+coords[2]);
					coord4 = vec3(i*res+coords[0],j*res+res+coords[1],k*res+coords[2]);
					coord5 = vec3(i*res+res+coords[0],j*res+res+coords[1],k*res+coords[2]);
					coord6 = vec3(i*res+res+coords[0],j*res+res+coords[1],k*res+res+coords[2]);
					coord7 = vec3(i*res+coords[0],j*res+res+coords[1],k*res+res+coords[2]);
					coordArray = [coord0, coord1, coord2, coord3, coord4, coord5, coord6, coord7];					
					dens0 = dens_flat[j*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+i];
					dens1 = dens_flat[j*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+(i+1)];
					dens2 = dens_flat[j*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+(i+1)];
					dens3 = dens_flat[j*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+i];
					dens4 = dens_flat[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+i];
					dens5 = dens_flat[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+k*(RES_RATIO+1)+(i+1)];
					dens6 = dens_flat[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+(i+1)];
					dens7 = dens_flat[(j+1)*(RES_RATIO+1)*(RES_RATIO+1)+(k+1)*(RES_RATIO+1)+i];
					densArray = [dens0, dens1, dens2, dens3, dens4, dens5, dens6, dens7];
					new_ntriang = march(coordArray, densArray, node.contents, ntriang, edge_table, tri_table);
					//if new_ntriang is the same as the old one, we didnt generate any geometry and we shouldn't try again - use this info later
					ntriang = new_ntriang;
				}
				
		node.checked = 4;	//Set it as "drawn"
								
	},
	
	
	'choose_to_check': function(p_pos, p_heading)
	{
		var c_size = RES * RES_RATIO;
		//Args are plane pos and plane heading
		//Every time the program asks, repopulates the to_check list based on position
		//Might need to process p_heading first, depending on what we can get
		var p_heading_vec = mult_vec(p_heading, vec4(0,0,-1,0));
		var p_heading_deg = (180/Math.PI*Math.atan2(p_heading_vec[0],-1*p_heading_vec[2])+360)%360;			
		var p_heading_val = Math.floor((p_heading_deg+22.5)/45);	//Gives 0-8
		p_pos = vec3(p_pos[0]+c_size/2, p_pos[1]+c_size/2, p_pos[2]+c_size/2);
		var p_pos_div = scale_vec(1/c_size, p_pos);	//Puts it on the boundaries
		var p_pos_floor = [];
		for ( var i = 0; i < 3; i++ ) 
			p_pos_floor.push( Math.floor(p_pos_div[i]));
		p_pos_block = scale_vec(c_size, p_pos_floor);
		
		
		var k_low =  -DRAW_DIST;
		var k_high = DRAW_DIST;
		var i_low =  -DRAW_DIST;
		var i_high = DRAW_DIST;
		
		switch(p_heading_val)
		{
			case 0: k_low -= DIR_DRAW_DIST*2; break;
			case 1: k_low -= DIR_DRAW_DIST; i_high += DIR_DRAW_DIST; break;
			case 2: i_high += DIR_DRAW_DIST*2; break;
			case 3: i_high += DIR_DRAW_DIST; k_high += DIR_DRAW_DIST; break;
			case 4: k_high += DIR_DRAW_DIST*2; break;
			case 5: k_high += DIR_DRAW_DIST; i_low -= DIR_DRAW_DIST; break;
			case 6: i_low -= DIR_DRAW_DIST*2; break;
			case 7: i_low -= DIR_DRAW_DIST; k_low -= DIR_DRAW_DIST; break;
			case 8: k_low -= DIR_DRAW_DIST*2; break;
			// case 0: k_low -= DIR_DRAW_DIST*2; break;
			// case 1: k_low -= DIR_DRAW_DIST*2; i_high += DIR_DRAW_DIST*2; break;
			// case 2: i_high += DIR_DRAW_DIST*2; break;
			// case 3: i_high += DIR_DRAW_DIST*2; k_high += DIR_DRAW_DIST*2; break;
			// case 4: k_high += DIR_DRAW_DIST*2; break;
			// case 5: k_high += DIR_DRAW_DIST*2; i_low -= DIR_DRAW_DIST*2; break;
			// case 6: i_low -= DIR_DRAW_DIST*2; break;
			// case 7: i_low -= DIR_DRAW_DIST*2; k_low -= DIR_DRAW_DIST*2; break;
			// case 8: k_low -= DIR_DRAW_DIST*2; break;
		}
		//console.log(i_low, i_high, p_pos_block);
		
		for(i = p_pos_block[0] + (i_low*c_size); i < p_pos_block[0] + (i_high*c_size); i += c_size)	
		{
			for(k = p_pos_block[2] + (k_low*c_size); k < p_pos_block[2] + (k_high*c_size); k += c_size)	//Note that these loops increase 32 or 64 at a time, whatever larger number we choose
			{
				if(Math.abs(i) < WORLD_SIZE/2 && Math.abs(k) < WORLD_SIZE/2)	//It's inside the world, yay
				{						
					for(j = -WORLD_HEIGHT/2; j < WORLD_HEIGHT/2; j += c_size)
					{
						//Add each block in the vertical span to the list
						this.to_check.push(Node_find(vec3(i,j,k), c_size, this.world_tree, null));
					}
				}
			}
		}			
	},
	
	'check_all': function()
	{
		for(i = 0; i < this.to_check.length; i++)
		{
			if(this.to_check[i].checked == 0)
				this.to_check[i].checked = check_block(this.to_check[i].coords, this.to_check[i].size);
			if(this.to_check[i].checked == 3)	//If the check revealed it needs to be created
			{
				this.to_create.push(this.to_check[i]);
				this.to_draw_new.push(this.to_check[i]);
			}
			if(this.to_check[i].checked == 4)	//If the check revealed it's in view, but already created			
				this.to_draw_new.push(this.to_check[i]);
			if(this.to_check[i].checked == 5)	//If the check revealed it's in view, created, and we need to stop it from getting purged	
			{
				this.to_check[i].checked == 4;
				this.to_draw_new.push(this.to_check[i]);
			}				
		}		
		this.to_check = [];	//Reset the list
	}
	
	
}, Shape );


//Something feels wrong about defining these all here, but oh well


//Perlin noise functions:
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
	
function lerpvec3(a, b, x){		//Linearly interpolate vec3
	return vec3(a[0] + x * (b[0] - a[0]), a[1] + x * (b[1] - a[1]), a[2] + x * (b[2] - a[2]));}

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

//Paul Bourke's implementation of the marching cubes algorithm, rewritten in javascript and adapted here to make us a surface
/*
   Linearly interpolate the position where an isosurface cuts
   an edge between two vertices, each with their own scalar value
*/
function perlin(x, y, z)
{	
	x += 1048576;	//Makes it positive
	y += 1048576;
	z += 1048576;

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


function VertexInterp(isolevel,p1,p2,valp1,valp2)
{
   var mu;
   var p = vec3();

   if (Math.abs(isolevel-valp1) < 0.00001)
	  return(p1);
   if (Math.abs(isolevel-valp2) < 0.00001)
	  return(p2);
   if (Math.abs(valp1-valp2) < 0.00001)
	  return(p1);
   mu = (isolevel - valp1) / (valp2 - valp1);
   p[0] = p1[0] + mu * (p2[0] - p1[0]);
   p[1] = p1[1] + mu * (p2[1] - p1[1]);
   p[2] = p1[2] + mu * (p2[2] - p1[2]);

   return(p);
}

function find_grad(pos)
{
	var grad_o = vec3(0,0,0);
	density_pos = f_density(pos);
	grad_o[0] = density_pos - f_density(add(pos, vec3(0.001, 0, 0)));
	grad_o[1] = density_pos - f_density(add(pos, vec3(0, 0.001, 0)));
	grad_o[2] = density_pos - f_density(add(pos, vec3(0, 0, 0.001)));
	return normalize(grad_o);
}
var edge_table = [	//Remember, you changed this from edgeTable to edge_table
		0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
		0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
		0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
		0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
		0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
		0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
		0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
		0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
		0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
		0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
		0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
		0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
		0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
		0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
		0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
		0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
		0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
		0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
		0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
		0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
		0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
		0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
		0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
		0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
		0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
		0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
		0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
		0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
		0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
		0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
		0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
		0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0   ];
var tri_table =
		[[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
		[3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
		[3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
		[3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
		[9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
		[9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
		[2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
		[8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
		[9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
		[4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
		[3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
		[1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
		[4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
		[4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
		[9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
		[5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
		[2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
		[9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
		[0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
		[2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
		[10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
		[4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
		[5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1],
		[5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1],
		[9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
		[0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
		[1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
		[10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
		[8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
		[2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
		[7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
		[9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
		[2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
		[11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
		[9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
		[5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
		[11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
		[11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
		[1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
		[9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
		[5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
		[2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
		[0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
		[5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
		[6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
		[3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
		[6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
		[5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
		[1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
		[10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
		[6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
		[8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
		[7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
		[3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
		[5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
		[0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
		[9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
		[8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
		[5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
		[0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
		[6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
		[10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
		[10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
		[8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
		[1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
		[3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
		[0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
		[10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
		[3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
		[6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
		[9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
		[8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
		[3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1],
		[6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1],
		[0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1],
		[10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1],
		[10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1],
		[2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
		[7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1],
		[7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1],
		[2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
		[1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
		[11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1],
		[8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
		[0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1],
		[7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
		[10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
		[2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
		[6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1],
		[7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1],
		[2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1],
		[1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1],
		[10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1],
		[10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1],
		[0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1],
		[7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1],
		[6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1],
		[8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1],
		[9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1],
		[6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1],
		[4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1],
		[10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
		[8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1],
		[0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1],
		[1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1],
		[8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1],
		[10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1],
		[4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
		[10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
		[5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
		[11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1],
		[9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
		[6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1],
		[7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1],
		[3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
		[7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1],
		[9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1],
		[3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1],
		[6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
		[9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1],
		[1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
		[4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
		[7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1],
		[6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1],
		[3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1],
		[0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1],
		[6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1],
		[0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
		[11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
		[6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1],
		[5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1],
		[9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1],
		[1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
		[1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
		[10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1],
		[0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1],
		[5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1],
		[10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1],
		[11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1],
		[9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1],
		[7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
		[2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1],
		[8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1],
		[9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1],
		[9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
		[1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1],
		[9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1],
		[9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1],
		[5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1],
		[0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1],
		[10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
		[2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1],
		[0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
		[0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
		[9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1],
		[5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1],
		[3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
		[5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1],
		[8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1],
		[0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1],
		[9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1],
		[0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1],
		[1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
		[3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
		[4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1],
		[9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
		[11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
		[11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1],
		[2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1],
		[9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
		[3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
		[1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1],
		[4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1],
		[4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1],
		[0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1],
		[3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1],
		[3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1],
		[0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1],
		[9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1],
		[1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
		[-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]];




function sign_density(coords)
		{
			if(f_density(coords) > 0)	//Returns true if it's positive -> ground
				return true;
			else
				return false;
		}

function march(grid_p, grid_val, shape_in, ntriang, edgeTable, triTable)
{
	var isolevel = 0;	//We set this
	//var triangles;	//Shouldn't be needed because we have the shape setup?
	
	//var i;
	var ntriang;
	var cubeindex;
	var vertlist = [];
	

	/*
	  Determine the index into the edge table which
	  tells us which vertices are inside of the surface
	*/
	cubeindex = 0;
	if (grid_val[0] < isolevel) cubeindex |= 1;
	if (grid_val[1] < isolevel) cubeindex |= 2;
	if (grid_val[2] < isolevel) cubeindex |= 4;
	if (grid_val[3] < isolevel) cubeindex |= 8;
	if (grid_val[4] < isolevel) cubeindex |= 16;
	if (grid_val[5] < isolevel) cubeindex |= 32;
	if (grid_val[6] < isolevel) cubeindex |= 64;
	if (grid_val[7] < isolevel) cubeindex |= 128;

	/* Cube is entirely in/out of the surface */
	if (edgeTable[cubeindex] == 0)
	  return(ntriang);

	/* Find the vertices where the surface intersects the cube */
	if (edgeTable[cubeindex] & 1)
	  vertlist[0] =
		 VertexInterp(isolevel,grid_p[0],grid_p[1],grid_val[0],grid_val[1]);
	if (edgeTable[cubeindex] & 2)
	  vertlist[1] =
		 VertexInterp(isolevel,grid_p[1],grid_p[2],grid_val[1],grid_val[2]);
	if (edgeTable[cubeindex] & 4)
	  vertlist[2] =
		 VertexInterp(isolevel,grid_p[2],grid_p[3],grid_val[2],grid_val[3]);
	if (edgeTable[cubeindex] & 8)
	  vertlist[3] =
		 VertexInterp(isolevel,grid_p[3],grid_p[0],grid_val[3],grid_val[0]);
	if (edgeTable[cubeindex] & 16)
	  vertlist[4] =
		 VertexInterp(isolevel,grid_p[4],grid_p[5],grid_val[4],grid_val[5]);
	if (edgeTable[cubeindex] & 32)
	  vertlist[5] =
		 VertexInterp(isolevel,grid_p[5],grid_p[6],grid_val[5],grid_val[6]);
	if (edgeTable[cubeindex] & 64)
	  vertlist[6] =
		 VertexInterp(isolevel,grid_p[6],grid_p[7],grid_val[6],grid_val[7]);
	if (edgeTable[cubeindex] & 128)
	  vertlist[7] =
		 VertexInterp(isolevel,grid_p[7],grid_p[4],grid_val[7],grid_val[4]);
	if (edgeTable[cubeindex] & 256)
	  vertlist[8] =
		 VertexInterp(isolevel,grid_p[0],grid_p[4],grid_val[0],grid_val[4]);
	if (edgeTable[cubeindex] & 512)
	  vertlist[9] =
		 VertexInterp(isolevel,grid_p[1],grid_p[5],grid_val[1],grid_val[5]);
	if (edgeTable[cubeindex] & 1024)
	  vertlist[10] =
		 VertexInterp(isolevel,grid_p[2],grid_p[6],grid_val[2],grid_val[6]);
	if (edgeTable[cubeindex] & 2048)
	  vertlist[11] =
		 VertexInterp(isolevel,grid_p[3],grid_p[7],grid_val[3],grid_val[7]);

	/* Create the triangle */
	var pos0;
	var pos1;
	var pos2;
	for (var i=0; triTable[cubeindex][i]!=-1; i+=3) {
	  //triangles[ntriang].p[0] = vertlist[triTable[cubeindex][i  ]];
	  //triangles[ntriang].p[1] = vertlist[triTable[cubeindex][i+1]];
	  //triangles[ntriang].p[2] = vertlist[triTable[cubeindex][i+2]];
		pos0 = vertlist[triTable[cubeindex][i  ]];
		pos1 = vertlist[triTable[cubeindex][i+1]];
		pos2 = vertlist[triTable[cubeindex][i+2]];
	  
		shape_in.positions.push(pos0, pos1, pos2);
		shape_in.indices.push(ntriang*3, ntriang*3+1, ntriang*3+2);
		
		shape_in.normals.push(find_grad(pos0), find_grad(pos1), find_grad(pos2));  //Old way, but it actually works
		//Generate 3 normals, one for each vertex sent in
		/*		
		if(Math.abs(pos0[0] - Math.trunc(pos0[0])) <= 0.01 && Math.abs(pos0[1] - Math.trunc(pos0[1])) <= 0.01 && Math.abs(pos0[2] - Math.trunc(pos0[2])) <= 0.01)	//Trunc to deal with negatives correctly
			{
				var norm_coord = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));
				shape_in.normals.push(normals[(norm_coord[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+WORLD_SIZE)%RES_RATIO]);
			}
			else if (Math.abs(pos0[0] - Math.trunc(pos0[0])) > 0.01)	//Vertex is on x-parallel line
			{
				var lerp_pos1 = vec3(Math.floor(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.ceil(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));
				var lerp_x = pos0[0] - Math.trunc(pos0[0]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos0[1] - Math.trunc(pos0[1])) > 0.01)	//Vertex is on y-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos0[0]), Math.floor(pos0[1]), Math.round(pos0[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos0[0]), Math.ceil(pos0[1]), Math.round(pos0[2]));
				var lerp_x = pos0[1] - Math.trunc(pos0[1]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos0[2] - Math.trunc(pos0[2])) > 0.01)	//Vertex is on z-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.floor(pos0[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.ceil(pos0[2]));
				var lerp_x = pos0[2] - Math.trunc(pos0[2]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else console.log("Hey, something broke in the marching cubes normal gen");
			
			//And now for pos1 and pos2, a similar treatment:
			if(Math.abs(pos1[0] - Math.trunc(pos1[0])) < 0.01 && Math.abs(pos1[1] - Math.trunc(pos1[1])) < 0.01 && Math.abs(pos1[2] - Math.trunc(pos1[2])) < 0.01)	//Trunc to deal with negatives correctly
			{
				var norm_coord = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));
				shape_in.normals.push(normals[(norm_coord[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+WORLD_SIZE)%RES_RATIO]);
			}
			else if (Math.abs(pos1[0] - Math.trunc(pos1[0])) > 0.01)	//Vertex is on x-parallel line
			{
				var lerp_pos1 = vec3(Math.floor(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.ceil(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));
				var lerp_x = pos1[0] - Math.trunc(pos1[0]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos1[1] - Math.trunc(pos1[1])) > 0.01)	//Vertex is on y-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos1[0]), Math.floor(pos1[1]), Math.round(pos1[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos1[0]), Math.ceil(pos1[1]), Math.round(pos1[2]));
				var lerp_x = pos1[1] - Math.trunc(pos1[1]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos1[2] - Math.trunc(pos1[2])) > 0.01)	//Vertex is on z-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.floor(pos1[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.ceil(pos1[2]));
				var lerp_x = pos1[2] - Math.trunc(pos1[2]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else console.log("Hey, something broke in the marching cubes normal gen");
			
			//pos2:
			if(Math.abs(pos2[0] - Math.trunc(pos2[0])) < 0.01 && Math.abs(pos2[1] - Math.trunc(pos2[1])) < 0.01 && Math.abs(pos2[2] - Math.trunc(pos2[2])) < 0.01)	//Trunc to deal with negatives correctly
			{
				var norm_coord = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));
				shape_in.normals.push(normals[(norm_coord[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+WORLD_SIZE)%RES_RATIO]);
			}
			else if (Math.abs(pos2[0] - Math.trunc(pos2[0])) > 0.01)	//Vertex is on x-parallel line
			{
				var lerp_pos1 = vec3(Math.floor(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.ceil(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));
				var lerp_x = pos2[0] - Math.trunc(pos2[0]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos2[1] - Math.trunc(pos2[1])) > 0.01)	//Vertex is on y-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos2[0]), Math.floor(pos2[1]), Math.round(pos2[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos2[0]), Math.ceil(pos2[1]), Math.round(pos2[2]));
				var lerp_x = pos2[1] - Math.trunc(pos2[1]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else if (Math.abs(pos2[2] - Math.trunc(pos2[2])) > 0.01)	//Vertex is on z-parallel line
			{
				var lerp_pos1 = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.floor(pos2[2]));	//The distinction between x,y,z is here
				var lerp_pos2 = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.ceil(pos2[2]));
				var lerp_x = pos2[2] - Math.trunc(pos2[2]);	//Also, these are different
				var lerp_val1 = normals[(lerp_pos1[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+WORLD_SIZE)%RES_RATIO];
				var lerp_val2 = normals[(lerp_pos2[1]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+WORLD_SIZE)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+WORLD_SIZE)%RES_RATIO];
				shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
			}
			else console.log("Hey, something broke in the marching cubes normal gen");
		*/
			ntriang++;
	}

	return(ntriang);
}		
		
		
		
/*
   Given a grid cell and an isolevel, calculate the triangular
   facets required to represent the isosurface through the cell.
   Return the number of triangular facets, the array "triangles"
   will be loaded up with the vertices at most 5 triangular facets.
	0 will be returned if the grid cell is either totally above
   of totally below the isolevel.
*/
		//Returns number of triangles made		
function march_gpu(grid_p, grid_val, normals, shape_in, ntriang, edgeTable, triTable)
{
	var isolevel = 0;	//We set this
	//var triangles;	//Shouldn't be needed because we have the shape setup?
	
	//var i;
	var ntriang;
	var cubeindex;
	var vertlist = [];
	

	/*
	  Determine the index into the edge table which
	  tells us which vertices are inside of the surface
	*/
	cubeindex = 0;
	if (grid_val[0] < isolevel) cubeindex |= 1;
	if (grid_val[1] < isolevel) cubeindex |= 2;
	if (grid_val[2] < isolevel) cubeindex |= 4;
	if (grid_val[3] < isolevel) cubeindex |= 8;
	if (grid_val[4] < isolevel) cubeindex |= 16;
	if (grid_val[5] < isolevel) cubeindex |= 32;
	if (grid_val[6] < isolevel) cubeindex |= 64;
	if (grid_val[7] < isolevel) cubeindex |= 128;

	/* Cube is entirely in/out of the surface */
	if (edgeTable[cubeindex] == 0)
	  return(ntriang);

	/* Find the vertices where the surface intersects the cube */
	if (edgeTable[cubeindex] & 1)
	  vertlist[0] =
		 VertexInterp(isolevel,grid_p[0],grid_p[1],grid_val[0],grid_val[1]);
	if (edgeTable[cubeindex] & 2)
	  vertlist[1] =
		 VertexInterp(isolevel,grid_p[1],grid_p[2],grid_val[1],grid_val[2]);
	if (edgeTable[cubeindex] & 4)
	  vertlist[2] =
		 VertexInterp(isolevel,grid_p[2],grid_p[3],grid_val[2],grid_val[3]);
	if (edgeTable[cubeindex] & 8)
	  vertlist[3] =
		 VertexInterp(isolevel,grid_p[3],grid_p[0],grid_val[3],grid_val[0]);
	if (edgeTable[cubeindex] & 16)
	  vertlist[4] =
		 VertexInterp(isolevel,grid_p[4],grid_p[5],grid_val[4],grid_val[5]);
	if (edgeTable[cubeindex] & 32)
	  vertlist[5] =
		 VertexInterp(isolevel,grid_p[5],grid_p[6],grid_val[5],grid_val[6]);
	if (edgeTable[cubeindex] & 64)
	  vertlist[6] =
		 VertexInterp(isolevel,grid_p[6],grid_p[7],grid_val[6],grid_val[7]);
	if (edgeTable[cubeindex] & 128)
	  vertlist[7] =
		 VertexInterp(isolevel,grid_p[7],grid_p[4],grid_val[7],grid_val[4]);
	if (edgeTable[cubeindex] & 256)
	  vertlist[8] =
		 VertexInterp(isolevel,grid_p[0],grid_p[4],grid_val[0],grid_val[4]);
	if (edgeTable[cubeindex] & 512)
	  vertlist[9] =
		 VertexInterp(isolevel,grid_p[1],grid_p[5],grid_val[1],grid_val[5]);
	if (edgeTable[cubeindex] & 1024)
	  vertlist[10] =
		 VertexInterp(isolevel,grid_p[2],grid_p[6],grid_val[2],grid_val[6]);
	if (edgeTable[cubeindex] & 2048)
	  vertlist[11] =
		 VertexInterp(isolevel,grid_p[3],grid_p[7],grid_val[3],grid_val[7]);

	/* Create the triangle */
	var pos0;
	var pos1;
	var pos2;
	for (var i=0; triTable[cubeindex][i]!=-1; i+=3) {
	  //triangles[ntriang].p[0] = vertlist[triTable[cubeindex][i  ]];
	  //triangles[ntriang].p[1] = vertlist[triTable[cubeindex][i+1]];
	  //triangles[ntriang].p[2] = vertlist[triTable[cubeindex][i+2]];
		pos0 = vertlist[triTable[cubeindex][i  ]];
		pos1 = vertlist[triTable[cubeindex][i+1]];
		pos2 = vertlist[triTable[cubeindex][i+2]];
	  
		shape_in.positions.push(pos0, pos1, pos2);
		shape_in.indices.push(ntriang*3, ntriang*3+1, ntriang*3+2);
		  
		//shape_in.normals.push(vec3(0,1,0), vec3(0,1,0), vec3(0,1,0));	//TODO: Generate normals with the gradient of the density function
		//Generate 3 normals, one for each vertex sent in
		//Need to do the interpolation between the normals from the vertices
		//pos0 first:
		if(Math.abs(pos0[0] - Math.trunc(pos0[0])) < 0.01 && Math.abs(pos0[1] - Math.trunc(pos0[1])) < 0.01 && Math.abs(pos0[2] - Math.trunc(pos0[2])) < 0.01)	//Trunc to deal with negatives correctly
		{
			var norm_coord = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));
			shape_in.normals.push(normals[(norm_coord[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+65536)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+65536)%RES_RATIO]);
		}
		else if (Math.abs(pos0[0] - Math.trunc(pos0[0])) > 0.01)	//Vertex is on x-parallel line
		{
			var lerp_pos1 = vec3(Math.floor(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.ceil(pos0[0]), Math.round(pos0[1]), Math.round(pos0[2]));
			var lerp_x = pos0[0] - Math.trunc(pos0[0]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos0[1] - Math.trunc(pos0[1])) > 0.01)	//Vertex is on y-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos0[0]), Math.floor(pos0[1]), Math.round(pos0[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos0[0]), Math.ceil(pos0[1]), Math.round(pos0[2]));
			var lerp_x = pos0[1] - Math.trunc(pos0[1]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos0[2] - Math.trunc(pos0[2])) > 0.01)	//Vertex is on z-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.floor(pos0[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos0[0]), Math.round(pos0[1]), Math.ceil(pos0[2]));
			var lerp_x = pos0[2] - Math.trunc(pos0[2]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else console.log("Hey, something broke in the marching cubes normal gen");
		
		//And now for pos1 and pos2, a similar treatment:
		if(Math.abs(pos1[0] - Math.trunc(pos1[0])) < 0.01 && Math.abs(pos1[1] - Math.trunc(pos1[1])) < 0.01 && Math.abs(pos1[2] - Math.trunc(pos1[2])) < 0.01)	//Trunc to deal with negatives correctly
		{
			var norm_coord = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));
			shape_in.normals.push(normals[(norm_coord[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+65536)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+65536)%RES_RATIO]);
		}
		else if (Math.abs(pos1[0] - Math.trunc(pos1[0])) > 0.01)	//Vertex is on x-parallel line
		{
			var lerp_pos1 = vec3(Math.floor(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.ceil(pos1[0]), Math.round(pos1[1]), Math.round(pos1[2]));
			var lerp_x = pos1[0] - Math.trunc(pos1[0]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos1[1] - Math.trunc(pos1[1])) > 0.01)	//Vertex is on y-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos1[0]), Math.floor(pos1[1]), Math.round(pos1[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos1[0]), Math.ceil(pos1[1]), Math.round(pos1[2]));
			var lerp_x = pos1[1] - Math.trunc(pos1[1]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos1[2] - Math.trunc(pos1[2])) > 0.01)	//Vertex is on z-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.floor(pos1[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos1[0]), Math.round(pos1[1]), Math.ceil(pos1[2]));
			var lerp_x = pos1[2] - Math.trunc(pos1[2]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else console.log("Hey, something broke in the marching cubes normal gen");
		
		//pos2:
		if(Math.abs(pos2[0] - Math.trunc(pos2[0])) < 0.01 && Math.abs(pos2[1] - Math.trunc(pos2[1])) < 0.01 && Math.abs(pos2[2] - Math.trunc(pos2[2])) < 0.01)	//Trunc to deal with negatives correctly
		{
			var norm_coord = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));
			shape_in.normals.push(normals[(norm_coord[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(norm_coord[2]+65536)%RES_RATIO*(RES_RATIO+1)+(norm_coord[0]+65536)%RES_RATIO]);
		}
		else if (Math.abs(pos2[0] - Math.trunc(pos2[0])) > 0.01)	//Vertex is on x-parallel line
		{
			var lerp_pos1 = vec3(Math.floor(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.ceil(pos2[0]), Math.round(pos2[1]), Math.round(pos2[2]));
			var lerp_x = pos2[0] - Math.trunc(pos2[0]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos2[1] - Math.trunc(pos2[1])) > 0.01)	//Vertex is on y-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos2[0]), Math.floor(pos2[1]), Math.round(pos2[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos2[0]), Math.ceil(pos2[1]), Math.round(pos2[2]));
			var lerp_x = pos2[1] - Math.trunc(pos2[1]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else if (Math.abs(pos2[2] - Math.trunc(pos2[2])) > 0.01)	//Vertex is on z-parallel line
		{
			var lerp_pos1 = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.floor(pos2[2]));	//The distinction between x,y,z is here
			var lerp_pos2 = vec3(Math.round(pos2[0]), Math.round(pos2[1]), Math.ceil(pos2[2]));
			var lerp_x = pos2[2] - Math.trunc(pos2[2]);	//Also, these are different
			var lerp_val1 = normals[(lerp_pos1[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos1[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos1[0]+65536)%RES_RATIO];
			var lerp_val2 = normals[(lerp_pos2[1]+65536)%RES_RATIO*(RES_RATIO+1)*(RES_RATIO+1)+(lerp_pos2[2]+65536)%RES_RATIO*(RES_RATIO+1)+(lerp_pos2[0]+65536)%RES_RATIO];
			shape_in.normals.push(normalize(lerpvec3(lerp_val1, lerp_val2, lerp_x)));			
		}
		else console.log("Hey, something broke in the marching cubes normal gen");
		
		ntriang++;
	}

	return(ntriang);
}	


//Stuff for a tree is below, so we can hold the block data
//parent holds the node's parent, children holds the list of child nodes
//Conveniently, it naturally deals with larger sizes too
function Node(coords, size, base) {	//To make a new tree, put in (vec3(-size/2,-size/2,-size/2), size, null)
	this.coords = coords;
    this.size = size;	//Dimensions of the block	
	this.checked = 0;	//0-3, corresponding to unchecked, all air, all ground, and to draw
    this.base = base;	//Because parent is reserved for something?
    this.children = [];
	this.contents = new Node_contents;	//Add a terrain to this when it's generated
}

function Node_find(loc, size, node, base)	//This size is the goal size - for the current size, use node.size
{
	//Should probably be recursive
	//When first calling the function, give it the tree as the "node"
	if(!node)	
	{
		node = Node_add(vec3(Math.floor(loc[0]/(base.size/2))*base.size/2, Math.floor(loc[1]/(base.size/2))*base.size/2, Math.floor(loc[2]/(base.size/2))*base.size/2), base.size/2, base);
	}
	if(node.size == size)
		return node;
	var found;	
	if(loc[0] < node.coords[0]+node.size/2)	//If equal, this should never be true - might cause errors if using floats and rounding goes badly
		if(loc[1] < node.coords[1]+node.size/2)
			if(loc[2] < node.coords[2]+node.size/2)			
				found = Node_find(loc, size, node.children[0], node);
			else
				found = Node_find(loc, size, node.children[4], node);
		else
			if(loc[2] < node.coords[2]+node.size/2)			
				found = Node_find(loc, size, node.children[2], node);
			else
				found = Node_find(loc, size, node.children[6], node);
	else
		if(loc[1] < node.coords[1]+node.size/2)
			if(loc[2] < node.coords[2]+node.size/2)			
				found = Node_find(loc, size, node.children[1], node);
			else
				found = Node_find(loc, size, node.children[5], node);
		else
			if(loc[2] < node.coords[2]+node.size/2)			
				found = Node_find(loc, size, node.children[3], node);
			else
				found = Node_find(loc, size, node.children[7], node);
	return found;	//Returns the right node
}

function Node_add(loc, size, tree)
{
	var base = Node_find(loc, size*2, tree, null);
	var node = new Node(loc, size, base);
	if(loc[0] < base.coords[0]+size)
		if(loc[1] < base.coords[1]+size)
			if(loc[2] < base.coords[2]+size)
				base.children[0] = node;
			else
				base.children[4] = node;
		else
			if(loc[2] < base.coords[2]+size)	
				base.children[2] = node;
			else
				base.children[6] = node;		
	else
		if(loc[1] < base.coords[1]+size)
			if(loc[2] < base.coords[2]+size)	
				base.children[1] = node;
			else
				base.children[5] = node;
		else
			if(loc[2] < base.coords[2]+size)	
				base.children[3] = node;
			else
				base.children[7] = node;
	return node;
}

function check_block(coords, size)	//Check if a block needs to be drawn in the first place - much cheaper than drawing
{
	//res = size/RES_RATIO;
	res = RES;
	//Check every surface density, and stop if any of them aren't similar to every other
	check = sign_density(coords);
	//this initial check should catch most of the boundary blocks	
	if(check != sign_density(vec3(coords[0]+size, coords[1]+size, coords[2]+size)))
	{		
		return 3;	
	}
	else									 
	{
		//Now do the whole loop
		for(var i = coords[0]; i < coords[0]+size; i += res)
			for(var j = coords[1]; j < coords[1]+size; j += res)
			{
				if(check != sign_density(vec3(i, j, coords[2])) || check != sign_density(vec3(i, j, coords[2]+size)))
				{					
					return 3;
				}
			}
		for(var i = coords[0]; i < coords[0]+size; i += res)
			for(var k = coords[2]+res; k < coords[2]+size-res; k += res)
			{
				if(check != sign_density(vec3(i, coords[1], k)) || check != sign_density(vec3(i, coords[1]+size, k)))
				{					
					return 3;
				}
			}
		for(var j = coords[1]+res; j < coords[1]+size-res; j += res)
			for(var k = coords[2]+res; k < coords[2]+size-res; k += res)
			{
				if(check != sign_density(vec3(coords[0], j, k)) || check != sign_density(vec3(coords[0]+size, j, k)))
				{					
					return 3;
				}
			}
	}
	//Returns 1 or 2 to be consistent with future values
	if(check = 1)
		return 2;	
	else
		return 1;
}

function Node_terrain(node)
{
	//node.coords and node.size are the necessary parameters here
	node.terrain = new Terrain(node.coords, node.size);
}








//The old heightmap stuff
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
	
	
		
		dims = [200, 200];	//Change the size of the generated land here
		
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
  
  
  