

Declare_Any_Class( "Terrain",
{ 'populate': function() 
    {
		//Paul Bourke's marching cubes algorithm, rewritten in javascript and adapted here to make us a surface
		/*
		   Linearly interpolate the position where an isosurface cuts
		   an edge between two vertices, each with their own scalar value
		*/
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
		
		/*
		   Given a grid cell and an isolevel, calculate the triangular
		   facets required to represent the isosurface through the cell.
		   Return the number of triangular facets, the array "triangles"
		   will be loaded up with the vertices at most 5 triangular facets.
			0 will be returned if the grid cell is either totally above
		   of totally below the isolevel.
		*/
				//Returns number of triangles made
			function march(grid_p, grid_val, shape_in, ntriang)
			{
				var isolevel = 0;	//We set this
				//var triangles;	//Shouldn't be needed because we have the shape setup?
				
				//var i;
				var ntriang;
				var cubeindex;
				var vertlist = [];

				var edgeTable = [
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
				var triTable =
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
				for (var i=0; triTable[cubeindex][i]!=-1; i+=3) {
				  //triangles[ntriang].p[0] = vertlist[triTable[cubeindex][i  ]];
				  //triangles[ntriang].p[1] = vertlist[triTable[cubeindex][i+1]];
				  //triangles[ntriang].p[2] = vertlist[triTable[cubeindex][i+2]];
				  
				  shape_in.positions.push(vertlist[triTable[cubeindex][i  ]], vertlist[triTable[cubeindex][i+1]], vertlist[triTable[cubeindex][i+2]]);
				  shape_in.indices.push(ntriang*3, ntriang*3+1, ntriang*3+2);
				  
				  shape_in.normals.push(vec3(0,1,0), vec3(0,1,0), vec3(0,1,0));	//TODO: Generate normals with the gradient of the density function  
				  
				  ntriang++;
				}

				return(ntriang);
			}	

		//Same Perlin noise as the heightmap
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
		
			//This commented function works by the way, just testing things
			//march([vec3(0,0,0), vec3(10,0,0), vec3(10,0,10), vec3(0,0,10), vec3(0,10,0), vec3(10,10,0), vec3(10,10,10), vec3(0,10,10),], [-0.2, 0.2, 0.1, 0.2, -0.2, -0.4, 0.1, 0.1], this)
			
			//Now that we defined the functions, draw the geometry:
			//First we make the density function:
		function density(coords)	//Positive corresponds to ground
		{
			var dens = coords[1]+5.5 + 13*Math.sin(0.2*coords[0]) - 10*Math.sin(0.2*coords[1]) - 0.2*Math.abs(coords[2]);
			return dens;
		}
		
		//Now we choose a volume to apply the marching cubes:
		var volume = [50, 50, 50];	//Right now, about 7 seconds per million cubes being checked
		//And the size of each cube
		var res = 1;
		
		//For each cube, pass in the coordinates and density values
		var coord0
		var coord1;
		var coord2;
		var coord3;
		var coord4;
		var coord5;
		var coord6;
		var coord7;
		var ntriang = 0;
		var new_ntriang;
		
		for(var i=0; i < volume[0]; i++)
			for(var j=0; j < volume[1]; j++)
				for(var k=0; k < volume[2]; k++)
				{
					coord0 = vec3(i*res-((volume[0]-1)*res/2),j*res-((volume[1]-1)*res/2),k*res-((volume[2]-1)*res/2));
					coord1 = vec3(i*res-((volume[0]-1)*res/2)+res,j*res-((volume[1]-1)*res/2),k*res-((volume[2]-1)*res/2));
					coord2 = vec3(i*res-((volume[0]-1)*res/2)+res,j*res-((volume[1]-1)*res/2),k*res-((volume[2]-1)*res/2)+res);
					coord3 = vec3(i*res-((volume[0]-1)*res/2),j*res-((volume[1]-1)*res/2),k*res-((volume[2]-1)*res/2)+res);
					coord4 = vec3(i*res-((volume[0]-1)*res/2),j*res-((volume[1]-1)*res/2)+res,k*res-((volume[2]-1)*res/2));
					coord5 = vec3(i*res-((volume[0]-1)*res/2)+res,j*res-((volume[1]-1)*res/2)+res,k*res-((volume[2]-1)*res/2));
					coord6 = vec3(i*res-((volume[0]-1)*res/2)+res,j*res-((volume[1]-1)*res/2)+res,k*res-((volume[2]-1)*res/2)+res);
					coord7 = vec3(i*res-((volume[0]-1)*res/2),j*res-((volume[1]-1)*res/2)+res,k*res-((volume[2]-1)*res/2)+res);
					new_ntriang = march([coord0, coord1, coord2, coord3, coord4, coord5, coord6, coord7],
						[density(coord0), density(coord1), density(coord2), density(coord3), 
						density(coord4), density(coord5), density(coord6), density(coord7)], this, ntriang);
					//if new_ntriang is the same as the old one, we didnt generate any geometry and we shouldn't try again
					ntriang = new_ntriang;
				}
		
		
			
	
	}
}, Shape )





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
  
  
  