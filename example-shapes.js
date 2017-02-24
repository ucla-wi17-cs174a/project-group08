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
        function xzheight(x, z)
		{
			var y = -10 + 1*Math.sin(x) + 1*Math.sin(z);
			return y;
		}
		//var img = document.getElementById("heightmap_test.png");
		
		
		dims = [100, 100]
		
		for(var i = 0; i < dims[0]; i++)
			for(var j = 0; j < dims[1]; j++)
			{
				this.positions.push(vec3(i - dims[0]/2, xzheight(i,j), j - dims[1]/2));
				if(i != 0 && j != 0)
					this.indices.push((j-1 + (i-1)*dims[0]), (j + (i-1)*dims[0]), (j-1 + i*dims[0]), (j + (i-1)*dims[0]), (j-1 + i*dims[0]), (j + i*dims[0]));
					this.normals.push(vec3(0,1,0), vec3(0,1,0));
			}
        
      }
  }, Shape )
  
  
  