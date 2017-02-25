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

