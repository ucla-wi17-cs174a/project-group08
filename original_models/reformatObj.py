vertices = []
normals = []
textures = []
indices = []

with open('SkyBoxBlue.obj') as fp:
	for line in fp:
		if(line[0] == 'v'):
			if(line[1] == 'n'):
				normals.append(line)
			elif(line[1] == 't'):
				textures.append(line)
			else:
				vertices.append(line)
		elif(line[0] == 'f'):
			indices.append(line)
	
num_vertices = 1;
# read each indices and add to new.obj
f = open("new.obj", 'w')
for line in indices:
	split_line = line.split()
	temp = split_line[1]
	split_single = temp.split('/')
	f.write(vertices[int(split_single[0])-1])
	if(split_single[1] != ''):
		f.write(textures[int(split_single[1])-1])
	f.write(normals[int(split_single[2])-1])

	temp = split_line[2]
	split_single = temp.split('/')
	f.write(vertices[int(split_single[0])-1])
	if(split_single[1] != ''):
		f.write(textures[int(split_single[1])-1])
	f.write(normals[int(split_single[2])-1])

	temp = split_line[3]
	split_single = temp.split('/')
	f.write(vertices[int(split_single[0])-1])
	if(split_single[1] != ''):
		f.write(textures[int(split_single[1])-1])
	f.write(normals[int(split_single[2])-1])
	
	write_string = 'f ' + str(num_vertices) + '/' + str(num_vertices) + '/' + str(num_vertices) + ' ' +  str(num_vertices+1) + '/' + str(num_vertices+1) + '/' + str(num_vertices+1) + ' ' + str(num_vertices+2) + '/' + str(num_vertices+2) + '/' + str(num_vertices+2) + '\n'
	f.write(write_string) 
	num_vertices += 3
		
f.close()