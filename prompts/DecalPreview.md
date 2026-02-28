Let's do another round of interview-driven design, like we have used for other projects. I will start with a brain-dump describing what I want out of this project, then you ask multiple rounds of clarifying questions. Maintain and update a specification as we talk, then once you are satisfied that all of the key questions have been answered, generate a markdown specification at src/components/Preview/SPECIFICATION.md

Brain Dump:

Make a new component to preview the decals. The decals are all projected onto a car model.

This will be a partial implementation that only shows arrows showing the direction and position of the decal projections. We won't actually project the images. We also won't have the car models these will be projected on.

* use webgl
* Use a 3d rectange as a placeholder for the car model
* all angles point toward the center of the car, but offset left/right up/down by the position.
* A car is about 500 units long

Yaw is the direction of the projection:
0 = directly from the back of the car to the front
90 = Directly from the left
180 = Driectly from the front

Pitch is the angle up/down
* 0 = flat (parallel with the ground)
* negative = from above pointing down
* positive = from below pointing up

For position:
* positive x is toward the right (relative to the direction), negative is toward the left
* positive y is up