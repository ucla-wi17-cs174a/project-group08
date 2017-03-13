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
  }, Shape );
  
  
  Declare_Any_Class( "Square",
  { 'populate': function() 
      {
        var a = 1;
		this.positions = [
			vec3(-a,-a,0),vec3(a,a,0),vec3(-a,a,0),
			vec3(-a,-a,0),vec3(a,-a,0),vec3(a,a,0)
		];
	
		this.normals.push(vec3(0,0,1),vec3(0,0,1),vec3(0,0,1),vec3(0,0,1),vec3(0,0,1),vec3(0,0,1));
	
		this.texture_coords = [
			vec2(0,0),vec2(1,1),vec2(0,1),
			vec2(0,0),vec2(1,0),vec2(1,1)
		];
		
		this.indices.push(0,1,2,3,4,5);
		
      }
  }, Shape );
  
Declare_Any_Class("Imported_Object",
{
	'populate': function(file_name, x, y, z, normal_x, normal_y, normal_z)
	{
		this.x = x;
		this.y = y;
		this.z = z;
		this.normal_x = normal_x;
		this.normal_y = normal_y;
		this.normal_z = normal_z;
		
		var allText;
		var rawFile = new XMLHttpRequest();
		var tempthis = this;
		// .obj files start indicies at 1, so these are placeholders

		rawFile.open("GET", "./" + file_name, false);
		rawFile.onreadystatechange = (function ()
		{
			if(rawFile.readyState === 4)
			{
				if(rawFile.status === 200 || rawFile.status == 0)
				{
					allText = rawFile.responseText.split("\n");
					for(var i = 0; i < allText.length; i++)
					{
						// process the file line by line
						var divided = allText[i].split(" ");
						if (divided[0] == "mtllib")
						{
							// how to handle mtllib
						}
						else if (divided[0] == "usemtl")
						{
							// how to handle usemtl
						}
						else if(divided[0] == "v")
						{
							tempthis.positions.push(vec3(parseFloat(divided[1]),parseFloat(divided[2]),parseFloat(divided[3])));
						}
						else if(divided[0] == "vt")
						{
							tempthis.texture_coords.push(vec2(parseFloat(divided[1]),parseFloat(divided[2])));
						}
						else if(divided[0] == "vn")
						{
							tempthis.normals.push(vec3(parseFloat(divided[1]),parseFloat(divided[2]),parseFloat(divided[3])));
						}
						else if(divided[0] == "vp")
						{
							// none
						}
						else if(divided[0] == "f")
						{
							for(var j = 1; j < divided.length; j++)
							{/*
								//tempthis.indices.push(parseFloat(divided[j]));
								var temp = divided[j].split("/");
								tempthis.indices.push(parseFloat(temp[0]));*/
							}
						}
					}
					for (var i = 0; i < tempthis.positions.length; i++)
					{
						tempthis.indices.push(i);
					}
				}
			}
		});
		rawFile.send(null);
	}
}, Shape)

Declare_Any_Class( "Collection_Object_Shell",
  {                                          
                                             
                                             
    populate: function ( file_name, x, y, z) 
      {                                      
        this.collected = false;
		this.touched = false;
		this.x = x;
		this.y = y;
		this.z = z;
		this.rotation = 0;
		
       		var allText;
		var rawFile = new XMLHttpRequest();
		var tempthis = this;
		// .obj files start indicies at 1, so these are placeholders

		rawFile.open("GET", "./" + file_name, false);
		rawFile.onreadystatechange = (function ()
		{
			if(rawFile.readyState === 4)
			{
				if(rawFile.status === 200 || rawFile.status == 0)
				{
					allText = rawFile.responseText.split("\n");
					for(var i = 0; i < allText.length; i++)
					{
						// process the file line by line
						var divided = allText[i].split(" ");
						if (divided[0] == "mtllib")
						{
							// how to handle mtllib
						}
						else if (divided[0] == "usemtl")
						{
							// how to handle usemtl
						}
						else if(divided[0] == "v")
						{
							tempthis.positions.push(vec3(parseFloat(divided[1]),parseFloat(divided[2]),parseFloat(divided[3])));
						}
						else if(divided[0] == "vt")
						{
							tempthis.texture_coords.push(vec2(parseFloat(divided[1]),parseFloat(divided[2])));
						}
						else if(divided[0] == "vn")
						{
							tempthis.normals.push(vec3(parseFloat(divided[1]),parseFloat(divided[2]),parseFloat(divided[3])));
						}
						else if(divided[0] == "vp")
						{
							// none
						}
						else if(divided[0] == "f")
						{
							for(var j = 1; j < divided.length; j++)
							{/*
								//tempthis.indices.push(parseFloat(divided[j]));
								var temp = divided[j].split("/");
								tempthis.indices.push(parseFloat(temp[0]));*/
							}
						}
					}
					for (var i = 0; i < tempthis.positions.length; i++)
					{
						tempthis.texture_coords.push(vec2(0,1));
						tempthis.indices.push(i);
					}
				}
			}
		});
		rawFile.send(null);
      }
  }, Shape )
  
  Declare_Any_Class( "Collection_Object",
  {  
	populate: function ( gate_shape, position ) 
	{  
		this.collected = false;
		this.touched = false;
		this.x = position[0];
		this.y = position[1];
		this.z = position[2];
		this.rotation = 0;    
		//So we don't load it in every time
		for(var i = 0; i < gate_shape.positions.length; i++)
		{
			this.positions[i] = vec3(gate_shape.positions[i][0], gate_shape.positions[i][1], gate_shape.positions[i][2]);
			this.normals[i] = gate_shape.normals[i];
			this.indices[i] = gate_shape.indices[i];
		}
		
		// for(var i = 0; i < gate_twirl_shape.positions.length; i++)
		// {
			// this.positions[i] = vec3(gate_twirl_shape.positions[i][0]+position[0], gate_twirl_shape.positions[i][1]+position[1], gate_twirl_shape.positions[i][2]+position[2]);
			// this.normals[i] = gate_twirl_shape.normals[i];
			// this.indices[i] = gate_twirl_shape.indices[i];
		// }		
	}	
  }, Shape )
  
  

// *********** SQUARE ***********
Declare_Any_Class( "Square",    // A square, demonstrating shared vertices.  On any planar surface, the interior edges don't make any important seams.
  { 'populate': function()      // In these cases there's no reason not to re-use values of the common vertices between triangles.  This makes all the
      {                         // vertex arrays (position, normals, etc) smaller and more cache friendly.
         this.positions     .push( vec3(-1,-1,0), vec3(1,-1,0), vec3(-1,1,0), vec3(1,1,0) ); // Specify the 4 vertices -- the point cloud that our Square needs.
         this.normals       .push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) );     // ...
         this.texture_coords.push( vec2(0,0),   vec2(1,0),   vec2(0,1),   vec2(1,1)   );     // ...
         this.indices       .push( 0, 1, 2,     1, 3, 2 );                                   // Two triangles this time, indexing into four distinct vertices.
      }
  }, Shape )
  
Declare_Any_Class( "Text_Line", // Draws a rectangle textured with images of ASCII characters textured over each quad, spelling out a string.
  { 'populate': function( max_size )    // Each quad is a separate rectangle_strip.
      { this.max_size = max_size;
        var object_transform = mat4();
        for( var i = 0; i < max_size; i++ )
        {
          Square.prototype.insert_transformed_copy_into( this, [], object_transform );
          object_transform = mult( object_transform, translation( 1.5, 0, 0 ));
        }
      },
    'draw': function( graphics_state, model_transform, heads_up_display, color )
      { if( heads_up_display )      { gl.disable( gl.DEPTH_TEST );  }
        Shape.prototype.draw.call(this, graphics_state, model_transform, new Material( color, 1, 0, 1, 40, "text.png" ) );
        if( heads_up_display )      { gl.enable(  gl.DEPTH_TEST );  }
      },
    'set_string': function( line )
      { for( var i = 0; i < this.max_size; i++ )
          {
            var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
                col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,  left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
                                  right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.texture_coords[ 4 * i ]     = vec2( left,  1 - bottom );
            this.texture_coords[ 4 * i + 1 ] = vec2( right, 1 - bottom );
            this.texture_coords[ 4 * i + 2 ] = vec2( left,  1 - top );
            this.texture_coords[ 4 * i + 3 ] = vec2( right, 1 - top );
          }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[2] );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW );
      }
  }, Shape )
  
  Declare_Any_Class( "Cube",            
  { 'populate': function(s = 1) 
      {
       
	   //Creates a Cube in the most brute force way possible. 
	   
		this.positions.push( vec3(-.5,-.5,-.5), vec3(.5,-.5,-.5), vec3(.5,.5,-.5));//-z
		this.positions.push( vec3(-.5,-.5,-.5),vec3(.5,.5,-.5), vec3(-.5,.5,-.5) );//-z
		this.positions.push( vec3(-.5,-.5,-.5), vec3(.5,-.5,-.5), vec3(.5,-.5,.5));//-y 
		this.positions.push( vec3(-.5,-.5,-.5), vec3(.5,-.5,.5), vec3(-.5,-.5,.5));//-y 
		this.positions.push( vec3(-.5,.5,-.5), vec3(.5,.5,.5), vec3(.5,.5,-.5));//+y 
		this.positions.push( vec3(-.5,.5,-.5), vec3(-.5,.5,.5), vec3(.5,.5,.5));//+y 
		this.positions.push( vec3(-.5,.5,.5), vec3(.5,-.5,.5), vec3(.5,.5,.5));//+z
		this.positions.push( vec3(-.5,.5,.5),vec3(-.5,-.5,.5), vec3(.5,-.5,.5) );//+z 	
		this.positions.push( vec3(-.5,-.5,-.5), vec3(-.5,.5,.5), vec3(-.5,.5,-.5));//-x 
		this.positions.push( vec3(-.5,-.5,-.5),vec3(-.5,-.5,.5), vec3(-.5,.5,.5) );//-x 	
		this.positions.push( vec3(.5,-.5,-.5), vec3(.5,.5,-.5), vec3(.5,.5,.5));//+x 
		this.positions.push( vec3(.5,-.5,-.5),vec3(.5,.5,.5), vec3(.5,-.5,.5) );//+x
	
        this.normals.push( vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1) ); 
		this.normals.push( vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1) );		
		this.normals.push( vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0) );
		this.normals.push( vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0) );
		this.normals.push( vec3(0,1,0), vec3(0,1,0), vec3(0,1,0) );
		this.normals.push( vec3(0,1,0), vec3(0,1,0), vec3(0,1,0) );
		this.normals.push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) ); 
		this.normals.push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) );
        this.normals.push( vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) );
		this.normals.push( vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) );
		this.normals.push( vec3(1,0,0), vec3(1,0,0), vec3(1,0,0) );
		this.normals.push( vec3(1,0,0), vec3(1,0,0), vec3(1,0,0) );

		//Texture Co-ords. Correspond 1:1 with the vertices and normals above
		this.texture_coords.push( vec2(s,0), vec2(0,0), vec2(0,s) );    
        this.texture_coords.push( vec2(s,0), vec2(0,s), vec2(s,s) ); 
		this.texture_coords.push( vec2(0,s), vec2(s,s), vec2(s,0) );    
        this.texture_coords.push( vec2(0,s), vec2(s,0), vec2(0,0) ); 
		this.texture_coords.push( vec2(0,s), vec2(s,0), vec2(s,s) );    
        this.texture_coords.push( vec2(0,s), vec2(0,0), vec2(s,0) ); 
		this.texture_coords.push( vec2(0,s), vec2(s,0), vec2(s,s) );    
        this.texture_coords.push( vec2(0,s), vec2(0,0), vec2(s,0) ); 
		this.texture_coords.push( vec2(0,s), vec2(s,0), vec2(s,s) );    
        this.texture_coords.push( vec2(0,s), vec2(0,0), vec2(s,0) ); 
		this.texture_coords.push( vec2(s,0), vec2(s,s), vec2(0,s) );    
        this.texture_coords.push( vec2(s,0), vec2(0,s), vec2(0,0) ); 

		//The following line is not using memory at all efficiently and should be used for its actual purpose correctly.
        this.indices.push( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35);     
        
      }
  }, Shape )