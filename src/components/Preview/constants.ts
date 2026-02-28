// Car geometry (world units)
export const CAR_LENGTH = 500;
export const CAR_WIDTH = 140;
export const CAR_HEIGHT = 100;
export const CAR_GROUND_CLEARANCE = 30;

// Camera orbit target — Y is the height the camera rotates around.
// Geometric center is GROUND_CLEARANCE + HEIGHT/2 = 80.
// Lower values sit closer to a realistic center of mass.
export const CAMERA_TARGET_Y = 60;

// Arrow rendering
export const ARROW_LENGTH = 250;
export const ARROW_CONE_LENGTH = 20;
export const ARROW_CONE_RADIUS = 8;
export const ARROW_CONE_SEGMENTS = 8;

// Opacity
export const ARROW_OPACITY_ACTIVE = 1.0;
export const ARROW_OPACITY_DIMMED = 0.08;
export const CAR_BOX_OPACITY = 0.25;
export const CAR_WIREFRAME_OPACITY = 0.45;
